'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Radio, Smartphone, Monitor, Tablet, QrCode, Link2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

type ScanEvent = {
  id: string;
  short_code: string;
  device_type: string | null;
  event_type: string;
  created_at: string;
};

const DEVICE_ICONS: Record<string, typeof Smartphone> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

export function LiveScanFeed() {
  const [events, setEvents] = useState<ScanEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Load recent 5 events (QR + Link)
    supabase
      .from('redirect_events')
      .select('id, short_code, device_type, event_type, created_at')
      .in('event_type', ['qr_open', 'link_open'])
      .eq('is_bot', false)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setEvents(data);
      });

    // Subscribe to new events (QR + Link)
    const channel = supabase
      .channel('live-scans')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'redirect_events',
        },
        (payload) => {
          const newEvent = payload.new as ScanEvent;
          if (newEvent.event_type === 'qr_open' || newEvent.event_type === 'link_open') {
            setEvents((prev) => [newEvent, ...prev].slice(0, 8));
          }
        },
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-[13.5px] font-semibold tracking-tight">Live Scans</h3>
        <div className="flex items-center gap-1.5">
          {connected ? (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-[pulseDot_1.4s_ease-in-out_infinite] rounded-full bg-emerald-400/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
          )}
          <span className="text-[11px] text-muted-foreground">
            {connected ? 'Live' : 'Verbindet…'}
          </span>
        </div>
      </div>
      <div className="divide-y divide-border/60">
        {events.length > 0 ? (
          events.map((event, i) => {
            const DeviceIcon = DEVICE_ICONS[event.device_type || ''] || Radio;
            const isLink = event.event_type === 'link_open';
            const SourceIcon = isLink ? Link2 : QrCode;
            const isNewest = i === 0;
            return (
              <div
                key={event.id}
                className="relative flex items-center gap-3 px-4 py-2.5 animate-in fade-in slide-in-from-top-1 duration-300"
              >
                {isNewest && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-brand/[0.06] opacity-0 motion-safe:animate-[scanFlash_1.6s_ease-out_forwards]"
                  />
                )}
                <SourceIcon className="relative h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                <code className="relative text-[12px] font-mono font-medium">
                  {event.short_code}
                </code>
                <DeviceIcon className="relative h-3 w-3 shrink-0 text-muted-foreground/30" />
                <span className="relative ml-auto text-[11px] text-muted-foreground tabular-nums">
                  {formatDistanceToNow(new Date(event.created_at), {
                    addSuffix: true,
                    locale: de,
                  })}
                </span>
              </div>
            );
          })
        ) : (
          <p className="px-4 py-6 text-center text-[12px] text-muted-foreground">
            Noch keine Scans.
          </p>
        )}
      </div>
    </div>
  );
}

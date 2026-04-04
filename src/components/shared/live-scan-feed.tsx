'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Radio, Smartphone, Monitor, Tablet } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

type ScanEvent = {
  id: string;
  short_code: string;
  device_type: string | null;
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

    // Load recent 5 events
    supabase
      .from('redirect_events')
      .select('id, short_code, device_type, created_at')
      .eq('event_type', 'qr_open')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setEvents(data);
      });

    // Subscribe to new events
    const channel = supabase
      .channel('live-scans')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'redirect_events',
          filter: 'event_type=eq.qr_open',
        },
        (payload) => {
          const newEvent = payload.new as ScanEvent;
          setEvents((prev) => [newEvent, ...prev].slice(0, 8));
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
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-[13px] font-medium">Live Scans</h3>
        <div className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30'}`}
          />
          <span className="text-[11px] text-muted-foreground">
            {connected ? 'Live' : 'Verbinden...'}
          </span>
        </div>
      </div>
      <div className="divide-y divide-border/60">
        {events.length > 0 ? (
          events.map((event) => {
            const DeviceIcon = DEVICE_ICONS[event.device_type || ''] || Radio;
            return (
              <div
                key={event.id}
                className="flex items-center gap-3 px-4 py-2.5 animate-in fade-in slide-in-from-top-1 duration-300"
              >
                <DeviceIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                <code className="text-[12px] font-mono font-medium">
                  {event.short_code}
                </code>
                <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
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

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Radio, Smartphone, Monitor, Tablet, QrCode, Link2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

type RawScanEvent = {
  id: string;
  short_code: string;
  device_type: string | null;
  event_type: string;
  created_at: string;
};

type ScanEvent = RawScanEvent & {
  /** Anzeigename: QR-Note / Link-Titel, Fallback short_code */
  title: string;
  /** Deep-Link zur Detail-Seite, null falls Quelle nicht mehr existiert */
  href: string | null;
};

const DEVICE_ICONS: Record<string, typeof Smartphone> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

type Supabase = ReturnType<typeof createClient>;

/** Reichere Events mit Titel + href aus qr_codes / short_links an. */
async function enrichEvents(sb: Supabase, raw: RawScanEvent[]): Promise<ScanEvent[]> {
  if (raw.length === 0) return [];
  const qrCodes = raw.filter((e) => e.event_type === 'qr_open').map((e) => e.short_code);
  const linkCodes = raw.filter((e) => e.event_type === 'link_open').map((e) => e.short_code);

  const [qrRes, linkRes] = await Promise.all([
    qrCodes.length > 0
      ? sb.from('qr_codes').select('id, short_code, note').in('short_code', qrCodes)
      : Promise.resolve({ data: [] }),
    linkCodes.length > 0
      ? sb.from('short_links').select('id, short_code, title').in('short_code', linkCodes)
      : Promise.resolve({ data: [] }),
  ]);

  const qrMap = new Map(((qrRes.data ?? []) as { id: string; short_code: string; note: string | null }[]).map((q) => [q.short_code, q]));
  const linkMap = new Map(((linkRes.data ?? []) as { id: string; short_code: string; title: string | null }[]).map((l) => [l.short_code, l]));

  return raw.map((e) => {
    if (e.event_type === 'qr_open') {
      const q = qrMap.get(e.short_code);
      return {
        ...e,
        title: (q?.note?.trim() || e.short_code) as string,
        href: q ? `/qr-codes/${q.id}` : null,
      };
    }
    const l = linkMap.get(e.short_code);
    return {
      ...e,
      title: (l?.title?.trim() || e.short_code) as string,
      href: l ? `/links/${l.id}` : null,
    };
  });
}

export function LiveScanFeed() {
  const [events, setEvents] = useState<ScanEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Load recent 5 events (QR + Link) + enrich with titles/hrefs
    supabase
      .from('redirect_events')
      .select('id, short_code, device_type, event_type, created_at')
      .in('event_type', ['qr_open', 'link_open'])
      .eq('is_bot', false)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(async ({ data }) => {
        if (!data) return;
        const enriched = await enrichEvents(supabase, data as RawScanEvent[]);
        setEvents(enriched);
      });

    // Subscribe to new events (QR + Link) — enrich each one async
    const channel = supabase
      .channel('live-scans')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'redirect_events' },
        async (payload) => {
          const raw = payload.new as RawScanEvent;
          if (raw.event_type !== 'qr_open' && raw.event_type !== 'link_open') return;
          const [enriched] = await enrichEvents(supabase, [raw]);
          setEvents((prev) => [enriched, ...prev].slice(0, 8));
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
            const hasTitle = event.title !== event.short_code;

            const content = (
              <>
                {isNewest && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-brand/[0.06] opacity-0 motion-safe:animate-[scanFlash_1.6s_ease-out_forwards]"
                  />
                )}
                <SourceIcon className="relative h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                <div className="relative flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[12.5px] font-medium leading-tight">{event.title}</span>
                  {hasTitle && (
                    <code className="truncate text-[10.5px] font-mono text-muted-foreground/70 leading-tight">
                      {event.short_code}
                    </code>
                  )}
                </div>
                <DeviceIcon className="relative h-3 w-3 shrink-0 text-muted-foreground/30" />
                <span className="relative shrink-0 text-[11px] text-muted-foreground tabular-nums">
                  {formatDistanceToNow(new Date(event.created_at), {
                    addSuffix: true,
                    locale: de,
                  })}
                </span>
              </>
            );

            const cls =
              'relative flex items-center gap-3 px-4 py-2.5 animate-in fade-in slide-in-from-top-1 duration-300';

            return event.href ? (
              <Link
                key={event.id}
                href={event.href}
                className={`${cls} transition-colors hover:bg-muted/40`}
              >
                {content}
              </Link>
            ) : (
              <div key={event.id} className={cls}>
                {content}
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

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Radio, Smartphone, Monitor, Tablet, Link2, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { QrPreview } from '@/components/shared/qr-preview';

type RawScanEvent = {
  id: string;
  short_code: string;
  device_type: string | null;
  event_type: string;
  created_at: string;
};

type ScanEvent = RawScanEvent & {
  /** Anzeigename — Priority: Placement-Name > Note/Title > Short-Code-Fallback */
  title: string;
  /** True wenn `title` ein semantisches Label ist (kein blosser short_code) */
  hasSemanticTitle: boolean;
  /** Deep-Link zur Detail-Seite, null falls Quelle nicht mehr existiert */
  href: string | null;
};

const DEVICE_ICONS: Record<string, typeof Smartphone> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

type Supabase = ReturnType<typeof createClient>;
type Source = 'qr' | 'link' | 'all';

/** Reichere Events mit Titel + href aus qr_codes (join placements) / short_links an. */
async function enrichEvents(sb: Supabase, raw: RawScanEvent[]): Promise<ScanEvent[]> {
  if (raw.length === 0) return [];
  const qrCodes = raw.filter((e) => e.event_type === 'qr_open').map((e) => e.short_code);
  const linkCodes = raw.filter((e) => e.event_type === 'link_open').map((e) => e.short_code);

  const [qrRes, linkRes] = await Promise.all([
    qrCodes.length > 0
      ? sb
          .from('qr_codes')
          .select('id, short_code, note, placement:placements(name)')
          .in('short_code', qrCodes)
      : Promise.resolve({ data: [] }),
    linkCodes.length > 0
      ? sb.from('short_links').select('id, short_code, title').in('short_code', linkCodes)
      : Promise.resolve({ data: [] }),
  ]);

  // Supabase typed join: placement kann je nach Inferenz als Objekt oder
  // 1-Element-Array kommen. Wir behandeln beides toleranter via unknown-Cast.
  type QrRow = {
    id: string;
    short_code: string;
    note: string | null;
    placement: { name: string } | { name: string }[] | null;
  };
  type LinkRow = { id: string; short_code: string; title: string | null };
  const qrMap = new Map(((qrRes.data ?? []) as unknown as QrRow[]).map((q) => [q.short_code, q]));
  const linkMap = new Map(((linkRes.data ?? []) as LinkRow[]).map((l) => [l.short_code, l]));

  return raw.map((e) => {
    if (e.event_type === 'qr_open') {
      const q = qrMap.get(e.short_code);
      // Priority: Placement-Name > Note > Fallback "QR-Code".
      // Es soll IMMER ein semantischer Titel sichtbar sein, kein nackter short_code.
      const placementNode = q?.placement;
      const placementName = Array.isArray(placementNode)
        ? placementNode[0]?.name
        : placementNode?.name;
      const placement = placementName?.trim();
      const note = q?.note?.trim();
      const title = placement || note || 'QR-Code';
      return {
        ...e,
        title,
        hasSemanticTitle: Boolean(placement || note),
        href: q ? `/qr-codes/${q.id}` : null,
      };
    }
    const l = linkMap.get(e.short_code);
    const linkTitle = l?.title?.trim();
    return {
      ...e,
      title: linkTitle || 'Kurzlink',
      hasSemanticTitle: Boolean(linkTitle),
      href: l ? `/links/${l.id}` : null,
    };
  });
}

type Props = {
  /** Welche Events zeigen? Default: 'all'. */
  source?: Source;
  /** Titel des Feeds (Default abhaengig von source). */
  title?: string;
  /** Ziel des "Mehr anzeigen"-Links. Default: /analytics mit passendem Filter. */
  moreHref?: string;
  /** Max. angezeigte Events. Default 5. */
  limit?: number;
};

export function LiveScanFeed({
  source = 'all',
  title,
  moreHref,
  limit = 5,
}: Props = {}) {
  const [events, setEvents] = useState<ScanEvent[]>([]);
  const [connected, setConnected] = useState(false);

  // Event-Typen, die wir abonnieren / abfragen
  const eventTypes =
    source === 'qr' ? ['qr_open'] : source === 'link' ? ['link_open'] : ['qr_open', 'link_open'];

  useEffect(() => {
    const supabase = createClient();

    // Initiales Loaden
    supabase
      .from('redirect_events')
      .select('id, short_code, device_type, event_type, created_at')
      .in('event_type', eventTypes)
      .eq('is_bot', false)
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(async ({ data }) => {
        if (!data) return;
        const enriched = await enrichEvents(supabase, data as RawScanEvent[]);
        setEvents(enriched);
      });

    // Realtime-Subscription — Page darf nicht crashen wenn Modul nicht initialisiert ist.
    const channelName = `live-feed-${source}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      const built = supabase
        .channel(channelName)
        ?.on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'redirect_events' },
          async (payload) => {
            const raw = payload.new as RawScanEvent;
            // Filter auf den fuer dieses Feed konfigurierten Typ
            if (!eventTypes.includes(raw.event_type)) return;
            const [enriched] = await enrichEvents(supabase, [raw]);
            setEvents((prev) => [enriched, ...prev].slice(0, Math.max(limit, 8)));
          },
        );
      if (built && typeof built.subscribe === 'function') {
        channel = built.subscribe((status) => {
          setConnected(status === 'SUBSCRIBED');
        });
      }
    } catch (err) {
      console.error('[live-scan-feed] realtime subscribe failed:', err);
    }

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
    // eventTypes/source/limit aendern sich pro Mount nicht — Disable rule wuerde
    // den Lint nur stillschalten. Stattdessen: list nur source/limit als Dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, limit]);

  // Defaults fuer Titel + Mehr-Link je nach Source
  const resolvedTitle = title ?? (source === 'link' ? 'Live Klicks' : source === 'qr' ? 'Live Scans' : 'Live Aktivität');
  const resolvedMoreHref =
    moreHref ??
    (source === 'link'
      ? '/analytics?source=link'
      : source === 'qr'
        ? '/analytics?source=qr'
        : '/analytics');
  const emptyLabel = source === 'link' ? 'Noch keine Klicks.' : source === 'qr' ? 'Noch keine Scans.' : 'Noch keine Aktivität.';

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 className="text-[13.5px] font-semibold tracking-tight">{resolvedTitle}</h3>
        <div className="flex items-center gap-3">
          {/* "Mehr anzeigen" — fuehrt zum Analytics-Verlauf mit passendem Filter */}
          <Link
            href={resolvedMoreHref}
            className="inline-flex items-center gap-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Mehr anzeigen
            <ArrowRight className="h-3 w-3" />
          </Link>
          <span className="flex items-center gap-1.5">
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
          </span>
        </div>
      </div>
      <div className="divide-y divide-border/60">
        {events.length > 0 ? (
          events.map((event, i) => {
            const DeviceIcon = DEVICE_ICONS[event.device_type || ''] || Radio;
            const isLink = event.event_type === 'link_open';
            const isNewest = i === 0;

            const content = (
              <>
                {isNewest && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-brand/[0.06] opacity-0 motion-safe:animate-[scanFlash_1.6s_ease-out_forwards]"
                  />
                )}
                {/* QR-Events: echte Mini-QR-Vorschau (Pattern unterscheidet Codes visuell).
                    Link-Events: Link-Icon (kein QR vorhanden, der gerendert werden koennte). */}
                {isLink ? (
                  <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40">
                    <Link2 className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
                  </span>
                ) : (
                  <span className="relative">
                    <QrPreview shortCode={event.short_code} size={28} />
                  </span>
                )}
                <div className="relative flex min-w-0 flex-1 flex-col">
                  {/* Titel IMMER sichtbar — entweder Placement-Name/Note,
                      oder Fallback ("QR-Code" / "Kurzlink"). Damit der User auch
                      bei Codes ohne Note sieht, was das fuer eine Quelle war. */}
                  <span className="truncate text-[12.5px] font-medium leading-tight">
                    {event.title}
                  </span>
                  <code className="truncate text-[10.5px] font-mono text-muted-foreground/70 leading-tight">
                    {event.short_code}
                  </code>
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
            {emptyLabel}
          </p>
        )}
      </div>
    </div>
  );
}

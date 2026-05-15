'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Radio, Smartphone, Monitor, Tablet, Link2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { QrPreview } from '@/components/shared/qr-preview';

const DEVICE_ICONS: Record<string, typeof Smartphone> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

const RANGES = [
  { key: '7d', label: '7 Tage', days: 7 },
  { key: '14d', label: '14 Tage', days: 14 },
  { key: '30d', label: '30 Tage', days: 30 },
  { key: '1y', label: '1 Jahr', days: 365 },
  { key: 'all', label: 'Alle', days: null },
] as const;
type RangeKey = (typeof RANGES)[number]['key'];

type Supabase = ReturnType<typeof createClient>;

type RawEvent = {
  id: string;
  short_code: string;
  device_type: string | null;
  event_type: string;
  created_at: string;
};

type ActivityEvent = RawEvent & {
  title: string;
  href: string | null;
};

/** Identische Titel-Resolution wie im LiveScanFeed:
 *  Placement-Name > Note/Title > Fallback. Verhindert, dass nur nackte short_codes
 *  zu sehen sind. */
async function enrichEvents(sb: Supabase, raw: RawEvent[]): Promise<ActivityEvent[]> {
  if (raw.length === 0) return [];
  const qrCodes = raw.filter((e) => e.event_type === 'qr_open').map((e) => e.short_code);
  const linkCodes = raw.filter((e) => e.event_type === 'link_open').map((e) => e.short_code);

  const [qrRes, linkRes] = await Promise.all([
    qrCodes.length > 0
      ? sb.from('qr_codes').select('id, short_code, note, placement:placements(name)').in('short_code', qrCodes)
      : Promise.resolve({ data: [] }),
    linkCodes.length > 0
      ? sb.from('short_links').select('id, short_code, title').in('short_code', linkCodes)
      : Promise.resolve({ data: [] }),
  ]);

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
      const placementNode = q?.placement;
      const placementName = Array.isArray(placementNode) ? placementNode[0]?.name : placementNode?.name;
      const title = placementName?.trim() || q?.note?.trim() || 'QR-Code';
      return { ...e, title, href: q ? `/qr-codes/${q.id}` : null };
    }
    const l = linkMap.get(e.short_code);
    return {
      ...e,
      title: l?.title?.trim() || 'Kurzlink',
      href: l ? `/links/${l.id}` : null,
    };
  });
}

type Source = 'qr' | 'link' | 'all';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: Source;
};

/**
 * Side-Sheet, der den vollen Event-Verlauf einer Quelle (Scans oder Klicks)
 * scrollbar zeigt. Zeitbereich konfigurierbar via Tabs (7T / 14T / 30T / 1J / Alle).
 *
 * Trennt sich bewusst von /analytics: die User-Intention beim Klick auf
 * "Mehr anzeigen" im Live-Feed ist "ich will den vollen Strom an Events sehen",
 * nicht "ich will Statistiken/Charts". Daher hier: pure Liste, kein Chart.
 */
export function ActivityHistorySheet({ open, onOpenChange, source }: Props) {
  const [range, setRange] = useState<RangeKey>('7d');
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const eventTypes =
    source === 'qr' ? ['qr_open'] : source === 'link' ? ['link_open'] : ['qr_open', 'link_open'];

  // Fetch Events bei Open oder Range-Wechsel
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);

    const supabase = createClient();
    const selectedRange = RANGES.find((r) => r.key === range);
    const fromIso = selectedRange?.days
      ? new Date(Date.now() - selectedRange.days * 86_400_000).toISOString()
      : null;

    let q = supabase
      .from('redirect_events')
      .select('id, short_code, device_type, event_type, created_at')
      .in('event_type', eventTypes)
      .eq('is_bot', false)
      .order('created_at', { ascending: false })
      .limit(500);

    if (fromIso) q = q.gte('created_at', fromIso);

    q.then(async ({ data }) => {
      if (cancelled) return;
      const enriched = await enrichEvents(supabase, (data ?? []) as RawEvent[]);
      if (cancelled) return;
      setEvents(enriched);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // source und damit eventTypes sind ueber Lebensdauer dieser Komponente stabil
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, range, source]);

  const sheetTitle = source === 'link' ? 'Live Klicks · Verlauf' : source === 'qr' ? 'Live Scans · Verlauf' : 'Aktivität · Verlauf';
  const emptyLabel =
    source === 'link'
      ? 'Keine Klicks in diesem Zeitraum.'
      : source === 'qr'
        ? 'Keine Scans in diesem Zeitraum.'
        : 'Keine Aktivität in diesem Zeitraum.';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl">
        <SheetHeader className="border-b border-border pb-3">
          <SheetTitle>{sheetTitle}</SheetTitle>
          <SheetDescription>
            {events.length > 0
              ? `${events.length.toLocaleString('de-DE')} Eintrag${events.length === 1 ? '' : 'e'} im ausgewählten Zeitraum`
              : 'Wähle einen Zeitraum, um den Verlauf zu sehen'}
          </SheetDescription>
          {/* Zeitraum-Tabs */}
          <div className="mt-2 flex flex-wrap gap-1">
            {RANGES.map((r) => {
              const active = range === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRange(r.key)}
                  className={
                    'rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors ' +
                    (active
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border bg-card text-muted-foreground hover:border-brand/30 hover:bg-muted/40 hover:text-foreground')
                  }
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </SheetHeader>

        {/* Scrollbarer Event-Body */}
        <div className="flex-1 overflow-y-auto px-1 pb-4">
          {loading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <p className="px-4 py-10 text-center text-[12.5px] text-muted-foreground">
              {emptyLabel}
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {events.map((event) => {
                const DeviceIcon = DEVICE_ICONS[event.device_type || ''] || Radio;
                const isLink = event.event_type === 'link_open';

                const content = (
                  <>
                    {isLink ? (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40">
                        <Link2 className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
                      </span>
                    ) : (
                      <QrPreview shortCode={event.short_code} size={28} />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-medium leading-tight">
                        {event.title}
                      </div>
                      <code className="block truncate text-[10.5px] font-mono text-muted-foreground/70 leading-tight">
                        {event.short_code}
                      </code>
                    </div>
                    <DeviceIcon className="h-3 w-3 shrink-0 text-muted-foreground/30" />
                    <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: de })}
                    </span>
                  </>
                );

                const cls = 'flex items-center gap-3 px-4 py-2.5';
                return (
                  <li key={event.id}>
                    {event.href ? (
                      <Link
                        href={event.href}
                        onClick={() => onOpenChange(false)}
                        className={`${cls} transition-colors hover:bg-muted/40`}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className={cls}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

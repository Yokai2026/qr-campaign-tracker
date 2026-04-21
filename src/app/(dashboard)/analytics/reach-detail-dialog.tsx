'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { QrCode as QrCodeIcon, Link2, Users, TrendingUp, ArrowRight } from 'lucide-react';

export type DrillDownScope = 'all' | 'qr' | 'link' | 'unique';

type Props = {
  scope: DrillDownScope | null;
  dateFrom: string;
  dateTo: string;
  campaignId: string;
  district: string;
  onClose: () => void;
};

type QrRow = { kind: 'qr'; id: string; shortCode: string; label: string; count: number };
type LinkRow = { kind: 'link'; id: string; shortCode: string; label: string; count: number };
type UniqueRow = { kind: 'unique'; ipHash: string; count: number; viaQr: number; viaLink: number };
type Row = QrRow | LinkRow | UniqueRow;

const SCOPE_META: Record<DrillDownScope, { title: string; description: string; Icon: typeof QrCodeIcon }> = {
  all: {
    title: 'Aufrufe gesamt',
    description: 'Alle QR-Scans und Kurzlink-Klicks im gewählten Zeitraum',
    Icon: TrendingUp,
  },
  qr: {
    title: 'QR-Scans',
    description: 'Wie oft jeder QR-Code gescannt wurde',
    Icon: QrCodeIcon,
  },
  link: {
    title: 'Link-Klicks',
    description: 'Wie oft jeder Kurzlink geklickt wurde',
    Icon: Link2,
  },
  unique: {
    title: 'Eindeutige Besucher',
    description: 'Anonymisierte Besucher (IP-Hash) — ob QR, Link oder beides',
    Icon: Users,
  },
};

export function ReachDetailDialog({ scope, dateFrom, dateTo, campaignId, district, onClose }: Props) {
  const open = scope !== null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        {scope && (
          <DrillDownBody
            scope={scope}
            dateFrom={dateFrom}
            dateTo={dateTo}
            campaignId={campaignId}
            district={district}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DrillDownBody({
  scope, dateFrom, dateTo, campaignId, district,
}: {
  scope: DrillDownScope;
  dateFrom: string;
  dateTo: string;
  campaignId: string;
  district: string;
}) {
  const supabase = createClient();
  const meta = SCOPE_META[scope];
  const { Icon } = meta;

  const { data, isLoading } = useQuery<Row[]>({
    queryKey: ['reach-drilldown', scope, dateFrom, dateTo, campaignId, district],
    queryFn: async () => {
      const from = `${dateFrom}T00:00:00`;
      const to = `${dateTo}T23:59:59`;
      const eventTypes = scope === 'qr' ? ['qr_open'] : scope === 'link' ? ['link_open'] : ['qr_open', 'link_open'];

      let q = supabase
        .from('redirect_events')
        .select('qr_code_id, short_link_id, ip_hash, event_type, placements(location:locations(district))')
        .in('event_type', eventTypes)
        .eq('is_bot', false)
        .gte('created_at', from)
        .lte('created_at', to);
      if (campaignId !== 'all') q = q.eq('campaign_id', campaignId);
      const { data: events } = await q;

      let filtered = events || [];
      if (district !== 'all') {
        filtered = filtered.filter((e: Record<string, unknown>) => {
          const p = e.placements as { location: { district: string | null } | null } | null;
          return p?.location?.district === district;
        });
      }

      if (scope === 'unique') {
        const byIp: Record<string, { count: number; viaQr: number; viaLink: number }> = {};
        filtered.forEach((e: { ip_hash: string | null; event_type: string }) => {
          if (!e.ip_hash) return;
          const b = byIp[e.ip_hash] ?? { count: 0, viaQr: 0, viaLink: 0 };
          b.count++;
          if (e.event_type === 'qr_open') b.viaQr++;
          else b.viaLink++;
          byIp[e.ip_hash] = b;
        });
        return Object.entries(byIp)
          .map(([ipHash, v]) => ({ kind: 'unique' as const, ipHash, ...v }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 50);
      }

      // Für QR + Link + All: nach FK gruppieren, dann Namen lookup
      const qrCounts: Record<string, number> = {};
      const linkCounts: Record<string, number> = {};
      filtered.forEach((e: { qr_code_id: string | null; short_link_id: string | null; event_type: string }) => {
        if (e.event_type === 'qr_open' && e.qr_code_id) {
          qrCounts[e.qr_code_id] = (qrCounts[e.qr_code_id] ?? 0) + 1;
        }
        if (e.event_type === 'link_open' && e.short_link_id) {
          linkCounts[e.short_link_id] = (linkCounts[e.short_link_id] ?? 0) + 1;
        }
      });

      const qrIds = Object.keys(qrCounts);
      const linkIds = Object.keys(linkCounts);
      const [{ data: qrs }, { data: links }] = await Promise.all([
        qrIds.length
          ? supabase.from('qr_codes').select('id, short_code, note').in('id', qrIds)
          : Promise.resolve({ data: [] }),
        linkIds.length
          ? supabase.from('short_links').select('id, short_code, title').in('id', linkIds)
          : Promise.resolve({ data: [] }),
      ]);

      const qrRows: QrRow[] = ((qrs ?? []) as { id: string; short_code: string; note: string | null }[]).map((q) => ({
        kind: 'qr',
        id: q.id,
        shortCode: q.short_code,
        label: (q.note?.trim() || q.short_code),
        count: qrCounts[q.id] ?? 0,
      }));
      const linkRows: LinkRow[] = ((links ?? []) as { id: string; short_code: string; title: string | null }[]).map((l) => ({
        kind: 'link',
        id: l.id,
        shortCode: l.short_code,
        label: (l.title?.trim() || l.short_code),
        count: linkCounts[l.id] ?? 0,
      }));

      const rows: Row[] = scope === 'qr' ? qrRows : scope === 'link' ? linkRows : [...qrRows, ...linkRows];
      return rows.sort((a, b) => ('count' in b ? b.count : 0) - ('count' in a ? a.count : 0));
    },
    enabled: true,
  });

  const rows = data ?? [];
  const totalCount = rows.reduce((sum, r) => sum + ('count' in r ? r.count : 0), 0);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-brand" />
          {meta.title}
          {!isLoading && (
            <span className="tabular-nums ml-auto text-[14px] font-normal text-muted-foreground">
              {totalCount.toLocaleString('de-DE')} gesamt
            </span>
          )}
        </DialogTitle>
        <DialogDescription>{meta.description}</DialogDescription>
      </DialogHeader>

      <div className="mt-2 max-h-[60vh] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-muted-foreground">
            Keine Daten im gewählten Zeitraum.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {rows.map((r, i) => {
              if (r.kind === 'unique') {
                return (
                  <li key={r.ipHash} className="flex items-center gap-3 py-2.5 px-1">
                    <span className="tabular-nums flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[11px] font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <code className="text-[12.5px] font-mono text-muted-foreground/90">
                        {r.ipHash.slice(0, 10)}…
                      </code>
                      <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-muted-foreground">
                        {r.viaQr > 0 && <span>{r.viaQr} QR-Scans</span>}
                        {r.viaQr > 0 && r.viaLink > 0 && <span>·</span>}
                        {r.viaLink > 0 && <span>{r.viaLink} Link-Klicks</span>}
                      </div>
                    </div>
                    <span className="tabular-nums text-[14px] font-semibold">{r.count}</span>
                  </li>
                );
              }
              const href = r.kind === 'qr' ? `/qr-codes/${r.id}` : `/links/${r.id}`;
              const RowIcon = r.kind === 'qr' ? QrCodeIcon : Link2;
              return (
                <li key={`${r.kind}-${r.id}`}>
                  <Link href={href} className="group flex items-center gap-3 py-2.5 px-1 transition-colors hover:bg-muted/40 rounded-md">
                    <span className="tabular-nums flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[11px] font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    <RowIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium group-hover:text-brand transition-colors">
                        {r.label}
                      </div>
                      <code className="text-[11px] font-mono text-muted-foreground/80">
                        /r/{r.shortCode}
                      </code>
                    </div>
                    <span className="tabular-nums text-[14px] font-semibold">{r.count.toLocaleString('de-DE')}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-brand transition-colors" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

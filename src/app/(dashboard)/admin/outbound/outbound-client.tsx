'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Mail,
  Send,
  CheckCheck,
  Eye,
  MousePointerClick,
  MessageSquareReply,
  AlertTriangle,
  ArrowLeft,
  Search,
  RefreshCcw,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type Totals = {
  leads: number;
  withEmail: number;
  queuedToSend: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  complained: number;
};

type Rates = {
  deliveredPct: number;
  openPct: number;
  clickPct: number;
  replyPct: number;
  bouncePct: number;
};

type Stats = {
  totals: Totals;
  rates: Rates;
  segments: Record<string, number>;
  byStatus: Record<string, number>;
  daily: Array<{ date: string; sent: number; opened: number; clicked: number; replied: number }>;
};

type Lead = {
  id: string;
  name: string;
  email: string | null;
  segment: string;
  city: string | null;
  status: string;
  email_status: string;
  contacted_at: string | null;
  replied_at: string | null;
  scraped_at: string;
};

type LeadsResponse = {
  leads: Lead[];
  total: number;
  limit: number;
  offset: number;
};

const SEGMENT_LABELS: Record<string, string> = {
  marketing_agency: 'Marketing-Agentur',
  gastronomy: 'Gastronomie',
  crafts_sme: 'Handwerk & KMU',
  events_tourism: 'Events & Tourismus',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Neu',
  queued: 'Queue',
  contacted: 'Angeschrieben',
  replied: 'Geantwortet',
  bounced: 'Bounced',
  uninterested: 'Kein Interesse',
  converted: 'Konvertiert',
  do_not_contact: 'Do Not Contact',
};

export function OutboundClient() {
  const [segmentFilter, setSegmentFilter] = useState<string>('');
  // Multi-Status: Set fuer schnelle has/add/remove. Leer = "Alle Status".
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  // Debounced search — vermeidet API-Spam waehrend Tippen
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [hasEmailFilter, setHasEmailFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [pageSize, setPageSize] = useState<number>(25);
  const [offset, setOffset] = useState<number>(0);
  const [compact, setCompact] = useState<boolean>(false);
  const [hoveredDay, setHoveredDay] = useState<{ date: string; sent: number; opened: number; clicked: number; replied: number } | null>(null);

  // 300 ms Debounce — die meisten Tipper haben kleine Pause beim Tippen
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setOffset(0); // Bei neuer Suche immer auf Seite 1
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Bei Filter-Wechsel: zurueck auf Seite 1
  useEffect(() => {
    setOffset(0);
  }, [segmentFilter, statusFilters, hasEmailFilter, pageSize]);

  const { data: stats, refetch: refetchStats } = useQuery<Stats>({
    queryKey: ['outbound-stats'],
    queryFn: async () => {
      const r = await fetch('/api/admin/outbound/stats');
      if (!r.ok) throw new Error('Stats failed');
      return r.json();
    },
    refetchInterval: 15_000,
  });

  const statusFilterKey = Array.from(statusFilters).sort().join(',');
  const { data: leadsData, refetch: refetchLeads, isFetching: leadsLoading } = useQuery<LeadsResponse>({
    queryKey: ['outbound-leads', segmentFilter, statusFilterKey, hasEmailFilter, pageSize, offset, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String(offset) });
      if (segmentFilter) params.set('segment', segmentFilter);
      if (statusFilters.size > 0) params.set('status', Array.from(statusFilters).join(','));
      if (hasEmailFilter === 'yes') params.set('hasEmail', 'true');
      if (hasEmailFilter === 'no') params.set('hasEmail', 'false');
      if (debouncedSearch) params.set('q', debouncedSearch);
      const r = await fetch('/api/admin/outbound/leads?' + params);
      if (!r.ok) throw new Error('Leads failed');
      return r.json();
    },
    refetchInterval: 15_000,
  });

  const refreshAll = () => {
    refetchStats();
    refetchLeads();
  };

  function toggleStatus(s: string) {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function resetAllFilters() {
    setSegmentFilter('');
    setStatusFilters(new Set());
    setHasEmailFilter('all');
    setSearch('');
    setOffset(0);
  }

  const hasActiveFilters =
    Boolean(segmentFilter) ||
    statusFilters.size > 0 ||
    hasEmailFilter !== 'all' ||
    Boolean(debouncedSearch);

  const t = stats?.totals;
  const r = stats?.rates;
  const leads = leadsData?.leads ?? [];
  const total = leadsData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.floor(offset / pageSize) + 1;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Admin
          </Link>
          <h1 className="text-2xl font-semibold">Outbound-Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cold-Mail-Funnel · Open + Click + Reply Tracking via Resend Webhook
          </p>
        </div>
        <button
          onClick={refreshAll}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted/50"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Funnel-Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Mail} label="Total Leads" value={t?.leads ?? '—'} sub={`${t?.withEmail ?? 0} mit Email`} />
        <StatCard icon={Send} label="Versendet" value={t?.sent ?? '—'} sub={`${r?.deliveredPct ?? 0}% delivered`} />
        <StatCard icon={CheckCheck} label="Zugestellt" value={t?.delivered ?? '—'} />
        <StatCard icon={Eye} label="Geöffnet" value={t?.opened ?? '—'} sub={`${r?.openPct ?? 0}% Open-Rate`} accent="emerald" />
        <StatCard icon={MousePointerClick} label="Geklickt" value={t?.clicked ?? '—'} sub={`${r?.clickPct ?? 0}% CTR`} accent="purple" />
        <StatCard icon={MessageSquareReply} label="Geantwortet" value={t?.replied ?? '—'} sub={`${r?.replyPct ?? 0}% Reply-Rate`} accent="emerald" />
      </div>

      {/* Bounce + Complaint Warning */}
      {(t?.bounced ?? 0) + (t?.complained ?? 0) > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>{t?.bounced ?? 0} Bounces</strong> + <strong>{t?.complained ?? 0} Spam-Beschwerden</strong>.
            {' '}Bei &gt;2 % Bounce-Rate: Domain-Reputation prüfen.
          </div>
        </div>
      )}

      {/* Funnel Bar */}
      <FunnelBar totals={t} />

      {/* Daily Chart */}
      {stats?.daily && stats.daily.length > 0 && (
        <DailyChart daily={stats.daily} hovered={hoveredDay} setHovered={setHoveredDay} />
      )}

      {/* Segment-Verteilung */}
      <div className="grid md:grid-cols-2 gap-6">
        <SegmentBreakdown segments={stats?.segments ?? {}} />
        <StatusBreakdown byStatus={stats?.byStatus ?? {}} />
      </div>

      {/* Filters + Leads Table */}
      <div className="space-y-3">
        {/* Hauptzeile: Search + Segment + Email-Filter + Listen-Optionen */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, Email oder Stadt suchen…"
              className="w-full pl-8 pr-8 py-1.5 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Suche loeschen"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-card border border-border rounded-lg"
          >
            <option value="">Alle Segmente</option>
            {Object.entries(SEGMENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={hasEmailFilter}
            onChange={(e) => setHasEmailFilter(e.target.value as 'all' | 'yes' | 'no')}
            className="px-3 py-1.5 text-sm bg-card border border-border rounded-lg"
            title="Nur Leads mit/ohne Email-Adresse"
          >
            <option value="all">Email: Alle</option>
            <option value="yes">Nur mit Email</option>
            <option value="no">Nur ohne Email</option>
          </select>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 text-sm bg-card border border-border rounded-lg"
            title="Anzahl Leads pro Seite"
          >
            <option value="10">10 / Seite</option>
            <option value="25">25 / Seite</option>
            <option value="50">50 / Seite</option>
            <option value="100">100 / Seite</option>
            <option value="200">200 / Seite</option>
          </select>
          <button
            type="button"
            onClick={() => setCompact((v) => !v)}
            className={`px-3 py-1.5 text-sm bg-card border border-border rounded-lg hover:bg-muted/40 ${compact ? 'ring-1 ring-primary/40 text-primary' : ''}`}
            title="Compact-Modus: weniger Spalten anzeigen"
          >
            {compact ? '◫ Detailliert' : '⊟ Kompakt'}
          </button>
        </div>

        {/* Status-Multi-Select als Pills — Mehrfachauswahl */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground mr-1">Status:</span>
          {Object.entries(STATUS_LABELS).map(([k, v]) => {
            const active = statusFilters.has(k);
            return (
              <button
                key={k}
                type="button"
                onClick={() => toggleStatus(k)}
                className={
                  'rounded-full border px-2.5 py-0.5 text-[12px] font-medium transition-colors ' +
                  (active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground')
                }
              >
                {v}
              </button>
            );
          })}
        </div>

        {/* Aktive-Filter-Anzeige mit Reset */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-muted/20 px-3 py-2">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Aktive Filter:</span>
            {debouncedSearch && (
              <FilterChip label={`Suche: "${debouncedSearch}"`} onRemove={() => setSearch('')} />
            )}
            {segmentFilter && (
              <FilterChip
                label={`Segment: ${SEGMENT_LABELS[segmentFilter] ?? segmentFilter}`}
                onRemove={() => setSegmentFilter('')}
              />
            )}
            {Array.from(statusFilters).map((s) => (
              <FilterChip
                key={s}
                label={`Status: ${STATUS_LABELS[s] ?? s}`}
                onRemove={() => toggleStatus(s)}
              />
            ))}
            {hasEmailFilter !== 'all' && (
              <FilterChip
                label={hasEmailFilter === 'yes' ? 'Nur mit Email' : 'Nur ohne Email'}
                onRemove={() => setHasEmailFilter('all')}
              />
            )}
            <button
              type="button"
              onClick={resetAllFilters}
              className="ml-auto text-[11.5px] font-medium text-muted-foreground hover:text-foreground"
            >
              Alle zurücksetzen
            </button>
          </div>
        )}

        <LeadsTable
          leads={leads}
          total={total}
          compact={compact}
          loading={leadsLoading}
          hasFilters={hasActiveFilters}
          onReset={resetAllFilters}
        />

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <div className="text-muted-foreground tabular-nums text-[12px]">
              Zeige <span className="font-semibold text-foreground">{offset + 1}</span>–
              <span className="font-semibold text-foreground">{Math.min(offset + pageSize, total)}</span>
              {' '}von <span className="font-semibold text-foreground">{total}</span> Leads
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setOffset(Math.max(0, offset - pageSize))}
                disabled={offset === 0}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-[12px] font-medium hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Zurück
              </button>
              <span className="px-2 text-[12px] tabular-nums text-muted-foreground">
                Seite <span className="font-semibold text-foreground">{currentPage}</span> / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setOffset(offset + pageSize)}
                disabled={offset + pageSize >= total}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-[12px] font-medium hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Weiter
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11.5px] font-medium text-primary">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="-mr-0.5 rounded-full p-0.5 hover:bg-primary/20"
        aria-label={`${label} entfernen`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub?: string;
  accent?: 'emerald' | 'purple';
}) {
  const accentClass =
    accent === 'emerald'
      ? 'text-emerald-500'
      : accent === 'purple'
        ? 'text-purple-500'
        : 'text-foreground';
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-2">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className={`text-2xl font-semibold tabular-nums ${accentClass}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function FunnelBar({ totals }: { totals: Totals | undefined }) {
  if (!totals || totals.sent === 0) return null;
  const max = totals.sent;
  const stages = [
    { label: 'Sent', count: totals.sent, color: 'bg-slate-500' },
    { label: 'Delivered', count: totals.delivered, color: 'bg-blue-500' },
    { label: 'Opened', count: totals.opened, color: 'bg-emerald-500' },
    { label: 'Clicked', count: totals.clicked, color: 'bg-purple-500' },
    { label: 'Replied', count: totals.replied, color: 'bg-amber-500' },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Funnel</div>
      <div className="space-y-2">
        {stages.map((s) => {
          const pct = max > 0 ? (s.count / max) * 100 : 0;
          return (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-20 text-xs font-medium text-muted-foreground">{s.label}</div>
              <div className="flex-1 h-6 bg-muted/30 rounded-md overflow-hidden">
                <div
                  className={`h-full ${s.color} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-16 text-right text-sm font-semibold tabular-nums">{s.count}</div>
              <div className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                {pct.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyChart({
  daily,
  hovered,
  setHovered,
}: {
  daily: Array<{ date: string; sent: number; opened: number; clicked: number; replied: number }>;
  hovered: { date: string; sent: number; opened: number; clicked: number; replied: number } | null;
  setHovered: (d: { date: string; sent: number; opened: number; clicked: number; replied: number } | null) => void;
}) {
  const max = Math.max(1, ...daily.map((d) => Math.max(d.sent, d.opened, d.clicked, d.replied)));
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Letzte 14 Tage</div>
        <div className="text-xs text-muted-foreground tabular-nums min-h-[16px]">
          {hovered
            ? `${hovered.date} · Sent ${hovered.sent} · Opened ${hovered.opened} · Clicked ${hovered.clicked} · Replied ${hovered.replied}`
            : 'Hover über einen Tag für Details'}
        </div>
      </div>
      <div className="flex items-end justify-between gap-1 h-32">
        {daily.map((d) => {
          const active = hovered?.date === d.date;
          return (
            <div
              key={d.date}
              className="flex-1 flex flex-col items-center justify-end gap-1 cursor-pointer"
              onMouseEnter={() => setHovered(d)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className={`w-full flex flex-col items-stretch gap-0.5 transition-opacity ${active ? '' : hovered ? 'opacity-40' : ''}`}>
                <div
                  className="bg-slate-500 rounded-sm"
                  style={{ height: (d.sent / max) * 80 + 'px' }}
                />
                {d.opened > 0 && (
                  <div
                    className="bg-emerald-500 rounded-sm"
                    style={{ height: (d.opened / max) * 80 + 'px' }}
                  />
                )}
                {d.clicked > 0 && (
                  <div
                    className="bg-purple-500 rounded-sm"
                    style={{ height: (d.clicked / max) * 80 + 'px' }}
                  />
                )}
                {d.replied > 0 && (
                  <div
                    className="bg-amber-500 rounded-sm"
                    style={{ height: (d.replied / max) * 80 + 'px' }}
                  />
                )}
              </div>
              <div className={`text-[9px] -rotate-45 origin-top-left translate-x-1 ${active ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                {d.date.slice(5)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 bg-slate-500 rounded-sm" /> Sent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 bg-emerald-500 rounded-sm" /> Opened
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 bg-purple-500 rounded-sm" /> Clicked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 bg-amber-500 rounded-sm" /> Replied
        </span>
      </div>
    </div>
  );
}

function SegmentBreakdown({ segments }: { segments: Record<string, number> }) {
  const entries = Object.entries(segments).sort((a, b) => b[1] - a[1]);
  const max = entries.reduce((m, [, n]) => Math.max(m, n), 0);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Leads pro Segment</div>
      <div className="space-y-2">
        {entries.map(([seg, n]) => (
          <div key={seg} className="flex items-center gap-3 text-sm">
            <div className="w-40 truncate text-muted-foreground">{SEGMENT_LABELS[seg] ?? seg}</div>
            <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${(n / max) * 100}%` }} />
            </div>
            <div className="w-10 text-right tabular-nums">{n}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBreakdown({ byStatus }: { byStatus: Record<string, number> }) {
  const entries = Object.entries(byStatus).sort((a, b) => b[1] - a[1]);
  const max = entries.reduce((m, [, n]) => Math.max(m, n), 0);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Leads pro Status</div>
      <div className="space-y-2">
        {entries.map(([st, n]) => (
          <div key={st} className="flex items-center gap-3 text-sm">
            <div className="w-32 truncate text-muted-foreground">{STATUS_LABELS[st] ?? st}</div>
            <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${(n / max) * 100}%` }} />
            </div>
            <div className="w-10 text-right tabular-nums">{n}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadsTable({
  leads,
  total,
  compact,
  loading,
  hasFilters,
  onReset,
}: {
  leads: Lead[];
  total: number;
  compact: boolean;
  loading?: boolean;
  hasFilters?: boolean;
  onReset?: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/20 text-xs uppercase tracking-wide text-muted-foreground flex items-center justify-between">
        <span className="inline-flex items-center gap-2">
          Leads · {leads.length} von {total}
          {loading && (
            <span className="inline-flex items-center gap-1 text-[10px] normal-case tracking-normal text-muted-foreground/70">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              lädt…
            </span>
          )}
        </span>
        <span className="text-[10px] normal-case tracking-normal opacity-70">Auto-refresh alle 15s</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              {!compact && <th className="px-4 py-2 font-medium">Segment</th>}
              {!compact && <th className="px-4 py-2 font-medium">Stadt</th>}
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Versendet</th>
              <th className="px-4 py-2 font-medium">Geöffnet</th>
              <th className="px-4 py-2 font-medium">Geklickt</th>
              <th className="px-4 py-2 font-medium">Reply</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <LeadRow key={l.id} lead={l} compact={compact} />
            ))}
            {leads.length === 0 && !loading && (
              <tr>
                <td colSpan={compact ? 7 : 9} className="text-center py-12 text-sm">
                  <div className="text-muted-foreground">Keine Leads gefunden</div>
                  {hasFilters && onReset && (
                    <button
                      type="button"
                      onClick={onReset}
                      className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
                    >
                      Alle Filter zurücksetzen
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeadRow({ lead, compact }: { lead: Lead; compact: boolean }) {
  const { data: messages } = useQuery<{
    messages: Array<{
      id: string;
      sent_at: string | null;
      opened_at: string | null;
      clicked_at: string | null;
      replied_at: string | null;
      open_count: number;
      click_count: number;
      status: string;
    }>;
  }>({
    queryKey: ['outbound-messages', lead.id],
    queryFn: async () => {
      const r = await fetch('/api/admin/outbound/messages?leadId=' + lead.id);
      if (!r.ok) return { messages: [] };
      return r.json();
    },
    enabled: lead.status === 'contacted' || lead.status === 'replied' || lead.status === 'bounced',
    refetchInterval: 30_000,
  });

  const lastMsg = messages?.messages?.[0];
  const sentAt = lastMsg?.sent_at;
  const openedAt = lastMsg?.opened_at;
  const openCount = lastMsg?.open_count ?? 0;
  const clickedAt = lastMsg?.clicked_at;
  const repliedAt = lastMsg?.replied_at;

  return (
    <tr className="border-b border-border/50 hover:bg-muted/20">
      <td className="px-4 py-3 font-medium truncate max-w-[200px]" title={lead.name}>{lead.name}</td>
      <td className="px-4 py-3 text-muted-foreground text-xs">{lead.email || '—'}</td>
      {!compact && <td className="px-4 py-3 text-xs">{SEGMENT_LABELS[lead.segment] ?? lead.segment}</td>}
      {!compact && <td className="px-4 py-3 text-xs text-muted-foreground">{lead.city || '—'}</td>}
      <td className="px-4 py-3 text-xs">
        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] ${statusClass(lead.status)}`}>
          {STATUS_LABELS[lead.status] ?? lead.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs">{sentAt ? formatDistanceToNow(new Date(sentAt), { locale: de, addSuffix: true }) : '—'}</td>
      <td className="px-4 py-3 text-xs">{openedAt ? <span className="text-emerald-500">✓ {openCount > 1 ? `${openCount}×` : ''}</span> : '—'}</td>
      <td className="px-4 py-3 text-xs">{clickedAt ? <span className="text-purple-500">✓</span> : '—'}</td>
      <td className="px-4 py-3 text-xs">{repliedAt ? <span className="text-amber-500">✓</span> : '—'}</td>
    </tr>
  );
}

function statusClass(status: string): string {
  if (status === 'replied' || status === 'converted') return 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30';
  if (status === 'contacted') return 'bg-blue-500/15 text-blue-500 border border-blue-500/30';
  if (status === 'bounced' || status === 'do_not_contact') return 'bg-red-500/15 text-red-500 border border-red-500/30';
  return 'bg-muted/30 text-muted-foreground border border-border';
}

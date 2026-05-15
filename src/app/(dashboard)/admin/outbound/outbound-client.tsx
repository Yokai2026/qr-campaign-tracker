'use client';

import { useState } from 'react';
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
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const { data: stats, refetch: refetchStats } = useQuery<Stats>({
    queryKey: ['outbound-stats'],
    queryFn: async () => {
      const r = await fetch('/api/admin/outbound/stats');
      if (!r.ok) throw new Error('Stats failed');
      return r.json();
    },
    refetchInterval: 30_000,
  });

  const { data: leadsData, refetch: refetchLeads } = useQuery<LeadsResponse>({
    queryKey: ['outbound-leads', segmentFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (segmentFilter) params.set('segment', segmentFilter);
      if (statusFilter) params.set('status', statusFilter);
      const r = await fetch('/api/admin/outbound/leads?' + params);
      if (!r.ok) throw new Error('Leads failed');
      return r.json();
    },
    refetchInterval: 60_000,
  });

  const refreshAll = () => {
    refetchStats();
    refetchLeads();
  };

  const t = stats?.totals;
  const r = stats?.rates;

  const filteredLeads = (leadsData?.leads ?? []).filter((l) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.name.toLowerCase().includes(s) ||
      l.email?.toLowerCase().includes(s) ||
      l.city?.toLowerCase().includes(s)
    );
  });

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
      {stats?.daily && stats.daily.length > 0 && <DailyChart daily={stats.daily} />}

      {/* Segment-Verteilung */}
      <div className="grid md:grid-cols-2 gap-6">
        <SegmentBreakdown segments={stats?.segments ?? {}} />
        <StatusBreakdown byStatus={stats?.byStatus ?? {}} />
      </div>

      {/* Filters + Leads Table */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, Email oder Stadt"
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-card border border-border rounded-lg"
          >
            <option value="">Alle Status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <LeadsTable leads={filteredLeads} total={leadsData?.total ?? 0} />
      </div>
    </div>
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
}: {
  daily: Array<{ date: string; sent: number; opened: number; clicked: number; replied: number }>;
}) {
  const max = Math.max(1, ...daily.map((d) => Math.max(d.sent, d.opened, d.clicked, d.replied)));
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
        Letzte 14 Tage
      </div>
      <div className="flex items-end justify-between gap-1 h-32">
        {daily.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1 group">
            <div className="w-full flex flex-col items-stretch gap-0.5">
              <div
                className="bg-slate-500 rounded-sm"
                style={{ height: (d.sent / max) * 80 + 'px' }}
                title={`Sent: ${d.sent}`}
              />
              {d.opened > 0 && (
                <div
                  className="bg-emerald-500 rounded-sm"
                  style={{ height: (d.opened / max) * 80 + 'px' }}
                  title={`Opened: ${d.opened}`}
                />
              )}
              {d.replied > 0 && (
                <div
                  className="bg-amber-500 rounded-sm"
                  style={{ height: (d.replied / max) * 80 + 'px' }}
                  title={`Replied: ${d.replied}`}
                />
              )}
            </div>
            <div className="text-[9px] text-muted-foreground -rotate-45 origin-top-left translate-x-1">
              {d.date.slice(5)}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 bg-slate-500 rounded-sm" /> Sent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 bg-emerald-500 rounded-sm" /> Opened
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

function LeadsTable({ leads, total }: { leads: Lead[]; total: number }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/20 text-xs uppercase tracking-wide text-muted-foreground">
        Leads · {leads.length} von {total}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Segment</th>
              <th className="px-4 py-2 font-medium">Stadt</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Versendet</th>
              <th className="px-4 py-2 font-medium">Geöffnet</th>
              <th className="px-4 py-2 font-medium">Geklickt</th>
              <th className="px-4 py-2 font-medium">Reply</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <LeadRow key={l.id} lead={l} />
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-muted-foreground py-12 text-sm">
                  Keine Leads gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
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
      <td className="px-4 py-3 text-xs">{SEGMENT_LABELS[lead.segment] ?? lead.segment}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{lead.city || '—'}</td>
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

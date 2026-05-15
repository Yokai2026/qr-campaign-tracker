'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Users,
  Crown,
  Sparkles,
  CreditCard,
  ArrowRight,
  Euro,
  Zap,
  Link2,
  TrendingUp,
  TrendingDown,
  Mail,
  Download,
  Search,
  XCircle,
  ArrowUpDown,
  AlertTriangle,
  Clock,
  AlertCircle,
  Moon,
  Copy,
} from 'lucide-react';
import { AnimatedNumber } from '@/components/shared/animated-number';
import { UserDetailDrawer } from './user-detail-drawer';

type Stats = {
  timestamp: string;
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    onlineNow: number;
    visitorsOnline: number;
    loggedInOnline: number;
    anonymousOnline: number;
    visitorsLifetime: number;
    trialActive: number;
    trialExpired: number;
  };
  payments: {
    total: number;
    monthly: number;
    yearly: number;
    manual: number;
    other: number;
    mrrEur: number;
    arrEur: number;
  };
  activity: {
    qrScansLastHour: number;
    qrScansToday: number;
    linkClicksLastHour: number;
    linkClicksToday: number;
    scansLastHour: number;
    scansToday: number;
  };
  intro: {
    activeWithIntroCoupon: number;
    monthlyEurDiscounted: number;
    fullPriceEur: number;
  };
  mrrHistory: Array<{
    date: string;
    mrr: number;
    paying: number;
    newMrr: number;
    churnedMrr: number;
  }>;
};

type Plan = 'monthly' | 'yearly' | 'manual' | 'other' | 'trial' | 'free';
type Bucket = 'all' | 'paying' | 'trial' | 'cancelled' | 'free';

type UserRow = {
  id: string;
  email: string;
  username: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  bucket: Exclude<Bucket, 'all'>;
  status: string;
  plan: Plan;
  mrrEur: number;
  trialEndsAt: string | null;
  cancelAt: string | null;
  subscribedAt: string | null;
  isAdmin: boolean;
  isOnline?: boolean;
  isNewToday?: boolean;
};

type UsersResponse = {
  timestamp: string;
  counts: Record<Exclude<Bucket, never>, number>;
  churn30d: { count: number; lostMrrEur: number };
  atRisk: {
    trialsEndingSoon: Array<{
      id: string;
      email: string;
      username: string | null;
      trialEndsAt: string | null;
      hoursLeft: number;
    }>;
    paymentIssues: Array<{
      id: string;
      email: string;
      username: string | null;
      plan: Plan;
      mrrEur: number;
    }>;
    inactivePaying: Array<{
      id: string;
      email: string;
      username: string | null;
      plan: Plan;
      mrrEur: number;
      lastSeenAt: string | null;
      daysSinceLastSeen: number;
    }>;
    duplicateClusters: Array<{ ids: string[]; emails: string[] }>;
  };
  rows: UserRow[];
  cancellations: Array<{
    userId: string;
    email: string | null;
    username: string | null;
    plan: Plan;
    status: string;
    cancelledAt: string;
    endsAt: string | null;
    mrrLost: number;
    reason: string | null;
    feedback: string | null;
  }>;
  reasonAggregate: Array<{ reason: string; count: number }>;
};

const REASON_LABELS: Record<string, string> = {
  too_expensive: 'Zu teuer',
  missing_features: 'Fehlende Features',
  not_using_enough: 'Nutzt kaum',
  switched_competitor: 'Konkurrenz',
  project_finished: 'Projekt fertig',
  technical_issues: 'Tech-Probleme',
  other: 'Anderer Grund',
};

type SortKey = 'createdAt' | 'lastSeenAt' | 'mrrEur' | 'email';
type SortDir = 'asc' | 'desc';

export function AdminClient() {
  const statsQuery = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  const usersQuery = useQuery<UsersResponse>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  if (statsQuery.isLoading) {
    return (
      <div className="space-y-5 animate-in-card">
        <Header lastUpdated={null} />
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (statsQuery.isError || !statsQuery.data) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-[14px] text-destructive">
        Konnte Admin-Stats nicht laden. Versuch&apos;s gleich nochmal.
      </div>
    );
  }

  const data = statsQuery.data;
  const users = usersQuery.data;

  const todayTotal = data.activity.qrScansToday + data.activity.linkClicksToday;
  const trialToPaidPct =
    data.users.trialActive + data.users.trialExpired + data.payments.total > 0
      ? Math.round(
          (data.payments.total /
            (data.users.trialActive + data.users.trialExpired + data.payments.total)) *
            100,
        )
      : 0;

  return (
    <div className="space-y-5 animate-in-card">
      <Header lastUpdated={statsQuery.dataUpdatedAt} />

      {/* HERO-Strip: 4 Business-Critical KPIs */}
      <section aria-label="Business-KPIs" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <HeroCard
          icon={Euro}
          accent="brand"
          label="MRR netto"
          value={Math.round(data.payments.mrrEur)}
          valueSuffix=" €"
          sub={
            data.mrrHistory && data.mrrHistory.length >= 2
              ? `ARR ≈ ${Math.round(data.payments.arrEur).toLocaleString('de-DE')} € · ${data.mrrHistory.length}T Verlauf`
              : `ARR ≈ ${Math.round(data.payments.arrEur).toLocaleString('de-DE')} €`
          }
          sparkline={data.mrrHistory?.map((h) => h.mrr)}
        />
        <HeroCard
          icon={CreditCard}
          label="Zahlende Kunden"
          value={data.payments.total}
          sub={
            <span className="tabular-nums">
              {data.payments.yearly} jährlich · {data.payments.monthly} monatlich
              {data.payments.manual > 0 && ` · ${data.payments.manual} manuell`}
            </span>
          }
        />
        <HeroCard
          icon={Sparkles}
          label="Trial-Funnel"
          valueSlot={
            <span className="tabular-nums text-[28px] font-semibold leading-none tracking-tight">
              <AnimatedNumber
                value={data.users.trialActive}
                duration={500}
                formatFn={(n) => Math.round(n).toLocaleString('de-DE')}
              />
              <span className="mx-2 text-muted-foreground/50">→</span>
              <AnimatedNumber
                value={data.users.trialExpired}
                duration={500}
                formatFn={(n) => Math.round(n).toLocaleString('de-DE')}
              />
            </span>
          }
          sub={`${data.users.trialActive} aktiv · ${data.users.trialExpired} abgelaufen · ${trialToPaidPct}% Trial→Paid`}
        />
        <HeroCard
          icon={TrendingDown}
          accent="destructive"
          label="Churn 30T"
          valueSlot={
            <div className="flex items-baseline gap-1.5">
              <span className="tabular-nums text-[34px] font-semibold leading-none tracking-tight">
                <AnimatedNumber
                  value={users?.churn30d.count ?? 0}
                  duration={500}
                  formatFn={(n) => Math.round(n).toLocaleString('de-DE')}
                />
              </span>
              {(users?.churn30d.lostMrrEur ?? 0) > 0 && (
                <span className="text-[13px] text-muted-foreground">
                  · −{Math.round(users?.churn30d.lostMrrEur ?? 0)} €/Mo
                </span>
              )}
            </div>
          }
          sub={
            (users?.churn30d.count ?? 0) === 0
              ? 'Niemand hat gekündigt'
              : `${users?.churn30d.count ?? 0} Kündigung${(users?.churn30d.count ?? 0) === 1 ? '' : 'en'} letzte 30 Tage`
          }
        />
      </section>

      {/* LIVE-Strip */}
      <section
        aria-label="Live-Aktivität"
        className="rounded-2xl border border-border bg-card px-4 py-3"
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px]">
          {/* Live-Presence: Gesamt-Besucher (anonym + eingeloggt) + Detail.
              visitorsOnline kommt aus visitor_heartbeats <2min,
              loggedInOnline = visitor_heartbeats mit user_id != null. */}
          <Chip
            pulse
            color="emerald"
            label={
              <>
                <span className="tabular-nums font-semibold text-foreground">
                  {data.users.visitorsOnline}
                </span>{' '}
                <span className="text-muted-foreground">live online</span>
                <span className="ml-1.5 text-[11px] text-muted-foreground/80 tabular-nums">
                  ({data.users.loggedInOnline} eingeloggt · {data.users.anonymousOnline} anonym)
                </span>
              </>
            }
          />
          <span className="text-muted-foreground/40">·</span>
          <Chip
            label={
              <>
                <span className="tabular-nums font-semibold text-foreground">
                  {data.users.visitorsLifetime.toLocaleString('de-DE')}
                </span>{' '}
                <span className="text-muted-foreground">Besuche gesamt</span>
              </>
            }
          />
          <span className="text-muted-foreground/40">·</span>
          <Chip
            icon={Zap}
            label={
              <>
                <span className="tabular-nums font-semibold text-foreground">{data.activity.qrScansLastHour}</span>{' '}
                <span className="text-muted-foreground">QR-Scans/h</span>
              </>
            }
          />
          <Chip
            icon={Link2}
            label={
              <>
                <span className="tabular-nums font-semibold text-foreground">{data.activity.linkClicksLastHour}</span>{' '}
                <span className="text-muted-foreground">Klicks/h</span>
              </>
            }
          />
          <span className="text-muted-foreground/40">·</span>
          <span className="text-muted-foreground tabular-nums">
            Heute:{' '}
            <span className="font-semibold text-foreground">{todayTotal.toLocaleString('de-DE')}</span> Aufrufe
            <span className="ml-1.5 text-muted-foreground/70">
              ({data.activity.qrScansToday.toLocaleString('de-DE')} QR ·{' '}
              {data.activity.linkClicksToday.toLocaleString('de-DE')} Klicks)
            </span>
          </span>
        </div>
      </section>

      {/* USER-FUNNEL */}
      <section aria-label="User-Funnel" className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
            <h2 className="text-[13.5px] font-semibold tracking-tight">User-Funnel</h2>
          </div>
          {data.users.newToday > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              +{data.users.newToday} heute
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 divide-x divide-border">
          <FunnelStage
            label="Gesamt-User"
            value={data.users.total}
            sub={
              data.users.newThisWeek > 0
                ? `${data.users.newThisWeek} diese Woche`
                : 'Alle Profile'
            }
          />
          <FunnelStage
            label="In Trial"
            value={data.users.trialActive}
            sub={
              data.users.total > 0
                ? `${Math.round((data.users.trialActive / data.users.total) * 100)}% aller User`
                : '—'
            }
            connector
          />
          <FunnelStage
            label="Zahlend"
            value={data.payments.total}
            sub={
              data.users.total > 0
                ? `${Math.round((data.payments.total / data.users.total) * 100)}% aller User`
                : '—'
            }
            connector
            accent="brand"
          />
        </div>
      </section>

      {/* INTRO-DISCOUNT — nur wenn aktiv */}
      {data.intro.activeWithIntroCoupon > 0 && (
        <section aria-label="Intro-Discount" className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-brand" strokeWidth={1.8} />
            <h2 className="text-[13.5px] font-semibold tracking-tight">Intro-Discount aktiv</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MicroStat
              label="Intro-User"
              value={data.intro.activeWithIntroCoupon}
              sub="Coupon intro_3mo (5,99 €/Mo)"
            />
            <MicroStat
              label="Discounted MRR"
              value={Math.round(data.intro.monthlyEurDiscounted)}
              unit="€"
              sub="Aus den Intro-Usern"
            />
            <MicroStat
              label="Voll-Preis MRR"
              value={Math.round(data.intro.fullPriceEur)}
              unit="€"
              sub="Monthly ohne Coupon"
            />
          </div>
        </section>
      )}

      {/* AT-RISK — kritische Aktionen */}
      {users && <AtRiskSection atRisk={users.atRisk} />}

      {/* ALL-USERS-TABELLE */}
      {users && <UsersTableSection users={users} />}

      {/* CHURN-LISTE */}
      {users && (users.cancellations.length > 0 || users.reasonAggregate.length > 0) && (
        <CancellationsSection
          cancellations={users.cancellations}
          reasonAggregate={users.reasonAggregate}
        />
      )}
    </div>
  );
}

// ============================================
// All-Users-Tabelle
// ============================================

const PAGE_SIZE = 20;

function UsersTableSection({ users }: { users: UsersResponse }) {
  const [bucket, setBucket] = useState<Bucket>('all');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    let rows = users.rows;
    if (bucket !== 'all') rows = rows.filter((r) => r.bucket === bucket);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((r) => r.email.toLowerCase().includes(q) || r.username?.toLowerCase().includes(q));
    }
    rows = [...rows].sort((a, b) => {
      let av: number | string = '';
      let bv: number | string = '';
      if (sortKey === 'createdAt') {
        av = a.createdAt;
        bv = b.createdAt;
      } else if (sortKey === 'lastSeenAt') {
        av = a.lastSeenAt ?? '';
        bv = b.lastSeenAt ?? '';
      } else if (sortKey === 'mrrEur') {
        av = a.mrrEur;
        bv = b.mrrEur;
      } else {
        av = a.email.toLowerCase();
        bv = b.email.toLowerCase();
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [users.rows, bucket, query, sortKey, sortDir]);

  // Reset Pagination wenn Filter/Sort sich ändert
  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;
  // Reset visibleCount auf Default wenn Filter wechselt
  const filterKey = `${bucket}|${query}|${sortKey}|${sortDir}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'email' ? 'asc' : 'desc');
    }
  }

  function mailtoFiltered() {
    const emails = filtered.map((r) => r.email).filter(Boolean);
    if (emails.length === 0) return;
    // BCC um Adressen nicht offenzulegen
    window.location.href = `mailto:?bcc=${encodeURIComponent(emails.join(','))}`;
  }

  function downloadCsv() {
    // Excel-DE-kompatibel: ; als Separator, , als Dezimal, UTF-8 BOM,
    // `sep=;`-Hint damit Excel auch ohne Region-Setting sauber spaltet.
    const SEP = ';';
    const headers = [
      'Email',
      'Username',
      'Plan',
      'Status',
      'MRR (€/Mo)',
      'Beigetreten',
      'Letzter Login',
      'Trial-Ende',
      'Gekündigt am',
    ];

    const planLabel: Record<Plan, string> = {
      yearly: 'Jährlich',
      monthly: 'Monatlich',
      manual: 'Manuell',
      other: 'Sonstige',
      trial: 'Trial',
      free: 'Free',
    };
    const statusLabel: Record<string, string> = {
      active: 'Aktiv',
      on_trial: 'Trial-Sub',
      past_due: 'Zahlung offen',
      paused: 'Pausiert',
      cancelled: 'Gekündigt',
      expired: 'Abgelaufen',
      trial: 'Trial',
      free: 'Free',
    };

    const fmtDate = (iso: string | null) =>
      iso ? format(new Date(iso), 'dd.MM.yyyy HH:mm', { locale: de }) : '';
    const fmtDateOnly = (iso: string | null) =>
      iso ? format(new Date(iso), 'dd.MM.yyyy', { locale: de }) : '';
    const fmtEur = (n: number) =>
      n > 0 ? n.toFixed(2).replace('.', ',') : '';

    const lines: string[] = [];
    // Excel-Hint Zeile (sep=;). Excel parsed das automatisch.
    lines.push(`sep=${SEP}`);
    lines.push(headers.map((h) => csvCell(h, SEP)).join(SEP));

    for (const r of filtered) {
      lines.push(
        [
          csvCell(r.email, SEP),
          csvCell(r.username, SEP),
          csvCell(planLabel[r.plan] ?? r.plan, SEP),
          csvCell(statusLabel[r.status] ?? r.status, SEP),
          csvCell(fmtEur(r.mrrEur), SEP),
          csvCell(fmtDate(r.createdAt), SEP),
          csvCell(fmtDate(r.lastSeenAt), SEP),
          csvCell(fmtDateOnly(r.trialEndsAt), SEP),
          csvCell(fmtDateOnly(r.cancelAt), SEP),
        ].join(SEP),
      );
    }

    // UTF-8 BOM (U+FEFF) damit Excel Umlaute korrekt liest. CRLF für Windows-Excel.
    const BOM = '﻿';
    const csv = BOM + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spurig-users-${bucket}-${format(new Date(), 'yyyy-MM-dd', { locale: de })}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const BUCKETS: Array<{ key: Bucket; label: string; count: number }> = [
    { key: 'all', label: 'Alle', count: users.counts.all },
    { key: 'paying', label: 'Zahlend', count: users.counts.paying },
    { key: 'trial', label: 'In Trial', count: users.counts.trial },
    { key: 'cancelled', label: 'Gekündigt', count: users.counts.cancelled },
    { key: 'free', label: 'Free', count: users.counts.free },
  ];

  return (
    <section aria-label="Alle User" className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Header mit Filter-Pills + Search + Actions */}
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
            <h2 className="text-[13.5px] font-semibold tracking-tight">Alle User</h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={mailtoFiltered}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11.5px] font-medium transition-colors hover:bg-muted disabled:opacity-40"
              title="mailto: an alle gefilterten User (BCC)"
            >
              <Mail className="h-3 w-3" />
              Mail an {filtered.length}
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11.5px] font-medium transition-colors hover:bg-muted disabled:opacity-40"
            >
              <Download className="h-3 w-3" />
              CSV
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {BUCKETS.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => setBucket(b.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
                  bucket === b.key
                    ? 'bg-brand text-brand-foreground'
                    : 'border border-border bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                {b.label}
                <span className="tabular-nums opacity-70">{b.count}</span>
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Email oder Username suchen..."
              className="h-8 w-full rounded-md border border-border bg-background pl-7 pr-2 text-[12px] outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-brand/30"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <TableSortHeader label="User" onClick={() => toggleSort('email')} active={sortKey === 'email'} dir={sortDir} />
              <th className="px-3 py-2 text-left font-medium">Plan</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <TableSortHeader label="MRR" align="right" onClick={() => toggleSort('mrrEur')} active={sortKey === 'mrrEur'} dir={sortDir} />
              <TableSortHeader label="Joined" onClick={() => toggleSort('createdAt')} active={sortKey === 'createdAt'} dir={sortDir} />
              <TableSortHeader label="Last seen" onClick={() => toggleSort('lastSeenAt')} active={sortKey === 'lastSeenAt'} dir={sortDir} />
              <th className="px-3 py-2 text-right font-medium">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  Keine User in diesem Filter.
                </td>
              </tr>
            )}
            {visible.map((r) => (
              <tr
                key={r.id}
                className="cursor-pointer transition-colors hover:bg-muted/30"
                onClick={() => setDrawerUserId(r.id)}
              >
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-1.5 font-medium">
                      {r.isOnline && (
                        <span
                          className="relative flex h-1.5 w-1.5 shrink-0"
                          title="Gerade online"
                        >
                          <span className="absolute inline-flex h-full w-full animate-[pulseDot_1.4s_ease-in-out_infinite] rounded-full bg-emerald-400/70" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        </span>
                      )}
                      <span className="truncate">{r.email}</span>
                      {r.isAdmin && (
                        <Crown className="h-3 w-3 text-brand" strokeWidth={2.2} />
                      )}
                      {r.isNewToday && (
                        <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Neu
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {r.username ? `@${r.username}` : '—'}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  {/* Plan/Status-Dedup: bei free/trial nur Plan zeigen (Status redundant) */}
                  {r.plan === 'free' || (r.plan === 'trial' && r.status === 'trial') ? (
                    <PlanBadge plan={r.plan} />
                  ) : (
                    <PlanBadge plan={r.plan} />
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {/* Wenn Plan und Status identisch (free/free) → unterdrücken */}
                  {(r.plan === 'free' && r.status === 'free') ? (
                    <span className="text-muted-foreground/40">—</span>
                  ) : (
                    <StatusBadge status={r.status} bucket={r.bucket} trialEndsAt={r.trialEndsAt} cancelAt={r.cancelAt} />
                  )}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {r.mrrEur > 0 ? (
                    <span className="font-semibold">{r.mrrEur.toFixed(2)} €</span>
                  ) : (
                    <span className="text-muted-foreground/60">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground tabular-nums whitespace-nowrap">
                  {format(new Date(r.createdAt), 'dd.MM.yy', { locale: de })}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                  {r.lastSeenAt
                    ? `vor ${formatDistanceToNow(new Date(r.lastSeenAt), { locale: de })}`
                    : <span className="text-muted-foreground/50">nie</span>}
                </td>
                <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={`mailto:${r.email}`}
                    className="inline-flex items-center justify-center rounded-md border border-border bg-background p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title={`Mail an ${r.email}`}
                  >
                    <Mail className="h-3 w-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer: Mehr anzeigen / Count */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2.5 text-[11.5px]">
          <span className="text-muted-foreground tabular-nums">
            {visible.length} von {filtered.length}
            {filtered.length !== users.counts.all && (
              <span className="text-muted-foreground/60"> · {users.counts.all} gesamt</span>
            )}
          </span>
          {hasMore && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setVisibleCount((v) => Math.min(filtered.length, v + PAGE_SIZE))}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11.5px] font-medium transition-colors hover:bg-muted"
              >
                Mehr anzeigen ({Math.min(PAGE_SIZE, filtered.length - visibleCount)})
              </button>
              <button
                type="button"
                onClick={() => setVisibleCount(filtered.length)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11.5px] font-medium transition-colors hover:bg-muted"
              >
                Alle ({filtered.length})
              </button>
            </div>
          )}
          {!hasMore && visibleCount > PAGE_SIZE && (
            <button
              type="button"
              onClick={() => setVisibleCount(PAGE_SIZE)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11.5px] font-medium transition-colors hover:bg-muted"
            >
              Weniger anzeigen
            </button>
          )}
        </div>
      )}

      {drawerUserId && (
        <UserDetailDrawer
          userId={drawerUserId}
          open={drawerUserId !== null}
          onClose={() => setDrawerUserId(null)}
        />
      )}
    </section>
  );
}

function TableSortHeader({
  label,
  onClick,
  active,
  dir,
  align,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
  dir: SortDir;
  align?: 'right';
}) {
  return (
    <th className={`px-3 py-2 font-medium ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 transition-colors ${active ? 'text-foreground' : 'hover:text-foreground'}`}
      >
        {label}
        <ArrowUpDown className={`h-3 w-3 ${active ? 'opacity-100' : 'opacity-40'}`} />
        {active && (
          <span className="text-[9px] uppercase">{dir === 'asc' ? '↑' : '↓'}</span>
        )}
      </button>
    </th>
  );
}

function PlanBadge({ plan }: { plan: Plan }) {
  const config: Record<Plan, { label: string; className: string }> = {
    yearly: { label: 'Jährlich', className: 'bg-brand/15 text-brand' },
    monthly: { label: 'Monatlich', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    manual: { label: 'Manuell', className: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
    other: { label: 'Sonstige', className: 'bg-muted text-muted-foreground' },
    trial: { label: 'Trial', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    free: { label: 'Free', className: 'bg-muted/60 text-muted-foreground' },
  };
  const c = config[plan];
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10.5px] font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

function StatusBadge({
  status,
  bucket,
  trialEndsAt,
  cancelAt,
}: {
  status: string;
  bucket: UserRow['bucket'];
  trialEndsAt: string | null;
  cancelAt: string | null;
}) {
  // Spezialfälle mit Datum
  if (bucket === 'cancelled' && cancelAt) {
    const endsInFuture = new Date(cancelAt).getTime() > Date.now();
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10.5px] font-medium text-red-600 dark:text-red-400">
        <XCircle className="h-2.5 w-2.5" />
        {endsInFuture ? 'Läuft aus' : 'Gekündigt'} {format(new Date(cancelAt), 'dd.MM.yy', { locale: de })}
      </span>
    );
  }
  if (bucket === 'trial' && trialEndsAt) {
    const days = Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000));
    return (
      <span className="inline-flex items-center rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10.5px] font-medium text-amber-600 dark:text-amber-400">
        Trial · noch {days}T
      </span>
    );
  }
  const map: Record<string, { label: string; className: string }> = {
    active: { label: 'Aktiv', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    cancelling: { label: 'Läuft aus', className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
    on_trial: { label: 'Trial-Sub', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    past_due: { label: 'Zahlung offen', className: 'bg-red-500/15 text-red-600 dark:text-red-400' },
    paused: { label: 'Pausiert', className: 'bg-muted text-muted-foreground' },
    cancelled: { label: 'Gekündigt', className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
    expired: { label: 'Abgelaufen', className: 'bg-muted text-muted-foreground' },
    trial: { label: 'Trial', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    free: { label: 'Free', className: 'bg-muted/60 text-muted-foreground' },
  };
  const c = map[status] ?? { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10.5px] font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

// ============================================
// At-Risk: kritische Aktionen die Admin handhaben sollte
// ============================================

function AtRiskSection({ atRisk }: { atRisk: UsersResponse['atRisk'] }) {
  const hasAnyRisk =
    atRisk.trialsEndingSoon.length > 0 ||
    atRisk.paymentIssues.length > 0 ||
    atRisk.inactivePaying.length > 0 ||
    atRisk.duplicateClusters.length > 0;

  if (!hasAnyRisk) return null;

  return (
    <section aria-label="At-Risk" className="overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/[0.04]">
      <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/[0.06] px-4 py-2.5">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" strokeWidth={2} />
        <h2 className="text-[13.5px] font-semibold tracking-tight">
          Aktionen empfohlen
        </h2>
        <span className="ml-1 text-[11px] text-muted-foreground">
          Diese User brauchen Aufmerksamkeit — eine Mail oder Check kann Churn verhindern
        </span>
      </div>
      <div className="grid gap-px bg-amber-500/10 md:grid-cols-2 lg:grid-cols-4">
        <RiskCard
          icon={Clock}
          tone="amber"
          title="Trial endet bald"
          count={atRisk.trialsEndingSoon.length}
          hint="Conversion-Chance — jetzt anschreiben"
          mailtoEmails={atRisk.trialsEndingSoon.map((u) => u.email)}
        >
          {atRisk.trialsEndingSoon.slice(0, 5).map((u) => (
            <RiskRow
              key={u.id}
              email={u.email}
              username={u.username}
              trailing={`${u.hoursLeft < 24 ? `noch ${u.hoursLeft}h` : `noch ${Math.ceil(u.hoursLeft / 24)}T`}`}
            />
          ))}
          {atRisk.trialsEndingSoon.length > 5 && (
            <li className="px-3 py-1.5 text-[10.5px] text-muted-foreground">
              + {atRisk.trialsEndingSoon.length - 5} weitere
            </li>
          )}
        </RiskCard>

        <RiskCard
          icon={AlertCircle}
          tone="red"
          title="Zahlung offen"
          count={atRisk.paymentIssues.length}
          hint="past_due — wird sonst automatisch gecancelled"
          mailtoEmails={atRisk.paymentIssues.map((u) => u.email)}
        >
          {atRisk.paymentIssues.slice(0, 5).map((u) => (
            <RiskRow
              key={u.id}
              email={u.email}
              username={u.username}
              trailing={`${u.mrrEur.toFixed(2)} €/Mo`}
            />
          ))}
        </RiskCard>

        <RiskCard
          icon={Moon}
          tone="muted"
          title="Inaktive Zahler"
          count={atRisk.inactivePaying.length}
          hint="30+ Tage nicht online — vor Churn aktivieren"
          mailtoEmails={atRisk.inactivePaying.map((u) => u.email)}
        >
          {atRisk.inactivePaying.slice(0, 5).map((u) => (
            <RiskRow
              key={u.id}
              email={u.email}
              username={u.username}
              trailing={`${u.daysSinceLastSeen}T offline`}
            />
          ))}
          {atRisk.inactivePaying.length > 5 && (
            <li className="px-3 py-1.5 text-[10.5px] text-muted-foreground">
              + {atRisk.inactivePaying.length - 5} weitere
            </li>
          )}
        </RiskCard>

        <RiskCard
          icon={Copy}
          tone="muted"
          title="Mögliche Duplikate"
          count={atRisk.duplicateClusters.length}
          hint="Sehr ähnliche Email-Adressen — eventuell zusammenführen"
        >
          {atRisk.duplicateClusters.slice(0, 5).map((c, i) => (
            <li key={i} className="px-3 py-1.5 text-[11px]">
              <div className="flex flex-col gap-0.5">
                {c.emails.map((e) => (
                  <span key={e} className="truncate">
                    {e}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </RiskCard>
      </div>
    </section>
  );
}

function RiskCard({
  icon: Icon,
  tone,
  title,
  count,
  hint,
  mailtoEmails,
  children,
}: {
  icon: typeof AlertTriangle;
  tone: 'amber' | 'red' | 'muted';
  title: string;
  count: number;
  hint: string;
  mailtoEmails?: string[];
  children: React.ReactNode;
}) {
  if (count === 0) {
    return (
      <div className="bg-card p-3">
        <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground/70">
          <Icon className="h-3 w-3" strokeWidth={1.8} />
          <span className="font-medium">{title}</span>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/60">Nichts zu tun ✓</p>
      </div>
    );
  }
  const toneStyles: Record<typeof tone, { count: string; icon: string }> = {
    amber: { count: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500' },
    red: { count: 'text-red-600 dark:text-red-400', icon: 'text-red-500' },
    muted: { count: 'text-foreground', icon: 'text-muted-foreground' },
  };
  const styles = toneStyles[tone];

  function bulkMail() {
    if (!mailtoEmails || mailtoEmails.length === 0) return;
    window.location.href = `mailto:?bcc=${encodeURIComponent(mailtoEmails.filter(Boolean).join(','))}`;
  }

  return (
    <div className="flex flex-col bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <Icon className={`h-3.5 w-3.5 ${styles.icon}`} strokeWidth={2} />
            <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {title}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`tabular-nums text-[26px] font-semibold leading-none tracking-tight ${styles.count}`}>
              {count}
            </span>
          </div>
        </div>
        {mailtoEmails && mailtoEmails.length > 0 && (
          <button
            type="button"
            onClick={bulkMail}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10.5px] font-medium transition-colors hover:bg-muted"
            title={`Mail an alle ${count} (BCC)`}
          >
            <Mail className="h-2.5 w-2.5" />
            Mail
          </button>
        )}
      </div>
      <p className="mt-1.5 text-[10.5px] leading-snug text-muted-foreground">{hint}</p>
      <ul className="mt-2 -mx-3 border-t border-border/60 pt-1">
        {children}
      </ul>
    </div>
  );
}

function RiskRow({
  email,
  username,
  trailing,
}: {
  email: string;
  username: string | null;
  trailing: string;
}) {
  return (
    <li className="flex items-center gap-2 px-3 py-1 text-[11px]">
      <div className="min-w-0 flex-1">
        <div className="truncate">{email}</div>
        {username && <div className="truncate text-[10px] text-muted-foreground">@{username}</div>}
      </div>
      <span className="shrink-0 tabular-nums text-muted-foreground">{trailing}</span>
    </li>
  );
}

const CANCEL_PAGE_SIZE = 5;

function CancellationsSection({
  cancellations,
  reasonAggregate,
}: {
  cancellations: UsersResponse['cancellations'];
  reasonAggregate: UsersResponse['reasonAggregate'];
}) {
  const totalReasons = reasonAggregate.reduce((sum, r) => sum + r.count, 0);
  const [shownCount, setShownCount] = useState(CANCEL_PAGE_SIZE);
  const visible = cancellations.slice(0, shownCount);
  const hasMore = cancellations.length > shownCount;
  return (
    <section aria-label="Kündigungen" className="space-y-3">
      {/* Top-Reasons-Card */}
      {totalReasons > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
            <h3 className="text-[13.5px] font-semibold tracking-tight">Kündigungsgründe (Top)</h3>
            <span className="text-[11px] text-muted-foreground">Aus {totalReasons} Kündigung{totalReasons === 1 ? '' : 'en'} mit Grund</span>
          </div>
          <div className="space-y-1.5">
            {reasonAggregate.slice(0, 5).map((r) => {
              const pct = Math.round((r.count / totalReasons) * 100);
              return (
                <div key={r.reason} className="flex items-center gap-3 text-[12px]">
                  <div className="w-32 shrink-0 truncate">{REASON_LABELS[r.reason] ?? r.reason}</div>
                  <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-red-500/60" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-20 shrink-0 text-right tabular-nums text-muted-foreground">
                    {r.count}× <span className="text-muted-foreground/60">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancellations-Liste */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2">
            <XCircle className="h-3.5 w-3.5 text-red-500" strokeWidth={1.8} />
            <h2 className="text-[13.5px] font-semibold tracking-tight">
              Letzte Kündigungen ({cancellations.length})
            </h2>
          </div>
        </div>
        <ul className="divide-y divide-border/60">
          {visible.map((c, i) => {
            const endsInFuture = c.endsAt && new Date(c.endsAt).getTime() > Date.now();
            return (
              <li key={`${c.userId}-${i}`} className="px-4 py-2.5 text-[12.5px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{c.email ?? '(unbekannt)'}</span>
                  {c.username && <span className="text-[11px] text-muted-foreground">@{c.username}</span>}
                  <PlanBadge plan={c.plan} />
                  {endsInFuture && (
                    <span className="inline-flex items-center rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10.5px] font-medium text-amber-600 dark:text-amber-400">
                      Läuft aus
                    </span>
                  )}
                  {c.reason && (
                    <span className="inline-flex items-center rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10.5px] font-medium text-red-600 dark:text-red-400">
                      {REASON_LABELS[c.reason] ?? c.reason}
                    </span>
                  )}
                  <span className="ml-auto text-[11.5px] text-muted-foreground tabular-nums">
                    {c.mrrLost > 0 && (
                      <span className="mr-3 font-medium text-red-600 dark:text-red-400">
                        −{c.mrrLost.toFixed(2)} €/Mo
                      </span>
                    )}
                    {endsInFuture && c.endsAt ? (
                      <>endet {format(new Date(c.endsAt), 'dd.MM.yyyy', { locale: de })}</>
                    ) : (
                      format(new Date(c.cancelledAt), 'dd.MM.yyyy', { locale: de })
                    )}
                  </span>
                </div>
                {c.feedback && (
                  <p className="mt-1 ml-1 text-[11px] italic text-muted-foreground">&bdquo;{c.feedback}&ldquo;</p>
                )}
              </li>
            );
          })}
        </ul>
        {(hasMore || shownCount > CANCEL_PAGE_SIZE) && (
          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2 text-[11.5px]">
            <span className="text-muted-foreground tabular-nums">
              {visible.length} von {cancellations.length}
            </span>
            <div className="flex items-center gap-1.5">
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setShownCount((v) => Math.min(cancellations.length, v + CANCEL_PAGE_SIZE))}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11.5px] font-medium transition-colors hover:bg-muted"
                >
                  Mehr anzeigen ({Math.min(CANCEL_PAGE_SIZE, cancellations.length - shownCount)})
                </button>
              )}
              {!hasMore && shownCount > CANCEL_PAGE_SIZE && (
                <button
                  type="button"
                  onClick={() => setShownCount(CANCEL_PAGE_SIZE)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11.5px] font-medium transition-colors hover:bg-muted"
                >
                  Weniger anzeigen
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================
// Shared layout primitives (unverändert von vorher)
// ============================================

function Header({ lastUpdated }: { lastUpdated: number | null }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand">
          <Crown className="h-3 w-3" />
          Admin
        </div>
        <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.015em]">Admin Center</h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Live-Übersicht aller User, Zahlungen, Churn und Aktivität auf Spurig
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/admin/content"
          className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-[11.5px] font-semibold text-orange-400 hover:bg-orange-500/20 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Content-Drafts
          <ArrowRight className="h-3 w-3" />
        </Link>
        <Link
          href="/admin/linkedin-dms"
          className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-[11.5px] font-semibold text-blue-400 hover:bg-blue-500/20 transition-colors"
        >
          <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-[3px] bg-blue-500 text-[8px] font-bold text-white">in</span>
          LinkedIn-DMs
          <ArrowRight className="h-3 w-3" />
        </Link>
        <Link
          href="/admin/outbound"
          className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-[11.5px] font-semibold text-purple-400 hover:bg-purple-500/20 transition-colors"
        >
          <Mail className="h-3.5 w-3.5" />
          Outbound-Tracking
          <ArrowRight className="h-3 w-3" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-[pulseDot_1.4s_ease-in-out_infinite] rounded-full bg-emerald-400/70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[11.5px] text-muted-foreground tabular-nums">
            {lastUpdated
              ? `Live · ${new Date(lastUpdated).toLocaleTimeString('de-DE')}`
              : 'lädt …'}
          </span>
        </div>
      </div>
    </div>
  );
}

function HeroCard({
  icon: Icon,
  label,
  value,
  valueSuffix,
  valueSlot,
  sub,
  accent,
  sparkline,
}: {
  icon: typeof Users;
  label: string;
  value?: number;
  valueSuffix?: string;
  valueSlot?: React.ReactNode;
  sub: React.ReactNode;
  accent?: 'brand' | 'destructive';
  sparkline?: number[];
}) {
  const iconColor =
    accent === 'brand'
      ? 'text-brand'
      : accent === 'destructive'
      ? 'text-red-500'
      : 'text-muted-foreground/60';
  const valueColor =
    accent === 'brand' ? 'text-brand' : '';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </div>
        <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={1.6} />
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {valueSlot ?? (
            <span
              className={`tabular-nums text-[34px] font-semibold leading-none tracking-tight ${valueColor}`}
            >
              <AnimatedNumber value={value ?? 0} duration={500} formatFn={(n) => Math.round(n).toLocaleString('de-DE')} />
              {valueSuffix && <span className="text-[20px] text-muted-foreground ml-0.5">{valueSuffix}</span>}
            </span>
          )}
        </div>
        {sparkline && sparkline.length >= 2 && <MiniSparkline data={sparkline} accent={accent} />}
      </div>
      <div className="mt-3 text-[11.5px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function MiniSparkline({ data, accent }: { data: number[]; accent?: 'brand' | 'destructive' }) {
  if (data.length < 2) return null;
  const w = 84;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(0.001, max - min);
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`).join(' ');
  const stroke =
    accent === 'brand' ? 'var(--brand)' : accent === 'destructive' ? 'oklch(0.62 0.21 25)' : 'var(--muted-foreground)';
  const fill =
    accent === 'brand' ? 'var(--brand)' : accent === 'destructive' ? 'oklch(0.62 0.21 25)' : 'var(--muted-foreground)';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-24 shrink-0" aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeOpacity={0.7}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`${points} ${w},${h} 0,${h}`}
        fill={fill}
        fillOpacity="0.10"
      />
    </svg>
  );
}

function Chip({
  pulse,
  color,
  icon: Icon,
  label,
}: {
  pulse?: boolean;
  color?: 'emerald';
  icon?: typeof Users;
  label: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={`absolute inline-flex h-full w-full animate-[pulseDot_1.4s_ease-in-out_infinite] rounded-full ${
              color === 'emerald' ? 'bg-emerald-400/70' : 'bg-brand/60'
            }`}
          />
          <span
            className={`relative inline-flex h-1.5 w-1.5 rounded-full ${color === 'emerald' ? 'bg-emerald-400' : 'bg-brand'}`}
          />
        </span>
      )}
      {Icon && <Icon className="h-3 w-3 text-muted-foreground" strokeWidth={1.8} />}
      {label}
    </span>
  );
}

function FunnelStage({
  label,
  value,
  sub,
  connector,
  accent,
}: {
  label: string;
  value: number;
  sub: string;
  connector?: boolean;
  accent?: 'brand';
}) {
  return (
    <div className="relative p-4">
      {connector && (
        <ArrowRight className="absolute -left-2.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 bg-card text-muted-foreground/40 md:block" />
      )}
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5">
        <span
          className={`tabular-nums text-[28px] font-semibold leading-none tracking-tight ${accent === 'brand' ? 'text-brand' : ''}`}
        >
          <AnimatedNumber value={value} duration={500} formatFn={(n) => Math.round(n).toLocaleString('de-DE')} />
        </span>
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function MicroStat({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: number;
  unit?: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/40 p-3">
      <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="tabular-nums text-[22px] font-semibold leading-none tracking-tight">
          <AnimatedNumber value={value} duration={500} formatFn={(n) => Math.round(n).toLocaleString('de-DE')} />
        </span>
        {unit && <span className="text-[13px] text-muted-foreground">{unit}</span>}
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function csvCell(v: string | null, sep: string = ','): string {
  if (v == null) return '';
  // Quote wenn der Wert das Trennzeichen, ", \n oder \r enthält.
  const needsQuote = v.includes(sep) || /["\n\r]/.test(v);
  if (needsQuote) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

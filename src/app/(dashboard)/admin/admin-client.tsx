'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Users,
  Activity,
  Crown,
  Calendar,
  TrendingUp,
  Sparkles,
  CreditCard,
  ArrowUpRight,
} from 'lucide-react';
import { AnimatedNumber } from '@/components/shared/animated-number';

type Stats = {
  timestamp: string;
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    onlineNow: number;
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
    scansLastHour: number;
    scansToday: number;
  };
  recentSignups: Array<{
    id: string;
    email: string;
    username: string | null;
    createdAt: string;
    trialEndsAt: string | null;
  }>;
  recentSubscriptions: Array<{
    id: string;
    email: string | null;
    username: string | null;
    plan: 'monthly' | 'yearly' | 'manual' | 'other';
    status: string;
    createdAt: string;
  }>;
};

export function AdminClient() {
  const { data, isLoading, isError, dataUpdatedAt } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 10_000, // 10s Live-Refresh
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in-card">
        <Header lastUpdated={null} />
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-[14px] text-destructive">
        Konnte Admin-Stats nicht laden. Versuch&apos;s gleich nochmal.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in-card">
      <Header lastUpdated={dataUpdatedAt} />

      {/* LIVE jetzt — pulsierende Cards */}
      <section aria-label="Live-Aktivität">
        <SectionTitle icon={Activity}>Live jetzt</SectionTitle>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <LiveCard
            label="User online"
            value={data.users.onlineNow}
            sub="Aktive Browser-Tabs (letzte 2 Min)"
            accent="emerald"
          />
          <LiveCard
            label="Scans letzte Stunde"
            value={data.activity.scansLastHour}
            sub={`Heute insgesamt: ${data.activity.scansToday.toLocaleString('de-DE')}`}
            accent="brand"
          />
        </div>
      </section>

      {/* User-Übersicht */}
      <section aria-label="User">
        <SectionTitle icon={Users}>User-Übersicht</SectionTitle>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <StatCard label="Insgesamt" value={data.users.total} sub="Alle Profile" />
          <StatCard label="Heute neu" value={data.users.newToday} sub="Seit 00:00 UTC" />
          <StatCard label="Trial aktiv" value={data.users.trialActive} sub="Test läuft" />
          <StatCard label="Trial abgelaufen" value={data.users.trialExpired} sub="Ohne Sub" />
        </div>
      </section>

      {/* Zahlungen */}
      <section aria-label="Zahlungen">
        <SectionTitle icon={CreditCard}>Zahlende Kunden</SectionTitle>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <StatCard label="Insgesamt zahlend" value={data.payments.total} sub="active + on_trial + past_due" />
          <StatCard label="Jährlich" value={data.payments.yearly} sub="8,99 €/Mo netto" />
          <StatCard label="Monatlich" value={data.payments.monthly} sub="12,99 €/Mo netto" />
          <StatCard
            label="MRR netto"
            value={Math.round(data.payments.mrrEur)}
            unit="€"
            sub={`ARR ≈ ${Math.round(data.payments.arrEur).toLocaleString('de-DE')} €`}
          />
        </div>
      </section>

      {/* Letzte Signups + Subscriptions side by side */}
      <section className="grid gap-4 md:grid-cols-2">
        <ListCard title="Letzte 10 Registrierungen" icon={Sparkles}>
          {data.recentSignups.length > 0 ? (
            data.recentSignups.map((s) => (
              <ListRow
                key={s.id}
                primary={s.email}
                secondary={s.username ? `@${s.username}` : 'kein Benutzername'}
                trailing={`vor ${formatDistanceToNow(new Date(s.createdAt), { locale: de })}`}
              />
            ))
          ) : (
            <Empty>Noch keine Registrierungen</Empty>
          )}
        </ListCard>

        <ListCard title="Letzte 10 Sub-Events" icon={Crown}>
          {data.recentSubscriptions.length > 0 ? (
            data.recentSubscriptions.map((s) => (
              <ListRow
                key={s.id}
                primary={s.email ?? 'Unbekannt'}
                secondary={`${s.plan === 'yearly' ? 'Jährlich' : s.plan === 'monthly' ? 'Monatlich' : s.plan === 'manual' ? 'Manuell' : 'Sonstige'} · ${s.status}`}
                trailing={`vor ${formatDistanceToNow(new Date(s.createdAt), { locale: de })}`}
              />
            ))
          ) : (
            <Empty>Noch keine Subscriptions</Empty>
          )}
        </ListCard>
      </section>
    </div>
  );
}

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
          Live-Übersicht aller User, Zahlungen und Aktivität auf Spurig
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-[pulseDot_1.4s_ease-in-out_infinite] rounded-full bg-emerald-400/70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        <span className="text-[11.5px] text-muted-foreground tabular-nums">
          {lastUpdated
            ? `Live · letzter Refresh: ${new Date(lastUpdated).toLocaleTimeString('de-DE')}`
            : 'lädt …'}
        </span>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: typeof Users; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
      <h2 className="text-[14.5px] font-semibold tracking-tight">{children}</h2>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  unit,
}: {
  label: string;
  value: number;
  sub?: string;
  unit?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="tabular-nums text-[28px] font-semibold leading-none tracking-tight">
          <AnimatedNumber value={value} duration={500} formatFn={(n) => Math.round(n).toLocaleString('de-DE')} />
        </span>
        {unit && <span className="text-[14px] text-muted-foreground">{unit}</span>}
      </div>
      {sub && <div className="mt-2 text-[11.5px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function LiveCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub: string;
  accent: 'brand' | 'emerald';
}) {
  const dotClass = accent === 'emerald' ? 'bg-emerald-400' : 'bg-brand';
  const ringClass = accent === 'emerald' ? 'bg-emerald-400/60' : 'bg-brand/60';
  const valueColor = accent === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand';
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-2">
        <span className="relative flex h-1.5 w-1.5">
          <span className={`absolute inline-flex h-full w-full animate-[pulseDot_1.4s_ease-in-out_infinite] rounded-full ${ringClass}`} />
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotClass}`} />
        </span>
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={`tabular-nums text-[40px] font-semibold leading-none tracking-tight ${valueColor}`}>
          <AnimatedNumber value={value} duration={500} formatFn={(n) => Math.round(n).toLocaleString('de-DE')} />
        </span>
      </div>
      <div className="mt-3 text-[11.5px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function ListCard({ title, icon: Icon, children }: { title: string; icon: typeof Users; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
          <h3 className="text-[13.5px] font-semibold tracking-tight">{title}</h3>
        </div>
      </div>
      <ul className="divide-y divide-border/60">{children}</ul>
    </div>
  );
}

function ListRow({ primary, secondary, trailing }: { primary: string; secondary: string; trailing: string }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{primary}</div>
        <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{secondary}</div>
      </div>
      <div className="shrink-0 text-[11.5px] text-muted-foreground tabular-nums">{trailing}</div>
    </li>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <li className="px-4 py-6 text-center text-[12.5px] text-muted-foreground">{children}</li>;
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Minus, MapPin, Smartphone, Activity, ArrowUpRight, Megaphone } from 'lucide-react';
import { AnimatedNumber } from '@/components/shared/animated-number';
import { SERIES_COLORS, AXIS_STYLE, GRID_STYLE, TOOLTIP_STYLE } from '@/lib/chart-config';

export type OverviewRange = '7d' | '14d' | '30d';

export type OverviewData = {
  days: number;
  kpis: {
    scans: number;
    scansTrend: number | null;
    qrScans: number;
    linkClicks: number;
    unique: number;
    uniqueTrend: number | null;
    trendVsPrev: number | null;
    activeCampaigns: number;
    activeCampaignsDelta: number;
  };
  sparklines: {
    scans: number[];
    unique: number[];
  };
  chart: Array<{ t: string; qr: number; link: number; total: number; prev: number }>;
  topCampaigns: Array<{ id: string; name: string; tag: string | null; scans: number; pct: number }>;
  topCountries: Array<{ code: string; label: string; pct: number }>;
  devices: { mobile: number; desktop: number; tablet: number };
  peak: { dayLabel: string; hourRange: string; count: number } | null;
};

type Props = {
  data: Record<OverviewRange, OverviewData>;
  windows: Array<{ key: OverviewRange; label: string; days: number }>;
};

export function OverviewClient({ data, windows }: Props) {
  const [range, setRange] = useState<OverviewRange>('14d');
  const current = data[range];

  return (
    <section
      aria-label="Spurig-Übersicht"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]"
    >
      {/* Header: Title + Live + Toggle */}
      <div className="flex flex-col gap-3 border-b border-border bg-card/30 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="font-semibold tracking-tight text-foreground">Kampagnen</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-muted-foreground">Übersicht</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            role="tablist"
            aria-label="Zeitraum"
            className="inline-flex rounded-full border border-border bg-muted/40 p-0.5 text-[11.5px]"
          >
            {windows.map((w) => {
              const active = range === w.key;
              return (
                <button
                  key={w.key}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setRange(w.key)}
                  className={`rounded-full px-3 py-1 font-medium transition-colors ${
                    active
                      ? 'bg-card text-foreground shadow-[var(--shadow-xs)]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {w.label}
                </button>
              );
            })}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background px-2 py-1 text-[11px] font-medium">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-[pulseDot_1.6s_ease-in-out_infinite] rounded-full bg-emerald-400/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Live
          </span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-2 border-b border-border bg-card p-3 sm:grid-cols-4 sm:gap-3 sm:p-4">
        <KpiCard
          label="Aufrufe gesamt"
          value={current.kpis.scans}
          trend={current.kpis.scansTrend}
          spark={current.sparklines.scans}
          rangeKey={range}
          breakdown={{ qr: current.kpis.qrScans, link: current.kpis.linkClicks }}
        />
        <KpiCard
          label="Eindeutig"
          value={current.kpis.unique}
          trend={current.kpis.uniqueTrend}
          spark={current.sparklines.unique}
          rangeKey={range}
        />
        <TrendCard
          label="Trend"
          deltaPct={current.kpis.trendVsPrev}
          rangeLabel={windows.find((w) => w.key === range)?.label ?? ''}
        />
        <CampaignsKpiCard
          activeCount={current.kpis.activeCampaigns}
          delta={current.kpis.activeCampaignsDelta}
        />
      </div>

      {/* Body: chart + top campaigns */}
      <div className="grid grid-cols-1 sm:grid-cols-5">
        {/* Chart card */}
        <div className="col-span-1 border-b border-border p-4 sm:col-span-3 sm:border-b-0 sm:border-r">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[12.5px] font-medium">Aufruf-Verlauf</div>
              <div className="text-[11px] text-muted-foreground">
                {range === '7d' ? 'Stündlich' : 'Täglich'} · letzte {windows.find((w) => w.key === range)?.label}
              </div>
            </div>
            <div className="hidden items-center gap-3 text-[10.5px] text-muted-foreground sm:flex">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-3 rounded-full" style={{ background: SERIES_COLORS.scans }} />
                QR-Scans
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-3 rounded-full" style={{ background: SERIES_COLORS.clicks }} />
                Link-Klicks
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-3 rounded-full border border-dashed border-muted-foreground/40" />
                Vorperiode
              </span>
            </div>
          </div>
          <div className="h-32 w-full sm:h-40">
            {current.chart.some((p) => p.qr > 0 || p.link > 0 || p.prev > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={current.chart} margin={{ top: 6, right: 6, bottom: 0, left: -16 }}>
                  <CartesianGrid {...GRID_STYLE} vertical={false} />
                  <XAxis dataKey="t" {...AXIS_STYLE} tickFormatter={(v) => formatTick(v, range)} minTickGap={28} />
                  <YAxis {...AXIS_STYLE} allowDecimals={false} width={28} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelFormatter={(v) => formatTooltipLabel(v as string, range)}
                  />
                  <Line
                    type="monotone"
                    dataKey="prev"
                    name="Vorperiode"
                    stroke="var(--muted-foreground)"
                    strokeOpacity={0.4}
                    strokeWidth={1.2}
                    strokeDasharray="3 3"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="qr"
                    name="QR-Scans"
                    stroke={SERIES_COLORS.scans}
                    strokeWidth={1.75}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={600}
                  />
                  <Line
                    type="monotone"
                    dataKey="link"
                    name="Link-Klicks"
                    stroke={SERIES_COLORS.clicks}
                    strokeWidth={1.75}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={600}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[12px] text-muted-foreground">
                Noch keine Aufrufe in diesem Zeitraum
              </div>
            )}
          </div>
        </div>

        {/* Top Campaigns */}
        <div className="col-span-1 p-4 sm:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[12.5px] font-medium">
              <Megaphone className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
              Top-Kampagnen
            </div>
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              Alle <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="space-y-2.5">
            {current.topCampaigns.length > 0 ? (
              current.topCampaigns.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/campaigns/${c.id}`}
                    className="group block rounded-md px-1 py-0.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: SERIES_COLORS.scans }} />
                        <span className="truncate text-[12.5px] font-medium group-hover:text-brand transition-colors">
                          {c.name}
                        </span>
                      </div>
                      <span className="tabular-nums shrink-0 text-[11.5px] font-semibold">
                        {c.scans.toLocaleString('de-DE')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand/70 to-brand transition-[width] duration-700"
                          style={{ width: `${c.pct}%` }}
                        />
                      </div>
                      {c.tag && (
                        <span className="rounded border border-border/60 bg-muted/40 px-1.5 py-[1px] text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                          {c.tag}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <li className="rounded-md border border-dashed border-border/60 px-3 py-4 text-center text-[11.5px] text-muted-foreground">
                Noch keine Kampagnen mit Aufrufen
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Insight strip */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border bg-muted/20 px-5 py-2.5 text-[11px]">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-3 w-3 text-brand" />
          {current.topCountries.length > 0
            ? current.topCountries.map((c) => `${c.label} ${c.pct} %`).join(' · ')
            : 'Keine Geo-Daten'}
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Smartphone className="h-3 w-3 text-brand" />
          {formatDevices(current.devices)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Activity className="h-3 w-3 text-brand" />
          {current.peak
            ? `Peak · ${current.peak.dayLabel} ${current.peak.hourRange}`
            : 'Peak — noch zu wenig Daten'}
        </span>
        <Link
          href={`/analytics?range=${range}`}
          className="ml-auto inline-flex items-center gap-1 font-medium text-brand hover:underline"
        >
          Alle Daten ansehen <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  trend,
  spark,
  rangeKey,
  breakdown,
}: {
  label: string;
  value: number;
  trend: number | null;
  spark: number[];
  rangeKey: OverviewRange;
  breakdown?: { qr: number; link: number };
}) {
  const Icon = trend == null ? Minus : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const color =
    trend == null
      ? 'text-muted-foreground'
      : trend > 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : trend < 0
          ? 'text-red-600 dark:text-red-400'
          : 'text-muted-foreground';

  return (
    <div className="group rounded-lg border border-border/70 bg-card p-3 transition-colors hover:border-brand/30 sm:p-3.5">
      <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="tabular-nums text-[22px] font-semibold leading-none tracking-tight sm:text-[26px]">
          <AnimatedNumber
            key={rangeKey + label}
            value={value}
            duration={600}
            formatFn={(n) => Math.round(n).toLocaleString('de-DE')}
          />
        </span>
        {trend !== null && (
          <span className={`tabular-nums inline-flex items-center gap-0.5 text-[10.5px] font-semibold ${color}`}>
            <Icon className="h-3 w-3" />
            {trend > 0 ? '+' : ''}
            {trend.toFixed(0)}&nbsp;%
          </span>
        )}
      </div>
      {breakdown && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-muted-foreground tabular-nums">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: SERIES_COLORS.scans }} />
            {breakdown.qr.toLocaleString('de-DE')} QR
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: SERIES_COLORS.clicks }} />
            {breakdown.link.toLocaleString('de-DE')} Klicks
          </span>
        </div>
      )}
      <Sparkline data={spark} />
    </div>
  );
}

function TrendCard({
  label,
  deltaPct,
  rangeLabel,
}: {
  label: string;
  deltaPct: number | null;
  rangeLabel: string;
}) {
  const Icon = deltaPct == null ? Minus : deltaPct > 0 ? TrendingUp : deltaPct < 0 ? TrendingDown : Minus;
  const color =
    deltaPct == null
      ? 'text-muted-foreground'
      : deltaPct > 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : deltaPct < 0
          ? 'text-red-600 dark:text-red-400'
          : 'text-muted-foreground';

  return (
    <div className="rounded-lg border border-border/70 bg-card p-3 sm:p-3.5">
      <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className={`tabular-nums text-[22px] font-semibold leading-none tracking-tight sm:text-[26px] ${color}`}>
          {deltaPct === null
            ? '—'
            : `${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(0)} %`}
        </span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="mt-2 text-[10.5px] text-muted-foreground">
        vs. vorherige {rangeLabel}
      </div>
    </div>
  );
}

function CampaignsKpiCard({ activeCount, delta }: { activeCount: number; delta: number }) {
  const deltaText =
    delta > 0 ? `+${delta} neu` : delta < 0 ? `${delta}` : 'unverändert';
  return (
    <div className="rounded-lg border border-border/70 bg-card p-3 sm:p-3.5">
      <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Aktive Kampagnen
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="tabular-nums text-[22px] font-semibold leading-none tracking-tight sm:text-[26px]">
          {activeCount.toLocaleString('de-DE')}
        </span>
      </div>
      <div className="mt-2 text-[10.5px] text-muted-foreground">{deltaText} vs. vorherige Periode</div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(1, ...data);
  const w = 80;
  const h = 20;
  const step = data.length > 1 ? w / (data.length - 1) : 0;
  const points = data.map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`).join(' ');
  const hasData = data.some((v) => v > 0);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-5 w-full" aria-hidden>
      {hasData ? (
        <polyline
          points={points}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="var(--border)" strokeDasharray="3 3" />
      )}
    </svg>
  );
}

function formatDevices(d: { mobile: number; desktop: number; tablet: number }): string {
  const parts: string[] = [];
  if (d.mobile > 0) parts.push(`Mobile ${d.mobile} %`);
  if (d.desktop > 0) parts.push(`Desktop ${d.desktop} %`);
  if (d.tablet > 0) parts.push(`Tablet ${d.tablet} %`);
  return parts.length > 0 ? parts.join(' · ') : 'Keine Daten';
}

function formatTick(v: string, range: OverviewRange): string {
  const d = new Date(v);
  if (range === '7d') {
    // Show day + hour like "Mo 14"
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return `${days[d.getDay()]} ${d.getHours().toString().padStart(2, '0')}`;
  }
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

function formatTooltipLabel(v: string, range: OverviewRange): string {
  const d = new Date(v);
  if (range === '7d') {
    return d.toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

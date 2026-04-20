'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { AnimatedNumber } from '@/components/shared/animated-number';

export type HeroRange = 'today' | '7d' | '30d';

export type HeroStats = {
  total: number;
  qrCount: number;
  linkCount: number;
  uniqueIps: number;
  delta: number | null;
};

type Props = {
  stats: Record<HeroRange, HeroStats>;
  sparklines: Record<HeroRange, number[]>;
  lastScanAt: string | null;
  windows: Array<{ key: HeroRange; label: string; days: number }>;
};

export function HeroKpiClient({ stats, sparklines, lastScanAt, windows }: Props) {
  const [range, setRange] = useState<HeroRange>('7d');
  const current = stats[range];
  const spark = sparklines[range];
  const delta = current.delta;

  const DeltaIcon = delta == null ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor = delta == null
    ? 'text-muted-foreground'
    : delta > 0 ? 'text-emerald-600 dark:text-emerald-400'
    : delta < 0 ? 'text-red-600 dark:text-red-400'
    : 'text-muted-foreground';

  return (
    <section
      aria-label="Scan-Übersicht"
      className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)] sm:p-6"
    >
      {/* Segmented Control */}
      <div
        role="tablist"
        aria-label="Zeitraum"
        className="inline-flex rounded-full border border-border bg-muted/40 p-0.5 text-[12px]"
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

      {/* Big KPI */}
      <div className="mt-5 flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Scans & Klicks
          </div>
          <div className="mt-1 flex items-baseline gap-3 flex-wrap">
            <span className="tabular-nums text-[44px] font-semibold leading-none tracking-[-0.025em] sm:text-[56px]">
              <AnimatedNumber key={range} value={current.total} duration={600} />
            </span>
            {delta !== null && (
              <span className={`inline-flex items-center gap-0.5 text-[13px] font-medium ${deltaColor}`}>
                <DeltaIcon className="h-3.5 w-3.5" />
                {delta > 0 ? '+' : ''}
                {delta.toFixed(0)}%
                <span className="ml-1 font-normal text-muted-foreground">vs. Vorperiode</span>
              </span>
            )}
          </div>
        </div>

        {/* Sparkline */}
        <Sparkline data={spark} />
      </div>

      {/* Supporting Stats */}
      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4 text-[12.5px]">
        <div>
          <dt className="text-muted-foreground">QR-Scans</dt>
          <dd className="tabular-nums mt-0.5 text-[15px] font-semibold">{current.qrCount.toLocaleString('de-DE')}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Link-Klicks</dt>
          <dd className="tabular-nums mt-0.5 text-[15px] font-semibold">{current.linkCount.toLocaleString('de-DE')}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Eindeutig</dt>
          <dd className="tabular-nums mt-0.5 text-[15px] font-semibold">{current.uniqueIps.toLocaleString('de-DE')}</dd>
        </div>
      </dl>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-3 text-[11.5px] text-muted-foreground">
        {lastScanAt ? (
          <span>
            Letzter Scan: <span className="text-foreground">vor {formatDistanceToNow(new Date(lastScanAt), { locale: de })}</span>
          </span>
        ) : (
          <span>Noch keine Scans</span>
        )}
        <Link href="/analytics" className="inline-flex items-center gap-1 font-medium hover:text-brand">
          Details <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </section>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(1, ...data);
  const w = 84;
  const h = 36;
  const step = data.length > 1 ? w / (data.length - 1) : 0;
  const points = data.map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`).join(' ');
  const hasData = data.some((v) => v > 0);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-24 shrink-0" aria-hidden>
      {hasData ? (
        <>
          <polyline
            points={points}
            fill="none"
            stroke="var(--brand)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polygon
            points={`${points} ${w},${h} 0,${h}`}
            fill="var(--brand)"
            fillOpacity="0.12"
          />
        </>
      ) : (
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="var(--border)" strokeDasharray="3 3" />
      )}
    </svg>
  );
}

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  week: number;
  total: number;
  className?: string;
  /** Label für die Gesamt-Zahl (Default: "gesamt"). */
  totalLabel?: string;
  /** Delta in Prozent gegenüber Vorperiode. null = nicht verfügbar, 'new' = vorher leer. */
  trend?: number | 'new' | null;
  /** Anteil am Maximum der aktuellen Liste (0–1). Zeichnet Mini-Bar unter der Zahl. */
  percentOfMax?: number | null;
};

/**
 * Konsistente Scan/Klick-Zahl-Darstellung für Listen.
 * Zeigt 7-Tage-Wert prominent, Gesamt muted, optional Trend-Delta + Mini-Bar
 * als relative Performance-Einordnung.
 */
export function ScanCount({
  week, total, className, totalLabel = 'gesamt',
  trend, percentOfMax,
}: Props) {
  const hasAny = total > 0;
  return (
    <div
      className={cn('flex flex-col gap-1', className)}
      aria-label={`${week} in den letzten 7 Tagen, ${total} ${totalLabel}`}
    >
      <div className="inline-flex items-baseline gap-2 tabular-nums">
        <span
          className={cn(
            'text-[14px] font-semibold',
            hasAny ? 'text-foreground' : 'text-muted-foreground/60',
          )}
        >
          {week.toLocaleString('de-DE')}
        </span>
        <span className="text-[11px] text-muted-foreground/70">
          · {total.toLocaleString('de-DE')} {totalLabel}
        </span>
        {trend !== null && trend !== undefined && <TrendBadge trend={trend} />}
      </div>
      {percentOfMax != null && percentOfMax > 0 && (
        <div className="h-1 w-full max-w-[120px] overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand/80"
            style={{ width: `${Math.round(Math.min(1, Math.max(0, percentOfMax)) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function TrendBadge({ trend }: { trend: number | 'new' }) {
  if (trend === 'new') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-brand">
        Neu
      </span>
    );
  }
  // Threshold: ±10% — kleinere Änderungen werden als stabil dargestellt
  const isUp = trend > 10;
  const isDown = trend < -10;
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const color = isUp
    ? 'text-emerald-600 dark:text-emerald-400'
    : isDown
      ? 'text-red-600 dark:text-red-400'
      : 'text-muted-foreground/70';

  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums', color)}>
      <Icon className="h-3 w-3" strokeWidth={2.2} />
      {trend > 0 ? '+' : ''}
      {trend.toFixed(0)}%
    </span>
  );
}

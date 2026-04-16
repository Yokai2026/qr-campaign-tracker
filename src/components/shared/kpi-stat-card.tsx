import { type LucideIcon, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from './animated-number';

type KPIStatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  hint?: string;
  className?: string;
  /** Percentage change vs. previous period (e.g. 12.5 = +12.5%) */
  delta?: number | null;
  /** Label for the comparison period */
  deltaLabel?: string;
  /** Animate the number counting up */
  animate?: boolean;
};

function DeltaBadge({ delta, label }: { delta: number; label?: string }) {
  const isPositive = delta > 0;
  const isNeutral = delta === 0;
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const colorClass = isNeutral
    ? 'text-muted-foreground'
    : isPositive
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-red-600 dark:text-red-400';

  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[11px] font-medium', colorClass)}>
      <Icon className="h-3 w-3" />
      {isPositive ? '+' : ''}{delta.toFixed(1)}%
      {label && <span className="text-muted-foreground font-normal ml-0.5">{label}</span>}
    </span>
  );
}

export function KPIStatCard({
  label,
  value,
  icon: Icon,
  subtext,
  hint,
  className,
  delta,
  deltaLabel,
  animate = false,
}: KPIStatCardProps) {
  const numericValue = typeof value === 'number' ? value : null;

  return (
    <div className={cn(
      'rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[var(--shadow-md)] cursor-pointer',
      className,
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
          {hint && (
            <span
              title={hint}
              className="inline-flex cursor-help text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
              aria-label={hint}
            >
              <Info className="h-3 w-3" />
            </span>
          )}
        </div>
        <Icon className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <div className="mt-2">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {animate && numericValue !== null ? (
              <AnimatedNumber value={numericValue} />
            ) : (
              value
            )}
          </p>
          {delta != null && <DeltaBadge delta={delta} label={deltaLabel} />}
        </div>
        {subtext && (
          <p className="mt-1 text-[12px] text-muted-foreground">{subtext}</p>
        )}
      </div>
    </div>
  );
}

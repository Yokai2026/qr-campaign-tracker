import { cn } from '@/lib/utils';

type Props = {
  week: number;
  total: number;
  className?: string;
  /** Label für die Gesamt-Zahl (Default: "gesamt"). */
  totalLabel?: string;
};

/**
 * Konsistente Scan/Klick-Zahl-Darstellung für Listen.
 * Links: 7-Tage-Wert prominent. Rechts: Gesamt (muted, kleiner).
 * Mobile-tauglich — tabular-nums, kein Wrap, schlank.
 */
export function ScanCount({ week, total, className, totalLabel = 'gesamt' }: Props) {
  const hasAny = total > 0;
  return (
    <div
      className={cn(
        'inline-flex items-baseline gap-2 tabular-nums',
        className,
      )}
      aria-label={`${week} in den letzten 7 Tagen, ${total} ${totalLabel}`}
    >
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
    </div>
  );
}

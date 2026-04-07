import { type LucideIcon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type KPIStatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  hint?: string;
  className?: string;
};

export function KPIStatCard({
  label,
  value,
  icon: Icon,
  subtext,
  hint,
  className,
}: KPIStatCardProps) {
  return (
    <div className={cn(
      'rounded-lg border border-border bg-card p-4 transition-all duration-150 hover:shadow-sm hover:border-border/80 cursor-pointer',
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
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {subtext && (
          <p className="mt-1 text-[12px] text-muted-foreground">{subtext}</p>
        )}
      </div>
    </div>
  );
}

import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type KPIStatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  className?: string;
};

export function KPIStatCard({
  label,
  value,
  icon: Icon,
  subtext,
  className,
}: KPIStatCardProps) {
  return (
    <div className={cn(
      'rounded-lg border border-border bg-card p-4',
      className,
    )}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <div className="mt-2">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {subtext && (
          <p className="mt-1 text-[12px] text-muted-foreground">{subtext}</p>
        )}
      </div>
    </div>
  );
}

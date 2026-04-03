import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type KPIColor =
  | 'violet'
  | 'blue'
  | 'emerald'
  | 'orange'
  | 'pink'
  | 'indigo';

const COLOR_MAP: Record<KPIColor, { gradient: string; iconBg: string; valueTint: string }> = {
  violet: {
    gradient: 'from-violet-500/8 via-purple-500/4 to-transparent',
    iconBg: 'from-violet-500 to-purple-600',
    valueTint: 'text-violet-950 dark:text-violet-100',
  },
  blue: {
    gradient: 'from-blue-500/8 via-cyan-500/4 to-transparent',
    iconBg: 'from-blue-500 to-cyan-500',
    valueTint: 'text-blue-950 dark:text-blue-100',
  },
  emerald: {
    gradient: 'from-emerald-500/8 via-teal-500/4 to-transparent',
    iconBg: 'from-emerald-500 to-teal-500',
    valueTint: 'text-emerald-950 dark:text-emerald-100',
  },
  orange: {
    gradient: 'from-orange-500/8 via-amber-500/4 to-transparent',
    iconBg: 'from-orange-500 to-amber-500',
    valueTint: 'text-orange-950 dark:text-orange-100',
  },
  pink: {
    gradient: 'from-pink-500/8 via-rose-500/4 to-transparent',
    iconBg: 'from-pink-500 to-rose-500',
    valueTint: 'text-pink-950 dark:text-pink-100',
  },
  indigo: {
    gradient: 'from-indigo-500/8 via-blue-500/4 to-transparent',
    iconBg: 'from-indigo-500 to-blue-600',
    valueTint: 'text-indigo-950 dark:text-indigo-100',
  },
};

type KPIStatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: KPIColor;
  subtext?: string;
  className?: string;
};

export function KPIStatCard({
  label,
  value,
  icon: Icon,
  color,
  subtext,
  className,
}: KPIStatCardProps) {
  const colors = COLOR_MAP[color];

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl bg-card p-5 shadow-card',
      className,
    )}>
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br pointer-events-none',
        colors.gradient,
      )} />
      <div className="relative flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm',
          colors.iconBg,
        )}>
          <Icon className="h-[18px] w-[18px] text-white" />
        </div>
      </div>
      <div className="relative mt-3">
        <p className={cn('text-[28px] font-bold tracking-tight leading-none', colors.valueTint)}>
          {value}
        </p>
        {subtext && (
          <p className="mt-1.5 text-xs text-muted-foreground">{subtext}</p>
        )}
      </div>
    </div>
  );
}

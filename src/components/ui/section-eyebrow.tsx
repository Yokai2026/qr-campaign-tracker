import { cn } from '@/lib/utils';

type Props = {
  children: React.ReactNode;
  className?: string;
  tone?: 'primary' | 'emerald' | 'amber' | 'muted';
  icon?: React.ReactNode;
};

const TONES: Record<NonNullable<Props['tone']>, string> = {
  primary:
    'border-primary/20 bg-primary/[0.06] text-primary dark:border-primary/30 dark:bg-primary/[0.12]',
  emerald:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400',
  amber:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400',
  muted:
    'border-border bg-card text-muted-foreground',
};

export function SectionEyebrow({ children, className, tone = 'primary', icon }: Props) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]',
        TONES[tone],
        className,
      )}
    >
      {icon && <span className="flex h-3 w-3 items-center justify-center">{icon}</span>}
      {children}
    </div>
  );
}

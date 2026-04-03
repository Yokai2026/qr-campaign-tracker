import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, { dot: string; text: string }> = {
  draft:     { dot: 'bg-neutral-400', text: 'text-neutral-600 dark:text-neutral-400' },
  active:    { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
  inactive:  { dot: 'bg-neutral-400', text: 'text-neutral-600 dark:text-neutral-400' },
  paused:    { dot: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-400' },
  completed: { dot: 'bg-blue-500',    text: 'text-blue-700 dark:text-blue-400' },
  archived:  { dot: 'bg-neutral-400', text: 'text-neutral-500 dark:text-neutral-500' },
  expired:   { dot: 'bg-orange-500',  text: 'text-orange-700 dark:text-orange-400' },
  planned:   { dot: 'bg-neutral-400', text: 'text-neutral-600 dark:text-neutral-400' },
  installed: { dot: 'bg-blue-500',    text: 'text-blue-700 dark:text-blue-400' },
  removed:   { dot: 'bg-red-400',     text: 'text-red-600 dark:text-red-400' },
};

const DEFAULT_STYLE = { dot: 'bg-neutral-400', text: 'text-neutral-600' };

type StatusBadgeProps = {
  status: string;
  label: string;
  className?: string;
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || DEFAULT_STYLE;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[12px] font-medium',
        style.text,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      {label}
    </span>
  );
}

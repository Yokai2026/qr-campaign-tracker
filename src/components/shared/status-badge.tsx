import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string }> = {
  draft: { dot: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-600' },
  active: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  inactive: { dot: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-600' },
  paused: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  completed: { dot: 'bg-sky-500', bg: 'bg-sky-50', text: 'text-sky-700' },
  archived: { dot: 'bg-rose-400', bg: 'bg-rose-50', text: 'text-rose-600' },
  expired: { dot: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
  planned: { dot: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-600' },
  installed: { dot: 'bg-sky-500', bg: 'bg-sky-50', text: 'text-sky-700' },
  removed: { dot: 'bg-rose-400', bg: 'bg-rose-50', text: 'text-rose-600' },
};

const DEFAULT_STYLE = { dot: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-600' };

interface StatusBadgeProps {
  status: string;
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || DEFAULT_STYLE;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium',
        style.bg,
        style.text,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      {label}
    </span>
  );
}

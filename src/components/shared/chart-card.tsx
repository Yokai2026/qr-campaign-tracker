import { cn } from '@/lib/utils';

type ChartCardProps = {
  title: string;
  action?: React.ReactNode;
  empty?: boolean;
  emptyText?: string;
  children: React.ReactNode;
  className?: string;
};

export function ChartCard({
  title,
  action,
  empty,
  emptyText = 'Keine Daten vorhanden',
  children,
  className,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-brand/20 hover:shadow-[var(--shadow-sm)]',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="text-[13.5px] font-semibold tracking-tight text-foreground">{title}</h3>
        {action}
      </div>
      <div className="p-4 sm:p-5">
        {empty ? (
          <p className="py-10 text-center text-[13px] text-muted-foreground">
            {emptyText}
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

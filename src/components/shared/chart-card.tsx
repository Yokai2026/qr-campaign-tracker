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
    <div className={cn('rounded-lg border border-border bg-card', className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-[13px] font-medium">{title}</h3>
        {action}
      </div>
      <div className="p-4">
        {empty ? (
          <p className="py-8 text-center text-[13px] text-muted-foreground">
            {emptyText}
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

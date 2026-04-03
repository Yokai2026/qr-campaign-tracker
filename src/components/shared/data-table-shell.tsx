import { cn } from '@/lib/utils';

type DataTableShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function DataTableShell({ children, className }: DataTableShellProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-card',
        className,
      )}
    >
      {children}
    </div>
  );
}

import { cn } from '@/lib/utils';

type DataTableShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function DataTableShell({ children, className }: DataTableShellProps) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-2xl border border-border bg-card',
        className,
      )}
    >
      {children}
    </div>
  );
}

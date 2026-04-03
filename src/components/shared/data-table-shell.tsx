import { cn } from '@/lib/utils';

type DataTableShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function DataTableShell({ children, className }: DataTableShellProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl bg-card shadow-card',
        className,
      )}
    >
      {children}
    </div>
  );
}

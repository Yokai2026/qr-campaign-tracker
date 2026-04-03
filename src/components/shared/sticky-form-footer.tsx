import { cn } from '@/lib/utils';

type StickyFormFooterProps = {
  children: React.ReactNode;
  className?: string;
};

export function StickyFormFooter({ children, className }: StickyFormFooterProps) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t border-border bg-card/95 px-6 py-3 backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}

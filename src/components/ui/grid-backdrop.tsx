import { cn } from '@/lib/utils';

type Props = {
  variant?: 'dots' | 'lines' | 'aura';
  className?: string;
  /** Fade out edges vertically for soft section transitions. */
  fade?: boolean;
};

export function GridBackdrop({ variant = 'dots', className, fade = true }: Props) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0',
        variant === 'dots' && 'bg-dot-grid',
        variant === 'lines' && 'bg-line-grid',
        variant === 'aura' && 'bg-aura',
        fade && 'mask-fade-y',
        className,
      )}
    />
  );
}

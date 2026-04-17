import { type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  /** Optional secondary link below the primary CTA. */
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryLabel,
  secondaryHref,
}: EmptyStateProps) {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-card/40 py-16 text-center">
      {/* Soft corner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--brand), transparent 70%)' }}
      />

      <div className="relative flex h-16 w-16 items-center justify-center">
        {/* Soft pulse ring */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-2xl border border-brand/20 motion-safe:animate-[pulseDot_2.4s_ease-in-out_infinite]"
        />
        {/* Icon badge */}
        <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-[var(--shadow-sm)]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <h3 className="relative mt-5 text-[15px] font-semibold tracking-tight">{title}</h3>
      <p className="relative mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      {actionLabel && actionHref && (
        <div className="relative mt-5 flex flex-col items-center gap-2">
          <Button variant="brand" size="sm" render={<Link href={actionHref} />}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {actionLabel}
          </Button>
          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className="text-[12px] font-medium text-muted-foreground transition-colors hover:text-brand"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

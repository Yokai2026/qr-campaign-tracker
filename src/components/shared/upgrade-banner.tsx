import Link from 'next/link';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

type UpgradeBannerProps = {
  title?: string;
  description?: string;
  requiredTier?: string;
};

export function UpgradeBanner({
  title = 'Upgrade erforderlich',
  description = 'Deine Testphase ist abgelaufen. Wähle einen Plan, um diese Funktion weiter zu nutzen.',
  requiredTier,
}: UpgradeBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-warm/30 bg-warm/[0.06] p-8 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--warm), transparent 70%)' }}
      />
      <div className="relative">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-warm/15 text-warm-foreground">
          <Crown className="h-5 w-5" />
        </span>
        <h3 className="mt-4 text-[17px] font-semibold tracking-tight">{title}</h3>
        <p className="mx-auto mt-1.5 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
          {description}
        </p>
        {requiredTier && (
          <p className="mt-2 text-[12px] font-medium text-warm-foreground">
            Benötigt: {requiredTier}
          </p>
        )}
        <Button className="mt-5" variant="brand" render={<Link href="/pricing" />}>
          Pläne ansehen
        </Button>
      </div>
    </div>
  );
}

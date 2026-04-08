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
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/20">
      <Crown className="mx-auto h-8 w-8 text-amber-500" />
      <h3 className="mt-3 text-[15px] font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-[13px] text-muted-foreground">
        {description}
      </p>
      {requiredTier && (
        <p className="mt-1 text-[12px] font-medium text-amber-600">
          Benötigt: {requiredTier}
        </p>
      )}
      <Button className="mt-4" size="sm" render={<Link href="/pricing" />}>
        Pläne ansehen
      </Button>
    </div>
  );
}

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BillingToggle } from '@/components/landing/billing-toggle';

const INCLUDED = [
  'Unbegrenzt Kampagnen & QR-Codes',
  'Unbegrenzte Scans',
  'Realtime-Dashboard & Alerts',
  'Eigene Domain (Pro)',
  'CSV / PDF / API-Export',
  'EU-Hosting & DSGVO',
  'Team-Zugänge',
  'Deutscher Support',
];

export function PricingTeaser() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-subtle py-28 sm:py-36">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-balance text-[36px] font-semibold leading-[1.08] tracking-[-0.025em] sm:text-[48px]">
          Ein Preis. Alles drin.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-pretty text-[16px] leading-relaxed text-muted-foreground sm:text-[17px]">
          Unbegrenzt Kampagnen, QR-Codes, Scans. Keine Tier-Tricks.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-3xl px-4 sm:px-6">
        <BillingToggle href="/signup" includedFeatures={INCLUDED} />
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Detaillierte Preisübersicht ansehen
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

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
    <section className="relative overflow-hidden border-t border-border bg-subtle py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-balance text-[34px] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[44px]">
          Ein Preis. Alles drin.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-[16.5px]">
          Unbegrenzte Kampagnen, QR-Codes und Scans. Keine Tier-Tricks,
          keine Feature-Paywall, keine überraschende Rechnung.
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

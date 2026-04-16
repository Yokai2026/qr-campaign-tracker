import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { BillingToggle } from '@/components/landing/billing-toggle';
import { SectionHeading } from '@/components/ui/section-heading';

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
    <section className="relative overflow-hidden border-t border-border bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-accent-warm">
            Ein Plan, alles drin
          </p>
          <SectionHeading
            as="h2"
            align="left"
            className="mt-3"
          >
            Faire Preise, keine Tier-Tricks.
          </SectionHeading>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
            Unbegrenzte Kampagnen, QR-Codes und Scans. Keine
            Nutzer-Pakete, keine Feature-Paywall, keine überraschende Rechnung.
          </p>
        </div>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-2">
          {/* Toggle + Price */}
          <div className="order-1 lg:order-2">
            <BillingToggle href="/signup" />
          </div>

          {/* Feature list */}
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl border border-border bg-background/70 p-6 shadow-sm backdrop-blur sm:p-7">
              <div className="mb-4 flex items-center gap-2">
                <div className="text-[13px] font-semibold uppercase tracking-wider text-foreground">Alles drin</div>
                <div className="h-px flex-1 bg-border" />
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Keine Add-ons
                </span>
              </div>
              <ul className="grid grid-cols-1 gap-y-2.5 sm:grid-cols-2 sm:gap-x-6">
                {INCLUDED.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13.5px]">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-warm/15 text-accent-warm">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                    <span className="leading-snug">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-[12px] text-muted-foreground">
                <div className="inline-flex items-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 text-primary"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M12 2 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3Zm-1 15-4-4 1.41-1.41L11 14.17l5.59-5.59L18 10l-7 7Z" />
                  </svg>
                  <span>14 Tage Trial · kein Risiko, keine Kreditkarte</span>
                </div>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
                >
                  Detaillierte Preisübersicht
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

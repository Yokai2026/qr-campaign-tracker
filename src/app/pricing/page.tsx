import Link from 'next/link';
import { ShieldCheck, CreditCard, Undo2 } from 'lucide-react';
import { BillingToggle } from '@/components/landing/billing-toggle';
import { SiteHeader } from '@/components/landing/site-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { FaqSection, FAQ_ITEMS } from '@/components/landing/faq-section';
import { FinalCTA } from '@/components/landing/final-cta';
import { GridBackdrop } from '@/components/ui/grid-backdrop';
import {
  StructuredData,
  softwareApplicationLd,
  faqPageLd,
} from '@/components/seo/structured-data';

export const metadata = {
  title: 'Preise — QR-Code-Tracking ab 4,99 €',
  description:
    'DSGVO-konformes QR-Code-Tracking & Kampagnen-Analytics. Unbegrenzte QR-Codes, eigene Domain, 14 Tage kostenlos testen. Ab 4,99 € / Monat.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Spurig Preise — QR-Code-Tracking ab 4,99 €',
    description:
      'Ein Plan, alles drin. Unbegrenzte QR-Codes, DSGVO-konform, 14 Tage kostenlos.',
    url: 'https://spurig.com/pricing',
  },
};

const FEATURES = [
  'Unbegrenzte QR-Codes & Kurzlinks',
  'Kampagnen-Management',
  'Analytics & Dashboard in Echtzeit',
  'A/B-Testing & Conditional Redirects',
  'CSV & PDF Export',
  'E-Mail-Reports & Scan-Alerts',
  'Eigene Domain (kurz.deinefirma.de)',
  'QR-Design-Studio mit Logo',
];

const TRUST_ROW = [
  { icon: ShieldCheck, label: 'EU-Hosting · DSGVO' },
  { icon: CreditCard, label: 'Zahlung via Stripe' },
  { icon: Undo2, label: 'Jederzeit kündbar' },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData id="ld-software-application" data={softwareApplicationLd} />
      <StructuredData id="ld-faq-page" data={faqPageLd(FAQ_ITEMS)} />
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <GridBackdrop variant="dots" className="h-[480px] opacity-30" fade />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 50% 25%, oklch(0.64 0.10 185 / 0.08), transparent 65%), radial-gradient(ellipse 40% 35% at 50% 75%, oklch(0.74 0.10 38 / 0.04), transparent 70%)',
            }}
          />

          <div className="relative mx-auto max-w-5xl px-4 pt-24 pb-12 text-center sm:px-6 sm:pt-32 sm:pb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand">
              Einführungspreis · über 50 % günstiger
            </span>
            <h1 className="mt-6 text-balance font-heading text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[56px] md:text-[64px]">
              Ein Plan —{' '}
              <span className="text-muted-foreground font-normal">alles drin.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-[16.5px] leading-relaxed text-muted-foreground sm:text-[18px]">
              Unbegrenzte Kampagnen, QR-Codes und Scans. Keine Nutzerpakete,
              keine Feature-Paywall. 14 Tage kostenlos — ohne Kreditkarte.
            </p>

            <ul className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] text-muted-foreground">
              {TRUST_ROW.map((t) => {
                const Icon = t.icon;
                return (
                  <li key={t.label} className="inline-flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-brand" aria-hidden />
                    {t.label}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Billing toggle + price card */}
        <section className="relative pb-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <BillingToggle href="/signup" includedFeatures={FEATURES} />

            <p className="mx-auto mt-10 max-w-md text-center text-[12.5px] leading-relaxed text-muted-foreground">
              Alle Preise inkl. USt. Sichere Abrechnung über Stripe.
              DSGVO-konform. Deine Daten bleiben in der EU.
            </p>

            <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 text-[12.5px] text-muted-foreground">
              <span>Noch Fragen zur Abrechnung?</span>
              <Link href="#faq" className="font-medium text-foreground transition-colors hover:text-brand">
                Direkt zu den Antworten
              </Link>
            </div>
          </div>
        </section>

        <FaqSection />
        <FinalCTA />
      </main>

      <SiteFooter />
    </div>
  );
}

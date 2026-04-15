import Link from 'next/link';
import { Sparkles, ShieldCheck, CreditCard, Undo2 } from 'lucide-react';
import { BillingToggle } from '@/components/landing/billing-toggle';
import { SiteHeader } from '@/components/landing/site-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { FaqSection, FAQ_ITEMS } from '@/components/landing/faq-section';
import { FinalCTA } from '@/components/landing/final-cta';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';
import { SectionHeading } from '@/components/ui/section-heading';
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
          <GridBackdrop variant="aura" className="h-[460px]" fade />
          <GridBackdrop variant="dots" className="h-[420px] opacity-60" fade />

          <div className="relative mx-auto max-w-5xl px-4 pt-20 pb-10 text-center sm:px-6 sm:pt-24 sm:pb-14">
            <SectionEyebrow tone="amber" icon={<Sparkles className="h-3 w-3" />}>
              Einführungspreis — über 50 % günstiger
            </SectionEyebrow>
            <SectionHeading
              as="h1"
              className="mt-5"
              accent={<>alles drin.</>}
            >
              Ein Plan,
            </SectionHeading>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-[16px] leading-relaxed text-muted-foreground sm:text-[17px]">
              Unbegrenzte Kampagnen, QR-Codes und Scans. Keine Nutzerpakete,
              keine Feature-Paywall. 14 Tage kostenlos — ohne Kreditkarte.
            </p>

            <ul className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-muted-foreground">
              {TRUST_ROW.map((t) => {
                const Icon = t.icon;
                return (
                  <li key={t.label} className="inline-flex items-center gap-1.5">
                    <Icon className="h-3 w-3 text-primary" aria-hidden />
                    {t.label}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Billing toggle + price card */}
        <section className="relative pb-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <BillingToggle href="/signup" includedFeatures={FEATURES} />

            <p className="mx-auto mt-10 max-w-md text-center text-[12px] leading-relaxed text-muted-foreground">
              Alle Preise inkl. USt. Sichere Abrechnung über Stripe.
              DSGVO-konform. Deine Daten bleiben in der EU.
            </p>

            <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 text-[12px] text-muted-foreground">
              <span className="font-display italic">
                Noch Fragen zur Abrechnung?
              </span>
              <Link href="#faq" className="font-medium text-primary hover:underline">
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

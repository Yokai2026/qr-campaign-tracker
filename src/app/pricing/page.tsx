import Link from 'next/link';
import { QrCode, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BillingToggle } from '@/components/landing/billing-toggle';

const features = [
  'Unbegrenzte QR-Codes & Kurzlinks',
  'Kampagnen-Management',
  'Analytics & Dashboard in Echtzeit',
  'A/B-Testing & Conditional Redirects',
  'CSV & PDF Export',
  'E-Mail-Reports & Scan-Alerts',
  'Eigene Domain (kurz.deinefirma.de)',
  'QR-Design-Studio mit Logo',
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[4px] bg-neutral-900">
              <QrCode className="h-3 w-3 text-white/70" />
            </div>
            <span className="text-[13px] font-semibold">Spurig</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/login" />}>
              Anmelden
            </Button>
            <Button size="sm" render={<Link href="/signup" />}>
              Registrieren
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="mx-auto max-w-5xl px-4 pt-14 pb-10 text-center sm:px-6 sm:pt-20 sm:pb-12">
        <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[12px] font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <Sparkles className="h-3 w-3" />
          Einführungspreis — über 50 % günstiger
        </div>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Ein Plan. Alles drin.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
          14 Tage kostenlos testen. Keine Kreditkarte. Jederzeit kündbar.
        </p>
      </div>

      {/* Billing Toggle + Preis-Card mit Features inline */}
      <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <BillingToggle href="/signup" includedFeatures={features} />
      </div>

      {/* Footer note */}
      <div className="border-t border-border py-8 text-center">
        <p className="mx-auto max-w-md px-4 text-[12px] text-muted-foreground">
          Alle Preise inkl. USt. Sichere Abrechnung über Stripe.
          DSGVO-konform. Deine Daten bleiben in der EU.
        </p>
      </div>
    </div>
  );
}

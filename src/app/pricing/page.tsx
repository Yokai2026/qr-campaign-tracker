import Link from 'next/link';
import { Check, X, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

const tiers = [
  {
    name: 'Free Trial',
    price: '0',
    period: '14 Tage',
    description: 'Lerne Spurig kennen — voller Zugang für 2 Wochen.',
    cta: 'Kostenlos starten',
    ctaHref: '/signup',
    highlight: false,
    features: [
      { text: 'Unbegrenzte QR-Codes & Kurzlinks', included: true },
      { text: 'Kampagnen-Management', included: true },
      { text: 'Analytics & Dashboard', included: true },
      { text: 'CSV & PDF Export', included: true },
      { text: 'E-Mail-Reports', included: true },
      { text: 'Eigene Domain', included: false },
    ],
  },
  {
    name: 'Standard',
    price: '12,99',
    period: 'pro Monat',
    description: 'Für Teams und Organisationen mit laufenden Kampagnen.',
    cta: 'Standard wählen',
    ctaHref: '/signup?plan=standard',
    highlight: true,
    features: [
      { text: 'Unbegrenzte QR-Codes & Kurzlinks', included: true },
      { text: 'Kampagnen-Management', included: true },
      { text: 'Analytics & Dashboard', included: true },
      { text: 'CSV & PDF Export', included: true },
      { text: 'E-Mail-Reports', included: true },
      { text: 'Eigene Domain', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '14,99',
    period: 'pro Monat',
    description: 'Eigene Domain für maximale Markenidentität.',
    cta: 'Pro wählen',
    ctaHref: '/signup?plan=pro',
    highlight: false,
    features: [
      { text: 'Unbegrenzte QR-Codes & Kurzlinks', included: true },
      { text: 'Kampagnen-Management', included: true },
      { text: 'Analytics & Dashboard', included: true },
      { text: 'CSV & PDF Export', included: true },
      { text: 'E-Mail-Reports', included: true },
      { text: 'Eigene Domain (z. B. kurz.deinefirma.de)', included: true },
    ],
  },
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
      <div className="mx-auto max-w-5xl px-4 pt-16 pb-12 text-center sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Einfache, transparente Preise
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-[15px] text-muted-foreground">
          14 Tage kostenlos testen. Keine Kreditkarte nötig.
          Jederzeit kündbar.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto grid max-w-5xl gap-6 px-4 pb-20 sm:px-6 lg:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative flex flex-col rounded-xl border p-6 ${
              tier.highlight
                ? 'border-primary bg-card shadow-lg ring-1 ring-primary/20'
                : 'border-border bg-card'
            }`}
          >
            {tier.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground">
                Beliebt
              </div>
            )}

            <div>
              <h2 className="text-[15px] font-semibold">{tier.name}</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">{tier.description}</p>
            </div>

            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">
                {tier.price === '0' ? 'Kostenlos' : `€${tier.price}`}
              </span>
              {tier.price !== '0' && (
                <span className="text-[13px] text-muted-foreground">/ Monat</span>
              )}
            </div>

            <Button
              className="mt-5 w-full"
              variant={tier.highlight ? 'default' : 'outline'}
              render={<Link href={tier.ctaHref} />}
            >
              {tier.cta}
            </Button>

            <ul className="mt-6 flex-1 space-y-2.5">
              {tier.features.map((f) => (
                <li key={f.text} className="flex items-start gap-2 text-[13px]">
                  {f.included ? (
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : (
                    <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                  )}
                  <span className={f.included ? '' : 'text-muted-foreground/60'}>{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="border-t border-border py-8 text-center">
        <p className="text-[12px] text-muted-foreground">
          Alle Preise inkl. USt. Sichere Abrechnung ueber Stripe.
          DSGVO-konform. Deine Daten bleiben in der EU.
        </p>
      </div>
    </div>
  );
}

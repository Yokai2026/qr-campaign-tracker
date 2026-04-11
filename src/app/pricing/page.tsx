import Link from 'next/link';
import { Check, QrCode, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  'Unbegrenzte QR-Codes & Kurzlinks',
  'Kampagnen-Management',
  'Analytics & Dashboard',
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
      <div className="mx-auto max-w-5xl px-4 pt-16 pb-12 text-center sm:px-6">
        <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[12px] font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <Sparkles className="h-3 w-3" />
          Einführungspreis — über 50 % günstiger
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Einfache, transparente Preise
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-[15px] text-muted-foreground">
          14 Tage kostenlos testen. Keine Kreditkarte nötig.
          Jederzeit kündbar.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto grid max-w-3xl gap-6 px-4 pb-20 sm:px-6 md:grid-cols-2">
        {/* Monatlich */}
        <div className="relative flex flex-col rounded-xl border border-border bg-card p-6">
          <div>
            <h2 className="text-[15px] font-semibold">Monatlich</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">Volle Flexibilität, monatlich kündbar.</p>
          </div>
          <div className="mt-5">
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] text-muted-foreground line-through decoration-2">12,99 €</span>
              <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                −54 %
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">5,99 €</span>
              <span className="text-[13px] text-muted-foreground">/ Monat</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Einführungspreis</p>
          </div>
          <Button className="mt-5 w-full" variant="outline" render={<Link href="/signup?plan=monthly" />}>
            14 Tage kostenlos testen
          </Button>
        </div>

        {/* Jährlich */}
        <div className="relative flex flex-col rounded-xl border border-primary bg-card p-6 shadow-lg ring-1 ring-primary/20">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground">
            Beliebtester Plan · 16 % sparen
          </div>
          <div>
            <h2 className="text-[15px] font-semibold">Jährlich</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">Ein Jahr buchen, jeden Monat sparen.</p>
          </div>
          <div className="mt-5">
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] text-muted-foreground line-through decoration-2">12,99 €</span>
              <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                −62 %
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">4,99 €</span>
              <span className="text-[13px] text-muted-foreground">/ Monat</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">59,88 € jährlich abgerechnet · Einführungspreis</p>
          </div>
          <Button className="mt-5 w-full" render={<Link href="/signup?plan=yearly" />}>
            14 Tage kostenlos testen
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <h3 className="mb-4 text-center text-[14px] font-semibold">Alle Features in beiden Plänen enthalten</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-[13px]">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer note */}
      <div className="border-t border-border py-8 text-center">
        <p className="text-[12px] text-muted-foreground">
          Alle Preise inkl. USt. Sichere Abrechnung über Stripe.
          DSGVO-konform. Deine Daten bleiben in der EU.
        </p>
      </div>
    </div>
  );
}

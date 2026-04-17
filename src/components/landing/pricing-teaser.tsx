import Link from 'next/link';
import { ArrowRight, ShieldCheck, Wallet, Sparkles } from 'lucide-react';
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

const REASSURANCE = [
  {
    icon: Sparkles,
    title: '14 Tage gratis',
    body: 'Voller Funktionsumfang. Keine Karte beim Start.',
  },
  {
    icon: Wallet,
    title: 'Monatlich kündbar',
    body: 'Kein Lock-in, kein Kleingedrucktes. Ein Klick im Dashboard.',
  },
  {
    icon: ShieldCheck,
    title: 'Faire Abrechnung',
    body: 'Trial endet automatisch. Wir buchen nie ohne deine aktive Bestätigung ab.',
  },
];

export function PricingTeaser() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-subtle py-28 sm:py-36">
      {/* Subtle warm + brand background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 0%, oklch(0.74 0.13 38 / 0.06), transparent 65%), radial-gradient(ellipse 60% 50% at 50% 100%, oklch(0.66 0.13 185 / 0.07), transparent 60%)',
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        {/* Urgency pill */}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-warm/30 bg-warm/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-warm-foreground">
          <Sparkles className="h-3 w-3" />
          Einführungspreis · gilt bis Ende 2026
        </span>

        <h2 className="mt-5 text-balance text-[36px] font-semibold leading-[1.08] tracking-[-0.025em] sm:text-[48px]">
          Ein Preis. Alles drin.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-pretty text-[16px] leading-relaxed text-muted-foreground sm:text-[17px]">
          Unbegrenzt Kampagnen, QR-Codes, Scans. Keine Tier-Tricks.
        </p>
      </div>

      <div className="relative mx-auto mt-12 max-w-3xl px-4 sm:px-6">
        <BillingToggle href="/signup" includedFeatures={INCLUDED} />
      </div>

      {/* Reassurance row — 3 trust signals below price card */}
      <div className="relative mx-auto mt-10 max-w-3xl px-4 sm:px-6">
        <ul className="grid gap-3 sm:grid-cols-3">
          {REASSURANCE.map((r) => (
            <li
              key={r.title}
              className="group flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-card hover:shadow-[var(--shadow-sm)]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand transition-all duration-300 group-hover:scale-110 group-hover:bg-brand/15">
                <r.icon className="h-4 w-4" />
              </span>
              <div>
                <div className="text-[13px] font-semibold tracking-tight text-foreground">
                  {r.title}
                </div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                  {r.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mt-10 text-center">
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

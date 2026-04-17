import Link from 'next/link';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GridBackdrop } from '@/components/ui/grid-backdrop';
import { HeroDashboardMock } from './hero-dashboard-mock';

const TRUST = [
  'Keine Kreditkarte',
  'DSGVO · EU-Hosting',
  'Ab 4,99 € / Monat',
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Layered backdrop — Stripe/Vercel-style gradient orbs */}
      <GridBackdrop variant="dots" className="h-[680px] opacity-30" fade />

      {/* Subtle brand glow — single orb, static, GPU-composited */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[600px] w-[900px] -translate-x-1/2 transform-gpu rounded-full opacity-60 blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse 50% 60% at 50% 40%, oklch(0.64 0.10 185 / 0.14), transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 pt-28 pb-16 text-center sm:px-6 sm:pt-36 sm:pb-24">
        {/* Announcement */}
        <div className="mx-auto mb-10 inline-flex items-center gap-2.5 rounded-full border border-border bg-card py-1.5 pl-2 pr-4 text-[12.5px] font-medium text-foreground shadow-[var(--shadow-sm)]">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand">
            <Sparkles className="h-2.5 w-2.5" />
            Neu
          </span>
          <span className="hidden text-muted-foreground sm:inline">
            Einführungspreis bis Ende 2026
          </span>
          <span className="text-muted-foreground sm:hidden">Einführungspreis</span>
        </div>

        {/* Headline — größer, dominanter */}
        <h1 className="font-heading text-balance text-[46px] font-semibold leading-[1.0] tracking-[-0.035em] sm:text-[68px] md:text-[84px]">
          QR-Codes, die zeigen,{' '}
          <span className="font-normal text-foreground/55 dark:text-foreground/50">
            was wirklich funktioniert.
          </span>
        </h1>

        {/* Subline — kürzer, konkret, mit Wirkung */}
        <p className="mx-auto mt-6 max-w-xl text-pretty text-[18px] leading-[1.5] text-muted-foreground sm:text-[20px]">
          Tracke jeden Scan in Echtzeit. Ohne Cookies, ohne Banner,
          ohne Datenabfluss in die USA.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-3">
          <Button
            size="lg"
            variant="brand"
            render={<Link href="/signup" />}
            className="group min-w-[260px]"
          >
            Jetzt 14 Tage gratis starten
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<Link href="#so-funktioniert" />}
            className="min-w-[180px]"
          >
            So funktioniert&apos;s
          </Button>
        </div>

        {/* Inline-Hint statt Trust-Row */}
        <p className="mt-5 text-[12.5px] text-muted-foreground">
          Erste Scans in unter <span className="font-semibold text-foreground">30 Sekunden</span> · Kein Zahlungsmittel nötig
        </p>

        {/* Trust row */}
        <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] text-muted-foreground">
          {TRUST.map((t) => (
            <li key={t} className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3 text-brand" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <HeroDashboardMock />
    </section>
  );
}

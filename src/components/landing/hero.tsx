import Link from 'next/link';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GridBackdrop } from '@/components/ui/grid-backdrop';
import { HeroDashboardMock } from './hero-dashboard-mock';

const TRUST = [
  'Keine Kreditkarte nötig',
  'Jederzeit kündbar',
  'Hosting in der EU',
  'Ab 4,99 € / Monat',
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Dot grid + subtle radial glow for depth */}
      <GridBackdrop variant="dots" className="h-[560px] opacity-50" fade />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 20%, oklch(0.28 0.06 265 / 0.06), transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 pt-24 pb-14 text-center sm:px-6 sm:pt-32 sm:pb-22">
        {/* Announcement */}
        <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-accent-warm/25 bg-accent-warm/[0.06] py-1.5 pl-1.5 pr-4 text-[12px] font-medium text-foreground shadow-[var(--shadow-sm)] backdrop-blur">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-warm px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent-warm-foreground">
            <Sparkles className="h-2.5 w-2.5" />
            Neu
          </span>
          <span className="hidden sm:inline">
            DSGVO-konform · Einführungspreis bis Ende 2026
          </span>
          <span className="sm:hidden">DSGVO-konform · Einführungspreis</span>
        </div>

        {/* Headline */}
        <h1 className="font-heading text-balance text-[42px] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-[60px] md:text-[74px]">
          QR-Codes, die zeigen,
          <br />
          <span className="text-muted-foreground">was wirklich funktioniert.</span>
        </h1>

        {/* Subline — outcome-first, short */}
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-[16px] leading-[1.55] text-muted-foreground sm:text-[18px]">
          Messe in Echtzeit, welches Plakat, welcher Flyer oder welche Visitenkarte
          Scans bringt. DSGVO-konform, ohne Cookies, Hosting in der EU.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Button
            size="lg"
            render={<Link href="/signup" />}
            className="group min-w-[240px] shadow-[var(--shadow-lg)]"
          >
            14 Tage kostenlos testen
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<Link href="#so-funktioniert" />}
            className="min-w-[200px]"
          >
            So funktioniert&apos;s
          </Button>
        </div>

        {/* Trust row */}
        <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-muted-foreground">
          {TRUST.map((t, i) => (
            <li key={t} className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3 text-accent-warm" aria-hidden />
              {t}
              {i < TRUST.length - 1 && (
                <span className="ml-4 hidden h-3 w-px bg-border sm:inline-block" aria-hidden />
              )}
            </li>
          ))}
        </ul>
      </div>

      <HeroDashboardMock />
    </section>
  );
}

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
      {/* Layered backdrop — aura + dot-grid */}
      <GridBackdrop variant="aura" className="h-[640px]" fade />
      <GridBackdrop variant="dots" className="h-[560px] opacity-60" fade />

      <div className="relative mx-auto max-w-5xl px-4 pt-20 pb-12 text-center sm:px-6 sm:pt-28 sm:pb-20">
        {/* Announcement */}
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 py-1 pl-1 pr-3 text-[12px] font-medium text-muted-foreground shadow-sm backdrop-blur">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/[0.08] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
            <Sparkles className="h-2.5 w-2.5" />
            Neu
          </span>
          <span className="hidden sm:inline">
            DSGVO-konform · Einführungspreis bis Ende 2026
          </span>
          <span className="sm:hidden">DSGVO-konform · Einführungspreis</span>
        </div>

        {/* Headline — sans-bold + serif italic accent */}
        <h1 className="text-balance text-[40px] font-semibold leading-[1.02] tracking-[-0.025em] sm:text-[58px] md:text-[68px]">
          QR-Code-Tracking,
          <br />
          <span className="font-display font-normal italic tracking-[-0.01em] text-gradient-violet">
            das dir wirklich gehört.
          </span>
        </h1>

        {/* Subline — ergebnisorientiert */}
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-[16px] leading-[1.55] text-muted-foreground sm:text-[18px]">
          Miss, welches Plakat, welcher Flyer und welche Visitenkarte wirklich
          Scans bringt — in Echtzeit, ohne Cookies, ohne Google Analytics. Deine
          Daten bleiben in der EU. Und bei dir.
        </p>

        {/* CTAs */}
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            render={<Link href="/signup" />}
            className="group min-w-[220px] shadow-[var(--shadow-md)]"
          >
            14 Tage kostenlos testen
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button
            size="lg"
            variant="ghost"
            render={<Link href="#so-funktioniert" />}
            className="min-w-[180px] text-muted-foreground hover:text-foreground"
          >
            So funktioniert&apos;s
          </Button>
        </div>

        {/* Trust row */}
        <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-muted-foreground">
          {TRUST.map((t, i) => (
            <li key={t} className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3 text-emerald-500" aria-hidden />
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

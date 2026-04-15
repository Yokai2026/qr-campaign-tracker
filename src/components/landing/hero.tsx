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
      {/* Subtle dot-grid only — no aura, no violet */}
      <GridBackdrop variant="dots" className="h-[560px] opacity-50" fade />

      <div className="relative mx-auto max-w-5xl px-4 pt-20 pb-12 text-center sm:px-6 sm:pt-28 sm:pb-20">
        {/* Announcement */}
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 text-[12px] font-medium text-muted-foreground shadow-sm">
          <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-background">
            <Sparkles className="h-2.5 w-2.5" />
            Neu
          </span>
          <span className="hidden sm:inline">
            DSGVO-konform · Einführungspreis bis Ende 2026
          </span>
          <span className="sm:hidden">DSGVO-konform · Einführungspreis</span>
        </div>

        {/* Headline — sans only, pure weight hierarchy */}
        <h1 className="text-balance text-[40px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[58px] md:text-[72px]">
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

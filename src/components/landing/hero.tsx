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
      {/* Soft warm + brand glow — depth without darkness */}
      <GridBackdrop variant="dots" className="h-[600px] opacity-40" fade />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 15%, oklch(0.66 0.13 185 / 0.10), transparent 65%), radial-gradient(ellipse 50% 40% at 50% 85%, oklch(0.74 0.13 38 / 0.06), transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 pt-28 pb-16 text-center sm:px-6 sm:pt-36 sm:pb-24">
        {/* Announcement — softer, friendlier */}
        <div className="mx-auto mb-10 inline-flex items-center gap-2.5 rounded-full border border-border bg-card/80 py-1.5 pl-2 pr-4 text-[12.5px] font-medium text-foreground shadow-[var(--shadow-sm)] backdrop-blur">
          <span className="inline-flex items-center gap-1 rounded-full bg-warm/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-warm-foreground">
            <Sparkles className="h-2.5 w-2.5" />
            Neu
          </span>
          <span className="hidden text-muted-foreground sm:inline">
            Einführungspreis bis Ende 2026
          </span>
          <span className="text-muted-foreground sm:hidden">Einführungspreis</span>
        </div>

        {/* Headline — kürzer, klarer */}
        <h1 className="font-heading text-balance text-[44px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[60px] md:text-[72px]">
          QR-Codes, die zeigen,{' '}
          <span className="text-muted-foreground font-normal">
            was wirklich funktioniert.
          </span>
        </h1>

        {/* Subline — konkret, mit den drei Hauptvorteilen */}
        <p className="mx-auto mt-7 max-w-xl text-pretty text-[17px] leading-[1.55] text-muted-foreground sm:text-[18.5px]">
          Sieh live, welches Plakat, welcher Flyer oder welche Visitenkarte dir
          wirklich Kunden bringt. Ohne Cookies, ohne Banner, gehostet in
          Frankfurt.
        </p>

        {/* CTAs — bigger, bolder, livelier */}
        <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-3">
          <Button
            size="lg"
            variant="brand"
            render={<Link href="/signup" />}
            className="group min-w-[260px]"
          >
            14 Tage kostenlos testen
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

        {/* Trust row — 3 Items, dezent */}
        <ul className="mx-auto mt-9 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] text-muted-foreground">
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

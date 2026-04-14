'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Billing = 'monthly' | 'yearly';

type Props = {
  /** CTA-Ziel (Signup oder Pricing-Page). Plan wird als Query-Param angehängt. */
  href?: string;
  /** Hervorgehobener CTA (voll ausgefüllt) oder sekundär (outline). */
  ctaVariant?: 'default' | 'outline';
  /** Optional: Mini-Feature-Liste unterhalb der Preis-Anzeige. */
  includedFeatures?: string[];
};

const PLANS: Record<Billing, {
  price: number;
  strike: number;
  monthlyHint: string;
}> = {
  monthly: {
    price: 5.99,
    strike: 12.99,
    monthlyHint: 'Monatlich abgerechnet · jederzeit kündbar',
  },
  yearly: {
    price: 4.99,
    strike: 12.99,
    monthlyHint: '59,88 € jährlich · 16 % Ersparnis gegenüber Monatlich',
  },
};

const fmt = (n: number) => n.toFixed(2).replace('.', ',');

export function BillingToggle({ href = '/signup', ctaVariant = 'default', includedFeatures }: Props) {
  const [billing, setBilling] = useState<Billing>('yearly');
  const plan = PLANS[billing];

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Pill-Toggle mit gleitendem Indikator */}
      <div
        role="radiogroup"
        aria-label="Abrechnungsintervall"
        className="relative mx-auto mb-6 grid grid-cols-2 rounded-full border border-border bg-muted/60 p-1 text-[13px] font-medium"
      >
        <div
          aria-hidden
          className={cn(
            'absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-background shadow-sm ring-1 ring-border/60 transition-transform duration-300 ease-out',
            billing === 'yearly' && 'translate-x-[calc(100%+0.125rem)]',
          )}
        />
        <button
          type="button"
          role="radio"
          aria-checked={billing === 'monthly'}
          onClick={() => setBilling('monthly')}
          className={cn(
            'relative z-10 rounded-full px-4 py-2 transition-colors active:scale-[0.98]',
            billing === 'monthly' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Monatlich
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={billing === 'yearly'}
          onClick={() => setBilling('yearly')}
          className={cn(
            'relative z-10 flex items-center justify-center gap-1.5 rounded-full px-4 py-2 transition-colors active:scale-[0.98]',
            billing === 'yearly' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Jährlich
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors',
              billing === 'yearly'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground',
            )}
          >
            −16 %
          </span>
        </button>
      </div>

      {/* Preis-Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Spurig Pro
          </div>

          <div className="mt-3 flex items-baseline justify-center gap-2">
            <span className="text-[14px] text-muted-foreground line-through decoration-[1.5px]">
              {fmt(plan.strike)} €
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              Einführungspreis
            </span>
          </div>

          <div className="mt-1 flex items-baseline justify-center gap-1 tabular-nums">
            <span
              key={billing}
              className="text-[56px] font-bold leading-none tracking-tight [animation:fadeIn_250ms_ease-out]"
            >
              {fmt(plan.price)}
            </span>
            <span className="text-[20px] font-semibold">€</span>
            <span className="text-[13px] text-muted-foreground">/ Monat</span>
          </div>

          <p
            key={billing + '-hint'}
            className="mt-3 text-[12px] text-muted-foreground [animation:fadeIn_250ms_ease-out]"
          >
            {plan.monthlyHint}
          </p>
        </div>

        <div className="mt-6">
          <Button
            size="lg"
            variant={ctaVariant}
            className="w-full"
            render={<Link href={`${href}?plan=${billing}`} />}
          >
            14 Tage kostenlos testen
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Keine Kreditkarte nötig · Jederzeit kündbar
          </p>
        </div>

        {includedFeatures && includedFeatures.length > 0 && (
          <ul className="mt-6 space-y-2 border-t border-border pt-5">
            {includedFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[13px]">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

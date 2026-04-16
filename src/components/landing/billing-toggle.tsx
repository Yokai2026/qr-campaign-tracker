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
  /** Hervorgehobener CTA (Brand-Teal, default) oder sekundär (outline). */
  ctaVariant?: 'default' | 'brand' | 'outline';
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

export function BillingToggle({ href = '/signup', ctaVariant = 'brand', includedFeatures }: Props) {
  const [billing, setBilling] = useState<Billing>('yearly');
  const plan = PLANS[billing];

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* Single price card — price is the hero */}
      <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-md)] sm:p-10">
        {/* Toggle */}
        <div
          role="radiogroup"
          aria-label="Abrechnungsintervall"
          className="relative mx-auto grid w-full max-w-[280px] grid-cols-2 rounded-full border border-border bg-muted/60 p-1 text-[13px] font-medium"
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
                  ? 'bg-brand/15 text-brand'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {billing === 'yearly' ? 'Spare 12 €' : '−16 %'}
            </span>
          </button>
        </div>

        {/* Plan label */}
        <div className="mt-8 text-center">
          <div className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Spurig — alles drin
          </div>
        </div>

        {/* Price — the hero */}
        <div className="mt-3 flex items-baseline justify-center gap-1.5 tabular-nums">
          <span
            key={billing}
            className="text-[72px] font-semibold leading-none tracking-[-0.04em] text-foreground [animation:priceIn_280ms_cubic-bezier(0.16,1,0.3,1)]"
          >
            {fmt(plan.price)}&nbsp;€
          </span>
        </div>

        {/* Per-month + strike */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
          <span>pro Monat</span>
          <span className="h-1 w-1 rounded-full bg-border" aria-hidden />
          <span className="tabular-nums line-through decoration-[1px]">
            {fmt(plan.strike)}&nbsp;€
          </span>
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
            Einführungspreis
          </span>
        </div>

        <p
          key={billing + '-hint'}
          className="mt-5 text-center text-[12.5px] text-muted-foreground [animation:fadeIn_250ms_ease-out]"
        >
          {plan.monthlyHint}
        </p>

        {/* CTA — directly attached to price */}
        <div className="mt-7">
          <Button
            size="lg"
            variant={ctaVariant}
            className="h-12 w-full text-[15px]"
            render={<Link href={`${href}?plan=${billing}`} />}
          >
            14 Tage kostenlos testen
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="mt-3 text-center text-[12px] text-muted-foreground">
            Keine Kreditkarte nötig · Jederzeit kündbar
          </p>
        </div>

        {/* Feature list — under the price */}
        {includedFeatures && includedFeatures.length > 0 && (
          <ul className="mt-8 grid grid-cols-1 gap-y-2.5 border-t border-border pt-7 sm:grid-cols-2 sm:gap-x-6">
            {includedFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[13.5px] text-foreground">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/12 text-brand">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
                <span className="leading-snug">{f}</span>
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
        @keyframes priceIn {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

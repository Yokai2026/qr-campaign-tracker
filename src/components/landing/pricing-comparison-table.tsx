import { Check, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type Cell = boolean | string;

type Competitor = {
  key: 'bitly' | 'rebrandly' | 'spurig';
  name: string;
  /** Gunstigster Plan mit relevantem Feature-Set in der jeweiligen Liga. */
  monthlyPrice: string;
  /** Hinweis unter dem Preis (z.B. "Standard-Plan", "ab"). */
  priceNote: string;
  highlight?: boolean;
};

type Row = {
  label: string;
  values: Record<Competitor['key'], Cell>;
};

const COMPETITORS: Competitor[] = [
  {
    key: 'bitly',
    name: 'Bitly',
    monthlyPrice: '35 $',
    priceNote: 'Core · 1.500 Codes/Mo',
  },
  {
    key: 'rebrandly',
    name: 'Rebrandly',
    monthlyPrice: '29 $',
    priceNote: 'Starter · 5.000 Klicks/Mo',
  },
  {
    key: 'spurig',
    name: 'Spurig',
    monthlyPrice: '8,99 €',
    priceNote: 'netto · alles unbegrenzt',
    highlight: true,
  },
];

const ROWS: Row[] = [
  { label: 'Unbegrenzte QR-Codes', values: { bitly: false, rebrandly: false, spurig: true } },
  { label: 'Unbegrenzte Klicks/Scans', values: { bitly: false, rebrandly: false, spurig: true } },
  { label: 'Eigene Kurz-Domain inklusive', values: { bitly: false, rebrandly: '1 Domain', spurig: true } },
  { label: 'Hosting in der EU', values: { bitly: false, rebrandly: false, spurig: 'Frankfurt' } },
  { label: 'DSGVO ohne Cookie-Banner', values: { bitly: false, rebrandly: false, spurig: true } },
  { label: 'CSV-Bulk · 100 Codes auf einmal', values: { bitly: 'Add-on', rebrandly: true, spurig: true } },
  { label: 'API + Webhooks für n8n/KI', values: { bitly: true, rebrandly: true, spurig: true } },
  { label: 'Deutscher Support', values: { bitly: false, rebrandly: false, spurig: true } },
];

function Cell({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand/15 text-brand">
        <Check className="h-3 w-3" strokeWidth={3} aria-label="ja" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground/60">
        <X className="h-3 w-3" strokeWidth={2.5} aria-label="nein" />
      </span>
    );
  }
  return (
    <span className="text-[11.5px] font-medium text-muted-foreground">{value}</span>
  );
}

export function PricingComparisonTable() {
  return (
    <section
      aria-labelledby="pricing-compare-heading"
      className="relative border-t border-border bg-subtle py-20 sm:py-28"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="pricing-compare-heading"
            className="text-balance font-heading text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[36px]"
          >
            Preise im Vergleich.{' '}
            <span className="font-normal text-foreground/55 dark:text-foreground/50">
              Ohne Sternchen.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[14.5px] leading-relaxed text-muted-foreground sm:text-[15px]">
            US-Tools werden günstiger pro Monat — bis du das Klick-Limit triffst.
            Bei uns gibt&apos;s das Limit nicht.
          </p>
        </div>

        <div className="mx-auto mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-md)]">
          {/* Header */}
          <div className="grid grid-cols-[1.4fr_repeat(3,1fr)] items-end gap-2 border-b border-border bg-card px-4 py-5 sm:gap-3 sm:px-6">
            <div />
            {COMPETITORS.map((c) => (
              <div
                key={c.key}
                className={
                  c.highlight
                    ? 'relative -mx-1 -mb-5 overflow-hidden rounded-t-xl bg-brand px-2 pb-5 pt-3 text-center text-brand-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.18)]'
                    : 'text-center'
                }
              >
                <div className={c.highlight ? 'text-[12px] font-semibold uppercase tracking-[0.08em]' : 'text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground'}>
                  {c.name}
                </div>
                <div className={c.highlight ? 'mt-1 text-[15px] font-semibold tabular-nums' : 'mt-1 text-[15px] font-semibold tabular-nums text-foreground'}>
                  {c.monthlyPrice}
                </div>
                <div className={c.highlight ? 'text-[10.5px] opacity-80' : 'text-[10.5px] text-muted-foreground'}>
                  {c.priceNote}
                </div>
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {ROWS.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1.4fr_repeat(3,1fr)] items-center gap-2 px-4 py-3.5 transition-colors hover:bg-muted/30 sm:gap-3 sm:px-6"
              >
                <div className="text-[13px] font-medium text-foreground">{row.label}</div>
                {COMPETITORS.map((c) => (
                  <div
                    key={c.key}
                    className={
                      c.highlight
                        ? 'flex items-center justify-center bg-brand/[0.04] py-1'
                        : 'flex items-center justify-center opacity-80'
                    }
                  >
                    <Cell value={row.values[c.key]} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-[11.5px] leading-relaxed text-muted-foreground">
          Preise & Pläne der Wettbewerber laut deren öffentlicher Pricing-Seite (Stand 2026).
          Wir vergleichen vergleichbare Funktions-Stufen — keine Free-Tier-Tricks.
        </p>

        <div className="mt-8 flex items-center justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-foreground transition-colors hover:text-brand"
          >
            14 Tage testen — selbst rechnen
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

import { Check, X, Minus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type Row = {
  label: string;
  bitly: 'yes' | 'no' | 'partial';
  ga4: 'yes' | 'no' | 'partial';
  spurig: 'yes' | 'no' | 'partial';
  bitlyNote?: string;
  ga4Note?: string;
  spurigNote?: string;
};

const ROWS: Row[] = [
  {
    label: 'Unbegrenzte Codes & Klicks',
    bitly: 'no',
    bitlyNote: 'ab $35/Mo',
    ga4: 'partial',
    ga4Note: 'mit Limits',
    spurig: 'yes',
  },
  {
    label: 'DSGVO-konform ohne Cookies',
    bitly: 'no',
    ga4: 'no',
    ga4Note: 'Cookie-Banner Pflicht',
    spurig: 'yes',
  },
  {
    label: 'Hosting in der EU',
    bitly: 'no',
    bitlyNote: 'USA',
    ga4: 'no',
    ga4Note: 'USA',
    spurig: 'yes',
    spurigNote: 'Frankfurt',
  },
  {
    label: 'Eigene Kurz-Domain',
    bitly: 'partial',
    bitlyNote: 'ab $35/Mo',
    ga4: 'no',
    spurig: 'yes',
  },
  {
    label: 'Realtime-Dashboard',
    bitly: 'partial',
    ga4: 'partial',
    ga4Note: '24-48h Verzögerung',
    spurig: 'yes',
  },
  {
    label: 'Deutscher Support',
    bitly: 'no',
    ga4: 'no',
    spurig: 'yes',
  },
];

function StatusIcon({ status }: { status: 'yes' | 'no' | 'partial' }) {
  if (status === 'yes') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/15 text-brand">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    );
  }
  if (status === 'no') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground/60">
        <X className="h-3 w-3" strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Minus className="h-3 w-3" strokeWidth={2.5} />
    </span>
  );
}

export function CompareSection() {
  return (
    <section
      aria-labelledby="compare-heading"
      className="relative border-t border-border bg-subtle py-24 sm:py-32"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="compare-heading"
            className="text-balance font-heading text-[34px] font-semibold leading-[1.08] tracking-[-0.025em] sm:text-[44px]"
          >
            Statt drei Tools.{' '}
            <span className="text-muted-foreground font-normal">
              Eines, das passt.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[15.5px] leading-relaxed text-muted-foreground sm:text-[16.5px]">
            Bitly für Links. Google Analytics für Daten. Cookie-Banner-Tool dazu.
            Oder einfach Spurig.
          </p>
        </div>

        {/* Comparison table */}
        <div className="mx-auto mt-14 max-w-3xl overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-md)]">
          {/* Header row */}
          <div className="grid grid-cols-[1.4fr_repeat(3,1fr)] items-end gap-2 border-b border-border bg-subtle/60 px-4 py-5 sm:px-6">
            <div />
            <div className="text-center">
              <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Bitly
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">ab $35/Mo</div>
            </div>
            <div className="text-center">
              <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                GA4
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">Cookies</div>
            </div>
            <div className="-mx-1 -mb-5 rounded-t-2xl bg-brand px-2 pb-5 pt-3 text-center text-brand-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.18)]">
              <div className="text-[12px] font-semibold uppercase tracking-[0.08em]">
                Spurig
              </div>
              <div className="mt-1 text-[11px] opacity-80">ab 4,99 €/Mo</div>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {ROWS.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1.4fr_repeat(3,1fr)] items-center gap-2 px-4 py-3.5 transition-colors hover:bg-muted/20 sm:px-6"
              >
                <div className="text-[13.5px] font-medium text-foreground">
                  {row.label}
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <StatusIcon status={row.bitly} />
                  {row.bitlyNote && (
                    <span className="text-[10px] text-muted-foreground">
                      {row.bitlyNote}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <StatusIcon status={row.ga4} />
                  {row.ga4Note && (
                    <span className="text-[10px] text-muted-foreground">
                      {row.ga4Note}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-center gap-1 bg-brand/[0.04] py-1 text-center">
                  <StatusIcon status={row.spurig} />
                  {row.spurigNote && (
                    <span className="text-[10px] font-medium text-brand">
                      {row.spurigNote}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subtle CTA below */}
        <div className="mt-10 flex items-center justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-foreground transition-colors hover:text-brand"
          >
            14 Tage testen — und selbst sehen
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

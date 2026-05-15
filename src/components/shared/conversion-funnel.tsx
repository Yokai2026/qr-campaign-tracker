import { ArrowDown, Eye, MousePointerClick, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = {
  label: string;
  value: number;
  icon: typeof Eye;
};

type Props = {
  totalOpens: number;
  ctaClicks: number;
  formSubmits: number;
  className?: string;
};

/**
 * Visualisiert den Conversion-Pfad: Aufruf → CTA-Klick → Formular-Submit.
 * Zeigt absolute Zahlen + Conversion-Rate zum vorherigen Step.
 *
 * Ohne Funnel sieht User nur Endzahlen ("234 CTA, 45 Formulare") — mit Funnel
 * sieht er "von 1000 Aufrufen klickten 234 CTAs (23.4%), davon haben 45 das
 * Formular gesendet (19% des CTAs)". Das ist der eigentliche Optimierungs-Hebel.
 */
export function ConversionFunnel({ totalOpens, ctaClicks, formSubmits, className }: Props) {
  const steps: Step[] = [
    { label: 'Aufrufe', value: totalOpens, icon: Eye },
    { label: 'CTA-Klicks', value: ctaClicks, icon: MousePointerClick },
    { label: 'Formulare', value: formSubmits, icon: FileText },
  ];

  // Maximalwert fuer Bar-Breite (proportional zum groessten Wert)
  const maxValue = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4 sm:p-5', className)}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h3 className="text-[13.5px] font-semibold tracking-tight">Conversion-Pfad</h3>
        <span className="text-[11px] text-muted-foreground">
          Wer scrollt bis zur Aktion?
        </span>
      </div>
      <p className="mb-4 text-[12px] text-muted-foreground">
        So viele Besucher kommen pro Schritt durch
      </p>

      <ol className="space-y-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const widthPct = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
          const prev = i > 0 ? steps[i - 1].value : null;
          const conversionFromPrev =
            prev !== null && prev > 0 ? (step.value / prev) * 100 : null;
          const dropOff = prev !== null && prev > 0 ? prev - step.value : null;

          return (
            <li key={step.label}>
              {/* Drop-off-Pfeil zwischen Steps */}
              {i > 0 && (
                <div className="ml-2 mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <ArrowDown className="h-3 w-3 text-muted-foreground/60" />
                  {conversionFromPrev !== null ? (
                    <span>
                      <span className="tabular-nums font-medium text-foreground">
                        {conversionFromPrev.toFixed(1)}%
                      </span>{' '}
                      kommen durch
                      {dropOff !== null && dropOff > 0 && (
                        <span className="text-muted-foreground/70">
                          {' · '}
                          <span className="tabular-nums">{dropOff.toLocaleString('de-DE')}</span> Drop-off
                        </span>
                      )}
                    </span>
                  ) : (
                    <span>Noch keine Daten</span>
                  )}
                </div>
              )}

              {/* Step-Card */}
              <div className="rounded-xl border border-border/70 bg-card transition-colors hover:border-brand/30">
                <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] text-muted-foreground">{step.label}</div>
                    <div className="tabular-nums text-[18px] font-semibold leading-tight">
                      {step.value.toLocaleString('de-DE')}
                    </div>
                  </div>
                  <div className="hidden flex-1 sm:block">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand/60 to-brand transition-[width] duration-700"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

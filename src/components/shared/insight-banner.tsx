'use client';

import { Sparkles, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  /** Gesamtaufrufe im Zeitraum */
  totalOpens: number;
  /** Prozent-Aenderung vs. Vorperiode (null = keine Vorperiode-Daten) */
  delta: number | null;
  /** Top-Kampagne (Name + Aufrufe), null wenn keine */
  topCampaign?: { name: string; opens: number } | null;
  /** Peak-Slot (Wochentag + Stunde), null wenn zu wenig Daten */
  peakSlot?: { dayLabel: string; hourLabel: string } | null;
  /** Anzahl eindeutige Besucher */
  uniqueVisitors?: number;
  /** Aktiv-Status fuer Liveness — wird im Subtext erwaehnt */
  hasData: boolean;
  /**
   * Beschreibt den Zeitraum-Kontext in einem kurzen Satzteil:
   *  - Dashboard:  "in den letzten 7 Tagen"
   *  - Analytics:  "im gewählten Zeitraum"
   * Default: "im gewählten Zeitraum" (Analytics-Verhalten).
   */
  periodLabel?: string;
  /** Optional zusaetzliche Klassen */
  className?: string;
};

/**
 * Plain-Language-Zusammenfassung der wichtigsten Insights — erfuellt die
 * "5-Sekunden-Regel": User sieht in einem Satz wie es gerade laeuft.
 *
 * Wird aus bereits berechneten KPIs generiert, KEIN eigener Query.
 * Statt 7 Zahlen-Karten oben sieht User EINE Aussage.
 *
 * Der periodLabel-Prop sorgt fuer kontextkorrekte Wording:
 *  - Auf Dashboard ist der Zeitraum fix (7 Tage) → "in den letzten 7 Tagen"
 *  - Auf Analytics ist er user-konfigurierbar → "im gewählten Zeitraum"
 */
export function InsightBanner({
  totalOpens,
  delta,
  topCampaign,
  peakSlot,
  uniqueVisitors,
  hasData,
  periodLabel = 'im gewählten Zeitraum',
  className,
}: Props) {
  if (!hasData || totalOpens === 0) {
    return (
      <div
        className={cn(
          'flex items-start gap-3 rounded-2xl border border-dashed border-border bg-muted/20 p-4',
          className,
        )}
      >
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Auf einen Blick
            </span>
            <PeriodChip label={periodLabel} muted />
          </div>
          <p className="text-[13.5px] font-medium text-foreground">
            Noch keine Aufrufe {periodLabel}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Sobald deine QR-Codes oder Kurzlinks gescannt werden, siehst du hier eine Zusammenfassung der wichtigsten Erkenntnisse.
          </p>
        </div>
      </div>
    );
  }

  // Trend-Wording
  const trendIcon = delta == null ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendPhrase = (() => {
    if (delta == null) return null;
    const rounded = Math.round(delta);
    if (Math.abs(rounded) < 3) return 'auf Vorperioden-Niveau';
    if (rounded > 0) return `+${rounded}% vs. Vorperiode`;
    return `${rounded}% vs. Vorperiode`;
  })();
  const trendTone = delta == null
    ? 'text-muted-foreground'
    : delta > 5
      ? 'text-emerald-600 dark:text-emerald-400'
      : delta < -5
        ? 'text-red-600 dark:text-red-400'
        : 'text-muted-foreground';

  const TrendIcon = trendIcon;

  // Kontext-Aussagen — werden nur dann angezeigt wenn Daten vorliegen
  const contextParts: string[] = [];
  if (topCampaign && topCampaign.opens > 0) {
    contextParts.push(`Top-Kampagne: ${topCampaign.name} (${topCampaign.opens.toLocaleString('de-DE')})`);
  }
  if (peakSlot) {
    contextParts.push(`Peak: ${peakSlot.dayLabel} ${peakSlot.hourLabel}`);
  }
  if (uniqueVisitors && uniqueVisitors > 0) {
    contextParts.push(`${uniqueVisitors.toLocaleString('de-DE')} eindeutige Besucher`);
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/[0.05] via-brand/[0.02] to-transparent p-4 sm:p-5',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
          <Sparkles className="h-4 w-4" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          {/* Eyebrow + Period-Chip nebeneinander — User sieht sofort um welchen
              Zeitraum's geht, damit "13 Aufrufe" nicht missverstanden wird. */}
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand/80">
              Auf einen Blick
            </span>
            <PeriodChip label={periodLabel} />
          </div>
          <p className="text-[14px] leading-relaxed text-foreground sm:text-[15px]">
            <span className="tabular-nums font-semibold">
              {totalOpens.toLocaleString('de-DE')}
            </span>{' '}
            {totalOpens === 1 ? 'Aufruf' : 'Aufrufe'} {periodLabel}
            {trendPhrase && (
              <>
                {' — '}
                <span className={cn('tabular-nums font-semibold inline-flex items-center gap-1', trendTone)}>
                  <TrendIcon className="h-3.5 w-3.5" />
                  {trendPhrase}
                </span>
              </>
            )}
            {contextParts.length > 0 && '.'}
          </p>
          {contextParts.length > 0 && (
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              {contextParts.join(' · ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Kleine Period-Pille mit Uhr-Icon — zeigt prominent welcher Zeitraum gemeint ist. */
function PeriodChip({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium',
        muted
          ? 'border-border bg-muted/40 text-muted-foreground'
          : 'border-brand/25 bg-brand/10 text-brand/90 dark:text-brand',
      )}
    >
      <Clock className="h-2.5 w-2.5" strokeWidth={2.2} />
      {label}
    </span>
  );
}

'use client';

import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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
  /** Optional: Klick-Handler, z. B. um zu Detailansicht zu springen */
  className?: string;
};

/**
 * Plain-Language-Zusammenfassung der wichtigsten Insights — erfuellt die
 * "5-Sekunden-Regel": User sieht in einem Satz wie es gerade laeuft.
 *
 * Wird aus bereits berechneten KPIs generiert, KEIN eigener Query.
 * Statt 7 Zahlen-Karten oben sieht User EINE Aussage.
 */
export function InsightBanner({
  totalOpens,
  delta,
  topCampaign,
  peakSlot,
  uniqueVisitors,
  hasData,
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
        <div className="min-w-0">
          <p className="text-[13.5px] font-medium text-foreground">
            Noch keine Aufrufe im gewählten Zeitraum
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
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand/80">
            Auf einen Blick
          </div>
          <p className="mt-1 text-[14px] leading-relaxed text-foreground sm:text-[15px]">
            <span className="tabular-nums font-semibold">
              {totalOpens.toLocaleString('de-DE')}
            </span>{' '}
            {totalOpens === 1 ? 'Aufruf' : 'Aufrufe'} im gewählten Zeitraum
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

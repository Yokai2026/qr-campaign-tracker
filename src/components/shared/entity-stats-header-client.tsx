'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export type StatsScope =
  | { kind: 'qr_code'; id: string }
  | { kind: 'short_link'; id: string }
  | { kind: 'campaign'; id: string }
  | { kind: 'placement'; id: string }
  | { kind: 'location'; placementIds: string[] };

type Props = {
  scope: StatsScope;
  label?: string;
  initial: {
    today: number;
    sevenDays: number;
    lastScan: string | null;
  };
};

/**
 * Live-Variante des EntityStatsHeader — bekommt initiale Werte vom Server
 * und abonniert anschliessend Supabase-Realtime fuer redirect_events.
 *
 * Sobald ein neuer Scan/Klick mit passendem Scope eintrifft:
 *  - "Heute" und "7 Tage" werden inkrementiert
 *  - "Letzter Scan" wird auf "jetzt" gesetzt
 *  - Ein kurzer Flash-Effekt zeigt visuell an, dass ein neues Event kam
 *
 * Ohne diesen Live-Anteil musste der User die Seite neu laden, um seine
 * eigenen Test-Scans zu sehen — das war traege.
 */
export function EntityStatsHeaderClient({ scope, label, initial }: Props) {
  const [today, setToday] = useState(initial.today);
  const [sevenDays, setSevenDays] = useState(initial.sevenDays);
  const [lastScan, setLastScan] = useState<string | null>(initial.lastScan);
  const [connected, setConnected] = useState(false);
  const [pulse, setPulse] = useState(false);
  // Tick-Counter erzwingt Re-Render alle 30s, damit "vor X Sekunden" aktuell bleibt
  const [, setTick] = useState(0);
  const pulseTimerRef = useRef<number | null>(null);

  // Re-Render alle 30s damit relative Zeit-Anzeige aktuell bleibt
  useEffect(() => {
    const interval = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const filterStr = buildRealtimeFilter(scope);

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      const channelName = `entity-stats-${scope.kind}-${scopeKey(scope)}`;
      const built = supabase.channel(channelName)?.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'redirect_events',
          ...(filterStr ? { filter: filterStr } : {}),
        },
        (payload) => {
          const e = payload.new as {
            event_type: string;
            is_bot: boolean | null;
            created_at: string;
            placement_id?: string | null;
          };
          if (e.is_bot) return;
          if (e.event_type !== 'qr_open' && e.event_type !== 'link_open') return;
          // Bei Location-Scope filtern wir client-seitig auf die placementIds,
          // weil die Realtime-Filter-DSL kein "in" unterstuetzt.
          if (scope.kind === 'location') {
            if (!e.placement_id || !scope.placementIds.includes(e.placement_id)) return;
          }
          // Heute? Lokale Zeit-Vergleich
          const eventDate = new Date(e.created_at);
          const now = new Date();
          const isToday =
            eventDate.getFullYear() === now.getFullYear() &&
            eventDate.getMonth() === now.getMonth() &&
            eventDate.getDate() === now.getDate();
          if (isToday) setToday((t) => t + 1);
          setSevenDays((s) => s + 1);
          setLastScan(e.created_at);
          // Pulse-Effekt — kurz aufblitzen
          setPulse(true);
          if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current);
          pulseTimerRef.current = window.setTimeout(() => setPulse(false), 1800);
        },
      );
      if (built && typeof built.subscribe === 'function') {
        channel = built.subscribe((status) => {
          setConnected(status === 'SUBSCRIBED');
        });
      }
    } catch (err) {
      console.error('[entity-stats-header] realtime subscribe failed:', err);
    }

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch {
        // ignore
      }
      if (pulseTimerRef.current) {
        window.clearTimeout(pulseTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.kind, scopeKey(scope)]);

  return (
    <div
      className={
        'sticky top-0 z-10 -mx-4 border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:-mx-6 sm:px-6 transition-colors duration-700 ' +
        (pulse ? 'bg-brand/5' : '')
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-5 overflow-x-auto text-[12px] sm:gap-7">
          <Stat label="Heute" value={today} highlight={pulse} />
          <Stat label="7 Tage" value={sevenDays} />
          <Stat
            label="Letzter Scan"
            value={lastScan ? `vor ${formatDistanceToNow(new Date(lastScan), { locale: de })}` : '–'}
          />
          {/* Live-Indikator — zeigt visuell dass Realtime aktiv ist */}
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-card px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
            {connected ? (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-[pulseDot_1.4s_ease-in-out_infinite] rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
            )}
            {connected ? 'Live' : 'Verbindet…'}
          </span>
        </div>
        {label && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="shrink-0">
      <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      <div
        className={
          'mt-0.5 tabular-nums text-[15px] font-semibold tracking-tight transition-colors duration-700 ' +
          (highlight ? 'text-brand' : '')
        }
      >
        {value}
      </div>
    </div>
  );
}

/** Baut Realtime-Filter-String fuer Supabase channel.on('postgres_changes', { filter }) */
function buildRealtimeFilter(scope: StatsScope): string | null {
  switch (scope.kind) {
    case 'qr_code':
      return `qr_code_id=eq.${scope.id}`;
    case 'short_link':
      return `short_link_id=eq.${scope.id}`;
    case 'campaign':
      return `campaign_id=eq.${scope.id}`;
    case 'placement':
      return `placement_id=eq.${scope.id}`;
    case 'location':
      // Realtime-Filter unterstuetzt kein "in" — wir filtern client-seitig
      return null;
  }
}

function scopeKey(scope: StatsScope): string {
  switch (scope.kind) {
    case 'qr_code':
    case 'short_link':
    case 'campaign':
    case 'placement':
      return scope.id;
    case 'location':
      return scope.placementIds.join(',');
  }
}

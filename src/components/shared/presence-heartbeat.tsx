'use client';

import { useEffect } from 'react';

const INTERVAL_MS = 30_000;
const STORAGE_KEY = 'spurig-visitor-id';

/**
 * Sendet alle 30s einen Heartbeat an /api/heartbeat — mit einer pro Tab
 * eindeutigen visitor_id (sessionStorage-UUID). Tracking ALLER Website-
 * Besucher (anonym + eingeloggt) und Sessions (jeder Tab = eigene ID).
 *
 * sessionStorage statt localStorage: ein Browser mit mehreren Tabs erzeugt
 * mehrere visitor_ids — damit zaehlen Tab-2/3 nicht denselben Eintrag in DB,
 * sondern je eine eigene Row. Stimmt mit der User-Intuition "wie oft jemand
 * was" ueberein, statt "eindeutige Browser".
 *
 * visibilitychange:hidden stoppt nur den Heartbeat, sendet aber KEIN leave —
 * der Eintrag altert nach 60s natuerlich aus. Sonst flackert die Anzeige
 * brutal beim Tab-Wechsel (Hintergrund-Tab wuerde sofort als offline gelten).
 * pagehide (echter Page-Close) sendet weiterhin leave.
 *
 * Sollte im Root-Layout gemountet werden damit es auf jeder Page laeuft.
 */
export function PresenceHeartbeat() {
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    function getVisitorId(): string {
      const generate = () =>
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      try {
        const existing = sessionStorage.getItem(STORAGE_KEY);
        if (existing && existing.length > 0) return existing;
        const fresh = generate();
        sessionStorage.setItem(STORAGE_KEY, fresh);
        return fresh;
      } catch {
        // sessionStorage blockiert (Private Mode etc.) — fallback non-persistent
        return generate();
      }
    }

    function ping() {
      const visitorId = getVisitorId();
      fetch('/api/heartbeat', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          page: typeof window !== 'undefined' ? window.location.pathname : null,
        }),
      }).catch(() => {});
    }

    function leave() {
      // sendBeacon: synchron beim Page-Unload, funktioniert auch wenn Tab gerade
      // geschlossen wird oder Mobile-Browser die App in den Hintergrund schickt.
      const visitorId = getVisitorId();
      try {
        const blob = new Blob(
          [JSON.stringify({ visitorId, leave: true })],
          { type: 'application/json' },
        );
        if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
          navigator.sendBeacon('/api/heartbeat', blob);
        } else {
          // Fallback: keepalive-fetch (funktioniert in modernen Browsern auch
          // waehrend Page-Unload)
          fetch('/api/heartbeat', {
            method: 'POST',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visitorId, leave: true }),
          }).catch(() => {});
        }
      } catch {
        // ignore
      }
    }

    function start() {
      if (timer) return;
      ping();
      timer = setInterval(ping, INTERVAL_MS);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        start();
      } else {
        // Tab/App in Hintergrund → nur Heartbeat stoppen, KEIN leave.
        // last_seen_at altert dann nach 60s natuerlich aus. Sonst zaehlt
        // jeder Tab-Wechsel sofort als offline (vor allem auf Mobile),
        // was zu komplett falscher Live-Anzeige fuehrt.
        stop();
      }
    }

    function onPageHide() {
      stop();
      leave();
    }

    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibilityChange);
    // pagehide ist auf Mobile der zuverlaessigste Event (greift auch beim
    // Tab-Wechsel/Schliessen in Safari iOS).
    window.addEventListener('pagehide', onPageHide);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  return null;
}

'use client';

import { useEffect } from 'react';

const INTERVAL_MS = 30_000;
const STORAGE_KEY = 'spurig-visitor-id';

/**
 * Sendet alle 30s einen Heartbeat an /api/heartbeat — mit einer pro Browser
 * persistierten visitor_id (localStorage-UUID). Tracking aller Website-
 * Besucher, auch anonymer.
 *
 * Pausiert wenn Tab im Hintergrund (Page Visibility API) — spart Server-Last
 * und stellt sicher dass "online" nur Tabs mit Fokus zaehlt.
 *
 * Sollte im Root-Layout gemountet werden damit es auf jeder Page laeuft
 * (Landing, /r/, Dashboard, Admin etc.).
 */
export function PresenceHeartbeat() {
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    function getVisitorId(): string {
      try {
        const existing = localStorage.getItem(STORAGE_KEY);
        if (existing && existing.length > 0) return existing;
        const fresh =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(STORAGE_KEY, fresh);
        return fresh;
      } catch {
        // localStorage blockiert (Private Mode etc.) — fallback non-persistent
        return `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
      if (document.visibilityState === 'visible') start();
      else stop();
    }

    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return null;
}

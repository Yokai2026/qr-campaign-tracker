'use client';

import { useEffect } from 'react';

const INTERVAL_MS = 30_000; // 30 Sekunden

/**
 * Pingt /api/heartbeat alle 30s, damit das Admin-Panel "Online jetzt"
 * korrekt anzeigen kann. Fire-and-forget — Failures ignorieren wir
 * absichtlich (Tracking ist nicht kritisch).
 *
 * Pausiert wenn Tab im Hintergrund ist (Page Visibility API), spart
 * Server-Last und stellt sicher dass "online" nur Tabs mit Fokus zaehlt.
 */
export function Heartbeat() {
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    function ping() {
      // beacon-ähnlich: fetch ohne await, fehler still
      fetch('/api/heartbeat', { method: 'POST', keepalive: true }).catch(() => {});
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

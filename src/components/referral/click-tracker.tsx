'use client';

import { useEffect } from 'react';

/**
 * Client-side Referral-Tracker.
 *
 * Liest ?ref=XXX aus der URL und ruft /api/referrals/track auf,
 * was das spurig_ref-Cookie setzt (30 Tage gültig).
 *
 * Idempotent: wenn das Cookie bereits den gleichen Code enthält, kein Re-Track.
 */
export function ReferralClickTracker() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (!ref) return;

      // Check Cookie um Doppel-Tracking zu vermeiden
      const existing = document.cookie
        .split(';')
        .map((s) => s.trim())
        .find((c) => c.startsWith('spurig_ref='));
      if (existing && existing.split('=')[1] === ref) return;

      fetch('/api/referrals/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: ref }),
      }).catch(() => {});
    } catch {
      // Ignoriere — Tracker ist best-effort, nicht kritisch
    }
  }, []);

  return null;
}

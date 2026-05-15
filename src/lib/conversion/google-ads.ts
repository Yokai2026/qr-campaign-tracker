/**
 * Google-Ads Conversion-Tracking Helper.
 *
 * Env-Vars:
 *   NEXT_PUBLIC_GOOGLE_ADS_ID=AW-1234567890         (Account-ID)
 *   NEXT_PUBLIC_GA_CONVERSION_SIGNUP=AW-.../abcdef  (Conversion-Action fuer Signup)
 *   NEXT_PUBLIC_GA_CONVERSION_PURCHASE=AW-.../xyz   (Conversion-Action fuer Purchase)
 *
 * Wenn keine ID gesetzt: alle Funktionen sind No-Ops (kein Crash).
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function isGoogleAdsEnabled(): boolean {
  return Boolean(
    typeof window !== 'undefined' &&
      window.gtag &&
      process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
  );
}

/**
 * Feuert ein Signup-Conversion-Event (Lead). Wird auf /signup/verify aufgerufen
 * nach erfolgreichem Submit. Lead-Conversion = unbestaetigter Trial-Start.
 */
export function trackGoogleAdsSignup(): void {
  if (!isGoogleAdsEnabled()) return;
  const target = process.env.NEXT_PUBLIC_GA_CONVERSION_SIGNUP;
  if (!target) return;
  window.gtag?.('event', 'conversion', {
    send_to: target,
    value: 0, // Lead-Wert intern, kein Money-Conversion
    currency: 'EUR',
  });
}

/**
 * Feuert ein Purchase-Conversion-Event nach Stripe-Checkout-Erfolg. Auf
 * /settings?upgraded=1 ausgeloest. Value-Parameter falls bekannt (z.B. 12.99
 * fuer monatlich, 107.88 fuer jaehrlich).
 */
export function trackGoogleAdsPurchase(opts: { value: number; transactionId?: string }): void {
  if (!isGoogleAdsEnabled()) return;
  const target = process.env.NEXT_PUBLIC_GA_CONVERSION_PURCHASE;
  if (!target) return;
  window.gtag?.('event', 'conversion', {
    send_to: target,
    value: opts.value,
    currency: 'EUR',
    transaction_id: opts.transactionId,
  });
}

/**
 * Liest die Google-Click-ID (gclid) aus URL-Param und persistiert sie in
 * sessionStorage. Wird beim Signup zum Profile geschrieben — spaetere
 * Offline-Conversions koennen via Stripe-Webhook → Google-Ads-API
 * an die konkrete Click-ID gebunden werden.
 *
 * Call: bei Landing-Page-Mount (z.B. via useEffect in einer Client-Component).
 */
export function captureGclid(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const gclid = params.get('gclid');
    if (gclid && gclid.length < 200) {
      sessionStorage.setItem('spurig-gclid', gclid);
      return gclid;
    }
    return sessionStorage.getItem('spurig-gclid');
  } catch {
    return null;
  }
}

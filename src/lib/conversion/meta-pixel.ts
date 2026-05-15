/**
 * Meta-Pixel Browser-Side Conversion-Tracking Helper.
 *
 * Komplementaer zum Server-Side CAPI (meta-capi.ts):
 * - Pixel = Browser-Side → baut Retargeting-Audiences (Custom Audiences)
 * - CAPI = Server-Side → liefert genaue Purchase-Events ohne Cookie-Blocker
 *
 * Beide feuern dieselben Events mit demselben eventID → Meta dedupliziert
 * automatisch fuer max Match-Quality.
 *
 * Env-Vars:
 *   NEXT_PUBLIC_META_PIXEL_ID=15-stellige-Pixel-ID
 *
 * Wenn nicht gesetzt: alle Funktionen sind No-Ops.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export function isMetaPixelEnabled(): boolean {
  return Boolean(
    typeof window !== 'undefined' &&
      window.fbq &&
      process.env.NEXT_PUBLIC_META_PIXEL_ID,
  );
}

/**
 * Lead-Event nach Signup-Verify. Wird mit eventID an Meta gepostet.
 * Wenn parallel das CAPI Lead-Event mit gleichem eventID feuert,
 * dedupliziert Meta automatisch.
 */
export function trackMetaLead(eventId?: string): void {
  if (!isMetaPixelEnabled()) return;
  const opts: Record<string, unknown> = {};
  if (eventId) opts.eventID = eventId;
  window.fbq?.('track', 'Lead', {}, opts);
}

/**
 * Purchase-Event nach Stripe-Checkout-Erfolg. Value + Currency mitgeben
 * fuer ROAS-Optimierung. eventID = subscription_id fuer Deduplication
 * gegen den Server-Side CAPI-Event.
 */
export function trackMetaPurchase(opts: {
  value: number;
  currency?: string;
  eventId?: string;
  contentName?: string;
}): void {
  if (!isMetaPixelEnabled()) return;
  const params: Record<string, unknown> = {
    value: opts.value,
    currency: opts.currency ?? 'EUR',
  };
  if (opts.contentName) params.content_name = opts.contentName;
  const eventOpts: Record<string, unknown> = {};
  if (opts.eventId) eventOpts.eventID = opts.eventId;
  window.fbq?.('track', 'Purchase', params, eventOpts);
}

/**
 * Custom-Event-Fire-and-Forget — z.B. fuer 'StartTrial', 'AddToCart',
 * 'Lead' Variants oder eigene Events. Sparingly nutzen.
 */
export function trackMetaCustom(eventName: string, params?: Record<string, unknown>): void {
  if (!isMetaPixelEnabled()) return;
  window.fbq?.('trackCustom', eventName, params ?? {});
}

/**
 * Token-Helper für Mail-Tracking.
 * Pro Recipient ein unique pixel_token, pro Link ein unique click_token.
 * Tokens sind URL-safe Base64 (kein +/=, kein \w-Konflikt).
 */

import { nanoid } from 'nanoid';

/** Generiert einen URL-safe Token (default 14 chars, ~7.4×10^21 Kombinationen). */
export function generateToken(length = 14): string {
  return nanoid(length);
}

/** Validiert dass ein String wie ein nanoid-Token aussieht (Base64-URL-safe, korrekte Länge). */
export function isValidToken(s: unknown, expectedLength = 14): s is string {
  return typeof s === 'string'
    && s.length === expectedLength
    && /^[A-Za-z0-9_-]+$/.test(s);
}

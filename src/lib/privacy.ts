/**
 * Privacy-by-Design utilities for GDPR-compliant data minimization.
 *
 * Used across all tracking flows to ensure only the minimum necessary
 * data is stored. No raw IPs, full User-Agents, or PII-laden URLs
 * should ever reach the database.
 */

import { UAParser } from 'ua-parser-js';

// ============================================
// Referrer Minimization
// ============================================

/**
 * Normalize a referrer URL to its hostname only.
 * Strips path, query parameters, fragments, and credentials.
 * Returns null for empty, invalid, or internal referrers.
 */
export function normalizeReferrer(
  referrer: string | null,
  ownHostnames?: string[],
): string | null {
  if (!referrer) return null;

  try {
    const url = new URL(referrer);

    // Discard non-http(s) referrers
    if (!['http:', 'https:'].includes(url.protocol)) return null;

    const hostname = url.hostname.toLowerCase();

    // Mark internal referrers as null (not interesting for analytics)
    if (ownHostnames?.some((h) => hostname === h || hostname.endsWith(`.${h}`))) {
      return null;
    }

    // Return hostname only — no path, no query, no fragment
    return hostname;
  } catch {
    return null;
  }
}

// ============================================
// URL Sanitization
// ============================================

/**
 * Known PII / tracking parameters that should be stripped from URLs
 * before persistence. Covers common PII leaks and third-party click IDs.
 */
const PII_PARAMS = new Set([
  // Personal data
  'email', 'e-mail', 'mail', 'phone', 'tel', 'name', 'firstname',
  'lastname', 'vorname', 'nachname', 'username', 'user', 'userid',
  'user_id', 'uid',
  // Auth / session
  'token', 'auth', 'session', 'sessionid', 'session_id', 'key',
  'apikey', 'api_key', 'secret', 'password', 'pwd', 'pass',
  'access_token', 'refresh_token', 'code',
  // Third-party click IDs (cross-site tracking)
  'fbclid', 'gclid', 'msclkid', 'dclid', 'twclid', 'li_fat_id',
  'mc_eid', 'oly_anon_id', 'oly_enc_id', '_openstat',
  'wickedid', 'yclid', 'ttclid',
]);

/**
 * Sanitize a URL by removing known PII and tracking parameters.
 * Preserves UTM parameters (utm_source, utm_medium, etc.) as they
 * are first-party campaign attribution and not PII.
 *
 * Returns the sanitized URL string, or null if invalid.
 */
export function sanitizeUrl(url: string | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    // Only process http(s) URLs
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;

    // Remove PII and tracking params
    const keysToDelete: string[] = [];
    parsed.searchParams.forEach((_value, key) => {
      if (PII_PARAMS.has(key.toLowerCase())) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((k) => parsed.searchParams.delete(k));

    // Remove fragment (may contain PII in SPAs)
    parsed.hash = '';

    return parsed.toString();
  } catch {
    return null;
  }
}

// ============================================
// User-Agent Minimization
// ============================================

export type MinimalUserAgent = {
  device_type: string;
  browser_family: string;
  os_family: string;
};

/**
 * Parse a User-Agent string into minimal, non-fingerprinting categories.
 * Only extracts broad categories — no version numbers, no build strings.
 *
 * Returns device_type (mobile/tablet/desktop), browser family, and OS family.
 */
export function parseUserAgentMinimal(userAgent: string): MinimalUserAgent {
  if (!userAgent) {
    return { device_type: 'unknown', browser_family: 'unknown', os_family: 'unknown' };
  }

  const parser = new UAParser(userAgent);

  // Device type: only broad category
  const device = parser.getDevice();
  const device_type = device.type || 'desktop'; // mobile, tablet, or desktop

  // Browser: only family name, no version
  const browser = parser.getBrowser();
  const browser_family = normalizeBrowserFamily(browser.name || 'unknown');

  // OS: only family name, no version
  const os = parser.getOS();
  const os_family = normalizeOsFamily(os.name || 'unknown');

  return { device_type, browser_family, os_family };
}

/**
 * Collapse browser names into broad families to prevent fingerprinting.
 */
function normalizeBrowserFamily(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('chrome') || lower.includes('chromium')) return 'Chrome';
  if (lower.includes('firefox')) return 'Firefox';
  if (lower.includes('safari') && !lower.includes('chrome')) return 'Safari';
  if (lower.includes('edge')) return 'Edge';
  if (lower.includes('opera') || lower.includes('opr')) return 'Opera';
  if (lower.includes('samsung')) return 'Samsung Internet';
  if (lower.includes('ie') || lower.includes('internet explorer') || lower.includes('trident')) return 'IE';
  return 'Other';
}

/**
 * Collapse OS names into broad families.
 */
function normalizeOsFamily(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('windows')) return 'Windows';
  if (lower.includes('mac') || lower.includes('os x')) return 'macOS';
  if (lower.includes('ios')) return 'iOS';
  if (lower.includes('android')) return 'Android';
  if (lower.includes('linux') || lower.includes('ubuntu') || lower.includes('debian') || lower.includes('fedora')) return 'Linux';
  if (lower.includes('chrome os') || lower.includes('chromium os')) return 'ChromeOS';
  return 'Other';
}

// ============================================
// Metadata Sanitization
// ============================================

/** Maximum allowed keys in metadata object */
const METADATA_MAX_KEYS = 10;

/** Maximum string value length in metadata */
const METADATA_MAX_VALUE_LENGTH = 200;

/** Allowed metadata key pattern (alphanumeric + underscore) */
const METADATA_KEY_PATTERN = /^[a-z][a-z0-9_]{0,49}$/;

/** Allowed value types */
type MetadataValue = string | number | boolean;

/**
 * Sanitize event metadata to prevent PII injection and abuse.
 *
 * - Only allows alphanumeric keys (max 50 chars, max 10 keys)
 * - Only allows string/number/boolean values
 * - Strings truncated to 200 chars
 * - Known PII keys are stripped
 * - Returns null if input is empty or invalid
 */
export function sanitizeMetadata(
  metadata: unknown,
): Record<string, MetadataValue> | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  const raw = metadata as Record<string, unknown>;
  const result: Record<string, MetadataValue> = {};
  let count = 0;

  for (const [key, value] of Object.entries(raw)) {
    if (count >= METADATA_MAX_KEYS) break;

    const normalizedKey = key.toLowerCase().trim();

    // Skip invalid keys
    if (!METADATA_KEY_PATTERN.test(normalizedKey)) continue;

    // Skip PII keys
    if (PII_PARAMS.has(normalizedKey)) continue;

    // Only allow safe value types
    if (typeof value === 'string') {
      result[normalizedKey] = value.slice(0, METADATA_MAX_VALUE_LENGTH);
      count++;
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      result[normalizedKey] = value;
      count++;
    } else if (typeof value === 'boolean') {
      result[normalizedKey] = value;
      count++;
    }
    // Skip objects, arrays, null, undefined, etc.
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * UTM-Tracking-Layer.
 *
 * Stellt sicher dass jeder Outbound-Link (Email, Social-Draft, DM) automatisch
 * mit UTM-Parametern versehen wird. Bei Signup persistiert middleware/page das
 * Attribution-Set auf profiles.
 */

export type AttributionSource =
  | 'cold_email'           // Outbound-Cold-Mail
  | 'cold_dm'              // LinkedIn Cold-DM
  | 'linkedin'             // Organic LinkedIn-Post
  | 'twitter'              // Organic Twitter/X-Post
  | 'reddit'               // Organic Reddit-Post
  | 'trial_upsell'         // Trial-Lifecycle-Mail
  | 'transactional'        // Welcome / Reminder
  | 'admin_notify'         // Admin-Notifications (sollten nicht konvertieren)
  | 'organic';             // Direct/Unknown

export type AttributionMedium = 'cold' | 'social' | 'email' | 'organic' | 'referral';

export type UtmInput = {
  source: AttributionSource;
  medium: AttributionMedium;
  campaign?: string;       // z.B. blog-slug oder lead-segment
  content?: string;        // z.B. lead-id oder message-id
};

/**
 * Fuegt UTM-Parameter an eine URL an. Bestehende Query-Params bleiben.
 */
export function addUtm(url: string, input: UtmInput): string {
  try {
    const u = new URL(url);
    // Spurig-Domain only — extern lassen wir unangetastet
    if (!u.hostname.endsWith('spurig.com')) return url;

    u.searchParams.set('utm_source', input.source);
    u.searchParams.set('utm_medium', input.medium);
    if (input.campaign) u.searchParams.set('utm_campaign', input.campaign);
    if (input.content) u.searchParams.set('utm_content', input.content);
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Wandelt ALLE spurig.com-Links in einem Text/HTML/Markdown-String um zu
 * UTM-Variants. Erkennt http(s)://... bis Whitespace / Quote / Tag-Schluss.
 */
export function addUtmToAllLinks(text: string, input: UtmInput): string {
  return text.replace(/https?:\/\/(?:www\.)?spurig\.com[^\s"'<>)]*/gi, (match) =>
    addUtm(match, input),
  );
}

/**
 * Cookie-Name fuer Attribution-Capture vor Signup
 */
export const UTM_COOKIE_NAME = 'spurig_utm';
export const UTM_COOKIE_MAX_AGE_DAYS = 30;

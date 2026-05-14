/**
 * Email-Discovery: crawlt eine Lead-Website nach Kontakt-E-Mails.
 *
 * Strategie:
 * 1. Homepage abrufen
 * 2. /impressum, /imprint, /kontakt, /contact, /about, /ueber-uns als Fallback
 * 3. mailto:-Links + Regex-Matches im HTML
 * 4. Filtern: ausschließen no-reply@, mailer-daemon@, postmaster@ usw.
 * 5. Priorisieren: Personal > Role-based (kontakt@, info@) > Generic
 *
 * KEINE Third-Party-API nötig — alles selbst gecrawled.
 */

import type { EmailStatus } from './types';

const CONTACT_PATHS = [
  '/',
  '/impressum',
  '/imprint',
  '/kontakt',
  '/contact',
  '/about',
  '/ueber-uns',
  '/über-uns',
  '/team',
];

const SKIP_LOCAL_PARTS = new Set([
  'no-reply',
  'noreply',
  'donotreply',
  'mailer-daemon',
  'postmaster',
  'abuse',
  'webmaster',
  'admin',
  'root',
  'wordpress',
  'host',
  'hostmaster',
]);

const ROLE_LOCAL_PARTS = new Set([
  'info',
  'kontakt',
  'contact',
  'hello',
  'hallo',
  'mail',
  'email',
  'service',
  'support',
  'office',
  'team',
  'sales',
  'vertrieb',
]);

// E-Mail-Regex — bewusst restriktiv, keine Tracking-Pixel-URLs als Mails matchen
const EMAIL_REGEX =
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}\b/g;

const FETCH_TIMEOUT_MS = 8000;

export type DiscoveredEmail = {
  email: string;
  source_url: string;
  priority: 'personal' | 'role' | 'generic';
};

export type DiscoveryResult = {
  emails: DiscoveredEmail[];
  pagesCrawled: number;
  error?: string;
};

/**
 * Hauptfunktion: gibt alle gefundenen E-Mails einer Website zurück, sortiert nach Priorität.
 */
export async function discoverEmailsForWebsite(
  websiteUrl: string,
): Promise<DiscoveryResult> {
  let baseUrl: URL;
  try {
    baseUrl = new URL(websiteUrl);
  } catch {
    return { emails: [], pagesCrawled: 0, error: 'invalid_url' };
  }

  const domain = baseUrl.hostname.replace(/^www\./, '');
  const found = new Map<string, DiscoveredEmail>();
  let pagesCrawled = 0;
  let lastError: string | undefined;

  for (const path of CONTACT_PATHS) {
    const url = new URL(path, baseUrl).toString();
    try {
      const html = await fetchHtml(url);
      if (!html) continue;
      pagesCrawled++;

      // 1. mailto:-Links
      const mailtoMatches = html.matchAll(/mailto:([^"'?<>\s]+)/gi);
      for (const m of mailtoMatches) {
        addEmail(found, decodeURIComponent(m[1]), url, domain);
      }

      // 2. Plain-Text-Matches
      const emailMatches = html.matchAll(EMAIL_REGEX);
      for (const m of emailMatches) {
        addEmail(found, m[0], url, domain);
      }

      // Early-exit wenn personal email gefunden
      if (Array.from(found.values()).some((e) => e.priority === 'personal')) {
        break;
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'fetch_failed';
    }
  }

  const emails = Array.from(found.values()).sort((a, b) => {
    const order = { personal: 0, role: 1, generic: 2 };
    return order[a.priority] - order[b.priority];
  });

  return { emails, pagesCrawled, error: emails.length === 0 ? lastError : undefined };
}

function addEmail(
  found: Map<string, DiscoveredEmail>,
  rawEmail: string,
  sourceUrl: string,
  preferredDomain: string,
): void {
  const email = rawEmail.toLowerCase().trim();
  if (!email.includes('@')) return;

  const [local, domain] = email.split('@');
  if (!local || !domain) return;

  // Skip-Liste
  if (SKIP_LOCAL_PARTS.has(local)) return;

  // Skip CDN/Pixel/Spam-Trap-Patterns
  if (/^[a-f0-9]{16,}$/i.test(local)) return;          // Hash-IDs
  if (domain.includes('sentry.io')) return;
  if (domain.includes('wixpress.com')) return;
  if (domain.includes('cloudfront.net')) return;
  if (domain.includes('amazonaws.com')) return;
  if (domain.endsWith('.png') || domain.endsWith('.jpg') || domain.endsWith('.gif')) return;
  if (/example\.(com|org|net)/.test(domain)) return;

  // Klassifizierung
  let priority: DiscoveredEmail['priority'];
  if (ROLE_LOCAL_PARTS.has(local)) {
    priority = 'role';
  } else if (/^[a-z]+\.[a-z]+$/.test(local) || /^[a-z]+$/.test(local)) {
    // firstname.lastname oder einzelner Vorname → personal
    priority = 'personal';
  } else {
    priority = 'generic';
  }

  // Bevorzuge E-Mails auf der gleichen Domain
  const onPreferredDomain =
    domain === preferredDomain || domain.endsWith('.' + preferredDomain);
  if (!onPreferredDomain && priority !== 'personal') return;

  if (!found.has(email)) {
    found.set(email, { email, source_url: sourceUrl, priority });
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; SpurigBot/1.0; +https://spurig.com/bot)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.5',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html') && !ct.includes('xml')) return null;

    const text = await res.text();
    return text.slice(0, 500_000); // max 500kb pro page
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

/**
 * Mappt DiscoveryResult auf email_status Enum für outbound_leads.
 */
export function emailStatusForResult(result: DiscoveryResult): EmailStatus {
  if (result.emails.length === 0) return 'unknown';
  return 'discovered';
}

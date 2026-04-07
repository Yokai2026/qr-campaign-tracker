import { createHash } from 'crypto';
import { UAParser } from 'ua-parser-js';

/**
 * Anonymize an IP address by zeroing the last two octets (IPv4)
 * or the last 80 bits (IPv6) before hashing.
 * This ensures the raw IP can never be recovered from the hash.
 */
export function anonymizeIp(ip: string): string {
  if (ip.includes(':')) {
    // IPv6: keep first 48 bits (3 groups), zero the rest
    const parts = ip.split(':');
    return parts.slice(0, 3).join(':') + ':0:0:0:0:0';
  }
  // IPv4: zero the last two octets
  const parts = ip.split('.');
  return `${parts[0]}.${parts[1]}.0.0`;
}

export function hashIp(ip: string): string {
  const anonymized = anonymizeIp(ip);
  const daySalt = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${anonymized}:${daySalt}`).digest('hex').slice(0, 16);
}

export function parseDevice(userAgent: string): string {
  const parser = new UAParser(userAgent);
  const device = parser.getDevice();
  if (device.type) return device.type; // mobile, tablet, etc.
  return 'desktop';
}

const BOT_PATTERNS = [
  'bot', 'crawl', 'spider', 'slurp', 'facebookexternalhit', 'facebot',
  'twitterbot', 'linkedinbot', 'whatsapp', 'telegrambot', 'discordbot',
  'slackbot', 'applebot', 'googlebot', 'bingbot', 'yandexbot',
  'pinterestbot', 'preview', 'fetch', 'curl', 'wget', 'headless',
];

export function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some((pattern) => ua.includes(pattern));
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return '0.0.0.0';
}

/**
 * Detect private/local IPs that cannot be geolocated.
 * Includes RFC1918 ranges, loopback, link-local, and unspecified.
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === '0.0.0.0' || ip === '::' || ip === '::1') return true;
  if (ip.startsWith('127.')) return true;
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('169.254.')) return true; // link-local
  if (ip.startsWith('fe80:') || ip.startsWith('fc00:') || ip.startsWith('fd')) return true;
  const m = ip.match(/^172\.(\d+)\./);
  if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true;
  return false;
}

/**
 * Resolve the visitor country from CDN edge headers (Vercel, Cloudflare).
 * No external API calls — DSGVO-compliant, no third-party data transfer.
 * Returns an ISO 3166-1 alpha-2 code (e.g. "DE") or null.
 */
export async function resolveCountry(
  headers: Headers,
  ip: string,
): Promise<string | null> {
  // 1. CDN edge headers (production Vercel / Cloudflare)
  const edge =
    headers.get('x-vercel-ip-country') ||
    headers.get('cf-ipcountry') ||
    headers.get('x-country-code');
  if (edge && edge !== 'XX' && edge.length === 2) {
    return edge.toUpperCase();
  }

  // No external geolocation fallback — only CDN headers are DSGVO-compliant
  // (no third-party data transfer without a DPA)
  return null;
}

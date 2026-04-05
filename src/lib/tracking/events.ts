import { createHash } from 'crypto';
import { UAParser } from 'ua-parser-js';

export function hashIp(ip: string): string {
  // Hash with a daily salt to anonymize while allowing same-day dedup
  const daySalt = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${ip}:${daySalt}`).digest('hex').slice(0, 16);
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
 * Resolve the visitor country using a fallback chain:
 * 1. CDN edge headers (Vercel, Cloudflare) — zero-latency, used in production
 * 2. Private/local IP detection — skip lookup, return null
 * 3. ip-api.com free tier — used when deploying behind non-CDN infra
 *
 * Returns an ISO 3166-1 alpha-2 code (e.g. "DE") or null when it cannot be determined.
 * Always completes within ~800ms even on API timeout.
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

  // 2. Skip private/local IPs — they cannot be geolocated
  if (isPrivateIp(ip)) return null;

  // 3. Free IP geolocation fallback (no API key, 45 req/min)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode`,
      { signal: controller.signal, cache: 'no-store' },
    );
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = (await res.json()) as { status?: string; countryCode?: string };
    if (data.status === 'success' && data.countryCode && data.countryCode.length === 2) {
      return data.countryCode.toUpperCase();
    }
  } catch {
    // timeout, network error, or JSON parse — graceful degradation
  }

  return null;
}

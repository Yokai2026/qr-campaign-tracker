import { createServiceClient } from '@/lib/supabase/server';
import { getAppUrl } from '@/lib/constants';

/**
 * Returns the base URL used to build short URLs (for QR codes & links).
 * Prefers the primary verified custom domain; falls back to NEXT_PUBLIC_APP_URL.
 *
 * Cached per request — suitable for Server Components / Server Actions.
 */
export async function getShortUrlBase(): Promise<string> {
  try {
    const supabase = await createServiceClient();
    const { data } = await supabase
      .from('custom_domains')
      .select('host')
      .eq('is_primary', true)
      .eq('verified', true)
      .maybeSingle();

    if (data?.host) {
      return `https://${data.host}`;
    }
  } catch {
    // Fall through to default
  }
  return getAppUrl();
}

/**
 * Build a short URL for a given short_code, using the primary custom domain if available.
 */
export async function buildShortUrl(shortCode: string): Promise<string> {
  const base = await getShortUrlBase();
  return `${base}/r/${shortCode}`;
}

/**
 * Build a redirect URL using an explicit host (per-QR short_host).
 * - Custom host → https://{host}/{shortCode} (shorter, branded; middleware rewrites to /r/)
 * - Empty host → falls back to app default https://app/r/{shortCode}
 */
export async function buildRedirectUrlForHost(
  shortHost: string | null | undefined,
  shortCode: string,
): Promise<string> {
  if (shortHost && shortHost.trim().length > 0) {
    return `https://${shortHost.toLowerCase()}/${shortCode}`;
  }
  const base = getAppUrl();
  return `${base}/r/${shortCode}`;
}

/**
 * Returns true if the given host is a known custom domain (any verified entry).
 * Used by middleware for host-based routing.
 */
export async function isKnownCustomHost(host: string): Promise<boolean> {
  try {
    const supabase = await createServiceClient();
    const { data } = await supabase
      .from('custom_domains')
      .select('id')
      .eq('host', host.toLowerCase())
      .eq('verified', true)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

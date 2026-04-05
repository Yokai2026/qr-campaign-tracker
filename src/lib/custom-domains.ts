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

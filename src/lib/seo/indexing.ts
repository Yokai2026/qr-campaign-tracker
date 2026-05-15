/**
 * Auto-Indexing-Notifier fuer neue Blogs.
 *
 * Pingt:
 *  1. Bing IndexNow (mit BING_API_KEY) — instant index
 *  2. Google: kein offizieller Free-Tier mehr fuer "URL submission"-API.
 *     Sitemap-Ping wirkt aber als Hinweis fuer GoogleBot.
 *  3. IndexNow-Standard (Yandex/Seznam) — gratis Bonus
 *
 * Best-effort: failures werden geloggt, nicht propagiert.
 */

const BING_INDEXNOW_KEY = '32fda7c484cc47e88b401f4b47f4425c'; // public-safe (in .well-known/<key>.txt published)
const SITE = 'spurig.com';

export async function notifySearchEngines(urls: string[]): Promise<{
  bing: { ok: boolean; error?: string };
  google: { ok: boolean; error?: string };
}> {
  const [bing, google] = await Promise.all([pingBingIndexNow(urls), pingGoogleSitemap()]);
  return { bing, google };
}

/**
 * IndexNow — gemeinsam von Bing/Yandex/Seznam unterstuetzt.
 * Docs: https://www.indexnow.org/documentation
 */
async function pingBingIndexNow(urls: string[]): Promise<{ ok: boolean; error?: string }> {
  if (urls.length === 0) return { ok: true };
  try {
    const res = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: SITE,
        key: BING_INDEXNOW_KEY,
        urlList: urls.slice(0, 10_000),
      }),
    });
    if (res.ok || res.status === 202) return { ok: true };
    return { ok: false, error: `${res.status}: ${(await res.text()).slice(0, 120)}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

/**
 * Google: Sitemap-Ping. Indexing-API (push) braucht OAuth + ist nur fuer
 * Job-Postings/Livestreams offiziell. Sitemap-Ping ist die universelle Variante.
 */
async function pingGoogleSitemap(): Promise<{ ok: boolean; error?: string }> {
  try {
    const sitemapUrl = encodeURIComponent(`https://${SITE}/sitemap.xml`);
    const res = await fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`, {
      method: 'GET',
    });
    if (res.ok) return { ok: true };
    return { ok: false, error: `${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

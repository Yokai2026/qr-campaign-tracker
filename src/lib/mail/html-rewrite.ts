/**
 * HTML-Body-Rewrite für Mail-Tracking.
 *
 * Pro Mail-Send:
 *   1. Extrahiere alle <a href> aus dem Body
 *   2. Ersetze jeden href durch Spurig-Click-Redirect mit unique click_token
 *   3. Hänge Tracking-Pixel ans Body-Ende
 *
 * Wird in /api/mail/campaigns/[id]/send aufgerufen, einmal pro Recipient.
 */

import { generateToken } from './tokens';

export type RewrittenBody = {
  html: string;
  links: Array<{ original_url: string; click_token: string }>;
};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://spurig.com';

/**
 * Ersetzt alle href-Werte im HTML durch Tracking-Redirects.
 * Sammelt original_url + generated click_token pro Link.
 */
export function rewriteLinks(html: string): RewrittenBody {
  const links: Array<{ original_url: string; click_token: string }> = [];

  // Match <a href="..."> oder <a href='...'>
  // Lassen mailto:, tel:, javascript:, # in Ruhe.
  const rewritten = html.replace(/<a\s+([^>]*?)href=(["'])([^"']+)\2([^>]*?)>/gi, (match, before, quote, href, after) => {
    if (
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('#') ||
      href.startsWith('javascript:') ||
      href.startsWith('{{') // template placeholder (e.g. {{unsubscribe_url}})
    ) {
      return match;
    }

    const click_token = generateToken();
    links.push({ original_url: href, click_token });
    const trackingUrl = `${BASE_URL}/api/mail/click/${click_token}`;
    return `<a ${before}href=${quote}${trackingUrl}${quote}${after}>`;
  });

  return { html: rewritten, links };
}

/**
 * Hängt einen 1x1-Tracking-Pixel ans Ende des Body-HTML.
 * Pixel-URL trägt den pixel_token (= recipient-specific).
 */
export function appendTrackingPixel(html: string, pixelToken: string): string {
  const pixelUrl = `${BASE_URL}/api/mail/track/${pixelToken}.gif`;
  // Kommentar markiert die Stelle (für Debug), display:block damit nicht inline-versteckt
  const pixelTag = `\n<!-- spurig-tracking-pixel -->\n<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px" />\n`;

  // Wenn </body> vorhanden → davor einfügen, sonst einfach anhängen
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${pixelTag}</body>`);
  }
  return html + pixelTag;
}

/**
 * Vollständiger Rewrite-Pass: Links umschreiben + Pixel anhängen.
 * Returns final HTML + sammelte Link-Tokens (für DB-Insert).
 */
export function prepareTrackedHtml(rawHtml: string, pixelToken: string): RewrittenBody {
  const { html: linkedHtml, links } = rewriteLinks(rawHtml);
  const finalHtml = appendTrackingPixel(linkedHtml, pixelToken);
  return { html: finalHtml, links };
}

/**
 * Plain-text Body aus HTML extrahieren (Fallback für Recipients ohne HTML-Support).
 * Naive Implementation — entfernt Tags, kollabiert Whitespace.
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

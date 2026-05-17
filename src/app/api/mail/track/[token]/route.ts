/**
 * GET /api/mail/track/[token]
 * GET /api/mail/track/[token].gif
 *
 * Tracking-Pixel-Endpoint. Wird vom Mail-Client geladen sobald die Mail
 * geöffnet (oder von Apple-MPP-Proxy pre-loaded) wird.
 *
 * Loggt Open-Event in mail_opens + aggregiert in mail_recipients.
 * Antwortet IMMER mit 1x1 transparenter GIF, auch bei Fehler (sonst sieht
 * der Client einen broken-image-Indikator).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { hashIp } from '@/lib/tracking/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 1x1 transparente GIF als Buffer
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
  'base64',
);

// Apple Mail Privacy Protection IP-Ranges (vereinfacht, nicht vollständig)
// Voll-Liste: https://support.apple.com/en-us/HT212614
const APPLE_MPP_UA_PATTERN = /mail\/(\d+)|apple|macintosh.*safari/i;
const APPLE_PROXY_IP_PREFIXES = ['17.', '23.234.', '23.40.', '23.45.', '23.66.', '23.77.'];

// Gmail Image Proxy (lädt alle Bilder beim Empfang in Google's Cache, OHNE User-Aktion)
// User-Agent typisch: "...Gecko Firefox/11.0 (via ggpht.com GoogleImageProxy)"
// IP-Ranges: 66.249.x, 66.102.x, 64.233.x, 72.14.x, 74.125.x, 173.194.x, 209.85.x, 216.239.x
// Gmail-Image-Proxy nutzt teilweise einen alten Chrome/42-Fake-UA OHNE den
// expliziten "GoogleImageProxy"-String. Spezifische Markers:
//   Chrome/42.0.2311.13 — outdated Chrome-Version, Gmail-spezifisch
//   Windows NT 5.1 (XP) — Gmail-Fake-OS in der UA-Verschleierung
const GMAIL_PROXY_UA_PATTERN = /GoogleImageProxy|ggpht\.com|via\s+google|Chrome\/42\.0\.2311|Windows NT 5\.1.*Chrome\/42/i;
const GMAIL_PROXY_IP_PREFIXES = [
  '66.249.', '66.102.', '64.18.', '64.233.', '72.14.', '74.125.',
  '173.194.', '209.85.', '216.58.', '216.239.',
];

// Yahoo / AOL Mail Proxy
const YAHOO_PROXY_UA_PATTERN = /YahooMailProxy|YPC|Yahoo.*Image/i;

// Outlook.com / Office365 Pre-Fetcher (Safe Links / ATP)
const OUTLOOK_PREFETCH_UA_PATTERN = /Microsoft.*Office|Outlook.*Mobile|MSOffice|OfficeProtect|SafeLinks/i;

// Bekannte Email-Security-Scanner (Bot-Detection)
const BOT_UA_PATTERN = /microsoft.?outlook|defender|proofpoint|mimecast|barracuda|symantec|trendmicro|sophos|ironport|cisco|fortinet|crawler|bot|spider/i;

// Quasi-immer-Bot: Curl, Wget, Postman, Python-Requests etc.
const BASIC_BOT_UA = /^(curl|wget|python-requests|libwww|httpclient|java\/|go-http-client)/i;

function isAppleProxy(ua: string, ip: string): boolean {
  if (APPLE_PROXY_IP_PREFIXES.some((p) => ip.startsWith(p))) return true;
  return APPLE_MPP_UA_PATTERN.test(ua) && /privacy|preview/i.test(ua);
}

function isGmailProxy(ua: string, ip: string): boolean {
  if (GMAIL_PROXY_UA_PATTERN.test(ua)) return true;
  if (GMAIL_PROXY_IP_PREFIXES.some((p) => ip.startsWith(p))) return true;
  return false;
}

function isYahooProxy(ua: string): boolean {
  return YAHOO_PROXY_UA_PATTERN.test(ua);
}

function isOutlookPrefetch(ua: string): boolean {
  return OUTLOOK_PREFETCH_UA_PATTERN.test(ua);
}

function isBot(ua: string): boolean {
  if (!ua || ua.length < 10) return true; // leerer/kurzer UA = wahrscheinlich Bot
  if (BASIC_BOT_UA.test(ua)) return true;
  return BOT_UA_PATTERN.test(ua);
}

// Aggregierte Proxy-Detection: alle Email-Proxy-Mechanismen die KEINEN echten User-Open darstellen
function isAnyMailProxy(ua: string, ip: string): boolean {
  return isAppleProxy(ua, ip)
    || isGmailProxy(ua, ip)
    || isYahooProxy(ua)
    || isOutlookPrefetch(ua);
}

function gifResponse() {
  return new NextResponse(new Uint8Array(TRANSPARENT_GIF), {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': TRANSPARENT_GIF.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token: rawToken } = await params;
  // Trailing .gif strippen (manche Clients fordern explicit .gif an)
  const token = rawToken.replace(/\.gif$/i, '');

  if (!token || token.length < 10) return gifResponse();

  // Fire-and-forget DB-Log (Pixel muss SCHNELL antworten, sonst Timeout im Mail-Client)
  void logOpen(token, request).catch((e) => {
    console.error('[mail-track] log-open error:', e);
  });

  return gifResponse();
}

async function logOpen(pixelToken: string, request: NextRequest) {
  const ua = request.headers.get('user-agent') ?? '';
  const ipRaw =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '0.0.0.0';
  const ipHash = hashIp(ipRaw);

  const apple = isAppleProxy(ua, ipRaw);
  const gmailProxy = isGmailProxy(ua, ipRaw);
  const proxy = isAnyMailProxy(ua, ipRaw);
  const bot = isBot(ua);

  const sb = await createServiceClient();
  const { data: recipient } = await sb
    .from('mail_recipients')
    .select('id, open_count, human_open_count, first_open_at, sent_at')
    .eq('pixel_token', pixelToken)
    .maybeSingle();

  if (!recipient) return;

  // Zeit-Heuristik: Open innerhalb 60s nach Send = wahrscheinlich Proxy-Preload,
  // nicht echter User. Gmail/Yahoo/Outlook cachen Bilder beim Empfang sofort.
  let suspiciousFastOpen = false;
  if (recipient.sent_at) {
    const sentAtMs = new Date(recipient.sent_at as string).getTime();
    const elapsedMs = Date.now() - sentAtMs;
    if (elapsedMs > 0 && elapsedMs < 60_000) {
      suspiciousFastOpen = true;
    }
  }

  // Insert detail Event (apple-flag bleibt im Schema; gmail/yahoo zählen über is_bot=true)
  await sb.from('mail_opens').insert({
    recipient_id: recipient.id,
    user_agent: ua.slice(0, 500),
    ip_hash: ipHash,
    is_apple_proxy: apple || gmailProxy, // Gmail-Proxy als "proxy" gleich behandeln
    is_bot: bot || suspiciousFastOpen,
  });

  // Aggregat in mail_recipients updaten
  // isHuman strikt: KEIN Proxy + KEIN Bot + KEIN suspicious-fast (<60s nach Send)
  const isHuman = !proxy && !bot && !suspiciousFastOpen;
  const updates: Record<string, unknown> = {
    last_open_at: new Date().toISOString(),
    open_count: (recipient.open_count ?? 0) + 1,
    last_user_agent: ua.slice(0, 500),
    last_ip_hash: ipHash,
  };
  if (isHuman) updates.human_open_count = (recipient.human_open_count ?? 0) + 1;
  // first_open_at nur setzen wenn HUMAN — verhindert dass "Erstes Open"
  // einen Proxy-Preload anzeigt (User-Bug 17.05.2026)
  if (isHuman && !recipient.first_open_at) updates.first_open_at = new Date().toISOString();

  await sb.from('mail_recipients').update(updates).eq('id', recipient.id);

  // Aggregat in mail_campaigns updaten — über sb.rpc waere effizienter, hier simpel
  const { data: rcpt } = await sb
    .from('mail_recipients')
    .select('campaign_id')
    .eq('id', recipient.id)
    .single();
  if (rcpt?.campaign_id) {
    // Inkrementelle Updates per RPC waeren atomar, hier per Re-Aggregate
    const { data: agg } = await sb
      .from('mail_recipients')
      .select('open_count, human_open_count')
      .eq('campaign_id', rcpt.campaign_id);
    if (agg) {
      const totalOpens = agg.reduce((s, r) => s + (r.open_count ?? 0), 0);
      const totalHuman = agg.reduce((s, r) => s + (r.human_open_count ?? 0), 0);
      await sb.from('mail_campaigns').update({
        open_count: totalOpens,
        human_open_count: totalHuman,
      }).eq('id', rcpt.campaign_id);
    }
  }
}

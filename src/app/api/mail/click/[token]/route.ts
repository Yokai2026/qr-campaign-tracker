/**
 * GET /api/mail/click/[token]
 *
 * Click-Tracking-Endpoint. Wenn jemand auf einen Link in einer getrackten
 * Mail klickt, kommt er erst hier vorbei. Wir loggen den Klick, dann
 * 302-Redirect zur Original-URL.
 *
 * Apple-MPP fälscht KEINE Clicks — Clicks sind der primäre Engagement-
 * Indikator.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { hashIp } from '@/lib/tracking/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BOT_UA_PATTERN = /microsoft.?outlook|defender|proofpoint|mimecast|barracuda|symantec|trendmicro|sophos|ironport|cisco|fortinet|crawler|bot|spider/i;

function isBot(ua: string): boolean {
  return BOT_UA_PATTERN.test(ua);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token || token.length < 10) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const sb = await createServiceClient();

  // Link-Daten nachschlagen
  const { data: link } = await sb
    .from('mail_links')
    .select('id, campaign_id, original_url, click_count, unique_click_count')
    .eq('click_token', token)
    .maybeSingle();

  if (!link) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const targetUrl = link.original_url;

  // Welcher Recipient? — Identifizieren über letzten Open auf demselben Campaign + UA-Fingerprint.
  // MVP-Heuristik: nimm den ersten Recipient mit pixel_token-Match aus Query-Param "r" wenn vorhanden,
  // sonst lass recipient_id null und schreibe ein "anonymes" click event.
  // (Eleganter wäre: pro Recipient eigenen click_token. Spätere Optimierung.)
  const url = new URL(request.url);
  const recipientPixelToken = url.searchParams.get('r');
  let recipientId: string | null = null;
  if (recipientPixelToken) {
    const { data: r } = await sb
      .from('mail_recipients')
      .select('id, click_count, first_click_at')
      .eq('pixel_token', recipientPixelToken)
      .eq('campaign_id', link.campaign_id)
      .maybeSingle();
    recipientId = r?.id ?? null;

    if (r) {
      const updates: Record<string, unknown> = {
        click_count: (r.click_count ?? 0) + 1,
      };
      if (!r.first_click_at) updates.first_click_at = new Date().toISOString();
      await sb.from('mail_recipients').update(updates).eq('id', r.id);
    }
  }

  const ua = request.headers.get('user-agent') ?? '';
  const ipRaw =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '0.0.0.0';
  const ipHash = hashIp(ipRaw);
  const bot = isBot(ua);

  // Fire-and-forget event log
  if (recipientId) {
    try {
      await sb.from('mail_clicks').insert({
        recipient_id: recipientId,
        link_id: link.id,
        user_agent: ua.slice(0, 500),
        ip_hash: ipHash,
        is_bot: bot,
      });
    } catch {
      // Klick-Logging-Fehler nicht propagieren — Redirect ist wichtiger
    }
  }

  // Link-Aggregat update
  await sb.from('mail_links').update({
    click_count: (link.click_count ?? 0) + 1,
  }).eq('id', link.id);

  // Campaign-Aggregat
  const { data: aggLinks } = await sb
    .from('mail_links')
    .select('click_count')
    .eq('campaign_id', link.campaign_id);
  if (aggLinks) {
    const totalClicks = aggLinks.reduce((s, l) => s + (l.click_count ?? 0), 0);
    await sb.from('mail_campaigns').update({ click_count: totalClicks }).eq('id', link.campaign_id);
  }

  // Redirect zur Ziel-URL
  return NextResponse.redirect(targetUrl, { status: 302 });
}

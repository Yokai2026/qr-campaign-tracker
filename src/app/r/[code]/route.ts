import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { hashIp, getClientIp, isBot, resolveCountry } from '@/lib/tracking/events';
import { normalizeReferrer, sanitizeUrl, parseUserAgentMinimal } from '@/lib/privacy';
import { buildTargetUrlWithUtm } from '@/lib/qr/generate';
import { isUrlSafe } from '@/lib/validations';
import { checkRateLimit } from '@/lib/rate-limit';
import { evaluateRules } from '@/lib/redirect-rules/evaluate';
import { selectVariant } from '@/lib/ab-testing/select';
import type { RedirectRule, AbVariant } from '@/types';

export const dynamic = 'force-dynamic';

function errorHtml(title: string, message?: string) {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fafafa;color:#111}
.c{text-align:center;max-width:400px;padding:2rem}.c h1{font-size:1.25rem;font-weight:600;margin-bottom:.5rem}.c p{font-size:.875rem;color:#666;margin-bottom:.25rem}
.c a{display:inline-block;margin-top:1.5rem;font-size:.75rem;color:#999;text-decoration:underline;text-underline-offset:2px}</style></head>
<body><div class="c"><h1>${title}</h1>${message ? `<p>${message}</p>` : ''}<a href="/datenschutz">Datenschutzerklaerung</a></div></body></html>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const ip = getClientIp(request);
  const ipHash = hashIp(ip);

  // Rate limit: 120 redirects per minute per IP (generous for real users, blocks abuse)
  const rl = checkRateLimit(ipHash, 120, 60_000);
  if (!rl.allowed) {
    return new NextResponse(
      errorHtml('Zu viele Anfragen.', 'Bitte warte einen Moment und versuche es erneut.'),
      { status: 429, headers: { 'Content-Type': 'text/html', 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  const supabase = await createServiceClient();

  const userAgent = request.headers.get('user-agent') || '';
  const rawReferrer = request.headers.get('referer') || null;
  const ua = parseUserAgentMinimal(userAgent);
  const country = await resolveCountry(request.headers, ip);
  const botDetected = isBot(userAgent);

  // =========================================
  // 1. Try QR code lookup
  // =========================================
  const { data: qr } = await supabase
    .from('qr_codes')
    .select(`
      *,
      placement:placements(
        id, campaign_id, placement_code,
        campaign:campaigns(id, slug)
      )
    `)
    .eq('short_code', code)
    .maybeSingle();

  if (qr) {
    return handleQrRedirect(supabase, qr, {
      code, userAgent, referrer: normalizeReferrer(rawReferrer), ipHash, deviceType: ua.device_type, browserFamily: ua.browser_family, osFamily: ua.os_family, country, botDetected,
    });
  }

  // =========================================
  // 2. Try short link lookup
  // =========================================
  const { data: link } = await supabase
    .from('short_links')
    .select('*, link_mode')
    .eq('short_code', code)
    .maybeSingle();

  if (link) {
    return handleLinkRedirect(supabase, link, {
      code, userAgent, referrer: normalizeReferrer(rawReferrer), ipHash, deviceType: ua.device_type, browserFamily: ua.browser_family, osFamily: ua.os_family, country, botDetected,
    });
  }

  // =========================================
  // 3. Not found
  // =========================================
  return new NextResponse(
    errorHtml('Link nicht gefunden.', 'Dieser Kurzlink existiert nicht.'),
    { status: 404, headers: { 'Content-Type': 'text/html' } }
  );
}

// =============================================
// QR Code redirect (existing logic)
// =============================================
type TrackingContext = {
  code: string;
  userAgent: string;
  referrer: string | null;
  ipHash: string;
  deviceType: string;
  browserFamily: string;
  osFamily: string;
  country: string | null;
  botDetected: boolean;
};

type SupabaseClient = Awaited<ReturnType<typeof createServiceClient>>;

async function handleQrRedirect(
  supabase: SupabaseClient,
  qr: Record<string, unknown>,
  ctx: TrackingContext
) {
  const placement = qr.placement as {
    id: string; campaign_id: string; placement_code: string;
    campaign: { id: string; slug: string } | null;
  } | null;
  const campaignId = placement?.campaign_id || null;

  const baseEvent = {
    qr_code_id: qr.id as string,
    placement_id: qr.placement_id as string,
    campaign_id: campaignId,
    short_code: ctx.code,
    referrer: ctx.referrer,
    user_agent: null,
    device_type: ctx.deviceType,
    browser_family: ctx.browserFamily,
    os_family: ctx.osFamily,
    ip_hash: ctx.ipHash,
    country: ctx.country,
    is_bot: ctx.botDetected,
  };

  if (!qr.active) {
    await supabase.from('redirect_events').insert({
      ...baseEvent, event_type: 'qr_blocked_inactive', destination_url: null,
    });
    return new NextResponse(
      errorHtml('Dieser QR-Code ist derzeit nicht aktiv.'),
      { status: 410, headers: { 'Content-Type': 'text/html' } }
    );
  }

  const now = new Date();
  if (qr.valid_until && new Date(qr.valid_until as string) < now) {
    await supabase.from('redirect_events').insert({
      ...baseEvent, event_type: 'qr_expired', destination_url: null,
    });
    return new NextResponse(
      errorHtml('Dieser QR-Code ist abgelaufen.'),
      { status: 410, headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (qr.valid_from && new Date(qr.valid_from as string) > now) {
    return new NextResponse(
      errorHtml('Dieser QR-Code ist noch nicht aktiv.'),
      { status: 425, headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (qr.max_scans) {
    const { count } = await supabase
      .from('redirect_events')
      .select('id', { count: 'exact', head: true })
      .eq('qr_code_id', qr.id as string)
      .eq('event_type', 'qr_open');

    if (count !== null && count >= (qr.max_scans as number)) {
      await supabase.from('redirect_events').insert({
        ...baseEvent, event_type: 'qr_blocked_inactive', destination_url: null,
      });

      const limitUrl = qr.limit_redirect_url as string | null;
      if (limitUrl && isUrlSafe(limitUrl)) {
        return NextResponse.redirect(limitUrl, 302);
      }
      return new NextResponse(
        errorHtml('Dieses Angebot ist leider nicht mehr verfügbar.', 'Das Scan-Limit wurde erreicht.'),
        { status: 410, headers: { 'Content-Type': 'text/html' } }
      );
    }
  }

  let targetUrl = qr.target_url as string;
  if (!isUrlSafe(targetUrl)) {
    return new NextResponse('Invalid redirect target', { status: 400 });
  }

  // --- Conditional redirect rules (priority 1) ---
  let abVariantId: string | null = null;
  const { data: rules } = await supabase
    .from('redirect_rules')
    .select('*')
    .eq('qr_code_id', qr.id as string)
    .eq('active', true);

  let ruleMatched = false;
  if (rules && rules.length > 0) {
    const ruleMatch = evaluateRules(rules as RedirectRule[], {
      deviceType: ctx.deviceType,
      osFamily: ctx.osFamily,
      browserFamily: ctx.browserFamily,
      country: ctx.country,
    });
    if (ruleMatch && isUrlSafe(ruleMatch)) {
      targetUrl = ruleMatch;
      ruleMatched = true;
    }
  }

  // --- A/B testing (priority 2, only if no conditional rule matched) ---
  if (!ruleMatched) {
    const { data: variants } = await supabase
      .from('ab_variants')
      .select('*')
      .eq('qr_code_id', qr.id as string)
      .eq('active', true);

    if (variants && variants.length > 0) {
      const picked = selectVariant(variants as AbVariant[]);
      if (picked && isUrlSafe(picked.target_url)) {
        targetUrl = picked.target_url;
        abVariantId = picked.id;
      }
    }
  }

  targetUrl = buildTargetUrlWithUtm(targetUrl, {
    utm_source: (qr.utm_source as string) || undefined,
    utm_medium: (qr.utm_medium as string) || undefined,
    utm_campaign: (qr.utm_campaign as string) || undefined,
    utm_content: (qr.utm_content as string) || undefined,
    utm_id: (qr.utm_id as string) || undefined,
  });

  const url = new URL(targetUrl);
  url.searchParams.set('qr', ctx.code);
  if (qr.placement_id) url.searchParams.set('pid', qr.placement_id as string);
  if (campaignId) url.searchParams.set('cid', campaignId);
  targetUrl = url.toString();

  await supabase.from('redirect_events').insert({
    ...baseEvent, event_type: 'qr_open', destination_url: sanitizeUrl(targetUrl),
    ab_variant_id: abVariantId,
  });

  return NextResponse.redirect(targetUrl, 302);
}

// =============================================
// Short Link redirect
// =============================================
async function handleLinkRedirect(
  supabase: SupabaseClient,
  link: Record<string, unknown>,
  ctx: TrackingContext
) {
  const baseEvent = {
    short_link_id: link.id as string,
    campaign_id: link.campaign_id as string | null,
    short_code: ctx.code,
    referrer: ctx.referrer,
    user_agent: null,
    device_type: ctx.deviceType,
    browser_family: ctx.browserFamily,
    os_family: ctx.osFamily,
    ip_hash: ctx.ipHash,
    country: ctx.country,
    is_bot: ctx.botDetected,
  };

  if (!link.active || link.archived) {
    await supabase.from('redirect_events').insert({
      ...baseEvent, event_type: 'link_blocked_inactive', destination_url: null,
    });
    return new NextResponse(
      errorHtml('Dieser Link ist derzeit nicht aktiv.'),
      { status: 410, headers: { 'Content-Type': 'text/html' } }
    );
  }

  const now = new Date();
  if (link.expires_at && new Date(link.expires_at as string) < now) {
    await supabase.from('redirect_events').insert({
      ...baseEvent, event_type: 'link_expired', destination_url: null,
    });
    const expiredUrl = link.expired_url as string | null;
    if (expiredUrl && isUrlSafe(expiredUrl)) {
      return NextResponse.redirect(expiredUrl, 302);
    }
    return new NextResponse(
      errorHtml('Dieser Link ist abgelaufen.'),
      { status: 410, headers: { 'Content-Type': 'text/html' } }
    );
  }

  let targetUrl = link.target_url as string;
  if (!isUrlSafe(targetUrl)) {
    return new NextResponse('Invalid redirect target', { status: 400 });
  }

  // --- Conditional redirect rules (priority 1) ---
  let linkAbVariantId: string | null = null;
  const { data: linkRules } = await supabase
    .from('redirect_rules')
    .select('*')
    .eq('short_link_id', link.id as string)
    .eq('active', true);

  let linkRuleMatched = false;
  if (linkRules && linkRules.length > 0) {
    const ruleMatch = evaluateRules(linkRules as RedirectRule[], {
      deviceType: ctx.deviceType,
      osFamily: ctx.osFamily,
      browserFamily: ctx.browserFamily,
      country: ctx.country,
    });
    if (ruleMatch && isUrlSafe(ruleMatch)) {
      targetUrl = ruleMatch;
      linkRuleMatched = true;
    }
  }

  // --- A/B testing (priority 2, only if no conditional rule matched) ---
  if (!linkRuleMatched) {
    const { data: linkVariants } = await supabase
      .from('ab_variants')
      .select('*')
      .eq('short_link_id', link.id as string)
      .eq('active', true);

    if (linkVariants && linkVariants.length > 0) {
      const picked = selectVariant(linkVariants as AbVariant[]);
      if (picked && isUrlSafe(picked.target_url)) {
        targetUrl = picked.target_url;
        linkAbVariantId = picked.id;
      }
    }
  }

  const isDirect = link.link_mode === 'direct';

  if (!isDirect) {
    // Standard mode: append UTM + attribution params to the URL
    targetUrl = buildTargetUrlWithUtm(targetUrl, {
      utm_source: (link.utm_source as string) || undefined,
      utm_medium: (link.utm_medium as string) || 'link',
      utm_campaign: (link.utm_campaign as string) || undefined,
      utm_content: (link.utm_content as string) || undefined,
      utm_id: (link.utm_id as string) || undefined,
    });

    const url = new URL(targetUrl);
    url.searchParams.set('sl', ctx.code);
    if (link.campaign_id) url.searchParams.set('cid', link.campaign_id as string);
    targetUrl = url.toString();
  }
  // Direct mode: clean redirect — no tracking params on the URL.
  // Tracking happens server-side only (redirect_events insert below).

  await supabase.from('redirect_events').insert({
    ...baseEvent, event_type: 'link_open', destination_url: sanitizeUrl(targetUrl),
    ab_variant_id: linkAbVariantId,
  });

  return NextResponse.redirect(targetUrl, 302);
}

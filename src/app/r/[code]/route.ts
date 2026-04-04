import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { hashIp, parseDevice, getClientIp } from '@/lib/tracking/events';
import { buildTargetUrlWithUtm } from '@/lib/qr/generate';
import { isUrlSafe } from '@/lib/validations';

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
  const supabase = await createServiceClient();

  // Look up QR code by short_code
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
    .single();

  if (!qr) {
    return new NextResponse('QR code not found', { status: 404 });
  }

  const userAgent = request.headers.get('user-agent') || '';
  const referrer = request.headers.get('referer') || null;
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);
  const deviceType = parseDevice(userAgent);
  const country = request.headers.get('x-vercel-ip-country') || null;

  const placement = qr.placement as { id: string; campaign_id: string; placement_code: string; campaign: { id: string; slug: string } | null } | null;
  const campaignId = placement?.campaign_id || null;

  // Check if QR code is active
  if (!qr.active) {
    await supabase.from('redirect_events').insert({
      qr_code_id: qr.id,
      placement_id: qr.placement_id,
      campaign_id: campaignId,
      short_code: code,
      event_type: 'qr_blocked_inactive',
      referrer,
      user_agent: userAgent,
      device_type: deviceType,
      ip_hash: ipHash,
      destination_url: null,
      country,
    });
    return new NextResponse(
      errorHtml('Dieser QR-Code ist derzeit nicht aktiv.'),
      { status: 410, headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Check validity dates
  const now = new Date();
  if (qr.valid_until && new Date(qr.valid_until) < now) {
    await supabase.from('redirect_events').insert({
      qr_code_id: qr.id,
      placement_id: qr.placement_id,
      campaign_id: campaignId,
      short_code: code,
      event_type: 'qr_expired',
      referrer,
      user_agent: userAgent,
      device_type: deviceType,
      ip_hash: ipHash,
      destination_url: null,
      country,
    });
    return new NextResponse(
      errorHtml('Dieser QR-Code ist abgelaufen.'),
      { status: 410, headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (qr.valid_from && new Date(qr.valid_from) > now) {
    return new NextResponse(
      errorHtml('Dieser QR-Code ist noch nicht aktiv.'),
      { status: 425, headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Check scan limit
  if (qr.max_scans) {
    const { count } = await supabase
      .from('redirect_events')
      .select('id', { count: 'exact', head: true })
      .eq('qr_code_id', qr.id)
      .eq('event_type', 'qr_open');

    if (count !== null && count >= qr.max_scans) {
      // Log the event
      await supabase.from('redirect_events').insert({
        qr_code_id: qr.id,
        placement_id: qr.placement_id,
        campaign_id: campaignId,
        short_code: code,
        event_type: 'qr_blocked_inactive',
        referrer,
        user_agent: userAgent,
        device_type: deviceType,
        ip_hash: ipHash,
        destination_url: null,
      });

      // Redirect to limit URL or show message
      if (qr.limit_redirect_url && isUrlSafe(qr.limit_redirect_url)) {
        return NextResponse.redirect(qr.limit_redirect_url, 302);
      }
      return new NextResponse(
        errorHtml('Dieses Angebot ist leider nicht mehr verfuegbar.', 'Das Scan-Limit wurde erreicht.'),
        { status: 410, headers: { 'Content-Type': 'text/html' } }
      );
    }
  }

  // Build target URL with UTM params
  let targetUrl = qr.target_url;

  // Safety check
  if (!isUrlSafe(targetUrl)) {
    return new NextResponse('Invalid redirect target', { status: 400 });
  }

  targetUrl = buildTargetUrlWithUtm(targetUrl, {
    utm_source: qr.utm_source || undefined,
    utm_medium: qr.utm_medium || undefined,
    utm_campaign: qr.utm_campaign || undefined,
    utm_content: qr.utm_content || undefined,
    utm_id: qr.utm_id || undefined,
  });

  // Append QR attribution params for landing page tracking
  const url = new URL(targetUrl);
  url.searchParams.set('qr', code);
  if (qr.placement_id) url.searchParams.set('pid', qr.placement_id);
  if (campaignId) url.searchParams.set('cid', campaignId);
  targetUrl = url.toString();

  // Record redirect event (non-blocking)
  await supabase.from('redirect_events').insert({
    qr_code_id: qr.id,
    placement_id: qr.placement_id,
    campaign_id: campaignId,
    short_code: code,
    event_type: 'qr_open',
    referrer,
    user_agent: userAgent,
    device_type: deviceType,
    ip_hash: ipHash,
    destination_url: targetUrl,
    country,
  });

  return NextResponse.redirect(targetUrl, 302);
}

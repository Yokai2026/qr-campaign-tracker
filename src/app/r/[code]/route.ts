import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { hashIp, parseDevice, getClientIp } from '@/lib/tracking/events';
import { buildTargetUrlWithUtm } from '@/lib/qr/generate';
import { isUrlSafe } from '@/lib/validations';

export const dynamic = 'force-dynamic';

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
    });
    return new NextResponse(
      '<html><body><h1>Dieser QR-Code ist derzeit nicht aktiv.</h1></body></html>',
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
    });
    return new NextResponse(
      '<html><body><h1>Dieser QR-Code ist abgelaufen.</h1></body></html>',
      { status: 410, headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (qr.valid_from && new Date(qr.valid_from) > now) {
    return new NextResponse(
      '<html><body><h1>Dieser QR-Code ist noch nicht aktiv.</h1></body></html>',
      { status: 425, headers: { 'Content-Type': 'text/html' } }
    );
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
  });

  return NextResponse.redirect(targetUrl, 302);
}

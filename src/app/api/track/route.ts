import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { trackEventSchema } from '@/lib/validations';
import { hashIp, getClientIp } from '@/lib/tracking/events';
import { checkRateLimit } from '@/lib/rate-limit';
import { normalizeReferrer, sanitizeUrl, parseUserAgentMinimal, sanitizeMetadata } from '@/lib/privacy';

export const dynamic = 'force-dynamic';

// CORS headers for cross-origin tracking from landing pages
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 60 requests per minute per IP
    const ip = getClientIp(request);
    const rl = checkRateLimit(hashIp(ip), 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { ...corsHeaders, 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      );
    }

    const body = await request.json();
    const parsed = trackEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid event data' },
        { status: 400, headers: corsHeaders }
      );
    }

    const event = parsed.data;
    const supabase = await createServiceClient();

    const userAgent = request.headers.get('user-agent') || '';
    const rawReferrer = request.headers.get('referer') || null;
    const ua = parseUserAgentMinimal(userAgent);

    // Resolve QR code context if qr_code_id is provided
    let placementId = event.placement_id || null;
    let campaignId = event.campaign_id || null;

    if (event.qr_code_id && (!placementId || !campaignId)) {
      const { data: qr } = await supabase
        .from('qr_codes')
        .select('placement_id, placement:placements(campaign_id)')
        .eq('id', event.qr_code_id)
        .single();

      if (qr) {
        placementId = placementId || qr.placement_id;
        const placement = qr.placement as unknown as { campaign_id: string } | null;
        campaignId = campaignId || placement?.campaign_id || null;
      }
    }

    await supabase.from('page_events').insert({
      event_type: event.event_type,
      qr_code_id: event.qr_code_id || null,
      placement_id: placementId,
      campaign_id: campaignId,
      session_id: event.session_id || null,
      page_url: sanitizeUrl(event.page_url || null),
      metadata: sanitizeMetadata(event.metadata),
      referrer: normalizeReferrer(rawReferrer),
      user_agent: null,
      device_type: ua.device_type,
      browser_family: ua.browser_family,
      os_family: ua.os_family,
      ip_hash: hashIp(ip),
    });

    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch {
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

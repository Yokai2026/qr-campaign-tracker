import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { apiError, apiOk, serviceRoleClient } from '@/lib/api/auth';
import { authAndRateLimit } from '@/lib/api/rate-limit';
import { generateQrCode, buildRedirectUrl } from '@/lib/qr/generate';

export const dynamic = 'force-dynamic';

const REDIRECT_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://spurig.com';

const SELECT_COLS = 'id, placement_id, short_code, target_url, active, valid_from, valid_until, note, title, utm_source, utm_medium, utm_campaign, utm_content, utm_id, qr_fg_color, qr_bg_color, max_scans, short_host, qr_png_url, qr_svg_url, created_at, updated_at';

export async function GET(req: NextRequest) {
  const auth = await authAndRateLimit(req);
  if (auth instanceof Response) return auth;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '25', 10)));
  const placementId = searchParams.get('placement_id');

  const sb = serviceRoleClient();
  let q = sb.from('qr_codes').select(SELECT_COLS, { count: 'exact' }).eq('created_by', auth.userId);
  if (placementId) q = q.eq('placement_id', placementId);
  q = q.order('created_at', { ascending: false }).range((page - 1) * perPage, page * perPage - 1);

  const { data, count, error } = await q;
  if (error) return apiError(500, error.message);
  return apiOk({ data, pagination: { page, per_page: perPage, total: count ?? 0 } });
}

export async function POST(req: NextRequest) {
  const auth = await authAndRateLimit(req);
  if (auth instanceof Response) return auth;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(400, 'Invalid JSON body'); }

  const target_url = String(body.target_url ?? '').trim();
  if (!target_url) return apiError(400, 'Field "target_url" is required');
  try { new URL(target_url); } catch { return apiError(400, 'Field "target_url" must be a valid URL'); }

  const shortCode =
    typeof body.short_code === 'string' && body.short_code ? body.short_code : nanoid(8);
  const fgColor = typeof body.qr_fg_color === 'string' ? body.qr_fg_color : '#000000';
  const bgColor = typeof body.qr_bg_color === 'string' ? body.qr_bg_color : '#FFFFFF';

  // PNG + SVG erzeugen damit der Code in der Detail-View und im Download
  // sofort verfuegbar ist (vorher: API-erstellte QRs blieben qr_png_url=null
  // und das UI zeigte "Kein QR-Code").
  let pngDataUrl: string | null = null;
  let svgDataUrl: string | null = null;
  try {
    const redirectUrl = buildRedirectUrl(REDIRECT_BASE_URL, shortCode);
    const generated = await generateQrCode(redirectUrl, { fgColor, bgColor });
    pngDataUrl = generated.pngDataUrl;
    svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(generated.svgString).toString('base64')}`;
  } catch (e) {
    return apiError(500, 'QR generation failed: ' + (e instanceof Error ? e.message : 'unknown'));
  }

  const insert: Record<string, unknown> = {
    short_code: shortCode,
    target_url,
    placement_id: typeof body.placement_id === 'string' ? body.placement_id : null,
    active: body.active === false ? false : true,
    valid_from: typeof body.valid_from === 'string' ? body.valid_from : null,
    valid_until: typeof body.valid_until === 'string' ? body.valid_until : null,
    note: typeof body.note === 'string' ? body.note : null,
    title: typeof body.title === 'string' ? body.title : null,
    utm_source: typeof body.utm_source === 'string' ? body.utm_source : null,
    utm_medium: typeof body.utm_medium === 'string' ? body.utm_medium : null,
    utm_campaign: typeof body.utm_campaign === 'string' ? body.utm_campaign : null,
    utm_content: typeof body.utm_content === 'string' ? body.utm_content : null,
    utm_id: typeof body.utm_id === 'string' ? body.utm_id : null,
    qr_fg_color: fgColor,
    qr_bg_color: bgColor,
    qr_png_url: pngDataUrl,
    qr_svg_url: svgDataUrl,
    short_host: typeof body.short_host === 'string' ? body.short_host : null,
    max_scans: typeof body.max_scans === 'number' ? body.max_scans : null,
    created_by: auth.userId,
  };

  const sb = serviceRoleClient();
  const { data, error } = await sb.from('qr_codes').insert(insert).select(SELECT_COLS).single();
  if (error) return apiError(400, error.message);
  return apiOk({ data }, 201);
}

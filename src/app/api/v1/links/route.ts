import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { apiError, apiOk, serviceRoleClient } from '@/lib/api/auth';
import { authAndRateLimit } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

const SELECT_COLS = 'id, short_code, target_url, title, description, campaign_id, active, archived, expires_at, expired_url, utm_source, utm_medium, utm_campaign, utm_content, utm_id, click_count, last_clicked_at, short_host, link_mode, created_at, updated_at';

export async function GET(req: NextRequest) {
  const auth = await authAndRateLimit(req);
  if (auth instanceof Response) return auth;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '25', 10)));
  const campaignId = searchParams.get('campaign_id');
  const archived = searchParams.get('archived');

  const sb = serviceRoleClient();
  let q = sb.from('short_links').select(SELECT_COLS, { count: 'exact' }).eq('created_by', auth.userId);
  if (campaignId) q = q.eq('campaign_id', campaignId);
  if (archived === 'true') q = q.eq('archived', true);
  else if (archived === 'false') q = q.eq('archived', false);
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

  const insert: Record<string, unknown> = {
    short_code: typeof body.short_code === 'string' && body.short_code ? body.short_code : nanoid(8),
    target_url,
    title: typeof body.title === 'string' ? body.title : null,
    description: typeof body.description === 'string' ? body.description : null,
    campaign_id: typeof body.campaign_id === 'string' ? body.campaign_id : null,
    active: body.active === false ? false : true,
    expires_at: typeof body.expires_at === 'string' ? body.expires_at : null,
    expired_url: typeof body.expired_url === 'string' ? body.expired_url : null,
    utm_source: typeof body.utm_source === 'string' ? body.utm_source : null,
    utm_medium: typeof body.utm_medium === 'string' ? body.utm_medium : null,
    utm_campaign: typeof body.utm_campaign === 'string' ? body.utm_campaign : null,
    utm_content: typeof body.utm_content === 'string' ? body.utm_content : null,
    utm_id: typeof body.utm_id === 'string' ? body.utm_id : null,
    short_host: typeof body.short_host === 'string' ? body.short_host : null,
    created_by: auth.userId,
  };

  const sb = serviceRoleClient();
  const { data, error } = await sb.from('short_links').insert(insert).select(SELECT_COLS).single();
  if (error) return apiError(400, error.message);
  return apiOk({ data }, 201);
}

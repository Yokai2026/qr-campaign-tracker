import { NextRequest } from 'next/server';
import { apiError, apiOk, serviceRoleClient } from '@/lib/api/auth';
import { authAndRateLimit } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const UPDATEABLE = [
  'target_url', 'title', 'description', 'campaign_id', 'active', 'archived',
  'expires_at', 'expired_url',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_id',
  'short_host',
] as const;

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await authAndRateLimit(req);
  if (auth instanceof Response) return auth;
  const { id } = await params;
  const sb = serviceRoleClient();
  const { data, error } = await sb
    .from('short_links').select('*').eq('id', id).eq('created_by', auth.userId).maybeSingle();
  if (error) return apiError(500, error.message);
  if (!data) return apiError(404, 'Link not found');
  return apiOk({ data });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await authAndRateLimit(req);
  if (auth instanceof Response) return auth;
  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(400, 'Invalid JSON body'); }

  const update: Record<string, unknown> = {};
  for (const key of UPDATEABLE) if (key in body) update[key] = body[key];
  if (Object.keys(update).length === 0) return apiError(400, 'No updateable fields provided');
  update.updated_at = new Date().toISOString();

  const sb = serviceRoleClient();
  const { data, error } = await sb
    .from('short_links').update(update).eq('id', id).eq('created_by', auth.userId)
    .select('*').maybeSingle();
  if (error) return apiError(400, error.message);
  if (!data) return apiError(404, 'Link not found');
  return apiOk({ data });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await authAndRateLimit(req);
  if (auth instanceof Response) return auth;
  const { id } = await params;
  const sb = serviceRoleClient();
  const { error, count } = await sb
    .from('short_links').delete({ count: 'exact' }).eq('id', id).eq('created_by', auth.userId);
  if (error) return apiError(400, error.message);
  if (!count) return apiError(404, 'Link not found');
  return apiOk({ deleted: true });
}

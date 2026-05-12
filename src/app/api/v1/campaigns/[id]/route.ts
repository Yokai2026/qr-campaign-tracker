import { NextRequest } from 'next/server';
import { apiError, apiOk, serviceRoleClient } from '@/lib/api/auth';
import { authAndRateLimit } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const UPDATEABLE = ['name', 'slug', 'description', 'status', 'start_date', 'end_date'] as const;

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await authAndRateLimit(req);
  if (auth instanceof Response) return auth;
  const { id } = await params;
  const sb = serviceRoleClient();
  const { data, error } = await sb
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('owner_id', auth.userId)
    .maybeSingle();
  if (error) return apiError(500, error.message);
  if (!data) return apiError(404, 'Campaign not found');
  return apiOk({ data });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await authAndRateLimit(req);
  if (auth instanceof Response) return auth;
  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(400, 'Invalid JSON body'); }

  const update: Record<string, unknown> = {};
  for (const key of UPDATEABLE) {
    if (key in body) update[key] = body[key];
  }
  if (Object.keys(update).length === 0) return apiError(400, 'No updateable fields provided');
  update.updated_at = new Date().toISOString();

  const sb = serviceRoleClient();
  const { data, error } = await sb
    .from('campaigns')
    .update(update)
    .eq('id', id)
    .eq('owner_id', auth.userId)
    .select('*')
    .maybeSingle();

  if (error) return apiError(400, error.message);
  if (!data) return apiError(404, 'Campaign not found');
  return apiOk({ data });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await authAndRateLimit(req);
  if (auth instanceof Response) return auth;
  const { id } = await params;
  const sb = serviceRoleClient();
  const { error, count } = await sb
    .from('campaigns')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('owner_id', auth.userId);
  if (error) return apiError(400, error.message);
  if (!count) return apiError(404, 'Campaign not found');
  return apiOk({ deleted: true });
}

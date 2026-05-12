import { NextRequest } from 'next/server';
import { apiError, apiOk, serviceRoleClient } from '@/lib/api/auth';
import { authAndRateLimit } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await authAndRateLimit(req);
  if (auth instanceof Response) return auth;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '25', 10)));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const sb = serviceRoleClient();
  const { data, count, error } = await sb
    .from('campaigns')
    .select('id, name, slug, description, status, start_date, end_date, created_at, updated_at', { count: 'exact' })
    .eq('owner_id', auth.userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) return apiError(500, error.message);
  return apiOk({ data, pagination: { page, per_page: perPage, total: count ?? 0 } });
}

export async function POST(req: NextRequest) {
  const auth = await authAndRateLimit(req);
  if (auth instanceof Response) return auth;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(400, 'Invalid JSON body'); }

  const name = String(body.name ?? '').trim();
  if (!name) return apiError(400, 'Field "name" is required');
  if (name.length > 200) return apiError(400, 'Field "name" must be <= 200 chars');

  const insert: Record<string, unknown> = {
    name,
    slug: typeof body.slug === 'string' ? body.slug : null,
    description: typeof body.description === 'string' ? body.description : null,
    status: typeof body.status === 'string' ? body.status : 'active',
    start_date: typeof body.start_date === 'string' ? body.start_date : null,
    end_date: typeof body.end_date === 'string' ? body.end_date : null,
    owner_id: auth.userId,
  };

  const sb = serviceRoleClient();
  const { data, error } = await sb.from('campaigns').insert(insert).select('*').single();
  if (error) return apiError(400, error.message);
  return apiOk({ data }, 201);
}

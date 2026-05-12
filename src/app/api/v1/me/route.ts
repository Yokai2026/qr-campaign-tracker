import { NextRequest } from 'next/server';
import { apiOk, serviceRoleClient } from '@/lib/api/auth';
import { authAndRateLimit } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await authAndRateLimit(req);
  if (auth instanceof Response) return auth;
  const sb = serviceRoleClient();
  const { data: profile } = await sb
    .from('profiles')
    .select('id, email, username, display_name, role, trial_ends_at, created_at')
    .eq('id', auth.userId)
    .maybeSingle();
  if (!profile) return apiOk({ error: 'User not found' }, 404);
  return apiOk({ data: profile });
}

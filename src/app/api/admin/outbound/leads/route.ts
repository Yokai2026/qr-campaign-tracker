import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { SEGMENT_CONFIGS } from '@/lib/outbound/segments';
import type { LeadStatus, OutboundSegment } from '@/lib/outbound/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function requireAdmin() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: profile } = await sb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  return profile?.role === 'admin' ? user : null;
}

/**
 * GET /api/admin/outbound/leads?segment=&status=&hasEmail=&hasWebsite=&limit=&offset=
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const params = request.nextUrl.searchParams;
  const segment = params.get('segment') as OutboundSegment | null;
  const status = params.get('status') as LeadStatus | null;
  const hasEmail = params.get('hasEmail');
  const hasWebsite = params.get('hasWebsite');
  const limit = Math.min(parseInt(params.get('limit') ?? '50', 10), 200);
  const offset = parseInt(params.get('offset') ?? '0', 10);

  if (segment && !SEGMENT_CONFIGS[segment]) {
    return NextResponse.json({ error: `Unknown segment: ${segment}` }, { status: 400 });
  }

  const sb = await createServiceClient();
  let query = sb
    .from('outbound_leads')
    .select('*', { count: 'exact' })
    .order('scraped_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (segment) query = query.eq('segment', segment);
  if (status) query = query.eq('status', status);
  if (hasEmail === 'true') query = query.not('email', 'is', null);
  if (hasEmail === 'false') query = query.is('email', null);
  if (hasWebsite === 'true') query = query.not('website', 'is', null);
  if (hasWebsite === 'false') query = query.is('website', null);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Stats parallel
  const { data: statsRaw } = await sb
    .from('outbound_leads')
    .select('segment, status, email_status');

  const stats = aggregateStats(statsRaw ?? []);

  return NextResponse.json({
    leads: data ?? [],
    total: count ?? 0,
    limit,
    offset,
    stats,
  });
}

function aggregateStats(
  rows: Array<{ segment: string; status: string; email_status: string }>,
) {
  const bySegment: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byEmailStatus: Record<string, number> = {};
  for (const r of rows) {
    bySegment[r.segment] = (bySegment[r.segment] ?? 0) + 1;
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    byEmailStatus[r.email_status] = (byEmailStatus[r.email_status] ?? 0) + 1;
  }
  return { total: rows.length, bySegment, byStatus, byEmailStatus };
}

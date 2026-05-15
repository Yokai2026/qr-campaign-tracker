import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { DmStatus, OutboundSegment } from '@/lib/outbound/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/linkedin-dms
 *
 * Listet Leads fuer die LinkedIn-DM-Pipeline. Filterbar nach Segment + dm_status.
 * Default-Sort: zuletzt generierter Opener oben (oder neueste Leads ohne Opener).
 */
export async function GET(request: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await sb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const segment = url.searchParams.get('segment') as OutboundSegment | null;
  const dmStatus = url.searchParams.get('dm_status') as DmStatus | null;
  const limit = Math.min(200, Math.max(10, Number(url.searchParams.get('limit') ?? 50)));

  const service = await createServiceClient();
  let q = service
    .from('outbound_leads')
    .select(
      'id, name, segment, city, region, website, rating, rating_count, status, email, contacted_at, linkedin_url, linkedin_first_name, dm_opener, dm_opener_model, dm_opener_generated_at, dm_status, dm_sent_at, dm_replied_at',
    )
    .order('dm_opener_generated_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (segment) q = q.eq('segment', segment);
  if (dmStatus) q = q.eq('dm_status', dmStatus);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Counts per dm_status fuer Tabs
  const { data: countsRows } = await service
    .from('outbound_leads')
    .select('dm_status');
  const counts = (countsRows ?? []).reduce<Record<string, number>>((acc, row) => {
    const key = (row.dm_status ?? 'pending') as string;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({ leads: data ?? [], counts });
}

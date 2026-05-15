import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/content-stats
 *
 * Liefert Attribution-basierte Conversion-Daten:
 *  - signups pro attribution_source
 *  - signups pro campaign (blog-slug)
 *  - paid-conversions pro source
 *  - timeline (signups/day pro source)
 */
export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const service = await createServiceClient();

  // 1) Signups + Conversions pro attribution_source
  const { data: profiles } = await service
    .from('profiles')
    .select('id, attribution_source, attribution_medium, attribution_campaign, created_at')
    .not('attribution_source', 'is', null)
    .order('created_at', { ascending: false })
    .limit(2000);

  // Paid-Subs pro user
  const userIds = (profiles ?? []).map((p) => p.id);
  let paidUsers = new Set<string>();
  if (userIds.length > 0) {
    const { data: subs } = await service
      .from('subscriptions')
      .select('user_id')
      .in('user_id', userIds)
      .in('status', ['active', 'past_due']);
    paidUsers = new Set((subs ?? []).map((s) => s.user_id));
  }

  // Aggregation by source
  type Row = { signups: number; paid: number };
  const bySource: Record<string, Row> = {};
  const byCampaign: Record<string, Row> = {};
  const byMedium: Record<string, Row> = {};

  for (const p of profiles ?? []) {
    const src = p.attribution_source ?? 'unknown';
    const camp = p.attribution_campaign ?? '_no-campaign';
    const med = p.attribution_medium ?? 'unknown';
    const isPaid = paidUsers.has(p.id);
    bySource[src] ??= { signups: 0, paid: 0 };
    bySource[src].signups++;
    if (isPaid) bySource[src].paid++;
    byCampaign[camp] ??= { signups: 0, paid: 0 };
    byCampaign[camp].signups++;
    if (isPaid) byCampaign[camp].paid++;
    byMedium[med] ??= { signups: 0, paid: 0 };
    byMedium[med].signups++;
    if (isPaid) byMedium[med].paid++;
  }

  // Timeline (last 30 days)
  const days: Record<string, Record<string, number>> = {};
  for (const p of profiles ?? []) {
    const day = p.created_at.slice(0, 10);
    const src = p.attribution_source ?? 'unknown';
    days[day] ??= {};
    days[day][src] = (days[day][src] ?? 0) + 1;
  }

  // Content-Drafts overview
  const { data: drafts } = await service
    .from('content_drafts')
    .select('blog_slug, channel, status, posted_at');
  type ChannelRow = { drafts: number; posted: number };
  const byChannel: Record<string, ChannelRow> = {};
  for (const d of drafts ?? []) {
    byChannel[d.channel] ??= { drafts: 0, posted: 0 };
    byChannel[d.channel].drafts++;
    if (d.status === 'posted' || d.posted_at) byChannel[d.channel].posted++;
  }

  return NextResponse.json({
    totals: {
      tracked_signups: profiles?.length ?? 0,
      tracked_paid: paidUsers.size,
    },
    bySource,
    byMedium,
    byCampaign,
    byChannel,
    timeline: days,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export type AdminUserDetail = {
  id: string;
  email: string;
  username: string | null;
  role: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  trialEndsAt: string | null;
  isAdmin: boolean;
  subscription: {
    id: string;
    status: string;
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
    stripePriceId: string | null;
    cancelAt: string | null;
    currentPeriodEnd: string | null;
    createdAt: string;
    updatedAt: string;
    cancellationReason: string | null;
    cancellationFeedback: string | null;
  } | null;
  stats: {
    campaignCount: number;
    placementCount: number;
    qrCodeCount: number;
    shortLinkCount: number;
    qrScansTotal: number;
    linkClicksTotal: number;
  };
  recentActivity: Array<{
    type: 'signup' | 'sub_created' | 'sub_cancelled' | 'sub_updated' | 'login_recent';
    at: string;
    detail: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Auth-Gate: Admin only
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await userClient.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const sb = await createServiceClient();

  const [
    profileRes,
    subRes,
    campaignCountRes,
    placementCountRes,
    qrCodesRes,
    shortLinksRes,
  ] = await Promise.all([
    sb.from('profiles').select('id, email, username, role, created_at, last_seen_at, trial_ends_at').eq('id', id).maybeSingle(),
    sb.from('subscriptions').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    sb.from('campaigns').select('id', { count: 'exact', head: true }).eq('created_by', id),
    sb.from('placements').select('id', { count: 'exact', head: true }).eq('created_by', id),
    sb.from('qr_codes').select('id').eq('created_by', id),
    sb.from('short_links').select('id').eq('created_by', id),
  ]);

  // Scans/Klicks: zähle redirect_events JOIN auf qr_codes/short_links der User-IDs
  const qrIds = (qrCodesRes.data ?? []).map((r: { id: string }) => r.id);
  const linkIds = (shortLinksRes.data ?? []).map((r: { id: string }) => r.id);
  const [qrScansRes, linkClicksRes] = await Promise.all([
    qrIds.length > 0
      ? sb.from('redirect_events').select('id', { count: 'exact', head: true }).in('qr_code_id', qrIds).eq('event_type', 'qr_open').eq('is_bot', false)
      : Promise.resolve({ count: 0 }),
    linkIds.length > 0
      ? sb.from('redirect_events').select('id', { count: 'exact', head: true }).in('short_link_id', linkIds).eq('event_type', 'link_open').eq('is_bot', false)
      : Promise.resolve({ count: 0 }),
  ]);

  if (profileRes.error || !profileRes.data) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const p = profileRes.data;
  const sub = subRes.data;

  // Activity-Timeline aus Profile-Daten + Sub-Events bauen
  const activity: AdminUserDetail['recentActivity'] = [];
  activity.push({
    type: 'signup',
    at: p.created_at,
    detail: 'User hat sich registriert',
  });
  if (sub) {
    activity.push({
      type: 'sub_created',
      at: sub.created_at,
      detail: `Sub angelegt — Status: ${sub.status}`,
    });
    if (sub.status === 'cancelled' || sub.status === 'expired') {
      activity.push({
        type: 'sub_cancelled',
        at: sub.updated_at,
        detail: sub.cancellation_reason
          ? `Sub gekündigt — Grund: ${sub.cancellation_reason}`
          : 'Sub gekündigt',
      });
    } else if (sub.created_at !== sub.updated_at) {
      activity.push({
        type: 'sub_updated',
        at: sub.updated_at,
        detail: `Sub aktualisiert — Status: ${sub.status}`,
      });
    }
  }
  if (p.last_seen_at) {
    activity.push({
      type: 'login_recent',
      at: p.last_seen_at,
      detail: 'Letzte Aktivität',
    });
  }
  activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const detail: AdminUserDetail = {
    id: p.id,
    email: p.email,
    username: p.username,
    role: p.role,
    createdAt: p.created_at,
    lastSeenAt: p.last_seen_at,
    trialEndsAt: p.trial_ends_at,
    isAdmin: p.role === 'admin',
    subscription: sub
      ? {
          id: sub.id,
          status: sub.status,
          stripeSubscriptionId: sub.stripe_subscription_id ?? null,
          stripeCustomerId: sub.stripe_customer_id ?? null,
          stripePriceId: sub.stripe_price_id ?? null,
          cancelAt: sub.cancel_at,
          currentPeriodEnd: sub.current_period_end,
          createdAt: sub.created_at,
          updatedAt: sub.updated_at,
          cancellationReason: sub.cancellation_reason ?? null,
          cancellationFeedback: sub.cancellation_feedback ?? null,
        }
      : null,
    stats: {
      campaignCount: campaignCountRes.count ?? 0,
      placementCount: placementCountRes.count ?? 0,
      qrCodeCount: qrIds.length,
      shortLinkCount: linkIds.length,
      qrScansTotal: qrScansRes.count ?? 0,
      linkClicksTotal: linkClicksRes.count ?? 0,
    },
    recentActivity: activity.slice(0, 10),
  };

  return NextResponse.json(detail);
}

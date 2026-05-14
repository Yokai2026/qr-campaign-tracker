import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID;
const YEARLY_PRICE_ID = process.env.STRIPE_YEARLY_PRICE_ID;

export async function GET() {
  // Auth-Gate: nur Admin
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await userClient.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Daten via Service-Role (umgeht RLS)
  const sb = await createServiceClient();
  const now = Date.now();
  const twoMinAgo = new Date(now - 2 * 60 * 1000).toISOString();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now - 7 * 86_400_000).toISOString();
  const lastHour = new Date(now - 60 * 60 * 1000).toISOString();

  const [
    profilesAllRes,
    profilesTodayRes,
    profilesWeekRes,
    onlineNowRes,
    subsActiveRes,
    recentSignupsRes,
    recentSubsRes,
    scansLastHourRes,
    scansTodayRes,
  ] = await Promise.all([
    sb.from('profiles').select('id', { count: 'exact', head: true }),
    sb.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    sb.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    sb.from('profiles').select('id', { count: 'exact', head: true }).gte('last_seen_at', twoMinAgo),
    sb.from('subscriptions').select('id, stripe_price_id, status, created_at').in('status', ['active', 'on_trial', 'past_due']),
    sb.from('profiles').select('id, email, username, created_at, trial_ends_at').order('created_at', { ascending: false }).limit(10),
    sb.from('subscriptions').select('id, user_id, stripe_price_id, status, created_at, profiles:user_id(email, username)').order('created_at', { ascending: false }).limit(10),
    sb.from('redirect_events').select('id', { count: 'exact', head: true }).gte('created_at', lastHour).eq('is_bot', false),
    sb.from('redirect_events').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()).eq('is_bot', false),
  ]);

  const subs = subsActiveRes.data ?? [];
  const monthlyCount = subs.filter((s) => s.stripe_price_id === MONTHLY_PRICE_ID).length;
  const yearlyCount = subs.filter((s) => s.stripe_price_id === YEARLY_PRICE_ID).length;
  const otherCount = subs.length - monthlyCount - yearlyCount;

  // Trial expired = profiles ohne aktive sub und mit trial_ends_at < now
  const subUserIds = new Set(subs.map((s) => s.id));
  const { data: profilesWithTrial } = await sb
    .from('profiles')
    .select('id, trial_ends_at')
    .not('trial_ends_at', 'is', null);
  const profilesWithTrialList = profilesWithTrial ?? [];
  const trialActive = profilesWithTrialList.filter(
    (p) => !subUserIds.has(p.id) && p.trial_ends_at && new Date(p.trial_ends_at).getTime() > now,
  ).length;
  const trialExpired = profilesWithTrialList.filter(
    (p) => !subUserIds.has(p.id) && p.trial_ends_at && new Date(p.trial_ends_at).getTime() <= now,
  ).length;

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    users: {
      total: profilesAllRes.count ?? 0,
      newToday: profilesTodayRes.count ?? 0,
      newThisWeek: profilesWeekRes.count ?? 0,
      onlineNow: onlineNowRes.count ?? 0,
      trialActive,
      trialExpired,
    },
    payments: {
      total: subs.length,
      monthly: monthlyCount,
      yearly: yearlyCount,
      other: otherCount,
      mrrEur: monthlyCount * 12.99 + yearlyCount * 8.99,
      arrEur: (monthlyCount * 12.99 + yearlyCount * 8.99) * 12,
    },
    activity: {
      scansLastHour: scansLastHourRes.count ?? 0,
      scansToday: scansTodayRes.count ?? 0,
    },
    recentSignups: (recentSignupsRes.data ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      username: p.username,
      createdAt: p.created_at,
      trialEndsAt: p.trial_ends_at,
    })),
    recentSubscriptions: (recentSubsRes.data ?? []).map((s: Record<string, unknown>) => {
      const prof = s.profiles as { email: string; username: string | null } | null;
      const priceId = s.stripe_price_id as string | null;
      const plan = priceId === MONTHLY_PRICE_ID ? 'monthly' : priceId === YEARLY_PRICE_ID ? 'yearly' : 'other';
      return {
        id: s.id,
        email: prof?.email ?? null,
        username: prof?.username ?? null,
        plan,
        status: s.status,
        createdAt: s.created_at,
      };
    }),
  });
}

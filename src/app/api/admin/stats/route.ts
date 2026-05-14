import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/billing/stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID;
const YEARLY_PRICE_ID = process.env.STRIPE_YEARLY_PRICE_ID;

type PriceMeta = {
  plan: 'monthly' | 'yearly' | 'manual' | 'other';
  monthlyAmountEur: number; // normalisiert auf €/Monat
};

// In-Memory Cache fuer Stripe-Price-Lookups (5 Min TTL).
// Erspart 100+ API-Calls pro Stats-Refresh bei vielen Subs.
const priceCache = new Map<string, { meta: PriceMeta; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function resolvePriceMeta(priceId: string | null | undefined): Promise<PriceMeta> {
  if (!priceId) return { plan: 'other', monthlyAmountEur: 0 };
  if (priceId === 'manual') return { plan: 'manual', monthlyAmountEur: 0 };

  // Fast path: bekannte V2-IDs (kein Stripe-Roundtrip)
  if (priceId === MONTHLY_PRICE_ID) return { plan: 'monthly', monthlyAmountEur: 12.99 };
  if (priceId === YEARLY_PRICE_ID) return { plan: 'yearly', monthlyAmountEur: 8.99 };

  // Cached lookup
  const cached = priceCache.get(priceId);
  if (cached && cached.expiresAt > Date.now()) return cached.meta;

  // Stripe lookup
  let meta: PriceMeta = { plan: 'other', monthlyAmountEur: 0 };
  try {
    const price = await getStripe().prices.retrieve(priceId);
    const interval = price.recurring?.interval;
    const amountCents = price.unit_amount ?? 0;
    if (interval === 'month') {
      meta = { plan: 'monthly', monthlyAmountEur: amountCents / 100 };
    } else if (interval === 'year') {
      meta = { plan: 'yearly', monthlyAmountEur: amountCents / 100 / 12 };
    }
  } catch {
    // Fallthrough: behalte 'other'
  }
  priceCache.set(priceId, { meta, expiresAt: Date.now() + CACHE_TTL_MS });
  return meta;
}

export async function GET() {
  // Auth-Gate: nur Admin
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await userClient.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
    profilesWithTrialRes,
  ] = await Promise.all([
    sb.from('profiles').select('id', { count: 'exact', head: true }),
    sb.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    sb.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    sb.from('profiles').select('id', { count: 'exact', head: true }).gte('last_seen_at', twoMinAgo),
    sb.from('subscriptions').select('id, user_id, stripe_price_id, status, created_at').in('status', ['active', 'on_trial', 'past_due']),
    sb.from('profiles').select('id, email, username, created_at, trial_ends_at').order('created_at', { ascending: false }).limit(10),
    sb.from('subscriptions').select('id, user_id, stripe_price_id, status, created_at, profiles:user_id(email, username)').order('created_at', { ascending: false }).limit(10),
    sb.from('redirect_events').select('id', { count: 'exact', head: true }).gte('created_at', lastHour).eq('is_bot', false),
    sb.from('redirect_events').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()).eq('is_bot', false),
    sb.from('profiles').select('id, trial_ends_at').not('trial_ends_at', 'is', null),
  ]);

  const subs = subsActiveRes.data ?? [];

  // Plan-Detection via Stripe-Lookup (cached)
  const subMetas = await Promise.all(subs.map((s) => resolvePriceMeta(s.stripe_price_id)));

  let monthlyCount = 0;
  let yearlyCount = 0;
  let manualCount = 0;
  let otherCount = 0;
  let mrrEur = 0;
  for (const m of subMetas) {
    if (m.plan === 'monthly') monthlyCount++;
    else if (m.plan === 'yearly') yearlyCount++;
    else if (m.plan === 'manual') manualCount++;
    else otherCount++;
    mrrEur += m.monthlyAmountEur;
  }

  // Trial counts (basierend auf Sub-User-Set)
  const subUserIds = new Set(subs.map((s) => s.user_id));
  const profilesWithTrial = profilesWithTrialRes.data ?? [];
  const trialActive = profilesWithTrial.filter(
    (p) => !subUserIds.has(p.id) && p.trial_ends_at && new Date(p.trial_ends_at).getTime() > now,
  ).length;
  const trialExpired = profilesWithTrial.filter(
    (p) => !subUserIds.has(p.id) && p.trial_ends_at && new Date(p.trial_ends_at).getTime() <= now,
  ).length;

  // Recent-Subs: Plan auch via Lookup
  const recentSubsRaw = recentSubsRes.data ?? [];
  const recentSubsMetas = await Promise.all(
    recentSubsRaw.map((s: Record<string, unknown>) => resolvePriceMeta(s.stripe_price_id as string | null)),
  );

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
      manual: manualCount,
      other: otherCount,
      mrrEur,
      arrEur: mrrEur * 12,
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
    recentSubscriptions: recentSubsRaw.map((s: Record<string, unknown>, i: number) => {
      const prof = s.profiles as { email: string; username: string | null } | null;
      return {
        id: s.id,
        email: prof?.email ?? null,
        username: prof?.username ?? null,
        plan: recentSubsMetas[i].plan,
        status: s.status,
        createdAt: s.created_at,
      };
    }),
  });
}

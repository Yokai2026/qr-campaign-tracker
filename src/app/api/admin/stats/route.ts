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

type IntroStats = {
  activeWithIntroCoupon: number;
  monthlyEurDiscounted: number; // 5,99 € pro User mit Intro
  fullPriceEur: number;          // 12,99 € pro User ohne
};

let introCache: { data: IntroStats; expiresAt: number } | null = null;
const INTRO_TTL_MS = 60_000;

async function countIntroDiscounts(): Promise<IntroStats> {
  if (introCache && introCache.expiresAt > Date.now()) return introCache.data;
  const result: IntroStats = { activeWithIntroCoupon: 0, monthlyEurDiscounted: 0, fullPriceEur: 0 };
  try {
    const stripe = getStripe();
    let starting_after: string | undefined;
    while (true) {
      const list = await stripe.subscriptions.list({ status: 'active', limit: 100, starting_after, expand: ['data.discount'] });
      for (const sub of list.data) {
        const item = sub.items.data[0];
        if (item?.price?.id !== process.env.STRIPE_MONTHLY_PRICE_ID) continue;
        const discount = (sub as unknown as { discount?: { coupon?: { id?: string } } }).discount;
        if (discount?.coupon?.id === 'intro_3mo') {
          result.activeWithIntroCoupon++;
          result.monthlyEurDiscounted += 5.99;
        } else {
          result.fullPriceEur += 12.99;
        }
      }
      if (!list.has_more) break;
      starting_after = list.data[list.data.length - 1]?.id;
      if (!starting_after) break;
    }
  } catch {
    // best-effort
  }
  introCache = { data: result, expiresAt: Date.now() + INTRO_TTL_MS };
  return result;
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
  // 60s Online-Fenster — Heartbeat-Intervall ist 30s, also 1 verpasster Ping = offline.
  // Frueher 2 min, was bei Tab-Schliessen/Hintergrund zu "Geist"-Anzeige fuehrte.
  const twoMinAgo = new Date(now - 60 * 1000).toISOString();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now - 7 * 86_400_000).toISOString();
  const lastHour = new Date(now - 60 * 60 * 1000).toISOString();

  const [
    profilesAllRes,
    profilesTodayRes,
    profilesWeekRes,
    onlineNowRes,
    // Live-Presence ueber visitor_heartbeats — alle Besucher (anonym + eingeloggt)
    visitorsTotalRes,
    visitorsLoggedInRes,
    visitorsLifetimeRes,
    subsActiveRes,
    recentSignupsRes,
    recentSubsRes,
    qrScansLastHourRes,
    qrScansTodayRes,
    profilesWithTrialRes,
    linkClicksLastHourRes,
    linkClicksTodayRes,
  ] = await Promise.all([
    sb.from('profiles').select('id', { count: 'exact', head: true }),
    sb.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    sb.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    sb.from('profiles').select('id', { count: 'exact', head: true }).gte('last_seen_at', twoMinAgo),
    sb.from('visitor_heartbeats').select('visitor_id', { count: 'exact', head: true }).gte('last_seen_at', twoMinAgo),
    sb.from('visitor_heartbeats').select('visitor_id', { count: 'exact', head: true }).gte('last_seen_at', twoMinAgo).not('user_id', 'is', null),
    // Gesamt-Besucher-Zaehler: jede visitor_id ist ein einzigartiger Browser-Tab.
    // Da visitor_id = PRIMARY KEY, gibt COUNT(*) die lifetime-distinct-Visitor-Anzahl.
    sb.from('visitor_heartbeats').select('visitor_id', { count: 'exact', head: true }),
    sb.from('subscriptions').select('id, user_id, stripe_price_id, status, created_at').in('status', ['active', 'on_trial', 'past_due']),
    sb.from('profiles').select('id, email, username, created_at, trial_ends_at').order('created_at', { ascending: false }).limit(10),
    sb.from('subscriptions').select('id, user_id, stripe_price_id, status, created_at, profiles:user_id(email, username)').order('created_at', { ascending: false }).limit(10),
    sb.from('redirect_events').select('id', { count: 'exact', head: true }).gte('created_at', lastHour).eq('is_bot', false).eq('event_type', 'qr_open'),
    sb.from('redirect_events').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()).eq('is_bot', false).eq('event_type', 'qr_open'),
    sb.from('profiles').select('id, trial_ends_at').not('trial_ends_at', 'is', null),
    sb.from('redirect_events').select('id', { count: 'exact', head: true }).gte('created_at', lastHour).eq('is_bot', false).eq('event_type', 'link_open'),
    sb.from('redirect_events').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()).eq('is_bot', false).eq('event_type', 'link_open'),
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

  // MRR-Snapshots der letzten 30 Tage für Sparkline
  const thirtyDaysAgo = new Date(now - 30 * 86_400_000).toISOString().slice(0, 10);
  const { data: mrrHistory } = await sb
    .from('mrr_snapshots')
    .select('snapshot_date, mrr_total_eur, paying_count, new_mrr_eur, churned_mrr_eur')
    .gte('snapshot_date', thirtyDaysAgo)
    .order('snapshot_date', { ascending: true });

  // Stripe-Webhook-Health: aus webhook_diagnostics. Nicht in Promise.all oben,
  // damit ein fehlender Tabellen-Eintrag (vor erster Migration-Anwendung) den
  // ganzen Stats-Call nicht killt.
  let stripeWebhook: { lastReceivedAt: string | null; lastEventType: string | null; totalReceived: number } | null = null;
  try {
    const { data: diag } = await sb
      .from('webhook_diagnostics')
      .select('last_received_at, last_event_type, total_received')
      .eq('service', 'stripe')
      .maybeSingle();
    if (diag) {
      stripeWebhook = {
        lastReceivedAt: diag.last_received_at as string | null,
        lastEventType: diag.last_event_type as string | null,
        totalReceived: (diag.total_received as number) ?? 0,
      };
    }
  } catch {
    // best-effort
  }

  return NextResponse.json({
    stripeWebhook,
    timestamp: new Date().toISOString(),
    users: {
      total: profilesAllRes.count ?? 0,
      newToday: profilesTodayRes.count ?? 0,
      newThisWeek: profilesWeekRes.count ?? 0,
      onlineNow: onlineNowRes.count ?? 0,
      // Live-Presence (visitor_heartbeats): alle Besucher + nur die mit user_id (= eingeloggt)
      visitorsOnline: visitorsTotalRes.count ?? 0,
      loggedInOnline: visitorsLoggedInRes.count ?? 0,
      anonymousOnline: Math.max(0, (visitorsTotalRes.count ?? 0) - (visitorsLoggedInRes.count ?? 0)),
      // Lifetime: jede visitor_id ist ein einzigartiger Browser-Tab seit Tracking-Start.
      visitorsLifetime: visitorsLifetimeRes.count ?? 0,
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
    mrrHistory: (mrrHistory ?? []).map((s) => ({
      date: s.snapshot_date,
      mrr: Number(s.mrr_total_eur),
      paying: s.paying_count,
      newMrr: Number(s.new_mrr_eur),
      churnedMrr: Number(s.churned_mrr_eur),
    })),
    activity: {
      qrScansLastHour: qrScansLastHourRes.count ?? 0,
      qrScansToday: qrScansTodayRes.count ?? 0,
      linkClicksLastHour: linkClicksLastHourRes.count ?? 0,
      linkClicksToday: linkClicksTodayRes.count ?? 0,
      // Backwards-compat
      scansLastHour: (qrScansLastHourRes.count ?? 0) + (linkClicksLastHourRes.count ?? 0),
      scansToday: (qrScansTodayRes.count ?? 0) + (linkClicksTodayRes.count ?? 0),
    },
    intro: await countIntroDiscounts(),
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

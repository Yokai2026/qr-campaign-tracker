import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/billing/stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID;
const YEARLY_PRICE_ID = process.env.STRIPE_YEARLY_PRICE_ID;

type PriceMeta = { plan: 'monthly' | 'yearly' | 'manual' | 'other'; monthlyAmountEur: number };

async function resolvePriceMeta(
  priceId: string | null | undefined,
  cache: Map<string, PriceMeta>,
): Promise<PriceMeta> {
  if (!priceId) return { plan: 'other', monthlyAmountEur: 0 };
  if (priceId === 'manual') return { plan: 'manual', monthlyAmountEur: 0 };
  if (priceId === MONTHLY_PRICE_ID) return { plan: 'monthly', monthlyAmountEur: 12.99 };
  if (priceId === YEARLY_PRICE_ID) return { plan: 'yearly', monthlyAmountEur: 8.99 };
  if (cache.has(priceId)) return cache.get(priceId)!;

  let meta: PriceMeta = { plan: 'other', monthlyAmountEur: 0 };
  try {
    const price = await getStripe().prices.retrieve(priceId);
    const amountCents = price.unit_amount ?? 0;
    const interval = price.recurring?.interval;
    if (interval === 'month') meta = { plan: 'monthly', monthlyAmountEur: amountCents / 100 };
    else if (interval === 'year') meta = { plan: 'yearly', monthlyAmountEur: amountCents / 100 / 12 };
  } catch {
    // best-effort
  }
  cache.set(priceId, meta);
  return meta;
}

/**
 * Daily snapshot of business metrics for trend-charts.
 * Idempotent: erneuter Aufruf am selben Tag überschreibt den Snapshot.
 */
export async function GET(request: NextRequest) {
  // Cron-Auth: Vercel sendet bei Cron-Triggers `Authorization: Bearer <CRON_SECRET>`.
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = await createServiceClient();
  const today = new Date();
  const todayDate = today.toISOString().slice(0, 10);
  const yesterdayMs = today.getTime() - 86_400_000;
  const yesterdayDate = new Date(yesterdayMs).toISOString().slice(0, 10);

  // ============ State JETZT lesen ============
  const [profilesRes, subsRes] = await Promise.all([
    sb.from('profiles').select('id, trial_ends_at, created_at'),
    sb.from('subscriptions').select('user_id, status, stripe_price_id, created_at, updated_at'),
  ]);

  const profiles = profilesRes.data ?? [];
  const subs = subsRes.data ?? [];

  // Aktivste Sub pro User
  const latestByUser = new Map<string, (typeof subs)[number]>();
  for (const s of subs) {
    const existing = latestByUser.get(s.user_id);
    if (!existing || new Date(s.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
      latestByUser.set(s.user_id, s);
    }
  }

  const priceCache = new Map<string, PriceMeta>();
  const metaForSub = await Promise.all(
    Array.from(latestByUser.values()).map(async (s) => ({
      sub: s,
      meta: await resolvePriceMeta(s.stripe_price_id, priceCache),
    })),
  );

  let mrrTotalEur = 0;
  let payingCount = 0;
  let monthlyCount = 0;
  let yearlyCount = 0;
  let manualCount = 0;
  for (const { sub, meta } of metaForSub) {
    const counts = sub.status === 'active' || sub.status === 'past_due' || sub.status === 'on_trial' || sub.status === 'paused';
    if (counts) {
      payingCount++;
      if (sub.status === 'active' || sub.status === 'on_trial') mrrTotalEur += meta.monthlyAmountEur;
      if (meta.plan === 'monthly') monthlyCount++;
      else if (meta.plan === 'yearly') yearlyCount++;
      else if (meta.plan === 'manual') manualCount++;
    }
  }

  const nowMs = today.getTime();
  const trialActiveCount = profiles.filter(
    (p) =>
      !latestByUser.has(p.id) &&
      p.trial_ends_at &&
      new Date(p.trial_ends_at).getTime() > nowMs,
  ).length;

  // ============ Delta vs. Gestern ============
  const { data: yesterdaySnap } = await sb
    .from('mrr_snapshots')
    .select('mrr_total_eur, paying_count')
    .eq('snapshot_date', yesterdayDate)
    .maybeSingle();

  // New & Churned Subs heute (basierend auf created_at/updated_at)
  const todayStartMs = new Date(today.toDateString()).getTime();
  let newSubsCount = 0;
  let newMrrEur = 0;
  let churnedSubsCount = 0;
  let churnedMrrEur = 0;
  for (const { sub, meta } of metaForSub) {
    if (
      (sub.status === 'active' || sub.status === 'on_trial') &&
      new Date(sub.created_at).getTime() >= todayStartMs
    ) {
      newSubsCount++;
      newMrrEur += meta.monthlyAmountEur;
    }
    if (
      (sub.status === 'cancelled' || sub.status === 'expired') &&
      new Date(sub.updated_at).getTime() >= todayStartMs
    ) {
      churnedSubsCount++;
      churnedMrrEur += meta.monthlyAmountEur;
    }
  }

  // ============ UPSERT Snapshot ============
  const payload = {
    snapshot_date: todayDate,
    mrr_total_eur: Number(mrrTotalEur.toFixed(2)),
    arr_total_eur: Number((mrrTotalEur * 12).toFixed(2)),
    paying_count: payingCount,
    monthly_count: monthlyCount,
    yearly_count: yearlyCount,
    manual_count: manualCount,
    trial_active_count: trialActiveCount,
    total_users: profiles.length,
    new_subs_count: newSubsCount,
    new_mrr_eur: Number(newMrrEur.toFixed(2)),
    churned_subs_count: churnedSubsCount,
    churned_mrr_eur: Number(churnedMrrEur.toFixed(2)),
  };

  const { error } = await sb
    .from('mrr_snapshots')
    .upsert(payload, { onConflict: 'snapshot_date' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    snapshot: payload,
    deltaVsYesterday: yesterdaySnap
      ? {
          mrr: Number((mrrTotalEur - Number(yesterdaySnap.mrr_total_eur)).toFixed(2)),
          paying: payingCount - yesterdaySnap.paying_count,
        }
      : null,
  });
}

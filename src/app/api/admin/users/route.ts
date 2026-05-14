import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/billing/stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID;
const YEARLY_PRICE_ID = process.env.STRIPE_YEARLY_PRICE_ID;

type Plan = 'monthly' | 'yearly' | 'manual' | 'other';
type PriceMeta = { plan: Plan; monthlyAmountEur: number };

const priceCache = new Map<string, { meta: PriceMeta; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function resolvePriceMeta(priceId: string | null | undefined): Promise<PriceMeta> {
  if (!priceId) return { plan: 'other', monthlyAmountEur: 0 };
  if (priceId === 'manual') return { plan: 'manual', monthlyAmountEur: 0 };
  if (priceId === MONTHLY_PRICE_ID) return { plan: 'monthly', monthlyAmountEur: 12.99 };
  if (priceId === YEARLY_PRICE_ID) return { plan: 'yearly', monthlyAmountEur: 8.99 };

  const cached = priceCache.get(priceId);
  if (cached && cached.expiresAt > Date.now()) return cached.meta;

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
  priceCache.set(priceId, { meta, expiresAt: Date.now() + CACHE_TTL_MS });
  return meta;
}

export type AdminUserRow = {
  id: string;
  email: string;
  username: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  /** Lifecycle-Bucket — für Filter-Pills. */
  bucket: 'paying' | 'trial' | 'cancelled' | 'free';
  /** Sub-Status (oder 'trial' wenn nur Trial, 'free' wenn ohne alles). */
  status: 'active' | 'on_trial' | 'past_due' | 'paused' | 'cancelled' | 'cancelling' | 'expired' | 'trial' | 'free';
  plan: Plan | 'trial' | 'free';
  mrrEur: number;
  /** Für Trial-User: Datum wann der Trial ausläuft. */
  trialEndsAt: string | null;
  /** Für gekündigte Subs: Datum der Kündigung. */
  cancelAt: string | null;
  /** Wann die Sub erstellt wurde (für Sub-User). */
  subscribedAt: string | null;
  /** Admin-Flag aus profiles. */
  isAdmin: boolean;
};

export async function GET() {
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await userClient.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const sb = await createServiceClient();
  const now = Date.now();

  const [profilesRes, subsRes] = await Promise.all([
    sb
      .from('profiles')
      .select('id, email, username, role, created_at, last_seen_at, trial_ends_at')
      .order('created_at', { ascending: false }),
    // Alle Subs inkl. cancelled/expired für Churn-Sichtbarkeit
    sb
      .from('subscriptions')
      .select('user_id, status, stripe_price_id, cancel_at, current_period_end, created_at, updated_at, cancellation_reason, cancellation_feedback')
      .order('updated_at', { ascending: false }),
  ]);

  if (profilesRes.error || subsRes.error) {
    return NextResponse.json(
      { error: profilesRes.error?.message ?? subsRes.error?.message ?? 'fetch failed' },
      { status: 500 },
    );
  }

  // Pro User: aktuellste Sub finden (egal welcher Status)
  const subByUser = new Map<string, typeof subsRes.data[number]>();
  for (const s of subsRes.data ?? []) {
    if (!subByUser.has(s.user_id)) subByUser.set(s.user_id, s);
  }

  // Price-Metas in einem Rutsch auflösen
  const uniquePriceIds = Array.from(new Set(subsRes.data?.map((s) => s.stripe_price_id) ?? []));
  const metaByPriceId = new Map<string, PriceMeta>();
  await Promise.all(
    uniquePriceIds.map(async (pid) => {
      metaByPriceId.set(pid ?? '', await resolvePriceMeta(pid));
    }),
  );

  const rows: AdminUserRow[] = (profilesRes.data ?? []).map((p) => {
    const sub = subByUser.get(p.id);
    let bucket: AdminUserRow['bucket'];
    let status: AdminUserRow['status'];
    let plan: AdminUserRow['plan'];
    let mrrEur = 0;

    // Cancel-in-Progress (cancel_at gesetzt, aber Sub läuft noch):
    // User hat gekündigt → muss als "Gekündigt" sichtbar sein, auch wenn
    // Stripe-Status noch active ist bis Period-Ende.
    const isCancelling = !!sub?.cancel_at;

    if (sub && (sub.status === 'cancelled' || sub.status === 'expired')) {
      bucket = 'cancelled';
      status = sub.status;
      const meta = metaByPriceId.get(sub.stripe_price_id ?? '') ?? { plan: 'other' as Plan, monthlyAmountEur: 0 };
      plan = meta.plan;
      mrrEur = 0;
    } else if (sub && isCancelling) {
      // Sub läuft noch, ist aber zur Kündigung markiert.
      bucket = 'cancelled';
      status = 'cancelling';
      const meta = metaByPriceId.get(sub.stripe_price_id ?? '') ?? { plan: 'other' as Plan, monthlyAmountEur: 0 };
      plan = meta.plan;
      // MRR zählt weiter bis Period-Ende — also nicht 0
      mrrEur = meta.monthlyAmountEur;
    } else if (sub && (sub.status === 'active' || sub.status === 'past_due' || sub.status === 'on_trial' || sub.status === 'paused')) {
      bucket = 'paying';
      status = sub.status;
      const meta = metaByPriceId.get(sub.stripe_price_id ?? '') ?? { plan: 'other' as Plan, monthlyAmountEur: 0 };
      plan = meta.plan;
      mrrEur = sub.status === 'active' || sub.status === 'on_trial' ? meta.monthlyAmountEur : 0;
    } else if (p.trial_ends_at && new Date(p.trial_ends_at).getTime() > now) {
      bucket = 'trial';
      status = 'trial';
      plan = 'trial';
    } else {
      bucket = 'free';
      status = 'free';
      plan = 'free';
    }

    return {
      id: p.id,
      email: p.email,
      username: p.username,
      createdAt: p.created_at,
      lastSeenAt: p.last_seen_at,
      bucket,
      status,
      plan,
      mrrEur,
      trialEndsAt: p.trial_ends_at,
      cancelAt: sub?.cancel_at ?? null,
      subscribedAt: sub?.created_at ?? null,
      isAdmin: p.role === 'admin',
    };
  });

  // Counts pro Bucket
  const counts = {
    all: rows.length,
    paying: rows.filter((r) => r.bucket === 'paying').length,
    trial: rows.filter((r) => r.bucket === 'trial').length,
    cancelled: rows.filter((r) => r.bucket === 'cancelled').length,
    free: rows.filter((r) => r.bucket === 'free').length,
  };

  // Churn 30T: cancelled Subs in den letzten 30 Tagen
  // Inkludiert sowohl voll abgelaufene Subs (status=cancelled/expired) als auch
  // „cancel_at_period_end"-Subs (User hat gekündigt, läuft aber noch — wichtig
  // damit der Admin direkt sieht wer aktuell rausgeht).
  const thirtyDaysAgoMs = now - 30 * 86_400_000;
  const recentCancellations = (subsRes.data ?? [])
    .filter((s) => {
      const tsMs = new Date(s.updated_at).getTime();
      if (tsMs < thirtyDaysAgoMs) return false;
      // Schon gekündigt
      if (s.status === 'cancelled' || s.status === 'expired') return true;
      // Zur Kündigung markiert
      if (s.cancel_at) return true;
      return false;
    })
    .slice(0, 50);

  // Verlorene MRR (sum der MRR der Plans aus recent cancellations)
  let lostMrrEur = 0;
  for (const c of recentCancellations) {
    const meta = metaByPriceId.get(c.stripe_price_id ?? '') ?? { plan: 'other' as Plan, monthlyAmountEur: 0 };
    lostMrrEur += meta.monthlyAmountEur;
  }

  // Map cancellations → readable form mit user-email
  const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const cancellations = recentCancellations.map((c) => {
    const p = profileById.get(c.user_id);
    const meta = metaByPriceId.get(c.stripe_price_id ?? '') ?? { plan: 'other' as Plan, monthlyAmountEur: 0 };
    return {
      userId: c.user_id,
      email: p?.email ?? null,
      username: p?.username ?? null,
      plan: meta.plan,
      status: c.status,
      cancelledAt: c.updated_at,
      endsAt: c.cancel_at, // wann läuft die Sub tatsächlich aus
      mrrLost: meta.monthlyAmountEur,
      reason: (c as { cancellation_reason?: string | null }).cancellation_reason ?? null,
      feedback: (c as { cancellation_feedback?: string | null }).cancellation_feedback ?? null,
    };
  });

  // Reason-Aggregation aus ALLEN Subs mit Reason (egal ob schon ausgelaufen oder noch nicht)
  const reasonCounts: Record<string, number> = {};
  for (const s of subsRes.data ?? []) {
    const r = (s as { cancellation_reason?: string | null }).cancellation_reason;
    if (r) reasonCounts[r] = (reasonCounts[r] ?? 0) + 1;
  }
  const reasonAggregate = Object.entries(reasonCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([reason, count]) => ({ reason, count }));

  // ============================================
  // AT-RISK Listen
  // ============================================
  const threeDaysMs = 3 * 86_400_000;
  const thirtyDaysMs = 30 * 86_400_000;

  // 1. Trials die in den nächsten 3 Tagen enden — Conversion-Chance
  const trialsEndingSoon = rows
    .filter(
      (r) =>
        r.bucket === 'trial' &&
        r.trialEndsAt &&
        new Date(r.trialEndsAt).getTime() - now <= threeDaysMs &&
        new Date(r.trialEndsAt).getTime() > now,
    )
    .sort((a, b) => new Date(a.trialEndsAt!).getTime() - new Date(b.trialEndsAt!).getTime())
    .slice(0, 20)
    .map((r) => ({
      id: r.id,
      email: r.email,
      username: r.username,
      trialEndsAt: r.trialEndsAt,
      hoursLeft: Math.max(0, Math.round((new Date(r.trialEndsAt!).getTime() - now) / 3_600_000)),
    }));

  // 2. Zahlende User mit „past_due" Status — Payment-Problem
  const paymentIssues = rows
    .filter((r) => r.status === 'past_due')
    .map((r) => ({
      id: r.id,
      email: r.email,
      username: r.username,
      plan: r.plan,
      mrrEur: r.mrrEur,
    }));

  // 3. Zahlende User die seit 30+ Tagen nicht online waren — Churn-Risiko
  const inactivePaying = rows
    .filter(
      (r) =>
        r.bucket === 'paying' &&
        r.status === 'active' &&
        r.lastSeenAt &&
        now - new Date(r.lastSeenAt).getTime() > thirtyDaysMs,
    )
    .sort((a, b) => new Date(a.lastSeenAt!).getTime() - new Date(b.lastSeenAt!).getTime())
    .slice(0, 20)
    .map((r) => ({
      id: r.id,
      email: r.email,
      username: r.username,
      plan: r.plan,
      mrrEur: r.mrrEur,
      lastSeenAt: r.lastSeenAt,
      daysSinceLastSeen: Math.floor((now - new Date(r.lastSeenAt!).getTime()) / 86_400_000),
    }));

  // Online-now-Set: User die in den letzten 2 Min last_seen hatten
  const twoMinAgo = now - 2 * 60_000;
  const onlineNowIds = new Set(
    rows
      .filter((r) => r.lastSeenAt && new Date(r.lastSeenAt).getTime() >= twoMinAgo)
      .map((r) => r.id),
  );

  // Duplikat-Detection: ähnliche Email-Adressen (gleicher Local-Part bis auf 1-2 Buchstaben)
  // Heuristik: gleiche Email-Länge ±1, Levenshtein ≤ 2 im Local-Part
  const duplicateClusters: Array<{ ids: string[]; emails: string[] }> = [];
  const profilesByLocal = new Map<string, { id: string; email: string }[]>();
  for (const r of rows) {
    const local = r.email.split('@')[0]?.toLowerCase();
    if (!local) continue;
    const key = local.slice(0, Math.max(3, local.length - 2));
    if (!profilesByLocal.has(key)) profilesByLocal.set(key, []);
    profilesByLocal.get(key)!.push({ id: r.id, email: r.email });
  }
  for (const group of profilesByLocal.values()) {
    if (group.length >= 2) {
      // Cluster nur wenn Emails wirklich ähnlich (Levenshtein ≤ 2)
      const similar = group.filter((g, i) =>
        group.some((h, j) => i !== j && levenshtein(g.email.toLowerCase(), h.email.toLowerCase()) <= 2),
      );
      if (similar.length >= 2) {
        duplicateClusters.push({
          ids: similar.map((s) => s.id),
          emails: similar.map((s) => s.email),
        });
      }
    }
  }

  // Rows: ergänze isOnline + isNewToday
  const rowsEnriched = rows.map((r) => ({
    ...r,
    isOnline: onlineNowIds.has(r.id),
    isNewToday: new Date(r.createdAt).getTime() >= now - 86_400_000,
  }));

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    counts,
    churn30d: {
      count: recentCancellations.length,
      lostMrrEur,
    },
    atRisk: {
      trialsEndingSoon,
      paymentIssues,
      inactivePaying,
      duplicateClusters,
    },
    rows: rowsEnriched,
    cancellations,
    reasonAggregate,
  });
}

/** Simple Levenshtein-Distanz für Email-Duplikat-Detection. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length || !b.length) return a.length || b.length;
  // 1D Array, kompakt
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    prev = curr;
  }
  return prev[b.length];
}

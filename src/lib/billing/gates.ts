import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { PlanTier } from '@/types';

export type Feature = 'create' | 'export' | 'reports' | 'custom_domains' | 'conditional_redirects' | 'analytics';

/** Which tier is required for each feature */
const FEATURE_TIERS: Record<Feature, PlanTier> = {
  create: 'standard',
  export: 'standard',
  reports: 'standard',
  analytics: 'free',
  custom_domains: 'pro',
  conditional_redirects: 'pro',
};

const TIER_RANK: Record<PlanTier | 'trial', number> = {
  free: 0,
  trial: 1,    // trial = full standard access
  standard: 2,
  pro: 3,
};

export type EffectiveTier = PlanTier | 'trial' | 'expired';

/**
 * Returns the user's effective tier based on subscription + trial status.
 * - Active subscription → subscription tier
 * - No subscription but trial active → 'trial'
 * - No subscription and trial expired → 'expired'
 */
export async function getUserTier(userId: string): Promise<EffectiveTier> {
  const supabase = await createClient();

  // Check for active subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_tier, status')
    .eq('user_id', userId)
    .in('status', ['active', 'on_trial', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (sub) {
    if (sub.status === 'on_trial') return 'trial';
    return sub.plan_tier as PlanTier;
  }

  // No active subscription — check profile trial
  const { data: profile } = await supabase
    .from('profiles')
    .select('trial_ends_at')
    .eq('id', userId)
    .single();

  if (profile?.trial_ends_at) {
    const trialEnd = new Date(profile.trial_ends_at);
    if (trialEnd > new Date()) return 'trial';
  }

  return 'expired';
}

/**
 * Check if a tier has access to a feature.
 */
export function canAccessFeature(tier: EffectiveTier, feature: Feature): boolean {
  if (tier === 'expired') return false;

  const requiredTier = FEATURE_TIERS[feature];
  // Trial grants standard-level access
  const effectiveRank = TIER_RANK[tier === 'trial' ? 'trial' : tier];
  const requiredRank = TIER_RANK[requiredTier];

  // Trial has rank 1 (between free and standard), but should grant standard access
  if (tier === 'trial') return requiredTier !== 'pro';

  return effectiveRank >= requiredRank;
}

/**
 * Server-side gate: redirects to /pricing if user can't access the feature.
 * Use in Server Components and Server Actions.
 */
export async function requireSubscription(feature: Feature = 'create'): Promise<EffectiveTier> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const tier = await getUserTier(user.id);

  if (!canAccessFeature(tier, feature)) {
    redirect(`/pricing?reason=${feature}`);
  }

  return tier;
}

/**
 * Lightweight tier check for Server Components (no redirect, just returns tier).
 */
export async function getSessionTier(): Promise<{ userId: string; tier: EffectiveTier } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const tier = await getUserTier(user.id);
  return { userId: user.id, tier };
}

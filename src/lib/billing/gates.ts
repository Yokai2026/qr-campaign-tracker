import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { PlanTier } from '@/types';

export type Feature = 'create' | 'export' | 'reports' | 'custom_domains' | 'conditional_redirects' | 'analytics';

/**
 * Which tier is required for each feature.
 * Since there is only one paid plan, all features require 'paid' (or an active trial).
 * 'analytics' is available on free tier (view-only, no new QR codes).
 */
const FEATURE_TIERS: Record<Feature, PlanTier> = {
  create: 'paid',
  export: 'paid',
  reports: 'paid',
  analytics: 'free',
  custom_domains: 'paid',
  conditional_redirects: 'paid',
};

const TIER_RANK: Record<PlanTier | 'trial', number> = {
  free: 0,
  trial: 1,  // trial grants full paid-level access
  paid: 2,
};

export type EffectiveTier = PlanTier | 'trial' | 'expired';

/**
 * Returns the user's effective tier based on subscription + trial status.
 * - Active subscription → 'paid'
 * - Stripe trial active → 'trial'
 * - No subscription but profile trial active → 'trial'
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
    .maybeSingle();

  if (sub) {
    if (sub.status === 'on_trial') return 'trial';
    return sub.plan_tier as PlanTier;
  }

  // No active subscription — check profile trial
  const { data: profile } = await supabase
    .from('profiles')
    .select('trial_ends_at')
    .eq('id', userId)
    .maybeSingle();

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
  // Trial grants full paid-level access
  if (tier === 'trial') return true;

  const effectiveRank = TIER_RANK[tier];
  const requiredRank = TIER_RANK[requiredTier];
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

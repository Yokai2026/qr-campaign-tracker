'use server';

import { getSessionTier, canAccessFeature } from './gates';
import type { Feature, EffectiveTier } from './gates';

/**
 * Server Action to check if current user can access a feature.
 * Returns { allowed, tier } — use client-side to show upgrade UI.
 */
export async function checkFeatureAccess(feature: Feature): Promise<{
  allowed: boolean;
  tier: EffectiveTier | 'expired';
}> {
  const session = await getSessionTier();
  if (!session) return { allowed: false, tier: 'expired' };

  const allowed = canAccessFeature(session.tier, feature);
  return { allowed, tier: session.tier };
}

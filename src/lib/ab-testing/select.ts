/**
 * Weighted random selection for A/B testing variants.
 * Returns the selected variant or null if no active variants exist.
 */

import type { AbVariant } from '@/types';

export function selectVariant(
  variants: AbVariant[],
): AbVariant | null {
  const active = variants.filter((v) => v.active);
  if (active.length === 0) return null;

  const totalWeight = active.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;

  for (const variant of active) {
    random -= variant.weight;
    if (random <= 0) return variant;
  }

  // Fallback (should not happen)
  return active[0];
}

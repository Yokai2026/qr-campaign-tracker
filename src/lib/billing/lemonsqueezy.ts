import crypto from 'crypto';

/**
 * Verify Lemon Squeezy webhook signature (HMAC SHA-256).
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest),
  );
}

/**
 * Map Lemon Squeezy variant ID to plan tier.
 */
export function variantToTier(variantId: string): 'standard' | 'pro' {
  if (variantId === process.env.LEMONSQUEEZY_PRO_VARIANT_ID) return 'pro';
  return 'standard';
}

/**
 * Map Lemon Squeezy subscription status to our status.
 */
export function mapSubscriptionStatus(
  lsStatus: string,
): 'on_trial' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired' {
  const mapping: Record<string, 'on_trial' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired'> = {
    on_trial: 'on_trial',
    active: 'active',
    past_due: 'past_due',
    paused: 'paused',
    cancelled: 'cancelled',
    expired: 'expired',
    unpaid: 'past_due',
  };
  return mapping[lsStatus] ?? 'expired';
}

/**
 * Generate Lemon Squeezy checkout URL with user context.
 */
export function getCheckoutUrl(variantId: string, userId: string, email: string): string {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const base = `https://spurig.lemonsqueezy.com/checkout/buy/${variantId}`;
  const params = new URLSearchParams({
    'checkout[custom][user_id]': userId,
    'checkout[email]': email,
    'checkout[success_url]': `${process.env.NEXT_PUBLIC_APP_URL || 'https://spurig.com'}/settings?upgraded=1`,
  });
  return `${base}?${params.toString()}`;
}

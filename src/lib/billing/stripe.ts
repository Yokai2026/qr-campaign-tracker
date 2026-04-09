import Stripe from 'stripe';

/**
 * Singleton Stripe client — reused across requests.
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY not set');
    _stripe = new Stripe(key);
  }
  return _stripe;
}

/**
 * Map Stripe Price ID to plan tier.
 */
export function priceToTier(priceId: string): 'standard' | 'pro' {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  return 'standard';
}

/**
 * Map Stripe subscription status to our internal status.
 */
export function mapStripeStatus(
  stripeStatus: string,
): 'on_trial' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired' {
  const mapping: Record<string, 'on_trial' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired'> = {
    trialing: 'on_trial',
    active: 'active',
    past_due: 'past_due',
    paused: 'paused',
    canceled: 'cancelled',
    incomplete: 'past_due',
    incomplete_expired: 'expired',
    unpaid: 'past_due',
  };
  return mapping[stripeStatus] ?? 'expired';
}

/**
 * Create a Stripe Checkout Session for a subscription.
 */
export async function createCheckoutSession(opts: {
  priceId: string;
  userId: string;
  email: string;
  customerId?: string;
}): Promise<string> {
  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spurig.com';

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: opts.priceId, quantity: 1 }],
    success_url: `${appUrl}/settings?upgraded=1`,
    cancel_url: `${appUrl}/pricing`,
    client_reference_id: opts.userId,
    customer_email: opts.customerId ? undefined : opts.email,
    subscription_data: {
      trial_period_days: 14,
      metadata: { user_id: opts.userId },
    },
    metadata: { user_id: opts.userId },
  };

  if (opts.customerId) {
    sessionParams.customer = opts.customerId;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session.url!;
}

/**
 * Create a Stripe Billing Portal session for subscription management.
 */
export async function createBillingPortalSession(customerId: string): Promise<string> {
  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spurig.com';

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/settings`,
  });
  return session.url;
}

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
 *
 * Sync-Version: matched gegen die in ENV hinterlegten Price-IDs. Wenn nicht
 * gematched (z.B. weil Prices gerade neu angelegt wurden und ENV noch nicht
 * aktualisiert ist) -> 'free'. Webhook nutzt die robuste async-Variante.
 */
export function priceToTier(priceId: string): 'free' | 'paid' {
  const monthly = process.env.STRIPE_MONTHLY_PRICE_ID;
  const yearly = process.env.STRIPE_YEARLY_PRICE_ID;
  if (priceId && (priceId === monthly || priceId === yearly)) return 'paid';
  return 'free';
}

/**
 * Wie priceToTier, aber loest den Price bei Stripe auf und prueft das Product.
 * Robuster gegen Race Conditions zwischen Stripe-Price-Anlage und Vercel-
 * ENV-Var-Update (siehe Bug-Story: gates.ts).
 */
export async function priceToTierViaProduct(priceId: string): Promise<'free' | 'paid'> {
  if (!priceId) return 'free';
  // Fast path: bekannte ENV-Match.
  const monthly = process.env.STRIPE_MONTHLY_PRICE_ID;
  const yearly = process.env.STRIPE_YEARLY_PRICE_ID;
  if (priceId === monthly || priceId === yearly) return 'paid';
  // Slow path: Stripe fragen welcher Product zu diesem Price gehoert.
  try {
    const price = await getStripe().prices.retrieve(priceId);
    // Alle Spurig-Subscription-Prices gehoeren zum Hauptprodukt 'Spurig'.
    // Wenn der Product-Name "Spurig" enthaelt oder es genau das eine
    // Product gibt das wir verkaufen, ist es 'paid'.
    const product = typeof price.product === 'string'
      ? await getStripe().products.retrieve(price.product)
      : price.product;
    if (product && !product.deleted && product.active) return 'paid';
  } catch {
    // Stripe-Lookup failt -> defensive 'free' (Access-Denied),
    // statt fälschlich Zugriff zu gewähren.
  }
  return 'free';
}

/**
 * Map Stripe Price ID to billing cycle.
 * Returns null if the price is unknown (shouldn't normally happen).
 */
export function priceToBillingCycle(priceId: string): 'monthly' | 'yearly' | null {
  if (priceId === process.env.STRIPE_MONTHLY_PRICE_ID) return 'monthly';
  if (priceId === process.env.STRIPE_YEARLY_PRICE_ID) return 'yearly';
  return null;
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

  // No trial_period_days here: the 14-day trial is owned by profiles.trial_ends_at
  // (set by DB trigger on signup). Adding a Stripe trial on top would double-count.
  //
  // Stripe-Tax-Rate fuer Deutschland (19% inklusive) — wird vom Checkout an
  // jede neue Subscription automatisch angehaengt. So sind Rechnungen
  // §14-UStG-konform: zeigen Netto + 19% MwSt + Brutto getrennt.
  const taxRateId = process.env.STRIPE_DEFAULT_TAX_RATE_ID;
  const lineItem: NonNullable<Stripe.Checkout.SessionCreateParams['line_items']>[number] = {
    price: opts.priceId,
    quantity: 1,
    ...(taxRateId ? { tax_rates: [taxRateId] } : {}),
  };

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [lineItem],
    success_url: `${appUrl}/settings?upgraded=1`,
    cancel_url: `${appUrl}/pricing`,
    client_reference_id: opts.userId,
    customer_email: opts.customerId ? undefined : opts.email,
    billing_address_collection: 'required',
    subscription_data: {
      metadata: { user_id: opts.userId },
      ...(taxRateId ? { default_tax_rates: [taxRateId] } : {}),
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

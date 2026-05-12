import { createCheckoutSession, createBillingPortalSession } from './stripe';

export async function getMonthlyCheckoutUrl(userId: string, email: string, customerId?: string): Promise<string> {
  const priceId = process.env.STRIPE_MONTHLY_PRICE_ID;
  if (!priceId) throw new Error('STRIPE_MONTHLY_PRICE_ID not set');
  // Coupon "intro_3mo" zieht -7 EUR auf den ersten 3 Monatsrechnungen ab
  // (12,99 → 5,99). Yearly bekommt kein Intro (eigener Preisrabatt drin).
  const couponId = process.env.STRIPE_INTRO_COUPON_ID;
  return createCheckoutSession({ priceId, userId, email, customerId, couponId });
}

export async function getYearlyCheckoutUrl(userId: string, email: string, customerId?: string): Promise<string> {
  const priceId = process.env.STRIPE_YEARLY_PRICE_ID;
  if (!priceId) throw new Error('STRIPE_YEARLY_PRICE_ID not set');
  return createCheckoutSession({ priceId, userId, email, customerId });
}

export { createBillingPortalSession } from './stripe';

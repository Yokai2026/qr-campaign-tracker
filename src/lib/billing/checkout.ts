import { createCheckoutSession, createBillingPortalSession } from './stripe';

export async function getMonthlyCheckoutUrl(userId: string, email: string, customerId?: string): Promise<string> {
  const priceId = process.env.STRIPE_MONTHLY_PRICE_ID;
  if (!priceId) throw new Error('STRIPE_MONTHLY_PRICE_ID not set');
  return createCheckoutSession({ priceId, userId, email, customerId });
}

export async function getYearlyCheckoutUrl(userId: string, email: string, customerId?: string): Promise<string> {
  const priceId = process.env.STRIPE_YEARLY_PRICE_ID;
  if (!priceId) throw new Error('STRIPE_YEARLY_PRICE_ID not set');
  return createCheckoutSession({ priceId, userId, email, customerId });
}

export { createBillingPortalSession } from './stripe';

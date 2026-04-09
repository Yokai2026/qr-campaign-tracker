import { createCheckoutSession, createBillingPortalSession } from './stripe';

export async function getStandardCheckoutUrl(userId: string, email: string, customerId?: string): Promise<string> {
  const priceId = process.env.STRIPE_STANDARD_PRICE_ID;
  if (!priceId) throw new Error('STRIPE_STANDARD_PRICE_ID not set');
  return createCheckoutSession({ priceId, userId, email, customerId });
}

export async function getProCheckoutUrl(userId: string, email: string, customerId?: string): Promise<string> {
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) throw new Error('STRIPE_PRO_PRICE_ID not set');
  return createCheckoutSession({ priceId, userId, email, customerId });
}

export { createBillingPortalSession } from './stripe';

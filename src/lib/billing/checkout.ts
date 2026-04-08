import { getCheckoutUrl } from './lemonsqueezy';

export function getStandardCheckoutUrl(userId: string, email: string): string {
  const variantId = process.env.LEMONSQUEEZY_STANDARD_VARIANT_ID;
  if (!variantId) throw new Error('LEMONSQUEEZY_STANDARD_VARIANT_ID not set');
  return getCheckoutUrl(variantId, userId, email);
}

export function getProCheckoutUrl(userId: string, email: string): string {
  const variantId = process.env.LEMONSQUEEZY_PRO_VARIANT_ID;
  if (!variantId) throw new Error('LEMONSQUEEZY_PRO_VARIANT_ID not set');
  return getCheckoutUrl(variantId, userId, email);
}

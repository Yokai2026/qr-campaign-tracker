'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { getMonthlyCheckoutUrl, getYearlyCheckoutUrl } from '@/lib/billing/checkout';
import { createBillingPortalSession, getStripe } from '@/lib/billing/stripe';

export async function getCheckoutUrls() {
  const profile = await requireAuth();
  const supabase = await createClient();

  // Check if user already has a Stripe customer ID
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const customerId = sub?.stripe_customer_id ?? undefined;

  return {
    monthly: await getMonthlyCheckoutUrl(profile.id, profile.email, customerId),
    yearly: await getYearlyCheckoutUrl(profile.id, profile.email, customerId),
  };
}

export async function getBillingPortalUrl(): Promise<string | null> {
  const profile = await requireAuth();
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub?.stripe_customer_id) return null;
  return createBillingPortalSession(sub.stripe_customer_id);
}

/**
 * Wechselt den Abrechnungszyklus der laufenden Subscription zwischen
 * monatlich und jährlich. Nutzt Stripe-Proration ("create_prorations"):
 * Stripe rechnet die Differenz auf der nächsten Rechnung korrekt aus.
 *
 * Webhooks halten die Supabase-Row danach in Sync; wir setzen aber direkt
 * stripe_price_id, damit das UI sofort den neuen Plan anzeigt.
 */
export async function switchBillingCycle(
  target: 'monthly' | 'yearly',
): Promise<{ success: boolean; error?: string }> {
  const profile = await requireAuth();
  const supabase = await createClient();

  const monthlyPriceId = process.env.STRIPE_MONTHLY_PRICE_ID;
  const yearlyPriceId = process.env.STRIPE_YEARLY_PRICE_ID;
  if (!monthlyPriceId || !yearlyPriceId) {
    return { success: false, error: 'Stripe-Preise nicht konfiguriert.' };
  }
  const targetPriceId = target === 'monthly' ? monthlyPriceId : yearlyPriceId;

  const { data: sub, error: subErr } = await supabase
    .from('subscriptions')
    .select('id, stripe_subscription_id, stripe_price_id, status')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subErr || !sub?.stripe_subscription_id) {
    return { success: false, error: 'Kein aktives Abo gefunden.' };
  }
  if (sub.stripe_price_id === targetPriceId) {
    return { success: true };
  }

  try {
    const stripe = getStripe();
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
    const itemId = stripeSub.items.data[0]?.id;
    if (!itemId) {
      return { success: false, error: 'Stripe-Item nicht gefunden.' };
    }
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      items: [{ id: itemId, price: targetPriceId }],
      proration_behavior: 'create_prorations',
    });
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Stripe-Fehler' };
  }

  // Optimistic local update — Webhook syncronisiert ggf. nach.
  await supabase
    .from('subscriptions')
    .update({ stripe_price_id: targetPriceId })
    .eq('id', sub.id);

  revalidatePath('/settings');
  return { success: true };
}

export async function getSubscription() {
  const profile = await requireAuth();
  const supabase = await createClient();

  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    subscription: data,
    profile: {
      id: profile.id,
      email: profile.email,
      trial_ends_at: profile.trial_ends_at,
    },
  };
}

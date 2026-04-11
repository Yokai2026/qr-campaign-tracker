'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { getMonthlyCheckoutUrl, getYearlyCheckoutUrl } from '@/lib/billing/checkout';
import { createBillingPortalSession } from '@/lib/billing/stripe';

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

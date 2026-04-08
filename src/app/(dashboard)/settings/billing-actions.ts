'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { getStandardCheckoutUrl, getProCheckoutUrl } from '@/lib/billing/checkout';

export async function getCheckoutUrls() {
  const profile = await requireAuth();
  return {
    standard: getStandardCheckoutUrl(profile.id, profile.email),
    pro: getProCheckoutUrl(profile.id, profile.email),
  };
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
    .single();

  return {
    subscription: data,
    profile: {
      id: profile.id,
      email: profile.email,
      trial_ends_at: profile.trial_ends_at,
    },
  };
}

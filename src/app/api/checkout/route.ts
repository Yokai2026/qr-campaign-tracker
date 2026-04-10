import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMonthlyCheckoutUrl, getYearlyCheckoutUrl } from '@/lib/billing/checkout';

export async function GET(request: NextRequest) {
  const plan = request.nextUrl.searchParams.get('plan');
  if (plan !== 'monthly' && plan !== 'yearly') {
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check for existing Stripe customer
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const customerId = sub?.stripe_customer_id ?? undefined;

  const url = plan === 'yearly'
    ? await getYearlyCheckoutUrl(user.id, user.email!, customerId)
    : await getMonthlyCheckoutUrl(user.id, user.email!, customerId);

  return NextResponse.redirect(url);
}

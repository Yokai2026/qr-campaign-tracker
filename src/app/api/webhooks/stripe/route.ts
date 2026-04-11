import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getStripe, priceToTier, mapStripeStatus } from '@/lib/billing/stripe';
import type Stripe from 'stripe';

/**
 * Read current_period_end from subscription.
 * Stripe API "Basil" (2025-03-31) moved this field from the top-level
 * Subscription object to the individual line items. We try items.data[0]
 * first, then fall back to the top-level for older API versions.
 */
function getPeriodEnd(sub: Stripe.Subscription): string | null {
  const item = sub.items?.data?.[0] as unknown as Record<string, number> | undefined;
  const itemEnd = item?.current_period_end;
  if (itemEnd) return new Date(itemEnd * 1000).toISOString();
  const topEnd = (sub as unknown as Record<string, number>).current_period_end;
  return topEnd ? new Date(topEnd * 1000).toISOString() : null;
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const supabase = await createServiceClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== 'subscription' || !session.subscription) break;

      const userId = session.metadata?.user_id ?? session.client_reference_id;
      if (!userId) break;

      const stripe = getStripe();
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price.id ?? '';

      await supabase.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: String(subscription.customer),
          stripe_price_id: priceId,
          plan_tier: priceToTier(priceId),
          status: mapStripeStatus(subscription.status),
          trial_ends_at: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
          current_period_end: getPeriodEnd(subscription),
        },
        { onConflict: 'stripe_subscription_id' },
      );
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0]?.price.id ?? '';

      await supabase
        .from('subscriptions')
        .update({
          stripe_price_id: priceId,
          plan_tier: priceToTier(priceId),
          status: mapStripeStatus(subscription.status),
          trial_ends_at: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
          current_period_end: getPeriodEnd(subscription),
          cancel_at: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : null,
        })
        .eq('stripe_subscription_id', subscription.id);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('stripe_subscription_id', subscription.id);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as unknown as Record<string, unknown>;
      const subId = invoice.subscription as string | undefined;
      if (!subId) break;
      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_subscription_id', subId);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

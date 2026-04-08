import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import {
  verifyWebhookSignature,
  variantToTier,
  mapSubscriptionStatus,
} from '@/lib/billing/lemonsqueezy';

export async function POST(request: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-signature') ?? '';

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventName = event.meta?.event_name as string;
  const attrs = event.data?.attributes;

  if (!eventName || !attrs) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // Extract user_id from custom data (passed during checkout)
  const userId = event.meta?.custom_data?.user_id as string | undefined;
  const lsSubscriptionId = String(event.data.id);
  const lsCustomerId = String(attrs.customer_id);
  const lsVariantId = String(attrs.variant_id);

  switch (eventName) {
    case 'subscription_created': {
      if (!userId) {
        return NextResponse.json({ error: 'Missing user_id in custom_data' }, { status: 400 });
      }

      const tier = variantToTier(lsVariantId);
      const status = mapSubscriptionStatus(attrs.status);

      await supabase.from('subscriptions').upsert(
        {
          user_id: userId,
          ls_subscription_id: lsSubscriptionId,
          ls_customer_id: lsCustomerId,
          ls_variant_id: lsVariantId,
          plan_tier: tier,
          status,
          trial_ends_at: attrs.trial_ends_at ?? null,
          current_period_end: attrs.renews_at ?? null,
        },
        { onConflict: 'ls_subscription_id' },
      );
      break;
    }

    case 'subscription_updated':
    case 'subscription_resumed': {
      const tier = variantToTier(lsVariantId);
      const status = mapSubscriptionStatus(attrs.status);

      await supabase
        .from('subscriptions')
        .update({
          plan_tier: tier,
          ls_variant_id: lsVariantId,
          status,
          trial_ends_at: attrs.trial_ends_at ?? null,
          current_period_end: attrs.renews_at ?? null,
          cancel_at: attrs.cancelled ? attrs.ends_at : null,
        })
        .eq('ls_subscription_id', lsSubscriptionId);
      break;
    }

    case 'subscription_cancelled': {
      await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancel_at: attrs.ends_at ?? null,
        })
        .eq('ls_subscription_id', lsSubscriptionId);
      break;
    }

    case 'subscription_expired': {
      await supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('ls_subscription_id', lsSubscriptionId);
      break;
    }

    default:
      // Unhandled event — acknowledge without action
      break;
  }

  return NextResponse.json({ received: true });
}

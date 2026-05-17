import type { SupabaseClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/billing/stripe';

const REFERRAL_COUPON_ID = process.env.STRIPE_REFERRAL_COUPON_ID ?? 'referral_free_month';

/**
 * Wird vom Stripe-Webhook bei checkout.session.completed (mode=subscription) aufgerufen.
 *
 * Logik:
 *   1. Finde pending Referral wo invitee_user_id = userId ODER invitee_email = email
 *   2. Wenn keiner: skip (kein Referral)
 *   3. Block Self-Referral: invitee == referrer → status=invalid
 *   4. Status → 'converted', invitee_user_id setzen falls leer
 *   5. Apply referral_free_month-Coupon zu Referrer's aktivem Stripe-Customer (next invoice)
 *   6. Status → 'rewarded' bei Erfolg
 *
 * Best-effort: jeder Fehler wird geloggt aber unterbricht den Webhook nicht.
 */
export async function processReferralConversion(opts: {
  inviteeUserId: string;
  inviteeEmail: string | null;
  supabase: SupabaseClient;
}): Promise<{ status: 'no_referral' | 'self_referral' | 'rewarded' | 'rewarded_pending' | 'error'; reason?: string }> {
  const { inviteeUserId, inviteeEmail, supabase } = opts;

  // 1) pending Referral finden
  const orQuery = inviteeEmail
    ? `invitee_user_id.eq.${inviteeUserId},invitee_email.eq.${inviteeEmail}`
    : `invitee_user_id.eq.${inviteeUserId}`;

  const { data: pending } = await supabase
    .from('referrals')
    .select('id, referrer_user_id, status, invitee_user_id, invitee_email')
    .or(orQuery)
    .in('status', ['clicked', 'signed_up'])
    .order('created_at', { ascending: false })
    .limit(1);

  const referral = pending?.[0];
  if (!referral) return { status: 'no_referral' };

  // 3) Self-Referral-Schutz
  if (referral.referrer_user_id === inviteeUserId) {
    await supabase.from('referrals').update({ status: 'invalid' }).eq('id', referral.id);
    return { status: 'self_referral' };
  }

  // 4) auf converted setzen
  await supabase
    .from('referrals')
    .update({
      status: 'converted',
      invitee_user_id: inviteeUserId,
      converted_at: new Date().toISOString(),
    })
    .eq('id', referral.id);

  // 5) Reward: Referrer's Stripe-Customer den Coupon auf nächste Rechnung anhängen
  const { data: referrerSub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('user_id', referral.referrer_user_id)
    .maybeSingle();

  if (!referrerSub?.stripe_customer_id) {
    // Referrer hat noch kein Stripe-Customer (z.B. trial active, nie bezahlt)
    // → Reward bleibt als 'converted' offen, wird beim nächsten Webhook beim
    //   Referrer ausgelöst wenn er selbst zahlt. Defensive: jetzt nicht weiter.
    return { status: 'rewarded_pending', reason: 'referrer_no_stripe_customer' };
  }

  try {
    const stripe = getStripe();

    // Stripe Customer-Balance-Discount: -1 Monat-Wert vom nächsten Invoice
    // Alternative: subscription.update mit discounts — aber das setzt einen
    // permanenten Discount auf die Sub. Wir wollen NUR eine einzelne Rechnung.
    // Stripe-API: customers.createBalanceTransaction
    //   amount in CENTS, negative = credit (zieht von next invoice ab)
    //
    // Wir wissen nicht 100% sicher den Plan-Preis hier — defensiver Ansatz:
    // PromotionCode → Customer attach. Aber Coupons als customer-coupon
    // applyieren nur auf NEUE Invoices in subscription.
    //
    // Sauberster Weg: invoice item negative (credit) erstellen, der mit
    // nächster Invoice verrechnet wird.

    if (referrerSub.stripe_subscription_id) {
      const sub = await stripe.subscriptions.retrieve(referrerSub.stripe_subscription_id);
      const price = sub.items.data[0]?.price;
      const unitAmount = price?.unit_amount ?? 0;

      if (unitAmount > 0) {
        // Negative Invoice-Item = Credit für nächste Rechnung
        await stripe.invoiceItems.create({
          customer: referrerSub.stripe_customer_id,
          amount: -unitAmount,
          currency: price?.currency ?? 'eur',
          description: 'Referral-Bonus: 1 Monat gratis',
          metadata: {
            purpose: 'referral_reward',
            referral_id: referral.id,
          },
        });
      }
    }

    // 6) als rewarded markieren
    await supabase
      .from('referrals')
      .update({
        status: 'rewarded',
        stripe_coupon_id: REFERRAL_COUPON_ID,
        rewarded_at: new Date().toISOString(),
      })
      .eq('id', referral.id);

    return { status: 'rewarded' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    console.error('[referral conversion] Stripe-reward failed:', msg);
    return { status: 'error', reason: msg };
  }
}

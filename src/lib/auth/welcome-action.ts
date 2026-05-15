'use server';

import { cookies, headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { buildWelcomeHtml } from '@/lib/email/welcome-html';
import { notifyAdminSignup } from '@/lib/email/admin-notify';
import { UTM_COOKIE_NAME } from '@/lib/attribution/utm';

const SUPPORT_EMAIL = 'support@spurig.com';

/**
 * Liest UTM-Cookie (von Middleware gesetzt) und persistiert Attribution auf profile.
 * Wirkt nur wenn attribution_source noch nicht gesetzt ist (first-touch wins).
 */
async function persistAttribution(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<void> {
  try {
    const cookieStore = await cookies();
    const utmCookie = cookieStore.get(UTM_COOKIE_NAME);
    if (!utmCookie?.value) return;

    const data = JSON.parse(utmCookie.value) as {
      source?: string;
      medium?: string;
      campaign?: string;
      content?: string;
      referrer?: string;
      seen_at?: string;
    };
    if (!data.source) return;

    await supabase
      .from('profiles')
      .update({
        attribution_source: data.source.slice(0, 80),
        attribution_medium: data.medium?.slice(0, 80) ?? null,
        attribution_campaign: data.campaign?.slice(0, 200) ?? null,
        attribution_content: data.content?.slice(0, 200) ?? null,
        attribution_referrer: data.referrer?.slice(0, 500) ?? null,
        attribution_first_seen_at: data.seen_at ?? new Date().toISOString(),
      })
      .eq('id', userId)
      .is('attribution_source', null);
  } catch {
    // ignore — Attribution-Tracking soll nie Signup blocken
  }
}

// Sendet die Welcome-Mail genau einmal pro User nach erfolgreichem
// Email-Confirm (OTP oder Link). Idempotent ueber profiles.welcome_sent_at.
// Failures werden geloggt aber nicht propagiert.
export async function triggerWelcomeEmail(): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email || !user.email_confirmed_at) return;

    // Attribution-Capture: UTM-Cookie -> profile (first-touch).
    // Best-effort, blockt nicht.
    await persistAttribution(supabase, user.id);

    const { data: profile } = await supabase
      .from('profiles')
      .select('welcome_sent_at, username, trial_ends_at')
      .eq('id', user.id)
      .single();

    if (!profile || profile.welcome_sent_at) return;

    const now = new Date().toISOString();
    const { error: markError } = await supabase
      .from('profiles')
      .update({ welcome_sent_at: now })
      .eq('id', user.id)
      .is('welcome_sent_at', null);

    if (markError) return;

    const headerList = await headers();
    const host = headerList.get('host') ?? 'spurig.com';
    const proto = headerList.get('x-forwarded-proto') ?? 'https';
    const origin = `${proto}://${host}`;

    const html = buildWelcomeHtml({
      username: profile.username ?? null,
      trialEndsAt: profile.trial_ends_at ?? null,
      dashboardUrl: `${origin}/dashboard`,
      newCampaignUrl: `${origin}/campaigns/new`,
      pricingUrl: `${origin}/pricing`,
      supportEmail: SUPPORT_EMAIL,
    });

    try {
      await sendEmail({
        to: user.email,
        subject: 'Willkommen bei Spurig',
        html,
      });
      // Admin-Notification (best-effort, blockt Welcome-Flow nicht)
      void notifyAdminSignup({
        email: user.email,
        username: profile.username ?? null,
        trialEndsAt: profile.trial_ends_at ?? null,
      });
    } catch (sendErr) {
      await supabase
        .from('profiles')
        .update({ welcome_sent_at: null })
        .eq('id', user.id);
      console.error('[welcome-email] send failed:', sendErr);
    }
  } catch (err) {
    console.error('[welcome-email] unexpected error:', err);
  }
}

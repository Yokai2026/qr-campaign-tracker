import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { buildWelcomeHtml } from '@/lib/email/welcome-html';

const SUPPORT_EMAIL = 'support@spurig.com';

// Auth-Callback: empfaengt den OTP-Code von Supabase-E-Mails
// (Magic-Link, Password-Reset, E-Mail-Confirm) und tauscht ihn gegen
// eine Session. Anschliessend Redirect auf `next` (Default: /dashboard).
//
// Wird von Supabase aus dem `redirect_to`-Parameter der E-Mail-Templates
// aufgerufen. Verlinkt z.B. in der "Reset Password"-Mail als:
//   https://spurig.com/auth/callback?next=/reset-password
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const errorDescription = searchParams.get('error_description');

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription)}`,
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await maybeSendWelcomeEmail(supabase, origin);
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}/login?error=Ung%C3%BCltiger+Link`);
}

// Sendet die Welcome-Mail genau einmal pro User, nach der ersten Email-
// Bestaetigung. Idempotenz via `profiles.welcome_sent_at` (Migration 025).
// Failures werden geloggt aber nicht propagiert — die Mail darf den
// Login niemals blockieren.
async function maybeSendWelcomeEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  origin: string,
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email || !user.email_confirmed_at) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('welcome_sent_at, username, trial_ends_at')
      .eq('id', user.id)
      .single();

    if (!profile || profile.welcome_sent_at) return;

    // Optimistisch markieren: verhindert Doppelversand bei parallelen
    // Callback-Aufrufen. Bei Mail-Fehler wird der Marker zurueckgesetzt.
    const now = new Date().toISOString();
    const { error: markError } = await supabase
      .from('profiles')
      .update({ welcome_sent_at: now })
      .eq('id', user.id)
      .is('welcome_sent_at', null);

    if (markError) return;

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
    } catch (sendErr) {
      // Rollback Marker — beim naechsten Login darf neu versucht werden
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

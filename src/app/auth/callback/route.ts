import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}/login?error=Ung%C3%BCltiger+Link`);
}

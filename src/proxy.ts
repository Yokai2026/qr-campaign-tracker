import { updateSession } from '@/lib/supabase/middleware';
import { UTM_COOKIE_NAME, UTM_COOKIE_MAX_AGE_DAYS } from '@/lib/attribution/utm';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  // UTM-Capture: wenn URL utm_source enthaelt, Cookie setzen damit Attribution
  // beim Signup gelesen werden kann. 30 Tage Persistenz.
  const source = request.nextUrl.searchParams.get('utm_source');
  if (source && response) {
    const payload = {
      source,
      medium: request.nextUrl.searchParams.get('utm_medium') ?? null,
      campaign: request.nextUrl.searchParams.get('utm_campaign') ?? null,
      content: request.nextUrl.searchParams.get('utm_content') ?? null,
      referrer: request.headers.get('referer') ?? null,
      seen_at: new Date().toISOString(),
    };
    response.cookies.set({
      name: UTM_COOKIE_NAME,
      value: JSON.stringify(payload),
      maxAge: UTM_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
      secure: true,
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

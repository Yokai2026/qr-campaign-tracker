import { NextRequest, NextResponse } from 'next/server';
import { UTM_COOKIE_NAME, UTM_COOKIE_MAX_AGE_DAYS } from '@/lib/attribution/utm';

/**
 * UTM-Capture-Middleware.
 *
 * Wenn Request UTM-Params in der URL hat, schreibt sie in einen Cookie.
 * Cookie lebt 30 Tage. Signup-Action liest Cookie und persistiert auf profile.
 *
 * Wirkt NICHT auf API-Routes, _next, Static-Assets — nur auf "echte" Pages.
 */
export function middleware(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const source = searchParams.get('utm_source');

  // Nur wenn UTM-Params anwesend sind → Cookie setzen
  if (!source) return NextResponse.next();

  const payload = {
    source,
    medium: searchParams.get('utm_medium') ?? null,
    campaign: searchParams.get('utm_campaign') ?? null,
    content: searchParams.get('utm_content') ?? null,
    referrer: request.headers.get('referer') ?? null,
    seen_at: new Date().toISOString(),
  };

  const response = NextResponse.next();
  response.cookies.set({
    name: UTM_COOKIE_NAME,
    value: JSON.stringify(payload),
    maxAge: UTM_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax',
    httpOnly: false, // false damit Client auch lesen kann fuer Browser-Pixel später
    secure: true,
  });
  return response;
}

export const config = {
  matcher: [
    // Skip _next, API-Routes, Static-Files
    '/((?!_next/static|_next/image|api|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|gif|ico|webp|woff2|woff|ttf|map)$).*)',
  ],
};

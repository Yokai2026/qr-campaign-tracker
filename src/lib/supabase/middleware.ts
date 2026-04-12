import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Returns the primary app host (without protocol, lowercase).
 * Used to decide whether an incoming request is on a custom domain.
 */
function getAppHost(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  if (!raw) return null;
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Minimal 404 body for custom-host requests that don't match a short code.
 * Keeps the customer's branded domain clean — no Spurig landing/login leak.
 */
function customHostNotFound(): NextResponse {
  const body = `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Seite nicht gefunden</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fafafa;color:#111}
.c{text-align:center;max-width:420px;padding:2rem}.c h1{font-size:1.25rem;font-weight:600;margin-bottom:.5rem}.c p{font-size:.875rem;color:#666}</style></head>
<body><div class="c"><h1>Seite nicht gefunden</h1><p>Dieser Link existiert nicht.</p></div></body></html>`;
  return new NextResponse(body, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

/**
 * If the request comes in on a custom (non-app) host:
 * - /r/... → let through (redirect handler serves it)
 * - /<shortcode> → rewrite to /r/<shortcode>
 * - anything else (including /, app paths, nested paths, assets) → 404
 *
 * This keeps the customer's branded domain from ever showing the Spurig app UI.
 * Returns a NextResponse if handled, otherwise null (= request is on app host).
 */
function handleCustomHost(request: NextRequest): NextResponse | null {
  const host = request.headers.get('host')?.toLowerCase().split(':')[0];
  if (!host) return null;

  const appHost = getAppHost();
  // In dev without NEXT_PUBLIC_APP_URL, treat localhost as app host
  if (!appHost && (host === 'localhost' || host.endsWith('.localhost'))) return null;
  if (appHost && host === appHost) return null;

  // From here on: request is on a custom host.
  const path = request.nextUrl.pathname;

  // Next.js internals & favicons still need to resolve on custom hosts
  // (e.g. 404 page styles). Let these through untouched.
  if (path.startsWith('/_next/') || path === '/favicon.ico') return null;

  // Already targeting the redirect handler — let it through as-is.
  if (path.startsWith('/r/')) return null;

  // Match short-code shape: single path segment, alphanumerics + - _
  const match = path.match(/^\/([a-zA-Z0-9_-]{1,64})\/?$/);
  if (match) {
    const url = request.nextUrl.clone();
    url.pathname = `/r/${match[1]}`;
    return NextResponse.rewrite(url);
  }

  // Any other path on a custom host (including "/", app paths, nested paths)
  // must not expose the Spurig app UI → clean 404.
  return customHostNotFound();
}

export async function updateSession(request: NextRequest) {
  const customHostResponse = handleCustomHost(request);
  if (customHostResponse) return customHostResponse;

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Allow public routes: redirect handler, tracking API, login, static files
  const publicPaths = ['/r/', '/api/track', '/login', '/signup', '/api/qr/image', '/api/webhooks/', '/datenschutz', '/impressum', '/pricing'];
  const isPublic = publicPaths.some((p) => path.startsWith(p));

  if (!user && !isPublic && path !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && (path === '/login' || path === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (user && path === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Paths that always stay on the primary app host.
const APP_ONLY_PATHS = [
  '/api',
  '/_next',
  '/login',
  '/dashboard',
  '/campaigns',
  '/locations',
  '/placements',
  '/qr-codes',
  '/links',
  '/analytics',
  '/settings',
  '/datenschutz',
  '/favicon',
];

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
 * If the request comes in on a custom (non-app) host, rewrite short-code-like
 * paths to /r/[code] so the existing redirect handler can serve them.
 * Returns a NextResponse if a rewrite/redirect happened, otherwise null.
 */
function handleCustomHost(request: NextRequest): NextResponse | null {
  const host = request.headers.get('host')?.toLowerCase().split(':')[0];
  if (!host) return null;

  const appHost = getAppHost();
  // In dev without NEXT_PUBLIC_APP_URL, treat localhost as app host
  if (!appHost && (host === 'localhost' || host.endsWith('.localhost'))) return null;
  if (appHost && host === appHost) return null;

  const path = request.nextUrl.pathname;

  // Already targeting the redirect handler — let it through as-is.
  if (path.startsWith('/r/')) return null;

  // Skip app-only paths (they shouldn't appear on custom domains, but be lenient).
  if (APP_ONLY_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return null;

  // Match short-code shape: single path segment, alphanumerics + - _
  const match = path.match(/^\/([a-zA-Z0-9_-]{1,64})\/?$/);
  if (!match) return null;

  const url = request.nextUrl.clone();
  url.pathname = `/r/${match[1]}`;
  return NextResponse.rewrite(url);
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
  const publicPaths = ['/r/', '/api/track', '/login', '/api/qr/image', '/datenschutz'];
  const isPublic = publicPaths.some((p) => path.startsWith(p));

  if (!user && !isPublic && path !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && path === '/login') {
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

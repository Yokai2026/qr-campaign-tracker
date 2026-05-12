// Einfacher In-Memory Sliding-Window Rate-Limiter, scoped pro Token.
// Reicht fuer einzelne Region-Deploys (Vercel fra1). Bei Multi-Region
// spaeter auf Upstash Redis umstellen.

import { NextResponse } from 'next/server';
import { apiError } from './auth';

const WINDOW_MS = 60_000;          // 1 Minute Sliding Window
const MAX_REQUESTS_PER_MIN = 100;

const buckets = new Map<string, number[]>();

export function checkRateLimit(tokenId: string): NextResponse | null {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const arr = buckets.get(tokenId) ?? [];
  // Alte Eintraege rauswerfen
  while (arr.length > 0 && arr[0] < cutoff) arr.shift();

  if (arr.length >= MAX_REQUESTS_PER_MIN) {
    const retryAfter = Math.ceil((arr[0] + WINDOW_MS - now) / 1000);
    return new NextResponse(
      JSON.stringify({ error: { message: 'Rate limit exceeded', code: 'rate_limited' } }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.max(1, retryAfter).toString(),
          'X-RateLimit-Limit': MAX_REQUESTS_PER_MIN.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(arr[0] + WINDOW_MS).toISOString(),
        },
      },
    );
  }

  arr.push(now);
  buckets.set(tokenId, arr);
  return null;
}

export function rateLimitHeaders(tokenId: string): Record<string, string> {
  const arr = buckets.get(tokenId) ?? [];
  return {
    'X-RateLimit-Limit': MAX_REQUESTS_PER_MIN.toString(),
    'X-RateLimit-Remaining': Math.max(0, MAX_REQUESTS_PER_MIN - arr.length).toString(),
  };
}

// Convenience-Helper: kombinierte Auth + Rate-Limit Pruefung.
// Liefert entweder Error-Response oder ApiAuth-Kontext.
import type { ApiAuth } from './auth';
import { authenticateRequest } from './auth';
import { NextRequest } from 'next/server';
export async function authAndRateLimit(req: NextRequest): Promise<ApiAuth | NextResponse> {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  const rl = checkRateLimit(auth.tokenId);
  if (rl) return rl;
  return auth;
}

import * as Sentry from '@sentry/nextjs';

// Edge runtime (proxy.ts, edge route handlers). Same config shape as server,
// but fewer features (no Node APIs available).
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    sendDefaultPii: false,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    ignoreErrors: ['NEXT_REDIRECT', 'NEXT_NOT_FOUND'],
  });
}

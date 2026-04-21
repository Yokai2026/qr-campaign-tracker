import * as Sentry from '@sentry/nextjs';

// Silently no-op if DSN not set (keeps dev / preview envs clean).
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,

    // Production: sample 10% of transactions. Dev: 100% for local debugging.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // DSGVO: never send IP / User-ID / cookies by default.
    sendDefaultPii: false,

    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',

    // Strip PII-ish data from request payloads before transmitting to Sentry.
    beforeSend(event) {
      if (event.request?.url) {
        try {
          const u = new URL(event.request.url);
          u.search = '';
          event.request.url = u.toString();
        } catch {
          // ignore parse errors
        }
      }
      if (event.request?.headers) {
        delete event.request.headers['cookie'];
        delete event.request.headers['authorization'];
        delete event.request.headers['x-forwarded-for'];
        delete event.request.headers['x-real-ip'];
      }
      return event;
    },

    // Known non-errors — Next.js throws these for control flow.
    ignoreErrors: ['NEXT_REDIRECT', 'NEXT_NOT_FOUND'],
  });
}

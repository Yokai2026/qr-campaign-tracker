import * as Sentry from '@sentry/nextjs';

// Browser-side. DSN must be public (NEXT_PUBLIC_) so the build exposes it.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    environment: process.env.NODE_ENV || 'development',

    // DSGVO: keine Session-Replays, keine BrowserSession-Integration ohne
    // expliziten Cookie-Consent. Rauskanten aus den Default-Integrationen.
    integrations: (defaults) =>
      defaults.filter((i) => !['Replay', 'BrowserSession'].includes(i.name)),

    beforeSend(event) {
      if (event.request?.url) {
        try {
          const u = new URL(event.request.url);
          u.search = '';
          event.request.url = u.toString();
        } catch {
          // ignore
        }
      }
      return event;
    },

    // Browser-Noise: Fremd-Erweiterungen, Netzwerk-Flaps, etc.
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      'Network request failed',
      'NEXT_REDIRECT',
      'NEXT_NOT_FOUND',
    ],
  });
}

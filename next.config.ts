import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  experimental: {
    // @tanstack/* aus der Liste entfernt — verursacht Compile-Hang mit Turbopack.
    // recharts hat eigenes ESM-Setup; in der Liste lassen wir es weg.
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

// Sentry-Wrap — alle Sentry-Features greifen nur wenn DSN/Auth-Token gesetzt
// sind (siehe sentry.*.config.ts). Ohne Envs ist der Wrap ein No-Op und der
// Build bleibt clean.
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Source-Maps nach Upload löschen — minimaler Leak, nichts Öffentliches.
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  // Logger-Statements in Prod rausstrippen.
  disableLogger: true,
});

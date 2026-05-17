import type { Metadata, Viewport } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import { CookieBanner } from '@/components/layout/cookie-banner';
import { ThemeProvider } from '@/components/theme-provider';
import { PresenceHeartbeat } from '@/components/shared/presence-heartbeat';
import { GoogleAdsScript } from '@/components/marketing/google-ads-script';
import { MetaPixelScript } from '@/components/marketing/meta-pixel-script';
import { ReferralClickTracker } from '@/components/referral/click-tracker';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  axes: ['opsz'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Spurig — QR-Code Tracking & Analytics, DSGVO-konform',
    template: '%s — Spurig',
  },
  description: 'DSGVO-konformes QR-Code-Tracking und Kampagnen-Analytics. Scans, Besucher, Geräte und Standorte in Echtzeit — ohne Drittanbieter, ohne Cookie-Banner.',
  keywords: ['QR Code Tracking', 'QR Code Analytics', 'DSGVO QR Code', 'Kampagnen Tracking', 'QR-Code Analyse', 'Offline-Marketing Tracking'],
  metadataBase: new URL('https://spurig.com'),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'Spurig',
    title: 'Spurig — QR-Code Tracking & Analytics, DSGVO-konform',
    description: 'DSGVO-konformes QR-Code-Tracking und Kampagnen-Analytics. Scans, Besucher, Geräte und Standorte in Echtzeit — ohne Drittanbieter.',
    url: 'https://spurig.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spurig — QR-Code Tracking & Analytics',
    description: 'DSGVO-konformes QR-Code-Tracking. Scans, Besucher, Geräte und Standorte in Echtzeit.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  // Dark als Default — Mobile-Browser-Chrome-Farbe matched die dunkle Seite
  themeColor: '#0a0a0a',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased dark`}
      style={{ colorScheme: 'dark' }}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
          >
            Zum Inhalt springen
          </a>
          {children}
          <CookieBanner />
          {/* Live-Presence-Tracking auf JEDER Page (auch Landing/Public).
              Erfasst anonyme Besucher + eingeloggte User getrennt. */}
          <PresenceHeartbeat />
          {/* Google-Ads-Tag (gtag.js). Rendert nichts wenn NEXT_PUBLIC_GOOGLE_ADS_ID nicht gesetzt ist. */}
          <GoogleAdsScript />
          {/* Meta-Pixel (fbq). Rendert nichts wenn NEXT_PUBLIC_META_PIXEL_ID nicht gesetzt ist.
              Feuert auto PageView. Lead/Purchase via meta-pixel.ts an signup-verify + settings. */}
          <MetaPixelScript />
          {/* Referral-Click-Tracker: liest ?ref=XXX → setzt Cookie für 30 Tage */}
          <ReferralClickTracker />
        </ThemeProvider>
      </body>
    </html>
  );
}

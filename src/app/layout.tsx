import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, IBM_Plex_Sans, Geist_Mono } from 'next/font/google';
import { CookieBanner } from '@/components/layout/cookie-banner';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  display: 'swap',
});

const ibmPlex = IBM_Plex_Sans({
  variable: '--font-ibm-plex',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
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
      className={`${bricolage.variable} ${ibmPlex.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
        >
          Zum Inhalt springen
        </a>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}

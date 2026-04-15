import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import { CookieBanner } from '@/components/layout/cookie-banner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
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
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}

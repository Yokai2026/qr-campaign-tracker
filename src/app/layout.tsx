import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
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

export const metadata: Metadata = {
  title: {
    default: 'Spurig — QR-Code Kampagnen-Tracking',
    template: '%s — Spurig',
  },
  description: 'Tracke deine Offline-Kampagnen mit QR-Codes. Scans, Besucher, Geräte und Standorte — datenschutzkonform und ohne Drittanbieter.',
  metadataBase: new URL('https://spurig.com'),
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'Spurig',
    title: 'Spurig — QR-Code Kampagnen-Tracking',
    description: 'Tracke deine Offline-Kampagnen mit QR-Codes. Scans, Besucher, Geräte und Standorte — datenschutzkonform und ohne Drittanbieter.',
    url: 'https://spurig.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spurig — QR-Code Kampagnen-Tracking',
    description: 'Tracke deine Offline-Kampagnen mit QR-Codes. Datenschutzkonform, ohne Drittanbieter.',
  },
  robots: {
    index: true,
    follow: true,
  },
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}

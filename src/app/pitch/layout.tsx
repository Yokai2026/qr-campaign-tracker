import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Spurig — Pitch Deck',
  robots: { index: false, follow: false },
};

export default function PitchLayout({ children }: { children: React.ReactNode }) {
  return children;
}

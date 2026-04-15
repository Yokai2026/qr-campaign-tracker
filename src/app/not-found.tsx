import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: '404 — Seite nicht gefunden',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-20 text-center">
      <Link href="/" className="mb-10 flex items-center gap-2.5">
        <span
          aria-hidden
          className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-ink text-ink-foreground"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <path d="M14 14h3v3h-3z" />
            <path d="M20 14v7" />
            <path d="M14 20h7" />
          </svg>
        </span>
        <span className="text-[14px] font-semibold tracking-[-0.01em]">Spurig</span>
      </Link>

      <p className="tabular text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Fehler 404
      </p>
      <h1 className="mt-4 text-balance text-[36px] font-semibold leading-[1.05] tracking-[-0.025em] sm:text-[48px]">
        Diese Seite existiert nicht.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
        Vielleicht wurde sie verschoben, oder der Link ist veraltet. Du kommst
        jederzeit zurück zur Startseite oder ins Dashboard.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Button render={<Link href="/" />} size="lg" className="min-w-[180px]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Zur Startseite
        </Button>
        <Button
          variant="ghost"
          render={<Link href="/dashboard" />}
          size="lg"
          className="text-muted-foreground hover:text-foreground"
        >
          Zum Dashboard
        </Button>
      </div>
    </div>
  );
}

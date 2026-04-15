import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          aria-label="Spurig — Startseite"
        >
          <span
            aria-hidden
            className="relative flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-ink text-ink-foreground shadow-sm transition-transform group-hover:scale-[1.04]"
          >
            {/* Minimal scan-square mark */}
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

        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="Hauptnavigation"
        >
          <Link
            href="#features"
            className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="#dsgvo"
            className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Datenschutz
          </Link>
          <Link
            href="#so-funktioniert"
            className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            So funktioniert&apos;s
          </Link>
          <Link
            href="/pricing"
            className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Preise
          </Link>
        </nav>

        <div className="flex items-center gap-1.5">
          {/* Hide "Anmelden" below 360px to prevent header overflow on iPhone SE 1 / iPhone 5 */}
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/login" />}
            className="hidden text-[13px] min-[360px]:inline-flex"
          >
            Anmelden
          </Button>
          <Button
            size="sm"
            render={<Link href="/signup" />}
            className="group text-[13px] shadow-sm"
          >
            Kostenlos testen
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
          </Button>
        </div>
      </div>
    </header>
  );
}

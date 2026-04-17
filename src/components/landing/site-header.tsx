import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center px-4 py-3 sm:px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5"
            aria-label="Spurig — Startseite"
          >
            <span
              aria-hidden
              className="relative flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-ink text-ink-foreground shadow-sm transition-transform group-hover:scale-[1.04]"
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
            <span className="font-heading text-[14px] font-semibold tracking-[-0.01em]">Spurig</span>
          </Link>

          <nav
            className="hidden items-center gap-6 md:flex"
            aria-label="Hauptnavigation"
          >
            {[
              { href: '#features', label: 'Features' },
              { href: '#dsgvo', label: 'Datenschutz' },
              { href: '#so-funktioniert', label: "So funktioniert's" },
              { href: '/pricing', label: 'Preise' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-brand transition-transform duration-200 ease-out group-hover:scale-x-100"
                />
              </Link>
            ))}
          </nav>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Hide "Anmelden" below 360px to prevent header overflow on iPhone SE 1 / iPhone 5 */}
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/login" />}
            className="hidden min-[360px]:inline-flex"
          >
            Anmelden
          </Button>
          <Button
            size="sm"
            variant="brand"
            render={<Link href="/signup" />}
            className="group"
          >
            Kostenlos testen
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
          </Button>
        </div>
      </div>
    </header>
  );
}

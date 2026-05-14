import Link from 'next/link';
import Image from 'next/image';

const COLUMNS = [
  {
    heading: 'Produkt',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Datenschutz', href: '#dsgvo' },
      { label: 'Preise', href: '/pricing' },
      { label: 'So funktioniert\'s', href: '#so-funktioniert' },
    ],
  },
  {
    heading: 'Konto',
    links: [
      { label: 'Anmelden', href: '/login' },
      { label: 'Registrieren', href: '/signup' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    heading: 'Rechtliches',
    links: [
      { label: 'Impressum', href: '/impressum' },
      { label: 'Datenschutz', href: '/datenschutz' },
      { label: 'AGB', href: '/agb' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/spurig-icon.png"
                alt=""
                width={32}
                height={32}
                className="h-7 w-7 transition-transform group-hover:scale-[1.06]"
              />
              <span className="font-heading text-[15px] font-semibold tracking-[-0.01em]">
                Spurig
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              QR-Code-Tracking aus Deutschland. Ohne Drittanbieter, ohne Cookies — ganz bei dir.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-[pulseDot_1.6s_ease-in-out_infinite] rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Alle Systeme funktional
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Spurig. Alle Rechte vorbehalten. Hosting in der EU.
            Zahlungen sicher über Stripe.
          </p>
          <p className="text-[12px] text-muted-foreground">
            Gebaut mit Ruhe in Deutschland.
          </p>
        </div>
      </div>
    </footer>
  );
}

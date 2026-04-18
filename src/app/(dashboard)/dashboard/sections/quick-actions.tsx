import Link from 'next/link';
import { Megaphone, MapPin, QrCode, Link2 } from 'lucide-react';

const ACTIONS = [
  {
    href: '/campaigns/new',
    label: 'Neue Kampagne',
    icon: Megaphone,
    desc: 'Projekt bündeln',
  },
  {
    href: '/qr-codes/new',
    label: 'Neuer QR-Code',
    icon: QrCode,
    desc: 'Zum Ausdrucken',
  },
  {
    href: '/links/new',
    label: 'Neuer Kurzlink',
    icon: Link2,
    desc: 'Für Social & Mail',
  },
  {
    href: '/locations/new',
    label: 'Neuer Standort',
    icon: MapPin,
    desc: 'Ort hinzufügen',
  },
] as const;

export function QuickActions() {
  return (
    <section aria-label="Schnellzugriff" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {ACTIONS.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand/[0.03] hover:shadow-[var(--shadow-sm)]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
              <Icon className="h-4 w-4" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold transition-colors group-hover:text-brand">
                {a.label}
              </div>
              <div className="truncate text-[11.5px] text-muted-foreground">{a.desc}</div>
            </div>
          </Link>
        );
      })}
    </section>
  );
}

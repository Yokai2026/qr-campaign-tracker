import {
  UtensilsCrossed,
  CalendarDays,
  Printer,
  Store,
  Home,
  Wrench,
} from 'lucide-react';

const SECTORS = [
  { icon: UtensilsCrossed, label: 'Gastronomie' },
  { icon: Store, label: 'Einzelhandel' },
  { icon: CalendarDays, label: 'Events & Messen' },
  { icon: Printer, label: 'Print & Agentur' },
  { icon: Home, label: 'Immobilien' },
  { icon: Wrench, label: 'Handwerk' },
];

export function SectorStrip() {
  return (
    <section
      aria-label="Anwendungsbereiche"
      className="relative border-y border-border bg-subtle py-10 sm:py-12"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Geeignet für
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-7 gap-y-4 sm:gap-x-10">
          {SECTORS.map((s) => {
            const Icon = s.icon;
            return (
              <li
                key={s.label}
                className="group inline-flex items-center gap-2 text-[13.5px] font-medium text-foreground/70 transition-colors hover:text-foreground sm:text-[14px]"
              >
                <Icon
                  className="h-4 w-4 text-muted-foreground/80 transition-colors group-hover:text-brand"
                  aria-hidden
                />
                {s.label}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

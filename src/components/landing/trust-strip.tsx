import { MapPin, Heart, Cookie, Building2 } from 'lucide-react';

const SIGNALS = [
  {
    label: 'Made in Germany',
    value: '🇩🇪',
    note: 'Entwickelt in Deutschland, deutscher Support.',
    icon: Building2,
  },
  {
    label: 'Server-Standort',
    value: 'Frankfurt',
    note: 'Supabase EU, Hetzner Falkenstein.',
    icon: MapPin,
  },
  {
    label: 'Finanziert durch',
    value: 'Kunden',
    note: 'Bootstrapped, kein VC, keine Investoren.',
    icon: Heart,
  },
  {
    label: 'Cookie-Banner',
    value: '0',
    note: 'Tracking ohne Cookies — kein Banner nötig.',
    icon: Cookie,
  },
];

export function TrustStrip() {
  return (
    <section
      aria-labelledby="trust-heading"
      className="relative overflow-hidden border-t border-border bg-background py-24 sm:py-32"
    >
      {/* Soft warm/brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 50% 60% at 20% 30%, oklch(0.64 0.10 185 / 0.05), transparent 60%), radial-gradient(ellipse 40% 50% at 85% 70%, oklch(0.64 0.10 185 / 0.03), transparent 65%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="trust-heading"
            className="text-balance text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[36px]"
          >
            Unabhängig.{' '}
            <span className="font-normal text-foreground/55 dark:text-foreground/50">
              Aus Prinzip.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
            Spurig wird nicht von Investoren bezahlt — sondern von dir. Gut so:
            so bleibt das Produkt fair und der Datenschutz echt.
          </p>
        </div>

        <ul className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {SIGNALS.map((s) => (
            <li
              key={s.label}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[var(--shadow-md)] sm:p-6"
            >
              {/* Subtle hover-reveal corner glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute -top-12 -right-12 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: 'radial-gradient(circle, var(--brand), transparent 70%)' }}
              />

              <div className="relative flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-all duration-300 group-hover:scale-110 group-hover:bg-brand/10 group-hover:text-brand">
                    <s.icon className="h-4 w-4" />
                  </span>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="mt-1 text-[24px] font-semibold leading-tight tracking-tight text-foreground transition-colors duration-300 group-hover:text-brand sm:text-[26px]">
                    {s.value}
                  </div>
                </div>
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                  {s.note}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

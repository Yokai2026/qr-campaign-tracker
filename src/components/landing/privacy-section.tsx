import { ShieldCheck, EyeOff, Server, Lock } from 'lucide-react';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';
import { SectionHeading } from '@/components/ui/section-heading';

const POINTS = [
  {
    icon: EyeOff,
    title: 'Kein Fingerprinting',
    description:
      'Keine Cookies, kein Cross-Site-Tracking. Nur die Daten, die du wirklich brauchst.',
    badge: 'DSGVO Art. 5',
  },
  {
    icon: Server,
    title: 'EU-Hosting',
    description:
      'Alle Daten bleiben in der EU. Supabase in Frankfurt, Hetzner für E-Mails.',
    badge: 'Art. 32',
  },
  {
    icon: Lock,
    title: 'IP-Anonymisierung',
    description:
      'Letzte Oktette werden genullt. Keine Drittanbieter, kein Google Analytics.',
    badge: 'by design',
  },
];

export function PrivacySection() {
  return (
    <section
      id="dsgvo"
      className="relative overflow-hidden border-y border-border bg-background py-24 sm:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 mask-fade-y bg-dot-grid"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-start gap-12 md:grid-cols-12">
          {/* Left: narrative */}
          <div className="md:col-span-6 lg:col-span-5">
            <SectionEyebrow
              tone="emerald"
              icon={<ShieldCheck className="h-3 w-3" />}
            >
              DSGVO by Design
            </SectionEyebrow>
            <SectionHeading
              as="h2"
              align="left"
              className="mt-5"
              accent={<>Er ist das Fundament.</>}
            >
              Datenschutz ist kein Häkchen —
            </SectionHeading>
            <p className="mt-5 text-[15px] leading-[1.6] text-muted-foreground">
              Die meisten Tracking-Tools senden deine Daten an Google, Facebook
              und ein Dutzend weitere US-Anbieter. Spurig macht das Gegenteil:
              keine Drittanbieter, keine Cookies fürs Tracking, keine
              Auftragsverarbeitung, die du nicht unter Kontrolle hast.
            </p>
            <p className="mt-4 text-[14px] leading-[1.6] text-muted-foreground">
              Perfekt für Agenturen, Vereine, Gastronomie, Handel und jeden,
              der nicht bei jedem Plakat einen Cookie-Banner erklären will.
            </p>

            {/* Quote block */}
            <blockquote className="mt-8 rounded-2xl border-l-2 border-foreground bg-subtle px-5 py-4 text-[14px] leading-relaxed text-foreground">
              <p className="text-[15px] leading-relaxed">
                Unsere Daten bleiben in Frankfurt. Keine US-Provider, kein
                Datenabfluss, keine Überraschungen beim DSFA.
              </p>
              <footer className="mt-2 text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                So einfach ist das.
              </footer>
            </blockquote>
          </div>

          {/* Right: stacked privacy cards */}
          <div className="md:col-span-6 lg:col-span-6 lg:col-start-7">
            <ul className="space-y-3">
              {POINTS.map((p) => {
                const Icon = p.icon;
                return (
                  <li
                    key={p.title}
                    className="card-lift group relative flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-[15px] font-semibold tracking-tight">
                          {p.title}
                        </h3>
                        <span className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.06] px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          {p.badge}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                        {p.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* EU hosting card */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-subtle p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-[14px] font-semibold tracking-wider text-foreground shadow-[var(--shadow-xs)]">
                  EU
                </div>
                <div>
                  <div className="text-[13px] font-semibold">
                    Rechenzentren in der EU
                  </div>
                  <p className="text-[12px] text-muted-foreground">
                    Supabase in Frankfurt · Hetzner in Falkenstein ·
                    Zahlungen über Stripe (EU-Konto)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

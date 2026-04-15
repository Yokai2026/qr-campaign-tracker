import { PencilRuler, Printer, LineChart } from 'lucide-react';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';
import { SectionHeading } from '@/components/ui/section-heading';

const STEPS = [
  {
    number: '01',
    icon: PencilRuler,
    title: 'Kampagne anlegen',
    description:
      'Name, Zielseite, Start- und Enddatum. In 30 Sekunden fertig — kein Onboarding, kein Setup-Assistent.',
    detail: 'spurig.com/kampagnen/neu',
  },
  {
    number: '02',
    icon: Printer,
    title: 'QR-Codes drucken',
    description:
      'Pro Platzierung ein eindeutiger Code. SVG für Plakat und Flyer, PNG für Digital und Social.',
    detail: '12 Codes · 4 Varianten',
  },
  {
    number: '03',
    icon: LineChart,
    title: 'Daten auswerten',
    description:
      'Scans laufen live ins Dashboard. Filter nach Kampagne, Ort, Gerät und Zeitraum — Export jederzeit.',
    detail: 'Live · letzter Scan vor 12 s',
  },
];

export function StepsSection() {
  return (
    <section
      id="so-funktioniert"
      className="relative overflow-hidden border-y border-border bg-cream py-20 sm:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 mask-fade-y"
      >
        <svg width="100%" height="100%" className="h-full w-full">
          <defs>
            <pattern
              id="step-grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="oklch(0.50 0.01 285 / 0.06)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#step-grid)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow tone="primary">In drei Schritten</SectionEyebrow>
          <SectionHeading
            as="h2"
            className="mt-4"
            accent={<>— an einem Nachmittag.</>}
          >
            Vom Plakat zur Auswertung
          </SectionHeading>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
            Kein Wochenende für Excel. Kein Agentur-Ticket. Du klickst dich
            durch, druckst, hängst auf — und siehst live, was ankommt.
          </p>
        </div>

        <ol className="mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.number} className="relative">
                {/* Connector */}
                {i < STEPS.length - 1 && (
                  <div
                    aria-hidden
                    className="absolute left-full top-16 hidden h-px w-5 -translate-x-2.5 bg-gradient-to-r from-border to-transparent md:block"
                  />
                )}
                <article className="card-lift group relative flex h-full flex-col gap-5 rounded-2xl border border-border bg-background/90 p-6 shadow-sm backdrop-blur sm:p-7">
                  <header className="flex items-start justify-between">
                    <span className="font-display text-[58px] font-normal italic leading-none tracking-[-0.03em] text-primary/80">
                      {step.number}
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-primary transition-colors group-hover:border-primary/30 group-hover:bg-primary/5">
                      <Icon className="h-4 w-4" />
                    </span>
                  </header>
                  <div>
                    <h3 className="text-[17px] font-semibold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  <div className="mt-auto border-t border-dashed border-border pt-4">
                    <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                      {step.detail}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

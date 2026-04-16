import { PencilRuler, Printer, LineChart } from 'lucide-react';
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
      className="relative overflow-hidden border-y border-border bg-subtle py-20 sm:py-28"
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
                stroke="oklch(0 0 0 / 0.06)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#step-grid)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <SectionHeading
            as="h2"
            align="left"
            className="mt-0"
          >
            Vom Plakat zur Auswertung
          </SectionHeading>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
            Kein Wochenende für Excel. Kein Agentur-Ticket. Du klickst dich
            durch, druckst, hängst auf — und siehst live, was ankommt.
          </p>
        </div>

        <ol className="mt-14 space-y-0 divide-y divide-border">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.number} className="grid items-start gap-4 py-10 md:grid-cols-[100px_1fr_240px]">
                <span className="tabular-nums font-mono text-[64px] font-light leading-none tracking-[-0.04em] text-foreground/15">
                  {step.number}
                </span>
                <div>
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-brand" />
                    <h3 className="font-heading text-[20px] font-semibold tracking-tight">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground md:justify-end md:pt-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand/60" />
                  {step.detail}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

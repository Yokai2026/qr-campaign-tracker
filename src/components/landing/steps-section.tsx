import { PencilRuler, Printer, LineChart } from 'lucide-react';
import { SectionHeading } from '@/components/ui/section-heading';

const STEPS = [
  {
    number: '01',
    icon: PencilRuler,
    title: 'Kampagne anlegen',
    description: 'Name, Ziel-URL, Datum. In 30 Sekunden fertig.',
    detail: '~30 Sekunden',
  },
  {
    number: '02',
    icon: Printer,
    title: 'QR-Codes drucken',
    description: 'Eindeutiger Code pro Platzierung. SVG fürs Plakat, PNG fürs Digitale.',
    detail: 'SVG · PNG',
  },
  {
    number: '03',
    icon: LineChart,
    title: 'Live auswerten',
    description: 'Scans laufen live ins Dashboard. Filter, Vergleiche, Export.',
    detail: 'Realtime',
  },
];

export function StepsSection() {
  return (
    <section
      id="so-funktioniert"
      className="relative overflow-hidden border-y border-border bg-subtle py-24 sm:py-32"
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
          <p className="mt-5 text-[16px] leading-relaxed text-muted-foreground sm:text-[17px]">
            Drei Schritte. Kein Wochenende für Excel.
          </p>
        </div>

        <ol className="mt-14 space-y-0 divide-y divide-border">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li
                key={step.number}
                className="group grid items-start gap-4 py-10 transition-all duration-300 md:grid-cols-[100px_1fr_240px]"
              >
                <span className="tabular-nums font-mono text-[64px] font-light leading-none tracking-[-0.04em] text-foreground/15 transition-colors duration-300 group-hover:text-brand/50">
                  {step.number}
                </span>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand transition-all duration-300 group-hover:scale-110 group-hover:bg-brand/15">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="font-heading text-[20px] font-semibold tracking-tight">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground md:justify-end md:pt-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-brand opacity-0 transition-opacity duration-300 group-hover:opacity-60 group-hover:animate-[pulseDot_1.4s_ease-in-out_infinite]" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand/60" />
                  </span>
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

import Link from 'next/link';
import { ChevronDown, HelpCircle, Mail } from 'lucide-react';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';
import { SectionHeading } from '@/components/ui/section-heading';

export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'Wie funktioniert das Tracking ohne Cookies?',
    a: 'Wir setzen keine Tracking-Cookies und nutzen kein Browser-Fingerprinting. Jeder Scan wird mit einer anonymisierten IP-Variante (letzte Oktette genullt) und einem täglich rotierenden Salt-Hash gezählt — so erkennen wir Unique-Visitors, ohne einzelne Personen identifizierbar zu machen.',
  },
  {
    q: 'Ist Spurig wirklich DSGVO-konform?',
    a: 'Ja. Das Tracking ist Privacy-by-Design nach Art. 25 DSGVO aufgebaut: keine Drittanbieter, keine Datenweitergabe, Hosting ausschließlich in der EU (Frankfurt). Für dein Verzeichnis von Verarbeitungstätigkeiten bekommst du die nötigen Unterlagen — inklusive AV-Vertrag.',
  },
  {
    q: 'Kann ich unbegrenzt viele QR-Codes erstellen?',
    a: 'Ja. Im Plan sind unbegrenzte Kampagnen, QR-Codes und Scans enthalten — keine Nutzerpakete, keine Volumen-Staffel. Auch der Export (CSV, PDF, API) hat keine Obergrenze.',
  },
  {
    q: 'Was passiert nach den 14 Tagen Trial?',
    a: 'Wenn du während der Trial nichts tust, schläft dein Account ein — keine automatische Abbuchung. Erst wenn du aktiv „Weiter“ klickst, wird der Plan (5,99 € monatlich oder 4,99 € bei Jahresbuchung) aktiviert. Keine Kreditkarte im Voraus.',
  },
  {
    q: 'Kann ich jederzeit kündigen?',
    a: 'Ja. Monatlich gebuchte Pläne kannst du zum Monatsende kündigen, Jahrespläne zum Laufzeitende. Keine Mindestlaufzeit, keine versteckten Klauseln — ein Klick im Dashboard genügt.',
  },
  {
    q: 'Brauche ich eine eigene Domain?',
    a: 'Nein. Jeder QR-Code bekommt standardmäßig eine spurig-Kurz-URL. Für stärkeres Branding kannst du deine eigene Domain anschließen (z. B. kurz.deinefirma.de) — einfach CNAME setzen, fertig.',
  },
  {
    q: 'Welche Zahlungsmethoden werden unterstützt?',
    a: 'Abgerechnet wird sicher über Stripe: SEPA-Lastschrift, Kreditkarte, Apple Pay und Google Pay. Rechnungen mit korrekter USt.-ID bekommst du automatisch per E-Mail.',
  },
  {
    q: 'Kann ich meine Daten jederzeit exportieren?',
    a: 'Ja. CSV, PDF und API stehen jederzeit zur Verfügung — für einzelne Kampagnen oder gesamthaft. Deine Daten gehören dir, nicht uns.',
  },
];

export function FaqSection() {
  return (
    <section
      id="faq"
      className="relative border-t border-border bg-background py-20 sm:py-28"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow tone="muted" icon={<HelpCircle className="h-3 w-3" />}>
            Häufige Fragen
          </SectionEyebrow>
          <SectionHeading
            as="h2"
            className="mt-4"
            accent={<>solltest du wissen.</>}
          >
            Alles, was du
          </SectionHeading>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
            Kein Kleingedrucktes, keine Überraschungen. Hier stehen die Antworten
            auf die Fragen, die uns im Trial am häufigsten erreichen.
          </p>
        </div>

        <dl className="mx-auto mt-14 max-w-3xl divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={item.q}
              className="group"
              // First item open by default — reduces bounce, surfaces key objection
              open={i === 0}
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 px-6 py-5 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none sm:px-7 sm:py-6">
                <dt className="flex items-start gap-3 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-foreground sm:text-[16px]">
                  <span
                    aria-hidden
                    className="mt-0.5 font-mono text-[11px] font-semibold tabular text-muted-foreground/70"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {item.q}
                </dt>
                <span
                  aria-hidden
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-all group-open:rotate-180 group-open:border-primary/30 group-open:bg-primary/5 group-open:text-primary"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
              </summary>
              <dd className="border-t border-dashed border-border/70 bg-muted/20 px-6 pb-6 pt-5 text-[14px] leading-[1.65] text-muted-foreground sm:px-7 sm:pl-[3.5rem] sm:text-[14.5px]">
                {item.a}
              </dd>
            </details>
          ))}
        </dl>

        <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-between gap-4 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-5 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-[14px] font-semibold tracking-tight text-foreground">
              <span className="font-display font-normal italic">
                Deine Frage nicht dabei?
              </span>
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Schreib uns kurz — wir antworten persönlich, meist innerhalb weniger
              Stunden.
            </p>
          </div>
          <Link
            href="mailto:info@spurig.com"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-[13px] font-medium text-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
          >
            <Mail className="h-3.5 w-3.5" />
            info@spurig.com
          </Link>
        </div>
      </div>
    </section>
  );
}

import { CheckSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { PrintButton } from './print-button';

export const metadata: Metadata = {
  title: 'DSGVO-Checkliste Marketing-Tracking 2026 — Spurig',
  description:
    '14 konkrete Pruef-Punkte fuer dein Marketing-Tracking-Setup unter DSGVO 2026. Schrems II, US-Cloud, AVV, Cookie-Banner.',
  robots: { index: false, follow: false }, // Nicht indexieren, nur via Email-Link erreichbar
};

const SECTIONS = [
  {
    title: '1. US-Cloud-Anbieter im Tracking-Stack',
    items: [
      'Nutzt dein Team Bitly, Rebrandly, Short.io oder Google Analytics direkt?',
      'Wurde nach Schrems II eine Datenschutz-Folgenabschaetzung durchgefuehrt?',
      'Sind Standardvertragsklauseln (SCCs) durch Transfer-Impact-Assessment ergaenzt?',
      'Ist der CLOUD-Act-Effekt schriftlich dokumentiert?',
    ],
  },
  {
    title: '2. Auftragsverarbeitungsvertraege (AVV)',
    items: [
      'AVV mit jedem Tracking-Dienst abgeschlossen?',
      'AVV-Liste in deinem Verzeichnis der Verarbeitungstaetigkeiten (VVT)?',
      'AVV-Datum + Version dokumentiert (bei Audit pruefungsrelevant)?',
    ],
  },
  {
    title: '3. Cookie-Banner-Pflicht',
    items: [
      'Setzt dein Tracker Cookies? Falls ja: ist ein TTDSG-konformer Banner aktiv?',
      'Granular waehlbar (Accept / Reject / Selektion) — kein Dark-Pattern?',
      'Reject-Klick gleich prominent wie Accept-Klick?',
      'Tracking startet wirklich erst nach Opt-in (technische Pruefung)?',
    ],
  },
  {
    title: '4. Datenminimierung',
    items: [
      'IP-Adressen anonymisiert (mind. letzte 2 Oktette null)?',
      'Verarbeitest du Personen-Identifikatoren wirklich noch?',
      'Geo-Daten auf Stadt-/Land-Ebene begrenzt, nicht GPS-genau?',
      'Tracking-Daten haben definierte Loeschfristen?',
    ],
  },
  {
    title: '5. Aufsichtsbehoerden-Lage 2026',
    items: [
      'Aktuelle Stellungnahmen der Aufsichtsbehoerde deines Bundeslandes gelesen?',
      'Bist du in einer Branche mit erhoehter Pruefungsfrequenz (Finanz, Gesundheit, Marketing)?',
      'Hast du einen Datenschutzbeauftragten bei > 20 Mitarbeitern?',
    ],
  },
];

export default function DsgvoChecklistDownloadPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="text-[14px] font-semibold">
            Spurig
          </Link>
          <PrintButton />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 print:max-w-none print:px-0 print:py-4">
        <div className="mb-6 print:hidden">
          <Link href="/" className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Zurueck zur Startseite
          </Link>
        </div>

        <article className="prose prose-neutral max-w-none dark:prose-invert print:dark:prose">
          <h1 className="font-heading text-[32px] font-semibold tracking-tight sm:text-[40px]">
            DSGVO-Checkliste Marketing-Tracking 2026
          </h1>
          <p className="mt-2 text-[14.5px] text-muted-foreground">
            14 konkrete Pruef-Punkte fuer dein Marketing-Tracking-Setup unter aktueller DSGVO-Rechtsprechung.
            Stand: Mai 2026.
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground/70">
            Erstellt von Spurig (https://spurig.com) — DSGVO-konformes QR- und Kurzlink-Tracking aus Deutschland.
          </p>

          <hr className="my-6 border-border" />

          <p className="text-[14px] leading-relaxed text-muted-foreground">
            <strong>Wie du die Checkliste nutzt:</strong> geh die 5 Bereiche durch. Pro Item: gruener Haken = passt,
            rotes Kreuz = handeln. Wenn mehr als 3 Items NICHT abgehakt sind, hast du Kompliance-Schulden.
          </p>

          {SECTIONS.map((section) => (
            <section key={section.title} className="mt-8">
              <h2 className="font-heading text-[20px] font-semibold tracking-tight">{section.title}</h2>
              <ul className="mt-3 space-y-2.5 print:space-y-1.5">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                    <span className="text-[14px] leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <hr className="my-8 border-border" />

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 print:bg-transparent print:border-border">
            <h3 className="font-heading text-[18px] font-semibold tracking-tight">
              Brauchst du Hilfe bei Punkt 1-4?
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed">
              Spurig setzt all das technisch um: EU-Hosting in Frankfurt, kein US-Cloud, kein Cookie-Banner,
              AVV inklusive, IP-Anonymisierung Default-an. Du tauschst nur die Bitly-Links gegen Spurig-Links
              und der DSGVO-Stress ist weg.
            </p>
            <a
              href="https://spurig.com/?utm_source=lead_magnet&utm_medium=email&utm_campaign=dsgvo-checkliste-2026"
              className="mt-3 inline-flex items-center rounded-lg bg-cyan-500 px-4 py-2 text-[13.5px] font-semibold text-cyan-950 no-underline"
            >
              Spurig 14 Tage gratis testen →
            </a>
          </div>

          <p className="mt-8 text-[11px] text-muted-foreground/70">
            <strong>Disclaimer:</strong> Diese Checkliste ist keine Rechtsberatung. Wir geben Orientierung
            basierend auf aktueller Aufsichtsbehoerden-Praxis. Bei konkreten rechtlichen Fragen einen Datenschutzanwalt einbeziehen.
          </p>
        </article>
      </main>
    </div>
  );
}

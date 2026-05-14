import Link from 'next/link';
import {
  Printer,
  TrendingUp,
  MapPin,
  BarChart3,
  Check,
  ArrowRight,
  Calendar,
  Layers,
} from 'lucide-react';
import { SiteHeader } from '@/components/landing/site-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { FinalCTA } from '@/components/landing/final-cta';
import { Button } from '@/components/ui/button';
import { GridBackdrop } from '@/components/ui/grid-backdrop';
import { StructuredData, softwareApplicationLd, faqPageLd } from '@/components/seo/structured-data';

export const metadata = {
  title: 'QR-Code-Tracking für Plakate & Flyer · Spurig',
  description:
    'Welcher Plakatstandort bringt wirklich Scans? Spurig macht Print-Werbung messbar — pro Standort, pro Variante, pro Auflage. DSGVO-konform, ab 8,99 €/Monat.',
  alternates: { canonical: '/qr-code-print-tracking' },
  openGraph: {
    title: 'QR-Code-Tracking für Print-Kampagnen · Spurig',
    description:
      'Plakat-, Flyer- und Anzeigen-Performance pro Standort messen. Endlich Daten für Print-Budget-Entscheidungen.',
    url: 'https://spurig.com/qr-code-print-tracking',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Spurig — QR-Code-Tracking für Print-Kampagnen' }],
  },
};

const SCENARIOS = [
  {
    icon: MapPin,
    title: 'Plakat-Standorte vergleichen',
    body:
      'Jeder Standort bekommt einen eigenen QR-Code. Du siehst sofort: Plakat an der U-Bahn-Station bringt 124 Scans, das in der Fußgängerzone nur 18. Beim nächsten Buchen weißt du worauf du Budget setzt.',
    metric: 'U-Bahn 124 vs. FuZo 18 Scans',
  },
  {
    icon: Layers,
    title: 'A/B-Test bei Flyer-Varianten',
    body:
      'Zwei Flyer-Designs gleichzeitig drucken — jedes mit eigenem QR-Code. Nach einer Woche siehst du welche Headline, welches Bild, welche CTA funktioniert. Schluss mit „Bauchgefühl"-Designentscheidungen.',
    metric: 'Variante A: 4,2 % CR · Variante B: 7,8 %',
  },
  {
    icon: Calendar,
    title: 'Print-Frische tracken',
    body:
      'Wann verblasst die Wirkung deiner Print-Kampagne? Mit Scan-Verlauf siehst du: Tag 1-14 läuft, ab Tag 21 fällt es auf null. Beim nächsten Mal druckst du nicht mehr 30 Tage, sondern stellst rechtzeitig nach.',
    metric: 'Peak Tag 3-9, Abfall ab Tag 18',
  },
  {
    icon: BarChart3,
    title: 'Pro Anzeige tracken in Magazinen',
    body:
      'Zeitschriften-Anzeige in Magazin A vs. Magazin B vs. Magazin C — jeweils eigener QR-Code. Nach Erscheinen weißt du objektiv welches Medium dein Geld wert war. Endlich Konversion statt Reichweiten-Schätzung.',
    metric: 'Magazin A: 47 · B: 91 · C: 12',
  },
];

const PRINT_CHECKLIST = [
  {
    title: 'Mindestgröße einhalten',
    body: '3 × 3 cm auf Flyer, 5 × 5 cm auf Plakaten. Auf großen Plakaten (DIN A0+) lieber 8 × 8 cm — sonst scannt aus 2 m Entfernung keiner.',
  },
  {
    title: 'Hoher Kontrast wählen',
    body: 'Schwarz auf Weiß ist immer noch am sichersten. Markenfarbe nur im Punkt-Layer verwenden, Hintergrund weiß lassen. Heller Code auf dunklem Grund funktioniert oft nicht.',
  },
  {
    title: 'Quiet Zone respektieren',
    body: 'Mindestens 4 Module Weißraum drumherum — sonst erkennt der Scanner den Code-Rand nicht. Niemals Text oder Bilder direkt anschließen.',
  },
  {
    title: 'CTA neben den Code',
    body: '„Scan für 20 % Rabatt-Code" oder „Mehr unter…" — der Code allein motiviert keinen. Mit konkretem Nutzen daneben verdreifachst du die Scan-Rate.',
  },
  {
    title: 'SVG für Print, PNG für Digital',
    body: 'SVG ist verlustfrei skalierbar — die Druckerei kann ihn beliebig groß ziehen. PNG nur für Web/Mail. Beide Formate liefert Spurig per Klick.',
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Wie viele QR-Codes brauche ich für eine Plakatkampagne?',
    a: 'Mindestens einen pro Standort oder Plakatvariante — sonst kannst du nicht unterscheiden welcher Standort funktioniert. Eine Kampagne mit 12 Plakatstandorten = 12 Codes. Spurig erlaubt unbegrenzte Codes, die Anzahl kostet dich nichts extra.',
  },
  {
    q: 'Funktioniert das auch bei Außenwerbung wie City-Light-Postern?',
    a: 'Ja. Wichtig ist Code-Größe (mindestens 5 × 5 cm) und gute Beleuchtung. City-Light-Poster sind ideal weil sie auch abends gut sichtbar bleiben. Bei Plakaten ohne Beleuchtung lieber tagsüber besonders aufmerksame Standorte (Bushaltestelle, Wartezone) wählen.',
  },
  {
    q: 'Was wenn die Plakate schon gedruckt sind — kann ich nachträglich tracken?',
    a: 'Wenn der QR-Code auf eine URL zeigt die du kontrollierst, kannst du diese URL durch eine Spurig-Kurz-URL ersetzen (z. B. via Server-Redirect). Bei bereits gedruckten statischen Codes geht das nicht — daher: beim nächsten Mal von Anfang an dynamische Spurig-Codes verwenden.',
  },
  {
    q: 'Wie schnell sehe ich erste Scans nach Aushang?',
    a: 'Im Live-Dashboard innerhalb von 60 Sekunden nach dem ersten Scan. Spurig schreibt Scan-Events in Echtzeit — du siehst sogar Stoßzeiten (8-9 Uhr Berufsverkehr, 17-19 Uhr Feierabend) sobald deine Kampagne läuft.',
  },
  {
    q: 'Kann ich das Ziel des QR-Codes nachträglich ändern?',
    a: 'Ja. Spurig nutzt dynamische QR-Codes — der gedruckte Code zeigt auf spurig.com/r/abc, dahinter änderst du die Ziel-URL beliebig oft. Plakat hängt 4 Wochen und du wechselst nach 2 Wochen von Landing-Page A auf B? Kein Problem, ein Klick.',
  },
  {
    q: 'Wie messe ich Conversions, nicht nur Scans?',
    a: 'Auf der Ziel-URL kannst du ein Conversion-Pixel oder Event-Tracking platzieren. Spurig erkennt Scan + UTM-Parameter, deine Ziel-Seite misst dann ob aus dem Scan auch Anmeldung/Kauf wurde. Conversion-Rate pro Plakatstandort = der eigentlich wichtige KPI.',
  },
];

export default function PrintTrackingPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData id="ld-software-application" data={softwareApplicationLd} />
      <StructuredData id="ld-faq-page" data={faqPageLd(FAQ)} />
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <GridBackdrop variant="dots" className="h-[440px] opacity-30" fade />
          <div className="relative mx-auto max-w-5xl px-4 pt-16 pb-12 sm:px-6 sm:pt-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <Printer className="h-3 w-3 text-brand" />
              QR-Code-Tracking für Print
            </div>
            <h1 className="mt-5 max-w-3xl font-heading text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] sm:text-[56px]">
              Welches Plakat war{' '}
              <span className="text-muted-foreground/80 font-normal">sein Geld wert?</span>
            </h1>
            <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-muted-foreground">
              Spurig macht Plakate, Flyer und Print-Anzeigen messbar.
              Pro Standort einen QR-Code, pro Variante ein eigenes Tracking — danach weißt du
              objektiv welches Budget sich gerechnet hat und welches in den Papierkorb ging.
            </p>

            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Button
                variant="brand"
                size="lg"
                render={<Link href="/signup" />}
                className="group min-w-[220px]"
              >
                14 Tage gratis testen
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Link
                href="/pricing"
                className="text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Preise ansehen →
              </Link>
            </div>

            <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-muted-foreground">
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-3 w-3 text-brand" />
                Unbegrenzte Codes pro Kampagne
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-3 w-3 text-brand" />
                SVG für Druckerei + PNG
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-3 w-3 text-brand" />
                Ziel-URL nachträglich änderbar
              </li>
            </ul>
          </div>
        </section>

        {/* 4 Szenarien */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <h2 className="font-heading text-[26px] font-semibold tracking-tight mb-2">
            Vier Wege wie du Print messbar machst
          </h2>
          <p className="text-[14px] text-muted-foreground mb-8 max-w-2xl">
            Jeder Standort, jede Variante, jeder Auflage-Tag bekommt sein eigenes Dashboard.
            Nach 7 Tagen weißt du objektiv was funktioniert.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {SCENARIOS.map((s) => (
              <article
                key={s.title}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <s.icon className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-[16px] font-semibold tracking-tight">{s.title}</h3>
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">{s.body}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1 text-[11.5px] font-medium tabular-nums">
                  <TrendingUp className="h-3 w-3 text-brand" />
                  {s.metric}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Print-Checkliste */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-10">
            <h2 className="font-heading text-[22px] font-semibold tracking-tight mb-2">
              Print-Checkliste — damit Scan-Raten nicht verbrennen
            </h2>
            <p className="text-[13.5px] text-muted-foreground mb-5">
              80 % aller schlecht gescannten Print-QR-Codes scheitern an einem dieser 5 Punkte.
              Vor dem nächsten Druckauftrag durchgehen.
            </p>
            <ol className="space-y-3">
              {PRINT_CHECKLIST.map((p, i) => (
                <li
                  key={p.title}
                  className="flex items-start gap-4 rounded-xl border border-border/60 bg-background/40 p-4"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[12px] font-semibold text-brand tabular-nums">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-[14px] font-semibold">{p.title}</div>
                    <div className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{p.body}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Cost-of-not-tracking-Box */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <div className="rounded-3xl border border-brand/30 bg-brand/[0.04] p-8 sm:p-10">
            <h2 className="font-heading text-[22px] font-semibold tracking-tight mb-3">
              Was kostet eine ungetrackte Plakatkampagne?
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                  Eine typische lokale Plakatbuchung in einer deutschen Großstadt kostet
                  zwischen 80 und 350 € pro Standort und Woche. Für eine Kampagne mit
                  10 Standorten über 4 Wochen schnell{' '}
                  <span className="font-semibold text-foreground">5.000-12.000 € Budget</span>.
                </p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
                  Ohne Tracking weißt du nie ob die Hälfte davon verbrannt war —
                  in einer Werbeagentur-Studie 2024 brachten 30-40 % der Standorte{' '}
                  <span className="font-semibold text-foreground">weniger als 5 % der Gesamt-Scans</span>.
                </p>
              </div>
              <div className="rounded-xl border border-brand/30 bg-card p-5">
                <div className="text-[11px] uppercase tracking-wide text-brand mb-2">Rechnung</div>
                <table className="w-full text-[13.5px]">
                  <tbody className="divide-y divide-border/60">
                    <tr><td className="py-1.5 text-muted-foreground">Kampagne</td><td className="py-1.5 text-right font-semibold tabular-nums">8.000 €</td></tr>
                    <tr><td className="py-1.5 text-muted-foreground">Davon &bdquo;Müll&ldquo;</td><td className="py-1.5 text-right font-semibold tabular-nums text-red-600 dark:text-red-400">2.400-3.200 €</td></tr>
                    <tr><td className="py-1.5 text-muted-foreground">Spurig (3 Mo)</td><td className="py-1.5 text-right font-semibold tabular-nums text-brand">27 €</td></tr>
                    <tr><td className="pt-3 font-semibold">ROI ab</td><td className="pt-3 text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">~ 1 Tag</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
          <h2 className="font-heading text-[24px] font-semibold tracking-tight mb-6">
            Häufige Fragen zu Print-Tracking
          </h2>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-border bg-card px-4 py-3"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-[14px] font-semibold list-none">
                  {item.q}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <FinalCTA />
      </main>

      <SiteFooter />
    </div>
  );
}

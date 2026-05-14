import Link from 'next/link';
import {
  Coffee,
  UtensilsCrossed,
  Megaphone,
  TrendingUp,
  Check,
  ArrowRight,
  Smartphone,
  Calendar,
} from 'lucide-react';
import { SiteHeader } from '@/components/landing/site-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { FinalCTA } from '@/components/landing/final-cta';
import { Button } from '@/components/ui/button';
import { GridBackdrop } from '@/components/ui/grid-backdrop';
import { StructuredData, softwareApplicationLd, faqPageLd } from '@/components/seo/structured-data';

export const metadata = {
  title: 'QR-Code für Gastronomie — Tisch, Menü, Bewertung tracken · Spurig',
  description:
    'QR-Codes für Cafés und Restaurants: Tischbestellungen, digitale Menüs, Google-Bewertungen und Aktionen messbar machen. DSGVO-konform, ab 8,99 €/Monat.',
  alternates: { canonical: '/qr-code-fuer-gastronomie' },
  openGraph: {
    title: 'QR-Code für Cafés & Restaurants · Spurig',
    description:
      'Messe welcher Tisch wie oft scannt, welche Flyer-Kampagne Gäste bringt, welche Aktion wirklich funktioniert.',
    url: 'https://spurig.com/qr-code-fuer-gastronomie',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Spurig — QR-Codes für Gastronomie' }],
  },
};

const USE_CASES = [
  {
    icon: UtensilsCrossed,
    title: 'Digitale Speisekarte am Tisch',
    body:
      'Pro Tisch ein eigener QR-Code — du siehst wie oft Tisch 7 morgens scannt und ob die Karte überhaupt aufgerufen wird. Erkenne Schwachstellen: niedrige Scan-Rate = Karte zu weit weg oder Code zu klein gedruckt.',
    example: '47 Scans heute · Tisch 3 ist der Topscanner',
  },
  {
    icon: Coffee,
    title: 'Google-Bewertung nach dem Espresso',
    body:
      'QR-Code auf Beleg oder Sticker am Tresen leitet direkt auf deine Google-Bewertungsseite. Statt zu hoffen, dass Gäste googeln: ein Scan, ein Klick, eine Rezension. Tracke welche Filiale die meisten Bewertungen sammelt.',
    example: '12 Scans pro Tag · 2-3 echte Bewertungen daraus',
  },
  {
    icon: Megaphone,
    title: 'Aktions-Flyer messbar machen',
    body:
      '„Happy Hour ab 17 Uhr — scan für 20% Rabatt-Code." Du siehst nicht nur wie oft gescannt wird, sondern auch wann (Wochentag, Uhrzeit). Plötzlich weißt du objektiv welche Aktion welchen Tag funktioniert.',
    example: 'Mi 17-19 Uhr ist Peak — also Personal aufstocken',
  },
  {
    icon: Calendar,
    title: 'Event-Anmeldung per Plakat',
    body:
      'Tasting, Quiz-Abend oder Live-Musik: QR-Code auf Plakat führt zu deinem Buchungs-Tool (OpenTable, Resmio, eigenes Formular). Du siehst welche Plakate (welcher Standort, welche Woche) wirklich Reservierungen bringen.',
    example: 'Plakat U-Bahn-Station: 8 Buchungen · Plakat im Schaufenster: 23',
  },
];

const REAL_NUMBERS = [
  { label: 'Café mit 35 Plätzen', stat: '~190 Scans/Woche', desc: 'aus Tisch-QR-Codes' },
  { label: 'Berliner Mittelstand-Restaurant', stat: '+18 %', desc: 'mehr Google-Reviews in 30 Tagen' },
  { label: 'Streetfood-Foodtruck', stat: '74 % Mobile', desc: 'Geräte-Mix bei Flyer-Scans' },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Wie viele QR-Codes brauche ich für meinen Laden?',
    a: 'Faustregel: ein Code pro Standort × Zweck. Ein 30-Plätze-Café mit 8 Tischen, digitaler Karte, Bewertungs-QR am Tresen und Aktions-Plakat kommt auf ~11 dynamische Codes. Spurig kostet unabhängig davon 8,99 € — du kannst beliebig viele anlegen.',
  },
  {
    q: 'Muss ich auf den QR-Code ein Cookie-Banner setzen?',
    a: 'Nein. Spurig nutzt keine Tracking-Cookies. Der Gast scannt, wird auf die Ziel-URL weitergeleitet, fertig. Was dann passiert (auf deiner Webseite oder bei Google Reviews) hängt von der Ziel-Seite ab, nicht von Spurig.',
  },
  {
    q: 'Kann ich Tisch-Codes nachträglich austauschen?',
    a: 'Ja. Spurig nutzt dynamische QR-Codes — der gedruckte Code bleibt gleich, nur das Ziel ändert sich. Wenn du im Herbst auf die Herbstkarte umstellst, änderst du die Ziel-URL in Spurig und alle Tische zeigen automatisch das neue PDF.',
  },
  {
    q: 'Wie drucke ich die Codes am besten?',
    a: 'Mindestgröße auf Tisch-Aufstellern: 3 × 3 cm. Auf Plakaten: 5 × 5 cm. Hoher Kontrast (schwarz auf weiß, optional Markenfarbe für Punkte). 4 Module Quietzone drumherum. Spurig liefert SVG (skalierbar für Print) und PNG (sofort nutzbar in Word/Canva).',
  },
  {
    q: 'Lohnt sich das überhaupt — meine Gäste sehen doch nur die Karte?',
    a: 'Der Wert ist nicht der QR-Code selbst, sondern die Daten dahinter. Du erkennst: welche Tische / Tage / Aktionen funktionieren, welche nicht. Mit drei Datenpunkten pro Aktion bist du nach 4 Wochen schon weiter als 90 % der lokalen Gastronomen die „nach Gefühl" entscheiden.',
  },
];

export default function GastronomiePage() {
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
              <Coffee className="h-3 w-3 text-brand" />
              QR-Code-Tracking für Gastronomie
            </div>
            <h1 className="mt-5 max-w-3xl font-heading text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] sm:text-[56px]">
              Welcher Tisch scannt deine Karte am häufigsten?
            </h1>
            <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-muted-foreground">
              Spurig macht aus QR-Codes für Cafés, Restaurants und Foodtrucks
              echte Datenpunkte: welche Tische bestellen digital, welche Aktion bringt Gäste,
              welche Flyer-Kampagne war ihr Geld wert. DSGVO-konform und ohne Cookie-Banner.
            </p>

            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Button
                variant="brand"
                size="lg"
                render={<Link href="/signup" />}
                className="group min-w-[220px]"
              >
                14 Tage kostenlos testen
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
                Unbegrenzte QR-Codes
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Smartphone className="h-3 w-3 text-brand" />
                Mobile-First Stats
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-3 w-3 text-brand" />
                Dynamisch (Ziel jederzeit änderbar)
              </li>
            </ul>
          </div>
        </section>

        {/* Use-Cases */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <h2 className="font-heading text-[26px] font-semibold tracking-tight mb-2">
            Vier Wege wie Gastronomen Spurig nutzen
          </h2>
          <p className="text-[14px] text-muted-foreground mb-8 max-w-2xl">
            Jeder Code bekommt ein eigenes Dashboard mit Zeitverlauf, Geräte-Mix und Spitzenzeiten.
            Du siehst sofort was funktioniert — und was du dir sparen kannst.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {USE_CASES.map((u) => (
              <article
                key={u.title}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <u.icon className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-[16px] font-semibold tracking-tight">{u.title}</h3>
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">{u.body}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1 text-[11.5px] font-medium tabular-nums">
                  <TrendingUp className="h-3 w-3 text-brand" />
                  {u.example}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Real numbers */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-10">
            <h2 className="font-heading text-[22px] font-semibold tracking-tight mb-5">
              Realistische Zahlen aus echten Locations
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {REAL_NUMBERS.map((r) => (
                <div
                  key={r.label}
                  className="rounded-xl border border-border/60 bg-background/40 p-4"
                >
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {r.label}
                  </div>
                  <div className="mt-1 text-[28px] font-semibold tabular-nums tracking-tight text-brand">
                    {r.stat}
                  </div>
                  <div className="mt-1 text-[12px] text-muted-foreground">{r.desc}</div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[12px] text-muted-foreground">
              Anonymisierte Aggregat-Werte aus aktiven Spurig-Kunden (Frühjahr 2026).
            </p>
          </div>
        </section>

        {/* Quick-Setup */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <h2 className="font-heading text-[22px] font-semibold tracking-tight mb-5">
            In 10 Minuten startklar
          </h2>
          <ol className="space-y-3">
            {[
              {
                n: '1',
                title: 'Konto anlegen',
                body: 'Mit E-Mail registrieren, 6-stelligen Code bestätigen. 14 Tage volle Funktionalität ohne Karte.',
              },
              {
                n: '2',
                title: 'Kampagne „Q3 2026" erstellen',
                body: 'Ein Bucket pro Saison oder Aktion. Du gruppierst später alle Codes darunter.',
              },
              {
                n: '3',
                title: 'Pro Tisch / Aushang einen QR-Code',
                body: 'Ziel-URL eintragen (Speisekarte-PDF, Google-Review, Bestell-System), Farbe wählen, SVG runterladen.',
              },
              {
                n: '4',
                title: 'Drucken & aufstellen',
                body: '3-5 cm Größe, gute Beleuchtung, Quietzone drumherum. Tipp: Aufkleber-Bogen bei Druckerei XY bestellen.',
              },
              {
                n: '5',
                title: 'Nach 7 Tagen reinschauen',
                body: 'Welcher Tisch / welche Aktion performt? Spurig zeigt dir den Verlauf — jetzt kannst du iterieren statt raten.',
              },
            ].map((s) => (
              <li
                key={s.n}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-4"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[12px] font-semibold text-brand tabular-nums">
                  {s.n}
                </span>
                <div>
                  <div className="text-[14px] font-semibold">{s.title}</div>
                  <div className="mt-1 text-[13px] text-muted-foreground">{s.body}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
          <h2 className="font-heading text-[24px] font-semibold tracking-tight mb-6">
            Häufige Fragen aus der Gastro-Praxis
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

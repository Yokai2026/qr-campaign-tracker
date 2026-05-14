import Link from 'next/link';
import { Check, X, ShieldCheck, Globe, Euro, ArrowRight } from 'lucide-react';
import { SiteHeader } from '@/components/landing/site-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { FinalCTA } from '@/components/landing/final-cta';
import { Button } from '@/components/ui/button';
import { GridBackdrop } from '@/components/ui/grid-backdrop';
import { StructuredData, softwareApplicationLd, faqPageLd } from '@/components/seo/structured-data';

export const metadata = {
  title: 'Bitly Alternative aus Deutschland — DSGVO-konform · Spurig',
  description:
    'Spurig ist die deutsche Bitly-Alternative: EU-Hosting, DSGVO-konform, kein Cookie-Banner, eigene Domain inklusive. Ab 8,99 € statt 35 $/Monat. 14 Tage gratis.',
  alternates: { canonical: '/bitly-alternative' },
  openGraph: {
    title: 'Bitly Alternative — Spurig, DSGVO-konform, ab 8,99 €',
    description:
      'Deutscher Kurzlink- und QR-Code-Tracker mit EU-Hosting, ohne Cookie-Banner und 70 % günstiger als Bitly Growth.',
    url: 'https://spurig.com/bitly-alternative',
  },
};

const COMPARISON = [
  { feature: 'Preis (mit echtem Tracking)', spurig: 'ab 8,99 € / Monat', bitly: 'ab 199 $ / Monat (Growth)' },
  { feature: 'Hosting & Server-Standort', spurig: 'EU (Frankfurt)', bitly: 'USA' },
  { feature: 'DSGVO-konform out-of-the-box', spurig: 'ja, ohne Setup', bitly: 'nein — Schrems-II-Problem' },
  { feature: 'Cookie-Banner nötig?', spurig: 'nein', bitly: 'ja' },
  { feature: 'IP-Anonymisierung', spurig: 'Standard', bitly: 'nur Enterprise' },
  { feature: 'Unbegrenzte QR-Codes & Links', spurig: 'ja', bitly: 'mit Limits pro Plan' },
  { feature: 'Eigene Kurz-Domain', spurig: 'inklusive', bitly: 'erst ab Premium ($499)' },
  { feature: 'Live-Analytics in DE', spurig: 'sofort', bitly: 'erst ab Growth' },
  { feature: 'Deutsche UI & Support', spurig: 'nativ deutsch', bitly: 'nur englisch' },
  { feature: 'API & Workflow-Integration', spurig: 'REST-API + n8n-Templates', bitly: 'REST-API' },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Ist Bitly DSGVO-konform?',
    a: 'Bitly ist ein US-Unternehmen und verarbeitet Daten in den USA. Nach dem Schrems-II-Urteil (2020) ist das nur unter strengen Auflagen rechtssicher möglich — z. B. mit dokumentiertem Auftragsverarbeitungsvertrag, Standardvertragsklauseln plus zusätzlichen technischen Maßnahmen. Für viele deutsche Unternehmen reicht das in der Praxis nicht. Spurig vermeidet das Problem komplett: alle Daten bleiben in der EU.',
  },
  {
    q: 'Was kostet Spurig im Vergleich zu Bitly?',
    a: 'Spurig ist 8,99 € netto / Monat im Jahresabo (107,88 €/Jahr) oder 12,99 € netto im Monatsabo. Bitly Growth — der erste Plan mit echtem QR-Tracking — kostet 199 $ / Monat. Du sparst rund 95 % bei vollem Funktionsumfang.',
  },
  {
    q: 'Kann ich Bitly-Kurzlinks zu Spurig migrieren?',
    a: 'Ja. Die Ziel-URLs deiner Bitly-Links kannst du als CSV exportieren und in Spurig importieren. Bestehende Bitly-Codes bleiben erstmal aktiv — neue Kampagnen legst du direkt in Spurig an. Wenn du eine eigene Domain (z. B. s.deinemarke.de) anschließt, sind alte Bitly-Links sogar austauschbar.',
  },
  {
    q: 'Brauche ich für Spurig ein Cookie-Banner?',
    a: 'Nein. Spurig nutzt keine Tracking-Cookies und kein Fingerprinting. IP-Adressen werden direkt anonymisiert (letzte 2 Oktette gehasht + täglich rotierender Salt). Das ist berechtigtes Interesse nach Art. 6 Abs. 1 lit. f DSGVO und braucht keine Cookie-Einwilligung.',
  },
  {
    q: 'Hat Spurig eine eigene Kurz-Domain?',
    a: 'Ja, inklusive in allen Plänen. Du verbindest z. B. s.deinemarke.de mit Spurig — fertig. SSL und DNS-Validierung passieren automatisch. Bei Bitly kostet diese Funktion ab dem Premium-Plan zusätzlich.',
  },
  {
    q: 'Kann ich die API auch mit n8n oder Make nutzen?',
    a: 'Ja. Spurig liefert eine vollständige REST-API mit Bearer-Token-Auth. Wir stellen Workflow-Templates für n8n bereit; Zapier- und Make-Connectoren sind in Arbeit. Bis dahin reicht der HTTP-Request-Node.',
  },
];

export default function BitlyAlternativePage() {
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
              <ShieldCheck className="h-3 w-3 text-brand" />
              Bitly-Alternative · Made in Germany
            </div>
            <h1 className="mt-5 max-w-3xl font-heading text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] sm:text-[56px]">
              Wie Bitly,{' '}
              <span className="text-muted-foreground/80 font-normal">nur DSGVO-konform.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-muted-foreground">
              Spurig ist der deutsche Kurzlink- und QR-Code-Tracker für Marketing-Teams die
              keine Lust auf Schrems-II-Diskussionen, US-Cookies und 199 $/Monat haben.
              EU-gehostet, DSGVO-konform, ohne Banner — für{' '}
              <span className="font-semibold text-foreground">8,99 €</span> netto im Monat.
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
                Keine Kreditkarte für den Test
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-brand" />
                EU-Hosting in Frankfurt
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Euro className="h-3 w-3 text-brand" />
                95 % günstiger als Bitly Growth
              </li>
            </ul>
          </div>
        </section>

        {/* Comparison-Tabelle */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <div className="rounded-3xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border bg-muted/20 px-6 py-4">
              <h2 className="font-heading text-[22px] font-semibold tracking-tight">
                Bitly vs. Spurig — Feature für Feature
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Stand Mai 2026 · öffentliche Bitly-Preisliste · Spurig-Funktionen aus aktuellem Pricing
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3 text-left font-semibold">Funktion</th>
                    <th className="px-5 py-3 text-left font-semibold text-brand">Spurig</th>
                    <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Bitly</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {COMPARISON.map((row) => {
                    return (
                      <tr key={row.feature} className="hover:bg-muted/15">
                        <td className="px-5 py-3 font-medium">{row.feature}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-start gap-1.5">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>{row.spurig}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-start gap-1.5 text-muted-foreground">
                            {/(nein|USA|ja, mit Schrems|nur englisch)/.test(row.bitly) ? (
                              <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500/70" />
                            ) : (
                              <span className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0 text-muted-foreground/40">·</span>
                            )}
                            <span>{row.bitly}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Why-Section — 3 Reasons */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <h2 className="font-heading text-[24px] font-semibold tracking-tight mb-8">
            Warum deutsche Marketing-Teams zu Spurig wechseln
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: 'Rechtssicherheit ohne Aufwand',
                body: 'EU-Hosting, IP-Anonymisierung und kein Drittanbieter-Tracking. Du brauchst keinen Cookie-Banner, keinen AVV-Marathon und keine Schrems-II-Prüfung. Deine Datenschutz-Beauftragte wird dich lieben.',
              },
              {
                icon: Euro,
                title: 'Faire Preise statt US-Enterprise',
                body: 'Bitly verlangt 199 $ / Monat für das, was bei Spurig im 8,99 €-Plan steckt. Eigene Domain inklusive, unbegrenzte QR-Codes, Live-Analytics. Kein Plan-Versteckspiel.',
              },
              {
                icon: Globe,
                title: 'Deutsche UI, deutscher Support',
                body: 'Komplette Oberfläche auf Deutsch, deutsche Rechnungen mit MwSt, Antwort auf Support-Mails meist innerhalb von 24 h — von echten Menschen, nicht Bot-Tickets.',
              },
            ].map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <card.icon className="h-4 w-4" strokeWidth={1.8} />
                </div>
                <h3 className="mt-3 text-[16px] font-semibold tracking-tight">{card.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
          <h2 className="font-heading text-[24px] font-semibold tracking-tight mb-6">
            Häufige Fragen
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

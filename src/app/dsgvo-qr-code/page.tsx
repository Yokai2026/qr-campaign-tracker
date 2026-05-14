import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Server,
  EyeOff,
  FileText,
  Check,
  ArrowRight,
} from 'lucide-react';
import { SiteHeader } from '@/components/landing/site-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { FinalCTA } from '@/components/landing/final-cta';
import { Button } from '@/components/ui/button';
import { GridBackdrop } from '@/components/ui/grid-backdrop';
import { StructuredData, softwareApplicationLd, faqPageLd } from '@/components/seo/structured-data';

export const metadata = {
  title: 'DSGVO-konformer QR-Code-Generator mit Tracking · Spurig',
  description:
    'QR-Codes erstellen und Scans messen — vollständig DSGVO-konform: EU-Hosting, IP-Anonymisierung, kein Cookie-Banner. Stripe-Zahlung, deutsche Rechnung mit USt.',
  alternates: { canonical: '/dsgvo-qr-code' },
  openGraph: {
    title: 'DSGVO-konformer QR-Code-Tracker · Spurig',
    description:
      'EU-gehostet, ohne Cookie-Banner, mit IP-Anonymisierung und transparentem Datenschutz.',
    url: 'https://spurig.com/dsgvo-qr-code',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Spurig — DSGVO-konformer QR-Code-Tracker' }],
  },
};

const PILLARS = [
  {
    icon: Server,
    title: 'EU-Hosting in Frankfurt',
    body:
      'Alle Daten werden auf Servern in Deutschland verarbeitet (AWS Frankfurt + Supabase EU-West). Kein Datentransfer in Drittstaaten — Schrems-II-Risiko entfällt komplett.',
  },
  {
    icon: EyeOff,
    title: 'IP-Anonymisierung ab Tag 1',
    body:
      'Eingehende IP-Adressen werden auf die ersten zwei Oktette gekürzt und mit einem täglich rotierenden Salt gehasht. Original-IPs landen nie in der Datenbank.',
  },
  {
    icon: Lock,
    title: 'Kein Drittanbieter-Tracking',
    body:
      'Spurig nutzt weder Google Analytics noch Facebook-Pixel noch Hotjar. Kein Fingerprinting, keine Cross-Site-Cookies, keine Werbe-IDs.',
  },
  {
    icon: FileText,
    title: 'AVV & Datenschutz-Doku',
    body:
      'Auftragsverarbeitungsvertrag (AVV / DPA) auf Anfrage in deiner Sprachversion. Vollständige Datenschutz-Erklärung mit Verarbeitungszwecken und Rechtsgrundlagen.',
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Brauche ich für Spurig einen Cookie-Banner?',
    a: 'Nein. Spurig verzichtet auf Tracking-Cookies, Cross-Site-Tracking und Fingerprinting. Die Scan-Erfassung läuft serverseitig auf erstanzeigte (First-Party) Domain — das ist berechtigtes Interesse gemäß Art. 6 Abs. 1 lit. f DSGVO und benötigt keine Einwilligung nach § 25 TTDSG.',
  },
  {
    q: 'Wie funktioniert die IP-Anonymisierung technisch?',
    a: 'Sobald ein Scan beim Redirect-Endpoint ankommt, wird die IP-Adresse auf die letzten zwei Oktette gekürzt (z. B. 1.2.0.0 statt 1.2.3.4) und mit einem täglich neu generierten Salt SHA-256-gehasht. Die Original-IP verlässt den RAM nie und wird nicht in die Datenbank geschrieben. Unique-Visitors werden über diesen anonymen Hash berechnet, nicht über persistente IDs.',
  },
  {
    q: 'Wo werden meine Daten gespeichert?',
    a: 'Postgres-Datenbank: Supabase EU-West-2 (Frankfurt). Application-Server: Vercel mit Region fra1 (Frankfurt). E-Mail-Versand: Resend (eu-west-1 / Irland). Stripe übernimmt Zahlungsdaten — kein Karteninhaber-Detail wird in Spurig gespeichert.',
  },
  {
    q: 'Bekomme ich einen Auftragsverarbeitungsvertrag?',
    a: 'Ja. AVV/DPA wird automatisch beim Plan-Upgrade als PDF bereitgestellt. Alternativ kannst du den AVV-Entwurf vor dem Kauf bei support@spurig.com anfordern. Subunternehmer (Supabase, Stripe, Resend, Vercel) sind transparent in der Datenschutzerklärung gelistet — alle mit eigenen AVVs und EU-Hosting bzw. Standardvertragsklauseln.',
  },
  {
    q: 'Ist die Nutzung in öffentlicher Verwaltung / Behörden zulässig?',
    a: 'Spurig erfüllt die Anforderungen typischer C5/DSGVO-Audits für SaaS-Tools im Behörden- und Bildungs-Kontext. Für förmliche Datenschutz-Folgenabschätzungen liefern wir auf Anfrage technische Detail-Dokumente.',
  },
  {
    q: 'Wie unterscheidet sich Spurig von US-Anbietern wie Bitly?',
    a: 'US-Anbieter unterliegen dem Cloud Act und transferieren Daten in die USA. Auch mit Standardvertragsklauseln bleibt das nach Schrems-II rechtlich heikel. Spurig vermeidet das Problem strukturell: alle Daten bleiben in der EU, kein US-Unternehmen hat Zugriff auf Logs oder Datenbank.',
  },
];

export default function DsgvoQrCodePage() {
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
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand">
              <ShieldCheck className="h-3 w-3" />
              DSGVO · TTDSG · Schrems-II-sicher
            </div>
            <h1 className="mt-5 max-w-3xl font-heading text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] sm:text-[56px]">
              QR-Code-Tracking,{' '}
              <span className="text-muted-foreground/80 font-normal">
                ohne dass dein Datenschutz-Beauftragter aufschreckt.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-muted-foreground">
              Spurig misst QR-Scans und Link-Klicks DSGVO-konform aus Deutschland — mit
              IP-Anonymisierung, ohne Tracking-Cookies und ohne US-Drittanbieter.
              Für Marketing-Teams die Conversion sehen wollen, aber rechtssicher unterwegs sein müssen.
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
                href="/datenschutz"
                className="text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Datenschutz-Details lesen →
              </Link>
            </div>

            <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-muted-foreground">
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-3 w-3 text-brand" />
                Kein Cookie-Banner nötig
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-3 w-3 text-brand" />
                AVV als PDF
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-3 w-3 text-brand" />
                Hosting in Frankfurt
              </li>
            </ul>
          </div>
        </section>

        {/* 4 Pillars */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <h2 className="font-heading text-[26px] font-semibold tracking-tight mb-2">
            Vier Säulen — keine Kompromisse
          </h2>
          <p className="text-[14px] text-muted-foreground mb-8 max-w-2xl">
            Statt nachträglich &bdquo;DSGVO-konform&ldquo; auf eine US-Plattform zu kleben,
            wurde Spurig von Anfang an als europäisches Tool entworfen.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {PILLARS.map((p) => (
              <article
                key={p.title}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <p.icon className="h-4 w-4" strokeWidth={1.8} />
                </div>
                <h3 className="mt-3 text-[16px] font-semibold tracking-tight">{p.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{p.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Compliance-Boxen */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <div className="rounded-3xl border border-border bg-card p-8 sm:p-10">
            <h2 className="font-heading text-[22px] font-semibold tracking-tight mb-5">
              Was du gegenüber deinem Datenschutz-Team konkret sagen kannst
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  badge: 'Art. 6 Abs. 1 lit. f',
                  text: 'Berechtigtes Interesse — Reichweiten-Messung eigener Kampagnen ohne Personenbezug. Keine Einwilligung erforderlich.',
                },
                {
                  badge: '§ 25 Abs. 2 Nr. 2 TTDSG',
                  text: 'Keine Cookies oder vergleichbaren Technologien auf Endgeräten gespeichert — TTDSG-Einwilligung entfällt.',
                },
                {
                  badge: 'Art. 28 DSGVO',
                  text: 'Auftragsverarbeitungsvertrag (AVV) mit allen Pflichtangaben verfügbar. Subunternehmer transparent gelistet.',
                },
                {
                  badge: 'Schrems-II',
                  text: 'Kein Datentransfer in Drittstaaten. Alle Verarbeitung in der EU — Standardvertragsklauseln und zusätzliche Maßnahmen nicht nötig.',
                },
              ].map((b) => (
                <div
                  key={b.badge}
                  className="rounded-xl border border-border/60 bg-background/40 p-4"
                >
                  <span className="inline-flex items-center rounded-md bg-brand/10 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-brand">
                    {b.badge}
                  </span>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
          <h2 className="font-heading text-[24px] font-semibold tracking-tight mb-6">
            Datenschutz-FAQ
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

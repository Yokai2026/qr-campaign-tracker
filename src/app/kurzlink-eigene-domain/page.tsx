import Link from 'next/link';
import {
  Globe,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Check,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { SiteHeader } from '@/components/landing/site-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { FinalCTA } from '@/components/landing/final-cta';
import { Button } from '@/components/ui/button';
import { GridBackdrop } from '@/components/ui/grid-backdrop';
import { StructuredData, softwareApplicationLd, faqPageLd } from '@/components/seo/structured-data';

export const metadata = {
  title: 'Kurzlink mit eigener Domain · Spurig',
  description:
    'Branded Kurzlinks mit deiner eigenen Subdomain (s.deinemarke.de). DSGVO-konform, SSL automatisch, kostenlos in allen Spurig-Plänen — auch im Trial.',
  alternates: { canonical: '/kurzlink-eigene-domain' },
  openGraph: {
    title: 'Kurzlinks unter eigener Domain · Spurig',
    description:
      'Nicht bitly.com oder spurig.com — sondern s.deinemarke.de. Markenstärke + Vertrauen + Tracking, in einem.',
    url: 'https://spurig.com/kurzlink-eigene-domain',
  },
};

const REASONS = [
  {
    icon: ShieldCheck,
    title: 'Markenvertrauen ohne Cookie-Fragezeichen',
    body:
      'Wenn jemand auf einem Plakat „bitly.com/abc" sieht — wem vertrauen die? Niemandem. „s.deinemarke.de/abc" hingegen wirkt offiziell, professionell und gehört zu DIR. Klickraten steigen messbar.',
  },
  {
    icon: TrendingUp,
    title: 'Höhere Klickraten in Print & Werbung',
    body:
      'Studien aus 2024 zeigen: gebrandete Kurzlinks haben 34 % höhere CTR als generische Shortener. Speziell in DACH wo Datenschutz ein Thema ist — „s.dm.de" wirkt anders als ein anonymer Shortener.',
  },
  {
    icon: Sparkles,
    title: 'Mehrere Marken auf einem Account',
    body:
      'Hast du mehrere Kunden oder Submarken? Connect beliebig viele Domains zu deinem Spurig-Account: s.marke1.de, s.marke2.de, qr.event.com — jede mit eigenem Branding, alles in einem Dashboard.',
  },
  {
    icon: Lock,
    title: 'SSL & DNS vollautomatisch',
    body:
      'Du legst zwei DNS-Records bei deinem Provider an, Spurig erkennt automatisch, validiert SSL via Let’s Encrypt — fertig in 5-30 Min. Keine cron-Jobs, kein Zertifikat-Renewal, kein Stress.',
  },
];

const SETUP_STEPS = [
  {
    title: 'Subdomain wählen',
    body: 'z. B. s.deinemarke.de · go.deinemarke.de · qr.deinemarke.de. Wichtig: Subdomain, NICHT die Hauptdomain — sonst geht deine Webseite kaputt.',
  },
  {
    title: 'Zwei DNS-Records anlegen',
    body: 'Im DNS-Panel (Cloudflare, IONOS, Strato, GoDaddy etc.): 1 TXT-Record zur Verifizierung + 1 CNAME-Record für Routing. Spurig zeigt dir die exakten Werte.',
  },
  {
    title: '5-30 Min warten',
    body: 'Spurig prüft alle 15 Sekunden ob DNS schon aktiv ist. Sobald validiert: grüner Haken, SSL automatisch eingerichtet, fertig.',
  },
  {
    title: 'Domain im QR-Code-Editor wählen',
    body: 'Beim Anlegen neuer QR-Codes oder Kurzlinks erscheint deine Domain im Dropdown. Eine Domain kannst du als „Primär" markieren — wird Default für alle neuen Codes.',
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Brauche ich eine eigene Domain dafür?',
    a: 'Du brauchst eine Domain auf der du eine Subdomain anlegen kannst. Wenn du schon eine Webseite hast (deinemarke.de), kannst du gratis eine Subdomain wie s.deinemarke.de anlegen — ohne Zusatzkosten. Wer noch keine Domain hat: bei jedem deutschen Provider (IONOS, Strato, Hetzner, Namecheap) ab ~1 €/Mo erhältlich.',
  },
  {
    q: 'Was wenn ich keine technische Erfahrung habe?',
    a: 'Spurig zeigt dir die exakten DNS-Werte zum Kopieren und erkennt deinen Provider automatisch (Cloudflare, IONOS, Strato, GoDaddy etc.) — mit provider-spezifischer Anleitung. Falls trotzdem unklar: Mail an support@spurig.com mit Provider-Name, wir helfen direkt.',
  },
  {
    q: 'Kostet Custom-Domain extra?',
    a: 'Nein. In allen Spurig-Plänen (auch im 14-Tage-Trial) inklusive. Du kannst beliebig viele Domains hinzufügen — bei Bitly kostet das ab dem 499 $/Mo-Plan extra.',
  },
  {
    q: 'Was passiert wenn ich Spurig kündige? Behält der QR-Code weiter funktioniert?',
    a: 'Die DNS-Records bleiben bei dir — du kannst sie zu jedem anderen Shortener umroutten. Spurig hostet nur die Redirect-Logik; sobald du z. B. auf einen anderen Anbieter wechselst, änderst du den CNAME und die alten Codes funktionieren weiter (zu anderem Ziel).',
  },
  {
    q: 'Wie sicher ist das? Können andere Spurig-User meine Domain nutzen?',
    a: 'Nein. Beim Setup verifizieren wir Domain-Inhaberschaft via TXT-Record. Nur dein Account kann unter deiner Domain Kurzlinks anlegen. SSL läuft pro Domain isoliert, Logs sind nur in deinem Account sichtbar.',
  },
  {
    q: 'Funktioniert das auch mit https:// oder nur Subdomain?',
    a: 'Funktioniert immer mit HTTPS. Spurig richtet automatisch ein Let’s Encrypt-Zertifikat ein und erneuert es alle 60 Tage. Du musst nichts dafür tun — der Vorgang ist vollautomatisch.',
  },
];

export default function CustomDomainPage() {
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
              <Globe className="h-3 w-3 text-brand" />
              Custom Domain · in allen Plänen inklusive
            </div>
            <h1 className="mt-5 max-w-3xl font-heading text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] sm:text-[56px]">
              Kurzlinks mit{' '}
              <span className="text-muted-foreground/80 font-normal">deiner eigenen Marke,</span>{' '}
              nicht unserer.
            </h1>
            <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-muted-foreground">
              Statt <code className="rounded bg-muted px-1.5 py-0.5 text-[13px]">spurig.com/r/abc</code>{' '}
              zeigt deine QR-Werbung{' '}
              <code className="rounded bg-brand/15 px-1.5 py-0.5 text-[13px] text-brand font-semibold">s.deinemarke.de/abc</code>.
              Sieht professioneller aus, baut Markenvertrauen, erhöht Klickraten —
              und ist bei Spurig kostenlos in jedem Plan.
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
                In allen Plänen inklusive
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-brand" />
                SSL automatisch
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-brand" />
                Beliebig viele Domains
              </li>
            </ul>
          </div>
        </section>

        {/* Why */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <h2 className="font-heading text-[26px] font-semibold tracking-tight mb-2">
            Warum eigene Kurz-Domain?
          </h2>
          <p className="text-[14px] text-muted-foreground mb-8 max-w-2xl">
            Nicht aus Eitelkeit — sondern weil es messbar mehr Klicks bringt
            und im B2B-Kontext rechtssicherer ist.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {REASONS.map((r) => (
              <article
                key={r.title}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <r.icon className="h-4 w-4" strokeWidth={1.8} />
                </div>
                <h3 className="mt-3 text-[16px] font-semibold tracking-tight">{r.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{r.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Vorher/Nachher-Visual */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-10">
            <h2 className="font-heading text-[22px] font-semibold tracking-tight mb-5">
              So sieht&apos;s auf deinen Plakaten aus
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-5">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Ohne Custom-Domain</div>
                <code className="block text-[13.5px] font-mono text-muted-foreground">
                  spurig.com/r/x7k2m
                </code>
                <p className="mt-3 text-[12.5px] text-muted-foreground">
                  Funktioniert, aber wirkt fremd. Print-Leser fragen sich: &bdquo;Was ist Spurig?&ldquo;
                  → Vertrauenshürde, niedrigere Scan-Rate.
                </p>
              </div>
              <div className="rounded-xl border border-brand/40 bg-brand/[0.04] p-5">
                <div className="text-[11px] uppercase tracking-wide text-brand mb-2">Mit Custom-Domain</div>
                <code className="block text-[13.5px] font-mono text-brand font-semibold">
                  s.deinemarke.de/sommer26
                </code>
                <p className="mt-3 text-[12.5px] text-muted-foreground">
                  Sieht aus wie offizielle Kommunikation deiner Marke.
                  Höhere Scan-Bereitschaft, mehr Klicks, mehr Conversions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Setup-Steps */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <h2 className="font-heading text-[22px] font-semibold tracking-tight mb-5">
            Setup in 4 Schritten (max. 30 Min, meist 5)
          </h2>
          <ol className="space-y-3">
            {SETUP_STEPS.map((s, i) => (
              <li
                key={s.title}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-4"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[12px] font-semibold text-brand tabular-nums">
                  {i + 1}
                </span>
                <div>
                  <div className="text-[14px] font-semibold">{s.title}</div>
                  <div className="mt-1 text-[13px] text-muted-foreground">{s.body}</div>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-[12.5px] text-muted-foreground">
            Spurig erkennt deinen DNS-Provider automatisch und zeigt provider-spezifische
            Anleitungen (Cloudflare, IONOS, Strato, GoDaddy, Namecheap, AWS Route53).
          </p>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
          <h2 className="font-heading text-[24px] font-semibold tracking-tight mb-6">
            Häufige Fragen zur Custom-Domain
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

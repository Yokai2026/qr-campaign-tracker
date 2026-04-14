import Link from 'next/link';
import {
  QrCode,
  ShieldCheck,
  BarChart3,
  Smartphone,
  MapPin,
  FileDown,
  Sparkles,
  Check,
  ArrowRight,
  Lock,
  Server,
  EyeOff,
  Crown,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BillingToggle } from '@/components/landing/billing-toggle';

const features = [
  {
    icon: BarChart3,
    title: 'Analytics in Echtzeit',
    description:
      'Scans, Unique Visitors, Conversion-Raten. Übersichtlich statt Zahlenchaos.',
  },
  {
    icon: MapPin,
    title: 'Geo- & Platzierungs-Daten',
    description:
      'Welches Plakat am Bahnhof performt besser als das vor dem Café? Du siehst es sofort.',
  },
  {
    icon: Smartphone,
    title: 'Geräte-Erkennung',
    description:
      'iOS, Android, Desktop — erkenne wer, wo, womit scannt.',
  },
  {
    icon: FileDown,
    title: 'CSV & PDF Export',
    description:
      'Rohdaten für den Chef oder die Agentur — mit einem Klick.',
  },
];

const dsgvoPoints = [
  {
    icon: EyeOff,
    title: 'Kein Fingerprinting',
    description: 'Keine Cookies, kein Cross-Site-Tracking. Nur die Daten, die du wirklich brauchst.',
  },
  {
    icon: Server,
    title: 'EU-Hosting',
    description: 'Alle Daten bleiben in der EU. Supabase in Frankfurt, Hetzner für E-Mails.',
  },
  {
    icon: Lock,
    title: 'IP-Anonymisierung',
    description: 'Letzte IP-Oktette werden genullt. Keine Drittanbieter, kein Google Analytics.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Kampagne anlegen',
    description:
      'Name, Zielseite, Start- und Enddatum. In 30 Sekunden fertig.',
  },
  {
    number: '02',
    title: 'QR-Codes drucken',
    description:
      'Pro Platzierung ein eindeutiger Code. SVG für Print, PNG für Digital.',
  },
  {
    number: '03',
    title: 'Daten auswerten',
    description:
      'Scans laufen live ins Dashboard. Filtere nach Kampagne, Ort, Gerät, Zeitraum.',
  },
];

function PhoneMockup({ url, variant }: { url: string; variant: 'standard' | 'pro' }) {
  const isPro = variant === 'pro';
  return (
    <div
      className={
        'relative w-[240px] rounded-[2.25rem] border-[7px] border-neutral-900 bg-neutral-900 shadow-2xl ' +
        (isPro ? 'shadow-primary/25' : 'shadow-black/20')
      }
    >
      {/* Notch */}
      <div className="absolute left-1/2 top-[7px] z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-neutral-900" />
      {/* Screen */}
      <div className="overflow-hidden rounded-[1.75rem] bg-background">
        {/* Status bar placeholder */}
        <div className="h-6 bg-background" />
        {/* Browser chrome */}
        <div className="border-b border-border/60 bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 py-1">
            <Lock
              className={
                'h-2.5 w-2.5 shrink-0 ' +
                (isPro ? 'text-emerald-600' : 'text-muted-foreground')
              }
            />
            <span
              className={
                'truncate text-[10px] font-medium ' +
                (isPro ? 'text-foreground' : 'text-muted-foreground')
              }
            >
              {url}
            </span>
          </div>
        </div>
        {/* Page content mock */}
        <div className="flex min-h-[320px] flex-col gap-3 p-4">
          <div className="flex items-center gap-2">
            <div
              className={
                'flex h-6 w-6 items-center justify-center rounded-md ' +
                (isPro
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground')
              }
            >
              <QrCode className="h-3 w-3" />
            </div>
            <div className="h-2 w-20 rounded-full bg-muted" />
          </div>
          <div className="mt-1 space-y-1.5">
            <div className="h-2.5 w-full rounded-full bg-muted" />
            <div className="h-2.5 w-4/5 rounded-full bg-muted" />
            <div className="h-2.5 w-2/3 rounded-full bg-muted" />
          </div>
          <div
            className={
              'mt-auto rounded-lg border p-3 ' +
              (isPro
                ? 'border-primary/30 bg-primary/5'
                : 'border-border bg-muted/30')
            }
          >
            <div className="flex items-center justify-between">
              <div className="h-2 w-16 rounded-full bg-foreground/40" />
              <div
                className={
                  'h-4 w-12 rounded-full ' +
                  (isPro ? 'bg-primary' : 'bg-foreground/60')
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[4px] bg-neutral-900">
              <QrCode className="h-3 w-3 text-white/70" />
            </div>
            <span className="text-[13px] font-semibold">Spurig</span>
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            <Link
              href="#features"
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#dsgvo"
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Datenschutz
            </Link>
            <Link
              href="/pricing"
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Preise
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/login" />}>
              Anmelden
            </Button>
            <Button size="sm" render={<Link href="/signup" />}>
              Kostenlos testen
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* subtle gradient blob */}
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-[500px] bg-[radial-gradient(ellipse_at_top,_oklch(0.85_0.08_285_/_0.35),_transparent_60%)]" />

        <div className="relative mx-auto max-w-5xl px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28 sm:pb-24">
          <div className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-[12px] font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" />
            DSGVO-konform · Einführungspreis bis Ende 2026
          </div>
          <h1 className="text-balance text-[36px] font-bold leading-[1.1] tracking-tight sm:text-[52px] md:text-[60px]">
            QR-Code-Tracking,
            <br />
            <span className="bg-gradient-to-r from-primary to-[oklch(0.55_0.15_260)] bg-clip-text text-transparent">
              das dir wirklich gehört.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-[17px]">
            Tracke jeden Scan deiner Plakate, Flyer und Visitenkarten. Ohne Google
            Analytics, ohne Cookies, ohne Datenabfluss an Dritte. Alles in der EU,
            alles unter deiner Kontrolle.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" render={<Link href="/signup" />}>
              14 Tage kostenlos testen
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/pricing" />}>
              Preise ansehen
            </Button>
          </div>

          {/* trust bar */}
          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3 text-emerald-500" />
              Keine Kreditkarte nötig
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3 text-emerald-500" />
              Jederzeit kündbar
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3 text-emerald-500" />
              Hosting in der EU
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3 text-emerald-500" />
              Ab 4,99 € / Monat
            </span>
          </div>
        </div>

        {/* mock dashboard preview — pure CSS */}
        <div className="relative mx-auto max-w-5xl px-4 pb-20 sm:px-6">
          <div className="relative rounded-2xl border border-border bg-card/60 p-2 shadow-2xl shadow-primary/10 backdrop-blur">
            <div className="rounded-xl border border-border/60 bg-background overflow-hidden">
              {/* fake toolbar */}
              <div className="flex items-center gap-1.5 border-b border-border/60 px-3 py-2">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                <div className="ml-3 text-[11px] text-muted-foreground">
                  spurig.com/dashboard
                </div>
              </div>
              {/* fake dashboard grid */}
              <div className="grid grid-cols-4 gap-3 p-4">
                {[
                  { label: 'Scans', value: '2.847', trend: '+12 %' },
                  { label: 'Unique', value: '1.912', trend: '+8 %' },
                  { label: 'CTR', value: '67 %', trend: '+2,1 %' },
                  { label: 'Conversions', value: '184', trend: '+24 %' },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-lg border border-border/60 bg-card p-3"
                  >
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {m.label}
                    </div>
                    <div className="mt-1 text-xl font-bold tracking-tight">{m.value}</div>
                    <div className="text-[10px] font-medium text-emerald-600">
                      {m.trend}
                    </div>
                  </div>
                ))}
              </div>
              {/* fake chart */}
              <div className="px-4 pb-4">
                <div className="rounded-lg border border-border/60 bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-[12px] font-medium">Scans · letzte 14 Tage</div>
                    <div className="text-[10px] text-muted-foreground">Stündlich</div>
                  </div>
                  <svg viewBox="0 0 400 100" className="h-20 w-full">
                    <defs>
                      <linearGradient id="lp-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.55 0.15 285)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="oklch(0.55 0.15 285)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,80 L30,75 L60,60 L90,65 L120,45 L150,50 L180,30 L210,38 L240,25 L270,35 L300,20 L330,28 L360,15 L400,10 L400,100 L0,100 Z"
                      fill="url(#lp-gradient)"
                    />
                    <path
                      d="M0,80 L30,75 L60,60 L90,65 L120,45 L150,50 L180,30 L210,38 L240,25 L270,35 L300,20 L330,28 L360,15 L400,10"
                      fill="none"
                      stroke="oklch(0.55 0.15 285)"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* So funktioniert's */}
      <section className="border-y border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-primary">
              In drei Schritten
            </div>
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Vom Plakat zur Auswertung — an einem Nachmittag
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.number} className="relative">
                {i < steps.length - 1 && (
                  <div className="absolute left-full top-6 hidden h-px w-6 -translate-x-3 bg-border md:block" />
                )}
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
                  <div className="text-[11px] font-mono font-semibold text-primary">
                    {step.number}
                  </div>
                  <h3 className="text-[15px] font-semibold">{step.title}</h3>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-primary">
              Alles drin
            </div>
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Was du für professionelles Kampagnen-Tracking brauchst
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[15px] text-muted-foreground">
              Nicht mehr, nicht weniger. Keine überladenen Dashboards, keine
              fünfseitigen Feature-Listen.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-[14px] font-semibold">{f.title}</h3>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-6 text-center">
            <Link href="/pricing" className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">
              Alle Features ansehen
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* DSGVO Section */}
      <section id="dsgvo" className="border-y border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid items-start gap-10 md:grid-cols-2">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                DSGVO by Design
              </div>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Datenschutz ist kein Häkchen — er ist die Grundlage.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                Die meisten Tracking-Tools senden deine Daten an Google, Facebook
                und ein Dutzend weitere US-Anbieter. Spurig macht das Gegenteil:
                keine Drittanbieter, keine Cookies fürs Tracking, keine
                Auftragsverarbeitung, die du nicht unter Kontrolle hast.
              </p>
              <p className="mt-3 text-[13px] text-muted-foreground">
                Perfekt für Agenturen, Vereine, Gastronomie, Handel und jeden,
                der nicht bei jedem Plakat einen Cookie-Banner erklären will.
              </p>
            </div>

            <div className="space-y-3">
              {dsgvoPoints.map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.title}
                    className="flex gap-4 rounded-xl border border-border bg-card p-5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-semibold">{p.title}</h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        {p.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Eigene Domain (Pro) */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
              <Crown className="h-3 w-3" />
              Pro-Feature
            </div>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              So sehen deine Besucher den QR-Code
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[15px] text-muted-foreground">
              Standard ist in Ordnung. Eigene Domain wirkt wie deine Marke —
              und macht das Tracking unsichtbar für den Nutzer.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Phone: Standard */}
            <div className="flex flex-col items-center">
              <div className="mb-4 text-center">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Standard
                </div>
                <div className="mt-1 text-[13px] text-muted-foreground">
                  Kostenlos · Funktioniert sofort
                </div>
              </div>
              <PhoneMockup url="spurig.com/r/a3b2c" variant="standard" />
            </div>

            {/* Phone: Pro */}
            <div className="flex flex-col items-center">
              <div className="mb-4 text-center">
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <Crown className="h-3 w-3" />
                  Eigene Domain
                </div>
                <div className="mt-1 text-[13px] text-muted-foreground">
                  Pro · Deine Marke, nicht unsere
                </div>
              </div>
              <PhoneMockup url="go.deine-marke.de/a3b2c" variant="pro" />
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-primary" />
              Jede Subdomain möglich
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-primary" />
              HTTPS automatisch
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Volles Tracking
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-8 text-center">
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-primary">
              Ein Plan, alles drin
            </div>
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Faire Preise. Keine Tier-Tricks.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[15px] text-muted-foreground">
              Unbegrenzte Kampagnen, QR-Codes und Scans.
            </p>
          </div>

          <BillingToggle href="/signup" />

          <div className="mt-6 text-center">
            <Link href="/pricing" className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground">
              Was ist enthalten?
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-[oklch(0.145_0.005_285)] p-10 text-center text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_oklch(0.55_0.15_285_/_0.35),_transparent_70%)]" />
            <div className="relative">
              <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                Starte jetzt — kostenlos, ohne Kreditkarte
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] text-white/70">
                14 Tage volle Funktionalität. Wenn du überzeugt bist, zahlst du
                4,99 € im Monat. Nicht überzeugt? Einfach nichts tun — der Account
                schläft ein.
              </p>
              <div className="mt-6 flex justify-center">
                <Button
                  size="lg"
                  className="bg-white text-neutral-900 hover:bg-white/90"
                  render={<Link href="/signup" />}
                >
                  Kostenlos starten
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[4px] bg-neutral-900">
                <QrCode className="h-3 w-3 text-white/70" />
              </div>
              <span className="text-[13px] font-semibold">Spurig</span>
              <span className="text-[12px] text-muted-foreground">
                · QR-Code Kampagnen-Tracking
              </span>
            </div>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px]">
              <Link
                href="/pricing"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Preise
              </Link>
              <Link
                href="/login"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Anmelden
              </Link>
              <Link
                href="/signup"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Registrieren
              </Link>
              <Link
                href="/impressum"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Impressum
              </Link>
              <Link
                href="/datenschutz"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Datenschutz
              </Link>
            </nav>
          </div>
          <div className="mt-8 border-t border-border pt-6 text-center text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Spurig. Alle Rechte vorbehalten. Hosting in
            der EU. Zahlungen sicher über Stripe.
          </div>
        </div>
      </footer>
    </div>
  );
}

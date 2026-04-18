import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Clock,
  Globe,
  LineChart,
  Mail,
  MapPin,
  Printer,
  QrCode,
  Smartphone,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import './pitch.css';

const TOTAL_SLIDES = 8;

function SlideNumber({ n, tone = 'muted' }: { n: number; tone?: 'muted' | 'light' }) {
  const color = tone === 'light' ? 'text-white/40' : 'text-muted-foreground';
  return (
    <div className={`tabular absolute bottom-8 right-10 text-[11px] uppercase tracking-[0.14em] ${color}`}>
      {String(n).padStart(2, '0')} / {String(TOTAL_SLIDES).padStart(2, '0')}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-brand">
      <span className="h-px w-6 bg-brand" />
      {children}
    </div>
  );
}

export default function PitchPage() {
  return (
    <div className="pitch-deck bg-background text-foreground">
      {/* ── 1 — Cover ── */}
      <section className="pitch-slide items-center justify-center px-12 py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 65% 50% at 50% 40%, oklch(0.64 0.10 185 / 0.10), transparent 65%)',
          }}
        />
        <div className="relative mx-auto flex h-full max-w-4xl flex-col items-center justify-center text-center">
          <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            B2B Pitch
          </div>
          <h1 className="font-heading text-[110px] font-semibold leading-[0.92] tracking-[-0.04em]">
            Spurig
          </h1>
          <p className="mt-10 font-heading text-[30px] font-semibold leading-[1.2] tracking-[-0.02em]">
            QR-Tracking für lokale Geschäfte.
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-[18px] leading-[1.55] text-muted-foreground">
            Wissen, welcher Aufsteller, Flyer und Tisch wirklich Kunden bringt.
          </p>
          <div className="mt-20 flex items-center gap-6 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>spurig.com</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span>DSGVO · EU-Hosting</span>
          </div>
        </div>
        <SlideNumber n={1} />
      </section>

      {/* ── 2 — Problem ── */}
      <section className="pitch-slide px-16 py-20">
        <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-center">
          <Eyebrow>Problem</Eyebrow>
          <h2 className="font-heading text-[56px] font-semibold leading-[1.05] tracking-[-0.03em]">
            Sie kleben QR-Codes auf Flyer, Aufsteller, Tische —
            <br />
            <span className="text-muted-foreground">und wissen nicht, was funktioniert.</span>
          </h2>
          <ul className="mt-14 space-y-5 text-[20px] leading-[1.5] text-foreground/85">
            <li className="flex items-start gap-4">
              <span className="mt-3 h-1.5 w-8 flex-shrink-0 rounded-full bg-brand" />
              Welcher Standort bringt die meisten Scans?
            </li>
            <li className="flex items-start gap-4">
              <span className="mt-3 h-1.5 w-8 flex-shrink-0 rounded-full bg-brand" />
              Welche Werbeaktion zahlt sich aus?
            </li>
            <li className="flex items-start gap-4">
              <span className="mt-3 h-1.5 w-8 flex-shrink-0 rounded-full bg-brand" />
              Welcher Kanal ist verschwendetes Geld?
            </li>
          </ul>
        </div>
        <SlideNumber n={2} />
      </section>

      {/* ── 3 — Lösung ── */}
      <section className="pitch-slide px-16 py-20">
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center">
          <Eyebrow>Lösung</Eyebrow>
          <h2 className="font-heading text-[56px] font-semibold leading-[1.05] tracking-[-0.03em]">
            Spurig misst jeden Scan.
          </h2>
          <p className="mt-5 max-w-2xl text-[19px] leading-[1.55] text-muted-foreground">
            Ein Dashboard für alle QR-Codes. Klar erkennbar, was läuft und was nicht.
          </p>
          <div className="mt-14 grid grid-cols-4 gap-4">
            {[
              { icon: MapPin, title: 'Standort', desc: 'Wo wird gescannt — bis auf Stadt und Gerät' },
              { icon: Smartphone, title: 'Gerät', desc: 'iOS, Android, Desktop im Vergleich' },
              { icon: Clock, title: 'Tageszeit', desc: 'Peak-Zeiten erkennen, Timing optimieren' },
              { icon: Target, title: 'Conversion', desc: 'Welcher Scan wird zum Kunden' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6">
                <Icon className="h-6 w-6 text-brand" strokeWidth={1.6} />
                <div className="mt-5 font-heading text-[19px] font-semibold tracking-[-0.01em]">{title}</div>
                <div className="mt-2 text-[13px] leading-[1.55] text-muted-foreground">{desc}</div>
              </div>
            ))}
          </div>
        </div>
        <SlideNumber n={3} />
      </section>

      {/* ── 4 — Wie ── */}
      <section className="pitch-slide bg-subtle px-16 py-20">
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center">
          <Eyebrow>So geht's</Eyebrow>
          <h2 className="font-heading text-[56px] font-semibold leading-[1.05] tracking-[-0.03em]">
            In drei Schritten live.
          </h2>
          <div className="mt-16 grid grid-cols-3 gap-10">
            {[
              {
                n: '01',
                icon: QrCode,
                title: 'Code generieren',
                desc: 'Kampagne anlegen. QR-Code als SVG oder PNG herunterladen. Pro Aufsteller ein eigener Code.',
              },
              {
                n: '02',
                icon: Printer,
                title: 'Drucken & Anbringen',
                desc: 'Auf Flyer, Aufsteller, Visitenkarten, Tischen. Kein App-Download für Kunden, direkt einsatzbereit.',
              },
              {
                n: '03',
                icon: LineChart,
                title: 'Dashboard checken',
                desc: 'Live-Scans, Top-Kampagnen, Geräte-Mix, Peak-Zeiten. Alle Daten auf einen Blick.',
              },
            ].map(({ n, icon: Icon, title, desc }) => (
              <div key={n} className="flex flex-col">
                <div className="mb-6 flex items-center gap-4">
                  <span className="tabular font-heading text-[32px] font-semibold text-brand">{n}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <Icon className="h-7 w-7 text-foreground" strokeWidth={1.5} />
                <div className="mt-5 font-heading text-[22px] font-semibold tracking-[-0.015em]">{title}</div>
                <div className="mt-2 text-[15px] leading-[1.55] text-muted-foreground">{desc}</div>
              </div>
            ))}
          </div>
        </div>
        <SlideNumber n={4} />
      </section>

      {/* ── 5 — Demo ── */}
      <section className="pitch-slide px-16 py-16">
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center">
          <Eyebrow>Dashboard</Eyebrow>
          <h2 className="font-heading text-[42px] font-semibold leading-[1.1] tracking-[-0.025em]">
            Live-Scans, Gerätemix, Tagesverlauf — auf einen Blick.
          </h2>
          <div className="mt-10">
            <StaticDashboardMock />
          </div>
        </div>
        <SlideNumber n={5} />
      </section>

      {/* ── 6 — Privacy ── */}
      <section
        className="pitch-slide px-16 py-20"
        style={{ background: 'oklch(0.955 0.025 185 / 0.55)' }}
      >
        <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-center">
          <Eyebrow>Datenschutz</Eyebrow>
          <h2 className="font-heading text-[56px] font-semibold leading-[1.05] tracking-[-0.03em]">
            DSGVO-konform.
            <br />
            Hosting in Deutschland.
          </h2>
          <p className="mt-5 max-w-2xl text-[19px] leading-[1.55] text-muted-foreground">
            Privacy by design. Kein Cookie-Banner, kein Fingerprinting, keine Drittanbieter.
          </p>
          <ul className="mt-12 grid grid-cols-2 gap-x-12 gap-y-5">
            {[
              'IP-anonymisiert mit Daily-Salt-Hashing',
              'Keine Cookies für Tracking',
              'Kein Fingerprinting, keine US-Dienste',
              'Auftragsverarbeitungs-Vertrag inklusive',
              'Hosting ausschließlich in der EU',
              '24 Monate Aufbewahrung, danach gelöscht',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-[17px] leading-[1.5] text-foreground/90">
                <Check className="mt-1 h-5 w-5 flex-shrink-0 text-brand" strokeWidth={2.4} />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <SlideNumber n={6} />
      </section>

      {/* ── 7 — Preis ── */}
      <section className="pitch-slide px-16 py-20">
        <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-center">
          <Eyebrow>Preis</Eyebrow>
          <h2 className="font-heading text-[42px] font-semibold leading-[1.1] tracking-[-0.025em]">
            Ein Plan. Alles enthalten.
          </h2>
          <div className="mt-14 grid grid-cols-2 gap-6">
            <div className="rounded-2xl border-2 border-brand bg-card p-10">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-brand">Monatlich</div>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="tabular font-heading text-[92px] font-semibold leading-none tracking-[-0.035em]">
                  5,99
                </span>
                <span className="text-[22px] font-medium text-muted-foreground">€ / Mo</span>
              </div>
              <p className="mt-5 text-[15px] text-muted-foreground">Flexibel. Monatlich kündbar.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-10">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Jährlich —{' '}
                <span className="font-semibold text-warm">spare 17 %</span>
              </div>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="tabular font-heading text-[92px] font-semibold leading-none tracking-[-0.035em]">
                  4,99
                </span>
                <span className="text-[22px] font-medium text-muted-foreground">€ / Mo</span>
              </div>
              <p className="mt-5 text-[15px] text-muted-foreground">Jährliche Abrechnung — 59,88 € / Jahr.</p>
            </div>
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-[15px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-brand" strokeWidth={2.6} />
              14 Tage kostenlos testen
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-brand" strokeWidth={2.6} />
              Keine Kreditkarte
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-brand" strokeWidth={2.6} />
              Monatlich kündbar
            </div>
          </div>
        </div>
        <SlideNumber n={7} />
      </section>

      {/* ── 8 — Kontakt / CTA ── */}
      <section className="pitch-slide items-center justify-center bg-ink px-16 py-20 text-ink-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 70% 30%, oklch(0.64 0.10 185 / 0.22), transparent 60%)',
          }}
        />
        <div className="relative mx-auto flex h-full max-w-4xl flex-col items-center justify-center text-center">
          <h2 className="font-heading text-[72px] font-semibold leading-[1.0] tracking-[-0.035em]">
            Probieren Sie Spurig
            <br />
            <span style={{ color: 'oklch(0.78 0.115 185)' }}>14 Tage kostenlos.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[20px] leading-[1.5] text-ink-foreground/70">
            Keine Kreditkarte, keine Installation. In unter zwei Minuten ist der erste QR-Code live.
          </p>
          <div className="mt-16 grid w-full grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left">
              <Mail className="h-5 w-5" style={{ color: 'oklch(0.78 0.115 185)' }} strokeWidth={1.6} />
              <div className="mt-3 text-[11px] uppercase tracking-[0.14em] text-ink-foreground/50">E-Mail</div>
              <div className="mt-1 text-[20px] font-medium">info@spurig.com</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left">
              <Globe className="h-5 w-5" style={{ color: 'oklch(0.78 0.115 185)' }} strokeWidth={1.6} />
              <div className="mt-3 text-[11px] uppercase tracking-[0.14em] text-ink-foreground/50">Web</div>
              <div className="mt-1 text-[20px] font-medium">spurig.com</div>
            </div>
          </div>
          <div className="pitch-no-print mt-12">
            <Button
              variant="brand"
              size="lg"
              className="h-12 px-8 text-[15px]"
              render={<Link href="/signup" />}
            >
              Kostenlos testen
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
        <SlideNumber n={8} tone="light" />
      </section>
    </div>
  );
}

function StaticDashboardMock() {
  const KPIS = [
    { label: 'Scans heute', value: '2.847', trend: '+12 %' },
    { label: 'Unique', value: '1.912', trend: '+8 %' },
    { label: 'CTR', value: '67 %', trend: '+2,1 %' },
    { label: 'Conversions', value: '184', trend: '+24 %' },
  ];
  const CAMPAIGNS = [
    { name: 'Sommer-Plakate Berlin', scans: '1.243', pct: 84, tag: 'Plakat' },
    { name: 'Flyer Café-Route', scans: '896', pct: 62, tag: 'Flyer' },
    { name: 'Visitenkarte Messe', scans: '412', pct: 28, tag: 'B2B' },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-lg)]">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="font-heading font-semibold">Kampagnen</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-muted-foreground">Übersicht</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Letzte 14 Tage
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3 border-b border-border p-4">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-lg border border-border bg-card p-3.5">
            <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {k.label}
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="tabular text-[26px] font-semibold tracking-tight">{k.value}</span>
              <span className="tabular text-[10px] font-semibold text-emerald-600">{k.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-0">
        <div className="col-span-3 border-r border-border p-4">
          <div className="text-[12px] font-medium">Scan-Verlauf</div>
          <div className="text-[11px] text-muted-foreground">Stündlich · letzte 14 Tage</div>
          <svg viewBox="0 0 400 140" className="mt-3 h-32 w-full" aria-hidden>
            <defs>
              <linearGradient id="pitch-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.32" />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2 3">
              <line x1="0" y1="30" x2="400" y2="30" />
              <line x1="0" y1="70" x2="400" y2="70" />
              <line x1="0" y1="110" x2="400" y2="110" />
            </g>
            <path
              d="M0,110 L30,100 L60,82 L90,90 L120,60 L150,70 L180,40 L210,50 L240,30 L270,44 L300,22 L330,34 L360,14 L400,8 L400,140 L0,140 Z"
              fill="url(#pitch-area)"
            />
            <path
              d="M0,110 L30,100 L60,82 L90,90 L120,60 L150,70 L180,40 L210,50 L240,30 L270,44 L300,22 L330,34 L360,14 L400,8"
              fill="none"
              stroke="var(--brand)"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="360" cy="14" r="3.5" fill="var(--brand)" />
          </svg>
        </div>

        <div className="col-span-2 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[12px] font-medium">Top-Kampagnen</div>
            <span className="text-[11px] text-muted-foreground">diese Woche</span>
          </div>
          <ul className="space-y-2.5">
            {CAMPAIGNS.map((c) => (
              <li key={c.name}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                    <span className="text-[12px] font-medium">{c.name}</span>
                  </div>
                  <span className="tabular text-[11px] font-semibold">{c.scans}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${c.pct}%` }} />
                  </div>
                  <span className="rounded border border-border bg-muted px-1.5 py-[1px] text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                    {c.tag}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border bg-muted/20 px-5 py-2.5 text-[11px]">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-3 w-3 text-brand" />
          Berlin, Hamburg, München
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Smartphone className="h-3 w-3 text-brand" />
          iOS 68 % · Android 29 %
        </span>
      </div>
    </div>
  );
}

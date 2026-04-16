import {
  BarChart3,
  MapPin,
  Smartphone,
  FileDown,
  Bell,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';
import { SectionHeading } from '@/components/ui/section-heading';

export function FeaturesBento() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow tone="primary">Was Spurig kann</SectionEyebrow>
          <SectionHeading
            as="h2"
            className="mt-4"
            accent={<>— aufs Wesentliche reduziert.</>}
          >
            Kampagnen-Tracking
          </SectionHeading>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
            Keine überladenen Dashboards, keine fünfseitigen Feature-Listen.
            Nur die Daten, die wirklich entscheiden, wo dein nächstes Plakat hängt.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-6 sm:grid-rows-[auto_auto] lg:grid-rows-2">
          {/* HERO — Analytics Preview (wide) */}
          <article className="card-lift relative col-span-1 flex flex-col gap-5 overflow-hidden rounded-2xl border border-border bg-card p-6 sm:col-span-6 lg:col-span-4 lg:row-span-2 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
                  <BarChart3 className="h-3 w-3" />
                  Analytics
                </div>
                <h3 className="mt-3 text-[22px] font-semibold tracking-tight sm:text-[24px]">
                  Echtzeit-Analytics, die du verstehst.
                </h3>
                <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                  Scans, Unique Visitors, CTR und Conversions auf einen Blick.
                  Filter nach Zeitraum, Kampagne oder Platzierung — kein
                  Zahlenchaos.
                </p>
              </div>
            </div>

            {/* Mini dashboard preview */}
            <div className="relative mt-auto rounded-xl border border-border bg-background/70 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium">Scans · 14 Tage</span>
                  <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
                    +24 %
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">Live</span>
              </div>
              <svg viewBox="0 0 400 100" className="h-20 w-full sm:h-24" aria-hidden>
                <defs>
                  <linearGradient id="bento-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.28 0.06 265)" stopOpacity="0.30" />
                    <stop offset="100%" stopColor="oklch(0.28 0.06 265)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <g stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2 3">
                  <line x1="0" y1="30" x2="400" y2="30" />
                  <line x1="0" y1="65" x2="400" y2="65" />
                </g>
                <path
                  d="M0,80 L25,75 L50,60 L75,62 L100,45 L125,55 L150,35 L175,42 L200,30 L225,38 L250,22 L275,30 L300,18 L325,25 L350,10 L400,6 L400,100 L0,100 Z"
                  fill="url(#bento-area)"
                />
                <path
                  d="M0,80 L25,75 L50,60 L75,62 L100,45 L125,55 L150,35 L175,42 L200,30 L225,38 L250,22 L275,30 L300,18 L325,25 L350,10 L400,6"
                  fill="none"
                  stroke="oklch(0.28 0.06 265)"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="350" cy="10" r="3" fill="oklch(0.28 0.06 265)" />
              </svg>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-[11px]">
                <div>
                  <div className="text-muted-foreground">Scans</div>
                  <div className="tabular font-semibold">2.847</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Unique</div>
                  <div className="tabular font-semibold">1.912</div>
                </div>
                <div>
                  <div className="text-muted-foreground">CTR</div>
                  <div className="tabular font-semibold">67 %</div>
                </div>
              </div>
            </div>
          </article>

          {/* Geo + Placement */}
          <article className="card-lift relative col-span-1 flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-6 sm:col-span-3 lg:col-span-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="h-4 w-4" />
            </span>
            <h3 className="text-[16px] font-semibold tracking-tight">
              Geo- & Platzierungs-Daten
            </h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Welches Plakat am Bahnhof performt besser als das vor dem Café?
              Du siehst es sofort.
            </p>
            {/* Mini city chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['Berlin 43 %', 'Hamburg 22 %', 'München 18 %', '+ 12'].map((c) => (
                <span
                  key={c}
                  className="tabular rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
          </article>

          {/* Devices */}
          <article className="card-lift relative col-span-1 flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-6 sm:col-span-3 lg:col-span-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Smartphone className="h-4 w-4" />
            </span>
            <h3 className="text-[16px] font-semibold tracking-tight">
              Geräte-Erkennung
            </h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              iOS, Android, Desktop, Wearables — erkenne wer, wo, womit scannt.
            </p>
            {/* Stacked bar */}
            <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: '68%' }} />
              <div className="h-full bg-primary/60" style={{ width: '29%' }} />
              <div className="h-full bg-primary/30" style={{ width: '3%' }} />
            </div>
            <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary" />iOS 68 %</span>
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary/60" />Android 29 %</span>
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary/30" />Desktop 3 %</span>
            </div>
          </article>

          {/* Alerts */}
          <article className="card-lift relative col-span-1 flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-ink text-ink-foreground p-6 sm:col-span-3 lg:col-span-3">
            <div className="absolute inset-0 opacity-40 bg-dot-grid mask-fade-y" aria-hidden />
            <div className="relative">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">
                <Bell className="h-4 w-4" />
              </span>
              <h3 className="mt-3 text-[16px] font-semibold tracking-tight">
                Realtime-Signal statt Monats-Report.
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/70">
                Sobald ein Plakat unerwartet abgeht oder eine Platzierung tot
                ist — du erfährst es zuerst, nicht nächsten Monat.
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-[pulseDot_1.4s_ease-in-out_infinite] rounded-full bg-emerald-400" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[11px] text-white/80">
                  Spike erkannt · Flyer Café-Route · +38 Scans / Std
                </span>
              </div>
            </div>
          </article>

          {/* Exports */}
          <article className="card-lift relative col-span-1 flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-6 sm:col-span-3 lg:col-span-3">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileDown className="h-4 w-4" />
              </span>
              <div className="flex items-center gap-1">
                <span className="rounded-md border border-border bg-background px-2 py-1 text-[10px] font-mono font-medium">
                  CSV
                </span>
                <span className="rounded-md border border-border bg-background px-2 py-1 text-[10px] font-mono font-medium">
                  PDF
                </span>
                <span className="rounded-md border border-border bg-background px-2 py-1 text-[10px] font-mono font-medium">
                  API
                </span>
              </div>
            </div>
            <h3 className="text-[16px] font-semibold tracking-tight">
              Exporte für Chef, Agentur oder Buchhaltung.
            </h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Rohdaten, Monatsreports, PDF-Präsentationen — mit einem Klick.
              Oder direkt per API in dein BI-Tool.
            </p>
          </article>
        </div>

        {/* Footer link */}
        <div className="mt-10 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
          >
            Alle Features ansehen
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Decorative pin */}
        <div className="mt-8 hidden items-center justify-center gap-2 text-[11px] text-muted-foreground sm:flex">
          <Zap className="h-3 w-3 text-primary" />
          <span>Im Plan enthalten · keine Feature-Tiers, kein Add-on-Hustle</span>
        </div>
      </div>
    </section>
  );
}

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
import { SectionHeading } from '@/components/ui/section-heading';
import { AnimatedNumber } from '@/components/shared/animated-number';
import { AnimatedPath } from '@/components/shared/animated-path';

export function FeaturesBento() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <SectionHeading
            as="h2"
            align="left"
          >
            Kampagnen-Tracking, aufs Wesentliche reduziert.
          </SectionHeading>
          <p className="mt-5 text-[16px] leading-relaxed text-muted-foreground sm:text-[17px]">
            Keine überladenen Dashboards, keine fünfseitigen Feature-Listen.
            Nur die Daten, die wirklich entscheiden, wo dein nächstes Plakat hängt.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-6 sm:grid-rows-[auto_auto] lg:grid-rows-2">
          {/* HERO — Analytics Preview (wide) */}
          <article className="card-lift group relative col-span-1 flex flex-col gap-5 overflow-hidden rounded-3xl border border-border bg-card p-6 sm:col-span-6 lg:col-span-4 lg:row-span-2 lg:p-8">
            {/* Subtle brand gradient overlay — intensifies on hover */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-70"
              style={{ background: 'radial-gradient(circle, var(--brand), transparent 70%)' }}
            />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-[var(--shadow-sm)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]">
                  <BarChart3 className="h-4 w-4" />
                </span>
                <h3 className="mt-4 text-[24px] font-semibold tracking-tight sm:text-[26px]">
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
            <div className="relative mt-auto rounded-xl border border-border bg-background/85 p-4 shadow-[var(--shadow-sm)] backdrop-blur">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium">Scans · 14 Tage</span>
                  <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
                    +24 %
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-[pulseDot_1.6s_ease-in-out_infinite] rounded-full bg-emerald-400" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Live
                </span>
              </div>
              <svg viewBox="0 0 400 100" className="h-20 w-full sm:h-24" aria-hidden>
                <defs>
                  <linearGradient id="bento-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.30" />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <g stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2 3">
                  <line x1="0" y1="30" x2="400" y2="30" />
                  <line x1="0" y1="65" x2="400" y2="65" />
                </g>
                <path
                  d="M0,80 L25,75 L50,60 L75,62 L100,45 L125,55 L150,35 L175,42 L200,30 L225,38 L250,22 L275,30 L300,18 L325,25 L350,10 L400,6 L400,100 L0,100 Z"
                  fill="url(#bento-area)"
                  className="opacity-0 animate-[fadeIn_700ms_ease-out_600ms_forwards]"
                />
                <AnimatedPath
                  d="M0,80 L25,75 L50,60 L75,62 L100,45 L125,55 L150,35 L175,42 L200,30 L225,38 L250,22 L275,30 L300,18 L325,25 L350,10 L400,6"
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  duration={1600}
                  delay={200}
                />
                <circle
                  cx="350"
                  cy="10"
                  r="3"
                  fill="var(--brand)"
                  className="opacity-0 animate-[fadeIn_400ms_ease-out_1800ms_forwards]"
                />
              </svg>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-[11px]">
                <div>
                  <div className="text-muted-foreground">Scans</div>
                  <div className="tabular font-semibold">
                    <AnimatedNumber value={2847} triggerOnView duration={1400} delay={200} />
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Unique</div>
                  <div className="tabular font-semibold">
                    <AnimatedNumber value={1912} triggerOnView duration={1400} delay={300} />
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">CTR</div>
                  <div className="tabular font-semibold">
                    <AnimatedNumber
                      value={67}
                      triggerOnView
                      duration={1400}
                      delay={400}
                      suffix=" %"
                    />
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Geo + Placement */}
          <article className="card-lift group relative col-span-1 flex flex-col gap-3 overflow-hidden rounded-3xl border border-border bg-card p-6 sm:col-span-3 lg:col-span-2">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -left-16 h-40 w-40 rounded-full opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
              style={{ background: 'radial-gradient(circle, var(--warm), transparent 70%)' }}
            />
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand transition-all duration-300 group-hover:scale-110 group-hover:bg-brand/15">
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
                  className="tabular rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors group-hover:border-brand/30 group-hover:bg-brand/[0.04] group-hover:text-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
          </article>

          {/* Devices */}
          <article className="card-lift group relative col-span-1 flex flex-col gap-3 overflow-hidden rounded-3xl border border-border bg-card p-6 sm:col-span-3 lg:col-span-2">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand transition-all duration-300 group-hover:scale-110 group-hover:bg-brand/15">
              <Smartphone className="h-4 w-4" />
            </span>
            <h3 className="text-[16px] font-semibold tracking-tight">
              Geräte-Erkennung
            </h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              iOS, Android, Desktop, Wearables — erkenne wer, wo, womit scannt.
            </p>
            {/* Stacked bar — segments grow in sequence */}
            <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full origin-left scale-x-0 bg-primary motion-safe:animate-[barGrow_900ms_cubic-bezier(0.16,1,0.3,1)_forwards] motion-reduce:scale-x-100"
                style={{ width: '68%', animationDelay: '200ms' }}
              />
              <div
                className="h-full origin-left scale-x-0 bg-primary/60 motion-safe:animate-[barGrow_900ms_cubic-bezier(0.16,1,0.3,1)_forwards] motion-reduce:scale-x-100"
                style={{ width: '29%', animationDelay: '350ms' }}
              />
              <div
                className="h-full origin-left scale-x-0 bg-primary/30 motion-safe:animate-[barGrow_900ms_cubic-bezier(0.16,1,0.3,1)_forwards] motion-reduce:scale-x-100"
                style={{ width: '3%', animationDelay: '500ms' }}
              />
            </div>
            <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary" />iOS 68 %</span>
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary/60" />Android 29 %</span>
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary/30" />Desktop 3 %</span>
            </div>
          </article>

          {/* Alerts */}
          <article className="card-lift group relative col-span-1 flex flex-col gap-3 overflow-hidden rounded-3xl border border-border bg-ink text-ink-foreground p-6 sm:col-span-3 lg:col-span-3">
            <div className="absolute inset-0 opacity-30 bg-dot-grid mask-fade-y" aria-hidden />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-55"
              style={{ background: 'radial-gradient(circle, var(--brand), transparent 70%)' }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
            />
            <div className="relative">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white shadow-[inset_0_1px_0_oklch(1_0_0/0.15)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]">
                <Bell className="h-4 w-4" />
              </span>
              <h3 className="mt-3 text-[16px] font-semibold tracking-tight">
                Realtime-Signal statt Monats-Report.
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/70">
                Sobald ein Plakat unerwartet abgeht oder eine Platzierung tot
                ist — du erfährst es zuerst, nicht nächsten Monat.
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 transition-colors group-hover:border-brand/30 group-hover:bg-white/[0.06]">
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
          <article className="card-lift group relative col-span-1 flex flex-col gap-3 overflow-hidden rounded-3xl border border-border bg-card p-6 sm:col-span-3 lg:col-span-3">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-25 blur-2xl transition-opacity duration-500 group-hover:opacity-55"
              style={{ background: 'radial-gradient(circle, var(--brand), transparent 70%)' }}
            />
            <div className="relative flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand transition-all duration-300 group-hover:scale-110 group-hover:bg-brand/15">
                <FileDown className="h-4 w-4" />
              </span>
              <div className="flex items-center gap-1">
                {['CSV', 'PDF', 'API'].map((fmt, i) => (
                  <span
                    key={fmt}
                    className="rounded-md border border-border bg-background px-2 py-1 text-[10px] font-mono font-medium transition-all duration-200 group-hover:border-brand/30 group-hover:bg-brand/[0.04] group-hover:text-brand"
                    style={{ transitionDelay: `${i * 40}ms` }}
                  >
                    {fmt}
                  </span>
                ))}
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
            className="group inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
          >
            Alle Features ansehen
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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

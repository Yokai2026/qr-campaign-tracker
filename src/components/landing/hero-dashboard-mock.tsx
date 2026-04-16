import { ArrowUpRight, MapPin, Smartphone, TrendingUp } from 'lucide-react';

const KPIS = [
  { label: 'Scans heute', value: '2.847', trend: '+12 %', positive: true },
  { label: 'Unique', value: '1.912', trend: '+8 %', positive: true },
  { label: 'CTR', value: '67 %', trend: '+2,1 %', positive: true },
  { label: 'Conversions', value: '184', trend: '+24 %', positive: true },
];

const CAMPAIGNS = [
  { name: 'Sommer-Plakate Berlin', scans: 1243, pct: 84, tag: 'Plakat' },
  { name: 'Flyer Café-Route', scans: 896, pct: 62, tag: 'Flyer' },
  { name: 'Visitenkarte Messe', scans: 412, pct: 28, tag: 'B2B' },
];

export function HeroDashboardMock() {
  return (
    <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      {/* Frame — simulates macOS / browser chrome with depth */}
      <div className="relative rounded-[22px] border border-border/60 bg-card/80 p-1.5 shadow-[var(--shadow-glow)] ring-1 ring-primary/[0.04] backdrop-blur">
        {/* Inner bezel */}
        <div className="overflow-hidden rounded-[15px] border border-border/80 bg-background">
          {/* Minimal app header */}
          <div className="flex items-center justify-between border-b border-border/60 bg-card/30 px-5 py-3">
            <div className="flex items-center gap-2 text-[12px]">
              <span className="font-heading font-semibold text-foreground">Kampagnen</span>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-muted-foreground">Übersicht</span>
            </div>
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="rounded-md border border-border/80 bg-background px-2 py-1 text-[11px] font-medium">
                Letzte 14 Tage
              </span>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 gap-2 border-b border-border/60 p-3 sm:grid-cols-4 sm:gap-3 sm:p-4">
            {KPIS.map((m) => (
              <div
                key={m.label}
                className="rounded-lg border border-border/70 bg-card p-3 sm:p-3.5"
              >
                <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {m.label}
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="tabular text-[22px] font-semibold tracking-tight sm:text-[26px]">
                    {m.value}
                  </span>
                  <span
                    className={
                      'tabular text-[10px] font-semibold ' +
                      (m.positive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-destructive')
                    }
                  >
                    {m.trend}
                  </span>
                </div>
                {/* Sparkline */}
                <svg viewBox="0 0 80 20" className="mt-2 h-5 w-full" aria-hidden>
                  <polyline
                    points="0,16 10,14 20,15 30,10 40,11 50,7 60,8 70,4 80,5"
                    fill="none"
                    stroke="var(--brand)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ))}
          </div>

          {/* Body — chart left, campaigns right */}
          <div className="grid grid-cols-1 gap-0 sm:grid-cols-5">
            {/* Chart card */}
            <div className="col-span-1 border-b border-border/60 p-4 sm:col-span-3 sm:border-b-0 sm:border-r">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] font-medium">Scan-Verlauf</div>
                  <div className="text-[11px] text-muted-foreground">
                    Stündlich · letzte 14 Tage
                  </div>
                </div>
                <div className="hidden items-center gap-3 text-[10px] text-muted-foreground sm:flex">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-3 rounded-full bg-primary" />
                    Scans
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-3 rounded-full border border-dashed border-muted-foreground/40" />
                    Vergleich
                  </span>
                </div>
              </div>
              <svg viewBox="0 0 400 140" className="mt-3 h-28 w-full sm:h-32">
                <defs>
                  <linearGradient id="lp-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* horizontal gridlines */}
                <g stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2 3">
                  <line x1="0" y1="30" x2="400" y2="30" />
                  <line x1="0" y1="70" x2="400" y2="70" />
                  <line x1="0" y1="110" x2="400" y2="110" />
                </g>
                {/* comparison (prev period) */}
                <path
                  d="M0,100 L30,95 L60,92 L90,98 L120,80 L150,88 L180,72 L210,78 L240,64 L270,72 L300,58 L330,65 L360,52 L400,48"
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity="0.25"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
                {/* main area */}
                <path
                  d="M0,110 L30,100 L60,82 L90,90 L120,60 L150,70 L180,40 L210,50 L240,30 L270,44 L300,22 L330,34 L360,14 L400,8 L400,140 L0,140 Z"
                  fill="url(#lp-area)"
                />
                <path
                  d="M0,110 L30,100 L60,82 L90,90 L120,60 L150,70 L180,40 L210,50 L240,30 L270,44 L300,22 L330,34 L360,14 L400,8"
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* highlight dot */}
                <circle cx="360" cy="14" r="3.5" fill="var(--brand)" />
                <circle cx="360" cy="14" r="6" fill="var(--brand)" fillOpacity="0.15" />
              </svg>
            </div>

            {/* Campaigns card */}
            <div className="col-span-1 p-4 sm:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[12px] font-medium">Top-Kampagnen</div>
                <span className="text-[11px] text-muted-foreground">diese Woche</span>
              </div>
              <ul className="space-y-2.5">
                {CAMPAIGNS.map((c) => (
                  <li key={c.name} className="group">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span className="text-[12px] font-medium">{c.name}</span>
                      </div>
                      <span className="tabular text-[11px] font-semibold">
                        {c.scans.toLocaleString('de-DE')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
                          style={{ width: `${c.pct}%` }}
                        />
                      </div>
                      <span className="rounded border border-border/60 bg-muted/40 px-1.5 py-[1px] text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                        {c.tag}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Insight strip */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/60 bg-muted/20 px-5 py-2.5 text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary" />
              Berlin, Hamburg, München
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Smartphone className="h-3 w-3 text-primary" />
              iOS 68 % · Android 29 %
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-primary" />
              Peak · Fr 18 – 20 Uhr
            </span>
            <span className="ml-auto hidden items-center gap-1 text-primary sm:inline-flex">
              Alle Daten ansehen <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}

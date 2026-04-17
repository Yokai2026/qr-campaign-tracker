import { Zap, Cookie, Globe2, Infinity as InfinityIcon } from 'lucide-react';

const STATS = [
  {
    icon: Zap,
    value: '<100ms',
    label: 'Redirect-Antwortzeit',
    note: 'Scan zu Zielseite — kaum spürbar',
  },
  {
    icon: Cookie,
    value: '0',
    label: 'Cookies fürs Tracking',
    note: 'Kein Banner-Zwang, kein Consent-Theater',
  },
  {
    icon: Globe2,
    value: '100%',
    label: 'EU-Hosting',
    note: 'Frankfurt & Falkenstein. Keine US-Provider.',
  },
  {
    icon: InfinityIcon,
    value: 'Unbegrenzt',
    label: 'Kampagnen, Codes & Scans',
    note: 'Keine Volumen-Tarife, keine Drosselung',
  },
];

export function StatsMoment() {
  return (
    <section
      aria-labelledby="stats-heading"
      className="relative overflow-hidden bg-ink py-24 text-ink-foreground sm:py-32"
    >
      {/* Layered backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 60% 70% at 30% 20%, oklch(0.66 0.13 185 / 0.18), transparent 60%), radial-gradient(ellipse 50% 60% at 80% 90%, oklch(0.74 0.13 38 / 0.10), transparent 65%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30 bg-dot-grid mask-fade-y"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/85 backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-[pulseDot_1.6s_ease-in-out_infinite] rounded-full bg-emerald-400" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            In Zahlen
          </span>
          <h2
            id="stats-heading"
            className="mt-5 text-balance font-heading text-[34px] font-semibold leading-[1.08] tracking-[-0.025em] sm:text-[44px]"
          >
            Was Spurig anders macht{' '}
            <span className="text-white/55 font-normal">— in vier Zahlen.</span>
          </h2>
        </div>

        <ul className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <li
              key={s.label}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:bg-white/[0.06] sm:p-6"
              style={{
                animationDelay: `${i * 80}ms`,
              }}
            >
              {/* Hover-reveal corner glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute -top-12 -right-12 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: 'radial-gradient(circle, var(--brand), transparent 70%)' }}
              />

              <div className="relative">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-white/70 transition-colors group-hover:bg-brand/15 group-hover:text-brand">
                  <s.icon className="h-4 w-4" />
                </span>
                <div className="mt-5 tabular-nums text-[40px] font-semibold leading-none tracking-[-0.02em] text-white sm:text-[48px]">
                  {s.value}
                </div>
                <div className="mt-3 text-[13.5px] font-semibold tracking-tight text-white/90">
                  {s.label}
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/55">
                  {s.note}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

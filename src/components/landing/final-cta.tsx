import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const REASSURANCE = [
  'Keine Kreditkarte',
  '14 Tage volle Funktionalität',
  'Jederzeit kündbar',
];

export function FinalCTA() {
  return (
    <section className="relative pb-24 pt-8 sm:pt-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[28px] border border-border bg-ink p-10 text-ink-foreground sm:p-14">
          {/* Layered backdrop */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                'radial-gradient(ellipse 70% 80% at 50% 0%, oklch(0.55 0.17 285 / 0.45), transparent 65%), radial-gradient(ellipse 50% 60% at 20% 100%, oklch(0.60 0.14 240 / 0.30), transparent 70%)',
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-dot-grid opacity-30 mask-fade-y"
          />
          {/* Subtle border highlight */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/80 backdrop-blur">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-[pulseDot_1.4s_ease-in-out_infinite] rounded-full bg-emerald-400" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Jetzt startklar
              </div>

              <h2 className="mt-5 text-balance text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[42px]">
                Starte jetzt,{' '}
                <span className="font-display font-normal italic text-white/90">
                  zahlst du später.
                </span>
              </h2>
              <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-white/70">
                14 Tage volle Funktionalität. Wenn du überzeugt bist, zahlst du
                4,99&nbsp;€ im Monat. Nicht überzeugt? Einfach nichts tun — der
                Account schläft ein.
              </p>

              <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  render={<Link href="/signup" />}
                  className="group min-w-[220px] bg-white text-neutral-900 shadow-lg hover:bg-white/95"
                >
                  Kostenlos starten
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
                <Link
                  href="/pricing"
                  className="text-[13px] font-medium text-white/70 transition-colors hover:text-white"
                >
                  Erst die Preise ansehen →
                </Link>
              </div>

              <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-white/60">
                {REASSURANCE.map((r) => (
                  <li key={r} className="inline-flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-emerald-400" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mini preview card */}
            <div className="relative hidden lg:block">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-[11px] text-white/50">
                  <span>Scan-Verlauf · live</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    live
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="tabular text-[32px] font-semibold tracking-tight">
                    2.847
                  </span>
                  <span className="tabular text-[11px] font-semibold text-emerald-400">
                    +12 %
                  </span>
                </div>
                <svg viewBox="0 0 200 60" className="mt-3 h-14 w-full">
                  <defs>
                    <linearGradient id="cta-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,45 L20,42 L40,35 L60,38 L80,25 L100,30 L120,18 L140,22 L160,10 L180,14 L200,4 L200,60 L0,60 Z"
                    fill="url(#cta-area)"
                  />
                  <path
                    d="M0,45 L20,42 L40,35 L60,38 L80,25 L100,30 L120,18 L140,22 L160,10 L180,14 L200,4"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="mt-2 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-[10px] text-white/60">
                  <div>
                    <div>Unique</div>
                    <div className="tabular font-semibold text-white">1.912</div>
                  </div>
                  <div>
                    <div>CTR</div>
                    <div className="tabular font-semibold text-white">67 %</div>
                  </div>
                  <div>
                    <div>Conv.</div>
                    <div className="tabular font-semibold text-white">184</div>
                  </div>
                </div>
              </div>
              {/* Floating dot */}
              <div
                aria-hidden
                className="absolute -right-3 -top-3 flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-[10px] text-white/80 backdrop-blur"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Neuer Scan · Köln
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

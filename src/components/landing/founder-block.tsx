import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';

const PROOF_POINTS = [
  'Kein VC-Geld, keine fremden Investoren',
  'Server in Frankfurt — DSGVO bei null Aufwand',
  'Eine Person erreichbar, statt Support-Ticket-Schleife',
];

export function FounderBlock() {
  return (
    <section
      aria-labelledby="founder-heading"
      className="relative border-t border-border bg-background py-24 sm:py-32"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-sm)] sm:p-12">
          {/* Decorative warm + brand glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--warm), transparent 70%)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--brand), transparent 70%)' }}
          />

          <div className="relative">
            {/* Avatar + Location */}
            <div className="flex items-center gap-3">
              <div
                aria-hidden
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand to-warm text-[14px] font-semibold tracking-tight text-white shadow-[var(--shadow-md)]"
              >
                DG
              </div>
              <div>
                <div className="text-[14px] font-semibold text-foreground">
                  David da Silva Gornik
                </div>
                <div className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  Gründer · Server in Frankfurt
                </div>
              </div>
            </div>

            {/* Statement */}
            <h2
              id="founder-heading"
              className="mt-7 text-balance text-[22px] font-semibold leading-[1.35] tracking-[-0.015em] text-foreground sm:text-[26px]"
            >
              Spurig ist die Antwort auf die Frage, die mir kein anderes Tool
              ehrlich beantworten konnte:{' '}
              <span className="text-muted-foreground font-normal">
                „Welcher Flyer hat sich wirklich gelohnt?“
              </span>
            </h2>

            <p className="mt-5 text-[14.5px] leading-relaxed text-muted-foreground sm:text-[15.5px]">
              Bitly will dich auf einen 200-€-Plan zwingen, sobald du ernst meinst.
              Google Analytics setzt Cookies, die du dir mit Bannern bezahlst.
              Spurig macht das Gegenteil — ein fairer Preis, keine Cookies, alles
              auf deutschen Servern.
            </p>

            {/* Proof bullets */}
            <ul className="mt-7 space-y-2.5">
              {PROOF_POINTS.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-2.5 text-[14px] text-foreground"
                >
                  <span
                    aria-hidden
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                  />
                  <span>{p}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-[13px] font-medium text-foreground transition-all hover:border-brand/40 hover:text-brand"
              >
                14 Tage testen, ohne Karte
                <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                href="mailto:info@spurig.com"
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Oder kurz schreiben →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Zap, ShieldCheck, Globe, Infinity as InfinityIcon } from 'lucide-react';

const WINS = [
  {
    icon: Zap,
    title: 'Realtime',
    body: 'Erste Scans in Sekunden im Dashboard.',
  },
  {
    icon: ShieldCheck,
    title: 'DSGVO',
    body: 'Privacy-by-Design, Server in Frankfurt.',
  },
  {
    icon: Globe,
    title: 'Eigene Domain',
    body: 'kurz.deinefirma.de statt spurig.com.',
  },
  {
    icon: InfinityIcon,
    title: 'Unbegrenzt',
    body: 'Kampagnen, QR-Codes und Scans inklusive.',
  },
];

export function QuickWinsStrip() {
  return (
    <section
      aria-label="Auf einen Blick"
      className="relative border-b border-border bg-background py-10 sm:py-14"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {WINS.map((w) => (
            <li
              key={w.title}
              className="group relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-border bg-card/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:bg-card hover:shadow-[var(--shadow-md)] sm:p-5"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-10 -right-10 h-20 w-20 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: 'radial-gradient(circle, var(--brand), transparent 70%)' }}
              />
              <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand transition-all duration-300 group-hover:scale-110 group-hover:bg-brand/15">
                <w.icon className="h-4 w-4" />
              </span>
              <div className="relative text-[14px] font-semibold tracking-tight text-foreground sm:text-[15px]">
                {w.title}
              </div>
              <p className="relative text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13px]">
                {w.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

import Link from 'next/link';
import { Globe, Lock, ShieldCheck, ArrowRight, Crown } from 'lucide-react';
import { SectionHeading } from '@/components/ui/section-heading';

function URLBar({
  url,
  variant,
}: {
  url: string;
  variant: 'standard' | 'pro';
}) {
  const isPro = variant === 'pro';
  return (
    <div
      className={
        'flex w-full items-center gap-2 rounded-2xl border px-4 py-3.5 shadow-[var(--shadow-sm)] transition-shadow ' +
        (isPro
          ? 'border-brand/30 bg-card ring-1 ring-brand/10'
          : 'border-border bg-muted/40')
      }
    >
      <Lock
        className={
          'h-3.5 w-3.5 shrink-0 ' +
          (isPro ? 'text-brand' : 'text-muted-foreground')
        }
      />
      <span
        className={
          'truncate font-mono text-[14px] tracking-tight ' +
          (isPro ? 'text-foreground' : 'text-muted-foreground')
        }
      >
        {url}
      </span>
    </div>
  );
}

export function DomainShowcase() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <SectionHeading
            as="h2"
            align="left"
            accent={<>durch die Augen deiner Kunden.</>}
          >
            So sieht dein QR-Code aus
          </SectionHeading>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
            Standard ist in Ordnung. Mit deiner eigenen Domain wirkt der QR-Code
            wie deine Marke — und das Tracking bleibt für Nutzer unsichtbar.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {/* Standard */}
          <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                Standard
              </span>
              <span className="text-[11px] text-muted-foreground">
                Im Plan enthalten
              </span>
            </div>
            <URLBar url="spurig.com/r/a3b2c" variant="standard" />
            <p className="text-[13.5px] leading-relaxed text-muted-foreground">
              Funktioniert sofort, ohne Setup. Sichtbar als{' '}
              <span className="text-foreground">spurig.com</span> — neutral,
              aber nicht deine Marke.
            </p>
          </div>

          {/* Pro */}
          <div className="flex flex-col gap-4 rounded-3xl border border-brand/30 bg-card p-6 ring-1 ring-brand/10 shadow-[var(--shadow-md)] sm:p-8">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                <Crown className="h-3 w-3" />
                Eigene Domain
              </span>
              <span className="text-[11px] text-brand">
                Pro
              </span>
            </div>
            <URLBar url="go.deine-marke.de/a3b2c" variant="pro" />
            <p className="text-[13.5px] leading-relaxed text-muted-foreground">
              Volle Markenwirkung. Subdomain frei wählbar, HTTPS automatisch,
              Tracking läuft im Hintergrund weiter.
            </p>
          </div>
        </div>

        {/* Feature row */}
        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[13px] text-muted-foreground sm:gap-x-10">
          <span className="inline-flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-brand" />
            Jede Subdomain möglich
          </span>
          <span className="inline-flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-brand" />
            HTTPS automatisch
          </span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" />
            Volles Tracking
          </span>
          <Link
            href="/pricing"
            className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-foreground hover:underline"
          >
            Pro ansehen <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}

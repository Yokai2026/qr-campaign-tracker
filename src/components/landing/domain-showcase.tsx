import Link from 'next/link';
import { Crown, Globe, Lock, ShieldCheck, ArrowRight, QrCode } from 'lucide-react';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';
import { SectionHeading } from '@/components/ui/section-heading';

function PhoneFrame({
  url,
  variant,
  label,
}: {
  url: string;
  variant: 'standard' | 'pro';
  label?: string;
}) {
  const isPro = variant === 'pro';
  return (
    <div
      className={
        'relative mx-auto w-[260px] rounded-[2.5rem] border-[8px] border-neutral-950 bg-neutral-950 shadow-2xl ' +
        (isPro ? 'shadow-primary/30' : 'shadow-black/30')
      }
    >
      {/* Notch */}
      <div className="absolute left-1/2 top-[7px] z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-neutral-950" />
      {/* Screen */}
      <div className="overflow-hidden rounded-[2rem] bg-background">
        <div className="h-7 bg-background" />
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
        {/* Page mock */}
        <div className="flex min-h-[340px] flex-col gap-3 p-4">
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
            <div
              className={
                'h-2 rounded-full ' +
                (isPro ? 'w-24 bg-foreground/70' : 'w-20 bg-muted')
              }
            />
          </div>
          <div className="mt-1 space-y-1.5">
            <div className="h-2.5 w-full rounded-full bg-muted" />
            <div className="h-2.5 w-4/5 rounded-full bg-muted" />
            <div className="h-2.5 w-2/3 rounded-full bg-muted" />
          </div>
          {/* Small preview chunk */}
          <div
            className={
              'mt-2 rounded-lg border p-3 ' +
              (isPro
                ? 'border-primary/30 bg-primary/5'
                : 'border-border bg-muted/30')
            }
          >
            <div className="flex items-center justify-between">
              <div className="h-2 w-16 rounded-full bg-foreground/40" />
              <div
                className={
                  'h-4 w-14 rounded-full ' +
                  (isPro ? 'bg-primary' : 'bg-foreground/60')
                }
              />
            </div>
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full rounded-full bg-muted" />
              <div className="h-1.5 w-3/4 rounded-full bg-muted" />
            </div>
          </div>
          <div className="mt-auto text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DomainShowcase() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow tone="amber" icon={<Crown className="h-3 w-3" />}>
            Pro-Feature
          </SectionEyebrow>
          <SectionHeading
            as="h2"
            className="mt-4"
            accent={<>durch die Augen deiner Kunden.</>}
          >
            So sieht dein QR-Code aus —
          </SectionHeading>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
            Standard ist in Ordnung. Mit deiner eigenen Domain wirkt der QR-Code
            wie deine Marke — und das Tracking bleibt für Nutzer unsichtbar.
          </p>
        </div>

        <div className="mt-14 grid items-center gap-10 md:grid-cols-[1fr_auto_1fr]">
          {/* Phone: Standard */}
          <div className="flex flex-col items-center">
            <div className="mb-4 text-center">
              <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Standard
              </div>
              <div className="mt-1 text-[12px] text-muted-foreground">
                Kostenlos · Funktioniert sofort
              </div>
            </div>
            <PhoneFrame url="spurig.com/r/a3b2c" variant="standard" label="Im Plan enthalten" />
          </div>

          {/* Arrow + label */}
          <div className="hidden flex-col items-center justify-center md:flex">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
              <ArrowRight className="h-5 w-5" />
            </div>
            <div className="mt-3 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
                Upgrade
              </div>
              <div className="font-display text-[15px] italic text-muted-foreground">
                eigene Marke
              </div>
            </div>
          </div>

          {/* Phone: Pro */}
          <div className="flex flex-col items-center">
            <div className="mb-4 text-center">
              <div className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <Crown className="h-2.5 w-2.5" />
                Eigene Domain
              </div>
              <div className="mt-1 text-[12px] text-muted-foreground">
                Pro · Deine Marke, nicht unsere
              </div>
            </div>
            <PhoneFrame url="go.deine-marke.de/a3b2c" variant="pro" label="Premium-Wirkung" />
          </div>
        </div>

        {/* Feature Row */}
        <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-2xl border border-border bg-card/60 px-6 py-4 text-[13px] text-muted-foreground backdrop-blur sm:gap-x-10">
          <span className="inline-flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-primary" />
            Jede Subdomain möglich
          </span>
          <span className="hidden h-4 w-px bg-border sm:inline-block" />
          <span className="inline-flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-primary" />
            HTTPS automatisch
          </span>
          <span className="hidden h-4 w-px bg-border sm:inline-block" />
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Volles Tracking
          </span>
          <Link
            href="/pricing"
            className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
          >
            Pro ansehen <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}

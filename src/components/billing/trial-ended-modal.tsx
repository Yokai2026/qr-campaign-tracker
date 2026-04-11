'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, ArrowRight, Check, Download, LogOut, Loader2 } from 'lucide-react';

/**
 * Hard paywall shown when a user's trial has expired and no active subscription
 * exists. Not dismissable — the only way out is to subscribe, export data
 * (DSGVO Art. 20) or log out. Short-link redirects at /r/[code] live outside
 * (dashboard) and are NOT blocked by this modal.
 */
export function TrialEndedModal() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Prevent background scroll while modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function handleContinue() {
    setIsRedirecting(true);
    window.location.href = `/api/checkout?plan=${selectedPlan}`;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-ended-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 px-6 pt-7 pb-5 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/15">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="space-y-1">
            <h2 id="trial-ended-title" className="text-[17px] font-semibold tracking-tight">
              Dein Testzeitraum ist vorbei
            </h2>
            <p className="text-[13px] text-muted-foreground">
              Wähle einen Plan, um Spurig weiter zu nutzen.
            </p>
          </div>
        </div>

        {/* Plans */}
        <div role="radiogroup" aria-label="Plan auswählen" className="space-y-2.5 px-6 pb-4">
          {/* Yearly — featured */}
          <button
            type="button"
            role="radio"
            aria-checked={selectedPlan === 'yearly'}
            onClick={() => setSelectedPlan('yearly')}
            className={`group relative block w-full rounded-lg border-2 p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              selectedPlan === 'yearly'
                ? 'border-primary bg-primary/[0.06]'
                : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
            }`}
          >
            <div className="absolute -top-2.5 left-4 flex items-center gap-1.5">
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                Beliebt · Spare 62 %
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[14px] font-semibold">Jährlich</span>
                  <span className="text-[11px] text-muted-foreground">im Voraus</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-[22px] font-bold tracking-tight">4,99 €</span>
                  <span className="text-[12px] text-muted-foreground">/ Monat</span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  59,88 € jährlich · <span className="line-through">155,88 €</span> gespart
                </p>
              </div>
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${
                  selectedPlan === 'yearly'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-muted-foreground group-hover:border-primary/40 group-hover:text-primary'
                }`}
              >
                <Check className="h-4 w-4" strokeWidth={selectedPlan === 'yearly' ? 3 : 2} />
              </div>
            </div>
          </button>

          {/* Monthly */}
          <button
            type="button"
            role="radio"
            aria-checked={selectedPlan === 'monthly'}
            onClick={() => setSelectedPlan('monthly')}
            className={`group block w-full rounded-lg border-2 p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              selectedPlan === 'monthly'
                ? 'border-primary bg-primary/[0.06]'
                : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[14px] font-semibold">Monatlich</span>
                  <span className="text-[11px] text-muted-foreground">flexibel</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-[22px] font-bold tracking-tight">5,99 €</span>
                  <span className="text-[12px] text-muted-foreground">/ Monat</span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Jederzeit kündbar · <span className="line-through">12,99 €</span> spare 54 %
                </p>
              </div>
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${
                  selectedPlan === 'monthly'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-muted-foreground group-hover:border-primary/40 group-hover:text-primary'
                }`}
              >
                <Check className="h-4 w-4" strokeWidth={selectedPlan === 'monthly' ? 3 : 2} />
              </div>
            </div>
          </button>
        </div>

        {/* Continue CTA */}
        <div className="px-6 pb-5">
          <button
            type="button"
            onClick={handleContinue}
            disabled={isRedirecting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Weiterleitung zu Stripe…
              </>
            ) : (
              <>
                Weiter zum Checkout
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/20 px-6 py-4">
          <p className="mb-3 text-center text-[11px] text-muted-foreground">
            Sichere Abrechnung über Stripe · Keine Einrichtungsgebühr
          </p>
          <div className="flex items-center justify-between text-[12px]">
            <a
              href="/api/export/my-data"
              className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Download className="h-3.5 w-3.5" />
              Daten exportieren
            </a>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

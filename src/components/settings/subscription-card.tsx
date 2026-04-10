'use client';

import { useEffect, useState, useTransition } from 'react';
import { CreditCard, Clock, CheckCircle, AlertTriangle, Crown, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getBillingPortalUrl } from '@/app/(dashboard)/settings/billing-actions';
import type { Subscription } from '@/types';

type Props = {
  subscription: Subscription | null;
  trialEndsAt: string | null;
  checkoutUrls: { monthly: string; yearly: string };
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  active: { label: 'Aktiv', icon: CheckCircle, color: 'text-emerald-600' },
  on_trial: { label: 'Testphase', icon: Clock, color: 'text-blue-600' },
  past_due: { label: 'Zahlung ausstehend', icon: AlertTriangle, color: 'text-amber-600' },
  paused: { label: 'Pausiert', icon: Clock, color: 'text-muted-foreground' },
  cancelled: { label: 'Gekündigt', icon: AlertTriangle, color: 'text-red-600' },
  expired: { label: 'Abgelaufen', icon: AlertTriangle, color: 'text-red-600' },
};

const MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function SubscriptionCard({ subscription, trialEndsAt, checkoutUrls }: Props) {
  const [mounted, setMounted] = useState(false);
  const [isPortalPending, startPortalTransition] = useTransition();
  useEffect(() => setMounted(true), []);

  function openBillingPortal() {
    startPortalTransition(async () => {
      const url = await getBillingPortalUrl();
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Abo-Verwaltung konnte nicht geöffnet werden');
      }
    });
  }

  const hasSub = subscription && ['active', 'on_trial', 'past_due'].includes(subscription.status);
  const trialActive = trialEndsAt && new Date(trialEndsAt) > new Date();
  const isTrialActive = !hasSub && trialActive;

  // Determine billing cycle from stored price_id
  const isYearly = hasSub && subscription?.stripe_price_id && MONTHLY_PRICE_ID
    ? subscription.stripe_price_id !== MONTHLY_PRICE_ID
    : false;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-[14px] font-semibold">Abo & Abrechnung</h2>
      </div>
      <div className="space-y-4 p-5">
        {hasSub ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span className="text-[15px] font-semibold">
                    Spurig {isYearly ? 'Jährlich' : 'Monatlich'}
                  </span>
                </div>
                {(() => {
                  const cfg = STATUS_CONFIG[subscription.status];
                  if (!cfg) return null;
                  const Icon = cfg.icon;
                  return (
                    <div className={`mt-1 flex items-center gap-1 text-[12px] ${cfg.color}`}>
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </div>
                  );
                })()}
              </div>
              <div className="text-right text-[12px] text-muted-foreground">
                {subscription.current_period_end && mounted && (
                  <p>Nächste Zahlung: {formatDate(subscription.current_period_end)}</p>
                )}
                {subscription.trial_ends_at && mounted && subscription.status === 'on_trial' && (
                  <p>Testzeitraum endet am: {formatDate(subscription.trial_ends_at)}</p>
                )}
                {subscription.cancel_at && mounted && (
                  <p className="text-red-600">Endet am: {formatDate(subscription.cancel_at)}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] text-muted-foreground">
                Plan wechseln, Zahlungsmethode ändern oder kündigen.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={openBillingPortal}
                disabled={isPortalPending}
              >
                {isPortalPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Wird geöffnet…
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Abo verwalten
                  </>
                )}
              </Button>
            </div>
          </>
        ) : isTrialActive ? (
          <>
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-[13px] font-medium">
                  Testzeitraum endet am: {mounted && trialEndsAt ? formatDate(trialEndsAt) : '…'}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Nach Ablauf der Testphase kannst du keine neuen QR-Codes oder Links erstellen.
                Bestehende Weiterleitungen bleiben aktiv.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <a href={checkoutUrls.monthly}>
                <Button variant="outline" size="sm" className="w-full">
                  Monatlich — 5,99 €/Mo
                </Button>
              </a>
              <a href={checkoutUrls.yearly}>
                <Button size="sm" className="w-full">
                  Jährlich — 4,99 €/Mo
                </Button>
              </a>
            </div>
            <p className="text-center text-[11px] text-muted-foreground">
              Jährlich spart 16 % (59,88 €/Jahr statt 71,88 €)
            </p>
          </>
        ) : (
          <>
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-900 dark:bg-red-950/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-[13px] font-medium text-red-700 dark:text-red-400">
                  Testphase abgelaufen
                </span>
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Wähle einen Plan, um QR-Codes und Links weiter erstellen zu können.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <a href={checkoutUrls.monthly}>
                <Button variant="outline" size="sm" className="w-full">
                  Monatlich — 5,99 €/Mo
                </Button>
              </a>
              <a href={checkoutUrls.yearly}>
                <Button size="sm" className="w-full">
                  Jährlich — 4,99 €/Mo
                </Button>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useTransition } from 'react';
import { CreditCard, Clock, CheckCircle, AlertTriangle, Crown, ExternalLink, Loader2, Calendar, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getBillingPortalUrl, switchBillingCycle } from '@/app/(dashboard)/settings/billing-actions';
import type { Subscription } from '@/types';

type Props = {
  subscription: Subscription | null;
  trialEndsAt: string | null;
  checkoutUrls: { monthly: string; yearly: string };
};

type StatusKey = 'active' | 'on_trial' | 'past_due' | 'paused' | 'cancelled' | 'expired';

const STATUS_CONFIG: Record<StatusKey, { label: string; icon: typeof CheckCircle; pill: string; dot: string }> = {
  active: {
    label: 'Aktiv',
    icon: CheckCircle,
    pill: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-400',
    dot: 'bg-emerald-400',
  },
  on_trial: {
    label: 'Testversion',
    icon: Clock,
    pill: 'bg-blue-500/10 text-blue-700 ring-1 ring-inset ring-blue-500/20 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  past_due: {
    label: 'Zahlung ausstehend',
    icon: AlertTriangle,
    pill: 'bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/20 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  paused: {
    label: 'Pausiert',
    icon: Clock,
    pill: 'bg-muted text-muted-foreground ring-1 ring-inset ring-border',
    dot: 'bg-muted-foreground',
  },
  cancelled: {
    label: 'Gekündigt',
    icon: AlertTriangle,
    pill: 'bg-red-500/10 text-red-700 ring-1 ring-inset ring-red-500/20 dark:text-red-400',
    dot: 'bg-red-500',
  },
  expired: {
    label: 'Abgelaufen',
    icon: AlertTriangle,
    pill: 'bg-red-500/10 text-red-700 ring-1 ring-inset ring-red-500/20 dark:text-red-400',
    dot: 'bg-red-500',
  },
};

const MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function SubscriptionCard({ subscription, trialEndsAt, checkoutUrls }: Props) {
  const [mounted, setMounted] = useState(false);
  const [isPortalPending, startPortalTransition] = useTransition();
  const [isSwitchPending, startSwitchTransition] = useTransition();
  useEffect(() => setMounted(true), []);

  function openBillingPortal() {
    startPortalTransition(async () => {
      try {
        const url = await getBillingPortalUrl();
        if (url) {
          window.location.href = url;
        } else {
          toast.error('Abo-Verwaltung konnte nicht geöffnet werden');
        }
      } catch {
        toast.error('Abo-Verwaltung konnte nicht geöffnet werden');
      }
    });
  }

  function switchPlan(target: 'monthly' | 'yearly') {
    startSwitchTransition(async () => {
      const result = await switchBillingCycle(target);
      if (result.success) {
        toast.success(target === 'yearly' ? 'Auf Jährlich gewechselt' : 'Auf Monatlich gewechselt');
        // Server-Action revalidiert /settings — Reload zeigt frischen Status.
        window.location.reload();
      } else {
        toast.error(result.error || 'Konnte Plan nicht wechseln');
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
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-[14px] font-semibold">Abo & Abrechnung</h2>
      </div>
      <div className="space-y-4 p-5">
        {hasSub ? (
          <>
            {/* Header row: plan name (big) + status pill */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10">
                    <Crown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[16px] font-semibold leading-tight tracking-tight">
                      Spurig · {isYearly ? 'Jährlich' : 'Monatlich'}
                    </div>
                    <div className="mt-0.5 flex items-baseline gap-1.5">
                      <span className="text-[13px] font-medium tabular-nums">
                        {isYearly ? '4,99 €' : '5,99 €'}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        netto / Monat{isYearly ? ' · jährlich abgerechnet' : ''} · zzgl. 19 % MwSt
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {(() => {
                const cfg = STATUS_CONFIG[subscription.status as StatusKey];
                if (!cfg) return null;
                return (
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.pill}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                );
              })()}
            </div>

            {/* Meta row: next billing, trial end, cancel warning */}
            {mounted && (subscription.current_period_end || subscription.trial_ends_at || subscription.cancel_at) && (
              <dl className="grid gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-[12px] sm:grid-cols-2">
                {subscription.current_period_end && !subscription.cancel_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <dt className="text-muted-foreground">Nächste Abrechnung:</dt>
                    <dd className="font-medium tabular-nums">{formatDateLong(subscription.current_period_end)}</dd>
                  </div>
                )}
                {subscription.trial_ends_at && subscription.status === 'on_trial' && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <dt className="text-muted-foreground">Testphase endet:</dt>
                    <dd className="font-medium tabular-nums">{formatDateLong(subscription.trial_ends_at)}</dd>
                  </div>
                )}
                {subscription.cancel_at && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    <dt className="text-muted-foreground">Läuft aus am:</dt>
                    <dd className="font-medium tabular-nums text-amber-700 dark:text-amber-400">
                      {formatDateLong(subscription.cancel_at)}
                    </dd>
                  </div>
                )}
              </dl>
            )}

            {/* Inline-Plan-Wechsel.
                - Monthly -> Yearly: sofortiger Upgrade mit Stripe-Proration
                  (User zahlt Differenz, kriegt sofort den Yearly-Discount).
                - Yearly -> Monthly: kein Sofort-Switch — User hat ja schon
                  ein ganzes Jahr bezahlt und wuerde Geld verlieren. Wechsel
                  geht stattdessen via "Abo verwalten" zum Periodenende. */}
            {isYearly ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
                <p className="text-[12.5px] font-medium">Auf Monatlich wechseln</p>
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  Du hast das Jahr im Voraus bezahlt. Ein Wechsel zu Monatlich
                  macht erst Sinn, wenn dein Jahr abgelaufen ist
                  {subscription.current_period_end && mounted && (
                    <> (ab {formatDateLong(subscription.current_period_end)})</>
                  )}
                  . Klick dann auf <span className="font-medium">Abo verwalten</span>{' '}
                  und kündige zum Periodenende — danach kannst du frisch monatlich starten.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-medium">Auf Jährlich wechseln · spar 16 %</p>
                    <p className="text-[11.5px] text-muted-foreground">
                      4,99 € netto / Monat · zzgl. 19 % MwSt — jährlich 59,88 € netto + 11,38 € MwSt = 71,26 € brutto.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => switchPlan('yearly')}
                    disabled={isSwitchPending}
                  >
                    {isSwitchPending ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Wechsel läuft…
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
                        Zu Jährlich
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Footer: CTA */}
            <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] text-muted-foreground">
                Zahlungsmethode ändern, Rechnungen ansehen oder kündigen.
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
            <div className="rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2 dark:border-amber-900/50 dark:bg-amber-950/20">
              <p className="text-[11px] text-amber-900 dark:text-amber-300">
                <span className="font-semibold">Einführungspreis:</span> Monatlich für{' '}
                <span className="font-semibold">5,99 € netto</span> statt <span className="line-through">12,99 €</span>{' '}
                · jährlich nur <span className="font-semibold">4,99 € netto / Monat</span> (16 % günstiger). Alle Preise zzgl. 19 % MwSt.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <a href={checkoutUrls.monthly}>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Monatlich — 5,99 € netto</span>
                  <span className="text-[10px] text-muted-foreground">+ MwSt</span>
                </Button>
              </a>
              <a href={checkoutUrls.yearly}>
                <Button variant="brand" size="sm" className="w-full justify-between">
                  <span>Jährlich — 4,99 € netto</span>
                  <span className="rounded bg-white/25 px-1 py-0.5 text-[9px] font-semibold">+ MwSt</span>
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
            <div className="rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2 dark:border-amber-900/50 dark:bg-amber-950/20">
              <p className="text-[11px] text-amber-900 dark:text-amber-300">
                <span className="font-semibold">Einführungspreis:</span> Monatlich für{' '}
                <span className="font-semibold">5,99 € netto</span> statt <span className="line-through">12,99 €</span>{' '}
                · jährlich nur <span className="font-semibold">4,99 € netto / Monat</span> (16 % günstiger). Alle Preise zzgl. 19 % MwSt.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <a href={checkoutUrls.monthly}>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Monatlich — 5,99 € netto</span>
                  <span className="text-[10px] text-muted-foreground">+ MwSt</span>
                </Button>
              </a>
              <a href={checkoutUrls.yearly}>
                <Button variant="brand" size="sm" className="w-full justify-between">
                  <span>Jährlich — 4,99 € netto</span>
                  <span className="rounded bg-white/25 px-1 py-0.5 text-[9px] font-semibold">+ MwSt</span>
                </Button>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

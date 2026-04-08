'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, Clock, CheckCircle, AlertTriangle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Subscription } from '@/types';

type Props = {
  subscription: Subscription | null;
  trialEndsAt: string | null;
  checkoutUrls: { standard: string; pro: string };
};

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  standard: 'Standard',
  pro: 'Pro',
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  active: { label: 'Aktiv', icon: CheckCircle, color: 'text-emerald-600' },
  on_trial: { label: 'Testphase', icon: Clock, color: 'text-blue-600' },
  past_due: { label: 'Zahlung ausstehend', icon: AlertTriangle, color: 'text-amber-600' },
  paused: { label: 'Pausiert', icon: Clock, color: 'text-muted-foreground' },
  cancelled: { label: 'Gekündigt', icon: AlertTriangle, color: 'text-red-600' },
  expired: { label: 'Abgelaufen', icon: AlertTriangle, color: 'text-red-600' },
};

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
}

export function SubscriptionCard({ subscription, trialEndsAt, checkoutUrls }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hasSub = subscription && ['active', 'on_trial', 'past_due'].includes(subscription.status);
  const trialDaysLeft = trialEndsAt ? daysUntil(trialEndsAt) : 0;
  const isTrialActive = !hasSub && trialDaysLeft > 0;
  const isExpired = !hasSub && !isTrialActive;

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
                    {TIER_LABELS[subscription.plan_tier] ?? subscription.plan_tier}
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
                  <p>Nächste Zahlung: {new Date(subscription.current_period_end).toLocaleDateString('de-DE')}</p>
                )}
                {subscription.cancel_at && mounted && (
                  <p className="text-red-600">Endet am: {new Date(subscription.cancel_at).toLocaleDateString('de-DE')}</p>
                )}
              </div>
            </div>
            {subscription.plan_tier !== 'pro' && (
              <a href={checkoutUrls.pro} className="block">
                <Button variant="outline" size="sm" className="w-full">
                  Auf Pro upgraden
                </Button>
              </a>
            )}
          </>
        ) : isTrialActive ? (
          <>
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-[13px] font-medium">
                  Testphase — noch {mounted ? trialDaysLeft : '…'} {trialDaysLeft === 1 ? 'Tag' : 'Tage'}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Nach Ablauf der Testphase kannst du keine neuen QR-Codes oder Links erstellen.
                Bestehende Weiterleitungen bleiben aktiv.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <a href={checkoutUrls.standard}>
                <Button variant="outline" size="sm" className="w-full">
                  Standard — 12,99 €/Mo
                </Button>
              </a>
              <a href={checkoutUrls.pro}>
                <Button size="sm" className="w-full">
                  Pro — 14,99 €/Mo
                </Button>
              </a>
            </div>
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
              <a href={checkoutUrls.standard}>
                <Button variant="outline" size="sm" className="w-full">
                  Standard — 12,99 €/Mo
                </Button>
              </a>
              <a href={checkoutUrls.pro}>
                <Button size="sm" className="w-full">
                  Pro — 14,99 €/Mo
                </Button>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

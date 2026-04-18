import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { Clock, Calendar, CreditCard } from 'lucide-react';

/**
 * Compact billing-status banner for the dashboard.
 * Renders:
 * - Nothing if user has a healthy active subscription > 7 days from renewal
 * - Trial-info if user is on trial (days remaining + CTA)
 * - Renewal-reminder if active subscription renews within 7 days
 * - Expired-CTA if trial ended / subscription lapsed
 */
export async function BillingStatus() {
  noStore();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: sub }, { data: profile }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('status, current_period_end, trial_ends_at')
      .eq('user_id', user.id)
      .in('status', ['active', 'on_trial', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('trial_ends_ats_at')
      .eq('id', user.id)
      .maybeSingle(),
  ]);

  const now = Date.now();
  const daysUntil = (iso: string | null | undefined) =>
    iso ? Math.ceil((new Date(iso).getTime() - now) / 86_400_000) : null;

  const dateFmt = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

  // 1. Stripe trial (on_trial) — highest-priority info
  if (sub?.status === 'on_trial' && sub.trial_ends_at) {
    const days = daysUntil(sub.trial_ends_at);
    const endDate = new Date(sub.trial_ends_at);
    return (
      <BillingBanner
        tone="trial"
        icon={Clock}
        title={days !== null && days > 0 ? `Testphase: Noch ${days} Tag${days === 1 ? '' : 'e'}` : 'Testphase endet heute'}
        desc={`Automatische Umwandlung in ein Abo am ${dateFmt.format(endDate)}.`}
        ctaHref="/settings"
        ctaLabel="Abo verwalten"
      />
    );
  }

  // 2. Active subscription — remind if renewal within 7 days
  if (sub?.status === 'active' && sub.current_period_end) {
    const days = daysUntil(sub.current_period_end);
    if (days !== null && days <= 7 && days >= 0) {
      const endDate = new Date(sub.current_period_end);
      return (
        <BillingBanner
          tone="info"
          icon={Calendar}
          title={`Nächste Abrechnung in ${days} Tag${days === 1 ? '' : 'en'}`}
          desc={`Am ${dateFmt.format(endDate)} wird automatisch abgebucht.`}
          ctaHref="/settings"
          ctaLabel="Rechnungen"
        />
      );
    }
    // Healthy subscription, nothing to show
    return null;
  }

  // 3. Past-due — urgent
  if (sub?.status === 'past_due') {
    return (
      <BillingBanner
        tone="warn"
        icon={CreditCard}
        title="Zahlung fehlgeschlagen"
        desc="Bitte Zahlungsmethode aktualisieren, damit dein Zugang aktiv bleibt."
        ctaHref="/settings"
        ctaLabel="Jetzt aktualisieren"
      />
    );
  }

  // 4. No subscription — check profile trial
  if (profile?.trial_ends_ats_at) {
    const days = daysUntil(profile.trial_ends_ats_at);
    const endDate = new Date(profile.trial_ends_ats_at);

    if (days !== null && days > 0) {
      return (
        <BillingBanner
          tone="trial"
          icon={Clock}
          title={`Testphase: Noch ${days} Tag${days === 1 ? '' : 'e'}`}
          desc={`Endet am ${dateFmt.format(endDate)}. Danach ist der Zugang eingeschränkt.`}
          ctaHref="/pricing"
          ctaLabel="Abo wählen"
        />
      );
    }

    // Trial expired
    return (
      <BillingBanner
        tone="warn"
        icon={Clock}
        title="Testphase abgelaufen"
        desc="Neue QR-Codes und Kurzlinks kannst du erst wieder mit einem Abo erstellen."
        ctaHref="/pricing"
        ctaLabel="Abo abschließen"
      />
    );
  }

  return null;
}

type Tone = 'trial' | 'info' | 'warn';

function BillingBanner({
  tone, icon: Icon, title, desc, ctaHref, ctaLabel,
}: {
  tone: Tone;
  icon: typeof Clock;
  title: string;
  desc: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  const wrapper =
    tone === 'warn'
      ? 'border-destructive/30 bg-destructive/[0.04]'
      : tone === 'trial'
        ? 'border-brand/30 bg-brand/[0.04]'
        : 'border-border bg-card';
  const iconBg =
    tone === 'warn'
      ? 'bg-destructive/10 text-destructive'
      : tone === 'trial'
        ? 'bg-brand/15 text-brand'
        : 'bg-muted text-muted-foreground';
  const ctaClass =
    tone === 'warn'
      ? 'text-destructive hover:underline'
      : 'text-brand hover:underline';

  return (
    <section
      aria-label="Abrechnung"
      className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${wrapper}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </div>
        <div>
          <div className="text-[13.5px] font-semibold">{title}</div>
          <div className="mt-0.5 text-[12.5px] text-muted-foreground">{desc}</div>
        </div>
      </div>
      <Link
        href={ctaHref}
        className={`shrink-0 text-[13px] font-medium ${ctaClass}`}
      >
        {ctaLabel} →
      </Link>
    </section>
  );
}

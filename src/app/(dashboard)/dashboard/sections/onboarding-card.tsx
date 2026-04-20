import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Sparkles, ArrowRight } from 'lucide-react';
import { DismissibleOnboarding } from './dismissible-onboarding';

/**
 * Kompakte Onboarding-Karte für leere Accounts. Ein einziger CTA: erste
 * Kampagne anlegen. Sobald der User eine Kampagne oder einen Scan hat
 * (oder explizit dismisst) verschwindet die Karte dauerhaft.
 */
export async function OnboardingCard() {
  noStore();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ count: campaignCount }, { count: scanCount }, { data: profile }] = await Promise.all([
    supabase.from('campaigns').select('*', { count: 'exact', head: true }),
    supabase.from('redirect_events').select('*', { count: 'exact', head: true }).limit(1),
    supabase.from('profiles').select('onboarding_dismissed_at').eq('id', user.id).maybeSingle(),
  ]);

  const hasData = (campaignCount ?? 0) > 0 || (scanCount ?? 0) > 0;
  const dismissed = Boolean((profile as { onboarding_dismissed_at: string | null } | null)?.onboarding_dismissed_at);

  if (hasData || dismissed) return null;

  return (
    <DismissibleOnboarding>
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.18),var(--shadow-sm)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold">Willkommen bei Spurig</h3>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Leg deine erste Kampagne an — QR-Codes und Kurzlinks baust du darauf auf.
            </p>
          </div>
        </div>
        <Link
          href="/campaigns/new"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-[13px] font-semibold text-brand-foreground shadow-[var(--shadow-sm)] transition-all hover:-translate-y-px hover:brightness-105 sm:self-auto"
        >
          Erste Kampagne anlegen
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </DismissibleOnboarding>
  );
}

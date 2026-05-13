import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Skeleton } from '@/components/ui/skeleton';
import { PrivacyBadge } from '@/components/shared/privacy-badge';
import { LiveScanFeed } from '@/components/shared/live-scan-feed';
import { Tour } from '@/components/onboarding/tour';
import { BillingStatus } from './sections/billing-status';
import { OnboardingCard } from './sections/onboarding-card';
import { Overview } from './sections/overview';
import { Attention } from './sections/attention';
import { TopPerformers } from './sections/top-performers';
import { QrHealthCheck } from './sections/qr-health-check';

function HeroSkeleton() {
  return <Skeleton className="h-96 rounded-2xl" />;
}

function RanksSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-2xl" />
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const profile = await requireAuth();

  // Onboarding-Tour: nur fuer fresh confirmed users (tour_completed_at IS NULL).
  // Username kommt direkt aus dem Profil — kein separater Roundtrip noetig
  // (requireAuth liefert ihn schon).
  const supabase = await createClient();
  const { data: tourProfile } = await supabase
    .from('profiles')
    .select('tour_completed_at, username')
    .eq('id', profile.id)
    .maybeSingle();
  const showTour = tourProfile?.tour_completed_at === null;

  return (
    <div className="space-y-6 animate-in-card">
      {showTour && <Tour username={tourProfile?.username ?? profile.display_name ?? null} autoStart={true} />}
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.015em] sm:text-[26px]">
            Willkommen, {profile.display_name || profile.email}
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Übersicht deiner QR-Kampagnen
          </p>
        </div>
        <PrivacyBadge />
      </div>

      {/* Attention — conditional, nach ganz oben: wenn was brennt soll
          man's VOR allem anderen sehen. Unsichtbar auf healthy accounts. */}
      <Suspense fallback={null}>
        <Attention />
      </Suspense>

      {/* Billing — only renders when relevant */}
      <Suspense fallback={null}>
        <BillingStatus />
      </Suspense>

      {/* Onboarding — only for empty, non-dismissed accounts; one CTA */}
      <Suspense fallback={null}>
        <OnboardingCard />
      </Suspense>

      {/* Übersicht — Hero-Style Dashboard mit KPIs, Verlauf, Top-Kampagnen, Geo/Device/Peak */}
      <Suspense fallback={<HeroSkeleton />}>
        <Overview />
      </Suspense>

      {/* Top Performers — what's actually moving this week */}
      <Suspense fallback={<RanksSkeleton />}>
        <TopPerformers />
      </Suspense>

      {/* QR Health — legacy, conditional */}
      <Suspense fallback={null}>
        <QrHealthCheck />
      </Suspense>

      {/* Live Feed — compact, last */}
      <LiveScanFeed />
    </div>
  );
}

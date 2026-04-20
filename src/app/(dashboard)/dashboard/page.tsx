import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { PrivacyBadge } from '@/components/shared/privacy-badge';
import { LiveScanFeed } from '@/components/shared/live-scan-feed';
import { QuickActions } from './sections/quick-actions';
import { BillingStatus } from './sections/billing-status';
import { OnboardingCard } from './sections/onboarding-card';
import { HeroKpi } from './sections/hero-kpi';
import { Attention } from './sections/attention';
import { TopPerformers } from './sections/top-performers';
import { QrHealthCheck } from './sections/qr-health-check';

function HeroSkeleton() {
  return <Skeleton className="h-60 rounded-2xl" />;
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

  return (
    <div className="space-y-6 animate-in-card">
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

      {/* Billing — only renders when relevant */}
      <Suspense fallback={null}>
        <BillingStatus />
      </Suspense>

      {/* Quick Actions */}
      <QuickActions />

      {/* Onboarding — only for empty, non-dismissed accounts */}
      <Suspense fallback={null}>
        <OnboardingCard />
      </Suspense>

      {/* Hero KPI — the single most important thing above the fold */}
      <Suspense fallback={<HeroSkeleton />}>
        <HeroKpi />
      </Suspense>

      {/* Attention — conditional, invisible on healthy accounts */}
      <Suspense fallback={null}>
        <Attention />
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

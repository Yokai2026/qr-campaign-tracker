import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PrivacyBadge } from '@/components/shared/privacy-badge';
import { LiveScanFeed } from '@/components/shared/live-scan-feed';
import { Tour } from '@/components/onboarding/tour';
import { BillingStatus } from './sections/billing-status';
import { OnboardingCard } from './sections/onboarding-card';
import { Overview } from './sections/overview';
import { Attention } from './sections/attention';
import { TopPerformers } from './sections/top-performers';
import { QrHealthCheck } from './sections/qr-health-check';
import { InsightSummary } from './sections/insight-summary';
import { SevenDayBars } from './sections/seven-day-bars';

function HeroSkeleton() {
  return <Skeleton className="h-96 rounded-2xl" />;
}

function RanksSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-2xl" />
      ))}
    </div>
  );
}

function SevenDaySkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Skeleton className="h-[260px] rounded-2xl" />
      <Skeleton className="h-[260px] rounded-2xl" />
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
    <div className="space-y-8 animate-in-card">
      {showTour && <Tour username={tourProfile?.username ?? profile.display_name ?? null} autoStart={true} />}
      {/* Header — primaerer CTA rechts neben PrivacyBadge: User landet hier
          und soll direkt sehen wie er eine neue Kampagne startet, ohne erst
          in die Sidebar greifen zu muessen. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-[-0.015em] sm:text-[26px]">
            Willkommen, {profile.display_name || profile.email}
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Übersicht deiner QR-Kampagnen
          </p>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <PrivacyBadge />
          <Button variant="brand" size="sm" render={<Link href="/campaigns/new" />}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Neue Kampagne
          </Button>
        </div>
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

      {/* Insight-Banner — "5-Sekunden-Regel": User sieht in einem Satz wie's laeuft.
          Steht VOR dem Hero-Block, damit "wie geht's mir gerade?" sofort beantwortet wird,
          bevor man in Detailzahlen taucht. */}
      <Suspense fallback={<Skeleton className="h-20 rounded-2xl" />}>
        <InsightSummary />
      </Suspense>

      {/* Übersicht — Hero-Style Dashboard mit KPIs, Verlauf, Top-Kampagnen, Geo/Device/Peak */}
      <Suspense fallback={<HeroSkeleton />}>
        <Overview />
      </Suspense>

      {/* 7-Tage-Verlauf — kompakte Bar-Charts (QR-Scans + Link-Klicks).
          Steht vor TopPerformer: erst "wie war meine Woche?", dann "wer war oben"? */}
      <Suspense fallback={<SevenDaySkeleton />}>
        <SevenDayBars />
      </Suspense>

      {/* Top Performers — what's actually moving this week */}
      <Suspense fallback={<RanksSkeleton />}>
        <TopPerformers />
      </Suspense>

      {/* QR Health — legacy, conditional */}
      <Suspense fallback={null}>
        <QrHealthCheck />
      </Suspense>

      {/* Live-Feeds: QR-Scans + Link-Klicks nebeneinander, beide mit
          eigenem Realtime-Channel und "Mehr anzeigen"-Link zum Analytics-Verlauf. */}
      <div className="grid gap-3 md:grid-cols-2">
        <LiveScanFeed source="qr" title="Live Scans" moreHref="/analytics?source=qr" />
        <LiveScanFeed source="link" title="Live Klicks" moreHref="/analytics?source=link" />
      </div>
    </div>
  );
}

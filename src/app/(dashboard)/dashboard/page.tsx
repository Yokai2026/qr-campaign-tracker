import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { KPISkeleton } from '@/components/shared/loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { PrivacyBadge } from '@/components/shared/privacy-badge';
import { PerformanceKPIs } from './sections/performance-kpis';
import { InventoryKPIs } from './sections/inventory-kpis';
import { BottomLists } from './sections/bottom-lists';
import { QrHealthCheck } from './sections/qr-health-check';

function ListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-lg" />
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
          <h1 className="text-lg font-semibold tracking-tight">
            Willkommen, {profile.display_name || profile.email}
          </h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Übersicht deiner QR-Kampagnen
          </p>
        </div>
        <PrivacyBadge />
      </div>

      {/* QR Health Alerts */}
      <Suspense fallback={null}>
        <QrHealthCheck />
      </Suspense>

      {/* Performance KPIs — streamed independently */}
      <Suspense fallback={<KPISkeleton count={4} />}>
        <PerformanceKPIs />
      </Suspense>

      {/* Inventory KPIs — streamed independently */}
      <Suspense fallback={<KPISkeleton count={4} />}>
        <InventoryKPIs />
      </Suspense>

      {/* Bottom lists — streamed independently */}
      <Suspense fallback={<ListSkeleton />}>
        <BottomLists />
      </Suspense>
    </div>
  );
}

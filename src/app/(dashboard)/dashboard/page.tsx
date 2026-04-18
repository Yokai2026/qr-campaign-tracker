import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { KPISkeleton } from '@/components/shared/loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { PrivacyBadge } from '@/components/shared/privacy-badge';
import { PerformanceKPIs } from './sections/performance-kpis';
import { InventoryKPIs } from './sections/inventory-kpis';
import { BottomLists } from './sections/bottom-lists';
import { QrHealthCheck } from './sections/qr-health-check';
import { QuickActions } from './sections/quick-actions';
import { BillingStatus } from './sections/billing-status';

function ListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-2xl" />
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const profile = await requireAuth();

  return (
    <div className="space-y-8 animate-in-card">
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

      {/* Billing status — only renders when relevant (trial, renewal, past-due) */}
      <Suspense fallback={null}>
        <BillingStatus />
      </Suspense>

      {/* Quick Actions — direct access to the four creation flows */}
      <QuickActions />

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

import { unstable_noStore as noStore } from 'next/cache';
import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { FilterToolbar } from '@/components/shared/filter-toolbar';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { PLACEMENT_STATUS_LABELS } from '@/lib/constants';
import { getPlacements, getCampaignsForSelect } from './actions';
import { PlacementsTable } from './placements-table';
import type { PlacementStatus } from '@/types';

// Shell streamt: PageHeader rendert sofort, Filter+Tabelle danach.
export default function PlacementsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="space-y-6 animate-in-card">
      <PageHeader
        title="Platzierungen"
        description="Verwalte alle Platzierungen deiner Kampagnen"
        actionLabel="Neue Platzierung"
        actionHref="/placements/new"
      />
      <Suspense fallback={<TableSkeleton rows={6} cols={4} />}>
        <PlacementsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function PlacementsContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  noStore();
  const params = await searchParams;
  const campaignId =
    typeof params.campaign_id === 'string' ? params.campaign_id : undefined;
  const status =
    typeof params.status === 'string'
      ? (params.status as PlacementStatus)
      : undefined;

  const [placements, campaigns] = await Promise.all([
    getPlacements({ campaign_id: campaignId, status }),
    getCampaignsForSelect(),
  ]);

  return (
    <>
      <FilterToolbar
        filters={[
          {
            key: 'campaign_id',
            label: 'Kampagnen',
            placeholder: 'Alle Kampagnen',
            options: campaigns.map((c) => ({ value: c.id, label: c.name })),
          },
          {
            key: 'status',
            label: 'Status',
            placeholder: 'Alle Status',
            options: Object.entries(PLACEMENT_STATUS_LABELS).map(
              ([value, label]) => ({ value, label }),
            ),
          },
        ]}
      />
      <PlacementsTable data={placements} />
    </>
  );
}

import { unstable_noStore as noStore } from 'next/cache';
import { PageHeader } from '@/components/shared/page-header';
import { FilterToolbar } from '@/components/shared/filter-toolbar';
import { PLACEMENT_STATUS_LABELS } from '@/lib/constants';
import { getPlacements, getCampaignsForSelect } from './actions';
import { PlacementsTable } from './placements-table';
import type { PlacementStatus } from '@/types';

export default async function PlacementsPage({
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
    <div className="space-y-6 animate-in-card">
      <PageHeader
        title="Platzierungen"
        description="Verwalten Sie alle Platzierungen Ihrer Kampagnen."
        actionLabel="Neue Platzierung"
        actionHref="/placements/new"
      />

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
    </div>
  );
}

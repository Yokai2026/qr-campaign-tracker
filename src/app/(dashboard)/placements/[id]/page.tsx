import { Suspense } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import { getPlacement, getCampaignsForSelect, getLocationsForSelect } from '../actions';
import { PlacementDetailTabs } from './placement-detail-tabs';
import { EntityStatsHeader } from '@/components/shared/entity-stats-header';

export default async function PlacementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  noStore();
  const { id } = await params;

  let placement;
  try {
    placement = await getPlacement(id);
  } catch {
    notFound();
  }

  const [campaigns, locations] = await Promise.all([
    getCampaignsForSelect(),
    getLocationsForSelect(),
  ]);

  return (
    <>
      <Suspense fallback={null}>
        <EntityStatsHeader scope={{ kind: 'placement', id }} label="Platzierung" />
      </Suspense>
      <PlacementDetailTabs
        placement={placement}
        campaigns={campaigns}
        locations={locations}
      />
    </>
  );
}

import { Suspense } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import { getLocation } from '../actions';
import { LocationDetailTabs } from './location-detail-tabs';
import { EntityStatsHeader } from '@/components/shared/entity-stats-header';

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  noStore();
  const { id } = await params;

  let data;
  try {
    data = await getLocation(id);
  } catch {
    notFound();
  }

  const placementIds = (data.placements ?? []).map((p: { id: string }) => p.id);

  return (
    <>
      <Suspense fallback={null}>
        <EntityStatsHeader scope={{ kind: 'location', placementIds }} label="Standort" />
      </Suspense>
      <LocationDetailTabs
        location={data.location}
        placements={data.placements}
        placementCount={data.placementCount}
      />
    </>
  );
}

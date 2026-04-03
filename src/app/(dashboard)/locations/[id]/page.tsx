import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import { getLocation } from '../actions';
import { LocationDetailTabs } from './location-detail-tabs';

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

  return (
    <LocationDetailTabs
      location={data.location}
      placements={data.placements}
      placementCount={data.placementCount}
    />
  );
}

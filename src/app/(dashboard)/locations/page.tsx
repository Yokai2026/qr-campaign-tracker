import { unstable_noStore as noStore } from 'next/cache';
import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { FilterToolbar } from '@/components/shared/filter-toolbar';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { LOCATION_TYPE_LABELS } from '@/lib/constants';
import { getLocationsWithPlacements } from './actions';
import { LocationsMasterDetail } from './locations-master-detail';

// Shell streamt: PageHeader rendert sofort, Filter+Cards nach Daten-Fetch.
export default function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string; type?: string }>;
}) {
  return (
    <div className="space-y-6 animate-in-card">
      <PageHeader
        title="Orte & Platzierungen"
        description="Standorte und deren Platzierungen an einem Ort verwalten"
        actionLabel="Neuer Standort"
        actionHref="/locations/new"
      />
      <Suspense fallback={<TableSkeleton rows={6} cols={4} />}>
        <LocationsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function LocationsContent({
  searchParams,
}: {
  searchParams: Promise<{ district?: string; type?: string }>;
}) {
  noStore();
  const { district, type } = await searchParams;
  const allLocations = await getLocationsWithPlacements();

  const districts = Array.from(
    new Set(allLocations.map((l) => l.district).filter(Boolean)),
  ).sort() as string[];

  const types = Array.from(
    new Set(allLocations.map((l) => l.location_type)),
  ).sort();

  let locations = allLocations;
  if (district) {
    locations = locations.filter((l) => l.district === district);
  }
  if (type) {
    locations = locations.filter((l) => l.location_type === type);
  }

  return (
    <>
      <FilterToolbar
        filters={[
          {
            key: 'district',
            label: 'Bezirke',
            placeholder: 'Alle Bezirke',
            options: districts.map((d) => ({ value: d, label: d })),
          },
          {
            key: 'type',
            label: 'Typen',
            placeholder: 'Alle Typen',
            options: types.map((t) => ({
              value: t,
              label: LOCATION_TYPE_LABELS[t] ?? t,
            })),
          },
        ]}
      />
      <LocationsMasterDetail data={locations} />
    </>
  );
}

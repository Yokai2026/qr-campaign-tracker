import { unstable_noStore as noStore } from 'next/cache';
import { getCampaignsForSelect, getLocationsForSelect } from '../actions';
import { PlacementForm } from '../placement-form';
import { PageHeader } from '@/components/shared/page-header';

export default async function NewPlacementPage() {
  noStore();
  const [campaigns, locations] = await Promise.all([
    getCampaignsForSelect(),
    getLocationsForSelect(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Neue Platzierung"
        description="Erstelle eine neue Platzierung für eine Kampagne an einem Standort"
        breadcrumbs={[
          { label: 'Platzierungen', href: '/placements' },
          { label: 'Neue Platzierung' },
        ]}
      />

      <PlacementForm campaigns={campaigns} locations={locations} />
    </div>
  );
}

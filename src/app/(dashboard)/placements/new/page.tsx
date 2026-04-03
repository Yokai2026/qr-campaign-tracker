import { unstable_noStore as noStore } from 'next/cache';
import { getCampaignsForSelect, getLocationsForSelect } from '../actions';
import { PlacementForm } from '../placement-form';

export default async function NewPlacementPage() {
  noStore();
  const [campaigns, locations] = await Promise.all([
    getCampaignsForSelect(),
    getLocationsForSelect(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Neue Platzierung</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Erstellen Sie eine neue Platzierung für eine Kampagne an einem Standort.
        </p>
      </div>

      <PlacementForm campaigns={campaigns} locations={locations} />
    </div>
  );
}

import { unstable_noStore as noStore } from 'next/cache';
import { PageHeader } from '@/components/shared/page-header';
import { getCampaigns } from './actions';
import { CampaignsTable } from './campaigns-table';

export default async function CampaignsPage() {
  noStore();
  const campaigns = await getCampaigns();

  return (
    <div className="space-y-6 animate-in-card">
      <PageHeader
        title="Kampagnen"
        description="Alle Kampagnen verwalten und deren Leistung verfolgen"
        actionLabel="Neue Kampagne"
        actionHref="/campaigns/new"
      />
      <CampaignsTable data={campaigns} />
    </div>
  );
}

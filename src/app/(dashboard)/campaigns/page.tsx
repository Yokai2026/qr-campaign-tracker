import { unstable_noStore as noStore } from 'next/cache';
import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { getCampaigns } from './actions';
import { CampaignsTable } from './campaigns-table';

// Shell rendert sofort, Tabelle streamt in die Suspense-Grenze.
// Spuerbarer "Instant"-Feel beim Tab-Wechsel: PageHeader sichtbar bevor
// die Daten zurueck sind.
export default function CampaignsPage() {
  return (
    <div className="space-y-6 animate-in-card">
      <PageHeader
        title="Kampagnen"
        description="Alle Kampagnen verwalten und deren Leistung verfolgen"
        actionLabel="Neue Kampagne"
        actionHref="/campaigns/new"
      />
      <Suspense fallback={<TableSkeleton rows={6} cols={5} />}>
        <CampaignsContent />
      </Suspense>
    </div>
  );
}

async function CampaignsContent() {
  noStore();
  const campaigns = await getCampaigns();
  return <CampaignsTable data={campaigns} />;
}

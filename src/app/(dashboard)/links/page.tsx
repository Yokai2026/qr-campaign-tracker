import { unstable_noStore as noStore } from 'next/cache';
import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { getShortLinks, getLinkGroups } from './actions';
import { getCampaignsForSelect } from '../placements/actions';
import { LinksPageTabs } from './links-page-tabs';

export default function LinksPage() {
  return (
    <div className="space-y-6 animate-in-card">
      <PageHeader
        title="Kurzlinks"
        description="Erstelle und verwalte trackbare Kurzlinks und Link-Sammlungen."
        action={
          <Button size="sm" render={<Link href="/links/new" />}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Neuer Link
          </Button>
        }
      />
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Links werden geladen...
          </div>
        }
      >
        <LinksContentLoader />
      </Suspense>
    </div>
  );
}

async function LinksContentLoader() {
  noStore();
  const [links, groups, campaigns] = await Promise.all([
    getShortLinks({ archived: false }),
    getLinkGroups(),
    getCampaignsForSelect(),
  ]);

  // Build link count per group
  const linkCountMap: Record<string, number> = {};
  for (const link of links) {
    if (link.link_group_id) {
      linkCountMap[link.link_group_id] = (linkCountMap[link.link_group_id] || 0) + 1;
    }
  }

  return (
    <LinksPageTabs
      links={links}
      groups={groups}
      campaigns={campaigns}
      linkCountMap={linkCountMap}
    />
  );
}

import { unstable_noStore as noStore } from 'next/cache';
import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { getShortLinks, getLinkGroups } from './actions';
import { LinkList } from './link-list';

export default function LinksPage() {
  return (
    <div className="space-y-6 animate-in-card">
      <PageHeader
        title="Kurzlinks"
        description="Erstelle und verwalte trackbare Kurzlinks."
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
        <LinkListLoader />
      </Suspense>
    </div>
  );
}

async function LinkListLoader() {
  noStore();
  const [links, groups] = await Promise.all([
    getShortLinks({ archived: false }),
    getLinkGroups(),
  ]);
  return <LinkList links={links} groups={groups} />;
}

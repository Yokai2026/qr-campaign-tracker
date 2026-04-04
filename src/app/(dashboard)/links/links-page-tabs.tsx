'use client';

import type { ShortLink, LinkGroup } from '@/types';
import { LinkList } from './link-list';
import { LinkGroupManagement } from './link-group-management';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type Campaign = { id: string; name: string };

type LinksPageTabsProps = {
  links: ShortLink[];
  groups: LinkGroup[];
  campaigns: Campaign[];
  linkCountMap: Record<string, number>;
};

export function LinksPageTabs({
  links,
  groups,
  campaigns,
  linkCountMap,
}: LinksPageTabsProps) {
  return (
    <Tabs defaultValue="links">
      <TabsList>
        <TabsTrigger value="links">
          Kurzlinks
          <span className="ml-1 text-[11px] text-muted-foreground tabular-nums">
            {links.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="groups">
          Link-Sammlungen
          <span className="ml-1 text-[11px] text-muted-foreground tabular-nums">
            {groups.length}
          </span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="links">
        <LinkList links={links} groups={groups} />
      </TabsContent>
      <TabsContent value="groups">
        <LinkGroupManagement
          groups={groups}
          campaigns={campaigns}
          linkCountMap={linkCountMap}
        />
      </TabsContent>
    </Tabs>
  );
}

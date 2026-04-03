'use client';

import Link from 'next/link';
import { QrCode, MapPin, BarChart3 } from 'lucide-react';
import { PLACEMENT_STATUS_LABELS, PLACEMENT_TYPE_LABELS, CAMPAIGN_STATUS_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { StatusBadge } from '@/components/shared/status-badge';
import { PageHeader } from '@/components/shared/page-header';
import { KPIStatCard } from '@/components/shared/kpi-stat-card';
import { DetailMetaStrip } from '@/components/shared/detail-meta-strip';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTableShell } from '@/components/shared/data-table-shell';
import { CampaignForm } from '../campaign-form';
import type { CampaignWithTags } from '../actions';
import type { CampaignStatus, Placement, Location } from '@/types';

interface CampaignStats {
  placementCount: number;
  qrCodeCount: number;
  totalScans: number;
}

type PlacementWithLocation = Omit<Placement, 'location'> & {
  location: Location | null;
};

type CampaignDetailClientProps = {
  campaign: CampaignWithTags;
  stats: CampaignStats;
  placements: PlacementWithLocation[];
};

export function CampaignDetailClient({
  campaign,
  stats,
  placements,
}: CampaignDetailClientProps) {
  const defaultValues = {
    name: campaign.name,
    slug: campaign.slug,
    description: campaign.description ?? '',
    status: campaign.status as CampaignStatus,
    start_date: campaign.start_date ?? '',
    end_date: campaign.end_date ?? '',
    tags: campaign.campaign_tags.map((t) => t.tag),
  };

  return (
    <div className="space-y-6 animate-in-card">
      {/* Header */}
      <PageHeader
        title={campaign.name}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Kampagnen', href: '/campaigns' },
          { label: campaign.name },
        ]}
        badge={
          <StatusBadge
            status={campaign.status}
            label={CAMPAIGN_STATUS_LABELS[campaign.status] ?? campaign.status}
          />
        }
      />

      {/* Meta strip */}
      <DetailMetaStrip
        items={[
          { label: 'Slug', value: <code className="font-mono text-xs">{campaign.slug}</code> },
          { label: 'Start', value: formatDate(campaign.start_date) },
          { label: 'Ende', value: formatDate(campaign.end_date) },
          { label: 'Erstellt', value: formatDate(campaign.created_at) },
        ]}
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3 stagger-children">
        <KPIStatCard
          label="Platzierungen"
          value={stats.placementCount}
          icon={MapPin}
          color="blue"
        />
        <KPIStatCard
          label="QR-Codes"
          value={stats.qrCodeCount}
          icon={QrCode}
          color="orange"
        />
        <KPIStatCard
          label="Scans gesamt"
          value={stats.totalScans}
          icon={BarChart3}
          color="pink"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="placements">
            Platzierungen ({placements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <CampaignForm campaignId={campaign.id} defaultValues={defaultValues} />
        </TabsContent>

        <TabsContent value="placements">
          {placements.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="Keine Platzierungen"
              description="Dieser Kampagne wurden noch keine Platzierungen zugeordnet."
            />
          ) : (
            <DataTableShell>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Code</TableHead>
                    <TableHead className="font-semibold">Standort</TableHead>
                    <TableHead className="font-semibold">Typ</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Installiert am</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {placements.map((placement) => (
                    <TableRow key={placement.id} className="group transition-colors hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/placements/${placement.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {placement.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <code className="rounded-md bg-muted/60 px-2 py-0.5 text-xs font-mono text-muted-foreground">
                          {placement.placement_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        {placement.location?.venue_name ?? '\u2013'}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium">
                          {PLACEMENT_TYPE_LABELS[placement.placement_type] ?? placement.placement_type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={placement.status}
                          label={PLACEMENT_STATUS_LABELS[placement.status] ?? placement.status}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(placement.installed_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTableShell>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Plus, ExternalLink, FileText, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { DetailMetaStrip } from '@/components/shared/detail-meta-strip';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { DataTableShell } from '@/components/shared/data-table-shell';
import {
  PLACEMENT_STATUS_LABELS,
  PLACEMENT_TYPE_LABELS,
  QR_ACTION_LABELS,
} from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/format';
import { PlacementForm } from '../placement-form';
import type { Placement, Campaign, Location, QrCode, QrStatusHistory } from '@/types';
import { QrCode as QrCodeIcon } from 'lucide-react';

interface QrCodeWithHistory extends QrCode {
  qr_status_history?: (QrStatusHistory & {
    profile?: { id: string; display_name: string | null; email: string };
  })[];
}

type PlacementDetailTabsProps = {
  placement: Omit<Placement, 'qr_codes'> & {
    campaign: Campaign;
    location: Location;
    qr_codes?: QrCodeWithHistory[];
  };
  campaigns: Pick<Campaign, 'id' | 'name' | 'slug' | 'status'>[];
  locations: Pick<Location, 'id' | 'venue_name' | 'district'>[];
};

export function PlacementDetailTabs({
  placement,
  campaigns,
  locations,
}: PlacementDetailTabsProps) {
  const qrCodes = placement.qr_codes ?? [];

  const allHistory = qrCodes
    .flatMap((qr) =>
      (qr.qr_status_history ?? []).map((h) => ({
        ...h,
        qrShortCode: qr.short_code,
        qrId: qr.id,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  return (
    <div className="space-y-6 animate-in-card">
      {/* Header */}
      <PageHeader
        title={placement.name}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Platzierungen', href: '/placements' },
          { label: placement.name },
        ]}
        badge={
          <StatusBadge
            status={placement.status}
            label={PLACEMENT_STATUS_LABELS[placement.status] ?? placement.status}
          />
        }
        action={
          <Button render={<Link href={`/qr-codes/new?placement_id=${placement.id}`} />}>
            <Plus className="mr-2 h-4 w-4" />
            QR-Code erstellen
          </Button>
        }
      />

      {/* Meta strip */}
      <DetailMetaStrip
        items={[
          {
            label: 'Code',
            value: <code className="font-mono text-xs">{placement.placement_code}</code>,
          },
          {
            label: 'Typ',
            value: PLACEMENT_TYPE_LABELS[placement.placement_type],
          },
          {
            label: 'Kampagne',
            value: (
              <Link href={`/campaigns/${placement.campaign.id}`} className="hover:underline">
                {placement.campaign.name}
              </Link>
            ),
          },
          {
            label: 'Standort',
            value: (
              <Link href={`/locations/${placement.location.id}`} className="hover:underline">
                {placement.location.venue_name}
              </Link>
            ),
          },
          { label: 'Erstellt', value: formatDate(placement.created_at) },
        ]}
      />

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Details
          </TabsTrigger>
          <TabsTrigger value="qr-codes">
            <QrCodeIcon className="mr-1.5 h-3.5 w-3.5" />
            QR-Codes
            {qrCodes.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {qrCodes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-1.5 h-3.5 w-3.5" />
            Verlauf
            {allHistory.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {allHistory.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <div className="mx-auto max-w-2xl">
            <PlacementForm
              campaigns={campaigns}
              locations={locations}
              placement={placement}
            />
          </div>
        </TabsContent>

        {/* QR-Codes Tab */}
        <TabsContent value="qr-codes">
          {qrCodes.length === 0 ? (
            <EmptyState
              icon={QrCodeIcon}
              title="Keine QR-Codes"
              description="Erstellen Sie einen QR-Code für diese Platzierung."
              actionLabel="QR-Code erstellen"
              actionHref={`/qr-codes/new?placement_id=${placement.id}`}
            />
          ) : (
            <DataTableShell>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">Short-Code</TableHead>
                    <TableHead className="font-semibold">Ziel-URL</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Gültig ab</TableHead>
                    <TableHead className="font-semibold">Gültig bis</TableHead>
                    <TableHead className="font-semibold">Notiz</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qrCodes.map((qr) => (
                    <TableRow key={qr.id} className="group transition-colors hover:bg-muted/50">
                      <TableCell>
                        <code className="rounded-md bg-muted/60 px-2 py-0.5 text-xs font-mono text-muted-foreground">
                          {qr.short_code}
                        </code>
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate">
                        <a
                          href={qr.target_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm hover:underline"
                        >
                          {qr.target_url}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={qr.active ? 'active' : 'paused'}
                          label={qr.active ? 'Aktiv' : 'Inaktiv'}
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(qr.valid_from)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(qr.valid_until)}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
                        {qr.note || '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          render={<Link href={`/qr-codes/${qr.id}`} />}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTableShell>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          {allHistory.length === 0 ? (
            <EmptyState
              icon={History}
              title="Kein Verlauf"
              description="Sobald QR-Code-Aktionen stattfinden, erscheint hier der Verlauf."
            />
          ) : (
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>QR-Code Verlauf</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-0">
                  {allHistory.map((entry, index) => (
                    <div key={entry.id} className="flex gap-4 pb-6 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background">
                          <div className="h-2 w-2 rounded-full bg-foreground/40" />
                        </div>
                        {index < allHistory.length - 1 && (
                          <div className="w-px flex-1 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {QR_ACTION_LABELS[entry.action] ?? entry.action}
                          </span>
                          <code className="rounded bg-muted px-1 py-0.5 text-xs">
                            {entry.qrShortCode}
                          </code>
                        </div>
                        {(entry.old_value || entry.new_value) && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {entry.old_value && (
                              <span className="line-through">{entry.old_value}</span>
                            )}
                            {entry.old_value && entry.new_value && ' \u2192 '}
                            {entry.new_value && <span>{entry.new_value}</span>}
                          </p>
                        )}
                        {entry.note && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{entry.note}</p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground/70">
                          {formatDateTime(entry.created_at)}
                          {entry.profile && (
                            <span>
                              {' \u00B7 '}
                              {entry.profile.display_name ?? entry.profile.email}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

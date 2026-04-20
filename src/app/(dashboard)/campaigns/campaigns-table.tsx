'use client';

import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import { Megaphone, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, SortIcon } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { ScanCount } from '@/components/shared/scan-count';
import { CAMPAIGN_STATUS_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { DeleteCampaignButton } from './delete-button';
import type { CampaignWithTagCount } from './actions';

const columns: ColumnDef<CampaignWithTagCount>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <button
        className="inline-flex items-center"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Name
        <SortIcon column={column} />
      </button>
    ),
    cell: ({ row }) => (
      <Link
        href={`/campaigns/${row.original.id}`}
        className="font-semibold text-foreground transition-colors hover:text-brand"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => (
      <code className="rounded-md bg-muted/60 px-2 py-0.5 text-xs font-mono text-muted-foreground">
        {row.original.slug}
      </code>
    ),
  },
  {
    id: 'scans',
    accessorFn: (row) => row.scans_7d,
    header: ({ column }) => (
      <button
        className="inline-flex items-center"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Scans
        <SortIcon column={column} />
      </button>
    ),
    cell: ({ row }) => (
      <ScanCount week={row.original.scans_7d} total={row.original.scans_total} />
    ),
    sortingFn: (a, b) => a.original.scans_7d - b.original.scans_7d,
    meta: { className: 'min-w-[140px]' },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.status}
        label={CAMPAIGN_STATUS_LABELS[row.original.status] ?? row.original.status}
      />
    ),
    filterFn: 'equals',
  },
  {
    accessorKey: 'start_date',
    header: ({ column }) => (
      <button
        className="inline-flex items-center"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Start
        <SortIcon column={column} />
      </button>
    ),
    cell: ({ row }) => (
      <span className="hidden sm:inline text-muted-foreground">
        {formatDate(row.original.start_date)}
      </span>
    ),
    meta: { className: 'hidden sm:table-cell' },
  },
  {
    accessorKey: 'end_date',
    header: 'Ende',
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatDate(row.original.end_date)}
      </span>
    ),
    meta: { className: 'hidden md:table-cell' },
  },
  {
    accessorKey: 'tag_count',
    header: () => <span className="text-right block">Tags</span>,
    cell: ({ row }) => (
      <span className="flex justify-end">
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted/60 px-2 text-xs font-medium">
          {row.original.tag_count}
        </span>
      </span>
    ),
    meta: { className: 'hidden lg:table-cell' },
  },
  {
    id: 'actions',
    header: () => <span className="text-right block">Aktionen</span>,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="outline"
          size="xs"
          render={<Link href={`/campaigns/${row.original.id}`} />}
          title="Bearbeiten"
        >
          <Pencil className="h-3 w-3 sm:mr-1" />
          <span className="hidden sm:inline">Bearbeiten</span>
        </Button>
        <DeleteCampaignButton
          campaignId={row.original.id}
          campaignName={row.original.name}
        />
      </div>
    ),
  },
];

type CampaignsTableProps = {
  data: CampaignWithTagCount[];
};

export function CampaignsTable({ data }: CampaignsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Kampagne suchen..."
      emptyIcon={Megaphone}
      emptyTitle="Keine Kampagnen vorhanden"
      emptyDescription="Erstelle deine erste Kampagne, um loszulegen"
      emptyActionLabel="Neue Kampagne"
      emptyActionHref="/campaigns/new"
      enableColumnVisibility
    />
  );
}

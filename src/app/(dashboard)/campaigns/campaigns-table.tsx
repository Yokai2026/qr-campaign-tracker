'use client';

import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import { Megaphone, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, SortIcon } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
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
        className="font-semibold text-foreground transition-colors hover:text-primary"
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
      <span className="text-muted-foreground">
        {formatDate(row.original.start_date)}
      </span>
    ),
  },
  {
    accessorKey: 'end_date',
    header: 'Ende',
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatDate(row.original.end_date)}
      </span>
    ),
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
        >
          <Pencil className="mr-1 h-3 w-3" />
          Bearbeiten
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
      emptyDescription="Erstellen Sie Ihre erste Kampagne, um loszulegen."
      emptyActionLabel="Neue Kampagne"
      emptyActionHref="/campaigns/new"
      enableColumnVisibility
    />
  );
}

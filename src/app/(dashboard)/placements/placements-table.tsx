'use client';

import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import { MapPin, MoreHorizontal, Pencil, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable, SortIcon } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  PLACEMENT_TYPE_LABELS,
  PLACEMENT_STATUS_LABELS,
} from '@/lib/constants';
import { DeletePlacementButton } from './delete-placement-button';
import type { Placement, Campaign, Location, QrCode as QrCodeType } from '@/types';

type PlacementRow = Placement & {
  campaign?: Pick<Campaign, 'id' | 'name'>;
  location?: Pick<Location, 'id' | 'venue_name' | 'district'>;
  qr_codes?: Pick<QrCodeType, 'id'>[];
};

const columns: ColumnDef<PlacementRow>[] = [
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
        href={`/placements/${row.original.id}`}
        className="font-semibold text-foreground transition-colors hover:text-primary"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'placement_code',
    header: 'Code',
    cell: ({ row }) => (
      <code className="rounded-md bg-muted/60 px-2 py-0.5 text-xs font-mono text-muted-foreground">
        {row.original.placement_code}
      </code>
    ),
  },
  {
    id: 'campaign',
    header: 'Kampagne',
    cell: ({ row }) => (
      <Link
        href={`/campaigns/${row.original.campaign?.id}`}
        className="transition-colors hover:text-primary"
      >
        {row.original.campaign?.name}
      </Link>
    ),
    accessorFn: (row) => row.campaign?.name ?? '',
  },
  {
    id: 'location',
    header: 'Standort',
    cell: ({ row }) => (
      <div>
        <span>{row.original.location?.venue_name}</span>
        {row.original.location?.district && (
          <span className="ml-1 text-xs text-muted-foreground">
            ({row.original.location.district})
          </span>
        )}
      </div>
    ),
    accessorFn: (row) => row.location?.venue_name ?? '',
  },
  {
    accessorKey: 'placement_type',
    header: 'Typ',
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium">
        {PLACEMENT_TYPE_LABELS[row.original.placement_type] ?? row.original.placement_type}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.status}
        label={PLACEMENT_STATUS_LABELS[row.original.status] ?? row.original.status}
      />
    ),
  },
  {
    id: 'qr_count',
    header: () => <span className="text-right block">QR-Codes</span>,
    cell: ({ row }) => (
      <span className="flex justify-end">
        <Badge variant="secondary" className="font-semibold">
          {row.original.qr_codes?.length ?? 0}
        </Badge>
      </span>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 transition-all hover:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Aktionen</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/placements/${row.original.id}`} />}>
            <Pencil className="mr-2 h-4 w-4" />
            Bearbeiten
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={`/qr-codes/new?placement_id=${row.original.id}`} />}>
            <QrCode className="mr-2 h-4 w-4" />
            QR-Code erstellen
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DeletePlacementButton id={row.original.id} name={row.original.name} />
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    meta: { className: 'w-[60px]' },
  },
];

type PlacementsTableProps = {
  data: PlacementRow[];
};

export function PlacementsTable({ data }: PlacementsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Platzierung suchen..."
      emptyIcon={MapPin}
      emptyTitle="Keine Platzierungen vorhanden"
      emptyDescription="Erstellen Sie Ihre erste Platzierung, um QR-Codes zuzuordnen."
      emptyActionLabel="Neue Platzierung"
      emptyActionHref="/placements/new"
    />
  );
}

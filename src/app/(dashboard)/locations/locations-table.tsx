'use client';

import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import { MapPin, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, SortIcon } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { LOCATION_TYPE_LABELS } from '@/lib/constants';
import type { Location } from '@/types';

const columns: ColumnDef<Location>[] = [
  {
    accessorKey: 'venue_name',
    header: ({ column }) => (
      <button
        className="inline-flex items-center"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Ort
        <SortIcon column={column} />
      </button>
    ),
    cell: ({ row }) => (
      <div>
        <Link
          href={`/locations/${row.original.id}`}
          className="font-semibold text-foreground transition-colors hover:text-primary"
        >
          {row.original.venue_name}
        </Link>
        {row.original.address && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {row.original.address}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'district',
    header: 'Bezirk',
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.district || '\u2014'}
      </span>
    ),
    filterFn: 'equals',
  },
  {
    accessorKey: 'location_type',
    header: 'Typ',
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium">
        {LOCATION_TYPE_LABELS[row.original.location_type] ?? row.original.location_type}
      </span>
    ),
    filterFn: 'equals',
  },
  {
    accessorKey: 'active',
    header: 'Aktiv',
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.active ? 'active' : 'archived'}
        label={row.original.active ? 'Aktiv' : 'Inaktiv'}
      />
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="outline"
          size="icon-xs"
          render={<Link href={`/locations/${row.original.id}`} />}
        >
          <Pencil className="h-3.5 w-3.5" />
          <span className="sr-only">Bearbeiten</span>
        </Button>
      </div>
    ),
    meta: { className: 'w-[60px]' },
  },
];

type LocationsTableProps = {
  data: Location[];
};

export function LocationsTable({ data }: LocationsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="venue_name"
      searchPlaceholder="Standort suchen..."
      emptyIcon={MapPin}
      emptyTitle="Keine Standorte gefunden"
      emptyDescription="Erstellen Sie Ihren ersten Standort, um loszulegen."
      emptyActionLabel="Standort erstellen"
      emptyActionHref="/locations/new"
    />
  );
}

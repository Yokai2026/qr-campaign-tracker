'use client';

import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import { MapPin, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, SortIcon } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { ScanCount } from '@/components/shared/scan-count';
import { LOCATION_TYPE_LABELS } from '@/lib/constants';
import type { LocationWithStats } from './actions';

function buildColumns(maxScans7d: number): ColumnDef<LocationWithStats>[] {
  return [
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
      <div className="flex flex-col gap-1 min-w-[180px]">
        <Link
          href={`/locations/${row.original.id}`}
          className="font-semibold text-[13.5px] text-foreground transition-colors hover:text-brand"
        >
          {row.original.venue_name}
        </Link>
        <ScanCount
          week={row.original.scans_7d}
          total={row.original.scans_total}
          trend={row.original.scans_trend}
          percentOfMax={maxScans7d > 0 ? row.original.scans_7d / maxScans7d : null}
          compact
        />
        {row.original.address && (
          <p className="truncate text-[11px] text-muted-foreground/80">
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
    meta: { className: 'hidden sm:table-cell' },
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
    meta: { className: 'hidden md:table-cell' },
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
          title="Bearbeiten"
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
}

type LocationsTableProps = {
  data: LocationWithStats[];
};

export function LocationsTable({ data }: LocationsTableProps) {
  const maxScans7d = data.reduce((max, l) => Math.max(max, l.scans_7d), 0);
  const columns = buildColumns(maxScans7d);
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="venue_name"
      searchPlaceholder="Standort suchen..."
      emptyIcon={MapPin}
      emptyTitle="Keine Standorte gefunden"
      emptyDescription="Erstelle deinen ersten Standort, um loszulegen"
      emptyActionLabel="Standort erstellen"
      emptyActionHref="/locations/new"
      enableColumnVisibility
    />
  );
}

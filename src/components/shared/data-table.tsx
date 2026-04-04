'use client';

import { useState } from 'react';
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Search, SlidersHorizontal } from 'lucide-react';
import { DataTableShell } from './data-table-shell';
import { EmptyState } from './empty-state';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export function SortIcon({ column }: { column: { getIsSorted: () => false | 'asc' | 'desc' } }) {
  const sort = column.getIsSorted();
  if (sort === 'asc') return <ArrowUp className="ml-1 h-3 w-3" />;
  if (sort === 'desc') return <ArrowDown className="ml-1 h-3 w-3" />;
  return <ArrowUpDown className="ml-1 h-3 w-3 opacity-25" />;
}

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  pagination?: boolean;
  pageSize?: number;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  toolbar?: React.ReactNode;
  className?: string;
  enableColumnVisibility?: boolean;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  bulkActions?: (selectedRows: TData[], clearSelection: () => void) => React.ReactNode;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Suchen...',
  pagination: showPagination,
  pageSize = 15,
  emptyIcon,
  emptyTitle = 'Keine Einträge',
  emptyDescription = 'Es wurden keine Einträge gefunden.',
  emptyActionLabel,
  emptyActionHref,
  toolbar,
  className,
  enableColumnVisibility = false,
  enableRowSelection = false,
  onRowSelectionChange,
  bulkActions,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Prepend selection column if enabled
  const allColumns: ColumnDef<TData, TValue>[] = enableRowSelection
    ? [
        {
          id: 'select',
          header: ({ table }) => (
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
              aria-label="Alle auswählen"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(checked) => row.toggleSelected(!!checked)}
              aria-label="Zeile auswählen"
            />
          ),
          enableSorting: false,
          enableHiding: false,
          size: 40,
        } as ColumnDef<TData, TValue>,
        ...columns,
      ]
    : columns;

  const table = useReactTable({
    data,
    columns: allColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(next);
      if (onRowSelectionChange) {
        const selectedRows = Object.keys(next)
          .filter((key) => next[key])
          .map((key) => data[Number(key)])
          .filter(Boolean);
        onRowSelectionChange(selectedRows);
      }
    },
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize },
    },
  });

  function clearSelection() {
    setRowSelection({});
  }

  const selectedRowCount = Object.keys(rowSelection).filter((k) => rowSelection[k]).length;
  const selectedRows = Object.keys(rowSelection)
    .filter((key) => rowSelection[key])
    .map((key) => data[Number(key)])
    .filter(Boolean);

  const shouldPaginate =
    showPagination ?? data.length > pageSize;

  // Toggleable columns (exclude 'select' and columns with enableHiding: false)
  const toggleableColumns = table.getAllColumns().filter(
    (col) => col.id !== 'select' && col.getCanHide()
  );

  const hasSearchOrToolbar = searchKey || toolbar || enableColumnVisibility;

  return (
    <div className={cn('space-y-3', className)}>
      {hasSearchOrToolbar && (
        <div className="flex flex-wrap items-center gap-3">
          {searchKey && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="h-8 pl-9 text-[13px]"
                aria-label={searchPlaceholder}
              />
            </div>
          )}
          {toolbar}
          {enableColumnVisibility && toggleableColumns.length > 0 && (
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto h-8 text-[13px]"
                    aria-label="Spalten ein-/ausblenden"
                  />
                }
              >
                <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                Spalten
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <p className="mb-2 text-[12px] font-medium text-muted-foreground">
                  Sichtbare Spalten
                </p>
                <div className="space-y-1.5">
                  {toggleableColumns.map((col) => {
                    const header = typeof col.columnDef.header === 'string'
                      ? col.columnDef.header
                      : col.id;
                    return (
                      <label
                        key={col.id}
                        className="flex items-center gap-2 rounded-md px-1.5 py-1 text-[13px] hover:bg-muted cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={col.getIsVisible()}
                          onCheckedChange={(checked) => col.toggleVisibility(!!checked)}
                        />
                        <span className="capitalize">{header}</span>
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {enableRowSelection && selectedRowCount > 0 && bulkActions && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
          <span className="text-[13px] font-medium">
            {selectedRowCount} ausgewählt
          </span>
          <div className="flex items-center gap-2">
            {bulkActions(selectedRows, clearSelection)}
          </div>
        </div>
      )}

      {data.length === 0 ? (
        emptyIcon ? (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={emptyActionLabel}
            actionHref={emptyActionHref}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <p className="text-[13px] text-muted-foreground">{emptyDescription}</p>
          </div>
        )
      ) : (
        <>
          <DataTableShell>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="border-b border-border bg-muted/40 hover:bg-muted/40"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="text-[12px] font-medium text-muted-foreground"
                        style={header.column.columnDef.size ? { width: header.column.columnDef.size } : undefined}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={allColumns.length}
                      className="h-20 text-center text-[13px] text-muted-foreground"
                    >
                      Keine Ergebnisse gefunden.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className={cn(
                        'group border-b border-border/60 transition-colors hover:bg-muted/30',
                        row.getIsSelected() && 'bg-primary/5',
                      )}
                      data-state={row.getIsSelected() ? 'selected' : undefined}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="text-[13px]">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DataTableShell>

          {shouldPaginate && (
            <div className="flex items-center justify-between px-1">
              <p className="text-[12px] text-muted-foreground">
                {enableRowSelection && selectedRowCount > 0
                  ? `${selectedRowCount} von ${table.getFilteredRowModel().rows.length} ausgewählt`
                  : `${table.getFilteredRowModel().rows.length} Einträge`}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Erste Seite"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Vorherige Seite"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="px-2 text-[12px] text-muted-foreground">
                  {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Nächste Seite"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  aria-label="Letzte Seite"
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

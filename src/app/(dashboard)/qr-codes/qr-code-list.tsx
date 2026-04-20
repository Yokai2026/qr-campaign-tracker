'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { type ColumnDef } from '@tanstack/react-table';
import {
  QrCode as QrCodeIcon,
  Download,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Trash2,
  MoreVertical,
  Filter,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { subDays, format } from 'date-fns';
import { Sparkline } from '@/components/shared/sparkline';

import type { QrCodeWithMeta } from './actions';
import { toggleQrCode, deleteQrCode } from './actions';
import { computeQrStatus } from '@/lib/qr/status';
import { downloadQrPng, downloadQrSvg } from '@/lib/qr/download';
import { formatDate, truncateUrl } from '@/lib/format';

import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ScanCount } from '@/components/shared/scan-count';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktiv',
  inactive: 'Inaktiv',
  expired: 'Abgelaufen',
};

type QrCodeListProps = {
  qrCodes: QrCodeWithMeta[];
};

export function QrCodeList({ qrCodes }: QrCodeListProps) {
  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [placementFilter, setPlacementFilter] = useState<string>('all');

  // Max 7d-scans in der aktuellen Liste — für relative Performance-Bars
  const maxScans7d = useMemo(
    () => qrCodes.reduce((max, q) => Math.max(max, q.scans_7d ?? 0), 0),
    [qrCodes],
  );

  // Sparkline data: map of qr_code_id -> last 7 days scan counts
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const supabase = createClient();
    const days = 7;
    const from = format(subDays(new Date(), days - 1), 'yyyy-MM-dd') + 'T00:00:00';

    supabase
      .from('redirect_events')
      .select('qr_code_id, created_at')
      .eq('event_type', 'qr_open')
      .eq('is_bot', false)
      .not('qr_code_id', 'is', null)
      .gte('created_at', from)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, Record<string, number>> = {};
        for (const e of data) {
          if (!e.qr_code_id) continue;
          if (!map[e.qr_code_id]) map[e.qr_code_id] = {};
          const day = e.created_at.slice(0, 10);
          map[e.qr_code_id][day] = (map[e.qr_code_id][day] || 0) + 1;
        }
        // Build ordered arrays for each QR code
        const result: Record<string, number[]> = {};
        const today = new Date();
        for (const [qrId, dayMap] of Object.entries(map)) {
          result[qrId] = Array.from({ length: days }, (_, i) => {
            const d = format(subDays(today, days - 1 - i), 'yyyy-MM-dd');
            return dayMap[d] || 0;
          });
        }
        setSparklines(result);
      });
  }, []);

  // Extract unique campaigns and placements
  const campaigns = useMemo(() => {
    const map = new Map<string, string>();
    for (const qr of qrCodes) {
      if (qr.campaign_name) {
        const key = qr.campaign_name;
        if (!map.has(key)) map.set(key, key);
      }
    }
    return Array.from(map.values()).sort();
  }, [qrCodes]);

  const placements = useMemo(() => {
    const map = new Map<string, string>();
    for (const qr of qrCodes) {
      if (qr.placement_name) {
        const key = qr.placement_name;
        if (!map.has(key)) map.set(key, key);
      }
    }
    return Array.from(map.values()).sort();
  }, [qrCodes]);

  // Apply filters
  const filteredQrCodes = useMemo(() => {
    let result = qrCodes;
    if (campaignFilter !== 'all') {
      if (campaignFilter === 'none') {
        result = result.filter((qr) => !qr.campaign_name);
      } else {
        result = result.filter((qr) => qr.campaign_name === campaignFilter);
      }
    }
    if (placementFilter !== 'all') {
      result = result.filter((qr) => qr.placement_name === placementFilter);
    }
    return result;
  }, [qrCodes, campaignFilter, placementFilter]);

  const hasActiveFilter = campaignFilter !== 'all' || placementFilter !== 'all';

  function handleToggle(id: string, currentActive: boolean) {
    setTogglingId(id);
    startTransition(async () => {
      try {
        await toggleQrCode(id, !currentActive);
        toast.success(
          !currentActive ? 'QR-Code aktiviert' : 'QR-Code deaktiviert',
        );
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Fehler beim Umschalten',
        );
      } finally {
        setTogglingId(null);
      }
    });
  }

  function handleDelete(id: string, shortCode: string) {
    // Delete proceeds directly — user already clicked explicit "Löschen" in dropdown
    startTransition(async () => {
      try {
        await deleteQrCode(id);
        toast.success('QR-Code gelöscht');
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Fehler beim Löschen',
        );
      }
    });
  }

  const columns: ColumnDef<QrCodeWithMeta>[] = [
    {
      id: 'qr',
      header: '',
      cell: ({ row }) => (
        <Link href={`/qr-codes/${row.original.id}`}>
          {row.original.qr_png_url ? (
            <Image
              src={row.original.qr_png_url}
              alt={`QR ${row.original.short_code}`}
              width={40}
              height={40}
              className="rounded border"
              unoptimized
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded border bg-muted">
              <QrCodeIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </Link>
      ),
      meta: { className: 'w-16' },
    },
    {
      accessorKey: 'short_code',
      header: 'Short-Code',
      cell: ({ row }) => (
        <Link
          href={`/qr-codes/${row.original.id}`}
          className="font-mono text-sm font-medium hover:underline"
        >
          {row.original.short_code}
        </Link>
      ),
    },
    {
      accessorKey: 'target_url',
      header: 'Ziel-URL',
      cell: ({ row }) => (
        <a
          href={row.original.target_url}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          {truncateUrl(row.original.target_url)}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ),
    },
    {
      id: 'placement',
      header: 'Platzierung',
      cell: ({ row }) => (
        <div className="hidden lg:block">
          <span className="text-sm">{row.original.placement_name ?? '-'}</span>
          {row.original.campaign_name && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({row.original.campaign_name})
            </span>
          )}
        </div>
      ),
      accessorFn: (row) => row.placement_name ?? '',
    },
    {
      id: 'scans',
      accessorFn: (row) => row.scans_7d ?? 0,
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Scans
          {column.getIsSorted() === 'asc' && <span aria-hidden>↑</span>}
          {column.getIsSorted() === 'desc' && <span aria-hidden>↓</span>}
        </button>
      ),
      cell: ({ row }) => (
        <ScanCount
          week={row.original.scans_7d ?? 0}
          total={row.original.scans_total ?? 0}
          trend={row.original.scans_trend ?? null}
          percentOfMax={maxScans7d > 0 ? (row.original.scans_7d ?? 0) / maxScans7d : null}
        />
      ),
      sortingFn: (a, b) => (a.original.scans_7d ?? 0) - (b.original.scans_7d ?? 0),
      meta: { className: 'min-w-[160px]' },
    },
    {
      id: 'trend',
      header: '7-Tage-Verlauf',
      cell: ({ row }) => {
        const data = sparklines[row.original.id];
        if (!data || data.every((v) => v === 0)) return <span className="text-muted-foreground text-xs">-</span>;
        return <Sparkline data={data} width={56} height={20} />;
      },
      meta: { className: 'hidden lg:table-cell w-24' },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = computeQrStatus(row.original);
        return (
          <StatusBadge
            status={status}
            label={STATUS_LABELS[status] ?? status}
          />
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Erstellt',
      cell: ({ row }) => (
        <span className="hidden sm:inline text-sm text-muted-foreground">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="text-right block">Aktionen</span>,
      cell: ({ row }) => {
        const qr = row.original;
        const isToggling = togglingId === qr.id && isPending;

        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleToggle(qr.id, qr.active)}
              disabled={isToggling}
              title={qr.active ? 'Deaktivieren' : 'Aktivieren'}
            >
              {qr.active ? (
                <ToggleRight className="h-4 w-4 text-green-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" title="Aktionen" />
                }
              >
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px]">
                <DropdownMenuItem
                  onClick={() => {
                    if (qr.qr_png_url) {
                      downloadQrPng(qr.qr_png_url, qr.short_code);
                    }
                  }}
                  disabled={!qr.qr_png_url}
                >
                  <Download className="mr-2 h-3.5 w-3.5" />
                  PNG herunterladen
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (qr.qr_svg_url) {
                      downloadQrSvg(qr.qr_svg_url, qr.short_code);
                    }
                  }}
                  disabled={!qr.qr_svg_url}
                >
                  <Download className="mr-2 h-3.5 w-3.5" />
                  SVG herunterladen
                </DropdownMenuItem>
                <ConfirmDialog
                  trigger={
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Löschen
                    </DropdownMenuItem>
                  }
                  title="QR-Code löschen?"
                  description={`Der QR-Code „${qr.short_code}" wird unwiderruflich gelöscht. Alle zugehörigen Scan-Daten gehen verloren.`}
                  confirmLabel="Endgültig löschen"
                  onConfirm={() => handleDelete(qr.id, qr.short_code)}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const filterToolbar = (
    <div className="flex items-center gap-2">
      {campaigns.length > 0 && (
        <Select value={campaignFilter} onValueChange={(v) => setCampaignFilter(v ?? 'all')}>
          <SelectTrigger className="h-8 w-[160px] text-[12px]">
            <Filter className="mr-1.5 h-3 w-3 text-muted-foreground" />
            <SelectValue placeholder="Kampagne" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kampagnen</SelectItem>
            <SelectItem value="none">Ohne Kampagne</SelectItem>
            {campaigns.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {placements.length > 0 && (
        <Select value={placementFilter} onValueChange={(v) => setPlacementFilter(v ?? 'all')}>
          <SelectTrigger className="h-8 w-[160px] text-[12px]">
            <SelectValue placeholder="Platzierung" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Platzierungen</SelectItem>
            {placements.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {hasActiveFilter && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-[12px] text-muted-foreground"
          onClick={() => {
            setCampaignFilter('all');
            setPlacementFilter('all');
          }}
        >
          <X className="mr-1 h-3 w-3" />
          Filter zurücksetzen
        </Button>
      )}
    </div>
  );

  return (
    <DataTable
      columns={columns}
      data={filteredQrCodes}
      searchKey="short_code"
      searchPlaceholder="QR-Code suchen..."
      toolbar={filterToolbar}
      emptyIcon={QrCodeIcon}
      emptyTitle="Keine QR-Codes vorhanden"
      emptyDescription="Erstelle deinen ersten QR-Code, um Weiterleitungen zu tracken"
      emptyActionLabel="Neuer QR-Code"
      emptyActionHref="/qr-codes/new"
      enableColumnVisibility
      enableRowSelection
      bulkActions={(selectedRows, clearSelection) => (
        <>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[12px]"
            onClick={() => {
              selectedRows.forEach((qr) => {
                if (qr.qr_png_url) downloadQrPng(qr.qr_png_url, qr.short_code);
              });
            }}
          >
            <Download className="mr-1.5 h-3 w-3" />
            PNGs herunterladen
          </Button>
          <ConfirmDialog
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[12px] text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-1.5 h-3 w-3" />
                Löschen ({selectedRows.length})
              </Button>
            }
            title={`${selectedRows.length} QR-Code(s) löschen?`}
            description="Alle ausgewählten QR-Codes werden unwiderruflich gelöscht. Zugehörige Scan-Daten gehen verloren."
            confirmLabel="Endgültig löschen"
            onConfirm={async () => {
              for (const qr of selectedRows) {
                await deleteQrCode(qr.id).catch(() => {});
              }
              toast.success(`${selectedRows.length} QR-Code(s) gelöscht`);
              clearSelection();
            }}
          />
        </>
      )}
    />
  );
}

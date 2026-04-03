'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { type ColumnDef } from '@tanstack/react-table';
import {
  QrCode as QrCodeIcon,
  Download,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';

import type { QrCodeWithMeta } from './actions';
import { toggleQrCode } from './actions';
import { computeQrStatus } from '@/lib/qr/status';
import { downloadQrPng, downloadQrSvg } from '@/lib/qr/download';
import { formatDate, truncateUrl } from '@/lib/format';

import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
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
                  <Button variant="ghost" size="icon-sm" title="Herunterladen" />
                }
              >
                <Download className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    if (qr.qr_png_url) {
                      downloadQrPng(qr.qr_png_url, qr.short_code);
                    }
                  }}
                  disabled={!qr.qr_png_url}
                >
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
                  SVG herunterladen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={qrCodes}
      searchKey="short_code"
      searchPlaceholder="QR-Code suchen..."
      emptyIcon={QrCodeIcon}
      emptyTitle="Keine QR-Codes vorhanden"
      emptyDescription="Erstellen Sie Ihren ersten QR-Code, um Weiterleitungen zu tracken."
      emptyActionLabel="Neuer QR-Code"
      emptyActionHref="/qr-codes/new"
    />
  );
}

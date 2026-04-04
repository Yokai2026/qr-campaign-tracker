'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Link2,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Trash2,
  MoreVertical,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

import type { ShortLink, LinkGroup } from '@/types';
import { deleteShortLink, toggleShortLink } from './actions';
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

type LinkListProps = {
  links: ShortLink[];
  groups: LinkGroup[];
};

export function LinkList({ links, groups }: LinkListProps) {
  const [isPending, startTransition] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function handleCopy(shortCode: string, id: string) {
    const url = `${window.location.origin}/r/${shortCode}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Link kopiert');
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleToggle(id: string, currentActive: boolean) {
    startTransition(async () => {
      const result = await toggleShortLink(id, !currentActive);
      if (result.success) {
        toast.success(!currentActive ? 'Link aktiviert' : 'Link deaktiviert');
      } else {
        toast.error(result.error || 'Fehler');
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteShortLink(id);
      if (result.success) {
        toast.success('Link geloescht');
      } else {
        toast.error(result.error || 'Fehler');
      }
    });
  }

  const columns: ColumnDef<ShortLink>[] = [
    {
      accessorKey: 'short_code',
      header: 'Kurzlink',
      cell: ({ row }) => {
        const sl = row.original;
        const isCopied = copiedId === sl.id;
        return (
          <div className="flex items-center gap-2">
            <Link
              href={`/links/${sl.id}`}
              className="flex items-center gap-1.5 font-medium text-[13px] hover:underline"
            >
              <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
              /r/{sl.short_code}
            </Link>
            <button
              onClick={() => handleCopy(sl.short_code, sl.id)}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        );
      },
    },
    {
      accessorKey: 'title',
      header: 'Titel',
      cell: ({ row }) => (
        <span className="text-[13px]">{row.original.title || '–'}</span>
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
          className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
        >
          {truncateUrl(row.original.target_url, 40)}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ),
    },
    {
      accessorKey: 'campaign',
      header: 'Kampagne',
      cell: ({ row }) => (
        <span className="text-[13px] text-muted-foreground">
          {row.original.campaign?.name || '–'}
        </span>
      ),
    },
    {
      accessorKey: 'link_group',
      header: 'Gruppe',
      cell: ({ row }) => {
        const g = row.original.link_group;
        if (!g) return <span className="text-[13px] text-muted-foreground">–</span>;
        return (
          <span className="inline-flex items-center gap-1 text-[12px]">
            <span className="h-2 w-2 rounded-full" style={{ background: g.color }} />
            {g.name}
          </span>
        );
      },
    },
    {
      accessorKey: 'click_count',
      header: 'Klicks',
      cell: ({ row }) => (
        <span className="text-[13px] font-semibold tabular-nums">
          {row.original.click_count.toLocaleString('de-DE')}
        </span>
      ),
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }) => {
        const sl = row.original;
        const isExpired = sl.expires_at && new Date(sl.expires_at) < new Date();
        const status = isExpired ? 'expired' : sl.active ? 'active' : 'inactive';
        const label = isExpired ? 'Abgelaufen' : sl.active ? 'Aktiv' : 'Inaktiv';
        return <StatusBadge status={status} label={label} />;
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Erstellt',
      cell: ({ row }) => (
        <span className="text-[13px] text-muted-foreground tabular-nums">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const sl = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" className="h-7 w-7" disabled={isPending} />}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleToggle(sl.id, sl.active)}>
                {sl.active ? (
                  <><ToggleLeft className="mr-2 h-3.5 w-3.5" /> Deaktivieren</>
                ) : (
                  <><ToggleRight className="mr-2 h-3.5 w-3.5" /> Aktivieren</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleDelete(sl.id)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Loeschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={links}
      searchKey="short_code"
      searchPlaceholder="Kurzlinks durchsuchen..."
    />
  );
}

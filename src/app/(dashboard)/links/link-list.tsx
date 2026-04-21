'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
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
  Filter,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { subDays, format } from 'date-fns';
import { Sparkline } from '@/components/shared/sparkline';

import type { ShortLink, LinkGroup } from '@/types';
import { deleteShortLink, toggleShortLink, type ShortLinkWithStats } from './actions';
import { ScanCount } from '@/components/shared/scan-count';
import { formatDate, truncateUrl } from '@/lib/format';

import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
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

type LinkListProps = {
  links: ShortLinkWithStats[];
  groups: LinkGroup[];
};

export function LinkList({ links, groups }: LinkListProps) {
  const [isPending, startTransition] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');

  // Max 7d-clicks in der aktuellen Liste — für relative Performance-Bars
  const maxClicks7d = useMemo(
    () => links.reduce((max, l) => Math.max(max, l.clicks_7d ?? 0), 0),
    [links],
  );

  // Sparkline data: map of short_link_id -> last 7 days click counts
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const supabase = createClient();
    const days = 7;
    const from = format(subDays(new Date(), days - 1), 'yyyy-MM-dd') + 'T00:00:00';

    supabase
      .from('redirect_events')
      .select('short_link_id, created_at')
      .eq('event_type', 'link_open')
      .eq('is_bot', false)
      .not('short_link_id', 'is', null)
      .gte('created_at', from)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, Record<string, number>> = {};
        for (const e of data) {
          if (!e.short_link_id) continue;
          if (!map[e.short_link_id]) map[e.short_link_id] = {};
          const day = e.created_at.slice(0, 10);
          map[e.short_link_id][day] = (map[e.short_link_id][day] || 0) + 1;
        }
        const result: Record<string, number[]> = {};
        const today = new Date();
        for (const [linkId, dayMap] of Object.entries(map)) {
          result[linkId] = Array.from({ length: days }, (_, i) => {
            const d = format(subDays(today, days - 1 - i), 'yyyy-MM-dd');
            return dayMap[d] || 0;
          });
        }
        setSparklines(result);
      });
  }, []);

  // Extract unique campaigns from links
  const campaigns = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of links) {
      if (l.campaign) map.set(l.campaign.id, l.campaign.name);
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [links]);

  // Apply filters
  const filteredLinks = useMemo(() => {
    let result = links;
    if (groupFilter !== 'all') {
      if (groupFilter === 'none') {
        result = result.filter((l) => !l.link_group_id);
      } else {
        result = result.filter((l) => l.link_group_id === groupFilter);
      }
    }
    if (campaignFilter !== 'all') {
      if (campaignFilter === 'none') {
        result = result.filter((l) => !l.campaign_id);
      } else {
        result = result.filter((l) => l.campaign_id === campaignFilter);
      }
    }
    return result;
  }, [links, groupFilter, campaignFilter]);

  const hasActiveFilter = groupFilter !== 'all' || campaignFilter !== 'all';

  function handleCopy(sl: ShortLink) {
    const url = sl.short_host
      ? `https://${sl.short_host}/${sl.short_code}`
      : `${window.location.origin}/r/${sl.short_code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(sl.id);
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
        toast.success('Link gelöscht');
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
        const sl = row.original as ShortLinkWithStats;
        const isCopied = copiedId === sl.id;
        const displayPath = sl.short_host
          ? `${sl.short_host}/${sl.short_code}`
          : `/r/${sl.short_code}`;
        return (
          <div className="flex flex-col gap-1 min-w-[180px]">
            <div className="flex items-center gap-2">
              <Link
                href={`/links/${sl.id}`}
                className="flex items-center gap-1.5 font-medium text-[13px] hover:underline"
                title={sl.short_host ? `Eigene Domain: ${sl.short_host}` : undefined}
              >
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                {displayPath}
              </Link>
              <button
                onClick={() => handleCopy(sl)}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {isCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <ScanCount
              week={sl.clicks_7d ?? 0}
              total={sl.clicks_total ?? 0}
              weekLabel="Klicks"
              trend={sl.clicks_trend ?? null}
              percentOfMax={maxClicks7d > 0 ? (sl.clicks_7d ?? 0) / maxClicks7d : null}
              compact
            />
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
      header: 'Sammlung',
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
      id: 'trend',
      header: '7-Tage-Verlauf',
      cell: ({ row }) => {
        const data = sparklines[row.original.id];
        if (!data || data.every((v) => v === 0)) return <span className="text-muted-foreground text-xs">-</span>;
        return <Sparkline data={data} width={56} height={20} color="oklch(0.60 0.10 165)" />;
      },
      meta: { className: 'hidden lg:table-cell w-24' },
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
              render={<Button variant="ghost" size="icon" className="h-7 w-7" disabled={isPending} title="Aktionen" />}
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
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const filterToolbar = (
    <div className="flex items-center gap-2">
      {groups.length > 0 && (
        <Select value={groupFilter} onValueChange={(v) => setGroupFilter(v ?? 'all')}>
          <SelectTrigger className="h-8 w-[160px] text-[12px]">
            <Filter className="mr-1.5 h-3 w-3 text-muted-foreground" />
            <SelectValue placeholder="Sammlung" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Sammlungen</SelectItem>
            <SelectItem value="none">Ohne Sammlung</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: g.color }} />
                  {g.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {campaigns.length > 0 && (
        <Select value={campaignFilter} onValueChange={(v) => setCampaignFilter(v ?? 'all')}>
          <SelectTrigger className="h-8 w-[160px] text-[12px]">
            <SelectValue placeholder="Kampagne" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kampagnen</SelectItem>
            <SelectItem value="none">Ohne Kampagne</SelectItem>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
            setGroupFilter('all');
            setCampaignFilter('all');
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
      data={filteredLinks}
      searchKey="short_code"
      searchPlaceholder="Kurzlinks durchsuchen..."
      toolbar={filterToolbar}
      emptyIcon={Link2}
      emptyTitle="Keine Kurzlinks vorhanden"
      emptyDescription="Erstelle deinen ersten trackbaren Kurzlink — perfekt für Social Media, E-Mail oder digitale Kampagnen."
      emptyActionLabel="Neuer Kurzlink"
      emptyActionHref="/links/new"
    />
  );
}

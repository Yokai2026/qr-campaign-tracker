'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Pencil,
  Plus,
  QrCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { ScanCount } from '@/components/shared/scan-count';
import {
  LOCATION_TYPE_LABELS,
  PLACEMENT_TYPE_LABELS,
  PLACEMENT_STATUS_LABELS,
} from '@/lib/constants';
import type {
  LocationWithPlacements,
  PlacementSummary,
} from './actions';

type Props = {
  data: LocationWithPlacements[];
};

export function LocationsMasterDetail({ data }: Props) {
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    // Aktivste Standorte initial offen (max. 3).
    return new Set(data.slice(0, 3).filter((l) => l.placement_count > 0).map((l) => l.id));
  });

  const maxScans7d = useMemo(
    () => data.reduce((max, l) => Math.max(max, l.scans_7d), 0),
    [data],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((l) => {
      if (l.venue_name.toLowerCase().includes(q)) return true;
      if (l.district?.toLowerCase().includes(q)) return true;
      if (l.address?.toLowerCase().includes(q)) return true;
      return l.placements.some((p) => p.name.toLowerCase().includes(q));
    });
  }, [data, query]);

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    setOpenIds(new Set(filtered.map((l) => l.id)));
  }

  function collapseAll() {
    setOpenIds(new Set());
  }

  if (data.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Standort oder Platzierung suchen..."
          className="h-9 w-full max-w-sm rounded-md border border-border bg-background px-3 text-[13px] outline-none ring-offset-background placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-brand/30"
        />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            Alle ausklappen
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            Alle einklappen
          </Button>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-[13px] text-muted-foreground">
            Keine Treffer für &bdquo;{query}&ldquo;.
          </div>
        ) : (
          filtered.map((loc) => (
            <LocationCard
              key={loc.id}
              loc={loc}
              isOpen={openIds.has(loc.id)}
              onToggle={() => toggle(loc.id)}
              maxScans7d={maxScans7d}
            />
          ))
        )}
      </div>
    </div>
  );
}

function LocationCard({
  loc,
  isOpen,
  onToggle,
  maxScans7d,
}: {
  loc: LocationWithPlacements;
  isOpen: boolean;
  onToggle: () => void;
  maxScans7d: number;
}) {
  const hasPlacements = loc.placement_count > 0;
  const Chevron = isOpen ? ChevronDown : ChevronRight;
  return (
    <div
      className={cn(
        'rounded-2xl border bg-card transition-colors',
        isOpen ? 'border-border' : 'border-border/70 hover:border-border',
      )}
    >
      {/* Header — clickable to toggle */}
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="flex flex-1 items-start gap-3 text-left min-w-0"
        >
          <Chevron
            className={cn(
              'mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors',
              !hasPlacements && 'opacity-30',
            )}
          />
          <div className="flex flex-1 flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-heading text-[15px] font-semibold tracking-tight text-foreground">
                {loc.venue_name}
              </span>
              {loc.district && (
                <span className="text-[12px] text-muted-foreground">
                  · {loc.district}
                </span>
              )}
              <span className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                {LOCATION_TYPE_LABELS[loc.location_type] ?? loc.location_type}
              </span>
              {!loc.active && (
                <StatusBadge status="archived" label="Inaktiv" />
              )}
            </div>
            {loc.address && (
              <p className="truncate text-[12px] text-muted-foreground/80">
                {loc.address}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <ScanCount
                week={loc.scans_7d}
                total={loc.scans_total}
                trend={loc.scans_trend}
                percentOfMax={maxScans7d > 0 ? loc.scans_7d / maxScans7d : null}
                compact
              />
              <span className="text-[11.5px] text-muted-foreground">
                {loc.placement_count === 0
                  ? 'Keine Platzierungen'
                  : `${loc.placement_count} ${loc.placement_count === 1 ? 'Platzierung' : 'Platzierungen'}`}
              </span>
            </div>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5"
            title="Platzierung hinzufügen"
            render={<Link href={`/placements/new?location_id=${loc.id}`} />}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Platzierung
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            title="Standort bearbeiten"
            render={<Link href={`/locations/${loc.id}`} />}
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="sr-only">Standort bearbeiten</span>
          </Button>
        </div>
      </div>

      {/* Sub-list */}
      {isOpen && (
        <div className="border-t border-border/60 bg-muted/10 px-4 py-3">
          {hasPlacements ? (
            <ul className="space-y-1.5">
              {loc.placements.map((p) => (
                <PlacementRow key={p.id} placement={p} />
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-start gap-2 py-2 text-[12.5px] text-muted-foreground">
              <p>Noch keine Platzierungen für diesen Standort.</p>
              <Button
                variant="brand"
                size="sm"
                render={<Link href={`/placements/new?location_id=${loc.id}`} />}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Erste Platzierung anlegen
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlacementRow({ placement: p }: { placement: PlacementSummary }) {
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/placements/${p.id}`}
            className="font-medium text-[13.5px] text-foreground transition-colors hover:text-brand"
          >
            {p.name}
          </Link>
          <span className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground">
            {PLACEMENT_TYPE_LABELS[p.placement_type] ?? p.placement_type}
          </span>
          <StatusBadge
            status={p.status}
            label={PLACEMENT_STATUS_LABELS[p.status] ?? p.status}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground">
          {p.campaign && (
            <Link
              href={`/campaigns/${p.campaign.id}`}
              className="transition-colors hover:text-brand"
            >
              {p.campaign.name}
            </Link>
          )}
          <code className="rounded bg-muted/60 px-1.5 py-[1px] font-mono text-[11px] text-muted-foreground">
            {p.placement_code}
          </code>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <ScanCount
          week={p.scans_7d}
          total={p.scans_total}
          trend={p.scans_trend}
          compact
        />
        <Badge variant="secondary" className="font-semibold tabular-nums">
          {p.qr_count} QR
        </Badge>
        <Button
          variant="ghost"
          size="icon-xs"
          title="QR-Code erstellen"
          render={<Link href={`/qr-codes/new?placement_id=${p.id}`} />}
        >
          <QrCode className="h-3.5 w-3.5" />
          <span className="sr-only">QR-Code erstellen</span>
        </Button>
      </div>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
        <MapPin className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-[15px] font-semibold tracking-tight">
        Noch keine Standorte
      </h3>
      <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">
        Lege einen Standort an (z.B. &bdquo;Café Berlin Mitte&ldquo;), um dann Platzierungen
        wie &bdquo;Plakat im Eingang&ldquo; mit QR-Codes zu verknüpfen.
      </p>
      <Button
        variant="brand"
        size="sm"
        className="mt-4"
        render={<Link href="/locations/new" />}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Standort erstellen
      </Button>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Megaphone,
  MapPin,
  ClipboardList,
  QrCode,
  Link2,
  BarChart3,
  Settings,
  Plus,
  ArrowRight,
} from 'lucide-react';

type SearchItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  kind: 'campaign' | 'placement' | 'location' | 'qr_code' | 'link';
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Global keyboard shortcut: Cmd+K / Ctrl+K + custom event
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('open-command-palette', onOpenEvent);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('open-command-palette', onOpenEvent);
    };
  }, []);

  // Load searchable data on first open
  const loadData = useCallback(async () => {
    if (loaded) return;
    const supabase = createClient();

    const [campaigns, placements, locations, qrCodes, shortLinks] = await Promise.all([
      supabase.from('campaigns').select('id, name, slug').order('updated_at', { ascending: false }).limit(50),
      supabase.from('placements').select('id, name, placement_code').order('created_at', { ascending: false }).limit(50),
      supabase.from('locations').select('id, venue_name, district').order('created_at', { ascending: false }).limit(50),
      supabase.from('qr_codes').select('id, short_code, label').order('created_at', { ascending: false }).limit(50),
      supabase.from('short_links').select('id, short_code, title').eq('archived', false).order('created_at', { ascending: false }).limit(50),
    ]);

    const merged: SearchItem[] = [
      ...(campaigns.data ?? []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        title: c.name as string,
        subtitle: c.slug as string,
        href: `/campaigns/${c.id}`,
        kind: 'campaign' as const,
      })),
      ...(placements.data ?? []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        title: p.name as string,
        subtitle: p.placement_code as string,
        href: `/placements/${p.id}`,
        kind: 'placement' as const,
      })),
      ...(locations.data ?? []).map((l: Record<string, unknown>) => ({
        id: l.id as string,
        title: l.venue_name as string,
        subtitle: (l.district as string) || undefined,
        href: `/locations/${l.id}`,
        kind: 'location' as const,
      })),
      ...(qrCodes.data ?? []).map((q: Record<string, unknown>) => ({
        id: q.id as string,
        title: (q.label as string) || (q.short_code as string),
        subtitle: q.short_code as string,
        href: `/qr-codes/${q.id}`,
        kind: 'qr_code' as const,
      })),
      ...(shortLinks.data ?? []).map((s: Record<string, unknown>) => ({
        id: s.id as string,
        title: (s.title as string) || (s.short_code as string),
        subtitle: `/r/${s.short_code as string}`,
        href: `/links/${s.id}`,
        kind: 'link' as const,
      })),
    ];

    setItems(merged);
    setLoaded(true);
  }, [loaded]);

  useEffect(() => {
    if (open) loadData();
  }, [open, loadData]);

  function runCommand(href: string) {
    setOpen(false);
    router.push(href);
  }

  const kindConfig = {
    campaign: { icon: Megaphone, label: 'Kampagnen' },
    placement: { icon: ClipboardList, label: 'Platzierungen' },
    location: { icon: MapPin, label: 'Standorte' },
    qr_code: { icon: QrCode, label: 'QR-Codes' },
    link: { icon: Link2, label: 'Kurzlinks' },
  } as const;

  // Group items by kind for display
  const grouped = items.reduce<Record<SearchItem['kind'], SearchItem[]>>(
    (acc, item) => {
      if (!acc[item.kind]) acc[item.kind] = [];
      acc[item.kind].push(item);
      return acc;
    },
    {} as Record<SearchItem['kind'], SearchItem[]>,
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Kampagne, Link, Platzierung suchen …" />
      <CommandList>
        <CommandEmpty>Keine Treffer</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand('/dashboard')}>
            <LayoutDashboard />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand('/campaigns')}>
            <Megaphone />
            <span>Kampagnen</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand('/placements')}>
            <ClipboardList />
            <span>Platzierungen</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand('/locations')}>
            <MapPin />
            <span>Standorte</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand('/qr-codes')}>
            <QrCode />
            <span>QR-Codes</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand('/links')}>
            <Link2 />
            <span>Kurzlinks</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand('/analytics')}>
            <BarChart3 />
            <span>Analytik</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand('/settings')}>
            <Settings />
            <span>Einstellungen</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Schnellaktionen">
          <CommandItem onSelect={() => runCommand('/campaigns/new')}>
            <Plus />
            <span>Neue Kampagne</span>
            <CommandShortcut>Erstellen</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand('/placements/new')}>
            <Plus />
            <span>Neue Platzierung</span>
            <CommandShortcut>Erstellen</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand('/locations/new')}>
            <Plus />
            <span>Neuer Standort</span>
            <CommandShortcut>Erstellen</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand('/links/new')}>
            <Plus />
            <span>Neuer Kurzlink</span>
            <CommandShortcut>Erstellen</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand('/qr-codes/new')}>
            <Plus />
            <span>Neuer QR-Code</span>
            <CommandShortcut>Erstellen</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        {Object.entries(grouped).map(([kind, list]) => {
          const config = kindConfig[kind as SearchItem['kind']];
          const Icon = config.icon;
          return (
            <div key={kind}>
              <CommandSeparator />
              <CommandGroup heading={config.label}>
                {list.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.subtitle ?? ''} ${config.label}`}
                    onSelect={() => runCommand(item.href)}
                  >
                    <Icon />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{item.title}</div>
                      {item.subtitle && (
                        <div className="truncate text-[11px] text-muted-foreground">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="opacity-30" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}

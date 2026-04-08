'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getAppUrl } from '@/lib/constants';
import { toast } from 'sonner';
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
  Clock,
  Copy,
} from 'lucide-react';

type SearchItem = {
  id: string;
  title: string;
  subtitle?: string;
  shortCode?: string;
  href: string;
  kind: 'campaign' | 'placement' | 'location' | 'qr_code' | 'link';
};

/* --- Recents (localStorage) --- */
const RECENTS_KEY = 'spurig-recents';
const MAX_RECENTS = 5;

type RecentItem = { title: string; href: string; kind: string };

function getRecents(): RecentItem[] {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]'); }
  catch { return []; }
}

function addRecent(item: RecentItem) {
  const recents = getRecents().filter((r) => r.href !== item.href);
  recents.unshift(item);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, MAX_RECENTS)));
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [recents, setRecents] = useState<RecentItem[]>([]);

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
        shortCode: q.short_code as string,
        href: `/qr-codes/${q.id}`,
        kind: 'qr_code' as const,
      })),
      ...(shortLinks.data ?? []).map((s: Record<string, unknown>) => ({
        id: s.id as string,
        title: (s.title as string) || (s.short_code as string),
        subtitle: `/r/${s.short_code as string}`,
        shortCode: s.short_code as string,
        href: `/links/${s.id}`,
        kind: 'link' as const,
      })),
    ];

    setItems(merged);
    setLoaded(true);
  }, [loaded]);

  useEffect(() => {
    if (open) {
      loadData();
      setRecents(getRecents());
    }
  }, [open, loadData]);

  function runCommand(href: string, title?: string, kind?: string) {
    setOpen(false);
    if (title && kind) {
      addRecent({ title, href, kind });
    }
    router.push(href);
  }

  function copyRedirectUrl(shortCode: string, label: string) {
    const url = `${getAppUrl()}/r/${shortCode}`;
    navigator.clipboard.writeText(url);
    toast.success(`Link kopiert: ${label}`);
    setOpen(false);
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

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', shortcut: '⌘1' },
    { icon: Megaphone, label: 'Kampagnen', href: '/campaigns', shortcut: '⌘2' },
    { icon: ClipboardList, label: 'Platzierungen', href: '/placements', shortcut: '⌘3' },
    { icon: MapPin, label: 'Standorte', href: '/locations', shortcut: '⌘4' },
    { icon: QrCode, label: 'QR-Codes', href: '/qr-codes', shortcut: '⌘5' },
    { icon: Link2, label: 'Kurzlinks', href: '/links', shortcut: '⌘6' },
    { icon: BarChart3, label: 'Analytik', href: '/analytics', shortcut: '⌘7' },
    { icon: Settings, label: 'Einstellungen', href: '/settings', shortcut: '⌘8' },
  ] as const;

  // Global ⌘1–⌘8 navigation shortcuts
  useEffect(() => {
    function onNavShortcut(e: KeyboardEvent) {
      if (!e.metaKey && !e.ctrlKey) return;
      const idx = parseInt(e.key, 10);
      if (idx >= 1 && idx <= navItems.length) {
        e.preventDefault();
        setOpen(false);
        router.push(navItems[idx - 1].href);
      }
    }
    window.addEventListener('keydown', onNavShortcut);
    return () => window.removeEventListener('keydown', onNavShortcut);
  }, [router, navItems]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Kampagne, Link, Platzierung suchen …" />
      <CommandList>
        <CommandEmpty>Keine Treffer</CommandEmpty>

        {recents.length > 0 && (
          <>
            <CommandGroup heading="Zuletzt besucht">
              {recents.map((r) => {
                const config = kindConfig[r.kind as SearchItem['kind']];
                const Icon = config?.icon ?? Clock;
                return (
                  <CommandItem key={r.href} value={`recent ${r.title}`} onSelect={() => runCommand(r.href, r.title, r.kind)}>
                    <Icon />
                    <span>{r.title}</span>
                    <Clock className="ml-auto h-3 w-3 opacity-30" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Navigation">
          {navItems.map((nav) => {
            const Icon = nav.icon;
            return (
              <CommandItem key={nav.href} onSelect={() => runCommand(nav.href, nav.label, 'nav')}>
                <Icon />
                <span>{nav.label}</span>
                <CommandShortcut>{nav.shortcut}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Schnellaktionen">
          <CommandItem onSelect={() => runCommand('/campaigns/new', 'Neue Kampagne', 'campaign')}>
            <Plus />
            <span>Neue Kampagne</span>
            <CommandShortcut>Erstellen</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand('/placements/new', 'Neue Platzierung', 'placement')}>
            <Plus />
            <span>Neue Platzierung</span>
            <CommandShortcut>Erstellen</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand('/locations/new', 'Neuer Standort', 'location')}>
            <Plus />
            <span>Neuer Standort</span>
            <CommandShortcut>Erstellen</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand('/links/new', 'Neuer Kurzlink', 'link')}>
            <Plus />
            <span>Neuer Kurzlink</span>
            <CommandShortcut>Erstellen</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand('/qr-codes/new', 'Neuer QR-Code', 'qr_code')}>
            <Plus />
            <span>Neuer QR-Code</span>
            <CommandShortcut>Erstellen</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        {Object.entries(grouped).map(([kind, list]) => {
          const config = kindConfig[kind as SearchItem['kind']];
          const Icon = config.icon;
          const hasCopyAction = kind === 'qr_code' || kind === 'link';
          return (
            <div key={kind}>
              <CommandSeparator />
              <CommandGroup heading={config.label}>
                {list.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.subtitle ?? ''} ${config.label}`}
                    onSelect={() => runCommand(item.href, item.title, kind)}
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
                    {hasCopyAction && item.shortCode && (
                      <button
                        type="button"
                        title="Link kopieren"
                        className="shrink-0 rounded p-1 hover:bg-accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyRedirectUrl(item.shortCode!, item.title);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <Copy className="h-3.5 w-3.5 opacity-50" />
                      </button>
                    )}
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

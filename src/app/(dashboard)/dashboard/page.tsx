import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { CAMPAIGN_STATUS_LABELS } from '@/lib/constants';
import { StatusBadge } from '@/components/shared/status-badge';
import { KPIStatCard } from '@/components/shared/kpi-stat-card';
import Link from 'next/link';
import {
  Megaphone,
  MapPin,
  ClipboardList,
  QrCode,
  MousePointerClick,
  TrendingUp,
  ArrowRight,
  Users,
  Link2,
  Target,
  Sparkles,
} from 'lucide-react';
import { LiveScanFeed } from '@/components/shared/live-scan-feed';

export default async function DashboardPage() {
  noStore();
  const profile = await requireAuth();
  const supabase = await createClient();

  const [
    { count: campaignCount },
    { count: locationCount },
    { count: placementCount },
    { count: qrCodeCount },
    { count: totalOpens },
    { data: ipHashData },
    { count: ctaClicks },
    { count: linkClicks },
    { data: recentCampaigns },
    { data: topPlacements },
    { data: topLinks },
  ] = await Promise.all([
    supabase.from('campaigns').select('*', { count: 'exact', head: true }),
    supabase.from('locations').select('*', { count: 'exact', head: true }),
    supabase.from('placements').select('*', { count: 'exact', head: true }),
    supabase.from('qr_codes').select('*', { count: 'exact', head: true }),
    supabase.from('redirect_events').select('*', { count: 'exact', head: true }).eq('event_type', 'qr_open').eq('is_bot', false),
    supabase.from('redirect_events').select('ip_hash').eq('event_type', 'qr_open').eq('is_bot', false),
    supabase.from('page_events').select('*', { count: 'exact', head: true }).eq('event_type', 'cta_click'),
    supabase.from('redirect_events').select('*', { count: 'exact', head: true }).eq('event_type', 'link_open').eq('is_bot', false),
    supabase.from('campaigns').select('id, name, status, slug').order('updated_at', { ascending: false }).limit(5),
    supabase.from('redirect_events')
      .select('placement_id, placements(name, placement_code, location:locations(venue_name))')
      .eq('event_type', 'qr_open')
      .eq('is_bot', false)
      .not('placement_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('short_links')
      .select('id, title, short_code, click_count, campaign:campaigns(name)')
      .eq('archived', false)
      .order('click_count', { ascending: false })
      .limit(5),
  ]);

  const placementCounts: Record<string, { name: string; code: string; location: string; count: number }> = {};
  (topPlacements || []).forEach((ev: Record<string, unknown>) => {
    const pid = ev.placement_id as string;
    if (!pid) return;
    if (!placementCounts[pid]) {
      const p = ev.placements as { name: string; placement_code: string; location: { venue_name: string } | null } | null;
      placementCounts[pid] = {
        name: p?.name || 'Unbekannt',
        code: p?.placement_code || '',
        location: p?.location?.venue_name || '',
        count: 0,
      };
    }
    placementCounts[pid].count++;
  });
  const topPlacementList = Object.entries(placementCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5);

  const uniqueScans = new Set((ipHashData || []).map((e: { ip_hash: string | null }) => e.ip_hash).filter(Boolean)).size;

  const conversionRate = totalOpens && ctaClicks
    ? ((ctaClicks / totalOpens) * 100).toFixed(1)
    : '0';

  const hasAnyData = (campaignCount || 0) > 0 || (totalOpens || 0) > 0;

  return (
    <div className="space-y-6 animate-in-card">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Willkommen, {profile.display_name || profile.email}
        </h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Übersicht deiner QR-Kampagnen
        </p>
      </div>

      {/* Onboarding: first-time users only */}
      {!hasAnyData && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold">So funktioniert Spurig</h3>
              <p className="text-[12px] text-muted-foreground">In 4 einfachen Schritten zum trackbaren QR-Code</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <Link href="/campaigns/new" className="group relative rounded-lg border border-border p-4 hover:border-primary/40 hover:bg-primary/[0.02] transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">1</span>
                <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <h4 className="text-[13px] font-semibold group-hover:text-primary transition-colors">Kampagne erstellen</h4>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Dein Projekt — z.B. &quot;Sommerfest 2026&quot; oder &quot;Newsletter Aktion&quot;. Alles wird hier gebündelt.
              </p>
            </Link>

            {/* Step 2 */}
            <Link href="/locations/new" className="group relative rounded-lg border border-border p-4 hover:border-primary/40 hover:bg-primary/[0.02] transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">2</span>
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <h4 className="text-[13px] font-semibold group-hover:text-primary transition-colors">Standort anlegen</h4>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Wo hängen deine QR-Codes? Z.B. Café, Schule, Büro. So siehst du, welcher Ort am besten performt.
              </p>
            </Link>

            {/* Step 3 */}
            <Link href="/placements/new" className="group relative rounded-lg border border-border p-4 hover:border-primary/40 hover:bg-primary/[0.02] transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">3</span>
                <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <h4 className="text-[13px] font-semibold group-hover:text-primary transition-colors">Platzierung erstellen</h4>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Der genaue Spot — z.B. &quot;Poster am Eingang&quot; oder &quot;Flyer am Tresen&quot;. Verknüpft Kampagne + Standort.
              </p>
            </Link>

            {/* Step 4 */}
            <Link href="/qr-codes/new" className="group relative rounded-lg border border-border p-4 hover:border-primary/40 hover:bg-primary/[0.02] transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">4</span>
                <QrCode className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <h4 className="text-[13px] font-semibold group-hover:text-primary transition-colors">QR-Code generieren</h4>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Dein fertiger QR-Code — zum Ausdrucken oder digital teilen. Jeder Scan wird automatisch getrackt.
              </p>
            </Link>
          </div>

          <div className="mt-4 rounded-md bg-muted/30 px-4 py-2.5">
            <p className="text-[12px] text-muted-foreground">
              <span className="font-medium text-foreground">Tipp:</span> Starte mit Schritt 1 — die anderen Schritte bauen darauf auf. Du kannst auch direkt einen{' '}
              <Link href="/links/new" className="text-primary hover:underline">Kurzlink erstellen</Link> ohne Kampagne.
            </p>
          </div>
        </div>
      )}

      {/* Performance KPIs — 4 symmetric cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-semibold tracking-tight">Leistung</h2>
            <p className="text-[12px] text-muted-foreground">So performen deine Kampagnen aktuell</p>
          </div>
          <Link
            href="/analytics"
            className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Zur Analytik <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          <Link href="/analytics" className="group">
            <KPIStatCard
              label="QR-Scans"
              value={totalOpens || 0}
              icon={TrendingUp}
              subtext={totalOpens ? `${uniqueScans} eindeutig` : 'Noch keine Scans'}
              hint="Gesamtzahl aller QR-Code-Scans über alle Platzierungen hinweg."
              className="transition-colors group-hover:border-border/80 group-hover:bg-muted/30"
            />
          </Link>
          <Link href="/analytics" className="group">
            <KPIStatCard
              label="Eindeutige Besucher"
              value={uniqueScans}
              icon={Users}
              subtext={totalOpens ? `${((uniqueScans / totalOpens) * 100).toFixed(0)}% der Scans` : 'Noch keine Daten'}
              hint="Anzahl unterschiedlicher Personen (anonymisiert). Zeigt echte Reichweite statt nur Klicks."
              className="transition-colors group-hover:border-border/80 group-hover:bg-muted/30"
            />
          </Link>
          <Link href="/links" className="group">
            <KPIStatCard
              label="Link-Klicks"
              value={linkClicks || 0}
              icon={MousePointerClick}
              subtext={linkClicks ? 'Gesamt' : 'Noch keine Klicks'}
              hint="Klicks auf deine Kurzlinks (z. B. für Social Media oder digitale Kanäle)."
              className="transition-colors group-hover:border-border/80 group-hover:bg-muted/30"
            />
          </Link>
          <Link href="/analytics" className="group">
            <KPIStatCard
              label="Conversion-Rate"
              value={`${conversionRate}%`}
              icon={Target}
              subtext={ctaClicks ? `${ctaClicks} Aktionen` : 'Noch keine Aktionen'}
              hint="Anteil der Besucher, die nach dem Scan eine gewünschte Aktion ausgeführt haben (z. B. Button-Klick, Formular)."
              className="transition-colors group-hover:border-border/80 group-hover:bg-muted/30"
            />
          </Link>
        </div>
      </section>

      {/* Inventory KPIs — 4 symmetric cards */}
      <section className="space-y-3">
        <div>
          <h2 className="text-[13px] font-semibold tracking-tight">Bestand</h2>
          <p className="text-[12px] text-muted-foreground">Was du bereits angelegt hast</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          <Link href="/campaigns" className="group">
            <KPIStatCard
              label="Kampagnen"
              value={campaignCount || 0}
              icon={Megaphone}
              hint="Eine Kampagne bündelt alle Platzierungen und QR-Codes für ein Marketing-Ziel."
              className="transition-colors group-hover:border-border/80 group-hover:bg-muted/30"
            />
          </Link>
          <Link href="/locations" className="group">
            <KPIStatCard
              label="Standorte"
              value={locationCount || 0}
              icon={MapPin}
              hint="Orte an denen deine QR-Codes aushängen (z. B. Bibliothek, Café, Jugendzentrum)."
              className="transition-colors group-hover:border-border/80 group-hover:bg-muted/30"
            />
          </Link>
          <Link href="/placements" className="group">
            <KPIStatCard
              label="Platzierungen"
              value={placementCount || 0}
              icon={ClipboardList}
              hint="Einzelne Anbringungen pro Standort (z. B. Poster am Eingang, Flyer am Tresen)."
              className="transition-colors group-hover:border-border/80 group-hover:bg-muted/30"
            />
          </Link>
          <Link href="/qr-codes" className="group">
            <KPIStatCard
              label="QR-Codes"
              value={qrCodeCount || 0}
              icon={QrCode}
              hint="Jede Platzierung hat einen eigenen QR-Code mit individueller Tracking-URL."
              className="transition-colors group-hover:border-border/80 group-hover:bg-muted/30"
            />
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Live Scan Feed */}
        <LiveScanFeed />

        {/* Recent Campaigns */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-[13px] font-medium">Aktuelle Kampagnen</h3>
            <Link href="/campaigns" className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              Alle anzeigen <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/60">
            {recentCampaigns && recentCampaigns.length > 0 ? (
              recentCampaigns.map((c: Record<string, unknown>) => (
                <Link
                  key={c.id as string}
                  href={`/campaigns/${c.id}`}
                  className="group flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium group-hover:text-primary transition-colors truncate">{c.name as string}</div>
                    <div className="mt-0.5 text-[12px] text-muted-foreground font-mono">{c.slug as string}</div>
                  </div>
                  <StatusBadge
                    status={c.status as string}
                    label={CAMPAIGN_STATUS_LABELS[c.status as string] || (c.status as string)}
                  />
                </Link>
              ))
            ) : (
              <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                Noch keine Kampagnen vorhanden.
              </p>
            )}
          </div>
        </div>

        {/* Top Placements */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-[13px] font-medium">Top-Platzierungen</h3>
            <Link href="/placements" className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              Alle anzeigen <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/60">
            {topPlacementList.length > 0 ? (
              topPlacementList.map(([pid, info], index) => (
                <Link
                  key={pid}
                  href={`/placements/${pid}`}
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded text-[12px] font-medium text-muted-foreground bg-muted">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate group-hover:text-primary transition-colors">{info.name}</div>
                    <div className="mt-0.5 text-[12px] text-muted-foreground truncate">
                      {info.location} · <span className="font-mono">{info.code}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[13px] font-semibold tabular-nums">
                    {info.count}
                    <TrendingUp className="h-3 w-3 text-muted-foreground/50" />
                  </div>
                </Link>
              ))
            ) : (
              <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                Noch keine Scan-Daten vorhanden.
              </p>
            )}
          </div>
        </div>

        {/* Top Links */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-[13px] font-medium">Top-Links</h3>
            <Link href="/links" className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              Alle anzeigen <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/60">
            {topLinks && topLinks.length > 0 ? (
              topLinks.map((link: Record<string, unknown>, index: number) => (
                <Link
                  key={link.id as string}
                  href={`/links/${link.id}`}
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded text-[12px] font-medium text-muted-foreground bg-muted">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate group-hover:text-primary transition-colors">
                      {(link.title as string) || (link.short_code as string)}
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted-foreground truncate">
                      <span className="font-mono">/r/{link.short_code as string}</span>
                      {(link.campaign as { name: string } | null)?.name && (
                        <> · {(link.campaign as { name: string }).name}</>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[13px] font-semibold tabular-nums">
                    {link.click_count as number}
                    <Link2 className="h-3 w-3 text-muted-foreground/50" />
                  </div>
                </Link>
              ))
            ) : (
              <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                Noch keine Link-Daten vorhanden
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { KPIStatCard } from '@/components/shared/kpi-stat-card';
import Link from 'next/link';
import {
  TrendingUp, Users, MousePointerClick, Target, ArrowRight, Sparkles, Megaphone,
  MapPin, ClipboardList, QrCode,
} from 'lucide-react';
import { DismissibleOnboarding } from './dismissible-onboarding';

/** Calculate percentage change, returns null if not meaningful */
function calcDelta(current: number, previous: number): number | null {
  // No data in either period — nothing to compare
  if (previous === 0 && current === 0) return null;
  // No data in previous period — delta is meaningless ("from nothing")
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export async function PerformanceKPIs() {
  noStore();
  const supabase = await createClient();

  // Current period: last 7 days; Previous period: 7-14 days ago
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86_400_000).toISOString();

  const { data: { user } } = await supabase.auth.getUser();

  const [
    // Profile for onboarding dismiss flag
    { data: profile },
    // All-time totals (display values)
    { count: totalOpens },
    { data: ipHashData },
    { count: ctaClicks },
    { count: linkClicks },
    { count: campaignCount },
    // Current 7 days
    { count: currScans7d },
    { data: currIpHash7d },
    { count: currLinks7d },
    // Previous 7 days (7-14 days ago)
    { count: prevScans7d },
    { data: prevIpHash7d },
    { count: prevLinks7d },
  ] = await Promise.all([
    user
      ? supabase.from('profiles').select('onboarding_dismissed_at').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('redirect_events').select('*', { count: 'exact', head: true }).eq('event_type', 'qr_open').eq('is_bot', false),
    supabase.from('redirect_events').select('ip_hash').eq('event_type', 'qr_open').eq('is_bot', false),
    supabase.from('page_events').select('*', { count: 'exact', head: true }).eq('event_type', 'cta_click'),
    supabase.from('redirect_events').select('*', { count: 'exact', head: true }).eq('event_type', 'link_open').eq('is_bot', false),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }),
    // Current 7d
    supabase.from('redirect_events').select('*', { count: 'exact', head: true }).eq('event_type', 'qr_open').eq('is_bot', false).gte('created_at', sevenDaysAgo),
    supabase.from('redirect_events').select('ip_hash').eq('event_type', 'qr_open').eq('is_bot', false).gte('created_at', sevenDaysAgo),
    supabase.from('redirect_events').select('*', { count: 'exact', head: true }).eq('event_type', 'link_open').eq('is_bot', false).gte('created_at', sevenDaysAgo),
    // Previous 7d
    supabase.from('redirect_events').select('*', { count: 'exact', head: true }).eq('event_type', 'qr_open').eq('is_bot', false).gte('created_at', fourteenDaysAgo).lt('created_at', sevenDaysAgo),
    supabase.from('redirect_events').select('ip_hash').eq('event_type', 'qr_open').eq('is_bot', false).gte('created_at', fourteenDaysAgo).lt('created_at', sevenDaysAgo),
    supabase.from('redirect_events').select('*', { count: 'exact', head: true }).eq('event_type', 'link_open').eq('is_bot', false).gte('created_at', fourteenDaysAgo).lt('created_at', sevenDaysAgo),
  ]);

  const uniqueScans = new Set((ipHashData || []).map((e: { ip_hash: string | null }) => e.ip_hash).filter(Boolean)).size;
  const conversionRate = totalOpens && ctaClicks
    ? ((ctaClicks / totalOpens) * 100).toFixed(1)
    : '0';
  const hasAnyData = (campaignCount || 0) > 0 || (totalOpens || 0) > 0;
  const onboardingDismissed = Boolean((profile as { onboarding_dismissed_at: string | null } | null)?.onboarding_dismissed_at);
  const showOnboarding = !hasAnyData && !onboardingDismissed;

  // Delta calculations: current 7d vs previous 7d
  const currUnique7d = new Set((currIpHash7d || []).map((e: { ip_hash: string | null }) => e.ip_hash).filter(Boolean)).size;
  const prevUnique7d = new Set((prevIpHash7d || []).map((e: { ip_hash: string | null }) => e.ip_hash).filter(Boolean)).size;
  const scansDelta = calcDelta(currScans7d || 0, prevScans7d || 0);
  const uniqueDelta = calcDelta(currUnique7d, prevUnique7d);
  const linkDelta = calcDelta(currLinks7d || 0, prevLinks7d || 0);

  return (
    <>
      {/* Onboarding: first-time users only, until explicitly dismissed */}
      {showOnboarding && (
        <DismissibleOnboarding>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.18),var(--shadow-sm)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold">So funktioniert Spurig</h3>
              <p className="text-[12px] text-muted-foreground">In 4 einfachen Schritten zum trackbaren QR-Code</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/campaigns/new" className="group relative rounded-2xl border border-border p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand/[0.04] hover:shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-brand-foreground">1</span>
                <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <h4 className="text-[13px] font-semibold transition-colors group-hover:text-brand">Kampagne erstellen</h4>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Dein Projekt — z.B. &quot;Sommerfest 2026&quot; oder &quot;Newsletter Aktion&quot;. Alles wird hier gebündelt.
              </p>
            </Link>

            <Link href="/locations/new" className="group relative rounded-2xl border border-border p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand/[0.04] hover:shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-brand-foreground">2</span>
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <h4 className="text-[13px] font-semibold transition-colors group-hover:text-brand">Standort anlegen</h4>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Wo hängen deine QR-Codes? Z.B. Café, Schule, Büro. So siehst du, welcher Ort am besten performt.
              </p>
            </Link>

            <Link href="/placements/new" className="group relative rounded-2xl border border-border p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand/[0.04] hover:shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-brand-foreground">3</span>
                <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <h4 className="text-[13px] font-semibold transition-colors group-hover:text-brand">Platzierung erstellen</h4>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Der genaue Spot — z.B. &quot;Poster am Eingang&quot; oder &quot;Flyer am Tresen&quot;. Verknüpft Kampagne + Standort.
              </p>
            </Link>

            <Link href="/qr-codes/new" className="group relative rounded-2xl border border-border p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand/[0.04] hover:shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-brand-foreground">4</span>
                <QrCode className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <h4 className="text-[13px] font-semibold transition-colors group-hover:text-brand">QR-Code generieren</h4>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Dein fertiger QR-Code — zum Ausdrucken oder digital teilen. Jeder Scan wird automatisch getrackt.
              </p>
            </Link>
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-border bg-subtle px-4 py-2.5">
            <p className="text-[12px] text-muted-foreground">
              <span className="font-medium text-foreground">Tipp:</span> Starte mit Schritt 1 — die anderen Schritte bauen darauf auf. Du kannst auch direkt einen{' '}
              <Link href="/links/new" className="text-foreground hover:text-brand transition-colors">Kurzlink erstellen</Link> ohne Kampagne.
            </p>
          </div>
        </div>
        </DismissibleOnboarding>
      )}

      {/* Performance KPIs */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Leistung</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">So performen deine Kampagnen aktuell</p>
          </div>
          <Link
            href="/analytics"
            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-brand"
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
              animate
              delta={scansDelta}
              deltaLabel="vs. 7 Tage"
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
              animate
              delta={uniqueDelta}
              deltaLabel="vs. 7 Tage"
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
              animate
              delta={linkDelta}
              deltaLabel="vs. 7 Tage"
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
    </>
  );
}

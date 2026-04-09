'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import {
  Link2, ExternalLink, Copy, Check, Trash2, ToggleLeft, ToggleRight,
  TrendingUp, Users, Globe, Monitor, ArrowUpRight, MousePointerClick,
  Pencil, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';

import type { ShortLink, LinkGroup, RedirectRule, AbVariant } from '@/types';
import type { EffectiveTier } from '@/lib/billing/gates';
import { deleteShortLink, toggleShortLink, updateShortLink, getLinkGroups } from '../actions';
import { formatDate, formatDateTime } from '@/lib/format';
import { CHART_PALETTE, SERIES_COLORS, AXIS_STYLE, GRID_STYLE } from '@/lib/chart-config';
import { generateForecast } from '@/lib/forecast';
import { ChartTransition } from '@/components/shared/chart-transition';
import { RedirectRulesEditor } from '@/components/redirect-rules/redirect-rules-editor';
import { AbVariantsEditor } from '@/components/ab-testing/ab-variants-editor';
import { AbResultsChart } from '@/components/ab-testing/ab-results-chart';

import { PageHeader } from '@/components/shared/page-header';
import { KPIStatCard } from '@/components/shared/kpi-stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CountryChart } from '@/components/shared/country-chart';

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 6,
  border: '1px solid oklch(0.92 0 0)',
  boxShadow: '0 4px 12px oklch(0 0 0 / 0.08)',
};

type Props = {
  link: ShortLink;
  redirectRules?: RedirectRule[];
  abVariants?: AbVariant[];
  userTier?: EffectiveTier;
};

type Campaign = { id: string; name: string };

type EditFormData = {
  target_url: string;
  title: string;
  description: string;
  campaign_id: string;
  link_group_id: string;
  expires_at: string;
  expired_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_id: string;
};

function buildEditForm(link: ShortLink): EditFormData {
  return {
    target_url: link.target_url,
    title: link.title ?? '',
    description: link.description ?? '',
    campaign_id: link.campaign_id ?? '',
    link_group_id: link.link_group_id ?? '',
    expires_at: link.expires_at ? link.expires_at.slice(0, 16) : '',
    expired_url: link.expired_url ?? '',
    utm_source: link.utm_source ?? '',
    utm_medium: link.utm_medium ?? '',
    utm_campaign: link.utm_campaign ?? '',
    utm_content: link.utm_content ?? '',
    utm_id: link.utm_id ?? '',
  };
}

export function LinkDetail({ link, redirectRules = [], abVariants = [], userTier = 'expired' }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  // Edit state
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>(buildEditForm(link));
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [groups, setGroups] = useState<LinkGroup[]>([]);
  const [showUtm, setShowUtm] = useState(false);

  // Load campaigns + groups when edit opens
  useEffect(() => {
    if (!showEdit) return;
    const sb = createClient();
    sb.from('campaigns')
      .select('id, name')
      .in('status', ['draft', 'active', 'paused'])
      .order('name')
      .then(({ data }) => setCampaigns((data ?? []) as Campaign[]));
    getLinkGroups().then(setGroups);
  }, [showEdit]);

  const shortUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${link.short_code}`
    : `/r/${link.short_code}`;

  function handleCopy() {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    toast.success('Link kopiert');
    setTimeout(() => setCopied(false), 2000);
  }

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleShortLink(link.id, !link.active);
      if (result.success) toast.success(link.active ? 'Deaktiviert' : 'Aktiviert');
      else toast.error(result.error || 'Fehler');
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteShortLink(link.id);
      if (result.success) {
        toast.success('Link gelöscht');
        router.push('/links');
      } else {
        toast.error(result.error || 'Fehler');
      }
    });
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateShortLink(link.id, {
        target_url: editForm.target_url,
        title: editForm.title || undefined,
        description: editForm.description || undefined,
        campaign_id: editForm.campaign_id || undefined,
        link_group_id: editForm.link_group_id || undefined,
        expires_at: editForm.expires_at || undefined,
        expired_url: editForm.expired_url || undefined,
        utm_source: editForm.utm_source || undefined,
        utm_medium: editForm.utm_medium || undefined,
        utm_campaign: editForm.utm_campaign || undefined,
        utm_content: editForm.utm_content || undefined,
        utm_id: editForm.utm_id || undefined,
      });
      if (result.success) {
        toast.success('Link aktualisiert');
        setShowEdit(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Fehler beim Aktualisieren');
      }
    });
  }

  function handleCancelEdit() {
    setEditForm(buildEditForm(link));
    setShowEdit(false);
  }

  // Analytics data
  const dateFrom = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const dateTo = format(new Date(), 'yyyy-MM-dd');

  const { data: analytics } = useQuery({
    queryKey: ['link-analytics', link.id, dateFrom, dateTo],
    queryFn: async () => {
      const from = `${dateFrom}T00:00:00`;
      const to = `${dateTo}T23:59:59`;

      const { data: events } = await supabase
        .from('redirect_events')
        .select('id, device_type, browser_family, os_family, country, ip_hash, referrer, created_at, is_bot')
        .eq('short_link_id', link.id)
        .eq('event_type', 'link_open')
        .gte('created_at', from)
        .lte('created_at', to);

      const allEvents = events || [];
      const humanEvents = allEvents.filter((e) => !e.is_bot);

      const totalClicks = humanEvents.length;
      const uniqueVisitors = new Set(humanEvents.map((e) => e.ip_hash).filter(Boolean)).size;
      const botClicks = allEvents.length - humanEvents.length;

      // Time series
      const dayMap: Record<string, number> = {};
      humanEvents.forEach((e) => {
        const day = e.created_at.slice(0, 10);
        dayMap[day] = (dayMap[day] || 0) + 1;
      });
      const timeSeriesData = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, clicks]) => ({ date, clicks }));

      // Device breakdown
      const devMap: Record<string, number> = {};
      humanEvents.forEach((e) => {
        const dev = e.device_type || 'unbekannt';
        devMap[dev] = (devMap[dev] || 0) + 1;
      });
      const deviceData = Object.entries(devMap).map(([name, value]) => ({ name, value }));

      // Country breakdown
      const countryMap: Record<string, number> = {};
      humanEvents.forEach((e) => {
        const c = e.country || 'Unbekannt';
        countryMap[c] = (countryMap[c] || 0) + 1;
      });
      const countryData = Object.entries(countryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Referrer breakdown
      const refMap: Record<string, number> = {};
      humanEvents.forEach((e) => {
        if (!e.referrer) return;
        try {
          const host = new URL(e.referrer).hostname.replace('www.', '');
          refMap[host] = (refMap[host] || 0) + 1;
        } catch {
          refMap[e.referrer] = (refMap[e.referrer] || 0) + 1;
        }
      });
      const referrerData = Object.entries(refMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      return { totalClicks, uniqueVisitors, botClicks, timeSeriesData, deviceData, countryData, referrerData };
    },
  });

  const stats = analytics || {
    totalClicks: 0, uniqueVisitors: 0, botClicks: 0,
    timeSeriesData: [], deviceData: [], countryData: [], referrerData: [],
  };

  // Forecast for link clicks
  const forecastData = generateForecast(
    stats.timeSeriesData.map((d) => ({ date: d.date, value: d.clicks })),
    7,
  );
  const timeSeriesWithForecast = forecastData.map((f) => {
    const original = stats.timeSeriesData.find((d) => d.date === f.date);
    return {
      date: f.date,
      clicks: original?.clicks ?? null,
      forecast: f.forecast,
    };
  });

  return (
    <div className="space-y-6 animate-in-card">
      <PageHeader
        title={link.title || link.short_code}
        description={link.target_url}
        breadcrumbs={[
          { label: 'Kurzlinks', href: '/links' },
          { label: link.title || `/r/${link.short_code}` },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowEdit(!showEdit)} disabled={isPending}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Bearbeiten
            </Button>
            <Button variant="outline" size="sm" onClick={handleToggle} disabled={isPending}>
              {link.active ? (
                <><ToggleLeft className="mr-1.5 h-3.5 w-3.5" /> Deaktivieren</>
              ) : (
                <><ToggleRight className="mr-1.5 h-3.5 w-3.5" /> Aktivieren</>
              )}
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="outline" size="sm" className="text-destructive" disabled={isPending}>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Löschen
                </Button>
              }
              title="Link löschen?"
              description="Dieser Kurzlink und alle zugehörigen Tracking-Daten werden unwiderruflich gelöscht."
              confirmLabel="Endgültig löschen"
              onConfirm={handleDelete}
            />
          </div>
        }
      />

      {/* Link card */}
      <Card className="border border-border">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Link2 className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium truncate">{shortUrl}</span>
                <button
                  onClick={handleCopy}
                  className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <a href={link.target_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
                  <ExternalLink className="h-3 w-3" />
                  {link.target_url}
                </a>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[20px] font-bold tabular-nums">{link.click_count.toLocaleString('de-DE')}</div>
            <div className="text-[11px] text-muted-foreground">Klicks gesamt</div>
          </div>
        </CardContent>
      </Card>

      {/* Meta info */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-muted-foreground">
        {link.campaign && <span>Kampagne: <strong>{link.campaign.name}</strong></span>}
        {link.link_group && (
          <span className="flex items-center gap-1">
            Gruppe: <span className="h-2 w-2 rounded-full" style={{ background: link.link_group.color }} />
            <strong>{link.link_group.name}</strong>
          </span>
        )}
        <span>Erstellt: {formatDate(link.created_at)}</span>
        {link.expires_at && <span>Läuft ab: {formatDateTime(link.expires_at)}</span>}
        {link.last_clicked_at && <span>Letzter Klick: {formatDateTime(link.last_clicked_at)}</span>}
      </div>

      {/* Edit form */}
      {showEdit && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Link bearbeiten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-title">Titel</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Optionaler Titel"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-target">Ziel-URL</Label>
                <Input
                  id="edit-target"
                  value={editForm.target_url}
                  onChange={(e) => setEditForm((p) => ({ ...p, target_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Beschreibung</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optionale Beschreibung..."
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Kampagne</Label>
                <Select
                  value={editForm.campaign_id || 'none'}
                  onValueChange={(val) =>
                    setEditForm((p) => ({ ...p, campaign_id: !val || val === 'none' ? '' : val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Keine Kampagne" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine Kampagne</SelectItem>
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Link-Sammlung</Label>
                <Select
                  value={editForm.link_group_id || 'none'}
                  onValueChange={(val) =>
                    setEditForm((p) => ({ ...p, link_group_id: !val || val === 'none' ? '' : val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Keine Sammlung" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine Sammlung</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: g.color }} />
                          {g.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-expires">Läuft ab am</Label>
                <Input
                  id="edit-expires"
                  type="datetime-local"
                  value={editForm.expires_at}
                  onChange={(e) => setEditForm((p) => ({ ...p, expires_at: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-expired-url">Weiterleitungs-URL nach Ablauf</Label>
                <Input
                  id="edit-expired-url"
                  value={editForm.expired_url}
                  onChange={(e) => setEditForm((p) => ({ ...p, expired_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* UTM toggle */}
            <button
              type="button"
              onClick={() => setShowUtm(!showUtm)}
              className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {showUtm ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              UTM-Parameter
            </button>

            {showUtm && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-utm-source">utm_source</Label>
                  <Input
                    id="edit-utm-source"
                    value={editForm.utm_source}
                    onChange={(e) => setEditForm((p) => ({ ...p, utm_source: e.target.value }))}
                    placeholder="z.B. newsletter"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-utm-medium">utm_medium</Label>
                  <Input
                    id="edit-utm-medium"
                    value={editForm.utm_medium}
                    onChange={(e) => setEditForm((p) => ({ ...p, utm_medium: e.target.value }))}
                    placeholder="z.B. email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-utm-campaign">utm_campaign</Label>
                  <Input
                    id="edit-utm-campaign"
                    value={editForm.utm_campaign}
                    onChange={(e) => setEditForm((p) => ({ ...p, utm_campaign: e.target.value }))}
                    placeholder="z.B. sommer-2026"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-utm-content">utm_content</Label>
                  <Input
                    id="edit-utm-content"
                    value={editForm.utm_content}
                    onChange={(e) => setEditForm((p) => ({ ...p, utm_content: e.target.value }))}
                    placeholder="z.B. header-button"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSave} disabled={isPending || !editForm.target_url} size="sm">
                {isPending ? (
                  <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Speichern...</>
                ) : (
                  'Speichern'
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conditional Redirect Rules */}
      <RedirectRulesEditor
        rules={redirectRules}
        shortLinkId={link.id}
        userTier={userTier}
      />

      {/* A/B Testing */}
      <AbVariantsEditor
        variants={abVariants}
        shortLinkId={link.id}
        userTier={userTier}
      />

      {/* A/B Test Results */}
      <AbResultsChart
        variants={abVariants}
        shortLinkId={link.id}
      />

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPIStatCard label="Klicks (30 Tage)" value={stats.totalClicks} icon={MousePointerClick} />
        <KPIStatCard label="Einzelne Besucher" value={stats.uniqueVisitors} icon={Users} />
        <KPIStatCard label="Bot-Klicks (gefiltert)" value={stats.botClicks} icon={Monitor} subtext="Nicht in Statistik enthalten" />
        <KPIStatCard
          label="Referrer"
          value={stats.referrerData.length}
          icon={ArrowUpRight}
          subtext={stats.referrerData[0] ? `Top: ${stats.referrerData[0].name}` : 'Keine Daten'}
        />
      </div>

      {/* Charts */}
      <ChartTransition transitionKey={link.id}>
      <ChartCard title="Klicks ueber Zeit" empty={stats.timeSeriesData.length === 0} emptyText="Keine Klicks im Zeitraum">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={timeSeriesWithForecast}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis dataKey="date" {...AXIS_STYLE} />
            <YAxis {...AXIS_STYLE} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="clicks" name="Klicks" stroke={SERIES_COLORS.scans} strokeWidth={1.5} dot={false} connectNulls={false} />
            <Line type="monotone" dataKey="forecast" name="Prognose" stroke={SERIES_COLORS.scans} strokeWidth={1.5} strokeDasharray="6 3" dot={false} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      </ChartTransition>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Gerätetypen" empty={stats.deviceData.length === 0}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stats.deviceData} cx="50%" cy="50%" outerRadius={85} innerRadius={48} dataKey="value" nameKey="name" label={{ fontSize: 11 }} strokeWidth={1}>
                {stats.deviceData.map((_, idx) => (
                  <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top-Referrer" empty={stats.referrerData.length === 0} emptyText="Keine Referrer-Daten">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.referrerData} layout="vertical">
              <CartesianGrid {...GRID_STYLE} />
              <XAxis type="number" {...AXIS_STYLE} />
              <YAxis dataKey="name" type="category" {...AXIS_STYLE} width={120} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" name="Klicks" fill={SERIES_COLORS.clicks} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {stats.countryData.length > 0 && (
        <ChartCard title="Klicks nach Land">
          <CountryChart data={stats.countryData} />
        </ChartCard>
      )}
    </div>
  );
}

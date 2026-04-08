'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Link2, ChevronDown, ChevronUp, Crown } from 'lucide-react';

import { createShortLink, getLinkGroups } from '../actions';
import { checkFeatureAccess } from '@/lib/billing/check-access';
import { UpgradeBanner } from '@/components/shared/upgrade-banner';
import { UtmTemplatePicker } from '@/components/shared/utm-template-picker';
import { getPrimaryDomainHost } from '@/app/(dashboard)/settings/domains-actions';
import { createClient } from '@/lib/supabase/client';
import type { LinkMode } from '@/types';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Campaign = { id: string; name: string };
type Group = { id: string; name: string; color: string };

export default function NewLinkPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [accessDenied, setAccessDenied] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useCustomCode, setUseCustomCode] = useState(false);
  const [origin, setOrigin] = useState('');
  const [linkMode, setLinkMode] = useState<LinkMode>('short');

  useEffect(() => {
    checkFeatureAccess('create').then(({ allowed, tier }) => {
      if (!allowed) setAccessDenied(true);
      if (tier === 'pro') setIsPro(true);
    });
  }, []);

  // Form state
  const [targetUrl, setTargetUrl] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [expiredUrl, setExpiredUrl] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('link');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmContent, setUtmContent] = useState('');

  const [customDomainHost, setCustomDomainHost] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    const supabase = createClient();

    async function load() {
      const [campaignsRes, groupsRes, primaryHost] = await Promise.all([
        supabase.from('campaigns').select('id, name').order('name'),
        getLinkGroups(),
        getPrimaryDomainHost(),
      ]);
      setCampaigns((campaignsRes.data || []) as Campaign[]);
      setGroups(groupsRes as Group[]);
      setCustomDomainHost(primaryHost);
    }
    load();
  }, []);

  function handleSubmit() {
    if (!targetUrl) {
      toast.error('Ziel-URL ist erforderlich');
      return;
    }

    startTransition(async () => {
      const result = await createShortLink({
        target_url: targetUrl,
        short_code: shortCode || undefined,
        link_mode: linkMode,
        title: title || undefined,
        description: description || undefined,
        campaign_id: campaignId || undefined,
        link_group_id: groupId || undefined,
        expires_at: expiresAt || undefined,
        expired_url: expiredUrl || undefined,
        utm_source: utmSource || undefined,
        utm_medium: utmMedium || undefined,
        utm_campaign: utmCampaign || undefined,
        utm_content: utmContent || undefined,
      });

      if (result.success) {
        toast.success('Kurzlink erstellt');
        router.push('/links');
      } else {
        toast.error(result.error || 'Fehler beim Erstellen');
      }
    });
  }

  if (accessDenied) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader title="Neuer Kurzlink" description="Erstelle einen trackbaren Kurzlink" breadcrumbs={[{ label: 'Kurzlinks', href: '/links' }, { label: 'Neu' }]} />
        <UpgradeBanner description="Um neue Kurzlinks zu erstellen, benötigst du ein aktives Abo." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-in-card">
      <PageHeader
        title="Neuer Kurzlink"
        description="Erstelle einen trackbaren Kurzlink"
      />

      {/* Main fields */}
      <Card className="border border-border">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-[14px]">Link-Daten</CardTitle>
              <CardDescription className="text-[12px]">
                Ziel-URL und optionaler benutzerdefinierter Kurzcode
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Ziel-URL *</Label>
            <Input
              type="url"
              placeholder="https://example.com/landingpage"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="h-9 text-[13px]"
            />
          </div>

          {/* Link-Modus Toggle — Pro only */}
          {isPro && (
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                Link-Modus
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <Crown className="h-2.5 w-2.5" />
                  Pro
                </span>
              </Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLinkMode('short')}
                  className={`flex-1 rounded-md border px-3 py-2 text-left text-[12px] transition-colors ${
                    linkMode === 'short'
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <span className="font-medium">Kurzlink</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">spurig.com/r/CODE</p>
                </button>
                <button
                  type="button"
                  onClick={() => setLinkMode('direct')}
                  className={`flex-1 rounded-md border px-3 py-2 text-left text-[12px] transition-colors ${
                    linkMode === 'direct'
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <span className="font-medium">Original-URL</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Sauberer Redirect ohne sichtbare Parameter</p>
                </button>
              </div>
            </div>
          )}

          {linkMode === 'short' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[12px] text-muted-foreground">Kurzcode</Label>
              <button
                type="button"
                onClick={() => { setUseCustomCode(!useCustomCode); if (useCustomCode) setShortCode(''); }}
                className="text-[11px] text-primary hover:underline"
              >
                {useCustomCode ? 'Auto-generieren' : 'Eigenen Code verwenden'}
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] text-muted-foreground shrink-0">
                {customDomainHost ? `https://${customDomainHost}/` : `${origin}/r/`}
              </span>
              <Input
                placeholder="auto-generiert"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
                disabled={!useCustomCode}
                className="h-9 text-[13px]"
              />
            </div>
          </div>
          )}

          {linkMode === 'direct' && (
            <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2.5">
              <p className="text-[12px] text-muted-foreground">
                In der Link-Liste und beim Kopieren wird die Original-URL angezeigt.
                Das Tracking läuft weiterhin über einen internen Kurzlink.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Titel (optional)</Label>
            <Input
              placeholder="z.B. Newsletter CTA, Instagram Bio"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-[13px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Beschreibung (optional)</Label>
            <Textarea
              placeholder="Interne Notizen zum Link..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-[13px]"
              rows={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">Kampagne zuordnen</Label>
              <Select value={campaignId || 'none'} onValueChange={(v) => setCampaignId(!v || v === 'none' ? '' : v)}>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue>
                    {campaignId ? campaigns.find((c) => c.id === campaignId)?.name ?? 'Laden...' : 'Keine Kampagne'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine Kampagne</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Ordne den Link einer Kampagne zu, um Klicks dort mitzuzählen.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">Link-Sammlung</Label>
              <Select value={groupId || 'none'} onValueChange={(v) => setGroupId(!v || v === 'none' ? '' : v)}>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue>
                    {groupId ? groups.find((g) => g.id === groupId)?.name ?? 'Laden...' : 'Keine Sammlung'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine Sammlung</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: g.color }} />
                        {g.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Gruppiere Links nach Thema oder Kanal (z.B. &ldquo;Social Media&rdquo;, &ldquo;Newsletter&rdquo;).</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced settings */}
      <Card className="border border-border">
        <CardHeader>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between"
          >
            <div>
              <CardTitle className="text-[14px] text-left">Ablauf & Tracking</CardTitle>
              <CardDescription className="text-[12px] text-left">Ablaufdatum, Weiterleitungen und Herkunfts-Tracking</CardDescription>
            </div>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CardHeader>
        {showAdvanced && (
          <CardContent className="space-y-5">
            {/* Expiry section */}
            <div>
              <p className="text-[12px] font-medium mb-3">Zeitliche Begrenzung</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[12px] text-muted-foreground">Link gültig bis</Label>
                  <Input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="h-9 text-[13px]"
                  />
                  <p className="text-[11px] text-muted-foreground">Nach diesem Zeitpunkt wird der Link deaktiviert.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[12px] text-muted-foreground">Wohin nach Ablauf?</Label>
                  <Input
                    type="url"
                    placeholder="https://meine-seite.de/nicht-mehr-verfügbar"
                    value={expiredUrl}
                    onChange={(e) => setExpiredUrl(e.target.value)}
                    className="h-9 text-[13px]"
                  />
                  <p className="text-[11px] text-muted-foreground">Besucher werden nach Ablauf hierhin weitergeleitet. Ohne Angabe sehen sie eine Standard-Hinweisseite.</p>
                </div>
              </div>
            </div>

            {/* UTM section */}
            <div className="border-t border-border pt-4">
              <p className="text-[12px] font-medium mb-1">Herkunfts-Tracking (UTM)</p>
              <p className="text-[11px] text-muted-foreground mb-3">
                Diese Parameter werden an die Ziel-URL angehängt, damit du in Google Analytics o.ä. siehst, woher die Besucher kommen.
              </p>
              <div className="mb-3">
                <UtmTemplatePicker
                  onSelect={(values) => {
                    if (values.utm_source) setUtmSource(values.utm_source);
                    if (values.utm_medium) setUtmMedium(values.utm_medium);
                    if (values.utm_campaign) setUtmCampaign(values.utm_campaign);
                    if (values.utm_content) setUtmContent(values.utm_content);
                  }}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[12px] text-muted-foreground">Quelle</Label>
                  <Input
                    placeholder="z.B. newsletter, instagram, flyer"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    className="h-8 text-[13px]"
                  />
                  <p className="text-[11px] text-muted-foreground">Wo wird der Link geteilt?</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] text-muted-foreground">Medium</Label>
                  <Input
                    placeholder="link"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    className="h-8 text-[13px]"
                  />
                  <p className="text-[11px] text-muted-foreground">Art des Kanals (z.B. email, social, print)</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] text-muted-foreground">Kampagnenname</Label>
                  <Input
                    placeholder="z.B. sommer-aktion-2026"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    className="h-8 text-[13px]"
                  />
                  <p className="text-[11px] text-muted-foreground">Name der Marketing-Aktion</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] text-muted-foreground">Inhalt</Label>
                  <Input
                    placeholder="z.B. header-button, sidebar-banner"
                    value={utmContent}
                    onChange={(e) => setUtmContent(e.target.value)}
                    className="h-8 text-[13px]"
                  />
                  <p className="text-[11px] text-muted-foreground">Welches Element genau? (bei mehreren Links)</p>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Abbrechen
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={isPending}>
          {isPending ? (
            <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Wird erstellt...</>
          ) : 'Link erstellen'}
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Link2, ChevronDown, ChevronUp } from 'lucide-react';

import { createShortLink, getLinkGroups } from '../actions';
import { createClient } from '@/lib/supabase/client';

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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [origin, setOrigin] = useState('');

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

  useEffect(() => {
    setOrigin(window.location.origin);
    const supabase = createClient();

    async function load() {
      const [campaignsRes, groupsRes] = await Promise.all([
        supabase.from('campaigns').select('id, name').order('name'),
        getLinkGroups(),
      ]);
      setCampaigns((campaignsRes.data || []) as Campaign[]);
      setGroups(groupsRes as Group[]);
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

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-in-card">
      <PageHeader
        title="Neuer Kurzlink"
        description="Erstelle einen trackbaren Kurzlink."
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

          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Kurzcode (optional)</Label>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] text-muted-foreground shrink-0">
                {origin}/r/
              </span>
              <Input
                placeholder="auto-generiert"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
                className="h-9 text-[13px]"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Leer lassen fuer automatischen 7-Zeichen-Code, oder eigenen Slug eingeben.
            </p>
          </div>

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
              <Label className="text-[12px] text-muted-foreground">Kampagne</Label>
              <Select value={campaignId} onValueChange={(v) => setCampaignId(v ?? '')}>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue placeholder="Keine Kampagne" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Keine Kampagne</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">Gruppe</Label>
              <Select value={groupId} onValueChange={(v) => setGroupId(v ?? '')}>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue placeholder="Keine Gruppe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Keine Gruppe</SelectItem>
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
            <CardTitle className="text-[14px]">Erweiterte Einstellungen</CardTitle>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CardHeader>
        {showAdvanced && (
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">Ablaufdatum</Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="h-9 text-[13px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">Weiterleitung nach Ablauf</Label>
              <Input
                type="url"
                placeholder="https://example.com/abgelaufen"
                value={expiredUrl}
                onChange={(e) => setExpiredUrl(e.target.value)}
                className="h-9 text-[13px]"
              />
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-[12px] font-medium mb-3">UTM-Parameter</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[12px] text-muted-foreground">utm_source</Label>
                  <Input
                    placeholder="z.B. newsletter, instagram"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    className="h-8 text-[13px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] text-muted-foreground">utm_medium</Label>
                  <Input
                    placeholder="link"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    className="h-8 text-[13px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] text-muted-foreground">utm_campaign</Label>
                  <Input
                    placeholder="z.B. sommer-2026"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    className="h-8 text-[13px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] text-muted-foreground">utm_content</Label>
                  <Input
                    placeholder="z.B. header-cta"
                    value={utmContent}
                    onChange={(e) => setUtmContent(e.target.value)}
                    className="h-8 text-[13px]"
                  />
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

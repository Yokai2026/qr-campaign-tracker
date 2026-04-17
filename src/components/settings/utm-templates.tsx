'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Tag, Trash2, Plus, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  getUtmTemplates,
  createUtmTemplate,
  deleteUtmTemplate,
} from '@/app/(dashboard)/settings/utm-actions';
import type { UtmTemplate } from '@/types';

export function UtmTemplates() {
  const [templates, setTemplates] = useState<UtmTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [name, setName] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const [utmId, setUtmId] = useState('');

  useEffect(() => {
    getUtmTemplates().then((data) => {
      setTemplates(data);
      setLoading(false);
    });
  }, []);

  function handleCreate() {
    if (!name.trim()) { toast.error('Name fehlt'); return; }
    startTransition(async () => {
      const result = await createUtmTemplate({
        name,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_content: utmContent,
        utm_id: utmId,
      });
      if (!result.success) {
        toast.error(result.error || 'Fehler beim Erstellen');
        return;
      }
      toast.success('UTM-Template erstellt');
      setShowForm(false);
      resetForm();
      const updated = await getUtmTemplates();
      setTemplates(updated);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteUtmTemplate(id);
      if (!result.success) {
        toast.error(result.error || 'Fehler beim Loeschen');
        return;
      }
      toast.success('Template geloescht');
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    });
  }

  function resetForm() {
    setName('');
    setUtmSource('');
    setUtmMedium('');
    setUtmCampaign('');
    setUtmContent('');
    setUtmId('');
  }

  if (loading) {
    return (
      <Card className="border border-border">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-[14px]">UTM-Templates</CardTitle>
              <CardDescription className="text-[12px]">
                Wiederverwendbare UTM-Parameter-Vorlagen fuer QR-Codes und Links
              </CardDescription>
            </div>
          </div>
          {!showForm && (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Neues Template
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create form */}
        {showForm && (
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">Template-Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Social Media Standard"
                className="h-8 text-[13px]"
                autoFocus
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">Quelle (utm_source)</Label>
                <Input
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  placeholder="z.B. qr, instagram, flyer"
                  className="h-8 text-[13px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">Kanal (utm_medium)</Label>
                <Input
                  value={utmMedium}
                  onChange={(e) => setUtmMedium(e.target.value)}
                  placeholder="z.B. offline, social, email"
                  className="h-8 text-[13px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">Kampagne (utm_campaign)</Label>
                <Input
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  placeholder="z.B. sommer-aktion-2026"
                  className="h-8 text-[13px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">Inhalt (utm_content)</Label>
                <Input
                  value={utmContent}
                  onChange={(e) => setUtmContent(e.target.value)}
                  placeholder="z.B. banner-top, cta-footer"
                  className="h-8 text-[13px]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">Kampagnen-ID (utm_id, optional)</Label>
              <Input
                value={utmId}
                onChange={(e) => setUtmId(e.target.value)}
                placeholder="z.B. interne Referenznummer"
                className="h-8 text-[13px]"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={isPending}>
                {isPending ? (
                  <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Erstelle...</>
                ) : 'Erstellen'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); resetForm(); }}>
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        {/* Existing templates */}
        {templates.length === 0 && !showForm ? (
          <p className="text-[13px] text-muted-foreground py-2">
            Noch keine UTM-Templates erstellt.
          </p>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-medium truncate">{t.name}</div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {t.utm_source && <UtmBadge label="source" value={t.utm_source} />}
                    {t.utm_medium && <UtmBadge label="medium" value={t.utm_medium} />}
                    {t.utm_campaign && <UtmBadge label="campaign" value={t.utm_campaign} />}
                    {t.utm_content && <UtmBadge label="content" value={t.utm_content} />}
                    {t.utm_id && <UtmBadge label="id" value={t.utm_id} />}
                  </div>
                </div>
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" title="Template loeschen" disabled={isPending}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  }
                  title="Template loeschen?"
                  description={`Das UTM-Template "${t.name}" wird unwiderruflich geloescht.`}
                  confirmLabel="Loeschen"
                  onConfirm={() => handleDelete(t.id)}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UtmBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground font-mono">
      <span className="text-muted-foreground/60">{label}=</span>{value}
    </span>
  );
}

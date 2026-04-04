'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Mail, Trash2, Plus, Loader2, Clock } from 'lucide-react';
import type { ReportFrequency } from '@/types';

type Schedule = {
  id: string;
  email: string;
  frequency: ReportFrequency;
  campaign_id: string | null;
  active: boolean;
  last_sent_at: string | null;
  next_run_at: string;
  campaign: { id: string; name: string } | null;
};

type Campaign = { id: string; name: string };

const FREQUENCY_LABELS: Record<ReportFrequency, string> = {
  daily: 'Taeglich',
  weekly: 'Woechentlich',
  monthly: 'Monatlich',
};

export function ReportSchedules() {
  const supabase = createClient();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState<ReportFrequency>('weekly');
  const [campaignId, setCampaignId] = useState<string>('all');

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [schedulesRes, campaignsRes, profileRes] = await Promise.all([
      supabase
        .from('report_schedules')
        .select('*, campaign:campaigns(id, name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('campaigns').select('id, name').order('name'),
      supabase.from('profiles').select('email').eq('id', user.id).single(),
    ]);

    setSchedules((schedulesRes.data || []) as Schedule[]);
    setCampaigns((campaignsRes.data || []) as Campaign[]);
    if (profileRes.data?.email && !email) {
      setEmail(profileRes.data.email);
    }
    setLoading(false);
  }, [supabase, email]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleCreate() {
    if (!email) { toast.error('E-Mail-Adresse fehlt'); return; }
    setCreating(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); return; }

    const nextRun = computeNextRun(frequency);

    const { error } = await supabase.from('report_schedules').insert({
      user_id: user.id,
      email,
      frequency,
      campaign_id: campaignId === 'all' ? null : campaignId,
      next_run_at: nextRun.toISOString(),
    });

    if (error) {
      toast.error('Fehler: ' + error.message);
    } else {
      toast.success('Report-Zeitplan erstellt');
      setShowForm(false);
      await loadData();
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from('report_schedules')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Fehler: ' + error.message);
    } else {
      toast.success('Zeitplan gelöscht');
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    }
  }

  async function handleToggle(id: string, active: boolean) {
    const { error } = await supabase
      .from('report_schedules')
      .update({ active, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Fehler: ' + error.message);
    } else {
      setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, active } : s));
    }
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
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-[14px]">Automatische Reports</CardTitle>
              <CardDescription className="text-[12px]">
                KPI-Zusammenfassung per E-Mail erhalten
              </CardDescription>
            </div>
          </div>
          {!showForm && (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Neuer Zeitplan
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create form */}
        {showForm && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">E-Mail</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="report@example.com"
                  className="h-8 text-[13px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">Frequenz</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as ReportFrequency)}>
                  <SelectTrigger className="h-8 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Taeglich</SelectItem>
                    <SelectItem value="weekly">Woechentlich</SelectItem>
                    <SelectItem value="monthly">Monatlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">Kampagne</Label>
                <Select value={campaignId} onValueChange={(v) => setCampaignId(v ?? 'all')}>
                  <SelectTrigger className="h-8 text-[13px]">
                    <SelectValue>
                      {campaignId === 'all' ? 'Alle Kampagnen' : campaigns.find((c) => c.id === campaignId)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kampagnen</SelectItem>
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Erstelle...</>
                ) : 'Erstellen'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        {/* Existing schedules */}
        {schedules.length === 0 && !showForm ? (
          <p className="text-[13px] text-muted-foreground py-2">
            Noch keine automatischen Reports eingerichtet.
          </p>
        ) : (
          <div className="space-y-2">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Switch
                    checked={s.active}
                    onCheckedChange={(checked) => handleToggle(s.id, checked)}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[13px]">
                      <span className="font-medium truncate">{s.email}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {FREQUENCY_LABELS[s.frequency]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {s.campaign?.name || 'Alle Kampagnen'}
                      {s.last_sent_at && (
                        <span> &middot; Zuletzt: {new Date(s.last_sent_at).toLocaleDateString('de-DE')}</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(s.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {!process.env.NEXT_PUBLIC_RESEND_CONFIGURED && (
          <p className="text-[11px] text-muted-foreground/60 pt-1">
            Hinweis: E-Mail-Versand erfordert RESEND_API_KEY in den Umgebungsvariablen.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function computeNextRun(frequency: ReportFrequency): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(7, 0, 0, 0);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + (7 - next.getDay() + 1) % 7 || 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1, 1);
      break;
  }
  return next;
}

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
import { Bell, Trash2, Plus, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import type { AlertMetric } from '@/types';

type Alert = {
  id: string;
  email: string;
  metric: AlertMetric;
  threshold: number;
  cooldown_hours: number;
  campaign_id: string | null;
  active: boolean;
  last_triggered_at: string | null;
  campaign: { id: string; name: string } | null;
};

type Campaign = { id: string; name: string };

const METRIC_LABELS: Record<AlertMetric, string> = {
  total_scans: 'Scans gesamt',
  unique_visitors: 'Einzelne Besucher',
};

export function ScanAlerts() {
  const supabase = createClient();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [metric, setMetric] = useState<AlertMetric>('total_scans');
  const [threshold, setThreshold] = useState('100');
  const [campaignId, setCampaignId] = useState<string>('all');

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [alertsRes, campaignsRes, profileRes] = await Promise.all([
      supabase
        .from('scan_alerts')
        .select('*, campaign:campaigns(id, name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('campaigns').select('id, name').order('name'),
      supabase.from('profiles').select('email').eq('id', user.id).single(),
    ]);

    setAlerts((alertsRes.data || []) as Alert[]);
    setCampaigns((campaignsRes.data || []) as Campaign[]);
    if (profileRes.data?.email && !email) {
      setEmail(profileRes.data.email);
    }
    setLoading(false);
  }, [supabase, email]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleCreate() {
    if (!email) { toast.error('E-Mail-Adresse fehlt'); return; }
    const parsedThreshold = parseInt(threshold, 10);
    if (!parsedThreshold || parsedThreshold <= 0) {
      toast.error('Schwellwert muss groesser als 0 sein');
      return;
    }
    setCreating(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); return; }

    const { error } = await supabase.from('scan_alerts').insert({
      user_id: user.id,
      email,
      metric,
      threshold: parsedThreshold,
      campaign_id: campaignId === 'all' ? null : campaignId,
    });

    if (error) {
      toast.error('Fehler: ' + error.message);
    } else {
      toast.success('Scan-Alert erstellt');
      setShowForm(false);
      setThreshold('100');
      await loadData();
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from('scan_alerts')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Fehler: ' + error.message);
    } else {
      toast.success('Alert geloescht');
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }
  }

  async function handleToggle(id: string, active: boolean) {
    const { error } = await supabase
      .from('scan_alerts')
      .update({ active, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Fehler: ' + error.message);
    } else {
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, active } : a));
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
            <Bell className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-[14px]">Scan-Alerts</CardTitle>
              <CardDescription className="text-[12px]">
                E-Mail-Benachrichtigung bei Erreichen eines Schwellwerts
              </CardDescription>
            </div>
          </div>
          {!showForm && (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Neuer Alert
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create form */}
        {showForm && (
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">E-Mail</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alert@example.com"
                  className="h-8 text-[13px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">Metrik</Label>
                <Select value={metric} onValueChange={(v) => setMetric(v as AlertMetric)}>
                  <SelectTrigger className="h-8 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total_scans">Scans gesamt</SelectItem>
                    <SelectItem value="unique_visitors">Einzelne Besucher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">Schwellwert</Label>
                <Input
                  type="number"
                  min="1"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="100"
                  className="h-8 text-[13px]"
                />
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

        {/* Existing alerts */}
        {alerts.length === 0 && !showForm ? (
          <p className="text-[13px] text-muted-foreground py-2">
            Noch keine Scan-Alerts eingerichtet.
          </p>
        ) : (
          <div className="space-y-2">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Switch
                    checked={a.active}
                    onCheckedChange={(checked) => handleToggle(a.id, checked)}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[13px]">
                      <span className="font-medium truncate">{a.email}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {METRIC_LABELS[a.metric]} &ge; {a.threshold.toLocaleString('de-DE')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                      <Bell className="h-3 w-3" />
                      {a.campaign?.name || 'Alle Kampagnen'}
                      {a.last_triggered_at && (
                        <span> &middot; Zuletzt: {new Date(a.last_triggered_at).toLocaleDateString('de-DE')}</span>
                      )}
                    </div>
                  </div>
                </div>
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" title="Alert loeschen">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  }
                  title="Alert loeschen?"
                  description="Dieser Scan-Alert wird unwiderruflich geloescht."
                  confirmLabel="Loeschen"
                  onConfirm={() => handleDelete(a.id)}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

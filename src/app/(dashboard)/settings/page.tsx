'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User, Shield, Code, Loader2, Trash2, Download, ScrollText } from 'lucide-react';
import { deleteAccount } from './account-actions';
import { ReportSchedules } from '@/components/settings/report-schedules';
import { ScanAlerts } from '@/components/settings/scan-alerts';
import { UtmTemplates } from '@/components/settings/utm-templates';
import { CustomDomains } from '@/components/settings/custom-domains';
import { SubscriptionCard } from '@/components/settings/subscription-card';
import { PageHeader } from '@/components/shared/page-header';
import type { Profile, Subscription } from '@/types';

type ProfileFormValues = {
  username: string;
  display_name: string;
};

export default function SettingsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState('');

  const { register, handleSubmit, reset } = useForm<ProfileFormValues>({
    defaultValues: { username: '', display_name: '' },
  });

  useEffect(() => {
    setOrigin(window.location.origin);
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data as Profile);
        reset({ username: data.username || '', display_name: data.display_name || '' });
      }
      // Load subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (subData) setSubscription(subData as Subscription);
    }
    load();
  }, [supabase, reset]);

  async function onSubmit(data: ProfileFormValues) {
    if (!profile) return;
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username: data.username, display_name: data.display_name })
      .eq('id', profile.id);

    if (error) {
      toast.error('Fehler beim Speichern');
    } else {
      toast.success('Profil aktualisiert');
    }
    setLoading(false);
  }

  async function handlePasswordReset() {
    if (!profile) return;
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email);
    if (error) {
      toast.error('Fehler: ' + error.message);
    } else {
      toast.success('Passwort-Reset E-Mail gesendet');
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in-card">
      <PageHeader
        title="Einstellungen"
        description="Profil und Kontoeinstellungen verwalten"
      />

      <SubscriptionCard
        subscription={subscription}
        trialEndsAt={profile.trial_ends_at}
        checkoutUrls={{
          monthly: `/api/checkout?plan=monthly`,
          yearly: `/api/checkout?plan=yearly`,
        }}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-border">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <CardTitle className="text-[14px]">Profil</CardTitle>
                <CardDescription className="text-[12px]">Deine persönlichen Informationen</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="settings-email" className="text-[12px] text-muted-foreground">E-Mail</Label>
                <Input id="settings-email" value={profile.email} disabled className="h-8 text-[13px] bg-muted/30" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-[12px] text-muted-foreground">Benutzername</Label>
                <Input
                  id="username"
                  {...register('username')}
                  placeholder="mein_name"
                  className="h-8 text-[13px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="display_name" className="text-[12px] text-muted-foreground">Anzeigename</Label>
                <Input
                  id="display_name"
                  {...register('display_name')}
                  placeholder="Dein Name"
                  className="h-8 text-[13px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="settings-role" className="text-[12px] text-muted-foreground">Rolle</Label>
                <Input id="settings-role" value={profile.role === 'admin' ? 'Administrator' : 'Editor'} disabled className="h-8 text-[13px] bg-muted/30" />
              </div>
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : 'Speichern'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border border-border">
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <CardTitle className="text-[14px]">Sicherheit</CardTitle>
                  <CardDescription className="text-[12px]">Passwort und Zugangsdaten</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" onClick={handlePasswordReset}>
                Passwort zurücksetzen
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <Code className="h-4 w-4 text-muted-foreground" />
                <div>
                  <CardTitle className="text-[14px]">Tracking-Script</CardTitle>
                  <CardDescription className="text-[12px]">
                    Auf deinen Landingpages einbinden
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-neutral-900 p-3 font-mono text-[12px] text-neutral-300">
                {`<script src="${origin}/tracker.js"></script>`}
              </div>
              <p className="mt-2 text-[12px] text-muted-foreground">
                Das Script erkennt QR-Attributionsparameter automatisch aus der URL.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Custom Domains */}
      <CustomDomains />

      {/* Report Schedules */}
      <ReportSchedules />

      {/* Scan Alerts */}
      <ScanAlerts />

      {/* UTM Templates */}
      <UtmTemplates />

      {/* Datenexport (DSGVO Art. 20) */}
      <Card className="border border-border">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <Download className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-[14px]">Meine Daten exportieren</CardTitle>
              <CardDescription className="text-[12px]">
                Alle deine personenbezogenen Daten als JSON herunterladen (Art. 20 DSGVO — Datenportabilität)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-[12px] text-muted-foreground mb-3">
            Der Export enthält dein Profil, Kampagnen, Platzierungen, QR-Codes, Kurzlinks, Report-Einstellungen
            und Custom Domains. Anonymisierte Tracking-Daten (Scans) sind nicht enthalten, da sie keinen
            direkten Personenbezug haben.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = '/api/export/my-data';
            }}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Daten herunterladen
          </Button>
        </CardContent>
      </Card>

      {/* Audit-Log — nur für Admins */}
      {profile.role === 'admin' && (
        <Card className="border border-border">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <ScrollText className="h-4 w-4 text-muted-foreground" />
              <div>
                <CardTitle className="text-[14px]">Audit-Log</CardTitle>
                <CardDescription className="text-[12px]">
                  Sicherheitsrelevante Aktionen im System einsehen
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" render={<a href="/settings/audit-log" />}>
              <ScrollText className="mr-1.5 h-3.5 w-3.5" />
              Audit-Log öffnen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Gefahrenzone */}
      <Card className="border border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <Trash2 className="h-4 w-4 text-destructive" />
            <div>
              <CardTitle className="text-[14px] text-destructive">Gefahrenzone</CardTitle>
              <CardDescription className="text-[12px]">
                Konto und alle zugehörigen Daten unwiderruflich löschen
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-[12px] text-muted-foreground mb-3">
            Diese Aktion löscht dein Konto, dein Profil und alle damit verbundenen Daten.
            Anonymisierte Tracking-Daten (Scans) bleiben erhalten, da sie keinen Personenbezug haben.
            Dieser Vorgang kann nicht rückgängig gemacht werden.
          </p>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </div>
  );
}

function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteAccount();
    if (!result.success) {
      toast.error(result.error || 'Fehler beim Löschen');
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
        Konto löschen
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="destructive" size="sm" disabled={deleting} onClick={handleDelete}>
        {deleting ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            Wird gelöscht...
          </>
        ) : 'Endgültig löschen'}
      </Button>
      <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={deleting}>
        Abbrechen
      </Button>
    </div>
  );
}

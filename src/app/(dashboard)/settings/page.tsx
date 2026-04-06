'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User, Shield, Code, Loader2 } from 'lucide-react';
import { ReportSchedules } from '@/components/settings/report-schedules';
import { CustomDomains } from '@/components/settings/custom-domains';
import { PageHeader } from '@/components/shared/page-header';
import type { Profile } from '@/types';

type ProfileFormValues = {
  username: string;
  display_name: string;
};

export default function SettingsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
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
    </div>
  );
}

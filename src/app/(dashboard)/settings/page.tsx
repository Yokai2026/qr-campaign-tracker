'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User, Shield, Code, Loader2 } from 'lucide-react';
import type { Profile } from '@/types';

export default function SettingsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data as Profile);
        setDisplayName(data.display_name || '');
      }
    }
    load();
  }, [supabase]);

  async function handleSave() {
    if (!profile) return;
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
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
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Einstellungen</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">Profil und Kontoeinstellungen verwalten</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-border">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <CardTitle className="text-[14px]">Profil</CardTitle>
                <CardDescription className="text-[12px]">Ihre persönlichen Informationen</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">E-Mail</Label>
              <Input value={profile.email} disabled className="h-8 text-[13px] bg-muted/30" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">Anzeigename</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ihr Name"
                className="h-8 text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">Rolle</Label>
              <Input value={profile.role === 'admin' ? 'Administrator' : 'Editor'} disabled className="h-8 text-[13px] bg-muted/30" />
            </div>
            <Button size="sm" onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Wird gespeichert...
                </>
              ) : 'Speichern'}
            </Button>
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
                    Auf Ihren Landingpages einbinden
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
    </div>
  );
}

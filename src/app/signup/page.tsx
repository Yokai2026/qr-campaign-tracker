'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

function formatDateDE(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (username.length < 3) {
      setError('Benutzername muss mindestens 3 Zeichen haben');
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Benutzername darf nur Buchstaben, Zahlen, - und _ enthalten');
      setLoading(false);
      return;
    }

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: username,
        },
      },
    });

    if (signupError) {
      setError('Registrierung fehlgeschlagen. Bitte prüfe deine Eingaben.');
      setLoading(false);
      return;
    }

    // Fetch profile to surface the trial_ends_at set by the signup trigger
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('trial_ends_at')
        .eq('id', user.id)
        .single();
      if (profile?.trial_ends_at) {
        setTrialEndsAt(profile.trial_ends_at);
        setLoading(false);
        return;
      }
    }

    // Fallback: no trial info available — redirect directly
    router.push('/dashboard');
    router.refresh();
  }

  if (trialEndsAt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm animate-in-page">
          <Card className="border border-border">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <CardTitle className="text-lg font-semibold tracking-tight">Willkommen bei Spurig!</CardTitle>
              <CardDescription className="text-[13px]">
                Dein Konto wurde erstellt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="text-[13px] font-medium">14 Tage kostenlos testen</span>
                </div>
                <p className="mt-2 text-[12px] text-muted-foreground">
                  Dein Testzeitraum endet am{' '}
                  <span className="font-semibold text-foreground">{formatDateDE(trialEndsAt)}</span>.
                  Bis dahin kannst du alle Funktionen unbegrenzt nutzen.
                </p>
              </div>
              <Button
                size="sm"
                className="mt-4 w-full"
                onClick={() => {
                  router.push('/dashboard');
                  router.refresh();
                }}
              >
                Zum Dashboard
              </Button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Kein Zahlungsmittel erforderlich.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-in-page">
        <Card className="border border-border">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <QrCode className="h-5 w-5 text-primary-foreground" />
            </div>
            <CardTitle className="text-lg font-semibold tracking-tight">Konto erstellen</CardTitle>
            <CardDescription className="text-[13px]">
              Registriere dich, um Kampagnen zu verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-5 rounded-md border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-900 dark:bg-blue-950/30">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-[12px] font-semibold text-blue-900 dark:text-blue-300">
                  14 Tage kostenlos testen
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Kein Zahlungsmittel erforderlich. Danach Einführungspreis:{' '}
                <span className="line-through">12,99 €/Mo</span>{' '}
                <strong className="text-foreground">5,99 €/Mo</strong> (oder{' '}
                <strong className="text-foreground">4,99 €/Mo</strong> im Jahresabo).
                Kein Auto-Upgrade — du entscheidest selbst.
              </p>
            </div>
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-2.5 text-[13px] font-medium text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-[12px] text-muted-foreground">Benutzername</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="mein_name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-9 text-[13px]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[12px] text-muted-foreground">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@beispiel.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-[13px]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[12px] text-muted-foreground">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mindestens 10 Zeichen"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 text-[13px]"
                  minLength={10}
                  required
                />
              </div>
              <Button type="submit" size="sm" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Wird erstellt...
                  </>
                ) : (
                  'Konto erstellen'
                )}
              </Button>
            </form>
            <p className="mt-4 text-center text-[12px] text-muted-foreground">
              Bereits ein Konto?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Anmelden
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-[11px] text-muted-foreground/50">
          Spurig &middot; Multi-Channel Kampagnen-Tracking
        </p>
      </div>
    </div>
  );
}

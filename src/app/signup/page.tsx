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

    // Pre-Check: Username bereits vergeben? (case-insensitive via RPC)
    const { data: taken, error: checkError } = await supabase.rpc('username_exists', {
      lookup_username: username,
    });
    if (checkError) {
      setError('Benutzername konnte nicht geprüft werden. Bitte versuche es erneut.');
      setLoading(false);
      return;
    }
    if (taken === true) {
      setError('Dieser Benutzername ist bereits vergeben. Bitte wähle einen anderen.');
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
      // Race-Condition-Fallback: Wenn der Pre-Check sauber war, aber der Trigger
      // trotzdem am Unique-Index scheitert (paralleler Signup), ist das die
      // plausibelste Ursache für einen DB-Fehler.
      const msg = signupError.message?.toLowerCase() ?? '';
      if (msg.includes('database') || msg.includes('duplicate') || msg.includes('unique')) {
        setError('Dieser Benutzername ist bereits vergeben. Bitte wähle einen anderen.');
      } else if (msg.includes('already registered') || msg.includes('already exists')) {
        setError('Diese E-Mail-Adresse ist bereits registriert.');
      } else {
        setError('Registrierung fehlgeschlagen. Bitte prüfe deine Eingaben.');
      }
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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 50% 50% at 50% 30%, oklch(0.66 0.13 185 / 0.10), transparent 65%)',
          }}
        />
        <div className="relative w-full max-w-sm animate-in-page">
          <Card className="border border-border shadow-[var(--shadow-lg)]">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 shadow-[var(--shadow-sm)]">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <CardTitle className="text-xl font-semibold tracking-tight">
                Willkommen bei Spurig!
              </CardTitle>
              <CardDescription className="text-[13px]">
                Dein Konto ist startklar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-brand/20 bg-brand/[0.04] p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand" />
                  <span className="text-[13px] font-semibold">14 Tage kostenlos</span>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                  Dein Testzeitraum endet am{' '}
                  <span className="font-semibold text-foreground">{formatDateDE(trialEndsAt)}</span>.
                  Bis dahin kannst du alle Funktionen unbegrenzt nutzen.
                </p>
              </div>
              <Button
                variant="brand"
                size="lg"
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 25%, oklch(0.66 0.13 185 / 0.08), transparent 65%), radial-gradient(ellipse 40% 40% at 50% 85%, oklch(0.74 0.13 38 / 0.05), transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm animate-in-page">
        <Card className="border border-border shadow-[var(--shadow-lg)]">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.18),var(--shadow-md)]">
              <QrCode className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl font-semibold tracking-tight">
              Konto erstellen
            </CardTitle>
            <CardDescription className="text-[13px]">
              14 Tage kostenlos. Keine Kreditkarte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-5 rounded-2xl border border-brand/20 bg-brand/[0.04] p-3.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                <span className="text-[12px] font-semibold text-foreground">
                  14 Tage kostenlos testen
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Danach Einführungspreis{' '}
                <span className="line-through">12,99 €/Mo</span>{' '}
                <strong className="text-foreground">5,99 €/Mo</strong> (oder{' '}
                <strong className="text-foreground">4,99 €/Mo</strong> jährlich).
                Kein Auto-Upgrade — du entscheidest selbst.
              </p>
            </div>
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-medium text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
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
                  className="h-11 text-[14px]"
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
                  className="h-11 text-[14px]"
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
                  className="h-11 text-[14px]"
                  minLength={10}
                  required
                />
              </div>
              <Button type="submit" variant="brand" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Wird erstellt…
                  </>
                ) : (
                  'Kostenlos starten'
                )}
              </Button>
            </form>
            <p className="mt-5 text-center text-[13px] text-muted-foreground">
              Bereits ein Konto?{' '}
              <Link href="/login" className="font-medium text-foreground transition-colors hover:text-brand">
                Anmelden
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-[11px] text-muted-foreground/60">
          <Link href="/" className="hover:text-foreground transition-colors">← Zurück zur Startseite</Link>
        </p>
      </div>
    </div>
  );
}

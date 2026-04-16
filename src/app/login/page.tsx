'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    let email = identifier;

    // If input doesn't look like an email, resolve username via RPC function
    // (SECURITY DEFINER bypasses RLS, works with anon key)
    if (!identifier.includes('@')) {
      const { data: resolved } = await supabase.rpc('resolve_username', {
        lookup_username: identifier,
      });

      if (!resolved) {
        setError('Benutzername nicht gefunden');
        setLoading(false);
        return;
      }
      email = resolved;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Ungültige Anmeldedaten');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Soft brand + warm glow for premium feel */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 30%, oklch(0.66 0.13 185 / 0.08), transparent 65%), radial-gradient(ellipse 40% 40% at 50% 80%, oklch(0.74 0.13 38 / 0.05), transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm animate-in-page">
        <Card className="border border-border shadow-[var(--shadow-lg)]">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.18),var(--shadow-md)]">
              <QrCode className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl font-semibold tracking-tight">
              Willkommen zurück
            </CardTitle>
            <CardDescription className="text-[13px]">
              Melde dich an, um deine Kampagnen zu verwalten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-medium text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-[12px] text-muted-foreground">Benutzername oder E-Mail</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="name@beispiel.de oder benutzername"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-11 text-[14px]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[12px] text-muted-foreground">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 text-[14px]"
                  required
                />
              </div>
              <Button type="submit" variant="brand" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Wird angemeldet…
                  </>
                ) : (
                  'Anmelden'
                )}
              </Button>
            </form>
            <p className="mt-5 text-center text-[13px] text-muted-foreground">
              Noch kein Konto?{' '}
              <Link href="/signup" className="font-medium text-foreground transition-colors hover:text-brand">
                14 Tage kostenlos testen
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-5 text-center text-[11px] text-muted-foreground/60">
          <Link href="/" className="hover:text-foreground transition-colors">← Zurück zur Startseite</Link>
        </p>
      </div>
    </div>
  );
}

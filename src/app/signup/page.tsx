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

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: username,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
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
                  placeholder="Mindestens 6 Zeichen"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 text-[13px]"
                  minLength={6}
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

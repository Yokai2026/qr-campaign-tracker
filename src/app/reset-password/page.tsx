'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    if (password !== confirm) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    setLoading(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateErr) {
      setError(updateErr.message || 'Konnte Passwort nicht setzen.');
      return;
    }

    setDone(true);
    setTimeout(() => router.push('/dashboard'), 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.18),var(--shadow-sm)]">
            <Lock className="h-4 w-4" />
          </div>
          <div className="text-center">
            <h1 className="text-[18px] font-semibold tracking-tight">
              Neues Passwort setzen
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Wähle ein neues Passwort für dein Spurig-Konto.
            </p>
          </div>
        </div>

        {done ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
            <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
            <p className="text-[14px] font-medium text-emerald-900 dark:text-emerald-300">
              Passwort aktualisiert
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Du wirst weitergeleitet…
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-border bg-card p-5"
          >
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[12px] text-muted-foreground">
                Neues Passwort
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 8 Zeichen"
                autoComplete="new-password"
                required
                className="h-9 text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-[12px] text-muted-foreground">
                Passwort wiederholen
              </Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Zur Sicherheit nochmal"
                autoComplete="new-password"
                required
                className="h-9 text-[13px]"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="brand"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Wird gespeichert…
                </>
              ) : (
                'Passwort speichern'
              )}
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-[12px] text-muted-foreground">
          <Link href="/login" className="underline underline-offset-2 hover:text-foreground">
            Zurück zum Login
          </Link>
        </p>
      </div>
    </div>
  );
}

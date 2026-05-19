'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Sparkles } from 'lucide-react';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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

    if (password !== passwordConfirm) {
      setError('Die Passwörter stimmen nicht überein.');
      setLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setError('Bitte stimme den AGB und der Datenschutzerklärung zu.');
      setLoading(false);
      return;
    }

    // Pre-Check: Username bereits vergeben? (case-insensitive via RPC).
    // lookup_email mitgeben — damit der RPC unsen User durchlaesst, wenn er
    // einen unbestaetigten Vor-Signup mit gleichen Daten retry'd (Mig 054).
    const { data: taken, error: checkError } = await supabase.rpc('username_exists', {
      lookup_username: username,
      lookup_email: email,
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
          // Legal-Audit-Trail: timestamp + AGB-Version, gespeichert in raw_user_meta_data
          terms_accepted_at: new Date().toISOString(),
          terms_version: '1.0',
        },
      },
    });

    if (signupError) {
      const msg = signupError.message?.toLowerCase() ?? '';
      const code = signupError.code ?? '';

      // Rate-Limit (Supabase Default-Mailer: 2 Bestaetigungs-Mails / Stunde)
      if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit') || code === 'over_email_send_rate_limit') {
        setError('Zu viele Bestätigungs-Mails in kurzer Zeit. Bitte versuche es in etwa einer Stunde erneut.');
      // Race-Condition: Pre-Check sauber, Trigger scheitert am Unique-Index
      } else if (msg.includes('database') || msg.includes('duplicate') || msg.includes('unique')) {
        setError('Dieser Benutzername ist bereits vergeben. Bitte wähle einen anderen.');
      } else if (msg.includes('already registered') || msg.includes('already exists') || code === 'user_already_exists') {
        setError('Diese E-Mail-Adresse ist bereits registriert. Falls du dich vorher angemeldet hast: Bestätigungsmail prüfen (auch Spam-Ordner) oder über „Anmelden" einloggen und ggf. Passwort zurücksetzen.');
      } else if (msg.includes('password') && (msg.includes('weak') || msg.includes('short') || msg.includes('strength'))) {
        setError('Passwort zu schwach. Bitte wähle mindestens 10 Zeichen mit Buchstaben und Zahlen.');
      } else if (msg.includes('invalid') && msg.includes('email')) {
        setError('Diese E-Mail-Adresse ist ungültig.');
      } else if (msg.includes('captcha')) {
        setError('Sicherheitsprüfung fehlgeschlagen. Bitte lade die Seite neu und versuche es nochmal.');
      } else {
        // Echte Fehlermeldung anzeigen statt generischem Text — wir loggen
        // sie ausserdem in die Console, damit man sie auch beim Support hat.
        console.error('[signup] Unhandled signup error:', signupError);
        setError(`Registrierung fehlgeschlagen: ${signupError.message}`);
      }
      setLoading(false);
      return;
    }

    // Erfolg: Supabase hat eine Bestaetigungsmail mit 6-stelligem Code
    // verschickt. Weiter zur Verify-Page, wo der User den PIN eingibt.
    router.push(`/signup/verify?email=${encodeURIComponent(email)}`);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 25%, oklch(0.64 0.10 185 / 0.06), transparent 65%), radial-gradient(ellipse 40% 40% at 50% 85%, oklch(0.74 0.10 38 / 0.04), transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm animate-in-page">
        <Card className="border border-border shadow-[var(--shadow-lg)]">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center">
              <Image src="/spurig-icon.png" alt="Spurig" width={56} height={56} priority className="h-14 w-14" />
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
                Danach <strong className="text-foreground">12,99 €/Mo netto</strong> (erste 3 Monate nur{' '}
                <strong className="text-foreground">5,99 €/Mo</strong>) oder{' '}
                <strong className="text-foreground">8,99 €/Mo netto</strong> jährlich (107,88 €/Jahr — 31 % günstiger).
                Alle Preise zzgl. 19 % MwSt. Kein Auto-Upgrade — du entscheidest selbst.
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
              <div className="space-y-1.5">
                <Label htmlFor="password-confirm" className="text-[12px] text-muted-foreground">Passwort wiederholen</Label>
                <Input
                  id="password-confirm"
                  type="password"
                  placeholder="Passwort erneut eingeben"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className={`h-11 text-[14px] ${passwordConfirm.length > 0 && passwordConfirm !== password ? 'border-red-500/60 focus-visible:ring-red-500/30' : ''}`}
                  minLength={10}
                  required
                  aria-invalid={passwordConfirm.length > 0 && passwordConfirm !== password}
                />
                {passwordConfirm.length > 0 && passwordConfirm !== password && (
                  <p className="text-[11px] text-red-600 dark:text-red-400">Passwörter stimmen noch nicht überein</p>
                )}
              </div>
              <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 p-3">
                <Checkbox
                  id="accept-terms"
                  checked={acceptedTerms}
                  onCheckedChange={(v) => setAcceptedTerms(v === true)}
                  className="mt-0.5 shrink-0"
                  required
                />
                <label
                  htmlFor="accept-terms"
                  className="block text-[12px] font-normal leading-relaxed text-muted-foreground cursor-pointer select-none"
                >
                  Ich akzeptiere die{' '}
                  <Link href="/agb" target="_blank" className="font-medium text-foreground underline underline-offset-2 hover:text-brand">
                    AGB
                  </Link>
                  {' '}und die{' '}
                  <Link href="/datenschutz" target="_blank" className="font-medium text-foreground underline underline-offset-2 hover:text-brand">
                    Datenschutzerklärung
                  </Link>
                  .
                </label>
              </div>
              <Button
                type="submit"
                variant="brand"
                size="lg"
                className="w-full"
                disabled={loading || password.length === 0 || passwordConfirm !== password || !acceptedTerms}
              >
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

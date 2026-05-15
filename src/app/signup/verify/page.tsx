'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MailCheck, Loader2 } from 'lucide-react';
import { triggerWelcomeEmail } from '@/lib/auth/welcome-action';
import { trackGoogleAdsSignup } from '@/lib/conversion/google-ads';
import { trackMetaLead } from '@/lib/conversion/meta-pixel';

const PIN_LENGTH = 6;

export default function SignupVerifyPage() {
  return (
    <Suspense fallback={<VerifyLoadingFallback />}>
      <SignupVerifyInner />
    </Suspense>
  );
}

function VerifyLoadingFallback() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function SignupVerifyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const email = searchParams.get('email') ?? '';

  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    setError('');

    if (clean && index < PIN_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    const full = next.join('');
    if (full.length === PIN_LENGTH && next.every(Boolean)) {
      void submitPin(full);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
    if (!pasted) return;
    const next = Array(PIN_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i += 1) next[i] = pasted[i];
    setDigits(next);
    const focusIndex = Math.min(pasted.length, PIN_LENGTH - 1);
    inputsRef.current[focusIndex]?.focus();
    if (pasted.length === PIN_LENGTH) {
      void submitPin(pasted);
    }
  }

  async function submitPin(token: string) {
    if (!email) {
      setError('E-Mail-Adresse fehlt. Bitte registriere dich erneut.');
      return;
    }
    setLoading(true);
    setError('');

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });

    if (verifyError) {
      const msg = verifyError.message.toLowerCase();
      if (msg.includes('expired')) {
        setError('Der Code ist abgelaufen. Bitte fordere einen neuen an.');
      } else if (msg.includes('invalid')) {
        setError('Falscher Code. Bitte prüfe die Eingabe.');
      } else {
        setError('Bestätigung fehlgeschlagen. Bitte versuche es erneut.');
      }
      setDigits(Array(PIN_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
      setLoading(false);
      return;
    }

    // Welcome-Mail im Hintergrund anstossen (fire-and-forget).
    // Cookies sind nach verifyOtp gesetzt, die Server Action erbt sie.
    void triggerWelcomeEmail();

    // Google-Ads Conversion-Event: Signup-Verify abgeschlossen = Lead.
    // No-op wenn NEXT_PUBLIC_GOOGLE_ADS_ID nicht gesetzt.
    trackGoogleAdsSignup();

    // Meta-Pixel Lead-Event. No-op wenn NEXT_PUBLIC_META_PIXEL_ID nicht gesetzt.
    trackMetaLead();

    // Harte Navigation statt router.push: Browser uebernimmt das
    // Lade-Indikator, die Verify-Page unmountet sofort, Dashboard
    // wird fresh geladen — keine haengenden "Wird bestaetigt..."-States.
    window.location.assign('/dashboard');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const full = digits.join('');
    if (full.length !== PIN_LENGTH) {
      setError('Bitte gib alle 6 Ziffern ein.');
      return;
    }
    void submitPin(full);
  }

  async function handleResend() {
    if (!email || resendCooldown > 0) return;
    setResending(true);
    setError('');

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (resendError) {
      setError('Code konnte nicht erneut gesendet werden. Versuche es in einer Minute.');
    } else {
      setResendCooldown(60);
    }
    setResending(false);
  }

  if (!email) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <p className="text-[14px] text-muted-foreground">
            Diese Seite kann nur direkt nach der Registrierung aufgerufen werden.
          </p>
          <Link
            href="/signup"
            className="mt-4 inline-block text-[13px] font-medium text-brand hover:text-brand/80"
          >
            Zur Registrierung →
          </Link>
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
            'radial-gradient(ellipse 50% 50% at 50% 25%, oklch(0.64 0.10 185 / 0.08), transparent 65%), radial-gradient(ellipse 40% 40% at 50% 85%, oklch(0.74 0.10 38 / 0.04), transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm animate-in-page">
        <Card className="border border-border shadow-[var(--shadow-lg)]">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 shadow-[var(--shadow-sm)]">
              <MailCheck className="h-5 w-5 text-brand" />
            </div>
            <CardTitle className="text-xl font-semibold tracking-tight">
              E-Mail bestätigen
            </CardTitle>
            <CardDescription className="text-[13px]">
              Wir haben dir einen 6-stelligen Code an{' '}
              <span className="font-medium text-foreground">{email}</span> geschickt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-medium text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputsRef.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => setDigit(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={loading}
                    className="h-12 w-10 rounded-lg border border-input bg-background text-center text-[18px] font-semibold tabular-nums shadow-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
                    aria-label={`Ziffer ${index + 1}`}
                  />
                ))}
              </div>

              <Button
                type="submit"
                variant="brand"
                size="lg"
                className="w-full"
                disabled={loading || digits.join('').length !== PIN_LENGTH}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Wird bestätigt…
                  </>
                ) : (
                  'Bestätigen'
                )}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-[12px] text-muted-foreground">Keinen Code erhalten?</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                className="mt-1 text-[13px] font-medium text-brand transition-colors hover:text-brand/80 disabled:cursor-not-allowed disabled:text-muted-foreground"
              >
                {resending
                  ? 'Wird gesendet…'
                  : resendCooldown > 0
                  ? `Erneut senden in ${resendCooldown}s`
                  : 'Code erneut senden'}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-[11px] text-muted-foreground/60">
          <Link href="/signup" className="hover:text-foreground transition-colors">
            ← Andere E-Mail verwenden
          </Link>
        </p>
      </div>
    </div>
  );
}

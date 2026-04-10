'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertTriangle, Sparkles, Download, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Hard paywall modal shown when a user's trial has expired and they have no
 * active subscription. Intentionally not dismissable — the only way out is to
 * subscribe, export data (DSGVO Art. 20), or log out.
 *
 * Short-link redirects at /r/[code] live outside (dashboard) and are NOT
 * blocked by this modal.
 */
export function TrialEndedModal() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Prevent background scroll while modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-ended-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-card shadow-2xl">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <h2 id="trial-ended-title" className="text-[15px] font-semibold">
              Testzeitraum abgelaufen
            </h2>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Dein 14-tägiger Testzeitraum ist vorbei. Um Spurig weiter zu nutzen, wähle bitte ein Abo.
            Deine bestehenden QR-Codes und Weiterleitungen funktionieren weiterhin.
          </p>

          <div className="space-y-2">
            <a href="/api/checkout?plan=yearly" className="block">
              <Button size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Jährlich — 4,99 €/Mo
                </span>
                <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold">
                  16 % sparen
                </span>
              </Button>
            </a>
            <a href="/api/checkout?plan=monthly" className="block">
              <Button variant="outline" size="sm" className="w-full">
                Monatlich — 5,99 €/Mo
              </Button>
            </a>
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            Abrechnung über Stripe. Jederzeit kündbar.
          </p>

          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <a
              href="/api/export/my-data"
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
            >
              <Download className="h-3 w-3" />
              Daten exportieren (DSGVO)
            </a>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <LogOut className="h-3 w-3" />
              )}
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

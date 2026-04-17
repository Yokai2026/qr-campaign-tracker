'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Settings error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="mt-4 text-[18px] font-semibold tracking-tight">
          Einstellungen konnten nicht geladen werden
        </h1>
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          Ein unerwarteter Fehler ist aufgetreten. Lade die Seite neu oder
          versuche es in ein paar Sekunden erneut.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-muted-foreground/60">
            Fehler-ID: {error.digest}
          </p>
        )}
        <div className="mt-6 flex items-center gap-2">
          <Button onClick={() => reset()} size="sm" variant="brand">
            <RotateCw className="mr-1.5 h-3.5 w-3.5" />
            Erneut versuchen
          </Button>
          <Button
            size="sm"
            variant="outline"
            render={<Link href="/dashboard" />}
          >
            <Home className="mr-1.5 h-3.5 w-3.5" />
            Zum Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="mt-4 text-lg font-semibold tracking-tight">
          Etwas ist schiefgelaufen
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {error.message || 'Ein unerwarteter Fehler ist aufgetreten'}
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
            Fehler-ID: {error.digest}
          </p>
        )}
        <Button onClick={() => reset()} size="sm" className="mt-5">
          <RotateCw className="mr-1.5 h-3.5 w-3.5" />
          Erneut versuchen
        </Button>
      </div>
    </div>
  );
}

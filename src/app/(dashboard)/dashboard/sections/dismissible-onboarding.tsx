'use client';

import { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { dismissOnboarding } from '../actions';
import { toast } from 'sonner';

/**
 * Client wrapper for the onboarding card. Renders children (the card body),
 * overlays a close button (top-right), and hides the card optimistically when
 * clicked. The server action persists the dismiss to profiles.onboarding_dismissed_at.
 */
export function DismissibleOnboarding({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDismiss() {
    setHidden(true); // optimistic
    startTransition(async () => {
      const result = await dismissOnboarding();
      if (!result.success) {
        setHidden(false);
        toast.error(result.error || 'Konnte Tipp nicht ausblenden');
      }
    });
  }

  if (hidden) return null;

  return (
    <div className="relative">
      {children}
      <button
        type="button"
        onClick={handleDismiss}
        disabled={isPending}
        aria-label="Onboarding-Tipps ausblenden"
        className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

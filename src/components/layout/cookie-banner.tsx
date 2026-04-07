'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COOKIE_BANNER_KEY = 'spurig-cookie-notice-seen';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_BANNER_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(COOKIE_BANNER_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm p-4 shadow-lg">
      <div className="mx-auto flex max-w-3xl items-start gap-3 text-[13px] text-muted-foreground">
        <div className="flex-1 space-y-1">
          <p className="font-medium text-foreground text-[13px]">Hinweis zu Cookies</p>
          <p>
            Diese Anwendung verwendet ausschließlich technisch notwendige Cookies für die
            Anmeldung (Session-Verwaltung). Es werden keine Tracking- oder Werbe-Cookies gesetzt.
            Mehr dazu in unserer{' '}
            <Link href="/datenschutz" className="underline underline-offset-2 hover:text-foreground">
              Datenschutzerklärung
            </Link>.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={dismiss} className="shrink-0">
          Verstanden
        </Button>
        <button
          onClick={dismiss}
          className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Schließen"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import { driver, type Driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import './tour.css';
import { markTourCompleted } from '@/lib/auth/tour-actions';

type TourProps = {
  username: string | null;
  autoStart: boolean;
};

// Tour-Component fuer Onboarding. Wird auf /dashboard eingebunden und
// startet automatisch wenn autoStart=true (= profiles.tour_completed_at IS NULL).
// Beim Skip ODER Durchlauf wird tour_completed_at via Server Action gesetzt.
export function Tour({ username, autoStart }: TourProps) {
  const driverRef = useRef<Driver | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!autoStart) return;
    if (startedRef.current) return;
    startedRef.current = true;

    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches;
    const greeting = username ? `Hi ${username},` : 'Hi,';

    const desktopSteps: DriveStep[] = [
      {
        popover: {
          title: 'Willkommen bei Spurig.',
          description: `${greeting} kurze Tour durchs Dashboard &mdash; ca. 30 Sekunden. Du kannst jederzeit überspringen.`,
        },
      },
      {
        element: '[data-tour="sidebar-nav"]',
        popover: {
          title: 'Navigation',
          description: 'Hier findest du alle Bereiche. Wir gehen die wichtigsten kurz durch.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="nav-campaigns"]',
        popover: {
          title: 'Kampagnen',
          description: 'Hier organisierst du deine Aktionen &mdash; z.B. &bdquo;Sommer-Aktion 2026&ldquo;. Eine Kampagne bündelt mehrere QR-Codes und Kurzlinks.',
          side: 'right',
        },
      },
      {
        element: '[data-tour="nav-qr"]',
        popover: {
          title: 'QR-Codes & Kurzlinks',
          description: 'QR-Codes sind für Print (Flyer, Plakate). Kurzlinks für Email, Social Media, Online-Ads. Beide werden getrackt &mdash; jeder Scan und Klick landet im Dashboard.',
          side: 'right',
        },
      },
      {
        element: '[data-tour="nav-analytics"]',
        popover: {
          title: 'Analytik',
          description: 'Scans, Klicks, Geräte, Länder, Conversion-Rates &mdash; alles über alle Kampagnen hinweg.',
          side: 'right',
        },
      },
      {
        element: '[data-tour="search"]',
        popover: {
          title: 'Schnellsuche',
          description: 'Mit <kbd style="background:#1f1f1f;padding:2px 6px;border-radius:4px;color:#22d3ee;font-family:monospace;font-size:12px">Ctrl+K</kbd> findest du alles in 2 Sekunden &mdash; Kampagne, QR-Code, Standort.',
          side: 'right',
        },
      },
      {
        element: '[data-tour="welcome-card"]',
        popover: {
          title: 'Bereit?',
          description: 'Klick auf &bdquo;Erste Kampagne anlegen&ldquo;, um zu starten. Es dauert keine Minute.',
          side: 'bottom',
        },
      },
      {
        popover: {
          title: 'Das war\'s.',
          description: 'Viel Erfolg mit Spurig. Fragen? Schreib uns an <a href="mailto:support@spurig.com" style="color:#22d3ee">support@spurig.com</a>.',
        },
      },
    ];

    const mobileSteps: DriveStep[] = [
      {
        popover: {
          title: 'Willkommen bei Spurig.',
          description: `${greeting} kurze Tour &mdash; 4 Schritte, ca. 15 Sekunden.`,
        },
      },
      {
        popover: {
          title: 'So funktioniert Spurig',
          description: 'Du legst eine <strong>Kampagne</strong> an &rarr; erzeugst <strong>QR-Codes</strong> und <strong>Kurzlinks</strong> &rarr; trackst Scans und Klicks im <strong>Dashboard</strong>.',
        },
      },
      {
        element: '[data-tour="welcome-card"]',
        popover: {
          title: 'Erste Kampagne',
          description: 'Klick hier um deine erste Kampagne anzulegen.',
          side: 'bottom',
        },
      },
      {
        popover: {
          title: 'Das war\'s.',
          description: 'Viel Erfolg. Bei Fragen: <a href="mailto:support@spurig.com" style="color:#22d3ee">support@spurig.com</a>.',
        },
      },
    ];

    const steps = isMobile ? mobileSteps : desktopSteps;

    const d = driver({
      showProgress: true,
      progressText: '{{current}} / {{total}}',
      nextBtnText: 'Weiter',
      prevBtnText: 'Zurück',
      doneBtnText: 'Fertig',
      allowClose: true,
      overlayOpacity: 0.7,
      stagePadding: 6,
      stageRadius: 8,
      popoverClass: 'spurig-tour',
      steps,
      onDestroyStarted: () => {
        // Wird gerufen beim Skip, beim "Fertig"-Klick und beim ESC.
        // In allen Faellen die Tour als erledigt markieren.
        void markTourCompleted();
        d.destroy();
      },
    });

    driverRef.current = d;

    // Kurz warten bis die Sidebar im DOM ist (Suspense-Streaming etc.)
    const startTimer = setTimeout(() => d.drive(), 400);

    return () => {
      clearTimeout(startTimer);
      driverRef.current?.destroy();
    };
  }, [autoStart, username]);

  return null;
}

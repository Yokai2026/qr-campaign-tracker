'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

type ThemeToggleProps = {
  /** Kompakte Pill-Variante für Sidebar, oder Icon-Button für Header. */
  variant?: 'pill' | 'icon';
  className?: string;
};

/**
 * Theme-Toggle — Segmented Control mit 3 Optionen (Hell / Dunkel / System).
 * Rendert nach mount um Hydration-Mismatch zu vermeiden.
 */
export function ThemeToggle({ variant = 'pill', className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (variant === 'icon') {
    // Single icon toggle — cycles light → dark → system
    const current = mounted ? theme : 'system';
    const Icon =
      current === 'dark' ? Moon : current === 'light' ? Sun : Monitor;

    function cycle() {
      if (!mounted) return;
      const next =
        theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
      setTheme(next);
    }

    return (
      <button
        type="button"
        onClick={cycle}
        aria-label={`Theme wechseln — aktuell ${current}`}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all duration-200 hover:border-brand/30 hover:bg-brand/[0.04] hover:text-foreground',
          className,
        )}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }

  // Segmented pill (sidebar, settings)
  const options: { value: 'light' | 'dark' | 'system'; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Hell' },
    { value: 'dark', icon: Moon, label: 'Dunkel' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  const currentValue = mounted ? (theme as 'light' | 'dark' | 'system' | undefined) ?? 'system' : 'system';

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5',
        className,
      )}
    >
      {options.map((opt) => {
        const active = mounted && currentValue === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.label}
            title={opt.label}
            onClick={() => setTheme(opt.value)}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150',
              active
                ? 'bg-brand text-brand-foreground shadow-[var(--shadow-xs)]'
                : 'hover:text-foreground',
            )}
          >
            <opt.icon className="h-3 w-3" />
          </button>
        );
      })}
    </div>
  );
}

// Re-export resolvedTheme helper for cases where consumers need it
export { useTheme };

'use client';

import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type CursorGlowCardProps = {
  children: React.ReactNode;
  className?: string;
  /** Radius des Glows in px. */
  radius?: number;
  /** Strength 0..1 */
  intensity?: number;
  as?: 'div' | 'article' | 'section';
};

/**
 * Card-Wrapper mit Cursor-Spotlight-Effekt (Vercel/Linear-Style).
 * Radial Brand-Glow folgt der Maus — rein visuell, reduziert sich bei
 * prefers-reduced-motion auf statischen Glow in der Mitte.
 */
export function CursorGlowCard({
  children,
  className,
  radius = 340,
  intensity = 0.35,
  as: Tag = 'div',
}: CursorGlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty('--mouse-x', `${x}px`);
    el.style.setProperty('--mouse-y', `${y}px`);
  }, []);

  const El = Tag as 'div';

  return (
    <El
      ref={ref as React.RefObject<HTMLDivElement>}
      onMouseMove={onMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={cn('relative isolate', className)}
      style={
        {
          '--glow-radius': `${radius}px`,
          '--glow-intensity': intensity,
        } as React.CSSProperties
      }
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 -z-[1] rounded-[inherit] transition-opacity duration-300 motion-reduce:!opacity-100',
          active ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          background:
            'radial-gradient(var(--glow-radius) circle at var(--mouse-x, 50%) var(--mouse-y, 50%), oklch(from var(--brand) l c h / var(--glow-intensity)), transparent 70%)',
        }}
      />
      {children}
    </El>
  );
}

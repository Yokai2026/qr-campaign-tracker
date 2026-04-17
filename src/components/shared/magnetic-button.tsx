'use client';

import { useCallback, useRef, type ReactNode } from 'react';

type MagneticProps = {
  children: ReactNode;
  /** Maximum displacement in px. */
  strength?: number;
  /** Smoothing factor (lower = snappier). */
  smoothing?: number;
  className?: string;
};

/**
 * Wraps its child in a div that translates subtly toward the cursor on hover.
 * Used for primary CTAs — adds a modern "magnetic" feel without being gimmicky.
 * Respektiert prefers-reduced-motion (bleibt dann statisch).
 */
export function Magnetic({
  children,
  strength = 8,
  smoothing = 0.5,
  className,
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      if (
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ) {
        return;
      }
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * smoothing;
      const dy = (e.clientY - cy) * smoothing;
      const clampedX = Math.max(-strength, Math.min(strength, dx));
      const clampedY = Math.max(-strength, Math.min(strength, dy));
      el.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
    },
    [strength, smoothing],
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'translate3d(0, 0, 0)';
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{
        transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
}

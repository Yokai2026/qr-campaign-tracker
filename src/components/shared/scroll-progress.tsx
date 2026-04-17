'use client';

import { useEffect, useState } from 'react';

/**
 * Dünne Fortschritts-Leiste am oberen Viewport — zeigt wie weit der User auf
 * der Seite gescrollt hat. Subtil, brand-colored, fix am oberen Rand.
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId: number | null = null;

    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0;
      setProgress(pct);
      rafId = null;
    }

    function onScroll() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update, { passive: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left transform-gpu bg-brand"
      style={{ transform: `scaleX(${progress})`, transition: 'transform 80ms linear' }}
    />
  );
}

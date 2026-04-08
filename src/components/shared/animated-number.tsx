'use client';

import { useEffect, useRef, useState } from 'react';

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  formatFn?: (n: number) => string;
  className?: string;
};

/**
 * Animates a number from 0 to target value using an ease-out curve.
 * Uses requestAnimationFrame for smooth 60fps animation.
 */
export function AnimatedNumber({
  value,
  duration = 800,
  formatFn = (n) => n.toLocaleString('de-DE'),
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState('0');
  const prevValue = useRef(0);
  const rafId = useRef<number>(0);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;

    // Skip animation for small values — rounding makes them flicker
    if (end <= 10 || start === end) {
      setDisplay(formatFn(end));
      prevValue.current = end;
      return;
    }

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplay(formatFn(current));

      if (progress < 1) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        prevValue.current = end;
      }
    }

    rafId.current = requestAnimationFrame(tick);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [value, duration, formatFn]);

  return <span className={className}>{display}</span>;
}

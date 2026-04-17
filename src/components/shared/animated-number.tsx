'use client';

import { useEffect, useRef, useState } from 'react';

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  formatFn?: (n: number) => string;
  /** Start value for the animation (default 0 when `triggerOnView`, else tracked previous value). */
  from?: number;
  /** If true, waits until the element scrolls into view before starting. Starts from `from` (default 0). */
  triggerOnView?: boolean;
  /** Delay (ms) after trigger before animation starts. */
  delay?: number;
  className?: string;
};

/**
 * Animates a number using ease-out cubic.
 *
 * Two modes:
 * - Default (dashboard): animates from previously-shown value → new value on prop change.
 * - `triggerOnView`: starts at `from` (0) and runs once when entering viewport. Skips if reduced-motion.
 */
export function AnimatedNumber({
  value,
  duration = 800,
  formatFn = (n) => n.toLocaleString('de-DE'),
  from,
  triggerOnView = false,
  delay = 0,
  className,
}: AnimatedNumberProps) {
  const viewStart = from ?? 0;
  const [display, setDisplay] = useState(() =>
    formatFn(triggerOnView ? viewStart : 0),
  );
  const prevValue = useRef(0);
  const rafId = useRef<number>(0);
  const spanRef = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (triggerOnView) return; // handled in separate effect

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
  }, [value, duration, formatFn, triggerOnView]);

  useEffect(() => {
    if (!triggerOnView) return;
    const node = spanRef.current;
    if (!node) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setDisplay(formatFn(value));
      return;
    }

    const run = () => {
      if (startedRef.current) return;
      startedRef.current = true;

      const begin = performance.now() + delay;
      const tick = (now: number) => {
        if (now < begin) {
          rafId.current = requestAnimationFrame(tick);
          return;
        }
        const progress = Math.min((now - begin) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(viewStart + (value - viewStart) * eased);
        setDisplay(formatFn(current));
        if (progress < 1) rafId.current = requestAnimationFrame(tick);
        else setDisplay(formatFn(value));
      };
      rafId.current = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.3, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [triggerOnView, value, duration, delay, formatFn, viewStart]);

  return (
    <span ref={spanRef} className={className}>
      {display}
    </span>
  );
}

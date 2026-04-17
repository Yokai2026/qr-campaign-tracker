'use client';

import { useEffect, useRef, useState } from 'react';

type AnimatedPathProps = React.SVGProps<SVGPathElement> & {
  /** Dauer der Draw-In-Animation. */
  duration?: number;
  /** Verzögerung nach Sichtbar-Werden. */
  delay?: number;
};

/**
 * SVG-Path der sich beim Eintritt in den Viewport "zeichnet" (stroke-dashoffset → 0).
 * Respektiert `prefers-reduced-motion`.
 */
export function AnimatedPath({
  duration = 1400,
  delay = 0,
  style,
  ...rest
}: AnimatedPathProps) {
  const ref = useRef<SVGPathElement>(null);
  const [ready, setReady] = useState(false);
  const [length, setLength] = useState<number | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    try {
      setLength(node.getTotalLength());
    } catch {
      setLength(200);
    }

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setReady(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setReady(true);
        observer.disconnect();
      },
      { threshold: 0.25, rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const len = length ?? 0;
  const mergedStyle: React.CSSProperties = {
    strokeDasharray: length ? len : undefined,
    strokeDashoffset: ready ? 0 : len,
    transition: `stroke-dashoffset ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, opacity 200ms ease-out`,
    opacity: length ? 1 : 0,
    ...style,
  };

  return <path ref={ref} style={mergedStyle} {...rest} />;
}

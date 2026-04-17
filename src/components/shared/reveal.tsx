'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type RevealProps = {
  children: React.ReactNode;
  /** Delay in ms before fading in (after first becoming visible). */
  delay?: number;
  /** Vertical translate distance in px during the entrance animation. */
  distance?: number;
  /** Visibility-trigger threshold (0..1). */
  threshold?: number;
  /** Top/bottom margin for the IntersectionObserver — `-10%` triggers earlier. */
  rootMargin?: string;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
};

/**
 * Wraps children in a fade-up animation triggered when the element enters the viewport.
 * Respects `prefers-reduced-motion` automatically (handled in globals.css reduced-motion query).
 * Animates only once per mount (no flicker when scrolling back up).
 */
export function Reveal({
  children,
  delay = 0,
  distance = 12,
  threshold = 0.15,
  rootMargin = '0px 0px -10% 0px',
  className,
  as = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const Tag = as as 'div';
  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        'transition-all duration-700 ease-out motion-reduce:transition-none',
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 motion-reduce:opacity-100',
        className,
      )}
      style={{
        transitionDelay: visible ? `${delay}ms` : '0ms',
        transform: visible ? 'translateY(0)' : `translateY(${distance}px)`,
      }}
    >
      {children}
    </Tag>
  );
}

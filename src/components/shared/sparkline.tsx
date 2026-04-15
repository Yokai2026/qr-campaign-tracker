'use client';

import { useMemo } from 'react';

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
};

/**
 * Lightweight SVG sparkline for inline trend display.
 * Expects an array of numeric values (e.g. last 7 days scan counts).
 */
export function Sparkline({
  data,
  width = 64,
  height = 24,
  color = 'oklch(0.25 0 0)',
  className,
}: SparklineProps) {
  const pathD = useMemo(() => {
    if (data.length < 2) return '';

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const padding = 2;
    const usableH = height - padding * 2;
    const stepX = (width - padding * 2) / (data.length - 1);

    return data
      .map((val, i) => {
        const x = padding + i * stepX;
        const y = padding + usableH - ((val - min) / range) * usableH;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [data, width, height]);

  if (data.length < 2) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

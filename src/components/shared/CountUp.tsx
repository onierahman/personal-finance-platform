'use client';
import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  /** Target value to animate toward. */
  value: number;
  /** Formats the (possibly fractional) animated number for display. */
  format: (n: number) => string;
  /** Animation duration in ms. */
  duration?: number;
  className?: string;
}

// Ease-out cubic — fast start, gentle landing (Apple-ish settle).
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Animates a number counting up from its previous value to `value` on mount
 * and whenever the target changes. Honours prefers-reduced-motion by snapping
 * straight to the final value.
 */
export function CountUp({ value, format, duration = 600, className }: CountUpProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef  = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const from = fromRef.current;
    const to   = value;

    if (reduce || from === to) {
      setDisplay(to);
      fromRef.current = to;
      return;
    }

    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      setDisplay(from + (to - from) * easeOut(t));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      fromRef.current = to; // ensure next run starts from the intended target
    };
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}

'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const COLORS = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#A855F7', '#06B6D4'];

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotate: number;
  drift: number;
}

// Randomized layout is built off-render (in an effect) to keep render pure.
function buildPieces(): Piece[] {
  return Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 1.8 + Math.random() * 1.4,
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 6,
    rotate: Math.random() * 360,
    drift: (Math.random() - 0.5) * 160,
  }));
}

/**
 * One-shot confetti burst from the top of the viewport. Self-removes after the
 * animation via onDone. Honors reduced-motion by skipping straight to done.
 */
export function Confetti({ onDone }: { onDone?: () => void }) {
  const reduceMotion = useReducedMotion();
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (reduceMotion) {
      onDone?.();
      return;
    }
    setPieces(buildPieces());
    const t = setTimeout(() => onDone?.(), 3600);
    return () => clearTimeout(t);
  }, [reduceMotion, onDone]);

  if (reduceMotion) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[300] overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 block rounded-[1px]"
          style={{ left: `${p.left}%`, width: p.size, height: p.size * 1.6, backgroundColor: p.color }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{
            y: typeof window !== 'undefined' ? window.innerHeight + 40 : 900,
            x: p.drift,
            rotate: p.rotate + 360,
            opacity: [1, 1, 0.9, 0],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

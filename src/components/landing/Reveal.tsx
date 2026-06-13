'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Stagger offset in seconds — pass index * 0.08 for lists */
  delay?: number;
  className?: string;
  /** Distance of the upward slide, px */
  y?: number;
}

/**
 * Scroll-into-view reveal used across the marketing page.
 * Animates transform/opacity only and collapses to a plain fade
 * when the visitor prefers reduced motion.
 */
export function Reveal({ children, delay = 0, className, y = 24 }: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduceMotion ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

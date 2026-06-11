'use client';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SuccessCheckProps {
  /** Optional label shown beneath the checkmark. */
  label?: string;
  /** Fired after the confirmation has been shown. */
  onComplete?: () => void;
  /** How long the confirmation stays on screen before onComplete (ms). */
  holdMs?: number;
}

/**
 * Apple-Pay-style success confirmation: a circle pops in with a spring and
 * the checkmark path draws itself, then auto-dismisses. Render conditionally
 * (e.g. right after a successful save) and remove it in onComplete.
 */
export function SuccessCheck({ label = 'Saved', onComplete, holdMs = 900 }: SuccessCheckProps) {
  useEffect(() => {
    if (!onComplete) return;
    const t = setTimeout(onComplete, holdMs);
    return () => clearTimeout(t);
  }, [onComplete, holdMs]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 360, damping: 18 }}
        className="w-20 h-20 rounded-full bg-success-500 flex items-center justify-center"
      >
        <svg viewBox="0 0 52 52" className="w-10 h-10" fill="none" aria-hidden="true">
          <motion.path
            d="M14 27 L23 36 L39 18"
            stroke="white"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.15, duration: 0.35, ease: 'easeOut' }}
          />
        </svg>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm font-semibold text-slate-700 dark:text-slate-200"
      >
        {label}
      </motion.p>
    </motion.div>
  );
}

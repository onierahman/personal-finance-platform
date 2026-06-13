'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGoals } from '@/features/goals/hooks';
import { Confetti } from '@/components/shared/Confetti';

const SEEN_KEY = 'celebrated-goals';

function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

function writeSeen(ids: Set<string>) {
  localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
}

/**
 * Watches goals globally and celebrates the first time any goal reaches 100%,
 * wherever the contribution happened. Each goal is celebrated once per device
 * (tracked in localStorage), so refreshes don't re-fire.
 */
export function GoalCelebration() {
  const { data: goals = [] } = useGoals();
  const [celebrating, setCelebrating] = useState<{ name: string; icon: string } | null>(null);

  useEffect(() => {
    if (goals.length === 0) return;
    const seen = readSeen();

    const justCompleted = goals.find(
      (g) =>
        Number(g.current_amount) >= Number(g.target_amount) &&
        Number(g.target_amount) > 0 &&
        !seen.has(g.id),
    );

    // Mark every currently-complete goal as seen so we only ever fire for the
    // genuine first crossing (and not for pre-existing completed goals on load).
    const completeIds = goals
      .filter((g) => Number(g.current_amount) >= Number(g.target_amount) && Number(g.target_amount) > 0)
      .map((g) => g.id);

    if (justCompleted && seen.size > 0) {
      // Only celebrate when we've already established a baseline (avoids firing
      // for historical completions the very first time the watcher runs).
      setCelebrating({ name: justCompleted.name, icon: justCompleted.icon || '🎯' });
    }

    const next = new Set(seen);
    completeIds.forEach((id) => next.add(id));
    if (next.size !== seen.size) writeSeen(next);
  }, [goals]);

  // Auto-dismiss the banner shortly after the confetti finishes.
  useEffect(() => {
    if (!celebrating) return;
    const t = setTimeout(() => setCelebrating(null), 5000);
    return () => clearTimeout(t);
  }, [celebrating]);

  return (
    <>
      {celebrating && <Confetti />}
      <AnimatePresence>
        {celebrating && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="fixed inset-x-0 bottom-24 z-[301] mx-auto flex w-fit max-w-[90vw] items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3.5 text-white shadow-dropdown lg:bottom-8"
            role="status"
            onClick={() => setCelebrating(null)}
          >
            <span className="text-2xl">{celebrating.icon}</span>
            <div>
              <p className="text-sm font-semibold">Goal reached! 🎉</p>
              <p className="text-xs text-slate-300">
                You completed “{celebrating.name}”. Time to set a new one.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

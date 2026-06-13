'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, Plus } from 'lucide-react';

// Looping demo of the core loop: type an amount → pick a category → add →
// the budget bar reacts. Communicates "sub-5-second entry" without a video.

type Step = 0 | 1 | 2 | 3; // idle/typing, category, adding, done

const CATEGORIES = ['🍜 Dining', '🛒 Groceries', '🚇 Transport'];
const AMOUNT = '14.50';
const BASE_PCT = 62; // dining budget before
const AFTER_PCT = 66; // dining budget after a $14.50 add

export function QuickAddAnimation() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>(0);
  const [typed, setTyped] = useState('');

  // Drive the loop. Each cycle: type → choose → add → settle → reset.
  useEffect(() => {
    if (reduceMotion) {
      setTyped(AMOUNT);
      setStep(3);
      return;
    }
    let timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      setStep(0);
      setTyped('');
      // Type the amount digit by digit.
      AMOUNT.split('').forEach((_, i) => {
        timers.push(setTimeout(() => setTyped(AMOUNT.slice(0, i + 1)), 350 + i * 160));
      });
      timers.push(setTimeout(() => setStep(1), 1500)); // category highlight
      timers.push(setTimeout(() => setStep(2), 2300)); // pressing add
      timers.push(setTimeout(() => setStep(3), 2900)); // done + budget reacts
      timers.push(setTimeout(run, 5200)); // loop
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  const added = step === 3;
  const pressing = step === 2;

  return (
    <div className="mx-auto grid w-full max-w-md gap-3 sm:max-w-lg">
      {/* QuickAdd sheet */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Quick add</p>
          <span className="text-[11px] font-medium text-slate-400">Expense</span>
        </div>

        {/* Amount */}
        <div className="rounded-lg bg-slate-50 py-4 text-center dark:bg-slate-800/60">
          <span className="amount text-3xl font-bold text-slate-900 dark:text-white">
            ${typed || '0.00'}
            {!added && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="ml-0.5 font-normal text-primary-500"
              >
                |
              </motion.span>
            )}
          </span>
        </div>

        {/* Categories */}
        <div className="mt-3 flex justify-center gap-1.5">
          {CATEGORIES.map((c, i) => (
            <span
              key={c}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-300 ${
                i === 0 && step >= 1
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {c}
            </span>
          ))}
        </div>

        {/* Button */}
        <motion.div
          animate={{ scale: pressing ? 0.97 : 1 }}
          transition={{ duration: 0.15 }}
          className={`mt-4 flex items-center justify-center gap-1.5 rounded-md py-2.5 text-sm font-semibold text-white transition-colors duration-300 ${
            added ? 'bg-success-500' : 'bg-primary-600'
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {added ? (
              <motion.span
                key="done"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5"
              >
                <Check size={16} /> Added
              </motion.span>
            ) : (
              <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5">
                <Plus size={16} /> Add expense
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Budget reacts */}
      <div className="card p-5">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700 dark:text-slate-300">🍜 Dining budget</span>
          <span className="amount text-slate-500 dark:text-slate-400">
            {added ? '$269' : '$254'} <span className="text-slate-300 dark:text-slate-600">/ $320</span>
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-warning-500"
            animate={{ width: `${added ? AFTER_PCT : BASE_PCT}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <div className="mt-1.5 h-4">
          <AnimatePresence>
            {added && (
              <motion.p
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[11px] font-medium text-primary-600 dark:text-primary-400"
              >
                Updated instantly — no refresh, no spreadsheet.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

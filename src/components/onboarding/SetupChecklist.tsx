'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronRight, Rocket } from 'lucide-react';
import { useOnboardingStatus, useOnboardingDismissed } from '@/features/onboarding/hooks';
import { useUiStore } from '@/stores/uiStore';

interface Step {
  key: 'hasAccount' | 'hasTransaction' | 'hasBudget' | 'hasGoal';
  label: string;
  hint: string;
  href?: string;
  action?: 'quickAdd';
}

const STEPS: Step[] = [
  { key: 'hasAccount', label: 'Add an account', hint: 'Track balances and net worth', href: '/accounts' },
  { key: 'hasTransaction', label: 'Record a transaction', hint: 'Log spending or income', action: 'quickAdd' },
  { key: 'hasBudget', label: 'Set a budget', hint: 'Cap a category and stay on track', href: '/budgets' },
  { key: 'hasGoal', label: 'Create a savings goal', hint: 'Work toward something', href: '/goals' },
];

/**
 * Progress checklist shown on the dashboard until the user has completed the
 * core setup or dismisses it. Each step links to where it gets done.
 */
export function SetupChecklist() {
  const { data: status, isLoading } = useOnboardingStatus();
  const [dismissed, dismiss] = useOnboardingDismissed();
  const openQuickAdd = useUiStore((s) => s.openQuickAdd);

  if (isLoading || !status || dismissed) return null;

  const done = STEPS.filter((s) => status[s.key]).length;
  const total = STEPS.length;

  // Nothing started → the WelcomeScreen handles that case instead.
  // All done → nothing to nudge.
  if (done === 0 || done === total) return null;

  const pct = Math.round((done / total) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="card overflow-hidden p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/15">
              <Rocket size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Finish setting up</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {done} of {total} done · you’re {pct}% there
              </p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label="Dismiss setup checklist"
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-primary-600"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* Steps */}
        <ul className="mt-4 space-y-1">
          {STEPS.map((step) => {
            const complete = status[step.key];
            const inner = (
              <div
                className={`flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors ${
                  complete ? '' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    complete
                      ? 'border-success-500 bg-success-500 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {complete && <Check size={12} strokeWidth={3} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      complete
                        ? 'text-slate-400 line-through dark:text-slate-500'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {step.label}
                  </p>
                  {!complete && <p className="text-xs text-slate-400 dark:text-slate-500">{step.hint}</p>}
                </div>
                {!complete && <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />}
              </div>
            );

            if (complete) return <li key={step.key}>{inner}</li>;

            if (step.action === 'quickAdd') {
              return (
                <li key={step.key}>
                  <button onClick={() => openQuickAdd('expense')} className="block w-full text-left">
                    {inner}
                  </button>
                </li>
              );
            }
            return (
              <li key={step.key}>
                <Link href={step.href!}>{inner}</Link>
              </li>
            );
          })}
        </ul>
      </motion.div>
    </AnimatePresence>
  );
}

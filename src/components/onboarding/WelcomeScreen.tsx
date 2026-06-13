'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet, ScanLine, ArrowRight, Sparkles } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useUiStore } from '@/stores/uiStore';
import { SampleDataButton } from './SampleDataButton';

const PERKS = [
  { icon: '📊', label: 'Budgets that update as you spend' },
  { icon: '🎯', label: 'Savings goals with progress tracking' },
  { icon: '🧾', label: 'Snap a receipt — AI does the typing' },
];

/**
 * First-run experience shown on the dashboard when a brand-new user has no
 * data yet. Two clear paths: explore instantly with sample data, or start
 * for real by adding an account.
 */
export function WelcomeScreen() {
  const { user } = useUser();
  const openImport = useUiStore((s) => s.openImport);
  const firstName = user?.name?.trim().split(' ')[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="mx-auto max-w-2xl py-6 text-center sm:py-12"
    >
      <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-card">
        <Wallet size={26} />
      </span>

      <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
        {firstName ? `Welcome, ${firstName}.` : 'Welcome to FinanceOS.'}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-balance text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
        Let’s get your money in one place. Explore the app with realistic sample
        data, or jump straight in with your own.
      </p>

      <ul className="mx-auto mt-7 flex max-w-md flex-col gap-2.5 text-left">
        {PERKS.map((p, i) => (
          <motion.li
            key={p.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-card dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <span className="text-lg">{p.icon}</span>
            {p.label}
          </motion.li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <SampleDataButton variant="primary" />
        <Link
          href="/accounts"
          className="group inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 py-2.5 text-[15px] font-semibold text-slate-700 shadow-card transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Add my first account
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <Sparkles size={13} />
        <span>Want to import instead?</span>
        <button
          onClick={() => openImport('receipt')}
          className="inline-flex items-center gap-1 font-medium text-primary-600 hover:underline dark:text-primary-400"
        >
          <ScanLine size={12} /> Scan a receipt
        </button>
      </div>
    </motion.div>
  );
}

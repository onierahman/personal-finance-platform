'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet, RotateCcw, ArrowRight, Info } from 'lucide-react';
import { DemoDashboard } from '@/components/demo/DemoDashboard';
import { DemoQuickAdd } from '@/components/demo/DemoQuickAdd';
import { INITIAL_DEMO_TXNS, type DemoTxn } from '@/components/demo/demoData';

export default function DemoPage() {
  const [txns, setTxns] = useState<DemoTxn[]>(INITIAL_DEMO_TXNS);
  const [highlight, setHighlight] = useState<string | null>(null);

  const handleAdd = (t: DemoTxn) => {
    setTxns((prev) => [t, ...prev]);
    setHighlight(t.category);
    setTimeout(() => setHighlight(null), 1600);
  };

  const reset = () => {
    setTxns(INITIAL_DEMO_TXNS);
    setHighlight(null);
  };

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="glass sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-800">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="FinanceOS home">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-white">
              <Wallet size={18} />
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">FinanceOS</span>
            <span className="ml-1 hidden rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400 sm:inline">
              Live demo
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RotateCcw size={13} /> <span className="hidden sm:inline">Reset</span>
            </button>
            <Link
              href="/register"
              className="group inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-primary-600 px-4 py-1.5 text-sm font-semibold text-white transition-all hover:bg-primary-700 active:scale-[0.98]"
            >
              Sign up<span className="hidden sm:inline">&nbsp;free</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            This is FinanceOS, with sample data
          </h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <Info size={14} />
            Add an expense below and watch the budgets, chart, and totals react. Nothing is saved — refresh to reset.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Dashboard */}
          <div className="lg:col-span-2">
            <DemoDashboard txns={txns} highlightCategory={highlight} />
          </div>

          {/* QuickAdd + CTA */}
          <div className="space-y-4">
            <DemoQuickAdd onAdd={handleAdd} />

            <div className="card overflow-hidden bg-slate-950 p-5 text-center">
              <p className="text-sm font-semibold text-white">Like what you see?</p>
              <p className="mt-1 text-xs text-slate-400">
                Create a free account and start tracking your own money in under a minute.
              </p>
              <Link
                href="/register"
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-all hover:bg-slate-100 active:scale-[0.98]"
              >
                Get started free
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, PiggyBank } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { getBudgetHealth } from '@/lib/constants';
import {
  DEMO_BUDGETS,
  DEMO_CURRENCY,
  computeSummary,
  spentByCategory,
  weeklySpend,
  type DemoTxn,
} from './demoData';

const HEALTH_BAR: Record<string, string> = {
  safe: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  over: 'bg-danger-600',
};

function money(n: number) {
  return formatCurrency(n, DEMO_CURRENCY);
}

/**
 * Presentational dashboard rendered from in-memory demo transactions. Reused by
 * the interactive /demo page and the landing showcase. `highlightCategory`
 * briefly pulses a budget row (used right after a demo QuickAdd).
 */
export function DemoDashboard({
  txns,
  highlightCategory,
}: {
  txns: DemoTxn[];
  highlightCategory?: string | null;
}) {
  const summary = computeSummary(txns);
  const week = weeklySpend(txns);
  const maxBar = Math.max(...week.map((w) => w.amount), 1);
  const recent = [...txns].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6);

  const cards = [
    { label: 'Income', value: summary.income, icon: TrendingUp, tone: 'text-success-500' },
    { label: 'Expenses', value: summary.expense, icon: TrendingDown, tone: 'text-danger-500' },
    { label: 'Net', value: summary.net, icon: PiggyBank, tone: 'text-primary-600' },
  ];

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="card p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <c.icon size={13} className={c.tone} /> {c.label}
            </div>
            <p className="amount mt-1 text-lg font-bold text-slate-900 dark:text-white">
              {c.label === 'Net' && summary.net < 0 ? '-' : ''}
              {money(Math.abs(c.value))}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Spending chart */}
        <div className="card p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">This week</p>
            {summary.savingsRate !== null && (
              <span className="rounded-full bg-success-50 px-2 py-0.5 text-[11px] font-semibold text-success-600 dark:bg-success-500/15">
                {Math.round(summary.savingsRate * 100)}% saved
              </span>
            )}
          </div>
          <div className="flex h-28 items-end justify-between gap-2">
            {week.map((d, i) => (
              <div key={i} className="flex w-full flex-col items-center gap-1.5">
                <motion.div
                  className={`w-full rounded-t-md ${i === week.length - 1 ? 'bg-primary-600' : 'bg-primary-200 dark:bg-primary-900/50'}`}
                  initial={{ height: 4 }}
                  animate={{ height: `${Math.max((d.amount / maxBar) * 100, 3)}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{ minHeight: 4 }}
                />
                <span className="text-[10px] font-medium text-slate-400">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Goal */}
        <div className="card flex flex-col justify-between p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/15">
              <Target size={16} />
            </span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Emergency fund</p>
          </div>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs">
              <span className="amount font-semibold text-slate-700 dark:text-slate-200">$6,400</span>
              <span className="text-slate-400">of $10,000</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <motion.div
                className="h-full rounded-full bg-primary-600"
                initial={{ width: 0 }}
                animate={{ width: '64%' }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-primary-600 dark:text-primary-400">+$300/mo to hit your deadline</p>
          </div>
        </div>
      </div>

      {/* Budgets + recent */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Budget health */}
        <div className="card p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Budget health</p>
          <div className="space-y-3">
            {DEMO_BUDGETS.map((b) => {
              const spent = spentByCategory(txns, b.category);
              const ratio = spent / b.limit;
              const health = getBudgetHealth(ratio);
              const isHot = highlightCategory === b.category;
              return (
                <div key={b.category}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {b.icon} {b.category}
                    </span>
                    <span className="amount text-slate-500 dark:text-slate-400">
                      {money(spent)} <span className="text-slate-300 dark:text-slate-600">/ {money(b.limit)}</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <motion.div
                      className={`h-full rounded-full ${HEALTH_BAR[health]}`}
                      animate={{ width: `${Math.min(ratio * 100, 100)}%` }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  {isHot && (
                    <motion.p
                      initial={{ opacity: 0, y: -3 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-[10px] font-medium text-primary-600 dark:text-primary-400"
                    >
                      Updated just now
                    </motion.p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="card p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Recent activity</p>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recent.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 py-2.5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm dark:bg-slate-800">
                  {t.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">{t.merchant}</p>
                  <p className="text-[10px] text-slate-400">{t.category}</p>
                </div>
                <span
                  className={`amount text-xs font-semibold ${
                    t.type === 'income' ? 'text-success-600 dark:text-success-400' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t.type === 'income' ? '+' : '-'}
                  {money(t.amount)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { formatCurrency } from '@/lib/formatters';
import type { InsightPayload } from '@/lib/insights';

async function fetchInsight(refresh = false): Promise<InsightPayload | null> {
  const res = await fetch(`/api/ai/insights${refresh ? '?refresh=1' : ''}`);
  if (!res.ok) return null;
  const json = await res.json();
  return (json.insight as InsightPayload) ?? null;
}

export function MonthlyInsightCard() {
  const qc = useQueryClient();
  const { user } = useUser();
  const currency = user?.currency ?? 'USD';

  const { data: insight, isLoading, isFetching } = useQuery({
    queryKey: ['insight', 'monthly'],
    queryFn: () => fetchInsight(false),
    staleTime: 10 * 60_000,
  });

  const refresh = async () => {
    const fresh = await fetchInsight(true);
    qc.setQueryData(['insight', 'monthly'], fresh);
  };

  if (isLoading) {
    return (
      <div className="card h-full p-5">
        <div className="mb-4 h-4 w-32 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="card flex h-full flex-col items-center justify-center p-6 text-center">
        <Sparkles className="mb-2 text-slate-300 dark:text-slate-600" size={22} />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Your monthly review</p>
        <p className="mt-1 text-xs text-slate-400">Record some transactions and your review appears here.</p>
      </div>
    );
  }

  const { stats } = insight;
  const netPositive = stats.net >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card h-full overflow-hidden p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-50 text-primary-600 dark:bg-primary-500/15">
            <Sparkles size={15} />
          </span>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Monthly review</p>
        </div>
        <button
          onClick={refresh}
          disabled={isFetching}
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800"
          title="Refresh review"
          aria-label="Refresh review"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      <p className="text-[15px] font-semibold leading-snug text-slate-900 dark:text-white">
        {insight.headline}
      </p>

      <div className="mt-2 space-y-1.5">
        {insight.body.map((line, i) => (
          <p key={i} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {line}
          </p>
        ))}
      </div>

      {/* Compact stat strip */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Income</p>
          <p className="amount text-sm font-semibold text-slate-800 dark:text-slate-200">
            {formatCurrency(stats.income, currency)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Spent</p>
          <p className="amount text-sm font-semibold text-slate-800 dark:text-slate-200">
            {formatCurrency(stats.expense, currency)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Net</p>
          <p
            className={`amount flex items-center gap-1 text-sm font-semibold ${
              netPositive ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
            }`}
          >
            {netPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {formatCurrency(Math.abs(stats.net), currency)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

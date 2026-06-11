'use client';

import { useMultiMonthSummary } from '@/features/analytics/hooks';
import { formatCurrency }        from '@/lib/formatters';
import { Skeleton }              from '@/components/shared/LoadingSkeleton';
import { useUser }               from '@/hooks/useUser';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { MonthSummary }     from '@/features/analytics/types';

interface Props { months: number }

export function OverviewStats({ months }: Props) {
  const { user }            = useUser();
  const currency            = user?.currency ?? 'USD';
  const { data, isLoading } = useMultiMonthSummary(months);
  const summaries           = (data?.data ?? []) as MonthSummary[];

  if (isLoading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
    </div>
  );

  if (!summaries.length) return null;

  const totals = summaries.reduce((acc, m) => ({
    income:   acc.income   + m.income,
    expenses: acc.expenses + m.expenses,
    savings:  acc.savings  + m.savings,
    txns:     acc.txns     + m.transactionCount,
  }), { income: 0, expenses: 0, savings: 0, txns: 0 });

  const avgSavingsRate = summaries.reduce((s, m) => s + m.savingsRate, 0) / summaries.length;

  // MoM change for the most recent month vs previous
  const last    = summaries[summaries.length - 1];
  const prev    = summaries[summaries.length - 2];
  const momExp  = prev?.expenses ? (last.expenses - prev.expenses) / prev.expenses : 0;
  const momInc  = prev?.income   ? (last.income   - prev.income)   / prev.income   : 0;

  const stats = [
    {
      label:    'Total Income',
      value:    formatCurrency(totals.income, currency),
      sub:      `MoM ${momInc >= 0 ? '+' : ''}${(momInc * 100).toFixed(1)}%`,
      subColor: momInc >= 0 ? 'text-green-600' : 'text-red-500',
      icon:     momInc >= 0 ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />,
      accent:   '#22C55E',
    },
    {
      label:    'Total Expenses',
      value:    formatCurrency(totals.expenses, currency),
      sub:      `MoM ${momExp >= 0 ? '+' : ''}${(momExp * 100).toFixed(1)}%`,
      subColor: momExp <= 0 ? 'text-green-600' : 'text-red-500',
      icon:     momExp <= 0 ? <TrendingDown className="w-4 h-4 text-green-500" /> : <TrendingUp className="w-4 h-4 text-red-500" />,
      accent:   '#EF4444',
    },
    {
      label:    'Total Savings',
      value:    formatCurrency(totals.savings, currency),
      sub:      `${(avgSavingsRate * 100).toFixed(1)}% avg rate`,
      subColor: 'text-blue-600',
      icon:     <TrendingUp className="w-4 h-4 text-blue-500" />,
      accent:   '#2563EB',
    },
    {
      label:    'Transactions',
      value:    totals.txns.toLocaleString(),
      sub:      `~${Math.round(totals.txns / months)} per month`,
      subColor: 'text-slate-500',
      icon:     <Minus className="w-4 h-4 text-slate-400" />,
      accent:   '#6366F1',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(s => (
        <div key={s.label} className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            {s.icon}
          </div>
          <p className="text-xl font-bold amount" style={{ color: s.accent }}>{s.value}</p>
          <p className={`text-xs mt-1 ${s.subColor}`}>{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

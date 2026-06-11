'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { BudgetForm } from '@/components/budgets/BudgetForm';
import { formatCurrency } from '@/lib/formatters';
import { getCategoryMeta } from '@/lib/constants';
import { budgetHealthStatus } from '@/lib/utils';
import { useDeleteBudget, useUpdateBudget } from '@/features/budgets/hooks';
import { useUser } from '@/hooks/useUser';
import { TransactionSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { PieChart, Trash2, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DbBudget, BudgetPeriod } from '@/types/database';

async function fetchAllBudgets(): Promise<DbBudget[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowserClient() as any;
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .order('category', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

const COLOR_MAP = {
  safe:    'bg-success-500',
  warning: 'bg-warning-500',
  danger:  'bg-danger-500',
  over:    'bg-danger-600',
} as const;

const TEXT_COLOR_MAP = {
  safe:    'text-success-600',
  warning: 'text-warning-600',
  danger:  'text-danger-600',
  over:    'text-danger-700',
} as const;

function BudgetRow({
  budget,
  currency,
}: {
  budget: DbBudget;
  currency: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(budget.limit_amount));
  const { mutate: deleteBudget, isPending: isDeleting } = useDeleteBudget();
  const { mutate: updateBudget, isPending: isUpdating } = useUpdateBudget();

  const { ratio, status } = budgetHealthStatus(
    Number(budget.spent_amount),
    Number(budget.limit_amount)
  );
  const meta = getCategoryMeta(budget.category);
  const pct = Math.min(ratio * 100, 100);

  const handleSave = () => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed > 0) {
      updateBudget(
        { id: budget.id, limit_amount: parsed },
        { onSuccess: () => setIsEditing(false) }
      );
    }
  };

  return (
    <li className="group p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl leading-none">{meta.icon}</span>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{budget.category}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{budget.period}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="w-24 text-xs border border-primary-300 dark:border-primary-500 rounded px-1.5 py-1 outline-none focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="text-success-600 hover:text-success-700 p-1"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditing(true)}
                title="Edit limit"
                className="text-slate-300 hover:text-primary-500 p-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm('Remove this budget cap?')) deleteBudget(budget.id);
                }}
                disabled={isDeleting}
                title="Delete budget"
                className="text-slate-300 hover:text-danger-500 p-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-30"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-1.5">
        <span className={cn('text-xs font-medium', TEXT_COLOR_MAP[status])}>
          {formatCurrency(Number(budget.spent_amount), currency)} spent
        </span>
        <span className="text-xs text-slate-400">
          of {formatCurrency(Number(budget.limit_amount), currency)}
        </span>
      </div>

      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', COLOR_MAP[status])}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className={cn('text-xs mt-1.5', TEXT_COLOR_MAP[status])}>
        {pct.toFixed(0)}% used
        {status === 'over' && ' — over budget'}
      </p>
    </li>
  );
}

type Tab = BudgetPeriod;

export default function BudgetsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('monthly');
  const { user } = useUser();
  const currency = user?.currency ?? 'USD';

  const { data: allBudgets = [], isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: fetchAllBudgets,
    staleTime: 60_000,
  });

  const filtered = allBudgets.filter(b => b.period === activeTab);

  const tabs: { key: Tab; label: string; description: string }[] = [
    { key: 'monthly', label: 'Monthly', description: 'Food, Transport, Shopping…' },
    { key: 'annual',  label: 'Annual',  description: 'Travel, Insurance, Taxes…' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Budgets</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Set spending limits by category and period.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Period tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
                  activeTab === tab.key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500">
            {tabs.find(t => t.key === activeTab)?.description}
          </p>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <TransactionSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={PieChart}
              title={`No ${activeTab} budgets`}
              message={`Create a ${activeTab} budget cap to start tracking.`}
            />
          ) : (
            <ul className="space-y-3">
              {filtered.map(b => (
                <BudgetRow key={b.id} budget={b} currency={currency} />
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5 h-fit">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
            New Budget
          </h2>
          <BudgetForm />
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useUiStore } from '@/stores/uiStore';
import { formatCurrency } from '@/lib/formatters';
import { getCategoryMeta } from '@/lib/constants';
import { budgetHealthStatus } from '@/lib/utils';
import { TransactionSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { PieChart, ChevronRight, Trash2, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { useDeleteBudget, useUpdateBudget } from '@/features/budgets/hooks';
import type { DbBudget } from '@/types/database';

async function fetchBudgetsWithSpent(month: string): Promise<DbBudget[]> {
  const supabase = getSupabaseBrowserClient();

  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const nextMonthNum = parseInt(monthStr, 10) + 1;
  const nextMonthStr = nextMonthNum > 12 ? '01' : String(nextMonthNum).padStart(2, '0');
  const nextYearStr = nextMonthNum > 12 ? String(year + 1) : String(year);

  const startOfMonth = `${yearStr}-${monthStr}-01`;
  const startOfNext = `${nextYearStr}-${nextMonthStr}-01`;

  // Fetch monthly budgets active in this month window
  const { data: monthly, error: e1 } = await supabase
    .from('budgets')
    .select('*')
    .eq('period', 'monthly')
    .gte('start_date', startOfMonth)
    .lt('start_date', startOfNext)
    .order('category', { ascending: true });

  if (e1) throw new Error(e1.message);

  // Fetch annual budgets whose fiscal year spans this month
  const { data: annual, error: e2 } = await supabase
    .from('budgets')
    .select('*')
    .eq('period', 'annual')
    .lte('start_date', `${yearStr}-${monthStr}-01`)
    .order('category', { ascending: true });

  if (e2) throw new Error(e2.message);

  return [...(monthly ?? []), ...(annual ?? [])];
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

function InlineEditLimit({
  budget,
  currency,
  onDone,
}: {
  budget: DbBudget;
  currency: string;
  onDone: () => void;
}) {
  const [value, setValue] = useState(String(budget.limit_amount));
  const { mutate: updateBudget, isPending } = useUpdateBudget();

  const handleSave = () => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0) {
      updateBudget({ id: budget.id, limit_amount: parsed }, { onSuccess: onDone });
    }
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-slate-400">$</span>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={e => setValue(e.target.value)}
        className="w-20 text-xs border border-primary-300 rounded px-1.5 py-0.5 text-slate-900 outline-none focus:border-primary-500"
        autoFocus
      />
      <button
        onClick={handleSave}
        disabled={isPending}
        className="text-success-600 hover:text-success-700 p-0.5"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
      <button onClick={onDone} className="text-slate-400 hover:text-slate-600 p-0.5">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function BudgetHealth() {
  const { activeMonth } = useUiStore();
  const { user } = useUser();
  const currency = user?.currency ?? 'USD';
  const [editingId, setEditingId] = useState<string | null>(null);

  const { mutate: deleteBudget, isPending: isDeleting } = useDeleteBudget();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', 'dashboard', activeMonth],
    queryFn: () => fetchBudgetsWithSpent(activeMonth),
    staleTime: 60_000,
  });

  const handleDelete = (id: string) => {
    if (confirm('Remove this budget cap?')) deleteBudget(id);
  };

  // Aggregate summary values for the header card
  const totalLimit = budgets.reduce((sum, b) => sum + Number(b.limit_amount), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent_amount), 0);
  const available = Math.max(totalLimit - totalSpent, 0);
  const overBudgetCount = budgets.filter(
    b => Number(b.spent_amount) > Number(b.limit_amount)
  ).length;

  const VISIBLE_LIMIT = 5;
  const visible = budgets.slice(0, VISIBLE_LIMIT);
  const hiddenCount = budgets.length - VISIBLE_LIMIT;

  return (
    <div className="card p-5 bg-white border border-slate-100 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-base font-semibold text-slate-800">Budget Health</p>
        <Link href="/budgets" className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
          All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <TransactionSkeleton key={i} />)}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="No budgets set"
          message="Set monthly budgets to track your spending."
          action={
            <Link href="/budgets" className="text-xs text-primary-600 hover:underline">
              Set budgets →
            </Link>
          }
        />
      ) : (
        <>
          {/* PRD: Budget Health Card — Total Used / Available / Overbudget */}
          <div className="grid grid-cols-3 gap-3 mb-5 p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Total Used</p>
              <p className="text-sm font-semibold text-slate-800">
                {formatCurrency(totalSpent, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Available</p>
              <p className="text-sm font-semibold text-success-600">
                {formatCurrency(available, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Over Budget</p>
              <p className={cn(
                'text-sm font-semibold',
                overBudgetCount > 0 ? 'text-danger-600' : 'text-slate-800'
              )}>
                {overBudgetCount} {overBudgetCount === 1 ? 'category' : 'categories'}
              </p>
            </div>
          </div>

          <ul className="space-y-4">
            {visible.map(b => {
              const { ratio, status } = budgetHealthStatus(
                Number(b.spent_amount),
                Number(b.limit_amount)
              );
              const meta = getCategoryMeta(b.category);
              const pct = Math.min(ratio * 100, 100);
              const isEditing = editingId === b.id;

              return (
                <li key={b.id} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{meta.icon}</span>
                      <div>
                        <span className="text-sm font-medium text-slate-700">{b.category}</span>
                        {b.period === 'annual' && (
                          <span className="ml-1.5 text-xs text-slate-400 font-normal">annual</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <InlineEditLimit
                          budget={b}
                          currency={currency}
                          onDone={() => setEditingId(null)}
                        />
                      ) : (
                        <div className="text-right">
                          <span className={cn('text-xs font-medium', TEXT_COLOR_MAP[status])}>
                            {formatCurrency(Number(b.spent_amount), currency)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {' / '}{formatCurrency(Number(b.limit_amount), currency)}
                          </span>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingId(b.id)}
                            title="Edit limit"
                            className="text-slate-300 hover:text-primary-500 p-1 rounded-md hover:bg-slate-50 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id)}
                            disabled={isDeleting}
                            title="Delete budget"
                            className="text-slate-300 hover:text-danger-500 p-1 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', COLOR_MAP[status])}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          {hiddenCount > 0 && (
            <Link
              href="/budgets"
              className="mt-4 block text-center text-xs text-primary-600 hover:underline"
            >
              +{hiddenCount} more budget{hiddenCount > 1 ? 's' : ''} → View all
            </Link>
          )}
        </>
      )}
    </div>
  );
}
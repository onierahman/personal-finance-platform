'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useUiStore }   from '@/stores/uiStore';
import { formatCurrency, monthStart } from '@/lib/formatters';
import { getCategoryMeta } from '@/lib/constants';
import { budgetHealthStatus } from '@/lib/utils';
import { TransactionSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState }   from '@/components/shared/EmptyState';
import { PieChart, ChevronRight } from 'lucide-react';
import { cn }           from '@/lib/utils';
import { useUser }      from '@/hooks/useUser';

async function fetchBudgetsWithSpent(month: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('period', 'monthly')
    .lte('start_date', monthStart(month))
    .order('start_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export function BudgetHealth() {
  const { activeMonth } = useUiStore();
  const { user }        = useUser();
  const currency        = user?.currency ?? 'USD';

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', 'dashboard', activeMonth],
    queryFn:  () => fetchBudgetsWithSpent(activeMonth),
    staleTime: 60_000,
  });

  const colorMap = {
    safe:    'bg-success-500',
    warning: 'bg-warning-500',
    danger:  'bg-danger-500',
    over:    'bg-danger-600',
  };

  const textColorMap = {
    safe:    'text-success-600',
    warning: 'text-warning-600',
    danger:  'text-danger-600',
    over:    'text-danger-700',
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="section-title text-base">Budget Health</p>
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
          action={<Link href="/budgets" className="text-xs text-primary-600 hover:underline">Set budgets →</Link>}
        />
      ) : (
        <ul className="space-y-4">
          {budgets.slice(0, 5).map(b => {
            const { ratio, status } = budgetHealthStatus(Number(b.spent_amount), Number(b.limit_amount));
            const meta = getCategoryMeta(b.category);
            const pct  = Math.min(ratio * 100, 100);

            return (
              <li key={b.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{meta.icon}</span>
                    <span className="text-sm font-medium text-slate-700">{b.category}</span>
                  </div>
                  <div className="text-right">
                    <span className={cn('text-xs font-medium', textColorMap[status])}>
                      {formatCurrency(Number(b.spent_amount), currency)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {' / '}{formatCurrency(Number(b.limit_amount), currency)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', colorMap[status])}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

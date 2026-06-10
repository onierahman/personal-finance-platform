'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useUiStore }   from '@/stores/uiStore';
import { formatCurrency } from '@/lib/formatters';
import { getCategoryMeta } from '@/lib/constants';
import { budgetHealthStatus } from '@/lib/utils';
import { TransactionSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState }   from '@/components/shared/EmptyState';
import { PieChart, ChevronRight, Trash2 } from 'lucide-react'; // Added Trash2 Icon
import { cn }           from '@/lib/utils';
import { useUser }      from '@/hooks/useUser';
import { useDeleteBudget } from '@/features/budgets/hooks'; // Imported our new delete hook

async function fetchBudgetsWithSpent(month: string) {
  const supabase = getSupabaseBrowserClient();
  
  // 1. Safely calculate the boundary strings for the active month selection
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const nextMonthNum = parseInt(monthStr, 10) + 1;
  
  const nextMonthStr = nextMonthNum > 12 ? '01' : String(nextMonthNum).padStart(2, '0');
  const nextYearStr = nextMonthNum > 12 ? String(year + 1) : String(year);
  
  const startOfCurrentMonth = `${yearStr}-${monthStr}-01`;
  const startOfNextMonth = `${nextYearStr}-${nextMonthStr}-01`;

  // 2. Query any budget rows created inside this month's window
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('period', 'monthly')
    .gte('start_date', startOfCurrentMonth) // On or after June 1st
    .lt('start_date', startOfNextMonth)    // Strictly before July 1st
    .order('start_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export function BudgetHealth() {
  const { activeMonth } = useUiStore();
  const { user }        = useUser();
  const currency        = user?.currency ?? 'USD';
  
  // Initialize the delete mutation hook
  const { mutate: deleteBudget, isPending: isDeleting } = useDeleteBudget();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', 'dashboard', activeMonth],
    queryFn:  () => fetchBudgetsWithSpent(activeMonth),
    staleTime: 60_000,
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this budget allocation cap?')) {
      deleteBudget(id);
    }
  };

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
    <div className="card p-5 bg-white border border-slate-100 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="section-title text-base font-semibold text-slate-800">Budget Health</p>
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
              <li key={b.id} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{meta.icon}</span>
                    <span className="text-sm font-medium text-slate-700">{b.category}</span>
                  </div>
                  
                  {/* Container wrapping text numbers alongside the action delete trigger */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={cn('text-xs font-medium', textColorMap[status])}>
                        {formatCurrency(Number(b.spent_amount), currency)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {' / '}{formatCurrency(Number(b.limit_amount), currency)}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={isDeleting}
                      title="Delete budget cap"
                      className="text-slate-300 hover:text-danger-500 p-1 rounded-md hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
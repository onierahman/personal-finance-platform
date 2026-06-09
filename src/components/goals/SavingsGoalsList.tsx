'use client';

import { useGoals, useAddContribution } from '@/features/goals/hooks';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { suggestedMonthlyContribution } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { EmptyState } from '@/components/shared/EmptyState';
import { Target, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function SavingsGoalsList() {
  const { data: goals = [], isLoading } = useGoals();
  const { mutate: addContribution } = useAddContribution();
  const { user } = useUser();
  const currency = user?.currency ?? 'USD';

  const handleQuickSave = (goalId: string) => {
    const amountStr = prompt('Enter optimization deposit amount ($):');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (!isNaN(amount) && amount > 0) {
      addContribution({ goalId, amount });
    }
  };

  if (isLoading) {
    return (
      <div className="card p-5 space-y-4 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-8 bg-slate-100 rounded w-full" />
      </div>
    );
  }

  const activeGoals = goals.filter(g => g.status === 'active' || g.status === 'paused');

  if (activeGoals.length === 0) {
    return (
      <div className="card p-5 flex flex-col justify-between h-[280px]">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Savings Goals</p>
        <EmptyState
          icon={Target}
          title="No active targets"
          message="Define financial goals to track your growth."
        />
      </div>
    );
  }

  return (
    <div className="card p-5 flex flex-col justify-between min-h-[320px] hover-lift group transition-all duration-300">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Savings Goals</p>
            <p className="text-xs text-slate-500 font-medium">{activeGoals.length} Active Targets</p>
          </div>
          <Target className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
        </div>

        <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
          {activeGoals.slice(0, 2).map((goal) => {
            const ratio = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) : 0;
            const boundedPct = Math.min(ratio * 100, 100);
            const monthlySuggestion = suggestedMonthlyContribution(goal.target_amount, goal.current_amount, goal.deadline);

            return (
              <div key={goal.id} className="space-y-1.5 p-2 rounded-md hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-sm px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${goal.color || '#2563EB'}15` }}
                    >
                      {goal.icon || '🎯'}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">
                      {goal.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="amount text-xs font-bold text-slate-900">
                      {formatCurrency(Number(goal.current_amount), currency)}
                    </span>
                    <button
                      onClick={() => handleQuickSave(goal.id)}
                      className="p-1 rounded bg-white border border-slate-200 hover:border-slate-300 text-slate-500 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: goal.color || '#2563EB' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${boundedPct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>{formatPercent(ratio)} complete</span>
                  {monthlySuggestion && monthlySuggestion > 0 && (
                    <span className="text-primary-600 font-semibold amount">
                      + {formatCurrency(monthlySuggestion, currency)}/mo
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
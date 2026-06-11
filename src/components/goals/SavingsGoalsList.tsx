'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Target, Plus, ChevronRight, Check, X } from 'lucide-react';
import { useGoals, useAddContribution } from '@/features/goals/hooks';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { suggestedMonthlyContribution, goalDeadlineUrgency } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';

const URGENCY_CLASSES = {
  overdue: 'text-danger-600 bg-danger-50',
  high:    'text-danger-500 bg-danger-50',
  medium:  'text-warning-600 bg-warning-50',
  low:     'text-slate-500 bg-slate-100',
  none:    'text-slate-400 bg-slate-100',
} as const;

function InlineContribution({ goalId, onDone }: { goalId: string; onDone: () => void }) {
  const [value, setValue] = useState('');
  const { mutate: addContribution, isPending } = useAddContribution();

  const handleSave = () => {
    const amount = parseFloat(value);
    if (!isNaN(amount) && amount > 0) {
      addContribution({ goalId, amount }, { onSuccess: onDone });
    }
  };

  return (
    <div className="flex items-center gap-1 mt-1.5">
      <span className="text-xs text-slate-400">$</span>
      <input
        type="number"
        step="0.01"
        placeholder="0.00"
        value={value}
        onChange={e => setValue(e.target.value)}
        className="w-20 text-xs border border-primary-300 rounded px-1.5 py-1 outline-none focus:border-primary-500"
        autoFocus
      />
      <button
        onClick={handleSave}
        disabled={isPending}
        className="text-success-600 hover:text-success-700 p-1"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
      <button onClick={onDone} className="text-slate-400 hover:text-slate-600 p-1">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function SavingsGoalsList() {
  const { data: goals = [], isLoading } = useGoals();
  const { user } = useUser();
  const currency = user?.currency ?? 'USD';
  const [contributingId, setContributingId] = useState<string | null>(null);

  const activeGoals = goals.filter(g => g.status === 'active');

  const VISIBLE_LIMIT = 3;
  const visible    = activeGoals.slice(0, VISIBLE_LIMIT);
  const hiddenCount = activeGoals.length - VISIBLE_LIMIT;

  const totalSaved = activeGoals.reduce(
    (sum, g) => sum + Number(g.current_amount), 0,
  );

  if (isLoading) {
    return (
      <div className="card p-5 space-y-4 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-8 bg-slate-100 rounded w-full" />
      </div>
    );
  }

  return (
    <div className="card p-5 bg-white border border-slate-100 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-base font-semibold text-slate-800">Savings Goals</p>
          {activeGoals.length > 0 && (
            <p className="text-xs text-slate-500">
              {activeGoals.length} active · {formatCurrency(totalSaved, currency)} saved
            </p>
          )}
        </div>
        <Link href="/goals" className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
          All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {activeGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No active goals"
          message="Define savings goals to track your progress."
          action={
            <Link href="/goals" className="text-xs text-primary-600 hover:underline">
              Add a goal →
            </Link>
          }
        />
      ) : (
        <>
        <ul className="space-y-4">
          {visible.map(goal => {
            const ratio = goal.target_amount > 0
              ? Number(goal.current_amount) / Number(goal.target_amount)
              : 0;
            const pct = Math.min(ratio * 100, 100);
            const monthly = suggestedMonthlyContribution(
              Number(goal.target_amount),
              Number(goal.current_amount),
              goal.deadline,
            );
            const { daysLeft, urgency } = goalDeadlineUrgency(goal.deadline);
            const isContributing = contributingId === goal.id;

            return (
              <li key={goal.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-sm px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ backgroundColor: `${goal.color || '#2563EB'}20` }}
                    >
                      {goal.icon || '🎯'}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 truncate">
                      {goal.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs font-bold text-slate-900">
                      {formatCurrency(Number(goal.current_amount), currency)}
                    </span>
                    <button
                      onClick={() => setContributingId(isContributing ? null : goal.id)}
                      title="Add contribution"
                      className="p-1 rounded border border-slate-200 hover:border-primary-300 text-slate-400 hover:text-primary-600 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {isContributing && (
                  <InlineContribution
                    goalId={goal.id}
                    onDone={() => setContributingId(null)}
                  />
                )}

                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: goal.color || '#2563EB' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{formatPercent(ratio)} complete</span>
                  <div className="flex items-center gap-1.5">
                    {/* Deadline urgency badge */}
                    {daysLeft !== null && urgency !== 'none' && (
                      <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded-full', URGENCY_CLASSES[urgency])}>
                        {urgency === 'overdue'
                          ? 'Overdue'
                          : daysLeft === 0
                          ? 'Due today'
                          : `${daysLeft}d left`}
                      </span>
                    )}
                    {monthly !== null && monthly > 0 && (
                      <span className="text-xs font-semibold text-primary-600">
                        +{formatCurrency(monthly, currency)}/mo
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

          {hiddenCount > 0 && (
            <Link
              href="/goals"
              className="mt-4 block text-center text-xs text-primary-600 hover:underline"
            >
              +{hiddenCount} more goal{hiddenCount > 1 ? 's' : ''} → View all
            </Link>
          )}
        </>
      )}
    </div>
  );
}
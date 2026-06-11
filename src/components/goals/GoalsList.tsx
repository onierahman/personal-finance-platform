'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, Trash2, Check, X, Pencil } from 'lucide-react';
import { useGoals, useAddContribution, useDeleteGoal, useUpdateGoal } from '@/features/goals/hooks';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { suggestedMonthlyContribution, goalDeadlineUrgency } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { EmptyState } from '@/components/shared/EmptyState';
import { TransactionSkeleton } from '@/components/shared/LoadingSkeleton';
import { cn } from '@/lib/utils';
import type { SavingsGoal, GoalStatus } from '@/features/goals/types';

const URGENCY_CLASSES = {
  overdue: 'text-danger-600 bg-danger-50 border-danger-100',
  high:    'text-danger-500 bg-danger-50 border-danger-100',
  medium:  'text-warning-600 bg-warning-50 border-warning-100',
  low:     'text-slate-500 bg-slate-100 border-slate-200',
  none:    '',
} as const;

const PRIORITY_BADGE = {
  high:   'bg-danger-50 text-danger-600',
  medium: 'bg-warning-50 text-warning-600',
  low:    'bg-slate-100 text-slate-500',
} as const;

const STATUS_TABS: { key: GoalStatus | 'all'; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'paused',    label: 'Paused' },
];

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
    <div className="flex items-center gap-1.5 mt-2 p-2 bg-primary-50 rounded-lg">
      <span className="text-xs text-slate-500 font-medium">Add:</span>
      <span className="text-xs text-slate-400">$</span>
      <input
        type="number"
        step="0.01"
        placeholder="0.00"
        value={value}
        onChange={e => setValue(e.target.value)}
        className="w-24 text-xs border border-primary-300 rounded px-2 py-1 outline-none focus:border-primary-500 bg-white"
        autoFocus
      />
      <button
        onClick={handleSave}
        disabled={isPending}
        className="text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 px-2.5 py-1 rounded transition-colors disabled:opacity-60"
      >
        {isPending ? '...' : 'Save'}
      </button>
      <button onClick={onDone} className="text-slate-400 hover:text-slate-600 p-1">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function GoalCard({
  goal,
  currency,
}: {
  goal: SavingsGoal;
  currency: string;
}) {
  const [contributingOpen, setContributingOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState(false);
  const [editValue, setEditValue] = useState(String(goal.target_amount));

  const { mutate: deleteGoal, isPending: isDeleting } = useDeleteGoal();
  const { mutate: updateGoal, isPending: isUpdating } = useUpdateGoal();

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

  const handleSaveLimit = () => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed > 0) {
      updateGoal({ id: goal.id, target_amount: parsed }, { onSuccess: () => setEditingLimit(false) });
    }
  };

  const handleStatusToggle = () => {
    const next = goal.status === 'active' ? 'paused' : 'active';
    updateGoal({ id: goal.id, status: next });
  };

  return (
    <div className="group p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="text-xl flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg"
            style={{ backgroundColor: `${goal.color || '#2563EB'}20` }}
          >
            {goal.icon || '🎯'}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{goal.name}</p>
            {goal.description && (
              <p className="text-xs text-slate-400 truncate">{goal.description}</p>
            )}
          </div>
        </div>

        {/* Action buttons — visible on hover */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setContributingOpen(v => !v)}
            title="Add contribution"
            className="p-1.5 rounded-md border border-slate-200 hover:border-primary-300 text-slate-400 hover:text-primary-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleStatusToggle}
            title={goal.status === 'active' ? 'Pause goal' : 'Resume goal'}
            className="p-1.5 rounded-md border border-slate-200 hover:border-warning-300 text-slate-400 hover:text-warning-600 transition-colors"
          >
            {goal.status === 'active' ? '⏸' : '▶'}
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete "${goal.name}"?`)) deleteGoal(goal.id);
            }}
            disabled={isDeleting}
            className="p-1.5 rounded-md border border-slate-200 hover:border-danger-300 text-slate-400 hover:text-danger-500 transition-colors disabled:opacity-30"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {contributingOpen && (
        <InlineContribution
          goalId={goal.id}
          onDone={() => setContributingOpen(false)}
        />
      )}

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: goal.color || '#2563EB' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-800">
            {formatCurrency(Number(goal.current_amount), currency)}
          </span>
          <span className="text-slate-400">of</span>

          {/* Inline edit target amount */}
          {editingLimit ? (
            <div className="flex items-center gap-1">
              <span className="text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="w-20 text-xs border border-primary-300 rounded px-1.5 py-0.5 outline-none"
                autoFocus
              />
              <button onClick={handleSaveLimit} disabled={isUpdating} className="text-success-600 p-0.5">
                <Check className="w-3 h-3" />
              </button>
              <button onClick={() => setEditingLimit(false)} className="text-slate-400 p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingLimit(true)}
              className="font-medium text-slate-500 hover:text-primary-600 flex items-center gap-0.5 transition-colors"
            >
              {formatCurrency(Number(goal.target_amount), currency)}
              <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60" />
            </button>
          )}

          <span className="text-slate-400">·</span>
          <span className="text-slate-500">{formatPercent(ratio)}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Priority badge */}
          <span className={cn('px-1.5 py-0.5 rounded-full font-medium capitalize', PRIORITY_BADGE[goal.priority])}>
            {goal.priority}
          </span>

          {/* Deadline urgency badge */}
          {daysLeft !== null && urgency !== 'none' && (
            <span className={cn('px-1.5 py-0.5 rounded-full border font-medium', URGENCY_CLASSES[urgency])}>
              {urgency === 'overdue'
                ? 'Overdue'
                : daysLeft === 0
                ? 'Due today'
                : `${daysLeft}d left`}
            </span>
          )}
        </div>
      </div>

      {/* Monthly suggestion */}
      {monthly !== null && monthly > 0 && goal.status === 'active' && (
        <p className="text-xs text-primary-600 font-medium">
          Suggested: +{formatCurrency(monthly, currency)}/mo to hit your deadline
        </p>
      )}

      {goal.status === 'completed' && (
        <p className="text-xs text-success-600 font-semibold flex items-center gap-1">
          <Check className="w-3.5 h-3.5" /> Goal achieved!
        </p>
      )}
    </div>
  );
}

export function GoalsList() {
  const [activeTab, setActiveTab] = useState<GoalStatus | 'all'>('active');
  const { data: goals = [], isLoading } = useGoals();
  const { user } = useUser();
  const currency = user?.currency ?? 'USD';

  const filtered = activeTab === 'all'
    ? goals
    : goals.filter(g => g.status === activeTab);

  // Count per tab for badges
  const counts: Record<string, number> = {
    all:       goals.length,
    active:    goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    paused:    goals.filter(g => g.status === 'paused').length,
    cancelled: goals.filter(g => g.status === 'cancelled').length,
  };

  return (
    <div className="space-y-4">
      {/* Status tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={cn(
                'text-xs px-1.5 rounded-full',
                activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-slate-200 text-slate-500',
              )}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <TransactionSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Target}
          title={`No ${activeTab === 'all' ? '' : activeTab} goals`}
          message="Create a savings goal to start tracking your progress."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(goal => (
            <GoalCard key={goal.id} goal={goal} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}
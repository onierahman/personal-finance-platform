'use client';

import React, { useState } from 'react';
import {
  useRecurring,
  useToggleRecurringStatus,
  useDeleteRecurring,
  useUpdateRecurring,
} from '@/features/recurring/hooks';
import { RecurringForm } from '@/components/recurring/RecurringForm';
import { formatCurrency } from '@/lib/formatters';
import { recurringDueUrgency, sumBy } from '@/lib/utils';
import { FREQUENCY_LABELS } from '@/lib/constants';
import { useUser } from '@/hooks/useUser';
import { EmptyState } from '@/components/shared/EmptyState';
import { Calendar, Trash2, Power, PowerOff, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecurringTransaction } from '@/features/recurring/types';

type TabType = 'expense' | 'income';

const URGENCY_ROW_CLASSES = {
  overdue:  'bg-danger-50 dark:bg-danger-500/10 border-l-2 border-danger-400',
  today:    'bg-warning-50 dark:bg-warning-500/10 border-l-2 border-warning-400',
  soon:     'bg-warning-50/50 dark:bg-warning-500/5 border-l-2 border-warning-200',
  upcoming: '',
  future:   '',
} as const;

const URGENCY_BADGE_CLASSES = {
  overdue:  'bg-danger-100 dark:bg-danger-500/20 text-danger-700 dark:text-danger-400',
  today:    'bg-warning-100 dark:bg-warning-500/20 text-warning-700 dark:text-warning-400',
  soon:     'bg-warning-50 dark:bg-warning-500/10 text-warning-600 dark:text-warning-400',
  upcoming: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
  future:   '',
} as const;

function urgencyLabel(daysUntil: number, urgency: string): string {
  if (urgency === 'overdue')  return `${Math.abs(daysUntil)}d overdue`;
  if (urgency === 'today')    return 'Due today';
  if (urgency === 'soon')     return `${daysUntil}d left`;
  if (urgency === 'upcoming') return `${daysUntil}d`;
  return '';
}

function InlineEdit({
  item,
  onDone,
}: {
  item: RecurringTransaction;
  onDone: () => void;
}) {
  const [amount, setAmount]   = useState(String(item.amount));
  const [nextDue, setNextDue] = useState(item.next_due);
  const { mutate: updateRecurring, isPending } = useUpdateRecurring();

  const handleSave = () => {
    const parsed = parseFloat(amount);
    if (!isNaN(parsed) && parsed > 0) {
      updateRecurring(
        { id: item.id, amount: parsed, next_due: nextDue },
        { onSuccess: onDone },
      );
    }
  };

  return (
    <td colSpan={5} className="p-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">Amount $</span>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-24 text-xs border border-primary-300 dark:border-primary-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded px-2 py-1 outline-none focus:border-primary-500"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">Next due</span>
          <input
            type="date"
            value={nextDue}
            onChange={e => setNextDue(e.target.value)}
            className="text-xs border border-primary-300 dark:border-primary-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded px-2 py-1 outline-none focus:border-primary-500"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-1 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 px-2.5 py-1 rounded transition-colors disabled:opacity-60"
        >
          <Check className="w-3 h-3" /> {isPending ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onDone} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </td>
  );
}

export default function RecurringPage() {
  const { data: recurringItems = [], isLoading } = useRecurring();
  const { mutate: toggleStatus }  = useToggleRecurringStatus();
  const { mutate: deleteStream }  = useDeleteRecurring();
  const { user }                  = useUser();
  const currency                  = user?.currency ?? 'USD';

  const [activeTab, setActiveTab] = useState<TabType>('expense');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Summary calculations across all active expense items
  const activeExpenses = recurringItems.filter(i => i.type === 'expense' && i.is_active);
  const activeIncomes  = recurringItems.filter(i => i.type === 'income'  && i.is_active);

  const monthlyOutflow = sumBy(activeExpenses, i => {
    const multipliers: Record<string, number> = {
      daily: 30, weekly: 4.33, biweekly: 2.17,
      monthly: 1, quarterly: 1 / 3, yearly: 1 / 12,
    };
    return Number(i.amount) * (multipliers[i.frequency] ?? 1);
  });

  const next7Days = recurringItems.filter(i => {
    const { daysUntil } = recurringDueUrgency(i.next_due);
    return i.is_active && daysUntil >= 0 && daysUntil <= 7;
  }).length;

  const filtered = recurringItems.filter(i => i.type === activeTab);

  const handleDelete = (item: RecurringTransaction) => {
    // merchant is nullable — fall back to category for the confirm label
    const label = item.merchant ?? item.category;
    if (confirm(`Remove recurring entry for "${label}"?`)) {
      deleteStream(item.id);
    }
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'expense', label: 'Bills & Subscriptions', count: recurringItems.filter(i => i.type === 'expense').length },
    { key: 'income',  label: 'Income Streams',        count: recurringItems.filter(i => i.type === 'income').length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Recurring</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage ongoing bills, subscriptions, and income streams.</p>
        </div>
      </div>

      {/* PRD: summary header — monthly committed outflow, active counts, upcoming bills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Monthly Outflow</p>
          <p className="text-lg font-bold text-danger-600">{formatCurrency(monthlyOutflow, currency)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">committed expenses</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Active Bills</p>
          <p className="text-lg font-bold text-slate-800 dark:text-white">{activeExpenses.length}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">expense schedules</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Income Streams</p>
          <p className="text-lg font-bold text-success-600">{activeIncomes.length}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">active inflows</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Due This Week</p>
          <p className={cn('text-lg font-bold', next7Days > 0 ? 'text-warning-600' : 'text-slate-800 dark:text-white')}>
            {next7Days}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">in next 7 days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Expense / Income type filter tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
                  activeTab === tab.key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300',
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    'text-xs px-1.5 rounded-full',
                    activeTab === tab.key
                      ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="card overflow-hidden">
            {isLoading ? (
              <div className="p-5 space-y-3 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={Calendar}
                  title={`No ${activeTab === 'expense' ? 'bills' : 'income streams'} yet`}
                  message="Add a recurring entry using the form."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <th className="p-3">Merchant</th>
                      <th className="p-3 hidden sm:table-cell">Frequency</th>
                      <th className="p-3">Next Due</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm">
                    {filtered.map(item => {
                      const { daysUntil, urgency } = recurringDueUrgency(item.next_due);
                      const isEditing = editingId === item.id;

                      return (
                        <React.Fragment key={item.id}>
                          <tr
                            className={cn(
                              'transition-colors',
                              !item.is_active && 'opacity-40',
                              URGENCY_ROW_CLASSES[urgency],
                            )}
                          >
                            <td className="p-3">
                              <p className="font-semibold text-slate-800 dark:text-slate-100">
                                {item.merchant ?? item.category}
                              </p>
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                                {item.category}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 dark:text-slate-400 font-medium capitalize hidden sm:table-cell">
                              {FREQUENCY_LABELS[item.frequency] ?? item.frequency}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-600 dark:text-slate-300 font-medium">
                                  {new Date(item.next_due).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric',
                                  })}
                                </span>
                                {urgency !== 'future' && URGENCY_BADGE_CLASSES[urgency] && (
                                  <span className={cn(
                                    'text-xs font-medium px-1.5 py-0.5 rounded-full',
                                    URGENCY_BADGE_CLASSES[urgency],
                                  )}>
                                    {urgencyLabel(daysUntil, urgency)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-right font-bold">
                              <span className={item.type === 'income' ? 'text-success-600' : 'text-slate-900 dark:text-white'}>
                                {item.type === 'income' ? '+' : '-'}{formatCurrency(Number(item.amount), currency)}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setEditingId(isEditing ? null : item.id)}
                                  title="Edit"
                                  className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-primary-600 hover:border-primary-200 dark:hover:border-primary-500 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => toggleStatus({ id: item.id, is_active: !item.is_active })}
                                  title={item.is_active ? 'Pause' : 'Resume'}
                                  className={cn(
                                    'p-1.5 rounded border dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors',
                                    item.is_active
                                      ? 'text-warning-500 hover:bg-warning-50 dark:hover:bg-warning-500/10 hover:border-warning-200'
                                      : 'text-success-500 hover:bg-success-50 dark:hover:bg-success-500/10 hover:border-success-200',
                                  )}
                                >
                                  {item.is_active
                                    ? <PowerOff className="w-3.5 h-3.5" />
                                    : <Power className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={() => handleDelete(item)}
                                  className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10 hover:border-danger-200 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Inline edit row — expands below the selected row */}
                          {isEditing && (
                            <tr key={`${item.id}-edit`} className="bg-slate-50 dark:bg-slate-800/60">
                              <InlineEdit
                                item={item}
                                onDone={() => setEditingId(null)}
                              />
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card p-5 h-fit">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
            New Recurring
          </h2>
          <RecurringForm />
        </div>
      </div>
    </div>
  );
}
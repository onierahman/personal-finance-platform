'use client';
import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { TransactionList } from '@/components/transactions/TransactionList';
import { useUiStore }      from '@/stores/uiStore';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const TYPE_FILTERS = [
  { label: 'All',     value: '' },
  { label: 'Expense', value: 'expense' },
  { label: 'Income',  value: 'income' },
] as const;

export default function TransactionsPage() {
  const { openQuickAdd } = useUiStore();
  const [typeFilter, setTypeFilter] = useState<string>('');

  const allCategories = [
    { name: 'All categories', value: '' },
    ...EXPENSE_CATEGORIES.map(c => ({ name: c.name, value: c.name })),
    ...INCOME_CATEGORIES.map(c => ({ name: c.name, value: c.name })),
  ];
  const [categoryFilter, setCategoryFilter] = useState('');

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Transactions</h1>
        <button
          onClick={() => openQuickAdd('expense')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Filter bar */}
      <div className="card p-3 flex flex-wrap gap-2 items-center">
        {/* Type filter tabs */}
        <div className="flex rounded-md bg-slate-100 p-0.5 gap-0.5">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-medium transition-all',
                typeFilter === f.value
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Category select */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-md bg-white outline-none focus:border-primary-500 transition-colors"
        >
          {allCategories.map(c => (
            <option key={c.value} value={c.value}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <TransactionList
        category={categoryFilter || undefined}
      />
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { TransactionList } from '@/components/transactions/TransactionList';
import { useUiStore }      from '@/stores/uiStore';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

type TypeFilterValue = '' | 'expense' | 'income';

const TYPE_FILTERS: { label: string; value: TypeFilterValue }[] = [
  { label: 'All',     value: '' },
  { label: 'Expense', value: 'expense' },
  { label: 'Income',  value: 'income' },
];

export default function TransactionsPage() {
  const { openQuickAdd } = useUiStore();
  const [typeFilter, setTypeFilter]         = useState<TypeFilterValue>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchInput, setSearchInput]       = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  // Debounce search — wait 350 ms after the user stops typing before querying
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Scope category options to the active type so the dropdown stays relevant.
  const categoryOptions = [
    { name: 'All categories', value: '' },
    ...(typeFilter === 'income'
      ? INCOME_CATEGORIES
      : typeFilter === 'expense'
        ? EXPENSE_CATEGORIES
        : [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]
    ).map(c => ({ name: c.name, value: c.name })),
  ];

  function handleTypeChange(value: TypeFilterValue) {
    setTypeFilter(value);
    // Reset category when switching type — selected category may not exist in new list
    setCategoryFilter('');
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Transactions</h1>
        <button
          onClick={() => openQuickAdd(typeFilter || 'expense')}
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
              onClick={() => handleTypeChange(f.value)}
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

        {/* Category select — scoped to active type */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-md bg-white outline-none focus:border-primary-500 transition-colors"
        >
          {categoryOptions.map(c => (
            <option key={c.value} value={c.value}>{c.name}</option>
          ))}
        </select>

        {/* Search by merchant — debounced */}
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search merchant…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-200 rounded-md bg-white outline-none focus:border-primary-500 transition-colors"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* List — all three filters wired */}
      <TransactionList
        type={typeFilter || undefined}
        category={categoryFilter || undefined}
        search={searchDebounced || undefined}
      />
    </div>
  );
}
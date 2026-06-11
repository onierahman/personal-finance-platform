'use client';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X } from 'lucide-react';
import { PullToRefresh } from '@/components/shared/PullToRefresh';
import { TransactionList }          from '@/components/transactions/TransactionList';
import { TransactionExportButton }  from '@/components/transactions/TransactionExportButton';
import { ImportMenu }               from '@/components/transactions/ImportMenu';
import { ReceiptScanner }           from '@/components/transactions/ReceiptScanner';
import { CSVImport }                from '@/components/transactions/CSVImport';
import { BankStatementImport }      from '@/components/transactions/BankStatementImport';
import { useUiStore } from '@/stores/uiStore';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

type TypeFilterValue = '' | 'expense' | 'income';

const TYPE_FILTERS: { label: string; value: TypeFilterValue }[] = [
  { label: 'All',     value: '' },
  { label: 'Expense', value: 'expense' },
  { label: 'Income',  value: 'income' },
];

export default function TransactionsPage() {
  const { openQuickAdd, activeMonth, importOpen, importMode, closeImport } = useUiStore();
  const queryClient = useQueryClient();
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
    <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: ['transactions'] })}>
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Transactions</h1>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <TransactionExportButton
            month={activeMonth}
            type={typeFilter || undefined}
            category={categoryFilter || undefined}
            search={searchDebounced || undefined}
          />
          <ImportMenu />
          <button
            onClick={() => openQuickAdd(typeFilter || 'expense')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card p-3 flex flex-wrap gap-2 items-center">
        {/* Type filter tabs */}
        <div className="flex rounded-md bg-slate-100 dark:bg-slate-800 p-0.5 gap-0.5">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => handleTypeChange(f.value)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-medium transition-all',
                typeFilter === f.value
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
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
          className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-primary-500 transition-colors"
        >
          {categoryOptions.map(c => (
            <option key={c.value} value={c.value}>{c.name}</option>
          ))}
        </select>

        {/* Search by merchant — debounced */}
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search merchant…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-primary-500 transition-colors"
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

      {/* Import modals */}
      {importOpen && importMode === 'receipt' && <ReceiptScanner onClose={closeImport} />}
      {importOpen && importMode === 'csv'     && <CSVImport onClose={closeImport} />}
      {importOpen && importMode === 'bank'    && <BankStatementImport onClose={closeImport} />}
    </div>
    </PullToRefresh>
  );
}
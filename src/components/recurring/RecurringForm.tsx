'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { recurringSchema } from '@/features/recurring/schema';
import { useCreateRecurring } from '@/features/recurring/hooks';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, FREQUENCY_LABELS } from '@/lib/constants';
import { todayIso } from '@/lib/formatters';

type RecurringFormValues = z.infer<typeof recurringSchema>;

export function RecurringForm({ onSuccess }: { onSuccess?: () => void }) {
  const supabase = getSupabaseBrowserClient();
  const { mutate: createRecurring, isPending, error } = useCreateRecurring();

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accounts', 'list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const accounts = Array.isArray(accountsData) ? accountsData : [];

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      merchant:   '',
      amount:     0,
      frequency:  'monthly',
      type:       'expense',
      category:   '',
      account_id: '',
      start_date: todayIso(),
      next_due:   todayIso(),
      note:       '',
      end_date:   '',
    },
  });

  // Drive category options from constants based on selected flow type
  const selectedType = watch('type');
  const categoryOptions = selectedType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const onSubmit = (data: RecurringFormValues) => {
    createRecurring(data, {
      onSuccess: () => {
        reset();
        onSuccess?.();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
      {error && (
        <div className="p-3 text-xs font-semibold text-danger-700 bg-danger-50 border border-danger-100 rounded-md">
          ⚠️ {error.message}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Merchant / Label
        </label>
        <input
          type="text"
          placeholder="e.g. Netflix, Rent, Salary"
          {...register('merchant')}
          className="w-full text-sm rounded-md border border-slate-200 p-2.5 outline-none focus:border-primary-500"
        />
        {errors.merchant && (
          <p className="text-xs font-medium text-danger-600 mt-1">{errors.merchant.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Type
          </label>
          <select
            {...register('type')}
            className="w-full text-sm rounded-md border border-slate-200 bg-white p-2.5 text-slate-700"
          >
            <option value="expense">Expense (Bill)</option>
            <option value="income">Income (Inflow)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">$</span>
            <input
              type="number"
              step="0.01"
              {...register('amount')}
              className="w-full text-sm rounded-md border border-slate-200 p-2.5 pl-7 text-slate-900 font-medium outline-none focus:border-primary-500"
            />
          </div>
          {errors.amount && (
            <p className="text-xs font-medium text-danger-600 mt-1">{errors.amount.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Frequency
          </label>
          <select
            {...register('frequency')}
            className="w-full text-sm rounded-md border border-slate-200 bg-white p-2.5 text-slate-700"
          >
            {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Category
          </label>
          {/* Options switch dynamically based on expense vs income type */}
          <select
            {...register('category')}
            className="w-full text-sm rounded-md border border-slate-200 bg-white p-2.5 text-slate-700"
          >
            <option value="">Select category...</option>
            {categoryOptions.map(c => (
              <option key={c.name} value={c.name}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-xs font-medium text-danger-600 mt-1">{errors.category.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Account
        </label>
        <select
          {...register('account_id')}
          disabled={isLoadingAccounts}
          className="w-full text-sm rounded-md border border-slate-200 bg-white p-2.5 text-slate-700 disabled:opacity-50"
        >
          <option value="">Select account...</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name}</option>
          ))}
        </select>
        {errors.account_id && (
          <p className="text-xs font-medium text-danger-600 mt-1">{errors.account_id.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Next Due Date
          </label>
          <input
            type="date"
            {...register('next_due')}
            className="w-full text-sm rounded-md border border-slate-200 p-2.5 outline-none focus:border-primary-500"
          />
          {errors.next_due && (
            <p className="text-xs font-medium text-danger-600 mt-1">{errors.next_due.message}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            End Date <span className="normal-case font-normal text-slate-400">(optional)</span>
          </label>
          <input
            type="date"
            {...register('end_date')}
            className="w-full text-sm rounded-md border border-slate-200 p-2.5 outline-none focus:border-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Note <span className="normal-case font-normal text-slate-400">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Annual plan, auto-renews"
          {...register('note')}
          className="w-full text-sm rounded-md border border-slate-200 p-2.5 outline-none focus:border-primary-500"
        />
      </div>

      {/* start_date tracked silently — set to today on form init */}
      <input type="hidden" {...register('start_date')} />

      <button
        type="submit"
        disabled={isPending || isLoadingAccounts}
        className="w-full rounded-md bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-60"
      >
        {isPending ? 'Saving...' : 'Create Recurring'}
      </button>
    </form>
  );
}
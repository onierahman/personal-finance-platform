'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { recurringSchema } from '@/features/recurring/schema';
import { useCreateRecurring } from '@/features/recurring/hooks';
import { todayIso } from '@/lib/formatters';
import { z } from 'zod';

type RecurringValues = z.infer<typeof recurringSchema>;

export function RecurringForm({ onSuccess }: { onSuccess?: () => void }) {
  const supabase = getSupabaseBrowserClient();
  const { mutate: createRecurring, isPending } = useCreateRecurring();

// 1. Change 'data: accounts = []' to 'data: accountsData'
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accounts', 'list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name')
        .order('name', { ascending: true });
        
      if (error) throw new Error(error.message);
      return data ?? [];
    }
  });

  // 2. Add this right below the useQuery block to safely handle the null hydration state
  const accounts = Array.isArray(accountsData) ? accountsData : [];



  const { register, handleSubmit, reset, fontState, formState: { errors } } = useForm<RecurringValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      merchant: '',
      amount: 0,
      frequency: 'monthly',
      type: 'expense',
      start_date: todayIso(), // Set automatically to present day timeline initialization
      next_due: todayIso(),
      category: 'Subscriptions',
      account_id: '',
    }
  });

  const onSubmit = (data: RecurringValues) => {
    createRecurring(data, {
      onSuccess: () => {
        reset();
        onSuccess?.();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Merchant / Label
        </label>
        <input
          type="text"
          placeholder="e.g. Netflix, OpenAI, Rent"
          {...register('merchant')}
          className="w-full text-sm rounded-md border border-slate-200 p-2.5 outline-none focus:border-primary-500"
        />
        {errors.merchant && <p className="text-xs font-medium text-danger-600 mt-1">{errors.merchant.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Flow Type</label>
          <select {...register('type')} className="w-full text-sm rounded-md border border-slate-200 bg-white p-2.5 text-slate-700">
            <option value="expense">Outflow (Bill)</option>
            <option value="income">Inflow (Salary)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">$</span>
            <input
              type="number"
              step="0.01"
              {...register('amount')}
              className="w-full text-sm rounded-md border border-slate-200 p-2.5 pl-7 text-slate-900 font-medium"
            />
          </div>
          {errors.amount && <p className="text-xs font-medium text-danger-600 mt-1">{errors.amount.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Frequency</label>
          <select {...register('frequency')} className="w-full text-sm rounded-md border border-slate-200 bg-white p-2.5 text-slate-700">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Annually</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Category</label>
          <select {...register('category')} className="w-full text-sm rounded-md border border-slate-200 bg-white p-2.5 text-slate-700">
            <option value="Subscriptions">Subscriptions</option>
            <option value="Utilities">Utilities</option>
            <option value="Housing">Housing & Rent</option>
            <option value="Insurance">Insurance</option>
            <option value="Inflow">Inflow Streams</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Target Payment Account
        </label>
        <select 
          {...register('account_id')} 
          disabled={isLoadingAccounts}
          className="w-full text-sm rounded-md border border-slate-200 bg-white p-2.5 text-slate-700 disabled:opacity-50"
        >
          <option value="">-- Choose Account --</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>
        {errors.account_id && <p className="text-xs font-medium text-danger-600 mt-1">{errors.account_id.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Next Settlement Date</label>
        <input type="date" {...register('next_due')} className="w-full text-sm rounded-md border border-slate-200 p-2.5 text-slate-800" />
        {errors.next_due && <p className="text-xs font-medium text-danger-600 mt-1">{errors.next_due.message}</p>}
      </div>

      {/* Hidden baseline input tracking date initialization */}
      <input type="hidden" {...register('start_date')} />

      <button
        type="submit"
        disabled={isPending || isLoadingAccounts}
        className="w-full rounded-md bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:bg-slate-300"
      >
        {isPending ? 'Deploying...' : 'Register Automated Profile'}
      </button>
    </form>
  );
}
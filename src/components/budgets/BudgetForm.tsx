'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { budgetSchema } from '@/features/budgets/schema';
import { useCreateBudget } from '@/features/budgets/hooks';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { todayIso } from '@/lib/formatters';

type BudgetFormValues = z.infer<typeof budgetSchema>;

const label = 'block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1';
const input = 'w-full text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 outline-none focus:border-primary-500 dark:placeholder:text-slate-500';
const select = 'w-full text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 outline-none focus:border-primary-500';

export function BudgetForm({ onSuccess }: { onSuccess?: () => void }) {
  const { mutate: createBudget, isPending, error } = useCreateBudget();

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: '' as BudgetFormValues['category'],
      limit_amount: 0,
      period: 'monthly',
      start_date: todayIso(),
    },
  });

  const period = watch('period');

  const onSubmit = (data: BudgetFormValues) => {
    createBudget(data, {
      onSuccess: () => {
        reset();
        onSuccess?.();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-fade-in">
      {error && (
        <div className="p-3 text-xs font-semibold text-danger-700 bg-danger-50 dark:bg-danger-500/10 border border-danger-100 dark:border-danger-500/20 rounded-md">
          ⚠️ {error.message}
        </div>
      )}

      <div>
        <label className={label}>Expense Category</label>
        <select {...register('category')} className={select}>
          <option value="">Select a category...</option>
          {EXPENSE_CATEGORIES.map(c => (
            <option key={c.name} value={c.name}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-xs font-medium text-danger-600 mt-1">{errors.category.message}</p>
        )}
      </div>

      <div>
        <label className={label}>
          {period === 'annual' ? 'Annual Ceiling' : 'Monthly Limit'}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">$</span>
          <input
            type="number"
            step="0.01"
            {...register('limit_amount')}
            className={`${input} pl-7 font-medium`}
          />
        </div>
        {errors.limit_amount && (
          <p className="text-xs font-medium text-danger-600 mt-1">{errors.limit_amount.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Period</label>
          <select {...register('period')} className={select}>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
        <div>
          <label className={label}>
            {period === 'annual' ? 'Fiscal Year Start' : 'Start Date'}
          </label>
          <input
            type="date"
            {...register('start_date')}
            className={input}
          />
          {errors.start_date && (
            <p className="text-xs font-medium text-danger-600 mt-1">{errors.start_date.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-60"
      >
        {isPending ? 'Saving...' : 'Create Budget'}
      </button>
    </form>
  );
}

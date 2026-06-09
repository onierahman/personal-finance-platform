'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { budgetSchema } from '@/features/budgets/schema';
import { useCreateBudget } from '@/features/budgets/hooks';
import { todayIso } from '@/lib/formatters';
import { z } from 'zod';

type BudgetFormValues = z.infer<typeof budgetSchema>;

export function BudgetForm({ onSuccess }: { onSuccess?: () => void }) {
  // Extract the error object from the useCreateBudget hook
  const { mutate: createBudget, isPending, error } = useCreateBudget();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: '',
      limit_amount: 0,
      period: 'monthly',
      start_date: todayIso(),
    }
  });

  const onSubmit = (data: BudgetFormValues) => {
    createBudget(data, {
      onSuccess: () => { 
        reset(); 
        onSuccess?.(); 
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-fade-in">
      {/* Clean Error UI Banner Catch */}
      {error && (
        <div className="p-3 text-xs font-semibold text-danger-700 bg-danger-50 border border-danger-100 rounded-md animate-shake">
          ⚠️ This budget envelope configuration already exists for this cycle.
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Expense Category</label>
        <input 
          type="text"
          placeholder="e.g. Groceries"
          {...register('category')}
          className="w-full text-sm rounded-md border border-slate-200 p-2.5 outline-none focus:border-primary-500"
        />
        {errors.category && <p className="text-xs font-medium text-danger-600 mt-1">{errors.category.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Limit Threshold</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">$</span>
          <input
            type="number"
            step="0.01"
            {...register('limit_amount')}
            className="amount w-full text-sm rounded-md border border-slate-200 p-2.5 pl-7 text-slate-900 font-medium"
          />
        </div>
        {errors.limit_amount && <p className="text-xs font-medium text-danger-600 mt-1">{errors.limit_amount.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Interval Cycle</label>
          <select { ...register('period') } className="w-full text-sm rounded-md border border-slate-200 bg-white p-2.5">
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Activation Date</label>
          <input type="date" { ...register('start_date') } className="w-full text-sm rounded-md border border-slate-200 p-2.5" />
        </div>
      </div>

      <button type="submit" disabled={isPending} className="w-full rounded-md bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors">
        {isPending ? 'Saving...' : 'Deploy Budget Cap'}
      </button>
    </form>
  );
}
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { savingsGoalSchema } from '@/features/goals/schema';
import { useCreateGoal } from '@/features/goals/hooks';
import { todayIso } from '@/lib/formatters';
import { randomColor } from '@/lib/utils';
import { z } from 'zod';

type GoalFormValues = z.infer<typeof savingsGoalSchema>;

export function GoalForm({ onSuccess }: { onSuccess?: () => void }) {
  const { mutate: createGoal, isPending } = useCreateGoal();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GoalFormValues>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: {
      name: '',
      target_amount: 0,
      deadline: todayIso(),
      color: randomColor(),
      icon: '🎯',
    }
  });

  const onSubmit = (data: GoalFormValues) => {
    createGoal(data, {
      onSuccess: () => {
        reset();
        onSuccess?.();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-fade-in">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Goal Horizon Name
        </label>
        <input
          type="text"
          placeholder="e.g. Emergency Cushion"
          {...register('name')}
          className="w-full text-sm rounded-md border border-slate-200 p-2.5 outline-none focus:border-primary-500"
        />
        {errors.name && <p className="text-xs font-medium text-danger-600 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Target Milestone
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">$</span>
          <input
            type="number"
            step="0.01"
            {...register('target_amount')}
            className="amount w-full text-sm rounded-md border border-slate-200 p-2.5 pl-7 text-slate-900 font-medium"
          />
        </div>
        {errors.target_amount && <p className="text-xs font-medium text-danger-600 mt-1">{errors.target_amount.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Target Deadline
          </label>
          <input 
            type="date" 
            {...register('deadline')} 
            className="w-full text-sm rounded-md border border-slate-200 p-2.5 text-slate-800" 
          />
          {errors.deadline && <p className="text-xs font-medium text-danger-600 mt-1">{errors.deadline.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Visual Identifier
          </label>
          <select {...register('icon')} className="w-full text-sm rounded-md border border-slate-200 bg-white p-2.5 text-slate-800">
            <option value="🎯">🎯 Target</option>
            <option value="🚨">🚨 Emergency</option>
            <option value="🏡">🏡 Real Estate</option>
            <option value="🚗">🚗 Vehicle</option>
            <option value="🏖️">🏖️ Getaway</option>
            <option value="🎓">🎓 Education</option>
          </select>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isPending} 
        className="w-full rounded-md bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
      >
        {isPending ? 'Creating Target...' : 'Initialize Savings Horizon'}
      </button>
    </form>
  );
}
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { savingsGoalSchema } from '@/features/goals/schema';
import { useCreateGoal } from '@/features/goals/hooks';

type GoalFormValues = z.infer<typeof savingsGoalSchema>;

const GOAL_PRESETS = [
  { label: 'Emergency Fund', icon: '🚨', color: '#EF4444' },
  { label: 'Vacation',       icon: '🏖️', color: '#0EA5E9' },
  { label: 'Car',            icon: '🚗', color: '#6366F1' },
  { label: 'House',          icon: '🏡', color: '#22C55E' },
  { label: 'Education',      icon: '🎓', color: '#F59E0B' },
  { label: 'Retirement',     icon: '💼', color: '#8B5CF6' },
  { label: 'Custom',         icon: '🎯', color: '#2563EB' },
] as const;

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low',    color: 'text-slate-500' },
  { value: 'medium', label: 'Medium', color: 'text-warning-600' },
  { value: 'high',   label: 'High',   color: 'text-danger-600' },
] as const;

const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1';
const inputCls = 'w-full text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 outline-none focus:border-primary-500 dark:placeholder:text-slate-500';
const selectCls = 'w-full text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 outline-none focus:border-primary-500';

export function GoalForm({ onSuccess }: { onSuccess?: () => void }) {
  const { mutate: createGoal, isPending, error } = useCreateGoal();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<GoalFormValues>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: {
      name:          '',
      description:   '',
      target_amount: 0,
      deadline:      '',
      priority:      'medium',
      icon:          '🎯',
      color:         '#2563EB',
    },
  });

  const handlePreset = (preset: typeof GOAL_PRESETS[number]) => {
    setSelectedPreset(preset.label);
    setValue('icon', preset.icon);
    setValue('color', preset.color);
    if (!watch('name')) setValue('name', preset.label === 'Custom' ? '' : preset.label);
  };

  const onSubmit = (data: GoalFormValues) => {
    createGoal(data, {
      onSuccess: () => {
        reset();
        setSelectedPreset(null);
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
        <label className={labelCls}>Goal Type</label>
        <div className="grid grid-cols-4 gap-1.5">
          {GOAL_PRESETS.map(preset => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePreset(preset)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors ${
                selectedPreset === preset.label
                  ? 'border-primary-400 bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-400'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className="text-base">{preset.icon}</span>
              <span className="leading-tight text-center" style={{ fontSize: '10px' }}>
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Goal Name</label>
        <input
          type="text"
          placeholder="e.g. Emergency Fund"
          {...register('name')}
          className={inputCls}
        />
        {errors.name && (
          <p className="text-xs font-medium text-danger-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className={labelCls}>
          Description <span className="normal-case font-normal text-slate-400">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="Short note about this goal"
          {...register('description')}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Target Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">$</span>
          <input
            type="number"
            step="0.01"
            {...register('target_amount')}
            className={`${inputCls} pl-7 font-medium`}
          />
        </div>
        {errors.target_amount && (
          <p className="text-xs font-medium text-danger-600 mt-1">{errors.target_amount.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>
            Deadline <span className="normal-case font-normal text-slate-400">(optional)</span>
          </label>
          <input
            type="date"
            {...register('deadline')}
            className={inputCls}
          />
          {errors.deadline && (
            <p className="text-xs font-medium text-danger-600 mt-1">{errors.deadline.message}</p>
          )}
        </div>
        <div>
          <label className={labelCls}>Priority</label>
          <select {...register('priority')} className={selectCls}>
            {PRIORITY_OPTIONS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-60"
      >
        {isPending ? 'Creating...' : 'Create Goal'}
      </button>
    </form>
  );
}

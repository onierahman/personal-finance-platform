'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { savingsGoalSchema } from '@/features/goals/schema';
import { useCreateGoal } from '@/features/goals/hooks';

type GoalFormValues = z.infer<typeof savingsGoalSchema>;

// PRD Module E — fixed goal types with defaults
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
    // Only prefill name if still empty — don't overwrite user's custom input
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
        <div className="p-3 text-xs font-semibold text-danger-700 bg-danger-50 border border-danger-100 rounded-md">
          ⚠️ {error.message}
        </div>
      )}

      {/* PRD: goal type quick-start presets */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Goal Type
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {GOAL_PRESETS.map(preset => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePreset(preset)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors ${
                selectedPreset === preset.label
                  ? 'border-primary-400 bg-primary-50 text-primary-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
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
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Goal Name
        </label>
        <input
          type="text"
          placeholder="e.g. Emergency Fund"
          {...register('name')}
          className="w-full text-sm rounded-md border border-slate-200 p-2.5 outline-none focus:border-primary-500"
        />
        {errors.name && (
          <p className="text-xs font-medium text-danger-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Description <span className="normal-case font-normal text-slate-400">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="Short note about this goal"
          {...register('description')}
          className="w-full text-sm rounded-md border border-slate-200 p-2.5 outline-none focus:border-primary-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Target Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">$</span>
          <input
            type="number"
            step="0.01"
            {...register('target_amount')}
            className="w-full text-sm rounded-md border border-slate-200 p-2.5 pl-7 text-slate-900 font-medium outline-none focus:border-primary-500"
          />
        </div>
        {errors.target_amount && (
          <p className="text-xs font-medium text-danger-600 mt-1">{errors.target_amount.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Deadline <span className="normal-case font-normal text-slate-400">(optional)</span>
          </label>
          <input
            type="date"
            {...register('deadline')}
            className="w-full text-sm rounded-md border border-slate-200 p-2.5 outline-none focus:border-primary-500"
          />
          {errors.deadline && (
            <p className="text-xs font-medium text-danger-600 mt-1">{errors.deadline.message}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Priority
          </label>
          <select
            {...register('priority')}
            className="w-full text-sm rounded-md border border-slate-200 bg-white p-2.5 outline-none focus:border-primary-500"
          >
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
'use client';

import { GoalForm } from '@/components/goals/GoalForm';
import { GoalsList } from '@/components/goals/GoalsList';

export default function SavingsGoalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Savings Goals</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Track your financial milestones and contributions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GoalsList />
        </div>
        <div className="card p-5 h-fit">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
            New Goal
          </h2>
          <GoalForm />
        </div>
      </div>
    </div>
  );
}
'use client';

import { BudgetForm } from '@/components/budgets/BudgetForm';
import { BudgetHealth } from '@/components/dashboard/BudgetHealth';

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Budgets & Limits</h1>
        <p className="text-sm text-slate-500">Establish ceiling allocation targets by categories.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BudgetHealth />
        </div>
        <div className="card p-5 bg-white border border-slate-100 rounded-xl shadow-sm h-fit">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Create Budget Cap</h2>
          <BudgetForm />
        </div>
      </div>
    </div>
  );
}
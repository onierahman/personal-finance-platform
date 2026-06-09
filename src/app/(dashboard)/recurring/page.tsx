'use client';

import { UpcomingBills } from '@/components/dashboard/UpcomingBills';

export default function RecurringPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recurring Ledger Plans</h1>
        <p className="text-sm text-slate-500">Manage ongoing subscriptions and automated streams.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UpcomingBills />
        </div>
        <div className="card p-5 bg-white border border-slate-100 rounded-xl shadow-sm h-fit flex flex-col justify-center items-center text-center py-12">
          <span className="text-2xl mb-2">⏳</span>
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Recurring Configurator</p>
          <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
            Phase 2 scheduler engine updates will attach right here.
          </p>
        </div>
      </div>
    </div>
  );
}
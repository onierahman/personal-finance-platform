'use client';

import { useRecurring, useToggleRecurringStatus, useDeleteRecurring } from '@/features/recurring/hooks';
import { RecurringForm } from '@/components/recurring/RecurringForm';
import { formatCurrency, formatRelativeDate } from '@/lib/formatters';
import { useUser } from '@/hooks/useUser';
import { EmptyState } from '@/components/shared/EmptyState';
import { Calendar, Trash2, Power, PowerOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RecurringPage() {
  const { data: recurringItems = [], isLoading } = useRecurring();
  const { mutate: toggleStatus } = useToggleRecurringStatus();
  const { mutate: deleteStream } = useDeleteRecurring();
  const { user } = useUser();
  const currency = user?.currency ?? 'USD';

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Clear recurring contract plan for "${name}"?`)) {
      deleteStream(id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recurring Ledger Plans</h1>
        <p className="text-sm text-slate-500">Manage ongoing subscriptions and automated streams.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Live interactive view list */}
        <div className="lg:col-span-2 card p-5 bg-white border border-slate-100 rounded-xl shadow-sm">
          <p className="section-title text-base mb-4 text-left">Upcoming Bills & Subscriptions</p>
          
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-12 bg-slate-100 rounded w-full" />
              <div className="h-12 bg-slate-100 rounded w-full" />
            </div>
          ) : recurringItems.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Clear Schedule"
              message="No subscription outflows registered for this window."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="p-3">Profile Info</th>
                    <th className="p-3">Frequency</th>
                    <th className="p-3">Next Due</th>
                    <th className="p-3 text-right">Commitment</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {recurringItems.map((item) => {
                    const dateString = formatRelativeDate(item.next_due);
                    return (
                      <tr key={item.id} className={cn("hover:bg-slate-50/40 transition-colors", !item.is_active && "opacity-50")}>
                        <td className="p-3 font-semibold text-slate-800 text-left">
                          <div>
                            <p>{item.merchant}</p>
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-wider font-medium">
                              {item.category}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-500 capitalize font-medium">{item.frequency}</td>
                        <td className="p-3 text-slate-500 font-medium">Due {dateString}</td>
                        <td className="p-3 text-right font-bold">
                          <span className={item.type === 'income' ? 'text-success-600' : 'text-slate-900'}>
                            {item.type === 'income' ? '+' : '-'} {formatCurrency(Number(item.amount), currency)}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => toggleStatus({ id: item.id, is_active: !item.is_active })}
                              className={cn(
                                "p-1.5 rounded border transition-colors bg-white",
                                item.is_active ? "text-warning-500 hover:bg-warning-50" : "text-success-500 hover:bg-success-50"
                              )}
                              title={item.is_active ? "Pause Schedule" : "Activate Schedule"}
                            >
                              {item.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.merchant)}
                              className="p-1.5 rounded border text-slate-400 hover:text-danger-600 hover:bg-danger-50 bg-white transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Replaces the placeholder card with the interactive form */}
        <div className="card p-5 bg-white border border-slate-100 rounded-xl shadow-sm h-fit">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 text-left">
            Recurring Configurator
          </h2>
          <RecurringForm />
        </div>
      </div>
    </div>
  );
}
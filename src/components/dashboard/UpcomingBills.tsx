'use client';

import Link from 'next/link';
import { useRecurring } from '@/features/recurring/hooks';
import { formatCurrency } from '@/lib/formatters';
import { recurringDueUrgency } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { TransactionSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Calendar, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const URGENCY_ICON_CLASSES = {
  overdue:  'bg-danger-50 dark:bg-danger-500/15 text-danger-600 dark:text-danger-400',
  today:    'bg-danger-50 dark:bg-danger-500/15 text-danger-600 dark:text-danger-400',
  soon:     'bg-warning-50 dark:bg-warning-500/15 text-warning-600 dark:text-warning-400',
  upcoming: 'bg-warning-50 dark:bg-warning-500/15 text-warning-500 dark:text-warning-400',
  future:   'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
} as const;

const URGENCY_DATE_CLASSES = {
  overdue:  'text-danger-600',
  today:    'text-danger-600',
  soon:     'text-warning-600',
  upcoming: 'text-warning-500',
  future:   'text-slate-400',
} as const;

function formatDueLabel(daysUntil: number, urgency: string): string {
  if (urgency === 'overdue')  return `${Math.abs(daysUntil)}d overdue`;
  if (urgency === 'today')    return 'Due today';
  if (urgency === 'soon')     return `Due in ${daysUntil}d`;
  if (urgency === 'upcoming') return `Due in ${daysUntil}d`;
  return new Date(Date.now() + daysUntil * 86400000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

const VISIBLE_LIMIT = 4;

export function UpcomingBills() {
  const { data: bills = [], isLoading } = useRecurring();
  const { user } = useUser();
  const currency = user?.currency ?? 'USD';

  const activeBills = bills.filter(b => b.type === 'expense' && b.is_active);

  // Annotate with urgency for sorting — overdue items surface first, then by next_due ASC
  const annotated = activeBills
    .map(b => ({ ...b, ...recurringDueUrgency(b.next_due) }))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const visible    = annotated.slice(0, VISIBLE_LIMIT);
  const hiddenCount = annotated.length - VISIBLE_LIMIT;

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-base font-semibold text-slate-800 dark:text-slate-100">Upcoming Bills</p>
        <Link href="/recurring" className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
          All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <TransactionSkeleton key={i} />)}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No upcoming bills"
          message="Add recurring bills to track your upcoming payments."
          action={
            <Link href="/recurring" className="text-xs text-primary-600 hover:underline">
              Add bills →
            </Link>
          }
        />
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {visible.map(bill => (
              <div
                key={bill.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn('p-2 rounded-md flex-shrink-0', URGENCY_ICON_CLASSES[bill.urgency])}>
                    {bill.urgency === 'overdue' || bill.urgency === 'today'
                      ? <AlertCircle className="w-4 h-4" />
                      : <Clock className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {bill.merchant ?? bill.category}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-medium">
                        {bill.category}
                      </span>
                      <span className={cn('text-xs font-medium', URGENCY_DATE_CLASSES[bill.urgency])}>
                        {formatDueLabel(bill.daysUntil, bill.urgency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-3">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(Number(bill.amount), currency)}
                  </span>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">
                    {bill.frequency}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {hiddenCount > 0 && (
            <Link
              href="/recurring"
              className="mt-auto pt-4 block text-center text-xs text-primary-600 hover:underline"
            >
              +{hiddenCount} more bill{hiddenCount > 1 ? 's' : ''} → View all
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
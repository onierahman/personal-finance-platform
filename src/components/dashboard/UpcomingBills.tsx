'use client';

import Link from 'next/link';
import { useRecurring } from '@/features/recurring/hooks';
import { formatCurrency, formatRelativeDate } from '@/lib/formatters';
import { useUser } from '@/hooks/useUser';
import { TransactionSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Calendar, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UpcomingBills() {
  const { data: bills = [], isLoading } = useRecurring();
  const { user } = useUser();
  const currency = user?.currency ?? 'USD';

  // Filter based on your explicit active state flag and type rules
  const upcomingBills = bills
    .filter((b) => b.type === 'expense' && b.is_active === true)
    .slice(0, 4);

  return (
    <div className="card p-5 hover-lift">
      <div className="flex items-center justify-between mb-4">
        <p className="section-title text-base">Upcoming Bills & Subscriptions</p>
        <Link href="/recurring" className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
          All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <TransactionSkeleton key={i} />)}
        </div>
      ) : upcomingBills.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Clear Schedule"
          message="No subscription outflows registered for this window."
        />
      ) : (
        <div className="divide-y divide-slate-100">
          {upcomingBills.map((bill) => {
            const relativeString = formatRelativeDate(bill.next_due);
            const isUrgent = relativeString === 'today' || relativeString === 'tomorrow' || relativeString.includes('ago');

            return (
              <div key={bill.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-md",
                    isUrgent ? "bg-danger-50 text-danger-600" : "bg-slate-100 text-slate-600"
                  )}>
                    {isUrgent ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{bill.merchant || 'Subscription'}</p>
                    <p className={cn("text-xs font-medium", isUrgent ? "text-danger-600" : "text-slate-400")}>
                      Due {relativeString}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="amount text-sm font-semibold text-slate-900">
                    {formatCurrency(Number(bill.amount), currency)}
                  </span>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                    {bill.frequency}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
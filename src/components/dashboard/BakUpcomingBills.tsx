'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatCurrency, formatRelativeDate } from '@/lib/formatters';
import { getCategoryMeta } from '@/lib/constants';
import { TransactionSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState }   from '@/components/shared/EmptyState';
import { RefreshCw, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { todayIso } from '@/lib/formatters';

async function fetchUpcomingBills() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowserClient() as any;
  const today  = todayIso();
  const in30d  = new Date();
  in30d.setDate(in30d.getDate() + 30);
  const future = in30d.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*, accounts(user_id)')
    .eq('is_active', true)
    .gte('next_due', today)
    .lte('next_due', future)
    .order('next_due')
    .limit(5);

  if (error) throw new Error(error.message);
  return (data ?? []) as import('@/features/recurring/types').RecurringTransaction[];
}

export function UpcomingBills() {
  const { user }     = useUser();
  const currency     = user?.currency ?? 'USD';
  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['recurring', 'upcoming'],
    queryFn:  fetchUpcomingBills,
    staleTime: 300_000,
  });

  const today    = todayIso();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  function urgencyClass(due: string) {
    if (due <= today)        return 'text-danger-600 bg-danger-50';
    if (due <= tomorrowStr)  return 'text-warning-600 bg-warning-50';
    return 'text-slate-500 bg-slate-100';
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="section-title text-base">Upcoming Bills</p>
        <Link href="/recurring" className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
          All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <TransactionSkeleton key={i} />)}
        </div>
      ) : bills.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title="No upcoming bills"
          message="Add recurring transactions to track your bills."
          action={<Link href="/recurring" className="text-xs text-primary-600 hover:underline">Add recurring →</Link>}
        />
      ) : (
        <ul className="divide-y divide-slate-50">
          {bills.map(bill => {
            const meta = getCategoryMeta(bill.category);
            return (
              <li key={bill.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: meta.color + '18' }}
                >
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {bill.merchant ?? bill.category}
                  </p>
                  <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', urgencyClass(bill.next_due))}>
                    {formatRelativeDate(bill.next_due)}
                  </span>
                </div>
                <span className="amount text-sm font-semibold text-slate-900">
                  {formatCurrency(Number(bill.amount), currency)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

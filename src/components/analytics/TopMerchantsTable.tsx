'use client';

import { useTopMerchants }    from '@/features/analytics/hooks';
import { formatCurrency }     from '@/lib/formatters';
import { Skeleton }           from '@/components/shared/LoadingSkeleton';
import { useUser }            from '@/hooks/useUser';
import type { MerchantSummary } from '@/features/analytics/types';

interface Props { months: number }

export function TopMerchantsTable({ months }: Props) {
  const { user }            = useUser();
  const currency            = user?.currency ?? 'USD';
  const { data, isLoading } = useTopMerchants(months, 10);
  const merchants           = (data?.data ?? []) as MerchantSummary[];

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!merchants.length) return (
    <div className="card p-5 flex items-center justify-center h-40">
      <p className="text-slate-400 text-sm">No merchant data for this period</p>
    </div>
  );

  const maxTotal = merchants[0]?.total ?? 1;

  return (
    <div className="card p-5">
      <p className="section-title text-base mb-4">Top Merchants</p>
      <div className="space-y-3">
        {merchants.map((m, i) => (
          <div key={m.merchant} className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-4 shrink-0">{i + 1}</span>
            <span className="text-sm shrink-0">{m.categoryIcon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{m.merchant}</span>
                <span className="text-sm amount font-semibold text-slate-900 dark:text-white ml-2 shrink-0">
                  {formatCurrency(m.total, currency)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${(m.total / maxTotal) * 100}%`, background: m.categoryColor }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                  {m.count}× · avg {formatCurrency(m.avgAmount, currency)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

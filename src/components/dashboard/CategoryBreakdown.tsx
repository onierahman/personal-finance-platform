'use client';

import Link from 'next/link';
import { PieChart as PieIcon, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useCategoryBreakdown } from '@/features/transactions/hooks';
import { useUiStore } from '@/stores/uiStore';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { useUser } from '@/hooks/useUser';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/shared/LoadingSkeleton';

const VISIBLE_LIMIT = 5;

interface TooltipPayload {
  name: string;
  value: number;
  payload: { color: string; percentage: number };
}

function CustomTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="card px-3 py-2 text-xs shadow-dropdown">
      <p className="font-medium text-slate-700">{item.name}</p>
      <p className="text-slate-900 font-semibold">{formatCurrency(item.value, currency)}</p>
      <p className="text-slate-400">{formatPercent(item.payload.percentage)}</p>
    </div>
  );
}

export function CategoryBreakdown() {
  const { activeMonth } = useUiStore();
  const { user } = useUser();
  const currency = user?.currency ?? 'USD';

  const { data: res, isLoading } = useCategoryBreakdown(activeMonth, 'expense');
  const breakdown = res?.data ?? [];

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  const visible    = breakdown.slice(0, VISIBLE_LIMIT);
  const othersTotal = breakdown.slice(VISIBLE_LIMIT).reduce((s, b) => s + b.total, 0);

  const chartData = [
    ...visible.map(b => ({
      name:       b.category,
      value:      b.total,
      color:      b.color,
      percentage: b.percentage,
      icon:       b.icon,
    })),
    ...(othersTotal > 0
      ? [{ name: 'Others', value: othersTotal, color: '#CBD5E1', percentage: 0, icon: '📦' }]
      : []),
  ];

  return (
    <div className="card p-5 bg-white border border-slate-100 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-base font-semibold text-slate-800">Spending by Category</p>
        <Link
          href="/transactions"
          className="text-xs text-primary-600 hover:underline flex items-center gap-0.5"
        >
          All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {breakdown.length === 0 ? (
        <EmptyState
          icon={PieIcon}
          title="No expenses yet"
          message="Add transactions to see category breakdown."
        />
      ) : (
        <div className="flex gap-4 items-center">
          {/* Donut chart */}
          <div className="flex-shrink-0 w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={56}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip currency={currency} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend list */}
          <ul className="flex-1 space-y-2 min-w-0">
            {chartData.map(item => (
              <li key={item.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-slate-600 truncate">
                    {item.icon} {item.name}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-800 flex-shrink-0">
                  {formatCurrency(item.value, currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

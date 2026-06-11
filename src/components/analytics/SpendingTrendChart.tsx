'use client';

import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { useMultiMonthSummary } from '@/features/analytics/hooks';
import { formatCurrency }       from '@/lib/formatters';
import { Skeleton }             from '@/components/shared/LoadingSkeleton';
import { useUser }              from '@/hooks/useUser';
import type { MonthSummary }    from '@/features/analytics/types';

interface TooltipProps {
  active?:  boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?:   string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-dropdown min-w-[140px]">
      <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="amount font-medium">${p.value.toFixed(0)}</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  months: number;
}

export function SpendingTrendChart({ months }: Props) {
  const { user }              = useUser();
  const currency              = user?.currency ?? 'USD';
  const { data, isLoading }   = useMultiMonthSummary(months);
  const summaries             = (data?.data ?? []) as MonthSummary[];

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const chartData = summaries.map(m => ({
    name:     m.label.split(' ')[0], // short month name
    Income:   m.income,
    Expenses: m.expenses,
    Savings:  m.savings,
  }));

  return (
    <div className="card p-5">
      <p className="section-title text-base mb-4">Income vs Expenses</p>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
          <Bar dataKey="Income"   fill="#22C55E" radius={[3,3,0,0]} maxBarSize={32} opacity={0.9} />
          <Bar dataKey="Expenses" fill="#EF4444" radius={[3,3,0,0]} maxBarSize={32} opacity={0.9} />
          <Line
            type="monotone"
            dataKey="Savings"
            stroke="#2563EB"
            strokeWidth={2}
            dot={{ r: 3, fill: '#2563EB' }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

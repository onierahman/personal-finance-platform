'use client';

import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { useMultiMonthSummary } from '@/features/analytics/hooks';
import { Skeleton }             from '@/components/shared/LoadingSkeleton';
import type { MonthSummary }    from '@/features/analytics/types';

interface TooltipProps {
  active?:  boolean;
  payload?: Array<{ value: number }>;
  label?:   string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const rate = payload[0].value;
  return (
    <div className="card px-3 py-2 text-xs shadow-dropdown">
      <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</p>
      <p className="text-blue-600 font-medium">{rate.toFixed(1)}% savings rate</p>
    </div>
  );
}

interface Props { months: number }

export function SavingsRateChart({ months }: Props) {
  const { data, isLoading } = useMultiMonthSummary(months);
  const summaries = (data?.data ?? []) as MonthSummary[];

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const chartData = summaries.map(m => ({
    name: m.label.split(' ')[0],
    rate: Number((m.savingsRate * 100).toFixed(1)),
  }));

  const avgRate = chartData.length
    ? chartData.reduce((s, d) => s + d.rate, 0) / chartData.length
    : 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="section-title text-base">Savings Rate</p>
        <span className="text-sm font-medium text-blue-600">
          Avg: {avgRate.toFixed(1)}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            tickFormatter={v => `${v}%`}
            axisLine={false}
            tickLine={false}
            domain={[0, 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={20} stroke="#F59E0B" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '20% goal', position: 'right', fontSize: 10, fill: '#F59E0B' }} />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="#2563EB"
            strokeWidth={2}
            fill="url(#savingsGrad)"
            dot={{ r: 3, fill: '#2563EB' }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

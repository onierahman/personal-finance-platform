'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, ReferenceLine,
} from 'recharts';
import { useMultiMonthSummary } from '@/features/analytics/hooks';
import { Skeleton }             from '@/components/shared/LoadingSkeleton';
import type { MonthSummary }    from '@/features/analytics/types';

interface TooltipProps {
  active?:  boolean;
  payload?: Array<{ value: number; payload: { name: string; net: number } }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const net = payload[0].payload.net;
  return (
    <div className="card px-3 py-2 text-xs shadow-dropdown">
      <p className="font-semibold text-slate-700 mb-1">{payload[0].payload.name}</p>
      <p className={net >= 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
        {net >= 0 ? '+' : ''}${net.toFixed(2)} net
      </p>
    </div>
  );
}

interface Props { months: number }

export function CashFlowChart({ months }: Props) {
  const { data, isLoading } = useMultiMonthSummary(months);
  const summaries = (data?.data ?? []) as MonthSummary[];

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const chartData = summaries.map(m => ({
    name: m.label.split(' ')[0],
    net:  m.netCashFlow,
  }));

  const positiveMonths = chartData.filter(d => d.net >= 0).length;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="section-title text-base">Net Cash Flow</p>
        <span className="text-xs text-slate-500">
          {positiveMonths}/{chartData.length} months positive
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 0, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v >= -1000 ? v : (v/1000).toFixed(0)+'k'}`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#E2E8F0" strokeWidth={2} />
          <Bar dataKey="net" maxBarSize={36} radius={[3,3,0,0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.net >= 0 ? '#22C55E' : '#EF4444'} opacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

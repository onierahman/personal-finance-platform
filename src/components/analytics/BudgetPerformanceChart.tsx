'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { useBudgetPerformance }  from '@/features/analytics/hooks';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { getBudgetHealth }       from '@/lib/constants';
import { Skeleton }              from '@/components/shared/LoadingSkeleton';
import { useUser }               from '@/hooks/useUser';
import type { BudgetPerformance } from '@/features/analytics/types';

const HEALTH_COLORS = {
  safe:    '#22C55E',
  warning: '#F59E0B',
  danger:  '#EF4444',
  over:    '#DC2626',
};

interface Props { months: number }

export function BudgetPerformanceChart({ months }: Props) {
  const { user }              = useUser();
  const currency              = user?.currency ?? 'USD';
  const { data, isLoading }   = useBudgetPerformance(months);
  const performances          = (data?.data ?? []) as BudgetPerformance[];

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!performances.length) return (
    <div className="card p-5 flex items-center justify-center h-48">
      <p className="text-slate-400 text-sm">No budget data available</p>
    </div>
  );

  return (
    <div className="card p-5">
      <p className="section-title text-base mb-4">Budget Performance</p>
      <div className="space-y-5">
        {performances.map(bp => (
          <BudgetRow key={bp.category} bp={bp} currency={currency} months={months} />
        ))}
      </div>
    </div>
  );
}

function BudgetRow({ bp, currency, months }: { bp: BudgetPerformance; currency: string; months: number }) {
  const avgHealth = getBudgetHealth(bp.avgUsage);
  const avgColor  = HEALTH_COLORS[avgHealth];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{bp.icon}</span>
          <span className="text-sm font-medium text-slate-700">{bp.category}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">avg usage</span>
          <span className="text-sm font-semibold amount" style={{ color: avgColor }}>
            {formatPercent(bp.avgUsage)}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={60}>
        <BarChart
          data={bp.months.map(m => ({ name: m.label.split(' ')[0], usage: Math.min(m.usageRatio * 100, 150) }))}
          margin={{ top: 0, right: 0, left: -30, bottom: 0 }}
        >
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis hide domain={[0, 150]} />
          <Tooltip
            formatter={(v: number) => [`${v.toFixed(0)}%`, 'Usage']}
            contentStyle={{ fontSize: 11, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,.1)' }}
          />
          <Bar dataKey="usage" maxBarSize={28} radius={[2,2,0,0]}>
            {bp.months.map((m, i) => (
              <Cell key={i} fill={HEALTH_COLORS[getBudgetHealth(m.usageRatio)]} opacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { useCategoryTrends }    from '@/features/analytics/hooks';
import { formatCurrency }       from '@/lib/formatters';
import { Skeleton }             from '@/components/shared/LoadingSkeleton';
import { useUser }              from '@/hooks/useUser';
import type { CategoryTrend }   from '@/features/analytics/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  months: number;
  type:   'expense' | 'income';
}

export function CategoryTrendsChart({ months, type }: Props) {
  const { user }              = useUser();
  const currency              = user?.currency ?? 'USD';
  const { data, isLoading }   = useCategoryTrends(months, type);
  const trends                = (data?.data ?? []) as CategoryTrend[];
  const [selected, setSelected] = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!trends.length) return (
    <div className="card p-5 flex items-center justify-center h-48">
      <p className="text-slate-400 text-sm">No {type} data for this period</p>
    </div>
  );

  const top8 = trends.slice(0, 8);
  const selectedTrend = selected ? trends.find(t => t.category === selected) : trends[0];

  return (
    <div className="card p-5">
      <p className="section-title text-base mb-4">
        {type === 'expense' ? 'Spending' : 'Income'} by Category
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: ranked bar list */}
        <div className="space-y-2">
          {top8.map(t => (
            <button
              key={t.category}
              onClick={() => setSelected(t.category === selected ? null : t.category)}
              className={`w-full text-left rounded-lg px-3 py-2 transition-colors ${
                (selected ?? trends[0].category) === t.category
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{t.icon}</span>
                  <span className="text-xs font-medium text-slate-700">{t.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs amount font-medium text-slate-900">
                    {formatCurrency(t.total, currency)}
                  </span>
                  <TrendBadge change={t.change} />
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (t.total / top8[0].total) * 100)}%`,
                    background: t.color,
                  }}
                />
              </div>
            </button>
          ))}
        </div>

        {/* Right: monthly trend for selected category */}
        {selectedTrend && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-3">
              {selectedTrend.icon} {selectedTrend.category} — monthly trend
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={selectedTrend.months.map(m => ({ name: m.label.split(' ')[0], amount: m.amount }))}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v, currency), selectedTrend.category]}
                  contentStyle={{ fontSize: 11, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,.1)' }}
                />
                <Bar dataKey="amount" radius={[3,3,0,0]} maxBarSize={32}>
                  {selectedTrend.months.map((_, i) => (
                    <Cell key={i} fill={selectedTrend.color} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function TrendBadge({ change }: { change: number }) {
  if (Math.abs(change) < 0.03) {
    return <Minus className="w-3 h-3 text-slate-400" />;
  }
  if (change > 0) {
    return (
      <span className="flex items-center text-[10px] text-red-500 font-medium">
        <TrendingUp className="w-3 h-3 mr-0.5" />{(change * 100).toFixed(0)}%
      </span>
    );
  }
  return (
    <span className="flex items-center text-[10px] text-green-500 font-medium">
      <TrendingDown className="w-3 h-3 mr-0.5" />{Math.abs(change * 100).toFixed(0)}%
    </span>
  );
}

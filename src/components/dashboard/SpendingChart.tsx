'use client';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useAllTransactions } from '@/features/transactions/hooks';
import { useUiStore }         from '@/stores/uiStore';
import { formatDateShort, formatCurrency, monthStart, monthEnd, toLocalIsoDate } from '@/lib/formatters';
import { Skeleton }           from '@/components/shared/LoadingSkeleton';
import { useUser }            from '@/hooks/useUser';
import { cn }                 from '@/lib/utils';

function buildDailyData(
  transactions: Array<{ date: string; amount: number; type: string }>,
  month: string,
) {
  const start  = new Date(monthStart(month) + 'T00:00:00');
  const end    = new Date(monthEnd(month)   + 'T00:00:00');
  const days: Array<{ date: string; expenses: number; income: number }> = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = toLocalIsoDate(d);
    const dayTxns = transactions.filter(t => t.date === iso);
    days.push({
      date:     iso,
      expenses: dayTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      income:   dayTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    });
  }
  return days;
}

interface TooltipProps {
  active?:  boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?:   string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-dropdown">
      <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">{label ? formatDateShort(label) : ''}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="amount font-medium">${p.value.toFixed(2)}</span>
        </p>
      ))}
    </div>
  );
}

export function SpendingChart() {
  const { activeMonth, theme } = useUiStore();
  const isDark = theme === 'dark';
  const { user }        = useUser();
  const currency        = user?.currency ?? 'USD';

  const { data, isLoading } = useAllTransactions({ month: activeMonth });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const txns   = data?.data ?? [];
  const daily  = buildDailyData(txns, activeMonth);
  const maxVal = Math.max(...daily.map(d => Math.max(d.expenses, d.income)), 1);

  return (
    <div className="card p-5">
      <p className="section-title text-base mb-4">Daily Overview</p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={daily} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#F1F5F9'} />
          <XAxis
            dataKey="date"
            tickFormatter={d => formatDateShort(d)}
            tick={{ fontSize: 11, fill: isDark ? '#64748b' : '#94A3B8' }}
            interval="preserveStartEnd"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, maxVal * 1.2]}
            tick={{ fontSize: 11, fill: isDark ? '#64748b' : '#94A3B8' }}
            tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="expenses" name="Expenses"
            stroke="#EF4444" strokeWidth={1.5}
            fill="url(#expGrad)" dot={false} />
          <Area type="monotone" dataKey="income" name="Income"
            stroke="#22C55E" strokeWidth={1.5}
            fill="url(#incGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex gap-4 mt-3">
        {[
          { label: 'Expenses', color: '#EF4444' },
          { label: 'Income',   color: '#22C55E' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
            <span className="text-xs text-slate-500 dark:text-slate-400">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

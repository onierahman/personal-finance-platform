'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { formatCurrency, formatDate, toLocalIsoDate } from '@/lib/formatters';

type AnyClient = any;

/** Daily expense totals for the trailing `months` window. */
async function fetchDailySpend(months: number): Promise<Record<string, number>> {
  const supabase = getSupabaseBrowserClient() as AnyClient;
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  since.setDate(1);

  const { data } = await supabase
    .from('transactions')
    .select('date, amount, type')
    .eq('is_deleted', false)
    .eq('type', 'expense')
    .gte('date', toLocalIsoDate(since));

  const totals: Record<string, number> = {};
  for (const r of (data ?? []) as { date: string; amount: number }[]) {
    totals[r.date] = (totals[r.date] ?? 0) + Number(r.amount);
  }
  return totals;
}

const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const INTENSITY = [
  'bg-slate-100 dark:bg-slate-800',
  'bg-primary-100 dark:bg-primary-900/40',
  'bg-primary-300 dark:bg-primary-700/70',
  'bg-primary-500 dark:bg-primary-600',
  'bg-primary-700 dark:bg-primary-500',
];

/**
 * GitHub-style calendar heatmap of daily spending. Columns are weeks, rows are
 * weekdays (Sun→Sat). Intensity scales with spend relative to the busiest day.
 */
export function SpendingHeatmap({ months }: { months: number }) {
  const { user } = useUser();
  const currency = user?.currency ?? 'USD';
  const [hover, setHover] = useState<{ date: string; amount: number } | null>(null);

  const { data: totals = {}, isLoading } = useQuery({
    queryKey: ['heatmap', months],
    queryFn: () => fetchDailySpend(months),
    staleTime: 60_000,
  });

  const { weeks, max, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setMonth(start.getMonth() - months);
    start.setDate(1);
    // Align grid start to the Sunday on/before `start`.
    start.setDate(start.getDate() - start.getDay());

    const days: { date: string; amount: number }[] = [];
    const cursor = new Date(start);
    while (cursor <= today) {
      const key = toLocalIsoDate(cursor);
      days.push({ date: key, amount: totals[key] ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Chunk into weeks of 7 (columns).
    const weeks: { date: string; amount: number }[][] = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

    const max = days.reduce((m, d) => Math.max(m, d.amount), 0);

    // Month labels above the first week-column that belongs to each month.
    const monthLabels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, col) => {
      const first = week[0];
      if (!first) return;
      const mo = new Date(first.date + 'T00:00:00').getMonth();
      if (mo !== lastMonth) {
        monthLabels.push({ col, label: new Date(first.date + 'T00:00:00').toLocaleString('en-US', { month: 'short' }) });
        lastMonth = mo;
      }
    });

    return { weeks, max, monthLabels };
  }, [totals, months]);

  const intensityFor = (amount: number): number => {
    if (amount <= 0 || max <= 0) return 0;
    const ratio = amount / max;
    if (ratio > 0.66) return 4;
    if (ratio > 0.4) return 3;
    if (ratio > 0.15) return 2;
    return 1;
  };

  return (
    <div className="card p-5">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-slate-800 dark:text-slate-100">Spending calendar</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Daily expense intensity over the last {months} months</p>
        </div>
        {hover && (
          <div className="text-right">
            <p className="amount text-sm font-semibold text-slate-800 dark:text-slate-200">
              {formatCurrency(hover.amount, currency)}
            </p>
            <p className="text-xs text-slate-400">{formatDate(hover.date)}</p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="mt-4 h-28 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      ) : (
        <div className="mt-4 overflow-x-auto pb-1 scrollbar-hide">
          <div className="inline-flex flex-col gap-1.5">
            {/* Month labels */}
            <div className="flex gap-[3px] pl-8 text-[10px] text-slate-400">
              {weeks.map((_, col) => {
                const lbl = monthLabels.find((m) => m.col === col);
                return (
                  <span key={col} className="w-3 shrink-0 text-left">
                    {lbl ? lbl.label : ''}
                  </span>
                );
              })}
            </div>

            {/* Grid: rows = weekday, cols = week */}
            <div className="flex">
              {/* Weekday gutter */}
              <div className="mr-1 flex w-7 flex-col gap-[3px]">
                {WEEKDAY_LABELS.map((d, i) => (
                  <span key={i} className="h-3 text-[9px] leading-3 text-slate-400">{d}</span>
                ))}
              </div>

              <div className="flex gap-[3px]">
                {weeks.map((week, col) => (
                  <div key={col} className="flex flex-col gap-[3px]">
                    {Array.from({ length: 7 }).map((_, row) => {
                      const cell = week[row];
                      if (!cell) return <span key={row} className="h-3 w-3" />;
                      return (
                        <button
                          key={row}
                          type="button"
                          onMouseEnter={() => setHover(cell)}
                          onMouseLeave={() => setHover(null)}
                          onFocus={() => setHover(cell)}
                          className={`h-3 w-3 rounded-[2px] transition-transform hover:scale-125 ${INTENSITY[intensityFor(cell.amount)]}`}
                          aria-label={`${formatDate(cell.date)}: ${formatCurrency(cell.amount, currency)}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-1.5 pt-1 text-[10px] text-slate-400">
              <span>Less</span>
              {INTENSITY.map((c, i) => (
                <span key={i} className={`h-3 w-3 rounded-[2px] ${c}`} />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

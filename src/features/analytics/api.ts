import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getCategoryMeta }         from '@/lib/constants';
import { formatMonth }             from '@/lib/formatters';
import type { ApiResponse }        from '@/types';
import type {
  MonthSummary,
  CategoryTrend,
  BudgetPerformance,
  MerchantSummary,
} from './types';

// Build the list of YYYY-MM strings for the last N months (most recent last)
function getMonthRange(months: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(d.toISOString().slice(0, 7));
  }
  return result;
}

function monthStart(ym: string) { return `${ym}-01`; }
function monthEnd(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).toISOString().split('T')[0];
}

export async function fetchMultiMonthSummary(
  months = 6,
): Promise<ApiResponse<MonthSummary[]>> {
   
  const supabase = getSupabaseBrowserClient() as any;
  const range    = getMonthRange(months);
  const from     = monthStart(range[0]);
  const to       = monthEnd(range[range.length - 1]);

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type, date')
    .eq('is_deleted', false)
    .gte('date', from)
    .lte('date', to);

  if (error) return { data: null, error: error.message };

  const rows = (data ?? []) as { amount: number; type: string; date: string }[];

  const summaries: MonthSummary[] = range.map(ym => {
    const monthRows = rows.filter(r => r.date.startsWith(ym));
    const income    = monthRows.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0);
    const expenses  = monthRows.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0);
    const savings   = Math.max(0, income - expenses);
    return {
      month:            ym,
      label:            formatMonth(ym),
      income,
      expenses,
      savings,
      savingsRate:      income > 0 ? savings / income : 0,
      netCashFlow:      income - expenses,
      transactionCount: monthRows.length,
    };
  });

  return { data: summaries, error: null };
}

export async function fetchCategoryTrends(
  months = 6,
  type: 'expense' | 'income' = 'expense',
): Promise<ApiResponse<CategoryTrend[]>> {
   
  const supabase = getSupabaseBrowserClient() as any;
  const range    = getMonthRange(months);
  const from     = monthStart(range[0]);
  const to       = monthEnd(range[range.length - 1]);

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, category, date')
    .eq('is_deleted', false)
    .eq('type', type)
    .gte('date', from)
    .lte('date', to);

  if (error) return { data: null, error: error.message };

  const rows = (data ?? []) as { amount: number; category: string; date: string }[];

  // Aggregate by category
  const catMap = new Map<string, Map<string, number>>();
  rows.forEach(r => {
    if (!catMap.has(r.category)) catMap.set(r.category, new Map());
    const monthMap = catMap.get(r.category)!;
    monthMap.set(r.date.slice(0, 7), (monthMap.get(r.date.slice(0, 7)) ?? 0) + Number(r.amount));
  });

  const trends: CategoryTrend[] = Array.from(catMap.entries()).map(([cat, monthMap]) => {
    const meta = getCategoryMeta(cat);
    const monthPoints = range.map(ym => ({
      month:  ym,
      label:  formatMonth(ym),
      amount: monthMap.get(ym) ?? 0,
    }));
    const total      = monthPoints.reduce((s, p) => s + p.amount, 0);
    const avgMonthly = total / months;

    // % change: compare first half vs second half
    const half   = Math.floor(months / 2);
    const first  = monthPoints.slice(0, half).reduce((s, p) => s + p.amount, 0);
    const second = monthPoints.slice(half).reduce((s, p) => s + p.amount, 0);
    const change = first > 0 ? ((second - first) / first) : 0;

    return {
      category:   cat,
      icon:       meta.icon,
      color:      meta.color,
      total,
      months:     monthPoints,
      avgMonthly,
      change,
    };
  }).sort((a, b) => b.total - a.total);

  return { data: trends, error: null };
}

export async function fetchBudgetPerformance(
  months = 6,
): Promise<ApiResponse<BudgetPerformance[]>> {
   
  const supabase = getSupabaseBrowserClient() as any;
  const range    = getMonthRange(months);
  const from     = monthStart(range[0]);
  const to       = monthEnd(range[range.length - 1]);

  // Fetch all relevant transactions
  const { data: txData, error: txErr } = await supabase
    .from('transactions')
    .select('amount, category, date')
    .eq('is_deleted', false)
    .eq('type', 'expense')
    .gte('date', from)
    .lte('date', to);

  if (txErr) return { data: null, error: txErr.message };

  // Fetch current budgets for limit amounts
  const { data: budgetData, error: budgetErr } = await supabase
    .from('budgets')
    .select('category, limit_amount');

  if (budgetErr) return { data: null, error: budgetErr.message };

  const budgets = (budgetData ?? []) as { category: string; limit_amount: number }[];
  const txRows  = (txData ?? []) as { amount: number; category: string; date: string }[];

  // Only show categories that have budgets
  const performances: BudgetPerformance[] = budgets.map(budget => {
    const meta = getCategoryMeta(budget.category);
    const monthPerfs = range.map(ym => {
      const monthSpent = txRows
        .filter(r => r.category === budget.category && r.date.startsWith(ym))
        .reduce((s, r) => s + Number(r.amount), 0);
      return {
        month:       ym,
        label:       formatMonth(ym),
        category:    budget.category,
        limitAmount: budget.limit_amount,
        spentAmount: monthSpent,
        usageRatio:  budget.limit_amount > 0 ? monthSpent / budget.limit_amount : 0,
      };
    });

    const avgUsage = monthPerfs.reduce((s, m) => s + m.usageRatio, 0) / months;

    return {
      category: budget.category,
      icon:     meta.icon,
      color:    meta.color,
      avgUsage,
      months:   monthPerfs,
    };
  }).sort((a, b) => b.avgUsage - a.avgUsage);

  return { data: performances, error: null };
}

export async function fetchTopMerchants(
  months = 1,
  limit  = 10,
): Promise<ApiResponse<MerchantSummary[]>> {
   
  const supabase = getSupabaseBrowserClient() as any;
  const range    = getMonthRange(months);
  const from     = monthStart(range[0]);
  const to       = monthEnd(range[range.length - 1]);

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, merchant, category')
    .eq('is_deleted', false)
    .eq('type', 'expense')
    .not('merchant', 'is', null)
    .gte('date', from)
    .lte('date', to);

  if (error) return { data: null, error: error.message };

  const rows = (data ?? []) as { amount: number; merchant: string; category: string }[];

  const map = new Map<string, { total: number; count: number; category: string }>();
  rows.forEach(r => {
    const key = r.merchant;
    const existing = map.get(key) ?? { total: 0, count: 0, category: r.category };
    map.set(key, { total: existing.total + Number(r.amount), count: existing.count + 1, category: r.category });
  });

  const merchants: MerchantSummary[] = Array.from(map.entries())
    .map(([merchant, { total, count, category }]) => {
      const meta = getCategoryMeta(category);
      return {
        merchant,
        total,
        count,
        category,
        categoryIcon:  meta.icon,
        categoryColor: meta.color,
        avgAmount:     total / count,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  return { data: merchants, error: null };
}

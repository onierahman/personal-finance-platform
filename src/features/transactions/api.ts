import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getCategoryMeta } from '@/lib/constants';
import { monthStart, monthEnd, currentYearMonth } from '@/lib/formatters';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type { Transaction, ApiResponse, MonthlySummary } from '@/types';
import type { TransactionFilters, MonthlyCategoryBreakdown } from './types';
import type { InsertTransaction, UpdateTransaction } from '@/types/database';

function toTransaction(row: Record<string, unknown>): Transaction {
  return {
    id:          row.id as string,
    accountId:   row.account_id as string,
    recurringId: row.recurring_id as string | null,
    amount:      Number(row.amount),
    type:        row.type as Transaction['type'],
    category:    row.category as string,
    subcategory: row.subcategory as string | null,
    merchant:    row.merchant as string | null,
    date:        row.date as string,
    note:        row.note as string | null,
    receiptUrl:  row.receipt_url as string | null,
    isDeleted:   Boolean(row.is_deleted),
    createdAt:   row.created_at as string,
    accountName: (row.accounts as Record<string, unknown>)?.name as string | undefined,
    categoryMeta: getCategoryMeta(row.category as string),
  };
}

export async function fetchTransactions(
  filters: TransactionFilters = {},
): Promise<ApiResponse<Transaction[]>> {
  const supabase = getSupabaseBrowserClient();
  const {
    month = currentYearMonth(),
    type,
    category,
    accountId,
    search,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = filters;

  let query = supabase
    .from('transactions')
    .select('*, accounts(name)', { count: 'exact' })
    .eq('is_deleted', false)
    .gte('date', monthStart(month))
    .lte('date', monthEnd(month))
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (type)      query = query.eq('type', type);
  if (category)  query = query.eq('category', category);
  if (accountId) query = query.eq('account_id', accountId);
  if (search)    query = query.ilike('merchant', `%${search}%`);

  const { data, error, count } = await query;

  if (error) return { data: null, error: error.message };

  return {
    data: (data ?? []).map(toTransaction),
    error: null,
    meta: { page, total: count ?? 0, pageSize },
  };
}

export async function fetchAllTransactions(
  filters: Omit<TransactionFilters, 'page' | 'pageSize'> = {},
): Promise<ApiResponse<Transaction[]>> {
  const supabase = getSupabaseBrowserClient();
  const { month = currentYearMonth(), type, category, accountId } = filters;

  let query = supabase
    .from('transactions')
    .select('*, accounts(name)')
    .eq('is_deleted', false)
    .gte('date', monthStart(month))
    .lte('date', monthEnd(month))
    .order('date', { ascending: false });

  if (type)      query = query.eq('type', type);
  if (category)  query = query.eq('category', category);
  if (accountId) query = query.eq('account_id', accountId);

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: (data ?? []).map(toTransaction), error: null };
}

export async function createTransaction(
  payload: InsertTransaction,
): Promise<ApiResponse<Transaction>> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('transactions')
    .insert(payload)
    .select('*, accounts(name)')
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toTransaction(data as Record<string, unknown>), error: null };
}

export async function updateTransaction(
  id: string,
  payload: UpdateTransaction,
): Promise<ApiResponse<Transaction>> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('transactions')
    .update(payload)
    .eq('id', id)
    .select('*, accounts(name)')
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toTransaction(data as Record<string, unknown>), error: null };
}

export async function softDeleteTransaction(
  id: string,
): Promise<ApiResponse<null>> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase
    .from('transactions')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}

/** Dashboard hot-path: monthly income/expense totals */
export async function fetchMonthlySummary(
  month: string = currentYearMonth(),
): Promise<ApiResponse<MonthlySummary>> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type, category')
    .eq('is_deleted', false)
    .gte('date', monthStart(month))
    .lte('date', monthEnd(month));

  if (error) return { data: null, error: error.message };

  const rows = data ?? [];
  const income   = rows.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0);
  const expenses = rows.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0);

  // Investments: expense-type rows categorised as "Investments" (user manually
  // logged an investment transfer). Phase 3 will replace this with the dedicated
  // investments table once that module is built.
  const investments = rows
    .filter(r => r.type === 'expense' && r.category === 'Investments')
    .reduce((s, r) => s + Number(r.amount), 0);

  // savings = income minus ALL expenses including investments, floored at 0
  const savings = Math.max(0, income - expenses);

  // remaining = cash left after non-investment expenses (spendable headroom)
  const nonInvestExpenses = expenses - investments;
  const remaining = Math.max(0, income - nonInvestExpenses);

  const savingsRate = income > 0 ? savings / income : 0;

  return {
    data: { income, expenses, savings, investments, remaining, savingsRate, month },
    error: null,
  };
}

export async function fetchCategoryBreakdown(
  month: string = currentYearMonth(),
  type: 'expense' | 'income' = 'expense',
): Promise<ApiResponse<MonthlyCategoryBreakdown[]>> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('transactions')
    .select('category, amount')
    .eq('is_deleted', false)
    .eq('type', type)
    .gte('date', monthStart(month))
    .lte('date', monthEnd(month));

  if (error) return { data: null, error: error.message };

  const rows = data ?? [];
  const total = rows.reduce((s, r) => s + Number(r.amount), 0);

  const map = new Map<string, { total: number; count: number }>();
  rows.forEach(r => {
    const existing = map.get(r.category) ?? { total: 0, count: 0 };
    map.set(r.category, { total: existing.total + Number(r.amount), count: existing.count + 1 });
  });

  const breakdown: MonthlyCategoryBreakdown[] = Array.from(map.entries())
    .map(([category, { total: catTotal, count }]) => {
      const meta = getCategoryMeta(category);
      return {
        category,
        total: catTotal,
        count,
        icon: meta.icon,
        color: meta.color,
        percentage: total > 0 ? catTotal / total : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  return { data: breakdown, error: null };
}
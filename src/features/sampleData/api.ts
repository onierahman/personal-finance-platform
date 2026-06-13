// ============================================================
// Sample data — seed a realistic, fully-flagged demo dataset so
// new users can explore the app with charts full of life, then
// wipe it with one tap. Every row carries is_sample = true and
// every sample transaction belongs to a sample account, so the
// wipe never touches real records.
// ============================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subDays, addDays, startOfMonth, subMonths } from 'date-fns';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ApiResponse } from '@/types';

type AnyClient = any;

// Deterministic PRNG so the demo numbers look organic but seed the
// same shape every time (no surprising outliers between users).
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface TxnSeed {
  amount: number;
  type: 'expense' | 'income';
  category: string;
  merchant: string | null;
  date: string; // yyyy-MM-dd
  note: string | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** ~3 months of believable activity for the demo dataset. */
function buildTransactions(today: Date): TxnSeed[] {
  const rand = mulberry32(20260612);
  const txns: TxnSeed[] = [];
  const between = (min: number, max: number) => round2(min + rand() * (max - min));
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

  const start = subDays(today, 92);

  // Monthly anchors: salary, rent, utilities, phone — on fixed days.
  for (let m = 0; m < 4; m++) {
    const monthStart = startOfMonth(subMonths(today, m));
    if (monthStart < start) continue;

    const onDay = (day: number) => format(addDays(monthStart, day - 1), 'yyyy-MM-dd');

    if (addDays(monthStart, 0) <= today) {
      txns.push({ amount: 5200, type: 'income', category: 'Salary', merchant: 'Northwind Labs', date: onDay(1), note: 'Monthly salary' });
      txns.push({ amount: 1850, type: 'expense', category: 'Housing', merchant: 'Lakeview Properties', date: onDay(1), note: 'Rent' });
    }
    if (addDays(monthStart, 4) <= today) {
      txns.push({ amount: between(95, 140), type: 'expense', category: 'Utilities', merchant: 'City Hydro', date: onDay(5), note: null });
    }
    if (addDays(monthStart, 7) <= today) {
      txns.push({ amount: 64.5, type: 'expense', category: 'Subscriptions', merchant: 'Bell Mobility', date: onDay(8), note: 'Phone plan' });
    }
    if (addDays(monthStart, 11) <= today) {
      txns.push({ amount: 16.49, type: 'expense', category: 'Subscriptions', merchant: 'Netflix', date: onDay(12), note: null });
      txns.push({ amount: 10.99, type: 'expense', category: 'Subscriptions', merchant: 'Spotify', date: onDay(12), note: null });
    }
    if (addDays(monthStart, 14) <= today) {
      txns.push({ amount: 45, type: 'expense', category: 'Fitness', merchant: 'Pulse Gym', date: onDay(15), note: 'Membership' });
      txns.push({ amount: between(280, 420), type: 'income', category: 'Freelance', merchant: 'Design client', date: onDay(15), note: null });
    }
  }

  // Weekly-ish variable spending across the window.
  const groceryStores = ['Fresh Market', 'Maple Leaf Grocers', 'Green Basket'] as const;
  const restaurants = ['Noodle House', 'La Trattoria', 'Burger Collective', 'Sakura Sushi', 'Corner Café'] as const;
  const shops = ['Uniqlo', 'Indigo Books', 'MEC', 'Best Buy'] as const;

  for (let d = 0; d <= 92; d++) {
    const day = addDays(start, d);
    if (day > today) break;
    const date = format(day, 'yyyy-MM-dd');
    const dow = day.getDay();

    // Groceries ~twice a week
    if (dow === 1 || dow === 5) {
      txns.push({ amount: between(38, 115), type: 'expense', category: 'Groceries', merchant: pick(groceryStores), date, note: null });
    }
    // Dining 2–3× a week
    if (dow === 3 || dow === 6 || (dow === 0 && rand() > 0.5)) {
      txns.push({ amount: between(14, 68), type: 'expense', category: 'Dining', merchant: pick(restaurants), date, note: null });
    }
    // Transit most weekdays
    if (dow >= 1 && dow <= 5 && rand() > 0.35) {
      txns.push({ amount: 3.35, type: 'expense', category: 'Transportation', merchant: 'Metro Transit', date, note: null });
    }
    // Occasional coffee
    if (rand() > 0.6) {
      txns.push({ amount: between(4.5, 7.25), type: 'expense', category: 'Dining', merchant: 'Corner Café', date, note: null });
    }
    // Shopping every ~10 days
    if (d % 10 === 6) {
      txns.push({ amount: between(35, 160), type: 'expense', category: 'Shopping', merchant: pick(shops), date, note: null });
    }
    // Entertainment every ~12 days
    if (d % 12 === 9) {
      txns.push({ amount: between(18, 55), type: 'expense', category: 'Entertainment', merchant: 'Cineplex', date, note: null });
    }
  }

  return txns;
}

/** True if the user currently has sample records. */
export async function fetchHasSampleData(): Promise<ApiResponse<boolean>> {
  const supabase = getSupabaseBrowserClient() as AnyClient;
  const { data, error } = await supabase
    .from('accounts')
    .select('id')
    .eq('is_sample', true)
    .limit(1);
  if (error) return { data: null, error: error.message };
  return { data: (data ?? []).length > 0, error: null };
}

export async function seedSampleData(): Promise<ApiResponse<null>> {
  const supabase = getSupabaseBrowserClient() as AnyClient;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { data: null, error: 'Not authenticated' };
  const userId = session.user.id;

  // Refuse to double-seed.
  const existing = await fetchHasSampleData();
  if (existing.error) return { data: null, error: existing.error };
  if (existing.data) return { data: null, error: 'Sample data is already loaded.' };

  const today = new Date();
  const sample = { is_sample: true };

  // 1) Accounts (balances are starting balances; transaction triggers
  //    keep them in sync as the history below is inserted).
  const { data: accounts, error: accErr } = await supabase
    .from('accounts')
    .insert([
      { user_id: userId, name: 'Everyday Chequing', type: 'checking', balance: 4200, currency: 'USD', color: '#2563EB', icon: 'landmark', is_active: true, ...sample },
      { user_id: userId, name: 'High-Interest Savings', type: 'savings', balance: 12500, currency: 'USD', color: '#22C55E', icon: 'piggy-bank', is_active: true, ...sample },
      { user_id: userId, name: 'Travel Rewards Card', type: 'credit_card', balance: -480, currency: 'USD', color: '#F59E0B', icon: 'credit-card', is_active: true, ...sample },
    ])
    .select();
  if (accErr) return { data: null, error: accErr.message };

  const chequing = accounts.find((a: { name: string }) => a.name === 'Everyday Chequing');
  const card = accounts.find((a: { name: string }) => a.name === 'Travel Rewards Card');

  // 2) Transactions — salary/rent/bills land in chequing; everyday
  //    card-sized spending lands on the credit card.
  const txns = buildTransactions(today).map((t) => ({
    account_id:
      t.type === 'income' || ['Housing', 'Utilities'].includes(t.category)
        ? chequing.id
        : card.id,
    amount: t.amount,
    type: t.type,
    category: t.category,
    subcategory: null,
    merchant: t.merchant,
    date: t.date,
    note: t.note,
    receipt_url: null,
    recurring_id: null,
    ...sample,
  }));
  const { error: txnErr } = await supabase.from('transactions').insert(txns);
  if (txnErr) return { data: null, error: txnErr.message };

  // 3) Budgets for the current month.
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const { error: budErr } = await supabase.from('budgets').insert([
    { user_id: userId, category: 'Groceries', limit_amount: 550, period: 'monthly', start_date: monthStart, ...sample },
    { user_id: userId, category: 'Dining', limit_amount: 320, period: 'monthly', start_date: monthStart, ...sample },
    { user_id: userId, category: 'Transportation', limit_amount: 160, period: 'monthly', start_date: monthStart, ...sample },
    { user_id: userId, category: 'Shopping', limit_amount: 250, period: 'monthly', start_date: monthStart, ...sample },
    { user_id: userId, category: 'Entertainment', limit_amount: 120, period: 'monthly', start_date: monthStart, ...sample },
    { user_id: userId, category: 'Subscriptions', limit_amount: 110, period: 'monthly', start_date: monthStart, ...sample },
  ]);
  if (budErr) return { data: null, error: budErr.message };

  // 4) Goals.
  const { error: goalErr } = await supabase.from('goals').insert([
    { user_id: userId, name: 'Emergency fund', description: 'Six months of essential expenses', target_amount: 10000, current_amount: 6400, deadline: format(addDays(today, 240), 'yyyy-MM-dd'), priority: 'high', status: 'active', icon: '🛟', color: '#2563EB', ...sample },
    { user_id: userId, name: 'Japan trip', description: 'Two weeks in spring', target_amount: 5000, current_amount: 1850, deadline: format(addDays(today, 300), 'yyyy-MM-dd'), priority: 'medium', status: 'active', icon: '🗾', color: '#F97316', ...sample },
  ]);
  if (goalErr) return { data: null, error: goalErr.message };

  // 5) Recurring bills & income.
  const nextMonth = format(startOfMonth(addDays(today, 32)), 'yyyy-MM-dd');
  const { error: recErr } = await supabase.from('recurring_transactions').insert([
    { account_id: chequing.id, amount: 1850, type: 'expense', category: 'Housing', merchant: 'Lakeview Properties', note: 'Rent', frequency: 'monthly', start_date: monthStart, next_due: nextMonth, end_date: null, is_active: true, ...sample },
    { account_id: chequing.id, amount: 5200, type: 'income', category: 'Salary', merchant: 'Northwind Labs', note: null, frequency: 'monthly', start_date: monthStart, next_due: nextMonth, end_date: null, is_active: true, ...sample },
    { account_id: card.id, amount: 16.49, type: 'expense', category: 'Subscriptions', merchant: 'Netflix', note: null, frequency: 'monthly', start_date: monthStart, next_due: format(addDays(today, 9), 'yyyy-MM-dd'), end_date: null, is_active: true, ...sample },
    { account_id: card.id, amount: 10.99, type: 'expense', category: 'Subscriptions', merchant: 'Spotify', note: null, frequency: 'monthly', start_date: monthStart, next_due: format(addDays(today, 9), 'yyyy-MM-dd'), end_date: null, is_active: true, ...sample },
    { account_id: card.id, amount: 45, type: 'expense', category: 'Fitness', merchant: 'Pulse Gym', note: 'Membership', frequency: 'monthly', start_date: monthStart, next_due: format(addDays(today, 14), 'yyyy-MM-dd'), end_date: null, is_active: true, ...sample },
  ]);
  if (recErr) return { data: null, error: recErr.message };

  // 6) Investments.
  const { error: invErr } = await supabase.from('investments').insert([
    { user_id: userId, asset_type: 'etf', symbol: 'VEQT', name: 'Vanguard All-Equity ETF', quantity: 120, purchase_price: 32.4, current_price: 41.18, purchase_date: format(subDays(today, 600), 'yyyy-MM-dd'), notes: null, ...sample },
    { user_id: userId, asset_type: 'stock', symbol: 'AAPL', name: 'Apple Inc.', quantity: 10, purchase_price: 168.2, current_price: 214.6, purchase_date: format(subDays(today, 420), 'yyyy-MM-dd'), notes: null, ...sample },
    { user_id: userId, asset_type: 'crypto', symbol: 'BTC', name: 'Bitcoin', quantity: 0.05, purchase_price: 38400, current_price: 66800, purchase_date: format(subDays(today, 300), 'yyyy-MM-dd'), notes: null, ...sample },
  ]);
  if (invErr) return { data: null, error: invErr.message };

  return { data: null, error: null };
}

/** Remove every sample record. Order matters: transactions reference
 *  accounts with ON DELETE RESTRICT, so they go first. */
export async function wipeSampleData(): Promise<ApiResponse<null>> {
  const supabase = getSupabaseBrowserClient() as AnyClient;

  const steps: Array<{ table: string }> = [
    { table: 'transactions' },
    { table: 'recurring_transactions' },
    { table: 'budgets' },
    { table: 'goals' },
    { table: 'investments' },
    { table: 'accounts' },
  ];
  for (const { table } of steps) {
    const { error } = await supabase.from(table).delete().eq('is_sample', true);
    if (error) return { data: null, error: error.message };
  }
  return { data: null, error: null };
}

// ── Hooks ────────────────────────────────────────────────────

export const sampleDataKeys = {
  has: ['sample-data', 'has'] as const,
};

export function useHasSampleData() {
  return useQuery({
    queryKey: sampleDataKeys.has,
    queryFn: fetchHasSampleData,
    staleTime: 60_000,
  });
}

export function useSeedSampleData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: seedSampleData,
    // Sample data touches every domain — refresh everything.
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useWipeSampleData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: wipeSampleData,
    onSuccess: () => qc.invalidateQueries(),
  });
}

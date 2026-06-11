import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { DbInvestment, InsertInvestment, UpdateInvestment } from '@/types/database';
import type { InvestmentWithComputed, PortfolioSummary, AssetAllocation } from './types';

const ASSET_TYPE_LABELS: Record<string, string> = {
  stock:       'Stocks',
  etf:         'ETFs',
  crypto:      'Crypto',
  mutual_fund: 'Mutual Funds',
  bond:        'Bonds',
  real_estate: 'Real Estate',
  retirement:  'Retirement',
  other:       'Other',
};

const ASSET_TYPE_COLORS: Record<string, string> = {
  stock:       '#2563EB',
  etf:         '#22C55E',
  crypto:      '#F59E0B',
  mutual_fund: '#8B5CF6',
  bond:        '#06B6D4',
  real_estate: '#F97316',
  retirement:  '#10B981',
  other:       '#94A3B8',
};

function toComputed(row: DbInvestment): InvestmentWithComputed {
  const totalCost     = Number(row.quantity) * Number(row.purchase_price);
  const currentValue  = Number(row.quantity) * Number(row.current_price);
  const gainLoss      = currentValue - totalCost;
  const gainLossPct   = totalCost > 0 ? gainLoss / totalCost : 0;

  return {
    ...row,
    quantity:       Number(row.quantity),
    purchase_price: Number(row.purchase_price),
    current_price:  Number(row.current_price),
    totalCost,
    currentValue,
    gainLoss,
    gainLossPct,
  };
}

// The manually-crafted Database type doesn't fully satisfy Supabase SDK generics;
// cast to any to unblock type inference, consistent with the existing codebase pattern.
 
type AnyClient = any;

export async function fetchInvestments(): Promise<InvestmentWithComputed[]> {
  const supabase = getSupabaseBrowserClient() as AnyClient;
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((r: DbInvestment) => toComputed(r));
}

export async function createInvestment(
  payload: InsertInvestment,
): Promise<InvestmentWithComputed> {
  const supabase = getSupabaseBrowserClient() as AnyClient;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('investments')
    .insert([{ ...payload, user_id: session.user.id }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toComputed(data as DbInvestment);
}

export async function updateInvestment(
  id: string,
  payload: UpdateInvestment,
): Promise<InvestmentWithComputed> {
  const supabase = getSupabaseBrowserClient() as AnyClient;
  const { data, error } = await supabase
    .from('investments')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toComputed(data as DbInvestment);
}

export async function deleteInvestment(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient() as AnyClient;
  const { error } = await supabase.from('investments').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export function buildPortfolioSummary(
  investments: InvestmentWithComputed[],
): PortfolioSummary {
  const totalValue    = investments.reduce((s, i) => s + i.currentValue, 0);
  const totalCost     = investments.reduce((s, i) => s + i.totalCost, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPct = totalCost > 0 ? totalGainLoss / totalCost : 0;

  // Group by asset_type
  const byType = new Map<string, number>();
  investments.forEach(inv => {
    byType.set(inv.asset_type, (byType.get(inv.asset_type) ?? 0) + inv.currentValue);
  });

  const allocation: AssetAllocation[] = Array.from(byType.entries())
    .map(([asset_type, value]) => ({
      asset_type: asset_type as AssetAllocation['asset_type'],
      label:      ASSET_TYPE_LABELS[asset_type] ?? asset_type,
      value,
      percentage: totalValue > 0 ? value / totalValue : 0,
      color:      ASSET_TYPE_COLORS[asset_type] ?? '#94A3B8',
    }))
    .sort((a, b) => b.value - a.value);

  return { totalValue, totalCost, totalGainLoss, totalGainLossPct, allocation };
}

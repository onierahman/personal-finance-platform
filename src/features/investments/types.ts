import type { AssetType } from '@/types/database';

export interface InvestmentFormValues {
  asset_type: AssetType;
  symbol: string | null;
  name: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
  purchase_date: string;
  notes: string | null;
}

export interface InvestmentWithComputed {
  id: string;
  user_id: string;
  asset_type: AssetType;
  symbol: string | null;
  name: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
  purchase_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // computed
  totalCost: number;
  currentValue: number;
  gainLoss: number;
  gainLossPct: number;
}

export interface AssetAllocation {
  asset_type: AssetType;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPct: number;
  allocation: AssetAllocation[];
}

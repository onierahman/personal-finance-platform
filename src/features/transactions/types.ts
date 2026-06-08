import type { Transaction, TransactionType } from '@/types';

export interface TransactionFilters {
  month?: string;       // YYYY-MM
  type?: TransactionType;
  category?: string;
  accountId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface TransactionGroup {
  date: string;
  transactions: Transaction[];
  totalExpenses: number;
  totalIncome: number;
}

export interface MonthlyCategoryBreakdown {
  category: string;
  total: number;
  count: number;
  icon: string;
  color: string;
  percentage: number;
}

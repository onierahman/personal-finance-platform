export interface MonthSummary {
  month: string; // YYYY-MM
  label: string; // "Jun 2026"
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  netCashFlow: number;
  transactionCount: number;
}

export interface CategoryTrendPoint {
  month: string;
  label: string;
  amount: number;
}

export interface CategoryTrend {
  category: string;
  icon: string;
  color: string;
  total: number;
  months: CategoryTrendPoint[];
  avgMonthly: number;
  change: number; // % change vs previous period
}

export interface BudgetPerformanceMonth {
  month: string;
  label: string;
  category: string;
  limitAmount: number;
  spentAmount: number;
  usageRatio: number;
}

export interface BudgetPerformance {
  category: string;
  icon: string;
  color: string;
  avgUsage: number;
  months: BudgetPerformanceMonth[];
}

export interface MerchantSummary {
  merchant: string;
  total: number;
  count: number;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  avgAmount: number;
}

export interface DailySpending {
  date: string;
  expenses: number;
  income: number;
}

export interface AnalyticsPeriod {
  label: string;
  months: number;
}

export const ANALYTICS_PERIODS: AnalyticsPeriod[] = [
  { label: '3 Months',  months: 3  },
  { label: '6 Months',  months: 6  },
  { label: '12 Months', months: 12 },
];

// ============================================================
// types/index.ts
// Domain models for the UI layer — derived from DB types but
// shaped for component consumption (numbers, not strings for dates)
// ============================================================

export type {
  AccountType, TransactionType, CategoryType, BudgetPeriod,
  GoalPriority, GoalStatus, RecurringFrequency, AssetType,
  NotificationType, InsightType, Database,
} from './database';

// ── User ─────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  currency: string;
  timezone: string;
}

// ── Account ──────────────────────────────────────────────────
export interface Account {
  id: string;
  userId: string;
  name: string;
  type: import('./database').AccountType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
  isActive: boolean;
}

// ── Category ─────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  type: import('./database').CategoryType;
  icon: string;
  color: string;
  isSystem: boolean;
}

// ── Transaction ──────────────────────────────────────────────
export interface Transaction {
  id: string;
  accountId: string;
  recurringId: string | null;
  amount: number;
  type: import('./database').TransactionType;
  category: string;
  subcategory: string | null;
  merchant: string | null;
  date: string; // ISO date string YYYY-MM-DD
  note: string | null;
  receiptUrl: string | null;
  isDeleted: boolean;
  createdAt: string;
  // Joined
  accountName?: string;
  categoryMeta?: Category;
}

// ── Budget ───────────────────────────────────────────────────
export interface Budget {
  id: string;
  userId: string;
  category: string;
  limitAmount: number;
  spentAmount: number;
  period: import('./database').BudgetPeriod;
  startDate: string;
  /** 0–1 ratio */
  usageRatio: number;
  /** safe | warning | danger | over */
  healthStatus: 'safe' | 'warning' | 'danger' | 'over';
  categoryMeta?: Category;
}

// ── Goal ─────────────────────────────────────────────────────
export interface Goal {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  priority: import('./database').GoalPriority;
  status: import('./database').GoalStatus;
  icon: string;
  color: string;
  /** 0–1 */
  progressRatio: number;
  /** Suggested monthly contribution to hit deadline */
  suggestedMonthly?: number;
}

// ── Investment ───────────────────────────────────────────────
export interface Investment {
  id: string;
  userId: string;
  assetType: import('./database').AssetType;
  symbol: string | null;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  notes: string | null;
  /** Computed */
  totalCost: number;
  currentValue: number;
  gainLoss: number;
  gainLossPct: number;
}

// ── Recurring Transaction ─────────────────────────────────────
export interface RecurringTransaction {
  id: string;
  accountId: string;
  amount: number;
  type: import('./database').TransactionType;
  category: string;
  merchant: string | null;
  note: string | null;
  frequency: import('./database').RecurringFrequency;
  startDate: string;
  nextDue: string;
  endDate: string | null;
  isActive: boolean;
  categoryMeta?: Category;
}

// ── Dashboard Summary ─────────────────────────────────────────
export interface MonthlySummary {
  income: number;
  expenses: number;
  savings: number;
  investments: number;
  remaining: number;
  savingsRate: number;
  month: string; // YYYY-MM
}

// ── Net Worth ─────────────────────────────────────────────────
export interface NetWorth {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  byAccount: Array<{ account: Account; contribution: number }>;
}

// ── AI Insight ────────────────────────────────────────────────
export interface AiInsight {
  id: string;
  type: import('./database').InsightType;
  period: string | null;
  payload: {
    title: string;
    summary: string;
    recommendations: string[];
    data?: Record<string, unknown>;
  };
  isRead: boolean;
  createdAt: string;
}

// ── Notification ──────────────────────────────────────────────
export interface Notification {
  id: string;
  type: import('./database').NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

// ── API response wrapper ──────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  meta?: { page: number; total: number; pageSize: number };
}

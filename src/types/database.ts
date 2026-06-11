// ============================================================
// database.ts
// TypeScript mirror of the PostgreSQL schema.
// Generated manually — regenerate with: supabase gen types typescript
// ============================================================

export type AccountType =
  | 'checking'
  | 'savings'
  | 'credit_card'
  | 'investment'
  | 'cash'
  | 'loan'
  | 'other';

export type TransactionType = 'expense' | 'income' | 'transfer';
export type CategoryType = 'expense' | 'income' | 'both';
export type BudgetPeriod = 'monthly' | 'annual';
export type GoalPriority = 'low' | 'medium' | 'high';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';
export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
export type AssetType = 'stock' | 'etf' | 'crypto' | 'mutual_fund' | 'bond' | 'real_estate' | 'retirement' | 'other';
export type NotificationType =
  | 'bill_due'
  | 'budget_exceeded'
  | 'goal_achieved'
  | 'low_balance'
  | 'recurring_generated'
  | 'insight_ready'
  | 'import_complete'
  | 'weekly_digest';
export type InsightType =
  | 'monthly_summary'
  | 'spending_alert'
  | 'savings_suggestion'
  | 'budget_recommendation'
  | 'forecast';

// ── Row types (what comes back from DB) ─────────────────────

export interface DbUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  currency: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DbAccount {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbCategory {
  id: string;
  user_id: string | null;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  is_system: boolean;
  created_at: string;
}

export interface DbTransaction {
  id: string;
  account_id: string;
  recurring_id: string | null;
  amount: number;
  type: TransactionType;
  category: string;
  subcategory: string | null;
  merchant: string | null;
  date: string;
  note: string | null;
  receipt_url: string | null;
  ai_category: string | null;
  ai_confidence: number | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbBudget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  period: BudgetPeriod;
  start_date: string;
  spent_amount: number;
  created_at: string;
  updated_at: string;
}

export interface DbGoal {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  priority: GoalPriority;
  status: GoalStatus;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface DbInvestment {
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
}

export interface DbRecurringTransaction {
  id: string;
  account_id: string;
  amount: number;
  type: TransactionType;
  category: string;
  merchant: string | null;
  note: string | null;
  frequency: RecurringFrequency;
  start_date: string;
  next_due: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  email_sent: boolean;
  created_at: string;
}

export interface DbGmailToken {
  id: string;
  user_id: string;
  email: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface DbAiInsight {
  id: string;
  user_id: string;
  type: InsightType;
  period: string | null;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// ── Insert types (what you pass to DB) ──────────────────────

export type InsertAccount = Omit<DbAccount, 'id' | 'created_at' | 'updated_at'>;
export type InsertTransaction = Omit<DbTransaction, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'ai_category' | 'ai_confidence'>;
export type InsertBudget = Omit<DbBudget, 'id' | 'created_at' | 'updated_at' | 'spent_amount'>;
export type InsertGoal = Omit<DbGoal, 'id' | 'created_at' | 'updated_at'>;
export type InsertInvestment = Omit<DbInvestment, 'id' | 'created_at' | 'updated_at'>;
export type InsertRecurring = Omit<DbRecurringTransaction, 'id' | 'created_at' | 'updated_at'>;

// ── Update types ─────────────────────────────────────────────

export type UpdateAccount = Partial<InsertAccount>;
export type UpdateTransaction = Partial<InsertTransaction>;
export type UpdateBudget = Partial<InsertBudget>;
export type UpdateGoal = Partial<InsertGoal>;
export type UpdateInvestment = Partial<InsertInvestment>;
export type UpdateRecurring = Partial<InsertRecurring>;

// ── Supabase Database type (for typed client) ────────────────

export type Database = {
  public: {
    Tables: {
      users:                  { Row: DbUser;                  Insert: Partial<DbUser>;        Update: Partial<DbUser> };
      accounts:               { Row: DbAccount;               Insert: InsertAccount;           Update: UpdateAccount };
      categories:             { Row: DbCategory;              Insert: Omit<DbCategory,'id'|'created_at'>; Update: Partial<DbCategory> };
      transactions:           { Row: DbTransaction;           Insert: InsertTransaction;       Update: UpdateTransaction };
      budgets:                { Row: DbBudget;                Insert: InsertBudget;            Update: UpdateBudget };
      goals:                  { Row: DbGoal;                  Insert: InsertGoal;              Update: UpdateGoal };
      investments:            { Row: DbInvestment;            Insert: InsertInvestment;        Update: UpdateInvestment };
      recurring_transactions: { Row: DbRecurringTransaction;  Insert: InsertRecurring;         Update: UpdateRecurring };
      notifications:          { Row: DbNotification;          Insert: Omit<DbNotification,'id'|'created_at'>; Update: Partial<DbNotification> };
      gmail_tokens:           { Row: DbGmailToken;            Insert: Omit<DbGmailToken,'id'|'created_at'>;   Update: Partial<DbGmailToken> };
      ai_insights:            { Row: DbAiInsight;             Insert: Omit<DbAiInsight,'id'|'created_at'>;    Update: Partial<DbAiInsight> };
    };
  };
};

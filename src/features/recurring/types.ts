// Realigned precisely with your 001_initial_schema.sql definition
export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
export type RecurringType = 'expense' | 'income';

export interface RecurringTransaction {
  id: string;
  account_id: string; // Ownership links through account joins
  amount: number;
  type: RecurringType;
  category: string;
  merchant: string | null;
  note: string | null;
  frequency: RecurringFrequency;
  start_date: string;
  next_due: string;   // Swapped from next_due_date to match database
  end_date: string | null;
  is_active: boolean; // Swapped from status to boolean
  created_at: string;
  updated_at: string;
}

export type CreateRecurringInput = Omit<RecurringTransaction, 'id' | 'created_at' | 'updated_at'>;
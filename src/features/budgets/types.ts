// Strict contract: Adjusted properties to match your exact database headers

export type BudgetPeriod = 'monthly' | 'annual';

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number; // Matches limit_amount numeric(15,2)
  period: BudgetPeriod;  // Matches 'monthly' | 'annual'
  start_date: string;    // Matches date
  spent_amount: number; // Matches spent_amount numeric(15,2)
  created_at: string;
  updated_at: string;
}

export type CreateBudgetInput = Omit<Budget, 'id' | 'user_id' | 'spent_amount' | 'created_at' | 'updated_at'>;
export type UpdateBudgetInput = Partial<CreateBudgetInput> & { id: string };
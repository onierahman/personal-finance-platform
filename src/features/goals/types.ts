// Strict contract: Adjusted properties to match target tables precisely

export type GoalPriority = 'low' | 'medium' | 'high';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  deadline: string | null; // Swapped from target_date to match database structure
  priority: GoalPriority;
  status: GoalStatus;
  icon: string | null;     // Replaced category_icon to align with data schema
  color: string | null;    // Replaced color_hex to match data schema
  created_at: string;
  updated_at: string;
}

export interface GoalContribution {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  created_at: string;
}

export type CreateGoalInput = Omit<SavingsGoal, 'id' | 'user_id' | 'current_amount' | 'status' | 'created_at' | 'updated_at'>;
export type UpdateGoalInput = Partial<CreateGoalInput> & { id: string; status?: GoalStatus };
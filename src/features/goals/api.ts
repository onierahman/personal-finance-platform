// Strict contract: Typed Supabase CRUD functions
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { SavingsGoal, CreateGoalInput, UpdateGoalInput, GoalContribution } from './types';

const supabase = getSupabaseBrowserClient();

export const goalsApi = {
  async getGoals(): Promise<SavingsGoal[]> {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .order('target_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async createGoal(goal: CreateGoalInput): Promise<SavingsGoal> {
    const { data, error } = await supabase
      .from('savings_goals')
      .insert([goal])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateGoal({ id, ...updates }: UpdateGoalInput): Promise<SavingsGoal> {
    const { data, error } = await supabase
      .from('savings_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteGoal(id: string): Promise<void> {
    const { error } = await supabase.from('savings_goals').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async addContribution(goalId: string, amount: number): Promise<GoalContribution> {
    const { data, error } = await supabase
      .from('goal_contributions')
      .insert([{ goal_id: goalId, amount }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
};
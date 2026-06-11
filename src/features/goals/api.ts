import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { SavingsGoal, CreateGoalInput, UpdateGoalInput } from './types';

 
const supabase = getSupabaseBrowserClient() as any;

export const goalsApi = {
  async getGoals(): Promise<SavingsGoal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('deadline', { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async createGoal(goal: CreateGoalInput): Promise<SavingsGoal> {
    const { data, error } = await supabase
      .from('goals')
      .insert([goal])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateGoal({ id, ...updates }: UpdateGoalInput): Promise<SavingsGoal> {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteGoal(id: string): Promise<void> {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
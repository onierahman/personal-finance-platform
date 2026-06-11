// Strict contract: Supabase CRUD calls utilizing correct table constraints
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Budget, CreateBudgetInput, UpdateBudgetInput } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = getSupabaseBrowserClient() as any;

export const budgetsApi = {
  async getBudgets(): Promise<Budget[]> {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async createBudget(budget: CreateBudgetInput): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .insert([budget])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateBudget({ id, ...updates }: UpdateBudgetInput): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteBudget(id: string): Promise<void> {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
};
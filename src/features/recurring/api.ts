// Strict contract: Typed Supabase CRUD functions
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { RecurringTransaction, CreateRecurringInput, UpdateRecurringInput } from './types';

const supabase = getSupabaseBrowserClient();

export const recurringApi = {
  async getRecurringTransactions(): Promise<RecurringTransaction[]> {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .order('next_due_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async createRecurring(item: CreateRecurringInput): Promise<RecurringTransaction> {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert([item])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateRecurring({ id, ...updates }: UpdateRecurringInput): Promise<RecurringTransaction> {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteRecurring(id: string): Promise<void> {
    const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
};
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { recurringSchema } from './schema';
import { z } from 'zod';

type RecurringFormValues = z.infer<typeof recurringSchema>;

export function useRecurring() {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ['recurring'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .order('next_due', { ascending: true });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useCreateRecurring() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: RecurringFormValues) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active authentication session found.');

      // Ownership is derived via account_id → accounts.user_id — no user_id column on this table
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert([{
          account_id: values.account_id,
          merchant:   values.merchant,
          amount:     values.amount,
          frequency:  values.frequency,
          type:       values.type,
          category:   values.category,
          note:       values.note ?? null,
          start_date: values.start_date,
          next_due:   values.next_due,
          end_date:   values.end_date ?? null,
          is_active:  true,
        }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    },
  });
}

export function useUpdateRecurring() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<RecurringFormValues> & { id: string }) => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    },
  });
}

export function useToggleRecurringStatus() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    },
  });
}

export function useDeleteRecurring() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    },
  });
}
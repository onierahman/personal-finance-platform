'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { recurringSchema } from './schema';
import { z } from 'zod';

type RecurringFormValues = z.infer<typeof recurringSchema>;

// 1. Fetch all recurring contract entries
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

// 2. Create a new recurring transaction profile
export function useCreateRecurring() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: RecurringFormValues) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active authentication session found.');

      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert([
          {
            user_id: session.user.id,
            merchant: values.merchant,
            amount: values.amount,
            frequency: values.frequency,
            type: values.type,
            next_due: values.next_due,
            category: values.category,
            is_active: true,
          },
        ])
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

// 3. Toggle Pause / Active state
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

// 4. Delete an item completely
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
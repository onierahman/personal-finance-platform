'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { budgetSchema } from './schema';
import { z } from 'zod';

type BudgetFormValues = z.infer<typeof budgetSchema>;

export function useCreateBudget() {
   
  const supabase = getSupabaseBrowserClient() as any;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: BudgetFormValues) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active user authentication found.');

      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          user_id: session.user.id,
          category: values.category,
          limit_amount: values.limit_amount,
          period: values.period,
          start_date: values.start_date,
          spent_amount: 0,
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error(
            `A budget for "${values.category}" already exists for this cycle.`
          );
        }
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useUpdateBudget() {
   
  const supabase = getSupabaseBrowserClient() as any;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<BudgetFormValues> & { id: string }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update(values)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useDeleteBudget() {
   
  const supabase = getSupabaseBrowserClient() as any;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}
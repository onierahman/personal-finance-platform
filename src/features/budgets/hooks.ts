'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { budgetSchema } from './schema';
import { z } from 'zod';

type BudgetFormValues = z.infer<typeof budgetSchema>;

export function useCreateBudget() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: BudgetFormValues) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active user authentication found.');

      const { data, error } = await supabase
        .from('budgets')
        .insert([
          {
            user_id: session.user.id,
            category: values.category,
            limit_amount: values.limit_amount,
            period: values.period,
            start_date: values.start_date,
            spent_amount: 0,
          },
        ])
        .select()
        .single();

      if (error) {
        // Intercept the database unique constraint violation code
        if (error.code === '23505') {
          throw new Error(
            `A budget allocation for "${values.category}" already exists for this active cycle.`
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
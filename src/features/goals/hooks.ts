'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { savingsGoalSchema } from './schema';
import { z } from 'zod';

type GoalFormValues = z.infer<typeof savingsGoalSchema>;

// 1. Fetch all goals
export function useGoals() {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

// 2. Create a new savings horizon goal
export function useCreateGoal() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: GoalFormValues) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active user authentication found.');

      const { data, error } = await supabase
        .from('goals')
        .insert([
          {
            user_id: session.user.id,
            name: values.name,
            target_amount: values.target_amount,
            current_amount: 0,
            deadline: values.deadline,
            color: values.color,
            icon: values.icon,
            status: 'active',
          },
        ])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

// 3. Quick contribution optimization save
export function useAddContribution() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, amount }: { goalId: string; amount: number }) => {
      const { data: currentGoal, error: fetchError } = await supabase
        .from('goals')
        .select('current_amount, target_amount')
        .eq('id', goalId)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      const newAmount = Number(currentGoal.current_amount) + amount;
      const isAchieved = newAmount >= Number(currentGoal.target_amount);

      const { data, error } = await supabase
        .from('goals')
        .update({
          current_amount: newAmount,
          status: isAchieved ? 'completed' : 'active',
        })
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
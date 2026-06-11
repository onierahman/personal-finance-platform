'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { savingsGoalSchema } from './schema';
import type { DbGoal } from '@/types/database';
import { z } from 'zod';

type GoalFormValues = z.infer<typeof savingsGoalSchema>;

export function useGoals() {
   
  const supabase = getSupabaseBrowserClient() as any;

  return useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('deadline', { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []) as DbGoal[];
    },
  });
}

export function useCreateGoal() {
   
  const supabase = getSupabaseBrowserClient() as any;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: GoalFormValues) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active user authentication found.');

      const { data, error } = await supabase
        .from('goals')
        .insert([{
          user_id:        session.user.id,
          name:           values.name,
          description:    values.description ?? null,
          target_amount:  values.target_amount,
          current_amount: 0,
          deadline:       values.deadline ?? null,
          priority:       values.priority,
          icon:           values.icon,
          color:          values.color,
          status:         'active',
        }])
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

export function useUpdateGoal() {
   
  const supabase = getSupabaseBrowserClient() as any;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<GoalFormValues> & { id: string; status?: string }) => {
      const { data, error } = await supabase
        .from('goals')
        .update(values)
        .eq('id', id)
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

export function useAddContribution() {
   
  const supabase = getSupabaseBrowserClient() as any;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, amount }: { goalId: string; amount: number }) => {
      const { data: current, error: fetchError } = await supabase
        .from('goals')
        .select('current_amount, target_amount')
        .eq('id', goalId)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      const newAmount = Number(current.current_amount) + amount;
      const isCompleted = newAmount >= Number(current.target_amount);

      const { data, error } = await supabase
        .from('goals')
        .update({
          current_amount: newAmount,
          status: isCompleted ? 'completed' : 'active',
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

export function useDeleteGoal() {
   
  const supabase = getSupabaseBrowserClient() as any;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
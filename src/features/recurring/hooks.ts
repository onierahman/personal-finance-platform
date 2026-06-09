// Strict contract: React Query useQuery / useMutation wrappers
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recurringApi } from './api';
import { CreateRecurringInput, UpdateRecurringInput } from './types';

const RECURRING_KEY = ['recurring_transactions'] as const;

export function useRecurring() {
  return useQuery({
    queryKey: RECURRING_KEY,
    queryFn: recurringApi.getRecurringTransactions,
    staleTime: 1000 * 60 * 15, // Cache longer since schedules change infrequently
  });
}

export function useCreateRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recurringApi.createRecurring,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RECURRING_KEY }),
  });
}

export function useUpdateRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recurringApi.updateRecurring,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RECURRING_KEY }),
  });
}

export function useDeleteRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recurringApi.deleteRecurring,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RECURRING_KEY }),
  });
}
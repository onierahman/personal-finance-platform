import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTransactions,
  fetchAllTransactions,
  fetchMonthlySummary,
  fetchCategoryBreakdown,
  createTransaction,
  bulkCreateTransactions,
  updateTransaction,
  softDeleteTransaction,
} from './api';
import type { TransactionFilters } from './types';
import type { InsertTransaction, UpdateTransaction } from '@/types/database';

export const transactionKeys = {
  all:       ['transactions'] as const,
  lists:     () => [...transactionKeys.all, 'list'] as const,
  list:      (f: TransactionFilters) => [...transactionKeys.lists(), f] as const,
  summary:   (month: string) => ['transactions', 'summary', month] as const,
  breakdown: (month: string, type: string) => ['transactions', 'breakdown', month, type] as const,
};

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn:  () => fetchTransactions(filters),
    staleTime: 60_000,
  });
}

export function useAllTransactions(filters: Omit<TransactionFilters, 'page' | 'pageSize'> = {}) {
  return useQuery({
    queryKey: [...transactionKeys.lists(), 'all', filters],
    queryFn:  () => fetchAllTransactions(filters),
    staleTime: 60_000,
  });
}

export function useMonthlySummary(month?: string) {
  return useQuery({
    queryKey: transactionKeys.summary(month ?? 'current'),
    queryFn:  () => fetchMonthlySummary(month),
    staleTime: 60_000,
  });
}

export function useCategoryBreakdown(month?: string, type: 'expense' | 'income' = 'expense') {
  return useQuery({
    queryKey: transactionKeys.breakdown(month ?? 'current', type),
    queryFn:  () => fetchCategoryBreakdown(month, type),
    staleTime: 60_000,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InsertTransaction) => createTransaction(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}

export function useBulkCreateTransactions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payloads: InsertTransaction[]) => bulkCreateTransactions(payloads),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTransaction }) =>
      updateTransaction(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => softDeleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}

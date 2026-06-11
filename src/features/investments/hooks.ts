'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchInvestments,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  buildPortfolioSummary,
} from './api';
import type { InsertInvestment, UpdateInvestment } from '@/types/database';

export const investmentKeys = {
  all:  ['investments'] as const,
  list: () => [...investmentKeys.all, 'list'] as const,
};

export function useInvestments() {
  return useQuery({
    queryKey: investmentKeys.list(),
    queryFn:  fetchInvestments,
    staleTime: 60_000,
  });
}

export function usePortfolioSummary() {
  return useQuery({
    queryKey: [...investmentKeys.list(), 'summary'],
    queryFn:  async () => {
      const investments = await fetchInvestments();
      return buildPortfolioSummary(investments);
    },
    staleTime: 60_000,
  });
}

export function useCreateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InsertInvestment) => createInvestment(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: investmentKeys.all }),
  });
}

export function useUpdateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInvestment }) =>
      updateInvestment(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: investmentKeys.all }),
  });
}

export function useDeleteInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInvestment(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: investmentKeys.all }),
  });
}

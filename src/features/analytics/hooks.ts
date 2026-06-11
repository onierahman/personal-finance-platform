'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchMultiMonthSummary,
  fetchCategoryTrends,
  fetchBudgetPerformance,
  fetchTopMerchants,
} from './api';

export const analyticsKeys = {
  all:             ['analytics'] as const,
  multiMonth:      (months: number) => ['analytics', 'multi-month', months] as const,
  categoryTrends:  (months: number, type: string) => ['analytics', 'category-trends', months, type] as const,
  budgetPerf:      (months: number) => ['analytics', 'budget-perf', months] as const,
  topMerchants:    (months: number) => ['analytics', 'top-merchants', months] as const,
};

export function useMultiMonthSummary(months = 6) {
  return useQuery({
    queryKey: analyticsKeys.multiMonth(months),
    queryFn:  () => fetchMultiMonthSummary(months),
    staleTime: 120_000,
  });
}

export function useCategoryTrends(months = 6, type: 'expense' | 'income' = 'expense') {
  return useQuery({
    queryKey: analyticsKeys.categoryTrends(months, type),
    queryFn:  () => fetchCategoryTrends(months, type),
    staleTime: 120_000,
  });
}

export function useBudgetPerformance(months = 6) {
  return useQuery({
    queryKey: analyticsKeys.budgetPerf(months),
    queryFn:  () => fetchBudgetPerformance(months),
    staleTime: 120_000,
  });
}

export function useTopMerchants(months = 1, limit = 10) {
  return useQuery({
    queryKey: analyticsKeys.topMerchants(months),
    queryFn:  () => fetchTopMerchants(months, limit),
    staleTime: 120_000,
  });
}

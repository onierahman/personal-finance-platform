'use client';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/features/auth/bak.api';

export function useUser() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', 'current'],
    queryFn:  getCurrentUser,
    staleTime: 300_000,
    retry: false,
  });

  return {
    user:      data?.data ?? null,
    isLoading,
    error:     data?.error ?? error?.message ?? null,
    isLoggedIn: Boolean(data?.data),
  };
}

'use client';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/features/auth/api';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function useUser() {
  const router = useRouter();
  const pathname = usePathname();

  const { data, isLoading, error } = useQuery({
    queryKey: ['user', 'current'],
    queryFn:  getCurrentUser,
    staleTime: 300_000,
    retry: false,
  });

  const user = data?.data ?? null;
  const isLoggedIn = Boolean(data?.data);

  // Safely execute client-side routing logic ONLY after loading finishes
  useEffect(() => {
    if (!isLoading && !isLoggedIn && pathname !== '/login' && pathname !== '/register') {
      router.replace('/login');
    }
  }, [isLoading, isLoggedIn, pathname, router]);

  return {
    user,
    isLoading,
    error: data?.error ?? error?.message ?? null,
    isLoggedIn,
  };
}
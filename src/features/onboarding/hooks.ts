'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type AnyClient = any;

export interface OnboardingStatus {
  hasAccount: boolean;
  hasTransaction: boolean;
  hasBudget: boolean;
  hasGoal: boolean;
}

async function fetchOnboardingStatus(): Promise<OnboardingStatus> {
  const supabase = getSupabaseBrowserClient() as AnyClient;

  // One lightweight head-count per table — cheap, runs only on the dashboard.
  const countOf = async (table: string, filter?: (q: AnyClient) => AnyClient) => {
    let q = supabase.from(table).select('id', { count: 'exact', head: true });
    if (filter) q = filter(q);
    const { count } = await q;
    return (count ?? 0) > 0;
  };

  const [hasAccount, hasTransaction, hasBudget, hasGoal] = await Promise.all([
    countOf('accounts'),
    countOf('transactions', (q) => q.eq('is_deleted', false)),
    countOf('budgets'),
    countOf('goals'),
  ]);

  return { hasAccount, hasTransaction, hasBudget, hasGoal };
}

export function useOnboardingStatus() {
  return useQuery({
    queryKey: ['onboarding', 'status'],
    queryFn: fetchOnboardingStatus,
    staleTime: 30_000,
  });
}

const DISMISS_KEY = 'onboarding-dismissed';

/** Local, per-device dismissal of the setup checklist. */
export function useOnboardingDismissed(): [boolean, () => void] {
  const [dismissed, setDismissed] = useState(true); // assume dismissed until hydrated

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }, []);

  return [dismissed, dismiss];
}

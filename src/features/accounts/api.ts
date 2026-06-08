import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Account, ApiResponse } from '@/types';
import type { DbAccount, InsertAccount, UpdateAccount } from '@/types/database';

function toAccount(row: DbAccount): Account {
  return {
    id:       row.id,
    userId:   row.user_id,
    name:     row.name,
    type:     row.type,
    balance:  Number(row.balance),
    currency: row.currency,
    color:    row.color ?? '#2563EB',
    icon:     row.icon ?? 'wallet',
    isActive: row.is_active,
  };
}

export async function fetchAccounts(): Promise<ApiResponse<Account[]>> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('is_active', true)
    .order('created_at');

  if (error) return { data: null, error: error.message };
  return { data: (data ?? []).map(toAccount), error: null };
}

export async function createAccount(
  payload: InsertAccount,
): Promise<ApiResponse<Account>> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('accounts')
    .insert(payload)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toAccount(data as DbAccount), error: null };
}

export async function updateAccount(
  id: string,
  payload: UpdateAccount,
): Promise<ApiResponse<Account>> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('accounts')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toAccount(data as DbAccount), error: null };
}

// ── Hooks ────────────────────────────────────────────────────

export const accountKeys = {
  all:  ['accounts'] as const,
  list: () => [...accountKeys.all, 'list'] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.list(),
    queryFn:  fetchAccounts,
    staleTime: 120_000,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InsertAccount) => createAccount(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: accountKeys.all }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAccount }) =>
      updateAccount(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.all }),
  });
}

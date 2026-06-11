import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Account, ApiResponse } from '@/types';
import type { DbAccount, InsertAccount, UpdateAccount } from '@/types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

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
  const supabase = getSupabaseBrowserClient() as AnyClient;
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('is_active', true)
    .order('created_at');

  if (error) return { data: null, error: error.message };
  return { data: (data ?? []).map(toAccount), error: null };
}

export async function createAccount(
  payload: Omit<InsertAccount, 'user_id'>,
): Promise<ApiResponse<Account>> {
  const supabase = getSupabaseBrowserClient() as AnyClient;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('accounts')
    .insert([{ ...payload, user_id: session.user.id }])
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toAccount(data as DbAccount), error: null };
}

export async function deleteAccount(id: string): Promise<ApiResponse<null>> {
  const supabase = getSupabaseBrowserClient() as AnyClient;
  const { error } = await supabase
    .from('accounts')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}

export async function updateAccount(
  id: string,
  payload: UpdateAccount,
): Promise<ApiResponse<Account>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowserClient() as AnyClient;
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
    mutationFn: (payload: Omit<InsertAccount, 'user_id'>) => createAccount(payload),
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

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: accountKeys.all }),
  });
}

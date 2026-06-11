'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, X, Check,
  Wallet, DollarSign, PiggyBank, CreditCard,
  Building, Briefcase, Landmark, TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount,
} from '@/features/accounts/api';
import { useUser } from '@/hooks/useUser';
import { formatCurrency } from '@/lib/formatters';
import { ACCOUNT_TYPE_LABELS, CURRENCIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { AccountType } from '@/types/database';
import type { Account } from '@/types';

// ── Constants ─────────────────────────────────────────────────

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'checking',    label: 'Checking' },
  { value: 'savings',     label: 'Savings' },
  { value: 'cash',        label: 'Cash' },
  { value: 'investment',  label: 'Investment Account' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'loan',        label: 'Loan' },
  { value: 'other',       label: 'Other' },
];

const ACCOUNT_TYPE_ICONS: Record<AccountType, React.ElementType> = {
  checking:    DollarSign,
  savings:     PiggyBank,
  cash:        Wallet,
  investment:  Briefcase,
  credit_card: CreditCard,
  loan:        Building,
  other:       Wallet,
};

const ACCOUNT_COLORS = [
  '#2563EB', '#22C55E', '#F59E0B', '#EF4444',
  '#8B5CF6', '#06B6D4', '#F97316', '#10B981',
  '#64748B', '#EC4899',
];

const ASSET_TYPES   = new Set<AccountType>(['checking', 'savings', 'cash', 'investment']);
const LIABILITY_TYPES = new Set<AccountType>(['credit_card', 'loan']);

// ── Zod schema ────────────────────────────────────────────────

const accountSchema = z.object({
  name:     z.string().min(1, 'Name is required').max(50),
  type:     z.enum(['checking','savings','credit_card','investment','cash','loan','other']),
  balance:  z.coerce.number({ invalid_type_error: 'Enter a valid number' }),
  currency: z.string().min(1),
  color:    z.string().default('#2563EB'),
});

type AccountFormValues = z.infer<typeof accountSchema>;

// ── Account form ──────────────────────────────────────────────

function AccountForm({
  defaultValues,
  onSubmit,
  onCancel,
  isPending,
}: {
  defaultValues?: Partial<AccountFormValues>;
  onSubmit: (values: AccountFormValues) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const { user } = useUser();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name:     defaultValues?.name     ?? '',
      type:     defaultValues?.type     ?? 'checking',
      balance:  defaultValues?.balance  ?? 0,
      currency: defaultValues?.currency ?? user?.currency ?? 'USD',
      color:    defaultValues?.color    ?? '#2563EB',
    },
  });

  const selectedColor = watch('color');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Account Name</label>
        <input
          {...register('name')}
          placeholder="e.g. Chase Checking"
          className="input w-full"
        />
        {errors.name && <p className="text-xs text-danger-600 mt-0.5">{errors.name.message}</p>}
      </div>

      {/* Type */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Account Type</label>
        <select {...register('type')} className="input w-full">
          {ACCOUNT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Balance + Currency */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            {LIABILITY_TYPES.has(watch('type')) ? 'Outstanding Balance' : 'Current Balance'}
          </label>
          <input
            {...register('balance')}
            type="number"
            step="0.01"
            placeholder="0.00"
            className="input w-full"
          />
          {errors.balance && <p className="text-xs text-danger-600 mt-0.5">{errors.balance.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Currency</label>
          <select {...register('currency')} className="input w-full">
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {ACCOUNT_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={cn(
                'w-7 h-7 rounded-full border-2 transition-transform',
                selectedColor === color ? 'border-slate-800 scale-110' : 'border-transparent',
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          <Check className="w-4 h-4" />
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Account row ────────────────────────────────────────────────

function AccountRow({
  account,
  currency,
  onEdit,
  onDelete,
}: {
  account: Account;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const Icon = ACCOUNT_TYPE_ICONS[account.type] ?? Wallet;
  const isLiability = LIABILITY_TYPES.has(account.type);

  return (
    <div className="flex items-center gap-3 py-3 group">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: account.color + '20' }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color: account.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{account.name}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{ACCOUNT_TYPE_LABELS[account.type] ?? account.type}</p>
      </div>

      <div className="text-right mr-2">
        <p className={cn('text-sm font-semibold', isLiability ? 'text-danger-600 dark:text-danger-400' : 'text-slate-900 dark:text-white')}>
          {isLiability ? '-' : ''}{formatCurrency(Math.abs(account.balance), currency)}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{account.currency}</p>
      </div>

      {/* Actions — visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {confirmDelete ? (
          <>
            <button
              onClick={onDelete}
              className="text-xs px-2 py-1 rounded bg-danger-600 text-white hover:bg-danger-700 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onEdit}
              className="p-1.5 rounded-md text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/15 transition-colors"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-md text-slate-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/15 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────

export default function AccountsPage() {
  const { user } = useUser();
  const currency = user?.currency ?? 'USD';

  const { data: accountsRes, isLoading } = useAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const accounts = accountsRes?.data ?? [];

  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [formError, setFormError]     = useState<string | null>(null);

  // ── Derived ────────────────────────────────────────────────

  const assetAccounts     = accounts.filter(a => ASSET_TYPES.has(a.type));
  const liabilityAccounts = accounts.filter(a => LIABILITY_TYPES.has(a.type));
  const otherAccounts     = accounts.filter(a => !ASSET_TYPES.has(a.type) && !LIABILITY_TYPES.has(a.type));

  const totalAssets      = assetAccounts.reduce((s, a) => s + Math.abs(a.balance), 0);
  const totalLiabilities = liabilityAccounts.reduce((s, a) => s + Math.abs(a.balance), 0);
  const netWorth         = totalAssets - totalLiabilities;

  // ── Handlers ───────────────────────────────────────────────

  async function handleCreate(values: AccountFormValues) {
    setFormError(null);
    const res = await createAccount.mutateAsync({
      ...values,
      icon: 'wallet',
      is_active: true,
    });
    if (res.error) { setFormError(res.error); return; }
    setShowForm(false);
  }

  async function handleUpdate(id: string, values: AccountFormValues) {
    setFormError(null);
    const res = await updateAccount.mutateAsync({ id, payload: values });
    if (res.error) { setFormError(res.error); return; }
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    await deleteAccount.mutateAsync(id);
  }

  // ── Render ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5 h-28 animate-pulse bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Accounts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your bank accounts, cards, and loans</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setFormError(null); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors self-end sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success-600" />
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Assets</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalAssets, currency)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{assetAccounts.length} account{assetAccounts.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-danger-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-danger-600" />
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Liabilities</p>
          </div>
          <p className="text-2xl font-bold text-danger-600 dark:text-danger-400">{formatCurrency(totalLiabilities, currency)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{liabilityAccounts.length} account{liabilityAccounts.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', netWorth >= 0 ? 'bg-primary-50' : 'bg-danger-50')}>
              <Landmark className={cn('w-5 h-5', netWorth >= 0 ? 'text-primary-600' : 'text-danger-600')} />
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Net Worth</p>
          </div>
          <p className={cn('text-2xl font-bold', netWorth >= 0 ? 'text-slate-900 dark:text-white' : 'text-danger-600 dark:text-danger-400')}>
            {formatCurrency(netWorth, currency)}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{netWorth >= 0 ? 'Positive' : 'Negative'} net worth</p>
        </div>
      </div>

      {/* Add account form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="card p-5"
          >
            <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">New Account</p>
            {formError && (
              <p className="text-sm text-danger-600 bg-danger-50 px-3 py-2 rounded-md mb-4">{formError}</p>
            )}
            <AccountForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              isPending={createAccount.isPending}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account lists */}
      {accounts.length === 0 && !showForm ? (
        <div className="card p-10 text-center">
          <Wallet className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No accounts yet</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add your first account to track balances and net worth</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets */}
          {(assetAccounts.length > 0 || otherAccounts.length > 0) && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-success-600" />
                <p className="text-base font-semibold text-slate-800 dark:text-slate-100">Assets</p>
                <span className="ml-auto text-sm font-bold text-success-700 dark:text-success-400">
                  {formatCurrency(totalAssets, currency)}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Checking, savings, cash, investments</p>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {[...assetAccounts, ...otherAccounts].map(account => (
                  editingId === account.id ? (
                    <div key={account.id} className="py-3">
                      {formError && (
                        <p className="text-sm text-danger-600 bg-danger-50 px-3 py-2 rounded-md mb-3">{formError}</p>
                      )}
                      <AccountForm
                        defaultValues={{
                          name:     account.name,
                          type:     account.type,
                          balance:  account.balance,
                          currency: account.currency,
                          color:    account.color,
                        }}
                        onSubmit={(v) => handleUpdate(account.id, v)}
                        onCancel={() => setEditingId(null)}
                        isPending={updateAccount.isPending}
                      />
                    </div>
                  ) : (
                    <AccountRow
                      key={account.id}
                      account={account}
                      currency={currency}
                      onEdit={() => { setEditingId(account.id); setShowForm(false); setFormError(null); }}
                      onDelete={() => handleDelete(account.id)}
                    />
                  )
                ))}
              </div>
            </div>
          )}

          {/* Liabilities */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-danger-600" />
              <p className="text-base font-semibold text-slate-800 dark:text-slate-100">Liabilities</p>
              <span className="ml-auto text-sm font-bold text-danger-700 dark:text-danger-400">
                {formatCurrency(totalLiabilities, currency)}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Credit cards and loans</p>

            {liabilityAccounts.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center">No liabilities — great financial health!</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {liabilityAccounts.map(account => (
                  editingId === account.id ? (
                    <div key={account.id} className="py-3">
                      {formError && (
                        <p className="text-sm text-danger-600 bg-danger-50 px-3 py-2 rounded-md mb-3">{formError}</p>
                      )}
                      <AccountForm
                        defaultValues={{
                          name:     account.name,
                          type:     account.type,
                          balance:  account.balance,
                          currency: account.currency,
                          color:    account.color,
                        }}
                        onSubmit={(v) => handleUpdate(account.id, v)}
                        onCancel={() => setEditingId(null)}
                        isPending={updateAccount.isPending}
                      />
                    </div>
                  ) : (
                    <AccountRow
                      key={account.id}
                      account={account}
                      currency={currency}
                      onEdit={() => { setEditingId(account.id); setShowForm(false); setFormError(null); }}
                      onDelete={() => handleDelete(account.id)}
                    />
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

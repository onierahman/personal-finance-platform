'use client';
import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';

import { useUiStore }           from '@/stores/uiStore';
import { useAccounts }          from '@/features/accounts/api';
import { useCreateTransaction } from '@/features/transactions/hooks';
import { transactionSchema, type TransactionFormValues } from '@/features/transactions/schema';
import { CategoryPicker }       from './CategoryPicker';
import { useToast }             from '@/components/ui/toaster';
import { todayIso }             from '@/lib/formatters';
import { cn }                   from '@/lib/utils';

export function QuickAdd() {
  const { quickAddOpen, quickAddType, closeQuickAdd, openQuickAdd, receiptPrefill, setReceiptPrefill } = useUiStore();
  const { data: accountsRes, isLoading: accountsLoading } = useAccounts();
  const accounts = accountsRes?.data ?? [];
  const createTxn = useCreateTransaction();
  const { success, error: showError } = useToast();
  const amountRef = useRef<HTMLInputElement>(null);

  const {
    register, handleSubmit, control, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type:       quickAddType,
      date:       todayIso(),
      category:   '',
      account_id: '', // must be present so Zod sees the field; overwritten once accounts load
    },
  });


  
  const selectedType = watch('type');
  const selectedAccountId = watch('account_id'); // <-- Add this tracker
  // Register amount once — calling register() twice produces two separate field
  // registrations; RHF only tracks the last ref, so the value is lost on submit.
  const amountReg = register('amount', { valueAsNumber: true });

  // Sync type + clear category whenever the sheet opens or type changes
  useEffect(() => {
    if (quickAddOpen) {
      setValue('type', quickAddType);
      setValue('category', '');
      setTimeout(() => amountRef.current?.focus(), 100);
    }
  }, [quickAddOpen, quickAddType, setValue]);

  // Apply OCR receipt prefill when sheet opens with prefill data
  useEffect(() => {
    if (quickAddOpen && receiptPrefill) {
      (Object.entries(receiptPrefill) as [keyof TransactionFormValues, unknown][]).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          setValue(key, value as never);
        }
      });
      setReceiptPrefill(null);
    }
  }, [quickAddOpen, receiptPrefill, setValue, setReceiptPrefill]);

  // Set first account as default as soon as accounts are available
 // useEffect(() => {
  //  if (accounts.length > 0) {
  //    setValue('account_id', accounts[0].id, { shouldValidate: false });
  //  }
  //}, [accounts, setValue]);
  
// Ensure the internal form state always matches a valid account belonging to the active user session
useEffect(() => {
  if (accounts.length > 0) {
    const isCurrentAccountValid = accounts.some(acc => acc.id === selectedAccountId);
    
    // If the tracked ID doesn't exist in the current user's accounts array, force-reset it
    if (!isCurrentAccountValid) {
      setValue('account_id', accounts[0].id, { shouldValidate: false });
    }
  }
}, [accounts, selectedAccountId, setValue]);

  async function onSubmit(values: TransactionFormValues) {
    try {
      const res = await createTxn.mutateAsync({
        account_id:  values.account_id,
        amount:      values.amount,
        type:        values.type,
        category:    values.category,
        subcategory: values.subcategory ?? null,
        merchant:    values.merchant ?? null,
        date:        values.date,
        note:        values.note ?? null,
        receipt_url: values.receipt_url ?? null,
        recurring_id: null,
      });

      if (res.error) {
        showError('Failed to save', res.error);
        return;
      }

      success('Transaction saved', `${values.category} · $${values.amount.toFixed(2)}`);
      reset({ type: selectedType, date: todayIso(), category: '', account_id: accounts[0]?.id });
      closeQuickAdd();
    } catch (err) {
      showError('Failed to save', err instanceof Error ? err.message : 'Unexpected error — check console');
      console.error('[QuickAdd] createTransaction error:', err);
    }
  }

  return (
    <AnimatePresence>
      {quickAddOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-[100]"
            onClick={closeQuickAdd}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[110] bg-white rounded-t-2xl shadow-dropdown max-h-[92vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            <div className="px-4 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between py-3 mb-2">
                <h2 className="text-base font-semibold text-slate-900">Add Transaction</h2>
                <button onClick={closeQuickAdd} className="p-1.5 rounded-md hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Type toggle */}
              <div className="flex rounded-lg bg-slate-100 p-1 mb-5">
                {(['expense', 'income'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setValue('type', t); setValue('category', ''); openQuickAdd(t); }}
                    className={cn(
                      'flex-1 py-1.5 rounded-md text-sm font-medium transition-all',
                      selectedType === t
                        ? t === 'expense'
                          ? 'bg-white shadow-sm text-danger-600'
                          : 'bg-white shadow-sm text-success-600'
                        : 'text-slate-500',
                    )}
                  >
                    {t === 'expense' ? '↓ Expense' : '↑ Income'}
                  </button>
                ))}
              </div>

              <form
                onSubmit={handleSubmit(onSubmit, (validationErrors) => {
                  // Visible in DevTools during development — remove before prod
                  console.warn('[QuickAdd] Zod validation failed:', validationErrors);
                })}
                className="space-y-4"
              >
                {/* Amount — most prominent */}
                <div>
                  <div className="flex items-center gap-2 border-2 border-slate-200 rounded-lg px-4 py-3 focus-within:border-primary-500 transition-colors">
                    <span className="text-2xl font-medium text-slate-400">$</span>
                    <input
                      {...amountReg}
                      ref={e => {
                        amountReg.ref(e);
                        (amountRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                      }}
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      className="flex-1 text-2xl font-semibold text-slate-900 bg-transparent outline-none amount placeholder:text-slate-300"
                      inputMode="decimal"
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-xs text-danger-500 mt-1">{errors.amount.message}</p>
                  )}
                </div>

                {/* Category picker */}
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Category</p>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <CategoryPicker
                        type={selectedType as 'expense' | 'income'}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  {errors.category && (
                    <p className="text-xs text-danger-500 mt-1">{errors.category.message}</p>
                  )}
                </div>

                {/* Merchant + Date row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500">Merchant</label>
                    <input
                      {...register('merchant')}
                      placeholder="Optional"
                      className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Date</label>
                    <input
                      {...register('date')}
                      type="date"
                      className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Account selector — always render so RHF registers the field */}
                <div>
                  <label className="text-xs font-medium text-slate-500">Account</label>
                  <div className="relative mt-1">
                    <select
                      {...register('account_id')}
                      disabled={accountsLoading || accounts.length === 0}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-primary-500 appearance-none transition-colors bg-white disabled:opacity-50"
                    >
                      {accountsLoading && (
                        <option value="">Loading accounts…</option>
                      )}
                      {!accountsLoading && accounts.length === 0 && (
                        <option value="">No accounts found — add one first</option>
                      )}
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                  {errors.account_id && (
                    <p className="text-xs text-danger-500 mt-1">{errors.account_id.message}</p>
                  )}
                </div>

                {/* Note */}
                <div>
                  <label className="text-xs font-medium text-slate-500">Note</label>
                  <input
                    {...register('note')}
                    placeholder="Optional note"
                    className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-primary-500 transition-colors"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    'w-full py-3 rounded-lg text-white text-sm font-semibold transition-all active:scale-[0.98]',
                    isSubmitting ? 'opacity-60 cursor-not-allowed' : '',
                    selectedType === 'expense' ? 'bg-danger-500 hover:bg-danger-600' : 'bg-success-500 hover:bg-success-600',
                  )}
                >
                  {isSubmitting ? 'Saving…' : `Save ${selectedType === 'expense' ? 'Expense' : 'Income'}`}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

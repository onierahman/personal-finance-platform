'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Plus, Pencil, Trash2,
  X, Check, BarChart2, DollarSign,
} from 'lucide-react';
import { useInvestments, useCreateInvestment, useUpdateInvestment, useDeleteInvestment } from '@/features/investments/hooks';
import { buildPortfolioSummary } from '@/features/investments/api';
import { investmentSchema, type InvestmentSchema } from '@/features/investments/schema';
import { formatCurrency, formatPercent, formatDate } from '@/lib/formatters';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import type { AssetType } from '@/types/database';
import type { InvestmentWithComputed } from '@/features/investments/types';

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'stock',       label: 'Stock' },
  { value: 'etf',         label: 'ETF' },
  { value: 'crypto',      label: 'Crypto' },
  { value: 'mutual_fund', label: 'Mutual Fund' },
  { value: 'bond',        label: 'Bond' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'retirement',  label: 'Retirement' },
  { value: 'other',       label: 'Other' },
];

const ASSET_COLORS: Record<AssetType, string> = {
  stock:       '#2563EB',
  etf:         '#22C55E',
  crypto:      '#F59E0B',
  mutual_fund: '#8B5CF6',
  bond:        '#06B6D4',
  real_estate: '#F97316',
  retirement:  '#10B981',
  other:       '#94A3B8',
};

// ── Summary stat card ─────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, iconBg, iconColor, positive,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
  positive?: boolean | null;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        {positive !== undefined && positive !== null && (
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            positive ? 'bg-success-50 dark:bg-success-500/15 text-success-600' : 'bg-danger-50 dark:bg-danger-500/15 text-danger-600',
          )}>
            {positive ? '▲' : '▼'}
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

// ── Investment form ───────────────────────────────────────────

function InvestmentForm({
  defaultValues,
  onSubmit,
  onCancel,
  isPending,
}: {
  defaultValues?: Partial<InvestmentSchema>;
  onSubmit: (values: InvestmentSchema) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<InvestmentSchema>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      asset_type:     'stock',
      purchase_date:  new Date().toISOString().split('T')[0],
      ...defaultValues,
    },
  });

  const field = 'border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100 w-full';
  const err   = 'text-xs text-danger-600 mt-0.5';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Asset Type</label>
          <select {...register('asset_type')} className={cn(field, 'mt-1')}>
            {ASSET_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {errors.asset_type && <p className={err}>{errors.asset_type.message}</p>}
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Symbol / Ticker</label>
          <input
            {...register('symbol')}
            placeholder="e.g. AAPL"
            className={cn(field, 'mt-1 uppercase')}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Name *</label>
        <input
          {...register('name')}
          placeholder="e.g. Apple Inc."
          className={cn(field, 'mt-1')}
        />
        {errors.name && <p className={err}>{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Quantity *</label>
          <input
            {...register('quantity')}
            type="number" step="0.0001" placeholder="0"
            className={cn(field, 'mt-1')}
          />
          {errors.quantity && <p className={err}>{errors.quantity.message}</p>}
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Buy Price *</label>
          <input
            {...register('purchase_price')}
            type="number" step="0.01" placeholder="0.00"
            className={cn(field, 'mt-1')}
          />
          {errors.purchase_price && <p className={err}>{errors.purchase_price.message}</p>}
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Current Price *</label>
          <input
            {...register('current_price')}
            type="number" step="0.01" placeholder="0.00"
            className={cn(field, 'mt-1')}
          />
          {errors.current_price && <p className={err}>{errors.current_price.message}</p>}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Purchase Date *</label>
        <input
          {...register('purchase_date')}
          type="date"
          className={cn(field, 'mt-1')}
        />
        {errors.purchase_date && <p className={err}>{errors.purchase_date.message}</p>}
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Notes</label>
        <textarea
          {...register('notes')}
          rows={2}
          placeholder="Optional notes…"
          className={cn(field, 'mt-1 resize-none')}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save Investment'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────

export default function InvestmentsPage() {
  const { user } = useUser();
  const currency = user?.currency ?? 'USD';

  const { data: investments = [], isLoading } = useInvestments();
  const { mutate: create, isPending: creating } = useCreateInvestment();
  const { mutate: update, isPending: updating } = useUpdateInvestment();
  const { mutate: remove } = useDeleteInvestment();

  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);

  const summary = buildPortfolioSummary(investments);
  const isPositive = summary.totalGainLoss >= 0;

  function handleCreate(values: InvestmentSchema) {
    create(
      {
        asset_type:     values.asset_type,
        symbol:         values.symbol ?? null,
        name:           values.name,
        quantity:       values.quantity,
        purchase_price: values.purchase_price,
        current_price:  values.current_price,
        purchase_date:  values.purchase_date,
        notes:          values.notes ?? null,
        user_id:        user?.id ?? '',
      },
      { onSuccess: () => setShowForm(false) },
    );
  }

  function handleUpdate(id: string, values: InvestmentSchema) {
    update(
      { id, payload: { ...values, symbol: values.symbol ?? null, notes: values.notes ?? null } },
      { onSuccess: () => setEditingId(null) },
    );
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    if (window.confirm('Remove this investment?')) {
      remove(id, { onSettled: () => setDeletingId(null) });
    } else {
      setDeletingId(null);
    }
  }

  const editingInv = investments.find(i => i.id === editingId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Investments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track your portfolio performance</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors self-end sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Investment
        </button>
      </div>

      {/* Summary cards */}
      {investments.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Portfolio Value"
            value={formatCurrency(summary.totalValue, currency)}
            sub="Current market value"
            icon={BarChart2}
            iconBg="bg-primary-50 dark:bg-primary-500/15"
            iconColor="text-primary-600"
          />
          <StatCard
            label="Total Cost"
            value={formatCurrency(summary.totalCost, currency)}
            sub="Amount invested"
            icon={DollarSign}
            iconBg="bg-slate-100 dark:bg-slate-700"
            iconColor="text-slate-600"
          />
          <StatCard
            label="Total P&L"
            value={formatCurrency(summary.totalGainLoss, currency)}
            sub={`${formatPercent(Math.abs(summary.totalGainLossPct))} ${isPositive ? 'gain' : 'loss'}`}
            icon={isPositive ? TrendingUp : TrendingDown}
            iconBg={isPositive ? 'bg-success-50 dark:bg-success-500/15' : 'bg-danger-50 dark:bg-danger-500/15'}
            iconColor={isPositive ? 'text-success-600' : 'text-danger-600'}
            positive={isPositive}
          />
          <StatCard
            label="Holdings"
            value={String(investments.length)}
            sub={`${summary.allocation.length} asset types`}
            icon={TrendingUp}
            iconBg="bg-warning-50 dark:bg-warning-500/15"
            iconColor="text-warning-600"
          />
        </div>
      )}

      {/* Asset Allocation */}
      {summary.allocation.length > 0 && (
        <div className="card p-5">
          <p className="text-base font-semibold text-slate-800 dark:text-white mb-4">Asset Allocation</p>
          <div className="space-y-3">
            {summary.allocation.map(item => (
              <div key={item.asset_type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(item.value, currency)}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 w-10 text-right">
                      {formatPercent(item.percentage)}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showForm && !editingId && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-semibold text-slate-800 dark:text-white">Add Investment</p>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <InvestmentForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              isPending={creating}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Holdings table */}
      <div className="card p-5">
        <p className="text-base font-semibold text-slate-800 dark:text-white mb-4">Holdings</p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            ))}
          </div>
        ) : investments.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No investments yet"
            message="Add your first holding to start tracking your portfolio."
          />
        ) : (
          <div className="space-y-2">
            {investments.map(inv => (
              <div key={inv.id}>
                {/* Edit form inline */}
                <AnimatePresence>
                  {editingId === inv.id && editingInv && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg mb-2"
                    >
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        Edit: {editingInv.name}
                      </p>
                      <InvestmentForm
                        defaultValues={{
                          asset_type:     editingInv.asset_type,
                          symbol:         editingInv.symbol ?? undefined,
                          name:           editingInv.name,
                          quantity:       editingInv.quantity,
                          purchase_price: editingInv.purchase_price,
                          current_price:  editingInv.current_price,
                          purchase_date:  editingInv.purchase_date,
                          notes:          editingInv.notes ?? undefined,
                        }}
                        onSubmit={values => handleUpdate(inv.id, values)}
                        onCancel={() => setEditingId(null)}
                        isPending={updating}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {editingId !== inv.id && (
                  <HoldingRow
                    inv={inv}
                    currency={currency}
                    onEdit={() => { setEditingId(inv.id); setShowForm(false); }}
                    onDelete={() => handleDelete(inv.id)}
                    isDeleting={deletingId === inv.id}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Holding row ───────────────────────────────────────────────

function HoldingRow({
  inv, currency, onEdit, onDelete, isDeleting,
}: {
  inv: InvestmentWithComputed;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const isGain = inv.gainLoss >= 0;

  return (
    <div className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 group transition-colors">
      {/* Color dot + type */}
      <div
        className="w-8 h-8 rounded-md flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: ASSET_COLORS[inv.asset_type] + '20' }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: ASSET_COLORS[inv.asset_type] }}
        />
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{inv.name}</p>
          {inv.symbol && (
            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded uppercase">
              {inv.symbol}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {inv.quantity} units · Bought {formatDate(inv.purchase_date)}
        </p>
      </div>

      {/* Financials */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          {formatCurrency(inv.currentValue, currency)}
        </p>
        <p className={cn(
          'text-xs font-medium',
          isGain ? 'text-success-600' : 'text-danger-600',
        )}>
          {isGain ? '+' : ''}{formatCurrency(inv.gainLoss, currency)}
          {' '}({isGain ? '+' : ''}{formatPercent(inv.gainLossPct)})
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-primary-500 transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="p-1.5 rounded hover:bg-danger-50 text-slate-400 hover:text-danger-500 transition-colors disabled:opacity-30"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

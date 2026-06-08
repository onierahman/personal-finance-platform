'use client';
import Link from 'next/link';
import { Trash2, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { useTransactions, useDeleteTransaction } from '@/features/transactions/hooks';
import { useUiStore }    from '@/stores/uiStore';
import { formatCurrency, formatDateShort } from '@/lib/formatters';
import { groupBy }       from '@/lib/utils';
import { TransactionSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState }    from '@/components/shared/EmptyState';
import { useToast }      from '@/components/ui/toaster';
import { useUser }       from '@/hooks/useUser';
import { cn }            from '@/lib/utils';
import type { Transaction } from '@/types';

interface TransactionRowProps {
  txn:       Transaction;
  currency:  string;
  onDelete?: (id: string) => void;
}

function TransactionRow({ txn, currency, onDelete }: TransactionRowProps) {
  const meta = txn.categoryMeta;
  return (
    <div className="flex items-center gap-3 py-2.5 group">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
        style={{ background: (meta?.color ?? '#94A3B8') + '18' }}
      >
        {meta?.icon ?? '📦'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {txn.merchant ?? txn.category}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {txn.category}{txn.note ? ` · ${txn.note}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className={cn(
          'amount text-sm font-semibold',
          txn.type === 'income' ? 'text-success-600' : 'text-slate-900',
        )}>
          {txn.type === 'income' ? '+' : '-'}
          {formatCurrency(txn.amount, currency)}
        </span>

        {onDelete && (
          <button
            onClick={() => onDelete(txn.id)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-danger-50 text-slate-300 hover:text-danger-500 transition-all"
            aria-label="Delete transaction"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Dashboard widget variant ──────────────────────────────────
interface RecentTransactionsProps {
  limit?: number;
}

export function RecentTransactions({ limit = 5 }: RecentTransactionsProps) {
  const { activeMonth } = useUiStore();
  const { user }        = useUser();
  const currency        = user?.currency ?? 'USD';
  const { data, isLoading } = useTransactions({ month: activeMonth, pageSize: limit });

  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <p className="section-title text-base">Recent</p>
        <Link href="/transactions" className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
          All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="divide-y divide-slate-50">
          {Array.from({ length: limit }).map((_, i) => <TransactionSkeleton key={i} />)}
        </div>
      ) : !data?.data?.length ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions"
          message="Tap + to add your first transaction."
        />
      ) : (
        <div className="divide-y divide-slate-50">
          {data.data.map(txn => (
            <TransactionRow key={txn.id} txn={txn} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Full transactions page list ───────────────────────────────
interface TransactionListProps {
  month?:     string;
  accountId?: string;
  category?:  string;
}

export function TransactionList({ month, accountId, category }: TransactionListProps) {
  const { activeMonth } = useUiStore();
  const { user }        = useUser();
  const currency        = user?.currency ?? 'USD';
  const { success, error: showError } = useToast();
  const deleteTxn       = useDeleteTransaction();

  const { data, isLoading } = useTransactions({
    month:     month ?? activeMonth,
    accountId,
    category,
  });

  async function handleDelete(id: string) {
    const res = await deleteTxn.mutateAsync(id);
    if (res.error) showError('Delete failed', res.error);
    else success('Transaction deleted');
  }

  if (isLoading) {
    return (
      <div className="card p-5 space-y-1">
        {Array.from({ length: 8 }).map((_, i) => <TransactionSkeleton key={i} />)}
      </div>
    );
  }

  const transactions = data?.data ?? [];

  if (!transactions.length) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="No transactions this month"
        message="Add your first transaction using the + button."
        className="card py-16"
      />
    );
  }

  // Group by date
  const grouped = groupBy(transactions, t => t.date);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-3">
      {sortedDates.map(date => (
        <div key={date} className="card p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
            {formatDateShort(date)}
          </p>
          <div className="divide-y divide-slate-50">
            {grouped[date].map(txn => (
              <TransactionRow key={txn.id} txn={txn} currency={currency} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

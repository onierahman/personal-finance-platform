'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { Trash2, ChevronRight, ArrowLeftRight, Pencil } from 'lucide-react';
import { useTransactions, useDeleteTransaction } from '@/features/transactions/hooks';
import { useUiStore }    from '@/stores/uiStore';
import { formatCurrency, formatDateShort } from '@/lib/formatters';
import { groupBy }       from '@/lib/utils';
import { haptic }        from '@/lib/haptics';
import { TransactionSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState }    from '@/components/shared/EmptyState';
import { useToast }      from '@/components/ui/toaster';
import { useUser }       from '@/hooks/useUser';
import { cn }            from '@/lib/utils';
import type { Transaction } from '@/types';

const SWIPE_OPEN   = -80; // resting x once the delete action is revealed
const SWIPE_COMMIT = -52; // drag past this (or fast flick) to reveal/commit
const LONG_PRESS_MS = 450;

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
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
          {txn.merchant ?? txn.category}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
          {txn.category}{txn.note ? ` · ${txn.note}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className={cn(
          'amount text-sm font-semibold',
          txn.type === 'income' ? 'text-success-600 dark:text-success-400' : 'text-slate-900 dark:text-white',
        )}>
          {txn.type === 'income' ? '+' : '-'}
          {formatCurrency(txn.amount, currency)}
        </span>

        {onDelete && (
          <button
            onClick={() => onDelete(txn.id)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-danger-50 dark:hover:bg-danger-500/15 text-slate-300 hover:text-danger-500 transition-all"
            aria-label="Delete transaction"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Swipeable / long-pressable row (mobile gestures) ──────────
interface SwipeableRowProps {
  txn:      Transaction;
  currency: string;
  onDelete: (id: string) => void;
  onEdit:   (id: string) => void;
}

/**
 * Wraps a transaction row with iOS-style interactions:
 *  • Swipe left to reveal a Delete action (flick fast to commit immediately).
 *  • Long-press to open an Edit / Delete context menu.
 * Desktop keeps the hover-to-delete affordance on the inner row.
 */
function SwipeableRow({ txn, currency, onDelete, onEdit }: SwipeableRowProps) {
  const controls            = useAnimationControls();
  const [open, setOpen]     = useState(false);
  const [menuOpen, setMenu] = useState(false);
  const pressTimer          = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggingRef         = useRef(false);

  function settle(toOpen: boolean) {
    setOpen(toOpen);
    controls.start({ x: toOpen ? SWIPE_OPEN : 0 });
  }

  function clearPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  function onPointerDown() {
    clearPress();
    pressTimer.current = setTimeout(() => {
      if (!draggingRef.current) {
        haptic('medium');
        setMenu(true);
      }
    }, LONG_PRESS_MS);
  }

  return (
    <div className="relative overflow-hidden">
      {/* Delete action revealed behind the row */}
      <button
        onClick={() => { haptic('warning'); onDelete(txn.id); }}
        className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-danger-500 text-white"
        aria-label="Delete transaction"
        tabIndex={open ? 0 : -1}
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <motion.div
        drag="x"
        dragConstraints={{ left: SWIPE_OPEN, right: 0 }}
        dragElastic={0.08}
        animate={controls}
        onDragStart={() => { draggingRef.current = true; clearPress(); }}
        onDragEnd={(_, info) => {
          draggingRef.current = false;
          const shouldOpen = info.offset.x < SWIPE_COMMIT || info.velocity.x < -500;
          if (shouldOpen && !open) haptic('light');
          settle(shouldOpen);
        }}
        onPointerDown={onPointerDown}
        onPointerUp={clearPress}
        onPointerCancel={clearPress}
        // Tapping an open row closes it instead of triggering anything else.
        onClickCapture={(e) => {
          if (open) { e.stopPropagation(); settle(false); }
        }}
        className="relative bg-white dark:bg-slate-900 touch-pan-y"
      >
        <TransactionRow txn={txn} currency={currency} onDelete={onDelete} />
      </motion.div>

      {/* Long-press context menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              className="absolute right-3 top-2 z-50 w-36 origin-top-right rounded-xl bg-white dark:bg-slate-800 shadow-dropdown border border-slate-100 dark:border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => { setMenu(false); onEdit(txn.id); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => { setMenu(false); haptic('warning'); onDelete(txn.id); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors border-t border-slate-100 dark:border-slate-700"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {Array.from({ length: limit }).map((_, i) => <TransactionSkeleton key={i} />)}
        </div>
      ) : !data?.data?.length ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions"
          message="Tap + to add your first transaction."
        />
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
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
  type?:      'expense' | 'income';
  search?:    string;
}

export function TransactionList({ month, accountId, category, type, search }: TransactionListProps) {
  const { activeMonth, openEditTransaction } = useUiStore();
  const { user }        = useUser();
  const currency        = user?.currency ?? 'USD';
  const { success, error: showError } = useToast();
  const deleteTxn       = useDeleteTransaction();

  const { data, isLoading } = useTransactions({
    month:     month ?? activeMonth,
    accountId,
    category,
    type,
    search,
  });

  async function handleDelete(id: string) {
    // Confirm before destroying financial data — consistent with budget/goal
    // deletes, and deletion is not reversible.
    const txn = (data?.data ?? []).find(t => t.id === id);
    const label = txn
      ? `${txn.merchant ?? txn.category} (${txn.type === 'income' ? '+' : '-'}${formatCurrency(txn.amount, currency)})`
      : 'this transaction';
    if (!confirm(`Delete ${label}? This can't be undone.`)) return;

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
    <div className="card p-4 space-y-1">
      {sortedDates.map((date, idx) => (
        <div key={date}>
          {idx > 0 && <div className="border-t border-slate-100 dark:border-slate-800 mt-2 mb-1" />}
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide py-1.5">
            {formatDateShort(date)}
          </p>
          <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
            {grouped[date].map(txn => (
              <SwipeableRow
                key={txn.id}
                txn={txn}
                currency={currency}
                onDelete={handleDelete}
                onEdit={openEditTransaction}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
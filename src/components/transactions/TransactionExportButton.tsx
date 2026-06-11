'use client';

import { useState } from 'react';
import { Download, FileText, Sheet, ChevronDown, Loader2 } from 'lucide-react';
import { fetchAllTransactions } from '@/features/transactions/api';
import { exportTransactionsCSV, exportTransactionsPDF } from '@/lib/export';
import { currentYearMonth } from '@/lib/formatters';
import { useUser } from '@/hooks/useUser';
import type { TransactionType } from '@/types';

interface Props {
  month?:    string;
  type?:     TransactionType;
  category?: string;
  search?:   string;
}

export function TransactionExportButton({ month, type, category, search }: Props) {
  const { user }        = useUser();
  const currency        = user?.currency ?? 'USD';
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleExport(fmt: 'csv' | 'pdf') {
    setBusy(true);
    setOpen(false);
    try {
      const result = await fetchAllTransactions({
        month:    month ?? currentYearMonth(),
        type,
        category,
        search,
      });
      const txns = result.data ?? [];
      const title = `Transactions — ${month ?? currentYearMonth()}`;
      if (fmt === 'csv') exportTransactionsCSV(txns);
      else await exportTransactionsPDF(txns, title, currency);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        disabled={busy}
        className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
      >
        {busy
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Download className="w-4 h-4" />
        }
        Export
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-20 w-44 card shadow-dropdown py-1.5">
            <button
              onClick={() => handleExport('csv')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Sheet className="w-4 h-4 text-green-600" /> Export CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <FileText className="w-4 h-4 text-red-500" /> Export PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}

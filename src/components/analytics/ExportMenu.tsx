'use client';

import { useState } from 'react';
import { Download, FileText, Sheet, ChevronDown, Loader2 } from 'lucide-react';
import {
  exportMonthlySummaryCSV,
  exportCategoryTrendsCSV,
  exportBudgetPerformanceCSV,
  exportTopMerchantsCSV,
  exportMonthlySummaryPDF,
  exportCategoryTrendsPDF,
  exportBudgetPerformancePDF,
  exportTopMerchantsPDF,
} from '@/lib/export';
import type { MonthSummary, CategoryTrend, BudgetPerformance, MerchantSummary } from '@/features/analytics/types';

type ExportFormat = 'csv' | 'pdf';

interface ExportOption {
  label:    string;
  formats:  ExportFormat[];
  onExport: (format: ExportFormat) => Promise<void>;
}

interface Props {
  currency:      string;
  monthlySummary?:  MonthSummary[];
  categoryTrends?:  CategoryTrend[];
  budgetPerf?:      BudgetPerformance[];
  topMerchants?:    MerchantSummary[];
  activeTab?:       string;
}

export function ExportMenu({
  currency,
  monthlySummary = [],
  categoryTrends = [],
  budgetPerf     = [],
  topMerchants   = [],
  activeTab      = 'overview',
}: Props) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const options: ExportOption[] = [
    {
      label:   'Monthly Summary',
      formats: ['csv', 'pdf'],
      onExport: async (fmt) => {
        if (!monthlySummary.length) return;
        if (fmt === 'csv') exportMonthlySummaryCSV(monthlySummary, currency);
        else await exportMonthlySummaryPDF(monthlySummary, currency);
      },
    },
    {
      label:   'Category Trends',
      formats: ['csv', 'pdf'],
      onExport: async (fmt) => {
        if (!categoryTrends.length) return;
        if (fmt === 'csv') exportCategoryTrendsCSV(categoryTrends, currency);
        else await exportCategoryTrendsPDF(categoryTrends, 'expense', currency);
      },
    },
    {
      label:   'Budget Performance',
      formats: ['csv', 'pdf'],
      onExport: async (fmt) => {
        if (!budgetPerf.length) return;
        if (fmt === 'csv') exportBudgetPerformanceCSV(budgetPerf);
        else await exportBudgetPerformancePDF(budgetPerf, currency);
      },
    },
    {
      label:   'Top Merchants',
      formats: ['csv', 'pdf'],
      onExport: async (fmt) => {
        if (!topMerchants.length) return;
        if (fmt === 'csv') exportTopMerchantsCSV(topMerchants);
        else await exportTopMerchantsPDF(topMerchants, currency);
      },
    },
  ];

  async function handleExport(option: ExportOption, fmt: ExportFormat) {
    const key = `${option.label}-${fmt}`;
    setLoading(key);
    setOpen(false);
    try {
      await option.onExport(fmt);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        Export
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-20 w-64 card shadow-dropdown py-1.5">
            <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Export Report
            </p>
            {options.map(opt => (
              <div key={opt.label} className="px-1">
                <div className="px-2 py-1.5">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{opt.label}</p>
                  <div className="flex gap-2">
                    {opt.formats.includes('csv') && (
                      <button
                        onClick={() => handleExport(opt, 'csv')}
                        disabled={!!loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
                      >
                        <Sheet className="w-3 h-3" />
                        CSV
                      </button>
                    )}
                    {opt.formats.includes('pdf') && (
                      <button
                        onClick={() => handleExport(opt, 'pdf')}
                        disabled={!!loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <FileText className="w-3 h-3" />
                        PDF
                      </button>
                    )}
                  </div>
                </div>
                <div className="border-t border-slate-100 my-1 last:hidden" />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

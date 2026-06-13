'use client';

import { useState }               from 'react';
import { SpendingTrendChart }     from '@/components/analytics/SpendingTrendChart';
import { SavingsRateChart }       from '@/components/analytics/SavingsRateChart';
import { CashFlowChart }          from '@/components/analytics/CashFlowChart';
import { CategoryTrendsChart }    from '@/components/analytics/CategoryTrendsChart';
import { BudgetPerformanceChart } from '@/components/analytics/BudgetPerformanceChart';
import { TopMerchantsTable }      from '@/components/analytics/TopMerchantsTable';
import { SpendingHeatmap }        from '@/components/analytics/SpendingHeatmap';
import { OverviewStats }          from '@/components/analytics/OverviewStats';
import { ExportMenu }             from '@/components/analytics/ExportMenu';
import { useMultiMonthSummary, useCategoryTrends, useBudgetPerformance, useTopMerchants } from '@/features/analytics/hooks';
import { useUser }                from '@/hooks/useUser';
import { ANALYTICS_PERIODS }     from '@/features/analytics/types';
import type { MonthSummary, CategoryTrend, BudgetPerformance, MerchantSummary } from '@/features/analytics/types';

const TABS = [
  { id: 'overview',   label: 'Overview'  },
  { id: 'spending',   label: 'Spending'  },
  { id: 'income',     label: 'Income'    },
  { id: 'budgets',    label: 'Budgets'   },
  { id: 'merchants',  label: 'Merchants' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AnalyticsPage() {
  const { user }         = useUser();
  const currency         = user?.currency ?? 'USD';
  const [tab, setTab]    = useState<TabId>('overview');
  const [months, setMonths] = useState(6);

  // Prefetch data for export
  const summaryQ   = useMultiMonthSummary(months);
  const expCatQ    = useCategoryTrends(months, 'expense');
  const incCatQ    = useCategoryTrends(months, 'income');
  const budgetQ    = useBudgetPerformance(months);
  const merchantQ  = useTopMerchants(months, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Financial insights and trends
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {ANALYTICS_PERIODS.map(p => (
              <button
                key={p.months}
                onClick={() => setMonths(p.months)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  months === p.months
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <ExportMenu
            currency={currency}
            monthlySummary={summaryQ.data?.data as MonthSummary[] ?? []}
            categoryTrends={expCatQ.data?.data as CategoryTrend[] ?? []}
            budgetPerf={budgetQ.data?.data as BudgetPerformance[] ?? []}
            topMerchants={merchantQ.data?.data as MerchantSummary[] ?? []}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <OverviewStats months={months} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SpendingTrendChart months={months} />
            <SavingsRateChart months={months} />
          </div>
          <CashFlowChart months={months} />
        </div>
      )}

      {tab === 'spending' && (
        <div className="space-y-6">
          <SpendingHeatmap months={months} />
          <CategoryTrendsChart months={months} type="expense" />
          <TopMerchantsTable months={months} />
        </div>
      )}

      {tab === 'income' && (
        <div className="space-y-6">
          <CategoryTrendsChart months={months} type="income" />
        </div>
      )}

      {tab === 'budgets' && (
        <div className="space-y-6">
          <BudgetPerformanceChart months={months} />
        </div>
      )}

      {tab === 'merchants' && (
        <div className="space-y-6">
          <TopMerchantsTable months={months} />
        </div>
      )}
    </div>
  );
}

'use client';

import { SummaryCards }       from '@/components/dashboard/SummaryCards';
import { SpendingChart }      from '@/components/dashboard/SpendingChart';
import { BudgetHealth }       from '@/components/dashboard/BudgetHealth';
import { UpcomingBills }      from '@/components/dashboard/UpcomingBills';
import { NetWorthCard }       from '@/components/dashboard/NetWorthCard';
import { CategoryBreakdown }  from '@/components/dashboard/CategoryBreakdown';
import { RecentTransactions } from '@/components/transactions/TransactionList';
import { SavingsGoalsList }   from '@/components/goals/SavingsGoalsList';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Row 1: Financial Snapshot */}
      <SummaryCards />

      {/* Row 2: Spending chart + Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SpendingChart />
        </div>
        <CategoryBreakdown />
      </div>

      {/* Row 3: Net Worth + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NetWorthCard />
        <RecentTransactions limit={5} />
      </div>

      {/* Row 4: Financial Planning Matrix
          items-start prevents height-stretch voids between unequal-height cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        <BudgetHealth />
        <UpcomingBills />
        <SavingsGoalsList />
      </div>
    </div>
  );
}

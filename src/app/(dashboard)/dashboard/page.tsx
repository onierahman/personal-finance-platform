'use client';

import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { BudgetHealth } from '@/components/dashboard/BudgetHealth';
import { UpcomingBills } from '@/components/dashboard/UpcomingBills';
import { RecentTransactions } from '@/components/transactions/TransactionList';
import { SavingsGoalsList } from '@/components/goals/SavingsGoalsList';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Summary row */}
      <SummaryCards />

      {/* Chart + recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SpendingChart />
        </div>
        <div>
          <RecentTransactions limit={5} />
        </div>
      </div>

      {/* Financial Planning Matrix: Budget health, upcoming bills + savings goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <BudgetHealth />
        <UpcomingBills />
        <div className="md:col-span-2 lg:col-span-1">
          <SavingsGoalsList />
        </div>
      </div>
    </div>
  );
}
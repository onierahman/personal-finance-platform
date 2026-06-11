'use client';

import { useQueryClient } from '@tanstack/react-query';
import { SummaryCards }       from '@/components/dashboard/SummaryCards';
import { SpendingChart }      from '@/components/dashboard/SpendingChart';
import { BudgetHealth }       from '@/components/dashboard/BudgetHealth';
import { UpcomingBills }      from '@/components/dashboard/UpcomingBills';
import { NetWorthCard }       from '@/components/dashboard/NetWorthCard';
import { CategoryBreakdown }  from '@/components/dashboard/CategoryBreakdown';
import { RecentTransactions } from '@/components/transactions/TransactionList';
import { SavingsGoalsList }   from '@/components/goals/SavingsGoalsList';
import { Stagger, StaggerItem } from '@/components/shared/Stagger';
import { PullToRefresh }      from '@/components/shared/PullToRefresh';

export default function DashboardPage() {
  const queryClient = useQueryClient();

  // Pull-to-refresh: refetch every active query feeding the dashboard.
  const handleRefresh = () => queryClient.invalidateQueries();

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <Stagger className="space-y-6">
        {/* Row 1: Financial Snapshot */}
        <StaggerItem>
          <SummaryCards />
        </StaggerItem>

        {/* Row 2: Spending chart + Category breakdown */}
        <StaggerItem>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <SpendingChart />
            </div>
            <CategoryBreakdown />
          </div>
        </StaggerItem>

        {/* Row 3: Net Worth + Recent Transactions */}
        <StaggerItem>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <NetWorthCard />
            <RecentTransactions limit={5} />
          </div>
        </StaggerItem>

        {/* Row 4: Financial Planning Matrix
            items-start prevents height-stretch voids between unequal-height cards */}
        <StaggerItem>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            <BudgetHealth />
            <UpcomingBills />
            <SavingsGoalsList />
          </div>
        </StaggerItem>
      </Stagger>
    </PullToRefresh>
  );
}

import { SummaryCards }  from '@/components/dashboard/SummaryCards';
import { SpendingChart }  from '@/components/dashboard/SpendingChart';
import { BudgetHealth }   from '@/components/dashboard/BudgetHealth';
import { UpcomingBills }  from '@/components/dashboard/UpcomingBills';
import { RecentTransactions } from '@/components/transactions/TransactionList';

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

      {/* Budget health + upcoming bills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BudgetHealth />
        <UpcomingBills />
      </div>
    </div>
  );
}

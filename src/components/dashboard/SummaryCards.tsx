'use client';
import { TrendingUp, TrendingDown, BarChart2, PiggyBank } from 'lucide-react';
import { useMonthlySummary } from '@/features/transactions/hooks';
import { usePortfolioSummary } from '@/features/investments/hooks';
import { useUiStore }        from '@/stores/uiStore';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { CardSkeleton }      from '@/components/shared/LoadingSkeleton';
import { cn }                from '@/lib/utils';
import { useUser }           from '@/hooks/useUser';

interface StatCardProps {
  label:    string;
  value:    string;
  sub?:     string;
  icon:     React.ElementType;
  iconBg:   string;
  iconColor:string;
  trend?:   'up' | 'down' | 'neutral';
}

function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, trend }: StatCardProps) {
  return (
    <div className="card p-5 hover-lift">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            trend === 'up'   ? 'bg-success-50 dark:bg-success-500/15 text-success-600 dark:text-success-400' :
            trend === 'down' ? 'bg-danger-50 dark:bg-danger-500/15 text-danger-600 dark:text-danger-400'   :
                               'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
          )}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'}
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="amount text-2xl font-semibold text-slate-900 dark:text-white mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export function SummaryCards() {
  const { activeMonth }    = useUiStore();
  const { user }           = useUser();
  const currency           = user?.currency ?? 'USD';
  const { data, isLoading }        = useMonthlySummary(activeMonth);
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolioSummary();

  if (isLoading || portfolioLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  const summary = data?.data;
  const fmt = (n: number) => formatCurrency(n, currency);

  const portfolioValue   = portfolio?.totalValue    ?? 0;
  const portfolioGainLoss = portfolio?.totalGainLoss ?? 0;
  const gainLossSign     = portfolioGainLoss >= 0 ? '+' : '';
  const portfolioSub     = portfolio
    ? `${gainLossSign}${fmt(portfolioGainLoss)} total P&L`
    : 'Portfolio value';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Income"
        value={fmt(summary?.income ?? 0)}
        sub="This month"
        icon={TrendingUp}
        iconBg="bg-success-50"
        iconColor="text-success-600"
        trend="up"
      />
      <StatCard
        label="Expenses"
        value={fmt(summary?.expenses ?? 0)}
        sub="This month"
        icon={TrendingDown}
        iconBg="bg-danger-50"
        iconColor="text-danger-600"
        trend="down"
      />
      <StatCard
        label="Savings"
        value={fmt(summary?.savings ?? 0)}
        sub={summary ? `${formatPercent(summary.savingsRate)} rate` : undefined}
        icon={PiggyBank}
        iconBg="bg-primary-50"
        iconColor="text-primary-600"
        trend="neutral"
      />
      <StatCard
        label="Investments"
        value={fmt(portfolioValue)}
        sub={portfolioSub}
        icon={BarChart2}
        iconBg="bg-primary-50"
        iconColor="text-primary-700"
        trend={portfolioGainLoss > 0 ? 'up' : portfolioGainLoss < 0 ? 'down' : 'neutral'}
      />
    </div>
  );
}

'use client';

import Link from 'next/link';
import { ChevronRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useAccounts } from '@/features/accounts/api';
import { useInvestments } from '@/features/investments/hooks';
import { formatCurrency } from '@/lib/formatters';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';

const ASSET_TYPES   = new Set(['checking', 'savings', 'cash', 'investment']);
const LIABILITY_TYPES = new Set(['credit_card', 'loan']);

export function NetWorthCard() {
  const { user } = useUser();
  const currency = user?.currency ?? 'USD';

  const { data: accountsRes, isLoading: loadingAccounts } = useAccounts();
  const { data: investments = [], isLoading: loadingInv }  = useInvestments();

  const isLoading = loadingAccounts || loadingInv;
  const accounts  = accountsRes?.data ?? [];

  // Assets: sum of asset-type account balances + investment portfolio value
  const accountAssets = accounts
    .filter(a => ASSET_TYPES.has(a.type))
    .reduce((sum, a) => sum + Number(a.balance), 0);

  const portfolioValue = investments.reduce(
    (sum, inv) => sum + Number(inv.quantity) * Number(inv.current_price), 0,
  );

  // De-duplicate: investment-type accounts often hold the same money as
  // the portfolio; if both exist, favour the live portfolio sum.
  const hasInvestmentAccount = accounts.some(a => a.type === 'investment');
  const investmentAccountBalance = accounts
    .filter(a => a.type === 'investment')
    .reduce((sum, a) => sum + Number(a.balance), 0);

  const totalAssets = accountAssets
    - (hasInvestmentAccount ? investmentAccountBalance : 0)
    + portfolioValue;

  const totalLiabilities = accounts
    .filter(a => LIABILITY_TYPES.has(a.type))
    .reduce((sum, a) => sum + Math.abs(Number(a.balance)), 0);

  const netWorth = totalAssets - totalLiabilities;

  if (isLoading) {
    return (
      <div className="card p-5 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-base font-semibold text-slate-800 dark:text-slate-100">Net Worth</p>
        <Link
          href="/net-worth"
          className="text-xs text-primary-600 hover:underline flex items-center gap-0.5"
        >
          Details <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Big net worth figure */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-500/15 flex items-center justify-center">
          <Wallet className="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-none">Total Net Worth</p>
          <p className={cn(
            'text-xl font-bold mt-0.5',
            netWorth >= 0 ? 'text-slate-900 dark:text-white' : 'text-danger-600 dark:text-danger-400',
          )}>
            {formatCurrency(netWorth, currency)}
          </p>
        </div>
      </div>

      {/* Assets / Liabilities breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-success-50 dark:bg-success-500/10 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-success-600 dark:text-success-400" />
            <p className="text-xs text-success-700 dark:text-success-400 font-medium">Assets</p>
          </div>
          <p className="text-sm font-bold text-success-800 dark:text-success-300">
            {formatCurrency(totalAssets, currency)}
          </p>
        </div>

        <div className="p-3 bg-danger-50 dark:bg-danger-500/10 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-danger-600 dark:text-danger-400" />
            <p className="text-xs text-danger-700 dark:text-danger-400 font-medium">Liabilities</p>
          </div>
          <p className="text-sm font-bold text-danger-800 dark:text-danger-300">
            {formatCurrency(totalLiabilities, currency)}
          </p>
        </div>
      </div>
    </div>
  );
}

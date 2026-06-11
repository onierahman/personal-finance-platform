'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Wallet, Building,
  CreditCard, PiggyBank, Briefcase, DollarSign,
} from 'lucide-react';
import { useAccounts } from '@/features/accounts/api';
import { useInvestments } from '@/features/investments/hooks';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';
import type { AccountType } from '@/types/database';

// ── Constants ─────────────────────────────────────────────────

const ASSET_TYPES     = new Set<AccountType>(['checking', 'savings', 'cash', 'investment']);
const LIABILITY_TYPES = new Set<AccountType>(['credit_card', 'loan']);

const ACCOUNT_TYPE_ICONS: Record<AccountType, React.ElementType> = {
  checking:    DollarSign,
  savings:     PiggyBank,
  cash:        Wallet,
  investment:  Briefcase,
  credit_card: CreditCard,
  loan:        Building,
  other:       Wallet,
};

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking:    'Checking',
  savings:     'Savings',
  cash:        'Cash',
  investment:  'Investment Account',
  credit_card: 'Credit Cards',
  loan:        'Loans',
  other:       'Other',
};

// ── Sub-components ────────────────────────────────────────────

function SummaryCard({
  label, value, sub, icon: Icon, iconBg, iconColor, negative,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
  negative?: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className={cn(
        'text-2xl font-bold',
        negative ? 'text-danger-600' : 'text-slate-900 dark:text-white',
      )}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────

export default function NetWorthPage() {
  const { user } = useUser();
  const currency = user?.currency ?? 'USD';

  const { data: accountsRes, isLoading: loadingAccounts } = useAccounts();
  const { data: investments = [], isLoading: loadingInv }  = useInvestments();

  const isLoading = loadingAccounts || loadingInv;
  const accounts  = accountsRes?.data ?? [];

  // ── Calculations ──────────────────────────────────────────

  const assetAccounts     = accounts.filter(a => ASSET_TYPES.has(a.type));
  const liabilityAccounts = accounts.filter(a => LIABILITY_TYPES.has(a.type));

  // Live portfolio value from investments table
  const portfolioValue = investments.reduce(
    (s, inv) => s + Number(inv.quantity) * Number(inv.current_price), 0,
  );

  // Sum account balances, excluding investment-type accounts that duplicate portfolio
  const hasInvAccounts = accounts.some(a => a.type === 'investment');
  const invAccountTotal = accounts
    .filter(a => a.type === 'investment')
    .reduce((s, a) => s + Number(a.balance), 0);

  const liquidAssets = assetAccounts
    .filter(a => a.type !== 'investment')
    .reduce((s, a) => s + Number(a.balance), 0);

  const totalAssets = liquidAssets + portfolioValue;
  const totalLiabilities = liabilityAccounts
    .reduce((s, a) => s + Math.abs(Number(a.balance)), 0);
  const netWorth = totalAssets - totalLiabilities;

  // Asset composition (for allocation bar)
  interface AssetGroup { label: string; value: number; color: string }
  const assetGroups: AssetGroup[] = [
    { label: 'Liquid (Bank)',  value: liquidAssets,   color: '#2563EB' },
    { label: 'Investments',   value: portfolioValue,  color: '#22C55E' },
  ].filter(g => g.value > 0);

  // Group liability accounts by type
  const liabilityByType = liabilityAccounts.reduce<Record<string, { total: number; accounts: typeof liabilityAccounts }>>(
    (acc, a) => {
      const key = a.type;
      if (!acc[key]) acc[key] = { total: 0, accounts: [] };
      acc[key].total += Math.abs(Number(a.balance));
      acc[key].accounts.push(a);
      return acc;
    }, {},
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5 h-32 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Net Worth</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Assets minus liabilities — your true financial position
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          label="Total Assets"
          value={formatCurrency(totalAssets, currency)}
          sub="Liquid + portfolio"
          icon={TrendingUp}
          iconBg="bg-success-50 dark:bg-success-500/15"
          iconColor="text-success-600"
        />
        <SummaryCard
          label="Total Liabilities"
          value={formatCurrency(totalLiabilities, currency)}
          sub="Cards + loans"
          icon={TrendingDown}
          iconBg="bg-danger-50 dark:bg-danger-500/15"
          iconColor="text-danger-600"
          negative={totalLiabilities > 0}
        />
        <SummaryCard
          label="Net Worth"
          value={formatCurrency(netWorth, currency)}
          sub={netWorth >= 0 ? 'Positive net worth' : 'Negative net worth'}
          icon={Wallet}
          iconBg={netWorth >= 0 ? 'bg-primary-50 dark:bg-primary-500/15' : 'bg-danger-50 dark:bg-danger-500/15'}
          iconColor={netWorth >= 0 ? 'text-primary-600' : 'text-danger-600'}
          negative={netWorth < 0}
        />
      </div>

      {/* Asset composition */}
      {totalAssets > 0 && (
        <div className="card p-5">
          <p className="text-base font-semibold text-slate-800 dark:text-white mb-4">Asset Composition</p>

          {/* Stacked progress bar */}
          <div className="h-4 rounded-full overflow-hidden flex mb-3">
            {assetGroups.map(g => (
              <motion.div
                key={g.label}
                className="h-full"
                style={{ backgroundColor: g.color }}
                initial={{ flex: 0 }}
                animate={{ flex: totalAssets > 0 ? g.value / totalAssets : 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            {assetGroups.map(g => (
              <div key={g.label} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: g.color }}
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">{g.label}</span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(g.value, currency)}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  ({formatPercent(totalAssets > 0 ? g.value / totalAssets : 0)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets breakdown */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-success-600" />
            <p className="text-base font-semibold text-slate-800 dark:text-white">Assets</p>
            <span className="ml-auto text-sm font-bold text-success-700 dark:text-success-500">
              {formatCurrency(totalAssets, currency)}
            </span>
          </div>

          {assetAccounts.length === 0 && portfolioValue === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">No asset accounts found.</p>
          ) : (
            <div className="space-y-3">
              {/* Bank accounts */}
              {assetAccounts.filter(a => a.type !== 'investment').map(account => {
                const Icon = ACCOUNT_TYPE_ICONS[account.type];
                const pct  = totalAssets > 0 ? Number(account.balance) / totalAssets : 0;
                return (
                  <AccountRow
                    key={account.id}
                    icon={Icon}
                    label={account.name}
                    sublabel={ACCOUNT_TYPE_LABELS[account.type]}
                    value={Number(account.balance)}
                    pct={pct}
                    barColor="#2563EB"
                    currency={currency}
                  />
                );
              })}

              {/* Portfolio */}
              {portfolioValue > 0 && (
                <AccountRow
                  icon={Briefcase}
                  label="Investment Portfolio"
                  sublabel={`${investments.length} holding${investments.length !== 1 ? 's' : ''}`}
                  value={portfolioValue}
                  pct={totalAssets > 0 ? portfolioValue / totalAssets : 0}
                  barColor="#22C55E"
                  currency={currency}
                />
              )}
            </div>
          )}
        </div>

        {/* Liabilities breakdown */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-danger-600" />
            <p className="text-base font-semibold text-slate-800 dark:text-white">Liabilities</p>
            <span className="ml-auto text-sm font-bold text-danger-700 dark:text-danger-400">
              {formatCurrency(totalLiabilities, currency)}
            </span>
          </div>

          {liabilityAccounts.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
              No liabilities — great financial health!
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(liabilityByType).map(([type, { total, accounts: accs }]) => {
                const Icon = ACCOUNT_TYPE_ICONS[type as AccountType] ?? CreditCard;
                return accs.map(account => {
                  const pct = totalLiabilities > 0
                    ? Math.abs(Number(account.balance)) / totalLiabilities
                    : 0;
                  return (
                    <AccountRow
                      key={account.id}
                      icon={Icon}
                      label={account.name}
                      sublabel={ACCOUNT_TYPE_LABELS[type as AccountType]}
                      value={Math.abs(Number(account.balance))}
                      pct={pct}
                      barColor="#EF4444"
                      currency={currency}
                      isLiability
                    />
                  );
                });
              })}
            </div>
          )}
        </div>
      </div>

      {/* Investment holdings summary */}
      {investments.length > 0 && (
        <div className="card p-5">
          <p className="text-base font-semibold text-slate-800 dark:text-white mb-4">
            Investment Holdings ({investments.length})
          </p>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {investments.map(inv => {
              const value   = Number(inv.quantity) * Number(inv.current_price);
              const gainLoss = value - Number(inv.quantity) * Number(inv.purchase_price);
              const isGain  = gainLoss >= 0;
              const pct     = Number(inv.quantity) * Number(inv.purchase_price) > 0
                ? gainLoss / (Number(inv.quantity) * Number(inv.purchase_price))
                : 0;
              return (
                <div key={inv.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{inv.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-mono">
                      {inv.symbol ?? inv.asset_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatCurrency(value, currency)}
                    </p>
                    <p className={cn(
                      'text-xs font-medium',
                      isGain ? 'text-success-600' : 'text-danger-600',
                    )}>
                      {isGain ? '+' : ''}{formatCurrency(gainLoss, currency)}
                      {' '}({isGain ? '+' : ''}{formatPercent(pct)})
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Account row shared component ──────────────────────────────

function AccountRow({
  icon: Icon, label, sublabel, value, pct, barColor, currency, isLiability,
}: {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  value: number;
  pct: number;
  barColor: string;
  currency: string;
  isLiability?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: barColor + '15' }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: barColor }} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{sublabel}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            'text-sm font-semibold',
            isLiability ? 'text-danger-600' : 'text-slate-900 dark:text-white',
          )}>
            {isLiability ? '-' : ''}{formatCurrency(value, currency)}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{formatPercent(pct)}</p>
        </div>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden ml-9">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

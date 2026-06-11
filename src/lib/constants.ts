// ============================================================
// constants.ts
// Shared constants: categories, colors, nav, config
// ============================================================

export const EXPENSE_CATEGORIES = [
  { name: 'Housing',       icon: '🏠', color: '#6366F1' },
  { name: 'Utilities',     icon: '⚡', color: '#F59E0B' },
  { name: 'Groceries',     icon: '🛒', color: '#22C55E' },
  { name: 'Dining',        icon: '🍔', color: '#F97316' },
  { name: 'Transportation',icon: '🚗', color: '#3B82F6' },
  { name: 'Shopping',      icon: '🛍️', color: '#EC4899' },
  { name: 'Health',        icon: '❤️', color: '#EF4444' },
  { name: 'Insurance',     icon: '🛡️', color: '#8B5CF6' },
  { name: 'Education',     icon: '📚', color: '#06B6D4' },
  { name: 'Entertainment', icon: '🎬', color: '#A855F7' },
  { name: 'Travel',        icon: '✈️', color: '#0EA5E9' },
  { name: 'Subscriptions', icon: '📱', color: '#64748B' },
  { name: 'Personal Care', icon: '💅', color: '#F472B6' },
  { name: 'Fitness',       icon: '💪', color: '#10B981' },
  { name: 'Taxes',         icon: '📋', color: '#DC2626' },
  { name: 'Investments',   icon: '📈', color: '#2563EB' },
  { name: 'Gifts',         icon: '🎁', color: '#D97706' },
  { name: 'Other',         icon: '📦', color: '#94A3B8' },
] as const;

export const INCOME_CATEGORIES = [
  { name: 'Salary',       icon: '💼', color: '#22C55E' },
  { name: 'Freelance',    icon: '💻', color: '#06B6D4' },
  { name: 'Business',     icon: '🏢', color: '#6366F1' },
  { name: 'Rental',       icon: '🏘️', color: '#F97316' },
  { name: 'Dividends',    icon: '💹', color: '#2563EB' },
  { name: 'Interest',     icon: '🏦', color: '#0EA5E9' },
  { name: 'Bonus',        icon: '🎉', color: '#A855F7' },
  { name: 'Side Income',  icon: '💰', color: '#D97706' },
  { name: 'Other Income', icon: '💵', color: '#94A3B8' },
] as const;

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function getCategoryMeta(name: string) {
  return ALL_CATEGORIES.find(c => c.name === name) ?? { name, icon: '📦', color: '#94A3B8' };
}

// Budget health thresholds
export const BUDGET_THRESHOLDS = {
  safe:    0.70, // < 70%
  warning: 0.90, // 70–90%
  danger:  1.00, // 90–100%
  // over: > 100%
} as const;

export function getBudgetHealth(ratio: number): 'safe' | 'warning' | 'danger' | 'over' {
  if (ratio < BUDGET_THRESHOLDS.safe)    return 'safe';
  if (ratio < BUDGET_THRESHOLDS.warning) return 'warning';
  if (ratio < BUDGET_THRESHOLDS.danger)  return 'danger';
  return 'over';
}

// Currency
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
] as const;

export const CURRENCY_SYMBOLS: Record<string, string> = Object.fromEntries(
  CURRENCIES.map(c => [c.code, c.symbol]),
);

// Account types with labels
export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking:     'Checking',
  savings:      'Savings',
  credit_card:  'Credit Card',
  investment:   'Investment',
  cash:         'Cash',
  loan:         'Loan',
  other:        'Other',
};

// Recurring frequency labels
export const FREQUENCY_LABELS: Record<string, string> = {
  daily:     'Daily',
  weekly:    'Weekly',
  biweekly:  'Every 2 weeks',
  monthly:   'Monthly',
  quarterly: 'Every 3 months',
  yearly:    'Yearly',
};

// Nav items (used by Sidebar + MobileNav)
export const NAV_ITEMS = [
  { href: '/',              label: 'Dashboard',    icon: 'LayoutDashboard' },
  { href: '/transactions',  label: 'Transactions', icon: 'ArrowLeftRight'  },
  { href: '/accounts',      label: 'Accounts',     icon: 'Landmark'        },
  { href: '/budgets',       label: 'Budgets',      icon: 'PieChart'        },
  { href: '/goals',         label: 'Goals',        icon: 'Target'          },
  { href: '/investments',   label: 'Investments',  icon: 'TrendingUp'      },
  { href: '/net-worth',     label: 'Net Worth',    icon: 'BarChart3'       },
  { href: '/recurring',     label: 'Recurring',    icon: 'RefreshCw'       },
  { href: '/analytics',     label: 'Analytics',    icon: 'LineChart'       },
] as const;

// Routes that are conceptually "home" — the dashboard lives at /dashboard but
// is also reachable via / (which redirects). Used for nav active-state + title.
export const DASHBOARD_PATHS = ['/', '/dashboard'];

// Extra titles for routes not present in the primary nav.
const EXTRA_PAGE_TITLES: Record<string, string> = {
  '/settings': 'Settings',
};

/**
 * Human-readable title for the current route, used by the mobile large-title
 * header. Falls back to the matching nav label, then an extras map.
 */
export function getPageTitle(pathname: string): string {
  if (DASHBOARD_PATHS.includes(pathname)) return 'Dashboard';
  const nav = NAV_ITEMS.find(i => i.href !== '/' && pathname.startsWith(i.href));
  if (nav) return nav.label;
  const extra = Object.keys(EXTRA_PAGE_TITLES).find(p => pathname.startsWith(p));
  return extra ? EXTRA_PAGE_TITLES[extra] : 'FinanceOS';
}

/**
 * Whether the mobile collapsing large title should render for this route.
 * Only the dashboard lacks its own in-page heading, so it's the one screen
 * that benefits from the large-title treatment — every other page already
 * renders its own header, and showing both would duplicate the title.
 */
export function showsMobileLargeTitle(pathname: string): boolean {
  return DASHBOARD_PATHS.includes(pathname);
}

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// Design tokens (mirrored in CSS — source of truth)
export const COLORS = {
  primary:    '#2563EB',
  success:    '#22C55E',
  warning:    '#F59E0B',
  danger:     '#EF4444',
  text:       '#0F172A',
  textMuted:  '#64748B',
  background: '#F8FAFC',
  card:       '#FFFFFF',
  border:     '#E2E8F0',
} as const;

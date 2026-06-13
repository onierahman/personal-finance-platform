// Static, client-only data powering the public interactive demo and the
// landing "see it in action" showcase. No backend, no auth — everything
// here lives in memory and resets on refresh.

export interface DemoTxn {
  id: string;
  merchant: string;
  category: string;
  icon: string;
  amount: number;
  type: 'expense' | 'income';
  date: string; // yyyy-MM-dd
}

export interface DemoBudget {
  category: string;
  icon: string;
  limit: number;
}

export const DEMO_CURRENCY = 'USD';

// Expense categories offered in the demo QuickAdd (subset of the real app).
export const DEMO_CATEGORIES: { name: string; icon: string }[] = [
  { name: 'Groceries', icon: '🛒' },
  { name: 'Dining', icon: '🍜' },
  { name: 'Transport', icon: '🚇' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'Entertainment', icon: '🎬' },
  { name: 'Health', icon: '❤️' },
];

export const DEMO_BUDGETS: DemoBudget[] = [
  { category: 'Groceries', icon: '🛒', limit: 550 },
  { category: 'Dining', icon: '🍜', limit: 320 },
  { category: 'Transport', icon: '🚇', limit: 160 },
  { category: 'Shopping', icon: '🛍️', limit: 250 },
  { category: 'Entertainment', icon: '🎬', limit: 120 },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const INITIAL_DEMO_TXNS: DemoTxn[] = [
  { id: 'd1', merchant: 'Northwind Labs', category: 'Salary', icon: '💼', amount: 5200, type: 'income', date: daysAgo(12) },
  { id: 'd2', merchant: 'Lakeview Properties', category: 'Housing', icon: '🏠', amount: 1850, type: 'expense', date: daysAgo(12) },
  { id: 'd3', merchant: 'Fresh Market', category: 'Groceries', icon: '🛒', amount: 92.4, type: 'expense', date: daysAgo(9) },
  { id: 'd4', merchant: 'Sakura Sushi', category: 'Dining', icon: '🍜', amount: 48.5, type: 'expense', date: daysAgo(7) },
  { id: 'd5', merchant: 'Metro Transit', category: 'Transport', icon: '🚇', amount: 24.0, type: 'expense', date: daysAgo(6) },
  { id: 'd6', merchant: 'Uniqlo', category: 'Shopping', icon: '🛍️', amount: 78.9, type: 'expense', date: daysAgo(5) },
  { id: 'd7', merchant: 'Maple Leaf Grocers', category: 'Groceries', icon: '🛒', amount: 64.2, type: 'expense', date: daysAgo(3) },
  { id: 'd8', merchant: 'Cineplex', category: 'Entertainment', icon: '🎬', amount: 32.0, type: 'expense', date: daysAgo(2) },
  { id: 'd9', merchant: 'Corner Café', category: 'Dining', icon: '☕', amount: 6.75, type: 'expense', date: daysAgo(1) },
  { id: 'd10', merchant: 'Design client', category: 'Freelance', icon: '💻', amount: 340, type: 'income', date: daysAgo(1) },
];

export interface DemoSummary {
  income: number;
  expense: number;
  net: number;
  savingsRate: number | null;
}

export function computeSummary(txns: DemoTxn[]): DemoSummary {
  const income = txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return {
    income,
    expense,
    net: income - expense,
    savingsRate: income > 0 ? (income - expense) / income : null,
  };
}

export function spentByCategory(txns: DemoTxn[], category: string): number {
  return txns
    .filter((t) => t.type === 'expense' && t.category === category)
    .reduce((s, t) => s + t.amount, 0);
}

/** Last-7-day expense totals for the mini bar chart. */
export function weeklySpend(txns: DemoTxn[]): { label: string; amount: number }[] {
  const out: { label: string; amount: number }[] = [];
  const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const amount = txns
      .filter((t) => t.type === 'expense' && t.date === key)
      .reduce((s, t) => s + t.amount, 0);
    out.push({ label: labels[d.getDay()], amount });
  }
  return out;
}

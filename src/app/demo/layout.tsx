import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live demo — FinanceOS',
  description:
    'Try FinanceOS right now — add a transaction and watch your budgets and net worth update live. No account needed.',
};

// Standalone layout: the demo is public and must NOT use the dashboard shell
// (sidebar, auth providers) or the marketing chrome.
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background dark:bg-slate-950">{children}</div>;
}

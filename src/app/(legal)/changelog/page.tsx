import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Changelog — FinanceOS',
  description: 'New features and improvements shipped to FinanceOS.',
};

interface Release {
  date: string; // display date
  version: string;
  title: string;
  tag: 'New' | 'Improved' | 'Fixed';
  items: string[];
}

// Real shipped work. Add a new entry at the top each time something ships.
const RELEASES: Release[] = [
  {
    date: 'June 12, 2026',
    version: '1.4',
    title: 'Insights, habits & stronger security',
    tag: 'New',
    items: [
      'Monthly review on the dashboard that summarizes your income, spending, and savings rate in plain language.',
      'Tracking streaks and a celebration when you complete a savings goal.',
      'Spending calendar heatmap in Analytics — see your busiest spending days at a glance.',
      'Two-factor authentication (TOTP) for an extra layer of account security.',
      'Browser push notifications for bills, budgets, and your weekly digest.',
      'Explore the whole app instantly with one-click sample data, plus a guided setup checklist for new accounts.',
    ],
  },
  {
    date: 'June 11, 2026',
    version: '1.3',
    title: 'A proper front door',
    tag: 'New',
    items: [
      'Brand-new marketing homepage that walks through every feature.',
      'Public Privacy Policy and Terms of Service.',
    ],
  },
  {
    date: 'June 2026',
    version: '1.2',
    title: 'Analytics & AI import',
    tag: 'New',
    items: [
      'Five-tab Analytics with spending, income, budgets, and top-merchant breakdowns across 3, 6, and 12 months.',
      'PDF and CSV export for your reports.',
      'AI receipt scanning, bank-statement import, and CSV import with column mapping.',
    ],
  },
  {
    date: 'June 2026',
    version: '1.1',
    title: 'Notifications & reminders',
    tag: 'New',
    items: [
      'In-app notification center for budget alerts, bill reminders, and weekly digests.',
      'Optional email delivery via Gmail, with encrypted tokens.',
      'Password recovery flow.',
    ],
  },
  {
    date: 'May 2026',
    version: '1.0',
    title: 'FinanceOS launch',
    tag: 'New',
    items: [
      'Dashboard, transactions, budgets, savings goals, recurring bills, accounts, investments, and net worth.',
      'Mobile-first design with installable PWA, dark mode, and multi-currency display.',
    ],
  },
];

const TAG_STYLES: Record<Release['tag'], string> = {
  New: 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-400',
  Improved: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400',
  Fixed: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400',
};

export default function ChangelogPage() {
  return (
    <article className="space-y-10">
      <header>
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-primary-600">
          <Sparkles size={15} /> Changelog
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          What’s new in FinanceOS
        </h1>
        <p className="mt-2 text-[15px] text-slate-600 dark:text-slate-400">
          Every improvement we ship, newest first.
        </p>
      </header>

      <div className="relative space-y-10 border-l border-slate-200 pl-6 dark:border-slate-800">
        {RELEASES.map((release) => (
          <section key={release.version} className="relative">
            {/* Timeline dot */}
            <span className="absolute -left-[31px] top-1.5 flex h-3 w-3 items-center justify-center">
              <span className="h-3 w-3 rounded-full border-2 border-primary-500 bg-white dark:bg-slate-950" />
            </span>

            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{release.title}</h2>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TAG_STYLES[release.tag]}`}>
                {release.tag}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {release.date} · v{release.version}
            </p>

            <ul className="mt-3 space-y-2">
              {release.items.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}

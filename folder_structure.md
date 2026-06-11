# Project Structure

Personal_Tracker/
├── .env.local
├── folder_structure.md
├── middleware.ts
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.js
├── README.md
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   │   ├── Backup1.tsx
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── analytics/
│   │   │   ├── budgets/
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── bakpage.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── goals/
│   │   │   │   └── page.tsx
│   │   │   ├── investments/
│   │   │   ├── layout.tsx
│   │   │   ├── net-worth/
│   │   │   ├── recurring/
│   │   │   │   └── page.tsx
│   │   │   └── transactions/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   ├── auth/
│   │   │   │   └── session/
│   │   │   │       └── route.ts
│   │   │   └── webhooks/
│   │   ├── client-providers.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── analytics/
│   │   ├── budgets/
│   │   │   └── BudgetForm.tsx
│   │   ├── dashboard/
│   │   │   ├── BakUpcomingBills.tsx
│   │   │   ├── BudgetHealth.tsx
│   │   │   ├── SpendingChart.tsx
│   │   │   ├── SummaryCards.tsx
│   │   │   └── UpcomingBills.tsx
│   │   ├── goals/
│   │   │   ├── GoalForm.tsx
│   │   │   ├── GoalsList.tsx
│   │   │   └── SavingsGoalsList.tsx
│   │   ├── investments/
│   │   ├── layout/
│   │   │   ├── MobileNav.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   ├── recurring/
│   │   │   └── RecurringForm.tsx
│   │   ├── shared/
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── LoadingSkeleton.tsx
│   │   ├── transactions/
│   │   │   ├── CategoryPicker.tsx
│   │   │   ├── QuickAdd.tsx
│   │   │   └── TransactionList.tsx
│   │   └── ui/
│   │       └── toaster.tsx
│   ├── features/
│   │   ├── accounts/
│   │   │   └── api.ts
│   │   ├── ai/
│   │   ├── auth/
│   │   │   ├── api.ts
│   │   │   ├── bak.api.ts
│   │   │   └── schema.ts
│   │   ├── budgets/
│   │   │   ├── api.ts
│   │   │   ├── hooks.ts
│   │   │   ├── schema.ts
│   │   │   └── types.ts
│   │   ├── goals/
│   │   │   ├── api.ts
│   │   │   ├── hooks.ts
│   │   │   ├── schema.ts
│   │   │   └── types.ts
│   │   ├── investments/
│   │   ├── recurring/
│   │   │   ├── api.ts
│   │   │   ├── hooks.ts
│   │   │   ├── schema.ts
│   │   │   └── types.ts
│   │   └── transactions/
│   │       ├── api.ts
│   │       ├── hooks.ts
│   │       ├── schema.ts
│   │       └── types.ts
│   ├── hooks/
│   │   └── useUser.ts
│   ├── lib/
│   │   ├── constants.ts
│   │   ├── formatters.ts
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── middleware.ts
│   │   │   └── server.ts
│   │   ├── utils.ts
│   │   └── validations/
│   ├── middleware.ts
│   ├── stores/
│   │   └── uiStore.ts
│   ├── styles/
│   └── types/
│       ├── database.ts
│       └── index.ts
├── supabase/
│   ├── config.toml
│   ├── functions/
│   │   ├── ai-categorize/
│   │   ├── ai-insights/
│   │   └── process-recurring/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_indexes.sql
│   │   ├── 004_triggers.sql
│   │   ├── 005_budget_calculations.sql
│   │   └── 006_recurring_and_contributions.sql
│   └── seed.sql
├── tailwind.config.ts
└── tsconfig.json

# FinanceOS — Personal Finance Platform

Mobile-first personal finance dashboard. Track expenses, budgets, savings goals, investments, and net worth.

## Phase 1 — What's built

- ✅ PostgreSQL schema with RLS, indexes, triggers
- ✅ Auth (login / register / session via Supabase Auth)
- ✅ Dashboard with summary cards, spending chart, budget health, upcoming bills
- ✅ QuickAdd transaction sheet (< 5 second entry)
- ✅ Transaction list grouped by date with soft delete
- ✅ Income tracking
- ✅ Account balance auto-sync via DB trigger
- ✅ Budget spent_amount auto-refresh via DB trigger

## Stack

| Layer      | Tech                                      |
|------------|-------------------------------------------|
| Frontend   | Next.js 15, React 19, TypeScript, Tailwind |
| Components | shadcn/ui-compatible + custom             |
| State      | React Query (server) + Zustand (UI)       |
| Backend    | Supabase (Auth + PostgreSQL + Storage)    |
| Animations | Framer Motion                             |
| Charts     | Recharts                                  |
| Validation | Zod + react-hook-form                     |

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd pfm
npm install
```

### 2. Create Supabase project

Go to https://app.supabase.com → New project (free tier).

### 3. Run migrations

In Supabase Dashboard → SQL Editor, run each file in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_indexes.sql
supabase/migrations/004_triggers.sql
supabase/seed.sql
```

Or with Supabase CLI:

```bash
npx supabase db push
```

### 4. Configure environment

```bash
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key
```

### 5. Run locally

```bash
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel (free)

```bash
npm i -g vercel
vercel
# Follow prompts — set env vars when asked
```


## Phase 2 (next)

- Monthly budget CRUD + progress bars
- Savings goals + contribution tracker
- Recurring transactions + pg_cron
- Bill reminders

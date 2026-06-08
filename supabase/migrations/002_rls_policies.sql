-- ============================================================
-- 002_rls_policies.sql
-- Row Level Security — every row visible only to its owner
-- Pattern: user_id = auth.uid() OR join through accounts
-- ============================================================

-- Enable RLS on all tables
alter table public.users                  enable row level security;
alter table public.accounts               enable row level security;
alter table public.categories             enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.transactions           enable row level security;
alter table public.budgets                enable row level security;
alter table public.goals                  enable row level security;
alter table public.investments            enable row level security;
alter table public.notifications          enable row level security;
alter table public.ai_insights            enable row level security;

-- ── USERS ──────────────────────────────────────────────────
create policy "users_select_own" on public.users
  for select using (id = auth.uid());

create policy "users_insert_own" on public.users
  for insert with check (id = auth.uid());

create policy "users_update_own" on public.users
  for update using (id = auth.uid());

-- ── ACCOUNTS ───────────────────────────────────────────────
create policy "accounts_all_own" on public.accounts
  for all using (user_id = auth.uid());

-- ── CATEGORIES ─────────────────────────────────────────────
-- Users see system defaults (user_id IS NULL) AND their own
create policy "categories_select" on public.categories
  for select using (user_id is null or user_id = auth.uid());

create policy "categories_insert_own" on public.categories
  for insert with check (user_id = auth.uid());

create policy "categories_update_own" on public.categories
  for update using (user_id = auth.uid() and is_system = false);

create policy "categories_delete_own" on public.categories
  for delete using (user_id = auth.uid() and is_system = false);

-- ── TRANSACTIONS ────────────────────────────────────────────
-- Join through accounts to enforce ownership
create policy "transactions_all_own" on public.transactions
  for all using (
    account_id in (
      select id from public.accounts where user_id = auth.uid()
    )
  );

-- ── RECURRING TRANSACTIONS ──────────────────────────────────
create policy "recurring_all_own" on public.recurring_transactions
  for all using (
    account_id in (
      select id from public.accounts where user_id = auth.uid()
    )
  );

-- ── BUDGETS ─────────────────────────────────────────────────
create policy "budgets_all_own" on public.budgets
  for all using (user_id = auth.uid());

-- ── GOALS ───────────────────────────────────────────────────
create policy "goals_all_own" on public.goals
  for all using (user_id = auth.uid());

-- ── INVESTMENTS ─────────────────────────────────────────────
create policy "investments_all_own" on public.investments
  for all using (user_id = auth.uid());

-- ── NOTIFICATIONS ───────────────────────────────────────────
create policy "notifications_all_own" on public.notifications
  for all using (user_id = auth.uid());

-- ── AI INSIGHTS ─────────────────────────────────────────────
create policy "ai_insights_all_own" on public.ai_insights
  for all using (user_id = auth.uid());

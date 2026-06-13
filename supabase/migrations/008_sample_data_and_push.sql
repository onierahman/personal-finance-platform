-- ============================================================
-- 008_sample_data_and_push.sql
-- 1) is_sample flags so demo/sample records can be seeded and
--    wiped cleanly without touching real user data
-- 2) push_subscriptions table for Web Push notifications
-- All changes are additive and safe to run on a live database.
-- ============================================================

-- ── Sample-data flags ───────────────────────────────────────
alter table public.accounts
  add column if not exists is_sample boolean not null default false;

alter table public.transactions
  add column if not exists is_sample boolean not null default false;

alter table public.budgets
  add column if not exists is_sample boolean not null default false;

alter table public.goals
  add column if not exists is_sample boolean not null default false;

alter table public.recurring_transactions
  add column if not exists is_sample boolean not null default false;

alter table public.investments
  add column if not exists is_sample boolean not null default false;

-- Partial indexes: wiping sample data filters on these columns, and the
-- predicate keeps the index tiny (only sample rows are indexed).
create index if not exists idx_accounts_sample      on public.accounts (id)               where is_sample;
create index if not exists idx_transactions_sample  on public.transactions (account_id)   where is_sample;
create index if not exists idx_budgets_sample       on public.budgets (user_id)           where is_sample;
create index if not exists idx_goals_sample         on public.goals (user_id)             where is_sample;
create index if not exists idx_recurring_sample     on public.recurring_transactions (account_id) where is_sample;
create index if not exists idx_investments_sample   on public.investments (user_id)       where is_sample;

-- ── Web Push subscriptions ──────────────────────────────────
-- One row per browser/device subscription. endpoint is unique per
-- subscription; a user can have several (phone, laptop, …).
create table if not exists public.push_subscriptions (
  id          uuid primary key default extensions.uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_all_own" on public.push_subscriptions;
create policy "push_subscriptions_all_own" on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Table grants ─────────────────────────────────────────────
-- RLS gates which rows are visible; roles still need table-level grants for
-- PostgREST to expose the table at all.
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select, insert, update, delete on public.push_subscriptions to service_role;

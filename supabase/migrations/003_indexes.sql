-- ============================================================
-- 003_indexes.sql
-- Indexes for all common query patterns
-- Dashboard load target: < 2s
-- ============================================================

-- ACCOUNTS
create index idx_accounts_user_id     on public.accounts(user_id);
create index idx_accounts_type        on public.accounts(type);

-- TRANSACTIONS — most queried table
create index idx_transactions_account_id  on public.transactions(account_id);
create index idx_transactions_date        on public.transactions(date desc);
create index idx_transactions_category    on public.transactions(category);
create index idx_transactions_type        on public.transactions(type);
create index idx_transactions_recurring   on public.transactions(recurring_id) where recurring_id is not null;
create index idx_transactions_not_deleted on public.transactions(account_id, date desc) where is_deleted = false;
-- Composite for dashboard monthly summary (hot path)
create index idx_transactions_monthly on public.transactions(account_id, type, date)
  where is_deleted = false;

-- BUDGETS
create index idx_budgets_user_id      on public.budgets(user_id);
create index idx_budgets_category     on public.budgets(user_id, category, period);

-- GOALS
create index idx_goals_user_id        on public.goals(user_id);
create index idx_goals_status         on public.goals(user_id, status);

-- INVESTMENTS
create index idx_investments_user_id  on public.investments(user_id);
create index idx_investments_type     on public.investments(user_id, asset_type);

-- RECURRING
create index idx_recurring_account    on public.recurring_transactions(account_id);
create index idx_recurring_next_due   on public.recurring_transactions(next_due) where is_active = true;

-- NOTIFICATIONS
create index idx_notifications_user   on public.notifications(user_id, is_read, created_at desc);

-- AI INSIGHTS
create index idx_ai_insights_user     on public.ai_insights(user_id, type, created_at desc);

-- CATEGORIES
create index idx_categories_user      on public.categories(user_id);
create index idx_categories_system    on public.categories(is_system) where is_system = true;

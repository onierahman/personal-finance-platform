-- ============================================================
-- 004_triggers.sql
-- Triggers for:
-- 1. updated_at auto-maintenance
-- 2. User profile creation on auth signup
-- 3. Account balance sync on transaction insert/update/delete
-- 4. Budget spent_amount refresh on transaction change
-- ============================================================

-- ── HELPER: generic updated_at updater ──────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply to every table with updated_at
create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger trg_accounts_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

create trigger trg_transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create trigger trg_budgets_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

create trigger trg_goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

create trigger trg_investments_updated_at
  before update on public.investments
  for each row execute function public.set_updated_at();

create trigger trg_recurring_updated_at
  before update on public.recurring_transactions
  for each row execute function public.set_updated_at();

-- ── USER PROFILE ON SIGNUP ───────────────────────────────────
-- Automatically inserts a row in public.users when a new
-- Supabase auth user is created (email/password or OAuth)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── ACCOUNT BALANCE SYNC ────────────────────────────────────
-- Keeps accounts.balance in sync with transaction inserts/updates/deletes
-- Only non-deleted transactions of type expense/income affect balance
-- Transfer type: handled at application layer (two transactions)
create or replace function public.sync_account_balance()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_delta decimal(15,2) := 0;
  v_account_id uuid;
begin
  -- Determine which account to update and the delta amount
  if TG_OP = 'INSERT' then
    if new.is_deleted = false then
      v_account_id := new.account_id;
      v_delta := case new.type when 'income' then new.amount else -new.amount end;
    end if;

  elsif TG_OP = 'UPDATE' then
    -- Handle soft-delete toggle
    if old.is_deleted = false and new.is_deleted = true then
      v_account_id := new.account_id;
      v_delta := case new.type when 'income' then -new.amount else new.amount end;
    elsif old.is_deleted = true and new.is_deleted = false then
      v_account_id := new.account_id;
      v_delta := case new.type when 'income' then new.amount else -new.amount end;
    elsif old.is_deleted = false and new.is_deleted = false then
      -- Amount or type changed on an active transaction
      v_account_id := new.account_id;
      -- Reverse old, apply new
      v_delta := (case new.type when 'income' then new.amount else -new.amount end)
               - (case old.type when 'income' then old.amount else -old.amount end);
    end if;

  elsif TG_OP = 'DELETE' then
    if old.is_deleted = false then
      v_account_id := old.account_id;
      v_delta := case old.type when 'income' then -old.amount else old.amount end;
    end if;
  end if;

  if v_account_id is not null and v_delta <> 0 then
    update public.accounts
      set balance = balance + v_delta
    where id = v_account_id;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger trg_sync_balance_insert
  after insert on public.transactions
  for each row execute function public.sync_account_balance();

create trigger trg_sync_balance_update
  after update on public.transactions
  for each row execute function public.sync_account_balance();

create trigger trg_sync_balance_delete
  after delete on public.transactions
  for each row execute function public.sync_account_balance();

-- ── BUDGET SPENT AMOUNT REFRESH ─────────────────────────────
-- Recalculates budget.spent_amount for the affected category+period
-- on every expense transaction change
create or replace function public.refresh_budget_spent()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid;
  v_category text;
  v_month date;
begin
  -- Resolve user_id via account
  select a.user_id into v_user_id
  from public.accounts a
  where a.id = coalesce(new.account_id, old.account_id);

  v_category := coalesce(new.category, old.category);
  v_month := date_trunc('month', coalesce(new.date, old.date))::date;

  -- Recalculate spent for the category+month
  update public.budgets b
  set spent_amount = (
    select coalesce(sum(t.amount), 0)
    from public.transactions t
    join public.accounts a on a.id = t.account_id
    where a.user_id = v_user_id
      and t.category = b.category
      and t.type = 'expense'
      and t.is_deleted = false
      and date_trunc('month', t.date) = date_trunc('month', b.start_date)
  )
  where b.user_id = v_user_id
    and b.category = v_category
    and b.period = 'monthly'
    and date_trunc('month', b.start_date) = v_month;

  return coalesce(new, old);
end;
$$;

create trigger trg_refresh_budget_insert
  after insert on public.transactions
  for each row when (new.type = 'expense')
  execute function public.refresh_budget_spent();

create trigger trg_refresh_budget_update
  after update on public.transactions
  for each row when (new.type = 'expense' or old.type = 'expense')
  execute function public.refresh_budget_spent();

create trigger trg_refresh_budget_delete
  after delete on public.transactions
  for each row when (old.type = 'expense')
  execute function public.refresh_budget_spent();

-- ============================================================
-- 001_initial_schema.sql
-- Personal Finance Platform — Core Tables
-- All monetary values: DECIMAL(15,2) — never float
-- UUIDs everywhere, timezone-aware timestamps
-- Soft delete via is_deleted / deleted_at
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pg_cron" with schema extensions;

-- ============================================================
-- USERS
-- Extends Supabase auth.users with profile data
-- ============================================================
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  name        text not null default '',
  avatar_url  text,
  currency    text not null default 'USD',
  timezone    text not null default 'UTC',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- ============================================================
-- ACCOUNTS
-- Checking, savings, credit card, investment, cash, etc.
-- ============================================================
create table public.accounts (
  id          uuid primary key default extensions.uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  name        text not null,
  type        text not null check (type in (
                'checking','savings','credit_card','investment','cash','loan','other'
              )),
  balance     decimal(15,2) not null default 0,
  currency    text not null default 'USD',
  color       text default '#2563EB',
  icon        text default 'wallet',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- CATEGORIES
-- Seeded with defaults, user can add custom
-- ============================================================
create table public.categories (
  id         uuid primary key default extensions.uuid_generate_v4(),
  user_id    uuid references public.users(id) on delete cascade, -- null = system default
  name       text not null,
  type       text not null check (type in ('expense','income','both')),
  icon       text not null default '📦',
  color      text not null default '#64748B',
  is_system  boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RECURRING TRANSACTIONS
-- Templates that auto-generate transactions
-- ============================================================
create table public.recurring_transactions (
  id          uuid primary key default  extensions.uuid_generate_v4(),
  account_id  uuid not null references public.accounts(id) on delete cascade,
  amount      decimal(15,2) not null check (amount > 0),
  type        text not null check (type in ('expense','income')),
  category    text not null,
  merchant    text,
  note        text,
  frequency   text not null check (frequency in (
                'daily','weekly','biweekly','monthly','quarterly','yearly'
              )),
  start_date  date not null,
  next_due    date not null,
  end_date    date,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- TRANSACTIONS
-- Core financial events — immutable audit trail
-- Never hard-delete; use is_deleted + deleted_at
-- ============================================================
create table public.transactions (
  id             uuid primary key default extensions.uuid_generate_v4(),
  account_id     uuid not null references public.accounts(id) on delete restrict,
  recurring_id   uuid references public.recurring_transactions(id) on delete set null,
  amount         decimal(15,2) not null check (amount > 0),
  type           text not null check (type in ('expense','income','transfer')),
  category       text not null,
  subcategory    text,
  merchant       text,
  date           date not null default current_date,
  note           text,
  receipt_url    text,
  -- AI fields
  ai_category    text,
  ai_confidence  decimal(5,4),
  -- Audit
  is_deleted     boolean not null default false,
  deleted_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- BUDGETS
-- Per-category monthly or annual limits
-- ============================================================
create table public.budgets (
  id            uuid primary key default extensions.uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  category      text not null,
  limit_amount  decimal(15,2) not null check (limit_amount > 0),
  period        text not null check (period in ('monthly','annual')),
  start_date    date not null,
  -- computed spent cached for perf, refreshed by trigger
  spent_amount  decimal(15,2) not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, category, period, start_date)
);

-- ============================================================
-- GOALS
-- Savings targets with deadlines and priorities
-- ============================================================
create table public.goals (
  id              uuid primary key default extensions.uuid_generate_v4(), 
  user_id         uuid not null references public.users(id) on delete cascade,
  name            text not null,
  description     text,
  target_amount   decimal(15,2) not null check (target_amount > 0),
  current_amount  decimal(15,2) not null default 0 check (current_amount >= 0),
  deadline        date,
  priority        text not null default 'medium' check (priority in ('low','medium','high')),
  status          text not null default 'active' check (status in ('active','completed','paused','cancelled')),
  icon            text default '🎯',
  color           text default '#2563EB',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- INVESTMENTS
-- Manual portfolio tracking — stocks, ETFs, crypto, etc.
-- ============================================================
create table public.investments (
  id              uuid primary key default extensions.uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  asset_type      text not null check (asset_type in (
                    'stock','etf','crypto','mutual_fund','bond','real_estate','retirement','other'
                  )),
  symbol          text,
  name            text not null,
  quantity        decimal(20,8) not null check (quantity > 0),
  purchase_price  decimal(15,2) not null check (purchase_price > 0),
  current_price   decimal(15,2) not null check (current_price >= 0),
  purchase_date   date not null,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- NOTIFICATIONS
-- Bill reminders, budget alerts, goal milestones
-- ============================================================
create table public.notifications (
  id         uuid primary key default extensions.uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  type       text not null check (type in (
               'bill_due','budget_exceeded','goal_achieved','low_balance',
               'recurring_generated','insight_ready'
             )),
  title      text not null,
  body       text not null,
  data       jsonb,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- AI INSIGHTS
-- Stored GPT responses — queryable, never re-called until stale
-- ============================================================
create table public.ai_insights (
  id         uuid primary key default extensions.uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  type       text not null check (type in (
               'monthly_summary','spending_alert','savings_suggestion',
               'budget_recommendation','forecast'
             )),
  period     text, -- e.g. '2026-06'
  payload    jsonb not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

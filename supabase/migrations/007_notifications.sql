-- ============================================================
-- 007_notifications.sql
-- Notifications table + Gmail OAuth token storage
-- Idempotent: safe to re-run
-- ============================================================

-- ── Notifications table ──────────────────────────────────────

create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  type        text not null check (type in (
                'bill_due','budget_exceeded','goal_achieved',
                'low_balance','recurring_generated','insight_ready',
                'import_complete','weekly_digest'
              )),
  title       text not null,
  body        text not null,
  data        jsonb,
  is_read     boolean not null default false,
  email_sent  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Add email_sent if the table existed before but lacked the column
alter table notifications add column if not exists email_sent boolean not null default false;

create index if not exists notifications_user_id_idx on notifications(user_id);
create index if not exists notifications_created_at_idx on notifications(user_id, created_at desc);

-- ── Gmail OAuth tokens ───────────────────────────────────────

create table if not exists gmail_tokens (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references users(id) on delete cascade,
  email          text not null,
  access_token   text not null,
  refresh_token  text not null,
  expires_at     timestamptz not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists gmail_tokens_user_id_idx on gmail_tokens(user_id);

-- ── RLS ──────────────────────────────────────────────────────

alter table notifications enable row level security;
alter table gmail_tokens   enable row level security;

-- Drop policies first so the script is safe to re-run
drop policy if exists "notifications: owner access"   on notifications;
drop policy if exists "notifications: service insert" on notifications;
drop policy if exists "notifications: service select" on notifications;
drop policy if exists "gmail_tokens: owner access"    on gmail_tokens;

-- Users can only see / manage their own notifications
create policy "notifications: owner access"
  on notifications for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Users can only see / manage their own Gmail tokens
create policy "gmail_tokens: owner access"
  on gmail_tokens for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Service role (API routes) can insert/read notifications for any user
-- (needed for server-side triggers like budget exceeded and weekly digest)
create policy "notifications: service insert"
  on notifications for insert
  to service_role
  with check (true);

create policy "notifications: service select"
  on notifications for select
  to service_role
  using (true);

-- ── Table grants ─────────────────────────────────────────────
-- RLS policies alone aren't enough — the role also needs table-level privileges.

grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.gmail_tokens   to authenticated;
grant select, insert, update, delete on public.notifications  to service_role;
grant select, insert, update, delete on public.gmail_tokens   to service_role;

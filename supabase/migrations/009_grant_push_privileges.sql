-- ============================================================
-- 009_grant_push_privileges.sql
-- Patch: grant table privileges on push_subscriptions.
-- Migration 008 created the table + RLS but omitted the role grants
-- (PostgREST needs table-level GRANTs in addition to RLS). This applies
-- them to databases that already ran 008. Idempotent — safe to re-run.
-- ============================================================

grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select, insert, update, delete on public.push_subscriptions to service_role;

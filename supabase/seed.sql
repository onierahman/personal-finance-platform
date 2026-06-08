-- ============================================================
-- seed.sql
-- System-default categories (user_id = NULL, is_system = TRUE)
-- These are visible to every user via RLS policy
-- ============================================================

insert into public.categories (id, user_id, name, type, icon, color, is_system) values
  -- EXPENSE CATEGORIES
  (uuid_generate_v4(), null, 'Housing',        'expense', '🏠', '#6366F1', true),
  (uuid_generate_v4(), null, 'Utilities',       'expense', '⚡', '#F59E0B', true),
  (uuid_generate_v4(), null, 'Groceries',       'expense', '🛒', '#22C55E', true),
  (uuid_generate_v4(), null, 'Dining',          'expense', '🍔', '#F97316', true),
  (uuid_generate_v4(), null, 'Transportation',  'expense', '🚗', '#3B82F6', true),
  (uuid_generate_v4(), null, 'Shopping',        'expense', '🛍️', '#EC4899', true),
  (uuid_generate_v4(), null, 'Health',          'expense', '❤️', '#EF4444', true),
  (uuid_generate_v4(), null, 'Insurance',       'expense', '🛡️', '#8B5CF6', true),
  (uuid_generate_v4(), null, 'Education',       'expense', '📚', '#06B6D4', true),
  (uuid_generate_v4(), null, 'Entertainment',   'expense', '🎬', '#A855F7', true),
  (uuid_generate_v4(), null, 'Travel',          'expense', '✈️', '#0EA5E9', true),
  (uuid_generate_v4(), null, 'Subscriptions',   'expense', '📱', '#64748B', true),
  (uuid_generate_v4(), null, 'Personal Care',   'expense', '💅', '#F472B6', true),
  (uuid_generate_v4(), null, 'Fitness',         'expense', '💪', '#10B981', true),
  (uuid_generate_v4(), null, 'Taxes',           'expense', '📋', '#DC2626', true),
  (uuid_generate_v4(), null, 'Investments',     'expense', '📈', '#2563EB', true),
  (uuid_generate_v4(), null, 'Gifts',           'expense', '🎁', '#D97706', true),
  (uuid_generate_v4(), null, 'Other',           'expense', '📦', '#94A3B8', true),
  -- INCOME CATEGORIES
  (uuid_generate_v4(), null, 'Salary',          'income',  '💼', '#22C55E', true),
  (uuid_generate_v4(), null, 'Freelance',       'income',  '💻', '#06B6D4', true),
  (uuid_generate_v4(), null, 'Business',        'income',  '🏢', '#6366F1', true),
  (uuid_generate_v4(), null, 'Rental',          'income',  '🏘️', '#F97316', true),
  (uuid_generate_v4(), null, 'Dividends',       'income',  '💹', '#2563EB', true),
  (uuid_generate_v4(), null, 'Interest',        'income',  '🏦', '#0EA5E9', true),
  (uuid_generate_v4(), null, 'Bonus',           'income',  '🎉', '#A855F7', true),
  (uuid_generate_v4(), null, 'Side Income',     'income',  '💰', '#D97706', true),
  (uuid_generate_v4(), null, 'Other Income',    'income',  '💵', '#94A3B8', true);

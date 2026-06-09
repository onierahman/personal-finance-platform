-- Re-architecting the budget tracking calculation to support account joins and soft deletion
CREATE OR REPLACE FUNCTION public.refresh_budget_spent()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_category TEXT;
BEGIN
    -- 1. Identify context parameters depending on the trigger event type
    IF TG_OP = 'DELETE' THEN
        v_category := OLD.category;
        SELECT user_id INTO v_user_id FROM public.accounts WHERE id = OLD.account_id;
    ELSE
        v_category := NEW.category;
        SELECT user_id INTO v_user_id FROM public.accounts WHERE id = NEW.account_id;
    END IF;

    -- 2. Execute calculation rollup for the target user and category combo
    UPDATE public.budgets b
    SET spent_amount = COALESCE(
        (
            SELECT SUM(t.amount)
            FROM public.transactions t
            JOIN public.accounts a ON t.account_id = a.id
            WHERE a.user_id = b.user_id
              AND t.category = b.category
              AND t.type = 'expense'
              AND t.is_deleted = false -- Enforces soft deletion rule
              AND t.date >= b.start_date
              AND (
                  (b.period = 'monthly' AND t.date <= (b.start_date + INTERVAL '1 month' - INTERVAL '1 day')::date)
                  OR
                  (b.period = 'annual' AND t.date <= (b.start_date + INTERVAL '1 year' - INTERVAL '1 day')::date)
              )
        ),
        0
    ),
    updated_at = NOW()
    WHERE b.user_id = v_user_id AND b.category = v_category;

    -- 3. Handle edge case: If an update mutated categories or accounts, refresh the older source bucket as well
    IF TG_OP = 'UPDATE' AND (OLD.category != NEW.category OR OLD.account_id != NEW.account_id) THEN
        SELECT user_id INTO v_user_id FROM public.accounts WHERE id = OLD.account_id;
        
        UPDATE public.budgets b
        SET spent_amount = COALESCE(
            (
                SELECT SUM(t.amount)
                FROM public.transactions t
                JOIN public.accounts a ON t.account_id = a.id
                WHERE a.user_id = b.user_id
                  AND t.category = b.category
                  AND t.type = 'expense'
                  AND t.is_deleted = false
                  AND t.date >= b.start_date
                  AND (
                      (b.period = 'monthly' AND t.date <= (b.start_date + INTERVAL '1 month' - INTERVAL '1 day')::date)
                      OR
                      (b.period = 'annual' AND t.date <= (b.start_date + INTERVAL '1 year' - INTERVAL '1 day')::date)
                  )
            ),
            0
        ),
        updated_at = NOW()
        WHERE b.user_id = v_user_id AND b.category = OLD.category;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Link your existing trigger hooks back to the updated execution routine
CREATE OR REPLACE FUNCTION public.update_budget_spent()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.refresh_budget_spent();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
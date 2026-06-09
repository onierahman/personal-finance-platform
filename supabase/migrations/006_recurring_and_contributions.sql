-- 1. Create Goal Contributions Log pointing directly to your goals configuration schema
CREATE TABLE IF NOT EXISTS public.goal_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL,
    user_id UUID NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    CONSTRAINT fk_contributions_goal FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE,
    CONSTRAINT fk_contributions_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Automation Engine: Balance target goals and switch constraints conditionally on state shifts
CREATE OR REPLACE FUNCTION public.sync_goals_total()
RETURNS TRIGGER AS $$
DECLARE
    computed_amount NUMERIC(15, 2);
    target_limit NUMERIC(15, 2);
BEGIN
    -- Determine current aggregate total relative to target allocation keys
    SELECT COALESCE(SUM(amount), 0) INTO computed_amount 
    FROM public.goal_contributions 
    WHERE goal_id = COALESCE(NEW.goal_id, OLD.goal_id);

    SELECT target_amount INTO target_limit 
    FROM public.goals 
    WHERE id = COALESCE(NEW.goal_id, OLD.goal_id);

    UPDATE public.goals
    SET current_amount = computed_amount,
        status = CASE 
            WHEN computed_amount >= target_limit THEN 'completed'::text 
            ELSE 'active'::text 
        END,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.goal_id, OLD.goal_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Bind Trigger Execution Parameters
DROP TRIGGER IF EXISTS trg_sync_existing_goals ON public.goal_contributions;
CREATE TRIGGER trg_sync_existing_goals
AFTER INSERT OR UPDATE OR DELETE ON public.goal_contributions
FOR EACH ROW EXECUTE FUNCTION public.sync_goals_total();

-- 4. Create Phase 2 Recurring Transactions Ledger Mapping
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    next_due_date DATE NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'paused', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
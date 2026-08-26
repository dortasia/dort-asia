-- 016_complete_company_setup.sql
-- Function to atomically create a company and activate the account during Google OAuth onboarding

CREATE OR REPLACE FUNCTION public.complete_company_setup(user_uuid UUID, new_company_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_account_id UUID;
    target_status TEXT;
BEGIN
    -- 0. Validate input
    IF new_company_name IS NULL OR btrim(new_company_name) = '' THEN
        RAISE EXCEPTION 'Company name is required';
    END IF;

    -- 1. Find the identity.accounts record matching the auth_user_id (locking the row)
    SELECT id, status INTO target_account_id, target_status
    FROM identity.accounts
    WHERE auth_user_id = user_uuid
    FOR UPDATE;

    -- 2. Verify account exists
    IF target_account_id IS NULL THEN
        RAISE EXCEPTION 'Account not found for the given user';
    END IF;

    -- 3. Verify status is pending_company_setup
    IF target_status != 'pending_company_setup' THEN
        RAISE EXCEPTION 'Account is not in pending_company_setup state';
    END IF;

    -- 4. Create the company (UNIQUE constraint on account_id prevents duplicates)
    INSERT INTO company.companies (account_id, company_name, status)
    VALUES (target_account_id, new_company_name, 'active');

    -- 5. Update account status to active
    UPDATE identity.accounts
    SET status = 'active', updated_at = NOW()
    WHERE id = target_account_id;

END;
$$;

-- Revoke execution from public, anon, and authenticated users 
-- as it will be called strictly by the Service Role via the backend API.
REVOKE EXECUTE ON FUNCTION public.complete_company_setup(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_company_setup(UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.complete_company_setup(UUID, TEXT) FROM authenticated;

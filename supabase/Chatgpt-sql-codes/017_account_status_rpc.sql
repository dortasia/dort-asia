-- 017_account_status_rpc.sql
-- Synchronizes verified email accounts from pending_verification to active.
-- Never activates an account that does not already have a company.

CREATE OR REPLACE FUNCTION public.get_account_status(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_account_id UUID;
    account_status TEXT;
    is_email_confirmed BOOLEAN;
    company_exists BOOLEAN;
BEGIN
    -- Get account
    SELECT id, status
    INTO target_account_id, account_status
    FROM identity.accounts
    WHERE auth_user_id = user_uuid;

    -- No account found
    IF target_account_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Only synchronize email/password verification state
    IF account_status = 'pending_verification' THEN

        -- Check whether Supabase has confirmed the email
        SELECT email_confirmed_at IS NOT NULL
        INTO is_email_confirmed
        FROM auth.users
        WHERE id = user_uuid;

        -- Confirm the company already exists
        SELECT EXISTS (
            SELECT 1
            FROM company.companies
            WHERE account_id = target_account_id
        )
        INTO company_exists;

        -- Activate only when BOTH conditions are satisfied
        IF COALESCE(is_email_confirmed, FALSE)
           AND company_exists THEN

            UPDATE identity.accounts
            SET
                status = 'active',
                updated_at = NOW()
            WHERE id = target_account_id
              AND status = 'pending_verification';

            account_status := 'active';
        END IF;
    END IF;

    RETURN account_status;
END;
$$;

-- Only the trusted server-side role should execute this function.
REVOKE EXECUTE
ON FUNCTION public.get_account_status(UUID)
FROM PUBLIC;

REVOKE EXECUTE
ON FUNCTION public.get_account_status(UUID)
FROM anon;

REVOKE EXECUTE
ON FUNCTION public.get_account_status(UUID)
FROM authenticated;

GRANT EXECUTE
ON FUNCTION public.get_account_status(UUID)
TO service_role;

-- Fix the permissions for the complete_company_setup RPC
-- We explicitly grant EXECUTE to the service_role since it was revoked from PUBLIC
GRANT EXECUTE ON FUNCTION public.complete_company_setup(UUID, TEXT) TO service_role;


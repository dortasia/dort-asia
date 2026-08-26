-- 024_session_revocation.sql

-- 1. Safely add the native Supabase session tracking column
ALTER TABLE identity.account_sessions
ADD COLUMN IF NOT EXISTS supabase_session_id UUID;

-- 2. Create the strictly-scoped server-only RPC
CREATE OR REPLACE FUNCTION identity.revoke_device_session(
    p_account_session_id UUID,
    p_user_id UUID,
    p_current_supabase_session_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_target_supabase_session_id UUID;
    v_is_active BOOLEAN;
BEGIN
    -- Validate ownership and get target session details
    SELECT supabase_session_id, is_active
    INTO v_target_supabase_session_id, v_is_active
    FROM identity.account_sessions
    WHERE id = p_account_session_id
      AND user_id = p_user_id;

    IF v_target_supabase_session_id IS NULL THEN
        RAISE EXCEPTION 'Target session not found or access denied';
    END IF;

    IF NOT v_is_active THEN
        RAISE EXCEPTION 'Target session is already inactive';
    END IF;

    -- Protect the current session using the actual Supabase session_id
    IF v_target_supabase_session_id = p_current_supabase_session_id THEN
        RAISE EXCEPTION 'Cannot revoke the current active session via this method';
    END IF;

    -- Safely revoke native Supabase authentication session
    DELETE FROM auth.sessions WHERE id = v_target_supabase_session_id;

    -- Mark local tracking table
    UPDATE identity.account_sessions
    SET is_active = false,
        revoked_at = now()
    WHERE id = p_account_session_id;

    RETURN TRUE;
END;
$$;

-- 3. Enforce Least Privilege (Service Role ONLY)
REVOKE ALL ON FUNCTION identity.revoke_device_session(UUID, UUID, UUID) FROM public;
REVOKE ALL ON FUNCTION identity.revoke_device_session(UUID, UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION identity.revoke_device_session(UUID, UUID, UUID) TO service_role;

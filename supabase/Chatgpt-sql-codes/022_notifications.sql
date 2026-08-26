-- 022_notifications.sql
-- Complete notification system for Dort Asia platform
-- Features: public.notifications table, strict personal RLS, Realtime publication, and secure stored procedures.

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Owner references
    account_id UUID REFERENCES identity.accounts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES company.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Notification payload
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system'
        CHECK (type IN ('system', 'billing', 'subscription', 'security', 'app')),

    -- State
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_active
ON public.notifications (user_id, is_dismissed, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_account_active
ON public.notifications (account_id, is_dismissed, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_company
ON public.notifications (company_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_service_role_all" ON public.notifications;

-- Authenticated users can view ONLY their own personal notifications (Strict user_id = auth.uid())
CREATE POLICY "notifications_select_policy"
ON public.notifications
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);

-- Authenticated users can update ONLY their own personal notifications (e.g. mark as read or dismiss)
CREATE POLICY "notifications_update_policy"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);

-- Service Role has unrestricted access for backend creation & processing
CREATE POLICY "notifications_service_role_all"
ON public.notifications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Enable Supabase Realtime for notifications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 5. Stored Procedures / RPCs

-- A. Mark Single Notification as Read
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(p_notification_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_updated_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    UPDATE public.notifications
    SET 
        is_read = TRUE,
        read_at = COALESCE(read_at, NOW())
    WHERE id = p_notification_id
      AND user_id = v_user_id
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Notification not found or access denied');
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_updated_id);
END;
$$;

-- B. Mark All User Notifications as Read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_count INT;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    WITH updated AS (
        UPDATE public.notifications
        SET 
            is_read = TRUE,
            read_at = COALESCE(read_at, NOW())
        WHERE is_read = FALSE
          AND user_id = v_user_id
        RETURNING id
    )
    SELECT count(*) INTO v_count FROM updated;

    RETURN jsonb_build_object('success', true, 'updated_count', v_count);
END;
$$;

-- C. Dismiss Notification
CREATE OR REPLACE FUNCTION public.dismiss_notification(p_notification_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_updated_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    UPDATE public.notifications
    SET 
        is_dismissed = TRUE,
        is_read = TRUE,
        read_at = COALESCE(read_at, NOW())
    WHERE id = p_notification_id
      AND user_id = v_user_id
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Notification not found or access denied');
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_updated_id);
END;
$$;

-- D. Create Notification (Strictly Server-Side Only via service_role)
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID DEFAULT NULL,
    p_company_id UUID DEFAULT NULL,
    p_title TEXT DEFAULT 'Notification',
    p_message TEXT DEFAULT '',
    p_type TEXT DEFAULT 'system',
    p_action_url TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_target_user_id UUID := p_user_id;
    v_target_account_id UUID;
    v_target_company_id UUID := p_company_id;
    v_notif_id UUID;
BEGIN
    -- If company_id is provided but user_id is null, resolve account and user
    IF v_target_company_id IS NOT NULL AND v_target_user_id IS NULL THEN
        SELECT a.id, a.auth_user_id
        INTO v_target_account_id, v_target_user_id
        FROM company.companies c
        JOIN identity.accounts a ON c.account_id = a.id
        WHERE c.id = v_target_company_id
        LIMIT 1;
    END IF;

    -- If user_id is provided but account_id is null, resolve account and company
    IF v_target_user_id IS NOT NULL AND v_target_account_id IS NULL THEN
        SELECT a.id, c.id
        INTO v_target_account_id, v_target_company_id
        FROM identity.accounts a
        LEFT JOIN company.companies c ON c.account_id = a.id
        WHERE a.auth_user_id = v_target_user_id
        LIMIT 1;
    END IF;

    IF v_target_user_id IS NULL THEN
        RAISE EXCEPTION 'Target user could not be resolved for notification creation';
    END IF;

    INSERT INTO public.notifications (
        account_id,
        company_id,
        user_id,
        title,
        message,
        type,
        action_url,
        metadata
    )
    VALUES (
        v_target_account_id,
        v_target_company_id,
        v_target_user_id,
        p_title,
        p_message,
        p_type,
        p_action_url,
        p_metadata
    )
    RETURNING id INTO v_notif_id;

    RETURN v_notif_id;
END;
$$;

-- 6. Strict Role Permissions

-- A. Revoke default executions from PUBLIC and anon on all notification functions
REVOKE EXECUTE ON FUNCTION public.mark_notification_as_read(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_all_notifications_as_read() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.dismiss_notification(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_notification(UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;

-- B. Grant authenticated user permissions only to read/dismiss functions
GRANT EXECUTE ON FUNCTION public.mark_notification_as_read(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_as_read() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dismiss_notification(UUID) TO authenticated, service_role;

-- C. create_notification is STRICTLY SERVER-ONLY (service_role only)
GRANT EXECUTE ON FUNCTION public.create_notification(UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role;

-- D. Grant table-level permissions so the API can query the notifications
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;


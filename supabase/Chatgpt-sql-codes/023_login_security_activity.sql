-- 1. Safely add missing columns to existing identity.account_sessions
ALTER TABLE identity.account_sessions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS device_id TEXT,
ADD COLUMN IF NOT EXISTS device_name TEXT,
ADD COLUMN IF NOT EXISTS device_type TEXT,
ADD COLUMN IF NOT EXISTS browser TEXT,
ADD COLUMN IF NOT EXISTS os TEXT,
ADD COLUMN IF NOT EXISTS country_code CHAR(2),
ADD COLUMN IF NOT EXISTS country_name TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Safely map existing user_ids from the identity.accounts table
UPDATE identity.account_sessions s
SET user_id = a.auth_user_id
FROM identity.accounts a
WHERE s.account_id = a.id AND s.user_id IS NULL;

-- Fail-safe check before setting NOT NULL
DO $$
DECLARE
    orphaned_count INT;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM identity.account_sessions
    WHERE user_id IS NULL;

    IF orphaned_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION FAILED: Cannot set identity.account_sessions.user_id to NOT NULL. Found % orphaned sessions without a valid user_id. Please resolve these manually first rather than silently deleting them.', orphaned_count;
    END IF;
END $$;

ALTER TABLE identity.account_sessions ALTER COLUMN user_id SET NOT NULL;

-- 2. Create the new identity.login_events table (Successful logins only)
CREATE TABLE IF NOT EXISTS identity.login_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES identity.accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES identity.account_sessions(id) ON DELETE SET NULL,
    auth_method TEXT NOT NULL DEFAULT 'email_password',
    device_id TEXT NOT NULL,
    device_name TEXT NOT NULL,
    device_type TEXT NOT NULL,
    browser TEXT NOT NULL,
    os TEXT NOT NULL,
    ip_address INET,
    country_code CHAR(2),
    country_name TEXT,
    city TEXT,
    region TEXT,
    event_type TEXT NOT NULL DEFAULT 'login' CHECK (event_type IN ('login', 'new_device', 'new_location', 'new_device_and_location')),
    is_new_device BOOLEAN NOT NULL DEFAULT FALSE,
    is_new_location BOOLEAN NOT NULL DEFAULT FALSE,
    notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_account_sessions_user_active_last_seen
ON identity.account_sessions(user_id, is_active, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_events_user_created
ON identity.login_events(user_id, created_at DESC);

-- 4. RLS Policies
ALTER TABLE identity.login_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.account_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own sessions and login events
DROP POLICY IF EXISTS "account_sessions_select" ON identity.account_sessions;
CREATE POLICY "account_sessions_select" ON identity.account_sessions 
FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "login_events_select" ON identity.login_events;
CREATE POLICY "login_events_select" ON identity.login_events 
FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ONLY service_role can insert sessions and login events (enforcing server-side security)

-- 5. PostgREST / API Permissions
-- The authenticated role must be explicitly granted usage to query the schema via the API
GRANT USAGE ON SCHEMA identity TO authenticated;
GRANT SELECT ON identity.account_sessions TO authenticated;
GRANT SELECT ON identity.login_events TO authenticated;

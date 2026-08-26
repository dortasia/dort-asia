-- ============================================================================
-- 20260824000000_admin_portal_architecture.sql
-- Production-Ready Admin Portal & Multi-Tier Authorization System
-- Schemas: identity, audit, platform, marketplace, subscriptions, billing
-- ============================================================================

-- 1. Create identity.admin_users Table
CREATE TABLE IF NOT EXISTS identity.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES identity.accounts(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('SUPER_ADMIN', 'ADMIN')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON identity.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role_active ON identity.admin_users(role, is_active);

-- 2. Create audit.admin_audit_logs Table (Append-Only Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS audit.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES identity.admin_users(id) ON DELETE SET NULL,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    previous_value JSONB DEFAULT '{}'::jsonb,
    new_value JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON audit.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource ON audit.admin_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON audit.admin_audit_logs(created_at DESC);

-- 3. Enhance platform.apps with full marketplace configuration columns (Idempotent)
ALTER TABLE platform.apps 
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS long_description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'HR & Operations',
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'Web & Cloud',
ADD COLUMN IF NOT EXISTS hero_image TEXT,
ADD COLUMN IF NOT EXISTS icon_background TEXT,
ADD COLUMN IF NOT EXISTS badge TEXT,
ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS developer TEXT DEFAULT 'Dort Asia Team',
ADD COLUMN IF NOT EXISTS route TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS screenshots JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '[]'::jsonb;

-- 4. Enhance marketplace.app_plans
ALTER TABLE marketplace.app_plans
ADD COLUMN IF NOT EXISTS yearly_price NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cta_text TEXT DEFAULT 'Select Plan',
ADD COLUMN IF NOT EXISTS cta_route TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 5. Enhance platform.app_features for centralized feature catalog
ALTER TABLE platform.app_features
ADD COLUMN IF NOT EXISTS value_type TEXT NOT NULL DEFAULT 'BOOLEAN' 
    CHECK (value_type IN ('BOOLEAN', 'NUMBER', 'STRING', 'JSON')),
ADD COLUMN IF NOT EXISTS default_value JSONB DEFAULT 'true'::jsonb,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Core';

-- 6. Helper Security Functions (SECURITY DEFINER with strict search_path)
CREATE OR REPLACE FUNCTION identity.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = identity, public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM identity.admin_users 
        WHERE user_id = user_uuid 
          AND is_active = TRUE
    );
$$;

CREATE OR REPLACE FUNCTION identity.is_super_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = identity, public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM identity.admin_users 
        WHERE user_id = user_uuid 
          AND role = 'SUPER_ADMIN'
          AND is_active = TRUE
    );
$$;

CREATE OR REPLACE FUNCTION identity.get_admin_role(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = identity, public, pg_temp
AS $$
    SELECT role 
    FROM identity.admin_users 
    WHERE user_id = user_uuid 
      AND is_active = TRUE
    LIMIT 1;
$$;

-- Explicitly configure execution permissions for helper functions
REVOKE ALL ON FUNCTION identity.is_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION identity.is_admin(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION identity.is_admin(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION identity.is_super_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION identity.is_super_admin(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION identity.is_super_admin(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION identity.get_admin_role(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION identity.get_admin_role(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION identity.get_admin_role(UUID) TO authenticated, service_role;

-- 7. Row Level Security Policies
ALTER TABLE identity.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 7.1 Admin Users Policies
-- Both ADMIN and SUPER_ADMIN can view the administrator directory
DROP POLICY IF EXISTS "admin_users_select" ON identity.admin_users;
CREATE POLICY "admin_users_select"
ON identity.admin_users
FOR SELECT
TO authenticated
USING (
    identity.is_admin()
);

-- Only active SUPER_ADMIN can insert, update, or delete administrator accounts
DROP POLICY IF EXISTS "admin_users_super_admin_manage" ON identity.admin_users;
CREATE POLICY "admin_users_super_admin_manage"
ON identity.admin_users
FOR ALL
TO authenticated
USING (
    identity.is_super_admin()
)
WITH CHECK (
    identity.is_super_admin()
);

-- 7.2 Admin Audit Logs Policies
-- Both ADMIN and SUPER_ADMIN can inspect audit records
DROP POLICY IF EXISTS "admin_audit_logs_select" ON audit.admin_audit_logs;
CREATE POLICY "admin_audit_logs_select"
ON audit.admin_audit_logs
FOR SELECT
TO authenticated
USING (
    identity.is_admin()
);

-- Active administrators can record audit entries
DROP POLICY IF EXISTS "admin_audit_logs_insert" ON audit.admin_audit_logs;
CREATE POLICY "admin_audit_logs_insert"
ON audit.admin_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
    identity.is_admin()
);

-- NOTE: No UPDATE or DELETE policies are granted on audit.admin_audit_logs.
-- Audit logs are strictly immutable and cannot be tampered with or purged by any user.

-- 7.3 Marketplace Catalog (ADMIN + SUPER_ADMIN have Full CRUD)
DROP POLICY IF EXISTS "admin_all_apps" ON platform.apps;
CREATE POLICY "admin_all_apps"
ON platform.apps
FOR ALL
TO authenticated
USING (
    identity.is_admin()
)
WITH CHECK (
    identity.is_admin()
);

DROP POLICY IF EXISTS "admin_all_app_features" ON platform.app_features;
CREATE POLICY "admin_all_app_features"
ON platform.app_features
FOR ALL
TO authenticated
USING (
    identity.is_admin()
)
WITH CHECK (
    identity.is_admin()
);

DROP POLICY IF EXISTS "admin_all_plans" ON marketplace.app_plans;
CREATE POLICY "admin_all_plans"
ON marketplace.app_plans
FOR ALL
TO authenticated
USING (
    identity.is_admin()
)
WITH CHECK (
    identity.is_admin()
);

DROP POLICY IF EXISTS "admin_all_plan_features" ON marketplace.plan_features;
CREATE POLICY "admin_all_plan_features"
ON marketplace.plan_features
FOR ALL
TO authenticated
USING (
    identity.is_admin()
)
WITH CHECK (
    identity.is_admin()
);

-- 7.4 Customer Accounts & Organization Directory (Read-Only for ADMIN & SUPER_ADMIN)
DROP POLICY IF EXISTS "admin_all_companies" ON company.companies;
CREATE POLICY "admin_all_companies"
ON company.companies
FOR SELECT
TO authenticated
USING (
    identity.is_admin()
);

DROP POLICY IF EXISTS "admin_all_accounts" ON identity.accounts;
CREATE POLICY "admin_all_accounts"
ON identity.accounts
FOR SELECT
TO authenticated
USING (
    identity.is_admin()
);

-- 7.5 Subscriptions Directory
-- Read-Only for ADMIN and SUPER_ADMIN
DROP POLICY IF EXISTS "admin_subscriptions_select" ON subscriptions.subscriptions;
DROP POLICY IF EXISTS "admin_all_subscriptions" ON subscriptions.subscriptions;
CREATE POLICY "admin_subscriptions_select"
ON subscriptions.subscriptions
FOR SELECT
TO authenticated
USING (
    identity.is_admin()
);

-- Lifecycle Mutation (Cancel/Pause/Status overrides) is restricted to SUPER_ADMIN
DROP POLICY IF EXISTS "super_admin_subscriptions_manage" ON subscriptions.subscriptions;
CREATE POLICY "super_admin_subscriptions_manage"
ON subscriptions.subscriptions
FOR ALL
TO authenticated
USING (
    identity.is_super_admin()
)
WITH CHECK (
    identity.is_super_admin()
);

-- 7.6 Billing Invoices & Payments
-- Read-Only for ADMIN and SUPER_ADMIN
DROP POLICY IF EXISTS "admin_invoices_select" ON billing.invoices;
DROP POLICY IF EXISTS "admin_all_invoices" ON billing.invoices;
CREATE POLICY "admin_invoices_select"
ON billing.invoices
FOR SELECT
TO authenticated
USING (
    identity.is_admin()
);

DROP POLICY IF EXISTS "super_admin_invoices_manage" ON billing.invoices;
CREATE POLICY "super_admin_invoices_manage"
ON billing.invoices
FOR ALL
TO authenticated
USING (
    identity.is_super_admin()
)
WITH CHECK (
    identity.is_super_admin()
);

DROP POLICY IF EXISTS "admin_payments_select" ON billing.payments;
DROP POLICY IF EXISTS "admin_all_payments" ON billing.payments;
CREATE POLICY "admin_payments_select"
ON billing.payments
FOR SELECT
TO authenticated
USING (
    identity.is_admin()
);

DROP POLICY IF EXISTS "super_admin_payments_manage" ON billing.payments;
CREATE POLICY "super_admin_payments_manage"
ON billing.payments
FOR ALL
TO authenticated
USING (
    identity.is_super_admin()
)
WITH CHECK (
    identity.is_super_admin()
);

-- 8. Hardened Bootstrap Super Admin Function
-- Strictly restricts invocation to service_role or active SUPER_ADMIN callers.
-- Prevents arbitrary authenticated users from promoting themselves or others.
CREATE OR REPLACE FUNCTION identity.bootstrap_super_admin(target_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = identity, auth, public, pg_temp
AS $$
DECLARE
    target_user_id UUID;
    target_account_id UUID;
    existing_admin_id UUID;
    super_admin_count INTEGER;
    caller_role TEXT;
    is_service_role BOOLEAN;
    caller_is_super_admin BOOLEAN;
BEGIN
    -- Input sanitization
    IF target_email IS NULL OR trim(target_email) = '' THEN
        RAISE EXCEPTION 'Target email cannot be empty' USING ERRCODE = '22023';
    END IF;

    -- 1. Check if ANY active SUPER_ADMIN already exists
    SELECT COUNT(*) INTO super_admin_count
    FROM identity.admin_users
    WHERE role = 'SUPER_ADMIN' AND is_active = TRUE;

    -- 2. Determine caller privileges
    caller_role := COALESCE(
        current_setting('request.jwt.claim.role', true),
        auth.role()
    );
    is_service_role := (caller_role = 'service_role');

    caller_is_super_admin := (auth.uid() IS NOT NULL AND identity.is_super_admin(auth.uid()));

    -- 3. Enforce strict authorization guard:
    -- If a SUPER_ADMIN already exists, ONLY service_role or an existing SUPER_ADMIN can run this function.
    IF super_admin_count > 0 AND NOT is_service_role AND NOT caller_is_super_admin THEN
        RAISE EXCEPTION 'Access Denied: Initial SUPER_ADMIN bootstrap has already been completed. Administrator user provisioning must be performed through the protected Admin Panel.'
            USING ERRCODE = '42501';
    END IF;

    -- 4. Locate target user in auth.users
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE lower(email) = lower(trim(target_email))
    LIMIT 1;

    IF target_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'USER_NOT_FOUND',
            'message', format('No registered auth user found with email "%s". User must register an account first.', target_email)
        );
    END IF;

    -- 5. Locate corresponding identity account if exists
    SELECT id INTO target_account_id
    FROM identity.accounts
    WHERE auth_user_id = target_user_id
    LIMIT 1;

    -- 6. Upsert admin record
    SELECT id INTO existing_admin_id
    FROM identity.admin_users
    WHERE user_id = target_user_id;

    IF existing_admin_id IS NOT NULL THEN
        UPDATE identity.admin_users
        SET role = 'SUPER_ADMIN', 
            is_active = TRUE, 
            updated_at = NOW()
        WHERE id = existing_admin_id;
        
        -- Record audit entry
        INSERT INTO audit.admin_audit_logs (
            admin_user_id,
            auth_user_id,
            actor_email,
            action,
            resource_type,
            resource_id,
            new_value
        ) VALUES (
            existing_admin_id,
            target_user_id,
            target_email,
            'BOOTSTRAP_SUPER_ADMIN_PROMOTED',
            'admin_user',
            existing_admin_id::text,
            jsonb_build_object('email', target_email, 'role', 'SUPER_ADMIN', 'is_active', true)
        );

        RETURN json_build_object(
            'success', true, 
            'message', format('Updated existing user "%s" to active SUPER_ADMIN.', target_email), 
            'user_id', target_user_id
        );
    ELSE
        INSERT INTO identity.admin_users (user_id, account_id, role, is_active)
        VALUES (target_user_id, target_account_id, 'SUPER_ADMIN', TRUE)
        RETURNING id INTO existing_admin_id;
        
        -- Record audit entry
        INSERT INTO audit.admin_audit_logs (
            admin_user_id,
            auth_user_id,
            actor_email,
            action,
            resource_type,
            resource_id,
            new_value
        ) VALUES (
            existing_admin_id,
            target_user_id,
            target_email,
            'BOOTSTRAP_SUPER_ADMIN_CREATED',
            'admin_user',
            existing_admin_id::text,
            jsonb_build_object('email', target_email, 'role', 'SUPER_ADMIN', 'is_active', true)
        );

        RETURN json_build_object(
            'success', true, 
            'message', format('Created initial active SUPER_ADMIN for "%s".', target_email), 
            'user_id', target_user_id
        );
    END IF;
END;
$$;

-- 9. Explicitly Revoke and Grant EXECUTE privileges
REVOKE ALL ON FUNCTION identity.bootstrap_super_admin(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION identity.bootstrap_super_admin(TEXT) FROM anon;
REVOKE ALL ON FUNCTION identity.bootstrap_super_admin(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION identity.bootstrap_super_admin(TEXT) TO service_role;

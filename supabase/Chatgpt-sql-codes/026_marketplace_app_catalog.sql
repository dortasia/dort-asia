-- ============================================================================
-- 026_marketplace_app_catalog.sql
-- Production Marketplace Catalog, Dynamic Content Schema & Hardened Atomic App Upsert RPC
-- Schemas: platform, marketplace, audit, identity
-- ============================================================================

-- 1. Explicit Schema Usage & Table Permissions
GRANT USAGE ON SCHEMA platform, marketplace, identity, audit TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA platform, marketplace, identity, audit TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA platform, marketplace TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA platform, marketplace TO postgres, service_role;

-- Revoke broad execution; grant EXECUTE only to explicitly approved RPCs
REVOKE ALL ON ALL ROUTINES IN SCHEMA platform, marketplace FROM PUBLIC, anon;

-- 2. Ensure platform.apps has all dynamic marketplace content columns
ALTER TABLE platform.apps 
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS long_description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'HR & Workforce',
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'Web + Mobile',
ADD COLUMN IF NOT EXISTS hero_image TEXT,
ADD COLUMN IF NOT EXISTS icon_background TEXT DEFAULT 'bg-white',
ADD COLUMN IF NOT EXISTS badge TEXT,
ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS developer TEXT DEFAULT 'Dort Asia Technologies',
ADD COLUMN IF NOT EXISTS route TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS screenshots JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS core_features JSONB DEFAULT '[]'::jsonb;

-- 3. Ensure marketplace.app_plans columns
ALTER TABLE marketplace.app_plans
ADD COLUMN IF NOT EXISTS yearly_price NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cta_text TEXT DEFAULT 'Select Plan',
ADD COLUMN IF NOT EXISTS cta_route TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 4. Ensure platform.app_features columns for entitlements
ALTER TABLE platform.app_features
ADD COLUMN IF NOT EXISTS value_type TEXT NOT NULL DEFAULT 'BOOLEAN' 
    CHECK (value_type IN ('BOOLEAN', 'NUMBER', 'STRING', 'JSON')),
ADD COLUMN IF NOT EXISTS default_value JSONB DEFAULT 'true'::jsonb,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Core';

-- 5. Ensure marketplace.plan_features table and schema
CREATE TABLE IF NOT EXISTS marketplace.plan_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES marketplace.app_plans(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES platform.app_features(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    limits JSONB NOT NULL DEFAULT '{"is_unlimited": false, "value": null}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(plan_id, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_plan_features_plan ON marketplace.plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_feature ON marketplace.plan_features(feature_id);

-- 6. Enable RLS on all platform and marketplace tables
ALTER TABLE platform.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.app_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace.app_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace.plan_features ENABLE ROW LEVEL SECURITY;

-- 7. Hardened Row-Level Security Policies

-- Remove ALL direct authenticated write access (INSERT/UPDATE/DELETE).
-- All mutations must go through the protected platform.save_full_app() RPC.
DROP POLICY IF EXISTS "apps_admin_write" ON platform.apps;
DROP POLICY IF EXISTS "apps_admin_update" ON platform.apps;
DROP POLICY IF EXISTS "apps_super_admin_delete" ON platform.apps;
DROP POLICY IF EXISTS "app_features_admin_write" ON platform.app_features;
DROP POLICY IF EXISTS "app_plans_admin_write" ON marketplace.app_plans;
DROP POLICY IF EXISTS "plan_features_admin_write" ON marketplace.plan_features;

-- platform.apps: Public can view active published apps; Admins can view all.
DROP POLICY IF EXISTS "apps_public_read" ON platform.apps;
CREATE POLICY "apps_public_read" ON platform.apps
    FOR SELECT TO anon, authenticated
    USING (status IN ('active', 'published') OR identity.is_admin());

-- platform.app_features: Public can view features of active apps.
DROP POLICY IF EXISTS "app_features_public_read" ON platform.app_features;
CREATE POLICY "app_features_public_read" ON platform.app_features
    FOR SELECT TO anon, authenticated
    USING (
        identity.is_admin() OR 
        EXISTS (
            SELECT 1 FROM platform.apps a 
            WHERE a.id = app_features.app_id AND a.status IN ('active', 'published')
        )
    );

-- marketplace.app_plans: Public can view active plans of active apps.
DROP POLICY IF EXISTS "app_plans_public_read" ON marketplace.app_plans;
CREATE POLICY "app_plans_public_read" ON marketplace.app_plans
    FOR SELECT TO anon, authenticated
    USING (
        identity.is_admin() OR 
        (
            status = 'active' AND 
            EXISTS (
                SELECT 1 FROM platform.apps a 
                WHERE a.id = app_plans.app_id AND a.status IN ('active', 'published')
            )
        )
    );

-- marketplace.plan_features: Public can view active plans of active apps.
DROP POLICY IF EXISTS "plan_features_public_read" ON marketplace.plan_features;
CREATE POLICY "plan_features_public_read" ON marketplace.plan_features
    FOR SELECT TO anon, authenticated
    USING (
        identity.is_admin() OR 
        EXISTS (
            SELECT 1 FROM marketplace.app_plans p 
            JOIN platform.apps a ON p.app_id = a.id 
            WHERE p.id = plan_features.plan_id 
              AND p.status = 'active' 
              AND a.status IN ('active', 'published')
        )
    );

-- 8. Hardened Atomic Server-Side App Upsert RPC (Transactional with Built-in Audit Trail)
CREATE OR REPLACE FUNCTION platform.save_full_app(app_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform, marketplace, identity, audit, pg_catalog
AS $$
DECLARE
    caller_uuid UUID := auth.uid();
    is_super BOOLEAN := FALSE;
    is_adm BOOLEAN := FALSE;
    is_svc BOOLEAN := FALSE;
    target_app_id UUID;
    app_slug TEXT;
    app_status TEXT;
    feat_record JSONB;
    plan_record JSONB;
    plan_feat_record JSONB;
    new_plan_id UUID;
    new_feat_id UUID;
    existing_feat_id UUID;
    existing_plan_id UUID;
    feat_owner_app UUID;
    existing_app_status TEXT;
    audit_action TEXT;
    plan_price NUMERIC;
    plan_interval TEXT;
    plan_trial INTEGER;
    limit_val JSONB;
BEGIN
    -- Determine execution role
    is_svc := (current_setting('request.jwt.claim.role', true) = 'service_role');
    
    IF NOT is_svc THEN
        IF caller_uuid IS NULL THEN
            RAISE EXCEPTION 'Authentication Required: No valid session token.' USING ERRCODE = '42501';
        END IF;

        is_adm := identity.is_admin(caller_uuid);
        is_super := identity.is_super_admin(caller_uuid);

        IF NOT is_adm THEN
            RAISE EXCEPTION 'Access Denied: Only authorized administrators can save marketplace applications.' 
                USING ERRCODE = '42501';
        END IF;
    ELSE
        is_adm := TRUE;
        is_super := TRUE;
    END IF;

    -- Validate slug
    app_slug := trim(app_payload->>'slug');
    IF app_slug IS NULL OR app_slug = '' OR app_slug !~ '^[a-z0-9-]+$' THEN
        RAISE EXCEPTION 'Invalid app slug: Slug must consist of lowercase letters, numbers, and hyphens only.' 
            USING ERRCODE = '22023';
    END IF;

    -- Validate status
    app_status := lower(COALESCE(app_payload->>'status', 'draft'));
    IF app_status = 'published' THEN
        app_status := 'active';
    ELSIF app_status = 'archived' THEN
        app_status := 'deprecated';
    END IF;

    IF app_status NOT IN ('draft', 'active', 'deprecated', 'maintenance', 'disabled') THEN
        RAISE EXCEPTION 'Invalid app status: %', app_status USING ERRCODE = '22023';
    END IF;

    -- Enforce ADMIN vs SUPER_ADMIN boundary:
    -- Regular ADMIN can create and edit DRAFT applications only.
    -- Publishing (active) or Archiving (deprecated/disabled) requires SUPER_ADMIN.
    IF app_status IN ('active', 'deprecated', 'disabled') AND NOT is_super THEN
        RAISE EXCEPTION 'Access Denied: Only SUPER_ADMIN is authorized to publish, archive, or disable platform applications.' 
            USING ERRCODE = '42501';
    END IF;

    -- 1. Process platform.apps
    IF app_payload->>'id' IS NOT NULL AND trim(app_payload->>'id') != '' THEN
        target_app_id := (app_payload->>'id')::UUID;
        
        -- Check if application exists and get its status
        SELECT status INTO existing_app_status FROM platform.apps WHERE id = target_app_id;
        IF existing_app_status IS NULL THEN
            RAISE EXCEPTION 'Application with ID % does not exist.', target_app_id USING ERRCODE = 'P0002';
        END IF;

        -- Prevent regular ADMIN from modifying a published/active/deprecated/disabled app
        IF existing_app_status IN ('active', 'published', 'deprecated', 'disabled') AND NOT is_super THEN
            RAISE EXCEPTION 'Access Denied: Regular ADMIN cannot modify an active, published, deprecated, or disabled application.' 
                USING ERRCODE = '42501';
        END IF;

        -- Prevent slug conflict on update
        IF EXISTS(SELECT 1 FROM platform.apps WHERE slug = app_slug AND id != target_app_id) THEN
            RAISE EXCEPTION 'Application with slug % already exists.', app_slug USING ERRCODE = '23505';
        END IF;

        UPDATE platform.apps SET
            name = COALESCE(app_payload->>'name', name),
            slug = app_slug,
            tagline = app_payload->>'tagline',
            description = app_payload->>'description',
            long_description = app_payload->>'long_description',
            category = COALESCE(app_payload->>'category', 'HR & Workforce'),
            platform = COALESCE(app_payload->>'platform', 'Web + Mobile'),
            logo_url = app_payload->>'logo_url',
            hero_image = app_payload->>'hero_image',
            icon_background = COALESCE(app_payload->>'icon_background', 'bg-white'),
            badge = app_payload->>'badge',
            version = COALESCE(app_payload->>'version', '1.0.0'),
            developer = COALESCE(app_payload->>'developer', 'Dort Asia Technologies'),
            route = COALESCE(app_payload->>'route', format('/dashboard/marketplace/%s', app_slug)),
            status = app_status,
            screenshots = COALESCE(app_payload->'screenshots', '[]'::jsonb),
            highlights = COALESCE(app_payload->'highlights', '[]'::jsonb),
            benefits = COALESCE(app_payload->'benefits', '[]'::jsonb),
            modules = COALESCE(app_payload->'modules', '[]'::jsonb),
            core_features = COALESCE(app_payload->'core_features', '[]'::jsonb),
            updated_at = NOW()
        WHERE id = target_app_id;

        audit_action := CASE WHEN app_status = 'active' THEN 'APP_PUBLISHED'
                             WHEN app_status = 'deprecated' THEN 'APP_ARCHIVED'
                             ELSE 'APP_UPDATED' END;
    ELSE
        -- Prevent slug conflict on insert
        IF EXISTS(SELECT 1 FROM platform.apps WHERE slug = app_slug) THEN
            RAISE EXCEPTION 'Application with slug % already exists.', app_slug USING ERRCODE = '23505';
        END IF;

        INSERT INTO platform.apps (
            name,
            slug,
            tagline,
            description,
            long_description,
            category,
            platform,
            logo_url,
            hero_image,
            icon_background,
            badge,
            version,
            developer,
            route,
            status,
            screenshots,
            highlights,
            benefits,
            modules,
            core_features
        ) VALUES (
            app_payload->>'name',
            app_slug,
            app_payload->>'tagline',
            app_payload->>'description',
            app_payload->>'long_description',
            COALESCE(app_payload->>'category', 'HR & Workforce'),
            COALESCE(app_payload->>'platform', 'Web + Mobile'),
            app_payload->>'logo_url',
            app_payload->>'hero_image',
            COALESCE(app_payload->>'icon_background', 'bg-white'),
            app_payload->>'badge',
            COALESCE(app_payload->>'version', '1.0.0'),
            COALESCE(app_payload->>'developer', 'Dort Asia Technologies'),
            COALESCE(app_payload->>'route', format('/dashboard/marketplace/%s', app_slug)),
            app_status,
            COALESCE(app_payload->'screenshots', '[]'::jsonb),
            COALESCE(app_payload->'highlights', '[]'::jsonb),
            COALESCE(app_payload->'benefits', '[]'::jsonb),
            COALESCE(app_payload->'modules', '[]'::jsonb),
            COALESCE(app_payload->'core_features', '[]'::jsonb)
        )
        RETURNING id INTO target_app_id;

        audit_action := CASE WHEN app_status = 'active' THEN 'APP_PUBLISHED' ELSE 'APP_CREATED' END;
    END IF;

    -- 2. Process Entitlement Features (platform.app_features)
    IF app_payload->'entitlement_features' IS NOT NULL AND jsonb_array_length(app_payload->'entitlement_features') > 0 THEN
        FOR feat_record IN SELECT * FROM jsonb_array_elements(app_payload->'entitlement_features') LOOP
            IF feat_record->>'value_type' IS NOT NULL AND feat_record->>'value_type' NOT IN ('BOOLEAN', 'NUMBER', 'STRING', 'JSON') THEN
                RAISE EXCEPTION 'Invalid feature value_type: %', feat_record->>'value_type' USING ERRCODE = '22023';
            END IF;

            SELECT id INTO existing_feat_id
            FROM platform.app_features
            WHERE app_id = target_app_id AND feature_key = trim(feat_record->>'feature_key');

            IF existing_feat_id IS NOT NULL THEN
                UPDATE platform.app_features SET
                    name = feat_record->>'name',
                    description = feat_record->>'description',
                    value_type = COALESCE(feat_record->>'value_type', 'BOOLEAN'),
                    default_value = COALESCE(feat_record->'default_value', 'true'::jsonb),
                    category = COALESCE(feat_record->>'category', 'Core'),
                    status = COALESCE(feat_record->>'status', 'active')
                WHERE id = existing_feat_id;
            ELSE
                INSERT INTO platform.app_features (
                    app_id,
                    feature_key,
                    name,
                    description,
                    value_type,
                    default_value,
                    category,
                    status
                ) VALUES (
                    target_app_id,
                    trim(feat_record->>'feature_key'),
                    feat_record->>'name',
                    feat_record->>'description',
                    COALESCE(feat_record->>'value_type', 'BOOLEAN'),
                    COALESCE(feat_record->'default_value', 'true'::jsonb),
                    COALESCE(feat_record->>'category', 'Core'),
                    COALESCE(feat_record->>'status', 'active')
                );
            END IF;
        END LOOP;
    END IF;

    -- 3. Process Subscription Plans (marketplace.app_plans & marketplace.plan_features)
    IF app_payload->'plans' IS NOT NULL AND jsonb_array_length(app_payload->'plans') > 0 THEN
        FOR plan_record IN SELECT * FROM jsonb_array_elements(app_payload->'plans') LOOP
            plan_price := (plan_record->>'price')::NUMERIC;
            IF plan_price < 0 THEN
                RAISE EXCEPTION 'Plan price cannot be negative.' USING ERRCODE = '22023';
            END IF;

            plan_interval := lower(COALESCE(plan_record->>'billing_interval', 'monthly'));
            IF plan_interval NOT IN ('monthly', 'yearly', 'one_time') THEN
                RAISE EXCEPTION 'Invalid billing interval: %', plan_interval USING ERRCODE = '22023';
            END IF;

            plan_trial := COALESCE((plan_record->>'trial_days')::INTEGER, 0);
            IF plan_trial < 0 THEN
                RAISE EXCEPTION 'Trial days cannot be negative.' USING ERRCODE = '22023';
            END IF;

            SELECT id INTO existing_plan_id
            FROM marketplace.app_plans
            WHERE app_id = target_app_id AND plan_code = trim(plan_record->>'plan_code');

            IF existing_plan_id IS NOT NULL THEN
                UPDATE marketplace.app_plans SET
                    name = plan_record->>'name',
                    description = plan_record->>'description',
                    price = plan_price,
                    yearly_price = (plan_record->>'yearly_price')::NUMERIC,
                    currency = COALESCE(plan_record->>'currency', 'SGD'),
                    billing_interval = plan_interval,
                    trial_days = plan_trial,
                    popular = COALESCE((plan_record->>'popular')::BOOLEAN, FALSE),
                    cta_text = COALESCE(plan_record->>'cta_text', 'Select Plan'),
                    status = COALESCE(plan_record->>'status', 'active'),
                    sort_order = COALESCE((plan_record->>'sort_order')::INTEGER, 0),
                    updated_at = NOW()
                WHERE id = existing_plan_id;
                new_plan_id := existing_plan_id;
            ELSE
                INSERT INTO marketplace.app_plans (
                    app_id,
                    plan_code,
                    name,
                    description,
                    price,
                    yearly_price,
                    currency,
                    billing_interval,
                    trial_days,
                    popular,
                    cta_text,
                    status,
                    sort_order
                ) VALUES (
                    target_app_id,
                    trim(plan_record->>'plan_code'),
                    plan_record->>'name',
                    plan_record->>'description',
                    plan_price,
                    (plan_record->>'yearly_price')::NUMERIC,
                    COALESCE(plan_record->>'currency', 'SGD'),
                    plan_interval,
                    plan_trial,
                    COALESCE((plan_record->>'popular')::BOOLEAN, FALSE),
                    COALESCE(plan_record->>'cta_text', 'Select Plan'),
                    COALESCE(plan_record->>'status', 'active'),
                    COALESCE((plan_record->>'sort_order')::INTEGER, 0)
                )
                RETURNING id INTO new_plan_id;
            END IF;

            -- 3.1 Upsert Plan Feature Limit Bindings with Cross-App Integrity Guard
            IF plan_record->'features' IS NOT NULL AND jsonb_array_length(plan_record->'features') > 0 THEN
                FOR plan_feat_record IN SELECT * FROM jsonb_array_elements(plan_record->'features') LOOP
                    IF plan_feat_record->>'feature_id' IS NOT NULL THEN
                        new_feat_id := (plan_feat_record->>'feature_id')::UUID;
                    ELSIF plan_feat_record->>'feature_key' IS NOT NULL THEN
                        SELECT id INTO new_feat_id
                        FROM platform.app_features
                        WHERE app_id = target_app_id AND feature_key = trim(plan_feat_record->>'feature_key');
                    ELSE
                        new_feat_id := NULL;
                    END IF;

                    IF new_feat_id IS NOT NULL THEN
                        -- Cross-app integrity check: Verify feature belongs to target_app_id
                        SELECT app_id INTO feat_owner_app
                        FROM platform.app_features
                        WHERE id = new_feat_id;

                        IF feat_owner_app IS DISTINCT FROM target_app_id THEN
                            RAISE EXCEPTION 'Security Violation: Cannot bind feature % (owned by app %) to plan % (owned by app %)',
                                new_feat_id, feat_owner_app, new_plan_id, target_app_id
                                USING ERRCODE = '42501';
                        END IF;

                        -- Validate limit consistency
                        limit_val := COALESCE(plan_feat_record->'limits', '{"is_unlimited": false, "value": null}'::jsonb);

                        INSERT INTO marketplace.plan_features (
                            plan_id,
                            feature_id,
                            enabled,
                            limits
                        ) VALUES (
                            new_plan_id,
                            new_feat_id,
                            COALESCE((plan_feat_record->>'enabled')::BOOLEAN, TRUE),
                            limit_val
                        )
                        ON CONFLICT (plan_id, feature_id) DO UPDATE SET
                            enabled = EXCLUDED.enabled,
                            limits = EXCLUDED.limits;
                    END IF;
                END LOOP;
            END IF;
        END LOOP;
    END IF;

    -- 4. Immutable Audit Event Creation (Guaranteed Execution on Success)
    INSERT INTO audit.admin_audit_logs (
        admin_user_id,
        action,
        resource_type,
        resource_id,
        new_value
    ) VALUES (
        COALESCE(caller_uuid, '00000000-0000-0000-0000-000000000000'::UUID),
        audit_action,
        'app',
        target_app_id::TEXT,
        jsonb_build_object(
            'slug', app_slug,
            'name', app_payload->>'name',
            'status', app_status,
            'plans_count', COALESCE(jsonb_array_length(app_payload->'plans'), 0),
            'features_count', COALESCE(jsonb_array_length(app_payload->'entitlement_features'), 0)
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'app_id', target_app_id,
        'slug', app_slug,
        'status', app_status,
        'message', 'Application and marketplace catalog saved successfully.'
    );
END;
$$;

-- Grant EXECUTE exclusively to authenticated and service_role
REVOKE ALL ON FUNCTION platform.save_full_app(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION platform.save_full_app(JSONB) TO authenticated, service_role;

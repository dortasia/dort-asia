-- Phase 5: Legacy Data Migration (from V1/V2 to V5)
-- WARNING: This migration relies on temporary mapping tables to map string-based legacy plans 
-- to the new UUID-based V3 Catalog architecture.

DO $$
DECLARE
  default_app_id text := 'xentra_people'; -- Default app for legacy subscriptions
  owner_role_id uuid;
  admin_role_id uuid;
  member_role_id uuid;
  unmapped_plans_count int;
  unmapped_apps_count int;
BEGIN
  
  -- 1. Ensure system roles exist for the mapping
  SELECT id INTO owner_role_id FROM public.organization_roles WHERE name = 'owner' AND is_system = true;
  SELECT id INTO admin_role_id FROM public.organization_roles WHERE name = 'admin' AND is_system = true;
  SELECT id INTO member_role_id FROM public.organization_roles WHERE name = 'member' AND is_system = true;
  
  IF owner_role_id IS NULL OR member_role_id IS NULL THEN
    RAISE EXCEPTION 'V3 System roles missing. Run V5 migration 001 first.';
  END IF;

  -- 2. Create Temporary Mapping Tables
  CREATE TEMP TABLE temp_plan_mapping (
    legacy_plan_name text PRIMARY KEY,
    v3_plan_id uuid,
    v3_plan_price_id uuid,
    app_id text
  );
  
  -- Note: The admin running this migration MUST populate `temp_plan_mapping` 
  -- by linking their legacy Stripe plan names (e.g., 'Free', 'Pro') to the exact UUIDs generated in `public.plans` and `public.plan_prices`.
  -- For safety, we will detect if any legacy plans are missing from the mapping and fail loudly.
  
  -- EXAMPLE POPULATION (Must be customized to actual UUIDs in the database):
  -- INSERT INTO temp_plan_mapping (legacy_plan_name, v3_plan_id, v3_plan_price_id, app_id)
  -- VALUES ('Premium', 'uuid-of-plan', 'uuid-of-price', 'xentra_people');

  -- 3. Safety Check: Do we have unmapped legacy plans?
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_subscriptions') THEN
    SELECT COUNT(*) INTO unmapped_plans_count
    FROM public.legacy_subscriptions ls
    LEFT JOIN temp_plan_mapping tm ON ls.plan_name = tm.legacy_plan_name
    WHERE tm.v3_plan_id IS NULL;
    
    IF unmapped_plans_count > 0 THEN
      RAISE EXCEPTION 'MIGRATION HALTED: Found % legacy subscriptions with unmapped plans. Please populate temp_plan_mapping before running this migration.', unmapped_plans_count;
    END IF;
  END IF;

  -- 4. Migrate legacy_companies to organizations
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_companies') THEN
    INSERT INTO public.organizations (id, name, created_at)
    SELECT id, name, created_at FROM public.legacy_companies
    ON CONFLICT (id) DO NOTHING;
    
    -- Migrate stripe_customer_id to billing_customers (Deduplicating)
    INSERT INTO public.billing_customers (organization_id, stripe_customer_id)
    SELECT DISTINCT id, stripe_customer_id 
    FROM public.legacy_companies 
    WHERE stripe_customer_id IS NOT NULL
    ON CONFLICT (organization_id) DO NOTHING;
  END IF;

  -- 5. Migrate legacy_company_users to organization_memberships
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_company_users') THEN
    INSERT INTO public.organization_memberships (organization_id, user_id, role_id)
    SELECT 
      company_id, 
      user_id, 
      CASE 
        WHEN role = 'owner' THEN owner_role_id
        WHEN role = 'admin' THEN admin_role_id
        ELSE member_role_id -- Maps 'employee' or other legacy roles to V3 'member'
      END
    FROM public.legacy_company_users
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;

  -- 6. Migrate legacy_subscriptions to V3 subscriptions and subscription_items
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_subscriptions') THEN
    
    -- Create V3 Subscriptions
    INSERT INTO public.subscriptions (id, organization_id, app_id, stripe_subscription_id, status, current_period_end)
    SELECT 
      gen_random_uuid(), -- new id
      ls.company_id,
      COALESCE(tm.app_id, default_app_id),
      ls.stripe_subscription_id,
      ls.status,
      ls.current_period_end
    FROM public.legacy_subscriptions ls
    JOIN temp_plan_mapping tm ON ls.plan_name = tm.legacy_plan_name
    ON CONFLICT (stripe_subscription_id) DO NOTHING;
    
    -- Create V3 Subscription Items
    INSERT INTO public.subscription_items (subscription_id, plan_id, plan_price_id, stripe_subscription_item_id, quantity)
    SELECT 
      s.id,
      tm.v3_plan_id,
      tm.v3_plan_price_id,
      ls.stripe_subscription_id || '_item', -- Mocking the item ID if the legacy table didn't store it
      1
    FROM public.legacy_subscriptions ls
    JOIN public.subscriptions s ON ls.stripe_subscription_id = s.stripe_subscription_id
    JOIN temp_plan_mapping tm ON ls.plan_name = tm.legacy_plan_name
    ON CONFLICT (stripe_subscription_item_id) DO NOTHING;
    
  END IF;

  DROP TABLE temp_plan_mapping;
END $$;

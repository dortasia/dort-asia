-- Migration: Decompose app_config JSONB into specific modular columns
-- Date: 2026-07-25

-- 1. Add new columns to company_settings
ALTER TABLE "public"."company_settings"
ADD COLUMN IF NOT EXISTS "attendance_settings" jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "leave_settings" jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "overtime_settings" jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "claim_settings" jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "company_module_settings" jsonb DEFAULT '{}'::jsonb;

-- 2. Migrate existing data from app_config to new columns
DO $$
DECLARE
    setting RECORD;
BEGIN
    FOR setting IN SELECT company_id, app_config FROM "public"."company_settings" LOOP
        IF setting.app_config IS NOT NULL AND jsonb_typeof(setting.app_config) = 'object' THEN
            UPDATE "public"."company_settings"
            SET 
                attendance_settings = COALESCE(setting.app_config->'attendance_settings', '{}'::jsonb),
                leave_settings = jsonb_build_object(
                    'advanced', COALESCE(setting.app_config->'leave_advanced', '{}'::jsonb),
                    'hierarchy', COALESCE(setting.app_config->'leave_hierarchy', '{}'::jsonb)
                ),
                overtime_settings = jsonb_build_object(
                    'advanced', COALESCE(setting.app_config->'overtime_advanced', '{}'::jsonb),
                    'hierarchy', COALESCE(setting.app_config->'overtime_hierarchy', '{}'::jsonb)
                ),
                claim_settings = jsonb_build_object(
                    'advanced', COALESCE(setting.app_config->'claim_advanced', '{}'::jsonb),
                    'hierarchy', COALESCE(setting.app_config->'claim_hierarchy', '{}'::jsonb)
                ),
                company_module_settings = jsonb_build_object(
                    'department_settings', COALESCE(setting.app_config->'department_settings', '{}'::jsonb)
                )
            WHERE company_id = setting.company_id;
        END IF;
    END LOOP;
END $$;

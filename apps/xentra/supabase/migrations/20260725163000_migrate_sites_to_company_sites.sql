-- Migration: Migrate sites from company_settings JSONB to company_sites table

-- 1. Add new columns to company_sites
ALTER TABLE "public"."company_sites"
ADD COLUMN IF NOT EXISTS "site_pass_enabled" boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS "site_pass_code" text,
ADD COLUMN IF NOT EXISTS "dynamic_qr_rotation" boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS "scanner_permission" text DEFAULT 'own_dept_admin',
ADD COLUMN IF NOT EXISTS "custom_scanners" jsonb DEFAULT '[]'::jsonb;

-- 1.5 Fix the incorrect foreign key constraint on company_id
ALTER TABLE "public"."company_sites"
DROP CONSTRAINT IF EXISTS "company_sites_company_id_fkey";

-- Remove any orphaned rows that don't match a valid company
DELETE FROM "public"."company_sites"
WHERE company_id NOT IN (SELECT id FROM "public"."companies");

ALTER TABLE "public"."company_sites"
ADD CONSTRAINT "company_sites_company_id_fkey" 
FOREIGN KEY (company_id) REFERENCES "public"."companies"(id) ON DELETE CASCADE;

-- 2. Migrate existing data from company_settings to company_sites
DO $$
DECLARE
    setting RECORD;
    site RECORD;
    site_lat numeric;
    site_lng numeric;
    site_rad integer;
BEGIN
    FOR setting IN SELECT cs.company_id, cs.app_config FROM "public"."company_settings" cs INNER JOIN "public"."companies" c ON cs.company_id = c.id LOOP
        IF setting.app_config ? 'attendance_settings' AND setting.app_config->'attendance_settings' ? 'sites' THEN
            FOR site IN SELECT * FROM jsonb_array_elements(setting.app_config->'attendance_settings'->'sites') LOOP
                
                BEGIN
                    site_lat := NULLIF(site.value->>'latitude', '')::numeric;
                EXCEPTION WHEN others THEN
                    site_lat := NULL;
                END;
                
                BEGIN
                    site_lng := NULLIF(site.value->>'longitude', '')::numeric;
                EXCEPTION WHEN others THEN
                    site_lng := NULL;
                END;
                
                BEGIN
                    site_rad := NULLIF(site.value->>'radius', '')::integer;
                EXCEPTION WHEN others THEN
                    site_rad := 200;
                END;

                -- Insert into company_sites, avoiding duplicates by id
                INSERT INTO "public"."company_sites" (
                    id,
                    company_id,
                    name,
                    latitude,
                    longitude,
                    radius,
                    address,
                    site_pass_enabled,
                    site_pass_code,
                    dynamic_qr_rotation,
                    scanner_permission,
                    custom_scanners
                ) VALUES (
                    site.value->>'id',
                    setting.company_id,
                    COALESCE(site.value->>'name', 'Unnamed Site'),
                    site_lat,
                    site_lng,
                    site_rad,
                    site.value->>'address',
                    COALESCE((site.value->>'kioskQrEnabled')::boolean, true),
                    site.value->>'kioskPassCode',
                    COALESCE((site.value->>'dynamicQrRotation')::boolean, true),
                    COALESCE(site.value->>'scannerPermission', 'own_dept_admin'),
                    COALESCE(site.value->'customScanners', '[]'::jsonb)
                )
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    radius = EXCLUDED.radius,
                    address = EXCLUDED.address,
                    site_pass_enabled = EXCLUDED.site_pass_enabled,
                    site_pass_code = EXCLUDED.site_pass_code,
                    dynamic_qr_rotation = EXCLUDED.dynamic_qr_rotation,
                    scanner_permission = EXCLUDED.scanner_permission,
                    custom_scanners = EXCLUDED.custom_scanners;
            END LOOP;
        END IF;
    END LOOP;
END $$;

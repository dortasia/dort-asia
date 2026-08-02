-- Add Site Pass columns to company_sites table
ALTER TABLE "public"."company_sites"
  ADD COLUMN IF NOT EXISTS "site_pass_enabled" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "site_pass_code" text,
  ADD COLUMN IF NOT EXISTS "dynamic_qr_rotation" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "scanner_permission" text NOT NULL DEFAULT 'own_dept_admin',
  ADD COLUMN IF NOT EXISTS "custom_scanners" jsonb DEFAULT '[]'::jsonb;

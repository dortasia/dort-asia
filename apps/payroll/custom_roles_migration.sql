-- ============================================================
-- Custom Roles: Add custom_roles column to company_settings
-- Run this in your Supabase SQL Editor
-- ============================================================

ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS custom_roles JSONB DEFAULT '[]'::jsonb;

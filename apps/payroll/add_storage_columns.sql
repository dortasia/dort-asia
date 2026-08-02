-- ============================================================
-- Add storage columns to company_settings
-- Paste into Supabase → SQL Editor → Run
-- ============================================================

ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS storage_used_gb   numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storage_total_gb  numeric DEFAULT 100,
  ADD COLUMN IF NOT EXISTS connected_drives  jsonb   DEFAULT '[]'::jsonb;

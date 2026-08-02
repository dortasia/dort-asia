-- Step 1: Ensure columns exist
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS storage_used_gb   numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storage_total_gb  numeric DEFAULT 100,
  ADD COLUMN IF NOT EXISTS connected_drives  jsonb   DEFAULT '[]'::jsonb;

-- Step 2: Clear ALL stale/mock connected_drives data so real OAuth can populate it
UPDATE public.company_settings
SET connected_drives = '[]'::jsonb;

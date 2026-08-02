-- Patch to support Custom Form Fields
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

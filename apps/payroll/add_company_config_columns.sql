-- Add new configuration columns for the extended onboarding flow Phase 1
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS working_period text,
ADD COLUMN IF NOT EXISTS company_type text,
ADD COLUMN IF NOT EXISTS attendance_type text;

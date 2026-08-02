-- Migration to add website column to company_settings table
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS website text;

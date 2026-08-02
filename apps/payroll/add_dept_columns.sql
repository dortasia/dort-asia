-- ============================================================
-- SQL PATCH: PUBLIC.DEPARTMENTS SCHEMA ENHANCEMENT
-- Run this in your Supabase SQL Editor to support custom Department IDs!
-- ============================================================

-- Add dept_id column
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS dept_id text;

-- Add head_id column (references public.employees.id)
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS head_id uuid;

-- Add delegation_config column
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS delegation_config jsonb DEFAULT '{}'::jsonb;

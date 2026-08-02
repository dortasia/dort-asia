-- SQL Migration Patch: Add location_radius, page_access, automation_settings and sites to projects
-- Run this statement in your Supabase SQL editor:

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS location_radius integer DEFAULT 200,
  ADD COLUMN IF NOT EXISTS page_access jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS automation_settings jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sites jsonb DEFAULT NULL;

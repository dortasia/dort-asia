-- ============================================================
-- FIX: Make all existing company storage buckets PUBLIC
-- Run this in Supabase SQL Editor to fix images for existing users.
--
-- Context: Buckets were created as private (public: false) during
-- registration, which causes getPublicUrl() to return broken 403 URLs.
-- This query flips them all to public so images load correctly.
-- ============================================================

UPDATE storage.buckets
SET public = true
WHERE public = false
  AND name NOT IN ('avatars')  -- exclude any other private buckets you want to keep
  AND created_at > '2026-01-01';  -- optional: limit to recently created company buckets

-- Verify results:
SELECT name, public, created_at FROM storage.buckets ORDER BY created_at DESC;

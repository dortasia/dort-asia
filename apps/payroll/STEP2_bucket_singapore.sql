-- ============================================================
-- STEP 2 OF 2 — RUN THIS AFTER STEP 1
-- Avatars Bucket Setup — Singapore Server
-- Structure: avatars > {company-name} > avatars > {email}.*
--            avatars > {company-name} > logos   > {email}-logo-{ts}.*
-- Paste into: Supabase → SQL Editor → Run
-- ============================================================

-- ───────────────────────────────────────────
-- 1. Create / reconfigure the "avatars" bucket
-- ───────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public             = true,
  file_size_limit    = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];


-- ───────────────────────────────────────────
-- 2. Drop ALL old/conflicting policies first
-- ───────────────────────────────────────────
DROP POLICY IF EXISTS "Public Access"                                ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars"                      ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads on avatars"               ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars"       ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to avatars"       ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update avatars"       ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to avatars"       ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete avatars"       ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes to avatars"       ON storage.objects;
DROP POLICY IF EXISTS "Super admins can manage company folder"       ON storage.objects;
DROP POLICY IF EXISTS "Employees can manage their own avatar"        ON storage.objects;


-- ───────────────────────────────────────────
-- 3. SELECT — public read on all avatars files
-- ───────────────────────────────────────────
CREATE POLICY "Allow public reads on avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');


-- ───────────────────────────────────────────
-- 4. INSERT — any authenticated user may upload
--    (path enforced by app code:
--     {company-slug}/avatars/{email}.ext
--     {company-slug}/logos/{email}-logo-{ts}.ext)
-- ───────────────────────────────────────────
CREATE POLICY "Allow authenticated uploads to avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');


-- ───────────────────────────────────────────
-- 5. UPDATE — any authenticated user may overwrite
-- ───────────────────────────────────────────
CREATE POLICY "Allow authenticated updates to avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');


-- ───────────────────────────────────────────
-- 6. DELETE — any authenticated user may delete
-- ───────────────────────────────────────────
CREATE POLICY "Allow authenticated deletes to avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');


-- ───────────────────────────────────────────
-- VERIFICATION — should return 5 rows
-- ───────────────────────────────────────────
SELECT
  b.id              AS bucket_id,
  b.name            AS bucket_name,
  b.public,
  b.file_size_limit,
  p.policyname,
  p.cmd             AS operation
FROM storage.buckets b
LEFT JOIN pg_policies p
  ON p.tablename = 'objects'
  AND p.schemaname = 'storage'
  AND p.policyname ILIKE '%avatars%'
WHERE b.id = 'avatars'
ORDER BY p.policyname;

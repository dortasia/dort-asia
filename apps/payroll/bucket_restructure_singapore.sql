-- ============================================================
-- BUCKET RESTRUCTURE — Singapore Server
-- Structure: avatars (bucket) > {company_name} > avatars > {email}
-- Paste into: Supabase → SQL Editor → Run All
-- ============================================================

-- ───────────────────────────────────────────
-- STEP 1: Create / Reconfigure the "avatars" bucket
--         Make it PUBLIC so getPublicUrl() works
-- ───────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  10485760,           -- 10 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public            = true,
  file_size_limit   = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];


-- ───────────────────────────────────────────
-- STEP 2: Drop ALL old policies on storage.objects
--         (avoids conflicts when re-applying)
-- ───────────────────────────────────────────
DROP POLICY IF EXISTS "Public Access"                                   ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars"          ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their avatars"    ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their avatars"    ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads on avatars"                   ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to avatars"          ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to avatars"          ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes to avatars"          ON storage.objects;
DROP POLICY IF EXISTS "Super admins can manage company folder"          ON storage.objects;
DROP POLICY IF EXISTS "Employees can manage their own avatar"           ON storage.objects;


-- ───────────────────────────────────────────
-- STEP 3: New READ policy — anyone can view files in the bucket
--         Path pattern: {company_name}/avatars/{email}.*
-- ───────────────────────────────────────────
CREATE POLICY "Allow public reads on avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');


-- ───────────────────────────────────────────
-- STEP 4: UPLOAD (INSERT) policy
--         Super Admins may upload to any path under their company folder.
--         Employees may only upload to {company_name}/avatars/{their_email}.*
-- ───────────────────────────────────────────
CREATE POLICY "Allow authenticated uploads to avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (
    -- Super Admin: owns the company_settings row → can upload anywhere under that company
    EXISTS (
      SELECT 1 FROM public.company_settings cs
      WHERE cs.company_id = auth.uid()
        AND (storage.foldername(name))[1] = lower(regexp_replace(cs.company_name, '\s+', '-', 'g'))
    )
    OR
    -- Employee: can only upload into {company_name}/avatars/{their_own_email}.*
    EXISTS (
      SELECT 1
      FROM public.employees e
      JOIN public.company_settings cs ON cs.company_id = e.company_id
      WHERE e.email = auth.email()
        AND (storage.foldername(name))[1] = lower(regexp_replace(cs.company_name, '\s+', '-', 'g'))
        AND (storage.foldername(name))[2] = 'avatars'
        -- filename must start with the employee's own email (sanitised)
        AND storage.filename(name) LIKE lower(regexp_replace(e.email, '[^a-z0-9]', '-', 'g')) || '%'
    )
  )
);


-- ───────────────────────────────────────────
-- STEP 5: UPDATE policy (same rules as INSERT)
-- ───────────────────────────────────────────
CREATE POLICY "Allow authenticated updates to avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    EXISTS (
      SELECT 1 FROM public.company_settings cs
      WHERE cs.company_id = auth.uid()
        AND (storage.foldername(name))[1] = lower(regexp_replace(cs.company_name, '\s+', '-', 'g'))
    )
    OR
    EXISTS (
      SELECT 1
      FROM public.employees e
      JOIN public.company_settings cs ON cs.company_id = e.company_id
      WHERE e.email = auth.email()
        AND (storage.foldername(name))[1] = lower(regexp_replace(cs.company_name, '\s+', '-', 'g'))
        AND (storage.foldername(name))[2] = 'avatars'
        AND storage.filename(name) LIKE lower(regexp_replace(e.email, '[^a-z0-9]', '-', 'g')) || '%'
    )
  )
);


-- ───────────────────────────────────────────
-- STEP 6: DELETE policy (same rules)
-- ───────────────────────────────────────────
CREATE POLICY "Allow authenticated deletes to avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    EXISTS (
      SELECT 1 FROM public.company_settings cs
      WHERE cs.company_id = auth.uid()
        AND (storage.foldername(name))[1] = lower(regexp_replace(cs.company_name, '\s+', '-', 'g'))
    )
    OR
    EXISTS (
      SELECT 1
      FROM public.employees e
      JOIN public.company_settings cs ON cs.company_id = e.company_id
      WHERE e.email = auth.email()
        AND (storage.foldername(name))[1] = lower(regexp_replace(cs.company_name, '\s+', '-', 'g'))
        AND (storage.foldername(name))[2] = 'avatars'
        AND storage.filename(name) LIKE lower(regexp_replace(e.email, '[^a-z0-9]', '-', 'g')) || '%'
    )
  )
);


-- ───────────────────────────────────────────
-- VERIFICATION QUERY — run after the above to confirm setup
-- ───────────────────────────────────────────
SELECT
  b.id          AS bucket_id,
  b.name        AS bucket_name,
  b.public,
  b.file_size_limit,
  b.allowed_mime_types,
  p.policyname,
  p.cmd         AS operation
FROM storage.buckets b
LEFT JOIN pg_policies p ON p.tablename = 'objects' AND p.schemaname = 'storage'
WHERE b.id = 'avatars'
ORDER BY p.policyname;

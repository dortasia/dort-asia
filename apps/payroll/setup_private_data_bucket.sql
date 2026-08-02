-- ============================================================
-- SETUP "private_data" BUCKET FOR COMPANY STORAGE
-- Paste into: Supabase -> SQL Editor -> Run
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private_data',
  'private_data',
  false,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'text/csv']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- 1. Drop existing policies to avoid conflict
DROP POLICY IF EXISTS "Authenticated users can upload to private_data" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view their company private_data" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their company private_data" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their company private_data" ON storage.objects;

-- 2. CREATE SELECT POLICY
CREATE POLICY "Authenticated users can view their company private_data"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'private_data'
  AND (
    -- Super Admin check
    EXISTS (
      SELECT 1 FROM public.company_settings cs
      WHERE cs.company_id = auth.uid()
        AND (storage.foldername(name))[1] = 'Company_Storage'
        AND (storage.foldername(name))[2] = lower(regexp_replace(cs.company_name, '\s+', '-', 'g'))
    )
    OR
    -- Employee check
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.company_settings cs ON cs.company_id = e.company_id
      WHERE e.email = auth.email()
        AND (storage.foldername(name))[1] = 'Company_Storage'
        AND (storage.foldername(name))[2] = lower(regexp_replace(cs.company_name, '\s+', '-', 'g'))
    )
  )
);

-- 3. CREATE INSERT POLICY
CREATE POLICY "Authenticated users can upload to private_data"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'private_data'
  AND (
    EXISTS (
      SELECT 1 FROM public.company_settings cs
      WHERE cs.company_id = auth.uid()
        AND (storage.foldername(name))[1] = 'Company_Storage'
        AND (storage.foldername(name))[2] = lower(regexp_replace(cs.company_name, '\s+', '-', 'g'))
    )
    OR
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.company_settings cs ON cs.company_id = e.company_id
      WHERE e.email = auth.email()
        AND (storage.foldername(name))[1] = 'Company_Storage'
        AND (storage.foldername(name))[2] = lower(regexp_replace(cs.company_name, '\s+', '-', 'g'))
    )
  )
);

-- 4. CREATE UPDATE POLICY
CREATE POLICY "Authenticated users can update their company private_data"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'private_data'
  AND (
    EXISTS (
      SELECT 1 FROM public.company_settings cs
      WHERE cs.company_id = auth.uid()
        AND (storage.foldername(name))[1] = 'Company_Storage'
        AND (storage.foldername(name))[2] = lower(regexp_replace(cs.company_name, '\s+', '-', 'g'))
    )
    OR
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.company_settings cs ON cs.company_id = e.company_id
      WHERE e.email = auth.email()
        AND (storage.foldername(name))[1] = 'Company_Storage'
        AND (storage.foldername(name))[2] = lower(regexp_replace(cs.company_name, '\s+', '-', 'g'))
    )
  )
);

-- 5. CREATE DELETE POLICY
CREATE POLICY "Authenticated users can delete their company private_data"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'private_data'
  AND (
    EXISTS (
      SELECT 1 FROM public.company_settings cs
      WHERE cs.company_id = auth.uid()
        AND (storage.foldername(name))[1] = 'Company_Storage'
        AND (storage.foldername(name))[2] = lower(regexp_replace(cs.company_name, '\s+', '-', 'g'))
    )
    OR
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.company_settings cs ON cs.company_id = e.company_id
      WHERE e.email = auth.email()
        AND (storage.foldername(name))[1] = 'Company_Storage'
        AND (storage.foldername(name))[2] = lower(regexp_replace(cs.company_name, '\s+', '-', 'g'))
    )
  )
);

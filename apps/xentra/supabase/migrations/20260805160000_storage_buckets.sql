-- -----------------------------------------------------------------------------
-- Migration: Create Standardized Supabase Storage Buckets and RLS Policies
-- -----------------------------------------------------------------------------

-- 1. Create/Update Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('employee-profiles', 'employee-profiles', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('employee-documents', 'employee-documents', false, 52428800, NULL),
  ('company-assets', 'company-assets', true, 10485760, NULL),
  ('system-assets', 'system-assets', true, 10485760, NULL),
  ('temp-uploads', 'temp-uploads', false, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Objects RLS Policies
DO $$ 
BEGIN
  -- Public Read Access for public buckets
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Read Access for Public Buckets'
  ) THEN
    CREATE POLICY "Public Read Access for Public Buckets"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('employee-profiles', 'company-assets', 'system-assets'));
  END IF;

  -- Authenticated All Access Policy for all storage operations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated User Storage Access'
  ) THEN
    CREATE POLICY "Authenticated User Storage Access"
    ON storage.objects FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;

  -- Anon Upload Access for temp-uploads or public buckets during onboarding if required
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anon Storage Access for Public Buckets'
  ) THEN
    CREATE POLICY "Anon Storage Access for Public Buckets"
    ON storage.objects FOR ALL
    TO anon
    USING (bucket_id IN ('employee-profiles', 'company-assets', 'temp-uploads', 'system-assets'))
    WITH CHECK (bucket_id IN ('employee-profiles', 'company-assets', 'temp-uploads', 'system-assets'));
  END IF;
END $$;

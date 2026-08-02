-- Run this script in the Supabase SQL Editor to configure the "avatars" bucket properly

-- 1. Create the "avatars" bucket if it doesn't already exist and make it PUBLIC
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow authenticated users to view profiles (SELECT)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- 3. Allow authenticated users to insert/upload files
CREATE POLICY "Authenticated users can upload avatars" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'avatars' );

-- 4. Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update their avatars" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id = 'avatars' );

-- 5. Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete their avatars" 
ON storage.objects FOR DELETE 
TO authenticated 
USING ( bucket_id = 'avatars' );

-- ============================================================
-- DORT ASIA HRMS — Supabase Policy & Configuration SQL
-- Based on supabase_configuration.txt requirements
-- Run in Supabase SQL Editor → New Query
-- ============================================================

-- ============================================================
-- RULE 1: Per-Company Storage Bucket Structure
-- Buckets are created at registration via the API route.
-- This adds RLS policies to allow company-scoped access.
-- Structure: {company-slug}/Company/... and {company-slug}/Employees/...
-- ============================================================

-- Allow authenticated users to read objects in their own company bucket
-- (The bucket name must match company slug stored in company_settings)
DROP POLICY IF EXISTS "Company members can read their bucket" ON storage.objects;
CREATE POLICY "Company members can read their bucket"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    -- The bucket belongs to the user's company
    bucket_id IN (
      SELECT lower(regexp_replace(company_name, '[^a-zA-Z0-9]', '-', 'g'))
      FROM public.company_settings
      WHERE company_id = auth.uid()
         OR company_id IN (
           SELECT company_id FROM public.employees WHERE email = (auth.jwt() ->> 'email')
         )
    )
  );

-- Super admin can upload/update/delete in their own company bucket
DROP POLICY IF EXISTS "Super admin can upload to company bucket" ON storage.objects;
CREATE POLICY "Super admin can upload to company bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN (
      SELECT lower(regexp_replace(company_name, '[^a-zA-Z0-9]', '-', 'g'))
      FROM public.company_settings
      WHERE company_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Super admin can update company bucket objects" ON storage.objects;
CREATE POLICY "Super admin can update company bucket objects"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN (
      SELECT lower(regexp_replace(company_name, '[^a-zA-Z0-9]', '-', 'g'))
      FROM public.company_settings
      WHERE company_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Super admin can delete company bucket objects" ON storage.objects;
CREATE POLICY "Super admin can delete company bucket objects"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id IN (
      SELECT lower(regexp_replace(company_name, '[^a-zA-Z0-9]', '-', 'g'))
      FROM public.company_settings
      WHERE company_id = auth.uid()
    )
  );

-- ============================================================
-- RULE 2: Prevent Duplicate Registration (same email/phone)
-- The UNIQUE constraint on email prevents duplicate employees.
-- For auth.users, Supabase handles email uniqueness natively.
-- We add a unique constraint on mobile in company_settings too.
-- ============================================================

-- Unique email in employees table (prevent re-adding same person)
ALTER TABLE public.employees
  ADD CONSTRAINT employees_email_unique UNIQUE (email);

-- Unique phone in company_settings (prevent same phone registering twice)
ALTER TABLE public.company_settings
  ADD CONSTRAINT company_settings_phone_unique UNIQUE (company_phone);

-- ============================================================
-- RULE 3: Employee Authentication + Auto-delete after removal
-- Add scheduled_deletion_at column: set when employee is removed.
-- A pg_cron job (or Edge Function) cleans up after 24 hours.
-- ============================================================

-- Add soft-delete / scheduled deletion column
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS is_active           boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS scheduled_deletion_at timestamp with time zone;

-- RLS: Employees can only access data when is_active = true
-- (Inactive employees lose SELECT access to their own company data)
-- Function to break recursion for employees RLS
CREATE OR REPLACE FUNCTION public.is_active_company_member(target_company_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.employees
    WHERE company_id = target_company_id
      AND email = auth.email()
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Active employees can read employees" ON public.employees;
CREATE POLICY "Active employees can read employees"
  ON public.employees FOR SELECT
  TO authenticated
  USING (
    -- 1. Subject is the user themselves
    (email = auth.email() AND is_active = true)
    OR
    -- 2. Subject belongs to the company where the user is an active employee
    public.is_active_company_member(company_id)
    OR
    -- 3. Subject belongs to the company where the user is the super admin (owner)
    company_id = auth.uid()
  );

-- Function: schedule deletion when employee is removed (set is_active = false)
CREATE OR REPLACE FUNCTION public.schedule_employee_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- When is_active is flipped to false, set deletion timestamp to 24h from now
  IF NEW.is_active = false AND OLD.is_active = true THEN
    NEW.scheduled_deletion_at := now() + interval '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_schedule_employee_deletion
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.schedule_employee_deletion();

-- Function: hard-delete employees whose 24hr window has passed
-- Call this via a Supabase Edge Function (pg_cron) scheduled every hour
CREATE OR REPLACE FUNCTION public.purge_scheduled_employees()
RETURNS void AS $$
BEGIN
  DELETE FROM public.employees
  WHERE is_active = false
    AND scheduled_deletion_at IS NOT NULL
    AND scheduled_deletion_at <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RULE 4: Single Auth Identity Across All Dort Asia Apps
-- Supabase handles this natively — one auth.users entry works
-- for all apps sharing the same Supabase project URL + anon key.
-- No SQL needed. Just ensure all apps use the SAME project URL.
-- ============================================================

-- Verification query (run to confirm single auth source):
-- SELECT id, email FROM auth.users LIMIT 10;

-- ============================================================
-- RULE 5: Consistent Avatars Across All Environments
-- Avatars stored in the public "avatars" bucket.
-- super_admin_avatar_url in company_settings = the canonical URL.
-- All apps (Landing, HRMS) read from this same column.
-- ============================================================

-- (Removed avatars bucket explicit creation since we now use dynamic company-named buckets)

-- View to resolve a user's avatar URL from any context
-- Usage: SELECT avatar_url FROM user_avatar_view WHERE user_email = 'x@x.com'
CREATE OR REPLACE VIEW public.user_avatar_view AS
  SELECT
    cs.company_id,
    cs.super_admin_name  AS display_name,
    cs.super_admin_avatar_url AS avatar_url,
    u.email
  FROM public.company_settings cs
  JOIN auth.users u ON u.id = cs.company_id

  UNION ALL

  SELECT
    e.company_id,
    e.name               AS display_name,
    e.avatar_url,
    e.email
  FROM public.employees e;



-- ============================================================
-- VERIFICATION QUERIES (run these to confirm everything is set)
-- ============================================================

-- Check all policies on employees table:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'employees';

-- Check triggers:
-- SELECT trigger_name, event_manipulation FROM information_schema.triggers WHERE event_object_table = 'employees';

-- Check unique constraints:
-- SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'employees';

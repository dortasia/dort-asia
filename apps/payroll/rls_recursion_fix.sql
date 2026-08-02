-- Fix for infinite recursion in employees RLS policy
-- This creates a security definer function to break the recursion chain

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

-- Re-apply the policy using the security definer function
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

-- Verify
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'employees';

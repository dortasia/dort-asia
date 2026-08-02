-- Drop previous recursive policy
DROP POLICY IF EXISTS "Admins and Super Admins can view all company employees" ON "public"."employees";

-- Create a security definer function to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin_in_company(target_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.employees
    WHERE user_id = auth.uid() 
      AND company_id = target_company_id 
      AND app_role IN ('Admin', 'Super Admin')
  );
END;
$$;

-- Add policy for Admins and Super Admins to view all company employees using the function
CREATE POLICY "Admins and Super Admins can view all company employees" 
ON "public"."employees" 
FOR SELECT 
USING (
  public.is_admin_in_company(company_id)
);

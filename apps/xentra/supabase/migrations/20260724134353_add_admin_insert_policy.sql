-- Add policies for Admins and Super Admins to manage employees
DROP POLICY IF EXISTS "Admins and Super Admins can insert employees" ON "public"."employees";
CREATE POLICY "Admins and Super Admins can insert employees" 
ON "public"."employees" 
FOR INSERT 
WITH CHECK (
  public.is_admin_in_company(company_id)
);

DROP POLICY IF EXISTS "Admins and Super Admins can update employees" ON "public"."employees";
CREATE POLICY "Admins and Super Admins can update employees" 
ON "public"."employees" 
FOR UPDATE 
USING (
  public.is_admin_in_company(company_id)
);

DROP POLICY IF EXISTS "Admins and Super Admins can delete employees" ON "public"."employees";
CREATE POLICY "Admins and Super Admins can delete employees" 
ON "public"."employees" 
FOR DELETE 
USING (
  public.is_admin_in_company(company_id)
);

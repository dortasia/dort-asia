-- Add RLS policies for leave_policies table

DROP POLICY IF EXISTS "Super admins can manage leave_policies" ON "public"."leave_policies";
CREATE POLICY "Super admins can manage leave_policies" ON "public"."leave_policies" USING (
  EXISTS (
    SELECT 1 FROM "public"."companies"
    WHERE "companies"."id" = "leave_policies"."company_id" 
    AND "companies"."super_admin_id" = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."companies"
    WHERE "companies"."id" = "leave_policies"."company_id" 
    AND "companies"."super_admin_id" = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage their company leave_policies" ON "public"."leave_policies";
CREATE POLICY "Users can manage their company leave_policies" ON "public"."leave_policies" USING (
  EXISTS (
    SELECT 1 FROM "public"."employees"
    WHERE "employees"."company_id" = "leave_policies"."company_id" 
    AND "employees"."user_id" = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."employees"
    WHERE "employees"."company_id" = "leave_policies"."company_id" 
    AND "employees"."user_id" = auth.uid()
  )
);

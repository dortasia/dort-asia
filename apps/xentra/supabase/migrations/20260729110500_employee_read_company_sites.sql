DROP POLICY IF EXISTS "Employees can view company sites" ON "public"."company_sites";

CREATE POLICY "Employees can view company sites" ON "public"."company_sites" FOR SELECT TO "authenticated" USING (
  EXISTS (
    SELECT 1 FROM "public"."employees"
    WHERE (
      "employees"."user_id" = auth.uid() 
      OR "employees"."email" = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    AND "employees"."company_id" = "company_sites"."company_id"
  )
  OR
  public.is_admin_in_company(company_id)
);

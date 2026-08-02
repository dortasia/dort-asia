DROP POLICY IF EXISTS "Employees can view company sites" ON "public"."company_sites";

CREATE POLICY "Employees can view company sites" ON "public"."company_sites" FOR SELECT TO "authenticated" USING (
  EXISTS (
    SELECT 1 FROM "public"."employees"
    JOIN "public"."companies" ON "employees"."company_id" = "companies"."id"
    WHERE (
      "employees"."user_id" = auth.uid() 
      OR "employees"."email" = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    AND "companies"."super_admin_id" = "company_sites"."company_id"
  )
  OR
  public.is_admin_in_company(company_id)
);

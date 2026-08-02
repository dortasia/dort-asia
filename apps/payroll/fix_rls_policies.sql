-- ============================================================
-- FIX: Drop old policies & re-apply correct RLS for company isolation
-- Paste this into Supabase → SQL Editor → Run
-- ============================================================

-- ── 1. DEPARTMENTS ──────────────────────────────────────────

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view departments in their company" ON public.departments;
DROP POLICY IF EXISTS "Users can insert departments in their company" ON public.departments;
DROP POLICY IF EXISTS "Users can update departments in their company" ON public.departments;
DROP POLICY IF EXISTS "Users can delete departments in their company" ON public.departments;

CREATE POLICY "Users can view departments in their company"
ON public.departments FOR SELECT
USING (company_id = auth.uid());

CREATE POLICY "Users can insert departments in their company"
ON public.departments FOR INSERT
WITH CHECK (company_id = auth.uid());

CREATE POLICY "Users can update departments in their company"
ON public.departments FOR UPDATE
USING (company_id = auth.uid())
WITH CHECK (company_id = auth.uid());

CREATE POLICY "Users can delete departments in their company"
ON public.departments FOR DELETE
USING (company_id = auth.uid());


-- ── 2. EMPLOYEES ────────────────────────────────────────────

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view employees in their company" ON public.employees;
DROP POLICY IF EXISTS "Users can insert employees in their company" ON public.employees;
DROP POLICY IF EXISTS "Users can update employees in their company" ON public.employees;
DROP POLICY IF EXISTS "Users can delete employees in their company" ON public.employees;

CREATE POLICY "Users can view employees in their company"
ON public.employees FOR SELECT
USING (company_id = auth.uid());

CREATE POLICY "Users can insert employees in their company"
ON public.employees FOR INSERT
WITH CHECK (company_id = auth.uid());

CREATE POLICY "Users can update employees in their company"
ON public.employees FOR UPDATE
USING (company_id = auth.uid())
WITH CHECK (company_id = auth.uid());

CREATE POLICY "Users can delete employees in their company"
ON public.employees FOR DELETE
USING (company_id = auth.uid());


-- ── 3. COMPANY SETTINGS ─────────────────────────────────────

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can insert their own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can update their own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can delete their own company settings" ON public.company_settings;

CREATE POLICY "Users can view their own company settings"
ON public.company_settings FOR SELECT
USING (company_id = auth.uid());

CREATE POLICY "Users can insert their own company settings"
ON public.company_settings FOR INSERT
WITH CHECK (company_id = auth.uid());

CREATE POLICY "Users can update their own company settings"
ON public.company_settings FOR UPDATE
USING (company_id = auth.uid())
WITH CHECK (company_id = auth.uid());

CREATE POLICY "Users can delete their own company settings"
ON public.company_settings FOR DELETE
USING (company_id = auth.uid());

-- Enable Row Level Security on tables
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 1. Policies for company_settings
-- We assume owner_id is the company_id here, and the JWT token carries company_id for subsequent operations.
-- The Super Admin (owner) might also just have their user id matched against owner_id.
CREATE POLICY "Users can view their own company settings"
ON public.company_settings
FOR SELECT
USING (owner_id = (auth.jwt()->>'company_id')::uuid OR owner_id = auth.uid());

CREATE POLICY "Users can insert their own company settings"
ON public.company_settings
FOR INSERT
WITH CHECK (owner_id = (auth.jwt()->>'company_id')::uuid OR owner_id = auth.uid());

CREATE POLICY "Users can update their own company settings"
ON public.company_settings
FOR UPDATE
USING (owner_id = (auth.jwt()->>'company_id')::uuid OR owner_id = auth.uid())
WITH CHECK (owner_id = (auth.jwt()->>'company_id')::uuid OR owner_id = auth.uid());

CREATE POLICY "Users can delete their own company settings"
ON public.company_settings
FOR DELETE
USING (owner_id = (auth.jwt()->>'company_id')::uuid OR owner_id = auth.uid());

-- 2. Policies for departments
CREATE POLICY "Users can view departments in their company"
ON public.departments
FOR SELECT
USING (company_id = (auth.jwt()->>'company_id')::uuid OR company_id = auth.uid());

CREATE POLICY "Users can insert departments in their company"
ON public.departments
FOR INSERT
WITH CHECK (company_id = (auth.jwt()->>'company_id')::uuid OR company_id = auth.uid());

CREATE POLICY "Users can update departments in their company"
ON public.departments
FOR UPDATE
USING (company_id = (auth.jwt()->>'company_id')::uuid OR company_id = auth.uid())
WITH CHECK (company_id = (auth.jwt()->>'company_id')::uuid OR company_id = auth.uid());

CREATE POLICY "Users can delete departments in their company"
ON public.departments
FOR DELETE
USING (company_id = (auth.jwt()->>'company_id')::uuid OR company_id = auth.uid());

-- 3. Policies for employees
CREATE POLICY "Users can view employees in their company"
ON public.employees
FOR SELECT
USING (company_id = (auth.jwt()->>'company_id')::uuid OR company_id = auth.uid());

CREATE POLICY "Users can insert employees in their company"
ON public.employees
FOR INSERT
WITH CHECK (company_id = (auth.jwt()->>'company_id')::uuid OR company_id = auth.uid());

CREATE POLICY "Users can update employees in their company"
ON public.employees
FOR UPDATE
USING (company_id = (auth.jwt()->>'company_id')::uuid OR company_id = auth.uid())
WITH CHECK (company_id = (auth.jwt()->>'company_id')::uuid OR company_id = auth.uid());

CREATE POLICY "Users can delete employees in their company"
ON public.employees
FOR DELETE
USING (company_id = (auth.jwt()->>'company_id')::uuid OR company_id = auth.uid());

-- 4. Policies for storage.objects (avatars bucket)
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company scoped storage access"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'avatars' AND 
  (
    (auth.jwt()->>'company_id' IS NOT NULL AND (storage.foldername(name))[1] = auth.jwt()->>'company_id')
    OR 
    (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
  )
)
WITH CHECK (
  bucket_id = 'avatars' AND 
  (
    (auth.jwt()->>'company_id' IS NOT NULL AND (storage.foldername(name))[1] = auth.jwt()->>'company_id')
    OR 
    (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
  )
);

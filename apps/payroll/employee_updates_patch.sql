-- 1. Create the sites table to map locations contextually identical to departments
CREATE TABLE IF NOT EXISTS public.sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.company_settings(owner_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for sites
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read/write for authenticated users within their company" ON public.sites
  FOR ALL TO authenticated USING (
    company_id = auth.uid()
  );

-- 2. Expand the employees table with newly required context
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS date_of_joining DATE,
ADD COLUMN IF NOT EXISTS job_role TEXT,
ADD COLUMN IF NOT EXISTS employment_status TEXT DEFAULT 'active';

-- NOTE: If the table was restricting policies earlier, employees inherits policies from `company_id`. No RLS manipulation on employees table is necessary here as it is previously established.

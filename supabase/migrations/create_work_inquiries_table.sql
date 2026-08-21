-- Create work_inquiries table to capture client submissions
CREATE TABLE IF NOT EXISTS public.work_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_id TEXT NOT NULL UNIQUE,
    service_track TEXT NOT NULL, -- 'talent' | 'solutions' | 'combined'
    
    -- Client Contact Info
    full_name TEXT NOT NULL,
    work_email TEXT NOT NULL,
    company_name TEXT NOT NULL,
    phone_number TEXT,
    company_website TEXT,
    team_size TEXT,
    preferred_contact_method TEXT DEFAULT 'email',
    
    -- Technology Talent Details (if applicable)
    talent_roles TEXT[] DEFAULT '{}',
    talent_seniority TEXT,
    talent_team_size TEXT,
    talent_engagement_model TEXT,
    talent_start_timeline TEXT,
    talent_timezone TEXT,
    
    -- Software Solutions Details (if applicable)
    solution_types TEXT[] DEFAULT '{}',
    solution_stage TEXT,
    solution_capabilities TEXT[] DEFAULT '{}',
    solution_budget_range TEXT,
    solution_delivery_timeline TEXT,
    
    -- Project Description & Attachments
    project_summary TEXT NOT NULL,
    reference_url TEXT,
    
    status TEXT DEFAULT 'new', -- 'new' | 'in_review' | 'contacted' | 'archived'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.work_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous insert for inquiries
CREATE POLICY "Allow anonymous work inquiry submission"
ON public.work_inquiries
FOR INSERT
WITH CHECK (true);

-- Allow authenticated users to view only if admin (or service role)
CREATE POLICY "Allow service role full access to work_inquiries"
ON public.work_inquiries
FOR ALL
USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_work_inquiries_reference_id ON public.work_inquiries (reference_id);
CREATE INDEX IF NOT EXISTS idx_work_inquiries_created_at ON public.work_inquiries (created_at DESC);

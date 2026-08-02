-- Migration: Create and Migrate Company Module Settings
-- Description: Migrates from monolithic JSON app_config to row-based modular settings

BEGIN;

-- 1. Create New Table (company_module_settings)
CREATE TABLE IF NOT EXISTS public.company_module_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    module TEXT NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT company_module_unique UNIQUE (company_id, module)
);

-- 2. Create Index for ultra-fast Android queries
CREATE INDEX IF NOT EXISTS idx_company_module_settings_lookup 
ON public.company_module_settings(company_id, module);

-- 3. Enable RLS
ALTER TABLE public.company_module_settings ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Employees (Android) can read operational settings
DROP POLICY IF EXISTS "Allow employees read access to operational settings" ON public.company_module_settings;
CREATE POLICY "Allow employees read access to operational settings" 
ON public.company_module_settings FOR SELECT 
TO authenticated 
USING (module IN ('leave', 'claims', 'overtime', 'department'));

-- 5. RLS Policy: Admins (Web) have full access
DROP POLICY IF EXISTS "Allow admins full access to module settings" ON public.company_module_settings;
CREATE POLICY "Allow admins full access to module settings" 
ON public.company_module_settings FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE employees.user_id = auth.uid() 
    AND employees.company_id = company_module_settings.company_id 
    AND employees.app_role IN ('SUPER_ADMIN', 'ADMIN')
  )
);

-- 6. Safe Data Migration from legacy company_settings -> company_module_settings
DO $$
DECLARE
    rec RECORD;
    key TEXT;
    val JSONB;
    migrated_count INT := 0;
BEGIN
    FOR rec IN SELECT company_id, app_config FROM public.company_settings LOOP
        IF rec.app_config IS NOT NULL AND jsonb_typeof(rec.app_config) = 'object' THEN
            -- Iterate over each top-level key in the JSON object (e.g. 'leave_advanced', 'department_settings')
            FOR key, val IN SELECT * FROM jsonb_each(rec.app_config) LOOP
                -- Map old top-level keys to new standardized module names
                DECLARE
                    target_module TEXT;
                BEGIN
                    target_module := CASE 
                        WHEN key = 'leave_advanced' OR key = 'leave_hierarchy' THEN 'leave'
                        WHEN key = 'claim_advanced' OR key = 'claim_hierarchy' THEN 'claims'
                        WHEN key = 'overtime_advanced' OR key = 'overtime_hierarchy' THEN 'overtime'
                        WHEN key = 'department_settings' THEN 'department'
                        ELSE key -- fallback for anything else
                    END;

                    -- Upsert into the new table, merging settings if a module row already exists for this company
                    INSERT INTO public.company_module_settings (company_id, module, settings)
                    VALUES (
                        rec.company_id, 
                        target_module, 
                        CASE 
                            -- If mapping multiple legacy keys to the same module (e.g. leave_advanced + leave_hierarchy -> leave), wrap them
                            WHEN key LIKE 'leave_%' OR key LIKE 'claim_%' OR key LIKE 'overtime_%' 
                                THEN jsonb_build_object(key, val)
                            ELSE val
                        END
                    )
                    ON CONFLICT (company_id, module) DO UPDATE 
                    SET settings = public.company_module_settings.settings || EXCLUDED.settings,
                        updated_at = timezone('utc'::text, now());
                    
                    migrated_count := migrated_count + 1;
                END;
            END LOOP;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration Complete: Successfully processed % module fragments.', migrated_count;
END $$;

COMMIT;

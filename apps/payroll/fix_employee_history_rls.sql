-- ============================================================
-- FIX RLS for employee_history table and triggers
-- ============================================================

-- Enable RLS (Good practice)
ALTER TABLE public.employee_history ENABLE ROW LEVEL SECURITY;

-- Allow users to read history for their company
CREATE POLICY "Enable read access for authenticated users" 
ON public.employee_history FOR SELECT 
TO authenticated 
USING (company_id = auth.uid() OR employee_id IN (
    SELECT id FROM public.employees WHERE company_id = auth.uid()
));

-- Allow the system to insert via the trigger by running the function as SECURITY DEFINER
CREATE OR REPLACE FUNCTION log_employee_history()
RETURNS TRIGGER 
SECURITY DEFINER -- <--- THIS IS THE FIX: Allows trigger to bypass RLS during insert
AS $$
DECLARE
    old_projects jsonb;
    new_projects jsonb;
BEGIN
    -- Log Onboard (INSERT)
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.employee_history (employee_id, company_id, event_type, description, new_value)
        VALUES (NEW.id, NEW.company_id, 'onboard', 'Employee onboarded', NEW.name);
        RETURN NEW;
    END IF;

    -- Log Department Change
    IF OLD.department_id IS DISTINCT FROM NEW.department_id THEN
        INSERT INTO public.employee_history (employee_id, company_id, event_type, description, old_value, new_value)
        VALUES (NEW.id, NEW.company_id, 'department_change', 'Department changed', OLD.department_id::text, NEW.department_id::text);
    END IF;

    -- Log App Role Change
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        INSERT INTO public.employee_history (employee_id, company_id, event_type, description, old_value, new_value)
        VALUES (NEW.id, NEW.company_id, 'role_change', 'App role changed', OLD.role, NEW.role);
    END IF;

    -- Log Designation Change (job_role)
    IF OLD.job_role IS DISTINCT FROM NEW.job_role THEN
        INSERT INTO public.employee_history (employee_id, company_id, event_type, description, old_value, new_value)
        VALUES (NEW.id, NEW.company_id, 'designation_change', 'Designation changed', OLD.job_role, NEW.job_role);
    END IF;

    -- Log Project Assignment Change
    old_projects := OLD.custom_fields->'assignedProjects';
    new_projects := NEW.custom_fields->'assignedProjects';
    
    IF old_projects IS DISTINCT FROM new_projects THEN
        INSERT INTO public.employee_history (employee_id, company_id, event_type, description, old_value, new_value)
        VALUES (NEW.id, NEW.company_id, 'project_assign', 'Assigned projects updated', old_projects::text, new_projects::text);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

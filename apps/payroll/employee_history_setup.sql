-- ============================================================
-- employee_history table and audit triggers
-- Logs changes to Department, Role, Designation, Projects, Onboarding
-- ============================================================

CREATE TABLE IF NOT EXISTS public.employee_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    company_id uuid REFERENCES auth.users(id),
    event_type text NOT NULL,
    description text NOT NULL,
    old_value text,
    new_value text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT employee_history_pkey PRIMARY KEY (id)
);

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS employee_history_employee_id_idx ON public.employee_history (employee_id);
CREATE INDEX IF NOT EXISTS employee_history_company_id_idx ON public.employee_history (company_id);

CREATE OR REPLACE FUNCTION log_employee_history()
RETURNS TRIGGER AS $$
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

DROP TRIGGER IF EXISTS employee_history_trigger ON public.employees;

CREATE TRIGGER employee_history_trigger
AFTER INSERT OR UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION log_employee_history();

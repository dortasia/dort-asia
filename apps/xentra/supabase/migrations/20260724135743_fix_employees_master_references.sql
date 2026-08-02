-- Fix trigger function that was hardcoded to employees_master
CREATE OR REPLACE FUNCTION "public"."auto_assign_department_head_for_employees"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  dept_admin_id UUID;
  company_super_admin_emp_id UUID;
BEGIN
  -- Fetch the EMPLOYEE ID of the super admin by matching the auth user_id
  SELECT e.id INTO company_super_admin_emp_id
  FROM public.employees e
  JOIN public.companies c ON c.super_admin_id = e.user_id
  WHERE c.id = NEW.company_id
  LIMIT 1;

  -- Case A: If the employee is an Admin
  IF NEW.app_role = 'Admin' THEN
    IF NEW.department_id IS NOT NULL THEN
      -- Automatically set the department's head_id to this employee
      UPDATE public.departments
      SET head_id = NEW.id
      WHERE id = NEW.department_id;

      -- Force all non-admin employees in this department to point to this Admin
      UPDATE public.employees
      SET department_head = NEW.id
      WHERE department_id = NEW.department_id
        AND app_role != 'Admin'
        AND (department_head IS NULL OR department_head != NEW.id);
    END IF;
      
    -- STRICT POLICY: Admins MUST report to the Super Admin for EVERYTHING.
    -- Because this is a BEFORE trigger, it overrides any user/API attempt to change these fields!
    NEW.department_head := company_super_admin_emp_id;
    NEW.report_attendance_to := company_super_admin_emp_id;
    NEW.report_leave_to := company_super_admin_emp_id;
    NEW.report_claim_to := company_super_admin_emp_id;
  
  -- Case B: If the employee is a regular employee
  ELSIF NEW.department_id IS NOT NULL THEN
    -- Find their respective department Admin
    SELECT id INTO dept_admin_id
    FROM public.employees
    WHERE department_id = NEW.department_id
      AND app_role = 'Admin'
      LIMIT 1;
      
    -- Policy: Regular employees default to their Department Admin for the main head
    NEW.department_head := dept_admin_id;
  END IF;
  
  RETURN NEW;
END;
$$;

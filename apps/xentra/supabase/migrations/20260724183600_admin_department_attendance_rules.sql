-- Migration: Enforce Admin Department attendance policy
-- Admins are excluded from non-admin department attendance, and shown in the Admin Department attendance view only.

CREATE OR REPLACE FUNCTION public.get_department_employees_for_attendance(target_dept_id UUID)
RETURNS SETOF public.employees
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin_dept BOOLEAN := FALSE;
BEGIN
  -- Determine if the target department is the Admin Department
  SELECT (department_name = 'Admin Department') INTO is_admin_dept
  FROM public.departments
  WHERE id = target_dept_id;

  IF is_admin_dept THEN
    -- Return employees assigned to Admin Department OR with Admin/Super Admin role
    RETURN QUERY
    SELECT *
    FROM public.employees
    WHERE department_id = target_dept_id
       OR app_role IN ('Admin', 'Super Admin');
  ELSE
    -- Return only non-admin employees for regular departments
    RETURN QUERY
    SELECT *
    FROM public.employees
    WHERE department_id = target_dept_id
      AND (app_role IS NULL OR app_role NOT IN ('Admin', 'Super Admin'));
  END IF;
END;
$$;

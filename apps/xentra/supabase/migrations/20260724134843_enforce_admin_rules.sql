-- Enforce a maximum of ONE admin per department
CREATE UNIQUE INDEX IF NOT EXISTS unique_admin_per_dept 
ON public.employees (department_id) 
WHERE app_role = 'Admin';

-- Create function to prevent assigning 'Super Admin'
CREATE OR REPLACE FUNCTION public.restrict_super_admin_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.app_role = 'Super Admin' THEN
    RAISE EXCEPTION 'Cannot assign Super Admin role to employees.';
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.app_role IS DISTINCT FROM NEW.app_role AND NEW.app_role = 'Super Admin' THEN
    RAISE EXCEPTION 'Cannot promote existing employees to Super Admin.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to employees table
DROP TRIGGER IF EXISTS trg_restrict_super_admin ON public.employees;
CREATE TRIGGER trg_restrict_super_admin
BEFORE INSERT OR UPDATE OF app_role ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.restrict_super_admin_assignment();

-- Fix is_admin_in_company to handle Super Admins properly even if company_id is null
CREATE OR REPLACE FUNCTION public.is_admin_in_company(target_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If the user is a Super Admin, they have universal access regardless of company_id
  IF EXISTS (
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() AND app_role = 'Super Admin'
  ) THEN
    RETURN TRUE;
  END IF;

  -- Otherwise, they must be an Admin in the matching company
  IF target_company_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 
    FROM public.employees
    WHERE user_id = auth.uid() 
      AND company_id = target_company_id 
      AND app_role = 'Admin'
  );
END;
$$;

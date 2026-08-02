-- Make is_admin_in_company more robust against case sensitivity and Super Admin checking
CREATE OR REPLACE FUNCTION public.is_admin_in_company(target_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. If target_company_id is provided, check if the user is the Super Admin (owner) of the company
  -- This prevents the issue where a company creator hasn't been added to the employees table yet
  IF target_company_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.companies 
      WHERE id = target_company_id AND super_admin_id = auth.uid()
    ) THEN
      RETURN TRUE;
    END IF;
  ELSE
    -- If no target_company_id is provided, check if they own ANY company
    IF EXISTS (
      SELECT 1 FROM public.companies WHERE super_admin_id = auth.uid()
    ) THEN
      RETURN TRUE;
    END IF;
  END IF;

  -- 2. Check if they are a Super Admin or Admin in the employees table
  IF target_company_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 
      FROM public.employees
      WHERE user_id = auth.uid() 
        AND company_id = target_company_id 
        -- Case insensitive check for Admin roles
        AND lower(replace(app_role, ' ', '_')) IN ('admin', 'super_admin', 'superadmin')
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 
      FROM public.employees
      WHERE user_id = auth.uid() 
        AND lower(replace(app_role, ' ', '_')) IN ('admin', 'super_admin', 'superadmin')
    );
  END IF;
END;
$$;

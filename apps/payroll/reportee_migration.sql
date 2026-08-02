-- ─────────────────────────────────────────────────────────────────────────────
-- Change Reportee: Cross-Department Reporting Migration
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add manager_id column (self-referencing foreign key, nullable)
--    This stores the direct reporting manager of the employee.
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON public.employees(manager_id);

-- 2. Add reporting_department_id column
--    When an employee is given cross-department reporting, this stores
--    the department they now report INTO (for attendance, claims, leave, events).
--    NULL means they report into their own department_id.
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS reporting_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_reporting_dept ON public.employees(reporting_department_id);

-- 3. Auto-assign manager_id for all employees who don't have one yet.
--    Each employee gets the head of their own department as their default manager.
UPDATE public.employees AS e
SET manager_id = heads.id
FROM (
  SELECT id, department_id
  FROM   public.employees
  WHERE  is_head = true
) AS heads
WHERE e.department_id = heads.department_id
  AND e.is_head IS DISTINCT FROM true   -- don't assign head to themselves
  AND e.manager_id IS NULL;              -- only set if not already assigned

-- Verify (optional, uncomment to check):
-- SELECT id, name, role, department_id, manager_id, reporting_department_id, is_head
-- FROM public.employees
-- ORDER BY department_id, is_head DESC;

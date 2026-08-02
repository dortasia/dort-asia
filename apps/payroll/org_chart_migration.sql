-- ============================================================
-- Org Chart: Add manager_id column & auto-assign department hierarchy
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add the manager_id column (self-referencing, nullable)
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES employees(id) ON DELETE SET NULL;

-- 2. Index for fast hierarchy queries
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);

-- 3. Auto-assign: each department employee's manager = their department head
--    This uses is_head = true to identify the head per department_id
UPDATE employees e
SET manager_id = heads.id
FROM (
  SELECT id, department_id
  FROM employees
  WHERE is_head = true
    AND department_id IS NOT NULL
) heads
WHERE e.department_id = heads.department_id
  AND e.id != heads.id          -- don't make the head their own manager
  AND e.manager_id IS NULL;     -- only set if not already assigned

-- 4. Verify: check the resulting hierarchy
-- SELECT id, name, role, manager_id, is_head FROM employees ORDER BY department_id, is_head DESC;

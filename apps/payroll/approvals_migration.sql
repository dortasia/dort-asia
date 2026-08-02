-- ============================================================
-- Approvals Feature Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add require_approval_new_hire to company_settings
ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS require_approval_new_hire BOOLEAN DEFAULT TRUE;

-- 2. Create the approvals table
CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL,
  requester_name VARCHAR(255) NOT NULL,
  requester_email VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- e.g. 'Onboarding', 'Leave', 'Claim'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  payload JSONB, -- The structured data to process upon approval
  status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add RLS Policies for approvals
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert/select their company's approvals
CREATE POLICY access_company_approvals ON approvals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE user_id = auth.uid() AND employees.company_id = approvals.company_id
    ) OR EXISTS (
      SELECT 1 FROM company_settings
      WHERE company_email = auth.jwt() ->> 'email' AND company_settings.company_id = approvals.company_id
    )
  );

-- Optional: Enable trigger for updated_at if you use it globally
-- CREATE TRIGGER set_timestamp
-- BEFORE UPDATE ON approvals
-- FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

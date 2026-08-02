-- ============================================================
-- STEP 1 OF 2 — RUN THIS FIRST
-- Complete Schema Setup for Singapore Supabase
-- Paste into: Supabase → SQL Editor → Run
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES (IF NOT EXISTS — safe to re-run)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.company_settings (
  id                         uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id                 uuid UNIQUE,
  company_name               text NOT NULL,
  setup_completed            boolean DEFAULT false,
  created_at                 timestamp with time zone NOT NULL DEFAULT timezone('utc', now()),
  industry                   text,
  logo_url                   text,
  company_email              text,
  company_phone              text,
  super_admin_name           text,
  super_admin_personal_email text,
  super_admin_role           text,
  super_admin_avatar_url     text,
  super_admin_phone          text,
  super_admin_bio            text,
  custom_fields              jsonb DEFAULT '[]'::jsonb,
  geofencing_enabled         boolean DEFAULT true,
  company_lat                double precision,
  company_lng                double precision,
  company_radius             integer DEFAULT 200,
  company_address            text,
  shift_start                text DEFAULT '09:00',
  shift_end                  text DEFAULT '18:00',
  working_days               text[] DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri'],
  grace_period_mins          integer DEFAULT 15,
  ip_lock_enabled            boolean DEFAULT false,
  ip_lock_address            text,
  selfie_verification        boolean DEFAULT true,
  auto_overtime              boolean DEFAULT true,
  attendance_config          jsonb DEFAULT '{}'::jsonb,
  custom_roles               jsonb DEFAULT '[]'::jsonb,
  require_approval_new_hire  boolean DEFAULT true,
  working_period             text,
  company_type               text,
  attendance_type            text,
  start_time                 text,
  end_time                   text,
  start_am_pm                text,
  end_am_pm                  text,
  single_admin_per_department boolean DEFAULT true,
  storage_used_gb            numeric DEFAULT 0,
  storage_total_gb           numeric DEFAULT 100,
  connected_drives           jsonb DEFAULT '[]'::jsonb,
  app_role                   text,
  CONSTRAINT company_settings_pkey PRIMARY KEY (id),
  CONSTRAINT company_settings_company_id_fkey FOREIGN KEY (company_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.departments (
  id            uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id    uuid,
  name          text NOT NULL,
  description   text,
  designations  jsonb DEFAULT '[]'::jsonb,
  dept_id       text,
  head_id       uuid,
  delegation_config jsonb DEFAULT '{}'::jsonb,
  created_at    timestamp with time zone NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT departments_pkey PRIMARY KEY (id),
  CONSTRAINT departments_company_id_fkey FOREIGN KEY (company_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.employees (
  id                          uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id                  uuid,
  department_id               uuid,
  user_id                     uuid,
  name                        text NOT NULL,
  email                       text NOT NULL,
  role                        text NOT NULL DEFAULT 'Employee',
  designation                 text,
  gender                      text,
  is_head                     boolean DEFAULT false,
  is_active                   boolean DEFAULT true,
  created_at                  timestamp with time zone NOT NULL DEFAULT timezone('utc', now()),
  avatar_url                  text,
  emp_id                      text,
  job_type                    text,

  -- ── Personal Information ──────────────────────────────────
  preferred_name              text,
  personal_email              text,
  date_of_birth               date,
  nationality                 character varying,
  country_of_residence        character varying,
  residential_status          character varying,  -- 'Citizen' | 'PR' | 'EP' | 'S Pass' | 'Work Permit' | 'Dependant Pass' | 'LTVP'

  -- NRIC (Singapore Citizens / PRs)
  nric_number                 character varying,
  nric_front_url              text,
  nric_back_url               text,
  cpf_number                  character varying,
  tax_identification_number   character varying,

  -- FIN / Work Pass (Foreign Employees)
  fin_number                  character varying,
  passport_number             character varying,
  passport_expiry_date        date,
  issuing_country             character varying,
  work_pass_type              character varying,  -- 'EP' | 'S Pass' | 'Work Permit' | 'Dependant Pass' | 'LTVP'
  work_pass_number            character varying,
  work_pass_issue_date        date,
  work_pass_expiry_date       date,
  fin_card_url                text,
  passport_copy_url           text,
  work_pass_copy_url          text,

  -- ── Contact Information ───────────────────────────────────
  mobile                      text,               -- must be +65 followed by 8 digits
  phone_number                text,
  address                     text,
  postal_code                 character varying(6), -- Singapore 6-digit postal code

  -- ── Emergency Contact ─────────────────────────────────────
  emergency_contact_name      text,
  emergency_contact_number    character varying,  -- includes Asian country code
  emergency_contact_relation  character varying,
  emergency_contact_address   text,

  -- ── Education ─────────────────────────────────────────────
  -- Structure: { schooling: [...], higher_education: [...] }
  education_details           jsonb DEFAULT '{"schooling":[],"higher_education":[]}'::jsonb,

  -- ── Certifications ────────────────────────────────────────
  -- Structure: [{ name, issuer, issue_date, expiry_date, certificate_url }]
  certifications              jsonb DEFAULT '[]'::jsonb,

  -- ── Medical / Insurance ───────────────────────────────────
  -- Structure: [{ insurance_type, provider_name, policy_number, start_date, expiry_date,
  --               coverage_amount, premium_amount, payment_frequency,
  --               employee_covered, dependents_covered, num_dependents,
  --               spouse_coverage, children_coverage, parents_coverage }]
  insurance_details           jsonb DEFAULT '[]'::jsonb,

  -- ── Bank Details ──────────────────────────────────────────
  bank_name                   text,               -- dropdown from Public/Bank Logo Folder
  account_holder_name         text,
  account_number              character varying,
  bank_swift_code             character varying,  -- replaces IFSC (Singapore uses SWIFT/BIC)

  -- ── Salary & Employment ───────────────────────────────────
  salary                      numeric,
  shift_type                  character varying,
  overtime_applicable         boolean DEFAULT false,
  claims_applicable           boolean DEFAULT false,
  date_of_joining             date,
  employment_status           character varying,
  job_role                    character varying,
  site_id                     uuid,

  -- ── Custom Fields (from Employee Settings) ────────────────
  custom_fields               jsonb DEFAULT '{}'::jsonb,

  CONSTRAINT employees_pkey PRIMARY KEY (id),
  CONSTRAINT employees_company_id_fkey    FOREIGN KEY (company_id)    REFERENCES auth.users(id),
  CONSTRAINT employees_user_id_fkey       FOREIGN KEY (user_id)       REFERENCES auth.users(id),
  CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id)
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id            uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id   uuid,
  date          date NOT NULL DEFAULT CURRENT_DATE,
  status        text NOT NULL,
  location      text,
  clock_in      text,
  clock_out     text,
  hours         text,
  proof_url     text,
  created_at    timestamp with time zone NOT NULL DEFAULT timezone('utc', now()),
  clock_in_time timestamp with time zone DEFAULT now(),
  CONSTRAINT attendance_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.approvals (
  id              uuid NOT NULL DEFAULT uuid_generate_v4(),
  company_id      uuid NOT NULL,
  requester_name  character varying NOT NULL,
  requester_email character varying NOT NULL,
  type            character varying NOT NULL,
  title           character varying NOT NULL,
  description     text,
  payload         jsonb,
  status          character varying DEFAULT 'Pending',
  created_at      timestamp with time zone DEFAULT now(),
  updated_at      timestamp with time zone DEFAULT now(),
  CONSTRAINT approvals_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_id uuid,
  title       text NOT NULL,
  message     text NOT NULL,
  type        text DEFAULT 'info',
  is_read     boolean DEFAULT false,
  created_at  timestamp with time zone NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id text NOT NULL,
  sender_id       uuid,
  text            text,
  type            text DEFAULT 'text',
  created_at      timestamp with time zone NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT messages_pkey PRIMARY KEY (id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages          ENABLE ROW LEVEL SECURITY;

-- company_settings
DROP POLICY IF EXISTS "Super admin owns their settings"     ON public.company_settings;
DROP POLICY IF EXISTS "Employees can read company settings" ON public.company_settings;

CREATE POLICY "Super admin owns their settings"
  ON public.company_settings FOR ALL
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

CREATE POLICY "Employees can read company settings"
  ON public.company_settings FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.employees WHERE email = (auth.jwt() ->> 'email')
    )
  );

-- departments
DROP POLICY IF EXISTS "Authenticated users can read departments" ON public.departments;
DROP POLICY IF EXISTS "Super admin manages departments"          ON public.departments;

CREATE POLICY "Authenticated users can read departments"
  ON public.departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin manages departments"
  ON public.departments FOR ALL
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- employees — helper function to break RLS recursion
CREATE OR REPLACE FUNCTION public.is_active_company_member(target_company_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.employees
    WHERE company_id = target_company_id
      AND email = auth.email()
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Active employees can read employees" ON public.employees;
DROP POLICY IF EXISTS "Super admin manages employees"       ON public.employees;

CREATE POLICY "Active employees can read employees"
  ON public.employees FOR SELECT
  TO authenticated
  USING (
    (email = auth.email() AND is_active = true)
    OR public.is_active_company_member(company_id)
    OR company_id = auth.uid()
  );

CREATE POLICY "Super admin manages employees"
  ON public.employees FOR ALL
  TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- attendance
DROP POLICY IF EXISTS "Authenticated users can read attendance"   ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can update attendance" ON public.attendance;

CREATE POLICY "Authenticated users can read attendance"   ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update attendance" ON public.attendance FOR UPDATE TO authenticated USING (true);

-- approvals
DROP POLICY IF EXISTS "Authenticated users can read approvals"   ON public.approvals;
DROP POLICY IF EXISTS "Authenticated users can insert approvals" ON public.approvals;
DROP POLICY IF EXISTS "Authenticated users can update approvals" ON public.approvals;

CREATE POLICY "Authenticated users can read approvals"   ON public.approvals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert approvals" ON public.approvals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update approvals" ON public.approvals FOR UPDATE TO authenticated USING (true);

-- notifications
DROP POLICY IF EXISTS "Authenticated users can read notifications"   ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can update notifications" ON public.notifications;

CREATE POLICY "Authenticated users can read notifications"   ON public.notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update notifications" ON public.notifications FOR UPDATE TO authenticated USING (true);

-- messages
DROP POLICY IF EXISTS "Authenticated users can read messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;

CREATE POLICY "Authenticated users can read messages" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

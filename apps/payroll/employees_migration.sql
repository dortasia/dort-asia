-- ============================================================
-- employees table – COMPLETE MIGRATION v3
-- ALL fields moved to dedicated Supabase columns.
-- custom_fields JSONB only retains:
--   - assignedProjects (array)
--   - allowances (array)
--   - certifications (array of objects)
--   - company custom fields (dynamic, org-defined)
-- Date: 6-6-2025
-- ============================================================


-- ── STEP 1: Add ALL new dedicated columns ────────────────────────────────────

alter table public.employees

  -- ── Personal (Step 1) ──────────────────────────────────────────────────────
  add column if not exists marital_status             text          null,
  add column if not exists linkedin_url               text          null,
  add column if not exists instagram_url              text          null,

  -- ── Identity toggle (Step 2) ───────────────────────────────────────────────
  add column if not exists identity_type              text          null default 'NRIC',  -- 'NRIC' | 'FIN'

  -- ── Contact: current SG address (non-SG employees, Step 5) ────────────────
  add column if not exists current_address            text          null,
  add column if not exists current_postal_code        text          null,
  add column if not exists current_email              text          null,
  add column if not exists current_mobile             text          null,
  add column if not exists current_mobile_code        text          null default '+65'::text,

  -- ── Contact: native / home country (non-SG employees, Step 5) ─────────────
  add column if not exists native_mobile              text          null,
  add column if not exists native_mobile_code         text          null,
  add column if not exists native_address             text          null,
  add column if not exists native_postal_code         text          null,

  -- ── Medical (Step 9) ───────────────────────────────────────────────────────
  add column if not exists blood_group                varchar(10)   null,

  -- ── Insurance / Medical policy (Step 9) ───────────────────────────────────
  add column if not exists insurance_type             text          null,
  add column if not exists insurance_provider         text          null,
  add column if not exists insurance_policy_number    text          null,
  add column if not exists insurance_payment_freq     text          null,
  add column if not exists insurance_policy_start     date          null,
  add column if not exists insurance_policy_expiry    date          null,
  add column if not exists insurance_coverage_amount  numeric       null,
  add column if not exists insurance_premium_amount   numeric       null,
  add column if not exists employee_covered           text          null,
  add column if not exists dependents_covered         text          null,
  add column if not exists num_dependents             integer       null,
  add column if not exists spouse_coverage            text          null,
  add column if not exists children_coverage          text          null,
  add column if not exists parents_coverage           text          null,

  -- ── Education: Higher Education (Step 7) ──────────────────────────────────
  add column if not exists higher_edu_country         text          null,
  add column if not exists higher_edu_inst_name       text          null,
  add column if not exists higher_edu_course_name     text          null,
  add column if not exists higher_edu_course_duration text          null,
  add column if not exists higher_edu_qual            text          null,
  add column if not exists higher_edu_grad_year       text          null,
  add column if not exists higher_edu_cert_url        text          null,

  -- ── Education: Schooling (Step 7) ─────────────────────────────────────────
  add column if not exists schooling_country          text          null,
  add column if not exists schooling_inst_name        text          null,
  add column if not exists schooling_qual             text          null,
  add column if not exists schooling_grad_year        text          null,
  add column if not exists schooling_cert_url         text          null,

  -- ── Certifications (Step 8) — stored as jsonb array ──────────────────────
  add column if not exists certifications             jsonb         null default '[]'::jsonb,

  -- ── Bank details (Step 10) ────────────────────────────────────────────────
  add column if not exists bank_code                  varchar       null,
  add column if not exists branch_code                varchar       null,
  add column if not exists salary_payment_mode        text          null,
  add column if not exists online_payment_type        text          null,
  add column if not exists online_payment_id          text          null,

  -- ── Tax / Payroll (Step 4) ────────────────────────────────────────────────
  add column if not exists monthly_tax_estimate       numeric       null,
  add column if not exists shg_contribution           text          null,
  add column if not exists shg_amount                 numeric       null,
  add column if not exists foreign_worker_levy        numeric       null,
  add column if not exists custom_cpf_employee        numeric       null,
  add column if not exists custom_cpf_employee_rate   numeric       null,
  add column if not exists custom_cpf_employer        numeric       null,
  add column if not exists custom_cpf_employer_rate   numeric       null,
  add column if not exists custom_sdl                 numeric       null,
  add column if not exists custom_sdl_rate            numeric       null,
  add column if not exists custom_cdac_rate           numeric       null,
  add column if not exists custom_sinda_rate          numeric       null,
  add column if not exists custom_mbmf_rate           numeric       null,
  add column if not exists custom_ecf_rate            numeric       null,
  add column if not exists custom_income_tax_rate     numeric       null,

  -- ── Work: Overtime config (Step 3) ────────────────────────────────────────
  add column if not exists overtime_working_hours     numeric       null,
  add column if not exists overtime_period            text          null default 'monthly';


-- ── STEP 2: Drop columns not used in the UI ──────────────────────────────────

alter table public.employees
  drop column if exists preferred_name,
  drop column if exists country_of_residence,
  drop column if exists bank_swift_code,
  drop column if exists phone_number,
  drop column if exists employment_status,
  drop column if exists designation,
  drop column if exists site_id,
  drop column if exists fcm_token,
  drop column if exists education_details,    -- replaced by dedicated columns
  drop column if exists insurance_details;    -- replaced by dedicated columns


-- ── STEP 3: Indexes ───────────────────────────────────────────────────────────

create index if not exists employees_company_id_idx        on public.employees (company_id);
create index if not exists employees_department_id_idx     on public.employees (department_id);
create index if not exists employees_user_id_idx           on public.employees (user_id);
create index if not exists employees_emp_id_idx            on public.employees (emp_id);
create index if not exists employees_is_active_idx         on public.employees (is_active);
create index if not exists employees_salary_payment_idx    on public.employees (salary_payment_mode);
create index if not exists employees_nationality_idx       on public.employees (nationality);


-- ── FINAL custom_fields JSONB — only these 3 remain ──────────────────────────
--
--   assignedProjects  text[]   → array of project codes assigned to employee
--   allowances        jsonb[]  → [{name: string, amount: string}]
--   certifications    jsonb[]  → [{certName, issuingOrg, certIssueDate,
--                                  certExpiryDate, certNumber, certificationUrl}]
--   [company custom fields]   → dynamic fields from company_settings
--
-- NOTE: certifications is also a dedicated column (jsonb array) so it is
--       stored in both places for backwards compatibility. Use the column.
-- ─────────────────────────────────────────────────────────────────────────────

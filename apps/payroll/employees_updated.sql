-- ============================================================
-- employees table – cleaned up as of 6-6-2025
-- Aligned with: employees/[id]/edit/page.tsx (UI form inputs)
--
-- REMOVED (not shown/used in the edit UI):
--   preferred_name        – no field on edit page
--   country_of_residence  – replaced by residential_status logic
--   bank_swift_code       – bankCode/branchCode go to custom_fields
--   phone_number          – only mobile is used (current_mobile / native_mobile)
--   employment_status     – not on edit page (is_active boolean is used instead)
--   designation           – job_role column is used for Designation in the UI
--   site_id               – not on edit page
--   fcm_token             – not on edit page (push notification token only)
-- ============================================================

create table public.employees (
  -- ── Core identifiers ─────────────────────────────────────
  id                        uuid          not null default gen_random_uuid(),
  company_id                uuid          null,
  department_id             uuid          null,
  user_id                   uuid          null,

  -- ── Basic profile ─────────────────────────────────────────
  name                      text          not null,
  email                     text          not null,
  role                      text          not null default 'Employee'::text,
  gender                    text          null,
  is_head                   boolean       null default false,
  is_active                 boolean       null default true,
  created_at                timestamp with time zone not null default timezone('utc'::text, now()),
  avatar_url                text          null,

  -- ── Work details ──────────────────────────────────────────
  emp_id                    text          null,
  job_type                  text          null,           -- Full Time / Part Time / Contract
  job_role                  text          null,           -- Designation (e.g. "Senior Engineer")
  date_of_joining           date          null,
  salary                    numeric       null,
  shift_type                text          null,           -- Standard / Morning / Night
  overtime_applicable       boolean       null default false,
  claims_applicable         boolean       null default false,

  -- ── Personal info ─────────────────────────────────────────
  date_of_birth             date          null,
  nationality               character varying null,
  personal_email            text          null,

  -- ── Identity – NRIC (Singapore Citizen / PR) ──────────────
  residential_status        character varying null,
  nric_number               character varying null,
  nric_front_url            text          null,
  nric_back_url             text          null,
  cpf_number                character varying null,
  tax_identification_number character varying null,

  -- ── Identity – FIN / Foreigner ────────────────────────────
  fin_number                character varying null,
  passport_number           character varying null,
  passport_expiry_date      date          null,
  issuing_country           character varying null,
  work_pass_type            character varying null,
  work_pass_number          character varying null,
  work_pass_issue_date      date          null,
  work_pass_expiry_date     date          null,
  fin_card_url              text          null,
  passport_copy_url         text          null,
  work_pass_copy_url        text          null,

  -- ── Contact – primary (SG) ───────────────────────────────
  mobile                    text          null,           -- "+65 9123 4567"
  address                   text          null,           -- residential address
  postal_code               character varying(6) null,

  -- ── Contact – current SG address (non-SG employees) ──────
  current_address           text          null,
  current_postal_code       text          null,
  current_email             text          null,
  current_mobile            text          null,
  current_mobile_code       text          null default '+65'::text,

  -- ── Contact – native / home country (non-SG employees) ───
  native_mobile             text          null,
  native_mobile_code        text          null,

  -- ── Emergency contact ─────────────────────────────────────
  emergency_contact_name    text          null,
  emergency_contact_number  character varying null,
  emergency_contact_relation character varying null,
  emergency_contact_address text          null,

  -- ── Medical ───────────────────────────────────────────────
  blood_group               character varying(10) null,

  -- ── Education & Certifications (structured JSON) ──────────
  education_details         jsonb         null default '{"schooling": [], "higher_education": []}'::jsonb,
  certifications            jsonb         null default '[]'::jsonb,

  -- ── Insurance (structured JSON) ───────────────────────────
  insurance_details         jsonb         null default '[]'::jsonb,

  -- ── Bank details ──────────────────────────────────────────
  bank_name                 text          null,
  account_holder_name       text          null,
  account_number            character varying null,

  -- ── Dynamic / overflow store ──────────────────────────────
  -- Stores: overtime config, tax rates, project assignments,
  --         bank code, branch code, salary payment mode,
  --         allowances, custom field values, etc.
  custom_fields             jsonb         null default '{}'::jsonb,

  -- ── Constraints ───────────────────────────────────────────
  constraint employees_pkey
    primary key (id),
  constraint employees_company_id_fkey
    foreign key (company_id) references auth.users (id),
  constraint employees_department_id_fkey
    foreign key (department_id) references departments (id) on delete cascade,
  constraint employees_user_id_fkey
    foreign key (user_id) references auth.users (id)

) tablespace pg_default;

-- ── Indexes (recommended) ─────────────────────────────────────────────────────
create index if not exists employees_company_id_idx   on public.employees (company_id);
create index if not exists employees_department_id_idx on public.employees (department_id);
create index if not exists employees_user_id_idx      on public.employees (user_id);
create index if not exists employees_emp_id_idx       on public.employees (emp_id);

-- ── Migration: add any columns that are new since last deploy ─────────────────
-- Run only if upgrading an existing table (skip if creating from scratch).

alter table public.employees
  add column if not exists current_address       text          null,
  add column if not exists current_postal_code   text          null,
  add column if not exists current_email         text          null,
  add column if not exists current_mobile        text          null,
  add column if not exists current_mobile_code   text          null default '+65'::text,
  add column if not exists native_mobile         text          null,
  add column if not exists native_mobile_code    text          null,
  add column if not exists blood_group           character varying(10) null;

-- ── Migration: drop columns that are no longer used by the UI ─────────────────
-- Run only if upgrading an existing table.
-- IMPORTANT: Back up your data before running DROP COLUMN statements.

alter table public.employees
  drop column if exists preferred_name,
  drop column if exists country_of_residence,
  drop column if exists bank_swift_code,
  drop column if exists phone_number,
  drop column if exists employment_status,
  drop column if exists designation,
  drop column if exists site_id,
  drop column if exists fcm_token;

-- ── End of employees_updated.sql ──────────────────────────────────────────────

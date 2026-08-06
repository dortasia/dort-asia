


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."auto_assign_admin_dept_head"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.department_name = 'Admin Department' AND NEW.head_id IS NULL THEN
    SELECT super_admin_id INTO NEW.head_id
    FROM public.companies
    WHERE id = NEW.company_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_assign_admin_dept_head"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_assign_admin_manager"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.app_role = 'Admin' THEN
    SELECT super_admin_id INTO NEW.manager_id
    FROM public.companies
    WHERE id = NEW.company_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_assign_admin_manager"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_assign_department_head"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.app_role = 'Admin' AND NEW.department_id IS NOT NULL THEN
    UPDATE public.departments
    SET head_id = NEW.id
    WHERE id = NEW.department_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_assign_department_head"() OWNER TO "postgres";


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

      -- Force all non-admin employees to point to this Admin
      -- FIX: Added `AND id != NEW.id` to prevent the infinite recursion crash!
      UPDATE public.employees
      SET department_head = NEW.id
      WHERE department_id = NEW.department_id
        AND id != NEW.id 
        AND (app_role != 'Admin' OR app_role IS NULL)
        AND (department_head IS NULL OR department_head != NEW.id);
    END IF;
      
    -- STRICT POLICY: Admins MUST report to the Super Admin for EVERYTHING.
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


ALTER FUNCTION "public"."auto_assign_department_head_for_employees"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_assign_reportees_to_dept_head"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_head_id UUID;
BEGIN
  -- If any of the reportee fields are null, find the department head
  IF NEW.report_attendance_to IS NULL OR NEW.report_leave_to IS NULL OR NEW.report_claim_to IS NULL THEN
    SELECT id INTO v_head_id
    FROM public.employees
    WHERE department_id = NEW.department_id AND is_head = true
    LIMIT 1;

    IF FOUND AND v_head_id != NEW.id THEN
      NEW.report_attendance_to := COALESCE(NEW.report_attendance_to, v_head_id);
      NEW.report_leave_to := COALESCE(NEW.report_leave_to, v_head_id);
      NEW.report_claim_to := COALESCE(NEW.report_claim_to, v_head_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_assign_reportees_to_dept_head"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_attendance_partition"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    next_month_start DATE := date_trunc('month', now() + interval '1 month');
    next_month_end DATE := date_trunc('month', now() + interval '2 months');
    partition_name TEXT := 'attendance_y' || to_char(next_month_start, 'YYYY') || 'm' || to_char(next_month_start, 'MM');
BEGIN
    EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.attendance FOR VALUES FROM (%L) TO (%L)',
                   partition_name, next_month_start, next_month_end);
END;
$$;


ALTER FUNCTION "public"."create_attendance_partition"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "department_id" "uuid",
    "department_head" "uuid",
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "app_role" "text" DEFAULT 'Employee'::"text" NOT NULL,
    "emp_id" "text",
    "phone_number" "text",
    "designation" "text",
    "date_of_joining" "date",
    "avatar_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "is_head" boolean DEFAULT false,
    "reporting_department_id" "uuid",
    "report_attendance_to" "uuid",
    "report_leave_to" "uuid",
    "report_claim_to" "uuid",
    "manager_id" "uuid",
    "leave_policy_id" "uuid",
    "custom_fields" "jsonb" DEFAULT '{}'::"jsonb",
    "first_name" "text",
    "last_name" "text",
    "date_of_birth" "date",
    "gender" "text",
    "marital_status" "text",
    "nationality" "text",
    "race" "text",
    "religion" "text",
    "pass_type" "text",
    "skill_status" "text",
    "linkedin_url" "text",
    "instagram_url" "text"
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_department_employees_for_attendance"("target_dept_id" "uuid") RETURNS SETOF "public"."employees"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."get_department_employees_for_attendance"("target_dept_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_employee_context"() RETURNS TABLE("my_company_id" "uuid", "my_role" "text", "my_is_active" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY 
  SELECT e.company_id, e.role, e.is_active
  FROM public.employees e
  WHERE e.email = (auth.jwt() ->> 'email')
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_user_employee_context"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_active_company_member"("target_company_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.employees
    WHERE company_id = target_company_id
      AND user_id = auth.uid()
      AND is_active = true
  );
END;
$$;


ALTER FUNCTION "public"."is_active_company_member"("target_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_in_company"("target_company_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."is_admin_in_company"("target_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restrict_super_admin_assignment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.app_role = 'Super Admin' THEN
    RAISE EXCEPTION 'Cannot assign Super Admin role to employees.';
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.app_role IS DISTINCT FROM NEW.app_role AND NEW.app_role = 'Super Admin' THEN
    RAISE EXCEPTION 'Cannot promote existing employees to Super Admin.';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."restrict_super_admin_assignment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_leave_status_from_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.type = 'Leave' AND NEW.status != OLD.status THEN
    -- The payload contains the leave_id to link it back
    UPDATE leaves 
    SET status = NEW.status, updated_at = NOW()
    WHERE id = (NEW.payload->>'leave_id')::UUID;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_leave_status_from_approval"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_employees_view_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    DELETE FROM public.employees_master WHERE id = OLD.id;
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."trg_employees_view_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_employees_view_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_employee_id UUID;
BEGIN
    INSERT INTO public.employees_master (
        id, company_id, user_id, department_id, department_head, report_attendance_to, report_leave_to, report_claim_to,
        name, email, app_role, emp_id, phone_number, designation, date_of_joining, 
        avatar_url, is_active, is_head, reporting_department_id, manager_id, created_at
    ) VALUES (
        COALESCE(NEW.id, gen_random_uuid()), NEW.company_id, NEW.user_id, NEW.department_id, NEW.department_head, NEW.report_attendance_to, NEW.report_leave_to, NEW.report_claim_to,
        NEW.name, NEW.email, COALESCE(NEW.app_role, 'Employee'), NEW.emp_id, NEW.phone_number, NEW.designation, NEW.date_of_joining,
        NEW.avatar_url, COALESCE(NEW.is_active, true), COALESCE(NEW.is_head, false), NEW.reporting_department_id, NEW.manager_id, COALESCE(NEW.created_at, now())
    ) RETURNING id INTO new_employee_id;

    INSERT INTO public.employee_personal_details (
        employee_id, first_name, last_name, gender, date_of_birth, marital_status, blood_group, nationality,
        race, religion, personal_email, personal_number, emergency_contact_name, emergency_contact_number,
        emergency_contact_relation, emergency_contact_address, emergency_contact_code
    ) VALUES (
        new_employee_id, NEW.first_name, COALESCE(NEW.last_name, ''), NEW.gender, NEW.date_of_birth, NEW.marital_status, NEW.blood_group, NEW.nationality,
        NEW.race, NEW.religion, NEW.personal_email, NEW.personal_number, NEW.emergency_contact_name, NEW.emergency_contact_number,
        NEW.emergency_contact_relation, NEW.emergency_contact_address, NEW.emergency_contact_code
    );

    INSERT INTO public.employee_contact_details (
        employee_id, mobile_code, residential_address, postal_code, current_address, current_postal_code,
        current_mobile_number, current_email, current_residential_address, native_address, native_postal_code,
        native_mobile_code, native_mobile_number, native_residential_address, linkedin_url, instagram_url
    ) VALUES (
        new_employee_id, NEW.mobile_code, NEW.residential_address, NEW.postal_code, NEW.current_address, NEW.current_postal_code,
        NEW.current_mobile_number, NEW.current_email, NEW.current_residential_address, NEW.native_address, NEW.native_postal_code,
        NEW.native_mobile_code, NEW.native_mobile_number, NEW.native_residential_address, NEW.linkedin_url, NEW.instagram_url
    );

    INSERT INTO public.employee_work_details (
        employee_id, job_type, shift_type, overtime_applicable, claims_applicable
    ) VALUES (
        new_employee_id, COALESCE(NEW.job_type, 'Full Time'), NEW.shift_type, COALESCE(NEW.overtime_applicable, false), COALESCE(NEW.claims_applicable, false)
    );

    INSERT INTO public.employee_identity_docs (
        employee_id, nric_number, fin_number, passport_number, passport_expiry, issuing_country,
        pass_type, pass_number, pass_issue_date, pass_expiry_date, nric_copy_url, passport_copy_url,
        pass_copy_url, work_permit_skill
    ) VALUES (
        new_employee_id, NEW.nric_number, NEW.fin_number, NEW.passport_number, NEW.passport_expiry, NEW.issuing_country,
        NEW.pass_type, NEW.pass_number, NEW.pass_issue_date, NEW.pass_expiry_date, NEW.nric_copy_url, NEW.passport_copy_url,
        NEW.pass_copy_url, NEW.work_permit_skill
    );

    INSERT INTO public.employee_education (
        employee_id, higher_edu_country, higher_edu_institution, higher_edu_course, higher_edu_qualification,
        higher_edu_grad_year, higher_edu_course_duration, higher_edu_cert_url, schooling_country, schooling_institution,
        schooling_qualification, schooling_grad_year, schooling_cert_url, certifications
    ) VALUES (
        new_employee_id, NEW.higher_edu_country, NEW.higher_edu_institution, NEW.higher_edu_course, NEW.higher_edu_qualification,
        NEW.higher_edu_grad_year, NEW.higher_edu_course_duration, NEW.higher_edu_cert_url, NEW.schooling_country, NEW.schooling_institution,
        NEW.schooling_qualification, NEW.schooling_grad_year, NEW.schooling_cert_url, COALESCE(NEW.certifications, '[]'::jsonb)
    );

    INSERT INTO public.employee_bank_details (
        employee_id, bank_name, bank_account_number, account_number, account_holder_name, bank_code,
        branch_code, salary_payment_mode, online_payment_type, online_payment_id
    ) VALUES (
        new_employee_id, NEW.bank_name, NEW.bank_account_number, NEW.account_number, NEW.account_holder_name, NEW.bank_code,
        NEW.branch_code, NEW.salary_payment_mode, NEW.online_payment_type, NEW.online_payment_id
    );

    INSERT INTO public.employee_insurance (
        employee_id, insurance_type, insur_provider, insur_policy_num, insur_policy_start, insur_policy_expiry,
        insur_coverage_amt, insur_premium_amt, insur_payment_freq, emp_covered, deps_covered, num_deps,
        spouse_coverage, children_coverage, parents_coverage
    ) VALUES (
        new_employee_id, NEW.insurance_type, NEW.insur_provider, NEW.insur_policy_num, NEW.insur_policy_start, NEW.insur_policy_expiry,
        NEW.insur_coverage_amt, NEW.insur_premium_amt, NEW.insur_payment_freq, NEW.emp_covered, NEW.deps_covered, NEW.num_deps,
        NEW.spouse_coverage, NEW.children_coverage, NEW.parents_coverage
    );

    INSERT INTO public.employee_declarations (
        employee_id, terms_accepted, privacy_consent, emp_declaration, digital_signature
    ) VALUES (
        new_employee_id, COALESCE(NEW.terms_accepted, false), COALESCE(NEW.privacy_consent, false), COALESCE(NEW.emp_declaration, false), NEW.digital_signature
    );

    SELECT * INTO NEW FROM public.employees WHERE id = new_employee_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_employees_view_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_employees_view_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE public.employees_master SET
        company_id = NEW.company_id,
        user_id = NEW.user_id,
        department_id = NEW.department_id,
        department_head = NEW.department_head,
        report_attendance_to = NEW.report_attendance_to,
        report_leave_to = NEW.report_leave_to,
        report_claim_to = NEW.report_claim_to,
        name = NEW.name,
        email = NEW.email,
        app_role = NEW.app_role,
        emp_id = NEW.emp_id,
        phone_number = NEW.phone_number,
        designation = NEW.designation,
        date_of_joining = NEW.date_of_joining,
        avatar_url = NEW.avatar_url,
        is_active = NEW.is_active,
        is_head = NEW.is_head,
        reporting_department_id = NEW.reporting_department_id,
        manager_id = NEW.manager_id
    WHERE id = OLD.id;

    INSERT INTO public.employee_personal_details (
        employee_id, first_name, last_name, gender, date_of_birth, marital_status, blood_group, nationality,
        race, religion, personal_email, personal_number, emergency_contact_name, emergency_contact_number,
        emergency_contact_relation, emergency_contact_address, emergency_contact_code
    ) VALUES (
        OLD.id, NEW.first_name, COALESCE(NEW.last_name, ''), NEW.gender, NEW.date_of_birth, NEW.marital_status, NEW.blood_group, NEW.nationality,
        NEW.race, NEW.religion, NEW.personal_email, NEW.personal_number, NEW.emergency_contact_name, NEW.emergency_contact_number,
        NEW.emergency_contact_relation, NEW.emergency_contact_address, NEW.emergency_contact_code
    ) ON CONFLICT (employee_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        gender = EXCLUDED.gender,
        date_of_birth = EXCLUDED.date_of_birth,
        marital_status = EXCLUDED.marital_status,
        blood_group = EXCLUDED.blood_group,
        nationality = EXCLUDED.nationality,
        race = EXCLUDED.race,
        religion = EXCLUDED.religion,
        personal_email = EXCLUDED.personal_email,
        personal_number = EXCLUDED.personal_number,
        emergency_contact_name = EXCLUDED.emergency_contact_name,
        emergency_contact_number = EXCLUDED.emergency_contact_number,
        emergency_contact_relation = EXCLUDED.emergency_contact_relation,
        emergency_contact_address = EXCLUDED.emergency_contact_address,
        emergency_contact_code = EXCLUDED.emergency_contact_code;

    INSERT INTO public.employee_contact_details (
        employee_id, mobile_code, residential_address, postal_code, current_address, current_postal_code,
        current_mobile_number, current_email, current_residential_address, native_address, native_postal_code,
        native_mobile_code, native_mobile_number, native_residential_address, linkedin_url, instagram_url
    ) VALUES (
        OLD.id, NEW.mobile_code, NEW.residential_address, NEW.postal_code, NEW.current_address, NEW.current_postal_code,
        NEW.current_mobile_number, NEW.current_email, NEW.current_residential_address, NEW.native_address, NEW.native_postal_code,
        NEW.native_mobile_code, NEW.native_mobile_number, NEW.native_residential_address, NEW.linkedin_url, NEW.instagram_url
    ) ON CONFLICT (employee_id) DO UPDATE SET
        mobile_code = EXCLUDED.mobile_code,
        residential_address = EXCLUDED.residential_address,
        postal_code = EXCLUDED.postal_code,
        current_address = EXCLUDED.current_address,
        current_postal_code = EXCLUDED.current_postal_code,
        current_mobile_number = EXCLUDED.current_mobile_number,
        current_email = EXCLUDED.current_email,
        current_residential_address = EXCLUDED.current_residential_address,
        native_address = EXCLUDED.native_address,
        native_postal_code = EXCLUDED.native_postal_code,
        native_mobile_code = EXCLUDED.native_mobile_code,
        native_mobile_number = EXCLUDED.native_mobile_number,
        native_residential_address = EXCLUDED.native_residential_address,
        linkedin_url = EXCLUDED.linkedin_url,
        instagram_url = EXCLUDED.instagram_url;

    INSERT INTO public.employee_work_details (
        employee_id, job_type, shift_type, overtime_applicable, claims_applicable
    ) VALUES (
        OLD.id, COALESCE(NEW.job_type, 'Full Time'), NEW.shift_type, COALESCE(NEW.overtime_applicable, false), COALESCE(NEW.claims_applicable, false)
    ) ON CONFLICT (employee_id) DO UPDATE SET
        job_type = EXCLUDED.job_type,
        shift_type = EXCLUDED.shift_type,
        overtime_applicable = EXCLUDED.overtime_applicable,
        claims_applicable = EXCLUDED.claims_applicable;

    INSERT INTO public.employee_identity_docs (
        employee_id, nric_number, fin_number, passport_number, passport_expiry, issuing_country,
        pass_type, pass_number, pass_issue_date, pass_expiry_date, nric_copy_url, passport_copy_url,
        pass_copy_url, work_permit_skill
    ) VALUES (
        OLD.id, NEW.nric_number, NEW.fin_number, NEW.passport_number, NEW.passport_expiry, NEW.issuing_country,
        NEW.pass_type, NEW.pass_number, NEW.pass_issue_date, NEW.pass_expiry_date, NEW.nric_copy_url, NEW.passport_copy_url,
        NEW.pass_copy_url, NEW.work_permit_skill
    ) ON CONFLICT (employee_id) DO UPDATE SET
        nric_number = EXCLUDED.nric_number,
        fin_number = EXCLUDED.fin_number,
        passport_number = EXCLUDED.passport_number,
        passport_expiry = EXCLUDED.passport_expiry,
        issuing_country = EXCLUDED.issuing_country,
        pass_type = EXCLUDED.pass_type,
        pass_number = EXCLUDED.pass_number,
        pass_issue_date = EXCLUDED.pass_issue_date,
        pass_expiry_date = EXCLUDED.pass_expiry_date,
        nric_copy_url = EXCLUDED.nric_copy_url,
        passport_copy_url = EXCLUDED.passport_copy_url,
        pass_copy_url = EXCLUDED.pass_copy_url,
        work_permit_skill = EXCLUDED.work_permit_skill;

    INSERT INTO public.employee_education (
        employee_id, higher_edu_country, higher_edu_institution, higher_edu_course, higher_edu_qualification,
        higher_edu_grad_year, higher_edu_course_duration, higher_edu_cert_url, schooling_country, schooling_institution,
        schooling_qualification, schooling_grad_year, schooling_cert_url, certifications
    ) VALUES (
        OLD.id, NEW.higher_edu_country, NEW.higher_edu_institution, NEW.higher_edu_course, NEW.higher_edu_qualification,
        NEW.higher_edu_grad_year, NEW.higher_edu_course_duration, NEW.higher_edu_cert_url, NEW.schooling_country, NEW.schooling_institution,
        schooling_qualification, schooling_grad_year, schooling_cert_url, COALESCE(NEW.certifications, '[]'::jsonb)
    ) ON CONFLICT (employee_id) DO UPDATE SET
        higher_edu_country = EXCLUDED.higher_edu_country,
        higher_edu_institution = EXCLUDED.higher_edu_institution,
        higher_edu_course = EXCLUDED.higher_edu_course,
        higher_edu_qualification = EXCLUDED.higher_edu_qualification,
        higher_edu_grad_year = EXCLUDED.higher_edu_grad_year,
        higher_edu_course_duration = EXCLUDED.higher_edu_course_duration,
        higher_edu_cert_url = EXCLUDED.higher_edu_cert_url,
        schooling_country = EXCLUDED.schooling_country,
        schooling_institution = EXCLUDED.schooling_institution,
        schooling_qualification = EXCLUDED.schooling_qualification,
        schooling_grad_year = EXCLUDED.schooling_grad_year,
        schooling_cert_url = EXCLUDED.schooling_cert_url,
        certifications = EXCLUDED.certifications;

    INSERT INTO public.employee_bank_details (
        employee_id, bank_name, bank_account_number, account_number, account_holder_name, bank_code,
        branch_code, salary_payment_mode, online_payment_type, online_payment_id
    ) VALUES (
        OLD.id, NEW.bank_name, NEW.bank_account_number, NEW.account_number, NEW.account_holder_name, NEW.bank_code,
        NEW.branch_code, NEW.salary_payment_mode, NEW.online_payment_type, NEW.online_payment_id
    ) ON CONFLICT (employee_id) DO UPDATE SET
        bank_name = EXCLUDED.bank_name,
        bank_account_number = EXCLUDED.bank_account_number,
        account_number = EXCLUDED.account_number,
        account_holder_name = EXCLUDED.account_holder_name,
        bank_code = EXCLUDED.bank_code,
        branch_code = EXCLUDED.branch_code,
        salary_payment_mode = EXCLUDED.salary_payment_mode,
        online_payment_type = EXCLUDED.online_payment_type,
        online_payment_id = EXCLUDED.online_payment_id;

    INSERT INTO public.employee_insurance (
        employee_id, insurance_type, insur_provider, insur_policy_num, insur_policy_start, insur_policy_expiry,
        insur_coverage_amt, insur_premium_amt, insur_payment_freq, emp_covered, deps_covered, num_deps,
        spouse_coverage, children_coverage, parents_coverage
    ) VALUES (
        OLD.id, NEW.insurance_type, NEW.insur_provider, NEW.insur_policy_num, NEW.insur_policy_start, NEW.insur_policy_expiry,
        NEW.insur_coverage_amt, NEW.insur_premium_amt, NEW.insur_payment_freq, NEW.emp_covered, NEW.deps_covered, NEW.num_deps,
        NEW.spouse_coverage, NEW.children_coverage, NEW.parents_coverage
    ) ON CONFLICT (employee_id) DO UPDATE SET
        insurance_type = EXCLUDED.insurance_type,
        insur_provider = EXCLUDED.insur_provider,
        insur_policy_num = EXCLUDED.insur_policy_num,
        insur_policy_start = EXCLUDED.insur_policy_start,
        insur_policy_expiry = EXCLUDED.insur_policy_expiry,
        insur_coverage_amt = EXCLUDED.insur_coverage_amt,
        insur_premium_amt = EXCLUDED.insur_premium_amt,
        insur_payment_freq = EXCLUDED.insur_payment_freq,
        emp_covered = EXCLUDED.emp_covered,
        deps_covered = EXCLUDED.deps_covered,
        num_deps = EXCLUDED.num_deps,
        spouse_coverage = EXCLUDED.spouse_coverage,
        children_coverage = EXCLUDED.children_coverage,
        parents_coverage = EXCLUDED.parents_coverage;

    INSERT INTO public.employee_declarations (
        employee_id, terms_accepted, privacy_consent, emp_declaration, digital_signature
    ) VALUES (
        OLD.id, COALESCE(NEW.terms_accepted, false), COALESCE(NEW.privacy_consent, false), COALESCE(NEW.emp_declaration, false), NEW.digital_signature
    ) ON CONFLICT (employee_id) DO UPDATE SET
        terms_accepted = EXCLUDED.terms_accepted,
        privacy_consent = EXCLUDED.privacy_consent,
        emp_declaration = EXCLUDED.emp_declaration,
        digital_signature = EXCLUDED.digital_signature;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_employees_view_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_leave_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_employee_name VARCHAR;
  v_employee_email VARCHAR;
BEGIN
  -- Fetch the employee's name and email for the approvals table
  SELECT first_name || ' ' || last_name, email 
  INTO v_employee_name, v_employee_email
  FROM employees
  WHERE id = NEW.employee_id;

  -- Insert a corresponding record into the approvals table
  INSERT INTO approvals (
    company_id,
    requester_name,
    requester_email,
    type,
    title,
    description,
    payload,
    status
  ) VALUES (
    NEW.company_id,
    COALESCE(v_employee_name, 'Unknown Employee'),
    COALESCE(v_employee_email, 'unknown@example.com'),
    'Leave',
    'Leave Request: ' || NEW.leave_type,
    'Leave requested from ' || NEW.start_date || ' to ' || NEW.end_date || '. Reason: ' || COALESCE(NEW.reason, 'None'),
    jsonb_build_object(
      'leave_id', NEW.id,
      'leave_type', NEW.leave_type,
      'start_date', NEW.start_date,
      'end_date', NEW.end_date,
      'reason', NEW.reason
    ),
    NEW.status
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_leave_approval"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "site_id" "uuid",
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "status" "text" NOT NULL,
    "location" "text",
    "proof_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "clock_in" "text",
    "clock_out" "text",
    "hours" "text"
)
PARTITION BY RANGE ("date");


ALTER TABLE "public"."attendance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance_y2026m07" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "site_id" "uuid",
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "status" "text" NOT NULL,
    "location" "text",
    "proof_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "clock_in" "text",
    "clock_out" "text",
    "hours" "text"
);


ALTER TABLE "public"."attendance_y2026m07" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance_y2026m08" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "site_id" "uuid",
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "status" "text" NOT NULL,
    "location" "text",
    "proof_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "clock_in" "text",
    "clock_out" "text",
    "hours" "text"
);


ALTER TABLE "public"."attendance_y2026m08" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."claim_policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "department_id" "uuid",
    "category" "text" NOT NULL,
    "monthly_limit" numeric,
    "yearly_limit" numeric,
    "hierarchy_setup" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."claim_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."claims" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "policy_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "claim_date" "date" NOT NULL,
    "status" "text" DEFAULT 'Pending'::"text" NOT NULL,
    "current_approver_id" "uuid",
    "receipt_url" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "super_admin_id" "uuid",
    "company_name" "text" NOT NULL,
    "logo_url" "text",
    "super_admin_name" "text",
    "super_admin_avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "login_email" "text",
    "phone_number" "text",
    "sign_in_method" "text",
    "company_type" "text",
    "branch_location" "text",
    "website" "text",
    "super_admin_designation" "text",
    "sector" "text",
    "corporate_addres" "text"
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_module_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "module" "text" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."company_module_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "shift_start" "text" DEFAULT '09:00'::"text",
    "shift_end" "text" DEFAULT '18:00'::"text",
    "working_days" "text"[] DEFAULT ARRAY['Mon'::"text", 'Tue'::"text", 'Wed'::"text", 'Thu'::"text", 'Fri'::"text"],
    "grace_period_mins" integer DEFAULT 15,
    "auto_overtime" boolean DEFAULT true,
    "require_approval_new_hire" boolean DEFAULT true,
    "single_admin_per_department" boolean DEFAULT true,
    "app_config" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "setup_completed" boolean DEFAULT false,
    "attendance_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "leave_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "overtime_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "claim_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "company_module_settings" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."company_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_sites" (
    "id" "text" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "latitude" numeric,
    "longitude" numeric,
    "radius" integer DEFAULT 200,
    "address" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "site_pass_enabled" boolean DEFAULT true,
    "site_pass_code" "text",
    "dynamic_qr_rotation" boolean DEFAULT true,
    "scanner_permission" "text" DEFAULT 'own_dept_admin'::"text",
    "custom_scanners" "jsonb" DEFAULT '[]'::"jsonb",
    "is_geofencing_enabled" boolean DEFAULT true,
    "is_site_pass_enabled" boolean DEFAULT false
);


ALTER TABLE "public"."company_sites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delegations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "manager_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "status" "text" DEFAULT 'Active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."delegations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "department_name" "text" NOT NULL,
    "description" "text",
    "head_id" "uuid",
    "designations" "jsonb" DEFAULT '[]'::"jsonb",
    "delegation_config" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "dept_id" "text",
    "department_site" "text",
    "created_date" "date",
    "theme_bg" "text",
    "theme_accent" "text",
    "start_time" time without time zone,
    "end_time" time without time zone
);


ALTER TABLE "public"."departments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_bank_details" (
    "employee_id" "uuid" NOT NULL,
    "bank_name" "text",
    "bank_account_number" "text",
    "account_number" "text",
    "account_holder_name" "text",
    "bank_code" "text",
    "branch_code" "text",
    "salary_payment_mode" "text",
    "online_payment_type" "text",
    "online_payment_id" "text"
);


ALTER TABLE "public"."employee_bank_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_certifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "cert_name" "text" NOT NULL,
    "issuing_org" "text",
    "issue_date" "date",
    "expiry_date" "date",
    "certification_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."employee_certifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_contact_details" (
    "employee_id" "uuid" NOT NULL,
    "mobile_code" "text",
    "residential_address" "text",
    "postal_code" "text",
    "current_address" "text",
    "current_postal_code" "text",
    "current_mobile_number" "text",
    "current_email" "text",
    "current_residential_address" "text",
    "native_address" "text",
    "native_postal_code" "text",
    "native_mobile_code" "text",
    "native_mobile_number" "text",
    "native_residential_address" "text",
    "linkedin_url" "text",
    "instagram_url" "text"
);


ALTER TABLE "public"."employee_contact_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_declarations" (
    "employee_id" "uuid" NOT NULL,
    "terms_accepted" boolean DEFAULT false,
    "privacy_consent" boolean DEFAULT false,
    "emp_declaration" boolean DEFAULT false,
    "digital_signature" "text"
);


ALTER TABLE "public"."employee_declarations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "document_name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."employee_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_education" (
    "employee_id" "uuid" NOT NULL,
    "higher_edu_country" "text",
    "higher_edu_institution" "text",
    "higher_edu_course" "text",
    "higher_edu_qualification" "text",
    "higher_edu_grad_year" "text",
    "higher_edu_course_duration" "text",
    "higher_edu_cert_url" "text",
    "schooling_country" "text",
    "schooling_institution" "text",
    "schooling_qualification" "text",
    "schooling_grad_year" "text",
    "schooling_cert_url" "text",
    "certifications" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."employee_education" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_identity_docs" (
    "employee_id" "uuid" NOT NULL,
    "nric_number" "text",
    "fin_number" "text",
    "passport_number" "text",
    "passport_expiry" "date",
    "issuing_country" "text",
    "pass_type" "text",
    "pass_number" "text",
    "pass_issue_date" "date",
    "pass_expiry_date" "date",
    "nric_copy_url" "text",
    "passport_copy_url" "text",
    "pass_copy_url" "text",
    "work_permit_skill" "text"
);


ALTER TABLE "public"."employee_identity_docs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_insurance" (
    "employee_id" "uuid" NOT NULL,
    "insurance_type" "text",
    "insur_provider" "text",
    "insur_policy_num" "text",
    "insur_policy_start" "date",
    "insur_policy_expiry" "date",
    "insur_coverage_amt" numeric,
    "insur_premium_amt" numeric,
    "insur_payment_freq" "text",
    "emp_covered" "text",
    "deps_covered" "text",
    "num_deps" integer,
    "spouse_coverage" "text",
    "children_coverage" "text",
    "parents_coverage" "text"
);


ALTER TABLE "public"."employee_insurance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_personal_details" (
    "employee_id" "uuid" NOT NULL,
    "gender" "text",
    "date_of_birth" "date",
    "marital_status" "text",
    "blood_group" "text",
    "nationality" "text",
    "race" "text",
    "religion" "text",
    "personal_email" "text",
    "personal_number" "text",
    "emergency_contact_name" "text",
    "emergency_contact_number" "text",
    "emergency_contact_relation" "text",
    "emergency_contact_address" "text",
    "emergency_contact_code" "text"
);


ALTER TABLE "public"."employee_personal_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_salary" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "base_salary" numeric NOT NULL,
    "allowance" "jsonb" DEFAULT '{}'::"jsonb",
    "effective_date" "date" NOT NULL,
    "cpf_employee" numeric DEFAULT 0,
    "cdac" numeric DEFAULT 0,
    "sinda" numeric DEFAULT 0,
    "mbmf" numeric DEFAULT 0,
    "ecf" numeric DEFAULT 0,
    "iras" numeric DEFAULT 0,
    "cpf_employer" numeric DEFAULT 0,
    "sdl" numeric DEFAULT 0,
    "foreign_worker_levy" numeric DEFAULT 0,
    "comments" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "cdac_rate" numeric,
    "sinda_rate" numeric,
    "mbmf_rate" numeric,
    "ecf_rate" numeric,
    "iras_rate" numeric,
    "sdl_rate" numeric
);


ALTER TABLE "public"."employee_salary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_work_details" (
    "employee_id" "uuid" NOT NULL,
    "job_type" "text" DEFAULT 'Full Time'::"text",
    "shift_type" "text",
    "overtime_applicable" boolean DEFAULT false,
    "claims_applicable" boolean DEFAULT false
);


ALTER TABLE "public"."employee_work_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fwl_rate_master" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sector" character varying(50) NOT NULL,
    "pass_type" character varying(50) NOT NULL,
    "tier" character varying(20) NOT NULL,
    "skill_level" character varying(20) NOT NULL,
    "ratio_min" numeric(4,3) NOT NULL,
    "ratio_max" numeric(4,3) NOT NULL,
    "monthly_rate" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."fwl_rate_master" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leave_policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "template_name" "text" NOT NULL,
    "leave_configuration" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."leave_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leave_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "leave_type" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "status" "text" DEFAULT 'Pending'::"text" NOT NULL,
    "manager_id" "uuid",
    "reason" "text",
    "attachment_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."leave_requests" OWNER TO "postgres";


ALTER TABLE ONLY "public"."attendance" ATTACH PARTITION "public"."attendance_y2026m07" FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');



ALTER TABLE ONLY "public"."attendance" ATTACH PARTITION "public"."attendance_y2026m08" FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_pkey" PRIMARY KEY ("id", "date");



ALTER TABLE ONLY "public"."attendance_y2026m07"
    ADD CONSTRAINT "attendance_y2026m07_pkey" PRIMARY KEY ("id", "date");



ALTER TABLE ONLY "public"."attendance_y2026m08"
    ADD CONSTRAINT "attendance_y2026m08_pkey" PRIMARY KEY ("id", "date");



ALTER TABLE ONLY "public"."claim_policies"
    ADD CONSTRAINT "claim_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_module_settings"
    ADD CONSTRAINT "company_module_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_module_settings"
    ADD CONSTRAINT "company_module_unique" UNIQUE ("company_id", "module");



ALTER TABLE ONLY "public"."company_settings"
    ADD CONSTRAINT "company_settings_company_id_key" UNIQUE ("company_id");



ALTER TABLE ONLY "public"."company_settings"
    ADD CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_sites"
    ADD CONSTRAINT "company_sites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delegations"
    ADD CONSTRAINT "delegations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "emp_id_unique" UNIQUE ("emp_id");



ALTER TABLE ONLY "public"."employee_bank_details"
    ADD CONSTRAINT "employee_bank_details_pkey" PRIMARY KEY ("employee_id");



ALTER TABLE ONLY "public"."employee_certifications"
    ADD CONSTRAINT "employee_certifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_contact_details"
    ADD CONSTRAINT "employee_contact_details_pkey" PRIMARY KEY ("employee_id");



ALTER TABLE ONLY "public"."employee_declarations"
    ADD CONSTRAINT "employee_declarations_pkey" PRIMARY KEY ("employee_id");



ALTER TABLE ONLY "public"."employee_documents"
    ADD CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_education"
    ADD CONSTRAINT "employee_education_pkey" PRIMARY KEY ("employee_id");



ALTER TABLE ONLY "public"."employee_identity_docs"
    ADD CONSTRAINT "employee_identity_docs_pkey" PRIMARY KEY ("employee_id");



ALTER TABLE ONLY "public"."employee_insurance"
    ADD CONSTRAINT "employee_insurance_pkey" PRIMARY KEY ("employee_id");



ALTER TABLE ONLY "public"."employee_personal_details"
    ADD CONSTRAINT "employee_personal_details_pkey" PRIMARY KEY ("employee_id");



ALTER TABLE ONLY "public"."employee_salary"
    ADD CONSTRAINT "employee_salary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_work_details"
    ADD CONSTRAINT "employee_work_details_pkey" PRIMARY KEY ("employee_id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fwl_rate_master"
    ADD CONSTRAINT "fwl_rate_master_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leave_policies"
    ADD CONSTRAINT "leave_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "unique_department_head_id" UNIQUE ("head_id");



ALTER TABLE ONLY "public"."fwl_rate_master"
    ADD CONSTRAINT "unique_sector_pass_tier_skill" UNIQUE ("sector", "pass_type", "tier", "skill_level");



CREATE INDEX "idx_attendance_employee_date" ON ONLY "public"."attendance" USING "btree" ("employee_id", "date");



CREATE INDEX "attendance_y2026m07_employee_id_date_idx" ON "public"."attendance_y2026m07" USING "btree" ("employee_id", "date");



CREATE INDEX "attendance_y2026m08_employee_id_date_idx" ON "public"."attendance_y2026m08" USING "btree" ("employee_id", "date");



CREATE INDEX "idx_claims_employee" ON "public"."claims" USING "btree" ("employee_id");



CREATE INDEX "idx_company_module_settings_lookup" ON "public"."company_module_settings" USING "btree" ("company_id", "module");



CREATE INDEX "idx_delegations_manager" ON "public"."delegations" USING "btree" ("manager_id");



CREATE INDEX "idx_employee_documents_emp_cat" ON "public"."employee_documents" USING "btree" ("employee_id", "category");



CREATE INDEX "idx_employee_salary_company_id" ON "public"."employee_salary" USING "btree" ("company_id");



CREATE INDEX "idx_employee_salary_employee_id" ON "public"."employee_salary" USING "btree" ("employee_id");



CREATE INDEX "idx_leave_requests_employee" ON "public"."leave_requests" USING "btree" ("employee_id");



CREATE UNIQUE INDEX "unique_admin_per_dept" ON "public"."employees" USING "btree" ("department_id") WHERE ("app_role" = 'Admin'::"text");



ALTER INDEX "public"."idx_attendance_employee_date" ATTACH PARTITION "public"."attendance_y2026m07_employee_id_date_idx";



ALTER INDEX "public"."attendance_pkey" ATTACH PARTITION "public"."attendance_y2026m07_pkey";



ALTER INDEX "public"."idx_attendance_employee_date" ATTACH PARTITION "public"."attendance_y2026m08_employee_id_date_idx";



ALTER INDEX "public"."attendance_pkey" ATTACH PARTITION "public"."attendance_y2026m08_pkey";



CREATE OR REPLACE TRIGGER "trg_auto_assign_admin_dept_head" BEFORE INSERT OR UPDATE ON "public"."departments" FOR EACH ROW EXECUTE FUNCTION "public"."auto_assign_admin_dept_head"();



CREATE OR REPLACE TRIGGER "trg_auto_assign_admin_manager" BEFORE INSERT OR UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."auto_assign_admin_manager"();



CREATE OR REPLACE TRIGGER "trg_auto_assign_department_head_for_employees" BEFORE INSERT OR UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."auto_assign_department_head_for_employees"();



CREATE OR REPLACE TRIGGER "trg_auto_assign_reportees" BEFORE INSERT OR UPDATE OF "department_id" ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."auto_assign_reportees_to_dept_head"();



CREATE OR REPLACE TRIGGER "trg_restrict_super_admin" BEFORE INSERT OR UPDATE OF "app_role" ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."restrict_super_admin_assignment"();



ALTER TABLE "public"."attendance"
    ADD CONSTRAINT "attendance_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE "public"."attendance"
    ADD CONSTRAINT "attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."claim_policies"
    ADD CONSTRAINT "claim_policies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."claim_policies"
    ADD CONSTRAINT "claim_policies_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_current_approver_id_fkey" FOREIGN KEY ("current_approver_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "public"."claim_policies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_super_admin_id_fkey" FOREIGN KEY ("super_admin_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."company_module_settings"
    ADD CONSTRAINT "company_module_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_settings"
    ADD CONSTRAINT "company_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_sites"
    ADD CONSTRAINT "company_sites_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."delegations"
    ADD CONSTRAINT "delegations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."delegations"
    ADD CONSTRAINT "delegations_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_bank_details"
    ADD CONSTRAINT "employee_bank_details_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_certifications"
    ADD CONSTRAINT "employee_certifications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_contact_details"
    ADD CONSTRAINT "employee_contact_details_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_declarations"
    ADD CONSTRAINT "employee_declarations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_documents"
    ADD CONSTRAINT "employee_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_education"
    ADD CONSTRAINT "employee_education_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_identity_docs"
    ADD CONSTRAINT "employee_identity_docs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_insurance"
    ADD CONSTRAINT "employee_insurance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_personal_details"
    ADD CONSTRAINT "employee_personal_details_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_salary"
    ADD CONSTRAINT "employee_salary_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_salary"
    ADD CONSTRAINT "employee_salary_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_work_details"
    ADD CONSTRAINT "employee_work_details_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_department_head_fkey" FOREIGN KEY ("department_head") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_master_department_head_fkey" FOREIGN KEY ("department_head") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_report_attendance_to_fkey" FOREIGN KEY ("report_attendance_to") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_report_claim_to_fkey" FOREIGN KEY ("report_claim_to") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_report_leave_to_fkey" FOREIGN KEY ("report_leave_to") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_reporting_department_id_fkey" FOREIGN KEY ("reporting_department_id") REFERENCES "public"."departments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "fk_employees_department" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leave_policies"
    ADD CONSTRAINT "leave_policies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



CREATE POLICY "Admins and Super Admins can delete company sites" ON "public"."company_sites" FOR DELETE USING ("public"."is_admin_in_company"("company_id"));



CREATE POLICY "Admins and Super Admins can delete employees" ON "public"."employees" FOR DELETE USING ("public"."is_admin_in_company"("company_id"));



CREATE POLICY "Admins and Super Admins can insert company sites" ON "public"."company_sites" FOR INSERT WITH CHECK ("public"."is_admin_in_company"("company_id"));



CREATE POLICY "Admins and Super Admins can insert employees" ON "public"."employees" FOR INSERT WITH CHECK ("public"."is_admin_in_company"("company_id"));



CREATE POLICY "Admins and Super Admins can update company sites" ON "public"."company_sites" FOR UPDATE USING ("public"."is_admin_in_company"("company_id"));



CREATE POLICY "Admins and Super Admins can update employees" ON "public"."employees" FOR UPDATE USING ("public"."is_admin_in_company"("company_id"));



CREATE POLICY "Admins and Super Admins can view all company employees" ON "public"."employees" FOR SELECT USING ("public"."is_admin_in_company"("company_id"));



CREATE POLICY "Admins can manage company attendance" ON "public"."attendance" TO "authenticated" USING (("company_id" IN ( SELECT "employees"."company_id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())))) WITH CHECK (("company_id" IN ( SELECT "employees"."company_id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow admins full access to module settings" ON "public"."company_module_settings" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."user_id" = "auth"."uid"()) AND ("employees"."company_id" = "company_module_settings"."company_id") AND ("employees"."app_role" = ANY (ARRAY['SUPER_ADMIN'::"text", 'ADMIN'::"text"]))))));



CREATE POLICY "Allow authenticated select" ON "public"."fwl_rate_master" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow employees read access to operational settings" ON "public"."company_module_settings" FOR SELECT TO "authenticated" USING (("module" = ANY (ARRAY['leave'::"text", 'claims'::"text", 'overtime'::"text", 'department'::"text"])));



CREATE POLICY "Employees can insert own attendance" ON "public"."attendance" FOR INSERT TO "authenticated" WITH CHECK (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));



CREATE POLICY "Employees can read own record" ON "public"."employees" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("lower"("email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "Employees can update own attendance" ON "public"."attendance" FOR UPDATE TO "authenticated" USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));



CREATE POLICY "Employees can view company sites" ON "public"."company_sites" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE ((("employees"."user_id" = "auth"."uid"()) OR ("employees"."email" = ("auth"."jwt"() ->> 'email'::"text"))) AND ("employees"."company_id" = "company_sites"."company_id")))) OR "public"."is_admin_in_company"("company_id")));



CREATE POLICY "Employees can view own attendance" ON "public"."attendance" FOR SELECT TO "authenticated" USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));



CREATE POLICY "Manage bank details" ON "public"."employee_bank_details" TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM ("public"."employees" "em"
     JOIN "public"."companies" "c" ON (("em"."company_id" = "c"."id")))
  WHERE (("em"."id" = "employee_bank_details"."employee_id") AND (("c"."super_admin_id" = "auth"."uid"()) OR ("em"."user_id" = "auth"."uid"())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."employees" "em"
     JOIN "public"."companies" "c" ON (("em"."company_id" = "c"."id")))
  WHERE (("em"."id" = "employee_bank_details"."employee_id") AND (("c"."super_admin_id" = "auth"."uid"()) OR ("em"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Manage certifications" ON "public"."employee_certifications" TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM ("public"."employees" "em"
     JOIN "public"."companies" "c" ON (("em"."company_id" = "c"."id")))
  WHERE (("em"."id" = "employee_certifications"."employee_id") AND (("c"."super_admin_id" = "auth"."uid"()) OR ("em"."user_id" = "auth"."uid"())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."employees" "em"
     JOIN "public"."companies" "c" ON (("em"."company_id" = "c"."id")))
  WHERE (("em"."id" = "employee_certifications"."employee_id") AND (("c"."super_admin_id" = "auth"."uid"()) OR ("em"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Manage contact details" ON "public"."employee_contact_details" TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM ("public"."employees" "em"
     JOIN "public"."companies" "c" ON (("em"."company_id" = "c"."id")))
  WHERE (("em"."id" = "employee_contact_details"."employee_id") AND (("c"."super_admin_id" = "auth"."uid"()) OR ("em"."user_id" = "auth"."uid"())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."employees" "em"
     JOIN "public"."companies" "c" ON (("em"."company_id" = "c"."id")))
  WHERE (("em"."id" = "employee_contact_details"."employee_id") AND (("c"."super_admin_id" = "auth"."uid"()) OR ("em"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Manage declarations" ON "public"."employee_declarations" TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM ("public"."employees" "em"
     JOIN "public"."companies" "c" ON (("em"."company_id" = "c"."id")))
  WHERE (("em"."id" = "employee_declarations"."employee_id") AND (("c"."super_admin_id" = "auth"."uid"()) OR ("em"."user_id" = "auth"."uid"())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."employees" "em"
     JOIN "public"."companies" "c" ON (("em"."company_id" = "c"."id")))
  WHERE (("em"."id" = "employee_declarations"."employee_id") AND (("c"."super_admin_id" = "auth"."uid"()) OR ("em"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Manage education details" ON "public"."employee_education" TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM ("public"."employees" "em"
     JOIN "public"."companies" "c" ON (("em"."company_id" = "c"."id")))
  WHERE (("em"."id" = "employee_education"."employee_id") AND (("c"."super_admin_id" = "auth"."uid"()) OR ("em"."user_id" = "auth"."uid"())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."employees" "em"
     JOIN "public"."companies" "c" ON (("em"."company_id" = "c"."id")))
  WHERE (("em"."id" = "employee_education"."employee_id") AND (("c"."super_admin_id" = "auth"."uid"()) OR ("em"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Manage identity docs" ON "public"."employee_identity_docs" TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM ("public"."employees" "em"
     JOIN "public"."companies" "c" ON (("em"."company_id" = "c"."id")))
  WHERE (("em"."id" = "employee_identity_docs"."employee_id") AND (("c"."super_admin_id" = "auth"."uid"()) OR ("em"."user_id" = "auth"."uid"())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."employees" "em"
     JOIN "public"."companies" "c" ON (("em"."company_id" = "c"."id")))
  WHERE (("em"."id" = "employee_identity_docs"."employee_id") AND (("c"."super_admin_id" = "auth"."uid"()) OR ("em"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Manage insurance details" ON "public"."employee_insurance" TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM ("public"."employees" "em"
     JOIN "public"."companies" "c" ON (("em"."company_id" = "c"."id")))
  WHERE (("em"."id" = "employee_insurance"."employee_id") AND (("c"."super_admin_id" = "auth"."uid"()) OR ("em"."user_id" = "auth"."uid"())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."employees" "em"
     JOIN "public"."companies" "c" ON (("em"."company_id" = "c"."id")))
  WHERE (("em"."id" = "employee_insurance"."employee_id") AND (("c"."super_admin_id" = "auth"."uid"()) OR ("em"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Manage personal details" ON "public"."employee_personal_details" TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM ("public"."employees" "em"
     JOIN "public"."companies" "c" ON (("em"."company_id" = "c"."id")))
  WHERE (("em"."id" = "employee_personal_details"."employee_id") AND (("c"."super_admin_id" = "auth"."uid"()) OR ("em"."user_id" = "auth"."uid"())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."employees" "em"
     JOIN "public"."companies" "c" ON (("em"."company_id" = "c"."id")))
  WHERE (("em"."id" = "employee_personal_details"."employee_id") AND (("c"."super_admin_id" = "auth"."uid"()) OR ("em"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Manage work details" ON "public"."employee_work_details" TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM ("public"."employees" "em"
     JOIN "public"."companies" "c" ON (("em"."company_id" = "c"."id")))
  WHERE (("em"."id" = "employee_work_details"."employee_id") AND (("c"."super_admin_id" = "auth"."uid"()) OR ("em"."user_id" = "auth"."uid"())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."employees" "em"
     JOIN "public"."companies" "c" ON (("em"."company_id" = "c"."id")))
  WHERE (("em"."id" = "employee_work_details"."employee_id") AND (("c"."super_admin_id" = "auth"."uid"()) OR ("em"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Super admins can manage company_settings" ON "public"."company_settings" USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "company_settings"."company_id") AND ("companies"."super_admin_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "company_settings"."company_id") AND ("companies"."super_admin_id" = "auth"."uid"())))));



CREATE POLICY "Super admins can manage departments" ON "public"."departments" USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "departments"."company_id") AND ("companies"."super_admin_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "departments"."company_id") AND ("companies"."super_admin_id" = "auth"."uid"())))));



CREATE POLICY "Super admins can manage employee_salary" ON "public"."employee_salary" USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "employee_salary"."company_id") AND ("companies"."super_admin_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "employee_salary"."company_id") AND ("companies"."super_admin_id" = "auth"."uid"())))));



CREATE POLICY "Super admins can manage employees" ON "public"."employees" USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "employees"."company_id") AND ("companies"."super_admin_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "employees"."company_id") AND ("companies"."super_admin_id" = "auth"."uid"())))));



CREATE POLICY "Super admins can manage leave_policies" ON "public"."leave_policies" USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "leave_policies"."company_id") AND ("companies"."super_admin_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "leave_policies"."company_id") AND ("companies"."super_admin_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own companies" ON "public"."companies" FOR INSERT WITH CHECK (("auth"."uid"() = "super_admin_id"));



CREATE POLICY "Users can manage their company leave_policies" ON "public"."leave_policies" USING ((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."company_id" = "leave_policies"."company_id") AND ("employees"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."company_id" = "leave_policies"."company_id") AND ("employees"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own companies" ON "public"."companies" FOR UPDATE USING (("auth"."uid"() = "super_admin_id"));



CREATE POLICY "Users can view their own companies" ON "public"."companies" FOR SELECT USING (("auth"."uid"() = "super_admin_id"));



ALTER TABLE "public"."attendance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendance_y2026m07" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendance_y2026m08" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claim_policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_module_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_sites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."delegations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."departments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_bank_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_certifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_contact_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_declarations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_education" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_identity_docs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_insurance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_personal_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_salary" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_work_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fwl_rate_master" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leave_policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leave_requests" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."auto_assign_admin_dept_head"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_assign_admin_dept_head"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_assign_admin_dept_head"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_assign_admin_manager"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_assign_admin_manager"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_assign_admin_manager"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_assign_department_head"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_assign_department_head"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_assign_department_head"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_assign_department_head_for_employees"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_assign_department_head_for_employees"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_assign_department_head_for_employees"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_assign_reportees_to_dept_head"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_assign_reportees_to_dept_head"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_assign_reportees_to_dept_head"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_attendance_partition"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_attendance_partition"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_attendance_partition"() TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_department_employees_for_attendance"("target_dept_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_department_employees_for_attendance"("target_dept_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_department_employees_for_attendance"("target_dept_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_employee_context"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_employee_context"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_employee_context"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_active_company_member"("target_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_active_company_member"("target_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_active_company_member"("target_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_in_company"("target_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_in_company"("target_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_in_company"("target_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."restrict_super_admin_assignment"() TO "anon";
GRANT ALL ON FUNCTION "public"."restrict_super_admin_assignment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."restrict_super_admin_assignment"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_leave_status_from_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_leave_status_from_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_leave_status_from_approval"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_employees_view_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_employees_view_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_employees_view_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_employees_view_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_employees_view_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_employees_view_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_employees_view_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_employees_view_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_employees_view_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_leave_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_leave_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_leave_approval"() TO "service_role";
























GRANT ALL ON TABLE "public"."attendance" TO "anon";
GRANT ALL ON TABLE "public"."attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_y2026m07" TO "anon";
GRANT ALL ON TABLE "public"."attendance_y2026m07" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_y2026m07" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_y2026m08" TO "anon";
GRANT ALL ON TABLE "public"."attendance_y2026m08" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_y2026m08" TO "service_role";



GRANT ALL ON TABLE "public"."claim_policies" TO "anon";
GRANT ALL ON TABLE "public"."claim_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."claim_policies" TO "service_role";



GRANT ALL ON TABLE "public"."claims" TO "anon";
GRANT ALL ON TABLE "public"."claims" TO "authenticated";
GRANT ALL ON TABLE "public"."claims" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."company_module_settings" TO "anon";
GRANT ALL ON TABLE "public"."company_module_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."company_module_settings" TO "service_role";



GRANT ALL ON TABLE "public"."company_settings" TO "anon";
GRANT ALL ON TABLE "public"."company_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."company_settings" TO "service_role";



GRANT ALL ON TABLE "public"."company_sites" TO "anon";
GRANT ALL ON TABLE "public"."company_sites" TO "authenticated";
GRANT ALL ON TABLE "public"."company_sites" TO "service_role";



GRANT ALL ON TABLE "public"."delegations" TO "anon";
GRANT ALL ON TABLE "public"."delegations" TO "authenticated";
GRANT ALL ON TABLE "public"."delegations" TO "service_role";



GRANT ALL ON TABLE "public"."departments" TO "anon";
GRANT ALL ON TABLE "public"."departments" TO "authenticated";
GRANT ALL ON TABLE "public"."departments" TO "service_role";



GRANT ALL ON TABLE "public"."employee_bank_details" TO "anon";
GRANT ALL ON TABLE "public"."employee_bank_details" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_bank_details" TO "service_role";



GRANT ALL ON TABLE "public"."employee_certifications" TO "anon";
GRANT ALL ON TABLE "public"."employee_certifications" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_certifications" TO "service_role";



GRANT ALL ON TABLE "public"."employee_contact_details" TO "anon";
GRANT ALL ON TABLE "public"."employee_contact_details" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_contact_details" TO "service_role";



GRANT ALL ON TABLE "public"."employee_declarations" TO "anon";
GRANT ALL ON TABLE "public"."employee_declarations" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_declarations" TO "service_role";



GRANT ALL ON TABLE "public"."employee_documents" TO "anon";
GRANT ALL ON TABLE "public"."employee_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_documents" TO "service_role";



GRANT ALL ON TABLE "public"."employee_education" TO "anon";
GRANT ALL ON TABLE "public"."employee_education" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_education" TO "service_role";



GRANT ALL ON TABLE "public"."employee_identity_docs" TO "anon";
GRANT ALL ON TABLE "public"."employee_identity_docs" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_identity_docs" TO "service_role";



GRANT ALL ON TABLE "public"."employee_insurance" TO "anon";
GRANT ALL ON TABLE "public"."employee_insurance" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_insurance" TO "service_role";



GRANT ALL ON TABLE "public"."employee_personal_details" TO "anon";
GRANT ALL ON TABLE "public"."employee_personal_details" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_personal_details" TO "service_role";



GRANT ALL ON TABLE "public"."employee_salary" TO "anon";
GRANT ALL ON TABLE "public"."employee_salary" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_salary" TO "service_role";



GRANT ALL ON TABLE "public"."employee_work_details" TO "anon";
GRANT ALL ON TABLE "public"."employee_work_details" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_work_details" TO "service_role";



GRANT ALL ON TABLE "public"."fwl_rate_master" TO "anon";
GRANT ALL ON TABLE "public"."fwl_rate_master" TO "authenticated";
GRANT ALL ON TABLE "public"."fwl_rate_master" TO "service_role";



GRANT ALL ON TABLE "public"."leave_policies" TO "anon";
GRANT ALL ON TABLE "public"."leave_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."leave_policies" TO "service_role";



GRANT ALL ON TABLE "public"."leave_requests" TO "anon";
GRANT ALL ON TABLE "public"."leave_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."leave_requests" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";




































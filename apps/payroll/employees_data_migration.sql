-- ============================================================
-- employees table – DATA MIGRATION (v3)
-- Fixes: NULLIF for text, regex guard for date/numeric/integer
-- casts to safely skip "" and invalid values.
-- Safe to run multiple times (COALESCE won't overwrite existing).
-- Date: 6-6-2025
-- ============================================================

-- Helper macro used throughout:
--   text fields  → NULLIF(value, '')
--   numeric      → CASE WHEN value ~ valid_number THEN value::numeric END
--   date         → CASE WHEN value ~ YYYY-MM-DD   THEN value::date END
--   integer      → CASE WHEN value ~ digits only  THEN value::integer END

UPDATE public.employees
SET
  -- ── Step 1: Personal ──────────────────────────────────────────────────────
  marital_status      = COALESCE(marital_status,  NULLIF(custom_fields->>'maritalStatus',  '')),
  linkedin_url        = COALESCE(linkedin_url,     NULLIF(custom_fields->>'linkedinUrl',    '')),
  instagram_url       = COALESCE(instagram_url,    NULLIF(custom_fields->>'instagramUrl',   '')),

  -- ── Step 2: Identity toggle ───────────────────────────────────────────────
  identity_type       = COALESCE(identity_type,
                          CASE
                            WHEN nric_number IS NOT NULL AND nric_number <> '' THEN 'NRIC'
                            WHEN fin_number  IS NOT NULL AND fin_number  <> '' THEN 'FIN'
                            ELSE NULLIF(custom_fields->>'identityType', '')
                          END),

  -- ── Step 3: Work / Overtime ───────────────────────────────────────────────
  overtime_working_hours = COALESCE(overtime_working_hours,
                            CASE WHEN custom_fields->>'overtimeWorkingHours' ~ '^[0-9]+(\.[0-9]+)?$'
                                 THEN (custom_fields->>'overtimeWorkingHours')::numeric END),
  overtime_period        = COALESCE(overtime_period,
                            NULLIF(custom_fields->>'overtimePeriod', '')),

  -- ── Step 4: Tax Details ───────────────────────────────────────────────────
  monthly_tax_estimate     = COALESCE(monthly_tax_estimate,
                              CASE WHEN custom_fields->>'monthlyTaxEstimate' ~ '^[0-9]+(\.[0-9]+)?$'
                                   THEN (custom_fields->>'monthlyTaxEstimate')::numeric END),
  shg_contribution         = COALESCE(shg_contribution,   NULLIF(custom_fields->>'shgContribution',  '')),
  shg_amount               = COALESCE(shg_amount,
                              CASE WHEN custom_fields->>'shgAmount' ~ '^[0-9]+(\.[0-9]+)?$'
                                   THEN (custom_fields->>'shgAmount')::numeric END),
  foreign_worker_levy      = COALESCE(foreign_worker_levy,
                              CASE WHEN custom_fields->>'foreignWorkerLevy' ~ '^[0-9]+(\.[0-9]+)?$'
                                   THEN (custom_fields->>'foreignWorkerLevy')::numeric END),
  custom_cpf_employee      = COALESCE(custom_cpf_employee,
                              CASE WHEN custom_fields->>'customCpfEmployee' ~ '^[0-9]+(\.[0-9]+)?$'
                                   THEN (custom_fields->>'customCpfEmployee')::numeric END),
  custom_cpf_employee_rate = COALESCE(custom_cpf_employee_rate,
                              CASE WHEN custom_fields->>'customCpfEmployeeRate' ~ '^[0-9]+(\.[0-9]+)?$'
                                   THEN (custom_fields->>'customCpfEmployeeRate')::numeric END),
  custom_cpf_employer      = COALESCE(custom_cpf_employer,
                              CASE WHEN custom_fields->>'customCpfEmployer' ~ '^[0-9]+(\.[0-9]+)?$'
                                   THEN (custom_fields->>'customCpfEmployer')::numeric END),
  custom_cpf_employer_rate = COALESCE(custom_cpf_employer_rate,
                              CASE WHEN custom_fields->>'customCpfEmployerRate' ~ '^[0-9]+(\.[0-9]+)?$'
                                   THEN (custom_fields->>'customCpfEmployerRate')::numeric END),
  custom_sdl               = COALESCE(custom_sdl,
                              CASE WHEN custom_fields->>'customSdl' ~ '^[0-9]+(\.[0-9]+)?$'
                                   THEN (custom_fields->>'customSdl')::numeric END),
  custom_sdl_rate          = COALESCE(custom_sdl_rate,
                              CASE WHEN custom_fields->>'customSdlRate' ~ '^[0-9]+(\.[0-9]+)?$'
                                   THEN (custom_fields->>'customSdlRate')::numeric END),
  custom_cdac_rate         = COALESCE(custom_cdac_rate,
                              CASE WHEN custom_fields->>'customCdacRate' ~ '^[0-9]+(\.[0-9]+)?$'
                                   THEN (custom_fields->>'customCdacRate')::numeric END),
  custom_sinda_rate        = COALESCE(custom_sinda_rate,
                              CASE WHEN custom_fields->>'customSindaRate' ~ '^[0-9]+(\.[0-9]+)?$'
                                   THEN (custom_fields->>'customSindaRate')::numeric END),
  custom_mbmf_rate         = COALESCE(custom_mbmf_rate,
                              CASE WHEN custom_fields->>'customMbmfRate' ~ '^[0-9]+(\.[0-9]+)?$'
                                   THEN (custom_fields->>'customMbmfRate')::numeric END),
  custom_ecf_rate          = COALESCE(custom_ecf_rate,
                              CASE WHEN custom_fields->>'customEcfRate' ~ '^[0-9]+(\.[0-9]+)?$'
                                   THEN (custom_fields->>'customEcfRate')::numeric END),
  custom_income_tax_rate   = COALESCE(custom_income_tax_rate,
                              CASE WHEN custom_fields->>'customIncomeTaxRate' ~ '^[0-9]+(\.[0-9]+)?$'
                                   THEN (custom_fields->>'customIncomeTaxRate')::numeric END),

  -- ── Step 5: Contact (native / home country) ───────────────────────────────
  native_address      = COALESCE(native_address,     NULLIF(custom_fields->>'nativeResidentialAddress', '')),
  native_postal_code  = COALESCE(native_postal_code, NULLIF(custom_fields->>'nativePostalCode',         '')),

  -- ── Step 7: Education ─────────────────────────────────────────────────────
  higher_edu_country         = COALESCE(higher_edu_country,         NULLIF(custom_fields->>'higherEduCountry',       '')),
  higher_edu_inst_name       = COALESCE(higher_edu_inst_name,       NULLIF(custom_fields->>'higherEduInstName',      '')),
  higher_edu_course_name     = COALESCE(higher_edu_course_name,     NULLIF(custom_fields->>'higherEduCourseName',    '')),
  higher_edu_course_duration = COALESCE(higher_edu_course_duration, NULLIF(custom_fields->>'higherEduCourseDuration','')),
  higher_edu_qual            = COALESCE(higher_edu_qual,            NULLIF(custom_fields->>'higherEduQual',          '')),
  higher_edu_grad_year       = COALESCE(higher_edu_grad_year,       NULLIF(custom_fields->>'higherEduGradYear',      '')),
  higher_edu_cert_url        = COALESCE(higher_edu_cert_url,        NULLIF(custom_fields->>'higherEduCertUrl',       '')),
  schooling_country          = COALESCE(schooling_country,          NULLIF(custom_fields->>'schoolingCountry',       '')),
  schooling_inst_name        = COALESCE(schooling_inst_name,        NULLIF(custom_fields->>'schoolingInstName',      '')),
  schooling_qual             = COALESCE(schooling_qual,             NULLIF(custom_fields->>'schoolingQual',          '')),
  schooling_grad_year        = COALESCE(schooling_grad_year,        NULLIF(custom_fields->>'schoolingGradYear',      '')),
  schooling_cert_url         = COALESCE(schooling_cert_url,         NULLIF(custom_fields->>'schoolingCertUrl',       '')),

  -- ── Step 8: Certifications ────────────────────────────────────────────────
  certifications = COALESCE(
    CASE WHEN certifications IS NOT NULL AND jsonb_array_length(certifications) > 0
         THEN certifications ELSE NULL END,
    CASE WHEN custom_fields ? 'certifications'
              AND jsonb_typeof(custom_fields->'certifications') = 'array'
              AND jsonb_array_length(custom_fields->'certifications') > 0
         THEN custom_fields->'certifications'
         ELSE '[]'::jsonb END
  ),

  -- ── Step 9: Medical / Insurance ───────────────────────────────────────────
  blood_group               = COALESCE(blood_group,    NULLIF(custom_fields->>'bloodGroup',    '')),
  insurance_type            = COALESCE(insurance_type, NULLIF(custom_fields->>'insuranceType', '')),
  insurance_provider        = COALESCE(insurance_provider,      NULLIF(custom_fields->>'insurProvider',    '')),
  insurance_policy_number   = COALESCE(insurance_policy_number, NULLIF(custom_fields->>'insurPolicyNum',   '')),
  insurance_payment_freq    = COALESCE(insurance_payment_freq,  NULLIF(custom_fields->>'insurPaymentFreq', '')),

  -- dates: only cast if value looks like YYYY-MM-DD
  insurance_policy_start  = COALESCE(insurance_policy_start,
                             CASE WHEN custom_fields->>'insurPolicyStart' ~ '^\d{4}-\d{2}-\d{2}'
                                  THEN (custom_fields->>'insurPolicyStart')::date END),
  insurance_policy_expiry = COALESCE(insurance_policy_expiry,
                             CASE WHEN custom_fields->>'insurPolicyExpiry' ~ '^\d{4}-\d{2}-\d{2}'
                                  THEN (custom_fields->>'insurPolicyExpiry')::date END),

  insurance_coverage_amount = COALESCE(insurance_coverage_amount,
                               CASE WHEN custom_fields->>'insurCoverageAmt' ~ '^[0-9]+(\.[0-9]+)?$'
                                    THEN (custom_fields->>'insurCoverageAmt')::numeric END),
  insurance_premium_amount  = COALESCE(insurance_premium_amount,
                               CASE WHEN custom_fields->>'insurPremiumAmt' ~ '^[0-9]+(\.[0-9]+)?$'
                                    THEN (custom_fields->>'insurPremiumAmt')::numeric END),
  employee_covered   = COALESCE(employee_covered,   NULLIF(custom_fields->>'empCovered',      '')),
  dependents_covered = COALESCE(dependents_covered, NULLIF(custom_fields->>'depsCovered',     '')),
  num_dependents     = COALESCE(num_dependents,
                        CASE WHEN custom_fields->>'numDeps' ~ '^\d+$'
                             THEN (custom_fields->>'numDeps')::integer END),
  spouse_coverage    = COALESCE(spouse_coverage,    NULLIF(custom_fields->>'spouseCoverage',  '')),
  children_coverage  = COALESCE(children_coverage,  NULLIF(custom_fields->>'childrenCoverage','')),
  parents_coverage   = COALESCE(parents_coverage,   NULLIF(custom_fields->>'parentsCoverage', '')),

  -- ── Step 10: Bank Details ─────────────────────────────────────────────────
  bank_code           = COALESCE(bank_code,           NULLIF(custom_fields->>'bankCode',          '')),
  branch_code         = COALESCE(branch_code,         NULLIF(custom_fields->>'branchCode',        '')),
  salary_payment_mode = COALESCE(salary_payment_mode, NULLIF(custom_fields->>'salaryPaymentMode', '')),
  online_payment_type = COALESCE(online_payment_type, NULLIF(custom_fields->>'onlinePaymentType', '')),
  online_payment_id   = COALESCE(online_payment_id,   NULLIF(custom_fields->>'onlinePaymentId',   ''))

WHERE custom_fields IS NOT NULL
  AND custom_fields <> 'null'::jsonb
  AND custom_fields <> '{}'::jsonb;

-- ── Verification query ────────────────────────────────────────────────────────
SELECT
  COUNT(*) FILTER (WHERE marital_status       IS NOT NULL) AS has_marital_status,
  COUNT(*) FILTER (WHERE identity_type        IS NOT NULL) AS has_identity_type,
  COUNT(*) FILTER (WHERE overtime_period      IS NOT NULL) AS has_overtime_period,
  COUNT(*) FILTER (WHERE monthly_tax_estimate IS NOT NULL) AS has_tax_estimate,
  COUNT(*) FILTER (WHERE insurance_type       IS NOT NULL) AS has_insurance_type,
  COUNT(*) FILTER (WHERE schooling_qual       IS NOT NULL) AS has_schooling,
  COUNT(*) FILTER (WHERE bank_code            IS NOT NULL) AS has_bank_code,
  COUNT(*)                                                 AS total_employees
FROM public.employees;

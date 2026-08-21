# SUPABASE CHECK & UNIQUE CONSTRAINTS

## Principal-Level Data Integrity, Business Rules & Uniqueness Master Skill

**Skill Version:** 1.0
**Database:** PostgreSQL / Supabase
**Level:** Principal Database Architect
**Scope:** `CHECK`, `UNIQUE`, Composite Uniqueness, Partial Unique Indexes, NULL Semantics, Business Rules, Tenant-Scoped Uniqueness, Case-Insensitive Uniqueness, Conditional Constraints, Migration Safety, HRMS/SaaS Integrity

---

# 1. ROLE

You are a **Principal PostgreSQL Data Integrity Architect** specializing in Supabase.

Your responsibility is to ensure that invalid, contradictory, duplicate, or logically impossible data cannot enter the database merely because:

* the frontend validation was bypassed
* an API was called directly
* another service inserted data
* an admin made a mistake
* a migration introduced bad data
* multiple clients raced to create the same record

Your primary objective:

> **The database must enforce business invariants that must always be true.**

Use:

```text
CHECK
UNIQUE
PRIMARY KEY
FOREIGN KEY
NOT NULL
EXCLUSION CONSTRAINTS
```

appropriately.

This skill focuses primarily on:

```text
CHECK
UNIQUE
```

---

# 2. CORE PHILOSOPHY

Never think:

> "The frontend already validates this."

Think:

> "Can invalid data still enter PostgreSQL if the frontend is completely bypassed?"

If yes, determine whether the rule belongs in the database.

Architecture:

```text
Frontend Validation
        ↓
API / Server Validation
        ↓
PostgreSQL Constraints
        ↓
SOURCE OF TRUTH
```

Frontend validation improves UX.

Database constraints protect correctness.

---

# 3. CONSTRAINT PRIORITY

When a rule must always be true, prefer database enforcement.

Examples:

```text
salary >= 0
percentage between 0 and 100
end_date >= start_date
employee_code unique within company
email unique where required
quantity > 0
status belongs to allowed set
```

These should not depend solely on application code.

---

# 4. WHAT IS A CHECK CONSTRAINT?

A `CHECK` constraint verifies that a row satisfies a Boolean condition.

Example:

```sql
check (salary >= 0)
```

If the condition is false:

```text
INSERT / UPDATE
        ↓
PostgreSQL rejects row
```

---

# 5. BASIC CHECK TEMPLATE

```sql
column_name data_type
    check (condition)
```

Example:

```sql
salary numeric(14,2)
    check (salary >= 0)
```

Or table-level:

```sql
constraint employees_salary_non_negative
    check (salary >= 0)
```

---

# 6. COLUMN-LEVEL VS TABLE-LEVEL CHECK

Use column-level CHECK when the rule concerns one column.

Example:

```sql
salary numeric(14,2)
    check (salary >= 0)
```

Use table-level CHECK when the rule compares multiple columns.

Example:

```sql
constraint valid_employment_dates
    check (
        termination_date is null
        or termination_date >= joining_date
    )
```

---

# 7. CHECK CONSTRAINT NAMING

Always name important constraints explicitly.

Use:

```text
ck_<table>_<business_rule>
```

Examples:

```text
ck_employees_salary_non_negative
ck_employees_valid_employment_dates
ck_leave_requests_valid_dates
ck_payroll_items_amount_non_negative
```

Avoid anonymous constraints when maintainability matters.

---

# 8. CHECK: NON-NEGATIVE NUMBERS

Common:

```sql
constraint ck_salary_non_negative
    check (salary >= 0)
```

Use for:

```text
salary
amount
quantity
balance
hours
minutes
tax
allowance
deduction
```

when negative values are invalid.

---

# 9. CHECK: STRICTLY POSITIVE NUMBERS

Use:

```sql
check (quantity > 0)
```

when zero is invalid.

Difference:

```text
>= 0
```

allows zero.

```text
> 0
```

does not.

Do not confuse them.

---

# 10. CHECK: PERCENTAGES

For percentages:

```sql
check (percentage >= 0 and percentage <= 100)
```

Example:

```sql
tax_percentage numeric(5,2)
    check (tax_percentage >= 0 and tax_percentage <= 100)
```

---

# 11. CHECK: RATIO VALUES

If a ratio must be between 0 and 1:

```sql
check (ratio >= 0 and ratio <= 1)
```

Do not mix percentage semantics with ratio semantics.

---

# 12. CHECK: DATES

For:

```text
start_date
end_date
```

use:

```sql
constraint ck_leave_valid_dates
    check (end_date >= start_date)
```

This prevents:

```text
start = 2026-08-20
end   = 2026-08-10
```

---

# 13. CHECK: NULLABLE END DATE

Correct:

```sql
constraint ck_valid_dates
check (
    end_date is null
    or end_date >= start_date
)
```

This allows:

```text
ongoing record
```

while preventing invalid completed records.

---

# 14. CHECK: TIME RANGES

Example:

```sql
constraint ck_valid_shift_time
check (
    end_time > start_time
)
```

But be careful with overnight shifts.

For:

```text
22:00 → 06:00
```

simple comparison fails.

Do not create incorrect constraints merely because the first example works.

Model overnight shifts intentionally.

---

# 15. CHECK: ENUM-LIKE STATUS

Example:

```sql
status text not null default 'active',

constraint ck_employee_status
check (
    status in (
        'active',
        'inactive',
        'terminated'
    )
)
```

This prevents arbitrary values.

---

# 16. CHECK VS ENUM

Use CHECK when:

* values are simple
* values may evolve
* you want migration flexibility
* the domain is local to the table

Use PostgreSQL ENUM when:

* values are stable
* strongly domain-specific
* shared consistently across many tables
* application semantics justify it

Use lookup tables when:

* admins can create values
* values have metadata
* localization is required
* values are tenant-specific
* lifecycle is complex

---

# 17. CHECK: BOOLEAN-LIKE DATA

Do not create:

```text
status = 'yes'
```

when the concept is genuinely Boolean.

Use:

```sql
is_active boolean not null default true
```

Use CHECK for actual domain constraints, not to compensate for poor modeling.

---

# 18. CHECK: CONDITIONAL REQUIRED DATA

Example:

If:

```text
employment_type = 'contract'
```

then:

```text
contract_end_date
```

must exist.

Use:

```sql
constraint ck_contract_end_date
check (
    employment_type <> 'contract'
    or contract_end_date is not null
)
```

This is a powerful pattern.

---

# 19. CONDITIONAL FIELD RULE

Example:

If status is:

```text
terminated
```

then:

```text
terminated_at
```

must exist.

```sql
constraint ck_terminated_requires_date
check (
    status <> 'terminated'
    or terminated_at is not null
)
```

---

# 20. CONDITIONAL NULL RULE

Example:

If:

```text
payment_type = 'bank'
```

then:

```text
bank_account_id
```

must exist.

```sql
constraint ck_bank_payment_requires_account
check (
    payment_type <> 'bank'
    or bank_account_id is not null
)
```

---

# 21. MUTUALLY EXCLUSIVE COLUMNS

If exactly one of two fields must be populated:

```sql
constraint ck_exactly_one_source
check (
    (employee_id is not null)
    <>
    (contractor_id is not null)
)
```

This prevents:

```text
both NULL
```

and:

```text
both populated
```

---

# 22. AT LEAST ONE FIELD REQUIRED

If at least one contact method is required:

```sql
constraint ck_contact_method_required
check (
    email is not null
    or phone is not null
)
```

---

# 23. ALL OR NONE

If fields must appear together:

```sql
constraint ck_bank_details_complete
check (
    (bank_name is null and account_number is null)
    or
    (bank_name is not null and account_number is not null)
)
```

This prevents partially populated logical objects.

---

# 24. CHECK AND EMPTY STRINGS

Important:

```text
NULL
```

and:

```text
''
```

are different.

If blank strings are invalid:

```sql
check (length(trim(first_name)) > 0)
```

Better application normalization may also be used.

Do not assume:

```sql
not null
```

prevents empty strings.

It does not.

---

# 25. CHECK: TRIMMED TEXT

Potential:

```sql
check (name = trim(name))
```

But use cautiously.

Often it is better to normalize data before storage rather than adding unnecessary constraints.

---

# 26. CHECK: TEXT LENGTH

Use only when the length has actual business meaning.

Example:

```sql
check (length(employee_code) between 3 and 20)
```

Do not add arbitrary:

```sql
varchar(255)
```

everywhere without business justification.

---

# 27. CHECK: EMAIL

Do not attempt to build an enormous RFC-complete email parser inside a CHECK constraint.

Database-level validation should generally enforce:

```text
not null
uniqueness where required
basic shape if necessary
```

Application-level validation can handle user-friendly email validation.

---

# 28. CHECK: PHONE

Avoid overly strict country-specific regex unless the application has a clear regional requirement.

Phone numbers are better modeled as:

```text
text
```

with normalization and appropriate application validation.

---

# 29. CHECK: CURRENCY

Example:

```sql
constraint ck_currency_code
check (currency_code ~ '^[A-Z]{3}$')
```

But for serious financial systems, a currency master table may be preferable.

Do not rely on regex alone for semantic validity.

---

# 30. CHECK: JSONB

PostgreSQL can validate JSONB structure with CHECK constraints.

Example:

```sql
check (
    jsonb_typeof(settings) = 'object'
)
```

But do not build your entire relational schema inside JSONB + CHECK.

If fields are core business data, model them relationally.

---

# 31. CHECK NULL SEMANTICS

This is critical.

A PostgreSQL CHECK constraint rejects rows when the expression evaluates to:

```text
FALSE
```

But a CHECK expression evaluating to:

```text
NULL
```

does not violate the constraint.

Therefore:

```sql
check (salary > 0)
```

does NOT necessarily replace:

```sql
salary not null
```

If NULL is invalid:

```sql
salary numeric not null
    check (salary > 0)
```

Use both intentionally.

---

# 32. CHECK + NOT NULL

Think:

```text
NOT NULL
=
value must exist

CHECK
=
value must satisfy rule
```

Example:

```sql
salary numeric(14,2)
    not null
    check (salary >= 0)
```

This means:

```text
salary exists
AND
salary >= 0
```

---

# 33. UNIQUE CONSTRAINT

`UNIQUE` ensures that duplicate values are not allowed according to PostgreSQL uniqueness semantics.

Example:

```sql
employee_code text unique
```

---

# 34. UNIQUE PURPOSE

Use UNIQUE when:

> Two rows must not represent the same business identity within a defined scope.

Examples:

```text
employee_code
company registration number
username
external provider ID
invoice number
```

---

# 35. GLOBAL VS TENANT UNIQUE

This is one of the most important SaaS decisions.

Global:

```sql
unique(email)
```

means:

```text
Company A → user@example.com
Company B → user@example.com
```

is impossible.

Tenant-scoped:

```sql
unique(company_id, employee_code)
```

means:

```text
Company A → EMP001
Company B → EMP001
```

is allowed.

---

# 36. ALWAYS DEFINE UNIQUENESS SCOPE

Before writing UNIQUE ask:

> Unique globally or unique within company/tenant/site/domain?

Never assume global uniqueness.

---

# 37. COMPOSITE UNIQUE

Example:

```sql
constraint uq_employee_code_per_company
unique (company_id, employee_code)
```

This is often correct for SaaS.

---

# 38. COMPOSITE UNIQUE AS BUSINESS IDENTITY

Example:

```text
company_id
employee_code
```

Together identify an employee within a company.

The database enforces:

```text
same company + same employee code
```

cannot appear twice.

---

# 39. UNIQUE VS PRIMARY KEY

Primary key:

```text
one canonical row identity
```

Unique:

```text
another value must also be unique
```

Example:

```sql
id uuid primary key,
employee_code text unique
```

The employee has:

```text
technical identity = id
business identity = employee_code
```

---

# 40. MULTIPLE UNIQUE CONSTRAINTS

A table can have multiple unique constraints.

Example:

```sql
id uuid primary key,

constraint uq_company_employee_code
    unique(company_id, employee_code),

constraint uq_company_email
    unique(company_id, email)
```

Use only when each represents a real business rule.

---

# 41. UNIQUE NULL SEMANTICS

PostgreSQL normally allows multiple NULL values in a UNIQUE constraint.

Example:

```text
email unique
```

can allow:

```text
NULL
NULL
NULL
```

because NULL represents unknown/non-comparable values under standard unique semantics.

Therefore:

```text
UNIQUE
```

does not mean:

```text
NOT NULL + unique
```

If required:

```sql
email text not null unique
```

---

# 42. OPTIONAL UNIQUE VALUES

If optional values may repeat NULL:

```sql
external_id text unique
```

can be appropriate.

Example:

```text
Employee A → external_id = NULL
Employee B → external_id = NULL
```

Both are allowed.

But:

```text
EXT001
EXT001
```

is rejected.

---

# 43. NULLS NOT DISTINCT

PostgreSQL supports advanced unique semantics where NULL values can be treated as duplicates.

Example:

```sql
unique nulls not distinct (company_id, external_code)
```

Use this only when the business rule explicitly requires:

> Only one NULL combination may exist.

Do not use automatically.

---

# 44. CASE-INSENSITIVE UNIQUENESS

Potential problem:

```text
John@Example.com
john@example.com
```

A normal text UNIQUE constraint may treat these as different.

If business semantics require case-insensitive uniqueness, consider:

```text
citext
```

or a normalized/functional unique index.

---

# 45. NORMALIZED EMAIL

Possible strategy:

```text
email_normalized
```

stored in lowercase.

Then:

```sql
unique(company_id, email_normalized)
```

This makes the business rule explicit.

---

# 46. FUNCTIONAL UNIQUE INDEX

Example:

```sql
create unique index uq_users_email_lower
on public.users (lower(email));
```

This can enforce case-insensitive uniqueness without storing another column.

Use carefully with the application's normalization semantics.

---

# 47. UNIQUE INDEX VS UNIQUE CONSTRAINT

Both enforce uniqueness, but conceptually:

```text
UNIQUE constraint
=
business/data integrity rule
```

while:

```text
unique index
=
index-based enforcement, especially useful for expressions/conditions
```

Prefer a UNIQUE constraint when expressing straightforward business uniqueness.

Use unique indexes for advanced cases.

---

# 48. PARTIAL UNIQUE INDEX

Extremely important.

Use when uniqueness applies only to certain rows.

Example:

```text
Only active employees must have unique employee codes.
```

Use:

```sql
create unique index uq_active_employee_code
on public.employees(company_id, employee_code)
where deleted_at is null;
```

---

# 49. SOFT DELETE + UNIQUE

Without a partial index:

```text
EMP001
```

cannot be reused after:

```text
deleted_at != null
```

if a normal unique constraint remains.

With:

```sql
where deleted_at is null
```

the uniqueness applies only to active rows.

---

# 50. SOFT DELETE STRATEGY

For:

```text
companies
employees
departments
locations
```

consider:

```text
deleted_at
```

plus:

```text
partial unique index
```

when business identifiers may be reused.

---

# 51. UNIQUE + STATUS

Do not create:

```sql
unique(company_id, status)
```

unless the business actually requires only one row per status.

For conditional uniqueness:

```sql
create unique index ...
where status = 'active';
```

Example:

> A company can have only one active payroll run.

```sql
create unique index uq_company_active_payroll_run
on public.payroll_runs(company_id)
where status = 'processing';
```

---

# 52. CONDITIONAL UNIQUENESS

Pattern:

```sql
create unique index <name>
on <table>(columns)
where <condition>;
```

Excellent for:

```text
one active record
one default configuration
one primary address
one current salary
one active subscription
one active payroll run
```

---

# 53. ONE DEFAULT RECORD

Example:

```text
A company can have only one default location.
```

Use:

```sql
create unique index uq_company_default_location
on public.locations(company_id)
where is_default = true
  and deleted_at is null;
```

---

# 54. ONE PRIMARY RECORD

Example:

```text
Employee can have only one primary bank account.
```

Use:

```sql
create unique index uq_employee_primary_bank
on public.employee_bank_accounts(employee_id)
where is_primary = true
  and deleted_at is null;
```

---

# 55. ONE ACTIVE SALARY

Example:

```sql
create unique index uq_employee_active_salary
on public.employee_salary_history(employee_id)
where effective_to is null;
```

This enforces:

> Only one current salary record exists.

---

# 56. ONE ACTIVE MEMBERSHIP

Example:

```sql
create unique index uq_active_company_membership
on public.company_members(user_id, company_id)
where status = 'active';
```

Only if the business model permits multiple historical membership rows.

---

# 57. UNIQUE FOR EXTERNAL IDS

When integrating with:

```text
Stripe
WhatsApp
Slack
Google
government systems
payment gateways
```

external IDs should usually have a uniqueness rule.

Example:

```sql
unique(provider, external_id)
```

rather than:

```sql
unique(external_id)
```

if the same external identifier could exist across providers.

---

# 58. IDEMPOTENCY

Unique constraints are powerful for preventing duplicate operations.

Example:

```text
provider
external_event_id
```

with:

```sql
unique(provider, external_event_id)
```

This prevents the same webhook/event from being processed as a duplicate database record.

---

# 59. IDEMPOTENCY PATTERN

For webhook events:

```sql
constraint uq_webhook_event
unique(provider, external_event_id)
```

Application:

```text
receive event
    ↓
insert
    ↓
duplicate?
    ↓
UNIQUE violation / conflict
```

This is much safer than:

```text
SELECT first
then INSERT
```

because concurrent requests can race.

---

# 60. UPSERT

Unique constraints pair naturally with:

```sql
insert ...
on conflict (...)
do update ...
```

or:

```sql
on conflict (...)
do nothing;
```

Use the actual business uniqueness key.

---

# 61. CONCURRENCY

Never assume application-level:

```text
check if exists
→ insert
```

is enough.

Two requests can both observe:

```text
doesn't exist
```

and then both insert.

A database UNIQUE constraint closes this race.

---

# 62. UNIQUE = CONCURRENCY SAFETY

Use database uniqueness for race-sensitive invariants.

Examples:

```text
unique employee code
unique external event
unique active subscription
unique active configuration
```

---

# 63. UNIQUE + MULTI-TENANCY

Typical:

```sql
unique(company_id, employee_code)
```

rather than:

```sql
unique(employee_code)
```

when employee codes are company-local.

---

# 64. SITE-SCOPED UNIQUENESS

Sometimes uniqueness belongs to a site/location.

Example:

```text
company
site
employee_code
```

Then:

```sql
unique(company_id, site_id, employee_code)
```

may be appropriate.

Do not automatically assume company-level uniqueness.

---

# 65. DEPARTMENT-SCOPED UNIQUENESS

Example:

```text
job title
```

could be:

```sql
unique(company_id, name)
```

or:

```sql
unique(company_id, department_id, name)
```

depending on business semantics.

The UI should not decide this.

The business model does.

---

# 66. UNIQUE + FOREIGN KEY

A UNIQUE constraint can enforce one-to-one relationships.

Example:

```sql
user_id uuid unique
references auth.users(id)
```

This means one application profile per Auth user.

---

# 67. ONE-TO-ONE RELATIONSHIP

Example:

```text
companies
    ↓
company_settings
```

If exactly one settings row per company:

```sql
company_id uuid not null unique
references companies(id)
```

This creates a one-to-one relationship.

---

# 68. ONE-TO-MANY RELATIONSHIP

Example:

```text
company
 ↓
employees
```

Do NOT put:

```sql
unique(company_id)
```

because that would allow only one employee per company.

Use:

```sql
company_id uuid not null
references companies(id)
```

without UNIQUE.

---

# 69. UNIQUE DESIGN MISTAKE

Bad:

```sql
create table employees (
    id uuid primary key,
    company_id uuid unique
);
```

This accidentally creates:

```text
1 company → 1 employee
```

instead of:

```text
1 company → many employees
```

Always verify cardinality before adding UNIQUE.

---

# 70. COMPOSITE UNIQUE NULL BEHAVIOR

For:

```sql
unique(company_id, employee_code)
```

if `employee_code` is nullable, multiple rows may still exist with NULL.

If the code is mandatory:

```sql
employee_code text not null
```

Do not depend on UNIQUE to enforce presence.

---

# 71. UNIQUE AND EMPTY STRINGS

UNIQUE considers:

```text
''
```

as a real value.

Therefore:

```text
'' 
```

can only occur once under uniqueness.

If empty string should mean "not provided", normalize it to:

```text
NULL
```

or enforce a CHECK.

---

# 72. NORMALIZATION BEFORE UNIQUE

For identifiers:

```text
employee_code
tax_id
external_id
email
```

determine normalization rules.

Examples:

```text
uppercase
lowercase
trim whitespace
remove formatting
country normalization
```

Then enforce uniqueness on the canonical representation.

---

# 73. BUSINESS CODE NORMALIZATION

If:

```text
emp001
EMP001
Emp001
```

must be considered identical:

Store normalized:

```text
EMP001
```

or use an appropriate functional index.

Do not rely on UI formatting.

---

# 74. UNIQUE + GENERATED CODES

If employee codes are generated:

```text
EMP-000001
```

do not assume application-generated values are race-safe.

Use database uniqueness.

The generation mechanism should also handle concurrency.

---

# 75. UNIQUE + SEQUENCES

If sequential identifiers are needed:

```text
invoice_number
receipt_number
payroll_run_number
```

design sequence/concurrency carefully.

Do not use:

```text
select max(invoice_number) + 1
```

This is race-prone.

---

# 76. CHECK FOR FINANCIAL DATA

Financial amounts:

```sql
amount numeric(14,2)
    not null
    check (amount >= 0)
```

For deductions, negative semantics may instead be intentional.

Do not blindly enforce non-negative values if the domain uses signed amounts.

---

# 77. SIGNED VS UNSIGNED MONEY

PostgreSQL does not have unsigned numeric types like some systems.

Decide explicitly:

```text
amount >= 0
```

or:

```text
amount may be negative
```

based on business meaning.

---

# 78. PAYROLL CHECK EXAMPLES

Potential constraints:

```sql
check (gross_salary >= 0)

check (total_deductions >= 0)

check (net_salary = gross_salary - total_deductions)

check (working_days >= 0)

check (paid_days >= 0)

check (paid_days <= working_days)
```

But avoid redundant derived-value constraints if those values can legitimately differ due to domain logic.

Always verify the actual payroll model first.

---

# 79. ATTENDANCE CHECK EXAMPLES

Potential:

```sql
check (worked_minutes >= 0)

check (overtime_minutes >= 0)

check (late_minutes >= 0)
```

For timestamps:

```sql
check (
    check_out_at is null
    or check_out_at >= check_in_at
)
```

---

# 80. LEAVE CHECK EXAMPLES

Potential:

```sql
check (requested_days > 0)
```

and:

```sql
check (
    end_date >= start_date
)
```

Do not blindly enforce:

```text
requested_days = end_date - start_date + 1
```

if weekends, holidays, half-days, or custom calendars affect calculation.

---

# 81. WORK PASS CHECK

Example:

```sql
check (
    expiry_date is null
    or expiry_date >= issue_date
)
```

This protects temporal consistency.

---

# 82. AGE / DOB CHECK

Avoid hardcoding business assumptions such as:

```sql
check (date_of_birth <= current_date - interval '18 years')
```

because `CHECK` constraints should generally not depend on volatile/current values in ways that can become inconsistent over time.

Use appropriate application/domain validation for dynamic temporal rules.

---

# 83. CHECK CONSTRAINTS SHOULD BE STABLE

Prefer constraints representing invariants:

```text
salary >= 0
end_date >= start_date
percentage between 0 and 100
```

Avoid rules whose truth changes merely because time passes.

---

# 84. CROSS-ROW RULES

A CHECK constraint operates on the current row.

It should not be used to enforce:

> "Only one active employee per company."

That is a cross-row rule.

Use:

```text
UNIQUE
partial unique index
```

instead.

---

# 85. CHECK VS UNIQUE

Use:

### CHECK

For:

```text
"This row is internally valid."
```

Examples:

```text
salary >= 0
end >= start
percentage 0–100
```

### UNIQUE

For:

```text
"No two rows may conflict with this identity rule."
```

Examples:

```text
employee_code
company + employee_code
one active primary bank account
```

---

# 86. CHECK VS FOREIGN KEY

Use:

### CHECK

For:

```text
value must satisfy a condition
```

Use:

### FOREIGN KEY

For:

```text
value must reference an existing entity
```

Bad:

```text
check (department_id is not null)
```

when the real requirement is:

```text
department_id must reference departments.id
```

Use both when appropriate.

---

# 87. CHECK VS TRIGGER

Prefer CHECK for simple row-level invariants.

Use triggers/functions when:

```text
cross-row logic
complex derived behavior
audit behavior
external side effects
```

are involved.

Do not use a trigger for:

```text
salary >= 0
```

A CHECK is clearer.

---

# 88. UNIQUE VS TRIGGER

Do not implement simple uniqueness using a trigger.

Bad pattern:

```text
trigger:
select count(...)
if exists then raise exception
```

This is vulnerable to concurrency problems if not carefully designed.

Use:

```sql
unique(...)
```

The database already has the correct concurrency machinery.

---

# 89. EXCLUSION CONSTRAINTS

When the requirement is:

> "These ranges must not overlap."

A UNIQUE constraint may not be enough.

PostgreSQL exclusion constraints can be appropriate.

Examples:

```text
employee shift overlap
room booking
leave date overlap
resource reservation
```

This skill should recognize when CHECK/UNIQUE is not the correct tool.

---

# 90. DATE RANGE OVERLAP

Example conceptual rule:

```text
An employee cannot have overlapping active assignments.
```

Potential solution:

```text
EXCLUDE USING gist
```

rather than trying to force this into CHECK.

---

# 91. CONSTRAINT SELECTION MATRIX

Use:

```text
NOT NULL
→ value must exist

CHECK
→ row must satisfy condition

UNIQUE
→ duplicate business identity prohibited

PRIMARY KEY
→ canonical row identity

FOREIGN KEY
→ referenced entity must exist

EXCLUSION
→ conflicting ranges/values prohibited
```

---

# 92. CONSTRAINT COMPOSITION

Strong schemas combine constraints.

Example:

```sql
employee_code text
    not null,

company_id uuid
    not null,

constraint uq_employee_code
    unique(company_id, employee_code),

constraint ck_employee_code_length
    check (length(employee_code) between 3 and 20)
```

Each constraint protects a different invariant.

---

# 93. CONSTRAINT ORDER OF THINKING

For every column ask:

```text
1. Can it be NULL?
2. What type should it be?
3. What values are valid?
4. Does it need uniqueness?
5. Is uniqueness global or scoped?
6. Does it reference another entity?
7. Does it participate in a cross-column rule?
8. Does it require historical behavior?
```

---

# 94. CONSTRAINT NAMING STANDARD

Use:

```text
pk_<table>
fk_<child>_<parent>
uq_<table>_<business_rule>
ck_<table>_<business_rule>
```

Examples:

```text
pk_employees
fk_employees_company
uq_employees_company_code
ck_employees_salary_non_negative
ck_leave_requests_valid_dates
```

---

# 95. MIGRATION: ADD CHECK

When adding CHECK to existing data:

First identify violations.

Example:

```sql
select *
from employees
where salary < 0;
```

Fix data first.

Then:

```sql
alter table employees
add constraint ck_employees_salary_non_negative
check (salary >= 0);
```

Never add a constraint blindly to dirty production data.

---

# 96. MIGRATION: ADD UNIQUE

Before adding UNIQUE:

```sql
select
    company_id,
    employee_code,
    count(*)
from employees
group by company_id, employee_code
having count(*) > 1;
```

Resolve duplicates.

Then create:

```sql
alter table employees
add constraint uq_employees_company_code
unique(company_id, employee_code);
```

---

# 97. LARGE TABLE MIGRATIONS

For large production tables, evaluate online/low-lock strategies.

For unique indexes, PostgreSQL supports:

```sql
create unique index concurrently ...
```

when appropriate.

Then, if needed, attach the index to a constraint.

Do not blindly run heavyweight schema changes during peak traffic.

---

# 98. NOT VALID CHECK

For staged validation of large existing tables, PostgreSQL can support:

```sql
add constraint ... check (...) not valid;
```

Then:

```sql
validate constraint ...
```

Use this when deployment constraints justify it.

---

# 99. DUPLICATE DATA REVIEW

When UNIQUE is requested, inspect:

```text
existing duplicates
NULL behavior
case sensitivity
whitespace
tenant scope
soft-deleted rows
historical rows
status
external providers
```

before selecting the final implementation.

---

# 100. SOFT DELETE + UNIQUE REVIEW

Always ask:

```text
Should archived/deleted records participate in uniqueness?
```

If:

```text
NO
```

consider:

```sql
where deleted_at is null
```

partial unique index.

If:

```text
YES
```

normal UNIQUE may be appropriate.

---

# 101. STATUS + UNIQUE REVIEW

Ask:

```text
Does uniqueness apply to all records or only active records?
```

Example:

```text
historical salary rows
```

may have duplicate values across time.

But only one current salary should exist.

Therefore:

```sql
create unique index ...
where effective_to is null;
```

---

# 102. TENANT + SOFT DELETE

For SaaS:

```sql
create unique index uq_active_employee_code
on employees(company_id, employee_code)
where deleted_at is null;
```

This is a common high-quality pattern.

---

# 103. MULTI-TENANT DATA INTEGRITY

Every UNIQUE constraint should be reviewed for tenant scope.

Ask:

```text
Is this:
global?
company-wide?
site-wide?
department-wide?
user-wide?
```

Never add:

```sql
unique(name)
```

to a tenant table without determining the intended scope.

---

# 104. GLOBAL MASTER DATA

For global tables:

```text
countries
currencies
work_pass_types
```

global uniqueness may be correct:

```sql
unique(code)
```

For company tables:

```text
departments
job_titles
employee_codes
```

tenant-scoped uniqueness is often appropriate:

```sql
unique(company_id, code)
```

---

# 105. HUMAN-READABLE NAMES

Do not assume names must be unique.

Example:

```text
"Engineering"
```

could legitimately appear multiple times depending on domain.

Before:

```sql
unique(name)
```

ask:

> Is this a business identifier or merely a display label?

---

# 106. DISPLAY LABEL VS IDENTITY

Usually:

```text
name
```

is not necessarily unique.

Whereas:

```text
employee_code
invoice_number
external_id
```

often represents identity.

Do not over-constrain names.

---

# 107. DUPLICATE BUSINESS RECORDS

UNIQUE should represent meaningful identity, not prevent all duplicates.

Example:

Two employees can legitimately have:

```text
first_name = "Arun"
last_name = "Kumar"
```

Do NOT:

```sql
unique(first_name, last_name)
```

unless the business explicitly requires it.

---

# 108. NATURAL KEY ANALYSIS

Before adding UNIQUE, determine whether the field is:

```text
stable
canonical
business-defined
unique by policy
```

If not, it may not be an appropriate unique identifier.

---

# 109. EXTERNAL PROVIDER UNIQUENESS

For integrations:

```sql
unique(provider, external_id)
```

is often superior to:

```sql
unique(external_id)
```

because:

```text
Stripe → cus_123
Another provider → cus_123
```

may both be valid.

---

# 110. CONSTRAINT ERROR HANDLING

Application code should distinguish:

```text
unique violation
check violation
foreign key violation
not-null violation
```

Do not show users:

```text
"Database error."
```

Instead map known constraint failures to meaningful UI messages.

---

# 111. CONSTRAINT ERROR NAMES

Explicit constraint names help applications identify errors.

Example:

```text
uq_employees_company_code
```

can map to:

```text
"Employee code already exists in this company."
```

This is far better than parsing arbitrary SQL text.

---

# 112. API ERROR DESIGN

Database:

```text
uq_employees_company_code
```

Backend:

```text
EMPLOYEE_CODE_ALREADY_EXISTS
```

Frontend:

```text
Employee code is already in use.
```

Separate:

```text
database implementation
business error
UI message
```

---

# 113. CONSTRAINTS AND UX

Database constraints should not replace friendly frontend validation.

Ideal:

```text
Frontend
→ immediate feedback

Database
→ final enforcement
```

Both should exist.

---

# 114. CONSTRAINTS AND SECURITY

Constraints improve integrity but are not authorization.

For example:

```sql
unique(company_id, employee_code)
```

does not stop a user from attempting to modify another company's employee.

RLS must enforce tenant authorization.

---

# 115. CONSTRAINTS AND RLS

When designing constraints with RLS, remember:

```text
constraint validation
```

and:

```text
row visibility
```

are different concepts.

Do not assume RLS-visible rows represent the entire database.

---

# 116. CONSTRAINT REVIEW FOR HRMS

For an HRMS, review at minimum:

### Employees

```text
employee_code
salary
dates
status
```

### Attendance

```text
timestamps
minutes
hours
status
```

### Leave

```text
dates
requested_days
status
```

### Payroll

```text
amounts
periods
status
duplicate payroll runs
```

### Bank Accounts

```text
account identity
primary account
```

### Documents

```text
document type
external/storage identity
```

---

# 117. HRMS CHECK EXAMPLES

Potential:

```sql
constraint ck_employees_salary
check (monthly_salary >= 0)
```

```sql
constraint ck_employees_dates
check (
    termination_date is null
    or termination_date >= joining_date
)
```

```sql
constraint ck_leave_dates
check (end_date >= start_date)
```

```sql
constraint ck_leave_days
check (requested_days > 0)
```

---

# 118. HRMS UNIQUE EXAMPLES

Potential:

```sql
unique(company_id, employee_code)
```

```sql
unique(company_id, department_code)
```

```sql
unique(provider, external_id)
```

Potential partial:

```sql
create unique index uq_primary_bank
on employee_bank_accounts(employee_id)
where is_primary = true
and deleted_at is null;
```

---

# 119. PAYROLL UNIQUE EXAMPLE

If one payroll run per company and period is allowed:

```sql
unique(company_id, payroll_period_start, payroll_period_end)
```

But if multiple runs/re-runs are allowed:

```text
do not use this blindly
```

Model:

```text
run_number
status
version
```

according to actual payroll workflow.

---

# 120. PAYROLL CHECK EXAMPLE

Potential:

```sql
check (gross_salary >= 0)
```

```sql
check (total_deductions >= 0)
```

But:

```sql
check (net_salary = gross_salary - total_deductions)
```

should only be used if the business model guarantees that exact arithmetic relationship.

Avoid constraints that accidentally reject legitimate adjustments.

---

# 121. ATTENDANCE UNIQUE EXAMPLE

If one daily summary per employee/day:

```sql
unique(employee_id, attendance_date)
```

This prevents duplicate daily records.

But if split shifts are supported:

```text
employee + date
```

may NOT be sufficient.

The correct identity might involve:

```text
employee
date
shift
site
```

Always understand the business model first.

---

# 122. LEAVE UNIQUE EXAMPLE

Do not automatically use:

```sql
unique(employee_id, start_date, end_date)
```

because different leave requests may legitimately overlap or be modified depending on workflow.

If overlapping leave is forbidden, an exclusion constraint may be more appropriate.

---

# 123. CURRENT RECORD UNIQUENESS

For a table containing historical versions:

```text
employee_salary_history
```

do not make:

```text
unique(employee_id)
```

because history requires multiple rows.

Instead enforce only one active record:

```sql
create unique index uq_current_salary
on employee_salary_history(employee_id)
where effective_to is null;
```

---

# 124. CONSTRAINTS FOR CONFIGURATION

Example:

```text
company_module_settings
```

If only one settings row per module/company:

```sql
unique(company_id, module)
```

This is a perfect use of composite UNIQUE.

---

# 125. SETTINGS CHECK

Possible:

```sql
check (jsonb_typeof(settings) = 'object')
```

and:

```sql
module text not null
```

But dynamic setting contents may require application validation or carefully designed JSON schema logic.

---

# 126. JSONB UNIQUENESS

Avoid trying to make arbitrary JSONB structures unique unless the business requirement is explicit.

Prefer extracting identity fields:

```text
provider
external_id
```

into relational columns.

Then use:

```sql
unique(provider, external_id)
```

---

# 127. GENERATED COLUMNS

When normalized uniqueness requires a derived representation, a generated column may sometimes be useful.

Example conceptual:

```text
normalized_code
```

Then:

```sql
unique(company_id, normalized_code)
```

Use when the derived representation is stable and deterministic.

---

# 128. CONSTRAINTS VS GENERATED VALUES

Do not use CHECK to transform data.

CHECK validates.

It does not normalize.

Use:

```text
application normalization
generated column
trigger
```

where appropriate.

---

# 129. CHECK SHOULD BE READABLE

Bad:

```sql
check (
    (x >= 0 and x <= 100)
    and
    (y is null or y >= x)
    and
    (...)
)
```

when it becomes impossible to understand.

Prefer multiple named constraints:

```text
ck_x_percentage
ck_y_not_less_than_x
```

One business rule per constraint when practical.

---

# 130. MULTIPLE CHECK CONSTRAINTS

Prefer:

```sql
constraint ck_salary_non_negative
    check (salary >= 0),

constraint ck_bonus_non_negative
    check (bonus >= 0),

constraint ck_total_non_negative
    check (total >= 0)
```

rather than one giant CHECK.

This improves:

* readability
* debugging
* migrations
* error identification

---

# 131. CONSTRAINT COMPOSITION

A strong schema might contain:

```sql
id uuid primary key,

company_id uuid not null,

employee_code text not null,

salary numeric(14,2) not null
    check (salary >= 0),

status text not null,

constraint uq_employee_code
    unique(company_id, employee_code),

constraint ck_employee_status
    check (status in ('active', 'inactive', 'terminated'))
```

Each rule has a distinct responsibility.

---

# 132. ANTI-PATTERN: APPLICATION-ONLY VALIDATION

Bad architecture:

```text
Frontend:
salary >= 0

Database:
nothing
```

Correct:

```text
Frontend:
salary >= 0

Database:
CHECK salary >= 0
```

---

# 133. ANTI-PATTERN: TRIGGER FOR SIMPLE CHECK

Bad:

```text
trigger checks salary
```

Better:

```sql
check (salary >= 0)
```

Use the simplest PostgreSQL mechanism that correctly expresses the invariant.

---

# 134. ANTI-PATTERN: SELECT BEFORE INSERT

Bad:

```text
SELECT employee_code
WHERE company_id = ...
```

then:

```text
INSERT
```

Better:

```sql
unique(company_id, employee_code)
```

and handle the conflict.

---

# 135. ANTI-PATTERN: GLOBAL UNIQUE BY DEFAULT

Bad:

```sql
unique(employee_code)
```

when employee codes are tenant-local.

Better:

```sql
unique(company_id, employee_code)
```

---

# 136. ANTI-PATTERN: UNIQUE ON DISPLAY NAMES

Bad:

```sql
unique(first_name, last_name)
```

unless explicitly required.

Names are not necessarily identifiers.

---

# 137. ANTI-PATTERN: CHECK AS FK

Bad:

```sql
check (department_id is not null)
```

This does not verify department existence.

Correct:

```text
NOT NULL
+
FOREIGN KEY
```

---

# 138. ANTI-PATTERN: CHECK AS CROSS-ROW RULE

Bad:

```text
CHECK:
"Only one active employee can have this role."
```

CHECK cannot reliably enforce cross-row uniqueness.

Use:

```text
UNIQUE
partial unique index
exclusion constraint
```

depending on the rule.

---

# 139. ANTI-PATTERN: GIANT CHECK

Avoid a 200-line CHECK constraint.

Split business rules.

Database schema should be understandable by another engineer six months later.

---

# 140. CONSTRAINT TESTING

For every CHECK:

Test:

```text
valid minimum
valid maximum
invalid below minimum
invalid above maximum
NULL
empty string where applicable
boundary dates
```

For every UNIQUE:

Test:

```text
first insert
duplicate insert
different tenant
NULL
soft-deleted row
case differences
whitespace differences
concurrent insert
```

---

# 141. CONSTRAINT TEST MATRIX

Example:

```text
employee_code
```

Test:

```text
Company A + EMP001 → PASS
Company A + EMP001 → FAIL
Company B + EMP001 → PASS
Company A + EMP002 → PASS
NULL → FAIL if NOT NULL
```

This confirms the uniqueness scope.

---

# 142. MIGRATION VALIDATION

Before production deployment:

```text
[ ] Existing CHECK violations identified
[ ] Existing duplicate UNIQUE values identified
[ ] NULL behavior verified
[ ] Tenant scope verified
[ ] Soft-delete behavior verified
[ ] Case sensitivity verified
[ ] Constraint names verified
[ ] Application error handling updated
[ ] Migration locking impact reviewed
```

---

# 143. DATABASE DESIGN REVIEW

When the user provides a table design, analyze:

```text
1. Missing CHECK constraints
2. Missing UNIQUE constraints
3. Incorrect CHECK constraints
4. Incorrect UNIQUE scope
5. Duplicate business rules
6. Constraints better represented by FK
7. Constraints better represented by exclusion
8. Cross-row rules incorrectly implemented
9. NULL semantics
10. Soft-delete interactions
11. Multi-tenant uniqueness
12. Historical data
13. Concurrency
14. Migration risk
```

---

# 144. RESPONSE FORMAT FOR SQL REVIEW

When reviewing constraints, output:

```text
## Critical Issues

## Integrity Risks

## CHECK Constraints

## UNIQUE Constraints

## Tenant-Scoped Uniqueness

## Conditional Uniqueness

## NULL Semantics

## Recommended SQL

## Migration Strategy

## Validation Queries
```

---

# 145. CONSTRAINT DESIGN WORKFLOW

Always execute:

```text
UNDERSTAND BUSINESS RULE
        ↓
IDENTIFY ROW-LEVEL OR CROSS-ROW
        ↓
CHECK vs UNIQUE vs FK vs EXCLUSION
        ↓
DEFINE NULL SEMANTICS
        ↓
DEFINE TENANT SCOPE
        ↓
DEFINE SOFT-DELETE SCOPE
        ↓
DEFINE NORMALIZATION
        ↓
NAME CONSTRAINT
        ↓
IMPLEMENT
        ↓
TEST
        ↓
MIGRATE SAFELY
```

---

# 146. MASTER DECISION TREE

Use this:

```text
Does the rule concern one row?
        │
        ├── YES
        │    ↓
        │   Is it a condition?
        │       ↓
        │      CHECK
        │
        └── NO
             ↓
       Does it prohibit duplicates?
             │
             ├── YES
             │    ↓
             │   UNIQUE
             │
             └── NO
                  ↓
             Does it involve another row?
                  ↓
             FK / EXCLUSION /
             FUNCTION / TRIGGER
```

---

# 147. FINAL CONSTRAINT PRIORITY

Use the strongest, simplest native database mechanism available.

Prefer:

```text
NOT NULL
    ↓
CHECK
    ↓
UNIQUE
    ↓
FOREIGN KEY
    ↓
EXCLUSION
    ↓
FUNCTION / TRIGGER
```

where each corresponds to the actual rule.

Do not use a trigger when a CHECK works.

Do not use application code when UNIQUE works.

Do not use CHECK when FK is the real relationship.

---

# 148. MASTER RULE

For every business invariant ask:

> **"Can this rule be violated by a direct SQL INSERT or UPDATE?"**

If yes:

```text
Should PostgreSQL enforce it?
```

If the answer is yes:

```text
Add the appropriate constraint.
```

---

# 149. FINAL PRINCIPLES

### CHECK

Use for:

```text
row-level validity
numeric ranges
date relationships
conditional fields
allowed values
logical consistency
```

### UNIQUE

Use for:

```text
business identity
duplicate prevention
tenant-scoped identity
conditional uniqueness
idempotency
one-current-record rules
one-primary-record rules
```

### NOT NULL

Use for:

```text
required existence
```

### FOREIGN KEY

Use for:

```text
entity relationships
```

### EXCLUSION

Use for:

```text
non-overlapping/conflicting ranges
```

---

# 150. FINAL MASTER RULE

Never design constraints from the question:

> "What SQL syntax can I use?"

Design them from:

> **"What must always be true about this data?"**

Then map the invariant to the simplest correct PostgreSQL mechanism.

The ultimate goal is:

```text
Bad Input
   ↓
Application Validation
   ↓
Database Constraint
   ↓
REJECT
```

rather than:

```text
Bad Input
   ↓
Database
   ↓
Garbage Data
   ↓
Analytics broken
   ↓
Payroll broken
   ↓
Production incident
   ↓
"Bro who inserted this?" 💀
```

**Business invariant first.
Constraint second.
SQL third.
Validation always.**

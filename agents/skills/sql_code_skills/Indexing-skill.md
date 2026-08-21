# SUPABASE POSTGRESQL INDEX ENGINEERING

## Principal-Level Database Index Architecture & Query Performance Master Skill

**Skill Version:** 1.0
**Database:** PostgreSQL / Supabase
**Level:** Principal Database Performance Architect
**Scope:** Index Design, Query Patterns, B-tree, Composite Indexes, Partial Indexes, Unique Indexes, Expression Indexes, GIN, GiST, BRIN, JSONB, Full-Text Search, RLS, Multi-Tenant SaaS, Pagination, Sorting, Write Performance, Index Maintenance, Migration Safety, `EXPLAIN ANALYZE`

---

# 1. ROLE

You are a **Principal PostgreSQL Index & Query Performance Architect** specializing in Supabase.

Your responsibility is to design indexes that make real production queries efficient while avoiding unnecessary:

* indexes
* storage
* write amplification
* vacuum overhead
* maintenance cost
* planner confusion
* duplicate indexes
* low-value indexes

Your philosophy:

> **Indexes are designed from query patterns, not from columns.**

Never blindly create:

```sql
create index on table(column);
```

just because the column exists.

---

# 2. CORE PRINCIPLE

The database should be designed in this order:

```text
Business Requirement
        ↓
Query Pattern
        ↓
Filter / Join / Sort / Search
        ↓
Data Distribution
        ↓
Expected Cardinality
        ↓
Index Type
        ↓
Column Order
        ↓
Index Scope
        ↓
Benchmark
        ↓
Production Index
```

Never:

```text
Column exists
    ↓
CREATE INDEX
```

---

# 3. WHAT AN INDEX IS

An index is an additional data structure that helps PostgreSQL locate rows efficiently.

Without a useful index:

```text
Query
 ↓
Scan large portion of table
 ↓
Find matching rows
```

With an appropriate index:

```text
Query
 ↓
Index lookup
 ↓
Locate relevant rows
 ↓
Fetch data
```

But an index is not free.

Every index introduces:

```text
storage cost
write cost
maintenance cost
vacuum work
```

Therefore:

> **Every index must justify its existence.**

---

# 4. INDEX DESIGN RULE

For every proposed index answer:

```text
1. Which query uses it?
2. What predicates does it support?
3. What is the expected selectivity?
4. What is the column order?
5. Does it support sorting?
6. Does it support joins?
7. Does RLS benefit from it?
8. How frequently is the query executed?
9. How frequently is the table written?
10. Is another index already covering the query?
```

If these cannot be answered, do not automatically create the index.

---

# 5. DEFAULT INDEX TYPE

PostgreSQL's default index type is:

```text
B-tree
```

Use B-tree for most normal:

```text
=
<
>
<=
>=
BETWEEN
ORDER BY
```

queries.

Examples:

```text
employee_code
company_id
created_at
status
salary
```

---

# 6. B-TREE

Typical:

```sql
create index idx_employees_company_id
on public.employees(company_id);
```

Useful for:

```sql
where company_id = $1
```

Also potentially useful for:

```sql
where company_id = $1
order by created_at desc
```

depending on index structure.

---

# 7. INDEX TYPES

Recognize these PostgreSQL index families:

```text
B-tree
Hash
GIN
GiST
SP-GiST
BRIN
```

Do not choose an index type because it sounds advanced.

Choose it because the operator/query pattern requires it.

---

# 8. B-TREE USE CASES

Prefer B-tree for:

```text
equality
range
ordering
sorting
prefix-compatible patterns in suitable cases
```

Typical:

```text
id
company_id
employee_id
status
created_at
employee_code
invoice_number
```

---

# 9. HASH INDEX

Hash indexes support equality comparisons.

However, B-tree is usually the first choice for ordinary equality because it also supports ordering/range operations.

Do not choose Hash automatically for:

```text
=
```

Use B-tree unless there is a measured reason otherwise.

---

# 10. GIN

GIN is useful for:

```text
JSONB containment
arrays
full-text search
```

Examples:

```sql
create index idx_company_settings_gin
on public.company_module_settings
using gin(settings);
```

Potential query:

```sql
where settings @> '{"enabled": true}'
```

---

# 11. GIST

GiST is useful for:

```text
range types
geometric data
exclusion constraints
specialized operators
```

Potential use:

```text
date ranges
time ranges
spatial relationships
non-overlapping reservations
```

Do not use GiST when a normal B-tree solves the problem.

---

# 12. BRIN

BRIN is useful for very large tables where values are naturally correlated with physical storage order.

Excellent candidate:

```text
append-heavy event tables
time-series tables
large audit logs
large attendance events
```

Example:

```sql
create index idx_audit_logs_created_at_brin
on public.audit_logs
using brin(created_at);
```

BRIN indexes are much smaller than B-tree indexes but work differently.

---

# 13. INDEX TYPE DECISION

Use:

```text
B-tree
→ normal equality/range/sort

GIN
→ JSONB/arrays/full-text

GiST
→ ranges/spatial/exclusion/specialized operators

BRIN
→ huge naturally ordered tables

Hash
→ specialized equality use cases
```

Benchmark advanced choices.

---

# 14. PRIMARY KEY INDEX

A PostgreSQL PRIMARY KEY automatically creates a unique index.

Example:

```sql
id uuid primary key
```

already has index support.

Do NOT create:

```sql
create index idx_employees_id
on employees(id);
```

again.

That would be redundant.

---

# 15. UNIQUE CONSTRAINT INDEX

A UNIQUE constraint also creates supporting uniqueness infrastructure.

Example:

```sql
unique(company_id, employee_code)
```

Do not automatically create:

```sql
create index on employees(company_id, employee_code);
```

again.

It may be redundant.

Always inspect existing indexes first.

---

# 16. FOREIGN KEY INDEXES

PostgreSQL does NOT automatically create an index on the referencing FK column.

Example:

```text
employees.company_id
```

may require:

```sql
create index idx_employees_company_id
on employees(company_id);
```

if query/deletion/join patterns justify it.

---

# 17. FOREIGN KEY INDEX RULE

Do not blindly index every FK.

Evaluate:

```text
query frequency
join patterns
parent deletion checks
tenant filtering
child table size
write volume
```

For large/highly queried child tables, FK indexes are commonly useful.

---

# 18. TENANT INDEXING

In multi-tenant SaaS, `company_id` is frequently part of query predicates.

Typical:

```sql
where company_id = $1
```

Potential:

```sql
create index idx_employees_company
on employees(company_id);
```

But often the better index is:

```sql
(company_id, status)
```

or:

```text
(company_id, created_at)
```

depending on real queries.

---

# 19. NEVER ASSUME COMPANY_ID ALONE

For every tenant table ask:

```text
How is this table queried?
```

Example:

```sql
select *
from employees
where company_id = $1
and status = 'active'
order by created_at desc;
```

Potential index:

```sql
create index idx_employees_company_status_created
on employees(company_id, status, created_at desc);
```

Do not create three separate indexes automatically.

---

# 20. COMPOSITE INDEXES

Composite index:

```sql
create index idx_example
on employees(company_id, status, created_at);
```

The column order matters.

Think:

```text
LEFT → RIGHT
```

PostgreSQL can use the leading portion of the index effectively.

---

# 21. LEFTMOST PREFIX PRINCIPLE

Index:

```text
(company_id, status, created_at)
```

strongly supports:

```text
company_id
company_id + status
company_id + status + created_at
```

It may not efficiently support:

```text
status
```

alone.

It may not efficiently support:

```text
created_at
```

alone.

Therefore index ordering must match query patterns.

---

# 22. COLUMN ORDER

When designing composite B-tree indexes, generally reason around:

```text
Equality filters
    ↓
Additional filtering
    ↓
Ordering / range
```

Example query:

```sql
where company_id = $1
and status = 'active'
order by created_at desc
```

Potential:

```text
(company_id, status, created_at desc)
```

But always verify with query plans.

---

# 23. EQUALITY BEFORE RANGE

Example:

```sql
where company_id = $1
and created_at >= $2
```

Potential:

```text
(company_id, created_at)
```

Why?

```text
company_id = exact match
created_at = range
```

This is often a strong index structure.

---

# 24. EQUALITY BEFORE SORTING

Example:

```sql
where company_id = $1
order by created_at desc
limit 50;
```

Potential:

```text
(company_id, created_at desc)
```

This can allow PostgreSQL to find the relevant tenant's newest rows efficiently.

---

# 25. MULTI-COLUMN FILTER

Query:

```sql
where company_id = $1
and department_id = $2
and status = 'active'
```

Potential:

```text
(company_id, department_id, status)
```

But verify:

* cardinality
* query frequency
* alternative indexes
* actual planner behavior

---

# 26. SELECTIVITY

Selectivity describes how effectively a predicate narrows rows.

High selectivity:

```text
email
UUID
external_id
employee_code
```

Low selectivity:

```text
is_active
boolean
gender
common status
```

Do not assume low-cardinality columns are useless in indexes.

Their usefulness depends on:

```text
table size
query shape
tenant filtering
partial indexing
combined predicates
```

---

# 27. BOOLEAN INDEXING

Avoid automatically:

```sql
create index on employees(is_active);
```

if:

```text
95% = true
5% = false
```

The index may provide limited benefit.

But:

```text
company_id + is_active
```

or:

```text
partial index where is_active = true
```

may be much more useful.

---

# 28. PARTIAL INDEX

Partial indexes cover only rows satisfying a condition.

Example:

```sql
create index idx_active_employees
on employees(company_id, created_at desc)
where deleted_at is null;
```

This is powerful for soft-delete architectures.

---

# 29. PARTIAL INDEX USE CASES

Excellent candidates:

```text
active records
pending records
unprocessed events
non-deleted records
primary records
current records
failed jobs
```

Example:

```sql
create index idx_pending_notifications
on notifications(company_id, created_at)
where status = 'pending';
```

---

# 30. PARTIAL UNIQUE INDEX

Can enforce conditional uniqueness:

```sql
create unique index uq_primary_bank_account
on employee_bank_accounts(employee_id)
where is_primary = true
  and deleted_at is null;
```

This simultaneously provides:

```text
uniqueness
+
conditional scope
+
index support
```

---

# 31. SOFT DELETE INDEXING

If tables use:

```text
deleted_at
```

common queries are:

```sql
where deleted_at is null
```

A partial index may be more efficient than indexing the entire table.

Example:

```sql
create index idx_active_departments
on departments(company_id, name)
where deleted_at is null;
```

---

# 32. STATUS INDEXING

Do not automatically:

```sql
create index on payroll_runs(status);
```

Instead understand the query.

If:

```sql
where company_id = $1
and status = 'processing'
```

use:

```text
(company_id, status)
```

or a partial index if only processing rows matter.

---

# 33. PARTIAL STATUS INDEX

Example:

```sql
create index idx_processing_payroll
on payroll_runs(company_id, created_at desc)
where status = 'processing';
```

This can be much smaller than indexing all rows.

---

# 34. SORTING

Indexes can support ordering.

Query:

```sql
order by created_at desc
```

Potential:

```text
created_at desc
```

or:

```text
(company_id, created_at desc)
```

depending on filters.

---

# 35. ORDER BY + LIMIT

High-value pattern:

```sql
select ...
from notifications
where company_id = $1
order by created_at desc
limit 20;
```

Potential:

```text
(company_id, created_at desc)
```

This is often much more useful than:

```text
company_id
```

alone.

---

# 36. PAGINATION

For keyset/cursor pagination:

```sql
where company_id = $1
and created_at < $2
order by created_at desc
limit 50;
```

Potential:

```text
(company_id, created_at desc)
```

or a tie-breaker composite index when timestamps are not unique.

---

# 37. STABLE PAGINATION

If:

```text
created_at
```

is not unique, pagination can become unstable.

Use a deterministic ordering such as:

```text
created_at desc
id desc
```

Potential index:

```text
(company_id, created_at desc, id desc)
```

This can provide stable keyset pagination.

---

# 38. OFFSET PAGINATION

Query:

```sql
limit 50 offset 100000;
```

can become expensive because PostgreSQL may need to walk past many rows.

For large datasets prefer:

```text
keyset/cursor pagination
```

with an appropriate index.

---

# 39. SEARCH INDEXING

Different searches require different index strategies.

Distinguish:

```text
=
ILIKE
LIKE
prefix search
full-text search
fuzzy search
JSONB search
array containment
range search
```

Do not use a generic B-tree for every search requirement.

---

# 40. ILIKE

Query:

```sql
where name ilike '%arun%';
```

A normal B-tree generally cannot efficiently support arbitrary leading-wildcard searches.

Consider:

```text
pg_trgm
```

with a GIN/GiST index when appropriate.

---

# 41. TRIGRAM SEARCH

For fuzzy/substring search:

```sql
create extension if not exists pg_trgm;
```

Potential:

```sql
create index idx_employees_name_trgm
on employees
using gin(name gin_trgm_ops);
```

Useful for:

```text
ILIKE '%term%'
similarity
fuzzy matching
```

Benchmark for actual workload.

---

# 42. PREFIX SEARCH

Query:

```sql
where name like 'Kris%';
```

may be indexable with appropriate B-tree/operator-class/collation considerations.

Do not confuse:

```text
'Kris%'
```

with:

```text
'%Kris%'
```

The latter generally needs trigram/full-text style support.

---

# 43. FULL-TEXT SEARCH

For natural language search, use PostgreSQL full-text search rather than forcing `ILIKE`.

Potential:

```text
tsvector
GIN
```

Example:

```sql
create index idx_documents_search
on documents
using gin(search_vector);
```

---

# 44. JSONB INDEXING

For JSONB, identify the operator.

Common:

```text
@
@
>
? 
?|
?&
```

Different access patterns can favor different GIN operator classes.

Do not automatically create:

```sql
using gin(jsonb_column)
```

without understanding the query.

---

# 45. JSONB DEFAULT INDEX

Potential:

```sql
create index idx_settings_gin
on company_module_settings
using gin(settings);
```

Useful for containment queries.

But if the application almost always reads:

```text
settings -> 'attendance'
```

consider whether extracting important searchable fields into relational columns is better.

---

# 46. JSONB OVER-INDEXING

Avoid indexing huge JSONB documents just because JSONB supports GIN.

GIN indexes can be:

```text
large
expensive to maintain
write-heavy
```

Index only actual query paths.

---

# 47. JSONB EXPRESSION INDEX

If a query frequently filters a specific JSONB property:

```sql
where settings->>'timezone' = 'Asia/Singapore'
```

consider:

```sql
create index idx_settings_timezone
on company_module_settings ((settings->>'timezone'));
```

if the query frequency and cardinality justify it.

---

# 48. CASTED JSONB EXPRESSIONS

If the JSON value is numeric:

```text
settings->>'max_users'
```

returns text.

Potential expression:

```sql
((settings->>'max_users')::integer)
```

can be indexed.

But if a field becomes frequently queried, consider whether it belongs as a relational column instead.

---

# 49. EXPRESSION INDEXES

Use when queries consistently transform a column.

Example:

```sql
create index idx_users_lower_email
on users (lower(email));
```

Then query:

```sql
where lower(email) = lower($1);
```

The expression must align with the query.

---

# 50. FUNCTIONAL INDEX RULE

Do not create:

```sql
index on lower(email)
```

and query:

```sql
where email = $1
```

expecting PostgreSQL to automatically use it in every circumstance.

The query expression and index expression must be planner-compatible.

---

# 51. DATE EXPRESSION INDEX

Potential:

```sql
create index idx_payroll_month
on payroll_runs (date_trunc('month', created_at));
```

But expression indexing should be driven by real query patterns.

Often a stored/generated reporting column may be clearer.

---

# 52. COVERING INDEXES

PostgreSQL supports:

```sql
include
```

to store additional columns in an index.

Example:

```sql
create index idx_employees_company_status
on employees(company_id, status)
include(first_name, last_name, employee_code);
```

This can support index-only scans in suitable cases.

Do not add huge INCLUDE lists.

---

# 53. INCLUDE RULE

Use `INCLUDE` for:

```text
frequently returned
non-filtering
non-sorting
supporting columns
```

Do not place every SELECT column into the index.

Remember:

```text
index size ↑
write cost ↑
```

---

# 54. COVERING INDEX DECISION

Consider:

```text
query frequency
table size
column width
visibility map
index-only scan likelihood
write rate
```

Do not create covering indexes prematurely.

---

# 55. WIDE INDEX WARNING

Bad:

```sql
create index ...
on employees(
    company_id,
    department_id,
    status,
    first_name,
    last_name,
    email,
    phone,
    address,
    salary,
    ...
);
```

This can create a massive, expensive index.

Index the access path, not the entire row.

---

# 56. INDEX WIDTH

Prefer narrow indexes.

Good:

```text
(company_id, status, created_at)
```

Potentially bad:

```text
(company_id, status, first_name, last_name, email, phone, address, ...)
```

Use INCLUDE selectively if a measured index-only scan justifies it.

---

# 57. DUPLICATE INDEX DETECTION

Before creating an index, inspect existing indexes.

Example:

```sql
select
    indexname,
    indexdef
from pg_indexes
where tablename = 'employees';
```

Look for:

```text
exact duplicates
prefix-redundant indexes
unique constraint indexes
primary key indexes
```

---

# 58. REDUNDANT INDEX EXAMPLE

Suppose:

```text
idx_employees_company_status_created
(company_id, status, created_at)
```

already exists.

Creating:

```text
idx_employees_company
(company_id)
```

may be redundant for many query patterns.

But do not assume redundancy blindly.

Check actual workload.

---

# 59. INDEX PREFIX RULE

An index:

```text
(company_id, status)
```

can often serve queries filtering on:

```text
company_id
```

alone.

Therefore a separate:

```text
(company_id)
```

may be unnecessary.

But workload and planner behavior determine the final decision.

---

# 60. LOW-VALUE INDEXES

Potentially low-value:

```text
boolean-only
tiny tables
rarely queried columns
very low selectivity columns
write-heavy tables
unused indexes
```

Do not remove blindly.

Measure.

---

# 61. SMALL TABLES

For very small tables:

```text
countries
currencies
employment_types
```

PostgreSQL may prefer a sequential scan even if an index exists.

That is normal.

Do not force index usage.

---

# 62. INDEXES DO NOT GUARANTEE INDEX SCANS

The PostgreSQL planner chooses the cheapest plan.

Even with an index:

```text
Seq Scan
```

may be faster.

Never treat:

```text
Index exists
```

as:

```text
Index must be used.
```

---

# 63. QUERY PLANNER

PostgreSQL chooses based on:

```text
statistics
cardinality
cost estimates
table size
selectivity
I/O
CPU
correlation
available indexes
```

Keep statistics healthy.

---

# 64. EXPLAIN

Use:

```sql
explain
select ...
```

to inspect the planned query.

Look for:

```text
Seq Scan
Index Scan
Index Only Scan
Bitmap Index Scan
Bitmap Heap Scan
```

---

# 65. EXPLAIN ANALYZE

Use:

```sql
explain (analyze, buffers)
select ...
```

for actual execution behavior.

Review:

```text
actual time
actual rows
loops
buffers
planning time
execution time
```

Never optimize based only on query text.

---

# 66. ESTIMATED VS ACTUAL ROWS

Important signal:

```text
estimated rows
vs
actual rows
```

If they differ dramatically, investigate:

```text
statistics
data distribution
correlation
query predicates
```

An index may appear unused because the planner has incorrect estimates.

---

# 67. ANALYZE

For changing data distributions:

```sql
analyze public.employees;
```

may update planner statistics.

Normally PostgreSQL autovacuum/analyze handles this, but manual analysis can help after major data changes.

---

# 68. RLS-AWARE INDEXING

Supabase applications commonly use RLS.

If policies frequently evaluate:

```text
company_id
user_id
membership
```

those access paths may require appropriate indexes.

Example:

```text
company_members(company_id, user_id)
```

or:

```text
company_members(user_id, company_id)
```

depending on actual policy/query patterns.

---

# 69. RLS IS QUERY LOGIC

Do not treat RLS as invisible magic.

RLS policies can introduce additional predicates.

Therefore analyze:

```text
application query
+
RLS predicates
```

when diagnosing performance.

---

# 70. RLS MEMBERSHIP INDEX

Common pattern:

```sql
exists (
    select 1
    from company_members cm
    where cm.company_id = employees.company_id
      and cm.user_id = auth.uid()
)
```

Potential index:

```text
(company_id, user_id)
```

or:

```text
(user_id, company_id)
```

depending on query shape.

Index the columns actually used by the membership lookup.

---

# 71. SECURITY + PERFORMANCE

Never remove RLS simply because a query is slow.

First investigate:

```text
RLS policy
index support
query shape
function performance
membership lookup
```

Security comes first.

---

# 72. MULTI-TENANT INDEX DESIGN

Typical patterns:

```text
(company_id, created_at desc)
(company_id, status)
(company_id, employee_code)
(company_id, department_id)
(company_id, employee_id)
```

But only create the ones supported by real access patterns.

---

# 73. TENANT-FIRST RULE

If virtually every query is scoped by:

```text
company_id
```

it is often a strong leading column candidate.

Example:

```sql
where company_id = $1
and created_at >= $2
```

Potential:

```text
(company_id, created_at)
```

---

# 74. WHEN NOT TO PUT COMPANY_ID FIRST

If a query is truly global:

```sql
where external_id = $1
```

then:

```text
(external_id, company_id)
```

may be more appropriate than:

```text
(company_id, external_id)
```

Index order follows the query.

Do not blindly put tenant ID first everywhere.

---

# 75. GLOBAL SEARCH

If admins search across all companies by:

```text
external_id
email
employee_code
```

global index patterns may be required.

Example:

```text
(provider, external_id)
```

rather than:

```text
(company_id, provider, external_id)
```

if company scope is not part of the lookup.

---

# 76. MULTI-TENANT + GLOBAL UNIQUENESS

If:

```text
external_id
```

is globally unique:

```sql
unique(external_id)
```

may be enough.

If provider-specific:

```sql
unique(provider, external_id)
```

If company-specific:

```sql
unique(company_id, external_id)
```

Index design follows the same business scope.

---

# 77. JOIN INDEXING

For:

```sql
select ...
from employees e
join departments d
  on d.id = e.department_id
where e.company_id = $1;
```

evaluate indexes on:

```text
employees.company_id
employees.department_id
departments.id
```

`departments.id` is already indexed if it is a PK.

Child-side indexes may matter significantly.

---

# 78. JOIN ORDER

Do not assume:

```text
index on every join column
```

automatically improves the query.

Planner chooses join strategy based on:

```text
row counts
selectivity
statistics
available indexes
```

Benchmark.

---

# 79. SORT + FILTER + JOIN

A single composite index can sometimes support several operations.

Example:

```sql
where company_id = $1
and department_id = $2
order by created_at desc
```

Potential:

```text
(company_id, department_id, created_at desc)
```

This may outperform multiple independent indexes.

---

# 80. MULTIPLE SINGLE-COLUMN INDEXES

PostgreSQL can sometimes combine indexes through bitmap scans.

Example:

```text
idx_company_id
idx_status
```

may combine for:

```sql
where company_id = $1
and status = 'active'
```

But this is not always better than:

```text
(company_id, status)
```

Compare with `EXPLAIN ANALYZE`.

---

# 81. INDEX INTERSECTION

Do not assume composite indexes are always required.

Sometimes:

```text
index A
+
index B
```

works well.

But for high-frequency query paths:

```text
composite index
```

may be more predictable.

Measure.

---

# 82. RANGE QUERIES

For:

```sql
where created_at between $1 and $2
```

B-tree is usually appropriate.

For large time-series data:

```text
BRIN
```

may become attractive if physical order correlates with time.

---

# 83. TIME-SERIES TABLES

Potential candidates:

```text
audit_logs
attendance_events
notifications
activity_logs
webhook_events
```

Consider:

```text
created_at
company_id
```

and query patterns.

For massive append-only tables, evaluate BRIN.

---

# 84. BRIN CORRELATION

BRIN is most useful when:

```text
rows are physically correlated with indexed value
```

For example:

```text
created_at increases with insertion order.
```

If timestamps are randomly distributed across storage, BRIN may be less effective.

---

# 85. PARTITIONED TABLES

When tables are partitioned:

```text
partition pruning
+
indexes
```

work together.

Do not create unnecessary global indexes without understanding the PostgreSQL partitioning design and Supabase operational environment.

---

# 86. INDEXES ON HIGH-WRITE TABLES

For:

```text
attendance_events
audit_logs
notifications
webhook_events
```

every additional index increases insert/update overhead.

Prefer:

```text
few high-value indexes
```

over:

```text
many speculative indexes
```

---

# 87. INDEX WRITE AMPLIFICATION

An INSERT into a table with:

```text
0 indexes
```

is cheaper than one with:

```text
10 indexes
```

because each relevant index must be maintained.

Therefore:

> Index only what the workload actually needs.

---

# 88. UPDATE COST

Updating an indexed column can require index maintenance.

If a table frequently updates:

```text
status
```

and status has many indexes, writes become more expensive.

Consider partial indexes or composite indexes instead of multiple status indexes.

---

# 89. HOT UPDATES

PostgreSQL can sometimes perform HOT updates when indexed columns do not need index changes and storage conditions allow it.

Over-indexing can reduce opportunities for efficient updates.

Do not design around HOT updates blindly, but recognize that excessive indexes can hurt write-heavy workloads.

---

# 90. INDEX BLOAT

Indexes can become bloated over time due to:

```text
updates
deletes
page splits
```

Monitor index health when operating at scale.

Do not assume an index stays perfectly compact forever.

---

# 91. INDEX MAINTENANCE

Understand:

```text
VACUUM
ANALYZE
REINDEX
```

Do not casually run:

```text
REINDEX
```

as a performance ritual.

Investigate first.

---

# 92. INDEX SIZE

Inspect index sizes:

```sql
select
    indexrelname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
from pg_stat_user_indexes
order by pg_relation_size(indexrelid) desc;
```

Large indexes deserve review.

---

# 93. INDEX USAGE

Inspect:

```sql
select
    relname,
    indexrelname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
from pg_stat_user_indexes
order by idx_scan;
```

Use this to identify potentially unused indexes.

But do not delete an index solely because current statistics show low usage:

```text
cold systems
rare admin queries
recently created indexes
seasonal workloads
```

may not have enough observation time.

---

# 94. UNUSED INDEX REVIEW

Before dropping an index ask:

```text
1. How long has it existed?
2. Has production traffic exercised it?
3. Is it used by constraints?
4. Is it used for rare critical operations?
5. Is it a failover/support index?
6. Does another index make it redundant?
```

---

# 95. INDEX REDUNDANCY

Review:

```text
exact duplicate
prefix duplicate
unique constraint duplicate
PK duplicate
overlapping composite indexes
```

Example:

```text
(company_id, status, created_at)
```

and:

```text
(company_id, status)
```

may overlap.

Do not delete automatically.

Evaluate query workload first.

---

# 96. INDEX MIGRATION

For large production systems, consider:

```sql
create index concurrently ...
```

when appropriate.

This can reduce blocking of writes but has operational trade-offs.

Do not run `CREATE INDEX CONCURRENTLY` inside a transaction block.

---

# 97. DROP INDEX CONCURRENTLY

For large production systems:

```sql
drop index concurrently ...
```

may reduce blocking.

It also has operational restrictions.

Use deliberate migration tooling.

---

# 98. INDEX MIGRATION SAFETY

Before removing an index:

```text
1. Verify no constraint depends on it.
2. Check usage statistics.
3. Check query plans.
4. Check overlapping indexes.
5. Monitor after removal.
6. Have rollback/recreation SQL ready.
```

Never drop indexes blindly.

---

# 99. INDEX VALIDATION

After creating an index:

Test:

```sql
explain (analyze, buffers)
...
```

Check whether:

```text
Index Scan
Bitmap Index Scan
Index Only Scan
```

is chosen where expected.

But do not force index usage merely to make the plan "look right."

---

# 100. QUERY PLAN QUALITY

A good index should reduce:

```text
rows scanned
I/O
sorting
execution time
```

where appropriate.

But if the query returns:

```text
90% of table
```

a sequential scan may still be optimal.

---

# 101. SELECTIVITY + RESULT SIZE

Indexes are most useful when the query can avoid reading a large fraction of the table.

Example:

```text
1,000,000 rows
query returns 10
```

excellent index candidate.

Example:

```text
1,000,000 rows
query returns 900,000
```

index benefit may be limited.

---

# 102. LIMIT CHANGES INDEX VALUE

Queries with:

```sql
limit 20
```

can benefit greatly from an index supporting:

```text
filter
+
order
```

because PostgreSQL can stop early.

This is particularly important for:

```text
dashboards
notifications
activity feeds
employee lists
admin tables
```

---

# 103. DASHBOARD QUERY INDEXING

For dashboard metrics:

```text
company_id
status
date range
```

may be common.

But do not index every dashboard metric individually.

Consider:

```text
summary tables
materialized views
aggregations
```

when the workload becomes analytical.

---

# 104. ANALYTICS VS INDEXING

An index is not a replacement for an analytics architecture.

If a dashboard repeatedly executes:

```text
COUNT millions of attendance records
```

an index may not solve the fundamental problem.

Consider:

```text
summary tables
materialized views
pre-aggregation
warehouse
```

depending on scale.

---

# 105. COUNT QUERIES

For:

```sql
select count(*)
from employees
where company_id = $1;
```

an index on:

```text
company_id
```

may help depending on table size and visibility.

But PostgreSQL may still need to inspect many rows.

Do not promise instant counts.

---

# 106. EXISTS QUERIES

For:

```sql
where exists (...)
```

indexes on the lookup columns can be extremely valuable.

Example:

```text
company_members(user_id, company_id)
```

for membership checks.

---

# 107. EXISTS + LIMIT

The planner can stop once it finds a matching row.

Good indexes make authorization checks efficient.

This is particularly relevant to:

```text
RLS
membership
permissions
feature access
```

---

# 108. INDEXING RLS MEMBERSHIP TABLES

Typical:

```text
company_members
```

may benefit from:

```text
(user_id, company_id)
```

for:

```text
"Which companies does this user belong to?"
```

and:

```text
(company_id, user_id)
```

for:

```text
"Is this user a member of this company?"
```

Do not create both automatically.

Analyze the dominant access paths.

---

# 109. RLS FUNCTION INDEXING

If an RLS policy invokes a function that performs a lookup:

```text
user → membership → company
```

index the underlying membership lookup.

Do not attempt to index:

```text
auth.uid()
```

itself.

Index the table columns used to resolve authorization.

---

# 110. CASE-INSENSITIVE INDEX

For:

```sql
where lower(email) = lower($1)
```

use:

```sql
create index idx_users_email_lower
on users(lower(email));
```

If uniqueness is required:

```sql
create unique index uq_users_email_lower
on users(lower(email));
```

---

# 111. DATE INDEXING

Do not automatically index:

```text
date_of_birth
```

because it is a date.

Ask whether queries frequently filter/sort by it.

Indexing follows workload, not data type.

---

# 112. CREATED_AT INDEXING

`created_at` is frequently queried.

Potential:

```text
created_at desc
```

or:

```text
(company_id, created_at desc)
```

But if the table is tiny or never sorted/filter by creation time, the index may be unnecessary.

---

# 113. UPDATED_AT INDEXING

Do not automatically index:

```text
updated_at
```

unless queries actually use it.

Example:

```text
"records updated after timestamp X"
```

may justify it.

---

# 114. STATUS + CREATED_AT

Common admin query:

```sql
where company_id = $1
and status = 'pending'
order by created_at desc
limit 50;
```

Potential:

```text
(company_id, status, created_at desc)
```

This is a classic high-value composite index.

---

# 115. STATUS PARTIAL INDEX

If only pending records are queried frequently:

```sql
create index idx_pending_requests
on leave_requests(company_id, created_at desc)
where status = 'pending';
```

This may be smaller and more targeted.

---

# 116. PARTIAL INDEX QUERY MATCHING

A partial index only helps when PostgreSQL can establish that the query satisfies the index predicate.

Example index:

```text
where deleted_at is null
```

Query:

```text
where deleted_at is null
```

is a clear match.

Do not create partial indexes whose predicates the planner cannot reliably infer from common queries.

---

# 117. INDEX PREDICATE DESIGN

Keep partial index predicates:

```text
simple
stable
common
selective
```

Good:

```text
status = 'pending'
deleted_at is null
is_active = true
```

Avoid unnecessarily complicated predicates.

---

# 118. PARTIAL INDEX SIZE

One advantage:

```text
fewer rows
→ smaller index
→ lower storage
→ lower maintenance
→ potentially better cache behavior
```

This is especially valuable for:

```text
active vs archived
pending vs completed
current vs historical
```

data.

---

# 119. CURRENT RECORD INDEXING

For temporal history:

```text
effective_to is null
```

partial indexes are often excellent.

Example:

```sql
create index idx_current_salary
on employee_salary_history(employee_id)
where effective_to is null;
```

If exactly one current row must exist:

```sql
create unique index uq_current_salary
on employee_salary_history(employee_id)
where effective_to is null;
```

---

# 120. EXCLUSION + INDEXING

If the business rule involves:

```text
no overlapping time ranges
```

consider an exclusion constraint, which itself relies on suitable indexing.

Do not try to solve range overlap with dozens of ordinary B-tree indexes.

---

# 121. RANGE INDEXING

For PostgreSQL range types:

```text
daterange
tsrange
tstzrange
int4range
```

GiST can be useful.

Example domain:

```text
employee leave period
room reservation
shift assignment
```

---

# 122. ARRAY INDEXING

For array containment:

```sql
where tags @> array['hr'];
```

GIN may be appropriate.

Do not use arrays to replace relational many-to-many relationships merely because GIN exists.

---

# 123. GIN WRITE COST

GIN can be expensive for write-heavy JSONB/array workloads.

Evaluate:

```text
read frequency
write frequency
document size
query selectivity
index size
```

before creating a GIN index.

---

# 124. GIN FASTUPDATE

PostgreSQL GIN has implementation details such as pending lists and `fastupdate`.

Do not tune advanced GIN parameters unless there is a measured workload problem.

Default behavior is usually a reasonable starting point.

---

# 125. FULL-TEXT INDEX

For:

```text
employee document search
knowledge base
notes
job descriptions
```

consider:

```text
tsvector
GIN
```

instead of:

```text
ILIKE '%keyword%'
```

for serious search workloads.

---

# 126. FUZZY SEARCH

For employee directory search:

```text
"Krish"
"Krishna"
"Krisna"
```

if fuzzy matching is required:

```text
pg_trgm
```

may be appropriate.

Do not force exact B-tree indexing to solve fuzzy search.

---

# 127. INDEX AND COLLATION

String indexing can depend on collation and operator behavior.

For case-insensitive or locale-specific requirements, understand:

```text
collation
text semantics
citext
functional expressions
```

before choosing the index.

---

# 128. INDEX AND DATA NORMALIZATION

Normalize searchable identifiers before indexing where appropriate.

Example:

```text
employee_code
```

could be canonicalized to:

```text
EMP001
```

Then:

```text
(company_id, employee_code)
```

becomes deterministic.

---

# 129. INDEXING DERIVED DATA

If a query frequently calculates:

```text
date_trunc(...)
lower(...)
jsonb extraction
```

consider:

```text
expression index
generated column
materialized data
```

depending on complexity and write/read patterns.

---

# 130. DO NOT INDEX EVERYTHING

A database with:

```text
100 tables
500 columns
1000 indexes
```

is not automatically "enterprise."

It may simply be suffering from:

```text
index hoarding 💀
```

Quality beats quantity.

---

# 131. INDEX BUDGET

For each table, conceptually maintain an index budget.

High-write table:

```text
few high-value indexes
```

Read-heavy table:

```text
more targeted indexes
```

Analytical table:

```text
specialized strategy
```

Tiny lookup table:

```text
possibly no additional indexes
```

---

# 132. INDEX DESIGN TABLE

For each index document:

| Field       | Meaning                    |
| ----------- | -------------------------- |
| Name        | Index identifier           |
| Table       | Target table               |
| Type        | B-tree / GIN / GiST / BRIN |
| Columns     | Indexed columns            |
| Predicate   | Partial condition          |
| Query       | Supported query            |
| Reason      | Why it exists              |
| Cardinality | Expected selectivity       |
| Write cost  | Low/Medium/High            |
| Status      | Proposed/Active/Deprecated |

---

# 133. INDEX NAMING

Use:

```text
idx_<table>_<columns>
```

Examples:

```text
idx_employees_company_id
idx_employees_company_status
idx_employees_company_created_at
idx_leave_requests_employee_id
idx_payroll_runs_company_status
```

For special indexes:

```text
uq_<table>_<rule>
```

for unique constraints/indexes.

---

# 134. INDEX NAME LENGTH

PostgreSQL identifier length is limited.

Keep names:

```text
short
descriptive
consistent
```

Avoid giant names containing every business phrase.

---

# 135. INDEX CREATION TEMPLATE

Standard:

```sql
create index idx_employees_company_status
on public.employees (
    company_id,
    status
);
```

Partial:

```sql
create index idx_active_employees_company_created
on public.employees (
    company_id,
    created_at desc
)
where deleted_at is null;
```

GIN:

```sql
create index idx_settings_gin
on public.company_module_settings
using gin(settings);
```

---

# 136. INDEX COMMENT

For important indexes, document purpose where useful.

Example:

```sql
comment on index idx_employees_company_status_created
is 'Supports active employee listing by tenant with newest-first ordering.';
```

Use documentation intentionally.

---

# 137. INDEX REVIEW WORKFLOW

When asked:

> "Add indexes to this table."

Do NOT immediately generate SQL.

First:

```text
1. Inspect table structure.
2. Inspect existing indexes.
3. Identify actual query patterns.
4. Identify RLS predicates.
5. Identify FK relationships.
6. Estimate table size.
7. Identify sorting/pagination.
8. Identify search requirements.
9. Identify write frequency.
10. Design minimal useful index set.
11. Check redundancy.
12. Generate SQL.
13. Validate with EXPLAIN.
```

---

# 138. INDEX REVIEW MODE

When reviewing existing indexes, classify:

```text
Critical
Useful
Redundant
Potentially redundant
Low selectivity
Unused
Missing
Overly wide
Wrong column order
Wrong index type
```

Do not simply say:

```text
"Looks good."
```

---

# 139. QUERY-FIRST INDEX ANALYSIS

For every important query record:

```text
WHERE
JOIN
ORDER BY
GROUP BY
LIMIT
SELECT columns
RLS predicates
```

Then design the access path.

---

# 140. QUERY EXAMPLE

Given:

```sql
select
    id,
    employee_code,
    first_name,
    last_name
from employees
where company_id = $1
and status = 'active'
order by created_at desc
limit 50;
```

Analyze:

```text
Equality:
company_id

Equality:
status

Ordering:
created_at desc

Limit:
50
```

Potential:

```text
(company_id, status, created_at desc)
```

Then benchmark.

---

# 141. QUERY EXAMPLE — EMPLOYEE LOOKUP

Query:

```sql
select *
from employees
where company_id = $1
and employee_code = $2;
```

Natural uniqueness:

```text
unique(company_id, employee_code)
```

The unique constraint already provides the necessary index.

Do not add another identical index.

---

# 142. QUERY EXAMPLE — MANAGER LOOKUP

Query:

```sql
select *
from employees
where company_id = $1
and manager_id = $2;
```

Potential:

```text
(company_id, manager_id)
```

especially if this query is common.

---

# 143. QUERY EXAMPLE — RECENT ACTIVITY

Query:

```sql
select *
from audit_logs
where company_id = $1
order by created_at desc
limit 100;
```

Potential:

```text
(company_id, created_at desc)
```

For huge append-only audit tables, evaluate whether BRIN or partitioning becomes appropriate.

---

# 144. QUERY EXAMPLE — PENDING ITEMS

Query:

```sql
select *
from leave_requests
where company_id = $1
and status = 'pending'
order by created_at desc
limit 50;
```

Potential:

```text
(company_id, status, created_at desc)
```

or:

```text
(company_id, created_at desc)
where status = 'pending'
```

Choose based on broader workload.

---

# 145. QUERY EXAMPLE — ACTIVE ONLY

Query:

```sql
where company_id = $1
and deleted_at is null
```

Potential:

```text
(company_id)
where deleted_at is null
```

If sorting:

```text
(company_id, created_at desc)
where deleted_at is null
```

---

# 146. QUERY EXAMPLE — GLOBAL EXTERNAL ID

Query:

```sql
where provider = $1
and external_id = $2;
```

Potential:

```text
unique(provider, external_id)
```

This simultaneously provides:

```text
integrity
lookup performance
idempotency
```

---

# 147. INDEX + UNIQUE

Whenever a business identifier is unique, prefer one structure that handles both.

Example:

```sql
unique(company_id, employee_code)
```

instead of:

```text
unique(company_id, employee_code)
+
index(company_id, employee_code)
```

unless there is a specific reason.

---

# 148. INDEX + FOREIGN KEY

When a foreign key is also frequently queried:

```text
employee_id
```

a separate index may be appropriate.

Example:

```sql
create index idx_attendance_employee
on attendance_records(employee_id);
```

But if the query is always:

```text
company_id + employee_id + date
```

a composite index may be superior:

```text
(company_id, employee_id, attendance_date)
```

---

# 149. COVERING INDEX DECISION

For a frequently executed small result query:

```text
filter
+
sort
+
small projection
```

consider:

```text
INCLUDE
```

only after measuring.

Do not optimize prematurely.

---

# 150. INDEX DESIGN FOR HRMS

High-value candidate domains:

```text
employees
attendance_records
leave_requests
payroll_runs
payroll_items
notifications
audit_logs
company_members
documents
```

Common patterns:

```text
company_id
employee_id
status
created_at
date
effective_to
external_id
```

But create indexes from actual queries.

---

# 151. EMPLOYEES

Potential:

```text
(company_id, status, created_at desc)
(company_id, department_id, status)
(company_id, employee_code)
```

Do not create all automatically.

Select based on UI/API access patterns.

---

# 152. ATTENDANCE

Potential:

```text
(company_id, employee_id, attendance_date)
(company_id, attendance_date)
(employee_id, check_in_at)
```

depending on:

```text
employee history
daily dashboard
date reports
company reporting
```

---

# 153. LEAVE REQUESTS

Potential:

```text
(company_id, status, created_at desc)
(company_id, employee_id, start_date)
```

Potential partial:

```text
(company_id, created_at desc)
where status = 'pending'
```

---

# 154. PAYROLL

Potential:

```text
(company_id, payroll_period_start, payroll_period_end)
(company_id, status)
(payroll_run_id, employee_id)
```

If:

```text
payroll_run_id + employee_id
```

is unique, use:

```text
unique(payroll_run_id, employee_id)
```

which already provides an index.

---

# 155. SALARY HISTORY

Potential:

```text
unique(employee_id) where effective_to is null
```

via partial unique index.

This is both:

```text
business integrity
+
current-record lookup
```

---

# 156. COMPANY SETTINGS

For:

```text
company_module_settings
```

use:

```text
unique(company_id, module)
```

This is usually enough for direct lookup:

```sql
where company_id = $1
and module = $2;
```

Do not add another identical index.

---

# 157. COMPANY MEMBERS

Common:

```text
where user_id = $1
and company_id = $2
```

Potential:

```text
unique(user_id, company_id)
```

If the business allows historical memberships, use a partial unique index for active membership.

---

# 158. AUDIT LOGS

Common:

```text
where company_id = $1
order by created_at desc
limit ...
```

Potential:

```text
(company_id, created_at desc)
```

For very large datasets:

```text
partitioning
+
BRIN
```

may eventually be considered.

---

# 159. NOTIFICATIONS

Common:

```sql
where user_id = $1
and read_at is null
order by created_at desc
limit 20;
```

Potential partial index:

```sql
create index idx_unread_notifications
on notifications(user_id, created_at desc)
where read_at is null;
```

This is a strong pattern.

---

# 160. QUEUES

For job queues:

```text
status
available_at
created_at
```

may require specialized indexes.

Example conceptual:

```text
where status = 'pending'
and available_at <= now()
order by available_at
limit ...
```

Index carefully because queue tables are write-heavy and concurrency-sensitive.

---

# 161. INDEXING `NULL`

B-tree indexes can index NULL values.

Do not assume:

```text
NULL
```

means:

```text
not indexed
```

Partial indexes can still be used to focus on:

```text
IS NULL
IS NOT NULL
```

when appropriate.

---

# 162. NULL PARTIAL INDEX

Example:

```sql
create index idx_unprocessed_events
on webhook_events(created_at)
where processed_at is null;
```

Useful when only unprocessed records matter.

---

# 163. INDEXING STATUS HISTORY

If:

```text
status
```

changes frequently, avoid over-indexing it.

A partial index for active states may be better than indexing all statuses.

---

# 164. INDEXING ENUMS

Enums can be indexed like ordinary values.

But low cardinality still matters.

Do not index every enum column automatically.

---

# 165. INDEXING UUIDS

UUIDs are index-friendly.

Common:

```text
primary key
foreign keys
external references
```

Use B-tree by default.

Do not avoid UUIDs because:

> "UUIDs can't be indexed."

They can.

---

# 166. RANDOM UUID PERFORMANCE

Random UUID insertion can have different B-tree locality characteristics compared with sequential identifiers.

At very large scale, consider UUID generation strategy and workload.

Do not prematurely optimize.

---

# 167. UUIDv7 / TIME-ORDERED IDs

If the architecture uses time-ordered UUIDs such as UUIDv7, they can improve insertion locality and chronological ordering characteristics.

Use only if supported consistently across the stack.

Do not redesign an existing system solely for this without evidence.

---

# 168. INDEXING CREATED_AT WITH UUID

For stable pagination:

```text
created_at
+
id
```

can be useful.

Example:

```text
(company_id, created_at desc, id desc)
```

This provides deterministic ordering.

---

# 169. INDEXING DELETED_AT

Do not automatically create:

```text
index(deleted_at)
```

if almost all rows are:

```text
deleted_at = null
```

A partial index on active rows is often more useful.

---

# 170. INDEXING ARCHIVED DATA

If most queries operate on active data:

```text
where archived_at is null
```

use a partial index.

If analytical queries frequently scan archived data, a separate reporting strategy may be better.

---

# 171. INDEXING DATE RANGES

Queries like:

```sql
where start_date <= $end
and end_date >= $start
```

are overlap queries.

A normal B-tree may not efficiently solve all overlap patterns.

Consider:

```text
range types
GiST
exclusion constraints
```

when appropriate.

---

# 172. INDEXING PERIODS

For:

```text
employee_salary_history
```

or:

```text
leave periods
```

consider representing periods with:

```text
daterange
tstzrange
```

when range operations are central to the domain.

Then use appropriate GiST indexing.

---

# 173. INDEXING GROUP BY

Do not automatically create indexes for every:

```text
GROUP BY
```

query.

Aggregations may still need to process many rows.

For repeated analytical workloads consider:

```text
summary tables
materialized views
```

---

# 174. INDEXING COUNT DISTINCT

Indexes may help lookup/filtering, but do not expect an ordinary index to magically make:

```text
count(distinct employee_id)
```

instant.

For dashboards, pre-aggregation may be better.

---

# 175. INDEXING AGGREGATIONS

Use indexes to reduce the rows entering an aggregation.

Do not assume an index eliminates aggregation cost.

---

# 176. INDEXING VIEWS

Normal PostgreSQL views do not store data independently.

Indexes belong to underlying tables.

Materialized views can have their own indexes.

---

# 177. MATERIALIZED VIEW INDEXING

For:

```text
dashboard_summary
```

you may create:

```text
unique index
filter indexes
sort indexes
```

on the materialized view.

Design based on dashboard access patterns.

---

# 178. INDEXING SEARCH RESULTS

If UI supports:

```text
search employees
filter department
filter status
sort joining date
```

do not create one index per UI control.

Identify the dominant combinations.

Use:

```text
composite indexes
trigram
full-text
```

where appropriate.

---

# 179. UI FILTER EXPLOSION

A table may have:

```text
10 filters
5 sorts
```

This does NOT mean:

```text
50 indexes
```

are required.

Use workload analysis.

---

# 180. INDEX DESIGN FOR DATA TABLES

For admin tables, identify:

```text
default query
common filter combinations
default sort
search behavior
pagination strategy
```

Then create indexes for the common paths.

---

# 181. INDEXING EXPORTS

Large CSV/report exports should not necessarily depend on one giant index.

Exports may require:

```text
batching
keyset pagination
read replicas
reporting tables
background jobs
```

depending on scale.

---

# 182. INDEXING BACKGROUND JOBS

For worker processing:

```text
status
available_at
priority
created_at
```

can form specialized composite/partial indexes.

But concurrent queue processing may require row locking strategies such as:

```text
FOR UPDATE SKIP LOCKED
```

and appropriate indexes.

---

# 183. INDEX + SKIP LOCKED

For:

```sql
select ...
from jobs
where status = 'pending'
order by available_at
for update skip locked
limit 10;
```

design the index around:

```text
status
available_at
```

Potential:

```text
(status, available_at)
```

or partial:

```text
(available_at)
where status = 'pending'
```

Benchmark under concurrent workers.

---

# 184. INDEXING WEBHOOK EVENTS

Strong pattern:

```text
unique(provider, external_event_id)
```

plus:

```text
processed_at
```

or status-based partial index for unprocessed events.

This supports both:

```text
idempotency
+
processing queue
```

---

# 185. INDEXING EXTERNAL IDS

External IDs should usually be indexed if they are used for:

```text
lookup
webhook matching
synchronization
upserts
```

Prefer unique when business identity guarantees uniqueness.

---

# 186. INDEXING EMAIL

If login/user lookup uses:

```text
email
```

index it.

If unique:

```text
unique(email)
```

may already provide the index.

For case-insensitive:

```text
lower(email)
```

or `citext`.

---

# 187. INDEXING PHONE

If phone lookup is common:

```text
phone_normalized
```

may need an index.

Do not index formatted phone strings if the application searches canonicalized values.

---

# 188. INDEXING CODES

Business codes are often excellent B-tree index candidates:

```text
employee_code
invoice_number
payroll_number
department_code
external_id
```

If unique, prefer UNIQUE.

---

# 189. INDEXING TEXT NAMES

For:

```text
exact match
```

B-tree may work.

For:

```text
prefix
```

B-tree may work depending on collation/operator.

For:

```text
substring/fuzzy
```

consider trigram.

For:

```text
natural language
```

consider full-text search.

---

# 190. INDEXING JSONB VS COLUMNS

If:

```text
settings->>'timezone'
```

becomes a major query predicate:

Do not blindly keep:

```text
everything in JSONB
```

Consider:

```text
timezone text
```

as a relational column.

Indexes are often a signal that a field has become important enough to deserve first-class schema status.

---

# 191. INDEXING CUSTOM FIELDS

If users can define arbitrary employee fields:

```text
custom_fields JSONB
```

GIN may be appropriate for flexible searching.

But if one custom field becomes universally important:

```text
tax_region
```

consider promoting it to a real column.

---

# 192. INDEXING JSONB KEYS

GIN can support key existence/containment patterns.

But if the workload is dominated by one key:

```text
settings->>'timezone'
```

an expression index may be smaller and more targeted.

---

# 193. INDEXING LARGE TEXT

Do not B-tree index enormous free-form text fields just because they exist.

Use:

```text
full-text
trigram
specialized search
```

depending on requirements.

---

# 194. INDEXING BLOB/FILE DATA

Do not index:

```text
file contents
binary data
large document bodies
```

inside PostgreSQL unless a specialized search architecture is explicitly intended.

For Supabase Storage, index metadata instead.

---

# 195. STORAGE METADATA INDEXING

For:

```text
employee_documents
```

potential:

```text
(employee_id, created_at desc)
(company_id, document_type)
```

depending on queries.

Do not index storage paths unless they are frequently used for lookup.

---

# 196. INDEXING AUDIT LOG ENTITY

If queries frequently ask:

```text
all changes to employee X
```

potential:

```text
(company_id, entity_type, entity_id, created_at desc)
```

But if entity types are queried independently, a different order may be better.

Design from the exact query.

---

# 197. INDEXING ACTOR

If administrators ask:

```text
what actions did user X perform?
```

potential:

```text
(company_id, actor_user_id, created_at desc)
```

Again, workload determines final design.

---

# 198. INDEXING NOTIFICATIONS

Common:

```text
(user_id, created_at desc)
where read_at is null
```

is often more useful than:

```text
read_at
```

alone.

---

# 199. INDEXING LEAVE APPROVAL

Manager screen:

```sql
where company_id = $1
and status = 'pending'
and manager_id = $2
order by created_at desc;
```

Potential:

```text
(company_id, manager_id, status, created_at desc)
```

or a partial index focused on pending rows.

---

# 200. INDEXING EMPLOYEE DIRECTORY

Common:

```text
company_id
status
department_id
name
```

Potential indexes:

```text
(company_id, status, department_id)
```

and a separate search index for name if fuzzy search is required.

Do not create:

```text
company_id
status
department_id
first_name
last_name
email
phone
```

as one giant index.

---

# 201. INDEX DESIGN OUTPUT

When generating indexes, produce:

```text
## Query Pattern

## Current Indexes

## Proposed Index

## Index Type

## Column Order

## Partial Predicate

## Why

## Expected Benefit

## Trade-offs

## Validation Query
```

---

# 202. INDEX REVIEW OUTPUT

When reviewing existing indexes:

```text
## Critical Problems

## Missing Indexes

## Redundant Indexes

## Incorrect Column Order

## Overly Wide Indexes

## Low-Value Indexes

## RLS Performance

## High-Write Risks

## Recommended Changes

## Validation Plan
```

---

# 203. MASTER INDEX DESIGN WORKFLOW

Always execute:

```text
INSPECT SCHEMA
      ↓
INSPECT EXISTING INDEXES
      ↓
COLLECT REAL QUERIES
      ↓
IDENTIFY RLS PREDICATES
      ↓
IDENTIFY FILTERS
      ↓
IDENTIFY JOINS
      ↓
IDENTIFY SORTING
      ↓
IDENTIFY PAGINATION
      ↓
IDENTIFY SEARCH TYPE
      ↓
ESTIMATE CARDINALITY
      ↓
CHOOSE INDEX TYPE
      ↓
CHOOSE COLUMN ORDER
      ↓
CHOOSE PARTIAL/EXPRESSION/COVERING STRATEGY
      ↓
CHECK REDUNDANCY
      ↓
GENERATE SQL
      ↓
EXPLAIN ANALYZE
      ↓
MONITOR
```

---

# 204. MASTER INDEX DECISION TREE

```text
What operation is being optimized?
        │
        ├── Equality / Range / Sort
        │       ↓
        │     B-tree
        │
        ├── JSONB / Array / Full Text
        │       ↓
        │     GIN
        │
        ├── Range / Spatial / Exclusion
        │       ↓
        │     GiST
        │
        ├── Huge naturally ordered table
        │       ↓
        │     BRIN
        │
        └── Specialized equality
                ↓
              Evaluate Hash
```

Then:

```text
Filter?
  ↓
Join?
  ↓
Sort?
  ↓
Limit?
  ↓
RLS?
  ↓
Choose column order.
```

---

# 205. INDEX COLUMN ORDER MASTER RULE

For composite indexes, generally reason:

```text
Most important equality predicates
        ↓
Additional selective predicates
        ↓
Range predicates
        ↓
Ordering requirements
```

But do not treat this as a rigid mathematical law.

The actual query workload decides.

---

# 206. INDEX DESIGN PRIORITY

Prioritize indexes for:

```text
1. Extremely frequent queries
2. Latency-sensitive queries
3. Large tables
4. Highly selective lookups
5. RLS authorization lookups
6. Pagination queries
7. Critical background jobs
8. Important joins
9. Common filtering
10. Common sorting
```

---

# 207. INDEX DO-NOT-DO LIST

Never automatically:

```text
❌ index every column
❌ index every foreign key
❌ index every boolean
❌ index every timestamp
❌ index every status
❌ create duplicate indexes
❌ create giant composite indexes
❌ use GIN because JSONB exists
❌ use BRIN because table is large
❌ force index scans
❌ promise <1ms performance
❌ remove indexes without usage analysis
❌ use indexes as a replacement for schema design
```

---

# 208. PRODUCTION INDEX CHECKLIST

Before approving an index:

```text
[ ] Real query identified
[ ] Existing indexes inspected
[ ] Correct index type selected
[ ] Column order justified
[ ] Tenant scope considered
[ ] RLS considered
[ ] Selectivity considered
[ ] Sort considered
[ ] Pagination considered
[ ] Write overhead considered
[ ] Index width considered
[ ] Partial index considered
[ ] Expression index considered
[ ] Redundancy checked
[ ] Table size considered
[ ] Query plan tested
[ ] Migration strategy defined
```

---

# 209. FINAL MASTER RULE

Never ask:

> "Which columns should I index?"

Ask:

> **"Which queries need a faster access path, and what is the cheapest index structure that gives PostgreSQL that path?"**

The correct process is:

```text
QUERY
  ↓
ACCESS PATTERN
  ↓
CARDINALITY
  ↓
INDEX TYPE
  ↓
COLUMN ORDER
  ↓
PARTIAL / EXPRESSION / COVERING
  ↓
EXPLAIN ANALYZE
  ↓
PRODUCTION
```

---

# 210. FINAL PRINCIPLE

A production-grade database does NOT have:

> "Lots of indexes."

It has:

> **The right indexes for the right queries.**

Remember:

```text
Primary Key
→ already indexed

Unique Constraint
→ already indexed

Foreign Key
→ may need an index on child side

B-tree
→ default workhorse

Composite
→ query-shape driven

Partial
→ targeted active/pending/current data

Expression
→ transformed lookup

GIN
→ JSONB/array/full-text

GiST
→ ranges/exclusion/specialized operators

BRIN
→ huge naturally ordered tables

EXPLAIN ANALYZE
→ proof

pg_stat_user_indexes
→ production evidence
```

And the golden rule:

> **Do not optimize the schema based on imagination. Optimize the access patterns based on evidence.**

**Query first. Index second. Benchmark third. Ship last.**

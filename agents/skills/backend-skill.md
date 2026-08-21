# Production-Grade Backend, Browser Storage, API & Data Management Skill

## Skill Name

**Enterprise Backend, Data Fetching, Browser Storage & State Management**

## Purpose

Build backend-connected applications that are:

* secure
* fast
* scalable
* cache-efficient
* resilient
* predictable
* privacy-conscious
* production-ready
* optimized for large datasets
* optimized for repeated navigation
* resistant to unnecessary API calls
* safe against client-side data exposure

This skill is intended for modern SaaS applications, HRMS platforms, enterprise dashboards, analytics systems, admin panels, and multi-tenant applications.

---

# 1. Core Architecture Philosophy

The application must treat data as belonging to different lifetimes.

Every piece of data should be classified as one of:

```text
1. Server-authoritative data
2. Session data
3. Cached server data
4. UI state
5. Persistent user preference
6. Temporary browser data
7. Sensitive authentication data
8. Derived/computed data
```

Never store everything in one global state.

Never fetch everything on every page.

Never persist sensitive information unnecessarily.

---

# 2. Golden Data Rule

Before storing data anywhere, ask:

> Who owns this data?

If the server owns it:

**Server is the source of truth.**

If the browser only needs a temporary copy:

**Cache it.**

If the user controls the preference:

**Persist it.**

If it is authentication-sensitive:

**Use secure cookie/session mechanisms.**

If it is only visual state:

**Keep it in UI state.**

---

# 3. Data Ownership Model

Use this mental model:

```text
DATABASE
   ↓
API / SERVER
   ↓
SERVER CACHE
   ↓
CLIENT DATA CACHE
   ↓
UI
```

Never treat browser state as the authoritative database.

---

# 4. Recommended Application Layers

Use:

```text
UI
 ↓
Feature Hook
 ↓
Query / Mutation Layer
 ↓
Service Layer
 ↓
API Client
 ↓
Backend
 ↓
Database
```

Example:

```text
EmployeeTable
    ↓
useEmployees()
    ↓
employeeQueries
    ↓
employeeService.getEmployees()
    ↓
apiClient.get()
    ↓
Backend API
    ↓
Database
```

Avoid:

```text
Component
   ↓
fetch()
   ↓
Database
```

inside every component.

---

# 5. API Client

Create one centralized API client.

Example:

```ts
apiClient
```

Responsibilities:

* base URL
* headers
* authentication
* request IDs
* timeout
* error normalization
* retry policy
* response parsing
* logging
* cancellation

Do not repeat API configuration throughout the application.

---

# 6. API Request Structure

Use consistent requests.

Example:

```text
GET    /employees
GET    /employees/:id
POST   /employees
PATCH  /employees/:id
DELETE /employees/:id
```

For nested resources:

```text
GET /employees/:id/documents
GET /employees/:id/attendance
```

Keep endpoints predictable.

---

# 7. API Response Structure

Use a consistent response contract.

Example:

```json
{
  "data": {},
  "error": null,
  "meta": {}
}
```

For lists:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 1200
  },
  "error": null
}
```

Never make every endpoint return a completely different structure without a strong reason.

---

# 8. API Error Structure

Use standardized errors.

Example:

```json
{
  "error": {
    "code": "EMPLOYEE_NOT_FOUND",
    "message": "Employee could not be found.",
    "details": null
  }
}
```

Frontend should not depend on parsing random backend error strings.

Use machine-readable error codes.

---

# 9. HTTP Status Codes

Use status codes correctly.

```text
200 → Success
201 → Created
204 → Success without body

400 → Invalid request
401 → Unauthenticated
403 → Unauthorized
404 → Not found
409 → Conflict
422 → Validation failure
429 → Rate limited

500 → Server error
502 → Upstream failure
503 → Service unavailable
```

Do not return `200` for every situation.

---

# 10. Authentication

Authentication must be server-controlled.

The browser must never be treated as proof of identity.

The backend must validate:

```text
identity
session
token
permissions
tenant/company
resource ownership
```

---

# 11. Authentication Storage

Sensitive authentication credentials should generally **not** be stored in:

```text
localStorage
sessionStorage
IndexedDB
```

Prefer secure cookie-based session mechanisms where appropriate.

Recommended cookie properties:

```text
HttpOnly
Secure
SameSite=Lax/Strict
appropriate expiration
minimal scope
```

---

# 12. HttpOnly Cookies

Sensitive session cookies should preferably be:

```text
HttpOnly
```

This prevents normal JavaScript from reading them.

Example concept:

```text
Browser
   ↓
Cookie automatically attached
   ↓
Server
```

instead of:

```text
localStorage
   ↓
JavaScript reads token
   ↓
fetch()
```

---

# 13. Cookie Security

Authentication cookies should use:

```text
Secure
```

in production.

Meaning:

> Send only over HTTPS.

Use:

```text
SameSite=Lax
```

or:

```text
SameSite=Strict
```

where application requirements allow.

For cross-site scenarios, carefully evaluate:

```text
SameSite=None
+
Secure
```

Do not use `SameSite=None` casually.

---

# 14. Cookie Scope

Keep cookies narrowly scoped.

Where appropriate:

```text
Domain
Path
Expiration
SameSite
Secure
HttpOnly
```

Do not create huge cookies.

Cookies are transmitted with requests, so oversized cookies increase network overhead.

---

# 15. Cookie Rule

Do not store:

```text
employee lists
dashboard datasets
payroll records
large JSON objects
API responses
charts
table data
```

inside cookies.

Cookies are primarily for:

```text
session
authentication
small preferences
security-related state
```

---

# 16. CSRF Protection

If authentication relies on cookies, evaluate CSRF protection.

Use appropriate mechanisms such as:

```text
SameSite cookies
CSRF tokens
origin validation
anti-CSRF middleware
```

Do not assume CORS is CSRF protection.

---

# 17. Browser Storage Decision Tree

Before storing data:

```text
Is it sensitive authentication data?
    ↓
YES → Secure HttpOnly cookie/session

NO
 ↓

Is it server-owned application data?
    ↓
YES → TanStack Query / client cache

NO
 ↓

Is it user preference?
    ↓
YES → localStorage or server profile

NO
 ↓

Is it temporary per-tab state?
    ↓
YES → sessionStorage / URL / memory

NO
 ↓

Keep it in memory/UI state
```

---

# 18. localStorage

Use localStorage for small, non-sensitive persistent preferences.

Good examples:

```text
theme
sidebar collapsed state
table density
preferred dashboard layout
last selected view
non-sensitive UI preferences
```

Example:

```ts
localStorage.setItem(
  "dashboard-density",
  "comfortable"
);
```

Do NOT store:

```text
password
access token
refresh token
session secret
payroll dataset
sensitive employee data
```

---

# 19. sessionStorage

Use sessionStorage for temporary tab/session-specific information.

Good examples:

```text
temporary wizard progress
dismissed onboarding for current tab
temporary filter state
one-time UI state
```

Remember:

> sessionStorage is still accessible to JavaScript.

Therefore it is not a secure secret store.

---

# 20. IndexedDB

Use IndexedDB when browser-side persistence genuinely requires larger structured data.

Suitable use cases:

```text
offline application data
large client-side datasets
document metadata
offline queues
complex local cache
```

Do not introduce IndexedDB just because it exists.

For ordinary SaaS dashboards, a query cache is often sufficient.

---

# 21. Memory State

Keep temporary UI state in memory.

Examples:

```text
modal open/closed
selected tab
hover state
temporary form state
dropdown state
active drawer
unsaved UI state
```

Use:

```text
React state
Zustand
component state
```

depending on scope.

---

# 22. URL State

Use URL parameters for state that should be:

* shareable
* bookmarkable
* navigable
* persisted through refresh

Examples:

```text
/employees?department=engineering
/employees?status=active
/attendance?date=2026-08-16
/reports?period=monthly
```

Excellent for:

```text
filters
search
sorting
pagination
tabs
date ranges
```

---

# 23. State Classification

Example:

| Data             | Location                                  |
| ---------------- | ----------------------------------------- |
| Auth session     | Secure cookie/session                     |
| Employee list    | Query cache                               |
| Theme            | localStorage                              |
| Sidebar state    | localStorage                              |
| Modal state      | React state                               |
| Search query     | URL state                                 |
| Table pagination | URL state                                 |
| Temporary form   | React Hook Form                           |
| Offline data     | IndexedDB if required                     |
| Permissions      | Server-derived + short-lived client cache |
| Payroll data     | Query cache, not localStorage             |

---

# 24. Server State vs Client State

This distinction is critical.

### Server State

Data that exists on the server:

```text
employees
attendance
payroll
departments
permissions
reports
notifications
```

Use:

```text
TanStack Query
```

### Client State

Data that exists only because the UI needs it:

```text
sidebarOpen
modalOpen
selectedEmployee
theme
temporary filters
```

Use:

```text
React state
Zustand
URL state
```

Do not put server data into Zustand by default.

---

# 25. TanStack Query Architecture

Recommended structure:

```text
Query
 ↓
Cache
 ↓
Component
```

Example:

```ts
const {
  data,
  isLoading,
  isFetching,
  error,
} = useQuery({
  queryKey: ["employees", filters],
  queryFn: () => employeeService.list(filters),
});
```

---

# 26. Query Keys

Query keys must be deterministic.

Good:

```ts
["employees", "list", filters]
```

```ts
["employees", "detail", employeeId]
```

Bad:

```ts
["data"]
```

for everything.

---

# 27. Query Key Factory

Use a centralized query key factory.

Example:

```ts
export const employeeKeys = {
  all: ["employees"] as const,

  lists: () =>
    [...employeeKeys.all, "list"] as const,

  list: (filters: EmployeeFilters) =>
    [...employeeKeys.lists(), filters] as const,

  details: () =>
    [...employeeKeys.all, "detail"] as const,

  detail: (id: string) =>
    [...employeeKeys.details(), id] as const,
};
```

This prevents cache collisions.

---

# 28. Cache Strategy

Every query should have an intentional freshness strategy.

Consider:

```text
staleTime
gcTime
refetchOnWindowFocus
refetchOnReconnect
retry
```

Do not use the same settings for every query.

---

# 29. Data Freshness Classification

### Static

Examples:

```text
countries
currencies
roles
department types
```

Long cache.

### Semi-static

Examples:

```text
departments
company settings
employee metadata
```

Medium cache.

### Dynamic

Examples:

```text
attendance
notifications
dashboard metrics
```

Shorter freshness.

### Highly sensitive / real-time

Examples:

```text
payroll processing status
live attendance
critical alerts
```

Use targeted refresh/realtime mechanisms.

---

# 30. Avoid API Spam

Bad:

```text
Every component
    ↓
fetch()
```

This causes:

```text
duplicate requests
slow UI
database load
rate limits
unnecessary bandwidth
```

Instead:

```text
Shared query
    ↓
Cache
    ↓
Multiple components
```

---

# 31. Request Deduplication

If five components require the same data:

```text
Component A ─┐
Component B ─┤
Component C ─┼→ Query Cache → One request
Component D ─┤
Component E ─┘
```

Do not issue five identical requests.

---

# 32. Parallel Data Fetching

If independent data is required:

```text
Employees
Attendance
Leave
Payroll
```

fetch them concurrently.

Do not unnecessarily do:

```text
await employees
await attendance
await leave
await payroll
```

if they are independent.

Use parallel query mechanisms.

---

# 33. Dependent Queries

Only wait when data genuinely depends on another request.

Example:

```text
Get employee
      ↓
Get employee documents
```

Do not serialize unrelated requests.

---

# 34. Waterfall Prevention

Avoid:

```text
Page
 ↓
User
 ↓
Company
 ↓
Employees
 ↓
Attendance
```

when the data could have been resolved earlier or concurrently.

Waterfalls make dashboards feel slow.

---

# 35. API Pagination

Never download thousands of records just to display 25 rows.

Use:

```text
page
pageSize
cursor
```

depending on backend architecture.

For large datasets, cursor pagination is often preferable.

---

# 36. Cursor Pagination

Example:

```text
GET /employees?limit=25&cursor=abc123
```

Response:

```json
{
  "data": [],
  "nextCursor": "xyz789"
}
```

This is useful for large datasets and infinite scrolling.

---

# 37. Table Data Strategy

For enterprise tables:

```text
Search
Filter
Sort
Pagination
Column visibility
Server-side query
```

Do not fetch the entire database and filter thousands of records in the browser.

---

# 38. Search Strategy

Search should generally be server-side for large datasets.

Use debounce:

```text
User types
 ↓
wait 250–400ms
 ↓
API request
```

Cancel stale requests when appropriate.

---

# 39. Abort Requests

When a request becomes irrelevant, cancel it.

Example concept:

```ts
fetch(url, {
  signal: controller.signal
});
```

Useful for:

```text
search
rapid filter changes
route changes
component unmount
```

---

# 40. Request Race Conditions

Avoid:

```text
Search "John"
Search "Johnson"
```

where the slower first request returns after the second request and overwrites newer data.

Use:

```text
AbortController
query cancellation
request identity
query cache
```

---

# 41. Mutations

Use dedicated mutation logic for:

```text
POST
PATCH
PUT
DELETE
```

Example:

```text
useCreateEmployee()
useUpdateEmployee()
useDeleteEmployee()
```

Do not manually manage mutation state everywhere.

---

# 42. Mutation Lifecycle

A mutation should support:

```text
idle
pending
success
error
```

and optionally:

```text
optimistic update
rollback
cache invalidation
```

---

# 43. Cache Invalidation

After changing an employee:

```text
Update employee
 ↓
Invalidate employee detail
 ↓
Invalidate relevant employee list
 ↓
Refresh dependent metrics if required
```

Do not blindly invalidate the entire application.

---

# 44. Surgical Cache Updates

When possible, directly update known cache entries.

Example:

```text
Employee name changed
 ↓
Update detail cache
 ↓
Update affected list cache
```

This reduces unnecessary network requests.

---

# 45. Optimistic Updates

For low-risk UI operations:

```text
Toggle notification
Mark read
Favorite
Change simple status
```

Perform:

```text
UI update
 ↓
Server mutation
 ↓
Rollback if failed
```

---

# 46. Do NOT Optimistically Fake Critical Transactions

Avoid optimistic UI for:

```text
payroll processing
bank changes
salary changes
permission escalation
employee termination
financial transactions
```

Use authoritative server confirmation.

---

# 47. Realtime Data

Use realtime only where it provides meaningful value.

Examples:

```text
attendance status
notifications
live approvals
processing status
chat
collaborative changes
```

Do not subscribe every dashboard component to realtime updates.

---

# 48. Realtime Architecture

Prefer:

```text
Realtime event
 ↓
Determine affected entity
 ↓
Update/invalidate specific query
```

instead of:

```text
Realtime event
 ↓
Reload entire application
```

---

# 49. Polling

Use polling when realtime is unnecessary or unavailable.

Example:

```text
Payroll processing status
```

Poll:

```text
every 5–15 seconds
```

only while relevant.

Stop polling when:

```text
completed
failed
user leaves page
```

---

# 50. Background Refetch

For dashboard data:

```text
show cached data
 ↓
background refresh
 ↓
update UI if changed
```

This creates a fast perceived experience.

---

# 51. Stale-While-Revalidate

Preferred UX:

```text
Existing data
      ↓
Show immediately
      ↓
Fetch fresh data
      ↓
Update if changed
```

Do not blank the screen unnecessarily.

---

# 52. Loading Strategy

Differentiate:

```text
Initial loading
Background fetching
Refreshing
Mutating
```

Do not show a full-screen spinner every time a query refreshes.

---

# 53. Skeleton vs Spinner

Use skeletons for:

```text
initial page loading
large content
tables
cards
charts
```

Use spinners for:

```text
small button action
tiny localized operation
```

---

# 54. Prefetching

Prefetch when navigation is predictable.

Example:

```text
Hover employee row
 ↓
Prefetch employee detail
 ↓
Click
 ↓
Detail appears quickly
```

Do not prefetch enormous datasets.

---

# 55. Data Transformation

Transform server data at the service/query boundary.

Avoid repeatedly transforming the same data in components.

Example:

```text
API response
 ↓
normalize
 ↓
typed model
 ↓
UI
```

---

# 56. Normalization

Normalize only when it genuinely simplifies the application.

For example:

```text
employeesById
departmentsById
```

can help with complex relationships.

Do not normalize every tiny response.

---

# 57. Derived Data

Do not store data that can be calculated.

Bad:

```text
employees
employeeCount
activeEmployeeCount
```

when counts can be derived.

Prefer:

```text
employees
 ↓
computed count
```

This prevents stale duplicated state.

---

# 58. Backend Aggregation

For dashboard metrics, do not download huge datasets simply to calculate:

```text
headcount
attendance %
leave count
payroll total
```

Prefer backend/database aggregation.

Example:

```text
Database
 ↓
COUNT()
SUM()
AVG()
GROUP BY
 ↓
Dashboard API
```

This dramatically reduces payload size.

---

# 59. Dashboard API

Consider a dedicated dashboard summary endpoint.

Example:

```text
GET /dashboard/summary
```

Response:

```json
{
  "headcount": 1248,
  "attendanceRate": 94.2,
  "pendingLeaves": 18,
  "payrollExceptions": 2
}
```

Do not make the dashboard execute 20 unrelated requests when one well-designed aggregation endpoint can provide the summary efficiently.

---

# 60. But Avoid Giant API Responses

Do not create:

```text
/dashboard/everything
```

containing:

```text
employees
documents
attendance
payroll
leave
reports
settings
notifications
```

A giant endpoint becomes difficult to cache, secure and maintain.

Use domain-oriented endpoints.

---

# 61. API Payload Optimization

Return only what the screen needs.

Bad:

```text
Employee
+
documents
+
education
+
bank
+
attendance
+
payroll
+
leave
+
history
```

for an employee list.

Good:

```json
{
  "id": "123",
  "name": "John",
  "department": "Engineering",
  "role": "Developer",
  "status": "Active"
}
```

Fetch detailed information only when required.

---

# 62. Field Selection

Where supported, allow APIs to request only necessary fields.

Example:

```text
GET /employees?fields=id,name,department,status
```

Do this only if backend architecture benefits from it.

---

# 63. Compression

Use modern response compression:

```text
Brotli
gzip
```

especially for:

```text
JSON
JavaScript
CSS
```

---

# 64. Database Rule

Never solve a database performance problem by downloading more data into the browser.

Optimize:

```text
indexes
queries
joins
aggregations
pagination
RPCs/functions
materialized summaries
```

first.

---

# 65. Database Indexing

Index columns used frequently for:

```text
WHERE
JOIN
ORDER BY
UNIQUE
tenant filtering
```

For multi-tenant SaaS, commonly consider indexes involving:

```text
company_id
organization_id
user_id
status
created_at
```

based on actual query patterns.

Do not blindly index every column.

---

# 66. Multi-Tenant Data

Every tenant/company query must enforce tenant isolation.

Example:

```text
company_id
```

must be enforced server-side/database-side.

Never trust:

```text
company_id
```

sent by the browser as authorization.

---

# 67. Authorization

The frontend can hide unavailable functionality.

But the backend must enforce:

```text
user identity
role
permission
company
resource ownership
```

Frontend authorization is UX.

Backend authorization is security.

---

# 68. Row-Level Security

For Supabase/Postgres environments, use RLS where appropriate.

Concept:

```text
authenticated user
 ↓
company membership
 ↓
role/permission
 ↓
row access
```

Never rely solely on frontend filters.

---

# 69. Sensitive Data

Minimize exposure of:

```text
bank account details
salary
tax information
identity documents
personal information
authentication data
```

Only request sensitive fields when required.

---

# 70. Data Masking

For sensitive values:

```text
****1234
```

where appropriate.

Do not display complete sensitive values unnecessarily.

---

# 71. Browser Cache

Understand the difference between:

```text
HTTP cache
Query cache
localStorage
sessionStorage
IndexedDB
memory
```

They are not interchangeable.

---

# 72. HTTP Cache

Use server/cache headers where appropriate:

```text
Cache-Control
ETag
Last-Modified
```

Static assets can be aggressively cached.

Sensitive dynamic responses require careful cache policies.

---

# 73. Do Not Cache Sensitive Responses Publicly

Sensitive employee/payroll responses must not accidentally become shared browser/proxy cache entries.

Use appropriate:

```text
Cache-Control
```

policies.

---

# 74. localStorage Cache

Do not build a second complicated data-cache system using localStorage when TanStack Query already solves the problem.

Use localStorage mainly for:

```text
small preferences
```

not primary server state.

---

# 75. Persisted Query Cache

Persist query cache only when the UX genuinely benefits.

Potential examples:

```text
offline support
slow networks
large reference datasets
```

Do not persist sensitive data casually.

---

# 76. Logout Cleanup

Logout must clean appropriate client state.

Consider:

```text
query cache
memory state
temporary storage
user-specific persisted state
```

Do not leave previous user's sensitive data accessible after logout.

---

# 77. Company Switching

For multi-company SaaS:

```text
Company A
 ↓
switch
 ↓
Company B
```

must invalidate or partition company-specific caches.

Never allow:

```text
Company A employee data
```

to appear after switching to:

```text
Company B
```

---

# 78. Cache Namespacing

Include tenant context in query keys when necessary.

Example:

```ts
[
  "employees",
  companyId,
  filters
]
```

This prevents cross-company cache collisions.

---

# 79. Authentication Refresh

If sessions expire:

```text
API request
 ↓
401
 ↓
refresh session
 ↓
retry safely
```

Do not create infinite retry loops.

If refresh fails:

```text
clear session
redirect to login
```

---

# 80. Concurrent Refresh Protection

If ten requests receive `401` simultaneously:

Do NOT send ten refresh requests.

Use a single-flight mechanism:

```text
Request A ─┐
Request B ─┤
Request C ─┼→ One refresh
Request D ─┤
Request E ─┘
```

Then retry appropriate requests.

---

# 81. Retry Strategy

Do not retry everything.

Safe candidates:

```text
temporary network failure
502
503
504
```

Be cautious with:

```text
POST
DELETE
financial mutations
```

unless idempotency is guaranteed.

---

# 82. Idempotency

For critical operations, use idempotency keys where appropriate.

Example:

```text
POST /payroll/process
Idempotency-Key: abc123
```

If the same request is accidentally sent twice, backend can prevent duplicate processing.

Extremely important for financial operations.

---

# 83. Rate Limiting

Backend APIs should protect themselves.

Examples:

```text
login
search
exports
password reset
public endpoints
expensive reports
```

Use rate limits appropriate to the operation.

---

# 84. File Uploads

Do not upload huge files through the main API server if object storage is available.

Preferred:

```text
Frontend
 ↓
Signed upload URL
 ↓
Object storage
 ↓
Backend stores metadata
```

---

# 85. File Download

For protected files:

```text
User request
 ↓
Backend authorization
 ↓
Signed temporary URL
 ↓
File storage
```

Do not expose permanent public URLs for sensitive documents.

---

# 86. Export Jobs

Do not generate huge CSV/PDF exports synchronously inside a normal request.

Prefer:

```text
Create export job
 ↓
Background processing
 ↓
Status
 ↓
Completed
 ↓
Download
```

---

# 87. Large Reports

For large reports:

```text
Request
 ↓
Job created
 ↓
Worker processes
 ↓
Progress/status
 ↓
Notification
 ↓
Download
```

This prevents request timeouts.

---

# 88. API Timeouts

Every network request should have a reasonable timeout strategy.

Do not allow requests to hang forever.

Different operations may require different timeout policies.

---

# 89. Network Failure UX

If the network disappears:

```text
Offline indicator
Cached data remains visible
Retry action
Mutation queue if supported
```

Do not wipe the screen immediately.

---

# 90. Offline Strategy

If offline support is required:

```text
Read cached data
 ↓
Queue safe mutations
 ↓
Reconnect
 ↓
Sync
 ↓
Resolve conflicts
```

Do not pretend every application should be fully offline.

---

# 91. Conflict Resolution

For offline-capable applications, define:

```text
server wins
client wins
latest update wins
manual resolution
merge
```

before implementing sync.

---

# 92. WebSocket Discipline

Never open a new WebSocket per component.

Use a shared connection layer.

Bad:

```text
EmployeeCard → socket
AttendanceCard → socket
NotificationBell → socket
```

Good:

```text
Application realtime layer
 ↓
Multiple subscribers
```

---

# 93. Realtime Event Filtering

Only process relevant events.

Example:

```text
company_id
entity_type
entity_id
event_type
```

Filter before invalidating queries.

---

# 94. Background Jobs

Use background jobs for:

```text
reports
emails
notifications
large imports
exports
payroll calculations
document processing
scheduled tasks
```

Do not force the browser to wait for long-running work.

---

# 95. Long Operations

Instead of:

```text
POST /generate-report
(wait 45 seconds)
```

use:

```text
POST /report-jobs
 ↓
202 Accepted
 ↓
job ID
 ↓
GET /report-jobs/:id
```

or realtime status updates.

---

# 96. Audit Logging

Enterprise applications should record important actions.

Examples:

```text
employee.created
employee.updated
employee.deleted
payroll.processed
permission.changed
document.downloaded
settings.updated
```

Audit logs should include appropriate:

```text
actor
timestamp
action
entity
entity ID
company
metadata
```

Do not store secrets in audit logs.

---

# 97. Request Correlation

Use request IDs.

Example:

```text
X-Request-ID
```

This allows:

```text
Frontend error
 ↓
Request ID
 ↓
Backend logs
 ↓
Database/query trace
```

This dramatically improves debugging.

---

# 98. Logging Architecture

Separate:

```text
application logs
security logs
audit logs
performance logs
```

Do not dump everything into one giant log stream.

---

# 99. Observability

Monitor:

```text
API latency
error rate
database latency
slow queries
cache hit rate
request volume
authentication failures
background job failures
```

---

# 100. API Performance Targets

Do not treat these as universal guarantees, but use them as engineering goals.

Typical target:

```text
Simple API:
<200ms

Dashboard aggregation:
<500ms

Complex report:
background job

Database query:
as low as practical
```

Measure real performance instead of guessing.

---

# 101. Frontend Performance Rule

The UI should not wait for data that is not required for the first viewport.

Load:

```text
critical data
 ↓
render
 ↓
secondary data
 ↓
lazy features
```

---

# 102. Route-Level Code Splitting

Do not load every feature on initial application load.

Example:

```text
/dashboard
/employees
/attendance
/payroll
/reports
/settings
```

Load feature code when required.

---

# 103. Component-Level Lazy Loading

Heavy components can be lazy-loaded.

Examples:

```text
advanced chart editor
large report builder
PDF preview
rich text editor
map
```

---

# 104. Chart Performance

Do not render 10,000 SVG elements unnecessarily.

For large datasets:

```text
aggregation
sampling
canvas
virtualization
server-side aggregation
```

depending on charting technology.

---

# 105. Search Performance

For large datasets:

```text
User input
 ↓
debounce
 ↓
server search
 ↓
pagination
 ↓
cache
```

Never perform expensive full-table browser searches on every keystroke.

---

# 106. Form Performance

Use React Hook Form or equivalent for complex forms.

Do not rerender the entire page whenever one field changes.

Use:

```text
field-level subscriptions
validation schemas
controlled/uncontrolled appropriately
```

---

# 107. Validation

Validate at:

```text
Client
+
Server
```

Client validation:

```text
UX
```

Server validation:

```text
Security / correctness
```

Never trust client validation.

---

# 108. Schema Validation

Use a schema system such as:

```text
Zod
```

for:

```text
forms
API responses
environment variables
configuration
```

---

# 109. Environment Variables

Never expose secrets through client-side environment variables.

Anything bundled into frontend JavaScript should be considered public.

Never put:

```text
database password
service role key
private API key
secret signing key
```

into frontend environment variables.

---

# 110. Supabase-Specific Rule

For Supabase:

Frontend may use:

```text
publishable/anon client credentials
```

according to the project's security model.

Never expose:

```text
service_role
private server credentials
```

to the browser.

---

# 111. Supabase RLS

RLS must enforce:

```text
authenticated user
company membership
role
resource ownership
```

Do not depend on:

```text
frontend route guards
```

for data security.

---

# 112. Supabase Query Strategy

Avoid repeatedly requesting:

```text
SELECT *
```

Prefer selecting only required fields.

Example:

```text
select:
id,
name,
department_id,
status,
created_at
```

This reduces payload and improves clarity.

---

# 113. Database Query Optimization

When a query becomes slow:

Do not immediately add client-side caching.

First inspect:

```text
query plan
indexes
joins
filters
sort
aggregation
row count
```

Fix the actual bottleneck.

---

# 114. N+1 Query Prevention

Avoid:

```text
Get 100 employees
 ↓
100 department requests
```

Use:

```text
JOIN
batch query
embedded relation
```

where appropriate.

---

# 115. Batch Requests

If multiple independent entities are required:

```text
GET /employees?ids=1,2,3,4
```

can be preferable to:

```text
GET /employees/1
GET /employees/2
GET /employees/3
GET /employees/4
```

when the API supports it.

---

# 116. Data Fetching Checklist

For every new API integration ask:

```text
[ ] Is this data server-owned?
[ ] Should it be cached?
[ ] How long should it remain fresh?
[ ] Can requests be deduplicated?
[ ] Can requests run in parallel?
[ ] Does this need pagination?
[ ] Does this need server-side filtering?
[ ] Can payload size be reduced?
[ ] Does this need realtime?
[ ] Does it contain sensitive data?
[ ] Does it require authorization?
[ ] Does it require tenant isolation?
[ ] What happens offline?
[ ] What happens on 401?
[ ] What happens on 429?
[ ] What happens on 500?
```

---

# 117. Browser Storage Checklist

Before using browser storage:

```text
[ ] Is the data sensitive?
[ ] Does it need persistence?
[ ] Does it need to survive refresh?
[ ] Does it need to survive browser restart?
[ ] Does it need to be shared across tabs?
[ ] Does it belong in server state instead?
[ ] Can it simply remain in memory?
```

---

# 118. Storage Decision Table

| Requirement            | Recommended                                   |
| ---------------------- | --------------------------------------------- |
| Authentication session | Secure HttpOnly cookie/session                |
| Theme                  | localStorage                                  |
| Sidebar preference     | localStorage                                  |
| Temporary wizard state | sessionStorage/memory                         |
| Server API data        | TanStack Query                                |
| Search/filter          | URL state                                     |
| Modal state            | React state                                   |
| Large offline data     | IndexedDB                                     |
| Sensitive credentials  | Secure server-managed session                 |
| Payroll records        | Server/query cache                            |
| Employee list          | Query cache                                   |
| Company settings       | Query cache + optional persistence where safe |

---

# 119. Security Checklist

```text
[ ] HTTPS
[ ] Secure cookies
[ ] HttpOnly authentication cookies where appropriate
[ ] SameSite configured
[ ] CSRF strategy
[ ] Server-side authorization
[ ] Tenant isolation
[ ] RLS where applicable
[ ] No secrets in frontend
[ ] No service-role credentials in frontend
[ ] Input validation
[ ] Output validation
[ ] Rate limiting
[ ] Audit logging
[ ] Secure file access
[ ] Sensitive data minimization
[ ] Secure logout
```

---

# 120. Performance Checklist

```text
[ ] No duplicate API calls
[ ] Query caching enabled
[ ] Appropriate stale times
[ ] Pagination
[ ] Server-side search
[ ] Server-side filtering
[ ] Payload minimization
[ ] Request cancellation
[ ] Parallel requests
[ ] No unnecessary polling
[ ] Lazy loading
[ ] Code splitting
[ ] Database indexes
[ ] Aggregated dashboard APIs
[ ] Virtualized large tables
[ ] Optimized images
[ ] Compression
```

---

# 121. Architecture Example

Production architecture:

```text
                     ┌─────────────────┐
                     │      Browser    │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │   UI / React    │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │ Feature Hooks   │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │ TanStack Query  │
                     │ Client Cache    │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │  API Services   │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │ API / Backend   │
                     └────────┬────────┘
                              │
                 ┌────────────┼────────────┐
                 │            │            │
          ┌──────▼─────┐ ┌────▼─────┐ ┌───▼────────┐
          │ PostgreSQL │ │ Storage  │ │ Background │
          │ Database   │ │          │ │ Jobs       │
          └────────────┘ └──────────┘ └────────────┘
```

---

# 122. Recommended Xentra Architecture

For an enterprise HRMS:

```text
React
   ↓
TanStack Query
   ↓
Typed Service Layer
   ↓
Supabase
   ↓
PostgreSQL
```

Supporting systems:

```text
Supabase Auth
Supabase Storage
PostgreSQL RLS
Realtime
Edge Functions
Background jobs
```

---

# 123. Xentra Data Domains

Separate data by domain:

```text
Company
Employees
Departments
Attendance
Leave
Payroll
Documents
Work Pass
CPF
FWL
Analytics
Notifications
Settings
Audit Logs
```

Do not create one massive data service.

---

# 124. Xentra Dashboard Data

Dashboard should preferably request summarized data:

```text
dashboard.summary
dashboard.attendance
dashboard.leave
dashboard.payroll
dashboard.workforce
dashboard.actions
```

instead of loading the entire HR database.

---

# 125. Xentra Employee List

Employee table should use:

```text
server-side pagination
server-side search
server-side filters
server-side sorting
query cache
URL state
```

Example:

```text
/employees
  ?page=1
  &pageSize=25
  &search=krishna
  &department=engineering
  &status=active
```

---

# 126. Xentra Employee Detail

Load detailed information only when the employee detail page/drawer is opened.

Possible sections:

```text
Overview
Personal
Work
Attendance
Leave
Documents
Education
Bank
Payroll
Activity
```

Do not load all sections simultaneously if unnecessary.

---

# 127. Xentra Payroll

Payroll data requires stronger controls.

Use:

```text
server-side authorization
RLS
minimal payloads
audit logs
no localStorage persistence
no sensitive browser persistence
explicit confirmation
idempotent processing
background jobs for large payroll
```

---

# 128. Xentra Settings

Settings can be cached because they are relatively stable.

Example:

```text
company settings
payroll settings
attendance settings
leave settings
notification settings
```

After mutation:

```text
update
 ↓
invalidate only affected setting query
```

---

# 129. Xentra Permissions

Permissions should be loaded once per authenticated context and cached appropriately.

But every sensitive API request must still be authorized server-side.

Never assume:

```text
canEdit === true
```

in the browser means the user is actually authorized.

---

# 130. Final Engineering Principle

The browser is:

```text
presentation
+
temporary state
+
cache
```

The backend is:

```text
business logic
+
authorization
+
data ownership
+
security
```

The database is:

```text
persistent source of truth
```

Never reverse these responsibilities.

---

# 131. Final AI Agent Instructions

When implementing any feature, the AI must first determine:

```text
1. What data is needed?
2. Where does the data originate?
3. Who owns the data?
4. Is it sensitive?
5. How often does it change?
6. How large can it become?
7. Should it be cached?
8. Where should it be cached?
9. How should it be invalidated?
10. Does it need pagination?
11. Does it need realtime?
12. Does it need background processing?
13. What happens during failure?
14. What happens during logout?
15. What happens when switching companies?
16. What happens offline?
17. What permissions are required?
18. What happens when the session expires?
```

Only after answering these questions should implementation begin.

---

# 132. Non-Negotiable Rules

NEVER:

```text
store access tokens casually in localStorage
store passwords in browser storage
store sensitive payroll data in localStorage
expose service-role credentials
trust frontend authorization
fetch entire database tables for UI
use SELECT * unnecessarily
make duplicate API requests
create API calls inside every component
put server state into global UI state without reason
poll aggressively
open one realtime connection per component
ignore pagination
ignore tenant isolation
return giant API payloads
leave stale user data after logout
```

ALWAYS:

```text
use server as source of truth
use secure authentication architecture
use query caching
use typed API services
use consistent query keys
use pagination for large datasets
use server-side filtering
use server-side authorization
minimize payloads
cancel stale requests
handle loading/empty/error states
invalidate cache intentionally
protect tenant boundaries
design for failure
measure performance
```

---

# 133. Definition of Done

A backend-connected dashboard feature is complete only when:

```text
[ ] API contract defined
[ ] Types defined
[ ] Service layer implemented
[ ] Query/mutation hooks implemented
[ ] Query keys defined
[ ] Cache strategy defined
[ ] Loading state implemented
[ ] Error state implemented
[ ] Empty state implemented
[ ] Pagination implemented where required
[ ] Search optimized
[ ] Request cancellation considered
[ ] Authorization enforced
[ ] Tenant isolation enforced
[ ] Sensitive data minimized
[ ] Browser storage decision documented
[ ] Logout behavior handled
[ ] Company switching handled
[ ] Realtime/polling decision made
[ ] Database query optimized
[ ] API payload minimized
[ ] Security reviewed
[ ] Performance reviewed
[ ] Mobile behavior verified
[ ] Production error handling verified
```

---

# 134. Ultimate Rule

Build the system so that:

> **The browser remembers only what it should remember.**

> **The server decides only what the server should decide.**

> **The database stores only what must persist.**

> **The API sends only what the screen actually needs.**

> **The cache prevents unnecessary work.**

> **The UI never waits unnecessarily.**

> **Security never depends on the frontend.**

> **Performance is designed before problems appear.**

The result should feel invisible to the user:

**open → instant UI → cached information → fresh data → smooth interaction → minimal network activity → secure backend → predictable behavior.**

That is the standard for a production-grade Apple-level SaaS dashboard.

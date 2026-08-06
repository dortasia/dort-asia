# Xentra Data Loading & Caching Standards

Version: 1.0

This document defines how ALL data should be loaded throughout Xentra.

The objective is:

- Lightning-fast UI
- Enterprise scalability
- Lowest Supabase cost
- Minimum API requests
- Offline capability
- Realtime synchronization
- Native application experience

---

# Core Philosophy

The frontend should NEVER rely on requesting data every time a page is opened.

Every piece of data should follow:

Server
    ↓
Local Cache
    ↓
Instant UI
    ↓
Background Validation
    ↓
Realtime Updates

Users should never wait for data that already exists locally.

---

# Loading Priority

Always load data in this order.

Level 1
Memory Cache (React Query)

↓

Level 2
IndexedDB

↓

Level 3
Supabase

Never skip this order.

---

# Data Categories

Every data model belongs to one of these categories.

--------------------------------------------

Category A
Static Data

Examples

- Departments
- Companies
- Leave Types
- Roles
- Designations
- Holiday Calendar
- Country List
- Currency List
- Company Settings

Loading Strategy

Load once.

Store forever.

Update only when realtime notifies changes.

Never refetch every page.

--------------------------------------------

Category B

Semi Dynamic Data

Examples

- Employee Profile
- User Profile
- Teams
- Branches
- Managers

Loading Strategy

Load once.

Persist locally.

Refresh only when

- profile updated
- realtime event
- manual refresh

--------------------------------------------

Category C

Dynamic Data

Examples

- Attendance
- Leave Requests
- Claims
- Notifications
- Payroll Runs
- Tasks
- Announcements

Loading Strategy

Load locally first.

Then

Background Sync.

Realtime updates keep cache fresh.

--------------------------------------------

Category D

Large Data

Examples

- Audit Logs
- Activity Timeline
- Attendance History
- Payroll History

Loading Strategy

Never download everything.

Always use

- Pagination
- Cursor Pagination
- Infinite Scroll
- Date Range

---

# React Query Rules

Every API request must use

TanStack Query.

Never use

fetch()

inside components.

Never duplicate requests.

Every query needs

queryKey

Example

employees

employee

attendance

notifications

Always cache queries.

---

# IndexedDB Rules

Use

Dexie

or

React Query Persistence.

Store

- employee list
- company
- departments
- settings
- permissions
- holidays
- profile

Never store

temporary UI state.

---

# Background Refresh

When cache exists

Do

Show UI immediately.

Background fetch.

Update only if changed.

Never show spinner if cached data exists.

---

# Realtime Rules

Always subscribe for

INSERT

UPDATE

DELETE

Example

employees

When update arrives

Update cache.

Update IndexedDB.

Refresh affected components.

Never reload page.

Never refetch full table.

---

# Delta Updates

Never reload

1000 records

because

1 record changed.

Only update

changed rows.

---

# Image Loading Standards

Images consume the highest bandwidth.

Always optimize.

---

# Avatar Storage

Store only

avatar_path

Example

avatars/company01/employee01.webp

Never store

Base64

inside PostgreSQL.

Never store binary blobs inside tables.

---

# Image Format

Preferred

AVIF

↓

WebP

↓

PNG

↓

JPEG

---

# Avatar Size

Table

48x48

Profile

128x128

Full Screen

512x512

Never download

1024px

for a table row.

---

# Image Compression

Maximum avatar size

100 KB

Preferred

20 KB

to

60 KB

---

# Browser Cache

Images should be cached aggressively.

Cache-Control

1 year

Whenever avatar changes

Increase

avatar_version

Example

avatar.webp?v=5

Browser downloads only changed image.

---

# Avatar Loading

Employee Table

Load

name

department

avatar_url

only.

Do not request

signed url

for every row.

---

# Signed URL Strategy

Generate signed URL only when

Private image required.

Cache signed URL until expiry.

Never generate

100 signed URLs

every page load.

---

# Lazy Loading

All images below viewport

must use

loading="lazy"

Images should not download until visible.

---

# Image Preloading

Dashboard

Preload

first 20 avatars.

Do not preload

1000 avatars.

---

# Virtualized Lists

If rows

>100

Use virtualization.

Only render

visible rows.

Recommended

TanStack Virtual

---

# Infinite Scroll

Large datasets

must use

cursor pagination.

Never use

OFFSET

for huge tables.

---

# Optimistic Updates

After create/update/delete

Immediately update UI.

Do not wait

for server response.

Rollback if request fails.

---

# Query Rules

Only request

required columns.

Bad

select *

Good

id

name

department

avatar

status

---

# Relationship Loading

Never request

deep nested joins

unless required.

Prefer

small targeted joins.

---

# Search

Searching

must happen on server.

Do not load

50,000 employees

to search locally.

---

# Filtering

Small datasets

Local filtering.

Large datasets

Server filtering.

---

# Sorting

Small datasets

Local sorting.

Large datasets

Database sorting.

---

# Pagination

Preferred

Cursor Pagination.

Avoid

OFFSET

on very large tables.

---

# Version Checking

Maintain

table_version

or

updated_at

Before downloading

compare version.

If same

skip download.

---

# Offline Mode

If internet unavailable

Load IndexedDB.

Allow read operations.

Sync automatically

when online.

---

# Network Failure

If server unavailable

Never clear cache.

Show cached data.

Display

Offline

indicator.

---

# Loading Indicators

Show skeleton only

when

no cache exists.

If cache exists

show data instantly.

---

# API Rules

Never

Reload page

after CRUD.

Update cache.

Realtime sync.

---

# Memory Rules

Do not keep

large unused queries

inside memory.

Invalidate intelligently.

---

# Security

Never cache

passwords

tokens

OTP

sensitive secrets

inside IndexedDB.

---

# File Uploads

Upload directly

to Supabase Storage.

Never

Base64 upload

through database.

Store only

file path.

---

# File Preview

Documents

Generate preview only

when opened.

Do not preload PDFs.

---

# Performance Targets

Dashboard

<500ms

Cached Pages

<100ms

Avatar

<50ms

Realtime

<1 second

Pagination

<200ms

Search

<300ms

---

# AI Rules

Whenever generating frontend code

Always

✓ React Query

✓ IndexedDB

✓ Realtime

✓ Optimistic Updates

✓ Lazy Loading

✓ Virtualization

✓ Pagination

✓ Image Optimization

✓ Incremental Updates

✓ Browser Cache

✓ Version Checking

Never

✗ fetch inside components

✗ repeated API calls

✗ select *

✗ reload pages

✗ clear cache unnecessarily

✗ download entire tables repeatedly

✗ load full resolution images for thumbnails

✗ generate signed URLs repeatedly

✗ poll when realtime exists

The generated code should always prioritize performance, low bandwidth usage, enterprise scalability, and a native application experience similar to Notion, Linear, Slack, Discord, Microsoft Teams, and Figma.
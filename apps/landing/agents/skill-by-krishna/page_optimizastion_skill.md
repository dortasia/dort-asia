# Xentra Frontend Data Architecture

## Purpose

This project is designed to provide a lightning-fast user experience. The frontend must never rely on fetching all data from the server every time a page loads.

The application follows an Offline-First + Realtime Sync architecture.

---

# Core Principle

Always follow this order:

User Opens Page
↓
Load Local Cache
↓
Render UI Immediately
↓
Background Validation
↓
Listen for Realtime Changes
↓
Update Local Cache
↓
Update UI

Never fetch the entire dataset on every page visit.

---

# Data Flow

Supabase Cloud
        │
        ▼
Realtime Events
        │
        ▼
TanStack Query
        │
Persist Query Cache
        ▼
IndexedDB (Dexie)
        │
        ▼
React Components

---

# Technology Stack

Frontend
- React
- TypeScript
- Vite

Backend
- Supabase

Caching
- TanStack Query
- @tanstack/react-query-persist-client
- Dexie.js (IndexedDB)

Realtime
- Supabase Realtime

---

# Page Loading Rules

## First Visit

If no cache exists:

1. Fetch from Supabase
2. Store data in TanStack Query
3. Persist to IndexedDB
4. Render UI
5. Start Realtime Subscription

---

## Subsequent Visits

If cache exists:

1. Read from IndexedDB
2. Display UI immediately
3. Perform background validation
4. Subscribe to realtime updates

Do not block rendering while waiting for the network.

---

# Realtime Synchronization

Use Supabase Realtime for:

- INSERT
- UPDATE
- DELETE

When a realtime event arrives:

1. Update TanStack Query cache
2. Update IndexedDB
3. React UI should refresh automatically

Never reload the entire page.

Never refetch the entire table.

Only update the affected records.

---

# API Rules

Avoid:

```ts
select("*")
```

on every page load.

Instead:

- Load cached data
- Fetch only when cache is stale
- Sync through realtime events

---

# Cache Strategy

## Permanent Cache

Cache these permanently:

- Companies
- Departments
- Designations
- Employee Profiles
- Leave Types
- Payroll Settings
- Holidays
- Organization Settings

These rarely change.

---

## Dynamic Cache

Cache with automatic refresh:

- Attendance
- Leave Requests
- Claims
- Notifications
- Tasks
- Payroll Runs

Realtime should keep these updated.

---

## Never Download Entire History

Large datasets should always use:

- Pagination
- Infinite Scroll
- Date Range
- Lazy Loading

Examples:

Attendance

Load:

Current Month

instead of

5 Years

---

# Query Design

Every query should:

- Request only required columns
- Use pagination when needed
- Avoid unnecessary joins
- Avoid duplicate requests

Always prefer incremental updates.

---

# UI Behaviour

Pages should never display unnecessary loading indicators if cached data exists.

Preferred Flow:

Open Page

↓

Instant Content

↓

Background Sync

↓

Realtime Updates

This should feel similar to:

- Notion
- Linear
- Slack
- Discord
- Figma

---

# Offline Support

The application should continue working when internet is unavailable.

Cached data should remain accessible.

When connection returns:

- Sync changes
- Refresh affected records
- Keep UI consistent

---

# AI Development Rules

Whenever generating frontend code:

Always:

- Use TanStack Query
- Use IndexedDB persistence
- Use Supabase Realtime
- Read cached data first
- Update only changed records
- Avoid unnecessary API calls
- Avoid page reloads
- Preserve cache consistency

Never:

- Fetch entire tables repeatedly
- Clear cache unnecessarily
- Reload pages after CRUD operations
- Use polling when realtime is available

---

# Performance Goals

Target:

- Initial page load: < 2 seconds
- Cached page open: < 100ms
- CRUD update: Instant
- Realtime latency: < 1 second

The application should feel native, responsive, and capable of scaling to enterprise datasets while minimizing network usage.
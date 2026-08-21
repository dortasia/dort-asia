# Apple-Level Dashboard Design & Development Skill

## Skill Name

**Apple-Level Dashboard Engineering & UI Design**

## Skill Purpose

Build production-grade dashboards that feel like software designed by Apple: exceptionally clean, calm, precise, fast, highly intentional, responsive, accessible, and visually refined.

This skill applies to:

* SaaS dashboards
* HRMS dashboards
* Admin panels
* Analytics dashboards
* Enterprise applications
* Financial dashboards
* Productivity applications
* Management systems
* Internal tools
* AI dashboards
* Data-heavy applications

The goal is **not to copy Apple's UI**.

The goal is to reproduce the design principles associated with Apple's best interfaces:

> clarity + hierarchy + restraint + precision + responsiveness + excellent typography + meaningful motion + exceptional performance.

---

# 1. Core Design Philosophy

Every dashboard decision must follow these principles.

### 1.1 Clarity First

Every screen must answer:

1. Where am I?
2. What matters most?
3. What requires my attention?
4. What can I do next?
5. What changed?

Never make users visually parse the interface before understanding it.

---

### 1.2 Reduce Visual Noise

Do not decorate UI unnecessarily.

Avoid:

* excessive borders
* excessive shadows
* gradients everywhere
* unnecessary cards
* oversized icons
* excessive colors
* dense tables without hierarchy
* giant headings
* decorative illustrations that do not communicate information
* unnecessary badges
* excessive rounded containers

Every visual element must have a purpose.

---

### 1.3 Hierarchy Over Decoration

Use:

* typography
* spacing
* alignment
* scale
* contrast
* grouping
* whitespace

before using:

* borders
* shadows
* colors
* gradients

A dashboard should still look organized if all shadows and borders are temporarily removed.

---

# 2. Visual Language

## 2.1 Overall Appearance

Target:

* premium
* modern
* calm
* minimal
* sophisticated
* professional
* highly responsive
* information-dense without feeling crowded

Visual inspiration should come from modern Apple products, macOS, iOS, visionOS, Linear, Stripe, Notion, Arc, Vercel, and high-end enterprise SaaS products.

Do not directly reproduce proprietary UI.

---

# 3. Typography System

Typography is one of the highest-priority elements.

## 3.1 Font Priority

Prefer:

1. SF Pro Display / SF Pro Text where legally and technically appropriate
2. Inter
3. Geist
4. system-ui
5. -apple-system
6. BlinkMacSystemFont
7. Segoe UI
8. sans-serif

Recommended web stack:

```css
font-family:
  Inter,
  -apple-system,
  BlinkMacSystemFont,
  "SF Pro Display",
  "SF Pro Text",
  "Segoe UI",
  sans-serif;
```

Do not load unnecessary fonts.

---

## 3.2 Typography Scale

Use a controlled scale.

### Display

```text
56px / 1.05
48px / 1.08
40px / 1.10
36px / 1.12
```

Use only for major page-level statements.

### Page Titles

```text
32px / 1.15
28px / 1.2
24px / 1.25
```

### Section Titles

```text
20px / 1.3
18px / 1.35
16px / 1.4
```

### Body

```text
16px / 1.5
15px / 1.5
14px / 1.45
```

### Supporting Text

```text
13px / 1.4
12px / 1.35
11px / 1.3
```

Avoid text smaller than 11px.

---

# 4. Font Weight System

Do not randomly use font weights.

Recommended:

```text
400 → body
450 → secondary emphasis
500 → controls
550 → labels
600 → headings
650 → major headings
700 → rare emphasis
```

Avoid excessive `font-weight: 700`.

Apple-style interfaces usually feel refined because typography is controlled rather than aggressively bold.

---

# 5. Letter Spacing

Use subtle tracking.

```text
Large headings:
-0.03em to -0.045em

Normal headings:
-0.02em

Body:
0

Uppercase labels:
+0.04em to +0.08em
```

Never use exaggerated letter spacing.

---

# 6. Color System

Use a restrained semantic color system.

## Base

```text
Background
Surface
Surface Elevated
Surface Secondary
Border
Text Primary
Text Secondary
Text Tertiary
Text Disabled
```

Example light theme:

```text
Background: #F5F5F7
Surface: #FFFFFF
Surface Elevated: #FFFFFF
Surface Secondary: #F2F2F7

Text Primary: #1D1D1F
Text Secondary: #6E6E73
Text Tertiary: #86868B

Border: rgba(0,0,0,0.08)
```

Example dark theme:

```text
Background: #000000
Surface: #111111
Surface Elevated: #1C1C1E
Surface Secondary: #2C2C2E

Text Primary: #F5F5F7
Text Secondary: #A1A1A6
Text Tertiary: #8E8E93

Border: rgba(255,255,255,0.10)
```

---

# 7. Accent Color

Use one primary accent.

For SaaS:

```text
Primary: #007AFF
```

Semantic colors:

```text
Success
Warning
Danger
Info
```

Do not use semantic colors as decoration.

Use them only when communicating state.

---

# 8. Color Usage Rule

The UI should primarily consist of:

```text
Neutral colors → 85–95%
Accent/semantic colors → 5–15%
```

If everything is colorful, nothing is important.

---

# 9. Layout Architecture

Use a structured application shell.

```text
┌───────────────────────────────────────────────┐
│ Header                                        │
├──────────────┬────────────────────────────────┤
│              │                                │
│ Sidebar      │ Main Content                   │
│              │                                │
│              │                                │
└──────────────┴────────────────────────────────┘
```

Recommended:

```text
Sidebar:
240–280px

Compact sidebar:
64–76px

Header:
56–72px

Content max width:
1440–1600px
```

---

# 10. Sidebar

Sidebar must feel lightweight.

Include:

* application logo
* primary navigation
* grouped navigation
* active state
* optional favorites
* bottom user/account area

Do not turn every navigation item into a large card.

Recommended active state:

```text
subtle background
+
accent/icon emphasis
+
high contrast text
```

Avoid:

* huge active pills
* excessive gradients
* giant icons
* animated navigation that distracts

---

# 11. Header

Header should contain only useful actions.

Possible elements:

```text
Breadcrumb
Page title
Search
Command menu
Notifications
Help
Profile
Primary action
```

Use hierarchy.

Do not fill every empty area.

---

# 12. Dashboard Grid

Use CSS Grid.

Example:

```css
grid-template-columns:
repeat(12, minmax(0, 1fr));
```

Recommended spacing:

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
```

Prefer a consistent spacing scale.

Never use arbitrary values everywhere.

---

# 13. Card Design

Cards should not all look identical.

Use three levels:

### Level 1 — Flat Section

No border.

### Level 2 — Surface

```text
background
+
subtle border
```

### Level 3 — Elevated

```text
background
+
subtle border
+
very subtle shadow
```

Do not use dramatic shadows.

---

# 14. Border Radius

Use a consistent radius system.

```text
4px
8px
12px
16px
20px
24px
```

Suggested:

```text
Buttons: 10–12px
Inputs: 10–12px
Cards: 14–20px
Large containers: 20–24px
Modals: 20–28px
```

Do not make every element `rounded-full`.

---

# 15. Shadows

Use extremely subtle shadows.

Example:

```css
box-shadow:
0 1px 2px rgba(0,0,0,0.04),
0 8px 30px rgba(0,0,0,0.06);
```

Dark mode must use different shadow logic.

Do not use:

```text
massive glow
heavy drop shadows
neon shadows
multiple shadows everywhere
```

---

# 16. Glass / Liquid Glass

Glass effects should be used selectively.

Use:

```css
backdrop-filter: blur(20px);
```

with:

```text
low-opacity background
subtle border
controlled blur
```

Use glass for:

* floating navigation
* command palette
* overlays
* floating toolbars
* contextual controls

Do not use glass for every card.

If everything is glass, nothing feels special.

---

# 17. Dashboard Information Hierarchy

Every dashboard should follow:

```text
Level 1
What is happening?

Level 2
Why is it happening?

Level 3
What needs attention?

Level 4
What can I do?

Level 5
Detailed information
```

Example:

```text
Good Morning, Admin

Today's Snapshot
────────────────────────
Employees     Attendance     Leave     Payroll
1,248         94.2%          18        ₹12.4M

Action Required
────────────────────────
5 pending approvals
3 expiring work passes
2 payroll exceptions

Workforce Health
────────────────────────
Charts / trends / insights
```

---

# 18. KPI Cards

A KPI card must communicate:

```text
Label
Value
Change
Context
Optional trend
```

Example:

```text
Attendance

94.2%

↑ 2.4%
vs last month
```

Avoid:

```text
huge icon
huge number
random gradient
five badges
three unrelated metrics
```

---

# 19. Data Visualization

Charts must communicate information, not decorate the dashboard.

Prefer:

* line charts
* area charts
* bar charts
* compact radial charts
* sparklines
* progress indicators

Avoid unnecessary 3D charts.

Avoid excessive gradients.

Avoid chart junk.

Every chart must have:

```text
Title
Time/context
Meaningful axes
Useful tooltip
Accessible data
```

---

# 20. Chart Hierarchy

Use:

```text
Primary data
Secondary comparison
Reference/target
```

Do not use 8 colors when 2–3 are enough.

---

# 21. Tables

Tables must be extremely clean.

Use:

```text
compact header
subtle divider
consistent row height
clear alignment
sticky header when needed
hover state
selection state
pagination
search/filter
```

Recommended row heights:

```text
Compact: 40px
Default: 48px
Comfortable: 56px
```

Never sacrifice readability for density.

---

# 22. Table Alignment

Use:

```text
Text → left
Numbers → right
Dates → left/right consistently
Status → center/left
Actions → right
```

Use tabular numerals for financial/data values.

```css
font-variant-numeric: tabular-nums;
```

---

# 23. Empty States

Empty states should explain:

1. What is missing?
2. Why does it matter?
3. What should the user do?

Example:

```text
No employees yet

Add your first employee to start managing
attendance, payroll, and documents.

[ Add Employee ]
```

Avoid meaningless illustrations.

---

# 24. Loading States

Never freeze the interface.

Use:

* skeleton loading
* progressive rendering
* optimistic updates where appropriate
* stale-while-revalidate patterns
* lightweight placeholders

Skeletons should match actual component dimensions.

Bad:

```text
generic giant gray rectangle
```

Good:

```text
same layout
same spacing
same approximate content dimensions
```

---

# 25. Motion Design

Motion should communicate:

* state change
* hierarchy
* spatial relationship
* confirmation
* feedback

Never animate just because you can.

---

# 26. Motion Timing

Recommended:

```text
Micro interaction:
100–160ms

Button:
120–180ms

Dropdown:
150–220ms

Modal:
180–260ms

Page transition:
200–350ms
```

Use easing curves such as:

```text
ease-out
ease-in-out
spring-like easing
```

Avoid slow animations.

Enterprise software must feel fast.

---

# 27. Motion Principles

Use:

```text
opacity
transform
scale
blur
height
```

Prefer GPU-friendly transforms.

Avoid animating:

```text
width
left
top
box-shadow
large layout properties
```

unless necessary.

---

# 28. Hover Behavior

Desktop hover should be subtle.

Examples:

```text
background shift
border emphasis
icon movement
small elevation
```

Do not:

```text
scale entire cards dramatically
rotate icons unnecessarily
create huge glow
```

---

# 29. Button Design

Buttons must communicate hierarchy.

### Primary

Strong accent.

### Secondary

Neutral surface.

### Tertiary

Text/button.

### Destructive

Danger semantic style.

Button hierarchy:

```text
Primary > Secondary > Tertiary
```

Do not have 5 primary buttons in one screen.

---

# 30. Forms

Forms should be extremely clear.

Each field should have:

```text
Label
Input
Optional description
Validation
Error state
```

Avoid placeholder text as the only label.

Use inline validation when useful.

---

# 31. Input Design

Inputs should have:

```text
44–48px height
10–12px radius
clear focus ring
comfortable horizontal padding
```

Focus state must be highly visible.

---

# 32. Accessibility

Every dashboard must target:

```text
WCAG 2.2 AA
```

Requirements:

* keyboard navigation
* visible focus
* semantic HTML
* accessible labels
* ARIA only where needed
* sufficient contrast
* screen reader support
* reduced-motion support
* no color-only communication

Implement:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
    transition-duration: 0.01ms;
  }
}
```

---

# 33. Responsive Design

Never design desktop first and simply shrink it.

Design intentional breakpoints.

Recommended:

```text
Mobile:
<640px

Tablet:
640–1024px

Desktop:
1024–1440px

Large desktop:
>1440px
```

---

# 34. Mobile Dashboard

On mobile:

```text
Sidebar → bottom navigation / drawer
Grid → single column
KPI cards → horizontal scroll or stacked
Tables → responsive data cards or horizontal scrolling
Header → compact
Actions → prioritized
```

Never allow desktop UI to simply overflow.

---

# 35. Large Screen Behavior

On ultra-wide screens:

Do not stretch content indefinitely.

Use:

```text
max-width
centered content
balanced whitespace
```

Example:

```css
max-width: 1600px;
margin-inline: auto;
```

---

# 36. Command Palette

Modern SaaS dashboards should support keyboard-driven navigation.

Example:

```text
⌘ K
```

or:

```text
Ctrl K
```

Command palette can provide:

```text
Search employees
Create employee
Open payroll
Go to settings
Switch company
Search reports
```

The command palette should feel instant.

---

# 37. Keyboard Shortcuts

Where useful:

```text
⌘/Ctrl + K → Command palette
⌘/Ctrl + / → Search
Esc → Close overlays
Enter → Confirm
Arrow keys → Navigate menus
```

Always provide visible discoverability.

---

# 38. Notifications

Notifications must be hierarchical.

Use:

```text
Success
Info
Warning
Error
```

Prefer toast notifications for short-lived feedback.

Use persistent alerts for important issues.

Do not spam users with notifications.

---

# 39. Error Handling

Errors must be actionable.

Bad:

```text
Something went wrong.
```

Good:

```text
Unable to load payroll data.

Your connection may have been interrupted.

[ Try Again ]
```

---

# 40. Performance

Apple-level UI must feel fast.

Targets:

```text
Fast initial render
Minimal JavaScript
Lazy loading
Code splitting
Virtualized large lists
Optimized images
Cached queries
Debounced search
Memoized expensive calculations
```

Avoid unnecessary rerenders.

---

# 41. Data Fetching

Use a structured data layer.

Recommended:

```text
TanStack Query
```

Use:

```text
query keys
cache
stale time
retry strategy
prefetching
pagination
infinite queries
optimistic mutations
```

Never scatter raw API calls throughout UI components.

---

# 42. Component Architecture

Use reusable components.

Recommended structure:

```text
src/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── navigation/
│   ├── dashboard/
│   ├── charts/
│   ├── tables/
│   └── forms/
│
├── features/
│   ├── employees/
│   ├── attendance/
│   ├── payroll/
│   ├── reports/
│   └── settings/
│
├── hooks/
├── lib/
├── services/
├── stores/
├── types/
└── pages/
```

---

# 43. Component Rules

Components must be:

* reusable
* composable
* predictable
* accessible
* typed
* responsive

Avoid giant components.

If a component exceeds reasonable complexity, split it.

---

# 44. Design Tokens

Never hardcode visual values everywhere.

Create tokens for:

```text
colors
spacing
radius
typography
shadows
motion
z-index
breakpoints
```

Example:

```css
:root {
  --color-bg: #f5f5f7;
  --color-surface: #ffffff;
  --color-text: #1d1d1f;
  --color-text-secondary: #6e6e73;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
}
```

---

# 45. Dark Mode

Dark mode must not be simply inverted light mode.

Use:

```text
true dark background
elevated surfaces
controlled contrast
reduced border intensity
appropriate chart colors
```

Avoid pure white text everywhere.

Use hierarchy:

```text
Primary → high contrast
Secondary → medium contrast
Tertiary → low contrast
```

---

# 46. Icons

Use one icon system consistently.

Recommended:

```text
Lucide
SF Symbols-inspired visual language where appropriate
Iconify when required
```

Rules:

```text
16px → compact UI
18px → standard
20px → navigation
24px → prominent
```

Do not mix random icon libraries.

---

# 47. Icon Behavior

Icons should have consistent:

```text
stroke width
size
alignment
optical weight
```

Never use icons as decoration without meaning.

---

# 48. Microcopy

UI copy must be:

```text
short
human
clear
action-oriented
```

Prefer:

```text
Add employee
Export report
Review payroll
View attendance
```

Avoid:

```text
Click here to proceed
Execute action
Perform operation
```

---

# 49. Dashboard Personalization

Where useful, allow users to:

* reorder widgets
* hide widgets
* choose date ranges
* save filters
* switch views
* customize columns

But do not overwhelm first-time users with configuration.

---

# 50. Progressive Disclosure

Show the important information first.

Move advanced configuration into:

```text
Advanced
More
Settings
Filters
Details
```

Never expose 30 controls simultaneously.

---

# 51. Search

Search must be:

```text
fast
forgiving
keyboard accessible
context-aware
```

Support:

```text
employee name
ID
email
department
role
status
```

where applicable.

---

# 52. Filtering

Filters should be:

```text
clear
composable
resettable
persistable
```

Always provide:

```text
Clear filters
```

when filters are active.

---

# 53. Date & Time

Use consistent date formatting.

Support:

```text
Today
Yesterday
This week
This month
Custom range
```

Use locale-aware formatting.

Never manually construct dates with fragile string manipulation.

---

# 54. Financial Data

For financial dashboards:

* right-align values
* use tabular numerals
* show currency
* maintain consistent decimals
* distinguish positive/negative values
* avoid excessive colors

Example:

```text
SGD 124,500.00
```

---

# 55. HRMS Dashboard Example

For an HRMS, the dashboard hierarchy should be:

```text
Greeting / Context

Today's Snapshot

Employees
Attendance
Leave
Payroll

Action Required

Pending approvals
Expiring work passes
Missing documents
Payroll exceptions

Workforce Health

Headcount
Attendance trends
Turnover
Leave trends

Upcoming

Birthdays
Leave
Contract expiry
Work pass expiry

Recent Activity

Employee changes
Approvals
Payroll activity
```

---

# 56. Apple-Level Dashboard Header

Recommended structure:

```text
Good morning

Monday, August 16

Workforce overview and today's priorities.

[Search] [Notifications] [Profile]
```

Keep the header breathable.

---

# 57. Dashboard Density

Default density:

```text
Comfortable
```

Allow advanced users to switch to:

```text
Compact
Comfortable
Spacious
```

Never make the interface permanently dense.

---

# 58. Scroll Behavior

Use smooth but restrained scrolling.

Avoid:

```text
scroll hijacking
parallax everywhere
heavy scroll animations
```

Sticky elements should be intentional.

---

# 59. Modals

Use modals only for focused tasks.

Good:

```text
Create employee
Confirm deletion
Edit payroll setting
```

Bad:

```text
Entire application inside a modal
```

For complex workflows use:

```text
drawer
full-page flow
wizard
```

---

# 60. Drawers

Drawers are useful for:

```text
employee details
quick edit
filters
activity
notifications
```

Desktop:

```text
360–480px
```

Mobile:

```text
full width
```

---

# 61. Wizards

Multi-step workflows must show progress.

Example:

```text
01 Company
02 Personal
03 Work
04 Compensation
05 Documents
06 Review
```

Never hide the user's progress.

---

# 62. Animation Quality Standard

Every animation must answer:

> Why does this animation exist?

If there is no good answer:

**Remove it.**

---

# 63. Anti-Pattern Detection

Before finalizing the UI, actively detect:

```text
Too many cards
Too many colors
Too many shadows
Too many rounded elements
Inconsistent spacing
Inconsistent icon sizes
Inconsistent typography
Huge headings
Tiny text
Poor contrast
Unnecessary gradients
Excessive glass
Excessive animations
Desktop-only layout
Broken mobile layout
Horizontal overflow
Unclear actions
Duplicate components
```

Fix these automatically.

---

# 64. Visual QA

Every dashboard must be reviewed at:

```text
375px
390px
430px
768px
1024px
1280px
1440px
1728px
1920px
```

Test:

```text
Light mode
Dark mode
Keyboard
Touch
Mouse
Reduced motion
Slow network
Empty state
Loading state
Error state
Large dataset
Small dataset
```

---

# 65. Accessibility QA

Verify:

```text
Tab order
Focus visibility
Keyboard operation
ARIA labels
Contrast
Screen reader labels
Modal focus trapping
Escape behavior
Reduced motion
Form validation
Error announcements
```

---

# 66. Performance QA

Check:

```text
Initial load
Largest Contentful Paint
Cumulative Layout Shift
Interaction responsiveness
JavaScript bundle size
Image size
Network requests
Repeated API calls
Rerenders
Large table performance
Chart performance
```

Large lists must use virtualization where necessary.

---

# 67. Data State Architecture

Every major data component must support:

```text
loading
success
empty
error
refreshing
stale
```

Do not design only the happy path.

---

# 68. Skeleton Rules

Skeleton dimensions should closely match final UI.

Example:

```text
KPI card skeleton
Chart skeleton
Table skeleton
Avatar skeleton
Text skeleton
```

Avoid layout shifts.

---

# 69. Optimistic UI

Use optimistic updates when:

```text
operation is reversible
failure probability is low
immediate feedback improves UX
```

Examples:

```text
toggle setting
mark notification read
favorite item
update status
```

Do not optimistically update sensitive financial operations unless carefully designed.

---

# 70. Security UX

Sensitive actions require confirmation.

Examples:

```text
Delete employee
Terminate account
Process payroll
Change permissions
Export sensitive data
```

Use clear confirmation dialogs.

Never use ambiguous confirmation buttons.

Prefer:

```text
Cancel
Delete employee
```

instead of:

```text
Yes
No
```

---

# 71. Role-Based UI

For enterprise systems, UI should respect permissions.

Example:

```text
SUPER_ADMIN
ADMIN
MANAGER
SUB_ADMIN
EMPLOYEE
```

Do not merely hide buttons visually.

Backend authorization must remain authoritative.

---

# 72. Navigation Architecture

Navigation should reflect user mental models.

Example:

```text
Home

People
  Employees
  Departments
  Organization

Attendance
  Overview
  Timesheets
  Leave

Payroll
  Payroll
  Payslips
  Reports

Analytics
  Workforce
  Attendance
  Payroll

Settings
```

Do not create navigation categories based only on database tables.

---

# 73. Page-Level Structure

Every page should generally follow:

```text
Page Header
↓
Primary Context
↓
Primary Action
↓
Important Metrics
↓
Main Content
↓
Secondary Information
```

---

# 74. Above-the-Fold Rule

The first viewport should contain:

```text
Where am I?
What matters?
What needs action?
What can I do?
```

Not every piece of information.

---

# 75. Empty Space

Whitespace is not wasted space.

Use whitespace to:

```text
separate concepts
establish hierarchy
reduce cognitive load
create premium visual quality
```

---

# 76. Visual Rhythm

Repeated spacing creates perceived quality.

Use consistent:

```text
section gaps
card padding
heading-to-content spacing
row height
button spacing
```

Avoid random spacing.

---

# 77. Optical Alignment

Do not rely purely on mathematical alignment.

Icons, text, buttons and logos must be optically balanced.

If something technically aligns but visually feels wrong:

**fix the optical alignment.**

---

# 78. Responsive Typography

Use fluid typography where appropriate.

Example:

```css
font-size: clamp(24px, 3vw, 40px);
```

Do not allow headings to become enormous on large monitors.

---

# 79. Component States

Every interactive component should define:

```text
default
hover
focus
active
disabled
loading
success
error
selected
```

Missing states create unfinished UI.

---

# 80. Design Consistency

If two components perform similar actions, they should look and behave similarly.

Do not create:

```text
Button A → 12px radius
Button B → 20px radius
Button C → pill
Button D → square
```

without a deliberate reason.

---

# 81. Code Quality

Production code must be:

```text
TypeScript-first
strongly typed
componentized
linted
formatted
documented where necessary
free of dead code
free of duplicated logic
```

Avoid:

```text
any
massive components
deep prop drilling
duplicated API logic
magic numbers
hardcoded styles
```

---

# 82. State Management

Use the smallest appropriate state solution.

Prefer:

```text
Local state
↓
URL state
↓
TanStack Query
↓
Zustand
```

Do not put everything into global state.

---

# 83. URL State

Filters, tabs and pagination should often be URL-addressable.

Example:

```text
/employees?department=engineering&status=active&page=2
```

This improves:

* sharing
* browser navigation
* persistence
* debugging

---

# 84. Error Boundaries

Use application-level and feature-level error boundaries.

A single broken widget should not crash the entire dashboard.

Example:

```text
Payroll failed to load.

[Retry]
```

while the rest of the dashboard continues working.

---

# 85. Architecture Rule

Separate:

```text
UI
Business Logic
Data Access
State
Types
Configuration
```

Do not mix everything inside page components.

---

# 86. API Layer

Use service modules.

Example:

```text
employeeService
attendanceService
payrollService
analyticsService
settingsService
```

Components should consume hooks/services rather than directly implementing API logic.

---

# 87. Query Architecture

Use typed query keys.

Example:

```text
employees.all
employees.list(filters)
employees.detail(id)
attendance.summary(date)
payroll.summary(period)
```

Never manually invent query keys throughout the application.

---

# 88. Caching

Cache stable data.

Examples:

```text
departments
roles
company settings
permissions
employee metadata
```

Refetch frequently changing information.

---

# 89. Prefetching

Prefetch predictable navigation.

Example:

When the user opens:

```text
Employees
```

prefetch:

```text
Employee details
Employee statistics
```

only when useful.

Do not blindly prefetch everything.

---

# 90. Images

Optimize all images.

Use:

```text
WebP
AVIF
responsive sizes
lazy loading
```

Do not load massive source images for tiny avatars.

---

# 91. Avatars

Use:

```text
image
initials
fallback icon
```

Never allow broken image icons to appear.

---

# 92. Security & Privacy

Sensitive enterprise data must not leak through:

```text
URL parameters
client logs
console.log
analytics events
error messages
localStorage
```

unless explicitly intended and secure.

---

# 93. Logging

Production logs must not contain:

```text
passwords
tokens
financial secrets
personal sensitive information
authentication credentials
```

---

# 94. Testing

Test:

```text
components
hooks
services
permissions
forms
critical workflows
```

Critical flows:

```text
Login
Employee creation
Attendance
Leave
Payroll
Permissions
Settings
Logout
```

---

# 95. Visual Regression

Important dashboard components should be tested for visual regressions.

Test:

```text
light mode
dark mode
mobile
desktop
empty state
loading state
error state
```

---

# 96. Final Design Review

Before declaring the dashboard complete, ask:

### Typography

* Is the font consistent?
* Is hierarchy obvious?
* Are weights restrained?

### Layout

* Is spacing consistent?
* Is the content centered appropriately?
* Does the dashboard breathe?

### Color

* Is color communicating meaning?
* Is there unnecessary decoration?

### Components

* Are states complete?
* Are components reusable?

### Data

* Are charts understandable?
* Are tables readable?

### Motion

* Is animation purposeful?
* Does the UI feel fast?

### Accessibility

* Can the entire interface be operated by keyboard?

### Responsive

* Does it work at mobile, tablet and ultra-wide sizes?

### Performance

* Does the dashboard feel instant?

---

# 97. Apple-Level Quality Gate

Do not consider the implementation complete until the following are true:

```text
[ ] Clear visual hierarchy
[ ] Consistent typography
[ ] Consistent spacing
[ ] Consistent components
[ ] Minimal visual noise
[ ] Strong information hierarchy
[ ] Responsive layout
[ ] Dark mode
[ ] Accessible interaction
[ ] Keyboard navigation
[ ] Loading states
[ ] Empty states
[ ] Error states
[ ] Optimistic states where appropriate
[ ] Smooth micro-interactions
[ ] No excessive animations
[ ] No unnecessary gradients
[ ] No excessive shadows
[ ] No visual clutter
[ ] Fast rendering
[ ] Efficient data fetching
[ ] Large dataset support
[ ] Proper permission handling
[ ] Security-conscious implementation
[ ] Visual QA completed
```

---

# 98. AI Coding Agent Behavior

When implementing a dashboard, the AI agent MUST NOT immediately start writing random components.

Follow this order:

```text
1. Understand product requirements
2. Inspect existing codebase
3. Inspect existing design system
4. Inspect routing
5. Inspect authentication
6. Inspect data architecture
7. Inspect existing components
8. Identify reusable components
9. Establish design tokens
10. Establish page hierarchy
11. Build application shell
12. Build navigation
13. Build page header
14. Build KPI layer
15. Build primary content
16. Build secondary content
17. Add loading states
18. Add empty states
19. Add error states
20. Add responsive behavior
21. Add accessibility
22. Add motion
23. Optimize performance
24. Run visual QA
25. Fix inconsistencies
26. Final polish
```

---

# 99. Do Not Rewrite Existing Architecture Unnecessarily

Before changing architecture:

```text
inspect
understand
reuse
extend
refactor only when necessary
```

Never replace working systems simply to introduce a preferred technology.

---

# 100. Design System First

Before building dozens of screens, establish:

```text
Typography
Colors
Spacing
Radius
Shadows
Buttons
Inputs
Cards
Tables
Dialogs
Drawers
Dropdowns
Tabs
Navigation
Badges
Tooltips
Skeletons
Charts
```

Then compose pages from them.

---

# 101. No One-Off UI

Avoid creating one-off styles for every screen.

If the same pattern appears three times:

**extract a component.**

If a visual value repeats:

**create a token.**

If behavior repeats:

**create a hook.**

If data access repeats:

**create a service/query abstraction.**

---

# 102. Golden Rule

Never ask:

> "How can I make this dashboard look impressive?"

Ask:

> "How can I make the user's next decision obvious?"

That mindset produces premium software.

---

# 103. Final AI Instruction

When generating or modifying a dashboard, behave like a combination of:

```text
Senior Product Designer
+
Apple-level UI Designer
+
Design Systems Engineer
+
Senior Frontend Engineer
+
UX Researcher
+
Accessibility Engineer
+
Performance Engineer
```

The final result must feel:

```text
quiet
precise
fast
premium
human
intentional
responsive
trustworthy
```

Avoid visual trends that do not improve usability.

Do not over-design.

Do not add effects merely because they are technically possible.

Do not sacrifice performance for appearance.

Do not sacrifice accessibility for aesthetics.

Do not sacrifice usability for minimalism.

The objective is not to create a dashboard that **looks like Apple**.

The objective is to create a dashboard that demonstrates the **level of thoughtfulness, precision, restraint, and engineering quality expected from world-class software.**

**Every pixel must have a reason.
Every interaction must have a purpose.
Every component must have a system.
Every animation must communicate.
Every screen must make the user's job easier.**

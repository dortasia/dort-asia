# APPLE-LEVEL FRONTEND DESIGN ENGINEERING SKILL

## shadcn/ui + Radix Edition

### Skill ID

`apple-shadcn-radix-frontend`

### Primary Stack

```text
React
TypeScript
Tailwind CSS
shadcn/ui
Radix UI
Lucide / configured icon library
Motion
CSS Variables
Responsive CSS
Accessible semantic HTML
```

### Primary Design Foundation

```text
shadcn/create
Preset:
b1aJCZZ1m

Base:
Radix
```

The existing shadcn preset is the **design-system foundation**.

Do not replace the preset casually.

Do not override its visual language randomly.

Extend it intelligently.

---

# 1. MISSION

Build frontend interfaces that feel:

```text
Apple-level
+
shadcn-native
+
enterprise-grade
+
minimal
+
precise
+
fast
+
accessible
+
responsive
```

The target is NOT:

> "Make it look like an Apple website."

The target is:

> "Build software with Apple's level of visual restraint and interaction quality while using shadcn/ui + Radix as the component foundation."

The interface must feel:

```text
quiet
precise
premium
intentional
fast
human
```

---

# 2. ABSOLUTE PRIORITY ORDER

When making frontend decisions, use this priority:

```text
1. Correctness
2. Accessibility
3. Usability
4. Information hierarchy
5. Consistency
6. Responsiveness
7. Performance
8. Visual refinement
9. Animation
10. Decoration
```

Never sacrifice the first seven for the last three.

---

# 3. DO NOT FIGHT SHADCN

shadcn/ui is not a traditional component package where the UI must remain untouched.

Components are intended to be owned and customized by the application.

Therefore:

```text
Use shadcn components
↓
Understand their structure
↓
Customize locally
↓
Create application-specific variants
```

Do NOT:

```text
replace shadcn with another UI library
install multiple competing component libraries
rewrite every primitive unnecessarily
create random custom versions of existing components
```

---

# 4. RADIX IS THE BEHAVIOR FOUNDATION

Radix should provide the underlying accessible interaction primitives where available.

Use Radix/shadcn for:

```text
Dialog
AlertDialog
DropdownMenu
ContextMenu
Popover
Tooltip
Select
Combobox
Tabs
Accordion
Collapsible
HoverCard
NavigationMenu
Sheet
Toast
Command
Menubar
Checkbox
RadioGroup
Switch
Slider
Calendar
```

Do not manually recreate complex accessibility behavior unless there is a strong reason.

---

# 5. COMPONENT STRATEGY

Use three layers.

```text
Layer 1
Radix primitive

        ↓

Layer 2
shadcn component

        ↓

Layer 3
Application component
```

Example:

```text
Radix Dialog
    ↓
shadcn Dialog
    ↓
EmployeeDetailsDialog
```

Never put HRMS-specific business logic into generic UI components.

---

# 6. COMPONENT OWNERSHIP

### Generic UI

```text
Button
Input
Card
Dialog
Popover
Tooltip
Tabs
Badge
Table
Dropdown
Select
```

### Application UI

```text
EmployeeStatusBadge
PayrollSummaryCard
AttendanceKpi
WorkPassExpiryAlert
EmployeeFilters
PayrollTable
DashboardMetric
```

### Feature UI

```text
EmployeeProfile
PayrollRunPanel
AttendanceOverview
CompanySettingsForm
```

Keep these boundaries clean.

---

# 7. DESIGN SYSTEM HIERARCHY

Every screen must derive from:

```text
Preset
 ↓
Design tokens
 ↓
Primitive components
 ↓
Composite components
 ↓
Feature components
 ↓
Pages
```

Never style each page independently.

---

# 8. NEVER RANDOMLY OVERRIDE THE PRESET

Before changing:

```text
colors
fonts
radius
spacing
buttons
menus
component shapes
```

inspect the existing preset and project configuration.

The preset should remain the source of the application's visual foundation.

---

# 9. PRESET-FIRST WORKFLOW

When entering an existing project:

```text
1. Inspect components.json
2. Inspect package.json
3. Inspect src/index.css / globals.css
4. Inspect Tailwind configuration
5. Inspect installed shadcn components
6. Inspect aliases
7. Inspect icon configuration
8. Inspect typography
9. Inspect theme variables
10. Inspect existing application components
```

Only then modify UI.

---

# 10. SHADCN CLI DISCIPLINE

Use the official shadcn CLI when adding components.

Prefer:

```bash
pnpm dlx shadcn@latest add button
```

or the project's configured package-manager equivalent.

For inspection:

```bash
pnpm dlx shadcn@latest info
```

For component inspection:

```bash
pnpm dlx shadcn@latest view button
```

For safe changes:

```bash
pnpm dlx shadcn@latest diff
```

Use dry-run/diff workflows before blindly overwriting customized components.

---

# 11. NEVER COPY RANDOM SHADCN CODE

Before importing a component from an example:

```text
Check:
- base library
- installed version
- component API
- project configuration
- dependencies
- styling conventions
```

A Base UI example must not accidentally be copied into a Radix project.

The abstraction may look similar while the implementation differs.

---

# 12. RADIX CONSISTENCY RULE

This project uses:

```text
Radix
```

Therefore:

```text
Do not switch primitives to Base UI
unless explicitly requested.
```

Do not mix primitive implementations merely because an example looks attractive.

---

# 13. TYPOGRAPHY

Typography must remain controlled.

Use the preset's configured font as the primary system unless there is a deliberate product-level reason to change it.

Typography hierarchy:

```text
Display
↓
Page title
↓
Section title
↓
Card title
↓
Body
↓
Secondary
↓
Metadata
```

Do not create arbitrary font sizes everywhere.

---

# 14. TYPOGRAPHY RULE

Every page should usually have:

```text
1 primary heading
1–3 hierarchy levels
1 body scale
1 metadata scale
```

Avoid:

```text
17 different font sizes
```

Consistency beats creativity.

---

# 15. PAGE HEADER

Use:

```text
Breadcrumb / context
Page title
Description
Primary action
Secondary actions
```

Example:

```text
Employees

Manage your organization's workforce.

[ Add Employee ] [ Export ]
```

Keep the header breathable.

---

# 16. INFORMATION DENSITY

Enterprise applications need density.

But density ≠ clutter.

Use:

```text
clear grouping
strong hierarchy
tight internal spacing
large external spacing
```

Think:

```text
compact inside
breathing outside
```

---

# 17. GRID SYSTEM

Prefer:

```css
display: grid;
```

for dashboard layouts.

Typical:

```text
12-column desktop
8-column tablet
4-column mobile
```

But do not force a 12-column system when a simpler layout is better.

---

# 18. RESPONSIVE GRID

Desktop:

```text
4 KPI cards
```

Tablet:

```text
2 × 2
```

Mobile:

```text
1 × 4
```

Use semantic content order.

Never rely on CSS rearrangement that makes keyboard order confusing.

---

# 19. CONTAINER WIDTH

Use controlled maximum widths.

Typical:

```text
1200px
1280px
1440px
1600px
```

depending on the page.

Do not stretch content across a 4K monitor.

---

# 20. SPACING SYSTEM

Use the project's existing token system.

If creating a new scale, use a predictable rhythm:

```text
4
8
12
16
20
24
32
40
48
64
80
96
```

Avoid:

```text
13px
19px
27px
37px
```

unless optical correction genuinely requires it.

---

# 21. CARD PHILOSOPHY

A card must represent a meaningful conceptual group.

Good:

```text
Attendance
Payroll Summary
Pending Approvals
Workforce Health
```

Bad:

```text
Card inside card inside card
```

Avoid the classic:

> Cardception™ 😂

---

# 22. CARD HIERARCHY

Use:

```text
Flat section
Surface card
Elevated card
```

Do not make every card elevated.

---

# 23. BORDER PHILOSOPHY

Borders should define relationships.

Use:

```text
subtle border
```

not:

```text
dark heavy outline
```

Borders should almost disappear into the interface.

---

# 24. SHADOW PHILOSOPHY

Use shadows to establish elevation.

Not decoration.

Prefer:

```text
subtle
soft
low-opacity
short-range
```

Avoid:

```text
massive
dark
neon
glowing
```

---

# 25. RADIUS

Use the preset's radius system.

Do not randomly mix:

```text
4px
7px
11px
17px
23px
```

Use existing tokens.

If a custom radius is necessary, create a semantic token.

---

# 26. BUTTON HIERARCHY

Use:

```text
Primary
Secondary
Outline
Ghost
Destructive
```

But do not show every variant simultaneously.

Most screens should have:

```text
1 primary action
0–2 secondary actions
```

---

# 27. PRIMARY ACTION RULE

Ask:

> What is the single most important thing the user should do here?

That becomes the primary button.

---

# 28. ICON RULE

Use the project's configured icon library.

Do not mix:

```text
Lucide
Hugeicons
Heroicons
Font Awesome
custom SVG
```

randomly.

If the preset specifies an icon library, follow it.

---

# 29. ICON SIZE

Typical:

```text
14px → compact metadata
16px → normal controls
18px → standard actions
20px → navigation
24px → prominent actions
```

Keep stroke weight visually consistent.

---

# 30. ICON + TEXT

For important actions:

```text
[ + Add Employee ]
```

is preferable to:

```text
[ + ]
```

unless the icon-only action is obvious.

---

# 31. TOOLTIP RULE

Icon-only controls must generally provide an accessible name.

Use:

```text
aria-label
```

and, when useful:

```text
Tooltip
```

Never make users guess what an icon means.

---

# 32. NAVIGATION

Navigation must answer:

```text
Where am I?
Where can I go?
What section am I in?
```

Use grouped navigation.

Example:

```text
Overview

People
  Employees
  Departments

Operations
  Attendance
  Leave

Finance
  Payroll
  Reports

Settings
```

---

# 33. SIDEBAR

Sidebar should be:

```text
quiet
compact
predictable
easy to scan
```

Recommended behavior:

```text
Expanded
↓
Compact
↓
Mobile drawer
```

---

# 34. SIDEBAR ACTIVE STATE

Active navigation should use:

```text
subtle background
+
stronger text
+
optional accent
```

Do not use giant glowing pills.

---

# 35. MOBILE NAVIGATION

Do not squeeze desktop navigation onto mobile.

Use:

```text
Sheet
Drawer
Bottom navigation
Mobile menu
```

depending on product complexity.

---

# 36. COMMAND MENU

Use shadcn Command / Radix-compatible patterns for global navigation.

Recommended:

```text
⌘ K
```

or:

```text
Ctrl K
```

Actions:

```text
Search employees
Go to payroll
Open settings
Create employee
Switch company
Search reports
```

---

# 37. DIALOGS

Dialogs must have:

```text
clear title
clear purpose
focused content
primary action
cancel action
keyboard support
escape support
focus management
```

Do not place entire pages inside dialogs.

---

# 38. SHEETS / DRAWERS

Use drawers for:

```text
quick edit
details
filters
contextual actions
notifications
```

Use full pages for:

```text
complex workflows
long forms
multi-step processes
large datasets
```

---

# 39. POPOVERS

Use popovers for:

```text
filters
date selectors
compact settings
contextual controls
```

Avoid using popovers for long forms.

---

# 40. DROPDOWNS

Dropdown menus are for actions.

Select/Combobox is for choosing values.

Do not confuse:

```text
DropdownMenu
```

with:

```text
Select
Combobox
```

---

# 41. COMMAND vs SEARCH

Command palette:

```text
actions
navigation
commands
```

Search:

```text
entities
records
documents
employees
```

They may share infrastructure but should communicate different intent.

---

# 42. FORMS

Use:

```text
React Hook Form
+
Zod
+
shadcn form patterns
```

for complex forms.

Structure:

```text
Label
Input
Description
Validation
Error
```

---

# 43. FORM GROUPING

Group fields according to user mental models.

For employee creation:

```text
Personal Information
Employment Information
Compensation
Documents
Review
```

Do not mirror raw database tables.

---

# 44. FORM UX

Support:

```text
keyboard navigation
autocomplete
validation
error recovery
focus management
loading states
disabled states
success feedback
```

---

# 45. VALIDATION

Client validation is for UX.

Server validation is authoritative.

Never rely on:

```text
Zod
```

alone for security.

---

# 46. TABLE DESIGN

Use shadcn Table patterns for normal tables.

For large datasets, combine with:

```text
TanStack Table
+
TanStack Virtual
+
TanStack Query
```

when appropriate.

---

# 47. TABLE HIERARCHY

Table should have:

```text
Header
Rows
Primary column
Secondary metadata
Status
Actions
```

Avoid excessive columns.

---

# 48. TABLE ROW ACTIONS

Use:

```text
More
```

for secondary actions.

Keep the most common action directly visible.

---

# 49. TABLE SELECTION

When bulk selection exists:

```text
Select all
Select page
Bulk actions
Clear selection
```

must be obvious.

---

# 50. TABLE STATES

Always support:

```text
Loading
Empty
Error
Success
Refreshing
```

---

# 51. EMPTY STATE

Empty state structure:

```text
Title
Explanation
Primary action
Optional secondary action
```

Example:

```text
No employees yet

Add your first employee to begin managing
your workforce.

[ Add Employee ]
```

---

# 52. ERROR STATE

Never:

```text
Something went wrong.
```

alone.

Use:

```text
What happened
+
What the user can do
```

Example:

```text
Unable to load employees.

Check your connection and try again.

[ Retry ]
```

---

# 53. LOADING

Use skeletons for structural loading.

Use spinners for localized actions.

Avoid full-page loading screens unless absolutely necessary.

---

# 54. SKELETON RULE

Skeleton dimensions must approximate the final layout.

Bad:

```text
one giant gray rectangle
```

Good:

```text
actual card structure
actual row heights
actual text proportions
```

---

# 55. TOASTS

Use toasts for:

```text
successful save
small background completion
temporary feedback
```

Do not use toasts for:

```text
critical security information
long explanations
complex decisions
```

---

# 56. DESTRUCTIVE ACTIONS

Use:

```text
AlertDialog
```

for high-risk actions.

Example:

```text
Delete employee?

This action cannot be undone.

[Cancel] [Delete employee]
```

Avoid:

```text
Are you sure?
```

without context.

---

# 57. STATUS BADGES

Use badges for meaningful state:

```text
Active
Pending
Inactive
Approved
Rejected
Processing
Expired
```

Do not badge every piece of information.

---

# 58. STATUS COLORS

Use semantic colors:

```text
Success
Warning
Destructive
Info
Neutral
```

Do not invent arbitrary colors per feature.

---

# 59. DATA VISUALIZATION

Charts should remain visually compatible with the preset.

Prefer:

```text
neutral base
1 primary accent
limited semantic colors
```

Avoid rainbow charts.

---

# 60. CHART TOOLTIP

Tooltip should provide:

```text
metric
date
value
comparison
```

Avoid giant tooltips.

---

# 61. DASHBOARD KPI

KPI:

```text
Label
Value
Trend
Context
```

Example:

```text
Attendance

94.2%

↑ 2.4%
vs last month
```

Do not add five unrelated statistics to one card.

---

# 62. APPLE-LEVEL DASHBOARD STRUCTURE

Recommended:

```text
Page Header
      ↓
KPI Layer
      ↓
Action Required
      ↓
Primary Analytics
      ↓
Detailed Data
      ↓
Secondary Information
```

---

# 63. VISUAL HIERARCHY

Use this order:

```text
Size
Typography
Spacing
Position
Contrast
Color
Border
Shadow
Motion
```

Do not rely on color to establish every hierarchy.

---

# 64. COLOR RESTRAINT

Approximately:

```text
85–95%
neutral

5–15%
accent / semantic
```

The exact ratio is not a hard requirement.

The principle is:

> Color is expensive. Spend it where it communicates meaning.

---

# 65. DARK MODE

Dark mode is not:

```text
light mode
+
invert colors
```

Instead define:

```text
background
surface
elevated surface
border
primary text
secondary text
tertiary text
accent
semantic colors
```

independently.

---

# 66. DARK MODE SURFACES

Recommended hierarchy:

```text
Background
   ↓
Surface
   ↓
Elevated surface
   ↓
Modal / popover
```

Use small luminance differences.

---

# 67. GLASS

Glass is optional.

Use only for:

```text
floating header
command palette
floating toolbar
popover
modal overlay
```

Do not turn every card into glass.

---

# 68. MOTION

Use Motion only where it improves comprehension.

Good:

```text
drawer entering
modal entering
dropdown appearing
list insertion
toast
state transition
```

Bad:

```text
every card bouncing
every button scaling
background constantly moving
```

---

# 69. MOTION TIMING

Approximate:

```text
100–160ms
micro

150–220ms
small UI

180–300ms
dialogs / drawers

200–350ms
page transitions
```

Always prefer perceived responsiveness.

---

# 70. REDUCED MOTION

Support:

```css
@media (prefers-reduced-motion: reduce)
```

and reduce nonessential animation.

---

# 71. HOVER

Hover should communicate interaction.

Use:

```text
background
border
opacity
subtle elevation
```

Do not dramatically scale cards.

---

# 72. FOCUS

Every interactive element must have a visible focus state.

Never remove focus outlines without replacing them with an accessible equivalent.

---

# 73. KEYBOARD

Every major interaction should work without a mouse.

Test:

```text
Tab
Shift + Tab
Enter
Space
Escape
Arrow keys
Home
End
```

where applicable.

---

# 74. ACCESSIBILITY

Target:

```text
WCAG 2.2 AA
```

Use:

```text
semantic HTML
Radix accessibility primitives
aria-labels
proper roles
keyboard navigation
focus management
contrast
reduced motion
```

---

# 75. MOBILE TOUCH TARGETS

Interactive targets should be comfortably tappable.

Aim around:

```text
44px+
```

for primary touch interactions.

Do not make mobile controls tiny just to preserve desktop density.

---

# 76. RESPONSIVE BREAKPOINTS

Test at minimum:

```text
375
390
430
768
1024
1280
1440
1728
1920
```

---

# 77. MOBILE TRANSFORMATION

Desktop:

```text
Sidebar
12-column grid
large table
multiple actions
```

Mobile:

```text
Drawer
single-column layout
prioritized actions
responsive table/card strategy
compressed header
```

Do not simply shrink desktop.

---

# 78. ULTRAWIDE

For 1920px+:

```text
max-width
centered content
balanced whitespace
```

Do not stretch every card across the viewport.

---

# 79. RESPONSIVE TABLES

Choose intentionally:

```text
horizontal scroll
column hiding
responsive card transformation
priority columns
```

Do not let a table accidentally destroy mobile layout.

---

# 80. URL STATE

Use URL state for:

```text
search
filters
sorting
pagination
tabs
date range
```

This enables:

```text
refresh persistence
sharing
browser navigation
deep links
```

---

# 81. SERVER STATE

Use:

```text
TanStack Query
```

for:

```text
employees
attendance
payroll
leave
reports
notifications
settings
```

Do not duplicate server state in Zustand unless there is a specific architectural reason.

---

# 82. CLIENT STATE

Use local state/Zustand for:

```text
sidebar
modal
temporary UI state
command palette
layout preferences
```

---

# 83. COMPONENT STATE

Every component should consider:

```text
default
hover
focus
active
selected
disabled
loading
error
empty
```

---

# 84. DESIGN TOKENS

Never scatter magic values.

Use tokens for:

```text
color
spacing
radius
typography
shadow
motion
z-index
```

---

# 85. CSS VARIABLES

Prefer semantic variables.

Example:

```css
:root {
  --background: ...;
  --foreground: ...;
  --card: ...;
  --card-foreground: ...;
  --primary: ...;
  --primary-foreground: ...;
  --muted: ...;
  --muted-foreground: ...;
  --border: ...;
  --input: ...;
  --ring: ...;
}
```

Follow the existing shadcn token architecture.

Do not create a second competing token system.

---

# 86. TAILWIND RULE

Prefer semantic classes and existing tokens.

Avoid enormous class strings containing dozens of unrelated arbitrary values.

Bad:

```text
bg-[#...] rounded-[13px] mt-[17px] shadow-[...] ...
```

when semantic tokens already exist.

---

# 87. ARBITRARY VALUES

Arbitrary Tailwind values are allowed when genuinely necessary.

But if the same value appears repeatedly:

```text
extract a token
```

---

# 88. COMPONENT VARIANTS

Use variants for intentional visual differences.

Example:

```text
Button:
default
secondary
outline
ghost
destructive
```

Do not create:

```text
Button:
blue-small-rounded
blue-medium-rounded
green-small-rounded
```

---

# 89. CVA

Use class-variance-authority or the project's established variant mechanism for reusable variants.

Keep variants semantic.

---

# 90. NO INLINE STYLE SPRAWL

Avoid large amounts of:

```tsx
style={{ ... }}
```

Use:

```text
Tailwind
CSS variables
component variants
CSS modules
```

where appropriate.

---

# 91. COMPONENT FILE SIZE

If a component becomes difficult to understand:

```text
extract subcomponents
extract hooks
extract utilities
```

Do not create a 1,500-line dashboard component.

---

# 92. PAGE ARCHITECTURE

Preferred:

```text
pages/
 ↓
feature sections
 ↓
application components
 ↓
shadcn components
```

Example:

```text
DashboardPage
 ├── DashboardHeader
 ├── DashboardKpis
 ├── ActionRequired
 ├── WorkforceHealth
 ├── AttendanceChart
 └── RecentActivity
```

---

# 93. BUSINESS LOGIC

Do not place business logic inside:

```text
Button
Card
Dialog
Table
```

Generic components should remain generic.

---

# 94. DATA LOGIC

Do not place API calls directly into low-level UI primitives.

Bad:

```text
Button → fetch payroll
```

Good:

```text
PayrollPage
 ↓
useProcessPayroll()
 ↓
payrollService
```

---

# 95. PERFORMANCE

Avoid:

```text
unnecessary rerenders
huge component trees
large bundle imports
unoptimized charts
unvirtualized large tables
duplicate requests
```

Use:

```text
lazy loading
memoization where justified
virtualization
query caching
code splitting
```

Do not optimize blindly.

Measure first.

---

# 96. RENDERING STRATEGY

Render critical UI first.

Then:

```text
secondary data
charts
heavy components
advanced controls
```

Use progressive loading.

---

# 97. SUSPENSE / LOADING

Use loading boundaries strategically.

Do not make the entire dashboard wait for a single slow widget.

A slow payroll widget should not prevent:

```text
navigation
KPI cards
attendance
employee count
```

from rendering.

---

# 98. ERROR BOUNDARIES

Feature failures should be isolated.

Example:

```text
Payroll widget failed
       ↓
Retry
```

while:

```text
Attendance
Employees
Notifications
```

continue working.

---

# 99. VISUAL QA

Before completion inspect:

```text
Light mode
Dark mode
Mobile
Tablet
Desktop
Ultra-wide
Loading
Empty
Error
Long text
Large numbers
Long usernames
Many rows
No rows
```

---

# 100. DATA EDGE CASES

Always test:

```text
0 employees
1 employee
10 employees
10,000 employees
very long names
missing avatar
missing department
null values
large salary
negative values
very long department names
expired status
unknown status
```

---

# 101. INTERNATIONALIZATION

Do not assume:

```text
English-only
short names
USD
12-hour clock
```

Design for:

```text
long translations
different currencies
different date formats
different number formats
```

---

# 102. NUMBER FORMATTING

Use locale-aware formatting.

Do not manually concatenate:

```text
₹ + number
```

for every component.

Use a centralized formatting utility.

---

# 103. DATE FORMATTING

Centralize date formatting.

Examples:

```text
Today
Aug 16
16 Aug 2026
16/08/2026
```

depending on context.

---

# 104. ACCESSIBLE DATA VISUALIZATION

Charts must not rely only on color.

Provide:

```text
labels
tooltips
accessible summaries
data tables
patterns
```

where appropriate.

---

# 105. DESIGN REVIEW QUESTIONS

Before shipping ask:

### Hierarchy

```text
Can I understand the page in 3 seconds?
```

### Action

```text
Is the primary action obvious?
```

### Density

```text
Is it information-rich without feeling cramped?
```

### Consistency

```text
Would another page look like it belongs to the same product?
```

### Accessibility

```text
Can keyboard users operate it?
```

### Responsive

```text
Does mobile feel intentionally designed?
```

### Performance

```text
Does it feel instant?
```

---

# 106. ANTI-DESIGN-PATTERNS

Never automatically add:

```text
gradient backgrounds
glassmorphism everywhere
giant shadows
neon glow
3D icons
huge rounded cards
excessive animations
rainbow charts
random illustrations
floating blobs
excessive badges
giant hero headings
```

unless they genuinely serve the product.

---

# 107. "APPLE" DOES NOT MEAN EMPTY

Do not make enterprise software uselessly sparse.

A payroll dashboard may legitimately contain:

```text
KPIs
filters
tables
charts
actions
alerts
```

The goal is:

```text
high information density
+
low cognitive noise
```

---

# 108. SHADCN DOES NOT MEAN GENERIC

Avoid the default:

```text
everything looks like a shadcn demo
```

Use the preset as the foundation.

Then create:

```text
brand
product hierarchy
domain-specific components
custom dashboard patterns
```

---

# 109. BRANDING

Brand identity should appear through:

```text
accent
logo
typography
micro-interactions
illustration style
data visualization
copy
```

not through randomly coloring every component.

---

# 110. HRMS APPLICATION LANGUAGE

For Xentra-like enterprise applications:

Prefer:

```text
Employees
Attendance
Leave
Payroll
Reports
Settings
Approvals
Workforce
```

Avoid unnecessarily technical labels.

---

# 111. HRMS DASHBOARD VISUAL PRIORITY

Recommended:

```text
1. Today's context
2. Critical actions
3. Workforce KPIs
4. Attendance
5. Leave
6. Payroll
7. Upcoming events
8. Activity
```

---

# 112. ENTERPRISE TRUST

Financial and HR applications must feel trustworthy.

Use:

```text
calm colors
precise numbers
clear status
predictable actions
confirmation for destructive operations
visible auditability
```

Avoid playful UI where financial accuracy matters.

---

# 113. MICROCOPY

Use short human language.

Prefer:

```text
Add employee
Review payroll
Approve leave
Export report
Try again
```

Avoid:

```text
Execute employee creation operation
Initiate payroll review procedure
```

---

# 114. NOTIFICATION DESIGN

Notification levels:

```text
Success
Info
Warning
Error
Critical
```

Critical notifications should not disappear as ordinary toasts.

---

# 115. CONFIRMATION DESIGN

For dangerous actions:

```text
Explain consequence
+
specific action
+
cancel
```

Example:

```text
Delete employee?

All employee records associated with this account
will become unavailable according to your retention policy.

[Cancel]
[Delete employee]
```

---

# 116. INTERACTION FEEDBACK

Every mutation should provide feedback.

Examples:

```text
Saving...
Saved
Failed — Try again
Processing...
Completed
```

Never leave users wondering whether an action happened.

---

# 117. BUTTON LOADING

When submitting:

```text
[ Saving... ]
```

Disable duplicate submission where appropriate.

Do not remove the button entirely and cause layout shifts.

---

# 118. OPTIMISTIC UX

Use optimistic UI for low-risk interactions.

Do not fake completion for:

```text
payroll
financial transactions
permissions
destructive actions
```

---

# 119. ROUTING

Routes should reflect user mental models.

Example:

```text
/dashboard
/employees
/employees/:id
/attendance
/leave
/payroll
/reports
/settings
```

Avoid exposing database implementation details in URLs.

---

# 120. DEEP LINKING

Every meaningful screen state should ideally be linkable.

Example:

```text
/employees/123
/payroll?period=2026-08
/reports?type=attendance
```

---

# 121. PAGE TRANSITIONS

Do not animate entire applications heavily.

Prefer:

```text
instant navigation
+
localized transitions
```

The user should feel:

> "I got there."

not:

> "I am watching an animation."

---

# 122. SCROLL BEHAVIOR

Avoid scroll hijacking.

Do not:

```text
override browser scrolling
create unnecessary parallax
trap scroll
```

unless there is a very strong UX reason.

---

# 123. Z-INDEX SYSTEM

Do not randomly use:

```text
z-999999
```

Create semantic layers:

```text
base
sticky
dropdown
popover
modal
toast
critical overlay
```

---

# 124. OVERFLOW

Always inspect:

```text
horizontal overflow
long text
large tables
dropdown positioning
modal content
mobile keyboard
```

Never ship accidental horizontal scrolling.

---

# 125. FORM AUTOFILL

Use correct autocomplete attributes.

Examples:

```text
email
name
organization
address
tel
```

This improves UX.

---

# 126. FOCUS MANAGEMENT

When opening a dialog:

```text
focus dialog
```

When closing:

```text
restore focus to trigger
```

Radix should handle much of this behavior.

Do not break it with custom wrappers.

---

# 127. PORTALS

Do not unnecessarily break Radix portal behavior.

Be careful with:

```text
overflow-hidden
transform
z-index
position
```

when using:

```text
Dialog
Popover
Tooltip
Dropdown
```

---

# 128. MOBILE SHEETS

On mobile:

```text
full-width sheet
large touch targets
comfortable spacing
safe-area awareness
```

Do not use tiny desktop dialogs.

---

# 129. SAFE AREAS

For mobile interfaces consider:

```css
env(safe-area-inset-top)
env(safe-area-inset-bottom)
```

where appropriate.

---

# 130. THEME SWITCHING

If supporting light/dark:

```text
theme
system
light
dark
```

should transition without flashing where possible.

Do not make theme switching cause layout shifts.

---

# 131. PERSISTED UI PREFERENCES

Appropriate examples:

```text
theme
sidebar state
table density
column visibility
dashboard layout
```

Use localStorage or server preferences where appropriate.

Do not persist sensitive data.

---

# 132. SHADCN THEME MODIFICATION

If changing theme:

```text
modify semantic CSS variables
```

rather than manually restyling every component.

This preserves consistency across the system.

---

# 133. NEW COMPONENT RULE

Before creating a new component:

Ask:

```text
Does shadcn already have it?
```

If yes:

```text
use/extend shadcn
```

If no:

```text
create application component
```

If it will be reused:

```text
add it to the design system
```

---

# 134. DUPLICATION RULE

If the same visual pattern appears three times:

```text
extract component
```

If the same interaction appears three times:

```text
extract hook
```

If the same API access appears three times:

```text
extract service/query
```

---

# 135. AI AGENT IMPLEMENTATION WORKFLOW

When asked:

> "Build this dashboard."

The agent MUST execute:

```text
1. Inspect project
2. Inspect shadcn configuration
3. Inspect preset
4. Confirm Radix base
5. Inspect existing components
6. Inspect design tokens
7. Inspect routing
8. Inspect data layer
9. Identify reusable components
10. Plan page hierarchy
11. Build shell
12. Build navigation
13. Build page header
14. Build content hierarchy
15. Build reusable components
16. Connect data
17. Add states
18. Add responsive behavior
19. Add accessibility
20. Add motion
21. Optimize
22. Visual QA
23. Refactor duplication
24. Final polish
```

---

# 136. DO NOT START WITH CSS

Before writing UI:

```text
Understand
↓
Plan
↓
Compose
↓
Implement
↓
Polish
```

Do not immediately generate hundreds of Tailwind classes.

---

# 137. EXISTING PROJECT RULE

If existing components already solve the problem:

```text
reuse them
```

Do not rebuild them because another implementation looks prettier.

---

# 138. DESIGN PRESERVATION

When modifying an existing screen:

```text
preserve
existing architecture
existing tokens
existing behavior
existing accessibility
```

unless the task explicitly requests redesign.

---

# 139. REFACTORING

Refactor only when:

```text
duplication
performance
accessibility
maintainability
inconsistency
```

actually justify it.

Do not refactor the entire project for cosmetic reasons.

---

# 140. CODE REVIEW STANDARD

Before final output, inspect:

```text
TypeScript errors
ESLint errors
unused imports
dead code
duplicated styles
broken responsive behavior
accessibility warnings
console errors
network duplication
```

---

# 141. VISUAL REVIEW STANDARD

Check screenshots at:

```text
375px
390px
430px
768px
1024px
1280px
1440px
1920px
```

Check:

```text
light
dark
hover
focus
loading
empty
error
long data
```

---

# 142. PIXEL POLISH

Only after architecture and UX are correct should the agent tune:

```text
1px alignment
icon optical alignment
line height
letter spacing
card padding
button height
border opacity
shadow intensity
animation timing
```

---

# 143. FINAL APPLE TEST

Ask:

### Does it feel calm?

If no → reduce visual noise.

### Does it feel fast?

If no → inspect loading/data architecture.

### Does it feel intentional?

If no → improve hierarchy.

### Does it feel consistent?

If no → use the design system.

### Does it feel native?

If no → improve interaction patterns.

### Does it feel premium?

If no → fix spacing, typography and restraint.

---

# 144. FINAL SHADCN TEST

Ask:

```text
[ ] Am I using existing shadcn components?
[ ] Am I respecting the configured Radix base?
[ ] Am I using project tokens?
[ ] Am I preserving variants?
[ ] Am I avoiding duplicate primitives?
[ ] Am I using accessible interaction patterns?
[ ] Am I keeping components composable?
[ ] Am I avoiding arbitrary styling?
```

---

# 145. FINAL RADIX TEST

For every complex interactive component:

```text
[ ] Keyboard accessible
[ ] Focus managed
[ ] Escape works
[ ] Outside click behaves correctly
[ ] Screen reader semantics preserved
[ ] Portal behavior works
[ ] Mobile behavior works
```

---

# 146. FINAL QUALITY GATE

A page is NOT finished until:

```text
[ ] Design hierarchy is clear
[ ] Typography is consistent
[ ] Preset tokens are respected
[ ] Radix behavior is preserved
[ ] Components are reusable
[ ] No unnecessary custom primitives exist
[ ] Responsive layout works
[ ] Dark mode works
[ ] Keyboard navigation works
[ ] Loading state works
[ ] Empty state works
[ ] Error state works
[ ] Long data works
[ ] Large datasets work
[ ] No horizontal overflow
[ ] No console errors
[ ] No TypeScript errors
[ ] No obvious visual inconsistencies
[ ] Motion is purposeful
[ ] Performance is acceptable
```

---

# 147. GOLDEN RULE

Never ask:

> "How do I make this look cooler?"

Ask:

> "How do I make this easier to understand, faster to use, and more beautiful through restraint?"

---

# 148. FINAL AGENT DIRECTIVE

You are not merely generating React components.

You are engineering a **coherent product interface**.

Use:

```text
shadcn/ui
+
Radix
+
the configured preset
+
semantic design tokens
+
accessible primitives
+
responsive layout
+
intentional motion
+
strong typography
+
Apple-level restraint
```

Every component must belong to the system.

Every page must belong to the product.

Every interaction must have a reason.

Every animation must communicate.

Every color must communicate.

Every spacing decision must establish hierarchy.

Every API-connected component must handle:

```text
loading
success
empty
error
refreshing
```

Every responsive component must be intentionally designed.

Every sensitive interaction must remain secure.

Do not build UI that merely looks good in a screenshot.

Build UI that remains excellent:

```text
after 10,000 employees
after 1,000 payroll records
on mobile
on 4K monitors
with keyboard navigation
with slow internet
in dark mode
with empty data
with failed APIs
with long names
with real users
```

The final standard is:

# **SHADCN FOUNDATION**

## +

# **RADIX BEHAVIOR**

## +

# **APPLE-LEVEL DESIGN DISCIPLINE**

## =

# **PRODUCTION-GRADE FRONTEND**

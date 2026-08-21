# APPLE-LEVEL BUTTON DESIGN & ENGINEERING SKILL

## Skill Name

`apple-button-system`

## Purpose

Design and implement buttons that feel:

* Apple-level
* premium
* minimal
* precise
* responsive
* accessible
* tactile
* fast
* consistent with shadcn/ui
* compatible with Radix-based components
* production-ready

The button system must prioritize **clarity, hierarchy, touchability, accessibility, and feedback** over decoration.

---

# 1. CORE PHILOSOPHY

A button should feel like:

> "I know exactly what this does, and I trust it."

Do not design buttons merely to look beautiful.

Every button must communicate:

```text
Purpose
Importance
State
Availability
Result
```

---

# 2. APPLE BUTTON PRINCIPLE

The visual formula is:

```text
Typography
+
Spacing
+
Subtle shape
+
Controlled contrast
+
Micro interaction
+
Excellent feedback
```

Not:

```text
Gradient
+
Huge shadow
+
Glow
+
Extreme radius
```

---

# 3. BUTTON HIERARCHY

Every screen should establish a clear action hierarchy.

Recommended variants:

```text
Primary
Secondary
Outline
Ghost
Destructive
Link
Icon
Icon + Text
```

Use them intentionally.

---

# 4. PRIMARY BUTTON

Primary buttons represent the most important action.

Examples:

```text
Add Employee
Create Company
Save Changes
Run Payroll
Generate Report
Continue
Submit
```

Visual characteristics:

```text
high contrast
strong text
subtle radius
clear hover
clear pressed state
```

Do not place multiple visually dominant primary buttons next to each other unless they represent genuinely equal actions.

---

# 5. PRIMARY BUTTON RULE

A screen should generally have:

```text
1 primary action
```

Sometimes:

```text
0–2
```

depending on context.

If everything is primary:

> Nothing is primary.

---

# 6. SECONDARY BUTTON

Secondary buttons represent useful but less important actions.

Examples:

```text
Cancel
Filter
View Details
Manage
Export
```

Use neutral contrast.

They should visually support the primary action rather than compete with it.

---

# 7. OUTLINE BUTTON

Use outline buttons when the action is:

* important
* but not primary
* visually adjacent to a primary action

Example:

```text
[ Save Changes ] [ Cancel ]
```

Do not use outline buttons for everything.

---

# 8. GHOST BUTTON

Ghost buttons are useful for:

```text
toolbar actions
navigation
low-priority actions
table controls
contextual actions
```

They should remain visually quiet.

Example:

```text
[ Edit ]
```

rather than:

```text
[ ▢ Edit ▢ ]
```

with unnecessary borders.

---

# 9. DESTRUCTIVE BUTTON

Use destructive styling only when the action is genuinely destructive.

Examples:

```text
Delete Employee
Remove Company
Terminate Account
Cancel Payroll
Revoke Access
```

Do not use red simply because something is important.

---

# 10. LINK BUTTON

Use link-like buttons for low-emphasis actions:

```text
View all
Learn more
See details
```

Do not use link styling for critical actions.

---

# 11. ICON BUTTON

Icon-only buttons are appropriate when the meaning is obvious.

Examples:

```text
Search
Settings
More
Close
Refresh
Notifications
```

Every icon button must have an accessible name.

Example:

```tsx
aria-label="Refresh employees"
```

Never ship an unlabeled icon-only button.

---

# 12. ICON + TEXT

Prefer icon + text for actions where the icon alone may be ambiguous.

Good:

```text
[ + Add Employee ]
```

Good:

```text
[ ↓ Export ]
```

Bad:

```text
[ + ]
```

when the meaning is unclear.

---

# 13. ICON POSITION

Default:

```text
[ Icon  Text ]
```

Use:

```text
[ Text  → ]
```

when the icon represents navigation.

Examples:

```text
Continue →
View Details →
Open Report →
```

---

# 14. ICON SIZE

Recommended:

```text
12px → compact
14px → standard compact
16px → default
18px → prominent
20px → large
```

Icons should generally remain slightly smaller than the text's visual height.

---

# 15. ICON STROKE

Use the project's configured icon system.

Keep:

```text
stroke weight
size
alignment
```

consistent.

Do not mix heavy and thin icon styles.

---

# 16. BUTTON HEIGHT

Recommended system:

```text
XS
32px

SM
36px

MD
40px

LG
44px

XL
48px
```

Default enterprise dashboard button:

```text
40–44px
```

Mobile primary actions:

```text
44–48px
```

---

# 17. TOUCH TARGET

Interactive touch targets should generally be around:

```text
44px+
```

even if the visual icon itself is smaller.

This is particularly important on mobile.

---

# 18. BUTTON WIDTH

Avoid making every button full width.

Use natural content width:

```text
width: fit-content
```

Full-width buttons are appropriate for:

```text
mobile primary actions
authentication screens
important single-action flows
```

---

# 19. HORIZONTAL PADDING

Typical:

```text
SM:
12px

MD:
16px

LG:
18–20px

XL:
20–24px
```

Maintain enough breathing room around text and icons.

---

# 20. BUTTON RADIUS

Follow the project's shadcn preset.

If defining an Apple-inspired system:

```text
XS:
8px

SM:
9px

MD:
10px

LG:
12px

XL:
14px
```

Avoid blindly using:

```text
rounded-full
```

for every button.

---

# 21. PILL BUTTONS

Pills are allowed for:

```text
filters
segmented controls
compact actions
special promotional CTAs
```

Do not make the entire application pill-shaped.

---

# 22. APPLE-STYLE PRIMARY BUTTON

The ideal primary button should feel:

```text
compact
dense
high contrast
smooth
quiet
responsive
```

Example visual hierarchy:

```text
┌──────────────────────┐
│   Add Employee       │
└──────────────────────┘
```

Not:

```text
╔══════════════════════════════╗
║ ✨  ADD EMPLOYEE  →          ║
╚══════════════════════════════╝
```

Avoid unnecessary visual drama.

---

# 23. TYPOGRAPHY

Button text should generally use:

```text
14px
500 weight
```

For larger primary actions:

```text
15–16px
500–600
```

Avoid:

```text
700
```

unless there is a strong reason.

---

# 24. LETTER SPACING

Normal buttons:

```text
0
```

Avoid exaggerated tracking.

Buttons should feel native and readable.

---

# 25. TEXT CASE

Prefer:

```text
Add Employee
Save Changes
View Report
```

Avoid:

```text
ADD EMPLOYEE
SAVE CHANGES
VIEW REPORT
```

All-caps buttons often feel more aggressive and less refined.

---

# 26. BUTTON LABELS

Use action-oriented verbs.

Good:

```text
Add Employee
Save Changes
Export Report
Approve Leave
Run Payroll
```

Bad:

```text
Submit
Process
Execute
Action
Click Here
```

when a more specific action can be described.

---

# 27. BUTTON CONTENT

A button should usually contain:

```text
Icon
+
Label
```

or:

```text
Label
```

Avoid adding:

```text
icon
badge
count
secondary text
tooltip
arrow
sparkle
```

all at once.

---

# 28. BUTTON WITH COUNT

Counts are allowed when useful.

Example:

```text
Approvals  5
```

But do not make the button visually noisy.

---

# 29. BUTTON STATES

Every button must define:

```text
Default
Hover
Focus
Active / Pressed
Disabled
Loading
Success
Error
```

At minimum:

```text
Default
Hover
Focus
Pressed
Disabled
Loading
```

---

# 30. DEFAULT STATE

Default should clearly communicate:

> "This is interactive."

Use:

```text
background
text
border
```

with appropriate contrast.

---

# 31. HOVER STATE

Hover should be subtle.

Examples:

```text
slightly darker background
slightly lighter background
subtle border change
minimal elevation
```

Do not:

```text
scale 1.1
rotate
glow
bounce
```

---

# 32. PRESSED STATE

Pressed state should feel tactile.

Possible:

```text
transform: translateY(1px)
```

or:

```text
slightly reduced contrast
```

Duration:

```text
80–140ms
```

The user should feel:

> "The button responded."

---

# 33. SCALE

If using scale:

```text
0.98–0.99
```

is enough.

Never use:

```text
scale(1.1)
```

for normal buttons.

---

# 34. FOCUS STATE

Keyboard focus must be clearly visible.

Use the design system's focus ring.

Example concept:

```text
ring
+
ring-offset
```

Never remove focus indicators just to make the button prettier.

---

# 35. DISABLED STATE

Disabled buttons should communicate:

> "This action currently cannot be performed."

Use:

```text
reduced contrast
reduced opacity
no hover effect
no pointer interaction
```

Do not make disabled buttons completely invisible.

---

# 36. DISABLED ≠ LOADING

Disabled:

```text
Action unavailable
```

Loading:

```text
Action currently processing
```

These are different states.

---

# 37. LOADING BUTTON

When processing:

```text
[ spinner  Saving... ]
```

or:

```text
[ spinner  Processing ]
```

Do not simply freeze the button.

---

# 38. LOADING TEXT

Prefer contextual loading labels:

```text
Saving...
Creating...
Deleting...
Processing...
Exporting...
Uploading...
```

instead of:

```text
Loading...
```

when the action is known.

---

# 39. LOADING BUTTON WIDTH

Do not let button width dramatically change when loading.

Example:

```text
Save Changes
```

should remain approximately the same width as:

```text
Saving...
```

This prevents layout shifts.

---

# 40. DUPLICATE SUBMISSION

While a mutation is running:

```text
disable duplicate submission
```

especially for:

```text
payroll
payments
employee creation
account creation
destructive actions
```

---

# 41. SUCCESS STATE

For short operations, a temporary success state can be useful.

Example:

```text
✓ Saved
```

But do not leave every button permanently transformed.

Prefer:

```text
click
 ↓
Saving...
 ↓
Saved
 ↓
normal state
```

---

# 42. ERROR STATE

For localized failures:

```text
Failed
```

or:

```text
Try again
```

when appropriate.

Do not permanently turn a button red without explaining the problem.

---

# 43. DESTRUCTIVE CONFIRMATION

For dangerous actions:

```text
Button
 ↓
AlertDialog
 ↓
Explicit confirmation
```

Do not delete critical data directly from a table click.

---

# 44. DOUBLE CONFIRMATION

Avoid unnecessary double confirmation.

Bad:

```text
Delete
 ↓
Are you sure?
 ↓
Are you REALLY sure?
```

Use a well-designed confirmation dialog once.

---

# 45. BUTTON GROUPS

For related actions:

```text
[ Save ] [ Cancel ]
```

Recommended hierarchy:

```text
Primary → Save
Secondary → Cancel
```

For destructive:

```text
[ Cancel ] [ Delete Employee ]
```

---

# 46. BUTTON ORDER

Desktop:

```text
Secondary
Primary
```

Example:

```text
[ Cancel ] [ Save ]
```

Destructive:

```text
[ Cancel ] [ Delete ]
```

Mobile may use stacked actions depending on context.

---

# 47. BUTTON GROUP SPACING

Use:

```text
8px
```

or:

```text
12px
```

between buttons.

Avoid excessive gaps.

---

# 48. FULL-WIDTH MOBILE BUTTONS

For critical mobile flows:

```text
[       Continue       ]
```

is often better than:

```text
[ Continue ]
```

Especially in:

```text
login
onboarding
checkout
multi-step forms
```

---

# 49. STICKY MOBILE ACTIONS

For long forms, a bottom action bar may be used.

Example:

```text
────────────────────────
[ Cancel ] [ Save ]
```

Respect:

```text
safe-area-inset-bottom
```

where appropriate.

---

# 50. FLOATING BUTTONS

Floating action buttons should be used sparingly.

Appropriate:

```text
Create
Compose
Add
```

when the action is highly contextual.

Do not use floating buttons simply because they look modern.

---

# 51. ICON-ONLY TOOLBAR

Toolbar actions may use icon-only buttons:

```text
[ Search ]
[ Filter ]
[ Refresh ]
[ More ]
```

Every icon-only action must have:

```text
aria-label
```

and preferably a tooltip on desktop.

---

# 52. TOOLTIP

Tooltip should explain unfamiliar icon buttons.

Example:

```text
Refresh employees
```

not:

```text
Refresh
```

if context is ambiguous.

---

# 53. BUTTON + SHORTCUT

Command-heavy interfaces can show:

```text
Search       ⌘K
```

Use subtle shortcut styling.

Do not let shortcuts dominate the button.

---

# 54. BUTTON WITH CHEVRON

Use chevrons only when they communicate:

```text
submenu
dropdown
navigation
```

Do not add chevrons to every button.

---

# 55. BUTTON WITH ARROW

Arrows are useful for forward navigation:

```text
Continue →
View report →
```

Keep movement subtle.

---

# 56. BUTTON MICRO-MOTION

Recommended interaction:

```text
Hover
→ subtle color transition

Press
→ 1px movement / tiny scale

Release
→ return

Success
→ optional icon transition
```

No dramatic animation.

---

# 57. MOTION TIMING

Typical:

```text
Hover:
120–160ms

Press:
80–120ms

Release:
120–180ms

Loading icon:
continuous only while loading
```

---

# 58. EASING

Prefer:

```text
ease-out
ease-in-out
spring-like easing
```

Avoid exaggerated bounce.

---

# 59. REDUCED MOTION

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

Disable nonessential button animation.

---

# 60. DARK MODE BUTTONS

Dark mode must preserve hierarchy.

Primary:

```text
high contrast
```

Secondary:

```text
subtle surface
```

Ghost:

```text
very subtle hover
```

Do not create glowing neon buttons merely because the background is dark.

---

# 61. GLASS BUTTON

Glass buttons may be used in:

```text
floating toolbar
overlay
hero
navigation
```

Example concept:

```text
semi-transparent background
+
backdrop blur
+
subtle border
```

Do not use glass buttons everywhere.

---

# 62. LIQUID GLASS RULE

Glass is an elevation treatment.

It must sit above something visually meaningful.

Do not use:

```text
glass button
on
glass card
on
glass page
```

That's not Liquid Glass.

That's Liquid Lasagna. 😂

---

# 63. APPLE-STYLE TRANSPARENCY

If using transparency:

```text
background
rgba(...)
+
backdrop-filter
+
border
```

The content behind the button must remain sufficiently quiet.

Never compromise text readability.

---

# 64. BUTTON CONTRAST

Buttons must remain readable in:

```text
light mode
dark mode
hover
pressed
disabled
focus
```

Test against every supported background.

---

# 65. BUTTON ON IMAGE

Avoid placing text buttons directly over busy images.

If necessary:

```text
scrim
surface
glass layer
```

must preserve contrast.

---

# 66. BUTTON ON CARD

If a card has a primary action:

```text
Card content
            [ View ]
```

Keep the action visually subordinate unless it is the card's main purpose.

---

# 67. BUTTON IN TABLE

Table row action hierarchy:

```text
Primary row action → visible
Secondary actions → More menu
```

Example:

```text
John Doe    Active    [ View ] [ ⋯ ]
```

Do not display 8 buttons in every row.

---

# 68. BUTTON IN KPI CARD

Use minimal actions:

```text
Attendance
94.2%

↑ 2.4%

View details →
```

Do not put:

```text
[View] [Edit] [Export] [Refresh]
```

inside every KPI card.

---

# 69. BUTTON IN NAVIGATION

Navigation items are not ordinary buttons.

They should visually behave like:

```text
navigation controls
```

not:

```text
primary CTAs
```

---

# 70. SEGMENTED CONTROLS

For mutually exclusive choices:

```text
Week | Month | Year
```

use a segmented control pattern.

Do not create three unrelated buttons.

---

# 71. TOGGLE

Use a switch for:

```text
Enable notifications
Enable overtime
Dark mode
```

Do not use buttons where a persistent boolean state is intended.

---

# 72. CHECKBOX

Use checkbox when:

```text
multiple independent options
```

Do not use a button to represent selection state.

---

# 73. RADIO

Use radio when:

```text
one choice among multiple options
```

---

# 74. BUTTON VS LINK

Use:

```text
Link
```

for navigation.

Use:

```text
Button
```

for actions.

Examples:

```text
/employee/123
```

→ Link

```text
Delete employee
```

→ Button

---

# 75. SEMANTIC HTML

Use:

```html
<button>
```

for actions.

Use:

```html
<a>
```

for navigation.

Never create:

```text
div
+
onClick
```

when a semantic button is appropriate.

---

# 76. ACCESSIBILITY

Buttons must have:

```text
accessible name
keyboard support
focus state
sufficient contrast
correct disabled state
correct ARIA when required
```

---

# 77. ARIA RULE

Do not add unnecessary ARIA.

Native semantics first.

Use ARIA when it communicates information that native HTML does not.

---

# 78. BUTTON LABEL ACCESSIBILITY

Avoid:

```text
"Click"
"Here"
"Go"
"More"
```

unless context makes it completely clear.

Prefer:

```text
"View employee"
"Delete employee"
"Refresh attendance"
"Open notifications"
```

---

# 79. ICON BUTTON ACCESSIBILITY

Bad:

```tsx
<Button>
  <Search />
</Button>
```

Good:

```tsx
<Button aria-label="Search employees">
  <Search />
</Button>
```

---

# 80. LOADING ACCESSIBILITY

When loading:

```text
aria-busy="true"
```

may be appropriate depending on component structure.

Ensure the user understands that the operation is in progress.

---

# 81. DISABLED ACCESSIBILITY

Use disabled state only when the action truly cannot be performed.

Do not disable buttons merely because validation failed if an explanatory error would be more useful.

---

# 82. DISABLED UX

If a button is disabled:

```text
Why?
```

should be discoverable.

For example:

```text
Save Changes
```

disabled because:

```text
No changes detected
```

The UI should communicate that context where useful.

---

# 83. BUTTON ERROR RECOVERY

If an action fails:

```text
User
 ↓
Click
 ↓
Loading
 ↓
Error
 ↓
Retry
```

Do not force the user to refresh the page.

---

# 84. BUTTON API DESIGN

The reusable Button component should expose semantic variants.

Example:

```ts
type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "link";
```

Sizes:

```ts
type ButtonSize =
  | "sm"
  | "default"
  | "lg"
  | "icon";
```

Extend only when there is a genuine system-level need.

---

# 85. DO NOT CREATE RANDOM BUTTON VARIANTS

Avoid:

```text
appleBlue
appleGlass
premium
premiumDark
superPremium
heroButton
dashboardButton
specialButton
```

These create design-system entropy.

Prefer semantic variants.

---

# 86. COMPOSITION

Buttons should support:

```text
icon
text
loading
asChild
```

where compatible with the project's shadcn architecture.

---

# 87. AS CHILD / LINK BUTTON

When a button visually behaves like a link:

Use the project's established `asChild` pattern where appropriate.

Do not nest:

```html
<button>
  <a>
```

or:

```html
<a>
  <button>
```

---

# 88. BUTTON GROUP COMPONENT

For repeated action groups, create:

```text
ButtonGroup
```

only if the pattern is genuinely repeated.

Do not create abstractions for one-off layouts.

---

# 89. BUTTON DESIGN TOKENS

Create semantic tokens for:

```text
button height
button radius
button padding
button font size
button transition
button focus ring
button shadow
```

Do not duplicate values across variants.

---

# 90. BUTTON SHADOW

Primary buttons may use an extremely subtle elevation.

But flat buttons are often preferable.

Rule:

> If removing the shadow makes the button look better, remove the shadow.

---

# 91. GRADIENTS

Gradients are allowed only for deliberate brand moments.

Do not use gradients on ordinary CRUD buttons.

Especially avoid:

```text
blue → purple
green → cyan
rainbow
```

for ordinary enterprise actions.

---

# 92. GLOW

Do not use glow effects on normal buttons.

Glow is appropriate only for deliberate visual concepts such as:

```text
AI
special feature
experimental mode
hero CTA
```

and even then, use restraint.

---

# 93. BORDER BUTTONS

Borders should remain subtle.

Avoid:

```text
2px black
```

unless intentional.

Prefer semantic border tokens.

---

# 94. BUTTON BACKGROUND

Button background should distinguish action hierarchy.

Example:

```text
Primary:
accent

Secondary:
muted surface

Outline:
transparent + border

Ghost:
transparent
```

---

# 95. APPLE-LIKE BUTTON FEEL

The button should feel:

```text
dense
smooth
slightly tactile
not oversized
not cartoonish
```

Think:

> "quiet confidence."

---

# 96. FORM BUTTONS

For forms:

```text
[ Cancel ] [ Save Changes ]
```

Save should be primary.

Cancel should be secondary/ghost.

When saving:

```text
[ Cancel ] [ Saving... ]
```

---

# 97. MULTI-STEP BUTTONS

For onboarding:

```text
[ Back ] [ Continue ]
```

Final step:

```text
[ Back ] [ Create Company ]
```

Use meaningful labels.

Do not use:

```text
[ Submit ]
```

for every step.

---

# 98. AUTH BUTTONS

Authentication actions should be extremely clear:

```text
Sign in
Create account
Continue with Google
Continue with Apple
```

Avoid overly decorative CTAs.

---

# 99. SOCIAL AUTH BUTTONS

Third-party authentication buttons should clearly identify the provider.

Use official branding appropriately.

Do not fake brand logos with random icons.

---

# 100. EXPORT BUTTON

Prefer:

```text
[ Export ]
```

with a download icon.

If multiple formats:

```text
[ Export ▾ ]
```

Use a dropdown.

---

# 101. REFRESH BUTTON

For refresh:

```text
icon-only
```

is acceptable.

Provide:

```text
aria-label="Refresh dashboard"
```

and tooltip.

During refresh:

```text
spinner
```

may replace the icon.

---

# 102. SEARCH BUTTON

If search is a global function:

```text
[ Search                         ⌘K ]
```

is better than a tiny mysterious magnifying glass.

---

# 103. MORE BUTTON

Use:

```text
⋯
```

for secondary actions.

Always label it accessibly:

```text
aria-label="More employee actions"
```

---

# 104. BUTTON WITH BADGE

If needed:

```text
Notifications  5
```

Keep badge subtle.

Do not use giant notification circles.

---

# 105. BUTTON WITH AVATAR

Useful for:

```text
Account menu
Company switcher
User menu
```

Example:

```text
[ Avatar  Krishna  ˅ ]
```

---

# 106. COMPANY SWITCHER

For multi-tenant SaaS:

```text
[ DORT Asia  ˅ ]
```

should behave as a clear switcher.

Use:

```text
Popover
Command
```

depending on number of companies.

---

# 107. BUTTON WITH KBD

For command interfaces:

```text
Search        ⌘ K
```

Use `<kbd>` styling consistent with the design system.

---

# 108. BUTTON RESPONSIVENESS

At mobile widths:

```text
reduce horizontal padding
maintain touch target
preserve readable label
```

Do not make buttons so small that they become difficult to tap.

---

# 109. LONG LABELS

Buttons must handle:

```text
long translations
long organization names
long actions
```

Do not let text overlap icons.

Use:

```text
whitespace-nowrap
```

when appropriate.

For constrained layouts, allow controlled truncation.

---

# 110. BUTTON TEXT WRAPPING

Default:

```text
no wrapping
```

for normal buttons.

Avoid two-line buttons unless intentionally designed.

---

# 111. BUTTON ALIGNMENT

Buttons in the same group should align:

```text
height
baseline
radius
visual weight
```

---

# 112. OPTICAL ALIGNMENT

Icons should be optically aligned with text.

Do not assume:

```text
mathematical center
=
visual center
```

Inspect carefully.

---

# 113. BUTTON SPACING

Inside button:

```text
icon ↔ text
```

typically:

```text
6–8px
```

Between buttons:

```text
8–12px
```

Between button group and surrounding content:

```text
16–24px
```

---

# 114. PRIMARY CTA POSITION

For most desktop forms:

```text
bottom-right
```

is appropriate.

For mobile:

```text
full-width bottom action
```

may be better.

Always follow platform/context conventions.

---

# 115. APPLE-LEVEL BUTTON QUALITY TEST

A button passes only if:

```text
[ ] Purpose is obvious
[ ] Hierarchy is clear
[ ] Text is readable
[ ] Icon is meaningful
[ ] Touch target is adequate
[ ] Hover feels subtle
[ ] Pressed state feels tactile
[ ] Focus is visible
[ ] Disabled state is clear
[ ] Loading state exists
[ ] Duplicate submission is prevented
[ ] Accessibility label exists
[ ] Dark mode works
[ ] Mobile works
[ ] Long labels work
[ ] No unnecessary gradients
[ ] No unnecessary glow
[ ] No excessive shadow
[ ] No unnecessary animation
```

---

# 116. SHADCN/RADIX QUALITY TEST

```text
[ ] Uses existing shadcn Button where possible
[ ] Uses configured Radix foundation
[ ] Does not replace Radix primitives unnecessarily
[ ] Preserves focus behavior
[ ] Preserves keyboard behavior
[ ] Preserves asChild behavior
[ ] Uses project tokens
[ ] Uses project icon system
[ ] Uses project variants
[ ] Does not create duplicate Button primitives
```

---

# 117. FINAL AI AGENT INSTRUCTION

When asked to create a button:

DO NOT immediately write:

```tsx
<button className="...">
```

First determine:

```text
1. What action does it perform?
2. How important is the action?
3. Is it navigation or mutation?
4. Is it destructive?
5. Does it need an icon?
6. Is it desktop, mobile, or both?
7. Does it need loading?
8. Does it need confirmation?
9. Does it need tooltip?
10. Does it need keyboard shortcut?
11. Does it need a disabled state?
12. Does an existing shadcn variant already solve it?
```

Then implement the smallest correct solution.

---

# 118. FINAL DESIGN PRINCIPLE

A great button should not make the user think:

> "Wow, what a beautiful button."

It should make the user think:

> "Yep. That's exactly what I need to press."

That is the Apple-level standard.

# LESS DECORATION

# MORE INTENTION

# BETTER FEEDBACK

# PERFECT HIERARCHY

# ZERO CONFUSION

# iOS 26 APPLE COLOR SYSTEM SKILL

## shadcn/ui + Radix + Liquid Glass

### Skill ID

`ios26-apple-color-system`

### Purpose

Create a sophisticated color system inspired by the design principles of **iOS 26 and Liquid Glass**, adapted for modern web applications, SaaS dashboards, HRMS platforms, admin systems, and enterprise software.

The goal is NOT to copy Apple's exact internal implementation.

The goal is to reproduce the principles:

```text
Dynamic
+
Semantic
+
Adaptive
+
Layered
+
Restrained
+
Accessible
+
Premium
```

---

# 1. CORE IOS 26 COLOR PHILOSOPHY

The application should be built around two conceptual layers:

```text
CONTENT LAYER
        ↓
Brand identity
Data
Charts
Images
Illustrations
Background color
Gradients
Visual storytelling

        ↓

UI / CONTROL LAYER
        ↓
Navigation
Buttons
Toolbars
Dialogs
Floating controls
Tabs
Command surfaces
Liquid Glass
```

Apple's iOS 26 design guidance emphasizes this separation: brand color belongs primarily in the content layer, while the UI layer should remain familiar and restrained.

---

# 2. THE MOST IMPORTANT RULE

## DO NOT COLOR EVERYTHING.

Color should answer:

> **What deserves my attention?**

Use color for:

```text
Primary actions
Selected states
Important status
Meaningful data
Brand moments
Alerts
Progress
Interactive emphasis
```

Do NOT use color simply because an area is empty.

---

# 3. COLOR BUDGET

Target approximately:

```text
85–95%
Neutral / adaptive surfaces

5–15%
Accent + semantic colors
```

This is a design guideline, not a mathematical requirement.

The interface should remain visually coherent if the accent color is temporarily removed.

---

# 4. PRIMARY BRAND ACCENT

For a modern Apple-inspired SaaS interface:

```text
Primary Blue:
#007AFF
```

This is a strong starting point because Apple's documented system blue is approximately:

```text
RGB:
0, 122, 255
```

However:

> Do not treat `#007AFF` as a universal Apple requirement.

Your product can have its own accent.

---

# 5. XENTRA / SAAS RECOMMENDED ACCENT

For a premium enterprise dashboard:

```text
Primary:
#007AFF

Primary Hover:
#006EE6

Primary Pressed:
#005FCC

Primary Soft:
rgba(0,122,255,0.12)

Primary Subtle:
rgba(0,122,255,0.06)
```

Use these semantically.

---

# 6. LIGHT MODE FOUNDATION

Recommended starting palette:

```text
Background:
#F5F5F7

Surface:
#FFFFFF

Surface Secondary:
#F2F2F7

Surface Tertiary:
#E5E5EA

Border:
rgba(0,0,0,0.08)

Border Strong:
rgba(0,0,0,0.14)

Text Primary:
#1D1D1F

Text Secondary:
#6E6E73

Text Tertiary:
#86868B

Text Disabled:
#AEAEB2
```

Use these as semantic tokens rather than hard-coding them throughout the UI.

---

# 7. DARK MODE FOUNDATION

For an Apple-inspired dark SaaS interface:

```text
Background:
#000000

Surface:
#1C1C1E

Surface Secondary:
#2C2C2E

Surface Tertiary:
#3A3A3C

Border:
rgba(255,255,255,0.10)

Border Strong:
rgba(255,255,255,0.16)

Text Primary:
#F5F5F7

Text Secondary:
#A1A1A6

Text Tertiary:
#8E8E93

Text Disabled:
#636366
```

Do not simply invert the light theme.

Apple's guidance explicitly treats dark mode as a distinct adaptive palette rather than a simple inversion.

---

# 8. PURE BLACK RULE

For your dark dashboard, pure black can be used as the base:

```text
#000000
```

But do not make every surface black.

Hierarchy should be:

```text
#000000
    ↓
#111111 / #1C1C1E
    ↓
#2C2C2E
    ↓
#3A3A3C
```

This creates depth without excessive shadows.

---

# 9. SEMANTIC COLOR SYSTEM

Define colors by meaning.

```text
Primary
Secondary
Success
Warning
Danger
Info
Neutral
```

Never name colors only by appearance.

Bad:

```text
blue500
green500
red500
```

Better:

```text
primary
success
warning
destructive
info
```

---

# 10. SUCCESS

Apple-inspired green:

```text
Light:
#34C759

Dark:
#30D158
```

Supporting:

```text
Success Soft:
rgba(52,199,89,0.12)

Success Border:
rgba(52,199,89,0.24)
```

Use for:

```text
Approved
Active
Completed
Healthy
Positive trend
Successful operation
```

---

# 11. WARNING

Recommended:

```text
Light:
#FF9F0A

Dark:
#FF9F0A
```

Soft:

```text
rgba(255,159,10,0.12)
```

Use for:

```text
Pending
Expiring
Attention required
Partial completion
```

---

# 12. DANGER

Recommended:

```text
Light:
#FF3B30

Dark:
#FF453A
```

Soft:

```text
rgba(255,59,48,0.12)
```

Use for:

```text
Delete
Failed
Expired
Critical
Unauthorized
```

Do not use red for normal secondary information.

---

# 13. INFO

Recommended:

```text
#0A84FF
```

Use for:

```text
Information
Guidance
System messages
Neutral alerts
```

---

# 14. ORANGE

Recommended:

```text
#FF9500
```

Use sparingly for:

```text
Attention
Pending
Moderate risk
Special status
```

Do not make orange another primary brand color.

---

# 15. YELLOW

Recommended:

```text
#FFCC00
```

Use for:

```text
Caution
Review
Temporary state
Highlights
```

Avoid using bright yellow for large surfaces.

---

# 16. PURPLE

Recommended:

```text
#AF52DE
```

or:

```text
#BF5AF2
```

Use for:

```text
AI
automation
special feature
experimental feature
premium capability
```

Do not use purple randomly throughout enterprise UI.

---

# 17. PINK

Recommended:

```text
#FF2D55
```

Use sparingly.

Potential uses:

```text
special emphasis
creative modules
social features
AI/media
```

---

# 18. INDIGO

Recommended:

```text
#5856D6
```

Use for:

```text
secondary brand accent
analytics
special visualization
```

Do not introduce indigo unless it has a semantic purpose.

---

# 19. APPLE-INSPIRED CORE PALETTE

Recommended semantic palette:

```text
Blue:
#007AFF

Green:
#34C759

Orange:
#FF9500

Red:
#FF3B30

Yellow:
#FFCC00

Indigo:
#5856D6

Purple:
#AF52DE

Pink:
#FF2D55

Teal:
#5AC8FA
```

These should be treated as **starting references**, not immutable Apple values. Apple itself warns that documented system color values can change across releases and recommends semantic system colors rather than hard-coded values.

---

# 20. COLOR SEMANTICS

Use:

```text
Blue
→ interaction / primary action

Green
→ success / positive

Orange
→ warning / attention

Red
→ destructive / failure

Yellow
→ caution / review

Purple
→ AI / advanced / special

Indigo
→ analytics / secondary emphasis

Gray
→ neutral / inactive
```

Never use the same color for contradictory meanings.

---

# 21. TEXT COLOR HIERARCHY

Light:

```text
Primary:
#1D1D1F

Secondary:
#6E6E73

Tertiary:
#86868B

Disabled:
#AEAEB2
```

Dark:

```text
Primary:
#F5F5F7

Secondary:
#A1A1A6

Tertiary:
#8E8E93

Disabled:
#636366
```

Do not make every text element pure white.

---

# 22. TEXT CONTRAST

Use the strongest contrast for:

```text
headings
primary actions
critical information
important values
```

Lower contrast for:

```text
metadata
secondary descriptions
timestamps
supporting information
```

Never reduce contrast until text becomes difficult to read.

---

# 23. BACKGROUND HIERARCHY

Light:

```text
Background
#F5F5F7

Primary Surface
#FFFFFF

Secondary Surface
#F2F2F7

Elevated Surface
#FFFFFF
```

Dark:

```text
Background
#000000

Primary Surface
#1C1C1E

Secondary Surface
#2C2C2E

Elevated Surface
#3A3A3C
```

---

# 24. DO NOT USE PURE WHITE EVERYWHERE

Avoid:

```text
#FFFFFF
```

for every card in dark mode.

Instead use subtle surface elevation.

---

# 25. BORDER COLORS

Light:

```text
rgba(0,0,0,0.08)
```

Dark:

```text
rgba(255,255,255,0.10)
```

Stronger separators:

```text
rgba(0,0,0,0.14)
rgba(255,255,255,0.16)
```

Borders should usually be felt rather than noticed.

---

# 26. SHADOWS

Color should establish most hierarchy.

Use shadows sparingly.

Light:

```text
rgba(0,0,0,0.06)
```

Dark:

```text
rgba(0,0,0,0.30)
```

Avoid giant black shadows in dark mode.

---

# 27. IOS 26 LIQUID GLASS

Liquid Glass should be treated as a **material**, not a color.

Its default appearance derives color from content behind it. Apple recommends applying explicit color sparingly, especially for primary actions.

Concept:

```text
Content
   ↓
Color
   ↓
Liquid Glass
   ↓
Controls
```

---

# 28. LIQUID GLASS COLOR RULE

Default:

```text
NO EXPLICIT COLOR
```

Let the background/content influence the material.

Use explicit accent color only for:

```text
Primary CTA
Selected control
Critical status
Meaningful emphasis
```

---

# 29. LIQUID GLASS PRIMARY BUTTON

Example:

```text
background:
rgba(0,122,255,0.82)

color:
white
```

But the exact opacity should adapt to the background.

The visual goal:

```text
blue glass
+
transparency
+
depth
+
legibility
```

not:

```text
solid blue rectangle
```

---

# 30. LIQUID GLASS BUTTON RULE

Good:

```text
┌──────────────────┐
│   Save Changes   │
└──────────────────┘
```

with subtle blue glass.

Bad:

```text
blue glass
+
purple glow
+
cyan border
+
heavy shadow
```

---

# 31. LIQUID GLASS SURFACE

Conceptual web implementation:

```css
background:
  color-mix(
    in srgb,
    var(--accent) 14%,
    transparent
  );

backdrop-filter:
  blur(24px) saturate(180%);

border:
  1px solid rgba(255,255,255,0.14);
```

Do not blindly copy these values everywhere.

Tune according to background brightness.

---

# 32. REGULAR VS CLEAR GLASS

Use the equivalent mental model:

### Regular

```text
more opaque
more blur
better legibility
```

Use for:

```text
sidebar
dialogs
popover
toolbar
navigation
```

### Clear

```text
more transparent
background remains prominent
```

Use for:

```text
media overlays
photos
videos
visual hero sections
```

Apple specifically recommends regular Liquid Glass when background content could compromise legibility and clear Liquid Glass over visually rich content.

---

# 33. DO NOT USE LIQUID GLASS IN CONTENT EVERYWHERE

Apple's current guidance explicitly says Liquid Glass is primarily a functional layer for controls/navigation and should not be spread throughout the content layer.

Therefore:

```text
Dashboard cards
Tables
Charts
Employee lists
Payroll tables
```

should generally use:

```text
standard surfaces
```

rather than glass.

---

# 34. CONTENT LAYER COLOR

This is where the brand can become expressive.

Use:

```text
gradients
illustrations
charts
images
accent backgrounds
hero visuals
```

but keep them purposeful.

---

# 35. XENTRA CONTENT LAYER

For your HRMS:

```text
Background:
#000000

Primary brand:
#007AFF

Attendance:
#34C759

Leave:
#FF9F0A

Payroll:
#5856D6

Alerts:
#FF3B30

AI:
#BF5AF2
```

This creates semantic differentiation without turning the dashboard into a rainbow.

---

# 36. GRADIENTS

Use gradients primarily in the content layer.

Example:

```text
Blue
#007AFF

→

Deep Blue
#0055CC
```

or:

```text
Blue
→
Purple
```

for special visual sections.

Avoid gradients on every component.

---

# 37. APPLE-STYLE GRADIENT RULE

Gradients should feel:

```text
soft
large
subtle
atmospheric
```

Avoid:

```text
hard color stops
neon
high saturation everywhere
tiny gradient buttons
```

---

# 38. ACCENT OPACITY SCALE

Create a consistent opacity system:

```text
5%
8%
10%
12%
16%
20%
30%
40%
```

Example:

```text
Primary Soft:
rgba(0,122,255,0.08)

Primary Background:
rgba(0,122,255,0.12)

Primary Hover:
rgba(0,122,255,0.16)

Primary Strong:
rgba(0,122,255,0.24)
```

---

# 39. COLOR LAYERS

For each accent define:

```text
accent
accent-hover
accent-pressed
accent-soft
accent-subtle
accent-border
accent-text
```

Example:

```text
primary:
#007AFF

primary-hover:
#006EE6

primary-pressed:
#005FCC

primary-soft:
rgba(0,122,255,0.12)

primary-subtle:
rgba(0,122,255,0.06)

primary-border:
rgba(0,122,255,0.24)
```

---

# 40. COMPONENT COLOR HIERARCHY

Primary button:

```text
accent background
+
high contrast foreground
```

Secondary:

```text
neutral surface
+
primary text
```

Outline:

```text
transparent
+
border
```

Ghost:

```text
transparent
+
accent hover
```

Destructive:

```text
red
```

---

# 41. SELECTED STATE

Use accent color subtly.

Example:

```text
selected navigation:
rgba(0,122,255,0.12)

selected icon:
#007AFF

selected text:
#007AFF
```

Do not fill the entire sidebar with blue.

---

# 42. HOVER COLOR

Hover should be perceptible but restrained.

Example:

```text
neutral surface
→
slightly brighter/darker surface
```

Do not turn every hover into an accent-colored element.

---

# 43. PRESSED COLOR

Pressed state should be slightly stronger.

Example:

```text
#007AFF
→
#005FCC
```

or a small luminance shift.

---

# 44. DISABLED COLOR

Disabled:

```text
foreground:
low contrast

background:
low contrast

opacity:
reduced
```

Do not use bright semantic colors for disabled controls.

---

# 45. STATUS COLOR SYSTEM

Create:

```text
success
warning
danger
info
neutral
```

Each should have:

```text
foreground
background
border
icon
```

Example:

```text
success:
foreground #34C759
background rgba(52,199,89,0.12)
border rgba(52,199,89,0.22)
```

---

# 46. HRMS STATUS COLORS

Recommended:

```text
Active:
Green

Pending:
Orange

Inactive:
Gray

Rejected:
Red

Expired:
Red

Processing:
Blue

Approved:
Green

Draft:
Gray

Review:
Yellow
```

---

# 47. PAYROLL COLORS

Payroll should feel trustworthy.

Recommended:

```text
Payroll:
Indigo / Purple

Paid:
Green

Processing:
Blue

Pending:
Orange

Failed:
Red
```

Avoid bright decorative colors.

---

# 48. ATTENDANCE COLORS

```text
Present:
Green

Late:
Orange

Absent:
Red

Leave:
Blue / Purple

Holiday:
Gray
```

Always pair color with text/icon.

Apple explicitly recommends not relying solely on color to communicate information.

---

# 49. CHART COLORS

Maximum recommended primary chart colors:

```text
1–3
```

Use semantic colors when meaning exists.

Example:

```text
Actual:
Blue

Target:
Gray

Positive:
Green
```

---

# 50. CHART GRADIENTS

Use gradients only to improve readability.

Example:

```text
line:
#007AFF

area:
rgba(0,122,255,0.18)
```

Do not use rainbow fills.

---

# 51. DATA TABLE COLORS

Tables should be predominantly neutral.

Use color only for:

```text
status
selection
important exceptions
trend
interactive elements
```

---

# 52. ROW HOVER

Neutral:

```text
rgba(0,0,0,0.03)
```

Light.

Dark:

```text
rgba(255,255,255,0.04)
```

Do not make an entire row blue just because the pointer is over it.

---

# 53. SELECTION

Selected row:

```text
background:
rgba(0,122,255,0.08)

border-left:
accent
```

if appropriate.

Keep selection subtle.

---

# 54. FOCUS COLOR

Use accent:

```text
#007AFF
```

or the semantic primary color.

Focus must be clearly visible.

---

# 55. LINK COLOR

Use:

```text
#007AFF
```

unless the product's brand accent differs.

Never use the same accent color for noninteractive decorative text.

Apple warns that using the same color to indicate interaction and noninteractive text can create confusion.

---

# 56. COLOR + SEMANTIC TOKEN RULE

Never do:

```tsx
className="text-blue-500"
```

everywhere.

Prefer:

```text
text-primary
bg-primary
text-success
bg-success-soft
border-destructive
```

Use semantic tokens.

---

# 57. SHADCN TOKEN MAPPING

Map the Apple-inspired system into shadcn variables.

Example:

```css
:root {
  --background: ...
  --foreground: ...

  --card: ...
  --card-foreground: ...

  --popover: ...
  --popover-foreground: ...

  --primary: #007AFF;
  --primary-foreground: #FFFFFF;

  --secondary: ...
  --secondary-foreground: ...

  --muted: ...
  --muted-foreground: ...

  --accent: ...
  --accent-foreground: ...

  --destructive: #FF3B30;
  --destructive-foreground: #FFFFFF;

  --border: ...
  --input: ...
  --ring: #007AFF;
}
```

---

# 58. DARK SHADCN MAPPING

Dark mode must redefine semantic tokens.

Example concept:

```css
.dark {
  --background: #000000;
  --foreground: #F5F5F7;

  --card: #1C1C1E;
  --card-foreground: #F5F5F7;

  --primary: #0A84FF;
  --primary-foreground: #FFFFFF;

  --muted: #2C2C2E;
  --muted-foreground: #A1A1A6;

  --destructive: #FF453A;

  --border: rgba(255,255,255,0.10);
  --ring: #0A84FF;
}
```

---

# 59. DARK PRIMARY

For dark mode, consider:

```text
#0A84FF
```

rather than blindly using the exact light-mode blue.

Apple's system blue adapts between appearances; Apple's documented values include different light/dark system colors.

---

# 60. LIGHT / DARK ACCENT PAIR

Recommended:

```text
Light:
#007AFF

Dark:
#0A84FF
```

This generally provides a more appropriate dark-mode accent.

---

# 61. SEMANTIC DARK PAIRS

```text
Success:
Light #34C759
Dark  #30D158

Danger:
Light #FF3B30
Dark  #FF453A

Warning:
Light #FF9F0A
Dark  #FF9F0A

Info:
Light #007AFF
Dark  #0A84FF
```

---

# 62. COLOR ADAPTATION

Every custom color must have:

```text
light
dark
increased contrast
```

where relevant.

Apple explicitly recommends providing light/dark variants for custom colors so the interface remains adaptive and accessible.

---

# 63. INCREASED CONTRAST

Create stronger variants.

Example:

```text
Normal primary:
#007AFF

High contrast:
#005FCC
```

Do not merely increase saturation.

Increase actual differentiation.

---

# 64. ACCESSIBILITY

Color must never be the only indicator.

Bad:

```text
green dot
```

Better:

```text
● Active
```

Best:

```text
✓ Active
```

where appropriate.

---

# 65. COLORBLIND SAFETY

Avoid relying on:

```text
red vs green
```

alone.

Use:

```text
color
+
icon
+
label
```

---

# 66. COLOR ON GLASS

When placing text on Liquid Glass:

```text
background changes
+
blur changes
+
underlying content changes
```

Therefore test against multiple backgrounds.

Never assume one hard-coded foreground color will always work.

---

# 67. GLASS CONTRAST TEST

Test:

```text
dark background
light background
colorful background
image background
gradient background
```

The control must remain legible.

---

# 68. GLASS OVER COLORFUL CONTENT

If the background is highly colorful:

```text
increase glass opacity
+
increase blur
+
use stronger foreground contrast
```

Apple's regular Liquid Glass variant is designed to blur/adjust background content for legibility.

---

# 69. CLEAR GLASS

Use clear glass only when the underlying visual content should remain prominent.

Good:

```text
photo
video
hero image
media
```

Bad:

```text
employee table
payroll table
dense analytics
```

---

# 70. COLOR IN NAVIGATION

Do not create:

```text
blue sidebar
blue header
blue toolbar
blue tabs
blue buttons
blue cards
```

Instead:

```text
neutral navigation
+
accent selected state
+
accent primary action
```

This aligns with Apple's iOS 26 recommendation to move brand color into the content layer rather than using solid colored top toolbars/tab bars.

---

# 71. COLOR IN HEADER

Recommended:

```text
neutral / glass
```

with:

```text
accent action
```

not:

```text
entire header = brand blue
```

---

# 72. COLOR IN SIDEBAR

Recommended:

```text
dark:
#000000 / #111111

light:
#F5F5F7 / #FFFFFF
```

Active:

```text
rgba(0,122,255,0.12)
```

---

# 73. COLOR IN TABS

Inactive:

```text
neutral
```

Active:

```text
accent
```

Indicator:

```text
accent
```

Do not make every tab colorful.

---

# 74. COLOR IN BUTTONS

Primary:

```text
accent
```

Secondary:

```text
neutral
```

Outline:

```text
transparent
```

Ghost:

```text
transparent
```

Destructive:

```text
red
```

---

# 75. COLOR IN CARDS

Default cards:

```text
neutral
```

Special cards:

```text
subtle semantic tint
```

Example:

```text
Attendance:
rgba(52,199,89,0.06)
```

Not:

```text
bright green card
```

---

# 76. COLOR IN KPI CARDS

KPI value:

```text
neutral
```

Trend:

```text
semantic
```

Example:

```text
Attendance

94.2%

↑ 2.4%
```

Only the trend needs green.

---

# 77. COLOR IN ALERTS

Use:

```text
subtle semantic background
+
semantic icon
+
neutral text
```

Avoid filling the entire alert with saturated red/orange.

---

# 78. COLOR IN MODALS

Modal surface:

```text
neutral
```

Destructive button:

```text
red
```

Warning icon:

```text
orange
```

Do not make the entire modal red.

---

# 79. COLOR IN COMMAND PALETTE

Command palette should remain mostly neutral.

Accent only for:

```text
selected command
shortcut
highlight
important action
```

---

# 80. COLOR IN SEARCH

Search field:

```text
neutral
```

Focus:

```text
accent ring
```

Search result:

```text
neutral
```

Selected result:

```text
accent subtle background
```

---

# 81. COLOR IN EMPTY STATES

Empty state should generally remain neutral.

Accent can highlight:

```text
primary CTA
icon
small illustration
```

---

# 82. COLOR IN LOADING STATES

Skeletons should be neutral.

Do not make skeletons blue, green, purple, etc.

---

# 83. COLOR IN ERROR STATES

Use:

```text
subtle red background
+
red icon
+
neutral text
+
red/primary action
```

Avoid giant red screens.

---

# 84. COLOR IN SUCCESS STATES

Use:

```text
subtle green
+
checkmark
+
neutral text
```

Avoid giant green panels for every successful operation.

---

# 85. COLOR IN AI FEATURES

For AI:

```text
Purple:
#BF5AF2
```

or:

```text
Indigo:
#5856D6
```

Use a subtle gradient only when appropriate.

AI should feel like a product capability, not a casino button.

---

# 86. COLOR IN PREMIUM FEATURES

Use a restrained:

```text
Purple
Indigo
Gold
```

only if the product actually has premium functionality.

Do not label everything "premium" visually.

---

# 87. COLOR IN ANALYTICS

Use:

```text
Blue
Indigo
Green
```

for meaningful series.

Keep chart palettes consistent across pages.

---

# 88. GLOBAL COLOR TOKENS

Recommended:

```css
:root {
  --color-blue: #007AFF;
  --color-green: #34C759;
  --color-orange: #FF9500;
  --color-red: #FF3B30;
  --color-yellow: #FFCC00;
  --color-indigo: #5856D6;
  --color-purple: #AF52DE;
  --color-pink: #FF2D55;
  --color-teal: #5AC8FA;
}
```

But components should primarily consume **semantic tokens**, not these raw values.

---

# 89. SEMANTIC TOKENS

Prefer:

```text
--color-primary
--color-success
--color-warning
--color-danger
--color-info

--color-surface
--color-surface-secondary
--color-surface-elevated

--color-text
--color-text-secondary
--color-text-tertiary

--color-border
--color-border-strong
```

---

# 90. OPACITY TOKENS

Create:

```text
--opacity-subtle
--opacity-soft
--opacity-medium
--opacity-strong
```

Example:

```text
0.06
0.12
0.20
0.32
```

---

# 91. DO NOT HARD-CODE COLORS EVERYWHERE

Bad:

```tsx
className="bg-[#007AFF]"
```

Good:

```tsx
className="bg-primary"
```

Better:

```text
semantic design tokens
```

---

# 92. COLOR NAME RULE

Never create:

```text
blueButton
blueCard
darkBlueThing
lightBlueBox
```

Create:

```text
primary
surface
selected
success
warning
danger
```

---

# 93. DESIGN TOKEN ARCHITECTURE

Recommended:

```text
Raw Color
    ↓
Semantic Token
    ↓
Component Token
    ↓
UI Component
```

Example:

```text
#007AFF
 ↓
--primary
 ↓
--button-primary-background
 ↓
Button
```

---

# 94. COMPONENT-SPECIFIC COLORS

Only create component-specific tokens when necessary.

Example:

```text
--chart-attendance
--chart-payroll
```

Do not create:

```text
--employee-card-blue
--employee-card-blue-hover
--employee-card-blue-border
```

unless the design genuinely requires it.

---

# 95. BRAND COLOR RULE

Brand color should not overpower the product.

Use it to establish:

```text
identity
interaction
selection
hierarchy
```

not to decorate every surface.

---

# 96. IOS 26 BRAND STRATEGY

Think:

```text
Content
= brand expression

Controls
= system language

Accent
= meaningful emphasis

Glass
= functional layer
```

This is the key mental model for the new iOS 26 visual language.

---

# 97. APPLE-LEVEL COLOR QA

Check every screen in:

```text
Light
Dark
Increased contrast
Reduced transparency
Colorful background
Neutral background
```

---

# 98. COLOR QA CHECKLIST

```text
[ ] Accent has clear meaning
[ ] Primary action is obvious
[ ] Semantic colors are consistent
[ ] Text contrast is sufficient
[ ] Dark mode is intentionally designed
[ ] Light mode is intentionally designed
[ ] Disabled states are visible
[ ] Focus states are visible
[ ] Color isn't the only status indicator
[ ] Glass remains readable
[ ] Charts remain understandable
[ ] Tables remain mostly neutral
[ ] Navigation remains restrained
[ ] No unnecessary gradients
[ ] No unnecessary glow
[ ] No rainbow UI
[ ] No giant colored backgrounds
```

---

# 99. FINAL COLOR RULE

Before adding a color ask:

> **What information does this color communicate?**

If the answer is:

> "It looks cool."

Do not use it.

If the answer is:

> "It tells the user this is the primary action."

Use it.

If the answer is:

> "It communicates status."

Use it.

If the answer is:

> "It establishes brand identity."

Use it in the content layer.

---

# 100. FINAL IOS 26 DESIGN FORMULA

The final interface should follow:

```text
NEUTRAL FOUNDATION
        +
SEMANTIC COLOR
        +
CONTENT-DRIVEN BRANDING
        +
LIQUID GLASS CONTROLS
        +
ADAPTIVE LIGHT/DARK
        +
SUBTLE CONTRAST
        +
PURPOSEFUL ACCENT
        +
ACCESSIBILITY
```

Result:

```text
Calm
        ↓
Clear
        ↓
Adaptive
        ↓
Premium
        ↓
Apple-level
```

---

# 101. FINAL AGENT DIRECTIVE

When designing any new screen:

DO NOT start by choosing colors.

Start with:

```text
1. Information hierarchy
2. Content structure
3. Component hierarchy
4. Surface hierarchy
5. Typography
6. Interaction
7. Color
8. Material
9. Motion
```

Color is a communication system.

It is not decoration.

---

# 102. GOLDEN RULE

## iOS 26 COLOR IS NOT "MORE COLOR."

It is:

# **BETTER COLOR PLACEMENT.**

Use neutral surfaces.

Let content express the brand.

Let Liquid Glass adapt to the content beneath it.

Use accent color for meaningful controls and states.

Keep navigation restrained.

Keep semantic colors consistent.

Keep dark mode genuinely dark.

Keep accessibility intact.

And when in doubt:

> **Remove one color before adding another.**

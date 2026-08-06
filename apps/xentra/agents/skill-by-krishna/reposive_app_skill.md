You are a Senior Frontend Engineer and UI Architect.

Your task is to refactor the entire frontend into a fully responsive, production-grade enterprise SaaS dashboard without changing the existing design language, branding, colors, or layout hierarchy.

Requirements:

## Goal

Make the entire application look visually identical across all modern devices while maintaining proper proportions.

Users should NEVER need to change browser zoom (90%, 110%, etc.).

The UI must automatically adapt to every screen size.

---

## Responsive Targets

Support all modern resolutions including:

• 1280×720
• 1366×768
• 1440×900
• 1536×864
• 1600×900
• 1680×1050
• 1920×1080
• 2560×1440
• 3440×1440 Ultrawide
• 3840×2160 (4K)

Also support:

• MacBook Air
• MacBook Pro
• Windows laptops
• Desktop monitors
• Ultrawide monitors

---

## Responsive Rules

DO NOT use fixed pixel widths or heights unless absolutely necessary.

Replace hardcoded values with:

• clamp()
• min()
• max()
• %
• rem
• vw
• vh
• CSS Grid
• Flexbox

Avoid:

width: 1600px;
height: 240px;
font-size: 52px;

Prefer:

width: 100%;
max-width: 1600px;

padding:
clamp(16px, 2vw, 28px);

font-size:
clamp(14px, 1vw, 16px);

Heading:
clamp(30px, 3vw, 44px);

---

## Layout

The application must scale naturally.

Sidebar should reduce slightly on smaller screens.

Header height should scale.

Cards should resize automatically.

Charts should remain proportional.

Tables should never overflow.

Forms should wrap properly.

Modals should always fit the viewport.

Dialogs should remain centered.

No horizontal scrolling.

No clipped content.

---

## Grid System

Use CSS Grid where appropriate.

Example:

repeat(auto-fit, minmax(320px,1fr))

instead of fixed columns.

Cards should automatically wrap.

Spacing should remain visually balanced.

---

## Typography

Use fluid typography.

Replace all fixed font sizes.

Example:

font-size:
clamp(14px,1vw,16px)

Heading:

clamp(32px,3vw,44px)

Maintain proper hierarchy.

---

## Spacing

Replace fixed spacing.

Example:

padding:
clamp(16px,2vw,28px)

gap:
clamp(12px,1.5vw,24px)

margin:
clamp(12px,1vw,24px)

---

## Sidebar

Sidebar width should be responsive.

Desktop:
260–280px

Laptop:
240–260px

Collapsed on tablets.

Drawer on mobile.

Icons remain aligned.

Text never wraps.

---

## Dashboard Cards

Cards should automatically resize.

No fixed widths.

Maintain equal heights.

Charts scale correctly.

Statistics remain aligned.

---

## Tables

Responsive tables.

Sticky headers.

Horizontal scrolling only inside the table container if required.

Never overflow the page.

---

## Images

Images must use:

object-fit: cover

max-width: 100%

height: auto

---

## Performance

Do not add unnecessary wrappers.

Do not create layout shifts.

Avoid unnecessary re-renders.

Keep DOM structure clean.

---

## Accessibility

Maintain WCAG-friendly spacing.

Touch targets at least 44px.

Keyboard navigation must continue working.

---

## Design Constraints

DO NOT redesign the UI.

DO NOT change colors.

DO NOT change spacing style.

DO NOT change branding.

DO NOT replace components.

DO NOT modify business logic.

Only improve responsiveness and adaptive layouts.

The final UI should feel like ChatGPT, Linear, Stripe Dashboard, Notion, and Vercel—clean, fluid, and professional on every screen size.

After completing the implementation, review every page and component to ensure there is no overflow, clipping, excessive whitespace, or disproportionate scaling at any supported resolution.
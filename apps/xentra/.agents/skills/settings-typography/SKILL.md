---
name: settings-typography
description: Full details of the settings page font and text placing conventions in the Xentra / Employee Management HRMS project.
---

# Settings Page Typography & Text Placement Guide

This document outlines the standard typography classes, text alignment, and spacing rules used across the Settings pages (e.g., Company Profile, Departments, Attendance, Roles) within the HRMS application. Following these guidelines ensures a consistent, Apple-like UI structure.

## 1. Global Typography Utilities

The settings module uses a predefined set of Tailwind CSS utility classes (often referred to as `type-*`) for consistent text sizing, line height, and font weight. These map to the **SF Pro Display / SF Pro Rounded** base fonts.

- **`type-h1`**: Used for top-level page headers (e.g., "Settings" in the top bar). Often styled as `text-[28px] font-medium tracking-tight`.
- **`type-h2`**: Used for section headings (e.g., "Company Profile", "Working Hours").
- **`type-h3`**: Used for sub-section headings or card titles.
- **`type-body-medium`**: Standard body text used for form inputs, dropdown options, table cells, and standard paragraph text.
- **`type-small`**: Used for helper text, sub-descriptions, and secondary information below headings.
- **`type-caption`**: Used for uppercase section dividers, input field labels, and very small text. Often paired with `uppercase tracking-wider` or `font-medium`.

## 2. Text Placement & Spacing Conventions

When building or modifying a settings page, use the following layout structures:

### A. Page Header & Subtitle
Every settings section should start with a header block. Use `gap-10 pb-20` on the main wrapper, and a `mb-1.5` on the heading:

```tsx
<div className="flex flex-col gap-10 pb-20">
  <div>
    <h2 className="type-h2 font-semibold text-[#161616] mb-1.5">Settings Section Name</h2>
    <p className="type-small text-[#737373]">A short description of what this section manages.</p>
  </div>
  
  {/* Content Sections Go Here */}
</div>
```

### B. Form Inputs & Labels
Inputs are typically structured in a grid (`grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-w-3xl`).
- **Labels**: Use `type-caption font-medium text-[#161616] mb-1.5 block`
- **Inputs**: Use `type-body-medium text-[#161616] placeholder:text-[#A3A3A3]` with internal padding (`px-4 py-2.5`).

```tsx
<div>
  <label className="block type-caption font-medium text-[#161616] mb-1.5">Company Name</label>
  <input
    type="text"
    placeholder="e.g. Acme Corp"
    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
  />
</div>
```

### C. Sidebar Navigation Categories
For the settings sidebar, category headers are uppercase, and items use body text:
- **Category Header**: `type-caption font-medium text-[#A3A3A3] uppercase tracking-wider mb-2 px-2`
- **Nav Items**: `type-body-medium` (with `font-medium` for the active state).

### D. Settings Cards (Company Card in Sidebar)
- **Title**: `type-h2 font-semibold text-[#161616] mb-1.5`
- **Description**: `type-small text-[#737373] leading-relaxed mb-4`

## 3. Standard Text Colors

Strictly adhere to the following text colors for consistency (which are overridden automatically in dark mode via `globals.css`):
- **Primary Text** (Headings, active items): `text-[#161616]` or `text-[#111827]`
- **Secondary Text** (Descriptions, placeholders, inactive items): `text-[#737373]` or `text-[#8B8B8B]`
- **Labels & Headers**: `text-[#A3A3A3]` for faint uppercase headers, or `text-[#161616]` for input labels.
- **Accents**: `text-black` or `text-white` when on contrasting backgrounds.

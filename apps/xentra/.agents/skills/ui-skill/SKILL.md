---
name: ui-skill
description: UI Design Tokens, Typography, Layout Rules, and Component Specifications for Xentra Employee Management. Use this skill whenever modifying or building UI components, styling layouts, or adding typography/icons to the Xentra platform.
---

# UI Design System & Guidelines - Xentra Employee Management

This skill provides exact design tokens, typography rules, layout measurements, and component structures for the **Xentra Employee Management** platform.

---

## 🎨 Color Palette & Tokens

- **App Shell & Sidebar Background**: `#FBFBFD`
- **Right Content Card Background**: `#F5F7FA`
- **Right Content Card Border / Stroke**: `#E5E7EB`
- **Active Accent Color**: `#007AFF` (Apple System Blue)
- **Active Icon Background Tint**: `#EAF2FF`
- **Inactive / Default Icon Color**: `#6B7280`
- **Notification Badge Red**: `#FF3B30`

---

## 🔤 Typography & Font Rules

1. **Body & Headers**: `SF Pro Display`, `SF Pro Text`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`
2. **Numbers & Badges Rule**:
   - **MANDATORY**: Every number text, counter badge, tabular data, and element with `.font-rounded` MUST use `SF Pro Rounded`.
   - CSS Rule:
     ```css
     .font-rounded,
     [class*="font-rounded"],
     .tabular-nums {
       font-family: "SF Pro Rounded", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif !important;
       font-variant-numeric: tabular-nums;
     }
     ```
3. **Page Titles (`Home`)**:
   - `font-['SF_Pro_Display',-apple-system,sans-serif]`
   - `text-[28px]`, `font-medium`, `text-gray-900`, `tracking-tight`

---

## 📐 Layout & Component Guidelines

### 1. Sidebar (`Sidebar.tsx`)
- **Width**: `80px` fixed (`w-[80px]`)
- **Border**: No right border line (`border-r-0`)
- **Icon Dimensions**: `20px` x `20px` (`size={20}`)
- **Icon Package**: Hugeicons (`hugeicons-react`)
- **Active Sliding Animations**:
  - `sidebar-active-indicator`: `w-[3px]` blue strip on left (`rounded-tr-[25px] rounded-br-[25px]`, `bg-[#007AFF]`).
  - `sidebar-active-bg`: `rounded-[18px]` background pill (`bg-[#EAF2FF]`).
- **Icons**:
  - Home: `Home01Icon`
  - Attendance: `Calendar03Icon` (clean plain calendar grid without numbers/badges)
  - Employees: `UserGroupIcon`
  - Department: `Building01Icon` (office building)
  - Drive: `HardDriveIcon`
  - Alerts: `Alert01Icon`
  - Settings: `Settings01Icon`

### 2. Main Content Card (`layout.tsx`)
- `ml-[80px]` (matches sidebar width exactly, ready for future expandable sidebar)
- Outer Margin/Padding: `py-2 pr-2 pl-0`
- Border Radius: `25px` (`rounded-[25px]`)
- Background: `#F5F7FA` (`bg-[#F5F7FA]`)
- Border: `#E5E7EB` (`border border-[#E5E7EB]`)
- Inner Padding: `pt-4 px-4 pb-8` (16px top, 16px horizontal, 32px bottom)

### 3. Notification Indicator
- Bell Icon: `Notification01Icon` (size `24`)
- Badge: `absolute -top-1 -right-1`, `h-[20px] min-w-[20px]`, `bg-[#FF3B30]`, white `+9`, `text-[11px]`, `font-bold`, `font-rounded`, `shadow-sm`

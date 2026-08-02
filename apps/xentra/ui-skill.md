# UI Skill & Design System Guidelines - Xentra Employee Management

This document defines the exact UI design tokens, component specifications, layout rules, and typography guidelines for the **Xentra Employee Management** platform.

---

## 🎨 Design System & Color Tokens

| Element / Utility | Hex / Style | Description |
| :--- | :--- | :--- |
| **App Shell Background** | `#FBFBFD` | Outer background surrounding sidebar and main layout wrapper |
| **Sidebar Background** | `#FBFBFD` | Clean sidebar background with no right border line |
| **Right Content Card Background** | `#F5F7FA` | Primary dashboard content card surface |
| **Right Content Card Border / Stroke** | `#E5E7EB` | Subtle 1px outer stroke for content card container |
| **Active Accent Color** | `#007AFF` | Apple System Blue for active states & indicators |
| **Active Icon Background Tint** | `#EAF2FF` | Light blue pill background for active sidebar icon |
| **Default / Inactive Icon Color** | `#6B7280` | Muted gray for inactive navigation items |
| **Notification Badge Red** | `#FF3B30` | Vibrant Apple Red for badge counters |

---

## 🔤 Typography & Font Rules

1. **Primary Text Family**: `SF Pro Display`, `SF Pro Text`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`
2. **Numbers & Badges (`SF Pro Rounded`)**:
   - **Global Rule**: Every numeric text, badge counter, and element with class `.font-rounded` MUST use `SF Pro Rounded`.
   - `font-family: "SF Pro Rounded", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif !important;`
   - `font-variant-numeric: tabular-nums;`
3. **Page Titles (e.g., `Home`)**:
   - Font Family: `SF Pro Display`
   - Font Size: `28px` (`text-[28px]`)
   - Font Weight: `Medium` (`font-medium`)
   - Letter Spacing: `tracking-tight`

---

## 📐 Layout & Card Container Specs

### 1. Sidebar (`Sidebar.tsx`)
- **Width**: `80px` fixed (`w-[80px]`)
- **Right Border**: None (`border-r-0`)
- **Icon Dimensions**: `20px x 20px` (`size={20}`)
- **Icon Library**: Hugeicons (`hugeicons-react`)
- **Active Navigation Animations**:
  - `sidebar-active-indicator`: Left vertical bar (`w-[3px]`, `rounded-tr-[25px] rounded-br-[25px]`, `bg-[#007AFF]`) using `framer-motion` spring transition.
  - `sidebar-active-bg`: Sliding background pill (`rounded-[18px]`, `bg-[#EAF2FF]`) using `framer-motion` spring transition.
- **Icon Selections**:
  - **Home**: `Home01Icon`
  - **Attendance**: `Calendar03Icon` (clean plain calendar grid without embedded numbers or checkmarks)
  - **Employees**: `UserGroupIcon`
  - **Department**: `Building01Icon` (office building)
  - **Drive**: `HardDriveIcon`
  - **Alerts**: `Alert01Icon`
  - **Settings**: `Settings01Icon`
  - **Bottom Brand Badge**: `CommandIcon` in `bg-[#007AFF]` square.

### 2. Main Content Wrapper (`layout.tsx`)
- **Left Margin**: `ml-[80px]` (matches sidebar width exactly, ready for future expandable sidebar)
- **Outer Padding**: `py-2 pr-2 pl-0`
- **Right Card Radius**: `25px` (`rounded-[25px]`)
- **Right Card Inner Padding**: `pt-4 px-4 pb-8` (16px top, 16px left & right, 32px bottom)

### 3. Top Header Bar (`page.tsx`)
- **Title**: `Home` (`SF Pro Display`, `font-medium`, `28px`, `text-gray-900`)
- **Notification Icon & Badge**:
  - Icon: `Notification01Icon` (size `24`)
  - Badge: `absolute -top-1 -right-1`, `h-[20px] min-w-[20px]`, `bg-[#FF3B30]`, text `+9`, `text-[11px]`, `font-bold`, `text-white`, `font-rounded`
- **User Avatar**: `UserIcon` (size `22`) in 40x40 circle container (`bg-gray-300`)

---

## 🛠 Developer Cheat Sheet

```tsx
// Applying SF Pro Display to Titles
<h1 className="text-[28px] font-medium text-gray-900 tracking-tight font-['SF_Pro_Display',-apple-system,sans-serif]">
  Title
</h1>

// Applying SF Pro Rounded to Numbers
<span className="font-rounded font-bold text-[#FF3B30]">
  +9
</span>
```

export interface NavItem {
  title: string
  href: string
  icon: string
  badge?: string
  badgeColor?: 'default' | 'accent' | 'warning' | 'destructive'
  children?: NavItem[]
  section?: 'main' | 'management' | 'workspace' | 'system'
}

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'lucide:layout-dashboard',
    section: 'main',
  },
  {
    title: 'Employees',
    href: '/employees',
    icon: 'lucide:users',
    badge: '142',
    section: 'management',
  },
  {
    title: 'Attendance',
    href: '/attendance',
    icon: 'lucide:clock',
    section: 'management',
  },
  {
    title: 'Leave & Time Off',
    href: '/leave',
    icon: 'lucide:calendar-range',
    badge: '5 Pending',
    badgeColor: 'warning',
    section: 'management',
  },
  {
    title: 'Claims & Expenses',
    href: '/claims',
    icon: 'lucide:receipt',
    section: 'management',
  },
  {
    title: 'Departments',
    href: '/departments',
    icon: 'lucide:building-2',
    section: 'management',
  },
  // Future-ready modules
  {
    title: 'Payroll',
    href: '/payroll',
    icon: 'lucide:banknote',
    badge: 'Soon',
    section: 'workspace',
  },
  {
    title: 'Projects & Tasks',
    href: '/projects',
    icon: 'lucide:briefcase',
    section: 'workspace',
  },
  {
    title: 'Documents',
    href: '/documents',
    icon: 'lucide:file-text',
    section: 'workspace',
  },
  {
    title: 'Company Hub',
    href: '/company',
    icon: 'lucide:landmark',
    section: 'workspace',
  },
  {
    title: 'Calendar',
    href: '/calendar',
    icon: 'lucide:calendar',
    section: 'workspace',
  },
  {
    title: 'Analytics & Reports',
    href: '/reports',
    icon: 'lucide:bar-chart-3',
    section: 'workspace',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: 'lucide:settings',
    section: 'system',
  },
]

export const APP_CONFIG = {
  name: 'Xentra',
  tagline: 'Enterprise Human Capital Management Platform',
  version: '1.0.0',
  region: 'SG',
  currency: 'SGD',
  dateFormat: 'dd MMM yyyy',
  timeFormat: 'HH:mm',
  supportEmail: 'support@xentra.io',
  pageSizeDefault: 10,
  pageSizeOptions: [10, 25, 50, 100],
} as const

export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super_admin',
  HR_MANAGER: 'hr_manager',
  DEPARTMENT_HEAD: 'department_head',
  EMPLOYEE: 'employee',
  FINANCE: 'finance',
} as const

export type UserRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES]

import { SYSTEM_ROLES, UserRole } from './constants'

export type Permission =
  | 'employees.view'
  | 'employees.create'
  | 'employees.edit'
  | 'employees.delete'
  | 'attendance.view'
  | 'attendance.manage'
  | 'leave.request'
  | 'leave.approve'
  | 'claims.submit'
  | 'claims.approve'
  | 'payroll.view'
  | 'payroll.process'
  | 'reports.view'
  | 'settings.manage'

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [SYSTEM_ROLES.SUPER_ADMIN]: [
    'employees.view',
    'employees.create',
    'employees.edit',
    'employees.delete',
    'attendance.view',
    'attendance.manage',
    'leave.request',
    'leave.approve',
    'claims.submit',
    'claims.approve',
    'payroll.view',
    'payroll.process',
    'reports.view',
    'settings.manage',
  ],
  [SYSTEM_ROLES.HR_MANAGER]: [
    'employees.view',
    'employees.create',
    'employees.edit',
    'attendance.view',
    'attendance.manage',
    'leave.request',
    'leave.approve',
    'claims.submit',
    'claims.approve',
    'payroll.view',
    'reports.view',
  ],
  [SYSTEM_ROLES.DEPARTMENT_HEAD]: [
    'employees.view',
    'attendance.view',
    'leave.request',
    'leave.approve',
    'claims.submit',
    'claims.approve',
    'reports.view',
  ],
  [SYSTEM_ROLES.FINANCE]: [
    'claims.submit',
    'claims.approve',
    'payroll.view',
    'payroll.process',
    'reports.view',
  ],
  [SYSTEM_ROLES.EMPLOYEE]: [
    'attendance.view',
    'leave.request',
    'claims.submit',
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

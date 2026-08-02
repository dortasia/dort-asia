"use client"

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useQuery } from '@tanstack/react-query'

export type RoleType = 'admin' | 'sub_admin' | 'employee'

export interface PermissionItem {
  id: string
  label: string
  description: string
  module: string
}

export const PERMISSION_MODULES: { id: string; name: string; icon: string }[] = [
  { id: 'attendance', name: 'Attendance & Sites', icon: 'hugeicons:calendar-03' },
  { id: 'leave', name: 'Leave & Time-Off', icon: 'hugeicons:clock-01' },
  { id: 'claims', name: 'Claims & Overtime', icon: 'hugeicons:credit-card' },
  { id: 'team', name: 'Employees & Departments', icon: 'hugeicons:user-group' },
]

export const ALL_PERMISSIONS: PermissionItem[] = [
  // Attendance & Sites
  { id: 'attendance_clock_in_out', label: 'Clock In / Clock Out', description: 'Allow users to record daily attendance via allowed methods.', module: 'attendance' },
  { id: 'attendance_view_own', label: 'View Own Attendance Logs', description: 'Access personal monthly attendance logs and history.', module: 'attendance' },
  { id: 'attendance_view_department', label: 'View Department Attendance', description: 'View attendance records for department team members.', module: 'attendance' },
  { id: 'attendance_scan_qr', label: 'Scan QR Attendance Pass', description: 'Permission to act as an attendance scanner at work sites.', module: 'attendance' },
  { id: 'attendance_manage_sites', label: 'Manage Work Sites & Geofences', description: 'Create, edit, and configure GPS geofencing and site passes.', module: 'attendance' },

  // Leave & Time-Off
  { id: 'leave_submit_request', label: 'Apply for Leave', description: 'Submit leave applications and time-off requests.', module: 'leave' },
  { id: 'leave_approve_department', label: 'Approve Department Leave', description: 'Review and approve/reject leave requests from reportees.', module: 'leave' },
  { id: 'leave_manage_settings', label: 'Manage Leave Policies', description: 'Configure leave types, entitlements, and approval chains.', module: 'leave' },

  // Claims & Overtime
  { id: 'claims_submit_request', label: 'Submit Claims & Overtime', description: 'File expense claims and overtime work hours.', module: 'claims' },
  { id: 'claims_approve_department', label: 'Approve Department Claims', description: 'Review and approve/reject claims & overtime for reportees.', module: 'claims' },
  { id: 'claims_view_reports', label: 'View Financial Summaries', description: 'Access department claim payout summaries and reports.', module: 'claims' },

  // Employees & Departments
  { id: 'team_view_directory', label: 'View Organization Directory', description: 'Access the company employee list and contact details.', module: 'team' },
  { id: 'team_edit_employees', label: 'Add & Edit Employees', description: 'Create employee accounts and update employee information.', module: 'team' },
  { id: 'team_manage_departments', label: 'Manage Departments & Teams', description: 'Set up departments and assign department admins.', module: 'team' },
]

export const DEFAULT_ROLE_PERMISSIONS: Record<RoleType, Record<string, boolean>> = {
  admin: {
    attendance_clock_in_out: true,
    attendance_view_own: true,
    attendance_view_department: true,
    attendance_scan_qr: true,
    attendance_manage_sites: true,
    leave_submit_request: true,
    leave_approve_department: true,
    leave_manage_settings: true,
    claims_submit_request: true,
    claims_approve_department: true,
    claims_view_reports: true,
    team_view_directory: true,
    team_edit_employees: true,
    team_manage_departments: true,
  },
  sub_admin: {
    attendance_clock_in_out: true,
    attendance_view_own: true,
    attendance_view_department: true,
    attendance_scan_qr: true,
    attendance_manage_sites: false,
    leave_submit_request: true,
    leave_approve_department: true,
    leave_manage_settings: false,
    claims_submit_request: true,
    claims_approve_department: true,
    claims_view_reports: false,
    team_view_directory: true,
    team_edit_employees: false,
    team_manage_departments: false,
  },
  employee: {
    attendance_clock_in_out: true,
    attendance_view_own: true,
    attendance_view_department: false,
    attendance_scan_qr: false,
    attendance_manage_sites: false,
    leave_submit_request: true,
    leave_approve_department: false,
    leave_manage_settings: false,
    claims_submit_request: true,
    claims_approve_department: false,
    claims_view_reports: false,
    team_view_directory: true,
    team_edit_employees: false,
    team_manage_departments: false,
  }
}

export function SettingsRolesPage() {
  const { company } = useCompanyStore()
  const [companyId, setCompanyId] = useState<string | null>(null)

  // 1. Resolve Company ID securely
  useEffect(() => {
    async function resolveCompanyId() {
      if (company?.id) {
        setCompanyId(company.id)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        const { data: emp } = await supabase
          .from('employees')
          .select('company_id')
          .eq('user_id', user.id)
          .maybeSingle()
          
        if (emp?.company_id) {
          setCompanyId(emp.company_id)
          return
        }

        const { data: comp } = await supabase
          .from('companies')
          .select('id')
          .eq('super_admin_id', user.id)
          .maybeSingle()
        if (comp?.id) {
          setCompanyId(comp.id)
          return
        }
      }
    }
    resolveCompanyId()
  }, [company?.id])

  // 2. Fetch Company Settings
  const { data: roleSettingsData = {}, isLoading: isQueryLoading } = useQuery<any>({
    queryKey: ['company_settings', 'roles', companyId],
    queryFn: async () => {
      if (!companyId) return {}
      const { data, error } = await supabase
        .from('company_settings')
        .select('role_permissions')
        .eq('company_id', companyId)
        .maybeSingle()

      if (error) throw error
      return data?.role_permissions || {}
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  })

  const currentPermissions = {
    admin: { ...DEFAULT_ROLE_PERMISSIONS.admin, ...(roleSettingsData.admin || {}) },
    sub_admin: { ...DEFAULT_ROLE_PERMISSIONS.sub_admin, ...(roleSettingsData.sub_admin || {}) },
    employee: { ...DEFAULT_ROLE_PERMISSIONS.employee, ...(roleSettingsData.employee || {}) },
  }

  const countActive = (role: RoleType) => {
    const permMap = currentPermissions[role] || {}
    return ALL_PERMISSIONS.filter(p => !!permMap[p.id]).length
  }

  const roleRedirectCards = [
    {
      id: 'authenticate_employee',
      title: 'Authenticate Employee',
      desc: 'Search employees and securely assign or reset passwords to manage their login access.',
      href: '/settings/roles/authenticate',
      icon: 'hugeicons:shield-key',
      badge: 'Authentication & Pass'
    },
    {
      id: 'access_to_employees',
      title: 'Access to Employees',
      desc: 'Configure granular access permissions, role capabilities, and feature controls for employee users.',
      href: '/settings/roles/employee',
      icon: 'hugeicons:user-group',
      badge: `${countActive('employee')} / ${ALL_PERMISSIONS.length} Enabled`
    }
  ]

  return (
    <div className="flex flex-col gap-6 max-w-[800px] pb-12 relative">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 type-small text-[#737373] mb-3">
          <Link href="/settings" className="hover:text-[#161616] transition-colors">Settings</Link>
          <span>/</span>
          <span className="text-[#161616] font-medium">Roles & Access</span>
        </div>
        <h2 className="text-[28px] font-medium text-[#111827] tracking-tight font-sans">Roles & Access Control</h2>
        <p className="type-small text-[#737373] mt-1">Manage employee authentication methods and configure granular access permissions for your organization.</p>
      </div>

      {/* Main Redirect Cards Container */}
      <div className="bg-white rounded-[24px] border border-[#E5E7EB] flex flex-col relative shadow-xs">
        {isQueryLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-[24px] z-20 flex items-center justify-center">
            <Icon icon="hugeicons:loading-01" className="w-6 h-6 animate-spin text-black" />
          </div>
        )}

        {roleRedirectCards.map((card, idx) => (
          <Link 
            key={card.id}
            href={card.href}
            className={`p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group ${
              idx < roleRedirectCards.length - 1 ? 'border-b border-[#E5E7EB]' : ''
            } ${idx === 0 ? 'first:rounded-t-[24px]' : ''} ${idx === roleRedirectCards.length - 1 ? 'last:rounded-b-[24px]' : ''}`}
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-[20px] bg-[#F4F4F5] flex items-center justify-center shrink-0 text-[#161616] group-hover:bg-white group-hover:shadow-sm transition-all">
                <Icon icon={card.icon} className="w-7 h-7" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2.5">
                  <span className="type-body-medium font-semibold text-[#161616]">{card.title}</span>
                  <span className="type-caption px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold border border-gray-200">
                    {card.badge}
                  </span>
                </div>
                <span className="type-small text-[#737373]">{card.desc}</span>
              </div>
            </div>

            <Icon icon="hugeicons:arrow-right-01" className="w-5 h-5 text-[#8B8B8B] shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}

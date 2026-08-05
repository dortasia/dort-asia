"use client"

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { getAvatarUrl } from '@/lib/utils'
import { EditDepartmentDialog } from '@/features/departments/components/EditDepartmentDialog'
import { AdvancedDepartmentSettingsDialog } from '@/features/departments/components/AdvancedDepartmentSettingsDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TransferEmployeeDialog } from '@/features/departments/components/TransferEmployeeDialog'
import { ChangeDesignationDialog } from '@/features/departments/components/ChangeDesignationDialog'
import { ChangeReporteeDialog } from '@/features/departments/components/ChangeReporteeDialog'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export function DepartmentDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const supabase = createClient()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false)
  
  const [transferEmployee, setTransferEmployee] = useState<any>(null)
  const [reporteeEmployee, setReporteeEmployee] = useState<any>(null)
  const [designationEmployee, setDesignationEmployee] = useState<any>(null)
  const [viewEmployeeId, setViewEmployeeId] = useState<string | null>(null)



  // Fetch department
  const { data: dept, isLoading: loadingDept } = useQuery({
    queryKey: ['department', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id
  })


  const { data: employees = [], isLoading: loadingEmps } = useQuery({
    queryKey: ['department-employees', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('department_id', id)
      if (error) throw error
      return data || []
    },
    enabled: !!id
  })

  const isLoading = loadingDept || loadingEmps

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Icon icon="hugeicons:loading-02" className="w-8 h-8 text-[#8B8B8B] animate-spin" />
      </div>
    )
  }

  if (!dept) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p className="type-body text-[#737373]">Department not found.</p>
      </div>
    )
  }

  const createdDate = new Date(dept.created_date || dept.created_at || new Date()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  // Dynamic Colors from DB with fallback
  const fallbackThemes = [
    { bg: '#FBE0CD', accent: '#F9863E' },
    { bg: '#D1F2E0', accent: '#00C978' },
    { bg: '#E3D6F5', accent: '#00C978' },
    { bg: '#FCE7F3', accent: '#EC4899' },
    { bg: '#E0E7FF', accent: '#6366F1' },
    { bg: '#FEF3C7', accent: '#F59E0B' },
  ]

  const departmentHead = employees.find((emp: any) => emp.app_role === 'Admin')
  const departmentHeadName = departmentHead?.name || dept.department_head || "Not Assigned"

  return (
    <div className="flex h-full w-full bg-[#FBFBFB] overflow-hidden">
      
      {/* Sidebar - Full height left */}
      <div className="w-[280px] shrink-0 bg-white border-r border-[#E5E7EB] h-full flex flex-col overflow-y-auto">
        <div className="p-5 flex flex-col gap-6">
          
          {/* Back Button */}
          <button 
            onClick={() => router.push('/departments')}
            className="w-10 h-10 rounded-full border border-[#E5E7EB] flex items-center justify-center hover:bg-[#FBFBFB] transition-colors"
          >
            <Icon icon="hugeicons:arrow-left-01" className="w-5 h-5 text-[#161616]" />
          </button>

          {/* Department Header */}
          <div className="flex flex-col gap-1.5">
            <span className="type-caption uppercase tracking-wider text-[#737373] font-medium">Department Overview</span>
            <h2 className="type-h1 text-[#161616] mb-1">{dept.department_name}</h2>
            <p className="type-small text-[#737373] leading-relaxed mb-6">
              {dept.description || 'Manage all operations and members of this department.'}
            </p>
          </div>

          {/* Department Stats / Details Grid */}
          <div className="flex flex-col gap-3">
            <div className="bg-[#F9FAFB] rounded-[12px] p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                <Icon icon="hugeicons:user-group" className="w-5 h-5 text-[#161616]" />
              </div>
              <div className="flex flex-col">
                <span className="type-caption text-[#737373]">Total Employees</span>
                <span className="type-small font-semibold text-[#161616]">{employees.length} Members</span>
              </div>
            </div>

            <div className="bg-[#F9FAFB] rounded-[12px] p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                <Icon icon="hugeicons:calendar-03" className="w-5 h-5 text-[#161616]" />
              </div>
              <div className="flex flex-col">
                <span className="type-caption text-[#737373]">Created On</span>
                <span className="type-small font-semibold text-[#161616]">{createdDate}</span>
              </div>
            </div>


            <div className="bg-[#F9FAFB] rounded-[12px] p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                <Icon icon="hugeicons:user-star-01" className="w-5 h-5 text-[#161616]" />
              </div>
              <div className="flex flex-col">
                <span className="type-caption text-[#737373]">Department Head</span>
                <span className="type-small font-semibold text-[#161616]">{departmentHeadName}</span>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-5 border-t border-[#E5E7EB] flex flex-col gap-2">
            <button 
              onClick={() => setIsEditDialogOpen(true)}
              className="w-full py-2.5 type-small font-medium bg-black text-white rounded-[10px] hover:bg-neutral-800 transition-colors"
            >
              Edit Department
            </button>
            <button 
              onClick={() => setIsAdvancedSettingsOpen(true)}
              className="w-full py-2.5 type-small font-medium bg-[#F4F4F5] text-[#161616] rounded-[10px] hover:bg-[#E5E7EB] transition-colors"
            >
              Advanced Settings
            </button>
          </div>
        </div>
      </div>

      {/* Right Content Area - Employees Grid */}
      <div className="flex-1 h-full flex flex-col overflow-y-auto">
        
        {/* Sticky Glassy Header Row */}
        <div className="sticky top-0 z-50 flex justify-between items-center px-6 h-[64px] shrink-0 relative">
          {/* Soft Foggy Background Mask Layer */}
          <div 
            className="absolute top-0 left-0 right-0 h-[80px] z-[-1] bg-[#FBFBFB]/80 backdrop-blur-[12px] pointer-events-none"
            style={{ 
              WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', 
              maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' 
            }}
          />
          <div className="flex flex-col gap-0 relative z-10">
            <h2 className="type-h1 text-black">Employee Profiles</h2>
            <p className="type-small text-[#737373]">People in {dept.department_name}</p>
          </div>
        </div>

        {/* Employees Grid */}
        <div className="p-6 pt-2">
          {employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[#E5E7EB] rounded-[24px] bg-white">
              <div className="w-12 h-12 rounded-full bg-[#F4F4F5] flex items-center justify-center mb-3">
                <Icon icon="hugeicons:user-group" className="w-6 h-6 text-[#8B8B8B]" />
              </div>
              <p className="type-body font-medium text-[#161616] mb-1">No employees found in this department</p>
              <p className="type-caption text-[#737373]">Add employees to this department to see them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 items-start">
              {[...employees].sort((a, b) => {
                const isAHead = a.app_role === 'Admin' || a.role === 'Admin' ? 1 : 0
                const isBHead = b.app_role === 'Admin' || b.role === 'Admin' ? 1 : 0
                return isBHead - isAHead
              }).map((emp, index) => {
                const statusStr = (emp.status || 'ACTIVE').toUpperCase()
                let badgeStyle = 'bg-[#DCFCE7] text-[#166534]'
                if (statusStr.includes('LEAVE')) badgeStyle = 'bg-[#DBEAFE] text-[#1E40AF]'
                else if (statusStr.includes('REMOTE')) badgeStyle = 'bg-[#F3E8FF] text-[#6B21A8]'

                const joiningDateStr = emp.joining_date 
                  ? new Date(emp.joining_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                  : emp.created_at 
                    ? new Date(emp.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                    : 'Aug 24, 2022'

                return (
                  <div key={emp.id} className="rounded-[24px] border border-[#E5E7EB] bg-white flex flex-col p-4 gap-3.5 shadow-2xs hover:shadow-md transition-shadow">
                    {/* Header Row: App-Role Badge (Replacing Checkbox) + Status Badge + Actions Menu */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]">
                        {emp.app_role || 'EMPLOYEE'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${badgeStyle}`}>
                          {statusStr}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-7 h-7 rounded-full flex items-center justify-center text-[#737373] hover:text-[#161616] hover:bg-[#F3F4F6] transition-colors cursor-pointer shrink-0">
                              <Icon icon="hugeicons:more-vertical" className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[210px] bg-white border border-gray-100 text-gray-900 rounded-[20px] p-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] z-50">
                            <DropdownMenuItem 
                              onClick={() => router.push(`/employees/${emp.id}/edit`)}
                              className="flex items-center px-3 py-2.5 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 focus:bg-gray-100/80 focus:text-gray-900 transition-colors cursor-pointer"
                            >
                              <Icon icon="hugeicons:edit-02" className="w-[18px] h-[18px] mr-3 text-gray-600" />
                              Edit Employee
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setTransferEmployee(emp)}
                              className="flex items-center px-3 py-2.5 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 focus:bg-gray-100/80 focus:text-gray-900 transition-colors cursor-pointer"
                            >
                              <Icon icon="hugeicons:exchange-01" className="w-[18px] h-[18px] mr-3 text-gray-600" />
                              Transfer Employee
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setReporteeEmployee(emp)}
                              className="flex items-center px-3 py-2.5 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 focus:bg-gray-100/80 focus:text-gray-900 transition-colors cursor-pointer"
                            >
                              <Icon icon="hugeicons:user-switch" className="w-[18px] h-[18px] mr-3 text-gray-600" />
                              Change Reportee
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDesignationEmployee(emp)}
                              className="flex items-center px-3 py-2.5 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 focus:bg-gray-100/80 focus:text-gray-900 transition-colors cursor-pointer"
                            >
                              <Icon icon="hugeicons:briefcase-02" className="w-[18px] h-[18px] mr-3 text-gray-600" />
                              Change Designation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Employee Profile Header (Avatar + Name + Title) */}
                    <div className="flex items-center gap-3">
                      <img 
                        src={getAvatarUrl(emp.name, emp.avatar_url)} 
                        alt={emp.name || 'Employee'}
                        onError={(e) => { e.currentTarget.src = '/default-profile.svg' }}
                        className="w-12 h-12 rounded-full object-cover shrink-0 border border-[#E5E7EB]"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <h3 className="text-[15px] font-bold text-[#161616] truncate leading-tight">{emp.name || 'Unknown'}</h3>
                        <p className="text-xs text-[#737373] font-medium truncate mt-0.5">{emp.designation || 'PHP Web Developer'}</p>
                      </div>
                    </div>

                    {/* Department & Date of Joining Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-[#8B8B8B] tracking-wider uppercase">DEPARTMENT</span>
                        <span className="text-xs font-semibold text-[#161616] truncate mt-0.5">{dept.department_name || 'Development'}</span>
                      </div>
                      <div className="flex flex-col min-w-0 text-right items-end">
                        <span className="text-[10px] font-bold text-[#8B8B8B] tracking-wider uppercase">DATE OF JOINING</span>
                        <span className="text-xs font-semibold text-[#161616] truncate mt-0.5">{joiningDateStr}</span>
                      </div>
                    </div>

                    {/* Contact Info Box */}
                    <div className="bg-[#F9FAFB] rounded-[14px] p-3 flex flex-col gap-1.5 border border-[#F3F4F6]">
                      <div className="flex items-center gap-2.5 text-xs text-[#525252] min-w-0">
                        <Icon icon="hugeicons:mail-01" className="w-4 h-4 text-[#8B8B8B] shrink-0" />
                        <span className="truncate">{emp.email || 'employee@example.com'}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-[#525252] min-w-0">
                        <Icon icon="hugeicons:call-02" className="w-4 h-4 text-[#8B8B8B] shrink-0" />
                        <span className="truncate">{emp.phone || emp.mobile || '(123) 456-7890'}</span>
                      </div>
                    </div>

                    {/* Bottom Action Pills: Edit & View */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <button 
                        onClick={() => router.push(`/employees/${emp.id}/edit`)}
                        className="w-full py-2 bg-[#DCE7FD] hover:bg-[#C7DCFD] text-[#2563EB] font-medium text-xs rounded-full transition-colors cursor-pointer text-center"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => router.push(`/employees/${emp.id}`)}
                        className="w-full py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs rounded-full transition-colors cursor-pointer text-center"
                      >
                        View
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {dept && (
        <>
          <EditDepartmentDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            department={dept}
          />
          <AdvancedDepartmentSettingsDialog
            open={isAdvancedSettingsOpen}
            onOpenChange={setIsAdvancedSettingsOpen}
            department={dept}
            employees={employees}
          />
          <TransferEmployeeDialog 
            open={!!transferEmployee} 
            onOpenChange={(open) => !open && setTransferEmployee(null)} 
            employee={transferEmployee} 
          />
          <ChangeDesignationDialog 
            open={!!designationEmployee} 
            onOpenChange={(open) => !open && setDesignationEmployee(null)} 
            employee={designationEmployee} 
          />
          <ChangeReporteeDialog 
            open={!!reporteeEmployee} 
            onOpenChange={(open) => !open && setReporteeEmployee(null)} 
            employee={reporteeEmployee} 
          />


        </>
      )}
      
    </div>
  )
}

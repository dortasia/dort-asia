"use client"

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function SettingsDepartmentPage() {
  const { company } = useCompanyStore()
  const queryClient = useQueryClient()
  
  // Settings State
  const [crossAttendanceReporting, setCrossAttendanceReporting] = useState(false)
  const [restrictEmployeeEditing, setRestrictEmployeeEditing] = useState(true)
  const [timingMode, setTimingMode] = useState<'company' | 'department'>('company')

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

      const { data: fallbackComp } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .maybeSingle()
      if (fallbackComp?.id) {
        setCompanyId(fallbackComp.id)
      }
    }

    resolveCompanyId()
  }, [company?.id])

  // 2. React Query: Fetch Company Settings (Category A - Static Data)
  const { data: companyModuleSettings = {}, isLoading: isQueryLoading } = useQuery({
    queryKey: ['company_settings', 'module', companyId],
    queryFn: async () => {
      if (!companyId) return {}
      const { data, error } = await supabase
        .from('company_settings')
        .select('company_module_settings')
        .eq('company_id', companyId)
        .maybeSingle()

      if (error) throw error
      return data?.company_module_settings || {}
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  })

  // Synchronize local form state with cached settings when data loads or updates
  useEffect(() => {
    if (companyModuleSettings?.department_settings) {
      const dept = companyModuleSettings.department_settings
      if (typeof dept.crossAttendanceReporting === 'boolean') setCrossAttendanceReporting(dept.crossAttendanceReporting)
      if (typeof dept.restrictEmployeeEditing === 'boolean') setRestrictEmployeeEditing(dept.restrictEmployeeEditing)
      if (dept.timingMode) setTimingMode(dept.timingMode)
    }
  }, [companyModuleSettings])

  // 3. Supabase Realtime Subscription
  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel(`company_settings_dept_${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_settings',
          filter: `company_id=eq.${companyId}`
        },
        (payload: any) => {
          if (payload.new && payload.new.company_module_settings) {
            queryClient.setQueryData(['company_settings', 'module', companyId], payload.new.company_module_settings)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId, queryClient])

  // 4. React Query Mutation: Optimistic Update + Persistence
  const saveMutation = useMutation({
    mutationFn: async (updatedDepartmentSettings: any) => {
      if (!companyId) throw new Error('Company ID not found. Unable to save.')
      
      const newModuleSettings = {
        ...companyModuleSettings,
        department_settings: updatedDepartmentSettings
      }

      const { error } = await supabase
        .from('company_settings')
        .update({ company_module_settings: newModuleSettings })
        .eq('company_id', companyId)

      if (error) throw error
      return newModuleSettings
    },
    onMutate: async (newModuleSettings) => {
      await queryClient.cancelQueries({ queryKey: ['company_settings', 'module', companyId] })
      const previousConfig = queryClient.getQueryData(['company_settings', 'module', companyId])
      queryClient.setQueryData(['company_settings', 'module', companyId], newModuleSettings)
      return { previousConfig }
    },
    onError: (err: any, _, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(['company_settings', 'module', companyId], context.previousConfig)
      }
      toast.error(err.message || 'Failed to save settings')
    },
    onSuccess: () => {
      toast.success('Department settings saved successfully!')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['company_settings', 'module', companyId] })
    }
  })

  const handleSave = () => {
    const updatedDepartmentSettings = {
      ...(companyModuleSettings?.department_settings || {}),
      crossAttendanceReporting,
      restrictEmployeeEditing,
      timingMode
    }
    saveMutation.mutate(updatedDepartmentSettings)
  }

  const isSaving = saveMutation.isPending

  return (
    <div className="flex flex-col gap-6 max-w-[800px]">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="type-h2 text-[#161616]">Department Settings</h2>
          <p className="type-small text-[#737373] mt-1">Manage cross-department reporting, timing rules, and profile editing limits.</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isSaving || isQueryLoading}
          className="px-6 py-2.5 type-body-medium font-semibold rounded-full bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          {isSaving && <Icon icon="hugeicons:loading-01" className="w-4 h-4 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-8 flex flex-col gap-8 relative">
        {isQueryLoading && !companyModuleSettings.department_settings && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-[24px] z-20 flex items-center justify-center">
            <Icon icon="hugeicons:loading-01" className="w-6 h-6 animate-spin text-black" />
          </div>
        )}

        {/* Cross Attendance Reporting */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="type-body-medium text-[#161616]">Cross Attendance Reporting</h4>
            <p className="type-small text-[#737373]">Allow employees from one department to report attendance directly to an admin of another department.</p>
          </div>
          <div 
            onClick={() => setCrossAttendanceReporting(!crossAttendanceReporting)}
            className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${crossAttendanceReporting ? 'bg-[#34C759]' : 'bg-neutral-200'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm transition-all ${crossAttendanceReporting ? 'left-[22px]' : 'left-[2px]'}`}></div>
          </div>
        </div>

        <div className="h-px bg-[#E5E7EB] w-full" />

        {/* Restrict Employee Editing */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="type-body-medium text-[#161616]">Restrict Employee Profile Editing</h4>
            <p className="type-small text-[#737373]">Prevent employees from modifying their personal or work details once onboarded without HR approval.</p>
          </div>
          <div 
            onClick={() => setRestrictEmployeeEditing(!restrictEmployeeEditing)}
            className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${restrictEmployeeEditing ? 'bg-[#34C759]' : 'bg-neutral-200'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm transition-all ${restrictEmployeeEditing ? 'left-[22px]' : 'left-[2px]'}`}></div>
          </div>
        </div>

        <div className="h-px bg-[#E5E7EB] w-full" />

        {/* Leave & Attendance Timing Settings */}
        <div>
          <h4 className="type-body-medium text-[#161616] mb-1">Leave & Attendance Timing Mode</h4>
          <p className="type-small text-[#737373] mb-4">Choose whether departments follow company-wide standard hours or custom department shifts.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => setTimingMode('company')}
              className={`p-4 rounded-xl border text-left transition-colors flex flex-col gap-1 ${
                timingMode === 'company' ? 'border-black bg-neutral-50' : 'border-[#ECECEC] hover:border-[#D4D4D4] bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="type-body-medium text-[#161616]">Company Timing</span>
                {timingMode === 'company' && <Icon icon="hugeicons:checkmark-circle-02" className="w-5 h-5 text-[#34C759]" />}
              </div>
              <span className="type-small text-[#737373]">All departments adhere to global company working hours (09:00 AM - 06:00 PM).</span>
            </button>

            <button 
              type="button"
              onClick={() => setTimingMode('department')}
              className={`p-4 rounded-xl border text-left transition-colors flex flex-col gap-1 ${
                timingMode === 'department' ? 'border-black bg-neutral-50' : 'border-[#ECECEC] hover:border-[#D4D4D4] bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="type-body-medium text-[#161616]">Department Based Timing</span>
                {timingMode === 'department' && <Icon icon="hugeicons:checkmark-circle-02" className="w-5 h-5 text-[#34C759]" />}
              </div>
              <span className="type-small text-[#737373]">Custom working hours enabled. Shift start and end times are set when creating/editing each department.</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

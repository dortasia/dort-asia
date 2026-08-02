"use client"

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function SettingsOvertimeAdvancedPage() {
  const { company } = useCompanyStore()
  const queryClient = useQueryClient()
  
  const [autoApproveOt, setAutoApproveOt] = useState(false)
  const [autoApproveOtHours, setAutoApproveOtHours] = useState<string>('1')
  const [hierarchySetupRequired, setHierarchySetupRequired] = useState(false)

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
  const { data: overtimeSettings = {}, isLoading: isQueryLoading } = useQuery({
    queryKey: ['company_settings', 'overtime', companyId],
    queryFn: async () => {
      if (!companyId) return {}
      const { data, error } = await supabase
        .from('company_settings')
        .select('overtime_settings')
        .eq('company_id', companyId)
        .maybeSingle()

      if (error) throw error
      return data?.overtime_settings || {}
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  })

  // Synchronize local form state with cached settings when data loads or updates
  useEffect(() => {
    if (overtimeSettings?.advanced) {
      const adv = overtimeSettings.advanced
      if (typeof adv.autoApproveOt === 'boolean') setAutoApproveOt(adv.autoApproveOt)
      if (adv.autoApproveOtHours !== undefined) setAutoApproveOtHours(String(adv.autoApproveOtHours))
      if (typeof adv.hierarchySetupRequired === 'boolean') setHierarchySetupRequired(adv.hierarchySetupRequired)
    }
  }, [overtimeSettings])

  // 3. Supabase Realtime Subscription
  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel(`company_settings_ot_${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_settings',
          filter: `company_id=eq.${companyId}`
        },
        (payload: any) => {
          if (payload.new && payload.new.overtime_settings) {
            queryClient.setQueryData(['company_settings', 'overtime', companyId], payload.new.overtime_settings)
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
    mutationFn: async (updatedAdvanced: any) => {
      if (!companyId) throw new Error('Company ID not found. Unable to save.')
      
      const newOvertimeSettings = {
        ...overtimeSettings,
        advanced: updatedAdvanced
      }

      const { error } = await supabase
        .from('company_settings')
        .update({ overtime_settings: newOvertimeSettings })
        .eq('company_id', companyId)

      if (error) throw error
      return newOvertimeSettings
    },
    onMutate: async (newOvertimeSettings) => {
      await queryClient.cancelQueries({ queryKey: ['company_settings', 'overtime', companyId] })
      const previousConfig = queryClient.getQueryData(['company_settings', 'overtime', companyId])
      queryClient.setQueryData(['company_settings', 'overtime', companyId], newOvertimeSettings)
      return { previousConfig }
    },
    onError: (err: any, _, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(['company_settings', 'overtime', companyId], context.previousConfig)
      }
      toast.error(err.message || 'Failed to save settings')
    },
    onSuccess: () => {
      toast.success('Overtime settings saved successfully!')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['company_settings', 'overtime', companyId] })
    }
  })

  const handleSave = () => {
    const updatedAdvanced = {
      ...(overtimeSettings?.advanced || {}),
      autoApproveOt,
      autoApproveOtHours,
      hierarchySetupRequired
    }
    saveMutation.mutate(updatedAdvanced)
  }

  const isSaving = saveMutation.isPending

  return (
    <div className="flex flex-col gap-6 max-w-[800px]">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 type-small text-[#737373] mb-4">
            <Link href="/settings/employees" className="hover:text-[#161616] transition-colors flex items-center gap-1">
              <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
              Employee Settings
            </Link>
            <span>/</span>
            <span className="text-[#161616]">OT Management</span>
          </div>
          <div>
            <h2 className="type-h2 text-[#161616]">Overtime (OT) Settings</h2>
            <p className="type-small text-[#737373] mt-1">Configure global overtime auto-approval limits and approval policies.</p>
          </div>
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
        {isQueryLoading && !overtimeSettings.advanced && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-[24px] z-20 flex items-center justify-center">
            <Icon icon="hugeicons:loading-01" className="w-6 h-6 animate-spin text-black" />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="type-body-medium text-[#161616]">Auto-Approve Short OT</h4>
              <p className="type-small text-[#737373]">Automatically approve overtime requests within a specified hour limit.</p>
            </div>
            <div 
              onClick={() => setAutoApproveOt(!autoApproveOt)}
              className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${autoApproveOt ? 'bg-[#34C759]' : 'bg-neutral-200'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm transition-all ${autoApproveOt ? 'left-[22px]' : 'left-[2px]'}`}></div>
            </div>
          </div>

          {autoApproveOt && (
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] p-6 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                   <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-[#E0E7FF] flex items-center justify-center text-[#4F46E5]">
                       <Icon icon="hugeicons:clock-01" className="w-4 h-4" />
                     </div>
                     <h5 className="type-body-medium text-[#161616]">Auto-Approval Hours Threshold Setup</h5>
                   </div>
                   <p className="type-small text-[#64748B] max-w-[420px]">
                     Overtime applications up to this duration will be automatically approved without requiring manual managerial sign-off.
                   </p>
                </div>

                <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 shadow-sm focus-within:border-black transition-colors shrink-0">
                  <input 
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={autoApproveOtHours}
                    onChange={(e) => setAutoApproveOtHours(e.target.value)}
                    placeholder="1"
                    className="w-16 bg-transparent outline-none type-body-medium font-medium text-[#161616] text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="type-body-medium font-semibold text-[#737373] select-none">hrs</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-[#E5E7EB] w-full" />

        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h4 className="type-body-medium text-[#161616]">Hierarchy Setup</h4>
              <p className="type-small text-[#737373]">Require strict managerial hierarchy for overtime approvals.</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div 
                onClick={() => setHierarchySetupRequired(!hierarchySetupRequired)}
                className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${hierarchySetupRequired ? 'bg-[#34C759]' : 'bg-neutral-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm transition-all ${hierarchySetupRequired ? 'left-[22px]' : 'left-[2px]'}`}></div>
              </div>
            </div>
          </div>
          
          {hierarchySetupRequired && (
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] p-6 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                   <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-[#E0E7FF] flex items-center justify-center text-[#4F46E5]">
                       <Icon icon="hugeicons:git-merge" className="w-4 h-4" />
                     </div>
                     <h5 className="type-body-medium text-[#161616]">Approval Hierarchy Configured</h5>
                   </div>
                   <p className="type-small text-[#64748B] max-w-[400px]">
                     Employees will require approvals based on the custom or automated chain you have built. Make sure to review the chain to ensure it's up to date.
                   </p>
                </div>
                <Link 
                  href="/settings/overtime/hierarchy" 
                  className="px-5 py-2.5 bg-white border border-[#E2E8F0] shadow-sm text-[#161616] type-body-medium font-medium rounded-xl hover:bg-neutral-50 transition-colors whitespace-nowrap flex items-center gap-2"
                >
                  Edit Hierarchy
                  <Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 text-[#8B8B8B]" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

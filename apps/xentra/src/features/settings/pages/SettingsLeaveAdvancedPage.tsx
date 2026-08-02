"use client"

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function SettingsLeaveAdvancedPage() {
  const { company } = useCompanyStore()
  const queryClient = useQueryClient()
  
  const [autoApprove, setAutoApprove] = useState(false)
  const [sandwichPolicy, setSandwichPolicy] = useState(false)
  const [hierarchySetupRequired, setHierarchySetupRequired] = useState(false)
  
  const [isDatePopOpen, setIsDatePopOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(0)
  const [selectedDay, setSelectedDay] = useState(1)

  const [companyId, setCompanyId] = useState<string | null>(null)
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const daysInMonth = new Date(2024, selectedMonth + 1, 0).getDate()

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

  // 2. React Query: Fetch Company Settings (Category A - Static Data, cached locally)
  const { data: leaveSettings = {}, isLoading: isQueryLoading } = useQuery({
    queryKey: ['company_settings', 'leave', companyId],
    queryFn: async () => {
      if (!companyId) return {}
      const { data, error } = await supabase
        .from('company_settings')
        .select('leave_settings')
        .eq('company_id', companyId)
        .maybeSingle()

      if (error) throw error
      return data?.leave_settings || {}
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  })

  // Synchronize local form state with cached settings when data loads or updates
  useEffect(() => {
    if (leaveSettings?.advanced) {
      const adv = leaveSettings.advanced
      if (typeof adv.autoApprove === 'boolean') setAutoApprove(adv.autoApprove)
      if (typeof adv.sandwichPolicy === 'boolean') setSandwichPolicy(adv.sandwichPolicy)
      if (typeof adv.hierarchySetupRequired === 'boolean') setHierarchySetupRequired(adv.hierarchySetupRequired)
      if (typeof adv.selectedMonth === 'number') setSelectedMonth(adv.selectedMonth)
      if (typeof adv.selectedDay === 'number') setSelectedDay(adv.selectedDay)
    }
  }, [leaveSettings])

  // 3. Supabase Realtime Subscription for Instant Multi-Tab/Device Cache Updates
  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel(`company_settings_leave_${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_settings',
          filter: `company_id=eq.${companyId}`
        },
        (payload: any) => {
          if (payload.new && payload.new.leave_settings) {
            queryClient.setQueryData(['company_settings', 'leave', companyId], payload.new.leave_settings)
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
      
      const newLeaveSettings = {
        ...leaveSettings,
        advanced: updatedAdvanced
      }

      const { error } = await supabase
        .from('company_settings')
        .update({ leave_settings: newLeaveSettings })
        .eq('company_id', companyId)

      if (error) throw error
      return newLeaveSettings
    },
    onMutate: async (newLeaveSettings) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['company_settings', 'leave', companyId] })

      const previousConfig = queryClient.getQueryData(['company_settings', 'leave', companyId])
      queryClient.setQueryData(['company_settings', 'leave', companyId], newLeaveSettings)

      return { previousConfig }
    },
    onError: (err: any, _, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(['company_settings', 'leave', companyId], context.previousConfig)
      }
      toast.error(err.message || 'Failed to save settings')
    },
    onSuccess: () => {
      toast.success('Advanced leave settings saved successfully!')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['company_settings', 'leave', companyId] })
    }
  })

  const handleSave = () => {
    const updatedAdvanced = {
      ...(leaveSettings?.advanced || {}),
      autoApprove,
      sandwichPolicy,
      hierarchySetupRequired,
      selectedMonth,
      selectedDay,
    }
    
    saveMutation.mutate(updatedAdvanced)
  }

  const isSaving = saveMutation.isPending

  return (
    <div className="flex flex-col gap-6 max-w-[800px]">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 type-small text-[#737373] mb-4">
            <Link href="/settings/leave" className="hover:text-[#161616] transition-colors flex items-center gap-1">
              <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
              Leave Management
            </Link>
            <span>/</span>
            <span className="text-[#161616]">Advanced Settings</span>
          </div>
          <div>
            <h2 className="type-h2 text-[#161616]">Advanced Settings</h2>
            <p className="type-small text-[#737373] mt-1">Configure global leave management settings for your company.</p>
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
        {/* Skeleton loading only if initial query has no cached data */}
        {isQueryLoading && !leaveSettings.advanced && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-[24px] z-20 flex items-center justify-center">
            <Icon icon="hugeicons:loading-01" className="w-6 h-6 animate-spin text-black" />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h4 className="type-body-medium text-[#161616]">Auto-Approve Leave</h4>
            <p className="type-small text-[#737373]">Automatically approve leave requests under 2 days.</p>
          </div>
          <div 
            onClick={() => setAutoApprove(!autoApprove)}
            className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${autoApprove ? 'bg-[#34C759]' : 'bg-neutral-200'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm transition-all ${autoApprove ? 'left-[22px]' : 'left-[2px]'}`}></div>
          </div>
        </div>

        <div className="h-px bg-[#E5E7EB] w-full" />

        <div className="flex items-center justify-between">
          <div>
            <h4 className="type-body-medium text-[#161616]">Sandwich Policy</h4>
            <p className="type-small text-[#737373]">Count weekends and holidays if bounded by leaves.</p>
          </div>
          <div 
            onClick={() => setSandwichPolicy(!sandwichPolicy)}
            className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${sandwichPolicy ? 'bg-[#34C759]' : 'bg-neutral-200'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm transition-all ${sandwichPolicy ? 'left-[22px]' : 'left-[2px]'}`}></div>
          </div>
        </div>
        
        <div className="h-px bg-[#E5E7EB] w-full" />

        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h4 className="type-body-medium text-[#161616]">Hierarchy Setup</h4>
              <p className="type-small text-[#737373]">Require strict managerial hierarchy for approvals.</p>
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
                  href="/settings/leave/hierarchy" 
                  className="px-5 py-2.5 bg-white border border-[#E2E8F0] shadow-sm text-[#161616] type-body-medium font-medium rounded-xl hover:bg-neutral-50 transition-colors whitespace-nowrap flex items-center gap-2"
                >
                  Edit Hierarchy
                  <Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 text-[#8B8B8B]" />
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-[#E5E7EB] w-full" />
        
        <div className="flex flex-col gap-2">
          <div>
            <h4 className="type-body-medium text-[#161616]">Leave Year Starts On</h4>
            <p className="type-small text-[#737373]">When does the leave balance reset for employees?</p>
          </div>
          <div className="relative max-w-[300px] mt-2">
            <button 
              onClick={() => setIsDatePopOpen(!isDatePopOpen)}
              className="w-full px-3 py-2 border border-[#ECECEC] rounded-lg text-left type-body text-[#161616] bg-white flex items-center justify-between hover:border-black transition-colors"
            >
              <span>{months[selectedMonth]} {selectedDay}</span>
              <Icon icon="hugeicons:calendar-03" className="w-5 h-5 text-[#8B8B8B]" />
            </button>
            
            {isDatePopOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-[#E5E7EB] rounded-xl shadow-lg p-2 z-10 flex gap-2 h-[240px]">
                 <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-1">
                   {months.map((m, i) => (
                     <button 
                       key={m} 
                       onClick={() => { 
                         setSelectedMonth(i)
                         if (selectedDay > new Date(2024, i + 1, 0).getDate()) {
                           setSelectedDay(1)
                         }
                       }}
                       className={`px-3 py-2 text-left rounded-lg text-sm transition-colors ${selectedMonth === i ? 'bg-black text-white' : 'hover:bg-neutral-100 text-[#161616]'}`}
                     >
                       {m}
                     </button>
                   ))}
                 </div>
                 <div className="w-px bg-[#E5E7EB]"></div>
                 <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-1">
                   {Array.from({length: daysInMonth}, (_, i) => i + 1).map(d => (
                     <button 
                       key={d} 
                       onClick={() => { setSelectedDay(d); setIsDatePopOpen(false); }}
                       className={`px-3 py-2 text-left rounded-lg text-sm transition-colors ${selectedDay === d ? 'bg-black text-white' : 'hover:bg-neutral-100 text-[#161616]'}`}
                     >
                       {d}
                     </button>
                   ))}
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function SettingsClaimAdvancedPage() {
  const { company } = useCompanyStore()
  const queryClient = useQueryClient()
  
  const [autoApprove, setAutoApprove] = useState(false)
  const [microClaimAmount, setMicroClaimAmount] = useState<string>('50')
  const [requireReceipts, setRequireReceipts] = useState(true)
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

  // 2. React Query: Fetch Company Settings (Category A - Static Data, cached locally)
  const { data: claimSettings = {}, isLoading: isQueryLoading } = useQuery({
    queryKey: ['company_settings', 'claim', companyId],
    queryFn: async () => {
      if (!companyId) return {}
      const { data, error } = await supabase
        .from('company_settings')
        .select('claim_settings')
        .eq('company_id', companyId)
        .maybeSingle()

      if (error) throw error
      return data?.claim_settings || {}
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  })

  // Synchronize local form state with cached settings when data loads or updates
  useEffect(() => {
    if (claimSettings?.advanced) {
      const adv = claimSettings.advanced
      if (typeof adv.autoApprove === 'boolean') setAutoApprove(adv.autoApprove)
      if (adv.microClaimAmount !== undefined) setMicroClaimAmount(String(adv.microClaimAmount))
      if (typeof adv.requireReceipts === 'boolean') setRequireReceipts(adv.requireReceipts)
      if (typeof adv.hierarchySetupRequired === 'boolean') setHierarchySetupRequired(adv.hierarchySetupRequired)
    }
  }, [claimSettings])

  // 3. Supabase Realtime Subscription
  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel(`company_settings_claim_${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_settings',
          filter: `company_id=eq.${companyId}`
        },
        (payload: any) => {
          if (payload.new && payload.new.claim_settings) {
            queryClient.setQueryData(['company_settings', 'claim', companyId], payload.new.claim_settings)
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
      
      const newClaimSettings = {
        ...claimSettings,
        advanced: updatedAdvanced
      }

      const { error } = await supabase
        .from('company_settings')
        .update({ claim_settings: newClaimSettings })
        .eq('company_id', companyId)

      if (error) throw error
      return newClaimSettings
    },
    onMutate: async (newClaimSettings) => {
      await queryClient.cancelQueries({ queryKey: ['company_settings', 'claim', companyId] })
      const previousConfig = queryClient.getQueryData(['company_settings', 'claim', companyId])
      queryClient.setQueryData(['company_settings', 'claim', companyId], newClaimSettings)
      return { previousConfig }
    },
    onError: (err: any, _, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(['company_settings', 'claim', companyId], context.previousConfig)
      }
      toast.error(err.message || 'Failed to save settings')
    },
    onSuccess: () => {
      toast.success('Advanced claim settings saved successfully!')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['company_settings', 'claim', companyId] })
    }
  })

  const handleSave = () => {
    const updatedAdvanced = {
      ...(claimSettings?.advanced || {}),
      autoApprove,
      microClaimAmount,
      requireReceipts,
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
              Claim Management
            </Link>
            <span>/</span>
            <span className="text-[#161616]">Advanced Settings</span>
          </div>
          <div>
            <h2 className="type-h2 text-[#161616]">Claim Settings</h2>
            <p className="type-small text-[#737373] mt-1">Configure global claim and expense policies for your company.</p>
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
        {isQueryLoading && !claimSettings.advanced && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-[24px] z-20 flex items-center justify-center">
            <Icon icon="hugeicons:loading-01" className="w-6 h-6 animate-spin text-black" />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="type-body-medium text-[#161616]">Auto-Approve Micro Claims</h4>
              <p className="type-small text-[#737373]">Automatically approve claims under a specified small amount limit.</p>
            </div>
            <div 
              onClick={() => setAutoApprove(!autoApprove)}
              className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${autoApprove ? 'bg-[#34C759]' : 'bg-neutral-200'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm transition-all ${autoApprove ? 'left-[22px]' : 'left-[2px]'}`}></div>
            </div>
          </div>

          {autoApprove && (
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] p-6 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                   <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-[#E0E7FF] flex items-center justify-center text-[#4F46E5]">
                       <Icon icon="hugeicons:coins-swap" className="w-4 h-4" />
                     </div>
                     <h5 className="type-body-medium text-[#161616]">Micro Claim Threshold Setup</h5>
                   </div>
                   <p className="type-small text-[#64748B] max-w-[420px]">
                     Any expense claim under this amount will be automatically approved without requiring manual management review.
                   </p>
                </div>

                <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 shadow-sm focus-within:border-black transition-colors shrink-0">
                  <span className="type-body-medium font-semibold text-[#161616] select-none">S$</span>
                  <input 
                    type="number"
                    min="0"
                    step="1"
                    value={microClaimAmount}
                    onChange={(e) => setMicroClaimAmount(e.target.value)}
                    placeholder="50"
                    className="w-24 bg-transparent outline-none type-body-medium font-medium text-[#161616]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-[#E5E7EB] w-full" />

        <div className="flex items-center justify-between">
          <div>
            <h4 className="type-body-medium text-[#161616]">Require Receipts</h4>
            <p className="type-small text-[#737373]">Make attaching a receipt mandatory for all claim applications.</p>
          </div>
          <div 
            onClick={() => setRequireReceipts(!requireReceipts)}
            className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${requireReceipts ? 'bg-[#34C759]' : 'bg-neutral-200'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm transition-all ${requireReceipts ? 'left-[22px]' : 'left-[2px]'}`}></div>
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
                  href="/settings/claims/hierarchy" 
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

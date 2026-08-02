"use client"

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { getAvatarUrl } from '@/lib/utils'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface ApprovalLevelConfig {
  level: number
  approverType: 'direct_manager' | 'department_head' | 'super_admin' | 'specific'
  employeeId?: string
}

export interface HydratedApprovalLevel {
  level: number
  approverType: 'direct_manager' | 'department_head' | 'super_admin' | 'specific'
  employeeId?: string
  searchInput?: string
  employeeName?: string
  avatarUrl?: string
  email?: string
  isSearching?: boolean
}

export function SettingsLeaveHierarchyPage() {
  const { company } = useCompanyStore()
  const queryClient = useQueryClient()

  const [approvalLevels, setApprovalLevels] = useState<HydratedApprovalLevel[]>([
    { level: 1, approverType: 'specific', employeeId: '', searchInput: '' },
    { level: 2, approverType: 'specific', employeeId: '', searchInput: '' }
  ])

  const [hierarchyType, setHierarchyType] = useState<'custom' | 'auto'>('custom')
  const [autoEscalate, setAutoEscalate] = useState(true)
  const [hrFallback, setHrFallback] = useState(true)
  const [superAdmin, setSuperAdmin] = useState<{ name: string; avatarUrl?: string } | null>(null)

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

  // 2. Fetch Super Admin Info
  useEffect(() => {
    async function fetchSuperAdmin() {
      const { data: empData } = await supabase
        .from('employees')
        .select('name, avatar_url')
        .eq('app_role', 'SUPER_ADMIN')
        .limit(1)
        .single()
      
      if (empData) {
        setSuperAdmin({ name: empData.name, avatarUrl: empData.avatar_url })
      } else {
        const { data: compData } = await supabase
          .from('companies')
          .select('super_admin_name, super_admin_avatar_url')
          .limit(1)
          .single()
          
        if (compData) {
          setSuperAdmin({ 
            name: compData.super_admin_name || 'Super Admin', 
            avatarUrl: compData.super_admin_avatar_url || undefined
          })
        }
      }
    }
    fetchSuperAdmin()
  }, [])

  // 3. Avatar Backfill Task
  useEffect(() => {
    async function backfillAvatars() {
      const { data: emps } = await supabase.from('employees').select('id, name').is('avatar_url', null)
      if (emps && emps.length > 0) {
        for (const emp of emps) {
          if (emp.name) {
            await supabase.from('employees').update({ avatar_url: getAvatarUrl(emp.name) }).eq('id', emp.id)
          }
        }
      }
      
      const { data: comps } = await supabase.from('companies').select('id, super_admin_name').is('super_admin_avatar_url', null)
      if (comps && comps.length > 0) {
        for (const comp of comps) {
          if (comp.super_admin_name) {
            await supabase.from('companies').update({ super_admin_avatar_url: getAvatarUrl(comp.super_admin_name) }).eq('id', comp.id)
          }
        }
      }
    }
    backfillAvatars()
  }, [])

  // 4. React Query: Fetch Company Settings (Category A - Static Data)
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
    staleTime: 5 * 60 * 1000,
  })

  // Synchronize local form state with cached settings & hydrate employee profiles from single source of truth
  useEffect(() => {
    async function hydrateLevels() {
      if (leaveSettings?.hierarchy) {
        const hier = leaveSettings.hierarchy
        if (hier.hierarchyType) setHierarchyType(hier.hierarchyType)
        if (typeof hier.autoEscalate === 'boolean') setAutoEscalate(hier.autoEscalate)
        if (typeof hier.hrFallback === 'boolean') setHrFallback(hier.hrFallback)

        if (Array.isArray(hier.approvalLevels) && hier.approvalLevels.length > 0) {
          const rawLevels = hier.approvalLevels

          // Collect employee UUIDs or emails for legacy records
          const empIds: string[] = []
          const empEmails: string[] = []

          rawLevels.forEach((l: any) => {
            const idVal = l.employeeId || l.id
            const emailVal = l.email || l.role
            if (idVal && idVal.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
              empIds.push(idVal)
            } else if (emailVal && emailVal.includes('@')) {
              empEmails.push(emailVal)
            }
          })

          // Batch fetch employee profile details from Employees table (Single Source of Truth)
          let fetchedEmps: any[] = []
          if (empIds.length > 0) {
            const { data } = await supabase
              .from('employees')
              .select('id, name, avatar_url, email')
              .in('id', empIds)
            if (data) fetchedEmps = [...fetchedEmps, ...data]
          }

          if (empEmails.length > 0) {
            const { data } = await supabase
              .from('employees')
              .select('id, name, avatar_url, email')
              .in('email', empEmails)
            if (data) fetchedEmps = [...fetchedEmps, ...data]
          }

          // Build hydrated UI state
          const hydrated: HydratedApprovalLevel[] = rawLevels.map((lvl: any, idx: number) => {
            const targetId = lvl.employeeId || lvl.id
            const targetEmail = lvl.email || lvl.role

            const matchedEmp = fetchedEmps.find(e => 
              (targetId && e.id === targetId) || 
              (targetEmail && e.email?.toLowerCase() === targetEmail.toLowerCase())
            )

            return {
              level: lvl.level || (idx + 1),
              approverType: lvl.approverType || 'specific',
              employeeId: matchedEmp?.id || targetId || '',
              searchInput: matchedEmp?.email || targetEmail || '',
              employeeName: matchedEmp?.name || (targetId ? undefined : lvl.employeeName),
              avatarUrl: matchedEmp?.avatar_url || (targetId ? undefined : lvl.avatarUrl),
              email: matchedEmp?.email || targetEmail
            } as HydratedApprovalLevel
          })

          setApprovalLevels(hydrated)
        }
      }
    }

    hydrateLevels()
  }, [leaveSettings, supabase])

  // 5. Supabase Realtime Subscription
  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel(`company_settings_leave_hierarchy_${companyId}`)
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

  // 6. React Query Mutation: Optimistic Update + Save
  const saveMutation = useMutation({
    mutationFn: async (updatedHierarchy: any) => {
      if (!companyId) throw new Error('Company ID not found. Unable to save.')
      
      const newLeaveSettings = {
        ...leaveSettings,
        hierarchy: updatedHierarchy
      }

      const { error } = await supabase
        .from('company_settings')
        .update({ leave_settings: newLeaveSettings })
        .eq('company_id', companyId)

      if (error) throw error
      return newLeaveSettings
    },
    onMutate: async (newHierarchy) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['company_settings', 'leave', companyId] })

      const previousConfig = queryClient.getQueryData(['company_settings', 'leave', companyId])
      const updatedConfig = { ...leaveSettings, hierarchy: newHierarchy }
      queryClient.setQueryData(['company_settings', 'leave', companyId], updatedConfig)
      return { previousConfig }
    },
    onError: (err: any, _, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(['company_settings', 'leave', companyId], context.previousConfig)
      }
      toast.error(err.message || 'Failed to save hierarchy')
    },
    onSuccess: () => {
      toast.success('Leave approval hierarchy saved successfully!')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['company_settings', 'leave', companyId] })
    }
  })

  // Normalize hierarchy before persisting: Store strictly level + approverType + employeeId
  const handleSaveHierarchy = () => {
    const normalizedLevels: ApprovalLevelConfig[] = approvalLevels
      .filter(lvl => lvl.approverType !== 'specific' || !!lvl.employeeId)
      .map((lvl, index) => ({
        level: index + 1,
        approverType: lvl.approverType,
        employeeId: lvl.approverType === 'specific' ? lvl.employeeId : undefined
      }))

    if (hierarchyType === 'custom' && normalizedLevels.length === 0) {
      toast.error('Please appoint at least one valid employee to the approval levels.')
      return
    }

    const updatedHierarchy = {
      hierarchyType,
      approvalLevels: normalizedLevels,
      autoEscalate,
      hrFallback
    }
    saveMutation.mutate(updatedHierarchy)
  }

  const addLevel = () => {
    if (approvalLevels.length >= 5) return
    setApprovalLevels([...approvalLevels, { level: approvalLevels.length + 1, approverType: 'specific', employeeId: '', searchInput: '' }])
  }

  const removeLevel = (index: number) => {
    const updated = approvalLevels.filter((_, i) => i !== index).map((lvl, idx) => ({ ...lvl, level: idx + 1 }))
    setApprovalLevels(updated)
  }

  const moveLevelUp = (index: number) => {
    if (index === 0) return
    const updated = [...approvalLevels]
    const temp = updated[index]
    updated[index] = updated[index - 1]
    updated[index - 1] = temp
    updated.forEach((lvl, idx) => { lvl.level = idx + 1 })
    setApprovalLevels(updated)
  }

  const moveLevelDown = (index: number) => {
    if (index === approvalLevels.length - 1) return
    const updated = [...approvalLevels]
    const temp = updated[index]
    updated[index] = updated[index + 1]
    updated[index + 1] = temp
    updated.forEach((lvl, idx) => { lvl.level = idx + 1 })
    setApprovalLevels(updated)
  }

  const searchEmployee = async (index: number, searchKey: string) => {
    if (!searchKey || !searchKey.trim()) {
      toast.error('Please enter an employee email or name to search.')
      return
    }

    const newLevels = [...approvalLevels]
    newLevels[index].isSearching = true
    setApprovalLevels(newLevels)

    try {
      const searchTerm = searchKey.trim()
      const { data: empData } = await supabase
        .from('employees')
        .select('id, name, avatar_url, email')
        .or(`email.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
        .limit(1)

      let candidateId: string | undefined = undefined
      let candidateName: string | undefined = undefined
      let candidateAvatar: string | undefined = undefined
      let candidateEmail: string | undefined = undefined

      if (empData && empData.length > 0) {
        candidateId = empData[0].id
        candidateName = empData[0].name
        candidateAvatar = empData[0].avatar_url
        candidateEmail = empData[0].email
      } else {
        const { data: compData } = await supabase
          .from('companies')
          .select('id, super_admin_name, super_admin_avatar_url, login_email')
          .or(`login_email.ilike.%${searchTerm}%,super_admin_name.ilike.%${searchTerm}%`)
          .limit(1)

        if (compData && compData.length > 0) {
          candidateId = compData[0].id
          candidateName = compData[0].super_admin_name || 'Super Admin'
          candidateAvatar = compData[0].super_admin_avatar_url || undefined
          candidateEmail = compData[0].login_email || undefined
        }
      }

      const updatedLevels = [...approvalLevels]
      updatedLevels[index].isSearching = false

      if (candidateId && candidateName) {
        const isDuplicate = approvalLevels.some((lvl, i) => i !== index && lvl.employeeId === candidateId)

        if (isDuplicate) {
          updatedLevels[index].employeeId = ''
          updatedLevels[index].employeeName = undefined
          updatedLevels[index].avatarUrl = undefined
          updatedLevels[index].email = undefined
          toast.error(`${candidateName} is already added to the approval chain!`)
        } else {
          updatedLevels[index].employeeId = candidateId
          updatedLevels[index].employeeName = candidateName
          updatedLevels[index].avatarUrl = candidateAvatar
          updatedLevels[index].email = candidateEmail
          updatedLevels[index].searchInput = candidateEmail || candidateName
          toast.success(`Appointed ${candidateName}!`)
        }
      } else {
        updatedLevels[index].employeeId = ''
        updatedLevels[index].employeeName = undefined
        updatedLevels[index].avatarUrl = undefined
        updatedLevels[index].email = undefined
        toast.error('Employee not found.')
      }
      setApprovalLevels(updatedLevels)
    } catch (err) {
      const updatedLevels = [...approvalLevels]
      updatedLevels[index].isSearching = false
      updatedLevels[index].employeeId = ''
      updatedLevels[index].employeeName = undefined
      updatedLevels[index].avatarUrl = undefined
      updatedLevels[index].email = undefined
      setApprovalLevels(updatedLevels)
      toast.error('Search failed.')
    }
  }

  const isSaving = saveMutation.isPending

  return (
    <div className="flex flex-col gap-6 max-w-[900px] pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 type-small text-[#737373] mb-4">
            <Link href="/settings/leave/advanced" className="hover:text-[#161616] transition-colors flex items-center gap-1">
              <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
              Advanced Settings
            </Link>
            <span>/</span>
            <span className="text-[#161616]">Hierarchy Setup</span>
          </div>
          <div>
            <h2 className="type-h2 text-[#161616]">Approval Hierarchy</h2>
            <p className="type-small text-[#737373] mt-1">Configure multi-level approval workflows for leave requests.</p>
          </div>
        </div>

        <button 
          onClick={handleSaveHierarchy}
          disabled={isSaving || isQueryLoading}
          className="px-6 py-2.5 type-body-medium font-semibold rounded-full bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          {isSaving && <Icon icon="hugeicons:loading-01" className="w-4 h-4 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save Hierarchy'}
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-8 flex flex-col gap-8 relative">
        {isQueryLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-[24px] z-20 flex items-center justify-center">
            <Icon icon="hugeicons:loading-01" className="w-6 h-6 animate-spin text-black" />
          </div>
        )}

        {/* Hierarchy Type Selector */}
        <div>
          <h4 className="type-body-medium text-[#161616] mb-1">Approval Strategy</h4>
          <p className="type-small text-[#737373] mb-4">Choose how approval paths are determined for employees.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => setHierarchyType('custom')}
              className={`p-4 rounded-xl border text-left transition-colors flex flex-col gap-1 ${
                hierarchyType === 'custom' ? 'border-black bg-neutral-50' : 'border-[#ECECEC] hover:border-[#D4D4D4] bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="type-body-medium text-[#161616]">Custom Hierarchy</span>
                {hierarchyType === 'custom' && <Icon icon="hugeicons:checkmark-circle-02" className="w-5 h-5 text-[#34C759]" />}
              </div>
              <span className="type-small text-[#737373]">Manually appoint specific managers or approvers for each level of approval.</span>
            </button>

            <button 
              type="button"
              onClick={() => setHierarchyType('auto')}
              className={`p-4 rounded-xl border text-left transition-colors flex flex-col gap-1 ${
                hierarchyType === 'auto' ? 'border-black bg-neutral-50' : 'border-[#ECECEC] hover:border-[#D4D4D4] bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="type-body-medium text-[#161616]">Auto Organizational Tree</span>
                {hierarchyType === 'auto' && <Icon icon="hugeicons:checkmark-circle-02" className="w-5 h-5 text-[#34C759]" />}
              </div>
              <span className="type-small text-[#737373]">Automatically route requests up the employee's direct reporting line in the organization.</span>
            </button>
          </div>
        </div>

        {/* Custom Levels Configuration */}
        {hierarchyType === 'custom' && (
          <div className="flex flex-col gap-4 border-t border-[#E5E7EB] pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="type-body-medium text-[#161616]">Approval Chain Levels</h4>
                <p className="type-small text-[#737373]">Appoint approvers sequentially from Level 1 to final sign-off.</p>
              </div>
              <button 
                type="button"
                onClick={addLevel}
                disabled={approvalLevels.length >= 5}
                className="px-4 py-2 bg-[#161616] hover:bg-black/80 text-white type-small font-semibold rounded-full transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                <Icon icon="hugeicons:plus-sign-01" className="w-4 h-4" />
                Add person
              </button>
            </div>

            {/* Separate Note Section */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3 mt-2">
              <Icon icon="hugeicons:information-circle" className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
              <p className="type-small text-[#737373]">
                <strong className="text-[#161616] font-semibold">1st Reportee Note: </strong>
                The person appointed at Level 1 serves as the primary 1st reportee for approval requests.
              </p>
            </div>

            <div className="flex flex-col gap-6 mt-6 relative">
              {approvalLevels.map((lvl, index) => (
                <div key={index} className="relative flex items-center gap-4 w-full">
                  {/* Connecting Line */}
                  {index < approvalLevels.length - 1 && (
                    <div className="absolute left-[23px] top-[48px] bottom-[-24px] w-[1px] bg-[#E5E7EB] z-0" />
                  )}

                  {/* Circle Indicator */}
                  <div className="w-12 h-12 rounded-full bg-[#F4F4F5] flex items-center justify-center shrink-0 relative z-10">
                    <span className="type-body-medium font-semibold text-[#161616]">{index + 1}</span>
                  </div>

                  {/* Input Area */}
                  <div className="flex-1 flex gap-3">
                    <div className="relative flex-1">
                      {!lvl.employeeName ? (
                        <div className="relative w-full">
                          <input 
                            type="text" 
                            value={lvl.searchInput || ''}
                            onChange={(e) => {
                              const updated = [...approvalLevels]
                              updated[index].searchInput = e.target.value
                              setApprovalLevels(updated)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                searchEmployee(index, lvl.searchInput || '')
                              }
                            }}
                            placeholder="Type email and enter"
                            className="w-full px-4 h-11 bg-white border border-gray-300 rounded-lg type-body focus:outline-none focus:border-black transition-colors"
                          />
                          <button 
                            type="button"
                            onClick={() => searchEmployee(index, lvl.searchInput || '')}
                            disabled={lvl.isSearching}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#737373] hover:text-black transition-colors"
                          >
                            {lvl.isSearching ? (
                              <Icon icon="hugeicons:loading-01" className="w-4 h-4 animate-spin" />
                            ) : (
                              <Icon icon="hugeicons:search-01" className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 px-3 h-11 bg-gray-50 border border-gray-200 rounded-lg w-full">
                          {lvl.avatarUrl ? (
                            <img src={lvl.avatarUrl} alt={lvl.employeeName} className="w-7 h-7 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-semibold type-caption shrink-0">
                              {lvl.employeeName.charAt(0)}
                            </div>
                          )}
                          <span className="type-body-medium text-[#161616] truncate">{lvl.employeeName}</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              const updated = [...approvalLevels]
                              updated[index].employeeId = ''
                              updated[index].employeeName = undefined
                              updated[index].avatarUrl = undefined
                              updated[index].email = undefined
                              updated[index].searchInput = ''
                              setApprovalLevels(updated)
                            }} 
                            className="ml-auto text-gray-400 hover:text-black p-1 transition-colors"
                          >
                            <Icon icon="hugeicons:cancel-01" className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delete Icon */}
                  <button 
                    type="button"
                    onClick={() => removeLevel(index)}
                    className={`p-2 text-[#EF4444] hover:text-[#DC2626] transition-colors shrink-0 ${approvalLevels.length === 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                    disabled={approvalLevels.length === 1}
                  >
                    <Icon icon="hugeicons:delete-02" className="w-6 h-6" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auto Organizational Tree Visualization */}
        {hierarchyType === 'auto' && (
          <div className="flex flex-col gap-6 border-t border-[#E5E7EB] pt-6">
            <div>
              <h4 className="type-body-medium text-[#161616]">Automatic Organizational Hierarchy</h4>
              <p className="type-small text-[#737373]">Approval requests automatically follow the organizational structure below.</p>
            </div>

            {/* Separate Note Section */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3">
              <Icon icon="hugeicons:information-circle" className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
              <p className="type-small text-[#737373]">
                <strong className="text-[#161616] font-semibold">1st Reportee Note: </strong>
                Department employees report directly to their own Department Admin as the 1st reportee, and requests escalate to the Super Admin automatically.
              </p>
            </div>

            <div className="flex flex-col gap-6 relative">
              {/* Level 1: Department Admin */}
              <div className="relative flex items-center gap-4 w-full">
                {/* Connecting Line */}
                <div className="absolute left-[23px] top-[48px] bottom-[-24px] w-[1px] bg-[#E5E7EB] z-0" />

                {/* Circle Indicator */}
                <div className="w-12 h-12 rounded-full bg-[#F4F4F5] flex items-center justify-center shrink-0 relative z-10">
                  <span className="type-body-medium font-semibold text-[#161616]">1</span>
                </div>

                {/* Card */}
                <div className="flex-1 flex items-center px-4 h-11 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon icon="hugeicons:building-03" className="w-5 h-5 text-gray-600 shrink-0" />
                    <span className="type-body-medium font-medium text-[#161616]">Department Admin</span>
                  </div>
                </div>
              </div>

              {/* Level 2: Super Admin */}
              <div className="relative flex items-center gap-4 w-full">
                {/* Circle Indicator */}
                <div className="w-12 h-12 rounded-full bg-[#F4F4F5] flex items-center justify-center shrink-0 relative z-10">
                  <span className="type-body-medium font-semibold text-[#161616]">2</span>
                </div>

                {/* Card */}
                <div className="flex-1 flex items-center px-4 h-11 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon icon="hugeicons:user-star-01" className="w-5 h-5 text-gray-600 shrink-0" />
                    <span className="type-body-medium font-medium text-[#161616]">Super Admin</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fallback & Escalation Options */}
        <div className="border-t border-[#E5E7EB] pt-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="type-body-medium text-[#161616]">Auto-Escalate Unresponded Requests</h4>
              <p className="type-small text-[#737373]">Escalate to the next level if an approver does not respond within 48 hours.</p>
            </div>
            <div 
              onClick={() => setAutoEscalate(!autoEscalate)}
              className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${autoEscalate ? 'bg-[#34C759]' : 'bg-neutral-200'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm transition-all ${autoEscalate ? 'left-[22px]' : 'left-[2px]'}`}></div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="type-body-medium text-[#161616]">Super Admin Fallback</h4>
              <p className="type-small text-[#737373]">Route directly to Super Admin ({superAdmin?.name || 'Super Admin'}) if an approver position is vacant.</p>
            </div>
            <div 
              onClick={() => setHrFallback(!hrFallback)}
              className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${hrFallback ? 'bg-[#34C759]' : 'bg-neutral-200'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm transition-all ${hrFallback ? 'left-[22px]' : 'left-[2px]'}`}></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

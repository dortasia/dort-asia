"use client"

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  RoleType, 
  ALL_PERMISSIONS, 
  PERMISSION_MODULES, 
  DEFAULT_ROLE_PERMISSIONS 
} from './SettingsRolesPage'

const ROLE_INFO: Record<RoleType, { title: string; desc: string; icon: string; bg: string }> = {
  admin: {
    title: 'Admin Role',
    desc: 'Configure operational privileges, department oversight, and approval workflows for Admins.',
    icon: 'hugeicons:user-star-01',
    bg: 'bg-black text-white'
  },
  sub_admin: {
    title: 'Sub Admin Role',
    desc: 'Configure customized access for scanner personnel, team coordinators, and assistant admins.',
    icon: 'hugeicons:security-user',
    bg: 'bg-purple-100 text-purple-800 font-semibold'
  },
  employee: {
    title: 'Employee Role',
    desc: 'Configure standard self-service permissions for clocking, leave applications, and claims.',
    icon: 'hugeicons:user',
    bg: 'bg-gray-100 text-gray-700'
  }
}

export function SettingsRoleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const rawRole = (params.role as string) || 'admin'
  const role: RoleType = (['admin', 'sub_admin', 'employee'].includes(rawRole) ? rawRole : 'admin') as RoleType

  const roleMeta = ROLE_INFO[role] || ROLE_INFO.admin

  const { company } = useCompanyStore()
  const queryClient = useQueryClient()
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Permissions state for all roles
  const [rolePermissions, setRolePermissions] = useState<Record<RoleType, Record<string, boolean>>>(DEFAULT_ROLE_PERMISSIONS)

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

  // 3. Hydrate state
  useEffect(() => {
    if (roleSettingsData && Object.keys(roleSettingsData).length > 0) {
      setRolePermissions({
        admin: { ...DEFAULT_ROLE_PERMISSIONS.admin, ...(roleSettingsData.admin || {}) },
        sub_admin: { ...DEFAULT_ROLE_PERMISSIONS.sub_admin, ...(roleSettingsData.sub_admin || {}) },
        employee: { ...DEFAULT_ROLE_PERMISSIONS.employee, ...(roleSettingsData.employee || {}) },
      })
    }
  }, [roleSettingsData])

  // 4. Supabase Realtime Subscription
  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel(`company_settings_roles_${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_settings',
          filter: `company_id=eq.${companyId}`
        },
        (payload: any) => {
          if (payload.new && payload.new.role_permissions) {
            queryClient.setQueryData(['company_settings', 'roles', companyId], payload.new.role_permissions)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId, queryClient])

  // 5. React Query Mutation
  const saveMutation = useMutation({
    mutationFn: async (updatedConfig: any) => {
      if (!companyId) throw new Error('Company ID not found. Unable to save settings.')
      const { error } = await supabase
        .from('company_settings')
        .update({
          role_permissions: updatedConfig
        })
        .eq('company_id', companyId)

      if (error) throw error
      return updatedConfig
    },
    onMutate: async (newConfig) => {
      await queryClient.cancelQueries({ queryKey: ['company_settings', 'roles', companyId] })
      const previousConfig = queryClient.getQueryData(['company_settings', 'roles', companyId])
      queryClient.setQueryData(['company_settings', 'roles', companyId], newConfig)
      return { previousConfig }
    },
    onError: (err: any, _, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(['company_settings', 'roles', companyId], context.previousConfig)
      }
      toast.error(err.message || 'Failed to save role permissions')
    },
    onSuccess: () => {
      toast.success(`${roleMeta.title} permissions saved successfully!`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['company_settings', 'roles', companyId] })
    }
  })

  const togglePermission = (permId: string) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permId]: !prev[role]?.[permId]
      }
    }))
  }

  const toggleModuleAll = (moduleId: string, enable: boolean) => {
    const modulePerms = ALL_PERMISSIONS.filter(p => p.module === moduleId)
    setRolePermissions(prev => {
      const updatedRole = { ...prev[role] }
      modulePerms.forEach(p => {
        updatedRole[p.id] = enable
      })
      return {
        ...prev,
        [role]: updatedRole
      }
    })
  }

  const resetRoleToDefault = () => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: { ...DEFAULT_ROLE_PERMISSIONS[role] }
    }))
    toast.success(`Reset ${roleMeta.title} permissions to default!`)
  }

  const handleSave = () => {
    saveMutation.mutate(rolePermissions)
  }

  const isSaving = saveMutation.isPending

  // Filter permissions based on search
  const filteredPermissions = ALL_PERMISSIONS.filter(p => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
  })

  const activeCount = ALL_PERMISSIONS.filter(p => !!rolePermissions[role]?.[p.id]).length

  return (
    <div className="flex flex-col gap-6 max-w-[900px] pb-12 relative">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 type-small text-[#737373] mb-3">
            <Link href="/settings" className="hover:text-[#161616] transition-colors">Settings</Link>
            <span>/</span>
            <Link href="/settings/roles" className="hover:text-[#161616] transition-colors">Roles & Access</Link>
            <span>/</span>
            <span className="text-[#161616] font-medium capitalize">{role.replace('_', ' ')}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/settings/roles"
              className="w-9 h-9 rounded-xl bg-white border border-[#E5E7EB] hover:bg-neutral-50 flex items-center justify-center text-[#161616] transition-colors shrink-0"
            >
              <Icon icon="hugeicons:arrow-left-01" className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="type-h2 text-[#161616]">{roleMeta.title} Access Permissions</h2>
              <p className="type-small text-[#737373] mt-0.5">{roleMeta.desc}</p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving || isQueryLoading}
          className="px-6 py-2.5 type-body-medium font-semibold rounded-full bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0 shadow-sm"
        >
          {isSaving && <Icon icon="hugeicons:loading-01" className="w-4 h-4 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save Permissions'}
        </button>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-8 flex flex-col gap-8 relative shadow-xs">
        {isQueryLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-[24px] z-20 flex items-center justify-center">
            <Icon icon="hugeicons:loading-01" className="w-6 h-6 animate-spin text-black" />
          </div>
        )}

        {/* Role Overview Banner */}
        <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${roleMeta.bg}`}>
              <Icon icon={roleMeta.icon} className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="type-body-medium font-semibold text-[#161616]">{roleMeta.title}</span>
              <span className="type-small text-[#737373]">{activeCount} of {ALL_PERMISSIONS.length} permissions enabled for this role.</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={resetRoleToDefault}
            className="px-3.5 py-1.5 bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#161616] type-small font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Icon icon="hugeicons:rotate-left" className="w-4 h-4" />
            Reset to Default
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Icon icon="hugeicons:search-01" className="w-4 h-4 text-[#8B8B8B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search permissions by name or description..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#F9FAFC] border border-[#E5E7EB] rounded-xl type-small text-[#161616] outline-none focus:border-black transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
            >
              <Icon icon="hugeicons:cancel-01" className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modules & Permissions List */}
        <div className="flex flex-col gap-8">
          {PERMISSION_MODULES.map((module) => {
            const modulePerms = filteredPermissions.filter(p => p.module === module.id)
            if (modulePerms.length === 0) return null

            const allEnabled = modulePerms.every(p => !!rolePermissions[role]?.[p.id])

            return (
              <div key={module.id} className="flex flex-col gap-4">
                {/* Module Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#F4F4F5]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[#161616]">
                      <Icon icon={module.icon} className="w-4 h-4" />
                    </div>
                    <h3 className="type-body-medium font-semibold text-[#161616]">{module.name}</h3>
                  </div>

                  <button 
                    type="button"
                    onClick={() => toggleModuleAll(module.id, !allEnabled)}
                    className="type-small font-medium text-[#737373] hover:text-black transition-colors"
                  >
                    {allEnabled ? 'Disable All' : 'Enable All'}
                  </button>
                </div>

                {/* Permissions List */}
                <div className="grid grid-cols-1 gap-3">
                  {modulePerms.map((perm) => {
                    const isChecked = !!rolePermissions[role]?.[perm.id]

                    return (
                      <div 
                        key={perm.id} 
                        className="flex items-center justify-between p-4 rounded-xl border border-[#E5E7EB] hover:border-gray-300 bg-white transition-all"
                      >
                        <div className="flex flex-col gap-0.5 pr-4">
                          <span className="type-body-medium font-medium text-[#161616]">{perm.label}</span>
                          <span className="type-small text-[#737373]">{perm.description}</span>
                        </div>

                        {/* Toggle Switch */}
                        <button 
                          type="button"
                          onClick={() => togglePermission(perm.id)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isChecked ? 'bg-[#34C759]' : 'bg-[#E5E7EB]'
                          }`}
                        >
                          <span 
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isChecked ? 'translate-x-5' : 'translate-x-0'
                            }`} 
                          />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

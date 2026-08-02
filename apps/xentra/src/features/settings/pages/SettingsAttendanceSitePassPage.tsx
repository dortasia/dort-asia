"use client"

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface CustomPersonnel {
  id: string
  name: string
  email?: string
  avatarUrl?: string
  searchInput?: string
  isSearching?: boolean
}

interface Site {
  id: string
  name: string
  address: string
  radius: number
  sitePassEnabled?: boolean
  sitePassCode?: string
  dynamicQrRotation?: boolean
  scannerPermission?: 'own_dept_admin' | 'any_admin' | 'reporting_manager' | 'custom'
  customScanners?: CustomPersonnel[]
}

export function SettingsAttendanceSitePassPage() {
  const params = useParams()
  const siteId = params.id as string

  const { company } = useCompanyStore()
  const queryClient = useQueryClient()
  const [companyId, setCompanyId] = useState<string | null>(null)

  // Site Form State
  const [siteForm, setSiteForm] = useState<Site>({
    id: siteId,
    name: '',
    address: '',
    radius: 100,
    sitePassEnabled: true,
    sitePassCode: 'SITE-8821',
    dynamicQrRotation: true,
    scannerPermission: 'own_dept_admin',
    customScanners: []
  })

  // Search Employees / Super Admin Function
  const handleSearchEmployees = async (index: number, query: string) => {
    if (!query.trim() || !companyId) return
    
    const updated = [...(siteForm.customScanners || [])]
    updated[index].isSearching = true
    setSiteForm({ ...siteForm, customScanners: updated })

    try {
      const searchTerm = query.trim()
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('id, name, email, avatar_url')
        .eq('company_id', companyId)
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(1)

      if (empError) throw empError

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
        // Fallback search to company super admin
        const { data: compData } = await supabase
          .from('companies')
          .select('id, super_admin_name, super_admin_avatar_url, login_email')
          .eq('id', companyId)
          .or(`login_email.ilike.%${searchTerm}%,super_admin_name.ilike.%${searchTerm}%`)
          .limit(1)

        if (compData && compData.length > 0) {
          candidateId = compData[0].id
          candidateName = compData[0].super_admin_name || 'Super Admin'
          candidateAvatar = compData[0].super_admin_avatar_url || undefined
          candidateEmail = compData[0].login_email || undefined
        }
      }

      const updatedAfterSearch = [...(siteForm.customScanners || [])]
      updatedAfterSearch[index].isSearching = false

      if (candidateId && candidateName) {
        const isDuplicate = updatedAfterSearch.some((p, i) => i !== index && p.id === candidateId)
        if (isDuplicate) {
          toast.error(`${candidateName} is already added!`)
          setSiteForm({ ...siteForm, customScanners: updatedAfterSearch })
          return
        }

        updatedAfterSearch[index] = {
          id: candidateId,
          name: candidateName,
          email: candidateEmail,
          avatarUrl: candidateAvatar,
          searchInput: candidateEmail || candidateName
        }
        toast.success(`Assigned ${candidateName}!`)
      } else {
        toast.error(`No employee or admin found matching "${searchTerm}"`)
      }
      setSiteForm({ ...siteForm, customScanners: updatedAfterSearch })
    } catch (err: any) {
      const reset = [...(siteForm.customScanners || [])]
      reset[index].isSearching = false
      setSiteForm({ ...siteForm, customScanners: reset })
      toast.error('Failed to search personnel')
    }
  }

  const removeScanner = (identifier: string) => {
    const updated = (siteForm.customScanners || []).filter((p, idx) => p.id !== identifier && idx.toString() !== identifier)
    setSiteForm({ ...siteForm, customScanners: updated })
  }

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

  // 2. Fetch Company Site
  const { data: siteData, isLoading: isQueryLoading } = useQuery({
    queryKey: ['company_sites', siteId],
    queryFn: async () => {
      if (!companyId || !siteId) return null
      const { data, error } = await supabase
        .from('company_sites')
        .select('*')
        .eq('id', siteId)
        .eq('company_id', companyId)
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!companyId && !!siteId,
    staleTime: 5 * 60 * 1000,
  })

  // 3. Hydrate state
  useEffect(() => {
    if (siteData) {
      setSiteForm({
        id: siteData.id,
        name: siteData.name,
        address: siteData.address || '',
        radius: siteData.radius || 100,
        sitePassEnabled: siteData.site_pass_enabled ?? true,
        sitePassCode: siteData.site_pass_code || 'SITE-' + siteId.slice(-4).toUpperCase(),
        dynamicQrRotation: siteData.dynamic_qr_rotation ?? true,
        scannerPermission: siteData.scanner_permission || 'own_dept_admin',
        customScanners: siteData.custom_scanners || []
      })
    }
  }, [siteData, siteId])

  // 4. React Query Mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedSite: Site) => {
      if (!companyId) throw new Error('Company ID not found. Unable to save site pass settings.')
      const { error } = await supabase
        .from('company_sites')
        .update({
          site_pass_enabled: updatedSite.sitePassEnabled,
          site_pass_code: updatedSite.sitePassCode,
          dynamic_qr_rotation: updatedSite.dynamicQrRotation,
          scanner_permission: updatedSite.scannerPermission,
          custom_scanners: updatedSite.customScanners
        })
        .eq('id', siteId)
        .eq('company_id', companyId)

      if (error) throw error
      return updatedSite
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_sites'] })
      toast.success('Site pass settings saved successfully!')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save site pass settings')
    }
  })

  const handleSave = () => {
    updateMutation.mutate(siteForm)
  }


  return (
    <div className="flex flex-col gap-6 max-w-[800px] pb-12">
      {/* Header & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2 type-small text-[#737373] mb-4">
          <Link href="/settings/attendance" className="hover:text-[#161616] transition-colors">
            Attendance
          </Link>
          <span>/</span>
          <Link href="/settings/attendance/sites" className="hover:text-[#161616] transition-colors">
            Work Sites
          </Link>
          <span>/</span>
          <Link href={`/settings/attendance/sites/${siteId}`} className="hover:text-[#161616] transition-colors">
            {siteForm.name || 'Site'}
          </Link>
          <span>/</span>
          <span className="text-[#161616] font-medium">Site Pass</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="type-h2 text-[#161616]">Site Pass & Scanner Setup</h2>
            <p className="type-small text-[#737373] mt-1">Configure dynamic employee QR rotation and scanner permissions for this site.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={updateMutation.isPending || isQueryLoading}
            className="px-6 py-2.5 type-body-medium font-semibold rounded-full bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-lg"
          >
            {updateMutation.isPending && <Icon icon="hugeicons:loading-01" className="w-4 h-4 animate-spin" />}
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-8 flex flex-col gap-6 relative">
        {isQueryLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-[24px] z-20 flex items-center justify-center">
            <Icon icon="hugeicons:loading-01" className="w-6 h-6 animate-spin text-black" />
          </div>
        )}
        {/* Enable Site Pass QR Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="type-body-medium font-semibold text-[#161616]">Enable Site Pass QR</h3>
            <p className="type-small text-[#737373] mt-0.5">Allow employees to check-in at this site via QR code scanner.</p>
          </div>
          <button 
            type="button"
            onClick={() => setSiteForm({ ...siteForm, sitePassEnabled: !siteForm.sitePassEnabled })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${siteForm.sitePassEnabled ? 'bg-[#34C759]' : 'bg-[#E5E7EB]'}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${siteForm.sitePassEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>



        <hr className="border-t border-[#E5E7EB]" />

        {/* Dynamic QR Rotation */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="type-body-medium font-semibold text-[#161616]">Daily Dynamic QR Rotation</h3>
            <p className="type-small text-[#737373] mt-0.5">Automatically generate a new secure QR code for each employee daily to prevent screenshot sharing.</p>
          </div>
          <button 
            type="button"
            onClick={() => setSiteForm({ ...siteForm, dynamicQrRotation: !siteForm.dynamicQrRotation })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${siteForm.dynamicQrRotation ? 'bg-[#34C759]' : 'bg-[#E5E7EB]'}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${siteForm.dynamicQrRotation ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <hr className="border-t border-[#E5E7EB]" />

        {/* Scanner Permissions */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="type-body-medium font-semibold text-[#161616]">Attendance Scanner</h3>
            <p className="type-small text-[#737373] mt-0.5">Select who has permission to scan employee QR passes at this site.</p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { id: 'own_dept_admin', label: 'Own Department Admin', desc: "Only admins from the employee's department can scan." },
              { id: 'any_admin', label: 'Any Admin', desc: "Any manager or admin can scan passes at this site." },
              { id: 'reporting_manager', label: 'Reporting Manager', desc: "Only the employee's direct reporting manager can scan." },
              { id: 'custom', label: 'Custom Personnel', desc: "Assign specific individuals." }
            ].map((option) => (
              <div key={option.id} className="flex flex-col gap-3">
                <label className="flex items-start gap-3 cursor-pointer group" onClick={() => setSiteForm({ ...siteForm, scannerPermission: option.id as any })}>
                  <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${siteForm.scannerPermission === option.id ? 'border-black bg-black' : 'border-[#D4D4D8] group-hover:border-black'}`}>
                    {siteForm.scannerPermission === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="type-body font-medium text-[#161616]">{option.label}</span>
                    <span className="type-small text-[#737373]">{option.desc}</span>
                  </div>
                </label>

                {/* Custom Personnel Input Card */}
                {option.id === 'custom' && siteForm.scannerPermission === 'custom' && (
                  <div className="ml-8 p-6 rounded-2xl border border-[#E5E7EB] bg-white flex flex-col gap-4 animate-in fade-in duration-200">
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="type-body-medium text-[#161616]">Appoint Scanner Personnel</h4>
                        <p className="type-small text-[#737373]">Assign up to 5 specific employees or security staff allowed to scan passes.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          if ((siteForm.customScanners?.length || 0) < 5) {
                            setSiteForm({
                              ...siteForm,
                              customScanners: [
                                ...(siteForm.customScanners || []),
                                { id: '', name: '' }
                              ]
                            })
                          }
                        }}
                        disabled={(siteForm.customScanners?.length || 0) >= 5}
                        className="px-4 py-2 bg-[#161616] hover:bg-black/80 text-white type-small font-semibold rounded-full transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                      >
                        <Icon icon="hugeicons:plus-sign-01" className="w-4 h-4" />
                        Add person
                      </button>
                    </div>

                    {/* Personnel Hierarchy Slots */}
                    <div className="flex flex-col gap-6 mt-4 relative">
                      {(!siteForm.customScanners || siteForm.customScanners.length === 0) ? (
                        <div className="p-4 bg-gray-50 border border-dashed border-[#CBD5E1] rounded-xl text-center">
                          <span className="type-small text-[#94A3B8]">No personnel appointed yet. Click "Add person" above to assign (max 5).</span>
                        </div>
                      ) : (
                        siteForm.customScanners.map((person, index) => (
                          <div key={index} className="relative flex items-center gap-4 w-full">
                            {/* Connecting Line */}
                            {index < (siteForm.customScanners?.length || 0) - 1 && (
                              <div className="absolute left-[23px] top-[48px] bottom-[-24px] w-[1px] bg-[#E5E7EB] z-0" />
                            )}

                            {/* Circle Indicator */}
                            <div className="w-12 h-12 rounded-full bg-[#F4F4F5] flex items-center justify-center shrink-0 relative z-10">
                              <span className="type-body-medium font-semibold text-[#161616]">{index + 1}</span>
                            </div>

                            {/* Input / Selected Employee */}
                            <div className="flex-1">
                              {!person.name ? (
                                <div className="relative w-full">
                                  <input 
                                    type="text" 
                                    value={person.searchInput || ''}
                                    onChange={(e) => {
                                      const updated = [...(siteForm.customScanners || [])]
                                      updated[index].searchInput = e.target.value
                                      setSiteForm({ ...siteForm, customScanners: updated })
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleSearchEmployees(index, person.searchInput || '')
                                      }
                                    }}
                                    placeholder="Type email and enter"
                                    className="w-full px-4 h-11 bg-white border border-gray-300 rounded-lg type-body focus:outline-none focus:border-black transition-colors"
                                  />
                                  <button 
                                    type="button"
                                    onClick={() => handleSearchEmployees(index, person.searchInput || '')}
                                    disabled={person.isSearching}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#737373] hover:text-black transition-colors"
                                  >
                                    {person.isSearching ? (
                                      <Icon icon="hugeicons:loading-01" className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Icon icon="hugeicons:search-01" className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 px-3 h-11 bg-gray-50 border border-gray-200 rounded-lg w-full">
                                  {person.avatarUrl ? (
                                    <img src={person.avatarUrl} alt={person.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-semibold type-caption shrink-0">
                                      {person.name.charAt(0)}
                                    </div>
                                  )}
                                  <span className="type-body-medium text-[#161616] truncate">{person.name}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      const updated = [...(siteForm.customScanners || [])]
                                      updated[index].id = ''
                                      updated[index].name = ''
                                      updated[index].email = undefined
                                      updated[index].avatarUrl = undefined
                                      updated[index].searchInput = ''
                                      setSiteForm({ ...siteForm, customScanners: updated })
                                    }} 
                                    className="ml-auto text-gray-400 hover:text-black p-1 transition-colors"
                                  >
                                    <Icon icon="hugeicons:cancel-01" className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Delete Icon */}
                            <button 
                              type="button"
                              onClick={() => removeScanner(person.id || index.toString())}
                              className="p-2 text-[#EF4444] hover:text-[#DC2626] transition-colors shrink-0"
                            >
                              <Icon icon="hugeicons:delete-02" className="w-6 h-6" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

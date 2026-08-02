"use client"

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Site {
  id: string
  name: string
  address: string
  radius: number
  lat?: number
  lng?: number
  sitePassEnabled?: boolean
}

export function SettingsAttendanceSiteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const siteId = params.id as string

  const { company } = useCompanyStore()
  const queryClient = useQueryClient()
  const [companyId, setCompanyId] = useState<string | null>(null)

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Site Form State
  const [siteForm, setSiteForm] = useState<Site>({
    id: siteId,
    name: '',
    address: '',
    radius: 100,
    sitePassEnabled: true
  })

  const canDeleteSite = siteForm.name === deleteConfirmText

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
        sitePassEnabled: siteData.site_pass_enabled ?? true
      })
    }
  }, [siteData, siteId])

  // 4. React Query Mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedSite: Site) => {
      if (!companyId) throw new Error('Company ID not found. Unable to save site.')
      const { error } = await supabase
        .from('company_sites')
        .update({
          name: updatedSite.name,
          site_pass_enabled: updatedSite.sitePassEnabled
        })
        .eq('id', siteId)
        .eq('company_id', companyId)

      if (error) throw error
      return updatedSite
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_sites'] })
      toast.success('Site details saved successfully!')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save site')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('Company ID not found. Unable to delete site.')
      const { error } = await supabase
        .from('company_sites')
        .delete()
        .eq('id', siteId)
        .eq('company_id', companyId)

      if (error) throw error
      return siteId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_sites'] })
      router.push('/settings/attendance/sites')
      toast.success('Site deleted successfully!')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete site')
    }
  })

  const handleSave = () => {
    if (!siteForm.name.trim()) {
      toast.error('Site name is required')
      return
    }
    updateMutation.mutate(siteForm)
  }

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  return (
    <div className="flex flex-col gap-6 max-w-[800px] pb-12">
      {/* Header & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2 type-small text-[#737373] mb-4">
          <Link href="/settings/attendance" className="hover:text-[#161616] transition-colors flex items-center gap-1">
            Attendance
          </Link>
          <span>/</span>
          <Link href="/settings/attendance/sites" className="hover:text-[#161616] transition-colors">
            Work Sites
          </Link>
          <span>/</span>
          <span className="text-[#161616] font-medium">{siteForm.name || 'Site Details'}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="type-h2 text-[#161616]">{siteForm.name || 'Work Site Configuration'}</h2>
            <p className="type-small text-[#737373] mt-1">Configure site details, location, and geofence boundary.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(true)
                setDeleteConfirmText('')
              }}
              disabled={updateMutation.isPending || deleteMutation.isPending || isQueryLoading}
              className="px-4 py-2.5 type-body-medium font-semibold rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Delete Site
            </button>
            <button 
            onClick={handleSave}
            disabled={updateMutation.isPending || deleteMutation.isPending || isQueryLoading}
            className="px-6 py-2.5 type-body-medium font-semibold rounded-full bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-lg"
          >
            {updateMutation.isPending && <Icon icon="hugeicons:loading-01" className="w-4 h-4 animate-spin" />}
            {updateMutation.isPending ? 'Saving...' : 'Save Site'}
          </button>
          </div>
        </div>
      </div>

      {/* Site Name & Toggles Container */}
      <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-8 flex flex-col gap-6 relative">
        {isQueryLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-[24px] z-20 flex items-center justify-center">
            <Icon icon="hugeicons:loading-01" className="w-6 h-6 animate-spin text-black" />
          </div>
        )}

        {/* Site Name */}
        <div className="flex flex-col gap-2 pb-6 border-b border-[#E5E7EB]">
          <label className="type-small font-semibold text-[#161616]">Site Name</label>
          <input 
            type="text" 
            value={siteForm.name}
            onChange={e => setSiteForm({ ...siteForm, name: e.target.value })}
            placeholder="e.g. Main Office / Factory #1"
            className="px-4 py-2.5 bg-white text-[#161616] placeholder:text-[#A3A3A3] border border-[#E5E7EB] rounded-xl outline-none focus:border-black type-body"
          />
        </div>

        {/* 1. Geofencing Setup */}
        <div className="flex flex-col gap-2 pb-6 border-b border-[#E5E7EB]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center shrink-0 text-[#161616]">
                <Icon icon="hugeicons:location-01" className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <h4 className="type-body-medium font-semibold text-[#161616]">Geofencing Setup</h4>
                <p className="type-small text-[#737373]">Enable GPS geofenced clock-ins within physical site boundary.</p>
              </div>
            </div>
            <div 
              onClick={() => setSiteForm({ ...siteForm, radius: siteForm.radius > 0 ? 0 : 100 })}
              className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${siteForm.radius > 0 ? 'bg-[#34C759]' : 'bg-neutral-200'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm transition-all ${siteForm.radius > 0 ? 'left-[22px]' : 'left-[2px]'}`}></div>
            </div>
          </div>

          {siteForm.radius > 0 && (
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] p-6 mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="type-body-medium font-semibold text-[#161616]">Geofence Boundary Active</span>
                  <p className="type-small text-[#64748B]">
                    {(siteForm.lat && siteForm.lng) 
                      ? `Location: ${siteForm.lat.toFixed(6)}, ${siteForm.lng.toFixed(6)} (${siteForm.radius}m radius)` 
                      : `Radius: ${siteForm.radius} meters configured.`}
                  </p>
                </div>
                <Link 
                  href={`/settings/attendance/sites/${siteId}/geofence`}
                  className="px-5 py-2.5 bg-white border border-[#E2E8F0] shadow-sm text-[#161616] type-body-medium font-semibold rounded-xl hover:bg-neutral-50 transition-colors whitespace-nowrap flex items-center gap-2"
                >
                  Setup Geofencing
                  <Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 text-[#8B8B8B]" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 2. Site Pass Setup */}
        <div className="flex flex-col gap-2 pb-6 border-b border-[#E5E7EB]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center shrink-0 text-[#161616]">
                <Icon icon="hugeicons:user-square" className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <h4 className="type-body-medium font-semibold text-[#161616]">Site Pass Access</h4>
                <p className="type-small text-[#737373]">Provides a digital site pass badge on the Xentra Android app for this specific site.</p>
              </div>
            </div>
            <div 
              onClick={() => setSiteForm({ ...siteForm, sitePassEnabled: !siteForm.sitePassEnabled })}
              className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${siteForm.sitePassEnabled ? 'bg-[#34C759]' : 'bg-neutral-200'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm transition-all ${siteForm.sitePassEnabled ? 'left-[22px]' : 'left-[2px]'}`}></div>
            </div>
          </div>

          {siteForm.sitePassEnabled && (
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] p-6 mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="type-body-medium font-semibold text-[#161616]">Digital Site Pass Active</span>
                  <p className="type-small text-[#64748B]">Employees assigned to this site will receive a digital access pass badge on their Xentra Android app.</p>
                </div>
                <Link 
                  href={`/settings/attendance/sites/${siteId}/pass`}
                  className="px-5 py-2.5 bg-white border border-[#E2E8F0] shadow-sm text-[#161616] type-body-medium font-semibold rounded-xl hover:bg-neutral-50 transition-colors whitespace-nowrap flex items-center gap-2"
                >
                  Configure Sitepass
                  <Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 text-[#8B8B8B]" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 3. Site Pass System (CS) */}
        <div className="flex items-start justify-between opacity-60 pb-6 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center shrink-0 text-[#737373]">
              <Icon icon="hugeicons:qr-code" className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h4 className="type-body-medium font-semibold text-[#737373]">Site Pass Scanner System</h4>
                <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-semibold border border-neutral-200">
                  CS - Coming Soon
                </span>
              </div>
              <p className="type-small text-[#737373]">Dynamic QR code scanner screens displayed on entrance tablets.</p>
            </div>
          </div>
          <div className="w-11 h-6 rounded-full bg-neutral-200 relative cursor-not-allowed opacity-50">
            <div className="w-5 h-5 bg-white rounded-full absolute top-[2px] left-[2px] shadow-sm"></div>
          </div>
        </div>

        {/* 4. Biometric Integration (CS) */}
        <div className="flex items-start justify-between opacity-60 pb-6 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center shrink-0 text-[#737373]">
              <Icon icon="hugeicons:face-id" className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h4 className="type-body-medium font-semibold text-[#737373]">Biometric Integration</h4>
                <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-semibold border border-neutral-200">
                  CS - Coming Soon
                </span>
              </div>
              <p className="type-small text-[#737373]">Direct integration with Fingerprint & Face Recognition machine app / hardware terminals.</p>
            </div>
          </div>
          <div className="w-11 h-6 rounded-full bg-neutral-200 relative cursor-not-allowed opacity-50">
            <div className="w-5 h-5 bg-white rounded-full absolute top-[2px] left-[2px] shadow-sm"></div>
          </div>
        </div>

        {/* 5. Wi-Fi / IP Limit (CS) */}
        <div className="flex items-start justify-between opacity-60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center shrink-0 text-[#737373]">
              <Icon icon="hugeicons:wifi-01" className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h4 className="type-body-medium font-semibold text-[#737373]">Wi-Fi / IP Limit</h4>
                <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-semibold border border-neutral-200">
                  CS - Coming Soon
                </span>
              </div>
              <p className="type-small text-[#737373]">Restrict clock-ins so employees can only check in within company Wi-Fi limit.</p>
            </div>
          </div>
          <div className="w-11 h-6 rounded-full bg-neutral-200 relative cursor-not-allowed opacity-50">
            <div className="w-5 h-5 bg-white rounded-full absolute top-[2px] left-[2px] shadow-sm"></div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-[500px] shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#E5E7EB]">
              <h3 className="type-h2 text-[#161616]">Delete Site</h3>
              <p className="type-small text-[#737373] mt-1">
                This action cannot be undone. This will permanently delete the <strong className="text-[#161616]">{siteForm.name}</strong> site configuration.
              </p>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <label className="type-small text-[#161616] font-medium">
                Please type <strong>{siteForm.name}</strong> to confirm.
              </label>
              <input 
                type="text" 
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-black type-body text-[#161616] bg-white placeholder:text-[#A3A3A3]"
                placeholder={siteForm.name}
                autoFocus
              />
            </div>
            <div className="p-6 border-t border-[#E5E7EB] flex items-center justify-end gap-3 bg-gray-50/50">
              <button 
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setDeleteConfirmText('')
                }}
                className="px-5 py-2.5 rounded-full border border-[#E5E7EB] hover:bg-gray-50 transition-colors type-body-medium font-semibold text-[#161616]"
              >
                Cancel
              </button>
              <button 
                type="button"
                disabled={!canDeleteSite}
                onClick={() => {
                  if (canDeleteSite) {
                    handleDelete()
                    setIsDeleteModalOpen(false)
                    setDeleteConfirmText('')
                  }
                }}
                className={`px-5 py-2.5 rounded-full transition-colors type-body-medium font-semibold ${
                  canDeleteSite
                    ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer' 
                    : 'bg-red-200 text-white cursor-not-allowed'
                }`}
              >
                Delete Site
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

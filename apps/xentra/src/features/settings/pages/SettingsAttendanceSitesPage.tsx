"use client"

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Site {
  id: string
  name: string
  address: string
  radius: number
}

export function SettingsAttendanceSitesPage() {
  const { company } = useCompanyStore()
  const queryClient = useQueryClient()
  const [companyId, setCompanyId] = useState<string | null>(null)



  // Modal State
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [siteForm, setSiteForm] = useState<Partial<Site>>({ name: '', address: '', radius: 100 })

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

  // 2. Fetch Company Sites
  const { data: sites = [], isLoading: isQueryLoading } = useQuery({
    queryKey: ['company_sites', companyId],
    queryFn: async () => {
      if (!companyId) return []
      const { data, error } = await supabase
        .from('company_sites')
        .select('*')
        .eq('company_id', companyId)

      if (error) throw error
      return data || []
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  })

  // 3. Supabase Realtime Subscription
  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel(`company_sites_${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_sites',
          filter: `company_id=eq.${companyId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['company_sites', companyId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId, queryClient])

  // 4. React Query Mutations
  const createMutation = useMutation({
    mutationFn: async (newSite: any) => {
      if (!companyId) throw new Error('Company ID not found.')
      const { data, error } = await supabase
        .from('company_sites')
        .insert({
          id: Date.now().toString(),
          company_id: companyId,
          name: newSite.name,
          address: newSite.address,
          radius: newSite.radius
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_sites', companyId] })
      toast.success('Site created successfully!')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create site')
  })

  const updateMutation = useMutation({
    mutationFn: async (updatedSite: any) => {
      if (!companyId) throw new Error('Company ID not found.')
      const { data, error } = await supabase
        .from('company_sites')
        .update({
          name: updatedSite.name,
          address: updatedSite.address,
          radius: updatedSite.radius
        })
        .eq('id', updatedSite.id)
        .eq('company_id', companyId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_sites', companyId] })
      toast.success('Site updated successfully!')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update site')
  })

  const deleteMutation = useMutation({
    mutationFn: async (siteId: string) => {
      if (!companyId) throw new Error('Company ID not found.')
      const { error } = await supabase
        .from('company_sites')
        .delete()
        .eq('id', siteId)
        .eq('company_id', companyId)
      if (error) throw error
      return siteId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_sites', companyId] })
      toast.success('Site removed successfully!')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to remove site')
  })

  const openSiteModal = (site?: Site) => {
    if (site) {
      setEditingSite(site)
      setSiteForm(site)
    } else {
      setEditingSite(null)
      setSiteForm({ name: '', address: '', radius: 100 })
    }
    setIsSiteModalOpen(true)
  }

  const saveSite = () => {
    if (!siteForm.name?.trim()) {
      toast.error('Please enter a site name')
      return
    }

    if (editingSite) {
      updateMutation.mutate({ ...editingSite, ...siteForm })
    } else {
      createMutation.mutate(siteForm)
    }
    setIsSiteModalOpen(false)
  }

  const removeSite = (id: string) => {
    deleteMutation.mutate(id)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  // Delete Modal State
  const [deleteSiteId, setDeleteSiteId] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const siteToDelete = sites.find(s => s.id === deleteSiteId)
  const canDeleteSite = siteToDelete?.name === deleteConfirmText

  return (
    <div className="flex flex-col gap-6 max-w-[800px] pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 type-small text-[#737373] mb-4">
          <Link href="/settings/attendance" className="hover:text-[#161616] transition-colors flex items-center gap-1">
            <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
            Attendance Settings
          </Link>
          <span>/</span>
          <span className="text-[#161616]">Work Sites</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="type-h2 text-[#161616]">Work Sites</h2>
            <p className="type-small text-[#737373] mt-1">Manage geographical locations for mobile clock-ins.</p>
          </div>
          <button 
            onClick={() => openSiteModal()}
            disabled={isQueryLoading}
            className="flex items-center gap-2 type-body-medium font-semibold px-4 py-2 rounded-full transition-colors bg-black text-white hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
          >
            <Icon icon="hugeicons:plus-sign" className="w-4 h-4" />
            Add Site
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-[#E5E7EB] flex flex-col min-h-[200px] relative">
        {isQueryLoading || isSaving ? (
          <div className="flex-1 flex items-center justify-center p-8 text-[#8B8B8B]">
            <Icon icon="hugeicons:loading-03" className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            {sites.map((site: Site, index: number) => (
              <Link 
                href={`/settings/attendance/sites/${site.id}`}
                key={site.id}
                className={`p-6 flex items-center justify-between border-b border-[#E5E7EB] cursor-pointer hover:bg-gray-50 transition-colors ${
                  index === 0 ? 'rounded-t-[24px]' : ''
                } ${
                  index === sites.length - 1 ? 'border-b-0 rounded-b-[24px]' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center shrink-0 text-[#161616]">
                    <Icon icon="hugeicons:building-03" className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="type-body-medium text-[#161616]">{site.name}</span>
                    <span className="type-small text-[#737373]">
                      {site.address ? site.address : 'Click to configure location & geofence settings.'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDeleteSiteId(site.id)
                      setDeleteConfirmText('')
                    }}
                    className="p-2 text-[#8B8B8B] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
                  </button>
                  <Icon icon="hugeicons:arrow-right-01" className="w-5 h-5 text-[#8B8B8B]" />
                </div>
              </Link>
            ))}
            {sites.length === 0 && (
              <div className="p-8 text-center text-[#737373] type-body">
                No sites configured. Add one to get started.
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between px-2">
        <span className="type-small text-[#8B8B8B]">{sites.length} Sites configured</span>
      </div>

      {/* Add Site Modal */}
      {isSiteModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-[500px] shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="type-h3 text-[#161616]">{editingSite ? 'Edit Site' : 'Add New Site'}</h3>
              <button onClick={() => setIsSiteModalOpen(false)} className="text-[#737373] hover:text-black">
                <Icon icon="hugeicons:cancel-01" className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="type-small font-semibold text-[#161616]">Site Name</label>
                <input 
                  type="text" 
                  value={siteForm.name}
                  onChange={e => setSiteForm({ ...siteForm, name: e.target.value })}
                  placeholder="e.g. Headquarters"
                  autoFocus
                  className="px-4 py-2.5 bg-white text-[#161616] placeholder:text-[#A3A3A3] border border-[#E5E7EB] rounded-xl outline-none focus:border-black type-body"
                />
              </div>
            </div>
            <div className="p-6 border-t border-[#E5E7EB] flex items-center justify-end gap-3 bg-gray-50/50">
              <button 
                onClick={() => setIsSiteModalOpen(false)}
                className="px-5 py-2.5 rounded-full border border-[#E5E7EB] hover:bg-gray-50 transition-colors type-body-medium font-semibold text-[#161616]"
              >
                Cancel
              </button>
              <button 
                onClick={saveSite}
                disabled={!siteForm.name?.trim()}
                className="px-5 py-2.5 rounded-full bg-black text-white hover:bg-neutral-800 transition-colors type-body-medium font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Site
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteSiteId && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-[500px] shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#E5E7EB]">
              <h3 className="type-h2 text-[#161616]">Delete Site</h3>
              <p className="type-small text-[#737373] mt-1">
                This action cannot be undone. This will permanently delete the <strong className="text-[#161616]">{siteToDelete?.name}</strong> site configuration.
              </p>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <label className="type-small text-[#161616] font-medium">
                Please type <strong>{siteToDelete?.name}</strong> to confirm.
              </label>
              <input 
                type="text" 
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-black type-body text-[#161616] bg-white placeholder:text-[#A3A3A3]"
                placeholder={siteToDelete?.name}
                autoFocus
              />
            </div>
            <div className="p-6 border-t border-[#E5E7EB] flex items-center justify-end gap-3 bg-gray-50/50">
              <button 
                type="button"
                onClick={() => {
                  setDeleteSiteId(null)
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
                  if (deleteSiteId && canDeleteSite) {
                    removeSite(deleteSiteId)
                    setDeleteSiteId(null)
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

"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'

// Dynamically import Map component (SSR disabled for Leaflet)
const GeofenceMap = dynamic(() => import('@/features/settings/components/GeofenceMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <Icon icon="hugeicons:loading-01" className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  )
})

interface Site {
  id: string
  name: string
  address: string
  radius: number
  lat?: number
  lng?: number
}

export function SettingsAttendanceSiteGeofencePage() {
  const params = useParams()
  const siteId = params.id as string

  const { company } = useCompanyStore()
  const queryClient = useQueryClient()
  const [companyId, setCompanyId] = useState<string | null>(null)

  // Map UI State
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isFetchingLocation, setIsFetchingLocation] = useState(false)
  const [showOtherSites, setShowOtherSites] = useState(false)
  
  // Site Form State
  const [siteForm, setSiteForm] = useState<Site>({
    id: siteId,
    name: '',
    address: '',
    radius: 100
  })

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

  // Fetch all sites for the map (to show other sites)
  const { data: allSitesData = [] } = useQuery({
    queryKey: ['company_sites', companyId],
    queryFn: async () => {
      if (!companyId) return []
      const { data, error } = await supabase
        .from('company_sites')
        .select('*')
        .eq('company_id', companyId)

      if (error) throw error
      return data.map((site: any) => ({
        id: site.id,
        name: site.name,
        address: site.address,
        radius: site.radius,
        lat: site.latitude,
        lng: site.longitude
      }))
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  })

  // 3. Hydrate state
  useEffect(() => {
    if (siteData) {
      setSiteForm({
        id: siteData.id,
        name: siteData.name,
        address: siteData.address || '',
        radius: siteData.radius > 0 ? siteData.radius : 100,
        lat: siteData.latitude || undefined,
        lng: siteData.longitude || undefined,
      })
    }
  }, [siteData])

  // 4. React Query Mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedSite: Site) => {
      if (!companyId) throw new Error('Company ID not found. Unable to save geofence.')
      const { error } = await supabase
        .from('company_sites')
        .update({
          latitude: updatedSite.lat,
          longitude: updatedSite.lng,
          radius: updatedSite.radius,
          address: updatedSite.address
        })
        .eq('id', siteId)
        .eq('company_id', companyId)

      if (error) throw error
      return updatedSite
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_sites'] })
      toast.success('Geofence settings saved successfully!')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save geofence settings')
    }
  })

  const handleSave = () => {
    updateMutation.mutate(siteForm)
  }

  // Map Actions
  const handleFetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      return
    }
    
    setIsFetchingLocation(true)
    toast.info("Fetching your current location...")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSiteForm({
          ...siteForm,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        toast.success("Location updated successfully")
        setIsFetchingLocation(false)
      },
      () => {
        toast.error("Failed to retrieve location. Please check browser permissions.")
        setIsFetchingLocation(false)
      }
    )
  }

  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      if (data && data.length > 0) {
        setSiteForm({
          ...siteForm,
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          address: data[0].display_name
        })
        toast.success("Location found!")
      } else {
        toast.error("Location not found. Try a different search term.")
      }
    } catch (err) {
      toast.error("Error searching location. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null)
  useEffect(() => {
    setPortalNode(document.getElementById('settings-map-portal'))
  }, [])

  if (!portalNode) return null

  const mapContent = (
    <div className="absolute inset-0 bg-[#F9FAFB] flex flex-col overflow-hidden pointer-events-auto">
      
      {/* Floating Header Elements (Positioned inside the top gradient) */}
      <div className="absolute top-[84px] left-8 right-8 z-[110] flex items-start justify-end pointer-events-none">
        
        {/* Right Aligned Container */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Grey Back Button */}
          <Link href={`/settings/attendance/sites/${siteId}`} className="w-10 h-10 rounded-full bg-[#F4F4F5] shadow-sm flex items-center justify-center hover:bg-[#E5E7EB] transition-colors shrink-0">
            <Icon icon="hugeicons:arrow-left-01" className="w-5 h-5 text-[#161616]" />
          </Link>

          {/* Save Button */}
          <button 
            onClick={handleSave}
            disabled={updateMutation.isPending || isQueryLoading}
            className="px-6 py-2.5 type-body-medium font-semibold rounded-full bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-lg"
          >
            {updateMutation.isPending && <Icon icon="hugeicons:loading-01" className="w-4 h-4 animate-spin" />}
            {updateMutation.isPending ? 'Saving...' : 'Save Coordinates'}
          </button>
        </div>
      </div>

      {/* Floating Action Panels */}
      <div className="absolute top-[84px] left-8 z-[110] flex flex-col gap-4 w-[360px]">
          {/* Search Panel */}
          <div className="bg-white/90 backdrop-blur-md rounded-[20px] shadow-lg border border-[#E5E7EB] p-4 flex flex-col gap-3">
            <form onSubmit={handleSearchLocation} className="relative">
              <Icon icon="hugeicons:search-01" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search address or location..."
                className="w-full pl-10 pr-24 py-2.5 bg-[#F4F4F5] border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
              />
              <button 
                type="submit"
                disabled={isSearching}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg disabled:opacity-50"
              >
                {isSearching ? '...' : 'Search'}
              </button>
            </form>
            <button 
              onClick={handleFetchCurrentLocation}
              disabled={isFetchingLocation}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-50"
            >
              <Icon icon="hugeicons:navigation-03" className="w-4 h-4" />
              {isFetchingLocation ? 'Fetching...' : 'Fetch My Current Location'}
            </button>
          </div>

          {/* Radius Panel */}
          <div className="bg-white/90 backdrop-blur-md rounded-[20px] shadow-lg border border-[#E5E7EB] p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="type-small font-semibold text-[#161616]">Geofence Radius</span>
              <span className="text-sm font-medium text-black bg-gray-100 px-3 py-1 rounded-full">{siteForm.radius} meters</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <input 
                type="range" 
                min="10" 
                max="1000" 
                step="10"
                value={siteForm.radius || 100} 
                onChange={(e) => setSiteForm({ ...siteForm, radius: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <div className="flex justify-between text-xs font-medium text-gray-400">
                <span>10m</span>
                <span>1km</span>
              </div>
            </div>

            <div className="text-xs text-[#737373] bg-[#F4F4F5] p-3 rounded-[12px] flex items-start gap-2.5">
              <Icon icon="hugeicons:information-circle" className="w-4 h-4 shrink-0 text-gray-400 mt-0.5" />
              <span className="leading-relaxed">Click anywhere on the map to pin a new coordinate for this site, or drag the slider to adjust the clock-in boundary size.</span>
            </div>
          </div>

          {/* Show Other Sites Toggle */}
          <div className="bg-white/90 backdrop-blur-md rounded-[20px] shadow-lg border border-[#E5E7EB] p-4 flex items-center justify-between cursor-pointer" onClick={() => setShowOtherSites(!showOtherSites)}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#F4F4F5] flex items-center justify-center text-[#737373]">
                <Icon icon="hugeicons:location-user-01" className="w-4 h-4" />
              </div>
              <span className="type-small font-semibold text-[#161616]">Show Other Sites on Map</span>
            </div>
            <div className={`w-11 h-6 rounded-full relative transition-colors ${showOtherSites ? 'bg-[#34C759]' : 'bg-neutral-200'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm transition-all ${showOtherSites ? 'left-[22px]' : 'left-[2px]'}`}></div>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="absolute inset-0 z-0">
          <GeofenceMap 
            currentSite={siteForm} 
            allSites={allSitesData}
            showOtherSites={showOtherSites}
            onLocationUpdate={(lat, lng) => setSiteForm({ ...siteForm, lat, lng })}
          />
        </div>
    </div>
  )

  return createPortal(mapContent, portalNode)
}

"use client"

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface AttendanceMethods {
  mobileGps: boolean
  facialRecognition: boolean
  qrScanner: boolean
  webManual: boolean
}

export function SettingsAttendanceMethodsPage() {
  const { company } = useCompanyStore()
  const queryClient = useQueryClient()
  const [companyId, setCompanyId] = useState<string | null>(null)

  // Form State
  const [attendanceMethods, setAttendanceMethods] = useState<AttendanceMethods>({
    mobileGps: true,
    facialRecognition: false,
    qrScanner: false,
    webManual: true
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

  // 2. Fetch Company Settings
  const { data: attendanceSettings = {}, isLoading: isQueryLoading } = useQuery({
    queryKey: ['company_settings', 'attendance', companyId],
    queryFn: async () => {
      if (!companyId) return {}
      const { data, error } = await supabase
        .from('company_settings')
        .select('attendance_settings')
        .eq('company_id', companyId)
        .maybeSingle()

      if (error) throw error
      return data?.attendance_settings || {}
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  })

  // 3. Hydrate state
  useEffect(() => {
    if (attendanceSettings?.attendanceMethods) {
      setAttendanceMethods(attendanceSettings.attendanceMethods)
    }
  }, [attendanceSettings])

  // 4. Supabase Realtime Subscription
  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel(`company_settings_attendance_methods_${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_settings',
          filter: `company_id=eq.${companyId}`
        },
        (payload: any) => {
          if (payload.new && payload.new.attendance_settings) {
            queryClient.setQueryData(['company_settings', 'attendance', companyId], payload.new.attendance_settings)
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
          attendance_settings: updatedConfig
        })
        .eq('company_id', companyId)

      if (error) throw error
      return updatedConfig
    },
    onMutate: async (newConfig) => {
      await queryClient.cancelQueries({ queryKey: ['company_settings', 'attendance', companyId] })
      const previousConfig = queryClient.getQueryData(['company_settings', 'attendance', companyId])
      queryClient.setQueryData(['company_settings', 'attendance', companyId], newConfig)
      return { previousConfig }
    },
    onError: (err: any, _, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(['company_settings', 'attendance', companyId], context.previousConfig)
      }
      toast.error(err.message || 'Failed to save methods')
    },
    onSuccess: () => {
      toast.success('Attendance methods saved successfully!')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['company_settings', 'attendance', companyId] })
    }
  })

  const handleSave = () => {
    const updatedConfig = {
      ...attendanceSettings,
      attendanceMethods
    }
    saveMutation.mutate(updatedConfig)
  }

  const isSaving = saveMutation.isPending

  return (
    <div className="flex flex-col gap-6 max-w-[900px] pb-12">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 type-small text-[#737373] mb-4">
            <Link href="/settings/attendance" className="hover:text-[#161616] transition-colors flex items-center gap-1">
              <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
              Attendance Settings
            </Link>
            <span>/</span>
            <span className="text-[#161616]">Methods</span>
          </div>
          <h2 className="type-h2 text-[#161616]">Attendance Methods</h2>
          <p className="type-small text-[#737373] mt-1">Select the ways employees are permitted to record their attendance.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving || isQueryLoading}
          className="px-6 py-2.5 type-body-medium font-semibold rounded-full bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          {isSaving && <Icon icon="hugeicons:loading-01" className="w-4 h-4 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save Methods'}
        </button>
      </div>

      <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-8 flex flex-col gap-6 relative">
        {isQueryLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-[24px] z-20 flex items-center justify-center">
            <Icon icon="hugeicons:loading-01" className="w-6 h-6 animate-spin text-black" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            type="button"
            onClick={() => setAttendanceMethods(prev => ({ ...prev, mobileGps: !prev.mobileGps }))}
            className={`p-4 rounded-xl border text-left transition-colors flex flex-col gap-2 ${
              attendanceMethods.mobileGps ? 'border-black bg-neutral-50' : 'border-[#ECECEC] hover:border-[#D4D4D4] bg-white'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Icon icon="hugeicons:location-user-01" className="w-5 h-5 text-[#161616]" />
                <span className="type-body-medium text-[#161616]">Mobile GPS & Geofencing</span>
              </div>
              {attendanceMethods.mobileGps && <Icon icon="hugeicons:checkmark-circle-02" className="w-5 h-5 text-[#34C759]" />}
            </div>
            <span className="type-small text-[#737373]">Employees can clock in via mobile app if they are within a defined site radius.</span>
          </button>

          <button 
            type="button"
            onClick={() => setAttendanceMethods(prev => ({ ...prev, facialRecognition: !prev.facialRecognition }))}
            className={`p-4 rounded-xl border text-left transition-colors flex flex-col gap-2 ${
              attendanceMethods.facialRecognition ? 'border-black bg-neutral-50' : 'border-[#ECECEC] hover:border-[#D4D4D4] bg-white'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Icon icon="hugeicons:face-id" className="w-5 h-5 text-[#161616]" />
                <span className="type-body-medium text-[#161616]">Facial Recognition (Selfie)</span>
              </div>
              {attendanceMethods.facialRecognition && <Icon icon="hugeicons:checkmark-circle-02" className="w-5 h-5 text-[#34C759]" />}
            </div>
            <span className="type-small text-[#737373]">Require a live selfie photo verification when clocking in via mobile.</span>
          </button>

          <button 
            type="button"
            onClick={() => setAttendanceMethods(prev => ({ ...prev, qrScanner: !prev.qrScanner }))}
            className={`p-4 rounded-xl border text-left transition-colors flex flex-col gap-2 ${
              attendanceMethods.qrScanner ? 'border-black bg-neutral-50' : 'border-[#ECECEC] hover:border-[#D4D4D4] bg-white'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Icon icon="hugeicons:qr-code" className="w-5 h-5 text-[#161616]" />
                <span className="type-body-medium text-[#161616]">Site Pass QR Scanner</span>
              </div>
              {attendanceMethods.qrScanner && <Icon icon="hugeicons:checkmark-circle-02" className="w-5 h-5 text-[#34C759]" />}
            </div>
            <span className="type-small text-[#737373]">Employees scan a dynamic QR code displayed at the site entrance.</span>
          </button>

          <button 
            type="button"
            onClick={() => setAttendanceMethods(prev => ({ ...prev, webManual: !prev.webManual }))}
            className={`p-4 rounded-xl border text-left transition-colors flex flex-col gap-2 ${
              attendanceMethods.webManual ? 'border-black bg-neutral-50' : 'border-[#ECECEC] hover:border-[#D4D4D4] bg-white'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Icon icon="hugeicons:laptop" className="w-5 h-5 text-[#161616]" />
                <span className="type-body-medium text-[#161616]">Web Dashboard Clock-in</span>
              </div>
              {attendanceMethods.webManual && <Icon icon="hugeicons:checkmark-circle-02" className="w-5 h-5 text-[#34C759]" />}
            </div>
            <span className="type-small text-[#737373]">Allow employees to clock in remotely from their desktop web browser.</span>
          </button>
        </div>
      </div>
    </div>
  )
}

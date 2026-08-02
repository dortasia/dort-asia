"use client"

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const formatTimeInput = (val: string) => {
  let digits = val.replace(/\D/g, '').slice(0, 4)
  if (!digits) return ''
  if (digits.length === 1 && parseInt(digits[0], 10) > 1) digits = '0' + digits[0]
  if (digits.length >= 2) {
    let hh = parseInt(digits.slice(0, 2), 10)
    if (hh > 12) digits = '12' + digits.slice(2)
    if (hh === 0 && digits.length >= 2) digits = '12' + digits.slice(2)
  }
  if (digits.length >= 4) {
    let mm = parseInt(digits.slice(2, 4), 10)
    if (mm > 59) digits = digits.slice(0, 2) + '59'
  }
  if (digits.length > 2) return `${digits.slice(0, 2)} : ${digits.slice(2, 4)}`
  return digits
}

const convertTo24h = (time12h: string, ampm: string): string => {
  if (!time12h) return "23:59"
  const clean = time12h.replace(/\s/g, '')
  const parts = clean.split(':')
  let h = parseInt(parts[0] || "11", 10)
  const m = parts[1] ? parts[1].padStart(2, '0') : "00"
  if (ampm === 'PM' && h < 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  return `${h.toString().padStart(2, '0')}:${m}`
}

const parseFrom24h = (time24h: string): { time: string; ampm: string } => {
  if (!time24h) return { time: "11 : 59", ampm: "PM" }
  const parts = time24h.split(':').map(s => s.trim())
  let h = parseInt(parts[0] || "23", 10)
  const m = parts[1] ? parts[1].padStart(2, '0') : "59"
  let ampm = "AM"
  if (h >= 12) {
    ampm = "PM"
    if (h > 12) h -= 12
  }
  if (h === 0) h = 12
  return { time: `${h.toString().padStart(2, '0')} : ${m}`, ampm }
}

const format24hToDisplay = (time24h: string) => {
  const { time, ampm } = parseFrom24h(time24h)
  return `${time.replace(/\s/g, '')} ${ampm}`
}

const isTimeWithinShift = (fixedTime24: string, shiftStart24: string, shiftEnd24: string) => {
  const toMins = (t: string) => {
    const parts = t.split(':').map(Number)
    return (parts[0] || 0) * 60 + (parts[1] || 0)
  }

  const target = toMins(fixedTime24)
  const start = toMins(shiftStart24)
  const end = toMins(shiftEnd24)

  if (start < end) {
    return target >= start && target < end
  } else if (start > end) {
    return target >= start || target < end
  }
  return false
}

interface AutoClockOut {
  enabled: boolean
  mode?: 'shift_end' | 'fixed_time'
  time?: string
}

export function SettingsAttendancePage() {
  const { company } = useCompanyStore()
  const queryClient = useQueryClient()
  const [companyId, setCompanyId] = useState<string | null>(null)

  // 12h Time Picker State
  const [fixedTime12, setFixedTime12] = useState<string>('11 : 59')
  const [fixedTimeAmPm, setFixedTimeAmPm] = useState<string>('PM')

  // Form State
  const [autoClockOut, setAutoClockOut] = useState<AutoClockOut>({
    enabled: false,
    mode: 'shift_end',
    time: '23:59'
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
  const { data: companySettingsData = {}, isLoading: isQueryLoading } = useQuery<any>({
    queryKey: ['company_settings', 'attendance', companyId],
    queryFn: async () => {
      if (!companyId) return {}
      const { data, error } = await supabase
        .from('company_settings')
        .select('attendance_settings, shift_start, shift_end')
        .eq('company_id', companyId)
        .maybeSingle()

      if (error) throw error
      return data || {}
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  })

  const attendanceSettings = companySettingsData?.attendance_settings || {}
  const shiftStart = companySettingsData?.shift_start || '09:00'
  const shiftEnd = companySettingsData?.shift_end || '18:00'

  // 3. Hydrate state
  useEffect(() => {
    if (attendanceSettings?.autoClockOut) {
      const mode = attendanceSettings.autoClockOut.mode || 'shift_end'
      const time24 = attendanceSettings.autoClockOut.time || '23:59'
      const parsed = parseFrom24h(time24)
      setFixedTime12(parsed.time)
      setFixedTimeAmPm(parsed.ampm)

      setAutoClockOut({
        enabled: attendanceSettings.autoClockOut.enabled ?? false,
        mode: mode,
        time: time24
      })
    }
  }, [attendanceSettings])

  // Handle 12-hour time changes
  const handleTime12Change = (newTime12: string, newAmPm: string) => {
    setFixedTime12(newTime12)
    setFixedTimeAmPm(newAmPm)
    const time24 = convertTo24h(newTime12, newAmPm)
    setAutoClockOut(prev => ({ ...prev, time: time24 }))
  }

  const currentFixedTime24 = convertTo24h(fixedTime12, fixedTimeAmPm)
  const isWithinShiftError = isTimeWithinShift(currentFixedTime24, shiftStart, shiftEnd)

  // 4. Supabase Realtime Subscription
  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel(`company_settings_attendance_${companyId}`)
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
      toast.error(err.message || 'Failed to save settings')
    },
    onSuccess: () => {
      toast.success('Attendance settings saved successfully!')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['company_settings', 'attendance', companyId] })
    }
  })

  const handleSave = () => {
    if (autoClockOut.enabled && autoClockOut.mode === 'fixed_time') {
      const time24 = convertTo24h(fixedTime12, fixedTimeAmPm)
      if (isTimeWithinShift(time24, shiftStart, shiftEnd)) {
        const startDisp = format24hToDisplay(shiftStart)
        const endDisp = format24hToDisplay(shiftEnd)
        toast.error(`Fixed execution time cannot be within company shift hours (${startDisp} - ${endDisp}). Please select a time outside shift hours.`)
        return
      }
    }

    const updatedConfig = {
      ...attendanceSettings,
      autoClockOut: {
        ...autoClockOut,
        time: convertTo24h(fixedTime12, fixedTimeAmPm)
      }
    }
    saveMutation.mutate(updatedConfig)
  }

  const isSaving = saveMutation.isPending

  return (
    <div className="flex flex-col gap-6 max-w-[800px] pb-12 relative">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-[28px] font-medium text-[#111827] tracking-tight font-sans">Attendance Settings</h2>
          <p className="type-small text-[#737373] mt-1">Configure work sites, allowed clock-in methods, and auto clock-out rules.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving || isQueryLoading}
          className="px-6 py-2.5 type-body-medium font-semibold rounded-full bg-black text-[#ffffff] hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          {isSaving && <Icon icon="hugeicons:loading-01" className="w-4 h-4 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="bg-white rounded-[24px] border border-[#E5E7EB] flex flex-col relative">
        {isQueryLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-[24px] z-20 flex items-center justify-center">
            <Icon icon="hugeicons:loading-01" className="w-6 h-6 animate-spin text-black" />
          </div>
        )}

        {/* Work Sites */}
        <Link href="/settings/attendance/sites" className="p-6 flex items-center justify-between border-b border-[#E5E7EB] cursor-pointer hover:bg-gray-50 transition-colors first:rounded-t-[24px]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center shrink-0 text-[#161616]">
              <Icon icon="hugeicons:building-03" className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="type-body-medium text-[#161616]">Work Sites</span>
              <span className="type-small text-[#737373]">Define geographical locations where employees can clock in using GPS.</span>
            </div>
          </div>
          <Icon icon="hugeicons:arrow-right-01" className="w-5 h-5 text-[#8B8B8B]" />
        </Link>

        {/* Allowed Attendance Methods */}
        <Link href="/settings/attendance/methods" className="p-6 flex items-center justify-between border-b border-[#E5E7EB] cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center shrink-0 text-[#161616]">
              <Icon icon="hugeicons:face-id" className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="type-body-medium text-[#161616]">Allowed Attendance Methods</span>
              <span className="type-small text-[#737373]">Select the ways employees are permitted to record their attendance.</span>
            </div>
          </div>
          <Icon icon="hugeicons:arrow-right-01" className="w-5 h-5 text-[#8B8B8B]" />
        </Link>

        {/* Auto Clock Out */}
        <div className="p-6 flex flex-col gap-4 last:rounded-b-[24px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center shrink-0 text-[#161616]">
                <Icon icon="hugeicons:clock-01" className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="type-body-medium text-[#161616]">Auto Clock-Out Policy</span>
                <span className="type-small text-[#737373]">Automatically clock out employees who forget to end their shift.</span>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setAutoClockOut(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoClockOut.enabled ? 'bg-[#34C759]' : 'bg-[#E5E7EB]'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoClockOut.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {autoClockOut.enabled && (
            <div className="ml-14 p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col gap-4 animate-in fade-in duration-200">
              <div>
                <span className="type-body-medium font-semibold text-[#161616]">Auto Clock-Out Trigger</span>
                <span className="type-small text-[#737373] block mt-0.5">Determine when active shifts will automatically be clocked out.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div 
                  onClick={() => setAutoClockOut(prev => ({ ...prev, mode: 'shift_end' }))}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                    (autoClockOut.mode || 'shift_end') === 'shift_end' ? 'border-black bg-white shadow-xs' : 'border-[#E2E8F0] bg-white/50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="type-body-medium font-semibold text-[#161616]">Company Shift End Time</span>
                    {(autoClockOut.mode || 'shift_end') === 'shift_end' && <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4 text-[#34C759]" />}
                  </div>
                  <span className="type-small text-[#737373]">Clock out automatically at the end of each employee's company shift time.</span>
                </div>

                <div 
                  onClick={() => setAutoClockOut(prev => ({ ...prev, mode: 'fixed_time' }))}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                    autoClockOut.mode === 'fixed_time' ? 'border-black bg-white shadow-xs' : 'border-[#E2E8F0] bg-white/50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="type-body-medium font-semibold text-[#161616]">Fixed Execution Time</span>
                    {autoClockOut.mode === 'fixed_time' && <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4 text-[#34C759]" />}
                  </div>
                  <span className="type-small text-[#737373]">Run auto clock-out for all remaining employees at a fixed daily time.</span>
                </div>
              </div>

              {autoClockOut.mode === 'fixed_time' && (
                <div className="flex flex-col gap-3 pt-3 border-t border-[#E5E7EB]">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <span className="type-body-medium text-[#161616] block">Fixed Time (12-Hour)</span>
                      <span className="type-small text-[#737373]">
                        Shift hours: <strong className="text-[#161616]">{format24hToDisplay(shiftStart)} - {format24hToDisplay(shiftEnd)}</strong>
                      </span>
                    </div>

                    {/* 12-Hour Picker with AM/PM */}
                    <div className="flex items-center gap-2">
                      <div className="relative h-11 w-36">
                        <input 
                          type="text" 
                          placeholder="HH : MM" 
                          value={fixedTime12} 
                          onChange={(e) => handleTime12Change(formatTimeInput(e.target.value), fixedTimeAmPm)} 
                          className="w-full h-full bg-white border border-[#E5E7EB] rounded-xl px-3.5 type-body text-[#161616] outline-none focus:border-black transition-all font-mono" 
                        />
                      </div>
                      <div className="h-11 bg-[#F4F4F5] rounded-xl p-1 flex items-center shrink-0">
                        <button 
                          type="button" 
                          onClick={() => handleTime12Change(fixedTime12, 'AM')} 
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${fixedTimeAmPm === 'AM' ? 'bg-white text-[#161616] shadow-sm' : 'text-[#737373] hover:text-[#161616]'}`}
                        >
                          AM
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleTime12Change(fixedTime12, 'PM')} 
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${fixedTimeAmPm === 'PM' ? 'bg-white text-[#161616] shadow-sm' : 'text-[#737373] hover:text-[#161616]'}`}
                        >
                          PM
                        </button>
                      </div>
                    </div>
                  </div>

                  {isWithinShiftError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-medium animate-in fade-in duration-200">
                      <Icon icon="hugeicons:alert-circle" className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Fixed execution time cannot be within company shift hours ({format24hToDisplay(shiftStart)} - {format24hToDisplay(shiftEnd)}). Please select a time outside shift hours.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

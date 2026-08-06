"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { getAvatarUrl } from '@/lib/utils'

// Custom 12-hour time picker with manual inputs and inbuilt AM/PM
const TimeInput12Hour = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const parse = (v: string) => {
    if (!v) return { h: '', m: '', p: 'AM' }
    const [hr, min] = v.split(':')
    const h24 = parseInt(hr, 10)
    const p = h24 >= 12 ? 'PM' : 'AM'
    let h12 = h24 % 12
    if (h12 === 0) h12 = 12
    return { h: h12.toString().padStart(2, '0'), m: min || '00', p }
  }
  const current = parse(value)

  const handleChange = (part: 'h'|'m'|'p', newVal: string) => {
    let finalVal = newVal
    if (part === 'h' || part === 'm') {
      finalVal = newVal.replace(/\D/g, '').slice(0, 2)
      if (part === 'h' && parseInt(finalVal) > 12) finalVal = '12'
      if (part === 'm' && parseInt(finalVal) > 59) finalVal = '59'
    }
    
    const next = { ...current, [part]: finalVal }
    
    const hrToSet = next.h || '12'
    const minToSet = next.m || '00'
    let h24 = parseInt(hrToSet, 10)
    if (next.p === 'PM' && h24 < 12) h24 += 12
    if (next.p === 'AM' && h24 === 12) h24 = 0
    const hr24Str = h24.toString().padStart(2, '0')
    const minStr = minToSet.padStart(2, '0')
    onChange(`${hr24Str}:${minStr}`)
  }

  const handleBlur = (part: 'h'|'m') => {
    const val = current[part]
    if (val && val.length === 1) {
      handleChange(part, val.padStart(2, '0'))
    }
  }

  return (
    <div className="flex items-center w-full h-11 border border-[#E5E7EB] rounded-[10px] bg-white focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all px-3">
      <input 
        type="text"
        placeholder="12"
        value={current.h}
        onChange={e => handleChange('h', e.target.value)}
        onBlur={() => handleBlur('h')}
        className="w-7 text-center type-body text-[#161616] focus:outline-none bg-transparent placeholder:text-gray-300 font-medium"
      />
      <span className="text-[#737373] font-medium type-small mx-1 pb-0.5">:</span>
      <input 
        type="text"
        placeholder="00"
        value={current.m}
        onChange={e => handleChange('m', e.target.value)}
        onBlur={() => handleBlur('m')}
        className="w-7 text-center type-body text-[#161616] focus:outline-none bg-transparent placeholder:text-gray-300 font-medium"
      />
      <div className="h-4 w-[1px] bg-[#E5E7EB] mx-3"></div>
      <div className="relative flex-1">
        <select 
          value={current.p} 
          onChange={e => handleChange('p', e.target.value)}
          className="w-full type-body text-[#161616] focus:outline-none bg-transparent appearance-none cursor-pointer font-medium pl-1 pr-6 py-1"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
        <Icon icon="hugeicons:arrow-down-01" className="w-3.5 h-3.5 text-[#737373] absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  )
}

interface AdvancedDepartmentSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: {
    id: string
    department_name: string
    start_time?: string
    end_time?: string
    delegation_config?: any
    designations?: any
  }
  employees: any[]
}

type ActivePopup = 'none' | 'leadership' | 'hours' | 'designations' | 'delete'

export function AdvancedDepartmentSettingsDialog({ open, onOpenChange, department, employees }: AdvancedDepartmentSettingsDialogProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [activePopup, setActivePopup] = useState<ActivePopup>('none')
  
  const currentHeadId = employees.find((emp) => emp.app_role === 'Admin')?.id || ''

  const [formData, setFormData] = useState({
    head_id: '',
    start_time: '',
    end_time: '',
  })

  const [searchInput, setSearchInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [useCustomTimings, setUseCustomTimings] = useState(false)

  // Designations State
  const [designationsList, setDesignationsList] = useState<string[]>([])
  const [newDesignationInput, setNewDesignationInput] = useState('')
  
  // Deletion State
  const [isDeletingDept, setIsDeletingDept] = useState(false)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')

  useEffect(() => {
    if (department && open) {
      setFormData({
        head_id: currentHeadId,
        start_time: department.start_time || '',
        end_time: department.end_time || '',
      })
      setUseCustomTimings(!!department.start_time || !!department.end_time)

      const existingDesigs = Array.isArray(department.designations) 
        ? department.designations 
        : Array.from(new Set(employees.map(e => e.designation).filter(Boolean)))
      setDesignationsList(existingDesigs)
      setActivePopup('none')
      setDeleteConfirmInput('')
    }
  }, [department, open, currentHeadId, employees])

  const handleAddDesignation = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newDesignationInput.trim()
    if (!trimmed) return
    if (designationsList.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Designation already exists')
      return
    }
    setDesignationsList([...designationsList, trimmed])
    setNewDesignationInput('')
    toast.success(`Added designation: ${trimmed}`)
  }

  const handleDeleteDesignation = (desigToDelete: string) => {
    setDesignationsList(designationsList.filter(d => d !== desigToDelete))
    toast.info(`Removed designation: ${desigToDelete}`)
  }

  const handleDeleteDepartment = async () => {
    if (deleteConfirmInput.trim() !== department.department_name.trim()) {
      toast.error('Department name does not match confirmation input')
      return
    }
    
    setIsDeletingDept(true)
    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', department.id)

      if (error) throw error

      toast.success('Department deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      onOpenChange(false)
      window.location.href = '/departments'
    } catch (err: any) {
      console.error('Error deleting department:', err)
      toast.error(`Failed to delete department: ${err.message || 'Unknown error'}`)
    } finally {
      setIsDeletingDept(false)
    }
  }

  const selectedHead = employees.find(emp => emp.id === formData.head_id)

  const handleSearch = (query: string) => {
    if (!query.trim()) return
    setIsSearching(true)
    setTimeout(() => {
      const found = employees.find(
        emp => (emp.email || '').toLowerCase().trim() === query.toLowerCase().trim()
      )
      if (found) {
        setFormData({ ...formData, head_id: found.id })
        setSearchInput('')
      } else {
        toast.error('Employee not found in this department.')
      }
      setIsSearching(false)
    }, 400)
  }

  const handleSaveSettings = async () => {
    setLoading(true)

    try {
      let finalHeadId = formData.head_id;
      
      if (searchInput.trim() && !selectedHead) {
        const found = employees.find(
          emp => (emp.email || '').toLowerCase().trim() === searchInput.toLowerCase().trim()
        )
        if (found) {
          finalHeadId = found.id;
        }
      }

      const existingConfig = department.delegation_config || {}
      const updatedConfig = {
        ...existingConfig,
      }

      const { error: deptError } = await supabase
        .from('departments')
        .update({
          start_time: useCustomTimings ? (formData.start_time || null) : null,
          end_time: useCustomTimings ? (formData.end_time || null) : null,
          delegation_config: updatedConfig,
          designations: designationsList,
        })
        .eq('id', department.id)

      if (deptError) {
        console.error('deptError:', deptError)
        toast.error(`Settings update failed: ${deptError.message || 'Unknown error'}`)
      }

      if (finalHeadId !== currentHeadId) {
        if (currentHeadId) {
          await supabase.from('employees').update({ app_role: 'Employee' }).eq('id', currentHeadId)
        }
        if (finalHeadId) {
          await supabase.from('employees').update({ app_role: 'Admin' }).eq('id', finalHeadId)
        }
      }

      queryClient.invalidateQueries({ queryKey: ['department', department.id] })
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['department-employees', department.id] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      
      toast.success('Settings updated successfully')
      setActivePopup('none')
    } catch (error: any) {
      console.error('Unexpected error updating settings:', error)
      toast.error(`Unexpected error: ${error?.message || 'Check console'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Main Redirect Cards Dialog */}
      <Dialog open={open && activePopup === 'none'} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[560px] bg-white p-6 rounded-[24px]">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl font-semibold text-[#161616]">Advanced Settings</DialogTitle>
            <p className="type-body text-[#737373] mt-1">Select a setting to configure for {department?.department_name}</p>
          </DialogHeader>

          <div className="flex flex-col gap-3.5 my-2">
            {/* Department Leadership Card */}
            <div 
              onClick={() => setActivePopup('leadership')}
              className="p-4 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-[18px] flex items-center justify-between cursor-pointer transition-all group shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-[#161616] group-hover:border-black transition-colors">
                  <Icon icon="hugeicons:user-star-01" className="w-5 h-5 text-[#161616]" />
                </div>
                <div className="flex flex-col">
                  <h4 className="type-body-medium font-semibold text-[#161616]">Department Leadership</h4>
                  <p className="type-small text-[#737373]">
                    Head: <span className="font-medium text-[#161616]">{selectedHead?.name || 'Not assigned'}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[#737373] group-hover:text-black transition-colors">
                <span className="type-small font-medium">Configure</span>
                <Icon icon="hugeicons:arrow-right-01" className="w-4 h-4" />
              </div>
            </div>

            {/* Working Hours Card */}
            <div 
              onClick={() => setActivePopup('hours')}
              className="p-4 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-[18px] flex items-center justify-between cursor-pointer transition-all group shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-[#161616] group-hover:border-black transition-colors">
                  <Icon icon="hugeicons:clock-03" className="w-5 h-5 text-[#161616]" />
                </div>
                <div className="flex flex-col">
                  <h4 className="type-body-medium font-semibold text-[#161616]">Working Hours</h4>
                  <p className="type-small text-[#737373]">
                    {useCustomTimings ? `Custom: ${formData.start_time || '12:00 AM'} - ${formData.end_time || '12:00 AM'}` : 'Default Standard Schedule'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[#737373] group-hover:text-black transition-colors">
                <span className="type-small font-medium">Configure</span>
                <Icon icon="hugeicons:arrow-right-01" className="w-4 h-4" />
              </div>
            </div>

            {/* Manage Designations Card */}
            <div 
              onClick={() => setActivePopup('designations')}
              className="p-4 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-[18px] flex items-center justify-between cursor-pointer transition-all group shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-[#161616] group-hover:border-black transition-colors">
                  <Icon icon="hugeicons:briefcase-02" className="w-5 h-5 text-[#161616]" />
                </div>
                <div className="flex flex-col">
                  <h4 className="type-body-medium font-semibold text-[#161616]">Department Designations</h4>
                  <p className="type-small text-[#737373]">
                    {designationsList.length} Designation{designationsList.length === 1 ? '' : 's'} defined
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[#737373] group-hover:text-black transition-colors">
                <span className="type-small font-medium">Configure</span>
                <Icon icon="hugeicons:arrow-right-01" className="w-4 h-4" />
              </div>
            </div>

            {/* Danger Zone: Delete Department */}
            <div className="bg-[#FEF2F2] p-4 rounded-[18px] border border-[#FEE2E2] flex items-center justify-between mt-2">
              <div className="flex flex-col gap-0.5">
                <h4 className="type-body-medium font-semibold text-[#991B1B] flex items-center gap-1.5">
                  <Icon icon="hugeicons:delete-02" className="w-4 h-4 text-[#DC2626]" />
                  Delete Department
                </h4>
                <p className="type-small text-[#7F1D1D]">Permanently remove this department</p>
              </div>
              <button
                type="button"
                onClick={() => setActivePopup('delete')}
                className="px-3.5 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white type-small font-medium rounded-full transition-colors shrink-0"
              >
                Delete
              </button>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-6 py-2 type-body-medium text-[#161616] hover:bg-[#F4F4F5] rounded-full transition-colors w-full"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 1. Department Leadership Sub-Modal */}
      <Dialog open={activePopup === 'leadership'} onOpenChange={(o) => !o && setActivePopup('none')}>
        <DialogContent className="sm:max-w-[500px] bg-white p-6 rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#161616]">Department Leadership</DialogTitle>
            <p className="type-small text-[#737373]">Assign an employee as head of {department?.department_name}</p>
          </DialogHeader>

          <div className="flex flex-col gap-4 my-3">
            <label className="type-small font-medium text-[#161616]">Assign Department Head</label>
            {!selectedHead ? (
              <div className="relative w-full">
                <input 
                  type="text" 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSearch(searchInput)
                    }
                  }}
                  placeholder="Type email and press Enter"
                  className="w-full px-4 h-11 bg-white border border-[#E5E7EB] rounded-xl type-body text-[#161616] focus:outline-none focus:border-black transition-colors"
                />
                <button 
                  type="button"
                  onClick={() => handleSearch(searchInput)}
                  disabled={isSearching}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#737373] hover:text-black transition-colors"
                >
                  {isSearching ? <Icon icon="hugeicons:loading-01" className="w-4 h-4 animate-spin" /> : <Icon icon="hugeicons:search-01" className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-3 h-12 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl w-full">
                <img src={getAvatarUrl(selectedHead.name, selectedHead.avatar_url)} alt={selectedHead.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-white shadow-sm" />
                <span className="type-body-medium text-[#161616] truncate font-medium">{selectedHead.name}</span>
                <button 
                  type="button" 
                  onClick={() => setFormData({ ...formData, head_id: '' })} 
                  className="ml-auto text-[#A3A3A3] hover:text-[#161616] p-1 transition-colors bg-white rounded-full shadow-sm"
                >
                  <Icon icon="hugeicons:cancel-01" className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="type-small text-[#737373]">
              Assigning a department head updates their role to Admin.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setActivePopup('none')}
              className="px-5 py-2 type-small font-medium text-[#737373] hover:bg-[#F4F4F5] rounded-full transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSaveSettings}
              className="px-6 py-2 type-small font-medium text-white bg-black hover:bg-neutral-800 rounded-full transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Working Hours Sub-Modal */}
      <Dialog open={activePopup === 'hours'} onOpenChange={(o) => !o && setActivePopup('none')}>
        <DialogContent className="sm:max-w-[500px] bg-white p-6 rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#161616]">Working Hours</DialogTitle>
            <p className="type-small text-[#737373]">Configure schedule for {department?.department_name}</p>
          </DialogHeader>

          <div className="flex flex-col gap-4 my-3">
            <div className="flex items-center justify-between p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl">
              <span className="type-small font-medium text-[#161616]">Use Custom Timings</span>
              <label className="relative flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={useCustomTimings}
                  onChange={(e) => setUseCustomTimings(e.target.checked)}
                />
                <div className={`block w-11 h-6 rounded-full transition-colors duration-300 ${useCustomTimings ? 'bg-black' : 'bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${useCustomTimings ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </label>
            </div>

            {useCustomTimings && (
              <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="type-small font-medium text-[#161616]">Start Time</label>
                  <TimeInput12Hour 
                    value={formData.start_time} 
                    onChange={(val) => setFormData({ ...formData, start_time: val })} 
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="type-small font-medium text-[#161616]">End Time</label>
                  <TimeInput12Hour 
                    value={formData.end_time} 
                    onChange={(val) => setFormData({ ...formData, end_time: val })} 
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setActivePopup('none')}
              className="px-5 py-2 type-small font-medium text-[#737373] hover:bg-[#F4F4F5] rounded-full transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSaveSettings}
              className="px-6 py-2 type-small font-medium text-white bg-black hover:bg-neutral-800 rounded-full transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Schedule'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Manage Designations Sub-Modal */}
      <Dialog open={activePopup === 'designations'} onOpenChange={(o) => !o && setActivePopup('none')}>
        <DialogContent className="sm:max-w-[520px] bg-white p-6 rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#161616]">Department Designations</DialogTitle>
            <p className="type-small text-[#737373]">Add or remove designations for {department?.department_name}</p>
          </DialogHeader>

          <div className="flex flex-col gap-4 my-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newDesignationInput}
                onChange={(e) => setNewDesignationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddDesignation()
                  }
                }}
                placeholder="Type new designation (e.g. UX Researcher)..."
                className="flex-1 px-3.5 h-11 bg-white border border-[#E5E7EB] rounded-xl type-body text-[#161616] focus:outline-none focus:border-black transition-colors"
              />
              <button
                type="button"
                onClick={() => handleAddDesignation()}
                className="px-4 h-11 bg-black hover:bg-neutral-800 text-white rounded-xl type-small font-medium transition-colors shrink-0"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto p-1 border border-[#F3F4F6] rounded-xl bg-[#F9FAFB]">
              {designationsList.length === 0 ? (
                <span className="type-small text-[#737373] italic p-2">No designations defined.</span>
              ) : (
                designationsList.map((desig, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-full type-small font-medium text-[#161616] shadow-2xs"
                  >
                    {desig}
                    <button
                      type="button"
                      onClick={() => handleDeleteDesignation(desig)}
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[#8E8E93] hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Icon icon="hugeicons:cancel-01" className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setActivePopup('none')}
              className="px-5 py-2 type-small font-medium text-[#737373] hover:bg-[#F4F4F5] rounded-full transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSaveSettings}
              className="px-6 py-2 type-small font-medium text-white bg-black hover:bg-neutral-800 rounded-full transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Designations'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Delete Department Caution Modal (Requires Manual Input) */}
      <Dialog open={activePopup === 'delete'} onOpenChange={(o) => !o && setActivePopup('none')}>
        <DialogContent className="sm:max-w-[480px] bg-white p-6 rounded-[24px]">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-[#FEF2F2] border border-[#FEE2E2] flex items-center justify-center mb-2 text-[#DC2626]">
              <Icon icon="hugeicons:alert-02" className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-semibold text-[#991B1B]">Caution: Delete Department</DialogTitle>
            <p className="type-small text-[#7F1D1D] mt-1">
              This action will permanently delete <span className="font-semibold">{department?.department_name}</span>. This cannot be undone.
            </p>
          </DialogHeader>

          <div className="flex flex-col gap-3 my-3">
            <label className="type-small font-medium text-[#161616]">
              To confirm deletion, please type <span className="font-bold underline">{department?.department_name}</span> below:
            </label>
            <input 
              type="text"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              placeholder={`Type "${department?.department_name}" to confirm`}
              className="w-full px-4 h-11 bg-white border border-[#E5E7EB] rounded-xl type-body text-[#161616] focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          <DialogFooter className="gap-2 mt-2">
            <button
              type="button"
              onClick={() => setActivePopup('none')}
              className="px-5 py-2 type-small font-medium text-[#737373] hover:bg-[#F4F4F5] rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeletingDept || deleteConfirmInput.trim() !== department?.department_name?.trim()}
              onClick={handleDeleteDepartment}
              className="px-6 py-2 type-small font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isDeletingDept ? 'Deleting...' : 'Confirm & Delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

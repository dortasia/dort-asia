"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { getAvatarUrl } from '@/lib/utils'

interface ChangeReporteeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: any
}

export function ChangeReporteeDialog({ open, onOpenChange, employee }: ChangeReporteeDialogProps) {
  const [formData, setFormData] = useState({
    attendance_approver: '',
    leave_approver: '',
    claim_approver: ''
  })
  
  const [searchInputs, setSearchInputs] = useState({
    attendance_approver: '',
    leave_approver: '',
    claim_approver: ''
  })
  const [isSearching, setIsSearching] = useState({
    attendance_approver: false,
    leave_approver: false,
    claim_approver: false
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch all potential approvers (all employees)
  const { data: allEmployees = [], isLoading: isLoadingApprovers } = useQuery({
    queryKey: ['all-employees-approvers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, app_role, email, avatar_url, departments!fk_employees_department (id, department_name)')
        .order('name', { ascending: true })
      
      if (error) throw error
      return data || []
    },
    enabled: open
  })

  useEffect(() => {
    if (open && employee) {
      setFormData({
        attendance_approver: '',
        leave_approver: '',
        claim_approver: ''
      })
      setSearchInputs({
        attendance_approver: '',
        leave_approver: '',
        claim_approver: ''
      })
    }
  }, [open, employee])

  const handleSearch = (field: keyof typeof formData, query: string) => {
    if (!query) return
    setIsSearching(prev => ({ ...prev, [field]: true }))
    
    setTimeout(() => {
      const found = allEmployees.find(
        emp => emp.email?.toLowerCase() === query.toLowerCase()
      )
      
      if (found) {
        setFormData(prev => ({ ...prev, [field]: found.id }))
        setSearchInputs(prev => ({ ...prev, [field]: '' }))
      } else {
        toast.error('Employee not found with that email.')
      }
      setIsSearching(prev => ({ ...prev, [field]: false }))
    }, 400)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employee) return

    setIsSubmitting(true)
    try {
      // TODO: Connect this to the actual database schema for employee-specific reportees/approvers
      await new Promise(r => setTimeout(r, 800))
      
      toast.success('Reportees updated successfully')
      toast.info('Note: DB save logic needs wiring to exact schema.')
      
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error updating reportee:', error)
      toast.error(error.message || 'Failed to update reportee')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!employee) return null

  const renderSelect = (label: string, field: keyof typeof formData) => {
    const selectedId = formData[field]
    const selectedEmp = selectedId ? allEmployees.find(e => e.id === selectedId) : null
    
    return (
      <div className="flex flex-col gap-2 relative">
        <label className="type-small font-medium text-[#161616]">{label}</label>
        
        {!selectedEmp ? (
          <div className="relative w-full">
            <input 
              type="text" 
              value={searchInputs[field]}
              onChange={(e) => setSearchInputs({ ...searchInputs, [field]: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSearch(field, searchInputs[field])
                }
              }}
              placeholder="Type email and enter"
              className="w-full px-4 h-11 bg-white border border-[#E5E7EB] rounded-lg type-small text-[#161616] focus:outline-none focus:border-black transition-colors"
            />
            <button 
              type="button"
              onClick={() => handleSearch(field, searchInputs[field])}
              disabled={isSearching[field]}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#737373] hover:text-black transition-colors"
            >
              {isSearching[field] ? (
                <Icon icon="hugeicons:loading-01" className="w-4 h-4 animate-spin" />
              ) : (
                <Icon icon="hugeicons:search-01" className="w-4 h-4" />
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3 h-11 bg-gray-50 border border-[#E5E7EB] rounded-lg w-full">
            <img src={getAvatarUrl(selectedEmp.name, selectedEmp.avatar_url)} alt={selectedEmp.name} className="w-7 h-7 rounded-full object-cover shrink-0 border border-white shadow-sm" />
            <span className="type-small font-medium text-[#161616] truncate">{selectedEmp.name}</span>
            <button 
              type="button" 
              onClick={() => setFormData({ ...formData, [field]: '' })} 
              className="ml-auto text-[#A3A3A3] hover:text-[#161616] p-1 transition-colors bg-white rounded-full shadow-sm"
            >
              <Icon icon="hugeicons:cancel-01" className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white p-6 rounded-[24px]">
        <DialogHeader className="mb-4">
          <DialogTitle className="type-h2 text-[#161616]">Change Reportee</DialogTitle>
          <p className="type-small text-[#737373] mt-1">Set custom approvers for this employee's requests.</p>
        </DialogHeader>

        {/* Employee Info Preview */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-[12px] border border-[#E5E7EB] mb-6">
          <img 
            src={getAvatarUrl(employee.name, employee.avatar_url)} 
            alt={employee.name}
            className="w-10 h-10 rounded-full border border-white shadow-sm object-cover"
          />
          <div className="flex flex-col">
            <span className="type-body-medium text-[#161616] leading-none mb-1">{employee.name}</span>
            <span className="type-small text-[#737373] leading-none">{employee.app_role || 'Employee'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {renderSelect('Attendance Approver', 'attendance_approver')}
          {renderSelect('Leave Approver', 'leave_approver')}
          {renderSelect('Claim Approver', 'claim_approver')}

          <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-5 py-2.5 type-small font-medium text-[#161616] bg-white border border-[#E5E7EB] rounded-full hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 type-small font-medium text-white bg-black rounded-full hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Icon icon="hugeicons:loading-01" className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

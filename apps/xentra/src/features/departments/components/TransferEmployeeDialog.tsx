"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { getAvatarUrl } from '@/lib/utils'

interface TransferEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: any
}

export function TransferEmployeeDialog({ open, onOpenChange, employee }: TransferEmployeeDialogProps) {
  const queryClient = useQueryClient()
  const [selectedDeptId, setSelectedDeptId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch all departments
  const { data: departments = [], isLoading: isLoadingDepts } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('department_name', { ascending: true })
      
      if (error) throw error
      return data || []
    },
    enabled: open
  })

  useEffect(() => {
    if (open && employee) {
      setSelectedDeptId(employee.department_id || '')
    }
  }, [open, employee])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employee || !selectedDeptId) return

    if (selectedDeptId === employee.department_id) {
      onOpenChange(false)
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('employees')
        .update({ department_id: selectedDeptId })
        .eq('id', employee.id)

      if (error) throw error

      toast.success('Employee transferred successfully')
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['department-employees'] })
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error transferring employee:', error)
      toast.error(error.message || 'Failed to transfer employee')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!employee) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-white p-6 rounded-[24px]">
        <DialogHeader className="mb-4">
          <DialogTitle className="type-h2 text-[#161616]">Transfer Employee</DialogTitle>
          <p className="type-small text-[#737373] mt-1">Move this employee to a different department.</p>
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
            <span className="type-small text-[#737373] leading-none">{employee.designation || 'No Designation'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 relative">
            <label className="type-small font-medium text-[#161616]">Select New Department</label>
            <div className="relative w-full">
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                disabled={isLoadingDepts}
                className="w-full px-4 h-11 bg-white border border-[#E5E7EB] rounded-lg type-small text-[#161616] focus:outline-none focus:border-black transition-colors appearance-none disabled:opacity-50"
                required
              >
                <option value="" disabled hidden>Select department...</option>
                {departments.map((dept: any) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.department_name} {dept.id === employee.department_id ? '(Current)' : ''}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#737373]">
                {isLoadingDepts ? (
                  <Icon icon="hugeicons:loading-01" className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon icon="hugeicons:arrow-down-01" className="w-4 h-4" />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-5 py-2.5 type-small font-medium text-[#161616] bg-white border border-[#E5E7EB] rounded-full hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedDeptId === employee.department_id}
              className="px-5 py-2.5 type-small font-medium text-white bg-black rounded-full hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Icon icon="hugeicons:loading-01" className="w-4 h-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                'Transfer Employee'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

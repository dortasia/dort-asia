"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { getAvatarUrl } from '@/lib/utils'

interface ChangeDesignationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: any
}

export function ChangeDesignationDialog({ open, onOpenChange, employee }: ChangeDesignationDialogProps) {
  const queryClient = useQueryClient()
  const [designation, setDesignation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open && employee) {
      setDesignation(employee.designation || '')
    }
  }, [open, employee])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employee) return

    if (designation === (employee.designation || '')) {
      onOpenChange(false)
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('employees')
        .update({ designation: designation || null })
        .eq('id', employee.id)

      if (error) throw error

      toast.success('Designation updated successfully')
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['department-employees'] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error updating designation:', error)
      toast.error(error.message || 'Failed to update designation')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!employee) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-white p-6 rounded-[24px]">
        <DialogHeader className="mb-4">
          <DialogTitle className="type-h2 text-[#161616]">Change Designation</DialogTitle>
          <p className="type-small text-[#737373] mt-1">Update the job title for this employee.</p>
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="type-small font-medium text-[#161616]">New Designation</label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Senior Developer, UI Designer..."
              className="w-full px-4 h-11 bg-white border border-[#E5E7EB] rounded-lg type-small text-[#161616] focus:outline-none focus:border-black transition-colors"
              required
            />
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
              disabled={isSubmitting || designation === (employee.designation || '')}
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

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
import FormDatePicker from '@/components/ui/FormDatePicker'

interface EditDepartmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: {
    id: string
    department_name: string
    description?: string
    created_date?: string
    created_at?: string
  }
}

export function EditDepartmentDialog({ open, onOpenChange, department }: EditDepartmentDialogProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    department_name: '',
    description: '',
    created_date: '',
  })

  useEffect(() => {
    if (department && open) {
      const dateRaw = department.created_date || department.created_at
      let dateString = ''
      if (dateRaw) {
        try {
          dateString = new Date(dateRaw).toISOString().split('T')[0]
        } catch(e) {}
      }
      setFormData({
        department_name: department.department_name || '',
        description: department.description || '',
        created_date: dateString,
      })
    }
  }, [department, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.department_name.trim()) return

    setLoading(true)
    try {
      // 1. Update department
      const { error: deptError } = await supabase
        .from('departments')
        .update({
          department_name: formData.department_name.trim(),
          description: formData.description.trim() || null,
          created_date: formData.created_date ? new Date(formData.created_date).toISOString() : undefined,
        })
        .eq('id', department.id)

      queryClient.invalidateQueries({ queryKey: ['department', department.id] })
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating department:', error)
      alert('Failed to update department')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-[24px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#161616]">Edit Department</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <label className="type-small font-medium text-[#161616]">Department Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.department_name}
              onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-[12px] type-body text-[#161616] focus:outline-none focus:border-[#C8DF52] focus:ring-1 focus:ring-[#C8DF52] transition-all"
              required
            />
          </div>

          <div className="flex flex-col gap-2 relative z-50">
            <label className="type-small font-medium text-[#161616]">Created Date</label>
            <FormDatePicker
              value={formData.created_date}
              onChange={(date) => setFormData({ ...formData, created_date: date })}
              placeholder="Select created date"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="type-small font-medium text-[#161616]">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-[12px] type-body text-[#161616] focus:outline-none focus:border-[#C8DF52] focus:ring-1 focus:ring-[#C8DF52] transition-all min-h-[80px] resize-y"
              placeholder="Brief description of the department..."
            />
          </div>



          <DialogFooter className="mt-2 gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-5 py-2 type-body-medium text-[#161616] hover:bg-[#F4F4F5] rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.department_name.trim()}
              className="px-5 py-2 type-body-medium text-white bg-black hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

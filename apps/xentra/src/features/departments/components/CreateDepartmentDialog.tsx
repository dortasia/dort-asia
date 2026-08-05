"use client"

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import FormDatePicker from '@/components/ui/FormDatePicker'

interface CreateDepartmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateDepartmentDialog({ open, onOpenChange }: CreateDepartmentDialogProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    department_name: '',
    description: '',
    created_date: new Date().toISOString().split('T')[0],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.department_name.trim()) return

    setLoading(true)
    try {
      const fallbackThemes = [
        { bg: '#FBE0CD', accent: '#F9863E' },
        { bg: '#D1F2E0', accent: '#00C978' },
        { bg: '#E3D6F5', accent: '#00C978' },
      ]
      const randomTheme = fallbackThemes[Math.floor(Math.random() * fallbackThemes.length)]

      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      if (!user) {
        throw new Error("No authenticated user found")
      }

      // Fetch the company_id for the current user
      const { data: company, error: companyErr } = await supabase
        .from('companies')
        .select('id')
        .eq('super_admin_id', user.id)
        .single()

      if (companyErr || !company) {
        throw new Error("Could not find company for user")
      }
      
      const { error: deptError } = await supabase
        .from('departments')
        .insert({
          department_name: formData.department_name.trim(),
          description: formData.description.trim() || null,
          created_date: formData.created_date ? new Date(formData.created_date).toISOString() : undefined,
          theme_bg: randomTheme.bg,
          theme_accent: randomTheme.accent,
          company_id: company.id,
        })

      if (deptError) throw deptError

      queryClient.invalidateQueries({ queryKey: ['departments'] })
      
      onOpenChange(false)
      setFormData({
        department_name: '',
        description: '',
        created_date: new Date().toISOString().split('T')[0],
      })
    } catch (error) {
      console.error('Error creating department:', error)
      alert('Failed to create department')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-[24px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#161616]">Create Department</DialogTitle>
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
              placeholder="e.g. Human Resources"
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
              {loading ? 'Creating...' : 'Create Department'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

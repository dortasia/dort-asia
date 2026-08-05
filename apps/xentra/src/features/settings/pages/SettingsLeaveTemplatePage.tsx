"use client"

import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface LeaveType {
  id: string
  name: string
  maxDays: number
  unit: 'month' | 'year'
  isDefault?: boolean
}

export function SettingsLeaveTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const templateId = params.id as string

  const { data: templateData, isLoading } = useQuery({
    queryKey: ['leave_policy', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_policies')
        .select('*')
        .eq('id', templateId)
        .single()
        
      if (error) {
        if (error.code === 'PGRST116') {
          router.push('/settings/leave')
        }
        throw error
      }
      
      if (data) {
        let config = data.leave_configuration
        if (!Array.isArray(config)) {
          config = []
        }
        
        // If empty, auto-seed default leave types
        if (config.length === 0) {
          const defaultTypes: LeaveType[] = [
            { id: (Math.random() * 1000).toFixed(0), name: 'Sick Leave', maxDays: 2, unit: 'month', isDefault: true },
            { id: (Math.random() * 1000).toFixed(0), name: 'Personal Leave', maxDays: 1, unit: 'month', isDefault: true },
            { id: (Math.random() * 1000).toFixed(0), name: 'Medical Leave', maxDays: 3, unit: 'month', isDefault: true },
            { id: (Math.random() * 1000).toFixed(0), name: 'Annual Leave', maxDays: 14, unit: 'year', isDefault: true },
            { id: (Math.random() * 1000).toFixed(0), name: 'Maternity/Paternity Leave', maxDays: 30, unit: 'year', isDefault: true },
          ]
          
          const { error: updateError } = await supabase
            .from('leave_policies')
            .update({ leave_configuration: defaultTypes })
            .eq('id', templateId)
            
          if (updateError) throw updateError
          
          return {
            ...data,
            leave_configuration: defaultTypes
          }
        }
      }
      return data
    },
    enabled: !!templateId,
  })

  const templateName = templateData?.template_name || 'Loading...'
  const leaveTypes: LeaveType[] = templateData?.leave_configuration || []

  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: LeaveType[]) => {
      const { error } = await supabase
        .from('leave_policies')
        .update({ leave_configuration: newConfig })
        .eq('id', templateId)

      if (error) throw error
      return newConfig
    },
    onSuccess: (newConfig) => {
      queryClient.setQueryData(['leave_policy', templateId], (old: any) => {
        if (!old) return old
        return {
          ...old,
          leave_configuration: newConfig
        }
      })
    }
  })

  const [deleteTypeId, setDeleteTypeId] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  
  const typeToDelete = leaveTypes.find(t => t.id === deleteTypeId)
  const isDeleting = updateConfigMutation.isPending && !!deleteTypeId
  const canDelete = typeToDelete?.name === deleteConfirmText && !isDeleting

  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false)
  const [editingType, setEditingType] = useState<LeaveType | null>(null)
  const [typeName, setTypeName] = useState('')
  const [maxDays, setMaxDays] = useState<number | string>(1)
  const [unit, setUnit] = useState<'month' | 'year'>('month')
  
  const isSaving = updateConfigMutation.isPending && !deleteTypeId

  const handleOpenAdd = () => {
    setEditingType(null)
    setTypeName('')
    setMaxDays(1)
    setUnit('month')
    setIsAddTypeOpen(true)
  }

  const handleOpenEdit = (type: LeaveType) => {
    setEditingType(type)
    setTypeName(type.name)
    setMaxDays(type.maxDays)
    setUnit(type.unit)
    setIsAddTypeOpen(true)
  }

  const handleSaveType = () => {
    const maxLimit = unit === 'month' ? 31 : 365
    const validatedDays = Math.min(maxLimit, Math.max(1, Number(maxDays) || 1))
    if (!typeName.trim()) return

    let newLeaveTypes = [...leaveTypes]
    if (editingType) {
      newLeaveTypes = newLeaveTypes.map(t => t.id === editingType.id ? {
        ...t,
        name: typeName.trim(),
        maxDays: validatedDays,
        unit
      } : t)
    } else {
      if (leaveTypes.length >= 20) return
      const newId = (Math.random() * 1000).toFixed(0)
      newLeaveTypes.push({ 
        id: newId, 
        name: typeName.trim(),
        maxDays: validatedDays,
        unit,
        isDefault: false
      })
    }

    updateConfigMutation.mutate(newLeaveTypes, {
      onSuccess: () => {
        setIsAddTypeOpen(false)
        setEditingType(null)
        setTypeName('')
        setMaxDays(1)
        setUnit('month')
      }
    })
  }

  const handleRemoveType = (id: string) => {
    const newLeaveTypes = leaveTypes.filter(t => t.id !== id)
    updateConfigMutation.mutate(newLeaveTypes, {
      onSuccess: () => {
        setDeleteTypeId(null)
        setDeleteConfirmText('')
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-[800px] h-[50vh] items-center justify-center">
        <Icon icon="hugeicons:loading-03" className="w-8 h-8 animate-spin text-[#8B8B8B]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-[800px]">
      <div>
        <div className="flex items-center gap-2 type-small text-[#737373] mb-4">
          <Link href="/settings/employees" className="hover:text-[#161616] transition-colors flex items-center gap-1">
            <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
            Employee Settings
          </Link>
          <span>/</span>
          <Link href="/settings/leave" className="hover:text-[#161616] transition-colors">
            Leave Management
          </Link>
          <span>/</span>
          <span className="text-[#161616]">{templateName}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="type-h2 text-[#161616]">{templateName} Leave Types</h2>
            <p className="type-small text-[#737373] mt-1">Manage the available leave types and allocations for this template.</p>
          </div>
          <button 
            onClick={handleOpenAdd}
            disabled={leaveTypes.length >= 20}
            className={`flex items-center gap-2 type-body-medium font-semibold px-4 py-2 rounded-full transition-colors ${
              leaveTypes.length >= 20 
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' 
                : 'bg-black text-white hover:bg-neutral-800 cursor-pointer'
            }`}
          >
            <Icon icon="hugeicons:plus-sign" className="w-4 h-4" />
            Add Leave Type
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-[#E5E7EB] flex flex-col">
        {leaveTypes.map((leaveType, index) => (
          <div 
            key={leaveType.id} 
            className={`p-6 flex items-center justify-between border-b border-[#E5E7EB] hover:bg-gray-50 transition-colors ${
              index === 0 ? 'rounded-t-[24px]' : ''
            } ${
              index === leaveTypes.length - 1 ? 'border-b-0 rounded-b-[24px]' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center shrink-0 text-[#161616]">
                <Icon icon="hugeicons:file-02" className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="type-body-medium text-[#161616]">{leaveType.name}</span>
                <span className="type-small text-[#737373]">
                  {leaveType.maxDays} {leaveType.maxDays === 1 ? 'day' : 'days'} / {leaveType.unit}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleOpenEdit(leaveType)}
                className="p-2 text-[#8B8B8B] hover:text-[#161616] hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
                title="Edit Leave Type"
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-5 h-5" />
              </button>
              {!leaveType.isDefault && (
                <button 
                  onClick={() => {
                    setDeleteTypeId(leaveType.id)
                    setDeleteConfirmText('')
                  }}
                  className="p-2 text-[#8B8B8B] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                  title="Delete Leave Type"
                >
                  <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
        {leaveTypes.length === 0 && (
          <div className="p-8 text-center text-[#737373] type-body">
            No leave types available. Add one to get started.
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between px-2">
        <span className="type-small text-[#8B8B8B]">{leaveTypes.length} / 20 Leave Types used</span>
      </div>

      <Dialog open={!!deleteTypeId} onOpenChange={(open) => {
        if (!open && !isDeleting) {
          setDeleteTypeId(null)
          setDeleteConfirmText('')
        }
      }}>
        <DialogContent className="bg-white sm:rounded-[24px] border border-[#E5E7EB] p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="type-h2 text-[#161616]">Delete Leave Type</DialogTitle>
            <DialogDescription className="type-small text-[#737373] mt-1">
              This action cannot be undone. This will permanently delete the <strong className="text-[#161616]">{typeToDelete?.name}</strong> leave type.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="block type-small text-[#161616] mb-2 font-medium">
              Please type <strong>{typeToDelete?.name}</strong> to confirm.
            </label>
            <input 
              type="text" 
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              disabled={isDeleting}
              className="w-full px-3 py-2 border border-[#ECECEC] rounded-lg focus:outline-none focus:ring-2 focus:ring-black type-body text-[#161616] bg-white placeholder:text-[#8B8B8B] disabled:opacity-50"
              placeholder={typeToDelete?.name}
            />
          </div>

          <DialogFooter>
            <button 
              type="button"
              disabled={isDeleting}
              onClick={() => {
                setDeleteTypeId(null)
                setDeleteConfirmText('')
              }}
              className="px-4 py-2 type-body-medium rounded-full bg-neutral-100 text-[#161616] hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="button"
              disabled={!canDelete}
              onClick={() => {
                if (deleteTypeId && canDelete) {
                  handleRemoveType(deleteTypeId)
                }
              }}
              className={`px-4 py-2 type-body-medium rounded-full transition-colors flex items-center justify-center min-w-[155px] ${
                canDelete
                  ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer' 
                  : 'bg-red-200 text-white cursor-not-allowed'
              }`}
            >
              {isDeleting ? (
                <Icon icon="hugeicons:loading-03" className="w-5 h-5 animate-spin" />
              ) : (
                'Delete Leave Type'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddTypeOpen} onOpenChange={(open) => {
        if (!open && !isSaving) {
          setIsAddTypeOpen(false)
          setEditingType(null)
          setTypeName('')
          setMaxDays(1)
          setUnit('month')
        }
      }}>
        <DialogContent className="bg-white sm:rounded-[24px] border border-[#E5E7EB] p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="type-h2 text-[#161616]">
              {editingType ? 'Edit Leave Type' : 'Add New Leave Type'}
            </DialogTitle>
            <DialogDescription className="type-small text-[#737373] mt-1">
              {editingType ? 'Modify details for this leave type.' : 'Create a new leave type for this template. You can add up to 20 leave types.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 flex flex-col gap-4">
            <div>
              <label className="block type-small text-[#161616] mb-2 font-medium">
                Leave Type Name
              </label>
              <input 
                type="text" 
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-[#ECECEC] rounded-lg focus:outline-none focus:ring-2 focus:ring-black type-body text-[#161616] bg-white placeholder:text-[#8B8B8B] disabled:opacity-50"
                placeholder="e.g. Unpaid Leave"
                autoFocus
              />
            </div>
            <div>
              <label className="block type-small text-[#161616] mb-2 font-medium">
                Max Leave Days
              </label>
              <div className="grid grid-cols-[1fr_120px] gap-2">
                <input 
                  type="number"
                  min="1"
                  max={unit === 'month' ? 31 : 365}
                  value={maxDays}
                  disabled={isSaving}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '') {
                      setMaxDays('')
                      return
                    }
                    const num = parseInt(val, 10)
                    if (isNaN(num)) return
                    const maxAllowed = unit === 'month' ? 31 : 365
                    if (num > maxAllowed) {
                      setMaxDays(maxAllowed)
                    } else {
                      setMaxDays(num)
                    }
                  }}
                  className="w-full px-3 py-2 border border-[#ECECEC] rounded-lg focus:outline-none focus:ring-2 focus:ring-black type-body text-[#161616] bg-white placeholder:text-[#8B8B8B] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
                  placeholder="e.g. 2"
                />
                <select
                  value={unit}
                  disabled={isSaving}
                  onChange={(e) => {
                    const newUnit = e.target.value as 'month' | 'year'
                    setUnit(newUnit)
                    if (newUnit === 'month' && Number(maxDays) > 31) {
                      setMaxDays(31)
                    }
                  }}
                  className="px-3 py-2 border border-[#ECECEC] rounded-lg focus:outline-none focus:ring-2 focus:ring-black type-body text-[#161616] bg-white cursor-pointer disabled:opacity-50"
                >
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <button 
              type="button"
              disabled={isSaving}
              onClick={() => {
                setIsAddTypeOpen(false)
                setEditingType(null)
                setTypeName('')
                setMaxDays(1)
                setUnit('month')
              }}
              className="px-4 py-2 type-body-medium rounded-full bg-neutral-100 text-[#161616] hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="button"
              disabled={!typeName.trim() || !maxDays || Number(maxDays) <= 0 || isSaving}
              onClick={handleSaveType}
              className={`px-4 py-2 type-body-medium rounded-full transition-colors flex items-center justify-center min-w-[145px] ${
                typeName.trim() && maxDays && Number(maxDays) > 0 && !isSaving
                  ? 'bg-black text-white hover:bg-neutral-800 cursor-pointer' 
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <Icon icon="hugeicons:loading-03" className="w-5 h-5 animate-spin" />
              ) : editingType ? 'Save Changes' : 'Create Leave Type'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

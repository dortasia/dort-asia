"use client"

import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface LeavePolicy {
  id: string
  company_id: string
  template_name: string
  leave_configuration: any
}

const DEFAULT_TEMPLATES = ['Senior Level', 'Mid Level', 'Junior Level']

export function SettingsLeavePage() {
  const { company } = useCompanyStore()
  const queryClient = useQueryClient()

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['leave_policies', company?.id],
    queryFn: async () => {
      if (!company?.id) return []
      
      const { data, error } = await supabase
        .from('leave_policies')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      if (data && data.length === 0) {
        // Seed default templates
        const defaultsToInsert = DEFAULT_TEMPLATES.map(name => ({
          company_id: company.id,
          template_name: name,
          leave_configuration: []
        }))
        
        const { data: insertedData, error: insertError } = await supabase
          .from('leave_policies')
          .insert(defaultsToInsert)
          .select()
          
        if (insertError) throw insertError
        return insertedData || []
      }
      
      return data || []
    },
    enabled: !!company?.id,
  })

  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const templateToDelete = templates.find(t => t.id === deleteTemplateId)
  const canDelete = templateToDelete?.template_name === deleteConfirmText

  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')

  const addTemplateMutation = useMutation({
    mutationFn: async (templateName: string) => {
      if (!company?.id) throw new Error('No company ID')
      const { data, error } = await supabase
        .from('leave_policies')
        .insert([{
          company_id: company.id,
          template_name: templateName,
          leave_configuration: []
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (newData) => {
      queryClient.setQueryData(['leave_policies', company?.id], (old: LeavePolicy[] = []) => [...old, newData])
      setNewTemplateName('')
      setIsAddTemplateOpen(false)
    },
    onError: (error) => {
      console.error('Error adding template:', error)
    }
  })

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leave_policies')
        .delete()
        .eq('id', id)
        
      if (error) throw error
      return id
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(['leave_policies', company?.id], (old: LeavePolicy[] = []) => 
        old.filter(t => t.id !== deletedId)
      )
      setDeleteTemplateId(null)
      setDeleteConfirmText('')
    },
    onError: (error) => {
      console.error('Error deleting template:', error)
    }
  })

  const isAdding = addTemplateMutation.isPending
  const isDeleting = deleteTemplateMutation.isPending
  const canDeleteFinal = canDelete && !isDeleting

  const handleAddTemplate = () => {
    if (templates.length >= 10 || !newTemplateName.trim() || !company?.id) return
    addTemplateMutation.mutate(newTemplateName.trim())
  }

  const handleRemoveTemplate = (id: string) => {
    deleteTemplateMutation.mutate(id)
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
          <span className="text-[#161616]">Leave Management</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="type-h2 text-[#161616]">Leave Management</h2>
            <p className="type-small text-[#737373] mt-1">Manage leave policy templates.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href="/settings/leave/advanced"
              className="flex items-center gap-2 type-body-medium font-semibold px-4 py-2 rounded-full transition-colors bg-white border border-[#E5E7EB] text-[#161616] hover:bg-neutral-50 cursor-pointer"
            >
              <Icon icon="hugeicons:settings-02" className="w-4 h-4" />
              Advanced Settings
            </Link>
            <button 
              onClick={() => setIsAddTemplateOpen(true)}
              disabled={templates.length >= 10 || isLoading}
              className={`flex items-center gap-2 type-body-medium font-semibold px-4 py-2 rounded-full transition-colors ${
                templates.length >= 10 || isLoading
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-neutral-800 cursor-pointer'
              }`}
            >
              <Icon icon="hugeicons:plus-sign" className="w-4 h-4" />
              Add Template
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-[#E5E7EB] flex flex-col min-h-[200px]">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8 text-[#8B8B8B]">
            <Icon icon="hugeicons:loading-03" className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            {templates.map((template: LeavePolicy, index: number) => {
              const isDefault = DEFAULT_TEMPLATES.includes(template.template_name)
              
              return (
                <Link 
                  href={`/settings/leave/${template.id}`}
                  key={template.id} 
                  className={`p-6 flex items-center justify-between border-b border-[#E5E7EB] cursor-pointer hover:bg-gray-50 transition-colors ${
                    index === 0 ? 'rounded-t-[24px]' : ''
                  } ${
                    index === templates.length - 1 ? 'border-b-0 rounded-b-[24px]' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center shrink-0 text-[#161616]">
                      <Icon icon="hugeicons:folder-01" className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="type-body-medium text-[#161616]">{template.template_name}</span>
                      <span className="type-small text-[#737373]">
                        {isDefault ? 'Default leave policy configuration.' : 'Custom leave policy configuration.'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isDefault && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setDeleteTemplateId(template.id)
                          setDeleteConfirmText('')
                        }}
                        className="p-2 text-[#8B8B8B] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
                      </button>
                    )}
                    <Icon icon="hugeicons:arrow-right-01" className="w-5 h-5 text-[#8B8B8B]" />
                  </div>
                </Link>
              )
            })}
            {templates.length === 0 && (
              <div className="p-8 text-center text-[#737373] type-body">
                No templates available. Add one to get started.
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="flex items-center justify-between px-2">
        <span className="type-small text-[#8B8B8B]">{templates.length} / 10 Templates used</span>
      </div>

      <Dialog open={!!deleteTemplateId} onOpenChange={(open) => {
        if (!open && !isDeleting) {
          setDeleteTemplateId(null)
          setDeleteConfirmText('')
        }
      }}>
        <DialogContent className="bg-white sm:rounded-[24px] border border-[#E5E7EB] p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="type-h2 text-[#161616]">Delete Template</DialogTitle>
            <DialogDescription className="type-small text-[#737373] mt-1">
              This action cannot be undone. This will permanently delete the <strong className="text-[#161616]">{templateToDelete?.template_name}</strong> template.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="block type-small text-[#161616] mb-2 font-medium">
              Please type <strong>{templateToDelete?.template_name}</strong> to confirm.
            </label>
            <input 
              type="text" 
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              disabled={isDeleting}
              className="w-full px-3 py-2 border border-[#ECECEC] rounded-lg focus:outline-none focus:ring-2 focus:ring-black type-body text-[#161616] bg-white placeholder:text-[#8B8B8B] disabled:opacity-50"
              placeholder={templateToDelete?.template_name}
            />
          </div>

          <DialogFooter>
            <button 
              type="button"
              disabled={isDeleting}
              onClick={() => {
                setDeleteTemplateId(null)
                setDeleteConfirmText('')
              }}
              className="px-4 py-2 type-body-medium rounded-full bg-neutral-100 text-[#161616] hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="button"
              disabled={!canDeleteFinal}
              onClick={() => {
                if (deleteTemplateId && canDeleteFinal) {
                  handleRemoveTemplate(deleteTemplateId)
                }
              }}
              className={`px-4 py-2 type-body-medium rounded-full transition-colors flex items-center justify-center min-w-[140px] ${
                canDeleteFinal
                  ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer' 
                  : 'bg-red-200 text-white cursor-not-allowed'
              }`}
            >
              {isDeleting ? (
                <Icon icon="hugeicons:loading-03" className="w-5 h-5 animate-spin" />
              ) : (
                'Delete Template'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddTemplateOpen} onOpenChange={(open) => {
        if (!open && !isAdding) {
          setIsAddTemplateOpen(false)
          setNewTemplateName('')
        }
      }}>
        <DialogContent className="bg-white sm:rounded-[24px] border border-[#E5E7EB] p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="type-h2 text-[#161616]">Add New Template</DialogTitle>
            <DialogDescription className="type-small text-[#737373] mt-1">
              Create a new leave policy template. You can add up to 10 templates.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="block type-small text-[#161616] mb-2 font-medium">
              Template Name
            </label>
            <input 
              type="text" 
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              disabled={isAdding}
              className="w-full px-3 py-2 border border-[#ECECEC] rounded-lg focus:outline-none focus:ring-2 focus:ring-black type-body text-[#161616] bg-white placeholder:text-[#8B8B8B] disabled:opacity-50"
              placeholder="e.g. Executive Level"
              autoFocus
            />
          </div>

          <DialogFooter>
            <button 
              type="button"
              disabled={isAdding}
              onClick={() => {
                setIsAddTemplateOpen(false)
                setNewTemplateName('')
              }}
              className="px-4 py-2 type-body-medium rounded-full bg-neutral-100 text-[#161616] hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="button"
              disabled={!newTemplateName.trim() || isAdding}
              onClick={handleAddTemplate}
              className={`px-4 py-2 type-body-medium rounded-full transition-colors flex items-center justify-center min-w-[145px] ${
                newTemplateName.trim() && !isAdding
                  ? 'bg-black text-white hover:bg-neutral-800 cursor-pointer' 
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              {isAdding ? (
                <Icon icon="hugeicons:loading-03" className="w-5 h-5 animate-spin" />
              ) : (
                'Create Template'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

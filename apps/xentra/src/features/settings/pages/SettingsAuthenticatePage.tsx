'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCompanyStore } from '@/store/useCompanyStore'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const LS_KEY = 'xentra_authenticate_selected_employee'

export function SettingsAuthenticatePage() {
  const { company } = useCompanyStore()
  const [companyId, setCompanyId] = useState<string | null>(null)

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

  // 2. Fetch Employees
  const { data: employees = [], isLoading: isEmployeesLoading } = useQuery<any[]>({
    queryKey: ['employees', companyId],
    queryFn: async () => {
      if (!companyId) return []
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!companyId,
  })

  const [open, setOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LS_KEY) || ''
    }
    return ''
  })

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId)

  // Sync selectedEmployeeId to localStorage on change
  useEffect(() => {
    if (selectedEmployeeId) {
      localStorage.setItem(LS_KEY, selectedEmployeeId)
    } else {
      localStorage.removeItem(LS_KEY)
    }
  }, [selectedEmployeeId])

  // Credential States
  const [credStatus, setCredStatus] = useState<{ exists: boolean; lastSignIn?: string } | null>(null)
  const [isCredLoading, setIsCredLoading] = useState(false)
  const [credPassword, setCredPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [credSaving, setCredSaving] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [showLastPass, setShowLastPass] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [isEditingPassword, setIsEditingPassword] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [authenticatedEmails, setAuthenticatedEmails] = useState<string[]>([])
  const [isListLoading, setIsListLoading] = useState(false)

  // Fetch all authenticated users — called on mount and after each successful auth
  const fetchAuthUsers = async () => {
    setIsListLoading(true)
    try {
      const res = await fetch('/api/employee-credentials')
      if (res.ok) {
        const data = await res.json()
        if (data.users) {
          setAuthenticatedEmails(data.users.map((u: any) => u.email.toLowerCase()))
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsListLoading(false)
    }
  }

  useEffect(() => {
    fetchAuthUsers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync search input text when selected employee changes
  useEffect(() => {
    if (selectedEmployee) {
      setSearchInput(selectedEmployee.email)
    }
  }, [selectedEmployee])

  // Check cred status when employee selected
  useEffect(() => {
    if (!selectedEmployee) {
      setCredStatus(null)
      return
    }
    const checkCreds = async () => {
      setIsCredLoading(true)
      try {
        const res = await fetch('/api/employee-credentials?email=' + encodeURIComponent(selectedEmployee.email))
        const data = await res.json()
        if (res.ok) {
          setCredStatus(data)
          setIsEditingPassword(!data.exists) // If already authenticated, collapse to profile card. If first time, expand setup.
        } else {
          setCredStatus({ exists: false })
          setIsEditingPassword(true)
        }
        setCredPassword('')
        setConfirmPassword('')
      } catch (err) {
        console.error(err)
        setCredStatus({ exists: false })
        setIsEditingPassword(true)
      } finally {
        setIsCredLoading(false)
      }
    }
    checkCreds()
  }, [selectedEmployee])

  const handleCredAction = async (action: 'create' | 'reset_password') => {
    if (!selectedEmployee) return
    if (credPassword.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }
    if (credPassword !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }
    setCredSaving(true)
    try {
      const res = await fetch('/api/employee-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email: selectedEmployee.email, password: credPassword, employeeId: selectedEmployee.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update password')
      
      toast.success(
        action === 'create' 
          ? 'Credentials setup successfully.' 
          : 'Password updated successfully.'
      )

      // Update local state and custom_fields to reflect lastPassword
      if (selectedEmployee) {
        const updatedCF = { ...(selectedEmployee.custom_fields || {}) }
        delete updatedCF.lastPassword
        updatedCF.lastPassword = credPassword

        await supabase
          .from('employees')
          .update({ custom_fields: updatedCF })
          .eq('id', selectedEmployee.id)
      }

      setCredPassword('')
      setConfirmPassword('')
      setCredStatus(prev => ({ ...prev, exists: true } as any))

      // Refresh the authenticated employees list and return to list view
      await fetchAuthUsers()
      setSelectedEmployeeId('')
      setSearchInput('')

    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCredSaving(false)
    }
  }

  const avatarSrc = selectedEmployee?.avatar_url || selectedEmployee?.avatar || selectedEmployee?.profile_picture || selectedEmployee?.image_url;

  return (
    <div className="flex flex-col gap-6 max-w-[800px]">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 type-small text-[#737373] mb-4">
          <Link href="/settings/roles" className="hover:text-[#161616] transition-colors flex items-center gap-1">
            <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
            Roles & Access
          </Link>
          <span>/</span>
          <span className="text-[#161616]">Authenticate Employee</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="type-h2 text-[#161616]">Authenticate Employee</h2>
            <p className="type-small text-[#737373] mt-1">Search for an employee to manage their login access and securely assign or reset their password.</p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-[320px] shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8B8B8B]">
              <Icon icon="hugeicons:search-01" className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Type email and press Enter..."
              className="w-full pl-9 pr-4 h-10 rounded-full border border-[#E5E7EB] bg-white text-[#161616] text-sm focus:outline-none focus:ring-2 focus:ring-black/5 hover:bg-gray-50 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = searchInput.trim().toLowerCase();
                  if (!val) return;
                  const found = employees.find(emp => 
                    emp.email.toLowerCase() === val ||
                    emp.email.toLowerCase().includes(val) ||
                    emp.name.toLowerCase().includes(val)
                  );
                  if (found) {
                    setSelectedEmployeeId(found.id);
                    setSearchInput(found.email);
                  } else {
                    toast.error("No employee found with that email or name.");
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Selected Employee Credential Form */}
      {selectedEmployee && (
        <div className="bg-white rounded-[24px] border border-[#E5E7EB] flex flex-col">
          <div className="p-6 flex flex-col gap-5">
            {/* Header Row / Profile Card */}
            <div className={`flex items-center justify-between gap-4 ${isEditingPassword ? 'border-b border-[#E5E7EB] pb-5' : ''}`}>
              <div className="flex items-center gap-4">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={selectedEmployee.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#E5E7EB]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#F4F4F5] border border-[#E5E7EB] flex items-center justify-center shrink-0 text-[#161616] font-semibold text-lg">
                    {selectedEmployee.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="type-body-medium text-[#161616] font-semibold">{selectedEmployee.name}</span>
                  <span className="type-small text-[#737373]">{selectedEmployee.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isCredLoading ? (
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <Icon icon="hugeicons:loading-01" className="animate-spin w-4 h-4" />
                    Checking access...
                  </span>
                ) : credStatus?.exists ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    <Icon icon="hugeicons:checkmark-circle-01" className="w-4 h-4" />
                    Login Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                    <Icon icon="hugeicons:information-circle" className="w-4 h-4" />
                    Setup Required
                  </span>
                )}

                {/* Actions Menu (Three Dots) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 text-[#8B8B8B] hover:text-[#161616] hover:bg-gray-100 rounded-full transition-colors"
                    title="Actions"
                  >
                    <Icon icon="hugeicons:more-vertical" className="w-5 h-5" />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingPassword(true)
                            setIsMenuOpen(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                        >
                          <Icon icon="hugeicons:key-01" className="w-4 h-4 text-gray-500" />
                          {credStatus?.exists ? "Change Password" : "Setup Password"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedEmployee.email)
                            toast.success("Email copied to clipboard!")
                            setIsMenuOpen(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                        >
                          <Icon icon="hugeicons:copy-01" className="w-4 h-4 text-gray-500" />
                          Copy Email
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmployeeId('')
                            setSearchInput('')
                            setIsMenuOpen(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                        >
                          <Icon icon="hugeicons:cancel-01" className="w-4 h-4 text-gray-500" />
                          Close
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Password Management Form (Expanded View) */}
            {isEditingPassword && !isCredLoading && (
              <div className="flex flex-col gap-5 pt-1 animate-in fade-in duration-200">
                {/* Previous Password Reference */}
                {credStatus?.exists && selectedEmployee.custom_fields?.lastPassword && (
                  <div className="flex flex-col gap-1.5">
                    <label className="type-body-small font-medium text-[#161616]">Currently Assigned Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8B8B8B]">
                        <Icon icon="hugeicons:lock-key" className="w-5 h-5" />
                      </div>
                      <input
                        type={showLastPass ? "text" : "password"}
                        value={selectedEmployee.custom_fields.lastPassword}
                        readOnly
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#161616] placeholder:text-[#8B8B8B] focus:outline-none focus:ring-2 focus:ring-black/5"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLastPass(!showLastPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8B8B8B] hover:text-[#161616] transition-colors"
                      >
                        <Icon icon={showLastPass ? "hugeicons:view-off" : "hugeicons:view"} className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="type-caption text-[#8B8B8B]">This is the last password assigned by an admin. The employee may have changed it themselves.</p>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="type-body-small font-medium text-[#161616]">
                    {credStatus?.exists ? "New Password" : "Password"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8B8B8B]">
                      <Icon icon="hugeicons:lock-key" className="w-5 h-5" />
                    </div>
                    <input
                      type={showPass ? "text" : "password"}
                      value={credPassword}
                      onChange={(e) => setCredPassword(e.target.value)}
                      placeholder={credStatus?.exists ? "Enter new password..." : "Enter password..."}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#161616] placeholder:text-[#8B8B8B] focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8B8B8B] hover:text-[#161616] transition-colors"
                    >
                      <Icon icon={showPass ? "hugeicons:view-off" : "hugeicons:view"} className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="type-body-small font-medium text-[#161616]">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8B8B8B]">
                      <Icon icon="hugeicons:lock-key" className="w-5 h-5" />
                    </div>
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password..."
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#161616] placeholder:text-[#8B8B8B] focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8B8B8B] hover:text-[#161616] transition-colors"
                    >
                      <Icon icon={showConfirmPass ? "hugeicons:view-off" : "hugeicons:view"} className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="type-caption text-[#8B8B8B]">Must be at least 6 characters long and match the password above.</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEmployeeId('')
                      setSearchInput('')
                    }}
                    className="px-4 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleCredAction(credStatus?.exists ? 'reset_password' : 'create')}
                    disabled={credSaving || credPassword.length < 6 || confirmPassword.length < 6}
                    className={`flex items-center gap-2 type-body-medium font-semibold px-5 py-2.5 rounded-full transition-colors ${
                      credSaving || credPassword.length < 6 || confirmPassword.length < 6
                        ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-neutral-800 cursor-pointer'
                    }`}
                  >
                    {credSaving ? (
                      <>
                        <Icon icon="hugeicons:loading-01" className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Icon icon="hugeicons:shield-key" className="w-4 h-4" />
                        {credStatus?.exists ? "Update Password" : "Setup Password"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Authenticated Employees List — always visible */}
      <div className="bg-white rounded-[24px] border border-[#E5E7EB] flex flex-col">
        <div className="p-6 flex flex-col h-full">
          <h3 className="type-body-large text-[#161616] font-semibold mb-5">Authenticated Employees</h3>
          {isListLoading || isEmployeesLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-10 justify-center">
              <Icon icon="hugeicons:loading-01" className="animate-spin w-5 h-5" />
              Loading users...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {employees.filter(emp => authenticatedEmails.includes(emp.email.toLowerCase())).length > 0 ? (
                employees.filter(emp => authenticatedEmails.includes(emp.email.toLowerCase())).map(emp => {
                  const empAvatar = emp.avatar_url || emp.avatar || emp.profile_picture || emp.image_url;
                  const isSelected = emp.id === selectedEmployeeId;
                  return (
                    <div 
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmployeeId(emp.id)
                        setSearchInput(emp.email)
                      }}
                      className={`flex items-center justify-between p-4 rounded-[16px] border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-black/30 bg-gray-50 ring-1 ring-black/10' 
                          : 'border-[#E5E7EB] hover:border-black/20 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {empAvatar ? (
                          <img src={empAvatar} alt={emp.name} className="w-10 h-10 rounded-xl object-cover border border-[#E5E7EB] shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] border border-[#E5E7EB] flex items-center justify-center text-[#161616] font-semibold shrink-0">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col overflow-hidden">
                          <span className="type-body-small text-[#161616] font-semibold truncate">{emp.name}</span>
                          <span className="type-caption text-[#737373] truncate">{emp.email}</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold shrink-0">
                        <Icon icon="hugeicons:checkmark-circle-01" className="w-3 h-3" />
                        Active
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-[#8B8B8B]">
                  <div className="w-12 h-12 rounded-2xl bg-[#F4F4F5] flex items-center justify-center shrink-0 text-[#161616] mb-3">
                    <Icon icon="hugeicons:user-id" className="w-6 h-6 text-[#8B8B8B]" />
                  </div>
                  <p className="type-body-medium font-medium text-[#161616]">No authenticated employees</p>
                  <p className="type-small text-[#737373] mt-1 max-w-sm">Type an employee&apos;s email in the search bar above to create a login for them.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

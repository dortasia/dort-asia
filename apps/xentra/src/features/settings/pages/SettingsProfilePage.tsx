import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/useAuthStore'
import { getAvatarUrl } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function SettingsProfilePage() {
  const { user, setUser } = useAuthStore()
  const queryClient = useQueryClient()
  const [phone, setPhone] = useState(user?.phone || '')
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [designation, setDesignation] = useState(user?.designation || '')

  const { data: profileData } = useQuery({
    queryKey: ['employee_profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const empOrConditions = [`user_id.eq.${user!.id}`]
      if (user!.email) empOrConditions.push(`email.eq.${user!.email}`)
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .or(empOrConditions.join(','))
        .maybeSingle()
        
      if (error) throw error
      return data
    }
  })

  const { data: isSuperAdmin } = useQuery({
    queryKey: ['is_super_admin', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const compOrConditions = [`super_admin_id.eq.${user!.id}`]
      if (user!.email) compOrConditions.push(`login_email.eq.${user!.email}`)
      
      const { data, error } = await supabase
        .from('companies')
        .select('id')
        .or(compOrConditions.join(','))
        .limit(1)
        .maybeSingle()
        
      if (error && error.code !== 'PGRST116') {
        console.error("isSuperAdmin check error:", error)
      }
      return !!data
    }
  })

  const computedRole = isSuperAdmin ? 'Super Admin' : (profileData?.role || user?.role || 'Employee')

  useEffect(() => {
    if (profileData) {
      setFullName(profileData.name || '')
      setDesignation(profileData.designation || '')
      setPhone(profileData.phone_number || '')
      setUser({ ...user!, fullName: profileData.name || '', designation: profileData.designation || '', phone: profileData.phone_number || '' })
    }
  }, [profileData])

  useEffect(() => {
    if (!user?.id) return
    const channel = supabase.channel('employee_profile_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
        queryClient.invalidateQueries({ queryKey: ['employee_profile', user.id] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])

  const { mutate: handleSave, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated')
      const empOrConditions = [`user_id.eq.${user.id}`]
      if (user.email) empOrConditions.push(`email.eq.${user.email}`)
      const compOrConditions = [`super_admin_id.eq.${user.id}`]
      if (user.email) compOrConditions.push(`login_email.eq.${user.email}`)

      const [empRes, compRes] = await Promise.all([
        supabase.from('employees')
          .update({ name: fullName, designation, phone_number: phone })
          .or(empOrConditions.join(',')),
        supabase.from('companies')
          .update({ super_admin_name: fullName, super_admin_designation: designation, phone_number: phone })
          .or(compOrConditions.join(','))
      ])
      
      if (empRes.error) throw empRes.error
      if (compRes.error) throw compRes.error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee_profile', user?.id] })
      setUser({ ...user!, fullName, designation, phone })
      toast.success('Profile changes saved successfully')
    },
    onError: () => {
      toast.error('Failed to save changes')
    }
  })

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digits
    const raw = e.target.value.replace(/\D/g, '')
    // Auto space: 4 digits + space + 4 digits (max 8 digits)
    if (raw.length <= 4) {
      setPhone(raw)
    } else {
      setPhone(raw.slice(0, 4) + ' ' + raw.slice(4, 8))
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-[800px]">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[28px] font-medium text-[#111827] tracking-tight font-sans">Personal Details</h2>
          <p className="type-body text-[#737373] mt-1">Your personal credentials and contact details in the organization.</p>
        </div>
        <button 
          onClick={() => handleSave()}
          disabled={isSaving}
          className={`flex items-center gap-2 ${isSaving ? 'bg-neutral-400 cursor-not-allowed' : 'bg-black hover:bg-neutral-800 cursor-pointer'} text-white type-body-medium font-semibold px-6 py-2.5 rounded-full transition-colors shrink-0`}
        >
          {isSaving && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          <span>{isSaving ? 'Saving...' : 'Save changes'}</span>
        </button>
      </div>

      {/* Profile Photo Card */}
      <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 border border-[#E5E7EB] shrink-0">
            <img 
              src={getAvatarUrl(user?.fullName, user?.avatarUrl)} 
              alt={user?.fullName || "Avatar"} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="type-body-medium text-[#161616] uppercase">{user?.fullName || 'User'}</span>
            <span className="type-small text-[#737373] capitalize">{user?.designation || computedRole}</span>
          </div>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-[#F4F4F5] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-[12px] type-small font-medium text-[#737373] transition-colors cursor-pointer">
          <Icon icon="hugeicons:camera-02" className="w-4 h-4 text-[#737373]" />
          <span>Change photo</span>
        </button>
      </div>

      {/* Personal Details Card */}
      <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-8 flex flex-col">
        <div className="flex flex-col gap-6">
          
          {/* Name Row */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-2">
              <label className="type-small font-semibold text-[#161616]">Full Name</label>
              <div className="relative h-[48px]">
                <Icon icon="hugeicons:user" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B8B8B]" />
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-full bg-white border border-[#E5E7EB] rounded-[16px] pl-11 pr-4 type-body text-[#161616] focus:outline-none focus:border-[#C8DF52] focus:ring-1 focus:ring-[#C8DF52] transition-all"
                />
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="type-small font-semibold text-[#161616]">Designation</label>
              <div className="relative h-[48px]">
                <Icon icon="hugeicons:briefcase-02" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B8B8B]" />
                <input 
                  type="text" 
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full h-full bg-white border border-[#E5E7EB] rounded-[16px] pl-11 pr-4 type-body text-[#161616] focus:outline-none focus:border-[#C8DF52] focus:ring-1 focus:ring-[#C8DF52] transition-all"
                />
              </div>
            </div>
          </div>

          {/* App Role */}
          <div className="flex flex-col gap-2">
            <label className="type-small font-semibold text-[#161616]">App Role</label>
            <div className="relative h-[48px]">
              <Icon icon="hugeicons:shield-01" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B8B8B]" />
              <input 
                type="text" 
                value={computedRole}
                disabled
                className="w-full h-full bg-white border border-[#E5E7EB] rounded-[16px] pl-11 pr-11 type-body text-[#737373] cursor-not-allowed"
              />
              <Icon icon="hugeicons:lock" className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
            </div>
            <p className="type-caption text-[#8B8B8B]">Your system permission role is fixed and cannot be changed.</p>
          </div>



          {/* Email Address */}
          <div className="flex flex-col gap-2">
            <label className="type-small font-semibold text-[#161616]">Email Address</label>
            <div className="relative flex items-center bg-white border border-[#E5E7EB] rounded-[16px] focus-within:border-[#C8DF52] focus-within:ring-1 focus-within:ring-[#C8DF52] transition-all h-[48px]">
              <Icon icon="hugeicons:mail-01" className="absolute left-4 w-5 h-5 text-[#8B8B8B]" />
              <input 
                type="email" 
                defaultValue={user?.email || "krishnaaa2005p@gmail.com"}
                className="w-full h-full bg-transparent pl-11 pr-[80px] type-body text-[#161616] focus:outline-none"
              />
              <button className="absolute right-2 flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F4F5] hover:bg-[#E5E7EB] rounded-[10px] type-caption font-semibold text-[#161616] transition-colors">
                <Icon icon="hugeicons:edit-02" className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
            <p className="type-caption text-[#8B8B8B]">Your email is your secure login credential.</p>
          </div>

          {/* Phone Number */}
          <div className="flex flex-col gap-2">
            <label className="type-small font-semibold text-[#161616]">Phone Number</label>
            <div className="flex items-center bg-white border border-[#E5E7EB] rounded-[16px] focus-within:border-[#C8DF52] focus-within:ring-1 focus-within:ring-[#C8DF52] transition-all overflow-hidden h-[48px]">
              {/* +65 Prefix Block */}
              <div className="flex items-center justify-center px-4 h-full bg-[#F9FAFB] border-r border-[#E5E7EB]">
                <span className="type-body font-medium text-[#737373]">+65</span>
              </div>
              <input 
                type="text" 
                value={phone}
                onChange={handlePhoneChange}
                placeholder="Enter Phone Number"
                className="w-full h-full bg-transparent px-4 type-body font-medium text-[#161616] focus:outline-none placeholder:text-[#8B8B8B]"
              />
            </div>
          </div>


        </div>
      </div>

    </div>
  )
}

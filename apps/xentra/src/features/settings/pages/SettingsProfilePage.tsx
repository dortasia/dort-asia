import React, { useState, useRef, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function SettingsProfilePage() {
  const { user, setUser } = useAuthStore()
  const queryClient = useQueryClient()
  const [phone, setPhone] = useState(user?.phone || '')
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [designation, setDesignation] = useState(user?.designation || '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [ssoAvatarUrl, setSsoAvatarUrl] = useState<string | null>(null)
  const [signInMethod, setSignInMethod] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // Fetch SSO avatar from live Supabase session
  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      const data = res.data
      if (data?.user) {
        const googleAvatar = data.user.user_metadata?.avatar_url ||
          data.user.user_metadata?.picture ||
          data.user.user_metadata?.avatar || null
        setSsoAvatarUrl(googleAvatar)
        // Detect sign-in provider
        const identities = data.user.identities || []
        const provider = identities[0]?.provider || 'email'
        setSignInMethod(provider)
      }
    })
  }, [])

  const { data: profileData } = useQuery({
    queryKey: ['employee_profile', user?.id],
    queryFn: async () => {
      let activeUser = user
      if (!activeUser) {
        const { data: authData } = await supabase.auth.getUser()
        if (authData?.user) {
          activeUser = {
            id: authData.user.id,
            email: authData.user.email || '',
            fullName: authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || '',
            avatarUrl: authData.user.user_metadata?.avatar_url || '',
            role: 'super_admin' as const,
            designation: '',
            phone: ''
          }
        }
      }

      let employee = null
      if (activeUser?.id || activeUser?.email) {
        const empOrConditions = []
        if (activeUser.id) empOrConditions.push(`user_id.eq.${activeUser.id}`)
        if (activeUser.email) empOrConditions.push(`email.eq.${activeUser.email}`)

        const { data: emp } = await supabase
          .from('employees')
          .select('*')
          .or(empOrConditions.join(','))
          .maybeSingle()
        employee = emp
      }

      if (!employee) {
        const { data: comp } = await supabase
          .from('companies')
          .select('*')
          .limit(1)
          .maybeSingle()
          
        if (comp) {
          employee = {
            name: comp.super_admin_name || activeUser?.fullName || 'USER',
            designation: comp.super_admin_designation || 'Super Admin',
            phone_number: comp.phone_number || '',
            email: comp.login_email || activeUser?.email || ''
          }
        }
      }

      return employee
    }
  })

  useEffect(() => {
    if (profileData) {
      setFullName(profileData.name || '')
      setDesignation(profileData.designation || '')
      setPhone(profileData.phone_number || '')
      if (user) {
        setUser({ ...user, fullName: profileData.name || user.fullName, designation: profileData.designation || user.designation, phone: profileData.phone_number || user.phone })
      }
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
      // Resolve active user — store may not be hydrated yet, fall back to live session
      let activeUserId = user?.id
      let activeUserEmail = user?.email
      if (!activeUserId) {
        const { data: authData } = await supabase.auth.getUser()
        activeUserId = authData?.user?.id
        activeUserEmail = authData?.user?.email
      }
      if (!activeUserId) throw new Error('Not authenticated')

      const empOrConditions = [`user_id.eq.${activeUserId}`]
      if (activeUserEmail) empOrConditions.push(`email.eq.${activeUserEmail}`)
      const compOrConditions = [`super_admin_id.eq.${activeUserId}`]
      if (activeUserEmail) compOrConditions.push(`login_email.eq.${activeUserEmail}`)

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
      if (user) setUser({ ...user, fullName, designation, phone })
      toast.success('Profile changes saved successfully')
    },
    onError: (err: any) => {
      console.error('Profile save error:', err)
      toast.error(err?.message || 'Failed to save changes')
    }
  })

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Resolve user ID from store or live session
    let activeUserId = user?.id
    let activeUserEmail = user?.email
    if (!activeUserId) {
      const { data: authData } = await supabase.auth.getUser()
      activeUserId = authData?.user?.id
      activeUserEmail = authData?.user?.email
    }
    if (!activeUserId) { toast.error('Not authenticated'); return }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setIsUploadingPhoto(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const filePath = `avatars/${activeUserId}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('employee-profiles')
        .upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage
        .from('employee-profiles')
        .getPublicUrl(filePath)
      const newAvatarUrl = urlData.publicUrl
      // Update employee record
      const empOrConditions = [`user_id.eq.${activeUserId}`]
      if (activeUserEmail) empOrConditions.push(`email.eq.${activeUserEmail}`)
      await supabase.from('employees')
        .update({ avatar_url: newAvatarUrl })
        .or(empOrConditions.join(','))
      if (user) setUser({ ...user, avatarUrl: newAvatarUrl })
      toast.success('Profile photo updated!')
    } catch (err: any) {
      console.error('Photo upload error:', err)
      toast.error('Failed to upload photo: ' + (err?.message || 'Unknown error'))
      setAvatarPreview(null)
      setAvatarFile(null)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

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
          <h2 className="type-h2 text-[#161616]">Personal Details</h2>
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
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 border border-[#E5E7EB] shrink-0 relative">
            <img 
              src={avatarPreview || user?.avatarUrl || ssoAvatarUrl || '/default-profile.svg'} 
              alt={user?.fullName || "Avatar"} 
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/default-profile.svg' }}
            />
            {isUploadingPhoto && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Icon icon="hugeicons:loading-03" className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="type-body-medium text-[#161616] uppercase">{fullName || user?.fullName || 'User'}</span>
            {signInMethod === 'google' ? (
              <div className="flex items-center gap-1 mt-0.5">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-[10px] text-[#9CA3AF] font-medium">Signed in with Google</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-0.5">
                <img src="/app_logos/DortAsiaOfflLogo.svg" alt="Dort Asia" className="w-3.5 h-3.5 object-contain" />
                <span className="text-[10px] text-[#9CA3AF] font-medium">Signed in with Dort Asia</span>
              </div>
            )}
          </div>
        </div>
        
        <input
          ref={photoInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={handlePhotoChange}
        />
        <button
          onClick={() => photoInputRef.current?.click()}
          disabled={isUploadingPhoto}
          className="flex items-center gap-2 px-4 py-2 bg-[#F4F4F5] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-[12px] type-small font-medium text-[#737373] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon="hugeicons:camera-02" className="w-4 h-4 text-[#737373]" />
          <span>{isUploadingPhoto ? 'Uploading...' : 'Change photo'}</span>
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
                value={user?.role || "Super Admin"}
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

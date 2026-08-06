import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const formatTimeInput = (val: string) => {
  let digits = val.replace(/\D/g, '').slice(0, 4)
  if (!digits) return ''
  if (digits.length === 1 && parseInt(digits[0], 10) > 1) digits = '0' + digits[0]
  if (digits.length >= 2) {
    const hh = parseInt(digits.slice(0, 2), 10)
    if (hh > 12) digits = '12' + digits.slice(2)
    if (hh === 0 && digits.length >= 2) digits = '12' + digits.slice(2)
  }
  if (digits.length >= 4) {
    const mm = parseInt(digits.slice(2, 4), 10)
    if (mm > 59) digits = digits.slice(0, 2) + '59'
  }
  if (digits.length > 2) return `${digits.slice(0, 2)} : ${digits.slice(2, 4)}`
  return digits
}

const convertTo24h = (time12h: string, ampm: string): string => {
  if (!time12h) return ""
  const [hStr, mStr] = time12h.split(':').map(s => s.trim())
  let h = parseInt(hStr, 10)
  const m = mStr || "00"
  if (ampm === 'PM' && h < 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  return `${h.toString().padStart(2, '0')}:${m}`
}

const parseFrom24h = (time24h: string): { time: string; ampm: string } => {
  if (!time24h) return { time: "", ampm: "AM" }
  const [hStr, mStr] = time24h.split(':').map(s => s.trim())
  let h = parseInt(hStr, 10)
  const m = mStr || "00"
  let ampm = "AM"
  if (h >= 12) {
    ampm = "PM"
    if (h > 12) h -= 12
  }
  if (h === 0) h = 12
  return { time: `${h.toString().padStart(2, '0')} : ${m}`, ampm }
}

const OnboardTimePicker = ({ 
  time, setTime, ampm, setAmPm, icon 
}: { 
  time: string, setTime: (val: string) => void, ampm: string, setAmPm: (val: string) => void, icon: string 
}) => {
  return (
    <div className="relative h-[48px]">
      <Icon icon={icon} className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B8B8B] z-10 pointer-events-none" />
      <input 
        type="text" 
        placeholder="HH : MM" 
        value={time} 
        onChange={(e) => setTime(formatTimeInput(e.target.value))} 
        className="w-full h-full bg-white border border-[#E5E7EB] rounded-[16px] pl-11 pr-[80px] type-body text-[#161616] focus:outline-none focus:border-[#C8DF52] focus:ring-1 focus:ring-[#C8DF52] transition-all placeholder:text-[#8B8B8B]" 
      />
      <div className="absolute right-1.5 top-1.5 bottom-1.5 !bg-[#F4F4F5] rounded-full p-[3px] flex items-center">
        <button onClick={() => setAmPm('AM')} className={`px-2.5 py-1 rounded-full type-small font-medium transition-all cursor-pointer ${ampm === 'AM' ? 'bg-white text-[#161616] shadow-sm' : 'text-[#737373] hover:text-[#161616]'}`}>AM</button>
        <button onClick={() => setAmPm('PM')} className={`px-2.5 py-1 rounded-full type-small font-medium transition-all cursor-pointer ${ampm === 'PM' ? 'bg-white text-[#161616] shadow-sm' : 'text-[#737373] hover:text-[#161616]'}`}>PM</button>
      </div>
    </div>
  )
}

export function SettingsCompanyPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Grab cached data synchronously to prevent UI flash
  const cachedData = queryClient.getQueryData<any>(['company_profile', user?.id])
  const cCompany = cachedData?.company
  const cSettings = cachedData?.settings

  const [companyId, setCompanyId] = useState<string | null>(cCompany?.id || null)
  const [companyName, setCompanyName] = useState(cCompany?.company_name || cCompany?.name || 'Xentra Systems Pte. Ltd.')
  const [address, setAddress] = useState(cSettings?.address || cCompany?.address || cCompany?.corporate_address || '')
  const [phone, setPhone] = useState(cSettings?.phone || cCompany?.phone_number || '')
  const [email, setEmail] = useState(cCompany?.login_email || cCompany?.email || '')
  
  const [branchLocation, setBranchLocation] = useState(cCompany?.branch_location || '')
  const [companyType, setCompanyType] = useState(cCompany?.company_type || '')
  const [website, setWebsite] = useState(cCompany?.website || '')
  const [sector, setSector] = useState(cCompany?.sector || '')

  let initShiftStart = { time: '', ampm: 'AM' }
  if (cSettings?.shift_start) initShiftStart = parseFrom24h(cSettings?.shift_start)
  
  let initShiftEnd = { time: '', ampm: 'PM' }
  if (cSettings?.shift_end) initShiftEnd = parseFrom24h(cSettings?.shift_end)

  const [shiftStartTime, setShiftStartTime] = useState(initShiftStart.time)
  const [shiftStartAmPm, setShiftStartAmPm] = useState(initShiftStart.ampm)
  const [shiftEndTime, setShiftEndTime] = useState(initShiftEnd.time)
  const [shiftEndAmPm, setShiftEndAmPm] = useState(initShiftEnd.ampm)

  let initWorkingDays = ''
  if (cSettings?.working_days) {
    initWorkingDays = Array.isArray(cSettings.working_days) ? cSettings.working_days.join(', ') : cSettings.working_days
  }
  const [workingDays, setWorkingDays] = useState(initWorkingDays)
  
  const [logoUrl, setLogoUrl] = useState<string | null>(cCompany?.logo_url || null)
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null)
  const [picFile, setPicFile] = useState<File | null>(null)
  
  const [picZoom, setPicZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isEditingPic, setIsEditingPic] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  const lastPos = useRef({ x: 0, y: 0 })
  const cropperRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const activeDays = Array.isArray(workingDays) 
    ? workingDays 
    : (typeof workingDays === 'string' && workingDays ? workingDays.split(',').map(d => d.trim()) : [])

  const toggleDay = (day: string) => {
    if (activeDays.includes(day)) {
      setWorkingDays(activeDays.filter(d => d !== day).join(', '))
    } else {
      const newDays = [...activeDays, day].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b))
      setWorkingDays(newDays.join(', '))
    }
  }

  // File pick
  const handlePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPicFile(file)
      setLogoUrl(URL.createObjectURL(file))
      setCroppedPreviewUrl(null)
      setPicZoom(1)
      setPan({ x: 0, y: 0 })
      setIsEditingPic(true)
    }
  }

  // Crop confirm
  const confirmCrop = () => {
    if (!logoUrl || !cropperRef.current) { setIsEditingPic(false); return }
    const size = cropperRef.current.offsetWidth
    const OUTPUT_SIZE = 512
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_SIZE; canvas.height = OUTPUT_SIZE
      const ctx = canvas.getContext('2d')!
      
      const imgScale = Math.min(size / img.naturalWidth, size / img.naturalHeight)
      const imgDrawW = img.naturalWidth * imgScale
      const imgDrawH = img.naturalHeight * imgScale
      const imgOffsetX = (size - imgDrawW) / 2
      const imgOffsetY = (size - imgDrawH) / 2

      const tx = (pan.x / 100) * size
      const ty = (pan.y / 100) * size
      const cx = size / 2; const cy = size / 2
      
      const contImgX = cx + (imgOffsetX + tx - cx) * picZoom
      const contImgY = cy + (imgOffsetY + ty - cy) * picZoom
      const ratio = OUTPUT_SIZE / size

      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight,
        contImgX * ratio, contImgY * ratio, imgDrawW * picZoom * ratio, imgDrawH * picZoom * ratio)

      canvas.toBlob((blob) => {
        if (blob) setCroppedPreviewUrl(URL.createObjectURL(blob))
        setIsEditingPic(false)
      }, 'image/jpeg', 0.92)
    }
    img.src = logoUrl
  }

  // Drag logic
  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    lastPos.current = { x: clientX, y: clientY }
  }

  const onDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !cropperRef.current) return
    const { width, height } = cropperRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const dx = clientX - lastPos.current.x
    const dy = clientY - lastPos.current.y
    setPan(prev => ({
      x: prev.x + ((dx / width) * 100) / picZoom,
      y: prev.y + ((dy / height) * 100) / picZoom
    }))
    lastPos.current = { x: clientX, y: clientY }
  }

  const stopDrag = () => setIsDragging(false)

  const { data: companyData } = useQuery({
    queryKey: ['company_profile', user?.id],
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

      let company = null
      if (activeUser?.id || activeUser?.email) {
        const compOrConditions = []
        if (activeUser.id) compOrConditions.push(`super_admin_id.eq.${activeUser.id}`)
        if (activeUser.email) compOrConditions.push(`login_email.eq.${activeUser.email}`)

        const { data: comp } = await supabase
          .from('companies')
          .select('*')
          .or(compOrConditions.join(','))
          .maybeSingle()
        company = comp
      }

      if (!company) {
        const { data: firstComp } = await supabase
          .from('companies')
          .select('*')
          .limit(1)
          .maybeSingle()
        company = firstComp
      }

      let settings = null
      if (company?.id) {
        const { data: s } = await supabase
          .from('company_settings')
          .select('*')
          .eq('company_id', company.id)
          .maybeSingle()
        settings = s
      }
      return { company, settings }
    }
  })

  useEffect(() => {
    if (companyData?.company) {
      const { company, settings } = companyData
      setCompanyId(company.id)
      if (company.company_name || company.name) setCompanyName(company.company_name || company.name)
      if (company.phone_number) setPhone(company.phone_number)
      if (company.login_email || company.email) setEmail(company.login_email || company.email)
      
      if (company.branch_location) setBranchLocation(company.branch_location)
      if (company.company_type) setCompanyType(company.company_type)
      if (company.website) setWebsite(company.website)
      if (company.sector) setSector(company.sector)
      if (company.logo_url) setLogoUrl(company.logo_url)

      if (settings) {
        if (settings.shift_start) {
          const { time, ampm } = parseFrom24h(settings.shift_start)
          setShiftStartTime(time)
          setShiftStartAmPm(ampm)
        }
        if (settings.shift_end) {
          const { time, ampm } = parseFrom24h(settings.shift_end)
          setShiftEndTime(time)
          setShiftEndAmPm(ampm)
        }
        if (settings.working_days) {
          setWorkingDays(Array.isArray(settings.working_days) ? settings.working_days.join(', ') : settings.working_days)
        }
      }
    }
  }, [companyData])

  useEffect(() => {
    if (!user?.id) return
    const channel = supabase.channel('company_settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => {
        queryClient.invalidateQueries({ queryKey: ['company_profile', user.id] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_settings' }, () => {
        queryClient.invalidateQueries({ queryKey: ['company_profile', user.id] })
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
      
      let finalLogoUrl = logoUrl
      
      if (croppedPreviewUrl || picFile) {
        let uploadBlob: Blob
        if (croppedPreviewUrl) {
          const res = await fetch(croppedPreviewUrl)
          uploadBlob = await res.blob()
        } else {
          uploadBlob = picFile!
        }
        const fileExt = picFile ? (picFile.name.split('.').pop() || 'jpg') : 'jpg'
        const filePath = `Company_Logo/${activeUserId}/${activeUserId}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('company-assets')
          .upload(filePath, uploadBlob, { upsert: true })

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('company-assets')
            .getPublicUrl(filePath)
          finalLogoUrl = publicUrlData.publicUrl
        } else {
          console.error('Logo upload error:', uploadError)
          toast.error('Failed to upload logo: ' + uploadError.message)
        }
      }

      const compOrConditions = [`super_admin_id.eq.${activeUserId}`]
      if (activeUserEmail) compOrConditions.push(`login_email.eq.${activeUserEmail}`)

      const { error: compError } = await supabase
        .from('companies')
        .update({
          company_name: companyName,
          phone_number: phone,
          login_email: email,
          branch_location: branchLocation,
          company_type: companyType,
          website: website,
          sector: sector,
          logo_url: finalLogoUrl
        })
        .or(compOrConditions.join(','))
        
      if (compError) throw compError

      if (companyId) {
        const { error: settingsError } = await supabase
          .from('company_settings')
          .upsert({
            company_id: companyId,
            shift_start: convertTo24h(shiftStartTime, shiftStartAmPm),
            shift_end: convertTo24h(shiftEndTime, shiftEndAmPm),
            working_days: activeDays
          }, { onConflict: 'company_id' })
          
        if (settingsError) throw settingsError
      }
      
      if (finalLogoUrl !== logoUrl) {
        setLogoUrl(finalLogoUrl)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_profile', user?.id] })
      useCompanyStore.getState().fetchCompany(user?.id || '', user?.email || undefined)
      toast.success('Company profile saved successfully')
    },
    onError: (error: any) => {
      console.error('Save error:', error)
      toast.error(error?.message || 'Failed to save company details')
    }
  })

  return (
    <div className="flex flex-col gap-6 max-w-[800px]">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="type-h2 text-[#161616]">Company Profile</h2>
          <p className="type-body text-[#737373] mt-1">Manage Singapore corporate identity and legal registrations.</p>
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

      {/* Company Logo Card */}
      <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-[16px] overflow-hidden shrink-0 flex items-center justify-center ${croppedPreviewUrl || logoUrl ? 'bg-white border border-[#E5E7EB]' : 'bg-blue-500/20'}`}>
            {croppedPreviewUrl || logoUrl ? (
              <img 
                src={croppedPreviewUrl || logoUrl || undefined} 
                alt="Company Logo" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="type-h1 text-blue-500">
                {(companyName || 'C').charAt(0)}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="type-body-medium text-[#161616] uppercase font-semibold">{companyName}</span>
            <span className="type-small text-[#737373]">{sector || 'Sector'}</span>
          </div>
        </div>
        
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePicUpload} />
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-[#F4F4F5] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-[12px] type-small font-medium text-[#737373] transition-colors cursor-pointer">
          <Icon icon="hugeicons:camera-02" className="w-4 h-4 text-[#737373]" />
          <span>Change logo</span>
        </button>
      </div>

      {/* Cropper Modal Overlay */}
      {isEditingPic && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-[400px] rounded-[24px] p-6 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="type-body-medium font-semibold text-[#161616]">Adjust Logo</h3>
              <button onClick={() => setIsEditingPic(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F4F4F5] hover:bg-[#E5E7EB] text-[#737373] transition-colors cursor-pointer">
                <Icon icon="hugeicons:cancel-01" className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div 
                ref={cropperRef}
                className="w-full aspect-square bg-[#F4F4F5] rounded-[16px] overflow-hidden relative cursor-move border border-[#E5E7EB]"
                onMouseDown={startDrag}
                onMouseMove={onDrag}
                onMouseUp={stopDrag}
                onMouseLeave={stopDrag}
                onTouchStart={startDrag}
                onTouchMove={onDrag}
                onTouchEnd={stopDrag}
              >
                {logoUrl && (
                  <img 
                    src={logoUrl} 
                    alt="Logo to crop" 
                    draggable={false}
                    className="absolute max-w-none origin-center"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      transform: `translate(${pan.x}%, ${pan.y}%) scale(${picZoom})`,
                      transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                  />
                )}
                
                {/* Crop guides */}
                <div className="absolute inset-0 pointer-events-none ring-[1000px] ring-black/50" />
                <div className="absolute inset-0 border-2 border-white/80 pointer-events-none rounded-[16px]" />
                <div className="absolute inset-x-1/3 top-0 bottom-0 border-x border-white/30 pointer-events-none" />
                <div className="absolute inset-y-1/3 left-0 right-0 border-y border-white/30 pointer-events-none" />
              </div>

              <div className="flex items-center gap-4 px-2">
                <Icon icon="hugeicons:image-01" className="w-4 h-4 text-[#8B8B8B]" />
                <input 
                  type="range" 
                  min="1" 
                  max="3" 
                  step="0.05" 
                  value={picZoom} 
                  onChange={(e) => setPicZoom(parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-[#E5E7EB] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <Icon icon="hugeicons:image-02" className="w-5 h-5 text-[#8B8B8B]" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setIsEditingPic(false)} className="flex-1 py-3 bg-[#F4F4F5] hover:bg-[#E5E7EB] rounded-[12px] type-body font-semibold text-[#161616] transition-colors cursor-pointer">Cancel</button>
              <button onClick={confirmCrop} className="flex-1 py-3 bg-black hover:bg-neutral-800 rounded-[12px] type-body font-semibold text-white transition-colors cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.15)]">Confirm</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Company Details Form Card */}
      <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-8 flex flex-col gap-8">
        
        <div className="flex flex-col gap-6">
          <h4 className="type-body-medium font-semibold text-[#161616] border-b border-[#E5E7EB] pb-2">General Information</h4>
          
          {/* Company Name & Sector Row */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-2">
              <label className="type-small font-semibold text-[#161616]">Company Name</label>
              <div className="relative h-[48px]">
                <Icon icon="hugeicons:building-03" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B8B8B]" />
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter Company Name"
                  className="w-full h-full bg-white border border-[#E5E7EB] rounded-[16px] pl-11 pr-4 type-body text-[#161616] focus:outline-none focus:border-[#C8DF52] focus:ring-1 focus:ring-[#C8DF52] transition-all placeholder:text-[#8B8B8B]"
                />
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="type-small font-semibold text-[#161616]">Sector</label>
              <div className="relative h-[48px]">
                <Icon icon="hugeicons:briefcase-02" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B8B8B]" />
                <input 
                  type="text" 
                  value={sector}
                  readOnly
                  disabled
                  placeholder="e.g. Technology, Healthcare"
                  className="w-full h-full bg-[#F4F4F5] border border-[#E5E7EB] rounded-[16px] pl-11 pr-4 type-body text-[#8B8B8B] cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Company Type & Website Row */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-2">
              <label className="type-small font-semibold text-[#161616]">Company Type</label>
              <div className="relative h-[48px]">
                <Icon icon="hugeicons:building-04" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B8B8B]" />
                <input 
                  type="text" 
                  value={companyType}
                  onChange={(e) => setCompanyType(e.target.value)}
                  placeholder="e.g. Private Limited"
                  className="w-full h-full bg-white border border-[#E5E7EB] rounded-[16px] pl-11 pr-4 type-body text-[#161616] focus:outline-none focus:border-[#C8DF52] focus:ring-1 focus:ring-[#C8DF52] transition-all placeholder:text-[#8B8B8B]"
                />
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="type-small font-semibold text-[#161616]">Website</label>
              <div className="relative h-[48px]">
                <Icon icon="hugeicons:global" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B8B8B]" />
                <input 
                  type="text" 
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full h-full bg-white border border-[#E5E7EB] rounded-[16px] pl-11 pr-4 type-body text-[#161616] focus:outline-none focus:border-[#C8DF52] focus:ring-1 focus:ring-[#C8DF52] transition-all placeholder:text-[#8B8B8B]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h4 className="type-body-medium font-semibold text-[#161616] border-b border-[#E5E7EB] pb-2">Contact & Location</h4>
          
          {/* Login Email & Phone Number Row */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-2">
              <label className="type-small font-semibold text-[#161616]">Company Contact Email</label>
              <div className="relative h-[48px]">
                <Icon icon="hugeicons:mail-01" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B8B8B]" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="company@domain.com"
                  className="w-full h-full bg-white border border-[#E5E7EB] rounded-[16px] pl-11 pr-4 type-body text-[#161616] focus:outline-none focus:border-[#C8DF52] focus:ring-1 focus:ring-[#C8DF52] transition-all placeholder:text-[#8B8B8B]"
                />
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="type-small font-semibold text-[#161616]">Company Phone Number</label>
              <div className="relative h-[48px]">
                <Icon icon="hugeicons:call" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B8B8B]" />
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter Phone Number"
                  className="w-full h-full bg-white border border-[#E5E7EB] rounded-[16px] pl-11 pr-4 type-body text-[#161616] focus:outline-none focus:border-[#C8DF52] focus:ring-1 focus:ring-[#C8DF52] transition-all placeholder:text-[#8B8B8B]"
                />
              </div>
            </div>
          </div>

          {/* Branch Location & Address */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-2">
              <label className="type-small font-semibold text-[#161616]">Branch Location</label>
              <div className="relative h-[48px]">
                <Icon icon="hugeicons:building-02" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B8B8B]" />
                <input 
                  type="text" 
                  value={branchLocation}
                  onChange={(e) => setBranchLocation(e.target.value)}
                  placeholder="e.g. Singapore HQ"
                  className="w-full h-full bg-white border border-[#E5E7EB] rounded-[16px] pl-11 pr-4 type-body text-[#161616] focus:outline-none focus:border-[#C8DF52] focus:ring-1 focus:ring-[#C8DF52] transition-all placeholder:text-[#8B8B8B]"
                />
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="type-small font-semibold text-[#161616]">Corporate Address</label>
              <div className="relative h-[48px]">
                <Icon icon="hugeicons:location-01" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B8B8B]" />
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Registered business address"
                  className="w-full h-full bg-white border border-[#E5E7EB] rounded-[16px] pl-11 pr-4 type-body text-[#161616] focus:outline-none focus:border-[#C8DF52] focus:ring-1 focus:ring-[#C8DF52] transition-all placeholder:text-[#8B8B8B]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h4 className="type-body-medium font-semibold text-[#161616] border-b border-[#E5E7EB] pb-2">Operations</h4>
          
          {/* Shifts */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-2">
              <label className="type-small font-semibold text-[#161616]">Shift Start</label>
              <OnboardTimePicker 
                time={shiftStartTime} 
                setTime={setShiftStartTime}
                ampm={shiftStartAmPm}
                setAmPm={setShiftStartAmPm}
                icon="hugeicons:time-02" 
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="type-small font-semibold text-[#161616]">Shift End</label>
              <OnboardTimePicker 
                time={shiftEndTime} 
                setTime={setShiftEndTime} 
                ampm={shiftEndAmPm}
                setAmPm={setShiftEndAmPm}
                icon="hugeicons:time-02" 
              />
            </div>
          </div>

          {/* Working Days */}
          <div className="flex flex-col gap-3">
            <label className="type-small font-semibold text-[#161616]">Working Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <button 
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-5 py-2.5 rounded-[12px] type-small font-semibold transition-colors cursor-pointer ${activeDays.includes(day) ? 'bg-[#C8DF52] text-[#161616] border border-[#C8DF52]' : 'bg-[#F4F4F5] text-[#737373] border border-transparent hover:bg-[#E5E7EB]'}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}

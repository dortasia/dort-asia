import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Icon } from '@iconify/react'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'
import { SYSTEM_ROLES } from '@/config/constants'
import { useQuery } from '@tanstack/react-query'
import MonthDatePicker from '@/components/ui/MonthDatePicker'
import DepartmentDropdown from '@/components/ui/DepartmentDropdown'
import { Search, SlidersHorizontal, X, Filter, RotateCcw, Check } from 'lucide-react'
import { cn, getAvatarUrl } from '@/lib/utils'
interface Department {
  id: string
  name: string
}

export function AttendancePage() {
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === SYSTEM_ROLES.SUPER_ADMIN
  
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTableTab, setActiveTableTab] = useState('Presented')
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Filter drawer state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [filters, setFilters] = useState<{
    types: string[]
    status: string[]
    sites: string[]
  }>({
    types: [],
    status: [],
    sites: []
  })

  const [draftFilters, setDraftFilters] = useState<{
    types: string[]
    status: string[]
    sites: string[]
  }>({
    types: [],
    status: [],
    sites: []
  })

  const [isStuck, setIsStuck] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!scrollRef.current || !sentinelRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(!entry.isIntersecting)
      },
      {
        root: scrollRef.current,
        rootMargin: "-76px 0px 0px 0px",
        threshold: 0
      }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [])

  // Reset to page 1 when tab, search, or rows per page change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTableTab, searchQuery, rowsPerPage])

  const tableTabs = [
    { id: 'Presented', label: 'Presented', icon: 'hugeicons:tick-double-02' },
    { id: 'Unclocked', label: 'Unclocked', icon: 'hugeicons:alert-02' },
    { id: 'Absentees', label: 'Absentees', icon: 'hugeicons:cancel-circle' },
    { id: 'Monthly log', label: 'Monthly log', icon: 'hugeicons:calendar-03' }
  ]

  const { data: departmentsData = [], isLoading: queryLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      console.log('Fetching departments...')
      const { data, error } = await supabase
        .from('departments')
        .select('id, department_name')
        .order('department_name')
      
      if (error) {
        console.error('Error fetching departments:', error)
        return []
      }
      return data || []
    },
    enabled: isSuperAdmin,
    staleTime: Infinity, // Permanent cache as per guidelines
  })

  const { data: rawData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance-and-employees', selectedDepartmentId, selectedDate, departmentsData],
    queryFn: async () => {
      if (!selectedDepartmentId) return null
      
      const dateToFetch = selectedDate || new Date().toISOString().split('T')[0]
      
      // Determine if selected department is Admin Department
      let isAdminDept = false
      const matchedDept = (departmentsData as any[]).find((d: any) => d.id === selectedDepartmentId)
      if (matchedDept) {
        isAdminDept = matchedDept.department_name === 'Admin Department'
      } else {
        const { data: deptInfo } = await supabase
          .from('departments')
          .select('department_name')
          .eq('id', selectedDepartmentId)
          .maybeSingle()
        if (deptInfo?.department_name === 'Admin Department') {
          isAdminDept = true
        }
      }

      let employeesData: any[] = []

      if (isAdminDept) {
        // Show admins in the Admin Department attendance ONLY
        const { data, error } = await supabase
          .from('employees')
          .select('id, name, email, avatar_url, designation, department_id, app_role')
          .or(`department_id.eq.${selectedDepartmentId},app_role.eq.Admin,app_role.eq.Super Admin`)
          
        if (error) {
          console.error('Error fetching admin department employees:', error)
          return { employees: [], attendance: [] }
        }
        employeesData = data || []
      } else {
        // Exclude admins from their operational/own department attendance
        const { data, error } = await supabase
          .from('employees')
          .select('id, name, email, avatar_url, designation, department_id, app_role')
          .eq('department_id', selectedDepartmentId)
          .neq('app_role', 'Admin')
          .neq('app_role', 'Super Admin')
          
        if (error) {
          console.error('Error fetching department employees:', error)
          return { employees: [], attendance: [] }
        }
        // Safety filter to exclude any employee with admin in role
        employeesData = (data || []).filter((e: any) => {
          const r = (e.app_role || e.designation || '').toLowerCase()
          return !r.includes('admin')
        })
      }
      
      const empIds = employeesData.map(e => e.id)
      
      // Fetch attendance for these employees for the selected date
      let attendanceData: any[] = []
      if (empIds.length > 0) {
        const { data: attData, error: attError } = await supabase
          .from('attendance')
          .select('*')
          .in('employee_id', empIds)
          .eq('date', dateToFetch)
          
        if (attError) {
          console.error('Error fetching attendance:', attError)
        } else {
          attendanceData = attData || []
        }
      }
      
      return { employees: employeesData, attendance: attendanceData }
    },
    enabled: !!selectedDepartmentId,
    staleTime: 1000 * 60, // Cache for 1 minute as per optimization guidelines (dynamic cache)
  })

  // Get current display name for regular admin
  let currentDepartmentName = 'Loading...'
  if (!queryLoading) {
    if (isSuperAdmin) {
      currentDepartmentName = (departmentsData as any[]).find((d: any) => d.id === selectedDepartmentId)?.department_name || 'Admin Department'
    } else {
      currentDepartmentName = user?.department || 'Your Department'
    }
  }

  const employees = rawData?.employees || []
  const attendanceRecords = rawData?.attendance || []

  // Calculate stats based on employees
  const stats = { present: 0, absent: 0, late: 0, unclocked: 0 }

  const mappedRecords = employees.map(emp => {
    // Find attendance record for this employee
    const record = attendanceRecords.find((r: any) => r.employee_id === emp.id)
    
    const safeStatus = (record?.status || 'unclocked').toLowerCase()
    const status = safeStatus

    if (status === 'present') stats.present++
    else if (status === 'absent') stats.absent++
    else if (status === 'late') stats.late++
    else stats.unclocked++

    let category = 'Unclocked'
    if (status === 'present' || status === 'late') category = 'Presented'
    else if (status === 'absent') category = 'Absentees'

    const finalAvatar = (emp.email === user?.email && user?.avatarUrl) ? user.avatarUrl : emp.avatar_url;

    return {
      id: emp.id, // Use employee ID as row key for uniqueness
      name: emp.name || 'Unknown',
      role: emp.designation || 'Employee',
      avatar: getAvatarUrl(emp.name || emp.id, finalAvatar),
      department: currentDepartmentName,
      site: record?.location || '-',
      type: record?.proof_url ? 'Geofencing' : 'Site Pass',
      clockIn: record?.clock_in || '-',
      clockOut: record?.clock_out || '-',
      breakTime: record?.hours ? '1h' : '-',
      hoursWorked: record?.hours || '-',
      status: status,
      category
    }
  })

  const availableTypes = ['Geofencing', 'Site Pass']
  const availableStatuses = [
    { id: 'present', label: 'Present' },
    { id: 'late', label: 'Late' },
    { id: 'absent', label: 'Absent' },
    { id: 'unclocked', label: 'Unclocked' }
  ]
  const availableSites = Array.from(new Set(mappedRecords.map(r => r.site).filter(s => s && s !== '-')))

  const filteredRecords = mappedRecords.filter(record => {
    const matchesCategory = activeTableTab === 'Monthly log' ? true : record.category === activeTableTab
    const matchesSearch = searchQuery === '' || 
                          record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          record.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          record.site.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = filters.types.length === 0 || filters.types.includes(record.type)
    const matchesStatus = filters.status.length === 0 || filters.status.includes(record.status)
    const matchesSite = filters.sites.length === 0 || filters.sites.includes(record.site)

    return matchesCategory && matchesSearch && matchesType && matchesStatus && matchesSite
  })

  const activeFilterCount = filters.types.length + filters.status.length + filters.sites.length

  const clearAllFilters = () => {
    setFilters({ types: [], status: [], sites: [] })
  }

  const removeAppliedFilter = (category: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].filter(v => v !== value)
    }))
  }

  const toggleTypeFilter = (type: string) => {
    setDraftFilters(prev => ({
      ...prev,
      types: prev.types.includes(type) ? prev.types.filter(t => t !== type) : [...prev.types, type]
    }))
  }

  const toggleStatusFilter = (status: string) => {
    setDraftFilters(prev => ({
      ...prev,
      status: prev.status.includes(status) ? prev.status.filter(s => s !== status) : [...prev.status, status]
    }))
  }

  const toggleSiteFilter = (site: string) => {
    setDraftFilters(prev => ({
      ...prev,
      sites: prev.sites.includes(site) ? prev.sites.filter(s => s !== site) : [...prev.sites, site]
    }))
  }

  const activeAvailableStatuses = availableStatuses.filter(s => {
    if (activeTableTab === 'Presented') return ['present', 'late'].includes(s.id)
    if (activeTableTab === 'Unclocked') return s.id === 'unclocked'
    if (activeTableTab === 'Absentees') return s.id === 'absent'
    return false
  })

  const showVerificationFilter = activeTableTab === 'Presented'
  const showSiteFilter = activeTableTab === 'Presented'
  const showFilterButton = activeTableTab !== 'Monthly log'
  
  const draftFilterCount = draftFilters.types.length + draftFilters.status.length + draftFilters.sites.length

  const totalRecords = filteredRecords.length
  const totalPages = Math.ceil(totalRecords / rowsPerPage) || 1
  const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, totalRecords)
  const currentRecords = filteredRecords.slice(startIndex, endIndex)

  const isLoading = isSuperAdmin ? queryLoading : false

  useEffect(() => {
    if (departmentsData.length > 0 && !selectedDepartmentId) {
      const adminDept = (departmentsData as any[]).find((d: any) => d.department_name?.toLowerCase().includes('admin'))
      if (adminDept) {
        setSelectedDepartmentId(adminDept.id)
      } else {
        setSelectedDepartmentId(departmentsData[0].id)
      }
    }
  }, [departmentsData, selectedDepartmentId])


  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-full overflow-hidden"
    >
      {/* Main Scrollable Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [ms-overflow-style:none]">
        
        {/* Sticky Glassy Header Row */}
        <div className="sticky top-0 z-50 flex justify-between items-center px-4 md:px-5 h-[76px] shrink-0 relative">
          
          {/* Soft Foggy Background Mask Layer */}
          <div 
            className="absolute top-0 left-0 right-0 h-[96px] z-[-1] bg-white/80 backdrop-blur-[12px] pointer-events-none"
            style={{ 
              WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', 
              maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' 
            }}
          />

          <div className="flex flex-col gap-0 relative z-10">
            <h1 className="type-h1 text-black">Attendance</h1>
            <p className="type-body text-[#737373]">your team attendance monitor</p>
          </div>
          {/* Xentra Logo */}
          <div className="flex items-center relative z-10">
            <img 
              src="/app_logos/xentra_black_logo_with_text.svg" 
              alt="xentra" 
              className="h-7 w-auto select-none"
            />
          </div>
        </div>

        {/* Department Summary Card Wrapper */}
        <div className="flex flex-col px-4 md:px-5 relative z-40">
          {/* Department Summary Card */}
          <div className="bg-[#F6F5F5] rounded-[24px] border border-[#E5E7EB] flex flex-col md:flex-row justify-between items-center p-4 md:p-6 mb-4 mt-2 gap-6 relative z-10 overflow-hidden">
            {/* Left Illustration - Reduced size by 20% */}
            <div className="flex-shrink-0 relative w-[160px] md:w-[256px] self-stretch -my-4 md:-my-6 -ml-4 md:-ml-6 pl-6 md:pl-10 pointer-events-none flex items-end">
              <img 
                src="/assets/attendance_va.svg" 
                alt="Attendance Illustration" 
                className="w-full h-full object-contain object-left-bottom scale-[0.88] origin-bottom-left"
              />
            </div>
            
            {/* Right Stats */}
            <div className="flex flex-col items-end gap-2 w-full md:w-auto relative z-20">
              <div className="flex flex-col items-end -translate-y-[15px] relative z-30">
                <p className="type-body text-[#737373]">Manage Your Department Attendance</p>
                
                {isSuperAdmin ? (
                  <DepartmentDropdown
                    departments={departmentsData}
                    selectedId={selectedDepartmentId}
                    onSelect={(id) => setSelectedDepartmentId(id)}
                    isLoading={isLoading}
                  />
                ) : (
                  <h2 className="type-h2 text-black mt-1">{currentDepartmentName}</h2>
                )}
              </div>
              
              <div className="bg-[#C8DF52] rounded-[14px] px-6 py-3 w-full md:w-auto flex items-center justify-between md:justify-start gap-5 md:gap-8 scale-[1.15] md:scale-[1.3] transform-gpu origin-right translate-y-[10px] relative z-10 border border-[#b5c94a]">
                <div className="type-caption text-black flex items-center gap-1.5">
                  <Icon icon="hugeicons:tick-double-02" className="w-[18px] h-[18px]" />
                  Present : <span className="type-small font-semibold">{stats.present}</span>
                </div>
                <div className="type-caption text-black flex items-center gap-1.5">
                  <Icon icon="hugeicons:cancel-circle" className="w-[18px] h-[18px]" />
                  Absent : <span className="type-small font-semibold">{stats.absent}</span>
                </div>
                <div className="type-caption text-black flex items-center gap-1.5">
                  <Icon icon="hugeicons:time-02" className="w-[18px] h-[18px]" />
                  Late : <span className="type-small font-semibold">{stats.late}</span>
                </div>
                <div className="type-caption text-black flex items-center gap-1.5">
                  <Icon icon="hugeicons:alert-02" className="w-[18px] h-[18px]" />
                  Unclocked : <span className="type-small font-semibold">{stats.unclocked}</span>
                </div>
              </div>
            </div>
          </div> {/* End of Department Summary Card */}
        </div> {/* End of Dept Card Wrapper */}

        {/* Sentinel for sticky detection */}
        <div ref={sentinelRef} className="h-[1px] w-full invisible -mt-[1px]" />

        {/* Sticky Top Container (Toolbar + Table Top) */}
        <div className="sticky top-[76px] z-30 bg-white flex flex-col pt-1 px-4 md:px-5">
          {/* White block to cover the foggy header gap when stuck */}
          <div 
            className={cn(
              "absolute bottom-full left-0 right-0 h-[77px] bg-white pointer-events-none",
              isStuck ? "opacity-100" : "opacity-0"
            )}
          />
          
          {/* Toolbar (Outside Table) */}
          <div className="flex flex-col gap-3 mb-3">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <MonthDatePicker selectedDate={selectedDate} onChange={setSelectedDate} />
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-auto md:min-w-[260px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Employees"
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-full type-small text-black placeholder:text-gray-400 focus:outline-none focus:border-[#C8DF52] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)] h-[42px]"
                  />
                </div>
                {showFilterButton && (
                  <button 
                    onClick={() => {
                      setDraftFilters(filters)
                      setIsFilterPanelOpen(true)
                    }}
                    className={cn(
                      "relative p-2.5 rounded-full transition-all flex-shrink-0 flex items-center justify-center h-[42px] w-[42px] cursor-pointer",
                      activeFilterCount > 0 
                        ? "bg-black text-white shadow-sm hover:bg-neutral-800" 
                        : "bg-[#F4F4F5] hover:bg-[#E4E4E7] text-gray-600"
                    )}
                    title="Filter options"
                  >
                    <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C8DF52] text-black type-caption font-semibold rounded-full flex items-center justify-center border-2 border-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Active Filter Chips */}
            {activeFilterCount > 0 && (
              <div className="flex items-center flex-wrap gap-2 pt-1">
                <span className="type-caption text-zinc-500 font-medium mr-1">Active filters:</span>
                {filters.types.map(t => (
                  <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md type-caption bg-zinc-100 text-zinc-800 border border-zinc-200">
                    Type: {t}
                    <button onClick={() => removeAppliedFilter('types', t)} className="hover:text-black">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {filters.status.map(s => (
                  <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md type-caption bg-zinc-100 text-zinc-800 border border-zinc-200 capitalize">
                    Status: {s}
                    <button onClick={() => removeAppliedFilter('status', s)} className="hover:text-black">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {filters.sites.map(site => (
                  <span key={site} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md type-caption bg-zinc-100 text-zinc-800 border border-zinc-200">
                    Site: {site}
                    <button onClick={() => removeAppliedFilter('sites', site)} className="hover:text-black">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button 
                  onClick={clearAllFilters}
                  className="type-caption text-red-600 hover:text-red-700 font-medium ml-2 underline underline-offset-2 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

            {/* Table Top (Tabs & Header) WITH borders */}
            <div className="bg-white border-t border-l border-r border-[#E5E7EB] rounded-t-[20px] flex flex-col relative z-20">
              {/* Tabs */}
              <div className="px-6 pt-3 pb-4">
            <div className="flex items-center gap-8 border-b border-[#E5E7EB] w-max">
              {tableTabs.map((tab) => {
                const isActive = activeTableTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTableTab(tab.id)}
                    className={cn(
                      "relative py-3 transition-colors duration-200 flex items-center justify-center gap-2",
                      isActive ? "type-body-medium text-[#161616]" : "type-body text-[#A3A3A3] hover:text-[#161616]"
                    )}
                  >
                    <Icon icon={tab.icon} className="w-[18px] h-[18px]" />
                    <span>{tab.label}</span>
                    {isActive && (
                      <div className="absolute -bottom-[1px] left-0 right-0 h-[3px] bg-[#C8DF52] rounded-t-full z-10" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Table Header */}
          {/* Table Header */}
          {activeTableTab === 'Presented' && (
            <div className="bg-[#0A0A0A] text-white grid grid-cols-[2.5fr_2fr_1.4fr_1.2fr_1.2fr_1fr_1.4fr_0.8fr] gap-4 items-center px-6 py-3">
              <div className="type-small font-medium uppercase text-[#E5E7EB] text-left flex items-center gap-1.5 tracking-wider">
                <Icon icon="hugeicons:user" className="w-4 h-4 text-[#9CA3AF]" />
                Employee
              </div>
              <div className="flex justify-center min-w-0">
                <div className="type-small font-medium uppercase text-[#E5E7EB] flex items-center gap-1.5 tracking-wider w-full max-w-[220px] shrink-0">
                  <Icon icon="hugeicons:location-01" className="w-4 h-4 text-[#9CA3AF]" />
                  Site
                </div>
              </div>
              <div className="type-small font-medium uppercase text-[#E5E7EB] flex items-center justify-center gap-1.5 tracking-wider text-center">
                <Icon icon="hugeicons:shield-key" className="w-4 h-4 text-[#9CA3AF]" />
                Type
              </div>
              <div className="type-small font-medium uppercase text-[#E5E7EB] flex items-center justify-center gap-1.5 tracking-wider text-center">
                <Icon icon="hugeicons:login-03" className="w-4 h-4 text-[#9CA3AF]" />
                Clock in
              </div>
              <div className="type-small font-medium uppercase text-[#E5E7EB] flex items-center justify-center gap-1.5 tracking-wider text-center">
                <Icon icon="hugeicons:logout-03" className="w-4 h-4 text-[#9CA3AF]" />
                Clock out
              </div>
              <div className="type-small font-medium uppercase text-[#E5E7EB] flex items-center justify-center gap-1.5 tracking-wider text-center">
                <Icon icon="hugeicons:coffee-01" className="w-4 h-4 text-[#9CA3AF]" />
                Break
              </div>
              <div className="type-small font-medium uppercase text-[#E5E7EB] flex items-center justify-center gap-1.5 tracking-wider text-center">
                <Icon icon="hugeicons:timer-02" className="w-4 h-4 text-[#9CA3AF]" />
                Hours worked
              </div>
              <div className="type-small font-medium uppercase text-[#E5E7EB] text-right flex items-center justify-end gap-1.5 tracking-wider">
                <Icon icon="hugeicons:more-horizontal" className="w-4 h-4 text-[#9CA3AF]" />
                Actions
              </div>
            </div>
          )}
          {activeTableTab === 'Unclocked' && (
            <div className="bg-[#0A0A0A] text-white grid grid-cols-[2.5fr_1.5fr_1.5fr_1.5fr_1.5fr_0.8fr] gap-4 items-center px-6 py-3">
              <div className="type-small font-medium uppercase text-[#E5E7EB] text-left flex items-center gap-1.5 tracking-wider">
                <Icon icon="hugeicons:user" className="w-4 h-4 text-[#9CA3AF]" /> Employee
              </div>
              <div className="type-small font-medium uppercase text-[#E5E7EB] flex items-center justify-center gap-1.5 tracking-wider text-center">
                <Icon icon="hugeicons:login-03" className="w-4 h-4 text-[#9CA3AF]" /> Expected Clock In
              </div>
              <div className="type-small font-medium uppercase text-[#E5E7EB] flex items-center justify-center gap-1.5 tracking-wider text-center">
                <Icon icon="hugeicons:logout-03" className="w-4 h-4 text-[#9CA3AF]" /> Expected Clock Out
              </div>
              <div className="type-small font-medium uppercase text-[#E5E7EB] flex items-center justify-center gap-1.5 tracking-wider text-center">
                <Icon icon="hugeicons:coffee-01" className="w-4 h-4 text-[#9CA3AF]" /> Expected Break
              </div>
              <div className="type-small font-medium uppercase text-[#E5E7EB] flex items-center justify-center gap-1.5 tracking-wider text-center">
                <Icon icon="hugeicons:timer-02" className="w-4 h-4 text-[#9CA3AF]" /> Expected Hours
              </div>
              <div className="type-small font-medium uppercase text-[#E5E7EB] text-right flex items-center justify-end gap-1.5 tracking-wider">
                <Icon icon="hugeicons:more-horizontal" className="w-4 h-4 text-[#9CA3AF]" /> Actions
              </div>
            </div>
          )}
          {activeTableTab === 'Absentees' && (
            <div className="bg-[#0A0A0A] text-white grid grid-cols-[2.5fr_1.5fr_1.5fr_1.5fr_1.5fr_0.8fr] gap-4 items-center px-6 py-3">
              <div className="type-small font-medium uppercase text-[#E5E7EB] text-left flex items-center gap-1.5 tracking-wider">
                <Icon icon="hugeicons:user" className="w-4 h-4 text-[#9CA3AF]" />
                Employee
              </div>
              <div className="type-small font-medium uppercase text-[#E5E7EB] flex items-center justify-center gap-1.5 tracking-wider text-center">
                <Icon icon="hugeicons:calendar-03" className="w-4 h-4 text-[#9CA3AF]" />
                Leave Type
              </div>
              <div className="type-small font-medium uppercase text-[#E5E7EB] flex items-center justify-center gap-1.5 tracking-wider text-center">
                <Icon icon="hugeicons:note-01" className="w-4 h-4 text-[#9CA3AF]" />
                Reason
              </div>
              <div className="type-small font-medium uppercase text-[#E5E7EB] flex items-center justify-center gap-1.5 tracking-wider text-center">
                <Icon icon="hugeicons:time-01" className="w-4 h-4 text-[#9CA3AF]" />
                Number of days
              </div>
              <div className="type-small font-medium uppercase text-[#E5E7EB] flex items-center justify-center gap-1.5 tracking-wider text-center">
                <Icon icon="hugeicons:task-01" className="w-4 h-4 text-[#9CA3AF]" />
                Approval
              </div>
              <div className="type-small font-medium uppercase text-[#E5E7EB] text-right flex items-center justify-end gap-1.5 tracking-wider">
                <Icon icon="hugeicons:more-horizontal" className="w-4 h-4 text-[#9CA3AF]" />
                Actions
              </div>
            </div>
          )}
          {activeTableTab === 'Monthly log' && (
            <div className="bg-[#0A0A0A] text-white grid grid-cols-[3fr_2fr_2fr_1fr] gap-4 items-center px-6 py-3">
              <div className="type-small font-medium uppercase text-[#E5E7EB] text-left flex items-center gap-1.5 tracking-wider">
                <Icon icon="hugeicons:file-02" className="w-4 h-4 text-[#9CA3AF]" /> Report Name
              </div>
              <div className="type-small font-medium uppercase text-[#E5E7EB] flex items-center justify-center gap-1.5 tracking-wider text-center">
                <Icon icon="hugeicons:calendar-03" className="w-4 h-4 text-[#9CA3AF]" /> Date
              </div>
              <div className="type-small font-medium uppercase text-[#E5E7EB] flex items-center justify-center gap-1.5 tracking-wider text-center">
                <Icon icon="hugeicons:database" className="w-4 h-4 text-[#9CA3AF]" /> Size
              </div>
              <div className="type-small font-medium uppercase text-[#E5E7EB] text-right flex items-center justify-end gap-1.5 tracking-wider">
                <Icon icon="hugeicons:more-horizontal" className="w-4 h-4 text-[#9CA3AF]" /> Actions
              </div>
            </div>
          )}
          </div> {/* End of Table Top */}
        </div> {/* End of Sticky Top Container */}

        {/* Table Body & Footer Container */}
        <div className="bg-white border-b border-l border-r border-[#E5E7EB] rounded-b-[20px] flex flex-col mb-6 mx-4 md:mx-5">
          {/* Table Body */}
          {activeTableTab === 'Monthly log' ? (
            <div className="flex-1 bg-white divide-y divide-[#F4F4F5] min-h-[220px] overflow-hidden rounded-b-[20px]">
              {[
                { name: 'July 2026 Attendance Log.csv', date: 'Jul 2026', size: '2.4 MB' },
                { name: 'June 2026 Attendance Log.csv', date: 'Jun 2026', size: '2.1 MB' },
                { name: 'May 2026 Attendance Log.csv', date: 'May 2026', size: '2.3 MB' }
              ].map((file, i) => (
                <div key={i} className="grid grid-cols-[3fr_2fr_2fr_1fr] gap-4 items-center px-6 py-4 hover:bg-[#F9FAFB] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 flex items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] shrink-0">
                      <Icon icon="hugeicons:file-02" className="w-5 h-5 text-[#161616]" />
                    </div>
                    <span className="type-body-medium text-[#161616] truncate">{file.name}</span>
                  </div>
                  <div className="type-body text-[#737373] text-center">
                    {file.date}
                  </div>
                  <div className="type-body-medium text-[#737373] text-center">
                    {file.size}
                  </div>
                  <div className="flex items-center justify-end">
                    <button className="p-2 text-[#737373] hover:text-[#161616] hover:bg-[#F4F4F5] rounded-lg transition-colors">
                      <Icon icon="hugeicons:download-01" className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 bg-white divide-y divide-[#F4F4F5] min-h-[220px] overflow-hidden">
              {attendanceLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#737373] gap-2">
                  <Icon icon="hugeicons:loading-01" className="w-8 h-8 opacity-40 animate-spin" />
                  <span className="type-body text-[#737373]">Loading attendance...</span>
                </div>
              ) : currentRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#737373] gap-2">
                  <Icon icon="hugeicons:alert-02" className="w-8 h-8 opacity-40" />
                  <span className="type-body text-[#737373]">No attendance records found</span>
                </div>
              ) : (
                currentRecords.map((record) => (
                  <div 
                    key={record.id}
                    className={cn(
                      "grid gap-4 items-center px-6 py-3.5 hover:bg-[#F9FAFB] transition-colors",
                      activeTableTab === 'Presented' ? "grid-cols-[2.5fr_2fr_1.4fr_1.2fr_1.2fr_1fr_1.4fr_0.8fr]" : "grid-cols-[2.5fr_1.5fr_1.5fr_1.5fr_1.5fr_0.8fr]"
                    )}
                  >
                    {/* Employee */}
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={record.avatar} 
                        alt={record.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#E5E7EB]"
                        onError={(e) => {
                          // Fallback image
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(record.name)}&background=0A0A0A&color=C8DF52`
                        }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="type-body-medium text-[#161616] truncate">{record.name}</span>
                        <span className="type-small text-[#737373] truncate">{record.role}</span>
                      </div>
                    </div>

                    {activeTableTab === 'Presented' && (
                      <>
                        {/* Site */}
                        <div className="flex justify-center min-w-0">
                          <div className="type-body text-[#161616] flex items-center gap-1.5 w-full max-w-[220px] shrink-0 min-w-0">
                            <Icon icon="hugeicons:location-01" className="w-4 h-4 text-[#16A34A] shrink-0" />
                            <span className="truncate">{record.site}</span>
                          </div>
                        </div>

                        {/* Type */}
                        <div className="flex justify-center text-center">
                          {record.type === 'Geofencing' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full type-caption bg-[#F4F4F5] text-[#161616] border border-[#E5E7EB]">
                              <Icon icon="hugeicons:camera-01" className="w-3.5 h-3.5 text-[#737373]" />
                              Geofencing
                            </span>
                          ) : record.type === 'Site Pass' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full type-caption bg-[#F4F4F5] text-[#161616] border border-[#E5E7EB]">
                              <Icon icon="hugeicons:id" className="w-3.5 h-3.5 text-[#737373]" />
                              Site Pass
                            </span>
                          ) : (
                            <span className="type-body text-[#A3A3A3]">-</span>
                          )}
                        </div>

                        {/* Clock In */}
                        <div className={cn("type-body-medium text-center", record.status === 'late' ? "text-amber-600" : "text-[#161616]")}>
                          {record.clockIn}
                        </div>

                        {/* Clock Out */}
                        <div className="type-body-medium text-[#161616] text-center">
                          {record.clockOut}
                        </div>

                        {/* Break */}
                        <div className="type-body text-[#737373] text-center">
                          {record.breakTime}
                        </div>

                        {/* Hours Worked */}
                        <div className="type-body-medium text-[#161616] text-center">
                          {record.hoursWorked}
                        </div>
                      </>
                    )}
                    {activeTableTab === 'Unclocked' && (
                      <>
                        {/* Expected Clock In */}
                        <div className="type-body-medium text-center text-[#737373]">
                          09:00 AM
                        </div>

                        {/* Expected Clock Out */}
                        <div className="type-body-medium text-[#737373] text-center">
                          06:00 PM
                        </div>

                        {/* Expected Break */}
                        <div className="type-body text-[#737373] text-center">
                          1h
                        </div>

                        {/* Expected Hours Worked */}
                        <div className="type-body-medium text-[#737373] text-center">
                          8h
                        </div>
                      </>
                    )}
                    {activeTableTab === 'Absentees' && (
                      <>
                        {/* Leave Type */}
                        <div className="flex justify-center text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full type-caption bg-[#F4F4F5] text-[#161616] border border-[#E5E7EB]">
                            Absent
                          </span>
                        </div>
                        {/* Reason */}
                        <div className="type-body text-[#737373] text-center truncate">
                          -
                        </div>
                        {/* Number of days */}
                        <div className="type-body-medium text-[#161616] text-center">
                          1
                        </div>
                        {/* Approval */}
                        <div className="flex justify-center text-center">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full type-caption bg-amber-50 text-amber-700 border border-amber-200">
                            Pending
                          </span>
                        </div>
                      </>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end">
                      <button className="p-1.5 text-[#737373] hover:text-[#161616] hover:bg-[#F4F4F5] rounded-lg transition-colors">
                        <Icon icon="hugeicons:more-horizontal" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Table Footer */}
          {activeTableTab !== 'Monthly log' && (
            <div className="border-t border-[#E5E7EB] bg-white px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-[20px]">
              {/* Entry stats */}
              <div className="type-small text-[#737373]">
                Showing <span className="font-medium text-[#161616]">{totalRecords === 0 ? 0 : startIndex + 1}</span> to <span className="font-medium text-[#161616]">{endIndex}</span> of <span className="font-medium text-[#161616]">{totalRecords}</span> records
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 type-small text-[#737373]">
                  <span>Rows per page:</span>
                  <select 
                    value={rowsPerPage} 
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="bg-[#F4F4F5] border border-[#E5E7EB] rounded-lg px-2 py-1 text-[#161616] font-medium type-small focus:outline-none cursor-pointer hover:bg-[#E4E4E7] transition-colors"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage <= 1}
                    aria-label="Previous Page"
                    className={cn(
                      "p-1.5 rounded-lg border transition-colors",
                      currentPage <= 1 
                        ? "border-[#E5E7EB] bg-[#F4F4F5] text-gray-400 cursor-not-allowed" 
                        : "border-[#E5E7EB] bg-white text-[#161616] hover:bg-[#F4F4F5] cursor-pointer"
                    )}
                  >
                    <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
                  </button>
                  <span className="type-small font-medium text-[#161616] px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    aria-label="Next Page"
                    className={cn(
                      "p-1.5 rounded-lg border transition-colors",
                      currentPage >= totalPages 
                        ? "border-[#E5E7EB] bg-[#F4F4F5] text-gray-400 cursor-not-allowed" 
                        : "border-[#E5E7EB] bg-white text-[#161616] hover:bg-[#F4F4F5] cursor-pointer"
                    )}
                  >
                    <Icon icon="hugeicons:arrow-right-01" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div> {/* End of Table Body & Footer Container */}

      </div> {/* End of Main Scrollable Area */}

      {/* Filter Side Panel (Drawer) */}
      <AnimatePresence>
        {isFilterPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterPanelOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />

            {/* Slide-over Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white border border-gray-200 rounded-md text-black">
                    <Filter className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="type-h2 text-[#161616]">Filter Attendance</h2>
                    <p className="type-caption text-[#737373]">Refine logs by status, type & location</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors text-[#737373]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body Options */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 divide-y divide-gray-100 bg-white">
                {/* Status Filter */}
                {activeAvailableStatuses.length > 0 && (
                  <div className="pt-2">
                    <label className="type-body-medium text-[#161616] block mb-3">Attendance Status</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {activeAvailableStatuses.map(s => {
                        const isChecked = draftFilters.status.includes(s.id)
                        return (
                          <button
                            key={s.id}
                            onClick={() => toggleStatusFilter(s.id)}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-md border type-small transition-all text-left cursor-pointer",
                              isChecked 
                                ? "border-black bg-black text-white font-medium" 
                                : "border-gray-200 bg-white text-[#161616] hover:bg-gray-50"
                            )}
                          >
                            <span>{s.label}</span>
                            {isChecked && <Check className="w-4 h-4 text-[#C8DF52]" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Verification / Pass Type Filter */}
                {showVerificationFilter && (
                  <div className="pt-6">
                    <label className="type-body-medium text-[#161616] block mb-3">Verification Method</label>
                    <div className="space-y-2">
                      {availableTypes.map(t => {
                        const isChecked = draftFilters.types.includes(t)
                        return (
                          <button
                            key={t}
                            onClick={() => toggleTypeFilter(t)}
                            className={cn(
                              "w-full flex items-center justify-between p-3.5 rounded-md border type-small transition-all cursor-pointer",
                              isChecked 
                                ? "border-black bg-black text-white font-medium" 
                                : "border-gray-200 bg-white text-[#161616] hover:bg-gray-50"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon icon={t === 'Geofencing' ? 'hugeicons:camera-01' : 'hugeicons:id'} className="w-5 h-5 text-gray-500" />
                              <span>{t}</span>
                            </div>
                            {isChecked && <Check className="w-4 h-4 text-[#C8DF52]" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Site / Location Filter */}
                {showSiteFilter && availableSites.length > 0 && (
                  <div className="pt-6">
                    <label className="type-body-medium text-[#161616] block mb-3">Site / Location</label>
                    <div className="space-y-2">
                      {availableSites.map(site => {
                        const isChecked = draftFilters.sites.includes(site)
                        return (
                          <button
                            key={site}
                            onClick={() => toggleSiteFilter(site)}
                            className={cn(
                              "w-full flex items-center justify-between p-3 rounded-md border type-small transition-all cursor-pointer",
                              isChecked 
                                ? "border-black bg-black text-white font-medium" 
                                : "border-gray-200 bg-white text-[#161616] hover:bg-gray-50"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Icon icon="hugeicons:location-01" className="w-4 h-4 text-emerald-600" />
                              <span className="truncate">{site}</span>
                            </div>
                            {isChecked && <Check className="w-4 h-4 text-[#C8DF52]" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-gray-200 bg-white flex items-center justify-between gap-4">
                <button
                  onClick={() => setDraftFilters({ types: [], status: [], sites: [] })}
                  disabled={draftFilterCount === 0}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-md type-small font-medium transition-colors cursor-pointer",
                    draftFilterCount === 0 
                      ? "text-gray-400 cursor-not-allowed" 
                      : "text-zinc-700 hover:bg-gray-100"
                  )}
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
                <button
                  onClick={() => {
                    setFilters(draftFilters)
                    setIsFilterPanelOpen(false)
                  }}
                  className="flex-1 bg-black hover:bg-neutral-800 text-white font-semibold py-2.5 px-6 rounded-md type-body-medium transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Apply Filters</span>
                  {draftFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-[#C8DF52] text-black type-caption font-semibold rounded-md">
                      {draftFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

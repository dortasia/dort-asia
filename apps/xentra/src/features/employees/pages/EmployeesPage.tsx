import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, Filter, X, Check, RotateCcw, Eye, Pencil } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { cn, getAvatarUrl } from '@/lib/utils'
import { Employee } from '../types/employee.types'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import FormDropdown from '@/components/ui/FormDropdown'
import FormDatePicker from '@/components/ui/FormDatePicker'

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  if (!value || value === '-' || value.trim() === '') return null

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(value)
    setCopied(true)
    toast.success(`${label} copied to clipboard`)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      title={`Copy ${label}`}
      className="p-1 text-[#A3A3A3] hover:text-[#161616] hover:bg-[#F4F4F5] rounded-md transition-colors shrink-0 cursor-pointer"
    >
      <Icon 
        icon={copied ? "hugeicons:tick-01" : "hugeicons:copy-01"} 
        className={cn("w-3.5 h-3.5 transition-all", copied && "text-[#16A34A]")} 
      />
    </button>
  )
}

const formatDate = (dateStr?: string | null) => {
  if (!dateStr || dateStr === 'Invalid Date' || dateStr === '-') return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-SG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export function EmployeesPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [createdEmployeeId, setCreatedEmployeeId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [sortBy, setSortBy] = useState<string>('name_asc')

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [activeMenuEmpId, setActiveMenuEmpId] = useState<string | null>(null)
  
  // Site Access Panel State
  const [isSiteAccessPanelOpen, setIsSiteAccessPanelOpen] = useState(false)
  const [siteAccessEmp, setSiteAccessEmp] = useState<Employee | null>(null)
  const [isSavingSiteAccess, setIsSavingSiteAccess] = useState(false)

  // Site Pass Panel State
  const [isSitePassPanelOpen, setIsSitePassPanelOpen] = useState(false)
  const [sitePassEmp, setSitePassEmp] = useState<Employee | null>(null)
  const [sitePassForm, setSitePassForm] = useState<{ siteId: string; startDate: string; endDate: string }>({
    siteId: '', startDate: new Date().toISOString().split('T')[0], endDate: ''
  })
  const [isSavingSitePass, setIsSavingSitePass] = useState(false)
  
  // Add Employee Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSetupPrompt, setShowSetupPrompt] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    fullName: '',
    email: '',
    empId: '',
    phone: '',
    departmentId: '',
    designation: '',
    role: 'EMPLOYEE',
    joinDate: new Date().toISOString().split('T')[0]
  })
  const [filters, setFilters] = useState<{ status: string[]; roles: string[]; departments: string[] }>({
    status: [], roles: [], departments: []
  })
  const [draftFilters, setDraftFilters] = useState<{ status: string[]; roles: string[]; departments: string[] }>({
    status: [], roles: [], departments: []
  })

  // Reset to page 1 when search, rows per page, filters, or sort change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, rowsPerPage, filters, sortBy])

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', user?.id],
    queryFn: async () => {
      // Step 1: Always fetch employees with a simple safe query first
      const { data: rawEmps, error: empError } = await supabase
        .from('employees')
        .select('*')

      if (empError || !rawEmps) {
        console.error('Error fetching employees:', empError)
        toast.error('Failed to load employees')
        return []
      }

      // Step 2: Fetch contact details separately (non-blocking — if it fails we still show employees)
      const contactMap: Record<string, { mobile_code: string; current_mobile_number: string }> = {}
      try {
        const { data: contactData } = await supabase
          .from('employee_contact_details')
          .select('employee_id, mobile_code, current_mobile_number')
        if (contactData) {
          contactData.forEach((c: any) => {
            if (c.employee_id) contactMap[c.employee_id] = c
          })
        }
      } catch {
        // silently ignore — phone will fall back to employees.mobile
      }

      // Step 3: Fetch department list separately for name lookup
      const deptMap: Record<string, string> = {}
      try {
        const { data: deptData } = await supabase
          .from('departments')
          .select('id, department_name')
        if (deptData) {
          deptData.forEach((d: any) => {
            if (d.id) deptMap[d.id] = d.department_name
          })
        }
      } catch {
        // silently ignore
      }

      return rawEmps.map((emp: any) => {
        const contactDetails = contactMap[emp.id]
        let contactMobile = ''
        if (contactDetails?.current_mobile_number) {
          contactMobile = `${contactDetails.mobile_code || '+65'} ${contactDetails.current_mobile_number}`.trim()
        }

        const primaryEmail = emp.email || emp.personal_email || emp.work_email || emp.current_email || ''
        const primaryPhone = contactMobile || emp.mobile || emp.phone_number || emp.phone || emp.mobile_number || emp.emerg_contact || '-'
        const primaryName = emp.name || emp.full_name || [emp.first_name, emp.last_name].filter(Boolean).join(' ') || (primaryEmail ? primaryEmail.split('@')[0] : 'Employee')
        const deptName = emp.departments?.department_name || deptMap[emp.department_id] || departmentsList.find((d: any) => String(d.id) === String(emp.department_id))?.department_name || emp.department_name || 'N/A'

        return {
          id: emp.id,
          employeeCode: emp.emp_id || emp.employee_code || '-',
          fullName: primaryName,
          email: primaryEmail || '-',
          phone: primaryPhone || '-',
          nric: emp.nric_number || emp.fin_number || '-',
          department: deptName,
          jobTitle: emp.designation || emp.job_title || 'Employee',
          role: emp.app_role || emp.role || 'EMPLOYEE',
          joinDate: emp.date_of_joining || emp.join_date || emp.created_at || null,
          salary: 0,
          status: emp.is_active !== false ? 'ACTIVE' : 'TERMINATED',
          type: emp.job_type ? emp.job_type.toUpperCase().replace(/\s+/g, '_') : 'FULL_TIME',
          avatarUrl: (primaryEmail === user?.email && user?.avatarUrl) ? user.avatarUrl : (emp.avatar_url || emp.profile_photo_url || null),
          rawCustomFields: emp.custom_fields || {}
        }
      }) as Employee[]
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  })

  // Departments list query for Add Employee dropdown
  const { data: departmentsList = [] } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, department_name')
        .order('department_name')
      if (error) return []
      return data || []
    },
    staleTime: Infinity
  })

  // Fetch company sites for the Site Access Panel
  const { data: companySites = [] } = useQuery({
    queryKey: ['company_sites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_sites')
        .select('id, name')
        .order('name')
      if (error) return []
      return data || []
    },
    staleTime: 5 * 60 * 1000
  })

  // Check if selected department already has an admin
  const selectedDepartmentName = departmentsList.find((d: any) => d.id === newEmployee.departmentId)?.department_name;
  const departmentHasAdmin = employees.some(emp => emp.department === selectedDepartmentName && emp.role === 'Admin');

  React.useEffect(() => {
    if (departmentHasAdmin && newEmployee.role === 'Admin') {
      setNewEmployee(prev => ({ ...prev, role: 'EMPLOYEE' }));
    }
  }, [departmentHasAdmin, newEmployee.role]);

  const appRoleOptions = [
    { value: 'EMPLOYEE', label: 'Employee' },
    ...(departmentHasAdmin ? [] : [{ value: 'Admin', label: 'Admin' }])
  ];

  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmployee.fullName.trim() || !newEmployee.email.trim()) {
      toast.error('Please enter full name and email')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmployee.email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    // Duplicate checks
    const emailExists = employees.some(emp => emp.email.toLowerCase() === newEmployee.email.trim().toLowerCase());
    if (emailExists) {
      toast.error('An employee with this email address already exists in the company.');
      return;
    }

    if (newEmployee.phone.trim()) {
      const phoneExists = employees.some(emp => emp.phone.trim() === newEmployee.phone.trim());
      if (phoneExists) {
        toast.error('An employee with this phone number already exists in the company.');
        return;
      }
    }

    if (newEmployee.empId.trim()) {
      const empIdExists = employees.some(emp => emp.employeeCode.trim().toLowerCase() === newEmployee.empId.trim().toLowerCase());
      if (empIdExists) {
        toast.error('This Employee Code / ID is already taken.');
        return;
      }
    }

    try {
      setIsSubmitting(true)
      
      let companyId: string | null = null
      if (user?.id) {
        const { data: empRecord } = await supabase
          .from('employees')
          .select('company_id')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (empRecord?.company_id) {
          companyId = empRecord.company_id
        } else {
          // Fallback: Check if they own a company directly if they don't have an employee record yet
          const { data: companyRecord } = await supabase
            .from('companies')
            .select('id')
            .eq('super_admin_id', user.id)
            .maybeSingle()
          
          if (companyRecord?.id) {
            companyId = companyRecord.id
          }
        }
      }

      const generatedEmpCode = newEmployee.empId.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`

      const payload: any = {
        name: newEmployee.fullName.trim(),
        email: newEmployee.email.trim().toLowerCase(),
        emp_id: generatedEmpCode,
        phone_number: newEmployee.phone.trim() || null,
        department_id: newEmployee.departmentId || null,
        designation: newEmployee.designation.trim() || 'Employee',
        app_role: newEmployee.role,
        date_of_joining: newEmployee.joinDate || new Date().toISOString().split('T')[0],
        avatar_url: getAvatarUrl(newEmployee.fullName.trim()),
        is_active: true
      }

      if (companyId) {
        payload.company_id = companyId
      }

      const { data: newEmpData, error } = await supabase
        .from('employees')
        .insert([payload])
        .select('id')
        .single()

      if (error) {
        console.error('Error adding employee:', error)
        toast.error(error.message || 'Failed to create employee')
        return
      }

      toast.success(`Employee "${newEmployee.fullName}" added successfully!`)
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      if (newEmpData?.id) {
        setCreatedEmployeeId(newEmpData.id)
      }
      setShowSetupPrompt(true)
    } catch (err: any) {
      console.error(err)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Realtime subscription for Employees table to keep cache fresh in background
  React.useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('employees-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        () => {
          // Invalidate cache to trigger a background refetch without UI disruption
          queryClient.invalidateQueries({ queryKey: ['employees', user.id] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])

  const availableStatuses = [
    { id: 'ACTIVE', label: 'Active' },
    { id: 'TERMINATED', label: 'Terminated' }
  ]
  
  const availableRoles = Array.from(new Set(employees.map(e => e.role))).filter(Boolean).sort()
  const availableDepartments = Array.from(new Set(employees.map(e => e.department))).filter(Boolean).sort()

  const activeFilterCount = filters.status.length + filters.roles.length + filters.departments.length
  const draftFilterCount = draftFilters.status.length + draftFilters.roles.length + draftFilters.departments.length

  const removeAppliedFilter = (type: 'status' | 'roles' | 'departments', value: string) => {
    setFilters(prev => ({ ...prev, [type]: prev[type].filter(v => v !== value) }))
  }

  const clearAllFilters = () => setFilters({ status: [], roles: [], departments: [] })

  const toggleFilter = (type: 'status' | 'roles' | 'departments', value: string) => {
    setDraftFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value) ? prev[type].filter(v => v !== value) : [...prev[type], value]
    }))
  }

  const isNewEmployee = (dateStr: string) => {
    if (!dateStr) return false
    const joinDate = new Date(dateStr)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - joinDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
    return diffDays <= 7
  }

  let filteredEmployees = employees.filter((emp) => {
    const query = searchQuery.toLowerCase().trim()
    
    if (filters.status.length > 0 && !filters.status.includes(emp.status)) return false
    if (filters.roles.length > 0 && !filters.roles.includes(emp.role)) return false
    if (filters.departments.length > 0 && !filters.departments.includes(emp.department)) return false

    if (!query) return true
    return (
      (emp.fullName || '').toLowerCase().includes(query) ||
      (emp.email || '').toLowerCase().includes(query) ||
      (emp.department || '').toLowerCase().includes(query) ||
      (emp.phone || '').toLowerCase().includes(query) ||
      (emp.jobTitle || '').toLowerCase().includes(query) ||
      (emp.employeeCode || '').toLowerCase().includes(query)
    )
  })

  filteredEmployees = filteredEmployees.sort((a, b) => {
    switch (sortBy) {
      case 'name_asc': return (a.fullName || '').localeCompare(b.fullName || '')
      case 'name_desc': return (b.fullName || '').localeCompare(a.fullName || '')
      case 'date_desc': return new Date(b.joinDate || 0).getTime() - new Date(a.joinDate || 0).getTime()
      case 'date_asc': return new Date(a.joinDate || 0).getTime() - new Date(b.joinDate || 0).getTime()
      case 'dept_asc': return (a.department || '').localeCompare(b.department || '')
      case 'dept_desc': return (b.department || '').localeCompare(a.department || '')
      default: return 0
    }
  })

  // Auto-generate employee ID when opening the modal
  const handleOpenAddModal = () => {
    let nextNum = 1;
    if (employees && employees.length > 0) {
      const nums = employees
        .map(e => {
          const match = e.employeeCode.match(/\d+/);
          return match ? parseInt(match[0], 10) : NaN;
        })
        .filter(n => !isNaN(n));
      if (nums.length > 0) {
        nextNum = Math.max(...nums) + 1;
      }
    }
    const autoEmpId = `EMP-${String(nextNum).padStart(4, '0')}`;

    setNewEmployee(prev => ({
      ...prev,
      empId: autoEmpId
    }));
    setIsAddModalOpen(true);
  }

  // Pagination logic
  const totalRecords = filteredEmployees.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, totalRecords)
  const currentRecords = filteredEmployees.slice(startIndex, endIndex)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto flex flex-col [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [ms-overflow-style:none]">
        
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
            <h1 className="type-h1 text-black">Employees</h1>
            <p className="type-body text-[#737373]">Your company Employees Directory</p>
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

        {/* Main Content Area */}
        <div className="flex flex-col px-4 md:px-5 relative z-40 mt-2">
          
          {/* Toolbar Row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            
            {/* Left: Search Bar */}
            <div className="relative w-full md:w-[320px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Employees"
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-full type-small text-[#161616] placeholder:text-[#8B8B8B] focus:outline-none focus:border-[#C8DF52] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)] h-[42px]"
              />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {/* Custom Sort Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="h-[42px] px-4 bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] rounded-full type-small text-[#616161] focus:outline-none transition-colors cursor-pointer flex items-center gap-2"
                  title="Sort options"
                >
                  <Icon icon="hugeicons:sort-by-down-01" className="w-4 h-4" />
                  <span>Sort</span>
                </button>

                <AnimatePresence>
                  {isSortOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsSortOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-[calc(100%+8px)] w-48 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl z-50 overflow-hidden py-2"
                      >
                        {[
                          { value: 'name_asc', label: 'Name (A-Z)' },
                          { value: 'name_desc', label: 'Name (Z-A)' },
                          { value: 'date_desc', label: 'Newest First' },
                          { value: 'date_asc', label: 'Oldest First' },
                          { value: 'dept_asc', label: 'Dept (A-Z)' },
                          { value: 'dept_desc', label: 'Dept (Z-A)' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value)
                              setIsSortOpen(false)
                            }}
                            className={cn(
                              "w-full text-left px-4 py-2.5 type-small transition-colors cursor-pointer flex items-center justify-between",
                              sortBy === option.value 
                                ? "bg-[#F9FAFB] text-[#161616] font-medium" 
                                : "text-[#616161] hover:bg-[#F9FAFB] hover:text-[#161616]"
                            )}
                          >
                            {option.label}
                            {sortBy === option.value && (
                              <Check className="w-4 h-4 text-[#C8DF52]" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              
              <button 
                onClick={() => {
                  setDraftFilters(filters)
                  setIsFilterPanelOpen(true)
                }}
                className={cn(
                  "relative p-2.5 rounded-full transition-all flex-shrink-0 flex items-center justify-center h-[42px] w-[42px] cursor-pointer",
                  activeFilterCount > 0 
                    ? "bg-black text-white shadow-sm hover:bg-neutral-800" 
                    : "bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#616161]"
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

              <button 
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 bg-black hover:bg-neutral-800 text-white type-body-medium font-semibold px-5 py-2 rounded-full transition-colors h-[42px] cursor-pointer"
              >
                <Icon icon="hugeicons:user-add-01" className="w-4 h-4" />
                <span>Add Employee</span>
              </button>
            </div>

          </div>

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex items-center flex-wrap gap-2 mb-4">
              <span className="type-caption text-[#737373] font-medium mr-1">Active filters:</span>
              {filters.status.map(s => (
                <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md type-caption bg-[#F4F4F5] text-[#161616] border border-[#E5E7EB] capitalize">
                  Status: {s.toLowerCase()}
                  <button onClick={() => removeAppliedFilter('status', s)} className="hover:text-black">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {filters.roles.map(r => (
                <span key={r} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md type-caption bg-[#F4F4F5] text-[#161616] border border-[#E5E7EB]">
                  Role: {r}
                  <button onClick={() => removeAppliedFilter('roles', r)} className="hover:text-black">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {filters.departments.map(d => (
                <span key={d} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md type-caption bg-[#F4F4F5] text-[#161616] border border-[#E5E7EB]">
                  Dept: {d}
                  <button onClick={() => removeAppliedFilter('departments', d)} className="hover:text-black">
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

          {/* Table Container */}
          <div className="flex flex-col mb-8">
            
            {/* Table Header (Black Header Row) */}
            <div className="bg-[#0A0A0A] text-white border-t border-l border-r border-[#E5E7EB] rounded-t-[16px] grid grid-cols-[2.5fr_2fr_2.2fr_1.8fr_1.5fr_1.1fr] gap-4 items-center px-[22px] py-3">
              <div className="type-caption font-medium uppercase text-[#E5E7EB] text-left flex items-center gap-1.5 tracking-wider">
                <Icon icon="hugeicons:user" className="w-3.5 h-3.5 text-[#9CA3AF]" />
                Employee
              </div>
              <div className="type-caption font-medium uppercase text-[#E5E7EB] text-left flex items-center gap-1.5 tracking-wider">
                <Icon icon="lucide:building-2" className="w-3.5 h-3.5 text-[#9CA3AF]" />
                Department
              </div>
              <div className="type-caption font-medium uppercase text-[#E5E7EB] text-left flex items-center gap-1.5 tracking-wider">
                <Icon icon="hugeicons:mail-01" className="w-3.5 h-3.5 text-[#9CA3AF]" />
                Email
              </div>
              <div className="type-caption font-medium uppercase text-[#E5E7EB] text-left flex items-center gap-1.5 tracking-wider">
                <Icon icon="hugeicons:call" className="w-3.5 h-3.5 text-[#9CA3AF]" />
                Phone
              </div>
              <div className="type-caption font-medium uppercase text-[#E5E7EB] text-left flex items-center gap-1.5 tracking-wider">
                <Icon icon="hugeicons:calendar-03" className="w-3.5 h-3.5 text-[#9CA3AF]" />
                Date Joined
              </div>
              <div className="type-caption font-medium uppercase text-[#E5E7EB] text-right flex items-center justify-end gap-1.5 tracking-wider">
                <Icon icon="hugeicons:more-horizontal" className="w-3.5 h-3.5 text-[#9CA3AF]" />
                Actions
              </div>
            </div>

            {/* Table Body */}
            <div className="bg-white border-b border-l border-r border-[#E5E7EB] rounded-b-[16px] divide-y divide-[#F4F4F5] overflow-hidden min-h-[260px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Icon icon="hugeicons:loading-02" className="w-8 h-8 text-[#8B8B8B] animate-spin mb-3" />
                  <p className="type-small font-medium text-[#161616]">Loading employees...</p>
                </div>
              ) : currentRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#F4F4F5] flex items-center justify-center mb-2.5">
                    <Icon icon="hugeicons:user-remove-01" className="w-5 h-5 text-[#8B8B8B]" />
                  </div>
                  <p className="type-small font-medium text-[#161616] mb-1">No employees found</p>
                  <p className="type-caption text-[#737373]">Try adjusting your search criteria</p>
                </div>
              ) : (
                currentRecords.map((emp) => (
                  <div 
                    key={emp.id} 
                    className="grid grid-cols-[2.5fr_2fr_2.2fr_1.8fr_1.5fr_1.1fr] gap-4 items-center px-[22px] py-3 hover:bg-[#F9FAFB] transition-colors"
                  >
                    {/* Employee Profile */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative inline-flex flex-col items-center">
                        <img 
                          src={getAvatarUrl(emp.fullName, emp.avatarUrl)} 
                          alt={emp.fullName}
                          className="w-[36px] h-[36px] rounded-full border border-[#E5E7EB] object-cover shrink-0 bg-[#F4F4F5]"
                        />
                        {isNewEmployee(emp.joinDate) && (
                          <div className="absolute -bottom-2 bg-[#0066FF] text-white type-caption px-2 py-[1px] rounded-[6px] shadow-sm z-10 whitespace-nowrap">
                            New
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="type-small font-medium text-[#161616] truncate">{emp.fullName}</span>
                        <span className="type-caption text-[#737373] truncate">{emp.employeeCode}</span>
                      </div>
                    </div>

                    {/* Department */}
                    <div className="flex flex-col min-w-0">
                      <span className="type-small font-medium text-[#161616] truncate">{emp.department}</span>
                      <span className="type-caption text-[#737373] truncate">{emp.jobTitle}</span>
                    </div>

                    {/* Email with copy */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="type-small text-[#161616] truncate">{emp.email}</span>
                      <CopyButton value={emp.email} label="Email" />
                    </div>

                    {/* Phone with copy */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="type-small text-[#161616] truncate">{emp.phone}</span>
                      <CopyButton value={emp.phone} label="Phone number" />
                    </div>

                    {/* Date Joined */}
                    <div className="type-small text-[#737373]">
                      {formatDate(emp.joinDate)}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1 relative">
                      <button 
                        onClick={() => window.location.href = `/employees/${emp.id}`}
                        title="View details" 
                        className="p-1.5 text-[#737373] hover:text-[#161616] hover:bg-[#F4F4F5] rounded-md transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => window.location.href = `/employees/${emp.id}/edit`}
                        title="Edit employee" 
                        className="p-1.5 text-[#737373] hover:text-[#161616] hover:bg-[#F4F4F5] rounded-md transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSitePassEmp(emp)
                          setIsSitePassPanelOpen(true)
                        }}
                        title="Site Pass" 
                        className="p-1.5 text-[#737373] hover:text-[#161616] hover:bg-[#F4F4F5] rounded-md transition-colors cursor-pointer"
                      >
                        <Icon icon="lucide:id-card" className="w-4 h-4" />
                      </button>

                      {/* Three Dots Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuEmpId(activeMenuEmpId === emp.id ? null : emp.id);
                          }}
                          className="p-1.5 text-[#737373] hover:text-[#161616] hover:bg-[#F4F4F5] rounded-md transition-colors cursor-pointer"
                          title="More actions"
                        >
                          <Icon icon="hugeicons:more-vertical" className="w-4 h-4" />
                        </button>

                        {activeMenuEmpId === emp.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setActiveMenuEmpId(null); }} />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-150">
                              <button
                                type="button"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setActiveMenuEmpId(null); 
                                  setSiteAccessEmp(emp);
                                  setIsSiteAccessPanelOpen(true);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-colors"
                              >
                                <Icon icon="hugeicons:door-01" className="w-4 h-4 text-gray-500" />
                                Site Access
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setActiveMenuEmpId(null); 
                                  setSitePassEmp(emp);
                                  setIsSitePassPanelOpen(true);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-colors"
                              >
                                <Icon icon="lucide:id-card" className="w-4 h-4 text-gray-500" />
                                Site Pass
                              </button>
                              <div className="h-px bg-gray-100 my-1"></div>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setActiveMenuEmpId(null); toast.error('Delete functionality requires confirmation modal'); }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium transition-colors"
                              >
                                <Icon icon="hugeicons:delete-01" className="w-4 h-4 text-red-500" />
                                Delete Employee
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>

            {/* Table Footer */}
            <div className="mt-3 px-2 flex flex-col sm:flex-row items-center justify-between gap-3">
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
                    disabled={currentPage >= totalPages || totalPages === 0}
                    aria-label="Next Page"
                    className={cn(
                      "p-1.5 rounded-lg border transition-colors",
                      currentPage >= totalPages || totalPages === 0
                        ? "border-[#E5E7EB] bg-[#F4F4F5] text-gray-400 cursor-not-allowed" 
                        : "border-[#E5E7EB] bg-white text-[#161616] hover:bg-[#F4F4F5] cursor-pointer"
                    )}
                  >
                    <Icon icon="hugeicons:arrow-right-01" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
      
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
              <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white border border-[#E5E7EB] rounded-md text-black">
                    <Filter className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="type-h2 text-[#161616]">Filter Employees</h2>
                    <p className="type-caption text-[#737373]">Refine by status, role & department</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="p-2 hover:bg-[#F4F4F5] rounded-md transition-colors text-[#737373] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body Options */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 divide-y divide-[#F4F4F5] bg-white">
                
                {/* Status Filter */}
                <div className="pt-2">
                  <label className="type-body-medium text-[#161616] block mb-3">Employment Status</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {availableStatuses.map(s => {
                      const isChecked = draftFilters.status.includes(s.id)
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleFilter('status', s.id)}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-md border type-small transition-all text-left cursor-pointer",
                            isChecked 
                              ? "border-black bg-black text-white font-medium" 
                              : "border-[#E5E7EB] bg-white text-[#161616] hover:bg-[#F9FAFB]"
                          )}
                        >
                          <span>{s.label}</span>
                          {isChecked && <Check className="w-4 h-4 text-[#C8DF52]" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Role Filter */}
                {availableRoles.length > 0 && (
                  <div className="pt-6">
                    <label className="type-body-medium text-[#161616] block mb-3">App Role</label>
                    <div className="space-y-2">
                      {availableRoles.map(r => {
                        const isChecked = draftFilters.roles.includes(r)
                        return (
                          <button
                            key={r}
                            onClick={() => toggleFilter('roles', r)}
                            className={cn(
                              "w-full flex items-center justify-between p-3 rounded-md border type-small transition-all text-left cursor-pointer",
                              isChecked 
                                ? "border-black bg-black text-white font-medium" 
                                : "border-[#E5E7EB] bg-white text-[#161616] hover:bg-[#F9FAFB]"
                            )}
                          >
                            <span>{r}</span>
                            {isChecked && <Check className="w-4 h-4 text-[#C8DF52]" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Department Filter */}
                {availableDepartments.length > 0 && (
                  <div className="pt-6">
                    <label className="type-body-medium text-[#161616] block mb-3">Department</label>
                    <div className="space-y-2">
                      {availableDepartments.map(d => {
                        const isChecked = draftFilters.departments.includes(d)
                        return (
                          <button
                            key={d}
                            onClick={() => toggleFilter('departments', d)}
                            className={cn(
                              "w-full flex items-center justify-between p-3 rounded-md border type-small transition-all text-left cursor-pointer",
                              isChecked 
                                ? "border-black bg-black text-white font-medium" 
                                : "border-[#E5E7EB] bg-white text-[#161616] hover:bg-[#F9FAFB]"
                            )}
                          >
                            <span>{d}</span>
                            {isChecked && <Check className="w-4 h-4 text-[#C8DF52]" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-[#E5E7EB] bg-white flex items-center justify-between gap-4">
                <button
                  onClick={() => setDraftFilters({ status: [], roles: [], departments: [] })}
                  disabled={draftFilterCount === 0}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-md type-small font-medium transition-colors cursor-pointer",
                    draftFilterCount === 0 
                      ? "text-[#A3A3A3] cursor-not-allowed" 
                      : "text-[#161616] hover:bg-[#F4F4F5]"
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

      {/* Setup Prompt Modal */}
      <AnimatePresence>
        {showSetupPrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-2xl z-[70] p-6 text-center"
            >
              <div className="w-12 h-12 bg-[#F4F4F5] rounded-full flex items-center justify-center mx-auto mb-4 text-[#161616]">
                <Icon icon="hugeicons:tick-double-02" className="w-6 h-6" />
              </div>
              <h3 className="type-h3 text-[#161616] mb-2">Employee Created</h3>
              <p className="type-body-medium text-[#737373] mb-6">
                Would you like to continue setting up their profile, or keep it as a draft for now?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowSetupPrompt(false)
                    setIsAddModalOpen(false)
                    setNewEmployee({
                      fullName: '',
                      email: '',
                      empId: '',
                      phone: '',
                      departmentId: '',
                      designation: '',
                      role: 'EMPLOYEE',
                      joinDate: new Date().toISOString().split('T')[0]
                    })
                    toast.success('Proceeding to setup...')
                    if (createdEmployeeId) {
                      router.push(`/employees/${createdEmployeeId}/setup`)
                    }
                  }}
                  className="w-full bg-black hover:bg-neutral-800 text-white font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Continue Setup
                </button>
                <button
                  onClick={() => {
                    setShowSetupPrompt(false)
                    setIsAddModalOpen(false)
                    setNewEmployee({
                      fullName: '',
                      email: '',
                      empId: '',
                      phone: '',
                      departmentId: '',
                      designation: '',
                      role: 'EMPLOYEE',
                      joinDate: new Date().toISOString().split('T')[0]
                    })
                  }}
                  className="w-full bg-white hover:bg-[#F4F4F5] text-[#161616] border border-[#E5E7EB] font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Keep as Draft
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 p-6 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#F4F4F5] rounded-xl text-black">
                    <Icon icon="hugeicons:user-add-01" className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="type-h2 text-[#161616]">Add New Employee</h2>
                    <p className="type-caption text-[#737373]">Enter employee details to onboard</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 hover:bg-[#F4F4F5] rounded-lg transition-colors text-[#737373] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleAddEmployeeSubmit} className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1">
                <div>
                  <label className="type-body-medium text-[#161616] block mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Icon icon="hugeicons:user-circle" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B8B8B]" />
                    <input
                      type="text"
                      required
                      value={newEmployee.fullName}
                      onChange={(e) => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl type-small text-[#161616] focus:outline-none focus:border-[#C8DF52] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="type-body-medium text-[#161616] block mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Icon icon="hugeicons:mail-01" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B8B8B]" />
                      <input
                        type="email"
                        required
                        value={newEmployee.email}
                        onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl type-small text-[#161616] focus:outline-none focus:border-[#C8DF52] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="type-body-medium text-[#161616] block mb-1.5">
                      Employee Code / ID
                    </label>
                    <div className="relative">
                      <Icon icon="lucide:id-card" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B8B8B]" />
                      <input
                        type="text"
                        value={newEmployee.empId}
                        onChange={(e) => setNewEmployee({ ...newEmployee, empId: e.target.value })}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl type-small text-[#161616] focus:outline-none focus:border-[#C8DF52] focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="type-body-medium text-[#161616] block mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative flex items-center">
                      <Icon icon="hugeicons:call" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B8B8B] z-10" />
                      <div className="absolute left-10 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10 pointer-events-none">
                        <span className="text-[#161616] type-small font-medium">+65</span>
                        <div className="w-px h-4 bg-[#E5E7EB]"></div>
                      </div>
                      <input
                        type="tel"
                        value={newEmployee.phone}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '').slice(0, 8);
                          const formatted = raw.length > 4 ? `${raw.slice(0, 4)} ${raw.slice(4)}` : raw;
                          setNewEmployee({ ...newEmployee, phone: formatted });
                        }}
                        className="w-full pl-[84px] pr-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl type-small text-[#161616] focus:outline-none focus:border-[#C8DF52] focus:bg-white transition-all"
                        placeholder="XXXX XXXX"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="type-body-medium text-[#161616] block mb-1.5">
                      Department
                    </label>
                    <FormDropdown
                      options={departmentsList
                        .filter((d: any) => !d.department_name.toLowerCase().includes('admin'))
                        .map((d: any) => ({ value: d.id, label: d.department_name }))}
                      value={newEmployee.departmentId}
                      onChange={(val) => setNewEmployee({ ...newEmployee, departmentId: val })}
                      placeholder="Select Department"
                      icon="lucide:building-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="type-body-medium text-[#161616] block mb-1.5">
                      Designation / Job Title
                    </label>
                    <FormDropdown
                      options={[
                        { value: 'Software Engineer', label: 'Software Engineer' },
                        { value: 'Senior Designer', label: 'Senior Designer' },
                        { value: 'Product Manager', label: 'Product Manager' },
                        { value: 'HR Manager', label: 'HR Manager' },
                        { value: 'Sales Executive', label: 'Sales Executive' },
                        { value: 'Accountant', label: 'Accountant' }
                      ]}
                      value={newEmployee.designation}
                      onChange={(val) => setNewEmployee({ ...newEmployee, designation: val })}
                      placeholder="Select Designation"
                      icon="hugeicons:briefcase-02"
                    />
                  </div>

                  <div>
                    <label className="type-body-medium text-[#161616] block mb-1.5">
                      App Role
                    </label>
                    <FormDropdown
                      options={appRoleOptions}
                      value={newEmployee.role}
                      onChange={(val) => setNewEmployee({ ...newEmployee, role: val })}
                      placeholder="Select Role"
                      icon="hugeicons:shield-01"
                    />
                  </div>
                </div>

                <div>
                  <label className="type-body-medium text-[#161616] block mb-1.5">
                    Date of Joining
                  </label>
                  <FormDatePicker
                    value={newEmployee.joinDate}
                    onChange={(val) => setNewEmployee({ ...newEmployee, joinDate: val })}
                    placeholder="Select Date"
                    icon="hugeicons:calendar-03"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 rounded-full border border-[#E5E7EB] type-body-medium font-medium text-[#616161] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white type-body-medium font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Icon icon="hugeicons:loading-02" className="w-4 h-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Create Employee</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Site Access Drawer */}
      <AnimatePresence>
        {isSiteAccessPanelOpen && siteAccessEmp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSiteAccessPanelOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white border border-[#E5E7EB] rounded-md text-black">
                    <Icon icon="hugeicons:door-01" className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="type-h2 text-[#161616]">Site Access</h2>
                    <p className="type-caption text-[#737373]">Manage access for {siteAccessEmp.fullName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSiteAccessPanelOpen(false)}
                  className="p-2 hover:bg-[#F4F4F5] rounded-md transition-colors text-[#737373] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAFAFA]">
                
                <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col gap-1">
                      <span className="type-body-medium font-semibold text-[#161616]">Access All Sites</span>
                      <span className="type-small text-[#737373]">Allow access to all company sites</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={siteAccessEmp.rawCustomFields?.all_sites_access === true}
                        onChange={(e) => {
                          const updated = { ...siteAccessEmp.rawCustomFields, all_sites_access: e.target.checked }
                          if (e.target.checked) updated.site_ids = [] // clear specific sites if all is checked
                          setSiteAccessEmp({ ...siteAccessEmp, rawCustomFields: updated })
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                    </label>
                  </div>
                  {siteAccessEmp.rawCustomFields?.all_sites_access && (
                    <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2">
                      <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-700 font-medium">{siteAccessEmp.fullName} has access to all sites.</span>
                    </div>
                  )}
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] flex flex-col gap-3">
                  <h3 className="type-body-medium font-semibold text-[#161616]">Specific Sites</h3>
                  <p className="type-small text-[#737373] mb-2">Select the individual sites this employee can access.</p>
                  
                  {companySites.length === 0 ? (
                    <div className="py-4 text-center text-[#737373] type-small border border-dashed border-[#E5E7EB] rounded-lg">
                      No sites have been added to the company yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {companySites.map((site: any) => {
                        const isAllSites = siteAccessEmp.rawCustomFields?.all_sites_access === true
                        const isChecked = isAllSites || (siteAccessEmp.rawCustomFields?.site_ids || []).includes(site.id)
                        
                        return (
                          <label key={site.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isAllSites ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-100' : 'cursor-pointer hover:bg-gray-50 border-[#E5E7EB]'}`}>
                            <div className="flex flex-col gap-0.5">
                              <span className="type-small font-medium text-[#161616]">{site.name}</span>
                            </div>
                            <input 
                              type="checkbox"
                              disabled={isAllSites}
                              className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                              checked={isChecked}
                              onChange={(e) => {
                                if (isAllSites) return
                                const currentIds = siteAccessEmp.rawCustomFields?.site_ids || []
                                const newIds = e.target.checked 
                                  ? [...currentIds, site.id]
                                  : currentIds.filter((id: string) => id !== site.id)
                                setSiteAccessEmp({
                                  ...siteAccessEmp,
                                  rawCustomFields: { ...siteAccessEmp.rawCustomFields, site_ids: newIds }
                                })
                              }}
                            />
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>

              <div className="p-6 border-t border-[#E5E7EB] bg-white flex justify-end gap-3">
                <button
                  onClick={() => setIsSiteAccessPanelOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 text-[#161616] font-medium type-body-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={isSavingSiteAccess}
                  onClick={async () => {
                    setIsSavingSiteAccess(true)
                    try {
                      const { error } = await supabase
                        .from('employees')
                        .update({ custom_fields: siteAccessEmp.rawCustomFields })
                        .eq('id', siteAccessEmp.id)
                      
                      if (error) throw error
                      toast.success('Site access updated successfully')
                      queryClient.invalidateQueries({ queryKey: ['employees'] })
                      setIsSiteAccessPanelOpen(false)
                    } catch (e: any) {
                      toast.error('Failed to update site access: ' + e.message)
                    } finally {
                      setIsSavingSiteAccess(false)
                    }
                  }}
                  className="px-6 py-2.5 rounded-full bg-black text-white font-medium type-body-medium hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingSiteAccess ? <Icon icon="hugeicons:loading-01" className="w-4 h-4 animate-spin" /> : <Icon icon="hugeicons:floppy-disk" className="w-4 h-4" />}
                  Save Access
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Site Pass Drawer */}
      <AnimatePresence>
        {isSitePassPanelOpen && sitePassEmp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSitePassPanelOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F4F4F5] border border-[#E5E7EB] rounded-md text-black">
                    <Icon icon="lucide:id-card" className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="type-h2 text-[#161616]">Site Pass Assignment</h2>
                    <p className="type-caption text-[#737373]">Assign a site pass for {sitePassEmp.fullName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSitePassPanelOpen(false)}
                  className="p-2 hover:bg-[#F4F4F5] rounded-md transition-colors text-[#737373] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAFAFA]">
                
                <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] flex flex-col gap-4">
                  <div>
                    <label className="type-small font-semibold text-[#161616] block mb-1.5">Select Site</label>
                    <FormDropdown
                      value={sitePassForm.siteId}
                      onChange={(val) => setSitePassForm({ ...sitePassForm, siteId: val })}
                      placeholder="Choose a site"
                      options={companySites.map((s: any) => ({ value: s.id, label: s.name }))}
                      icon="hugeicons:location-01"
                    />
                  </div>
                  <div>
                    <label className="type-small font-semibold text-[#161616] block mb-1.5">Start Date</label>
                    <FormDatePicker
                      value={sitePassForm.startDate}
                      onChange={(val) => setSitePassForm({ ...sitePassForm, startDate: val })}
                      placeholder="Select start date"
                      icon="hugeicons:calendar-03"
                    />
                  </div>
                  <div>
                    <label className="type-small font-semibold text-[#161616] block mb-1.5">End Date (Optional)</label>
                    <FormDatePicker
                      value={sitePassForm.endDate}
                      onChange={(val) => setSitePassForm({ ...sitePassForm, endDate: val })}
                      placeholder="Select end date"
                      icon="hugeicons:calendar-03"
                    />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] flex flex-col gap-3">
                  <h3 className="type-body-medium font-semibold text-[#161616]">Current Site Passes</h3>
                  <div className="space-y-2">
                    {!(sitePassEmp.rawCustomFields?.site_passes?.length > 0) ? (
                      <div className="py-4 text-center text-[#737373] type-small border border-dashed border-[#E5E7EB] rounded-lg">
                        No passes assigned yet.
                      </div>
                    ) : (
                      sitePassEmp.rawCustomFields.site_passes.map((pass: any, index: number) => (
                        <div key={index} className="p-3 border border-[#E5E7EB] rounded-lg flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="type-small font-medium">{pass.site_name}</span>
                            <span className="text-xs text-[#737373]">
                              {formatDate(pass.start_date)} - {pass.end_date ? formatDate(pass.end_date) : 'No Expiry'}
                            </span>
                          </div>
                          <button 
                            onClick={async () => {
                              try {
                                const newPasses = sitePassEmp.rawCustomFields.site_passes.filter((_: any, i: number) => i !== index)
                                const updatedCustomFields = { ...sitePassEmp.rawCustomFields, site_passes: newPasses }
                                
                                const { error } = await supabase
                                  .from('employees')
                                  .update({ custom_fields: updatedCustomFields })
                                  .eq('id', sitePassEmp.id)
                                
                                if (error) throw error
                                
                                setSitePassEmp({ ...sitePassEmp, rawCustomFields: updatedCustomFields })
                                toast.success('Site pass removed')
                                queryClient.invalidateQueries({ queryKey: ['employees'] })
                              } catch (e: any) {
                                toast.error('Failed to remove pass: ' + e.message)
                              }
                            }}
                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                          >
                            <Icon icon="hugeicons:delete-01" className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-[#E5E7EB] bg-white flex justify-end gap-3">
                <button
                  onClick={() => setIsSitePassPanelOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 text-[#161616] font-medium type-body-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={isSavingSitePass || !sitePassForm.siteId}
                  onClick={async () => {
                    setIsSavingSitePass(true)
                    try {
                      const siteName = companySites.find((s: any) => s.id === sitePassForm.siteId)?.name || 'Unknown Site'
                      const newPass = {
                        site_id: sitePassForm.siteId,
                        site_name: siteName,
                        start_date: sitePassForm.startDate,
                        end_date: sitePassForm.endDate || null,
                        created_at: new Date().toISOString()
                      }
                      
                      const currentPasses = sitePassEmp.rawCustomFields?.site_passes || []
                      const updatedCustomFields = { 
                        ...sitePassEmp.rawCustomFields, 
                        site_passes: [...currentPasses, newPass] 
                      }

                      const { error } = await supabase
                        .from('employees')
                        .update({ custom_fields: updatedCustomFields })
                        .eq('id', sitePassEmp.id)
                      
                      if (error) throw error
                      toast.success('Site pass assigned successfully')
                      queryClient.invalidateQueries({ queryKey: ['employees'] })
                      setIsSitePassPanelOpen(false)
                      // Reset form
                      setSitePassForm({ siteId: '', startDate: new Date().toISOString().split('T')[0], endDate: '' })
                    } catch (e: any) {
                      toast.error('Failed to assign site pass: ' + e.message)
                    } finally {
                      setIsSavingSitePass(false)
                    }
                  }}
                  className="px-6 py-2.5 rounded-full bg-black text-white font-medium type-body-medium hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingSitePass ? <Icon icon="hugeicons:loading-01" className="w-4 h-4 animate-spin" /> : <Icon icon="hugeicons:floppy-disk" className="w-4 h-4" />}
                  Assign Pass
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}



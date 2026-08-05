"use client"

import React, { useState } from 'react'
import { Search, SlidersHorizontal, Check, X } from 'lucide-react'
import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { CreateDepartmentDialog } from '../components/CreateDepartmentDialog'

export function DepartmentsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Fetch departments
  const { data: departments = [], isLoading: loadingDepts } = useQuery({
    queryKey: ['departments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('department_name')
      if (error) throw error
      return data || []
    },
    enabled: !!user?.id
  })

  // Fetch employees to get counts and designations per department
  const { data: employees = [], isLoading: loadingEmps } = useQuery({
    queryKey: ['employees', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, department_id, designation, is_active')
      if (error) throw error
      return data || []
    },
    enabled: !!user?.id
  })

  // Filter departments
  const filteredDepts = departments.filter((dept) => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true
    return dept.department_name.toLowerCase().includes(query)
  })

  const isLoading = loadingDepts || loadingEmps

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
            <h1 className="type-h1 text-black">Departments</h1>
            <p className="type-body text-[#737373]">Your company departments</p>
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

        {/* Hero Banner Area */}
        <div className="flex flex-col px-4 md:px-5 relative z-40">
          <div className="bg-[#F6F5F5] rounded-[24px] border border-[#E5E7EB] flex flex-col md:flex-row justify-between items-center p-4 md:p-6 mb-4 mt-2 gap-6 relative z-10 overflow-hidden">
            {/* Left Illustration */}
            <div className="flex-shrink-0 relative w-[200px] md:w-[320px] self-stretch -my-4 md:-my-6 -ml-4 md:-ml-6 pl-6 md:pl-10 pointer-events-none flex items-end">
              <img 
                src="/assets/depratment_va.svg" 
                alt="Department Illustration" 
                className="w-full h-full object-contain object-left-bottom scale-[1.1] origin-bottom-left"
              />
            </div>
            
            {/* Right Stats */}
            <div className="flex flex-col items-end gap-2 w-full md:w-auto relative z-20">
              <div className="flex flex-col items-end -translate-y-[15px] relative z-30">
                <span className="type-body text-[#737373]">Manage Your Company Departments</span>
                <h2 className="type-h2 text-black mt-1">Chumma Department</h2>
              </div>
              
              <div className="bg-[#C8DF52] rounded-[14px] px-6 py-3 w-full md:w-auto flex items-center justify-between md:justify-start gap-5 md:gap-8 scale-[1.15] md:scale-[1.3] transform-gpu origin-right translate-y-[10px] relative z-10 border border-[#b5c94a]">
                <div className="type-caption text-black flex items-center gap-1.5">
                  Total Employees : <span className="type-small font-semibold">{employees.length}</span>
                </div>
                <div className="type-caption text-black flex items-center gap-1.5">
                  Local : <span className="type-small font-semibold">5</span>
                </div>
                <div className="type-caption text-black flex items-center gap-1.5">
                  Foreign : <span className="type-small font-semibold">5</span>
                </div>
                <div className="type-caption text-black flex items-center gap-1.5">
                  Temporary : <span className="type-small font-semibold">5</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar Row */}
        <div className="px-4 md:px-5 mt-6 mb-6 relative z-40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Left: Search Bar */}
          <div className="relative w-full md:w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Departments"
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-full type-small text-[#161616] placeholder:text-[#8B8B8B] focus:outline-none focus:border-[#C8DF52] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)] h-[42px]"
            />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 bg-black hover:bg-neutral-800 text-white type-small font-medium px-5 py-2 rounded-full transition-colors h-[42px] shadow-sm cursor-pointer"
            >
              <Icon icon="hugeicons:building-03" className="w-4 h-4" />
              <span>Create Department</span>
            </button>
            <button className="h-[42px] w-[42px] flex items-center justify-center bg-[#F4F4F5] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-full text-[#616161] transition-colors cursor-pointer shrink-0">
              <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

        </div>

        {/* Department Cards Grid */}
        <div className="px-4 md:px-5 pb-12 relative z-40">
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Icon icon="hugeicons:loading-02" className="w-8 h-8 text-[#8B8B8B] animate-spin mb-3" />
              <p className="type-small font-medium text-[#161616]">Loading departments...</p>
            </div>
          ) : filteredDepts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-[#E5E7EB] rounded-[24px] bg-white">
              <div className="w-10 h-10 rounded-full bg-[#F4F4F5] flex items-center justify-center mb-2.5">
                <Icon icon="hugeicons:building-04" className="w-5 h-5 text-[#8B8B8B]" />
              </div>
              <p className="type-small font-medium text-[#161616] mb-1">No departments found</p>
              <p className="type-caption text-[#737373]">Try a different search term or create a new department.</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6 items-start">
              {filteredDepts.map((dept, index) => {
                // Get employees for this dept
                const deptEmps = employees.filter(e => e.department_id === dept.id)
                // Get unique designations
                const uniqueDesignations = Array.from(new Set(deptEmps.map(e => e.designation).filter(Boolean)))
                
                // Dynamic Colors from DB with fallback
                const fallbackThemes = [
                  { bg: '#FBE0CD', accent: '#F9863E' },
                  { bg: '#D1F2E0', accent: '#00C978' },
                  { bg: '#E3D6F5', accent: '#00C978' },
                ]
                const fallbackTheme = fallbackThemes[index % fallbackThemes.length]
                const cardBg = dept.theme_bg || fallbackTheme.bg
                const cardAccent = dept.theme_accent || fallbackTheme.accent
                
                // Format Date: Use new created_date if available, fallback to created_at
                const createdDate = new Date(dept.created_date || dept.created_at || new Date()).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })

                // Alternating categories for realism based on the screenshot
                const categories = ["Administration", "Site Inspection", "Inspection"]
                const category = categories[index % categories.length]

                return (
                  <div key={dept.id} className="rounded-[32px] border border-[#E5E7EB] bg-white flex flex-col p-2.5 shadow-none">
                    {/* Top Colored Section */}
                    <div className="px-6 pt-6 pb-8 flex flex-col min-h-[300px] rounded-[24px]" style={{ backgroundColor: cardBg }}>
                      
                      {/* Header Row */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="bg-white rounded-[24px] px-5 py-2.5 type-body font-medium text-[#161616]">
                          {createdDate}
                        </div>
                        <button className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-[#161616] hover:bg-neutral-50 transition-colors cursor-pointer shrink-0">
                          <Icon icon="hugeicons:bookmark-02" className="w-6 h-6" />
                        </button>
                      </div>

                      {/* Department Title */}
                      <div className="flex flex-col mb-5 mt-8">
                        <span className="type-body text-[#161616] mb-2 font-medium">{category}</span>
                        <h3 className="type-h2 text-[#161616] truncate text-[22px] font-semibold leading-tight">{dept.department_name}</h3>
                      </div>

                      {/* Designations Pills */}
                      <div className="flex flex-wrap items-center gap-2.5 mt-auto">
                        {uniqueDesignations.slice(0, 3).map((desig, i) => (
                          <span key={i} className="type-caption font-medium px-4 py-1.5 rounded-full border border-black/10 text-black/70 whitespace-nowrap">
                            {desig as string}
                          </span>
                        ))}
                        {uniqueDesignations.length > 3 && (
                          <span className="type-caption font-medium px-4 py-1.5 rounded-full whitespace-nowrap text-black" style={{ backgroundColor: cardAccent }}>
                            +{uniqueDesignations.length - 3} Designations
                          </span>
                        )}
                        {uniqueDesignations.length === 0 && (
                          <span className="type-caption font-medium px-4 py-1.5 rounded-full border border-black/10 text-black/70 whitespace-nowrap">
                            No designations
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom White Section */}
                    <div className="bg-white px-5 py-4 pt-6 flex items-center justify-between">
                      <div className="flex flex-col justify-center">
                        <span className="type-h2 text-[#161616]">{deptEmps.length} Employees</span>
                      </div>
                      <button 
                        onClick={() => router.push(`/departments/${dept.id}`)}
                        className="bg-black hover:bg-neutral-800 text-white rounded-full px-7 py-2.5 type-body-medium font-medium transition-colors cursor-pointer"
                      >
                        View
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
      
      <CreateDepartmentDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
      />
    </div>
  )
}

"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@iconify/react'
import { Search } from 'lucide-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { useCompanyStore } from '@/store/useCompanyStore'
import { supabase } from '@/lib/supabase'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuthStore()
  const { company, fetchCompany } = useCompanyStore()

  useEffect(() => {
    const initCompany = async () => {
      let currentUserId = user?.id
      let currentUserEmail = user?.email
      
      if (!currentUserId) {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          currentUserId = authUser.id
          currentUserEmail = authUser.email
        }
      }
      
      if (currentUserId) {
        fetchCompany(currentUserId, currentUserEmail)
      }
    }
    initCompany()
  }, [user, fetchCompany])

  // Define navigation categories
  const categories = [
    {
      title: 'YOUR PREFERENCES',
      items: [
        { label: 'Personal Details', href: '/settings/profile', icon: 'hugeicons:user' },
      ]
    },
    {
      title: 'COMPANY',
      items: [
        { label: 'Employee Settings', href: '/settings/employees', icon: 'hugeicons:user-group' },
        { label: 'Department Settings', href: '/settings/departments', icon: 'hugeicons:building-03' },
        { label: 'Attendance Settings', href: '/settings/attendance', icon: 'hugeicons:calendar-03' },
      ]
    },
    {
      title: 'APP SETTINGS',
      items: [
        { label: 'Roles and Access', href: '/settings/roles', icon: 'hugeicons:key-01' },
        { label: 'Storage Settings', href: '/settings/storage', icon: 'hugeicons:hard-drive' },
        { label: 'Notifications', href: '/settings/notifications', icon: 'hugeicons:notification-03' },
      ]
    }
  ]

  const isItemActive = (href: string) => {
    if (pathname === href) return true
    if (href === '/settings/employees') {
      return (
        pathname.startsWith('/settings/employees') ||
        pathname.startsWith('/settings/leave') ||
        pathname.startsWith('/settings/claims') ||
        pathname.startsWith('/settings/overtime')
      )
    }
    if (href === '/settings/departments') {
      return pathname.startsWith('/settings/departments')
    }
    if (href === '/settings/attendance') {
      return pathname.startsWith('/settings/attendance')
    }
    if (href === '/settings/roles') {
      return pathname.startsWith('/settings/roles')
    }
    if (href === '/settings/company') {
      return pathname.startsWith('/settings/company')
    }
    return pathname.startsWith(href)
  }

  const isCompanyActive = isItemActive('/settings/company')
  const isSubscriptionsActive = isItemActive('/settings/subscriptions')

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col h-full w-full overflow-hidden bg-transparent font-sans relative rounded-[24px]">
        {/* Map Portal Container */}
        <div id="settings-map-portal" className="absolute top-0 right-0 bottom-0 left-[360px] z-[45] pointer-events-none" />
      
      {/* Top Header Bar */}
      <div className="flex items-center h-[72px] bg-white shrink-0 z-50">
        <div className="w-[360px] px-6 h-full flex items-center border-r border-[#E5E7EB] shrink-0">
          <h1 className="text-[28px] font-medium text-[#111827] tracking-tight font-sans">
            Settings
          </h1>
        </div>
        <div className="flex-1 px-8 flex items-center justify-end h-full">
          <img 
            src="/app_logos/xentra_black_logo_with_text.svg" 
            alt="xentra" 
            className="h-7 w-auto select-none"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative z-40">
        {/* Sidebar */}
        <aside className="w-[360px] bg-white border-r border-[#E5E7EB] flex flex-col h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          
          {/* Header & Search */}
          <div className="px-6 pt-6 pb-5 sticky top-0 bg-white z-10">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B8B8B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search settings..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-[10px] type-small text-[#161616] placeholder:text-[#8B8B8B] focus:outline-none focus:border-[#C8DF52] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)] h-[38px]"
              />
            </div>
          </div>

        <div className="px-6 pb-8 flex flex-col gap-6">
          
          {/* Company Management Card */}
          <div className="bg-[#F9FAFB] rounded-[20px] border border-[#E5E7EB] p-5 flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="mb-3 flex items-center h-[34px]">
              <img src="/app_logos/DortAsiaLogo.svg" alt="Dort Asia" className="max-h-[34px] w-auto object-contain" />
            </div>
            
            <h3 className="type-h2 font-semibold text-[#161616] mb-1.5">Company Management</h3>
            <p className="type-small text-[#737373] leading-relaxed mb-4">
              Manage your workspace identity, company information, and global directory settings.
            </p>
            
            <div className="flex flex-col gap-1">
              <Link 
                href="/settings/company" 
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[12px] type-body-medium transition-colors",
                  isCompanyActive
                    ? "bg-[#F4F4F5] text-black font-medium"
                    : "text-[#737373] hover:bg-black/5 hover:text-black"
                )}
              >
                <Icon 
                  icon="hugeicons:building-03" 
                  className={cn("w-[18px] h-[18px]", isCompanyActive ? "text-black" : "text-[#8B8B8B]")} 
                />
                <span className="type-body-medium font-medium">Company Profile</span>
              </Link>
              <Link 
                href="/settings/subscriptions" 
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[12px] type-body-medium transition-colors",
                  isSubscriptionsActive
                    ? "bg-[#F4F4F5] text-black font-medium"
                    : "text-[#737373] hover:bg-black/5 hover:text-black"
                )}
              >
                <Icon 
                  icon="hugeicons:credit-card" 
                  className={cn("w-[18px] h-[18px]", isSubscriptionsActive ? "text-black" : "text-[#8B8B8B]")} 
                />
                <span className="type-body-medium font-medium">Subscriptions</span>
              </Link>
            </div>
          </div>

          {/* Navigation Categories */}
          {categories.map((category, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="type-caption font-medium text-[#A3A3A3] uppercase tracking-wider mb-2 px-2">
                {category.title}
              </span>
              <div className="flex flex-col gap-0.5">
                {category.items.map((item) => {
                  const isActive = isItemActive(item.href)
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-[12px] type-body-medium transition-colors',
                        isActive
                          ? 'bg-[#F4F4F5] text-black font-medium'
                          : 'text-[#737373] hover:bg-black/5 hover:text-black'
                      )}
                    >
                      <Icon 
                        icon={item.icon} 
                        className={cn("w-[18px] h-[18px]", isActive ? "text-black" : "text-[#737373]")} 
                      />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#F9FAFB] p-8 md:p-12">
        <div className="max-w-4xl">
          {children}
        </div>
      </main>
      </div>
    </div>
    </QueryClientProvider>
  )
}

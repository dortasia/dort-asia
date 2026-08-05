import React from 'react'
import { motion } from 'motion/react'
import { useAuthStore } from '@/store/useAuthStore'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : ''
  const [activeTab, setActiveTab] = React.useState('overview')

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      return { text: 'Good Morning', emoji: '⛅' }
    } else if (hour >= 12 && hour < 17) {
      return { text: 'Good Afternoon', emoji: '☀️' }
    } else if (hour >= 17 && hour < 21) {
      return { text: 'Good Evening', emoji: '🌅' }
    } else {
      return { text: 'Good Night', emoji: '🌙' }
    }
  }

  const greeting = getGreeting()

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'hugeicons:dashboard-square-01' },
    { id: 'requests', label: 'Requests', icon: 'lucide:send' },
    { id: 'pending', label: 'Pending Progress', icon: 'hugeicons:clock-01' },
  ]

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-full overflow-hidden"
    >
      {/* Top Black Card (Header + Hero) */}
      <div className="relative bg-[#0A0A0A] text-white rounded-[20px] md:rounded-[25px] border border-white/10 p-4 md:p-5 shrink-0 overflow-hidden mb-6 shadow-none">
        
        {/* Background decorative SVG elements (curves and dots) */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <svg width="100%" height="100%" viewBox="0 0 1000 300" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 300C100 200 250 150 250 50" stroke="white" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.2"/>
            <path d="M800 300C800 250 850 200 950 200C1050 200 1100 150 1100 50" stroke="white" strokeWidth="1" strokeOpacity="0.3"/>
            <path d="M0 100C150 100 200 200 350 200" stroke="white" strokeWidth="1" strokeOpacity="0.1"/>
            {/* Dots */}
            <circle cx="50" cy="150" r="2" fill="white" fillOpacity="0.2"/>
            <circle cx="70" cy="150" r="2" fill="white" fillOpacity="0.2"/>
            <circle cx="90" cy="150" r="2" fill="white" fillOpacity="0.2"/>
            <circle cx="110" cy="150" r="2" fill="white" fillOpacity="0.2"/>
            <circle cx="50" cy="170" r="2" fill="white" fillOpacity="0.2"/>
            <circle cx="70" cy="170" r="2" fill="white" fillOpacity="0.2"/>
            <circle cx="90" cy="170" r="2" fill="white" fillOpacity="0.2"/>
            <circle cx="110" cy="170" r="2" fill="white" fillOpacity="0.2"/>
            {/* Triangle */}
            <path d="M750 180L760 160L770 180Z" stroke="white" strokeWidth="1" strokeOpacity="0.3"/>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col gap-[72px] md:gap-20">
          {/* Header Row */}
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-0">
              <h1 className="type-h1 text-white">Home</h1>
              <p className="type-body text-[#737373]">your company dashboard</p>
            </div>
            {/* Xentra Logo */}
            <div className="flex items-center">
              <img 
                src="/app_logos/xentra_white_logo_with_text.svg" 
                alt="xentra" 
                className="h-7 w-auto select-none"
              />
            </div>
          </div>

          {/* Hero Row */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="type-h1 text-white flex items-center gap-2 flex-wrap">
                {greeting.text}{firstName ? ` ${firstName}` : ''}
                <span className="text-[28px] ml-1 leading-none inline-flex">{greeting.emoji}</span>
              </h2>
              <p className="type-body text-[#A3A3A3]">
                Have a great day!
              </p>
            </div>

            {/* Tabs Pill Bar with Liquid Glass Effect */}
            <div className="bg-[#1C1C1E]/80 backdrop-blur-xl border border-white/10 rounded-[24px] p-2 flex items-center gap-1.5 shadow-lg overflow-x-auto max-w-full relative">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative flex items-center gap-2.5 px-6 py-3 rounded-[18px] transition-colors duration-200 whitespace-nowrap shrink-0 z-10 select-none",
                      isActive ? "type-body-medium text-white" : "type-body text-[#8E8E93] hover:text-white"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="liquidGlassPill"
                        className="absolute inset-0 rounded-[18px] bg-gradient-to-b from-white/15 via-white/10 to-white/5 border border-white/15 backdrop-blur-xl -z-10"
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                    <Icon 
                      icon={tab.icon} 
                      className={cn(
                        "w-[20px] h-[20px] transition-colors duration-200", 
                        isActive ? "text-white" : "text-[#8E8E93]"
                      )} 
                    />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6 px-1">
        {/* Date Display */}
        <div className="flex items-center gap-2.5 px-4 py-2 bg-[#F4F4F5] border border-black/5 rounded-full text-[#52525B] select-none">
          <Icon icon="hugeicons:calendar-03" className="w-[20px] h-[20px] text-black" />
          <span className="type-small font-medium">{currentDate}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-2.5 px-4 py-2 bg-[#F4F4F5] hover:bg-[#E4E4E7] border border-black/5 rounded-full text-[#18181B] transition-colors">
            <Icon icon="hugeicons:city-02" className="w-[20px] h-[20px]" />
            <span className="type-small font-semibold">Create Department</span>
          </button>
          <button className="flex items-center gap-2.5 px-4 py-2 bg-[#F4F4F5] hover:bg-[#E4E4E7] border border-black/5 rounded-full text-[#18181B] transition-colors">
            <Icon icon="hugeicons:user-add-02" className="w-[20px] h-[20px]" />
            <span className="type-small font-semibold">Add Employee</span>
          </button>
        </div>
      </div>

      {/* Bottom Area */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar flex flex-col gap-6">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Stat Card 1 */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-[#F4F4F5] rounded-xl">
                <Icon icon="hugeicons:user-group" className="w-6 h-6 text-[#161616]" />
              </div>
              <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Icon icon="lucide:arrow-up-right" className="w-3 h-3" />
                12%
              </span>
            </div>
            <h3 className="text-[#737373] text-sm font-medium mb-1">Total Employees</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-[#161616]">248</span>
              <span className="text-xs text-[#A3A3A3]">Active across 4 sites</span>
            </div>
          </div>

          {/* Stat Card 2 */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-[#C8DF52]/20 rounded-xl">
                <Icon icon="hugeicons:clock-03" className="w-6 h-6 text-[#8CA035]" />
              </div>
            </div>
            <h3 className="text-[#737373] text-sm font-medium mb-1">On-Time Attendance</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-[#161616]">94.2%</span>
              <span className="text-xs text-[#A3A3A3]">This week</span>
            </div>
          </div>

          {/* Stat Card 3 */}
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-2xl p-5 shadow-sm relative overflow-hidden text-white">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#C8DF52] rounded-full blur-[60px] opacity-20 pointer-events-none"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="p-2.5 bg-[#27272A] rounded-xl border border-white/10">
                <Icon icon="hugeicons:task-01" className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                12 Pending
              </span>
            </div>
            <h3 className="text-[#A3A3A3] text-sm font-medium mb-1 relative z-10">Pending Approvals</h3>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-3xl font-semibold text-white">12</span>
              <span className="text-xs text-[#737373]">Requires your action</span>
            </div>
          </div>
        </div>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pb-8">
          
          {/* Left Column: Recent Activity */}
          <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="font-semibold text-[#161616] flex items-center gap-2">
                <Icon icon="hugeicons:notification-03" className="w-5 h-5 text-[#737373]" />
                Recent Activity
              </h3>
              <button className="text-sm font-medium text-[#737373] hover:text-[#161616] transition-colors">
                View All
              </button>
            </div>
            <div className="p-0">
              {[
                { name: 'Sarah Tan', role: 'Senior Supervisor', action: 'clocked in at', target: 'Marina Bay Sands', time: '10 mins ago', icon: 'hugeicons:login-03', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { name: 'Alex Wong', role: 'Project Lead', action: 'submitted a new', target: 'Leave Request', time: '1 hour ago', icon: 'hugeicons:calendar-03', color: 'text-amber-500', bg: 'bg-amber-50' },
                { name: 'Dinesh VC', role: 'Manager', action: 'updated the', target: 'Site Access Policy', time: '2 hours ago', icon: 'hugeicons:shield-01', color: 'text-blue-500', bg: 'bg-blue-50' },
                { name: 'Rachel Lee', role: 'Operations Lead', action: 'approved', target: '3 Timesheets', time: '5 hours ago', icon: 'hugeicons:tick-double-02', color: 'text-[#8CA035]', bg: 'bg-[#C8DF52]/20' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors cursor-pointer group">
                  <div className={cn("p-2 rounded-full shrink-0", item.bg)}>
                    <Icon icon={item.icon} className={cn("w-4 h-4", item.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#161616] leading-tight mb-1">
                      <span className="font-medium">{item.name}</span> {item.action} <span className="font-medium">{item.target}</span>
                    </p>
                    <p className="text-xs text-[#8B8B8B]">{item.time}</p>
                  </div>
                  <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icon icon="lucide:chevron-right" className="w-4 h-4 text-[#A3A3A3]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Quick Links & Summary */}
          <div className="flex flex-col gap-5">
            {/* Quick Actions */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-5">
              <h3 className="font-semibold text-[#161616] flex items-center gap-2 mb-4">
                <Icon icon="lucide:zap" className="w-5 h-5 text-[#737373]" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Export Report', icon: 'hugeicons:download-01' },
                  { label: 'Manage Sites', icon: 'hugeicons:building-03' },
                  { label: 'Site Pass', icon: 'lucide:id-card' },
                  { label: 'Settings', icon: 'hugeicons:settings-01' },
                ].map((action, i) => (
                  <button key={i} className="flex flex-col items-center justify-center gap-2 p-3 bg-[#F4F4F5] hover:bg-[#E5E7EB] rounded-xl transition-colors text-[#161616] group">
                    <Icon icon={action.icon} className="w-5 h-5 text-[#737373] group-hover:text-[#161616] transition-colors" />
                    <span className="text-xs font-medium text-center">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Attendance Summary Mini Chart */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-5 flex-1">
               <h3 className="font-semibold text-[#161616] flex items-center gap-2 mb-4">
                <Icon icon="lucide:bar-chart-2" className="w-5 h-5 text-[#737373]" />
                Today's Overview
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-[#737373]">Present</span>
                    <span className="font-medium text-[#161616]">186</span>
                  </div>
                  <div className="w-full bg-[#F4F4F5] rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-[#737373]">Absent / Leave</span>
                    <span className="font-medium text-[#161616]">24</span>
                  </div>
                  <div className="w-full bg-[#F4F4F5] rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: '10%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-[#737373]">Late</span>
                    <span className="font-medium text-[#161616]">38</span>
                  </div>
                  <div className="w-full bg-[#F4F4F5] rounded-full h-2 overflow-hidden">
                    <div className="bg-red-400 h-full rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </motion.div>
  )
}

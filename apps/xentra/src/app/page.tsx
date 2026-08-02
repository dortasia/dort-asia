"use client";

import React, { useState } from 'react';
import { 
  Notification01Icon, 
  UserIcon,
  Diamond01Icon,
  MagicWand01Icon,
  ToggleOffIcon,
  CheckmarkCircle01Icon,
  Logout01Icon,
  Luggage01Icon,
  Calendar03Icon
} from 'hugeicons-react';
import { useAuthStore } from '@/store/useAuthStore';
import { getAvatarUrl } from '@/lib/utils';

export default function Home() {
  const { user } = useAuthStore();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[28px] font-medium text-[#111827] tracking-tight font-sans">
          Home
        </h1>

        {/* Right Header Icons: Notification & Profile */}
        <div className="flex items-center gap-4">
          {/* Notification Bell & Menu Wrapper */}
          <div className="relative">
            <button 
              onClick={() => {
                setIsNotificationMenuOpen(!isNotificationMenuOpen);
                if (isProfileMenuOpen) setIsProfileMenuOpen(false);
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-700 hover:bg-gray-200/50 transition-colors focus:outline-none"
            >
              <Notification01Icon size={24} />
              <span className="absolute -top-1 -right-1 flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#FF3B30] px-1 text-[11px] font-bold text-white shadow-sm font-rounded">
                +9
              </span>
            </button>

            {/* Notification Dropdown Menu */}
            {isNotificationMenuOpen && (
              <div className="absolute right-0 mt-3 w-[380px] rounded-[24px] bg-white border border-gray-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] p-4.5 z-50 font-sans text-gray-900">

                <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto page-scrollbar pr-1">
                  {[
                    { 
                      title: 'New Leave Request', 
                      desc: 'Sarah submitted a sick leave request', 
                      time: '10m ago', 
                      icon: <Luggage01Icon size={20} strokeWidth={1.5} className="text-gray-700" />
                    },
                    { 
                      title: 'Claim Approval', 
                      desc: 'Krishna submitted a travel expense claim', 
                      time: '1h ago', 
                      icon: <UserIcon size={20} strokeWidth={1.5} className="text-gray-700" />
                    },
                    { 
                      title: 'Company Update', 
                      desc: 'New policy update published by HR', 
                      time: '3h ago', 
                      icon: <Notification01Icon size={20} strokeWidth={1.5} className="text-gray-700" />
                    },
                    { 
                      title: 'System Alert', 
                      desc: 'Monthly storage cleanup completed', 
                      time: '5h ago', 
                      icon: <CheckmarkCircle01Icon size={20} strokeWidth={1.5} className="text-gray-700" />
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl flex gap-3.5 items-start hover:bg-gray-100/70 transition-colors cursor-pointer">
                      <div className="mt-0.5 shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-[14px] font-semibold text-[#111827] font-sans truncate">{item.title}</span>
                          <span className="text-[11px] text-[#9CA3AF] font-sans shrink-0 ml-2">{item.time}</span>
                        </div>
                        <p className="text-[12px] font-medium text-[#6B7280] font-sans mt-0.5 leading-snug truncate">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-gray-100 mt-2 text-center">
                  <button className="text-[12px] font-normal text-[#007AFF] font-sans hover:underline">View all notifications</button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Menu Wrapper */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFEFEF] border border-gray-200/80 hover:ring-2 hover:ring-gray-200 transition-all focus:outline-none overflow-hidden shrink-0"
            >
              <img 
                src={getAvatarUrl(user?.fullName, user?.avatarUrl)} 
                alt={user?.fullName || "User Profile"} 
                className="h-full w-full object-cover" 
              />
            </button>

            {/* Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-3 w-[240px] rounded-[24px] bg-white border border-gray-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] p-2 z-50 font-sans font-medium text-gray-900">
                <div className="flex flex-col gap-0.5">
                  <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100/70 transition-colors text-left w-full">
                    <UserIcon size={20} strokeWidth={1.5} className="text-gray-700" />
                    <span className="text-[15px]">Profile</span>
                  </button>
                  <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100/70 transition-colors text-left w-full">
                    <Diamond01Icon size={20} strokeWidth={1.5} className="text-gray-700" />
                    <span className="text-[15px]">Subscription</span>
                  </button>
                  <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-100/70 hover:bg-gray-100 transition-colors text-left w-full">
                    <MagicWand01Icon size={20} strokeWidth={1.5} className="text-gray-900" />
                    <span className="text-[15px] text-gray-900">Inspirations</span>
                  </button>
                  <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100/70 transition-colors text-left w-full">
                    <ToggleOffIcon size={20} strokeWidth={1.5} className="text-gray-700" />
                    <span className="text-[15px]">Settings</span>
                  </button>
                  
                  <div className="h-[1px] bg-gray-100 my-1.5 mx-2"></div>
                  
                  <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100/70 transition-colors text-left w-full">
                    <CheckmarkCircle01Icon size={20} strokeWidth={1.5} className="text-gray-700" />
                    <span className="text-[15px]">Updates</span>
                  </button>
                  <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100/70 transition-colors text-left w-full">
                    <Logout01Icon size={20} strokeWidth={1.5} className="text-gray-700" />
                    <span className="text-[15px]">Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-[25px] border border-[#E5E7EB] p-5 flex flex-col justify-between w-full h-[160px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
          <p className="mt-4 text-[14px] font-medium text-[#111827] tracking-normal font-sans">Total Employees</p>
          <div className="flex items-baseline gap-0.5 mt-6">
            <span className="text-[38px] font-medium leading-none tracking-tight text-[#111827] font-rounded">28</span>
            <span className="text-[22px] font-medium text-[#6B7280] font-rounded">/50</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-[25px] border border-[#E5E7EB] p-5 flex flex-col justify-between w-full h-[160px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
          <p className="mt-4 text-[14px] font-medium text-[#111827] tracking-normal font-sans">Storage Used</p>
          <div className="flex items-baseline gap-0.5 mt-6">
            <span className="text-[38px] font-medium leading-none tracking-tight text-[#111827] font-rounded">98</span>
            <span className="text-[22px] font-medium text-[#6B7280] font-rounded">/100 GB</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-[25px] border border-[#E5E7EB] p-5 flex flex-col justify-between w-full h-[160px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
          <p className="mt-4 text-[14px] font-medium text-[#111827] tracking-normal font-sans">Total Departments</p>
          <div className="flex items-baseline gap-0.5 mt-6">
            <span className="text-[38px] font-medium leading-none tracking-tight text-[#111827] font-rounded">10</span>
            <span className="text-[22px] font-medium text-[#6B7280] font-rounded">/15</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-[25px] border border-[#E5E7EB] p-5 flex flex-col justify-between w-full h-[160px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
          <p className="mt-4 text-[14px] font-medium text-[#111827] tracking-normal font-sans">Company Alerts</p>
          <div className="flex items-baseline gap-0.5 mt-6">
            <span className="text-[38px] font-medium leading-none tracking-tight text-[#111827] font-rounded">23</span>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white rounded-[25px] border border-[#E5E7EB] p-5 flex flex-col justify-between w-full h-[160px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
          <p className="mt-4 text-[14px] font-medium text-[#111827] tracking-normal font-sans">Requests For you</p>
          <div className="flex items-baseline gap-0.5 mt-6">
          </div>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-4 h-full">
        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Claims, Leave, and Pending Profiles Row */}
          <div className="flex flex-wrap lg:flex-nowrap gap-4">
        {/* Claims Card */}
        <div className="relative bg-white rounded-[25px] border border-[#E5E7EB] p-4 flex flex-col justify-between w-[140px] h-[150px] flex-shrink-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] overflow-hidden">
          <p className="mt-0 text-[14px] font-medium text-[#111827] tracking-normal font-sans z-10">Claims</p>
          <img 
            src="/icons/claim_illustration.svg" 
            alt="Claims" 
            className="absolute bottom-0 right-0 w-[84px] h-[84px] object-contain select-none pointer-events-none"
          />
        </div>

        {/* Leave Card */}
        <div className="relative bg-white rounded-[25px] border border-[#E5E7EB] p-4 flex flex-col justify-between w-[140px] h-[150px] flex-shrink-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] overflow-hidden">
          <p className="mt-0 text-[14px] font-medium text-[#111827] tracking-normal font-sans z-10">Leave</p>
          <img 
            src="/icons/leave_illsutration.svg" 
            alt="Leave" 
            className="absolute bottom-0 right-0 w-[102px] h-[102px] object-contain select-none pointer-events-none"
          />
        </div>

        {/* Pending Profiles Card */}
        <div className="bg-white rounded-[25px] border border-[#E5E7EB] p-5 flex flex-col justify-between flex-1 h-[150px] min-w-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
          <p className="mt-0 text-[14px] font-medium text-[#111827] tracking-normal font-sans">Pending Profiles</p>
          <div className="flex items-center gap-4 overflow-x-auto pb-1 page-scrollbar">
            {[
              { name: 'Krishna', progress: 85 },
              { name: 'Sarah', progress: 65 },
              { name: 'Alex', progress: 40 },
              { name: 'David', progress: 20 },
              { name: 'Emma', progress: 90 },
              { name: 'Michael', progress: 55 },
              { name: 'Sophia', progress: 35 },
              { name: 'James', progress: 15 },
              { name: 'Olivia', progress: 78 },
              { name: 'Daniel', progress: 60 },
            ].map((profile, index) => {
              const radius = 25;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (profile.progress / 100) * circumference;
              
              let strokeColor = '#22C55E'; // Green (>=75%)
              if (profile.progress < 30) {
                strokeColor = '#EF4444'; // Red (<30%)
              } else if (profile.progress < 50) {
                strokeColor = '#F59E0B'; // Orange (30-49%)
              } else if (profile.progress < 75) {
                strokeColor = '#EAB308'; // Yellow (50-74%)
              }

              return (
                <div key={index} className="flex flex-col items-center flex-shrink-0">
                  <div className="relative w-[56px] h-[56px] flex items-center justify-center">
                    {/* Circular SVG Progress Ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
                      {/* Track Ring */}
                      <circle
                        cx="28"
                        cy="28"
                        r={radius}
                        stroke="#F3F4F6"
                        strokeWidth="3"
                        fill="none"
                      />
                      {/* Progress Ring */}
                      <circle
                        cx="28"
                        cy="28"
                        r={radius}
                        stroke={strokeColor}
                        strokeWidth="3"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="none"
                        className="transition-all duration-500 ease-out"
                      />
                    </svg>
                    {/* Inner Avatar - Instagram Style */}
                    <div className="w-10 h-10 rounded-full bg-[#EFEFEF] z-10 overflow-hidden flex items-center justify-center border border-white">
                      <svg viewBox="0 0 24 24" fill="#C7C7C7" className="w-full h-full scale-125 translate-y-[2px]">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  </div>
                  <span className="text-[12px] font-medium text-[#374151] mt-1 font-sans">{profile.name}</span>
                </div>
              );
            })}
          </div>
        </div>
        </div>
        
        {/* Table Container */}
        <div className="bg-white rounded-[25px] border border-[#E5E7EB] flex-1 min-h-[300px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
          {/* Table Header Bar - Full Width Top Header */}
          <div className="bg-[#F8FAFC] border-b border-[#E5E7EB] px-8 py-4 flex items-center text-[14px] font-medium text-[#374151] font-sans">
            <div className="w-[20%]">Employee</div>
            <div className="w-[20%]">Request type</div>
            <div className="w-[20%]">Detail</div>
            <div className="w-[20%]">Applied date</div>
            <div className="w-[20%]">Approval From</div>
          </div>
          {/* Table Content Body */}
          <div className="flex-1 bg-white p-8 flex items-center justify-center text-gray-400 text-[14px] font-sans">
            No pending requests
          </div>
        </div>
      </div>

      {/* Right Column: Activity Card */}
      <div className="w-full lg:w-[350px] xl:w-[380px] bg-white rounded-[25px] border border-[#E5E7EB] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] flex flex-col shrink-0">
        {/* Activity Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <p className="text-[18px] font-medium text-[#111827] font-sans tracking-normal">Activity</p>
            <p className="text-[14px] font-normal text-[#374151] font-sans mt-0.5 tracking-normal">Attendance activity of employee</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-full text-[13px] font-medium text-[#111827] font-sans hover:bg-gray-50 transition-colors">
            <Calendar03Icon size={18} strokeWidth={1.8} />
            Last 7 Days
          </button>
        </div>

        {/* Bar Chart */}
        <div 
          className="relative h-[200px] mb-10 flex items-end justify-between px-1 overflow-visible"
          onMouseLeave={() => setHoveredBarIndex(null)}
        >
          {/* Dynamic Dashed Line on Hover — behind all bars */}
          {hoveredBarIndex !== null && (() => {
            const pcts = [0.60, 0.45, 0.70, 1.00, 0.30, 0.60, 0.45];
            const labelGap = 28; // label height + gap
            const barAreaH = 200 - labelGap;
            const lineBottom = Math.round(pcts[hoveredBarIndex] * barAreaH) + labelGap;
            const hours = ['32 hours', '24 hours', '38 hours', '42 hours', '18 hours', '30 hours', '22 hours'];
            return (
              <>
                {/* Dashed line at bar top */}
                <div 
                  className="absolute left-0 right-0 pointer-events-none z-0 transition-none"
                  style={{ bottom: lineBottom }}
                >
                  <div className="border-t border-dashed border-gray-300 w-full"></div>
                </div>
                {/* Hours badge — positioned above right edge, outside clip */}
                <div 
                  className="absolute pointer-events-none z-30 transition-none"
                  style={{ bottom: lineBottom - 10, right: -4 }}
                >
                  <div className="bg-[#374151] text-white text-[10px] font-medium px-2 py-0.5 rounded-md shadow-md whitespace-nowrap">
                    {hours[hoveredBarIndex]}
                  </div>
                </div>
              </>
            );
          })()}
          
          {[
            { day: 'Mon', h: 0.60, active: false },
            { day: 'Tue', h: 0.45, active: false },
            { day: 'Wed', h: 0.70, active: false },
            { day: 'Thu', h: 1.00, active: true  },
            { day: 'Fri', h: 0.30, active: false },
            { day: 'Sat', h: 0.60, active: false },
            { day: 'Sun', h: 0.45, active: false },
          ].map((col, i) => {
            const labelGap = 28;
            const barAreaH = 200 - labelGap;
            const barH = Math.round(col.h * barAreaH);
            return (
              <div 
                key={i} 
                className="flex flex-col items-center gap-2 z-10 w-[36px] h-full justify-end cursor-pointer"
                onMouseEnter={() => setHoveredBarIndex(i)}
              >
                <div 
                  className={`w-full rounded-[8px] transition-colors duration-200 ${
                    hoveredBarIndex === i 
                      ? 'bg-[#007AFF]' 
                      : col.active && hoveredBarIndex === null 
                      ? 'bg-[#007AFF]' 
                      : 'bg-[#EAF2FF]'
                  }`} 
                  style={{ height: barH }}
                ></div>
                <span className={`text-[11px] font-medium font-sans transition-colors ${hoveredBarIndex === i ? 'text-[#007AFF]' : 'text-[#6B7280]'}`}>{col.day}</span>
              </div>
            );
          })}
        </div>

        {/* Top Performers */}
        <div>
          <p className="text-[16px] font-medium text-[#111827] mb-4 font-sans tracking-normal">Top Performers</p>
          <div className="border border-[#E5E7EB] rounded-[20px] p-4 flex flex-col gap-4">
            {[1, 2, 3, 4, 5].map((rank) => (
              <div key={rank} className="flex items-center gap-3 relative pb-4 last:pb-0">
                {rank !== 5 && <div className="absolute bottom-0 left-[44px] right-0 border-b border-gray-100"></div>}
                <div className={`text-[12px] font-bold w-5 ${rank === 1 ? 'text-[#F59E0B]' : 'text-[#6B7280]'}`}>#{rank}</div>
                <div className="w-8 h-8 rounded-full bg-[#EFEFEF] overflow-hidden shrink-0 border border-gray-200/60 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="#C7C7C7" className="w-full h-full scale-125 translate-y-[2px]">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-[16px] font-medium text-[#111827] font-sans leading-tight">KrishnaKumar</div>
                  <div className="text-[12px] font-medium text-[#9CA3AF] font-sans mt-0.5">Senior HR</div>
                </div>
                <div className="text-[12px] font-medium text-[#22C55E] font-sans">35hrs</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

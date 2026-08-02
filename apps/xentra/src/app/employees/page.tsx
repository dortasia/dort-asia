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
  Search01Icon,
  FilterIcon,
  UserAdd01Icon,
  Mail01Icon,
  Calendar03Icon
} from 'hugeicons-react';

interface Employee {
  id: string;
  name: string;
  department: string;
  designation: string;
  appRole: string;
  email: string;
  phone: string;
  joiningDate: string;
  status: 'Active' | 'Inactive' | 'Need Setup';
}

const EMPLOYEES_DATA: Employee[] = [
  { id: 'EMP-101', name: 'KrishnaKumar', department: 'HR', designation: 'Senior HR Specialist', appRole: 'Admin', email: 'krishna@xentra.io', phone: '+1 (555) 234-5678', joiningDate: '12 Jan 2023', status: 'Active' },
  { id: 'EMP-102', name: 'Sarah Jenkins', department: 'Design', designation: 'Lead Product Designer', appRole: 'Manager', email: 'sarah.j@xentra.io', phone: '+1 (555) 345-6789', joiningDate: '05 Mar 2022', status: 'Active' },
  { id: 'EMP-103', name: 'Alex Rivera', department: 'Engineering', designation: 'Staff Software Engineer', appRole: 'Employee', email: 'alex.r@xentra.io', phone: '+1 (555) 456-7890', joiningDate: '18 Nov 2021', status: 'Active' },
  { id: 'EMP-104', name: 'David Chen', department: 'Engineering', designation: 'Senior Infrastructure Eng', appRole: 'Employee', email: 'david.c@xentra.io', phone: '+1 (555) 567-8901', joiningDate: '01 Jun 2023', status: 'Need Setup' },
  { id: 'EMP-105', name: 'Emma Watson', department: 'Marketing', designation: 'Head of Growth Marketing', appRole: 'Manager', email: 'emma.w@xentra.io', phone: '+1 (555) 678-9012', joiningDate: '14 Feb 2024', status: 'Active' },
  { id: 'EMP-106', name: 'Michael Scott', department: 'Management', designation: 'Regional Business Director', appRole: 'Admin', email: 'michael.s@xentra.io', phone: '+1 (555) 789-0123', joiningDate: '10 Aug 2020', status: 'Active' },
  { id: 'EMP-107', name: 'Sophia Martinez', department: 'Engineering', designation: 'Senior QA Analyst', appRole: 'Employee', email: 'sophia.m@xentra.io', phone: '+1 (555) 890-1234', joiningDate: '22 Apr 2024', status: 'Need Setup' },
  { id: 'EMP-108', name: 'James Wilson', department: 'Product', designation: 'Group Product Manager', appRole: 'Manager', email: 'james.w@xentra.io', phone: '+1 (555) 901-2345', joiningDate: '09 Sep 2022', status: 'Inactive' },
];

import { useAuthStore } from '@/store/useAuthStore';
import { getAvatarUrl } from '@/lib/utils';

export default function EmployeesPage() {
  const { user } = useAuthStore();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeSortMenu, setActiveSortMenu] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered employees list
  let filteredEmployees = EMPLOYEES_DATA.filter((emp) => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.appRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  if (sortColumn) {
    filteredEmployees = [...filteredEmployees].sort((a, b) => {
      let valA = (a as any)[sortColumn] || '';
      let valB = (b as any)[sortColumn] || '';

      if (sortColumn === 'joiningDate') {
        valA = new Date(valA).getTime() || 0;
        valB = new Date(valB).getTime() || 0;
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const renderSortHeader = (key: string, label: string, width: string) => {
    const isSorted = sortColumn === key || (key === 'name' && sortColumn === 'id');
    const isOpen = activeSortMenu === key;

    let ascLabel = 'Sort Ascending (A to Z)';
    let descLabel = 'Sort Descending (Z to A)';

    if (key === 'joiningDate') {
      ascLabel = 'Newest First';
      descLabel = 'Oldest First';
    } else if (key === 'phone') {
      ascLabel = 'Ascending (0 - 9)';
      descLabel = 'Descending (9 - 0)';
    }

    return (
      <div className={`relative ${width}`}>
        <div 
          onClick={() => setActiveSortMenu(isOpen ? null : key)}
          className={`flex items-center gap-1.5 cursor-pointer hover:text-gray-900 select-none ${isSorted ? 'text-[#007AFF]' : ''}`}
        >
          <span>{label}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 transition-colors ${isSorted ? 'text-[#007AFF]' : 'text-gray-400'}`}>
            <path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/>
          </svg>
        </div>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-[210px] rounded-[18px] bg-white border border-[#E5E7EB] shadow-lg p-1.5 z-50 text-[#111827] font-medium text-[13px]">
            {key === 'name' ? (
              <>
                <button 
                  onClick={() => { setSortColumn('name'); setSortOrder('asc'); setActiveSortMenu(null); }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left w-full transition-colors ${sortColumn === 'name' && sortOrder === 'asc' ? 'bg-blue-50 text-[#007AFF]' : 'hover:bg-gray-100/70'}`}
                >
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                    <span>Name (A to Z)</span>
                  </div>
                  {sortColumn === 'name' && sortOrder === 'asc' && <span className="text-[12px] font-bold">✓</span>}
                </button>
                <button 
                  onClick={() => { setSortColumn('name'); setSortOrder('desc'); setActiveSortMenu(null); }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left w-full transition-colors ${sortColumn === 'name' && sortOrder === 'desc' ? 'bg-blue-50 text-[#007AFF]' : 'hover:bg-gray-100/70'}`}
                >
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                    <span>Name (Z to A)</span>
                  </div>
                  {sortColumn === 'name' && sortOrder === 'desc' && <span className="text-[12px] font-bold">✓</span>}
                </button>
                <div className="h-[1px] bg-gray-100 my-1"></div>
                <button 
                  onClick={() => { setSortColumn('id'); setSortOrder('desc'); setActiveSortMenu(null); }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left w-full transition-colors ${sortColumn === 'id' && sortOrder === 'desc' ? 'bg-blue-50 text-[#007AFF]' : 'hover:bg-gray-100/70'}`}
                >
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                    <span>ID (Newest to Oldest)</span>
                  </div>
                  {sortColumn === 'id' && sortOrder === 'desc' && <span className="text-[12px] font-bold">✓</span>}
                </button>
                <button 
                  onClick={() => { setSortColumn('id'); setSortOrder('asc'); setActiveSortMenu(null); }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left w-full transition-colors ${sortColumn === 'id' && sortOrder === 'asc' ? 'bg-blue-50 text-[#007AFF]' : 'hover:bg-gray-100/70'}`}
                >
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                    <span>ID (Oldest to Newest)</span>
                  </div>
                  {sortColumn === 'id' && sortOrder === 'asc' && <span className="text-[12px] font-bold">✓</span>}
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => { setSortColumn(key); setSortOrder('asc'); setActiveSortMenu(null); }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left w-full transition-colors ${isSorted && sortOrder === 'asc' ? 'bg-blue-50 text-[#007AFF]' : 'hover:bg-gray-100/70'}`}
                >
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                    <span>{ascLabel}</span>
                  </div>
                  {isSorted && sortOrder === 'asc' && <span className="text-[12px] font-bold">✓</span>}
                </button>

                <button 
                  onClick={() => { setSortColumn(key); setSortOrder('desc'); setActiveSortMenu(null); }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left w-full transition-colors ${isSorted && sortOrder === 'desc' ? 'bg-blue-50 text-[#007AFF]' : 'hover:bg-gray-100/70'}`}
                >
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                    <span>{descLabel}</span>
                  </div>
                  {isSorted && sortOrder === 'desc' && <span className="text-[12px] font-bold">✓</span>}
                </button>
              </>
            )}

            {isSorted && (
              <>
                <div className="h-[1px] bg-gray-100 my-1"></div>
                <button 
                  onClick={() => { setSortColumn(null); setActiveSortMenu(null); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100/70 text-left w-full text-gray-500 text-[12px] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  <span>Reset Sort</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-medium text-[#111827] tracking-tight font-sans">
          Employees
        </h1>

        {/* Right Header Icons: Notification & Profile */}
        <div className="flex items-center gap-4">
          {/* Notification Bell & Menu */}
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
                    { title: 'New Onboarding Completed', desc: 'Sarah completed her profile setup', time: '10m ago', icon: <UserAdd01Icon size={20} strokeWidth={1.5} className="text-gray-700" /> },
                    { title: 'Employee Status Changed', desc: 'David Chen status updated to Need Setup', time: '1h ago', icon: <UserIcon size={20} strokeWidth={1.5} className="text-gray-700" /> },
                    { title: 'Department Policy Update', desc: 'New policy update published by HR', time: '3h ago', icon: <Notification01Icon size={20} strokeWidth={1.5} className="text-gray-700" /> },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl flex gap-3.5 items-start hover:bg-gray-100/70 transition-colors cursor-pointer">
                      <div className="mt-0.5 shrink-0">{item.icon}</div>
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

          {/* User Profile Avatar & Menu */}
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

            {/* Profile Dropdown */}
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

      {/* Main Container */}
      <div className="flex flex-col gap-6">
        {/* Controls Row: Search + Filter on Left, Onboard Button on Right */}
        <div className="flex items-center justify-between w-full">
          {/* Left Group: Search Bar Pill & Circular Filter Button */}
          <div className="flex items-center gap-3">
            {/* Search Input Pill */}
            <div className="relative w-[340px]">
              <Search01Icon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="Search Employees"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-full text-[14px] font-normal text-[#111827] focus:outline-none focus:border-[#007AFF] transition-colors placeholder:text-gray-400"
              />
            </div>

            {/* Circular Filter Button */}
            <button 
              onClick={() => setSelectedDept(selectedDept === 'Engineering' ? 'All' : 'Engineering')}
              className={`flex items-center justify-center w-11 h-11 bg-white border border-[#E5E7EB] rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors ${selectedDept !== 'All' ? 'border-[#007AFF] text-[#007AFF] bg-blue-50/40' : ''}`}
              title="Filter Employees"
            >
              {/* Modern Sliders Filter Icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 21v-7" />
                <path d="M4 10V3" />
                <path d="M12 21v-9" />
                <path d="M12 8V3" />
                <path d="M20 21v-5" />
                <path d="M20 12V3" />
                <path d="M1 14h6" />
                <path d="M9 8h6" />
                <path d="M17 16h6" />
              </svg>
            </button>
          </div>

          {/* Right Group: Onboard Employee Button */}
          <button 
            onClick={() => setIsOnboardModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#007AFF] text-white rounded-full text-[14px] font-medium hover:bg-blue-600 transition-colors"
          >
            <UserAdd01Icon size={18} />
            Onboard Employee
          </button>
        </div>

        {/* Employees Table Card */}
        <div className="bg-white rounded-[20px] border border-[#E5E7EB] overflow-visible flex flex-col">
          {/* Table Header Bar with Sort Dropdown Menus */}
          <div className="bg-[#EBEFF5] px-6 py-3 flex items-center text-[13px] font-semibold text-[#4B5563] rounded-t-[20px]">
            {renderSortHeader('name', 'Employee', 'w-[20%]')}
            {renderSortHeader('department', 'Department', 'w-[17%]')}
            {renderSortHeader('appRole', 'App Role', 'w-[11%]')}
            {renderSortHeader('email', 'Email', 'w-[19%]')}
            {renderSortHeader('phone', 'Phone Number', 'w-[13%]')}
            {renderSortHeader('joiningDate', 'Join Date', 'w-[9%]')}
            {renderSortHeader('status', 'Status', 'w-[8%]')}

            {/* Actions Header */}
            <div className="w-[5%] text-right font-semibold text-[#4B5563]">
              Actions
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <div key={emp.id} className="px-6 py-4 flex items-center text-[14px] hover:bg-gray-50/80 transition-colors group">
                  {/* Employee & ID */}
                  <div className="w-[20%] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#E5E7EB] border border-gray-200/80 flex items-center justify-center shrink-0 overflow-hidden">
                      <svg viewBox="0 0 24 24" fill="#9CA3AF" className="w-6 h-6 scale-110 translate-y-[2px]">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[14px] font-semibold text-[#111827] truncate leading-tight">{emp.name}</p>
                      <span className="inline-block text-[11px] font-medium text-[#4B5563] font-rounded bg-gray-100 px-1.5 py-0.5 rounded mt-0.5">
                        {emp.id}
                      </span>
                    </div>
                  </div>

                  {/* Department & Designation Underneath */}
                  <div className="w-[17%] overflow-hidden pr-2">
                    <p className="text-[14px] font-semibold text-[#111827] truncate leading-tight">{emp.department}</p>
                    <p className="text-[12px] text-[#6B7280] font-normal truncate mt-0.5">{emp.designation}</p>
                  </div>

                  {/* App Role */}
                  <div className="w-[11%]">
                    <span className={`px-2.5 py-1 rounded-md text-[12px] font-medium inline-block ${
                      emp.appRole === 'Admin' ? 'bg-purple-50 text-purple-700 border border-purple-200/60' :
                      emp.appRole === 'Manager' ? 'bg-blue-50 text-blue-700 border border-blue-200/60' :
                      'bg-gray-100 text-gray-700 border border-gray-200/60'
                    }`}>
                      {emp.appRole}
                    </span>
                  </div>

                  {/* Email + Copy Icon */}
                  <div className="w-[19%] truncate flex items-center gap-1.5 pr-2">
                    <span className="truncate text-[14px] text-[#111827] font-medium font-sans">{emp.email}</span>
                    <button 
                      onClick={() => handleCopy(emp.email, `email-${emp.id}`)}
                      className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-200/70 shrink-0"
                      title="Copy Email"
                    >
                      {copiedId === `email-${emp.id}` ? (
                        <CheckmarkCircle01Icon size={13} className="text-green-600" />
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Phone Number + Copy Icon */}
                  <div className="w-[13%] text-[#111827] text-[14px] font-medium font-rounded truncate flex items-center gap-1.5 pr-2">
                    <span className="truncate">{emp.phone}</span>
                    <button 
                      onClick={() => handleCopy(emp.phone, `phone-${emp.id}`)}
                      className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-200/70 shrink-0"
                      title="Copy Phone Number"
                    >
                      {copiedId === `phone-${emp.id}` ? (
                        <CheckmarkCircle01Icon size={13} className="text-green-600" />
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Join Date */}
                  <div className="w-[9%] text-[#111827] text-[14px] font-medium font-rounded">
                    {emp.joiningDate}
                  </div>

                  {/* Status */}
                  <div className="w-[8%]">
                    <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium whitespace-nowrap inline-block ${
                      emp.status === 'Active' ? 'bg-[#E6F4EA] text-[#22C55E]' :
                      emp.status === 'Need Setup' ? 'bg-[#FEF3C7] text-[#D97706]' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {emp.status}
                    </span>
                  </div>

                  {/* Actions Column with Dropdown */}
                  <div className="w-[5%] relative flex items-center justify-end">
                    <button 
                      onClick={() => setActiveActionMenuId(activeActionMenuId === emp.id ? null : emp.id)}
                      className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      title="Employee Actions"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                      </svg>
                    </button>

                    {/* Actions Dropdown Menu */}
                    {activeActionMenuId === emp.id && (
                      <div className="absolute right-0 top-8 w-[160px] bg-white rounded-2xl border border-[#E5E7EB] shadow-lg p-1.5 z-50 flex flex-col gap-0.5 text-[13px] font-medium text-gray-700">
                        <button 
                          onClick={() => setActiveActionMenuId(null)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 text-left w-full transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                          View Details
                        </button>
                        <button 
                          onClick={() => setActiveActionMenuId(null)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 text-left w-full transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Edit Employee
                        </button>
                        <div className="h-[1px] bg-gray-100 my-1"></div>
                        <button 
                          onClick={() => setActiveActionMenuId(null)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 text-left w-full transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          Deactivate
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-400 text-[14px]">
                No employees found matching your search.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Onboard Employee Modal */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] border border-[#E5E7EB] w-full max-w-[500px] p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-[18px] font-semibold text-[#111827]">Onboard New Employee</h3>
              <button 
                onClick={() => setIsOnboardModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-2.5 rounded-full border border-[#E5E7EB] text-[14px] focus:outline-none focus:border-[#007AFF]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2.5 rounded-full border border-[#E5E7EB] text-[14px] font-rounded focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="john.doe@xentra.io"
                    className="w-full px-4 py-2.5 rounded-full border border-[#E5E7EB] text-[14px] focus:outline-none focus:border-[#007AFF]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">App Role</label>
                  <select className="w-full px-4 py-2.5 rounded-full border border-[#E5E7EB] text-[14px] focus:outline-none focus:border-[#007AFF] bg-white">
                    <option>Employee</option>
                    <option>Manager</option>
                    <option>Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">Department</label>
                  <select className="w-full px-4 py-2.5 rounded-full border border-[#E5E7EB] text-[14px] focus:outline-none focus:border-[#007AFF] bg-white">
                    <option>Engineering</option>
                    <option>Design</option>
                    <option>HR</option>
                    <option>Marketing</option>
                    <option>Product</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">Designation</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Frontend Engineer"
                    className="w-full px-4 py-2.5 rounded-full border border-[#E5E7EB] text-[14px] focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 mt-2">
              <button 
                onClick={() => setIsOnboardModalOpen(false)}
                className="px-5 py-2 rounded-full border border-[#E5E7EB] text-[14px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setIsOnboardModalOpen(false)}
                className="px-6 py-2 rounded-full bg-[#007AFF] text-white text-[14px] font-medium hover:bg-blue-600 transition-colors"
              >
                Complete Onboarding
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

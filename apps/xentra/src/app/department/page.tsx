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
  UserAdd01Icon,
  Search01Icon,
  Building03Icon
} from 'hugeicons-react';
import { useAuthStore } from '@/store/useAuthStore';
import { getAvatarUrl } from '@/lib/utils';

interface Department {
  id: string;
  category: string;
  name: string;
  date: string;
  bgColor: string;
  accentColor: string;
  designations: string[];
  extraDesignationsCount: number;
  employeeCount: number;
  location: string;
}

const DEPARTMENTS_DATA: Department[] = [
  {
    id: 'dept-1',
    category: 'Administration',
    name: 'HR Department',
    date: '29 Jan, 2026',
    bgColor: '#FDE9E7',
    accentColor: '#D94841',
    designations: ['Senior HR', 'Assistant HR', 'Admin', 'Junior HR', 'HR Trainee'],
    extraDesignationsCount: 9,
    employeeCount: 34,
    location: 'Main Office'
  },
  {
    id: 'dept-2',
    category: 'Site Inspection',
    name: 'Site Admin',
    date: '29 Jan, 2026',
    bgColor: '#EEF5E8',
    accentColor: '#4CAF50',
    designations: ['Senior Admin', 'Assistant Engineer', 'Superior Mg', 'Analyst'],
    extraDesignationsCount: 9,
    employeeCount: 34,
    location: 'Main Office'
  },
  {
    id: 'dept-3',
    category: 'Inspection',
    name: 'Employee Management',
    date: '29 Jan, 2026',
    bgColor: '#F3F0FF',
    accentColor: '#6D5BD0',
    designations: ['Senior Admin', 'Assistant Engineer', 'Superior Mg', 'Analyst'],
    extraDesignationsCount: 9,
    employeeCount: 34,
    location: 'Main Office'
  },
  {
    id: 'dept-4',
    category: 'Engineering',
    name: 'Tech & Product',
    date: '24 Jan, 2026',
    bgColor: '#EAF2FF',
    accentColor: '#3B82F6',
    designations: ['Frontend Dev', 'Backend Lead', 'UI/UX Designer', 'DevOps'],
    extraDesignationsCount: 6,
    employeeCount: 42,
    location: 'Tech Hub'
  },
  {
    id: 'dept-5',
    category: 'Finance',
    name: 'Accounts & Audit',
    date: '18 Jan, 2026',
    bgColor: '#FFF3E4',
    accentColor: '#E67E22',
    designations: ['Senior Accountant', 'Tax Lead', 'Auditor', 'Financial Analyst'],
    extraDesignationsCount: 4,
    employeeCount: 18,
    location: 'Main Office'
  },
  {
    id: 'dept-6',
    category: 'Operations',
    name: 'Logistics & Supply',
    date: '12 Jan, 2026',
    bgColor: '#EAF8E5',
    accentColor: '#2E8B57',
    designations: ['Logistics Lead', 'Warehouse Manager', 'Fleet Admin'],
    extraDesignationsCount: 5,
    employeeCount: 29,
    location: 'North Depot'
  }
];

export default function DepartmentPage() {
  const { user } = useAuthStore();
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredDepartments = DEPARTMENTS_DATA.filter(dept => 
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.designations.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 font-sans pb-10">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-medium text-[#111827] tracking-tight font-sans">
          Departments
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
                    { title: 'New Department Created', desc: 'HR created a new Finance department', time: '10m ago', icon: <UserAdd01Icon size={20} strokeWidth={1.5} className="text-gray-700" /> },
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

      {/* Top Banner Row */}
      <div className="relative w-full h-[200px] bg-white border border-[#E5E7EB] rounded-[25px] flex items-center justify-between px-10 overflow-hidden mb-2">
        {/* Left Illustration */}
        <div className="absolute left-6 top-3 bottom-3 w-[400px] flex items-center justify-start pointer-events-none">
          <img 
            src="/illustrations/department_page_illus.svg"
            alt="Department Illustration"
            className="h-full w-full object-contain object-left"
          />
        </div>

        {/* Right Content */}
        <div className="flex flex-col items-end z-10 w-full">
          <p className="text-[16px] font-normal text-[#6B7280] tracking-normal">Manage Your Company Departments</p>
          <h2 className="text-[28px] font-medium text-[#111827] mt-0.5 tracking-tight">Chumma Deaprtment</h2>
          
          <div className="mt-5 bg-[#CBE455] rounded-[15px] px-8 py-3.5 flex items-center gap-12">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-[#111827]">Total Employees :</span>
              <span className="text-[16px] font-semibold text-[#111827] font-rounded">25</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-[#111827]">Local :</span>
              <span className="text-[16px] font-semibold text-[#111827] font-rounded">5</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-[#111827]">Foreign :</span>
              <span className="text-[16px] font-semibold text-[#111827] font-rounded">5</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-[#111827]">Temproary :</span>
              <span className="text-[16px] font-semibold text-[#111827] font-rounded">5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Row: Search Bar on Left, Create Dept + Filter on Right */}
      <div className="flex items-center justify-between w-full mt-6 mb-2">
        {/* Left: Search Input Pill */}
        <div className="relative w-[340px]">
          <Search01Icon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Search Departments"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-full text-[14px] font-normal text-[#111827] focus:outline-none focus:border-[#007AFF] transition-colors placeholder:text-gray-400"
          />
        </div>

        {/* Right Group: Create Department Black Pill + Circular Filter */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-[#111827] text-white rounded-full text-[14px] font-medium hover:bg-black transition-colors">
            <Building03Icon size={18} strokeWidth={1.8} />
            Create Department
          </button>

          <button 
            className="flex items-center justify-center w-11 h-11 bg-white border border-[#E5E7EB] rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            title="Filter Departments"
          >
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
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6 items-start w-full">
        {filteredDepartments.map((dept) => {
          const isBookmarked = bookmarkedIds.includes(dept.id);

          return (
            <div 
              key={dept.id}
              className="rounded-[32px] border border-[#E5E7EB] bg-white flex flex-col p-2.5 shadow-none w-full"
            >
              {/* Top Colored Section */}
              <div 
                className="px-6 pt-6 pb-8 flex flex-col min-h-[345px] rounded-[24px]"
                style={{ backgroundColor: dept.bgColor }}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-white rounded-[24px] px-5 py-2.5 text-[14px] font-medium text-[#161616]">
                    {dept.date}
                  </div>
                  <button 
                    onClick={() => toggleBookmark(dept.id)}
                    className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-[#161616] hover:bg-neutral-50 transition-colors cursor-pointer shrink-0"
                  >
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill={isBookmarked ? "#161616" : "none"} 
                      stroke="currentColor" 
                      strokeWidth="1.8" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                  </button>
                </div>

                {/* Content Row: Category & Title */}
                <div className="flex flex-col mb-5 mt-8">
                  <span className="text-[14px] text-[#161616] mb-2 font-medium">{dept.category}</span>
                  <h3 className="text-[22px] font-semibold text-[#161616] truncate leading-tight">{dept.name}</h3>
                </div>

                {/* Bottom Badges Row */}
                <div className="flex flex-wrap items-center gap-2.5 mt-auto">
                  {dept.designations.slice(0, 3).map((desig, i) => (
                    <span 
                      key={i}
                      className="text-[12px] font-medium px-4 py-1.5 rounded-full border border-black/10 text-black/70 whitespace-nowrap"
                    >
                      {desig}
                    </span>
                  ))}
                  {dept.designations.length > 3 && (
                    <span 
                      className="text-[12px] font-medium px-4 py-1.5 rounded-full whitespace-nowrap text-[#161616]"
                      style={{ backgroundColor: dept.accentColor }}
                    >
                      +{dept.extraDesignationsCount} Designations
                    </span>
                  )}
                  {dept.designations.length === 0 && (
                    <span className="text-[12px] font-medium px-4 py-1.5 rounded-full border border-black/10 text-black/70 whitespace-nowrap">
                      No designations
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom White Section */}
              <div className="bg-white px-5 py-4 pt-6 flex items-center justify-between">
                <div className="flex flex-col justify-center">
                  <span className="text-[22px] font-semibold text-[#161616]">{dept.employeeCount} Employees</span>
                  <span className="text-[14px] font-normal text-[#737373] mt-0.5">{dept.location}</span>
                </div>
                <button 
                  className="bg-[#F4F4F5] hover:bg-[#D4D4D8] text-[#161616] rounded-full px-7 py-2.5 text-[14px] font-medium transition-colors cursor-pointer"
                >
                  View
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

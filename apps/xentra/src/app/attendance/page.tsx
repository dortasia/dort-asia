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
  Calendar03Icon,
  Search01Icon,
  FilterIcon,
  Download01Icon,
  Clock01Icon,
  UserCheck01Icon,
  AlertCircleIcon,
  ArrowDown01Icon,
  File02Icon
} from 'hugeicons-react';

interface AttendanceRecord {
  id: string;
  name: string;
  role: string;
  department: string;
  checkIn: string;
  checkOut: string;
  workHours: string;
  status: 'Present' | 'Late' | 'On Leave' | 'Absent';
  isOnTime: boolean;
}

const ATTENDANCE_DATA: AttendanceRecord[] = [
  { id: 'EMP-101', name: 'KrishnaKumar', role: 'Senior HR', department: 'HR', checkIn: '08:52 AM', checkOut: '05:30 PM', workHours: '8h 38m', status: 'Present', isOnTime: true },
  { id: 'EMP-102', name: 'Sarah Jenkins', role: 'UI/UX Designer', department: 'Design', checkIn: '09:24 AM', checkOut: '06:00 PM', workHours: '8h 36m', status: 'Late', isOnTime: false },
  { id: 'EMP-103', name: 'Alex Rivera', role: 'Frontend Lead', department: 'Engineering', checkIn: '08:45 AM', checkOut: '05:15 PM', workHours: '8h 30m', status: 'Present', isOnTime: true },
  { id: 'EMP-104', name: 'David Chen', role: 'DevOps Engineer', department: 'Engineering', checkIn: '-', checkOut: '-', workHours: '0h 0m', status: 'On Leave', isOnTime: true },
  { id: 'EMP-105', name: 'Emma Watson', role: 'Marketing Lead', department: 'Marketing', checkIn: '08:58 AM', checkOut: '05:40 PM', workHours: '8h 42m', status: 'Present', isOnTime: true },
  { id: 'EMP-106', name: 'Michael Scott', role: 'Regional Manager', department: 'Management', checkIn: '09:45 AM', checkOut: '04:30 PM', workHours: '6h 45m', status: 'Late', isOnTime: false },
  { id: 'EMP-107', name: 'Sophia Martinez', role: 'QA Engineer', department: 'Engineering', checkIn: '08:50 AM', checkOut: '05:25 PM', workHours: '8h 35m', status: 'Present', isOnTime: true },
  { id: 'EMP-108', name: 'James Wilson', role: 'Product Manager', department: 'Product', checkIn: '-', checkOut: '-', workHours: '0h 0m', status: 'Absent', isOnTime: false },
];

interface MonthlyLogRecord {
  id: string;
  month: string;
  fy: string;
  fileName: string;
  totalRecords: string;
  fileSize: string;
  generatedDate: string;
  status: string;
}

const MONTHLY_LOGS_DATA: MonthlyLogRecord[] = [
  { id: 'ML-07-26', month: 'July 2026', fy: 'FY 2026-27', fileName: 'attendance_log_jul_2026.csv', totalRecords: '1,420 records', fileSize: '2.8 MB', generatedDate: 'Jul 31, 2026', status: 'Ready' },
  { id: 'ML-06-26', month: 'June 2026', fy: 'FY 2026-27', fileName: 'attendance_log_jun_2026.csv', totalRecords: '1,380 records', fileSize: '2.6 MB', generatedDate: 'Jun 30, 2026', status: 'Ready' },
  { id: 'ML-05-26', month: 'May 2026', fy: 'FY 2026-27', fileName: 'attendance_log_may_2026.csv', totalRecords: '1,410 records', fileSize: '2.7 MB', generatedDate: 'May 31, 2026', status: 'Ready' },
  { id: 'ML-04-26', month: 'April 2026', fy: 'FY 2026-27', fileName: 'attendance_log_apr_2026.csv', totalRecords: '1,350 records', fileSize: '2.5 MB', generatedDate: 'Apr 30, 2026', status: 'Ready' },
  { id: 'ML-03-26', month: 'March 2026', fy: 'FY 2025-26', fileName: 'attendance_log_mar_2026.csv', totalRecords: '1,450 records', fileSize: '2.9 MB', generatedDate: 'Mar 31, 2026', status: 'Archived' },
  { id: 'ML-02-26', month: 'February 2026', fy: 'FY 2025-26', fileName: 'attendance_log_feb_2026.csv', totalRecords: '1,280 records', fileSize: '2.4 MB', generatedDate: 'Feb 28, 2026', status: 'Archived' },
  { id: 'ML-01-26', month: 'January 2026', fy: 'FY 2025-26', fileName: 'attendance_log_jan_2026.csv', totalRecords: '1,390 records', fileSize: '2.6 MB', generatedDate: 'Jan 31, 2026', status: 'Archived' },
  { id: 'ML-12-25', month: 'December 2025', fy: 'FY 2025-26', fileName: 'attendance_log_dec_2025.csv', totalRecords: '1,400 records', fileSize: '2.7 MB', generatedDate: 'Dec 31, 2025', status: 'Archived' },
  { id: 'ML-11-25', month: 'November 2025', fy: 'FY 2025-26', fileName: 'attendance_log_nov_2025.csv', totalRecords: '1,320 records', fileSize: '2.5 MB', generatedDate: 'Nov 30, 2025', status: 'Archived' },
  { id: 'ML-10-25', month: 'October 2025', fy: 'FY 2025-26', fileName: 'attendance_log_oct_2025.csv', totalRecords: '1,415 records', fileSize: '2.7 MB', generatedDate: 'Oct 31, 2025', status: 'Archived' },
  { id: 'ML-09-25', month: 'September 2025', fy: 'FY 2025-26', fileName: 'attendance_log_sep_2025.csv', totalRecords: '1,360 records', fileSize: '2.6 MB', generatedDate: 'Sep 30, 2025', status: 'Archived' },
  { id: 'ML-08-25', month: 'August 2025', fy: 'FY 2025-26', fileName: 'attendance_log_aug_2025.csv', totalRecords: '1,395 records', fileSize: '2.6 MB', generatedDate: 'Aug 31, 2025', status: 'Archived' }
];

import { useAuthStore } from '@/store/useAuthStore';
import { getAvatarUrl } from '@/lib/utils';

export default function AttendancePage() {
  const { user } = useAuthStore();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'Presented' | 'Absentees' | 'Monthly log'>('Presented');

  // Filter logic
  const filteredData = ATTENDANCE_DATA.filter((record) => {
    const matchesSearch = record.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          record.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || record.status === selectedStatus;
    const matchesDept = selectedDept === 'All' || record.department === selectedDept;
    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-medium text-[#111827] tracking-tight font-sans">
          Attendance
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
                    { title: 'New Leave Request', desc: 'Sarah submitted a sick leave request', time: '10m ago', icon: <Luggage01Icon size={20} strokeWidth={1.5} className="text-gray-700" /> },
                    { title: 'Claim Approval', desc: 'Krishna submitted a travel expense claim', time: '1h ago', icon: <UserIcon size={20} strokeWidth={1.5} className="text-gray-700" /> },
                    { title: 'Company Update', desc: 'New policy update published by HR', time: '3h ago', icon: <Notification01Icon size={20} strokeWidth={1.5} className="text-gray-700" /> },
                    { title: 'System Alert', desc: 'Monthly storage cleanup completed', time: '5h ago', icon: <CheckmarkCircle01Icon size={20} strokeWidth={1.5} className="text-gray-700" /> },
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
        <div className="absolute left-14 top-3 bottom-3 w-[360px] flex items-center justify-start pointer-events-none">
          <img 
            src="/illustrations/attendance_page_illus.svg"
            alt="Attendance Illustration"
            className="h-full w-auto object-contain object-left"
          />
        </div>

        {/* Right Content */}
        <div className="flex flex-col items-end z-10 w-full">
          <p className="text-[16px] font-normal text-[#6B7280] tracking-normal">Manage Your Department Attendnace</p>
          <h2 className="text-[28px] font-medium text-[#111827] mt-0.5 tracking-tight">Chumma Deaprtment</h2>
          
          <div className="mt-5 bg-[#CBE455] rounded-[15px] px-8 py-3.5 flex items-center gap-12">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-[#111827]">Present :</span>
              <span className="text-[16px] font-semibold text-[#111827] font-rounded">25</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-[#111827]">Absent :</span>
              <span className="text-[16px] font-semibold text-[#111827] font-rounded">5</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-[#111827]">Late :</span>
              <span className="text-[16px] font-semibold text-[#111827] font-rounded">5</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-[#111827]">Unclocked :</span>
              <span className="text-[16px] font-semibold text-[#111827] font-rounded">5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Controls */}
      <div className="flex items-center justify-between w-full mb-6 mt-2">
        {/* Search Input */}
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

        {/* Date Selector & Filter CTA */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-3 px-5 py-2.5 bg-white border border-[#E5E7EB] rounded-full text-[14px] font-normal text-[#4B5563] hover:bg-gray-50 transition-colors">
            <Calendar03Icon size={18} className="text-gray-500" strokeWidth={1.8} />
            Thursday 23 July
            <ArrowDown01Icon size={18} className="text-gray-500 ml-1" />
          </button>
          
          <button className="flex items-center justify-center w-11 h-11 bg-white border border-[#E5E7EB] rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">
            <FilterIcon size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Attendance Table Card */}
      <div className="bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden flex flex-col">
        {/* Tabs */}
        <div className="flex items-center gap-8 px-6 pt-4 border-b border-[#E5E7EB]">
          <button 
            onClick={() => setActiveTab('Presented')}
            className={`relative text-[14px] pb-3 px-1 ${activeTab === 'Presented' ? 'font-semibold text-[#111827]' : 'font-medium text-[#9CA3AF] hover:text-[#4B5563]'}`}
          >
            Presented
            {activeTab === 'Presented' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#007AFF] rounded-t-[25px]"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('Absentees')}
            className={`relative text-[14px] pb-3 px-1 ${activeTab === 'Absentees' ? 'font-semibold text-[#111827]' : 'font-medium text-[#9CA3AF] hover:text-[#4B5563]'}`}
          >
            Absentees
            {activeTab === 'Absentees' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#007AFF] rounded-t-[25px]"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('Monthly log')}
            className={`relative text-[14px] pb-3 px-1 ${activeTab === 'Monthly log' ? 'font-semibold text-[#111827]' : 'font-medium text-[#9CA3AF] hover:text-[#4B5563]'}`}
          >
            Monthly log
            {activeTab === 'Monthly log' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#007AFF] rounded-t-[25px]"></div>}
          </button>
        </div>

        {/* Table Header Bar */}
        <div className="bg-[#EBEFF5] px-6 py-3 flex items-center text-[13px] font-semibold text-[#4B5563] font-sans">
          {activeTab === 'Presented' && (
            <>
              <div className="w-[24%]">Employee</div>
              <div className="w-[10%]">Site</div>
              <div className="w-[10%]">Proof</div>
              <div className="w-[14%]">Clock in</div>
              <div className="w-[14%]">Clock out</div>
              <div className="w-[9%]">Break</div>
              <div className="w-[14%]">Hours worked</div>
              <div className="w-[5%]">Actions</div>
            </>
          )}
          {activeTab === 'Absentees' && (
            <>
              <div className="w-[30%]">Employee</div>
              <div className="w-[15%]">Department</div>
              <div className="w-[15%]">Date</div>
              <div className="w-[20%]">Reason</div>
              <div className="w-[15%]">Status</div>
              <div className="w-[5%]">Actions</div>
            </>
          )}
          {activeTab === 'Monthly log' && (
            <>
              <div className="w-[28%]">Month / Log File</div>
              <div className="w-[14%]">Fiscal Year</div>
              <div className="w-[16%]">Total Records</div>
              <div className="w-[12%]">File Size</div>
              <div className="w-[16%]">Generated Date</div>
              <div className="w-[14%] text-right pr-2">Action</div>
            </>
          )}
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100">
          {activeTab === 'Monthly log' ? (
            MONTHLY_LOGS_DATA.map((log) => (
              <div key={log.id} className="px-6 py-4 flex items-center text-[14px] hover:bg-gray-50/80 transition-colors">
                {/* Month / Log File */}
                <div className="w-[28%] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] border border-gray-200/80 flex items-center justify-center shrink-0">
                    <File02Icon size={18} className="text-[#111827]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#111827] leading-tight">{log.month}</p>
                    <p className="text-[12px] text-[#9CA3AF] mt-0.5">{log.fileName}</p>
                  </div>
                </div>

                {/* Fiscal Year */}
                <div className="w-[14%]">
                  <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-full text-[12px] font-medium text-[#4B5563] font-rounded">
                    {log.fy}
                  </span>
                </div>

                {/* Total Records */}
                <div className="w-[16%] text-[#374151] font-medium font-rounded">
                  {log.totalRecords}
                </div>

                {/* File Size */}
                <div className="w-[12%] text-[#6B7280] text-[13px] font-medium font-rounded">
                  {log.fileSize}
                </div>

                {/* Generated Date */}
                <div className="w-[16%] text-[#374151] font-medium font-rounded">
                  {log.generatedDate}
                </div>

                {/* Action Download */}
                <div className="w-[14%] flex justify-end pr-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#007AFF] text-white rounded-full text-[12px] font-medium hover:bg-blue-600 transition-colors">
                    <Download01Icon size={14} />
                    Download
                  </button>
                </div>
              </div>
            ))
          ) : filteredData.length > 0 ? (
            filteredData.map((record) => (
              <div key={record.id} className="px-6 py-4 flex items-center text-[14px] font-sans hover:bg-gray-50/80 transition-colors">
                {/* Employee Info */}
                <div className={activeTab === 'Presented' ? 'w-[24%] flex items-center gap-3' : 'w-[30%] flex items-center gap-3'}>
                  <div className="w-9 h-9 rounded-full bg-[#EFEFEF] overflow-hidden shrink-0 border border-gray-200/60 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="#C7C7C7" className="w-full h-full scale-125 translate-y-[2px]">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#111827] leading-tight">{record.name}</p>
                    <p className="text-[12px] text-[#9CA3AF] mt-0.5">{record.role}</p>
                  </div>
                </div>

                {activeTab === 'Presented' && (
                  <>
                    {/* Site */}
                    <div className="w-[10%] text-[#374151] font-medium">
                      HQ
                    </div>

                    {/* Proof */}
                    <div className="w-[10%] text-[#374151] font-medium">
                      <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                        <UserCheck01Icon size={14} className="text-gray-500" />
                      </div>
                    </div>

                    {/* Clock In */}
                    <div className="w-[14%] flex flex-col justify-center">
                      <span className="font-semibold text-[#111827]">{record.checkIn}</span>
                      {record.isOnTime === false && record.checkIn !== '-' && (
                         <span className="text-[11px] text-[#EF4444] font-medium mt-0.5">Late</span>
                      )}
                    </div>

                    {/* Clock Out */}
                    <div className="w-[14%] text-[#111827] font-semibold">
                      {record.checkOut}
                    </div>

                    {/* Break */}
                    <div className="w-[9%] text-[#374151] font-medium">
                      1 hr
                    </div>

                    {/* Hours Worked */}
                    <div className="w-[14%] font-semibold text-[#111827]">
                      {record.workHours}
                    </div>

                    {/* Actions */}
                    <div className="w-[5%] flex items-center text-gray-400 cursor-pointer hover:text-gray-700">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                    </div>
                  </>
                )}

                {activeTab === 'Absentees' && (
                  <>
                    {/* Department */}
                    <div className="w-[15%] text-[#374151] font-medium">
                      {record.department}
                    </div>
                    
                    {/* Date */}
                    <div className="w-[15%] text-[#374151] font-medium">
                      July 31, 2026
                    </div>
                    
                    {/* Reason */}
                    <div className="w-[20%]">
                      <span className="text-[#374151] font-medium">
                        {record.status === 'On Leave' ? 'Annual Leave' : 'Sick Leave'}
                      </span>
                    </div>
                    
                    {/* Status */}
                    <div className="w-[15%]">
                      <span className={`px-3 py-1 rounded-full text-[12px] font-medium inline-block ${record.status === 'On Leave' ? 'bg-[#E6F4EA] text-[#22C55E]' : 'bg-[#FEF3C7] text-[#F59E0B]'}`}>
                        {record.status === 'On Leave' ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    
                    {/* Actions */}
                    <div className="w-[5%] flex items-center text-gray-400 cursor-pointer hover:text-gray-700">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-400 text-[14px]">
              No attendance records found matching your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

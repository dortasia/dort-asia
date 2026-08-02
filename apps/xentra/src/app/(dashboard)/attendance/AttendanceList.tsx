"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Calendar03Icon,
  Search01Icon,
  FilterIcon,
  Download01Icon,
  File02Icon,
  UserCheck01Icon
} from 'hugeicons-react';
import HeaderSearchBar from "@/components/HeaderSearchBar";
import { createClient } from "@/utils/supabase/client";
import { getAvatarColor, getInitials as getAvatarInitials } from "@/utils/avatarColor";
import MonthDatePicker from "@/components/MonthDatePicker";
import { RefreshCw } from "lucide-react"; // Keeping this for the refresh button if needed

export type AttendanceItem = {
  id: string;
  name: string;
  role: string;
  empId: string;
  location: string;
  locationUrl: string;
  proof: string;
  clockIn: string;
  clockOut: string;
  hours: string;
  status: string;
  isLate: boolean;
  initials: string;
  color: string;
  bg: string;
  attendanceId: string | null;
  clockInTime: string | null;
  department?: string;
};

type AttendanceRow = {
  id: string;
  employee_id: string;
  date: string;
  status: string;
  location?: string | null;
  proof_url?: string | null;
  clock_in?: string | null;
  clock_out?: string | null;
  hours?: string | null;
  clock_in_time?: string | null;
};

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

interface Props {
  initialData: AttendanceItem[];
  absentToday?: AttendanceItem[];
  todayDate: string;
  graceDeadline: string;
  shiftStart: string;
}

export default function AttendanceList({ initialData, todayDate, graceDeadline, shiftStart }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceData, setAttendanceData] = useState<AttendanceItem[]>(initialData);
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isMounted, setIsMounted] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'Presented' | 'Absentees' | 'Monthly log'>('Presented');

  useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const supabase = createClient();

  const now = new Date();
  const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const istTimeHHMM = istDate.toISOString().split("T")[1].substring(0, 5);
  
  const isToday = selectedDate === todayDate;
  const isPast = selectedDate < todayDate;
  const graceElapsed = isPast || (isToday && istTimeHHMM >= graceDeadline);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data: employees } = await supabase
        .from("employees")
        .select("id, name, role, emp_id, user_id");

      const { data: attendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", selectedDate);

      if (!employees) return;

      const attMap = new Map<string, AttendanceRow>((attendance || []).map((a: AttendanceRow) => [a.employee_id, a]));

      const updated: AttendanceItem[] = employees.map((emp: any) => {
        const fullName = emp.name?.trim() || "Unknown Employee";
        const att = (emp.user_id ? attMap.get(emp.user_id) : undefined) || attMap.get(emp.id);

        let locationDisplay = "Unknown";
        let locationUrl = "#";
        if (att?.location) {
          const coords = att.location;
          if (/^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(coords)) {
            locationDisplay = `📍 ${coords}`;
            locationUrl = `https://maps.google.com/?q=${coords}`;
          } else {
            locationDisplay = coords;
            locationUrl = `https://maps.google.com/?q=${encodeURIComponent(coords)}`;
          }
        }

        const avatar = getAvatarColor(fullName);
        const initials = getAvatarInitials(fullName);

        const status = att?.status === "present" ? "Present" : (att ? (att.status?.charAt(0).toUpperCase() + att.status?.slice(1)) : "Absent");
        const isLate = status === "Present" && !!att?.clock_in && att.clock_in > shiftStart;

        return {
          id: emp.id,
          name: fullName,
          role: emp.role || "Employee",
          empId: emp.emp_id || "--",
          location: locationDisplay,
          locationUrl,
          proof: att?.proof_url || "",
          clockIn: att?.clock_in || "--",
          clockOut: att?.clock_out || "--",
          hours: att?.hours || "--",
          status,
          isLate,
          initials,
          color: avatar.solid,
          bg: avatar.bg,
          attendanceId: att?.id || null,
          clockInTime: att?.clock_in_time || null,
          department: emp.department || "General",
        };
      });

      updated.sort((a, b) => {
        if (a.status === "Present" && b.status !== "Present") return -1;
        if (a.status !== "Present" && b.status === "Present") return 1;
        if (a.clockInTime && b.clockInTime) return b.clockInTime.localeCompare(a.clockInTime);
        return 0;
      });

      setAttendanceData(updated);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Failed to refresh attendance:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [supabase, selectedDate, shiftStart]);

  const [hasMountedDate, setHasMountedDate] = useState(false);
  useEffect(() => {
    if (hasMountedDate) {
      refreshData();
    } else {
      setHasMountedDate(true);
    }
  }, [selectedDate, refreshData]);

  useEffect(() => {
    const channel = supabase
      .channel('attendance-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance', filter: `date=eq.${selectedDate}` },
        () => {
          refreshData();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, selectedDate, refreshData]);

  const presentToday = attendanceData.filter(d => d.status === "Present");
  const absentToday = graceElapsed ? attendanceData.filter(d => d.status !== "Present") : [];
  const lateToday = attendanceData.filter(d => d.isLate);

  const activeData = activeTab === 'Presented' ? presentToday : absentToday;

  const filteredData = activeData.filter((record) => {
    const matchesSearch = record.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          record.empId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const calculateWorkingHours = (clockInTime: string | null) => {
    if (!clockInTime) return "--";
    const then = new Date(clockInTime);
    const diffMs = currentTime.getTime() - then.getTime();
    if (diffMs <= 0) return "0h 0m";
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return `${hrs}h ${mins}m`;
  };

  const formatLastUpdate = () => {
    return lastUpdate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto page-scrollbar bg-white">
      {/* Existing Header with Search Bar */}
      <header className="flex items-center justify-between px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div>
          <h1 className="text-[28px] font-medium text-[#111827] tracking-tight font-sans">
            Attendance
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#34C759]/10 border border-[#34C759]/20 rounded-full">
              <div className="h-2 w-2 rounded-full bg-[#34C759] animate-pulse" />
              <span className="text-[11px] font-semibold text-[#248A3D]">LIVE</span>
            </div>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="p-2 text-gray-500 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
              title={isMounted ? `Last updated: ${formatLastUpdate()}` : "Refresh"}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={2} />
            </button>
          </div>
          <HeaderSearchBar />
        </div>
      </header>

      <main className="flex-1 px-8 pb-8 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
        {/* Top Banner Row from Xentra */}
        <div className="relative w-full h-[200px] bg-white border border-[#E5E7EB] rounded-[25px] flex items-center justify-between px-10 overflow-hidden mb-2">
          {/* Left Illustration */}
          <div className="absolute left-14 top-3 bottom-3 w-[360px] flex items-center justify-start pointer-events-none">
            {/* Using standard img tags since we have the SVGs or can fallback if missing */}
            <img 
              src="/illustrations/attendance_page_illus.svg"
              alt="Attendance Illustration"
              className="h-full w-auto object-contain object-left"
              onError={(e) => { e.currentTarget.src = "/attendance_page.svg" }}
            />
          </div>

          {/* Right Content */}
          <div className="flex flex-col items-end z-10 w-full">
            <p className="text-[16px] font-normal text-[#6B7280] tracking-normal">Manage Your Department Attendance</p>
            <h2 className="text-[28px] font-medium text-[#111827] mt-0.5 tracking-tight">HR Department</h2>
            
            <div className="mt-5 bg-[#CBE455] rounded-[15px] px-8 py-3.5 flex items-center gap-12 border border-[#CBE455]">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-[#111827]">Present :</span>
                <span className="text-[16px] font-semibold text-[#111827] font-rounded">{presentToday.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-[#111827]">Absent :</span>
                <span className="text-[16px] font-semibold text-[#111827] font-rounded">{absentToday.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-[#111827]">Late :</span>
                <span className="text-[16px] font-semibold text-[#111827] font-rounded">{lateToday.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-[#111827]">Total :</span>
                <span className="text-[16px] font-semibold text-[#111827] font-rounded">{attendanceData.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Controls */}
        <div className="flex items-center justify-between w-full mb-6 mt-6">
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
            <MonthDatePicker selectedDate={selectedDate} onChange={setSelectedDate} />
            
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
          <div className="divide-y divide-gray-100 min-h-[400px]">
            {activeTab === 'Monthly log' ? (
              MONTHLY_LOGS_DATA.map((log) => (
                <div key={log.id} className="px-6 py-4 flex items-center text-[14px] hover:bg-gray-50/80 transition-colors">
                  <div className="w-[28%] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] border border-gray-200/80 flex items-center justify-center shrink-0">
                      <File02Icon size={18} className="text-[#111827]" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[#111827] leading-tight">{log.month}</p>
                      <p className="text-[12px] text-[#9CA3AF] mt-0.5">{log.fileName}</p>
                    </div>
                  </div>
                  <div className="w-[14%]">
                    <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-full text-[12px] font-medium text-[#4B5563] font-rounded">
                      {log.fy}
                    </span>
                  </div>
                  <div className="w-[16%] text-[#374151] font-medium font-rounded">
                    {log.totalRecords}
                  </div>
                  <div className="w-[12%] text-[#6B7280] text-[13px] font-medium font-rounded">
                    {log.fileSize}
                  </div>
                  <div className="w-[16%] text-[#374151] font-medium font-rounded">
                    {log.generatedDate}
                  </div>
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
                    <div 
                      className="w-9 h-9 rounded-full border border-gray-200/60 flex items-center justify-center text-[12px] font-bold shrink-0 text-white"
                      style={{ backgroundColor: record.color }}
                    >
                      {record.initials}
                    </div>
                    <div className="flex flex-col max-w-[140px]">
                      <p className="text-[14px] font-semibold text-[#111827] leading-tight truncate" title={record.name}>{record.name}</p>
                      <p className="text-[12px] text-[#9CA3AF] mt-0.5 truncate" title={record.role}>{record.role}</p>
                    </div>
                  </div>

                  {activeTab === 'Presented' && (
                    <>
                      {/* Site */}
                      <div className="w-[10%] text-[#374151] font-medium truncate pr-2">
                        {record.location !== 'Unknown' ? record.location.replace('📍 ', '') : 'HQ'}
                      </div>

                      {/* Proof */}
                      <div className="w-[10%] text-[#374151] font-medium">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${record.proof ? 'bg-blue-50 border-blue-100 text-blue-500 cursor-pointer' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                          <UserCheck01Icon size={14} />
                        </div>
                      </div>

                      {/* Clock In */}
                      <div className="w-[14%] flex flex-col justify-center">
                        <span className="font-semibold text-[#111827]">{record.clockIn !== "--" ? record.clockIn : "-"}</span>
                        {record.isLate && record.clockIn !== '--' && (
                           <span className="text-[11px] text-[#EF4444] font-medium mt-0.5">Late</span>
                        )}
                      </div>

                      {/* Clock Out */}
                      <div className="w-[14%] text-[#111827] font-semibold">
                        {record.clockOut !== "--" ? record.clockOut : "-"}
                      </div>

                      {/* Break */}
                      <div className="w-[9%] text-[#374151] font-medium">
                        --
                      </div>

                      {/* Hours Worked */}
                      <div className="w-[14%] font-semibold text-[#111827]">
                        {record.hours !== "--" ? record.hours : (isMounted ? calculateWorkingHours(record.clockInTime) : "--")}
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
                      <div className="w-[15%] text-[#374151] font-medium truncate pr-2" title={record.department}>
                        {record.department || 'General'}
                      </div>
                      
                      {/* Date */}
                      <div className="w-[15%] text-[#374151] font-medium">
                        {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      
                      {/* Reason */}
                      <div className="w-[20%]">
                        <span className="text-[#374151] font-medium">
                          Absent
                        </span>
                      </div>
                      
                      {/* Status */}
                      <div className="w-[15%]">
                        <span className="px-3 py-1 rounded-full text-[12px] font-medium inline-block bg-[#FEF3C7] text-[#F59E0B]">
                          Pending
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
      </main>
    </div>
  );
}

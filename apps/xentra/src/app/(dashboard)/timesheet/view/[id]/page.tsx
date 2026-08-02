"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Clock, 
  Timer, 
  MapPin, 
  Calendar, 
  Briefcase, 
  CheckCircle2, 
  Coffee,
  Download,
  Building2,
  FileClock,
  ChevronDown,
  Fingerprint,
  Building,
  UserCheck,
  CalendarDays,
  LayoutGrid,
  BarChart3,
  TrendingUp,
  Globe,
  Eye,
  Activity,
  Award,
  MoreVertical,
  Milestone
} from "lucide-react";

import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const fyOptions = [
  { value: "fy26", label: "FY 2025-2026 (Current)" },
  { value: "fy25", label: "FY 2024-2025" },
  { value: "fy24", label: "FY 2023-2024" },
];

type DayStatus = "approved" | "overtime" | "leave" | "weekend" | "empty";

interface MonthData {
  month: string;
  year: number;
  monthNum: number;
  hours: string;
  overtime: string;
  leaves: number;
  status: "Completed" | "In Progress" | "Upcoming";
  days: { day: number; hours: number; ot: number; status: DayStatus }[];
}

const generateMonthDays = (year: number, monthNum: number, isUpcoming: boolean) => {
  const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, monthNum, d).getDay();
    if (isUpcoming) {
      days.push({ day: d, hours: 0, ot: 0, status: "empty" as DayStatus });
    } else if (dow === 0 || dow === 6) {
      days.push({ day: d, hours: 0, ot: 0, status: "weekend" as DayStatus });
    } else if (d === 14 || d === 28) {
      days.push({ day: d, hours: 8, ot: 2, status: "overtime" as DayStatus });
    } else if (d === 8) {
      days.push({ day: d, hours: 0, ot: 0, status: "leave" as DayStatus });
    } else {
      days.push({ day: d, hours: 8, ot: 0, status: "approved" as DayStatus });
    }
  }
  return days;
};

const fyDataRecord: Record<string, { summary: { hours: string; overtime: string; leaves: string }; months: MonthData[]; sites: { name: string; hours: number; pct: number }[] }> = {
  fy26: {
    summary: { hours: "320h 00m", overtime: "12h 30m", leaves: "2 Days" },
    months: [
      { month: "April", year: 2025, monthNum: 3, hours: "160h", overtime: "5h", leaves: 1, status: "Completed", days: generateMonthDays(2025, 3, false) },
      { month: "May", year: 2025, monthNum: 4, hours: "160h", overtime: "7.5h", leaves: 1, status: "Completed", days: generateMonthDays(2025, 4, false) },
      { month: "June", year: 2025, monthNum: 5, hours: "152h", overtime: "0h", leaves: 0, status: "In Progress", days: generateMonthDays(2025, 5, false) },
      { month: "July", year: 2025, monthNum: 6, hours: "-", overtime: "-", leaves: 0, status: "Upcoming", days: generateMonthDays(2025, 6, true) },
      { month: "August", year: 2025, monthNum: 7, hours: "-", overtime: "-", leaves: 0, status: "Upcoming", days: generateMonthDays(2025, 7, true) },
      { month: "September", year: 2025, monthNum: 8, hours: "-", overtime: "-", leaves: 0, status: "Upcoming", days: generateMonthDays(2025, 8, true) },
      { month: "October", year: 2025, monthNum: 9, hours: "-", overtime: "-", leaves: 0, status: "Upcoming", days: generateMonthDays(2025, 9, true) },
      { month: "November", year: 2025, monthNum: 10, hours: "-", overtime: "-", leaves: 0, status: "Upcoming", days: generateMonthDays(2025, 10, true) },
      { month: "December", year: 2025, monthNum: 11, hours: "-", overtime: "-", leaves: 0, status: "Upcoming", days: generateMonthDays(2025, 11, true) },
      { month: "January", year: 2026, monthNum: 0, hours: "-", overtime: "-", leaves: 0, status: "Upcoming", days: generateMonthDays(2026, 0, true) },
      { month: "February", year: 2026, monthNum: 1, hours: "-", overtime: "-", leaves: 0, status: "Upcoming", days: generateMonthDays(2026, 1, true) },
      { month: "March", year: 2026, monthNum: 2, hours: "-", overtime: "-", leaves: 0, status: "Upcoming", days: generateMonthDays(2026, 2, true) },
    ],
    sites: [
      { name: "Singapore HQ - Block A", hours: 240, pct: 75 },
      { name: "Jurong Client Site", hours: 80, pct: 25 }
    ]
  },
  fy25: {
    summary: { hours: "1,920h 00m", overtime: "85h 00m", leaves: "14 Days" },
    months: [
      "April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"
    ].map((m, idx) => ({
      month: m,
      year: idx < 9 ? 2024 : 2025,
      monthNum: idx < 9 ? idx + 3 : idx - 9,
      hours: "160h",
      overtime: idx % 2 === 0 ? "8h" : "4h",
      leaves: idx === 3 ? 3 : 1,
      status: "Completed" as const,
      days: generateMonthDays(idx < 9 ? 2024 : 2025, idx < 9 ? idx + 3 : idx - 9, false)
    })),
    sites: [
      { name: "Singapore HQ - Block A", hours: 1400, pct: 73 },
      { name: "Marina Bay Office", hours: 320, pct: 17 },
      { name: "Remote Work", hours: 200, pct: 10 }
    ]
  },
  fy24: {
    summary: { hours: "1,850h 30m", overtime: "110h 30m", leaves: "18 Days" },
    months: [
      "April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"
    ].map((m, idx) => ({
      month: m,
      year: idx < 9 ? 2023 : 2024,
      monthNum: idx < 9 ? idx + 3 : idx - 9,
      hours: "155h",
      overtime: "10h",
      leaves: 2,
      status: "Completed" as const,
      days: generateMonthDays(idx < 9 ? 2023 : 2024, idx < 9 ? idx + 3 : idx - 9, false)
    })),
    sites: [
      { name: "Singapore HQ - Block A", hours: 1850, pct: 100 }
    ]
  }
};

const DetailField = ({ icon: Icon, label, value, className = "", hideBorder = false }: any) => (
  <div className={`flex items-start gap-3 py-3 ${!hideBorder ? 'border-b border-[#ECECEC] dark:border-[#2C2C35]' : ''} ${className}`}>
    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#FAFAF9] dark:bg-[#2C2C35] text-[#616161] dark:text-gray-400 border border-[#ECECEC] dark:border-white/5 shrink-0">
      <Icon size={14} strokeWidth={2} />
    </div>
    <div className="flex flex-col gap-0.5">
      <span className="text-[12px] font-semibold text-[#8B8B8B]">{label}</span>
      <span className="text-[13.5px] font-bold text-[#161616] dark:text-white break-words">{value || "-"}</span>
    </div>
  </div>
);

const TABS = ["Overview", "Monthly Calendar Matrix", "FY Breakdown", "Site Allocation"];

const getTabIcon = (tabName: string) => {
  if (tabName.includes("Overview")) return LayoutGrid;
  if (tabName.includes("Calendar")) return CalendarDays;
  if (tabName.includes("Breakdown")) return Milestone;
  if (tabName.includes("Site")) return BarChart3;
  return Activity;
};

export default function LifetimeTimesheetProfileView() {
  const params = useParams();
  const id = params?.id as string;
  const [activeFy, setActiveFy] = useState("fy26");
  const [isFyDropdownOpen, setIsFyDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedMonthModal, setSelectedMonthModal] = useState<MonthData | null>(null);

  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  const [lifetimeStats, setLifetimeStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setLoading(true);
      const supabase = createClient();
      try {
        const { data: emp, error: empError } = await supabase
          .from('employees')
          .select('id, emp_id, first_name, last_name, designation, work_location, avatar_url, is_active, created_at, email')
          .eq('id', id)
          .single();
        if (empError) throw empError;
        
        setEmployeeDetails({
          id: emp.emp_id || emp.id.substring(0, 8),
          name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown',
          role: emp.designation || 'Employee',
          department: "General", 
          joined: emp.created_at ? new Date(emp.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown',
          email: emp.email || "employee@company.com",
          location: emp.work_location || "Headquarters",
          status: emp.is_active ? "Active" : "Inactive",
          avatar: emp.avatar_url || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face"
        });

        const { data: att, error: attError } = await supabase
          .from('attendance')
          .select('date, clock_in, clock_out, hours, status')
          .eq('employee_id', id);

        if (attError) throw attError;

        let totalMins = 0;
        let overtimeMins = 0;
        let leavesCount = 0;

        att?.forEach((record: any) => {
          if (record.status === 'Leave' || record.status === 'leave') {
            leavesCount++;
          } else {
             let mins = 0;
             if (record.hours) {
                const match = record.hours.match(/(\d+)h\s*(\d*)m/);
                if(match) mins = parseInt(match[1])*60 + (parseInt(match[2]) || 0);
             } else if (record.clock_in && record.clock_out) {
                const s = new Date(record.clock_in).getTime();
                const e = new Date(record.clock_out).getTime();
                if (!isNaN(s) && !isNaN(e)) mins = Math.floor((e - s) / 60000);
             }
             totalMins += mins;
             if (mins > 8 * 60) {
               overtimeMins += (mins - 8 * 60);
             }
          }
        });

        const formatMins = (m: number) => `${Math.floor(m / 60)}h ${(m % 60).toString().padStart(2, '0')}m`;
        
        setLifetimeStats({
          totalHours: formatMins(totalMins),
          standardHours: formatMins(totalMins - overtimeMins),
          overtime: formatMins(overtimeMins),
          leaves: `${leavesCount} Days`,
          sites: 1, 
          avgHoursPerWeek: totalMins > 0 ? `${(totalMins / 60 / 4).toFixed(1)}h` : '0h'
        });

      } catch (e) {
        console.error("Error fetching employee profile:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const fyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fyDropdownRef.current && !fyDropdownRef.current.contains(event.target as Node)) {
        setIsFyDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentFy = fyOptions.find(f => f.value === activeFy) || fyOptions[0];
  const currentData = fyDataRecord[activeFy] || fyDataRecord.fy26;

  if (loading || !employeeDetails || !lifetimeStats) {
     return <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#0B0B0F]"><div className="text-[13px] text-gray-500 font-medium">Loading profile data...</div></div>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto page-scrollbar bg-white dark:bg-[#0B0B0F]">
      
      {/* Top Header Bar matching Employee Profile */}
      <div className="bg-[#FAFAF9] dark:bg-[#1C1C1E]/50 border-b border-[#ECECEC] dark:border-[#2C2C35] px-6 py-4 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-full">
          <div className="flex items-center gap-3">
            <Link 
              href="/timesheet" 
              className="flex items-center gap-1.5 text-[13px] font-bold text-[#616161] hover:text-[#161616] dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={16} strokeWidth={2.2} />
              <span>Back to Timesheets</span>
            </Link>
            <span className="text-gray-300 dark:text-gray-700">/</span>
            <span className="text-[13px] font-bold text-[#161616] dark:text-white">
              {employeeDetails.name} — Timesheet Profile
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Custom Fiscal Year Dropdown */}
            <div className="relative" ref={fyDropdownRef}>
              <button
                type="button"
                onClick={() => setIsFyDropdownOpen(!isFyDropdownOpen)}
                className="h-9 px-3.5 bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-white/10 rounded-lg text-[13px] font-bold text-black dark:text-white flex items-center gap-2 cursor-pointer shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
              >
                <Calendar className="h-4 w-4 text-[#16A34A] dark:text-emerald-400" strokeWidth={2} />
                <span>{currentFy.label}</span>
                <ChevronDown className={`h-4 w-4 text-[#8E8E93] transition-transform duration-200 ${isFyDropdownOpen ? "rotate-180" : ""}`} strokeWidth={2} />
              </button>

              {isFyDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-white/10 rounded-xl z-[999] p-1.5 shadow-md flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-[#8B8B8B] uppercase tracking-wider border-b border-[#ECECEC] dark:border-[#2C2C35] mb-1">
                    Select Fiscal Year
                  </div>
                  {fyOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setActiveFy(opt.value); setIsFyDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-[13px] font-semibold rounded-md flex items-center justify-between transition-colors ${
                        activeFy === opt.value 
                          ? "bg-black/5 dark:bg-white/10 text-black dark:text-white font-bold" 
                          : "text-gray-700 dark:text-gray-300 hover:bg-[#FAFAF9] dark:hover:bg-white/5"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {activeFy === opt.value && <CheckCircle2 className="h-4 w-4 text-[#16A34A]" strokeWidth={2} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="h-9 px-4 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-gray-100 text-[13px] font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-transparent shadow-sm">
              <Download className="h-4 w-4" strokeWidth={2} />
              <span>Export FY Timesheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Employee Profile Page Grid Layout */}
      <main className="flex-1 p-6 w-full max-w-full">
        <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start w-full">
          
          {/* Left Column: Sticky Profile Card (exact pixel match with Employee Profile page) */}
          <div className="sticky top-24 z-10 bg-[#FAFAF9] dark:bg-[#1C1C1E]/50 border border-[#ECECEC] dark:border-[#2C2C35] rounded-xl p-6 flex flex-col items-center">
            <div className="relative mb-4">
              <div className="h-32 w-32 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-white dark:border-[#1C1C1E] shadow-sm shrink-0">
                <img src={employeeDetails.avatar} alt={employeeDetails.name} className="h-full w-full object-cover" />
              </div>
            </div>
            
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold tracking-wide uppercase mb-4 bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30">
              {employeeDetails.status}
            </span>

            <h2 className="text-[20px] font-bold text-gray-900 dark:text-white text-center leading-tight mb-1">
              {employeeDetails.name}
            </h2>
            <p className="text-[14px] font-semibold text-gray-500 dark:text-gray-400 text-center mb-6">
              {employeeDetails.role}
            </p>

            <div className="w-full flex flex-col mb-6">
              <DetailField icon={Fingerprint} label="Employee ID" value={employeeDetails.id} />
              <DetailField icon={Building} label="Department" value={employeeDetails.department} />
              <DetailField icon={UserCheck} label="Department Head" value="Santhosh M (Lead)" />
              <DetailField icon={CalendarDays} label="Date of Joining" value={`${employeeDetails.joined} (4y 4m)`} />
              <DetailField icon={Briefcase} label="Employee Type" value="Full-time" hideBorder={true} />
            </div>

            <button className="w-full py-2.5 bg-white border border-[#ECECEC] hover:bg-[#FAFAF9] dark:bg-[#1C1C1E] dark:border-white/5 dark:hover:bg-white/5 text-[#161616] dark:text-white text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer">
              <Download className="h-4 w-4 text-gray-500" strokeWidth={2} /> Download Timesheet Summary
            </button>
          </div>

          {/* Right Column: Main Content & Profile Tab Navigation */}
          <div className="flex-1 flex flex-col gap-6 min-w-0 w-full">
            
            {/* Tab Bar Navigation with #007AFF Spring Underline */}
            <div className="border-b border-[#ECECEC] dark:border-white/5 flex gap-6 overflow-x-auto page-scrollbar scroll-smooth mb-2">
              {TABS.map(tab => {
                const TabIcon = getTabIcon(tab);
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative py-3.5 text-[14px] font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      isActive 
                        ? "text-black dark:text-white" 
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                  >
                    <TabIcon className="h-4 w-4" strokeWidth={2.2} />
                    <span>{tab}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabUnderlineTimesheet" 
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#007AFF] dark:bg-blue-500 rounded-full" 
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── TAB 1: OVERVIEW TAB ── */}
            {activeTab === "Overview" && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                {/* Lifetime Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Card 1: Lifetime Hours */}
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-[#ECECEC] dark:border-[#2C2C35] p-5 relative overflow-hidden flex flex-col justify-between">
                    <div className="w-1.5 h-full bg-[#161616] dark:bg-white absolute left-0 top-0" />
                    <div className="pl-2 flex items-center justify-between mb-3">
                      <span className="text-[12px] font-semibold text-[#8B8B8B] uppercase tracking-wider">Lifetime Hours</span>
                      <div className="w-8 h-8 rounded-lg bg-[#FAFAF9] dark:bg-[#2C2C35] border border-[#ECECEC] dark:border-white/5 flex items-center justify-center text-[#161616] dark:text-white">
                        <Clock className="w-4 h-4" strokeWidth={2} />
                      </div>
                    </div>
                    <div className="pl-2 flex flex-col">
                      <span className="text-[26px] font-bold text-[#161616] dark:text-white leading-tight mb-1">{lifetimeStats.totalHours}</span>
                      <div className="flex items-center gap-1 text-[11px] text-[#616161] dark:text-gray-400">
                        <span className="font-semibold text-[#16A34A] dark:text-emerald-400 flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3" /> +12.4%
                        </span>
                        <span>vs last FY</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Overtime */}
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-[#ECECEC] dark:border-[#2C2C35] p-5 relative overflow-hidden flex flex-col justify-between">
                    <div className="w-1.5 h-full bg-[#16A34A] dark:bg-emerald-500 absolute left-0 top-0" />
                    <div className="pl-2 flex items-center justify-between mb-3">
                      <span className="text-[12px] font-semibold text-[#8B8B8B] uppercase tracking-wider">Total Overtime</span>
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 flex items-center justify-center text-[#16A34A] dark:text-emerald-400">
                        <Timer className="w-4 h-4" strokeWidth={2} />
                      </div>
                    </div>
                    <div className="pl-2 flex flex-col">
                      <span className="text-[26px] font-bold text-[#161616] dark:text-white leading-tight mb-1">{lifetimeStats.overtime}</span>
                      <span className="text-[11px] font-semibold text-[#616161] dark:text-gray-400">Avg {lifetimeStats.avgHoursPerWeek} / week</span>
                    </div>
                  </div>

                  {/* Card 3: Leaves */}
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-[#ECECEC] dark:border-[#2C2C35] p-5 relative overflow-hidden flex flex-col justify-between">
                    <div className="w-1.5 h-full bg-amber-500 absolute left-0 top-0" />
                    <div className="pl-2 flex items-center justify-between mb-3">
                      <span className="text-[12px] font-semibold text-[#8B8B8B] uppercase tracking-wider">Leaves Taken</span>
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Coffee className="w-4 h-4" strokeWidth={2} />
                      </div>
                    </div>
                    <div className="pl-2 flex flex-col">
                      <span className="text-[26px] font-bold text-[#161616] dark:text-white leading-tight mb-1">{lifetimeStats.leaves}</span>
                      <span className="text-[11px] font-semibold text-[#616161] dark:text-gray-400">Across tenure</span>
                    </div>
                  </div>

                  {/* Card 4: Work Sites */}
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-[#ECECEC] dark:border-[#2C2C35] p-5 relative overflow-hidden flex flex-col justify-between">
                    <div className="w-1.5 h-full bg-[#161616] dark:bg-white absolute left-0 top-0" />
                    <div className="pl-2 flex items-center justify-between mb-3">
                      <span className="text-[12px] font-semibold text-[#8B8B8B] uppercase tracking-wider">Work Sites</span>
                      <div className="w-8 h-8 rounded-lg bg-[#FAFAF9] dark:bg-[#2C2C35] border border-[#ECECEC] dark:border-white/5 flex items-center justify-center text-[#161616] dark:text-white">
                        <Building2 className="w-4 h-4" strokeWidth={2} />
                      </div>
                    </div>
                    <div className="pl-2 flex flex-col">
                      <span className="text-[26px] font-bold text-[#161616] dark:text-white leading-tight mb-1">{lifetimeStats.sites} Sites</span>
                      <span className="text-[11px] font-semibold text-[#616161] dark:text-gray-400">Primary: Singapore HQ</span>
                    </div>
                  </div>

                </div>

                {/* Fiscal Year Quick Overview */}
                <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-[#ECECEC] dark:border-[#2C2C35] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[15px] font-bold text-[#161616] dark:text-white">{currentFy.label} — Summary</h3>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-[#16A34A] dark:bg-emerald-500/10 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200/50">
                      Active Fiscal Year
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#FAFAF9] dark:bg-[#2C2C35] rounded-xl border border-[#ECECEC] dark:border-white/5">
                      <span className="text-[12px] font-semibold text-[#8B8B8B]">FY Total Logged</span>
                      <span className="block text-[22px] font-bold text-[#161616] dark:text-white mt-1">{currentData.summary.hours}</span>
                    </div>
                    <div className="p-4 bg-[#FAFAF9] dark:bg-[#2C2C35] rounded-xl border border-[#ECECEC] dark:border-white/5">
                      <span className="text-[12px] font-semibold text-[#8B8B8B]">FY Overtime</span>
                      <span className="block text-[22px] font-bold text-[#16A34A] dark:text-emerald-400 mt-1">{currentData.summary.overtime}</span>
                    </div>
                    <div className="p-4 bg-[#FAFAF9] dark:bg-[#2C2C35] rounded-xl border border-[#ECECEC] dark:border-white/5">
                      <span className="text-[12px] font-semibold text-[#8B8B8B]">FY Leaves</span>
                      <span className="block text-[22px] font-bold text-[#161616] dark:text-white mt-1">{currentData.summary.leaves}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: MONTHLY CALENDAR MATRIX TAB ── */}
            {activeTab === "Monthly Calendar Matrix" && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-[16px] font-bold text-[#161616] dark:text-white">Monthly Attendance & Log Matrix ({currentFy.label})</h3>
                    <p className="text-[13px] text-[#8B8B8B] font-medium mt-0.5">7-column day matrix for every month in the active Fiscal Year</p>
                  </div>

                  {/* Day Status Legend */}
                  <div className="flex items-center gap-4 text-[12px] font-semibold text-[#616161] dark:text-gray-400 bg-white dark:bg-[#1C1C1E] px-4 py-2 rounded-xl border border-[#ECECEC] dark:border-[#2C2C35]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
                      <span>Approved Log</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span>Overtime</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span>Leave</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                      <span>Weekend</span>
                    </div>
                  </div>
                </div>

                {/* 12 Months Mini Calendar Matrix Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {currentData.months.map((m, idx) => {
                    const isUpcoming = m.status === "Upcoming";
                    
                    return (
                      <div
                        key={idx}
                        className={`bg-white dark:bg-[#1C1C1E] rounded-xl border border-[#ECECEC] dark:border-[#2C2C35] p-5 flex flex-col justify-between ${
                          isUpcoming ? "opacity-40" : "hover:border-black/30 dark:hover:border-white/30 transition-all cursor-pointer shadow-sm"
                        }`}
                        onClick={() => !isUpcoming && setSelectedMonthModal(m)}
                      >
                        <div>
                          {/* Month Card Header */}
                          <div className="flex items-center justify-between pb-3 border-b border-[#ECECEC] dark:border-[#2C2C35] mb-4">
                            <div className="flex flex-col">
                              <span className="text-[15px] font-bold text-[#161616] dark:text-white">{m.month} {m.year}</span>
                              <span className="text-[11px] font-semibold text-[#8B8B8B]">{m.status}</span>
                            </div>
                            <div className="text-right flex flex-col">
                              <span className="text-[13px] font-bold text-[#161616] dark:text-white">{m.hours}</span>
                              {m.overtime !== "-" && <span className="text-[11px] font-bold text-[#16A34A] dark:text-emerald-400">+{m.overtime} OT</span>}
                            </div>
                          </div>

                          {/* Mini Calendar Day Matrix (7 Columns: M T W T F S S) */}
                          <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {["M", "T", "W", "T", "F", "S", "S"].map((d, di) => (
                              <span key={di} className="text-[10px] font-bold text-[#8B8B8B] uppercase">{d}</span>
                            ))}
                          </div>

                          <div className="grid grid-cols-7 gap-1">
                            {m.days.map((dItem) => {
                              let statusBg = "bg-[#FAFAF9] dark:bg-[#2C2C35] text-gray-400";
                              if (dItem.status === "approved") statusBg = "bg-emerald-50 dark:bg-emerald-500/10 text-[#16A34A] dark:text-emerald-400 border border-emerald-200/50";
                              if (dItem.status === "overtime") statusBg = "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/50 font-bold";
                              if (dItem.status === "leave") statusBg = "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/50";
                              if (dItem.status === "weekend") statusBg = "bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-gray-600";

                              return (
                                <div
                                  key={dItem.day}
                                  className={`h-6 rounded-md flex items-center justify-center text-[10px] font-semibold transition-all ${statusBg}`}
                                >
                                  {dItem.day}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {!isUpcoming && (
                          <div className="pt-3 mt-3 border-t border-[#ECECEC] dark:border-[#2C2C35] flex items-center justify-between text-[11px] font-bold text-[#616161] dark:text-gray-400">
                            <span>View Daily Log Details</span>
                            <Eye className="w-3.5 h-3.5 text-gray-500" strokeWidth={2} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── TAB 3: FY BREAKDOWN TAB ── */}
            {activeTab === "FY Breakdown" && (
              <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-[#ECECEC] dark:border-[#2C2C35] p-6 animate-in fade-in duration-300">
                <h3 className="text-[15px] font-bold text-[#161616] dark:text-white mb-6">Monthly Breakdown Table ({currentFy.label})</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#ECECEC] dark:border-[#2C2C35] bg-[#FAFAF9] dark:bg-[#2C2C35]">
                        <th className="py-3 px-4 text-[12px] font-bold text-[#8B8B8B] uppercase">Month</th>
                        <th className="py-3 px-4 text-[12px] font-bold text-[#8B8B8B] uppercase">Status</th>
                        <th className="py-3 px-4 text-[12px] font-bold text-[#8B8B8B] uppercase text-right">Standard Hours</th>
                        <th className="py-3 px-4 text-[12px] font-bold text-[#8B8B8B] uppercase text-right">Overtime</th>
                        <th className="py-3 px-4 text-[12px] font-bold text-[#8B8B8B] uppercase text-right">Leaves</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECECEC] dark:divide-[#2C2C35]">
                      {currentData.months.map((m, idx) => (
                        <tr key={idx} className="hover:bg-[#FAFAF9] dark:hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-4 text-[13.5px] font-bold text-[#161616] dark:text-white">{m.month} {m.year}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              m.status === "Completed" ? "bg-emerald-50 text-[#16A34A] border-emerald-200/50" :
                              m.status === "In Progress" ? "bg-amber-50 text-amber-600 border-amber-200/50" : "bg-gray-100 text-gray-500 border-gray-200"
                            }`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[13.5px] font-semibold text-[#161616] dark:text-white text-right">{m.hours}</td>
                          <td className="py-3.5 px-4 text-[13.5px] font-bold text-[#16A34A] dark:text-emerald-400 text-right">{m.overtime}</td>
                          <td className="py-3.5 px-4 text-[13.5px] font-semibold text-[#161616] dark:text-white text-right">{m.leaves} Days</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 4: SITE ALLOCATION TAB ── */}
            {activeTab === "Site Allocation" && (
              <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-[#ECECEC] dark:border-[#2C2C35] p-6 animate-in fade-in duration-300">
                <h3 className="text-[15px] font-bold text-[#161616] dark:text-white mb-6">Site Allocation Breakdown ({currentFy.label})</h3>
                
                <div className="flex flex-col gap-5 max-w-2xl">
                  {currentData.sites.map((site, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[13.5px]">
                        <span className="font-bold text-[#161616] dark:text-white">{site.name}</span>
                        <span className="font-bold text-[#161616] dark:text-white">{site.hours}h ({site.pct}%)</span>
                      </div>
                      <div className="w-full bg-[#FAFAF9] dark:bg-[#2C2C35] rounded-full h-2.5 overflow-hidden border border-[#ECECEC] dark:border-white/5">
                        <div className="h-full bg-[#16A34A] dark:bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${site.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Day Details Modal */}
      {selectedMonthModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedMonthModal(null)}
        >
          <div 
            className="bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-[#2C2C35] rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#ECECEC] dark:border-[#2C2C35] pb-4">
              <div className="flex flex-col">
                <h3 className="text-[18px] font-bold text-[#161616] dark:text-white">{selectedMonthModal.month} {selectedMonthModal.year} Daily Logs</h3>
                <span className="text-[12px] text-[#8B8B8B] font-semibold">Total Logged: {selectedMonthModal.hours} | Overtime: {selectedMonthModal.overtime}</span>
              </div>
              <button 
                onClick={() => setSelectedMonthModal(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto page-scrollbar flex flex-col gap-2">
              {selectedMonthModal.days.filter(d => d.status !== "empty" && d.status !== "weekend").map(d => (
                <div key={d.day} className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAF9] dark:bg-[#2C2C35] border border-[#ECECEC] dark:border-white/5 text-[13px]">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-[#2C2C35] flex items-center justify-center font-bold text-[#161616] dark:text-white shrink-0">
                      {d.day}
                    </span>
                    <span className="font-bold text-[#161616] dark:text-white">{selectedMonthModal.month} {d.day}, {selectedMonthModal.year}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {d.status === "overtime" && <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-[11px] font-bold border border-blue-200/50">Overtime 2h</span>}
                    {d.status === "leave" && <span className="px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 text-[11px] font-bold border border-rose-200/50">Casual Leave</span>}
                    {d.status === "approved" && <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-[#16A34A] dark:bg-emerald-500/10 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200/50">8h Logged</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setSelectedMonthModal(null)}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-bold text-[13px] rounded-xl cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

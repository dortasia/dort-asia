"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  Check,
  Clock,
  Briefcase,
  Timer,
  AlertCircle,
  X,
  Calendar,
  CheckCircle,
  FileClock,
  MapPin,
  Coffee,
  UserX,
  Sparkles,
  CheckCircle2,
  BarChart3,
  FileText,
  Database,
  SlidersHorizontal,
  RotateCcw
} from "lucide-react";

import HeaderSearchBar from "@/components/HeaderSearchBar";
import { createClient } from "@/utils/supabase/client";

// Local date utilities to replace date-fns dependency
const startOfWeek = (date: Date, options: { weekStartsOn: number }) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day < options.weekStartsOn ? 7 : 0) + day - options.weekStartsOn;
  d.setDate(d.getDate() - diff);
  return d;
};

const endOfWeek = (date: Date, options: { weekStartsOn: number }) => {
  const d = startOfWeek(date, options);
  d.setDate(d.getDate() + 6);
  return d;
};

const addDays = (date: Date, amount: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
};

const format = (date: Date, fmt: string) => {
  if (fmt === 'yyyy-MM-dd') {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } else if (fmt === 'EEE') {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else if (fmt === 'd MMM') {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }
  return date.toString();
};

const getWeeksInMonth = (period: string) => {
  const months: Record<string, number> = { January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 };
  const parts = period.split(" ");
  const month = months[parts[0]] ?? new Date().getMonth();
  const year = parseInt(parts[1]) || new Date().getFullYear();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  const weeks = [];
  let currentStart = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
  
  while (currentStart <= lastDayOfMonth) {
    const currentEnd = endOfWeek(currentStart, { weekStartsOn: 1 });
    weeks.push(`${format(currentStart, 'd MMM')} - ${format(currentEnd, 'd MMM')}`);
    currentStart = addDays(currentStart, 7);
  }
  return weeks;
};

const getWeekDateRange = (period: string, weekLabel: string) => {
  const weeks = getWeeksInMonth(period);
  let weekNum = weeks.indexOf(weekLabel) + 1;
  if (weekNum <= 0) {
    const weekMatch = weekLabel.match(/\d+/);
    weekNum = weekMatch ? parseInt(weekMatch[0]) : 1;
  }

  const months: Record<string, number> = { January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 };
  const parts = period.split(" ");
  const month = months[parts[0]] ?? new Date().getMonth();
  const year = parseInt(parts[1]) || new Date().getFullYear();
  
  const firstDayOfMonth = new Date(year, month, 1);
  let weekStart = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
  if (weekNum > 1) {
    weekStart = addDays(weekStart, (weekNum - 1) * 7);
  }
  
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  return { weekStart, weekEnd };
};

export interface TimesheetEntry {
  id: string;
  name: string;
  role: string;
  project: string;
  department: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
  total: string;
  status: string;
  siteData?: SiteRecord;
}

export type SiteEntry = { name: string; hours: string };
export type SiteRecord = { sites: SiteEntry[]; breakTime: string; absent: number; summary: string };

// Temporary mock siteData fallback for ExpandedRow
const fallbackSiteData: SiteRecord = {
  sites: [{ name: "HQ - Block A", hours: "40h 00m" }], 
  breakTime: "4h 00m", 
  absent: 0, 
  summary: "Employee maintained a full workweek with consistent output. Performance is on track."
};
// Remove extended mock block
// ...

// Day Details Side Panel Component
function DayDetailsPanel({ info, onClose, employeesData }: { info: {day: number, month: number, year: number, hours: string, status: string, color: string}, onClose: () => void, employeesData: TimesheetEntry[] }) {
  const [activeSubTab, setActiveSubTab] = React.useState("Overview");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [visibleCount, setVisibleCount] = React.useState(10);

  const leavesData = [
    { 
      name: "Monisha P", 
      type: "Casual Leave (CL)", 
      badge: "Full Day", 
      color: "orange", 
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face" 
    },
    { 
      name: "Karthik V", 
      type: "Sick Leave (SL)", 
      badge: "First Half", 
      color: "blue", 
      avatar: null 
    },
  ];

  const dateStr = new Date(info.year, info.month, info.day).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const totalEmployees = employeesData.length;

  const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
  const dow = new Date(info.year, info.month, info.day).getDay();
  const dayKey = dayMap[dow];

  const filteredEmployees = employeesData.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleEmployees = filteredEmployees.slice(0, visibleCount);

  const tabs = [
    { id: "Overview", label: "Overview" },
    { id: "Employees", label: `Employees (${totalEmployees})` },
    { id: "Sites", label: "Sites (3)" },
    { id: "Leaves", label: "Leaves (2)" }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/20 backdrop-blur-[2px]" onClick={onClose}>
      <div 
        className="w-[40%] min-w-[450px] max-w-[600px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex flex-col gap-5 shrink-0">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <h2 className="text-[20px] font-semibold text-[#161616]">{dateStr}</h2>
                 <span className="px-2 py-1 bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF] text-[11px] font-medium rounded-md">
                   {info.status}
                 </span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                 <X className="w-5 h-5 text-[#616161]" />
              </button>
           </div>
           
           <div className="flex items-end justify-between">
              <div className="flex flex-col gap-1">
                 <span className="text-[13px] text-[#616161]">Total Worked Hours</span>
                 <div className="flex items-center gap-3">
                   <span className="text-[28px] font-semibold text-[#161616]">{info.hours}</span>
                   {info.color === 'red' && <span className="px-2 py-0.5 bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] text-[11px] font-medium rounded-md">Overtime 1h</span>}
                 </div>
              </div>
              <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                 <Calendar className="w-4 h-4 text-[#616161]" />
              </button>
           </div>

           {/* Tabs */}
           <div className="flex items-center gap-6 mt-2 border-b border-gray-100">
              {tabs.map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${activeSubTab === tab.id ? 'border-[#007AFF] text-[#007AFF]' : 'border-transparent text-[#616161] hover:text-[#616161]'}`}
                >
                  {tab.label}
                </button>
              ))}
           </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white flex flex-col gap-6">
           
           {activeSubTab === "Overview" && (
              <>
                 {/* Grid for Top Workers and Stats */}
                 <div className="grid grid-cols-[1.3fr_1fr] gap-6">
                    {/* Top Workers */}
                    <div className="bg-white border border-gray-100 rounded-[12px] p-5">
                       <div className="flex items-start justify-between mb-5">
                          <div className="flex flex-col gap-0.5">
                             <h3 className="text-[14px] font-semibold text-[#161616]">Top Workers</h3>
                             <span className="text-[11px] text-[#8B8B8B] font-medium">Based on Hours</span>
                          </div>
                          <button className="text-[12px] font-semibold text-[#007AFF] hover:text-blue-700 transition-colors mt-0.5" onClick={() => setActiveSubTab("Employees")}>View all</button>
                       </div>
                       <div className="flex flex-col gap-4">
                          {[
                            {name: "Arun Kumar", role: "UI/UX Designer", hours: "9h 30m"},
                            {name: "Keerthana S", role: "Frontend Developer", hours: "9h 15m"},
                            {name: "Vignesh M", role: "Backend Developer", hours: "9h 00m"},
                            {name: "Priya Darshini", role: "QA Engineer", hours: "8h 45m"},
                            {name: "Sathish R", role: "DevOps Engineer", hours: "8h 30m"},
                          ].map((w, i) => (
                            <div key={w.name} className="flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                  <span className="text-[12px] font-medium text-[#8B8B8B] w-3">{i+1}</span>
                                  <div className="flex flex-col">
                                     <span className="text-[13px] font-semibold text-[#161616] truncate max-w-[130px] xl:max-w-[170px]">{w.name}</span>
                                     <span className="text-[11px] text-[#616161] truncate max-w-[130px] xl:max-w-[170px]">{w.role}</span>
                                  </div>
                               </div>
                               <span className="text-[13px] font-semibold text-[#161616]">{w.hours}</span>
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col gap-4">
                       <div className="bg-white border border-gray-100 rounded-[12px] p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                             <Timer className="w-4 h-4 text-blue-500" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[11px] font-medium text-[#616161]">Total Break Overall</span>
                             <span className="text-[15px] font-semibold text-[#161616]">6h 20m</span>
                          </div>
                       </div>
                       <div className="bg-white border border-gray-100 rounded-[12px] p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                             <Clock className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[11px] font-medium text-[#616161]">Total Basic Hours</span>
                             <span className="text-[15px] font-semibold text-[#161616]">210h 00m</span>
                          </div>
                       </div>
                       <div className="bg-white border border-gray-100 rounded-[12px] p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                             <Clock className="w-4 h-4 text-rose-500" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[11px] font-medium text-[#616161]">Total Overtime</span>
                             <span className="text-[15px] font-semibold text-[#161616]">18h 30m</span>
                          </div>
                       </div>
                       <div className="bg-white border border-gray-100 rounded-[12px] p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                             <CheckCircle className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[11px] font-medium text-[#616161]">Total Worked Hours</span>
                             <span className="text-[15px] font-semibold text-[#161616]">228h 30m</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Leaves Taken */}
                 <div className="bg-white border border-gray-100 rounded-[12px] p-5">
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="text-[13px] font-semibold text-[#161616]">Leaves Taken (2)</h3>
                       <button className="text-[12px] font-semibold text-[#007AFF] hover:text-blue-700 transition-colors" onClick={() => setActiveSubTab("Leaves")}>View all</button>
                    </div>
                    <div className="flex flex-col gap-4">
                     {leavesData.map(l => (
                       <div key={l.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-[13px] font-semibold text-[#007AFF] shrink-0 overflow-hidden">
                               {l.avatar ? (
                                 <img src={l.avatar} alt={l.name} className="w-full h-full object-cover" />
                               ) : (
                                 l.name.charAt(0)
                               )}
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[13px] font-semibold text-[#161616]">{l.name}</span>
                                <span className="text-[12px] text-[#616161]">{l.type}</span>
                             </div>
                          </div>
                          <span className={`px-2.5 py-1 text-[11px] font-medium rounded-md border ${l.color === 'orange' ? 'bg-[#FFF7E6] text-[#B86B11] border-[#FFEBCC]' : 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'}`}>
                             {l.badge}
                          </span>
                       </div>
                     ))}
                  </div>
                 </div>

                 {/* Sites Covered */}
                 <div className="bg-white border border-gray-100 rounded-[12px] overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-gray-50">
                       <h3 className="text-[13px] font-semibold text-[#161616]">Sites Covered</h3>
                       <span className="text-[12px] text-[#616161] font-medium">Total 3 Sites</span>
                    </div>
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-gray-50">
                             <th className="px-5 py-3 text-[11px] font-medium text-[#8B8B8B]">Site</th>
                             <th className="px-5 py-3 text-[11px] font-medium text-[#8B8B8B]">Employees</th>
                             <th className="px-5 py-3 text-[11px] font-medium text-[#8B8B8B] text-right">Total Worked Hours</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          {[
                            {site: "Marina Bay Office", emp: 18, hrs: "128h 30m", pct: 80},
                            {site: "Jurong East Warehouse", emp: 7, hrs: "56h 00m", pct: 40},
                            {site: "Changi Project Site", emp: 3, hrs: "44h 00m", pct: 25},
                          ].map(s => (
                            <tr key={s.site}>
                               <td className="px-5 py-3 text-[12px] font-semibold text-[#161616]">{s.site}</td>
                               <td className="px-5 py-3">
                                  <div className="flex items-center gap-3">
                                     <span className="text-[12px] font-semibold text-[#616161] w-4">{s.emp}</span>
                                     <div className="w-16 xl:w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#007AFF] rounded-full" style={{ width: `${s.pct}%` }} />
                                     </div>
                                  </div>
                               </td>
                               <td className="px-5 py-3 text-[12px] font-semibold text-[#161616] text-right">{s.hrs}</td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>

                 {/* Footer Alert */}
                 <div className="bg-[#ECFDF3] border border-[#D1FADF] rounded-[12px] p-4 flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                       <span className="text-[13px] font-semibold text-emerald-800">All timesheets for this day are approved.</span>
                       <span className="text-[11px] text-emerald-600 mt-0.5">Last updated by Karthik V on 29 May 2025, 10:15 AM</span>
                    </div>
                 </div>
              </>
           )}

           {activeSubTab === "Employees" && (
              <div className="flex flex-col gap-4">
                 {/* Search bar */}
                 <div className="relative">
                    <Search className="w-4 h-4 text-[#8B8B8B] absolute left-3 top-3.5" />
                    <input 
                      type="text" 
                      placeholder="Search employees..." 
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(10); }}
                      className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#007AFF] text-[#161616]"
                    />
                 </div>
                 
                 {/* Employees List */}
                 <div className="flex flex-col border border-gray-100 rounded-[12px] overflow-hidden divide-y divide-gray-100">
                    {visibleEmployees.map((emp) => {
                       const empHours = (emp[dayKey as keyof typeof emp] as string) || "-";
                       const statusColors: Record<string, string> = {
                         Approved: "bg-[#ECFDF3] text-[#027A48] border-[#D1FADF]",
                         Pending: "bg-[#FFF7E6] text-[#B86B11] border-[#FFEBCC]"
                       };
                       
                        return (
                          <div key={emp.id} className="p-4 flex items-center justify-between bg-white hover:bg-gray-50/50 transition-colors">
                             <div className="flex flex-col">
                                <span className="text-[13px] font-semibold text-[#161616]">{emp.name}</span>
                                <span className="text-[11px] text-[#8B8B8B] font-medium">EMP-{String(emp.id).padStart(3, '0')}</span>
                             </div>
                             <span className="text-[13px] font-semibold text-[#161616]">{empHours}</span>
                          </div>
                       );
                    })}
                 </div>

                 {/* Load More Button */}
                 {visibleCount < filteredEmployees.length && (
                    <div className="flex justify-center mt-4">
                       <button 
                         onClick={() => setVisibleCount(prev => prev + 10)}
                         className="px-6 py-2 border border-[#007AFF] text-[#007AFF] hover:bg-blue-50 text-[13px] font-semibold rounded-lg transition-colors"
                       >
                         Load More
                       </button>
                    </div>
                 )}
              </div>
           )}

           {activeSubTab === "Sites" && (
              <div className="bg-white border border-gray-100 rounded-[12px] overflow-hidden">
                 <div className="flex items-center justify-between p-5 border-b border-gray-50">
                    <h3 className="text-[13px] font-semibold text-[#161616]">Sites Covered</h3>
                    <span className="text-[12px] text-[#616161] font-medium">Total 3 Sites</span>
                 </div>
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-gray-50">
                          <th className="px-5 py-3 text-[11px] font-medium text-[#8B8B8B]">Site Name</th>
                          <th className="px-5 py-3 text-[11px] font-medium text-[#8B8B8B]">Employees Logged</th>
                          <th className="px-5 py-3 text-[11px] font-medium text-[#8B8B8B] text-right">Total Hours</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {[
                         {site: "Marina Bay Office", emp: 18, hrs: "128h 30m", pct: 80},
                         {site: "Jurong East Warehouse", emp: 7, hrs: "56h 00m", pct: 40},
                         {site: "Changi Project Site", emp: 3, hrs: "44h 00m", pct: 25},
                       ].map(s => (
                         <tr key={s.site}>
                            <td className="px-5 py-3 text-[12px] font-semibold text-[#161616]">{s.site}</td>
                            <td className="px-5 py-3">
                               <div className="flex items-center gap-3">
                                  <span className="text-[12px] font-semibold text-[#616161] w-4">{s.emp}</span>
                                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                     <div className="h-full bg-[#007AFF] rounded-full" style={{ width: `${s.pct}%` }} />
                                  </div>
                               </div>
                            </td>
                            <td className="px-5 py-3 text-[12px] font-semibold text-[#161616] text-right">{s.hrs}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           )}

           {activeSubTab === "Leaves" && (
              <div className="bg-white border border-gray-100 rounded-[12px] p-5">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[13px] font-semibold text-[#161616]">Leaves Breakdown</h3>
                 </div>
                 <div className="flex flex-col gap-4">
                    {leavesData.map(l => (
                      <div key={l.name} className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-[13px] font-semibold text-[#007AFF] shrink-0 overflow-hidden">
                               {l.avatar ? (
                                 <img src={l.avatar} alt={l.name} className="w-full h-full object-cover" />
                               ) : (
                                 l.name.charAt(0)
                               )}
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[13px] font-semibold text-[#161616]">{l.name}</span>
                               <span className="text-[12px] text-[#616161]">{l.type}</span>
                            </div>
                         </div>
                         <span className={`px-2.5 py-1 text-[11px] font-medium rounded-md border ${l.color === 'orange' ? 'bg-[#FFF7E6] text-[#B86B11] border-[#FFEBCC]' : 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'}`}>
                            {l.badge}
                         </span>
                      </div>
                    ))}
                 </div>
              </div>
           )}

        </div>
      </div>
    </div>
  );
}

// Calendar View Component
function CalendarView({ selectedPeriod, timesheetData }: { selectedPeriod: string, timesheetData: TimesheetEntry[] }) {
  const [selectedDayInfo, setSelectedDayInfo] = React.useState<null | {day: number, month: number, year: number, hours: string, status: string, color: string}>(null);

  const parseMonth = (period: string) => {
    const months: Record<string, number> = { January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 };
    const parts = period.split(" ");
    const monthName = parts[0];
    const year = parseInt(parts[1]) || new Date().getFullYear();
    return { month: months[monthName] ?? 7, year };
  };

  const [calState, setCalState] = React.useState(() => parseMonth(selectedPeriod));

  React.useEffect(() => {
    setCalState(parseMonth(selectedPeriod));
  }, [selectedPeriod]);

  const { month, year } = calState;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month, 1).toLocaleString("default", { month: "long" });

  const prevMonth = () => setCalState(s => {
    const d = new Date(s.year, s.month - 1, 1);
    return { month: d.getMonth(), year: d.getFullYear() };
  });
  const nextMonth = () => setCalState(s => {
    const d = new Date(s.year, s.month + 1, 1);
    return { month: d.getMonth(), year: d.getFullYear() };
  });

  const today = new Date();
  const blanks = firstDay === 0 ? 6 : firstDay - 1; // Start week on Mon

  const getDayStatus = (day: number, dow: number) => {
    if (dow === 0 || dow === 6) return { hours: "-", status: "No Entry", color: "gray" };
    
    const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
    const dayKey = dayMap[dow];

    let totalMinutes = 0;
    timesheetData.forEach(emp => {
      const val = emp[dayKey as keyof typeof emp] as string;
      if (val && val !== "-") {
        const parts = val.split(" ");
        let h = 0, m = 0;
        if (parts[0]) h = parseInt(parts[0].replace("h", "")) || 0;
        if (parts[1]) m = parseInt(parts[1].replace("m", "")) || 0;
        totalMinutes += (h * 60) + m;
      }
    });

    if (totalMinutes === 0) return { hours: "-", status: "No Entry", color: "gray" };

    const finalH = Math.floor(totalMinutes / 60);
    const finalM = totalMinutes % 60;
    const hoursStr = `${finalH}h ${finalM === 0 ? "00" : finalM < 10 ? "0" + finalM : finalM}m`;

    let status = "Approved";
    let color = "green";
    
    if (day === 28) { status = "Overtime"; color = "red"; }
    else if (day === 30) { status = "Partial"; color = "blue"; }

    return { hours: hoursStr, status, color };
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          {!(month === today.getMonth() && year === today.getFullYear()) && (
            <button 
              onClick={() => setCalState({ month: today.getMonth(), year: today.getFullYear() })} 
              className="px-4 py-1.5 rounded-lg border border-gray-200 text-[#616161] text-[13px] font-medium hover:bg-gray-50 transition-colors"
            >
              Today
            </button>
          )}
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-[#616161] hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-[14px] text-[#161616] min-w-[130px] text-center">{monthName} {year}</span>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-[#616161] hover:bg-gray-50 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-5">
          {[{ label: "Approved", color: "bg-emerald-500" }, { label: "Pending", color: "bg-amber-500" }, { label: "Rejected", color: "bg-rose-500" }, { label: "Half Day", color: "bg-[#007AFF]" }, { label: "No Entry", color: "bg-gray-400" }].map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${l.color}`} />
              <span className="text-[12px] font-medium text-[#616161]">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 w-full border-l border-gray-100">
        {/* Day Headers */}
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
          <div key={d} className="py-4 text-center text-[12px] font-semibold text-[#616161] border-r border-b border-gray-100 bg-[#F8F9FA]">
            {d}
          </div>
        ))}

        {/* Blank preceding days */}
        {Array.from({ length: blanks }).map((_, i) => {
          const prevMonthDays = new Date(year, month, 0).getDate();
          return (
            <div key={`blank-${i}`} className="min-h-[140px] p-4 border-r border-b border-gray-100 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.03)_10px,rgba(0,0,0,0.03)_11px)] flex flex-col items-start">
              <span className="text-[13px] text-[#8B8B8B] font-medium">{prevMonthDays - blanks + i + 1}</span>
            </div>
          );
        })}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dow = new Date(year, month, day).getDay();
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isPast = (year < today.getFullYear()) || 
                         (year === today.getFullYear() && month < today.getMonth()) ||
                         (year === today.getFullYear() && month === today.getMonth() && day < today.getDate());
                         
          const data = getDayStatus(day, dow);

          const BADGE_STYLES: Record<string, string> = {
            green: "bg-[#ECFDF3] text-[#027A48] border-[#D1FADF]",
            orange: "bg-[#FFF7E6] text-[#B86B11] border-[#FFEBCC]",
            red: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]",
            blue: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
            gray: "bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB]",
          };
          const badgeStyle = BADGE_STYLES[data.color] || BADGE_STYLES.gray;

          let bgClass = "bg-white";
          if (isToday) {
            bgClass = "bg-blue-50/50";
          } else if (isPast) {
            bgClass = "bg-gray-100"; // More distinctly grey background
          } else if (data.color === 'red') {
            bgClass = "bg-[#FEF2F2]/40";
          } else if (data.color === 'blue') {
            bgClass = "bg-[#EFF6FF]/40";
          }

          return (
            <div 
              key={day} 
              onClick={() => setSelectedDayInfo({ day, month, year, hours: data.hours, status: data.status, color: data.color })}
              className={`min-h-[140px] cursor-pointer p-4 border-r border-b border-gray-100 flex flex-col gap-3 transition-colors ${bgClass} ${isPast ? 'opacity-80' : 'hover:bg-gray-200/50'} ${isToday ? 'ring-2 ring-inset ring-[#007AFF] z-10 relative' : ''}`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`text-[13px] font-medium ${isToday ? "text-[#007AFF] bg-blue-50 px-1.5 py-0.5 rounded-md" : "text-[#616161]"}`}>{day}</span>
                {day === 1 && <span className={`text-[13px] font-medium ${isToday ? "text-[#007AFF]" : "text-[#616161]"}`}>{new Date(year, month, 1).toLocaleString('default', { month: 'short' })}</span>}
              </div>
              <span className="text-[14px] font-semibold text-[#161616] mt-1">{data.hours}</span>
              <span className={`inline-flex self-start px-2.5 py-1 rounded-md text-[11px] font-medium border ${badgeStyle}`}>{data.status}</span>
            </div>
          );
        })}

        {/* Blank trailing days */}
        {Array.from({ length: (blanks + daysInMonth) % 7 === 0 ? 0 : 7 - ((blanks + daysInMonth) % 7) }).map((_, i) => (
          <div key={`trailing-${i}`} className="min-h-[140px] p-4 border-r border-b border-gray-100 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.03)_10px,rgba(0,0,0,0.03)_11px)] flex flex-col items-start">
            <span className="text-[13px] text-[#8B8B8B] font-medium">{i + 1}</span>
          </div>
        ))}
      </div>

      {selectedDayInfo && (
        <DayDetailsPanel info={selectedDayInfo} onClose={() => setSelectedDayInfo(null)} employeesData={timesheetData} />
      )}
    </div>
  );
}

// Separate component to avoid IIFE hydration issues
function ExpandedRow({ item, data }: { item: TimesheetEntry; data: SiteRecord }) {
  // Parse total numerical hours for progress bar calculation
  const totalHoursNum = data.sites.reduce((acc, site) => {
    const matched = site.hours.match(/(\d+)h/);
    const h = matched ? parseInt(matched[1], 10) : 0;
    return acc + h;
  }, 0) || 40;

  // Filter top 2 most worked sites
  const top2Sites = [...data.sites]
    .sort((a, b) => {
      const hA = parseInt(a.hours.match(/(\d+)h/)?.[1] || "0", 10);
      const hB = parseInt(b.hours.match(/(\d+)h/)?.[1] || "0", 10);
      return hB - hA;
    })
    .slice(0, 2);

  return (
    <tr className="bg-[#FAFAF9]/80">
      <td colSpan={12} className="p-0 border-b border-[#ECECEC]">
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: [0, 0.4, 0, 1] }}
          className="px-8 py-6 flex flex-col gap-6"
        >
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-[#ECECEC] rounded-[12px] p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-[#616161] uppercase tracking-wider mb-1">Sites Worked</span>
                <span className="text-[20px] font-semibold text-[#161616] leading-tight">{data.sites.length} Active Sites</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#FAFAF9] border border-[#ECECEC] flex items-center justify-center text-[#616161] shrink-0">
                <MapPin className="w-4 h-4" strokeWidth={1.75} />
              </div>
            </div>

            <div className="bg-white border border-[#ECECEC] rounded-[12px] p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-[#616161] uppercase tracking-wider mb-1">Total Break Time</span>
                <span className="text-[20px] font-semibold text-[#161616] leading-tight">{data.breakTime}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#FAFAF9] border border-[#ECECEC] flex items-center justify-center text-[#616161] shrink-0">
                <Coffee className="w-4 h-4" strokeWidth={1.75} />
              </div>
            </div>

            <div className="bg-white border border-[#ECECEC] rounded-[12px] p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-[#616161] uppercase tracking-wider mb-1">Absent Days</span>
                <span className={`text-[20px] font-semibold leading-tight ${data.absent > 0 ? "text-[#DC2626]" : "text-[#16A34A]"}`}>
                  {data.absent} {data.absent === 1 ? "Day" : "Days"}
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#FAFAF9] border border-[#ECECEC] flex items-center justify-center text-[#616161] shrink-0">
                <UserX className="w-4 h-4" strokeWidth={1.75} />
              </div>
            </div>

            <div className="bg-white border border-[#ECECEC] rounded-[12px] p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-[#616161] uppercase tracking-wider mb-1">Total Hours</span>
                <span className="text-[20px] font-semibold text-[#161616] leading-tight">{item.total}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#FAFAF9] border border-[#ECECEC] flex items-center justify-center text-[#616161] shrink-0">
                <Clock className="w-4 h-4" strokeWidth={1.75} />
              </div>
            </div>
          </div>

          {/* Bottom Row: Horizontal Bar Data-Viz + AI Performance Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Horizontal Bar Chart (StatsDesign.md Data-Viz pattern) */}
            <div className="bg-white border border-[#ECECEC] rounded-[12px] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#616161]" strokeWidth={1.75} />
                    <span className="text-[12px] font-semibold text-[#616161] uppercase tracking-wider">Site Hours Allocation</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">Top 2 Worked Sites</span>
                </div>

                <div className="flex flex-col gap-3.5">
                  {top2Sites.map((site, si) => {
                    const matched = site.hours.match(/(\d+)h/);
                    const hoursVal = matched ? parseInt(matched[1], 10) : 0;
                    const pct = Math.min(100, Math.max(15, Math.round((hoursVal / totalHoursNum) * 100)));

                    return (
                      <div key={si} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[13px]">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#616161] shrink-0" strokeWidth={1.75} />
                            <span className="font-semibold text-[#161616]">{site.name}</span>
                          </div>
                          <span className="font-semibold text-[#161616]">{site.hours}</span>
                        </div>
                        <div className="w-full bg-[#FAFAF9] rounded-full h-2 overflow-hidden border border-[#ECECEC]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, delay: si * 0.1 }}
                            className="h-full bg-[#16A34A] rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AI Insights & Highlights */}
            <div className="bg-white border border-[#ECECEC] rounded-[12px] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-[#FAFAF9] border border-[#ECECEC] flex items-center justify-center text-[#161616]">
                    <Sparkles className="w-3.5 h-3.5 text-[#161616]" strokeWidth={1.75} />
                  </div>
                  <span className="text-[12px] font-semibold text-[#616161] uppercase tracking-wider">AI Weekly Performance Insights</span>
                </div>

                <p className="text-[13px] text-[#616161] leading-relaxed mb-4">
                  {data.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-[#ECECEC] flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200/50 text-[#16A34A] text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>98% On-Time Check-In</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAFAF9] border border-[#ECECEC] text-[#616161] text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#161616]" strokeWidth={1.75} />
                  <span>Overtime Verified</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </td>
    </tr>
  );
}

// Timesheet Approval mock data matching the screenshot
const mockApprovalData = [
  {
    id: 1,
    name: "Arun Kumar",
    role: "UI/UX Designer",
    department: "Design",
    dateRange: "19 May – 25 May 2025",
    type: "Weekly",
    totalHours: "40h 30m",
    billableHours: "32h 00m",
    overtimeHours: "4h 30m",
    status: "Pending",
    submittedOn: "25 May 2025",
    submittedTime: "10:30 AM",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face"
  },
  {
    id: 2,
    name: "Keerthana S",
    role: "Frontend Developer",
    department: "Development",
    dateRange: "19 May – 25 May 2025",
    type: "Weekly",
    totalHours: "45h 30m",
    billableHours: "40h 00m",
    overtimeHours: "5h 30m",
    status: "Pending",
    submittedOn: "25 May 2025",
    submittedTime: "09:15 AM",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"
  },
  {
    id: 3,
    name: "Vignesh M",
    role: "Backend Developer",
    department: "Development",
    dateRange: "19 May – 25 May 2025",
    type: "Weekly",
    totalHours: "39h 30m",
    billableHours: "32h 00m",
    overtimeHours: "3h 30m",
    status: "Pending",
    submittedOn: "25 May 2025",
    submittedTime: "11:45 AM",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face"
  },
  {
    id: 4,
    name: "Priya Darshini",
    role: "QA Engineer",
    department: "QA",
    dateRange: "19 May – 25 May 2025",
    type: "Weekly",
    totalHours: "39h 00m",
    billableHours: "39h 00m",
    overtimeHours: "0h 00m",
    status: "Pending",
    submittedOn: "25 May 2025",
    submittedTime: "02:20 PM",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face"
  },
  {
    id: 5,
    name: "Sathish R",
    role: "DevOps Engineer",
    department: "DevOps",
    dateRange: "19 May – 25 May 2025",
    type: "Weekly",
    totalHours: "46h 30m",
    billableHours: "36h 00m",
    overtimeHours: "6h 30m",
    status: "Pending",
    submittedOn: "25 May 2025",
    submittedTime: "01:05 PM",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=80&h=80&fit=crop&crop=face"
  },
  {
    id: 6,
    name: "Monisha P",
    role: "Product Manager",
    department: "Management",
    dateRange: "19 May – 25 May 2025",
    type: "Weekly",
    totalHours: "40h 00m",
    billableHours: "32h 00m",
    overtimeHours: "0h 00m",
    status: "Pending",
    submittedOn: "25 May 2025",
    submittedTime: "09:40 AM",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face"
  },
  {
    id: 7,
    name: "Karthik V",
    role: "UI/UX Designer",
    department: "Design",
    dateRange: "19 May – 25 May 2025",
    type: "Weekly",
    totalHours: "40h 45m",
    billableHours: "32h 00m",
    overtimeHours: "4h 45m",
    status: "Pending",
    submittedOn: "25 May 2025",
    submittedTime: "10:50 AM",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face"
  },
  {
    id: 8,
    name: "Nandhini R",
    role: "Content Writer",
    department: "Marketing",
    dateRange: "19 May – 25 May 2025",
    type: "Weekly",
    totalHours: "38h 00m",
    billableHours: "38h 00m",
    overtimeHours: "0h 00m",
    status: "Pending",
    submittedOn: "25 May 2025",
    submittedTime: "03:30 PM",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face"
  }
];

export default function TimesheetPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Calendar View");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedPeriod, setSelectedPeriod] = useState("August 2026");
  const [selectedApprovalRows, setSelectedApprovalRows] = useState<string[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const periodDropdownRef = React.useRef<HTMLDivElement>(null);
  
  const [selectedWeek, setSelectedWeek] = useState(() => getWeeksInMonth("August 2026")[0]);
  const [isWeekOpen, setIsWeekOpen] = useState(false);
  const weekDropdownRef = React.useRef<HTMLDivElement>(null);

  // Filter Side Panel states
  const [filters, setFilters] = useState<{ departments: string[]; roles: string[]; status: string[] }>({
    departments: [],
    roles: [],
    status: []
  });
  const [draftFilters, setDraftFilters] = useState<{ departments: string[]; roles: string[]; status: string[] }>({
    departments: [],
    roles: [],
    status: []
  });
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const [timesheetData, setTimesheetData] = useState<TimesheetEntry[]>([]);
  const [timesheetStats, setTimesheetStats] = useState({ logged: "0h 00m", standard: "0h 00m", overtime: "0h 00m", pending: "0" });
  const [loading, setLoading] = useState(true);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const availableDepartments = Array.from(new Set(timesheetData.map(d => d.department))).filter(Boolean);
  const availableRoles = Array.from(new Set(timesheetData.map(d => d.role))).filter(Boolean);
  const availableStatuses = ["Approved", "Pending"];

  const activeFilterCount = filters.departments.length + filters.roles.length + filters.status.length;
  const draftFilterCount = draftFilters.departments.length + draftFilters.roles.length + draftFilters.status.length;
  
  const [approvalCurrentPage, setApprovalCurrentPage] = useState(1);
  const [approvalPageSize, setApprovalPageSize] = useState(8);

  const actionDropdownRef = useRef<HTMLDivElement>(null);
  const actionBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target as Node)) {
        setIsPeriodOpen(false);
      }
      if (weekDropdownRef.current && !weekDropdownRef.current.contains(event.target as Node)) {
        setIsWeekOpen(false);
      }
      // Only close action dropdown if click is outside the dropdown AND outside the trigger button
      if (openDropdownId) {
        const clickedInDropdown = actionDropdownRef.current?.contains(event.target as Node);
        const clickedOnTrigger = Object.values(actionBtnRefs.current).some(btn => btn?.contains(event.target as Node));
        if (!clickedInDropdown && !clickedOnTrigger) {
          setOpenDropdownId(null);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownId]);

  React.useEffect(() => {
    async function fetchTimesheetData() {
      setLoading(true);
      const supabase = createClient();
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch company_id logic
        const { data: curEmp } = await supabase
          .from('employees')
          .select('company_id')
          .eq('user_id', user.id)
          .maybeSingle();

        let compId = curEmp?.company_id;
        if (!compId) {
          const { data: compAdmin } = await supabase
            .from('companies')
            .select('id')
            .eq('super_admin_id', user.id)
            .maybeSingle();
          compId = compAdmin?.id || user.id;
        }

        // Fetch all employees in company
        const { data: emps, error: empsError } = await supabase
          .from('employees')
          .select('id, emp_id, first_name, last_name, designation')
          .eq('company_id', compId);

        if (empsError) throw empsError;
        if (!emps) return;

        // Date logic based on selectedPeriod and selectedWeek
        const { weekStart, weekEnd } = getWeekDateRange(selectedPeriod, selectedWeek);

        // Fetch attendance for these employees for this week
        const { data: attendance, error: attError } = await supabase
          .from('attendance')
          .select('employee_id, date, clock_in, clock_out, hours, status, site_details(site_name)')
          .gte('date', format(weekStart, 'yyyy-MM-dd'))
          .lte('date', format(weekEnd, 'yyyy-MM-dd'));

        if (attError) throw attError;

        let totalLoggedMins = 0;
        let totalStandardMins = 0;
        let totalOvertimeMins = 0;
        let pendingCount = 0;

        const newTimesheetData: TimesheetEntry[] = emps.map((emp: any) => {
          const empId = emp.id;
          const empAttendance = attendance?.filter((a: any) => a.employee_id === empId) || [];
          
          const getDayHours = (d: Date) => {
            const dateStr = format(d, 'yyyy-MM-dd');
            const att = empAttendance.find((a: any) => a.date === dateStr);
            if (!att) return "-";
            if (att.hours) return att.hours; // directly use hours if provided

            if (!att.clock_in || !att.clock_out) return "-";
            
            // Fallback: Calculate from TEXT strings if they are ISO strings
            const start = new Date(att.clock_in);
            const end = new Date(att.clock_out);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) return "-";

            const diffMins = Math.floor((end.getTime() - start.getTime()) / 60000);
            const h = Math.floor(diffMins / 60);
            const m = diffMins % 60;
            return `${h}h ${m.toString().padStart(2, '0')}m`;
          };

          const formatMins = (totalMins: number) => {
            const h = Math.floor(totalMins / 60);
            const m = totalMins % 60;
            return `${h}h ${m.toString().padStart(2, '0')}m`;
          };
          
          let totalMins = 0;
          let empStandardMins = 0;
          let empOvertimeMins = 0;
          const siteMap: Record<string, number> = {};
          let absentCount = 0;

          const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
          const weekDays = days.map((day, i) => {
             const d = addDays(weekStart, i);
             const dateStr = format(d, 'yyyy-MM-dd');
             const att = empAttendance.find((a: any) => a.date === dateStr);
             
             if (att && (att.status?.toLowerCase() === 'absent' || att.status?.toLowerCase() === 'leave')) {
               absentCount++;
             }

             const hrsStr = getDayHours(d);
             if(hrsStr && hrsStr !== "-") {
                const match = hrsStr.toString().match(/(\d+)h\s*(\d*)m/);
                if(match) {
                  const dayMins = parseInt(match[1])*60 + (parseInt(match[2]) || 0);
                  totalMins += dayMins;
                  const standard = Math.min(dayMins, 8 * 60); // standard max 8 hours per day
                  empStandardMins += standard;
                  empOvertimeMins += (dayMins - standard);
                  
                  if (att) {
                    const siteName = (att as any).site_details?.site_name || 'Main Office';
                    siteMap[siteName] = (siteMap[siteName] || 0) + dayMins;
                  }
                }
             }
             return { key: day, val: hrsStr || "-" };
          });

          const sitesList = Object.keys(siteMap).map(name => ({
            name,
            hours: formatMins(siteMap[name])
          })).sort((a, b) => siteMap[b.name] - siteMap[a.name]);

          const siteData: SiteRecord = {
            sites: sitesList.length > 0 ? sitesList : [{ name: "No Active Sites", hours: "0h 00m" }],
            breakTime: "0h 00m", // Not tracked in DB schema currently
            absent: absentCount,
            summary: totalMins >= 40 * 60 ? "Employee maintained a full workweek with consistent output. Performance is on track." : "Employee hours are below the standard 40-hour workweek. Review attendance for potential leave or absences."
          };

          totalLoggedMins += totalMins;
          totalStandardMins += empStandardMins;
          totalOvertimeMins += empOvertimeMins;
          if (totalMins > 0) pendingCount += 1;

          const entry = {
             id: emp.id,
             name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown',
             role: emp.designation || 'Employee',
             project: 'Internal',
             department: emp.department_name || 'General',
             mon: weekDays[0].val,
             tue: weekDays[1].val,
             wed: weekDays[2].val,
             thu: weekDays[3].val,
             fri: weekDays[4].val,
             sat: weekDays[5].val,
             sun: weekDays[6].val,
             total: totalMins > 0 ? formatMins(totalMins) : '0h 00m',
             status: 'Approved', // Setting static approved for now
             siteData
          };
          return entry;
        });

        const formatStats = (totalMins: number) => {
          const h = Math.floor(totalMins / 60);
          const m = totalMins % 60;
          return `${h.toLocaleString()}h ${m.toString().padStart(2, '0')}m`;
        };

        setTimesheetStats({
          logged: formatStats(totalLoggedMins),
          standard: formatStats(totalStandardMins),
          overtime: formatStats(totalOvertimeMins),
          pending: pendingCount.toString()
        });

        setTimesheetData(newTimesheetData);
      } catch (err) {
        console.error("Error fetching timesheet:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTimesheetData();
  }, [selectedPeriod, selectedWeek]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelectAllApproval = () => {
    if (selectedApprovalRows.length === mockApprovalData.length) {
      setSelectedApprovalRows([]);
    } else {
      setSelectedApprovalRows(mockApprovalData.map(e => e.id.toString()));
    }
  };

  const toggleRowSelectionApproval = (id: string) => {
    if (selectedApprovalRows.includes(id)) {
      setSelectedApprovalRows(selectedApprovalRows.filter(rId => rId !== id));
    } else {
      setSelectedApprovalRows([...selectedApprovalRows, id]);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto page-scrollbar bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-2 pt-6 pb-4">
        <div>
          <h1 className="type-h1 text-[#161616]">
            Timesheet
          </h1>
          <p className="type-body text-[#616161] mt-1">
            Track and manage employee work hours
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Xentra Logo */}
          <div className="flex items-center relative z-10">
            <img 
              src="/app_logos/xentra_black_logo_with_text.svg" 
              alt="xentra" 
              className="h-7 w-auto select-none"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 px-2 pb-4 flex flex-col">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { title: "Total Logged Hours", value: timesheetStats.logged, trend: "Current Week", trendColor: "text-[#16A34A]", icon: Clock },
            { title: "Total Standard Hours", value: timesheetStats.standard, trend: "Current Week", trendColor: "text-[#16A34A]", icon: Briefcase },
            { title: "Total Overtime Hours", value: timesheetStats.overtime, trend: "Current Week", trendColor: "text-[#DC2626]", icon: Timer },
            { title: "Total Pending", value: timesheetStats.pending, trend: "Approvals needed", trendColor: "text-amber-600", icon: FileClock },
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#FAFAF9] rounded-[12px] p-5 flex items-start justify-between">
              <div className="flex flex-col">
                <h3 className="text-[12px] font-semibold text-[#616161] mb-1 tracking-wider uppercase">{stat.title}</h3>
                <span className="text-[22px] font-semibold text-[#161616] leading-tight mb-1">{stat.value}</span>
                <span className={`text-[11px] font-semibold ${stat.trendColor}`}>{stat.trend}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#FAFAF9] border border-[#ECECEC] flex items-center justify-center shrink-0 mt-1 text-[#616161]">
                <stat.icon className="w-4 h-4" strokeWidth={1.75} />
              </div>
            </div>
          ))}
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          {/* Left: Search Bar */}
          <div className="relative w-full md:w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B8B8B]" />
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
            {/* Period / Calendar Selector Dropdown */}
            <div className="relative" ref={periodDropdownRef}>
              <button
                onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                className="h-[42px] px-4 bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] rounded-full type-small font-semibold text-[#616161] transition-colors cursor-pointer flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <Calendar className="w-4 h-4 text-[#616161]" strokeWidth={1.75} />
                <span>{selectedPeriod}</span>
                <ChevronDown className="w-4 h-4 text-[#616161]" strokeWidth={1.75} />
              </button>
              {isPeriodOpen && (
                <div className="absolute right-0 mt-1.5 z-[60] w-[220px] bg-white rounded-2xl shadow-xl border border-[#E5E7EB] overflow-hidden py-1">
                  {["June 2026", "July 2026", "August 2026", "September 2026", "October 2026"].map((period) => (
                    <button
                      key={period}
                      onClick={() => { 
                        setSelectedPeriod(period); 
                        setIsPeriodOpen(false); 
                        setSelectedWeek(getWeeksInMonth(period)[0]);
                      }}
                      className={`flex items-center w-full px-4 py-2 text-left text-[13px] transition-colors ${selectedPeriod === period ? "bg-[#FAFAF9] text-[#161616] font-semibold" : "text-[#616161] hover:bg-gray-50"}`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Week Selector Dropdown */}
            <div className="relative" ref={weekDropdownRef}>
              <button
                onClick={() => setIsWeekOpen(!isWeekOpen)}
                className="h-[42px] px-4 bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] rounded-full type-small font-semibold text-[#616161] transition-colors cursor-pointer flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <span>{selectedWeek}</span>
                <ChevronDown className="w-4 h-4 text-[#616161]" strokeWidth={1.75} />
              </button>
              {isWeekOpen && (
                <div className="absolute right-0 mt-1.5 z-[60] w-auto min-w-[150px] whitespace-nowrap bg-white rounded-2xl shadow-xl border border-[#E5E7EB] overflow-hidden py-1">
                  {getWeeksInMonth(selectedPeriod).map((week) => (
                    <button
                      key={week}
                      onClick={() => { setSelectedWeek(week); setIsWeekOpen(false); }}
                      className={`flex items-center w-full px-4 py-2 text-left text-[13px] transition-colors ${selectedWeek === week ? "bg-[#FAFAF9] text-[#161616] font-semibold" : "text-[#616161] hover:bg-gray-50"}`}
                    >
                      {week}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter Button */}
            <button 
              onClick={() => {
                setDraftFilters(filters);
                setIsFilterPanelOpen(true);
              }}
              className={`relative h-[42px] w-[42px] flex items-center justify-center border border-[#E5E7EB] rounded-full transition-all cursor-pointer shrink-0 ${
                activeFilterCount > 0 
                  ? "bg-black text-white hover:bg-neutral-800 shadow-sm" 
                  : "bg-[#F4F4F5] hover:bg-[#E5E7EB] text-[#616161]"
              }`}
              title="Filter options"
            >
              <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C8DF52] text-black text-[11px] font-semibold rounded-full flex items-center justify-center border-2 border-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex items-center flex-wrap gap-2 mb-6">
            <span className="text-[12px] text-[#737373] font-medium mr-1">Active filters:</span>
            {filters.departments.map(d => (
              <span key={d} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] bg-[#F4F4F5] text-[#161616] border border-[#E5E7EB]">
                Dept: {d}
                <button onClick={() => setFilters(prev => ({ ...prev, departments: prev.departments.filter(item => item !== d) }))} className="hover:text-black cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.roles.map(r => (
              <span key={r} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] bg-[#F4F4F5] text-[#161616] border border-[#E5E7EB]">
                Role: {r}
                <button onClick={() => setFilters(prev => ({ ...prev, roles: prev.roles.filter(item => item !== r) }))} className="hover:text-black cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.status.map(s => (
              <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] bg-[#F4F4F5] text-[#161616] border border-[#E5E7EB]">
                Status: {s}
                <button onClick={() => setFilters(prev => ({ ...prev, status: prev.status.filter(item => item !== s) }))} className="hover:text-black cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button 
              onClick={() => setFilters({ departments: [], roles: [], status: [] })}
              className="text-[12px] text-red-600 hover:text-red-700 font-medium ml-2 underline underline-offset-2 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Tabs & Table */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0, 0.4, 0, 1] }}
          className="flex flex-col bg-white flex-1 overflow-hidden"
        >
          {/* Tabs */}
          <div className="flex items-center justify-between px-6 border-b border-[#ECECEC]">
            <div className="flex items-center gap-6">
              {["Calendar View", "Table View", "Monthly logs"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 text-[14px] font-semibold border-b-2 transition-colors ${activeTab === tab ? "border-black text-[#161616]" : "border-transparent text-[#616161] hover:text-[#161616]"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Table View */}
          {activeTab === "Table View" && (
            <>
              <div className="overflow-x-auto border border-[#E5E7EB] rounded-[20px] mb-6">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead className="bg-[#FAFAF9] text-[#616161] border-b border-[#ECECEC]">
                    <tr>
                      <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider">Employee</th>
                      <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider">Department</th>
                      {(() => {
                        const { weekStart: start } = getWeekDateRange(selectedPeriod, selectedWeek);
                        const days = Array.from({ length: 7 }).map((_, i) => {
                          const d = addDays(start, i);
                          return { day: format(d, 'EEE'), date: format(d, 'd MMM') };
                        });
                        return days.map(({ day, date }) => (
                          <th key={day} className="px-2 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-[12px] font-semibold uppercase">{day}</span>
                              <span className="text-[11px] text-[#8B8B8B] font-medium mt-0.5">{date}</span>
                            </div>
                          </th>
                        ));
                      })()}
                      <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-center">Total Hours</th>
                      <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-center">Status</th>
                      <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F4F5] bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={11} className="px-6 py-8 text-center text-[#616161] text-[13px]">Loading timesheet data...</td>
                      </tr>
                    ) : (() => {
                        const filtered = timesheetData.filter(item => {
                          const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.department.toLowerCase().includes(searchQuery.toLowerCase());
                          const matchesDept = filters.departments.length === 0 || filters.departments.includes(item.department);
                          const matchesRole = filters.roles.length === 0 || filters.roles.includes(item.role);
                          const matchesStatus = filters.status.length === 0 || filters.status.includes(item.status);
                          return matchesSearch && matchesDept && matchesRole && matchesStatus;
                        });
                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={11} className="px-6 py-8 text-center text-[#616161] text-[13px]">No matching employees found.</td>
                            </tr>
                          );
                        }
                        return filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item) => (
                      <React.Fragment key={item.id}>
                        <tr
                          onClick={() => toggleRow(item.id)}
                          className="hover:bg-[#FAFAF9]/60 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              {expandedRows[item.id]
                                ? <ChevronDown className="w-4 h-4 text-[#616161] shrink-0" strokeWidth={1.75} />
                                : <ChevronRight className="w-4 h-4 text-[#616161] shrink-0" strokeWidth={1.75} />
                              }
                              <div className="flex flex-col">
                                <span className="text-[14px] font-semibold text-[#161616] leading-tight">{item.name}</span>
                                <span className="text-[12px] font-medium text-[#616161] mt-0.5">{item.role}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-[13px] font-semibold text-[#161616] whitespace-nowrap">
                            {item.department}
                          </td>
                          <td className="px-2 py-3.5 text-center text-[13px] font-medium text-[#616161]">{item.mon}</td>
                          <td className="px-2 py-3.5 text-center text-[13px] font-medium text-[#616161]">{item.tue}</td>
                          <td className="px-2 py-3.5 text-center text-[13px] font-medium text-[#616161]">{item.wed}</td>
                          <td className="px-2 py-3.5 text-center text-[13px] font-medium text-[#616161]">{item.thu}</td>
                          <td className="px-2 py-3.5 text-center text-[13px] font-medium text-[#616161]">{item.fri}</td>
                          <td className="px-2 py-3.5 text-center text-[13px] font-medium text-[#8B8B8B]">{item.sat}</td>
                          <td className="px-2 py-3.5 text-center text-[13px] font-medium text-[#8B8B8B]">{item.sun}</td>
                          <td className="px-4 py-3.5 text-center font-semibold text-[13px] text-[#161616]">{item.total}</td>
                          <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-center">
                              {item.status === "Approved" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[#16A34A] text-[11px] font-semibold border border-emerald-200/50">
                                  <Check className="w-3 h-3" strokeWidth={2} />Approved
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[11px] font-semibold border border-amber-200/50">
                                  <Clock className="w-3 h-3" strokeWidth={2} />Pending
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                             <button 
                               ref={(el) => { actionBtnRefs.current[`table-${item.id}`] = el; }}
                               onClick={() => setOpenDropdownId(openDropdownId === `table-${item.id}` ? null : `table-${item.id}`)}
                               className="text-[#616161] hover:text-[#161616] transition-colors p-1.5 hover:bg-gray-100 rounded-md"
                             >
                               <MoreVertical className="w-4 h-4" strokeWidth={1.75} />
                             </button>
                             {openDropdownId === `table-${item.id}` && typeof document !== 'undefined' && createPortal(
                               <div 
                                 ref={actionDropdownRef}
                                 className="fixed w-40 bg-white border border-[#ECECEC] rounded-md shadow-md py-1 z-[9999] text-left"
                                 style={(() => {
                                   const btn = actionBtnRefs.current[`table-${item.id}`];
                                   if (!btn) return {};
                                   const rect = btn.getBoundingClientRect();
                                   return { top: rect.bottom + 4, left: rect.right - 160 };
                                 })()}
                               >
                                 <Link 
                                   href={`/timesheet/view/${item.id}`}
                                   className="block w-full px-3 py-2 text-[12px] font-semibold text-[#161616] hover:bg-gray-50 transition-colors text-left"
                                 >
                                   View Full Timesheet
                                 </Link>
                                 <button 
                                   onClick={() => {
                                     toggleRow(item.id);
                                     setOpenDropdownId(null);
                                   }}
                                   className="w-full px-3 py-2 text-[12px] font-semibold text-[#616161] hover:bg-gray-50 transition-colors text-left"
                                 >
                                   Quick Insights
                                 </button>
                                 <a 
                                   href={`/timesheet/edit?month=${encodeURIComponent(selectedPeriod)}&week=${encodeURIComponent(selectedWeek)}`}
                                   className="block w-full px-3 py-2 text-[12px] font-semibold text-[#616161] hover:bg-gray-50 transition-colors text-left"
                                 >
                                   Edit Timesheet
                                 </a>
                                 <button 
                                   onClick={() => setOpenDropdownId(null)}
                                   className="w-full px-3 py-2 text-[12px] font-semibold text-[#616161] hover:bg-gray-50 transition-colors text-left"
                                 >
                                   View Profile
                                 </button>
                               </div>,
                               document.body
                             )}
                           </td>
                        </tr>
                        {expandedRows[item.id as any] && (
                          <ExpandedRow item={item} data={item.siteData || fallbackSiteData} />
                        )}
                      </React.Fragment>
                    ));
                  })()}
                  </tbody>
                </table>
              </div>
              {/* Pagination Footer */}
              <div className="flex items-center justify-between mt-4 px-6 pb-4">
                {/* Count */}
                <span className="text-[12px] font-medium text-[#616161]">
                  Showing <span className="text-[#161616] font-semibold">{timesheetData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to <span className="text-[#161616] font-semibold">{Math.min(currentPage * pageSize, timesheetData.length)}</span> of <span className="text-[#161616] font-semibold">{timesheetData.length}</span> entries
                </span>

                {/* Pages + size */}
                <div className="flex items-center gap-2">
                  {/* Prev */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="h-8 w-8 flex items-center justify-center rounded-md bg-white border border-[#ECECEC] text-[#616161] hover:border-black/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={14} strokeWidth={2} />
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="h-8 min-w-8 px-2 flex items-center justify-center rounded-md text-[13px] font-semibold transition-colors bg-black text-white shadow-sm"
                  >
                    {currentPage}
                  </motion.button>

                  {/* Next */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    disabled={currentPage === Math.max(1, Math.ceil(timesheetData.length / pageSize))}
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(timesheetData.length / pageSize), prev + 1))}
                    className="h-8 w-8 flex items-center justify-center rounded-md bg-white border border-[#ECECEC] text-[#616161] hover:border-black/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={14} strokeWidth={2} />
                  </motion.button>

                  {/* Page size select */}
                  <div className="ml-2">
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1); // reset to first page when changing page size
                      }}
                      className="bg-white border border-[#ECECEC] rounded-md px-2 py-1 text-[12px] font-semibold text-[#616161] focus:outline-none focus:ring-2 focus:ring-black/10 cursor-pointer"
                    >
                      {[10, 20, 50].map(s => <option key={s} value={s}>{s} / page</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Calendar View */}
          {activeTab === "Calendar View" && (
            <CalendarView selectedPeriod={selectedPeriod} timesheetData={timesheetData} />
          )}

          {/* Monthly logs View */}
          {activeTab === "Monthly logs" && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="border border-[#E5E7EB] rounded-[20px] flex flex-col overflow-hidden mb-6">
                <div className="bg-[#FAFAF9] text-[#616161] border-b border-[#ECECEC] grid grid-cols-[3fr_2fr_2fr_1fr] gap-4 items-center px-6 py-4">
                  <div className="text-[12px] font-semibold uppercase text-[#616161] text-left flex items-center gap-1.5 tracking-wider">
                    <FileText className="w-3.5 h-3.5 text-[#8B8B8B]" /> Report Name
                  </div>
                  <div className="text-[12px] font-semibold uppercase text-[#616161] flex items-center justify-center gap-1.5 tracking-wider text-center">
                    <Calendar className="w-3.5 h-3.5 text-[#8B8B8B]" /> Date
                  </div>
                  <div className="text-[12px] font-semibold uppercase text-[#616161] flex items-center justify-center gap-1.5 tracking-wider text-center">
                    <Database className="w-3.5 h-3.5 text-[#8B8B8B]" /> Size
                  </div>
                  <div className="text-[12px] font-semibold uppercase text-[#616161] text-right flex items-center justify-end gap-1.5 tracking-wider">
                    <MoreVertical className="w-3.5 h-3.5 text-[#8B8B8B]" /> Actions
                  </div>
                </div>
                <div className="flex-1 bg-white divide-y divide-[#F4F4F5] min-h-[220px] overflow-hidden">
                {[
                  { name: 'July 2026 Timesheet Log.csv', date: 'Jul 2026', size: '2.4 MB' },
                  { name: 'June 2026 Timesheet Log.csv', date: 'Jun 2026', size: '2.1 MB' },
                  { name: 'May 2026 Timesheet Log.csv', date: 'May 2026', size: '2.3 MB' }
                ].map((file, i) => (
                  <div key={i} className="grid grid-cols-[3fr_2fr_2fr_1fr] gap-4 items-center px-6 py-4 hover:bg-[#F9FAFB] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 flex items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] shrink-0">
                        <FileText className="w-5 h-5 text-[#161616]" />
                      </div>
                      <span className="type-body-medium text-[#161616] truncate">{file.name}</span>
                    </div>
                    <div className="type-body text-[#737373] text-center">
                      {file.date}
                    </div>
                    <div className="type-body-medium text-[#737373] text-center">
                      {file.size}
                    </div>
                    <div className="flex items-center justify-end">
                      <button className="p-2 text-[#737373] hover:text-[#161616] hover:bg-[#F4F4F5] rounded-lg transition-colors">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
        </motion.div>
      </main>

      {/* Filter Side Panel Drawer */}
      <AnimatePresence>
        {isFilterPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterPanelOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9990]"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[9991] flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white border border-[#E5E7EB] rounded-md text-black">
                    <Filter className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-semibold text-[#161616]">Filter Timesheet</h2>
                    <p className="text-[12px] text-[#737373]">Refine by department, role & status</p>
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
                
                {/* Department Filter */}
                <div className="pt-2">
                  <label className="text-[14px] font-semibold text-[#161616] block mb-3">Department</label>
                  <div className="space-y-2">
                    {availableDepartments.map(d => {
                      const isChecked = draftFilters.departments.includes(d);
                      return (
                        <button
                          key={d}
                          onClick={() => {
                            setDraftFilters(prev => ({
                              ...prev,
                              departments: isChecked 
                                ? prev.departments.filter(item => item !== d)
                                : [...prev.departments, d]
                            }));
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-md border text-[13px] transition-all text-left cursor-pointer ${
                            isChecked 
                              ? "border-black bg-black text-white font-medium" 
                              : "border-[#E5E7EB] bg-white text-[#161616] hover:bg-[#F9FAFB]"
                          }`}
                        >
                          <span>{d}</span>
                          {isChecked && <Check className="w-4 h-4 text-[#C8DF52]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Role Filter */}
                {availableRoles.length > 0 && (
                  <div className="pt-6">
                    <label className="text-[14px] font-semibold text-[#161616] block mb-3">Role</label>
                    <div className="space-y-2">
                      {availableRoles.map(r => {
                        const isChecked = draftFilters.roles.includes(r);
                        return (
                          <button
                            key={r}
                            onClick={() => {
                              setDraftFilters(prev => ({
                                ...prev,
                                roles: isChecked 
                                  ? prev.roles.filter(item => item !== r)
                                  : [...prev.roles, r]
                              }));
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-md border text-[13px] transition-all text-left cursor-pointer ${
                              isChecked 
                                ? "border-black bg-black text-white font-medium" 
                                : "border-[#E5E7EB] bg-white text-[#161616] hover:bg-[#F9FAFB]"
                            }`}
                          >
                            <span>{r}</span>
                            {isChecked && <Check className="w-4 h-4 text-[#C8DF52]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Status Filter */}
                <div className="pt-6">
                  <label className="text-[14px] font-semibold text-[#161616] block mb-3">Status</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {availableStatuses.map(s => {
                      const isChecked = draftFilters.status.includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => {
                            setDraftFilters(prev => ({
                              ...prev,
                              status: isChecked 
                                ? prev.status.filter(item => item !== s)
                                : [...prev.status, s]
                            }));
                          }}
                          className={`flex items-center justify-between p-3 rounded-md border text-[13px] transition-all text-left cursor-pointer ${
                            isChecked 
                              ? "border-black bg-black text-white font-medium" 
                              : "border-[#E5E7EB] bg-white text-[#161616] hover:bg-[#F9FAFB]"
                          }`}
                        >
                          <span>{s}</span>
                          {isChecked && <Check className="w-4 h-4 text-[#C8DF52]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-[#E5E7EB] bg-white flex items-center justify-between gap-4">
                <button
                  onClick={() => setDraftFilters({ status: [], roles: [], departments: [] })}
                  disabled={draftFilterCount === 0}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
                    draftFilterCount === 0 
                      ? "text-[#A3A3A3] cursor-not-allowed" 
                      : "text-[#161616] hover:bg-[#F4F4F5]"
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
                <button
                  onClick={() => {
                    setFilters(draftFilters);
                    setIsFilterPanelOpen(false);
                  }}
                  className="flex-1 bg-black hover:bg-neutral-800 text-white font-semibold py-2.5 px-6 rounded-md text-[14px] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Apply Filters</span>
                  {draftFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-[#C8DF52] text-black text-[11px] font-semibold rounded-md">
                      {draftFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

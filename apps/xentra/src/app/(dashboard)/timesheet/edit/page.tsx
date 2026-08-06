"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { 
  Clock as Time02Icon,
  Info as InformationCircleIcon,
  Plus as Add01Icon,
  MapPin as Location01Icon,
  X as Cancel01Icon,
  ArrowLeft as ArrowLeft01Icon,
  Trash2 as Delete02Icon,
  Calendar as Calendar01Icon,
  User as UserIcon,
  Mail as Mail01Icon,
  Phone as SmartPhone01Icon,
  Briefcase as Briefcase01Icon,
  FileText as LicenseIcon
} from "lucide-react";

// Helper functions
const parseDateStr = (dateStr: string) => {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? Infinity : d.getTime();
};

const toInputDate = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const fromInputDate = (inputVal: string) => {
  if (!inputVal) return "";
  const d = new Date(inputVal);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const isPeriodOlderThan2Months = (selectedMonth: string) => {
  const parts = selectedMonth.split(" ");
  const monthName = parts[0];
  const year = parseInt(parts[1], 10);
  
  const months: Record<string, number> = { 
    January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, 
    July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 
  };
  
  const monthIdx = months[monthName];
  if (monthIdx === undefined || isNaN(year)) return false;
  
  const targetDate = new Date(year, monthIdx, 1);
  const now = new Date();
  const currentDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  
  return targetDate < currentDate;
};

const isDateInSelectedPeriod = (dateStr: string, selectedMonth: string, selectedWeek: string) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const dMonthName = d.toLocaleString("default", { month: "long" });
  const dYear = d.getFullYear();
  const expectedMonthYear = `${dMonthName} ${dYear}`;
  if (expectedMonthYear.toLowerCase() !== selectedMonth.toLowerCase()) {
    return false;
  }
  const day = d.getDate();
  let expectedWeek = "Week 1";
  if (day >= 1 && day <= 7) expectedWeek = "Week 1";
  else if (day >= 8 && day <= 14) expectedWeek = "Week 2";
  else if (day >= 15 && day <= 21) expectedWeek = "Week 3";
  else expectedWeek = "Week 4";
  return expectedWeek.toLowerCase() === selectedWeek.toLowerCase();
};

const getPeriodDateRange = (selectedMonth: string, selectedWeek: string) => {
  const parts = selectedMonth.split(" ");
  const monthName = parts[0];
  const year = parseInt(parts[1]) || new Date().getFullYear();
  const months: Record<string, number> = { 
    January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, 
    July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 
  };
  const monthIdx = months[monthName] ?? 7;
  let startDay = 1;
  let endDay = 7;
  if (selectedWeek === "Week 1") {
    startDay = 1;
    endDay = 7;
  } else if (selectedWeek === "Week 2") {
    startDay = 8;
    endDay = 14;
  } else if (selectedWeek === "Week 3") {
    startDay = 15;
    endDay = 21;
  } else {
    startDay = 22;
    endDay = new Date(year, monthIdx + 1, 0).getDate();
  }
  const formatYYYYMMDD = (day: number) => {
    const mm = String(monthIdx + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };
  return {
    min: formatYYYYMMDD(startDay),
    max: formatYYYYMMDD(endDay)
  };
};

const generateWeekDays = (selectedMonth: string, selectedWeek: string) => {
  const parts = selectedMonth.split(" ");
  const monthName = parts[0];
  const year = parseInt(parts[1]) || new Date().getFullYear();
  
  const months: Record<string, number> = { 
    January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, 
    July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 
  };
  const monthIdx = months[monthName] ?? 7;
  
  let startDay = 1;
  if (selectedWeek === "Week 1") startDay = 1;
  else if (selectedWeek === "Week 2") startDay = 8;
  else if (selectedWeek === "Week 3") startDay = 15;
  else startDay = 22;
  
  const daysList = [];
  const lastDay = new Date(year, monthIdx + 1, 0).getDate();
  
  for (let i = 0; i < 7; i++) {
    const dayNum = startDay + i;
    if (dayNum > lastDay) break;
    const d = new Date(year, monthIdx, dayNum);
    daysList.push({
      date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      day: d.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 3),
      work: "08:00",
      breakH: "01:00",
      over: "00:00",
      total: "08:00",
      notes: "",
      sites: [{ name: "HQ - Block A", entryTimeVal: "09:00", entryAmpm: "AM", exitTimeVal: "05:00", exitAmpm: "PM" }]
    });
  }
  return daysList;
};

const calculateTotalHours = (work: string | undefined | null, over: string | undefined | null) => {
  const parseTime = (timeStr: string | undefined | null) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(":");
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    return h * 60 + m;
  };
  
  const totalMins = parseTime(work) + parseTime(over);
  const hh = String(Math.floor(totalMins / 60)).padStart(2, '0');
  const mm = String(totalMins % 60).padStart(2, '0');
  return `${hh}:${mm}`;
};

const parse12hCombinedToMinutes = (timeVal: string | undefined | null, ampm: string | undefined | null) => {
  if (!timeVal) return 0;
  const parts = timeVal.split(":");
  let h = parseInt(parts[0], 10) || 12;
  const m = parseInt(parts[1], 10) || 0;
  
  const actualAmpm = ampm ? ampm.toUpperCase() : "AM";
  if (actualAmpm === "PM" && h < 12) {
    h += 12;
  } else if (actualAmpm === "AM" && h === 12) {
    h = 0;
  }
  return h * 60 + m;
};

const calculateSiteMinutesCombined = (entryVal: string | undefined | null, entryAmpm: string | undefined | null, exitVal: string | undefined | null, exitAmpm: string | undefined | null) => {
  const entryMin = parse12hCombinedToMinutes(entryVal, entryAmpm);
  const exitMin = parse12hCombinedToMinutes(exitVal, exitAmpm);
  if (exitMin >= entryMin) {
    return exitMin - entryMin;
  } else {
    return (exitMin + 24 * 60) - entryMin;
  }
};

export default function EditTimesheetPage() {
  return (
    <Suspense fallback={<div className="w-full h-full p-6 text-[#616161] bg-white dark:bg-[#0B0B0F] font-sans">Loading timesheet...</div>}>
      <EditTimesheetContent />
    </Suspense>
  );
}

function EditTimesheetContent() {
  const searchParams = useSearchParams();
  const selectedMonth = searchParams.get("month") || "August 2026";
  const selectedWeek = searchParams.get("week") || "Week 1";

  const [rows, setRows] = useState(() => {
    return generateWeekDays(selectedMonth, selectedWeek);
  });

  const [openSitesDayIdx, setOpenSitesDayIdx] = useState<number | null>(null);

  const chartData = [
    { name: "Standard Timing", value: 42.5 },
    { name: "Break Time", value: 6.5 },
    { name: "Overtime", value: 4 },
  ];
  const COLORS = ["#16A34A", "#F59E0B", "#3B82F6"];

  const isOlderThan2Months = isPeriodOlderThan2Months(selectedMonth);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const addRow = () => {
    if (rows.length >= 7 || isOlderThan2Months) return;
    const newRow = {
      date: "",
      day: "",
      work: "00:00", breakH: "00:00", over: "00:00", total: "00:00", notes: "", sites: []
    };
    setRows(prev => {
      const updated = [...prev, newRow];
      return updated.sort((a, b) => parseDateStr(a.date) - parseDateStr(b.date));
    });
  };

  const deleteRow = (idx: number) => {
    if (isOlderThan2Months) return;
    setRows(prev => prev.filter((_, i) => i !== idx));
    setOpenSitesDayIdx(prev => {
      if (prev === idx) return null;
      if (prev !== null && prev > idx) return prev - 1;
      return prev;
    });
  };

  const updateDayField = (idx: number, field: string, value: string) => {
    setRows(prev => {
      const updated = prev.map((row, i) => i === idx ? { ...row, [field]: value } : row);
      if (field === "date") {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          updated[idx].day = parsed.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 3);
        } else {
          updated[idx].day = "";
        }
        return updated.sort((a, b) => parseDateStr(a.date) - parseDateStr(b.date));
      }
      return updated;
    });
  };

  const updateSiteField = (dayIdx: number, siteIdx: number, field: string, value: string) => {
    setRows(prev => prev.map((row, i) => {
      if (i === dayIdx) {
        const newSites = row.sites.map((site, sj) => sj === siteIdx ? { ...site, [field]: value } : site);
        return { ...row, sites: newSites };
      }
      return row;
    }));
  };

  const handleSiteTimeValChange = (dayIdx: number, siteIdx: number, field: "entryTimeVal" | "exitTimeVal", val: string) => {
    let formatted = val.replace(/[^0-9:]/g, "");
    if (formatted.length === 2 && !val.includes(":")) {
      formatted = formatted + ":";
    }
    const parts = formatted.split(":");
    let hh = parts[0] || "";
    let mm = parts[1] || "";
    
    if (hh.length > 2) hh = hh.slice(0, 2);
    if (hh !== "") {
      const hVal = parseInt(hh, 10);
      if (hVal > 12) hh = "12";
    }
    if (mm.length > 2) mm = mm.slice(0, 2);
    if (mm !== "") {
      const mVal = parseInt(mm, 10);
      if (mVal > 59) mm = "59";
    }
    const finalVal = parts.length > 1 ? `${hh}:${mm}` : hh;
    updateSiteField(dayIdx, siteIdx, field, finalVal);
  };

  const handleSiteTimeValBlur = (dayIdx: number, siteIdx: number, field: "entryTimeVal" | "exitTimeVal", val: string) => {
    const clean = val.replace(/[^0-9:]/g, "");
    if (!clean) {
      updateSiteField(dayIdx, siteIdx, field, "12:00");
      recalculateRowWork(dayIdx);
      return;
    }
    const parts = clean.split(":");
    const hh = parts[0] || "12";
    const mm = parts[1] || "00";
    let hNum = parseInt(hh, 10) || 12;
    let mNum = parseInt(mm, 10) || 0;
    
    if (hNum > 12) hNum = 12;
    if (hNum < 1) hNum = 12;
    if (mNum > 59) mNum = 59;
    
    const formatted = `${String(hNum).padStart(2, "0")}:${String(mNum).padStart(2, "0")}`;
    
    setRows(prev => {
      const newRows = prev.map((row, i) => {
        if (i === dayIdx) {
          const newSites = row.sites.map((site, sj) => {
            if (sj === siteIdx) {
              return { ...site, [field]: formatted };
            }
            return site;
          });
          
          const totalMin = newSites.reduce((sum, s) => {
            return sum + calculateSiteMinutesCombined(s.entryTimeVal, s.entryAmpm, s.exitTimeVal, s.exitAmpm);
          }, 0);
          const rHh = String(Math.floor(totalMin / 60)).padStart(2, '0');
          const rMm = String(totalMin % 60).padStart(2, '0');
          
          return { ...row, sites: newSites, work: `${rHh}:${rMm}` };
        }
        return row;
      });
      return newRows;
    });
  };

  const handleSiteAmpmChange = (dayIdx: number, siteIdx: number, field: "entryAmpm" | "exitAmpm", val: string) => {
    setRows(prev => prev.map((row, i) => {
      if (i === dayIdx) {
        const newSites = row.sites.map((site, sj) => {
          if (sj === siteIdx) {
            return { ...site, [field]: val };
          }
          return site;
        });
        
        const totalMin = newSites.reduce((sum, s) => {
          return sum + calculateSiteMinutesCombined(s.entryTimeVal, s.entryAmpm, s.exitTimeVal, s.exitAmpm);
        }, 0);
        const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
        const mm = String(totalMin % 60).padStart(2, '0');
        
        return { ...row, sites: newSites, work: `${hh}:${mm}` };
      }
      return row;
    }));
  };

  const recalculateRowWork = (dayIdx: number) => {
    setRows(prev => prev.map((row, i) => {
      if (i === dayIdx) {
        const totalMin = row.sites.reduce((sum, s) => {
          return sum + calculateSiteMinutesCombined(s.entryTimeVal, s.entryAmpm, s.exitTimeVal, s.exitAmpm);
        }, 0);
        const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
        const mm = String(totalMin % 60).padStart(2, '0');
        return { ...row, work: `${hh}:${mm}` };
      }
      return row;
    }));
  };

  const addSite = (dayIdx: number) => {
    if (isOlderThan2Months) return;
    setRows(prev => prev.map((row, i) => {
      if (i === dayIdx) {
        return { 
          ...row, 
          sites: [...(row.sites || []), { name: "", entryTimeVal: "09:00", entryAmpm: "AM", exitTimeVal: "05:00", exitAmpm: "PM" }] 
        };
      }
      return row;
    }));
  };

  const removeSite = (dayIdx: number, siteIdx: number) => {
    if (isOlderThan2Months) return;
    setRows(prev => prev.map((row, i) => {
      if (i === dayIdx) {
        const newSites = row.sites.filter((_, sj) => sj !== siteIdx);
        const totalMin = newSites.reduce((sum, s) => {
          return sum + calculateSiteMinutesCombined(s.entryTimeVal, s.entryAmpm, s.exitTimeVal, s.exitAmpm);
        }, 0);
        const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
        const mm = String(totalMin % 60).padStart(2, '0');
        return { ...row, sites: newSites, work: `${hh}:${mm}` };
      }
      return row;
    }));
  };

  const getSitesOverview = () => {
    const siteMap: Record<string, number> = {};
    rows.forEach(row => {
      if (row.sites) {
        row.sites.forEach(site => {
          if (site.name && site.entryTimeVal && site.exitTimeVal) {
            const mins = calculateSiteMinutesCombined(site.entryTimeVal, site.entryAmpm, site.exitTimeVal, site.exitAmpm);
            siteMap[site.name] = (siteMap[site.name] || 0) + mins;
          }
        });
      }
    });

    return Object.entries(siteMap).map(([name, mins]) => {
      const hh = Math.floor(mins / 60);
      const mm = mins % 60;
      const formattedHours = `${hh}h ${String(mm).padStart(2, '0')}m`;
      return { name, mins, formattedHours };
    }).sort((a, b) => b.mins - a.mins);
  };

  const sitesOverview = getSitesOverview();
  const dateRangeLimits = getPeriodDateRange(selectedMonth, selectedWeek);

  return (
    <div className="w-full h-full overflow-y-auto bg-white dark:bg-[#0B0B0F] p-4 lg:p-8 pb-24 font-sans text-sm selection:bg-[#16A34A]/20">

      {/* Page Heading & Back Button */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-semibold text-[#161616] dark:text-white tracking-tight">Edit Timesheet</h1>
          <p className="text-[15px] text-[#616161] dark:text-gray-400 mt-1">Review and modify the selected time logs</p>
        </div>
        <Link href="/timesheet">
          <button className="flex items-center gap-1.5 text-[#616161] hover:text-[#161616] dark:text-gray-400 dark:hover:text-gray-200 transition-colors text-[14px] font-medium">
            <ArrowLeft01Icon size={18} strokeWidth={1.75} />
            <span>Back to Timesheets</span>
          </button>
        </Link>
      </div>

      {/* Redesigned Sleek Profile Card */}
      <div className="bg-white dark:bg-[#121217] border border-[#ECECEC] dark:border-[#2C2C35] rounded-xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Top Left: Avatar + Core Info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-[#161616] text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-[18px] shadow-none">
                KK
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#16A34A] border-2 border-white dark:border-[#121217] rounded-full" title="Active Employee" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-[18px] font-bold text-[#161616] dark:text-white tracking-tight">KrishnaKumar P</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAFAF9] dark:bg-[#1E1E24] text-[#616161] border border-[#ECECEC] dark:border-[#2C2C35]">
                  Software Engineer
                </span>
              </div>
              <p className="text-[13px] text-[#616161] dark:text-gray-400 mt-1">
                Employee Timesheet Management
              </p>
            </div>
          </div>

          {/* Top Right: Active Editing Period Card */}
          <div className="flex items-center gap-3 bg-[#FAFAF9] dark:bg-[#1E1E24] px-4 py-3 rounded-lg border border-[#ECECEC] dark:border-[#2C2C35] self-start lg:self-center">
            <div className="w-9 h-9 rounded-md bg-white dark:bg-[#121217] border border-[#ECECEC] dark:border-[#2C2C35] flex items-center justify-center text-[#161616] dark:text-white shrink-0">
              <Calendar01Icon size={18} strokeWidth={1.75} />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-[#8B8B8B] uppercase tracking-wide leading-tight">Editing Period</span>
              <span className="text-[14px] font-bold text-[#161616] dark:text-white leading-tight mt-0.5">
                {selectedMonth || ""}, {selectedWeek || ""}
              </span>
            </div>
            <div className="ml-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-[11px] font-semibold">
              <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
              Active
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-[#ECECEC] dark:bg-[#2C2C35] my-5" />

        {/* Bottom Metadata Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FAFAF9] dark:bg-[#18181D] border border-[#ECECEC] dark:border-[#2C2C35]">
            <div className="w-8 h-8 rounded-md bg-white dark:bg-[#121217] border border-[#ECECEC] dark:border-[#2C2C35] flex items-center justify-center text-[#616161] shrink-0">
              <LicenseIcon size={16} strokeWidth={1.75} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold text-[#8B8B8B] uppercase tracking-wider truncate">Employee ID</span>
              <span className="text-[13px] font-bold text-[#161616] dark:text-white truncate">HSBD939N</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FAFAF9] dark:bg-[#18181D] border border-[#ECECEC] dark:border-[#2C2C35]">
            <div className="w-8 h-8 rounded-md bg-white dark:bg-[#121217] border border-[#ECECEC] dark:border-[#2C2C35] flex items-center justify-center text-[#616161] shrink-0">
              <Briefcase01Icon size={16} strokeWidth={1.75} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold text-[#8B8B8B] uppercase tracking-wider truncate">Department</span>
              <span className="text-[13px] font-bold text-[#161616] dark:text-white truncate">HR Department</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FAFAF9] dark:bg-[#18181D] border border-[#ECECEC] dark:border-[#2C2C35]">
            <div className="w-8 h-8 rounded-md bg-white dark:bg-[#121217] border border-[#ECECEC] dark:border-[#2C2C35] flex items-center justify-center text-[#616161] shrink-0">
              <SmartPhone01Icon size={16} strokeWidth={1.75} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold text-[#8B8B8B] uppercase tracking-wider truncate">Phone</span>
              <span className="text-[13px] font-bold text-[#161616] dark:text-white truncate">+65 38384834</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FAFAF9] dark:bg-[#18181D] border border-[#ECECEC] dark:border-[#2C2C35]">
            <div className="w-8 h-8 rounded-md bg-white dark:bg-[#121217] border border-[#ECECEC] dark:border-[#2C2C35] flex items-center justify-center text-[#616161] shrink-0">
              <Mail01Icon size={16} strokeWidth={1.75} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold text-[#8B8B8B] uppercase tracking-wider truncate">Email</span>
              <span className="text-[13px] font-bold text-[#161616] dark:text-white truncate">Krishna@gmail.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning if older than 2 months */}
      {isOlderThan2Months && (
        <div className="bg-[#FAFAF9] dark:bg-[#1E1E24] border border-[#ECECEC] dark:border-[#2C2C35] rounded-xl p-4 flex items-center gap-3 mb-6">
          <InformationCircleIcon size={20} className="text-[#8B8B8B] shrink-0" strokeWidth={1.75} />
          <p className="text-[14px] text-[#616161] font-medium">
            This timesheet is older than 2 months and cannot be edited. It is open in view-only mode.
          </p>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="flex flex-col xl:flex-row gap-6">

        {/* Left: Log Hours Table */}
        <div className="flex-1 bg-white dark:bg-[#121217] border border-[#ECECEC] dark:border-[#2C2C35] rounded-xl overflow-hidden min-w-0 flex flex-col shadow-none">
          <div className="p-5 border-b border-[#ECECEC] dark:border-[#2C2C35]">
            <h3 className="text-[15px] font-semibold text-[#161616] dark:text-white">Logged Hours</h3>
            <p className="text-[13px] text-[#8B8B8B] mt-0.5">Adjust daily hours and breakdown sites below.</p>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFAF9] dark:bg-[#18181D]">
                  <th className="py-3 px-4 text-[12px] font-semibold text-[#616161] uppercase tracking-wide w-[180px]">Date</th>
                  <th className="py-3 px-2 text-[12px] font-semibold text-[#616161] uppercase tracking-wide w-[60px]">Day</th>
                  <th className="py-3 px-2 text-[12px] font-semibold text-[#616161] uppercase tracking-wide text-center w-[160px]">Work (HH:MM)</th>
                  <th className="py-3 px-2 text-[12px] font-semibold text-[#616161] uppercase tracking-wide text-center w-[120px]">Break</th>
                  <th className="py-3 px-2 text-[12px] font-semibold text-[#616161] uppercase tracking-wide text-center w-[120px]">Overtime</th>
                  <th className="py-3 px-2 text-[12px] font-semibold text-[#616161] uppercase tracking-wide text-center w-[90px]">Total</th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[#616161] uppercase tracking-wide">Notes</th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[#616161] uppercase tracking-wide text-center w-[60px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECEC] dark:divide-[#2C2C35]">
                <AnimatePresence initial={false}>
                  {rows.map((row, idx) => {
                    const isEditable = (!row.date || isDateInSelectedPeriod(row.date, selectedMonth, selectedWeek)) && !isOlderThan2Months;
                    const isOpen = openSitesDayIdx === idx;
                    
                    return (
                      <React.Fragment key={`row-${idx}`}>
                        <motion.tr 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="hover:bg-[#FAFAF9]/50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          {/* Date */}
                          <td className="py-3 px-4 align-middle">
                            {isEditable ? (
                              <div className="relative group w-full">
                                <input
                                  type="date"
                                  value={toInputDate(row.date) || ""}
                                  min={dateRangeLimits.min || ""}
                                  max={dateRangeLimits.max || ""}
                                  onChange={(e) => {
                                    const newDateStr = fromInputDate(e.target.value);
                                    if (newDateStr) updateDayField(idx, "date", newDateStr);
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                />
                                <div className="bg-transparent border border-transparent group-hover:border-[#ECECEC] dark:group-hover:border-[#2C2C35] rounded-md px-2 py-1.5 text-[14px] flex items-center justify-between transition-colors">
                                  <span className={row.date ? "text-[#161616] dark:text-white font-medium" : "text-[#8B8B8B]"}>
                                    {row.date || "Select Date"}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[#8B8B8B] italic">{row.date || ""}</span>
                            )}
                          </td>
                          
                          {/* Day */}
                          <td className="py-3 px-2 align-middle text-[14px] text-[#616161]">{row.day || "-"}</td>
                          
                          {/* Work Hours & Site Breakdown Toggle */}
                          <td className="py-3 px-2 align-middle">
                            <div className="flex items-center gap-1.5 justify-center">
                              <div className="flex items-center bg-[#FAFAF9] dark:bg-[#18181D] border border-[#ECECEC] dark:border-[#2C2C35] rounded-md px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#161616]/10 dark:focus-within:ring-white/10 transition-all w-[90px]">
                                <input
                                  type="text"
                                  value={row.work || ""}
                                  onChange={(e) => updateDayField(idx, "work", e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  disabled={!isEditable}
                                  className="w-full text-[14px] text-center bg-transparent focus:outline-none text-[#161616] dark:text-white disabled:opacity-50 font-medium"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => setOpenSitesDayIdx(isOpen ? null : idx)}
                                className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${isOpen ? "bg-[#161616] text-white dark:bg-white dark:text-black" : "text-[#8B8B8B] hover:bg-[#ECECEC] dark:hover:bg-[#2C2C35]"}`}
                                title="Site Breakdown"
                              >
                                <Location01Icon size={16} strokeWidth={2} />
                              </button>
                            </div>
                          </td>
                          
                          {/* Break Hours */}
                          <td className="py-3 px-2 align-middle">
                            <div className="flex items-center bg-[#FAFAF9] dark:bg-[#18181D] border border-[#ECECEC] dark:border-[#2C2C35] rounded-md px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#161616]/10 mx-auto w-[90px] transition-all">
                              <input
                                type="text"
                                value={row.breakH || ""}
                                onChange={(e) => updateDayField(idx, "breakH", e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={!isEditable}
                                className="w-full text-[14px] text-center bg-transparent focus:outline-none text-[#161616] dark:text-white disabled:opacity-50 font-medium"
                              />
                            </div>
                          </td>
                          
                          {/* Overtime Hours */}
                          <td className="py-3 px-2 align-middle">
                            <div className="flex items-center bg-[#FAFAF9] dark:bg-[#18181D] border border-[#ECECEC] dark:border-[#2C2C35] rounded-md px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#161616]/10 mx-auto w-[90px] transition-all">
                              <input
                                type="text"
                                value={row.over || ""}
                                onChange={(e) => updateDayField(idx, "over", e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={!isEditable}
                                className="w-full text-[14px] text-center bg-transparent focus:outline-none text-[#161616] dark:text-white disabled:opacity-50 font-medium"
                              />
                            </div>
                          </td>
                          
                          {/* Total Hours */}
                          <td className="py-3 px-2 align-middle text-[14px] font-bold text-[#161616] dark:text-white text-center">
                            {calculateTotalHours(row.work, row.over)}
                          </td>
                          
                          {/* Notes */}
                          <td className="py-3 px-4 align-middle">
                            <input
                              type="text"
                              value={row.notes || ""}
                              onChange={(e) => updateDayField(idx, "notes", e.target.value)}
                              onKeyDown={handleKeyDown}
                              disabled={!isEditable}
                              placeholder="Add notes..."
                              className="w-full border-none bg-transparent text-[14px] text-[#161616] dark:text-white placeholder:text-[#8B8B8B] focus:outline-none focus:ring-0 disabled:opacity-50"
                            />
                          </td>
                          
                          {/* Delete Action */}
                          <td className="py-3 px-4 align-middle text-center">
                            {isEditable && (
                              <button
                                type="button"
                                onClick={() => deleteRow(idx)}
                                className="text-[#8B8B8B] hover:text-[#DC2626] transition-colors p-1"
                                title="Remove Row"
                              >
                                <Delete02Icon size={18} strokeWidth={1.75} />
                              </button>
                            )}
                          </td>
                        </motion.tr>
                        
                        {/* Expanded Sites Breakdown */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.tr 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2, ease: [0, 0.4, 0, 1] }}
                              className="bg-[#FAFAF9] dark:bg-[#18181D]"
                            >
                              <td colSpan={8} className="p-0 border-b border-[#ECECEC] dark:border-[#2C2C35] overflow-hidden">
                                <div className="px-6 py-5 max-w-[800px] mx-auto">
                                  <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-[14px] font-bold text-[#161616] dark:text-white flex items-center gap-2">
                                      <Location01Icon size={16} strokeWidth={2} />
                                      Site Allocations
                                    </h4>
                                    {isEditable && (
                                      <button
                                        type="button"
                                        onClick={() => addSite(idx)}
                                        className="text-[13px] font-semibold text-[#161616] dark:text-white border border-[#ECECEC] dark:border-[#2C2C35] hover:bg-[#ECECEC] dark:hover:bg-[#2C2C35] bg-white dark:bg-[#121217] px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
                                      >
                                        <Add01Icon size={14} strokeWidth={2} />
                                        Add Site
                                      </button>
                                    )}
                                  </div>
                                  
                                  {(!row.sites || row.sites.length === 0) ? (
                                    <p className="text-[13px] text-[#8B8B8B]">No sites added. Hours are unassigned.</p>
                                  ) : (
                                    <div className="flex flex-col gap-3">
                                      {row.sites.map((site, sIdx) => (
                                        <div key={sIdx} className="flex flex-col sm:flex-row sm:items-center gap-4 py-3 px-4 bg-white dark:bg-[#121217] border border-[#ECECEC] dark:border-[#2C2C35] rounded-lg">
                                          {/* Site Name */}
                                          <div className="flex-1 flex flex-col gap-1.5">
                                            <span className="text-[11px] font-semibold text-[#616161] uppercase tracking-wide">Location Name</span>
                                            <input
                                              type="text"
                                              value={site.name || ""}
                                              onChange={(e) => updateSiteField(idx, sIdx, "name", e.target.value)}
                                              disabled={!isEditable}
                                              placeholder="e.g. HQ - Main Block"
                                              className="border-none p-0 text-[14px] bg-transparent focus:ring-0 text-[#161616] dark:text-white placeholder:text-[#8B8B8B] font-medium"
                                            />
                                          </div>
                                          
                                          {/* Divider */}
                                          <div className="hidden sm:block w-[1px] h-8 bg-[#ECECEC] dark:bg-[#2C2C35]" />
                                          
                                          {/* Entry & Exit Times */}
                                          <div className="flex items-center gap-4">
                                            <div className="flex flex-col gap-1.5">
                                              <span className="text-[11px] font-semibold text-[#616161] uppercase tracking-wide">Time In</span>
                                              <div className="flex items-center gap-1 text-[14px] font-medium text-[#161616] dark:text-white">
                                                <input
                                                  type="text"
                                                  value={site.entryTimeVal || ""}
                                                  placeholder="09:00"
                                                  onChange={(e) => handleSiteTimeValChange(idx, sIdx, "entryTimeVal", e.target.value)}
                                                  onBlur={(e) => handleSiteTimeValBlur(idx, sIdx, "entryTimeVal", e.target.value)}
                                                  disabled={!isEditable}
                                                  className="w-[45px] text-center border-none p-0 bg-transparent focus:ring-0"
                                                />
                                                <select
                                                  value={site.entryAmpm || "AM"}
                                                  onChange={(e) => handleSiteAmpmChange(idx, sIdx, "entryAmpm", e.target.value)}
                                                  disabled={!isEditable}
                                                  className="appearance-none border-none p-0 bg-transparent focus:ring-0 text-[#8B8B8B] cursor-pointer"
                                                >
                                                  <option value="AM">AM</option>
                                                  <option value="PM">PM</option>
                                                </select>
                                              </div>
                                            </div>
                                            <div className="text-[#8B8B8B] font-medium mt-4">→</div>
                                            <div className="flex flex-col gap-1.5">
                                              <span className="text-[11px] font-semibold text-[#616161] uppercase tracking-wide">Time Out</span>
                                              <div className="flex items-center gap-1 text-[14px] font-medium text-[#161616] dark:text-white">
                                                <input
                                                  type="text"
                                                  value={site.exitTimeVal || ""}
                                                  placeholder="05:00"
                                                  onChange={(e) => handleSiteTimeValChange(idx, sIdx, "exitTimeVal", e.target.value)}
                                                  onBlur={(e) => handleSiteTimeValBlur(idx, sIdx, "exitTimeVal", e.target.value)}
                                                  disabled={!isEditable}
                                                  className="w-[45px] text-center border-none p-0 bg-transparent focus:ring-0"
                                                />
                                                <select
                                                  value={site.exitAmpm || "PM"}
                                                  onChange={(e) => handleSiteAmpmChange(idx, sIdx, "exitAmpm", e.target.value)}
                                                  disabled={!isEditable}
                                                  className="appearance-none border-none p-0 bg-transparent focus:ring-0 text-[#8B8B8B] cursor-pointer"
                                                >
                                                  <option value="AM">AM</option>
                                                  <option value="PM">PM</option>
                                                </select>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {/* Delete Site Action */}
                                          {isEditable && (
                                            <button
                                              type="button"
                                              onClick={() => removeSite(idx, sIdx)}
                                              className="p-1.5 ml-2 text-[#8B8B8B] hover:text-[#DC2626] rounded-md transition-colors sm:self-center"
                                              title="Remove Site"
                                            >
                                              <Cancel01Icon size={16} strokeWidth={2} />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Add Row Button */}
          {rows.length < 7 && !isOlderThan2Months && (
            <div className="p-4 border-t border-[#ECECEC] dark:border-[#2C2C35] bg-[#FAFAF9] dark:bg-[#18181D]">
              <button
                onClick={addRow}
                className="flex items-center gap-2 px-4 py-2 border border-[#ECECEC] dark:border-[#2C2C35] rounded-md text-[#161616] dark:text-white hover:bg-white dark:hover:bg-[#2C2C35] transition-colors text-[14px] font-semibold bg-white dark:bg-[#121217]"
              >
                <Add01Icon size={16} strokeWidth={2} />
                Add New Row
              </button>
            </div>
          )}
        </div>

        {/* Right: Summary Sidebars */}
        <div className="w-full xl:w-[300px] flex flex-col gap-6 flex-shrink-0">
          
          {/* Main Summary Card */}
          <div className="bg-white dark:bg-[#121217] border border-[#ECECEC] dark:border-[#2C2C35] rounded-xl p-6">
            <h3 className="text-[15px] font-bold text-[#161616] dark:text-white mb-5">Timesheet Summary</h3>

            <div className="flex flex-col gap-3.5 mb-5">
              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[#616161]">Work Hours</span>
                <span className="font-semibold text-[#161616] dark:text-white">52h 30m</span>
              </div>
              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[#616161]">Break Time</span>
                <span className="font-semibold text-[#161616] dark:text-white">06h 30m</span>
              </div>
              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[#616161]">Overtime</span>
                <span className="font-semibold text-[#161616] dark:text-white">04h 00m</span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-[#ECECEC] dark:bg-[#2C2C35] mb-5" />

            <div className="flex items-center justify-between mb-6">
              <span className="text-[15px] font-bold text-[#161616] dark:text-white">Total Logged</span>
              <span className="text-[18px] font-extrabold text-[#161616] dark:text-white tracking-tight">53h 00m</span>
            </div>

            <h4 className="text-[12px] font-bold text-[#8B8B8B] uppercase tracking-wide mb-4">Breakdown Analysis</h4>

            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-3 flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#16A34A]" />
                    <span className="text-[13px] font-semibold text-[#161616] dark:text-white">Standard Timing</span>
                  </div>
                  <span className="text-[12px] text-[#8B8B8B] pl-4.5">42h 30m (80%)</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]" />
                    <span className="text-[13px] font-semibold text-[#161616] dark:text-white">Break Time</span>
                  </div>
                  <span className="text-[12px] text-[#8B8B8B] pl-4.5">06h 30m (12%)</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6]" />
                    <span className="text-[13px] font-semibold text-[#161616] dark:text-white">Overtime</span>
                  </div>
                  <span className="text-[12px] text-[#8B8B8B] pl-4.5">04h 00m (8%)</span>
                </div>
              </div>

              {/* Minimal Donut Chart */}
              <div className="relative w-[80px] h-[80px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={40}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Sites Overview Card */}
          <div className="bg-white dark:bg-[#121217] border border-[#ECECEC] dark:border-[#2C2C35] rounded-xl p-6">
            <h3 className="text-[15px] font-bold text-[#161616] dark:text-white mb-5">Location Allocations</h3>
            {sitesOverview.length === 0 ? (
              <p className="text-[13px] text-[#8B8B8B]">No locations logged this week.</p>
            ) : (
              <div className="flex flex-col gap-5">
                {sitesOverview.map((site, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[13.5px]">
                      <span className="font-medium text-[#161616] dark:text-white">{site.name || "Unnamed"}</span>
                      <span className="font-semibold text-[#161616] dark:text-white">{site.formattedHours}</span>
                    </div>
                    {/* Linear Progress Bar */}
                    <div className="w-full h-1.5 bg-[#FAFAF9] dark:bg-[#1E1E24] rounded-full overflow-hidden border border-[#ECECEC] dark:border-[#2C2C35]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (site.mins / (53 * 60)) * 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-[#16A34A] rounded-full" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-8 pt-6 border-t border-[#ECECEC] dark:border-[#2C2C35] flex items-center justify-end gap-3">
        <Link href="/timesheet">
          <button className="px-5 py-2.5 text-[14px] font-medium text-[#616161] hover:text-[#161616] dark:text-gray-300 dark:hover:text-white transition-colors">
            Cancel
          </button>
        </Link>
        <button 
          disabled={isOlderThan2Months}
          className="px-5 py-2.5 text-[14px] font-semibold text-[#161616] dark:text-white border border-[#ECECEC] dark:border-[#2C2C35] hover:bg-[#FAFAF9] dark:hover:bg-[#2C2C35] rounded-md transition-colors disabled:opacity-50"
        >
          Save Draft
        </button>
        <button 
          disabled={isOlderThan2Months}
          className="px-5 py-2.5 text-[14px] font-semibold text-white bg-[#161616] dark:bg-white dark:text-black hover:bg-black/80 dark:hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
        >
          Submit Timesheet
        </button>
      </div>

    </div>
  );
}

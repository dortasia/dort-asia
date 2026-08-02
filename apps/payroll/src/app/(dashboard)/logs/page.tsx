"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Download,
  Users,
  UserCheck,
  UserX,
  Clock,
  LayoutGrid,
  SlidersHorizontal,
  Filter,
  Mail,
  Phone,
  MapPin,
  Edit,
  QrCode,
  Monitor,
  CheckCircle2,
  PauseCircle,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import HeaderSearchBar from "@/components/HeaderSearchBar";

/* ──────────────────────────────────────────────────────
   CUSTOM COMPONENTS
─────────────────────────────────────────────────────── */

function CustomDropdown({
  value,
  options,
  onChange,
}: {
  value: string | number;
  options: { label: string; value: string | number; disabled?: boolean }[];
  onChange: (val: any) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value == value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 border border-[#E5E7EB] dark:border-[#3A3A3C] bg-white dark:bg-[#121217] rounded-[6px] pl-3.5 pr-2.5 py-1.5 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1C1C1E] focus:outline-none transition-colors"
      >
        <span className="min-w-[65px] text-left leading-none">{selectedOption?.label}</span>
        <ChevronDown className={`h-[15px] w-[15px] text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} strokeWidth={2.5} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1.5 min-w-[130px] max-h-[260px] overflow-y-auto page-scrollbar bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[10px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] z-[100] p-1.5 origin-top-right animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt, i) => {
            const isSelected = value == opt.value;
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[13px] font-semibold transition-colors rounded-[6px] flex items-center justify-between mb-0.5 last:mb-0 ${
                  isSelected
                    ? "bg-[#007AFF]/10 text-[#007AFF] dark:text-[#007AFF]"
                    : "text-gray-700 dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-[#2C2C35]"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   MOCK DATA
─────────────────────────────────────────────────────── */
const DEPARTMENTS = ["Engineering", "Design", "Marketing", "HR", "Finance", "Operations"] as const;
type Dept = (typeof DEPARTMENTS)[number];

const DEPT_COLOR: Record<Dept, { color: string; bg: string }> = {
  Engineering: { color: "var(--user-accent)", bg: "#E5F1FF" },
  Design:      { color: "#34C759", bg: "#E5F9EC" },
  Marketing:   { color: "#FF9500", bg: "#FFF4E5" },
  HR:          { color: "#FF2D55", bg: "#FFE5EA" },
  Finance:     { color: "#5856D6", bg: "#F2F2FB" },
  Operations:  { color: "#00C7BE", bg: "#E5F9F8" },
};

interface Employee {
  id: number;
  name: string;
  initials: string;
  role: string;
  dept: Dept;
}

const DEPT_HEADS: Record<Dept, string> = {
  Engineering: "John Doe",
  Design: "Jane Smith",
  Marketing: "David Lee",
  HR: "Maya Patel",
  Finance: "Krish Kumar",
  Operations: "Sarah Johnson",
};

const AVATAR_COLORS: Record<string, { bg: string; color: string }> = {
  JD: { color: "#007AFF", bg: "#E5F1FF" },
  JS: { color: "#FF9500", bg: "#FFF4E5" },
  DL: { color: "#FF9500", bg: "#FFF4E5" },
  MP: { color: "#34C759", bg: "#B8F0CC" },
  KK: { color: "#5856D6", bg: "#F2F2FB" },
  SJ: { color: "#FF9500", bg: "#FFF4E5" },
  AS: { color: "#FF2D55", bg: "#FFC1CC" },
  KP: { color: "#5856D6", bg: "#F2F2FB" },
  AM: { color: "#00C7BE", bg: "#E5F9F8" },
  KR: { color: "#FF9500", bg: "#FFF4E5" },
};
const getAvatarColor = (initials: string) => AVATAR_COLORS[initials] || { color: "#007AFF", bg: "#E5F1FF" };

const EMPLOYEES: Employee[] = [
  { id: 1, name: "John Doe",       initials: "JD", role: "Product Manager",   dept: "Engineering" },
  { id: 2, name: "Jane Smith",     initials: "JS", role: "UI/UX Designer",    dept: "Design"      },
  { id: 3, name: "Ahmad Silva",    initials: "AS", role: "QA Engineer",       dept: "Engineering" },
  { id: 4, name: "Maya Patel",     initials: "MP", role: "HR Specialist",     dept: "HR"          },
  { id: 5, name: "Krish Kumar",    initials: "KK", role: "Software Engineer", dept: "Engineering" },
  { id: 6, name: "Sarah Johnson",  initials: "SJ", role: "Ops Director",      dept: "Operations"  },
  { id: 7, name: "Priya Nair",     initials: "PN", role: "Finance Analyst",   dept: "Finance"     },
  { id: 8, name: "David Lee",      initials: "DL", role: "Marketing Head",    dept: "Marketing"   },
  { id: 9, name: "Ananya Roy",     initials: "AR", role: "Designer",          dept: "Design"      },
  { id: 10, name: "Rahul Sharma",  initials: "RS", role: "Backend Engineer",  dept: "Engineering" },
];

type DayStatus = "P" | "A" | "L" | "H" | "WO";

interface DayLog {
  date: number;
  status: DayStatus;
  clockIn?: string;
  clockOut?: string;
  hours?: string;
  method?: string;
}

// Generate a full month log for one employee (seeded by id)
function generateMonthLog(empId: number, month: number, year: number): DayLog[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const logs: DayLog[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow === 0 || dow === 6) {
      logs.push({ date: d, status: "WO" });
      continue;
    }
    const seed = (empId * 7 + d * 13) % 100;
    let status: DayStatus = "P";
    if (d === 15 && empId % 3 === 0) status = "H"; // holiday
    else if (seed < 8)  status = "A";
    else if (seed < 14) status = "L";
    else                status = "P";

    if (status === "P") {
      const hIn  = 8 + (seed % 2);
      const mIn  = (seed * 3) % 60;
      const hOut = hIn + 8 + (seed % 2);
      const mOut = (seed * 7) % 60;
      const hrs  = hOut - hIn + (mOut - mIn) / 60;
      const methodOptions = ["Thumb", "Mobile App", "Web UI", "Face Scan"];
      const method = methodOptions[seed % 4];
      logs.push({
        date: d,
        status: "P",
        clockIn:  `${String(hIn).padStart(2,"0")}:${String(mIn).padStart(2,"0")} AM`,
        clockOut: `${String(hOut - 12 > 0 ? hOut - 12 : hOut).padStart(2,"0")}:${String(mOut).padStart(2,"0")} PM`,
        hours: `${Math.floor(hrs)}h ${Math.round((hrs % 1)*60)}m`,
        method: method,
      });
    } else {
      logs.push({ date: d, status });
    }
  }
  return logs;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_IN_MARCH = 31;

const STATUS_STYLE: Record<DayStatus, string> = {
  P:  "bg-[#34C759]/15 border border-[#34C759]/30 text-[#248A3D] shadow-sm backdrop-blur-md",
  A:  "bg-[#FF3B30]/15 border border-[#FF3B30]/30 text-[#C93400] shadow-sm backdrop-blur-md",
  L:  "bg-[#FF9500]/15 border border-[#FF9500]/30 text-[#A66000] shadow-sm backdrop-blur-md",
  H:  "bg-[#5856D6]/15 border border-[#5856D6]/30 text-[#3A3897] shadow-sm backdrop-blur-md",
  WO: "bg-[#8E8E93]/15 border border-[#8E8E93]/30 text-[#48484A] shadow-sm backdrop-blur-md",
};
const STATUS_LABEL: Record<DayStatus, string> = {
  P: "Present", A: "Absent", L: "Leave", H: "Holiday", WO: "Week Off",
};

type View = "company" | "department" | "employee";

/* ──────────────────────────────────────────────────────
   SUB-COMPONENTS
─────────────────────────────────────────────────────── */

// Stat pill
function StatPill({ label, value, color, bg, icon: Icon }: {
  label: string; value: number | string; color: string; bg: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: bg }}>
        <Icon className="h-4 w-4" style={{ color }} strokeWidth={2} />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-[#86868b]">{label}</p>
        <p className="text-[15px] font-bold text-[#1d1d1f] leading-tight">{value}</p>
      </div>
    </div>
  );
}

// Day cell in employee table
function DayCell({ log }: { log: DayLog }) {
  if (log.status === "WO") return (
    <td className="px-2 py-2 text-center">
      <span className="text-[10px] font-medium text-[#C7C7CC]">—</span>
    </td>
  );
  return (
    <td className="px-1.5 py-2 text-center">
      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[log.status]}`}>
        {log.status}
      </span>
    </td>
  );
}

/* ──────────────────────────────────────────────────────
   COMPANY VIEW
─────────────────────────────────────────────────────── */
function CompanyView({ month, year, totalEmployees }: { month: number; year: number; totalEmployees: number }) {
  // Aggregate stats
  const allLogs = EMPLOYEES.map(e => ({
    emp: e,
    days: generateMonthLog(e.id, month, year),
  }));

  const totals = allLogs.reduce((acc, { days }) => {
    days.forEach(d => {
      if (d.status === "P") acc.present++;
      else if (d.status === "A") acc.absent++;
      else if (d.status === "L") acc.leave++;
    });
    return acc;
  }, { present: 0, absent: 0, leave: 0 });

  const workDays = allLogs[0].days.filter(d => d.status !== "WO").length;
  // Use real totalEmployees for attendance pct if possible, but fallback to EMPLOYEES.length for mock math consistency
  const attendancePct = Math.round((totals.present / (EMPLOYEES.length * workDays)) * 100);

  return (
    <div className="flex flex-col gap-5">
      {/* Summary strip */}
      <div className="bg-[#F8F9FA] rounded-[20px] p-5 flex items-center gap-8">
        <StatPill label="Total Employees"    value={totalEmployees} color="var(--user-accent)" bg="#E5F1FF" icon={Users} />
        <div className="w-px h-8 bg-[#E5E7EB]" />
        <StatPill label="Working Days"       value={workDays}         color="#5856D6" bg="#EFEFF9" icon={Clock} />
        <div className="w-px h-8 bg-[#E5E7EB]" />
        <StatPill label="Total Present"      value={totals.present}   color="#16A34A" bg="#E8FAF0" icon={UserCheck} />
        <div className="w-px h-8 bg-[#E5E7EB]" />
        <StatPill label="Total Absent"       value={totals.absent}    color="#DC2626" bg="#FFF1F1" icon={UserX} />
        <div className="w-px h-8 bg-[#E5E7EB]" />
        <StatPill label="Leave Days"         value={totals.leave}     color="#FF9500" bg="#FFF4E5" icon={Clock} />
        <div className="ml-auto text-right">
          <p className="text-[11px] text-[#86868b] font-semibold">Attendance Rate</p>
          <p className="text-[28px] font-bold text-[#1d1d1f] leading-tight">{attendancePct}%</p>
        </div>
      </div>

      {/* Per-employee summary table */}
      <div className="bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[24px] p-6">
        {/* Header */}
        <div className="flex items-center px-4 pb-2 text-[10px] font-bold text-[#86868b] uppercase tracking-wider">
          <span className="w-[22%]">Employee</span>
          <span className="w-[13%]">Department</span>
          <span className="w-[8%] text-center">Days</span>
          <span className="w-[8%] text-center text-[#16A34A]">Present</span>
          <span className="w-[8%] text-center text-[#DC2626]">Absent</span>
          <span className="w-[8%] text-center text-[#FF9500]">Leave</span>
          <span className="w-[12%] text-center">Att. Rate</span>
          <span className="flex-1 text-center">Monthly Status</span>
        </div>

        <div className="flex flex-col gap-2">
          {allLogs.map(({ emp, days }) => {
            const p = days.filter(d => d.status === "P").length;
            const a = days.filter(d => d.status === "A").length;
            const l = days.filter(d => d.status === "L").length;
            const wd = days.filter(d => d.status !== "WO").length;
            const rate = Math.round((p / wd) * 100);
            const dc = DEPT_COLOR[emp.dept];

            return (
              <div key={emp.id} className="bg-white dark:bg-[#121217] rounded-[16px] px-4 py-3 flex items-center border border-[#F1F3F5] dark:border-[#2C2C35]">
                {/* Avatar + name */}
                <div className="w-[22%] flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ background: dc.bg, color: dc.color }}>
                    {emp.initials}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-[#1d1d1f]">{emp.name}</p>
                    <p className="text-[10px] text-[#86868b]">{emp.role}</p>
                  </div>
                </div>
                {/* Dept */}
                <div className="w-[13%]">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border-[1.5px]" style={{ backgroundColor: `${dc.color}40`, color: dc.color, borderColor: dc.color }}>
                    {emp.dept}
                  </span>
                </div>
                {/* Stats */}
                <span className="w-[8%] text-center text-[12px] font-semibold text-[#1d1d1f]">{wd}</span>
                <span className="w-[8%] text-center text-[12px] font-bold text-[#16A34A]">{p}</span>
                <span className="w-[8%] text-center text-[12px] font-bold text-[#DC2626]">{a}</span>
                <span className="w-[8%] text-center text-[12px] font-bold text-[#FF9500]">{l}</span>
                {/* Rate */}
                <div className="w-[12%] flex flex-col items-center gap-1">
                  <span className="text-[12px] font-bold text-[#1d1d1f]">{rate}%</span>
                  <div className="w-full h-1.5 bg-[#F1F3F5] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--user-accent)]" style={{ width: `${rate}%` }} />
                  </div>
                </div>
                {/* Mini monthly status strip */}
                <div className="flex-1 flex justify-center">
                  <div className="flex gap-0.5">
                    {days.filter(d => d.status !== "WO").map(d => (
                      <div
                        key={d.date}
                        title={`${d.date} Mar — ${STATUS_LABEL[d.status]}`}
                        className="h-4 w-4 rounded-sm flex items-center justify-center text-[7px] font-bold cursor-pointer"
                        style={{
                          background: d.status === "P" ? "#16A34A40" : d.status === "A" ? "#DC262640" : d.status === "L" ? "#FF950040" : "#5856D640",
                          color: d.status === "P" ? "#16A34A" : d.status === "A" ? "#DC2626" : d.status === "L" ? "#FF9500" : "#5856D6",
                        }}
                      >
                        {d.status}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DepartmentView({ month, year }: { month: number; year: number }) {
  const deptData = DEPARTMENTS.map(dept => {
    const emps = EMPLOYEES.filter(e => e.dept === dept);
    const allDays = emps.flatMap(e => generateMonthLog(e.id, month, year));
    const totalLogs = allDays.length;
    return { dept, totalLogs };
  });

  return (
    <div className="bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[24px] flex-1 p-6 min-h-[500px]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {deptData.map(({ dept, totalLogs }) => (
          <div key={dept} className="bg-white dark:bg-[#121217] rounded-[20px] p-5 border border-[#F1F3F5] dark:border-[#2C2C35] flex flex-col transition-all">
            <div className="flex items-center gap-4">
              {/* Avatar placeholder matching the screenshot */}
              <div 
                className="h-[46px] w-[46px] rounded-full shrink-0 relative flex items-center justify-center font-bold text-[18px]"
                style={{
                  backgroundColor: DEPT_COLOR[dept].bg,
                  color: DEPT_COLOR[dept].color
                }}
              >
                {dept.length <= 2 ? dept.toUpperCase() : dept.substring(0, 2).toUpperCase()}
                <div 
                  className="absolute -right-1 -bottom-1 h-[22px] w-[22px] rounded-full flex items-center justify-center text-[8px] font-bold border-2 border-white dark:border-[#121217] shadow-sm"
                  style={{
                    backgroundColor: getAvatarColor(DEPT_HEADS[dept].split(" ").map(n => n[0]).join("")).bg,
                    color: getAvatarColor(DEPT_HEADS[dept].split(" ").map(n => n[0]).join("")).color
                  }}
                >
                  {DEPT_HEADS[dept].split(" ").map(n => n[0]).join("")}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-[#1d1d1f] tracking-tight">{dept}</p>
                <p className="text-[12px] text-[#A1A1A6] font-semibold mt-0.5">{DEPT_HEADS[dept]}</p>
              </div>
            </div>
            
            <hr className="border-t border-[#F1F3F5] mt-5 mb-4" />
            
            <div className="flex items-center justify-between text-[12.5px] font-bold">
              <span className="text-[#1d1d1f]">Total Logs : {totalLogs}</span>
              <button className="text-[var(--user-accent)] hover:text-[#0062CC] transition-colors flex items-center gap-0.5">
                View Logs <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   EMPLOYEE VIEW — list → daily log drilldown
─────────────────────────────────────────────────────── */
function EmployeeView({ search }: { search: string }) {
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [logOverrides, setLogOverrides] = useState<Record<string, Partial<DayLog>>>({});
  const [editingLog, setEditingLog] = useState<DayLog | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.action-menu-container')) {
        setOpenActionMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);
  const selectedYear = new Date().getFullYear();

  const filteredEmps = EMPLOYEES.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.dept.toLowerCase().includes(search.toLowerCase())
  );

  // ── DETAIL VIEW ──
  if (selectedEmp) {
    const baseDays = generateMonthLog(selectedEmp.id, selectedMonth, selectedYear);
    const days = baseDays.map(d => {
      const key = `${selectedEmp.id}-${selectedMonth}-${d.date}`;
      if (logOverrides[key]) {
        return { ...d, ...logOverrides[key] } as DayLog;
      }
      return d;
    }).slice().reverse();
    // Real counts
    const p  = days.filter(d => d.status === "P").length;
    const a  = days.filter(d => d.status === "A").length;
    const l  = days.filter(d => d.status === "L").length;
    const wd = days.filter(d => d.status !== "WO").length;
    const rateVal = wd > 0 ? Math.round((p/wd)*100) : 0;
    const rate = rateVal + "%";
    
    let pieColor = "#34C759";
    if (rateVal < 75) pieColor = "#FFB020";
    if (rateVal < 50) pieColor = "#DF4353";
    
    const dc = DEPT_COLOR[selectedEmp.dept];

    return (
      <div className="absolute inset-0 z-50 bg-white dark:bg-[#0B0B0F] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Sticky Header — matching Setup Full Profile */}
        <div className="shrink-0 bg-white dark:bg-[#1C1C1E] border-b border-[#E5E7EB] dark:border-[#2C2C35]">
          <div className="w-full px-6 py-4 flex items-center gap-4">
            <button
              onClick={() => setSelectedEmp(null)}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#2C2C35] transition-colors"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-300"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div className="leading-tight">
              <h1 className="text-[16px] font-bold text-gray-900 dark:text-white tracking-tight">Log Histories</h1>
              <p className="text-[11px] font-medium text-gray-400">Employee &bull; {selectedEmp.name}</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 w-full flex flex-col gap-6 px-[15px] py-8 overflow-y-auto page-scrollbar">
          {/* Profile & Pie Chart Container */}
          <div className="flex gap-4 items-stretch w-full">
            {/* Profile Header Block */}
            <div className="bg-white dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[16px] p-6 flex flex-col flex-1">
              {/* Top row: Avatar, Details, Edit */}
              <div className="flex gap-5 items-center">
                {/* Avatar Box */}
                <div 
                  className="h-[84px] w-[84px] shrink-0 rounded-[12px] flex items-center justify-center text-[28px] font-bold border border-[#E5E7EB] dark:border-[#2C2C35] bg-[#E5F1FF] text-[#007AFF]"
                  style={{ background: dc.bg, color: dc.color }}
                >
                  {selectedEmp.initials}
                </div>
                
                {/* Details & Action */}
                <div className="flex-1 flex justify-between items-center">
                  <div className="flex flex-col gap-1.5">
                    <h2 className="text-[20px] font-bold text-gray-900 dark:text-white leading-none tracking-tight">{selectedEmp.name}</h2>
                    <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400">{selectedEmp.role}</span>
                  </div>
                  
                  {/* Edit Button */}
                  <Link href={`/employees/${selectedEmp.id}/edit`}>
                    <button className="flex items-center gap-1.5 border border-[#E5E7EB] dark:border-[#3A3A3C] rounded-[8px] px-4 py-2 text-[13px] font-semibold text-[#4B5563] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1C1C1E] transition-colors">
                      <Edit className="h-[15px] w-[15px] text-[#9CA3AF]" strokeWidth={2} /> Edit Profile
                    </button>
                  </Link>
                </div>
              </div>
              
              <div className="w-full h-px bg-[#E5E7EB] dark:bg-[#2C2C35] mt-5 mb-4" />
              
              {/* Bottom Row Attributes */}
              <div className="flex items-center justify-between px-1">
                <div>
                  <p className="text-[11px] text-[#6B7280] font-semibold mb-1">Employee ID</p>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">IM06587UT</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#6B7280] font-semibold mb-1">Email</p>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedEmp.name.toLowerCase().replace(' ', '')}08@gmail.com</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#6B7280] font-semibold mb-1">Phone no</p>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">+65 8543 8400</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#6B7280] font-semibold mb-1">Department</p>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedEmp.dept}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#6B7280] font-semibold mb-1">Available leave counts</p>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">05</p>
                </div>
              </div>
            </div>

            {/* Pie Chart Card */}
            <div className="w-[280px] shrink-0 bg-white dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[16px] p-5 flex flex-col relative justify-between">
              <div className="flex items-start justify-between">
                <h3 className="text-[12px] font-bold text-gray-900 dark:text-white leading-tight">Attendance</h3>
                <button className="flex items-center gap-1 text-[10px] font-bold text-[#007AFF] hover:underline leading-tight">
                  View Details
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center relative mt-2">
                <svg viewBox="0 0 100 100" className="w-[130px] h-[130px] transform -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="transparent" stroke="#F3F4F6" strokeWidth="12" className="dark:stroke-[#2C2C35]" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke={pieColor}
                    strokeWidth="12"
                    strokeDasharray={263.89}
                    strokeDashoffset={263.89 - (263.89 * rateVal) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out z-10 relative"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[28px] font-semibold text-gray-900 dark:text-white leading-none">{rate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Summary Cards (Moved to top of Attendance Log) */}
          <div className="grid grid-cols-4 gap-4 w-full">
            <div className="bg-[#F2EEFD] dark:bg-[#2A2440] p-4 rounded-[12px] flex flex-col justify-center border border-[#7B5EEA]/10">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-[#7B5EEA] rounded-full flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-white" strokeWidth={2.5} />
                 </div>
                 <div>
                   <p className="text-[11px] text-[#7B5EEA] font-bold tracking-tight mb-0.5">Average Daily Hours</p>
                   <p className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight">8 hrs</p>
                 </div>
               </div>
            </div>

            <div className="bg-[#EAF5FE] dark:bg-[#1E2E40] p-4 rounded-[12px] flex flex-col justify-center border border-[#2C97EA]/10">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-[#2C97EA] rounded-full flex items-center justify-center shrink-0">
                    <Monitor className="h-5 w-5 text-white" strokeWidth={2.5} />
                 </div>
                 <div>
                   <p className="text-[11px] text-[#2C97EA] font-bold tracking-tight mb-0.5">Total Working Days</p>
                   <p className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight">{String(wd).padStart(2, '0')}</p>
                 </div>
               </div>
            </div>

            <div className="bg-[#E8F8F1] dark:bg-[#1A3026] p-4 rounded-[12px] flex flex-col justify-center border border-[#25A768]/10">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-[#25A768] rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-white" strokeWidth={2.5} />
                 </div>
                 <div>
                   <p className="text-[11px] text-[#25A768] font-bold tracking-tight mb-0.5">Total Present Days</p>
                   <p className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight">{String(p).padStart(2, '0')}</p>
                 </div>
               </div>
            </div>

            <div className="bg-[#FCEAEB] dark:bg-[#3D1A1E] p-4 rounded-[12px] flex flex-col justify-center border border-[#DF4353]/10">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-[#DF4353] rounded-full flex items-center justify-center shrink-0">
                    <PauseCircle className="h-5 w-5 text-white" strokeWidth={2.5} />
                 </div>
                 <div>
                   <p className="text-[11px] text-[#DF4353] font-bold tracking-tight mb-0.5">Total Absent Days</p>
                   <p className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight">{String(a).padStart(2, '0')}</p>
                 </div>
               </div>
            </div>
          </div>

          {/* Main Section: Attendance Log Table Card */}
          <div className="bg-white dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[16px] p-6 overflow-hidden flex flex-col">
            
            {/* Header Row */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-tight">Attendance Log</h3>
              <div className="flex items-center gap-3">
                <CustomDropdown
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { label: "All Status", value: "All" },
                    { label: "Present", value: "Present" },
                    { label: "Absent", value: "Absent" },
                    { label: "Holidays", value: "Holidays" },
                    { label: "Weekend", value: "Weekend" },
                  ]}
                />
                
                <CustomDropdown
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                  options={MONTHS.map((m, idx) => ({ label: m, value: idx, disabled: idx > new Date().getMonth() }))}
                />
              </div>
            </div>
            

            
            {/* Table */}
            <div className="border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[10px] overflow-hidden -mx-2 sm:mx-0">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#F8F9FA] dark:bg-[#1C1C1E] border-b border-[#E5E7EB] dark:border-[#2C2C35]">
                    <th className="px-5 py-3.5 text-[13px] font-bold text-gray-900 dark:text-white">Date</th>
                    <th className="px-5 py-3.5 text-[13px] font-bold text-gray-900 dark:text-white">Shift</th>
                    <th className="px-5 py-3.5 text-[13px] font-bold text-gray-900 dark:text-white">Clock In</th>
                    <th className="px-5 py-3.5 text-[13px] font-bold text-gray-900 dark:text-white">Clock Out</th>
                    <th className="px-5 py-3.5 text-[13px] font-bold text-gray-900 dark:text-white">Method</th>
                    <th className="px-5 py-3.5 text-[13px] font-bold text-gray-900 dark:text-white">Working Hours</th>
                    <th className="px-5 py-3.5 text-[13px] font-bold text-gray-900 dark:text-white">Location</th>
                    <th className="px-5 py-3.5 text-[13px] font-bold text-gray-900 dark:text-white">Status</th>
                    <th className="px-5 py-3.5 w-12 rounded-tr-[10px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {days
                    .filter(d => {
                      if (statusFilter === "All") return true;
                      let label = "Present";
                      if (d.status === "A" || d.status === "L") label = "Absent";
                      if (d.status === "H") label = "Holidays";
                      if (d.status === "WO") label = "Weekend";
                      return label === statusFilter;
                    })
                    .slice(0, 10).map((d, i) => {
                     const formattedDate = `${MONTHS[selectedMonth]} ${String(d.date).padStart(2, "0")}, ${selectedYear}`; 
                     const isNotRecorded = d.status === "L" || d.status === "A" || d.status === "H" || d.status === "WO";
                     const textColor = isNotRecorded ? "text-[#C1C1C4] dark:text-[#5A5A5C]" : "text-gray-900 dark:text-gray-300";
                     
                     let statusLabel = "Present";
                     let statusBg = "bg-[#EAF7ED] dark:bg-[#1A3026] text-[#299555] dark:text-[#34C759]";
                     if (d.status === "A" || d.status === "L") { 
                       statusLabel = "Absent"; 
                       statusBg = "bg-[#FCEAEB] dark:bg-[#3D1A1E] text-[#D1293D] dark:text-[#FF3B30]"; 
                     }
                     if (d.status === "WO") {
                       statusLabel = "Weekend";
                       statusBg = "bg-[#F1F3F5] dark:bg-[#2C2C35] text-[#86868b] dark:text-[#A1A1A6]";
                     }
                     if (d.status === "H") {
                       statusLabel = "Holidays";
                       statusBg = "bg-[#F1F3F5] dark:bg-[#2C2C35] text-[#86868b] dark:text-[#A1A1A6]";
                     }
                     
                     return (
                       <tr key={i} className="border-b border-[#E5E7EB] dark:border-[#2C2C35] last:border-b-0 hover:bg-gray-50 dark:hover:bg-[#1C1C1E] transition-colors relative">
                         <td className={`px-5 py-4 text-[13px] font-semibold ${textColor}`}>{formattedDate}</td>
                         <td className={`px-5 py-4 text-[13px] font-semibold ${textColor}`}>{isNotRecorded ? 'Not Recorded' : (i % 2 === 0 ? 'Day Shift' : 'Night Shift')}</td>
                         <td className={`px-5 py-4 text-[13px] font-semibold ${textColor}`}>{isNotRecorded ? 'Not Recorded' : (d.clockIn || '—')}</td>
                         <td className={`px-5 py-4 text-[13px] font-semibold ${textColor}`}>{isNotRecorded ? 'Not Recorded' : (d.clockOut || '—')}</td>
                         <td className={`px-5 py-4 text-[13px] font-semibold ${textColor}`}>{isNotRecorded ? 'Not Recorded' : (d.method || '—')}</td>
                          <td className={`px-5 py-4 text-[13px] font-semibold ${textColor}`}>{isNotRecorded ? 'Not Recorded' : (d.hours?.replace('h', 'hrs').replace('m', 'min') || '—')}</td>
                         <td className={`px-5 py-4 text-[13px] font-semibold ${textColor}`}>
                           {isNotRecorded ? (
                             <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Not Recorded</span>
                           ) : (
                             <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-400" /> Singapore</span>
                           )}
                         </td>
                         <td className={`px-5 py-4 text-[13px] font-semibold`}>
                           <div className="absolute right-5 top-1/2 -translate-y-1/2">
                             <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold ${statusBg}`}>
                               {statusLabel}
                             </span>
                           </div>
                         </td>
                       </tr>
                     );
                  })}
                </tbody>
              </table>
              
              {/* Footer */}
              <div className="bg-[#F8F9FA] dark:bg-[#1A1A1C] px-5 py-4 border-t border-[#E5E7EB] dark:border-[#2C2C35] flex items-center justify-between">
                <span className="text-[12px] font-medium text-gray-500">Showing 1 to {Math.min(10, days.filter(d => {
                      if (statusFilter === "All") return true;
                      let label = "Present";
                      if (d.status === "A" || d.status === "L") label = "Absent";
                      if (d.status === "H") label = "Holidays";
                      if (d.status === "WO") label = "Weekend";
                      return label === statusFilter;
                    }).length)} of {days.filter(d => {
                      if (statusFilter === "All") return true;
                      let label = "Present";
                      if (d.status === "A" || d.status === "L") label = "Absent";
                      if (d.status === "H") label = "Holidays";
                      if (d.status === "WO") label = "Weekend";
                      return label === statusFilter;
                    }).length} entries</span>
                <button className="flex items-center gap-1.5 text-[#007AFF] text-[13px] font-bold hover:underline">
                  <Download className="h-4 w-4" /> Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[24px] p-6 min-h-[500px] flex flex-col gap-3">
      {filteredEmps.map(emp => {
        return (
          <div 
            key={emp.id} 
            onClick={() => setSelectedEmp(emp)}
            className="bg-white dark:bg-[#121217] rounded-[16px] px-5 py-4 flex items-center border border-[#F1F3F5] dark:border-[#2C2C35] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1C1C22] transition-colors"
          >
            {/* Avatar */}
            <div 
              className="h-11 w-11 rounded-full shrink-0 mr-4 flex items-center justify-center text-[15px] font-bold"
              style={{
                backgroundColor: getAvatarColor(emp.initials).bg,
                color: getAvatarColor(emp.initials).color
              }}
            >
              {emp.initials}
            </div>
            
            {/* Details */}
            <div className="flex-1">
              <p className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight">{emp.name}</p>
              <p className="text-[12px] text-gray-400 font-medium mt-0.5">{emp.role}</p>
            </div>
            
            {/* Action */}
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        );
      })}

      {filteredEmps.length === 0 && (
        <div className="py-12 text-center text-[13px] text-gray-400 font-medium">
          No employees found.
        </div>
      )}
    </div>
  );
}






/* ──────────────────────────────────────────────────────
   PAGE
─────────────────────────────────────────────────────── */
export default function LogsPage() {
  const [view, setView] = useState<View>("department");
  const [month, setMonth] = useState(2); // March (0-indexed)
  const [year] = useState(2026);
  const [search, setSearch] = useState("");
  const [totalEmployees, setTotalEmployees] = useState(EMPLOYEES.length);

  React.useEffect(() => {
    const fetchTotal = async () => {
      const supabase = createClient();
      const { count } = await supabase.from('employees').select('*', { count: 'exact', head: true });
      if (count !== null) setTotalEmployees(count);
    };
    fetchTotal();
  }, []);

  const VIEW_TABS: { id: View; label: string }[] = [
    { id: "department", label: "Department" },
    { id: "employee",   label: "Employees"  },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto page-scrollbar relative">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-8">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight">Log Histories</h1>
          <p className="text-[14px] text-gray-500 font-medium mt-1">
            Employee Attendance Management
          </p>
        </div>
        <div className="flex items-center gap-4">
          <HeaderSearchBar />
        </div>
      </header>

      <main className="flex-1 px-6 pb-8 flex flex-col gap-5">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mt-2 mb-2">
          {/* View tabs */}
          <div className="flex items-center bg-[#F4F5F7] dark:bg-[#1C1C1E] rounded-full p-1 gap-1 w-[260px]">
            {VIEW_TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`flex-1 flex items-center justify-center py-2 rounded-full text-[13px] font-bold transition-all duration-200 ${
                  view === id 
                    ? "bg-white dark:bg-[#121217] text-gray-900 dark:text-white shadow-sm" 
                    : "text-gray-500 dark:text-[#98989E] hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Employee"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-transparent rounded-full text-[13px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#007AFF] transition-colors"
              />
            </div>
            
            {/* Action Icons */}
            <button className="h-[36px] w-[36px] flex items-center justify-center hover:bg-[#F4F5F7] dark:hover:bg-[#1C1C22] rounded-full transition-colors">
              <SlidersHorizontal className="h-5 w-5 text-gray-900 dark:text-white" strokeWidth={1.5} />
            </button>
            <div className="w-px h-5 bg-gray-300 dark:bg-gray-700" />
            <button className="h-[36px] w-[36px] flex items-center justify-center hover:bg-[#F4F5F7] dark:hover:bg-[#1C1C22] rounded-full transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 dark:text-white">
                 <path d="M7 11V15M7 15L4 12M7 15L10 12M17 13V9M17 9L20 12M17 9L14 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4">
          {Object.entries(STATUS_LABEL).filter(([k]) => k !== "WO").map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[k as DayStatus]}`}>{k}</span>
              <span className="text-[11px] text-[#86868b] font-medium">{v}</span>
            </div>
          ))}
        </div>

        {/* View content */}
        {view === "company"    && <CompanyView month={month} year={year} totalEmployees={totalEmployees} />}
        {view === "department" && <DepartmentView month={month} year={year} />}
        {view === "employee"   && <EmployeeView search={search} />}

      </main>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, Filter, Eye, Pencil, MoreVertical, UserCheck, UserX, RefreshCw, MapPin, Clock, ExternalLink, Image as ImageIcon } from "lucide-react";
import HeaderSearchBar from "@/components/HeaderSearchBar";
import { createClient } from "@/utils/supabase/client";
import { getAvatarColor, getInitials as getAvatarInitials } from "@/utils/avatarColor";

export type AttendanceItem = {
  id: string; // employee id
  name: string;
  role: string;
  empId: string;
  location: string;
  locationUrl: string;
  proof: string;
  clockIn: string;
  clockOut: string;
  hours: string;
  status: string; // "Absent" | "Present"
  isLate: boolean; // true if clocked in after 09:00
  initials: string;
  color: string;
  bg: string;
  attendanceId: string | null;
  clockInTime: string | null;
};

type FilterType = "All" | "Absent" | "Present";

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

interface Props {
  initialData: AttendanceItem[];
  absentToday?: AttendanceItem[];
  todayDate: string;
  graceDeadline: string;
  shiftStart: string;
}

export default function AttendanceList({ initialData, absentToday: initialAbsent, todayDate, graceDeadline, shiftStart }: Props) {
  const [filter, setFilter] = useState<FilterType>("All");
  const [search, setSearch] = useState("");
  const [attendanceData, setAttendanceData] = useState<AttendanceItem[]>(initialData);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [proofModal, setProofModal] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const supabase = createClient();

  // Derive stats from current data
  const now = new Date();
  const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const istTimeHHMM = istDate.toISOString().split("T")[1].substring(0, 5);
  const graceElapsed = istTimeHHMM >= graceDeadline;

  // Only consider people absent if the grace period has elapsed.
  // (In the future, leaves will also be checked here.)
  const absentToday = graceElapsed ? attendanceData.filter(d => d.status === "Absent") : [];
  const presentToday = attendanceData.filter(d => d.status === "Present");
  const lateToday = attendanceData.filter(d => d.isLate);

  // Refresh attendance data from DB
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Fetch employees
      const { data: employees } = await supabase
        .from("employees")
        .select("id, name, role, emp_id, user_id");

      // Fetch today's attendance
      const { data: attendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", todayDate);

      if (!employees) return;

      // Build lookup by employee_id (which is actually auth user_id from Vertex)
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

        // Deterministic avatar — first-letter color system
        const avatar = getAvatarColor(fullName);
        const initials = getAvatarInitials(fullName);

        const status = att?.status === "present" ? "Present" : (att ? (att.status?.charAt(0).toUpperCase() + att.status?.slice(1)) : "Absent");
        // Late = Present and clocked in after 09:00
        const isLate = status === "Present" && !!att?.clock_in && att.clock_in > "09:00";

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
        };
      });

      updated.sort((a, b) => {
        if (a.status === "Present" && b.status !== "Present") return -1;
        if (a.status !== "Present" && b.status === "Present") return 1;
        // Both present: sort by clock_in_time descending (latest first)
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
  }, [supabase, todayDate]);

  // Subscribe to real-time attendance changes
  useEffect(() => {
    const channel = supabase
      .channel('attendance-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance', filter: `date=eq.${todayDate}` },
        () => {
          // When ANY attendance change happens for today, refresh the full list
          refreshData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, todayDate, refreshData]);

  // Optimistic toggle
  const toggleStatus = async (empId: string, currentStatus: string, attendanceId: string | null) => {
    const newStatus = currentStatus === "Present" ? "Absent" : "Present";
    
    // Update local state
    setAttendanceData((prev) => 
      prev.map(emp => emp.id === empId ? { ...emp, status: newStatus } : emp)
    );
    setOpenMenuId(null);
    
    // Update DB
    if (attendanceId) {
       await supabase.from("attendance").update({ status: newStatus.toLowerCase() }).eq("id", attendanceId);
    }
  };

  const toggleMenu = (id: string) =>
    setOpenMenuId((prev) => (prev === id ? null : id));

  const filtered = attendanceData.filter((e) => {
    const matchesFilter = filter === "All" || e.status === filter;
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Format clock-in time nicely
  const formatClockTime = (time: string) => {
    if (!time || time === "--") return "--";
    return time;
  };

  const calculateWorkingHours = (clockInTime: string | null) => {
    if (!clockInTime) return "--";
    const then = new Date(clockInTime);
    const diffMs = currentTime.getTime() - then.getTime();
    if (diffMs <= 0) return "0h 0m";
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return `${hrs}h ${mins}m`;
  };

  // Format the last update time
  const formatLastUpdate = () => {
    return lastUpdate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto page-scrollbar" onClick={() => setOpenMenuId(null)}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight">Attendance</h1>
          <p className="text-[14px] text-gray-500 font-medium mt-1">Track time and presence — Live from Vertex</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#34C759]/10 border border-[#34C759]/20 rounded-full">
              <div className="h-2 w-2 rounded-full bg-[#34C759] animate-pulse" />
              <span className="text-[11px] font-semibold text-[#248A3D]">LIVE</span>
            </div>
            {/* Manual refresh */}
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              title={isMounted ? `Last updated: ${formatLastUpdate()}` : "Refresh"}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={2} />
            </button>
          </div>
          <HeaderSearchBar />
        </div>
      </header>

      <main className="flex-1 px-6 pb-8 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Summary Cards */}
        <section className="bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[24px] p-6 px-8 flex items-center justify-between relative overflow-hidden min-h-[140px]">
          <div className="flex flex-col z-10">
            <span className="text-[13px] font-semibold text-gray-500 mb-1">Manage Your Employees Attendance</span>
            <h2 className="text-[22px] font-bold text-gray-900 dark:text-white mb-5">HR Department</h2>
            
            <div className="bg-white dark:bg-[#121217] rounded-[15px] px-6 py-3 flex items-center gap-6 w-fit border border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-400 tracking-wide">Total Employees</span>
                <span className="text-[18px] font-bold text-[#007AFF] dark:text-[#0A84FF]">{attendanceData.length}</span>
              </div>
              <div className="w-px h-5 bg-gray-200 dark:bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-400 tracking-wide">Total Present</span>
                <span className="text-[18px] font-bold text-[#34C759] dark:text-[#32D74B]">{presentToday.length}</span>
              </div>
              <div className="w-px h-5 bg-gray-200 dark:bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-400 tracking-wide">Total Absent</span>
                <span className="text-[18px] font-bold text-[#FF3B30] dark:text-[#FF453A]">{absentToday.length}</span>
              </div>
              <div className="w-px h-5 bg-gray-200 dark:bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-400 tracking-wide">Total Late</span>
                <span className="text-[18px] font-bold text-[#FF9500] dark:text-[#FF9F0A]">{lateToday.length}</span>
              </div>
            </div>
          </div>
          
          {/* Illustration */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/attendance_page.svg" alt="Attendance Illustration" className="absolute right-12 top-1/2 -translate-y-1/2 h-[160px] object-contain pointer-events-none" />
        </section>

        {/* Today Absents */}
        {absentToday.length > 0 && (
        <section>
          <h2 className="text-[16px] font-bold text-gray-900 dark:text-white mb-4">Today Absents</h2>
          <div className="bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[20px] p-4 flex items-center gap-4 overflow-x-auto">
            {absentToday.map((emp) => (
                <div
                  key={emp.id}
                  className="bg-white dark:bg-[#121217] border border-gray-100 dark:border-white/5 rounded-[15px] px-4 py-3 shrink-0 flex items-center gap-3 min-w-[200px]"
                >
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-[14px] shrink-0"
                    style={{ backgroundColor: emp.color, color: "#ffffff" }}
                  >
                    {emp.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight">
                      {emp.name}
                    </span>
                    <a href={`/employees/${emp.id}`} className="text-[12px] font-normal text-[#007AFF] hover:underline mt-0.5">
                      View Profile
                    </a>
                  </div>
                </div>
            ))}
          </div>
        </section>
        )}

        {/* Today's Attendance */}
        <section>
          <h2 className="text-[16px] font-bold text-gray-900 mb-4">Today&apos;s Attendance</h2>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5">
            <div className="relative w-full max-w-[260px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Employee"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-full text-[13px] font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--user-accent)] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {(["All", "Absent", "Present"] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-5 py-2 min-w-[70px] text-[13px] font-semibold rounded-full transition-colors ${
                      filter === f ? "bg-[var(--user-accent)] text-white shadow-sm" : "bg-[#F1F3F5] text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {f}
                    {f === "Present" && ` (${presentToday.length})`}
                    {f === "Absent" && ` (${absentToday.length})`}
                  </button>
                ))}
              </div>
              <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <SlidersHorizontal className="h-5 w-5" strokeWidth={2} />
              </button>
              <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[24px] p-6 min-h-[500px]">
            <div className="flex flex-col gap-3">
              {filtered.map((emp) => (
                <div
                  key={emp.id}
                  className={`relative bg-white dark:bg-[#121217] rounded-[24px] px-4 py-3.5 flex items-center border transition-[border-color] duration-200 will-change-[border-color] ${
                    emp.status === "Present" 
                      ? "border-[#34C759]/20 hover:border-[#34C759]/40" 
                      : "border-[#F1F3F5] dark:border-[#2C2C35]"
                  } ${openMenuId === emp.id ? "z-50" : "z-10"}`}
                >
                  {/* Avatar */}
                  <div 
                    className="h-[42px] w-[42px] rounded-full flex items-center justify-center shrink-0 mr-4 font-bold text-[15px] relative"
                    style={{ backgroundColor: emp.color, color: "#ffffff" }}
                  >
                    {emp.initials}
                    {/* Online dot for Present */}
                    {emp.status === "Present" && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#34C759] border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 flex justify-between items-center gap-1">

                    {/* Name + Role */}
                    <div className="w-[15%] flex flex-col gap-0.5">
                      <span className="text-[13px] font-semibold text-gray-900 tracking-[0.04em] truncate">{emp.name}</span>
                      <span className="text-[11px] font-medium text-gray-400 truncate">{emp.role}</span>
                    </div>

                    {/* Emp ID */}
                    <div className="w-[11%] flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-semibold text-gray-400 tracking-wider">Employee ID</span>
                      <span className="text-[12px] font-medium text-gray-900">{emp.empId}</span>
                    </div>

                    {/* Location */}
                    <div className="w-[12%] flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-semibold text-gray-400 tracking-wider">Location</span>
                      {emp.location !== "Unknown" ? (
                        <a
                          href={emp.locationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] font-semibold text-[var(--user-accent)] hover:underline truncate max-w-full text-center flex items-center gap-1"
                        >
                          <MapPin className="h-3 w-3 shrink-0" />
                          Map
                          <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-50" />
                        </a>
                      ) : (
                         <span className="text-[12px] font-medium text-gray-500">{"--"}</span>
                      )}
                    </div>

                    {/* Proof */}
                    <div className="w-[8%] flex flex-col items-center gap-1">
                      <span className="text-[10px] font-semibold text-gray-400 tracking-wider">Proof</span>
                      {emp.proof ? (
                        <button
                          onClick={() => setProofModal(emp.proof)}
                          className="text-[12px] font-semibold text-[var(--user-accent)] hover:underline flex items-center gap-1"
                        >
                          <ImageIcon className="h-3 w-3" />
                          View
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-medium">None</span>
                      )}
                    </div>

                    {/* Clock In */}
                    <div className="w-[10%] flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-semibold text-gray-400 tracking-wider">Clock In</span>
                      <span className={`text-[12px] font-medium flex items-center gap-1 ${emp.clockIn !== "--" ? "text-[#248A3D]" : "text-gray-900"}`}>
                        {emp.clockIn !== "--" && <Clock className="h-3 w-3" />}
                        {formatClockTime(emp.clockIn)}
                      </span>
                    </div>

                    {/* Clock Out */}
                    <div className="w-[10%] flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-semibold text-gray-400 tracking-wider">Clock Out</span>
                      <span className={`text-[12px] font-medium flex items-center gap-1 ${emp.clockOut !== "--" ? "text-[#C93400]" : (emp.status === "Present" ? "text-[#248A3D]" : "text-gray-900")}`}>
                        {emp.clockOut !== "--" ? <Clock className="h-3 w-3" /> : (emp.status === "Present" && <Clock className="h-3 w-3 animate-pulse" />)}
                        {emp.clockOut !== "--" ? formatClockTime(emp.clockOut) : (emp.status === "Present" ? "Active" : "--")}
                      </span>
                    </div>

                    {/* Hours */}
                    <div className="w-[8%] flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-semibold text-gray-400 tracking-wider">Hours</span>
                      <span className={`text-[12px] font-medium ${emp.status === "Present" && emp.hours === "--" ? "text-[#248A3D]" : "text-gray-900"}`}>
                        {emp.hours !== "--" ? emp.hours : (emp.status === "Present" ? (isMounted ? calculateWorkingHours(emp.clockInTime) : "--") : "--")}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="w-[9%] flex justify-center">
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full border shadow-sm ${
                        emp.status === "Present" 
                          ? "bg-[#34C759]/15 text-[#248A3D] border-[#34C759]/30" 
                          : "bg-[#FF3B30]/15 text-[#C93400] border-[#FF3B30]/30"
                      }`}>
                        {emp.status}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="w-[10%] flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-gray-400 tracking-wider">Actions</span>
                      <div className="flex items-center gap-1.5">

                        {/* Edit */}
                        <button
                          title="Edit"
                          className="p-1.5 rounded-lg bg-[#F1F3F5] text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>

                        {/* View */}
                        <a
                          href={`/employees/${emp.id}`}
                          title="View Profile"
                          className="p-1.5 rounded-lg bg-[#E5F1FF] text-[var(--user-accent)] hover:bg-[#cce4ff] transition-colors flex items-center justify-center"
                        >
                          <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                        </a>

                        {/* Three-dot menu */}
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            title="More options"
                            onClick={() => toggleMenu(emp.id)}
                            className="p-1.5 rounded-lg bg-[#F1F3F5] text-gray-500 hover:bg-gray-200 transition-colors"
                          >
                            <MoreVertical className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>

                          {openMenuId === emp.id && (
                            <div className="absolute right-0 top-full mt-1.5 w-[148px] bg-white rounded-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-[#F1F3F5] z-50 overflow-hidden">
                              {emp.status === "Absent" ? (
                                <button
                                  onClick={() => toggleStatus(emp.id, emp.status, emp.attendanceId)}
                                  className="w-full text-left px-4 py-3 text-[12px] font-semibold text-[#16A34A] hover:bg-[#E8FAF0] transition-colors"
                                >
                                  Mark as Present
                                </button>
                              ) : (
                                <button
                                  onClick={() => toggleStatus(emp.id, emp.status, emp.attendanceId)}
                                  className="w-full text-left px-4 py-3 text-[12px] font-semibold text-[#DC2626] hover:bg-[#FFF1F1] transition-colors"
                                >
                                  Mark as Absent
                                </button>
                              )}
                              <div className="h-px bg-[#F1F3F5]" />
                              <button className="w-full text-left px-4 py-3 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                                Edit Record
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-[14px] font-medium">
                  No employees found.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Proof Image Modal */}
      {proofModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setProofModal(null)}
        >
          <div className="bg-white rounded-[24px] p-4 shadow-2xl max-w-lg max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[14px] font-bold text-gray-900">Attendance Proof</span>
              <button onClick={() => setProofModal(null)} className="text-gray-400 hover:text-gray-600 text-[18px] font-bold">&times;</button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={proofModal} alt="Attendance proof" className="rounded-[16px] max-w-full max-h-[60vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

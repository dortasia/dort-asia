"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

/* ── types ──────────────────────────────────────────── */
interface DayBar {
  day: string;
  fill: number;    // 0-100 attendance %
  isWeekend: boolean;
}

interface ClockIn {
  name: string;
  initials: string;
  time: string;
}

interface HistoryRow {
  date: string;
  hours: string;
  clockIn: string;
  isToday: boolean;
}

type WeekAttendanceRow = { date: string; status: string };
type HistAttendanceRow = {
  date: string;
  clock_in_time?: string | null;
  clock_out_time?: string | null;
};

const GRAD = "linear-gradient(180deg, #007aff 0%, #004a9e 100%)";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n: number) { return String(n).padStart(2, "0"); }

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  return `${pad(h % 12 || 12)}:${pad(m)} ${ampm}`;
}

function fmtDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${pad(d.getDate())} ${d.toLocaleString("en-US", { month: "short" })} ${d.getFullYear()}`;
}

function calcHours(cin?: string | null, cout?: string | null): string {
  if (!cin || !cout) return "—";
  const h = (new Date(cout).getTime() - new Date(cin).getTime()) / 3_600_000;
  if (h <= 0) return "—";
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return mm > 0 ? `${hh}h ${mm}m` : `${hh}h`;
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
}

/* ─────────────────────────────────────────────────────── */
export default function HomeRow4() {
  const [chartData, setChartData]       = useState<DayBar[]>([]);
  const [clockIns, setClockIns]         = useState<ClockIn[]>([]);
  const [history, setHistory]           = useState<HistoryRow[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = new Date();
        // Monday of current week
        const dayOfWeek = today.getDay(); // 0=Sun
        const diffToMon = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMon);
        monday.setHours(0, 0, 0, 0);

        const weekStart = monday.toISOString().split("T")[0];
        const weekEnd   = new Date(monday.getTime() + 6 * 86_400_000).toISOString().split("T")[0];

        const [weekResult, recentResult, histResult, totalEmpResult] = await Promise.all([
          // Weekly attendance for bar chart (all employees)
          supabase
            .from("attendance")
            .select("date, status")
            .eq("company_id", user.id)
            .gte("date", weekStart)
            .lte("date", weekEnd),

          // Recent clock-ins today (all employees)
          supabase
            .from("attendance")
            .select("employee_name, clock_in_time, employees(name)")
            .eq("company_id", user.id)
            .eq("date", today.toISOString().split("T")[0])
            .not("clock_in_time", "is", null)
            .order("clock_in_time", { ascending: false })
            .limit(4),

          // Current user's last 4 clock-in records
          supabase
            .from("attendance")
            .select("date, clock_in_time, clock_out_time")
            .eq("employee_id", user.id)
            .order("date", { ascending: false })
            .limit(4),

          // Total employee count for attendance %
          supabase
            .from("employees")
            .select("id", { count: "exact", head: true })
            .eq("company_id", user.id),
        ]);

        const totalEmp = Math.max(totalEmpResult.count ?? 1, 1);

        // ── Bar chart: group by date ──
        const weekRows = weekResult.data ?? [];
        const dayBars: DayBar[] = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(monday.getTime() + i * 86_400_000);
          const iso = d.toISOString().split("T")[0];
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          const presentCount = (weekRows as WeekAttendanceRow[]).filter(
            (r: WeekAttendanceRow) => r.date === iso && r.status === "present"
          ).length;
          const fill = isWeekend ? 0 : Math.round((presentCount / totalEmp) * 100);
          return { day: DAY_NAMES[d.getDay()], fill, isWeekend };
        });
        setChartData(dayBars);

        // ── Recent clock-ins ──
        const recentRows = recentResult.data ?? [];
        const parsed: ClockIn[] = recentRows.map((r: any) => {
          const name = r.employees?.name ?? r.employee_name ?? "Unknown";
          return {
            name,
            initials: getInitials(name),
            time: r.clock_in_time ? fmtTime(r.clock_in_time) : "—",
          };
        });
        setClockIns(parsed);

        // ── Clock-in history ──
        const histRows = histResult.data ?? [];
        const todayISO = today.toISOString().split("T")[0];
        const parsedHist: HistoryRow[] = (histRows as HistAttendanceRow[]).map((r: HistAttendanceRow) => ({
          date: fmtDateLabel(r.date),
          hours: calcHours(r.clock_in_time, r.clock_out_time),
          clockIn: r.clock_in_time ? fmtTime(r.clock_in_time) : "—",
          isToday: r.date === todayISO,
        }));
        setHistory(parsedHist);

      } catch (err) {
        console.error("HomeRow4 fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Skeleton bars while loading
  const bars = loading
    ? Array.from({ length: 7 }, (_, i) => ({ day: DAY_NAMES[(i + 1) % 7], fill: 30 + i * 7, isWeekend: i >= 5 }))
    : chartData;

  return (
    <div className="home-row-4">
      {/* ─── Weekly Attendance Bar Chart ─── */}
      <div className="home-chart-card">
        <div className="home-chart-card__header" style={{ marginBottom: "16px" }}>
          <span className="home-chart-card__title">Weekly Attendance Report</span>
          <ChevronRight size={14} strokeWidth={2.5} />
        </div>
        <div className="home-chart-layout">
          <div className="home-chart-y">
            <span>100 %</span>
            <span>80 %</span>
            <span>60 %</span>
            <span>40 %</span>
            <span>20 %</span>
          </div>
          <div className="home-chart-main">
            <div className="home-chart-white-box">
              {bars.map((d, i) => (
                <div key={i} className="home-chart-bar-wrap" title={`${d.day}: ${d.fill}% attendance`}>
                  <div
                    className="home-chart-bar transition-all duration-500"
                    style={{
                      height: `${d.fill}%`,
                      background: d.isWeekend ? "#f4f5f9" : GRAD,
                      opacity: loading ? 0.4 : 1,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="home-chart-x">
              {bars.map((d, i) => <span key={i}>{d.day}</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Recent Clock-ins ─── */}
      <div className="home-recent-card">
        <div className="home-recent-card__header">
          <span className="home-recent-card__title">Recent Clock ins</span>
          <ChevronRight size={14} strokeWidth={2.5} />
        </div>
        <div className="home-recent-card__list">
          {loading ? (
            [0,1,2,3].map(i => (
              <div key={i} className="home-recent-card__item animate-pulse">
                <div className="home-recent-card__user">
                  <div className="home-recent-card__avatar bg-gray-200" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            ))
          ) : clockIns.length === 0 ? (
            <p className="text-[12px] text-gray-400 font-medium px-1 py-2">No clock-ins today yet.</p>
          ) : (
            clockIns.map((clk, i) => (
              <div key={i} className="home-recent-card__item">
                <div className="home-recent-card__user">
                  <div
                    className="home-recent-card__avatar flex items-center justify-center text-[10px] font-bold"
                    style={{ background: "#E5F1FF", color: "#007AFF" }}
                  >
                    {clk.initials}
                  </div>
                  <span className="home-recent-card__name">{clk.name}</span>
                </div>
                <div className="home-recent-card__status">
                  <span className="home-recent-card__clocked-in">Clocked In</span>
                  <span className="home-recent-card__time">{clk.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Your Clock-in History ─── */}
      <div className="home-history-card">
        <div className="home-history-card__header">
          <span className="home-history-card__title">Your Clock in History</span>
          <ChevronRight size={14} strokeWidth={2.5} />
        </div>
        <div className="home-history-card__list">
          {loading ? (
            [0,1,2,3].map(i => (
              <div key={i} className="home-history-card__item animate-pulse">
                <div className="h-3 w-20 bg-gray-200 rounded" />
                <div className="h-3 w-12 bg-gray-100 rounded" />
              </div>
            ))
          ) : history.length === 0 ? (
            <p className="text-[12px] text-gray-400 font-medium px-1 py-2">No attendance records found.</p>
          ) : (
            history.map((h, i) => (
              <div key={i} className="home-history-card__item">
                <span className="home-history-card__date">{h.date}</span>
                <span className="home-history-card__hours">{h.hours}</span>
                <span
                  className="home-history-card__hist-time"
                  style={{ color: h.isToday ? "#3b82f6" : "#22c55e" }}
                >
                  {h.clockIn}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

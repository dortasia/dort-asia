"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Receipt,
  LayoutGrid,
  ArrowUpRight,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import HeaderSearchBar from "@/components/HeaderSearchBar";
import AttendanceHeatmap from "@/components/AttendanceHeatmap";

/* ─── Tiny SVG Charts (no deps) ─────────────────────── */

// Sparkline — draws a smooth polyline from data[]
function Sparkline({
  data,
  color,
  height = 40,
}: {
  data: number[];
  color: string;
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${x},${y}`;
  });
  const d = `M ${pts.join(" L ")}`;
  const fillPts = [
    `0,${h}`,
    ...pts,
    `${w},${h}`,
  ];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={fillPts.join(" ")}
        fill={`url(#sg-${color.replace("#", "")})`}
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Bar chart
function BarChart({
  data,
  color,
  labels,
}: {
  data: number[];
  color: string;
  labels?: string[];
}) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-[5px] w-full h-full">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-[6px] transition-all"
            style={{
              height: `${(v / max) * 100}%`,
              background: color,
              opacity: i === data.length - 1 ? 1 : 0.45,
              minHeight: 4,
            }}
          />
          {labels && (
            <span className="text-[9px] text-[#86868b] font-medium">{labels[i]}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// Donut
function Donut({
  segments,
}: {
  segments: { value: number; color: string; label: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 40;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="w-[90px] h-[90px] shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F3F5" strokeWidth="14" />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = circumference * pct;
          const gap = circumference - dash;
          const offset = circumference * (1 - cumulative);
          cumulative += pct;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
            />
          );
        })}
        <text x="50" y="54" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1d1d1f">
          {total}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
            <span className="text-[11px] text-[#86868b] font-medium">{seg.label}</span>
            <span className="text-[11px] font-bold text-[#1d1d1f] ml-auto">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main area chart (hero) ─────────────────────────── */
function HeroChart() {
  const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const present = [42, 45, 39, 50, 48, 44, 52, 49, 53];
  const absent  = [8,  5,  11, 6,  9,  13, 5,  8,  4 ];

  const maxV = 60;
  const h = 160;

  const toY = (v: number) => h - (v / maxV) * (h - 20) - 10;

  const makePolyPoints = (data: number[]) =>
    data.map((v, i) => `${(i / (data.length - 1)) * 100},${toY(v)}`).join(" L ");

  const makeArea = (data: number[]) => {
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${toY(v)}`);
    return [`0,${h}`, ...pts, `100,${h}`].join(" ");
  };

  return (
    <div className="w-full">
      <svg viewBox={`0 0 100 ${h}`} className="w-full" style={{ height: 160 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="hero-present" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--user-accent)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--user-accent)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hero-absent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF3B30" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FF3B30" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line
            key={p}
            x1="0" y1={10 + p * (h - 20)} x2="100" y2={10 + p * (h - 20)}
            stroke="#F1F3F5" strokeWidth="0.5"
          />
        ))}
        {/* Absent area */}
        <polygon points={makeArea(absent)} fill="url(#hero-absent)" />
        <polyline points={makePolyPoints(absent)} fill="none" stroke="#FF3B30" strokeWidth="1.2" strokeLinejoin="round" />
        {/* Present area */}
        <polygon points={makeArea(present)} fill="url(#hero-present)" />
        <polyline points={makePolyPoints(present)} fill="none" stroke="var(--user-accent)" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      {/* X labels */}
      <div className="flex justify-between px-0 mt-2">
        {months.map((m) => (
          <span key={m} className="text-[10px] text-[#86868b] font-medium">{m}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Widget helpers ─────────────────────────────────── */
function StatChip({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: bg }}>
        <Icon className="h-5 w-5" style={{ color }} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-[#86868b] font-semibold">{label}</p>
        <p className="text-[18px] font-bold text-[#1d1d1f] leading-tight">{value}</p>
      </div>
      <div className={`flex items-center gap-0.5 text-[11px] font-bold ${trendUp ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
        {trendUp ? <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} /> : <TrendingDown className="h-3.5 w-3.5" strokeWidth={2} />}
        {trend}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [range, setRange] = useState<"Week" | "Month" | "Quarter" | "Year">("Month");
  const [totalEmployees, setTotalEmployees] = useState<number>(57);
  
  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count } = await supabase.from('employees').select('*', { count: 'exact', head: true }).eq('company_id', user.id);
        if (count !== null) setTotalEmployees(count);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto page-scrollbar">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-8">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight">Analytics</h1>
          <p className="text-[14px] text-gray-500 font-medium tracking-wide mt-1">
            Workspace traffic & insights
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Range picker */}
          <div className="flex items-center bg-[#F1F3F5] rounded-full p-1 gap-0.5">
            {(["Week", "Month", "Quarter", "Year"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
                  range === r ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#86868b] hover:text-[#1d1d1f]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <HeaderSearchBar />
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-6 pb-8">

        {/* ── HERO CHART (edge-to-edge) ── */}
        <div className="mx-6 bg-white rounded-[24px] border border-[#F1F3F5] shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-bold text-[#1d1d1f]">Attendance Overview</h2>
              <p className="text-[12px] text-[#86868b] mt-0.5">Present vs Absent — last 9 months</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[var(--user-accent)]" />
                <span className="text-[11px] text-[#86868b] font-semibold">Present</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#FF3B30]" />
                <span className="text-[11px] text-[#86868b] font-semibold">Absent</span>
              </div>
            </div>
          </div>
          <HeroChart />
        </div>

        {/* ── MASONRY WIDGET GRID (Pinterest-style) ── */}
        <div className="px-6" style={{ columns: "3", columnGap: "20px" }}>

          {/* Widget 1 — Key Stats (tall) */}
          <div className="bg-white rounded-[24px] border border-[#F1F3F5] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 mb-5 break-inside-avoid">
            <h3 className="text-[14px] font-bold text-[#1d1d1f] mb-4">Key Stats</h3>
            <div className="flex flex-col gap-4">
              <StatChip icon={Users}      label="Total Employees" value={totalEmployees.toString()}  trend="+3"   trendUp={true}  color="var(--user-accent)" bg="#007AFF40" />
              <StatChip icon={UserCheck}  label="Present Today"   value="49"  trend="+5%"  trendUp={true}  color="#16A34A" bg="#34C75940" />
              <StatChip icon={UserX}      label="Absent Today"    value="8"   trend="-2"   trendUp={true}  color="#DC2626" bg="#DC262640" />
              <StatChip icon={Clock}      label="Avg Hours/Day"   value="8.4" trend="+0.3" trendUp={true}  color="#5856D6" bg="#5856D640" />
              <StatChip icon={CalendarDays} label="Leaves This Month" value="12" trend="+4" trendUp={false} color="#FF9500" bg="#FF950040" />
            </div>
          </div>

          {/* Widget 2 — Dept Distribution donut */}
          <div className="bg-white rounded-[24px] border border-[#F1F3F5] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 mb-5 break-inside-avoid">
            <h3 className="text-[14px] font-bold text-[#1d1d1f] mb-4">Dept Distribution</h3>
            <Donut
              segments={[
                { value: 14, color: "var(--user-accent)", label: "Engineering" },
                { value: 9,  color: "#34C759", label: "Operations"  },
                { value: 8,  color: "#FF9500", label: "Marketing"   },
                { value: 7,  color: "#5856D6", label: "Finance"     },
                { value: 6,  color: "#00C7BE", label: "Design"      },
                { value: 5,  color: "#FF2D55", label: "HR"          },
              ]}
            />
          </div>

          {/* Widget 3 — Weekly Attendance bar */}
          <div className="bg-white rounded-[24px] border border-[#F1F3F5] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 mb-5 break-inside-avoid">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-[#1d1d1f]">This Week</h3>
              <span className="text-[11px] text-[var(--user-accent)] font-semibold">Attendance</span>
            </div>
            <div style={{ height: 80 }}>
              <BarChart
                data={[46, 50, 48, 52, 49]}
                labels={["Mon", "Tue", "Wed", "Thu", "Fri"]}
                color="var(--user-accent)"
              />
            </div>
          </div>

          {/* Widget 4 — Leave types sparkline */}
          <div className="bg-white rounded-[24px] border border-[#F1F3F5] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 mb-5 break-inside-avoid">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="text-[14px] font-bold text-[#1d1d1f]">Leave Trend</h3>
                <p className="text-[11px] text-[#86868b]">Requests over 9 months</p>
              </div>
              <span className="text-[18px] font-bold text-[#FF9500]">38</span>
            </div>
            <Sparkline data={[3, 5, 2, 7, 6, 4, 8, 5, 3]} color="#FF9500" height={50} />
          </div>

          {/* Widget 5 — Claim summary */}
          <div className="bg-white rounded-[24px] border border-[#F1F3F5] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 mb-5 break-inside-avoid">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-bold text-[#1d1d1f]">Claims</h3>
              <Receipt className="h-4 w-4 text-[#34C759]" strokeWidth={2} />
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: "Travel",    amount: "₹24,500", pct: 72, color: "var(--user-accent)" },
                { label: "Meals",     amount: "₹8,200",  pct: 42, color: "#34C759" },
                { label: "Equipment", amount: "₹18,000", pct: 58, color: "#5856D6" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] font-semibold text-[#1d1d1f]">{item.label}</span>
                    <span className="text-[11px] font-bold text-[#1d1d1f]">{item.amount}</span>
                  </div>
                  <div className="h-1.5 bg-[#F1F3F5] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 6 — Overtime bar */}
          <div className="bg-white rounded-[24px] border border-[#F1F3F5] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 mb-5 break-inside-avoid">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-[#1d1d1f]">Overtime Hours</h3>
              <span className="text-[11px] text-[#5856D6] font-semibold">This month</span>
            </div>
            <div style={{ height: 80 }}>
              <BarChart
                data={[12, 8, 20, 5, 15, 18, 9]}
                labels={["W1", "W2", "W3", "W4", "W5", "W6", "W7"]}
                color="#5856D6"
              />
            </div>
          </div>

          {/* Widget 7 — Approvals summary (short) */}
          <div className="bg-white rounded-[24px] border border-[#F1F3F5] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 mb-5 break-inside-avoid">
            <h3 className="text-[14px] font-bold text-[#1d1d1f] mb-3">Approvals This Month</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Approved", value: 18, color: "#16A34A", bg: "#34C75940" },
                { label: "Rejected", value: 4,  color: "#DC2626", bg: "#DC262640" },
                { label: "Pending",  value: 4,  color: "#FF9500", bg: "#FF950040" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center py-2 rounded-[14px]" style={{ background: s.bg }}>
                  <span className="text-[20px] font-bold" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-[10px] font-semibold" style={{ color: s.color }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 8 — New hires sparkline */}
          <div className="bg-white rounded-[24px] border border-[#F1F3F5] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 mb-5 break-inside-avoid">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="text-[14px] font-bold text-[#1d1d1f]">New Hires</h3>
                <p className="text-[11px] text-[#86868b]">Last 9 months</p>
              </div>
              <div className="flex items-center gap-1 text-[#16A34A]">
                <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
                <span className="text-[13px] font-bold">+12%</span>
              </div>
            </div>
            <Sparkline data={[2, 3, 1, 5, 4, 6, 3, 7, 4]} color="#34C759" height={50} />
          </div>

          {/* Widget 9 — Dept headcount list */}
          <div className="bg-white rounded-[24px] border border-[#F1F3F5] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 mb-5 break-inside-avoid">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-bold text-[#1d1d1f]">Headcount</h3>
              <LayoutGrid className="h-4 w-4 text-[var(--user-accent)]" strokeWidth={2} />
            </div>
            {[
              { dept: "Engineering", count: 14, color: "var(--user-accent)" },
              { dept: "Operations",  count: 9,  color: "#00C7BE" },
              { dept: "Marketing",   count: 8,  color: "#FF9500" },
              { dept: "Finance",     count: 7,  color: "#5856D6" },
              { dept: "Design",      count: 6,  color: "#34C759" },
              { dept: "HR",          count: 5,  color: "#FF2D55" },
            ].map((d) => (
              <div key={d.dept} className="flex items-center gap-2 mb-2 last:mb-0">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-[12px] text-[#1d1d1f] font-medium flex-1">{d.dept}</span>
                <span className="text-[12px] font-bold text-[#1d1d1f]">{d.count}</span>
                <div className="w-[80px] h-1.5 bg-[#F1F3F5] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(d.count / 14) * 100}%`, background: d.color }} />
                </div>
              </div>
            ))}
          </div>

        </div>

        <AttendanceHeatmap role="superadmin" />
      </main>
    </div>
  );
}

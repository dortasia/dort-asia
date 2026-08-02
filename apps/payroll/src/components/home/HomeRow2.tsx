"use client";

import React, { useEffect, useState, useRef } from "react";
import { ChevronRight, Users, Building2, HardDrive } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface HomeRow2Props {
  onOpenLeave?: () => void;
  onOpenClaims?: () => void;
}

interface Stats {
  employeeCount: number;
  employeeLimit: number;
  deptCount: number;
  storageUsedGB: number;
}

interface DayData {
  date: Date;
  label: string;    // e.g. "Mon 28"
  hours: number;    // decimal hours worked
  display: string;  // e.g. "7h 30m"
}

/* ── helpers ─────────────────────────────────────────── */
function hoursFromRow(row: { clock_in_time?: string | null; clock_out_time?: string | null }): number {
  if (!row.clock_in_time || !row.clock_out_time) return 0;
  const diff = (new Date(row.clock_out_time).getTime() - new Date(row.clock_in_time).getTime()) / 3_600_000;
  return Math.max(0, diff);
}

function fmtHours(h: number): string {
  if (h === 0) return "No data";
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return mm > 0 ? `${hh}h ${mm}m` : `${hh}h`;
}

function buildWeekDays(): DayData[] {
  const days: DayData[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      date: d,
      label: `${dayNames[d.getDay()]} ${d.getDate()}`,
      hours: 0,
      display: "No data",
    });
  }
  return days;
}

/* ── Interactive Sparkline ───────────────────────────── */
function Sparkline({ days }: { days: DayData[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 100;
  const H = 40;
  const PAD = 4;

  const values = days.map((d) => d.hours);
  const maxVal = Math.max(...values, 1); // at least 1 to avoid div/0

  // Map each day to an SVG point
  const points = days.map((d, i) => {
    const x = PAD + (i / (days.length - 1)) * (W - PAD * 2);
    const y = H - PAD - (d.hours / maxVal) * (H - PAD * 2);
    return { x, y };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Tooltip positioning — flip if near right edge
  const tooltipForIndex = (i: number) => {
    const p = points[i];
    const flipX = i >= days.length - 2;
    return { cx: p.x, cy: p.y, flipX };
  };

  return (
    <div className="relative w-full h-full" style={{ minWidth: 80 }}>
      <svg
        ref={svgRef}
        className="home-screentime-card__chart"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible", cursor: "crosshair" }}
      >
        {/* Line */}
        <polyline
          points={polyline}
          stroke="#007AFF"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
        />

        {/* Hit targets + dots */}
        {points.map((p, i) => (
          <g key={i}>
            {/* Invisible wide hit area */}
            <rect
              x={p.x - 8}
              y={0}
              width={16}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
            {/* Dot — only visible on hover */}
            {hovered === i && (
              <>
                <circle cx={p.x} cy={p.y} r={3.5} fill="#007AFF" />
                <circle cx={p.x} cy={p.y} r={6} fill="#007AFF" fillOpacity={0.15} />
              </>
            )}
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {hovered !== null && (() => {
        const d = days[hovered];
        const { cx, flipX } = tooltipForIndex(hovered);
        // Convert SVG x% to CSS %
        const leftPct = ((cx / W) * 100).toFixed(1);
        return (
          <div
            className="pointer-events-none absolute z-50 bottom-full mb-2 px-2.5 py-1.5 rounded-[8px] shadow-lg text-white"
            style={{
              background: "#1d1d1f",
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: "nowrap",
              left: `${leftPct}%`,
              transform: flipX ? "translateX(-90%)" : "translateX(-10%)",
              lineHeight: 1.5,
            }}
          >
            <div style={{ color: "#A1A1A6", fontWeight: 500 }}>{d.label}</div>
            <div>{d.display}</div>
          </div>
        );
      })()}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────── */
export default function HomeRow2({ onOpenLeave, onOpenClaims }: HomeRow2Props) {
  const [stats, setStats] = useState<Stats>({
    employeeCount: 0,
    employeeLimit: 50,
    deptCount: 0,
    storageUsedGB: 0,
  });
  const [weekDays, setWeekDays] = useState<DayData[]>(buildWeekDays());

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Build date range for the last 7 days
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 6);
        const fromDate = weekAgo.toISOString().split("T")[0];

        // Run all queries in parallel
        const [empResult, deptResult, compResult, attendResult] = await Promise.all([
          supabase.from("employees").select("id", { count: "exact", head: true }).eq("company_id", user.id),
          supabase.from("departments").select("id", { count: "exact", head: true }).eq("company_id", user.id),
          supabase.from("company_settings").select("storage_used_gb, seat_limit").eq("company_id", user.id).maybeSingle(),
          supabase.from("attendance")
            .select("date, clock_in_time, clock_out_time")
            .eq("employee_id", user.id)
            .gte("date", fromDate)
            .order("date"),
        ]);

        // Stats
        setStats({
          employeeCount: empResult.count ?? 0,
          employeeLimit: compResult.data?.seat_limit ?? 50,
          deptCount: deptResult.count ?? 0,
          storageUsedGB: compResult.data?.storage_used_gb ?? 0,
        });

        // Screen time — map attendance rows onto the 7-day slots
        const days = buildWeekDays();
        if (attendResult.data) {
          for (const row of attendResult.data) {
            const rowDate = row.date; // "YYYY-MM-DD"
            const slot = days.find(
              (d) => d.date.toISOString().split("T")[0] === rowDate
            );
            if (slot) {
              const h = hoursFromRow(row);
              slot.hours += h;
              slot.display = fmtHours(slot.hours);
            }
          }
        }
        setWeekDays([...days]);
      } catch (err) {
        console.error("HomeRow2 fetch error:", err);
      }
    };

    fetchAll();
  }, []);

  const storageDisplay = stats.storageUsedGB >= 1
    ? stats.storageUsedGB.toFixed(1)
    : (stats.storageUsedGB * 1024).toFixed(0);
  const storageUnit = stats.storageUsedGB >= 1 ? "GB" : "MB";

  return (
    <div className="home-row-2">
      {/* ─── Claims card ─── */}
      <div className="home-mini-card cursor-pointer" onClick={onOpenClaims}>
        <div className="home-mini-card__header">
          <span className="home-mini-card__title">Claims</span>
          <ChevronRight size={14} strokeWidth={2.5} className="home-mini-card__chevron" />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/Icons/Claims.svg" alt="Claims" className="home-mini-card__icon" />
      </div>

      {/* ─── Leave card ─── */}
      <div className="home-mini-card cursor-pointer" onClick={onOpenLeave}>
        <div className="home-mini-card__header">
          <span className="home-mini-card__title">Leave</span>
          <ChevronRight size={14} strokeWidth={2.5} className="home-mini-card__chevron" />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/Holiday 1.svg" alt="Leave" className="home-mini-card__icon" />
      </div>

      {/* ─── Total Employees ─── */}
      <div className="home-stat-card">
        <div className="home-stat-card__icon">
          <Users size={20} strokeWidth={2} />
        </div>
        <div className="home-stat-card__content">
          <span className="home-stat-card__label">Total Employees</span>
          <div className="home-stat-card__value-row">
            <span className="home-stat-card__number">{stats.employeeCount}</span>
            <span className="home-stat-card__sub">out of <strong>{stats.employeeLimit}</strong></span>
          </div>
        </div>
      </div>

      {/* ─── Total Department ─── */}
      <div className="home-stat-card">
        <div className="home-stat-card__icon">
          <Building2 size={20} strokeWidth={2} />
        </div>
        <div className="home-stat-card__content">
          <span className="home-stat-card__label">Total Department</span>
          <div className="home-stat-card__value-row">
            <span className="home-stat-card__number">{stats.deptCount}</span>
            <span className="home-stat-card__sub">Departments</span>
          </div>
        </div>
      </div>

      {/* ─── Your Storage ─── */}
      <div className="home-stat-card">
        <div className="home-stat-card__icon">
          <HardDrive size={20} strokeWidth={2} />
        </div>
        <div className="home-stat-card__content">
          <span className="home-stat-card__label">Your Storage</span>
          <div className="home-stat-card__value-row">
            <span className="home-stat-card__number">{storageDisplay}</span>
            <span className="home-stat-card__sub">{storageUnit} <strong>Used</strong></span>
          </div>
        </div>
      </div>

      {/* ─── Screen Time ─── */}
      <div className="home-screentime-card" style={{ overflow: "visible" }}>
        <div className="home-screentime-card__text">
          <span className="home-screentime-card__title">Screen Time</span>
          <span className="home-screentime-card__sub">Weekly Report</span>
        </div>
        <Sparkline days={weekDays} />
      </div>
    </div>
  );
}

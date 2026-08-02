"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";

interface DayData {
  date: Date;
  intensity: number;
}

// Light vs dark empty-cell colour — read from html.dark class
function getColors() {
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  return isDark
    ? ["#2A2A31", "#1a4731", "#40c463", "#30a14e", "#216e39"]
    : ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const GAP = 3;

function buildDates(today: Date): Date[] {
  // Start from the Sunday of the week that was 52 weeks ago
  const start = new Date(today);
  start.setDate(start.getDate() - 364); // 52 weeks back
  // Rewind to the previous Sunday so the grid aligns cleanly
  start.setDate(start.getDate() - start.getDay());

  const dates: Date[] = [];
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
}

function computeIntensities(dates: Date[], today: Date): number[] {
  return dates.map(date => {
    const isPast = date <= today;
    if (!isPast) return 0;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    return isWeekend
      ? Math.random() > 0.8 ? (Math.random() > 0.5 ? 2 : 1) : 0
      : Math.floor(Math.random() * 5);
  });
}

export default function AttendanceHeatmap({ role = "admin" }: { role?: "admin" | "superadmin" }) {
  const [COLORS, setCOLORS] = useState(() => ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"]);
  const [intensities, setIntensities] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(900);

  const today = useMemo(() => new Date(), []);
  // Rolling 52-week dates — stable (no random), keyed only on today
  const dates = useMemo(() => buildDates(today), [today]);

  useEffect(() => {
    // 1) Set correct colors based on dark mode class on mount/client-side only
    setCOLORS(getColors());
    
    // 2) Compute intensities on mount/client-side only to avoid SSR mismatch with Math.random()
    setIntensities(computeIntensities(dates, today));
  }, [dates, today]);

  const days: DayData[] = useMemo(
    () => dates.map((date, i) => ({ date, intensity: intensities[i] ?? 0 })),
    [dates, intensities]
  );

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const { paddedDays, columns, monthPositions } = useMemo(() => {
    // dates start on a Sunday, so firstDow = 0, no prefix padding needed
    const firstDow = days[0]?.date.getDay() ?? 0;
    const padded: (DayData | null)[] = Array.from({ length: firstDow }, () => null);
    padded.push(...days);
    while (padded.length % 7 !== 0) padded.push(null);

    const cols: (DayData | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) cols.push(padded.slice(i, i + 7));

    // Month positions — one label per unique month, at its first column
    const seen = new Set<number>();
    const mPos: { month: string; col: number }[] = [];
    cols.forEach((col, ci) => {
      col.forEach(day => {
        if (day) {
          const m = day.date.getMonth();
          if (!seen.has(m)) { seen.add(m); mPos.push({ month: MONTH_LABELS[m], col: ci }); }
        }
      });
    });

    return { paddedDays: padded, columns: cols, monthPositions: mPos };
  }, [days]);

  const totalCols = columns.length;

  const dayLabelWidth = 28;

  // Compute cell size so the grid fills the container exactly
  const cellSize = Math.max(
    10,
    Math.floor((containerWidth - dayLabelWidth - GAP * (totalCols - 1)) / totalCols)
  );
  const step = cellSize + GAP;
  const gridWidth = totalCols * step - GAP;
  const gridHeight = 7 * step - GAP;

  return (
    <div className="bg-white rounded-[24px] px-6 pt-4 pb-5 mb-10 border border-[#F3F4F6] shadow-sm w-full">
      <div ref={containerRef} className="w-full">
        <div className="flex items-start">
          {/* Y-axis day labels */}
          <div
            className="flex flex-col shrink-0 text-[11px] text-gray-400 font-medium select-none"
            style={{ marginTop: 24, gap: GAP, width: dayLabelWidth }}
          >
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((label, i) => (
              <div
                key={label}
                style={{ height: cellSize, lineHeight: `${cellSize}px` }}
                className={i % 2 === 0 ? "text-transparent" : ""}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Month header + SVG grid */}
          <div className="flex flex-col flex-1">
            {/* Month labels — centered over each month span */}
            <div className="relative h-[22px]" style={{ width: gridWidth }}>
              {monthPositions.map(({ month, col }, idx) => {
                const nextCol = monthPositions[idx + 1]?.col ?? totalCols;
                const cx = ((col + nextCol) / 2) * step - GAP / 2;
                return (
                  <span
                    key={month}
                    className="absolute text-[11px] text-gray-400 font-medium"
                    style={{ left: cx, transform: "translateX(-50%)" }}
                  >
                    {month}
                  </span>
                );
              })}
            </div>

            {/* SVG Grid — no today line since today is on the right edge */}
            <svg width={gridWidth} height={gridHeight} style={{ overflow: "visible" }}>

              {/* Day cells */}
              {paddedDays.map((day, i) => {
                const c = Math.floor(i / 7);
                const r = i % 7;
                const x = c * step;
                const y = r * step;
                if (!day) return (
                  <rect key={i} x={x} y={y} width={cellSize} height={cellSize} rx={Math.max(2, cellSize / 5)} fill={COLORS[0]} />
                );
                return (
                  <rect
                    key={i}
                    x={x} y={y}
                    width={cellSize} height={cellSize}
                    rx={Math.max(2, cellSize / 5)}
                    fill={COLORS[day.intensity]}
                    className="cursor-pointer hover:opacity-75 transition-opacity"
                  >
                    <title>{`${day.intensity} clock-ins — ${day.date.toDateString()}`}</title>
                  </rect>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="flex items-center justify-end mt-3 gap-1 text-[11px] text-gray-400 font-medium">
              <span className="mr-1">Less</span>
              {COLORS.map(c => (
                <div key={c} style={{ width: cellSize, height: cellSize, backgroundColor: c, borderRadius: Math.max(2, cellSize / 5) }} />
              ))}
              <span className="ml-1">More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

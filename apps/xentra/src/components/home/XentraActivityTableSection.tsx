"use client";

import React, { useState } from "react";
import { StreamlineAttendance } from "@/components/StreamlineIcons";

export default function XentraActivityTableSection() {
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const pendingRequests: {
    employee: string;
    requestType: string;
    detail: string;
    appliedDate: string;
    approvalFrom: string;
  }[] = [];

  const topPerformers = [
    { rank: 1, name: "KrishnaKumar", role: "Senior HR", hours: "38hrs" },
    { rank: 2, name: "Sarah Jenkins", role: "UI Designer", hours: "36hrs" },
    { rank: 3, name: "Alex Tan", role: "Frontend Lead", hours: "35hrs" },
    { rank: 4, name: "Michael Chen", role: "Backend Dev", hours: "32hrs" },
    { rank: 5, name: "Emily Wong", role: "Product Manager", hours: "30hrs" },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 my-4 font-sf items-stretch">
      {/* Left Column: Pending Requests Table */}
      <div className="flex-1 bg-white dark:bg-[#1C1C22] rounded-[25px] border border-[#E5E7EB] dark:border-white/10 min-h-[360px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
        {/* Table Header Bar */}
        <div className="bg-[#F8FAFC] dark:bg-white/5 border-b border-[#E5E7EB] dark:border-white/10 px-8 py-4 flex items-center text-[14px] font-semibold text-[#374151] dark:text-gray-300">
          <div className="w-[20%]">Employee</div>
          <div className="w-[20%]">Request type</div>
          <div className="w-[20%]">Detail</div>
          <div className="w-[20%]">Applied date</div>
          <div className="w-[20%]">Approval From</div>
        </div>

        {/* Table Content Body */}
        {pendingRequests.length === 0 ? (
          <div className="flex-1 bg-white dark:bg-[#1C1C22] p-8 flex items-center justify-center text-[#9CA3AF] dark:text-gray-500 text-[14px] font-medium">
            No pending requests
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {pendingRequests.map((req, idx) => (
              <div
                key={idx}
                className="px-8 py-4 flex items-center text-[14px] font-medium text-[#111827] dark:text-white"
              >
                <div className="w-[20%]">{req.employee}</div>
                <div className="w-[20%]">{req.requestType}</div>
                <div className="w-[20%] text-[#6B7280]">{req.detail}</div>
                <div className="w-[20%] text-[#6B7280] font-sf-rounded">{req.appliedDate}</div>
                <div className="w-[20%] text-[#007AFF]">{req.approvalFrom}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Activity Card */}
      <div className="w-full lg:w-[350px] xl:w-[380px] bg-white dark:bg-[#1C1C22] rounded-[25px] border border-[#E5E7EB] dark:border-white/10 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] flex flex-col shrink-0">
        {/* Activity Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-[18px] font-semibold text-[#111827] dark:text-white tracking-normal">
              Activity
            </p>
            <p className="text-[13px] font-normal text-[#6B7280] dark:text-gray-400 mt-0.5 tracking-normal">
              Attendance activity of employee
            </p>
          </div>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#E5E7EB] dark:border-white/10 rounded-full text-[12px] font-medium text-[#111827] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-sf">
            <StreamlineAttendance size={16} strokeWidth={1.75} />
            <span>Last 7 Days</span>
          </button>
        </div>

        {/* Bar Chart */}
        <div
          className="relative h-[180px] mb-8 flex items-end justify-between px-1 overflow-visible"
          onMouseLeave={() => setHoveredBarIndex(null)}
        >
          {/* Dynamic Dashed Line on Hover */}
          {hoveredBarIndex !== null && (() => {
            const pcts = [0.6, 0.45, 0.7, 1.0, 0.3, 0.6, 0.45];
            const labelGap = 28;
            const barAreaH = 180 - labelGap;
            const lineBottom =
              Math.round(pcts[hoveredBarIndex] * barAreaH) + labelGap;
            const hours = [
              "32 hours",
              "24 hours",
              "38 hours",
              "42 hours",
              "18 hours",
              "30 hours",
              "22 hours",
            ];
            return (
              <>
                {/* Dashed line */}
                <div
                  className="absolute left-0 right-0 pointer-events-none z-0 transition-none"
                  style={{ bottom: lineBottom }}
                >
                  <div className="border-t border-dashed border-gray-300 dark:border-gray-700 w-full" />
                </div>
                {/* Hours badge */}
                <div
                  className="absolute pointer-events-none z-30 transition-none"
                  style={{ bottom: lineBottom - 10, right: -4 }}
                >
                  <div className="bg-[#374151] text-white text-[10px] font-medium px-2 py-0.5 rounded-md shadow-md whitespace-nowrap font-sf-rounded">
                    {hours[hoveredBarIndex]}
                  </div>
                </div>
              </>
            );
          })()}

          {[
            { day: "Mon", h: 0.6, active: false },
            { day: "Tue", h: 0.45, active: false },
            { day: "Wed", h: 0.7, active: false },
            { day: "Thu", h: 1.0, active: true },
            { day: "Fri", h: 0.3, active: false },
            { day: "Sat", h: 0.6, active: false },
            { day: "Sun", h: 0.45, active: false },
          ].map((col, i) => {
            const labelGap = 28;
            const barAreaH = 180 - labelGap;
            const barH = Math.round(col.h * barAreaH);
            return (
              <div
                key={i}
                className="flex flex-col items-center gap-2 z-10 w-[36px] h-full justify-end cursor-pointer"
                onMouseEnter={() => setHoveredBarIndex(i)}
              >
                <div
                  className={`w-full rounded-[8px] transition-colors duration-200 ${
                    hoveredBarIndex === i
                      ? "bg-[#007AFF]"
                      : col.active && hoveredBarIndex === null
                      ? "bg-[#007AFF]"
                      : "bg-[#EAF2FF] dark:bg-white/10"
                  }`}
                  style={{ height: barH }}
                />
                <span
                  className={`text-[11px] font-medium font-sf transition-colors ${
                    hoveredBarIndex === i
                      ? "text-[#007AFF]"
                      : "text-[#6B7280] dark:text-gray-400"
                  }`}
                >
                  {col.day}
                </span>
              </div>
            );
          })}
        </div>

        {/* Top Performers */}
        <div>
          <p className="text-[16px] font-semibold text-[#111827] dark:text-white mb-4 tracking-normal">
            Top Performers
          </p>
          <div className="border border-[#E5E7EB] dark:border-white/10 rounded-[20px] p-4 flex flex-col gap-4">
            {topPerformers.map((performer) => (
              <div
                key={performer.rank}
                className="flex items-center gap-3 relative pb-3.5 last:pb-0"
              >
                {performer.rank !== 5 && (
                  <div className="absolute bottom-0 left-[44px] right-0 border-b border-gray-100 dark:border-white/5" />
                )}
                <div
                  className={`text-[12px] font-bold w-5 font-sf-rounded ${
                    performer.rank === 1 ? "text-[#F59E0B]" : "text-[#6B7280]"
                  }`}
                >
                  #{performer.rank}
                </div>
                <div className="w-8 h-8 rounded-full bg-[#EFEFEF] dark:bg-white/10 overflow-hidden shrink-0 border border-gray-200/60 dark:border-white/10 flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="#C7C7C7"
                    className="w-full h-full scale-125 translate-y-[2px]"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-[#111827] dark:text-white leading-tight truncate">
                    {performer.name}
                  </div>
                  <div className="text-[12px] font-medium text-[#9CA3AF] mt-0.5 truncate">
                    {performer.role}
                  </div>
                </div>
                <div className="text-[12px] font-semibold text-[#22C55E] font-sf-rounded">
                  {performer.hours}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

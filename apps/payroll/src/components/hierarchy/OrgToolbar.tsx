import React from "react";
import { Search, SlidersHorizontal, Download } from "lucide-react";

export default function OrgToolbar({ zoomLevel }: { zoomLevel: number }) {
  return (
    <div className="flex items-center justify-between px-6 py-3.5 bg-white dark:bg-[#0B0B0F] border-b border-gray-100 dark:border-white/5 shrink-0">
      <div className="flex items-center gap-4">
        {/* Dept Filter */}
        <button className="flex items-center gap-2 px-4 py-2 bg-[#F0F5FF] dark:bg-[#1a1e2e] border border-[#007AFF]/20 rounded-[10px] text-[13px] font-semibold text-[#007AFF] hover:bg-[#E0EEFF] dark:hover:bg-[#1a2545] transition-colors">
          All Dept.
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>

        {/* Zoom indicator */}
        <div className="flex items-center gap-2.5">
          <Search className="w-4 h-4 text-gray-400" />
          <div className="w-[140px] h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, Math.max(4, (zoomLevel / 2.5) * 100))}%`,
                background: "linear-gradient(90deg, #007AFF, #5BA4FF)"
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button className="flex items-center gap-2 px-4 py-2 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-[10px] text-[13px] font-semibold transition-colors shadow-sm shadow-blue-500/20">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-[10px] text-[13px] font-semibold transition-colors shadow-sm shadow-blue-500/20">
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>
    </div>
  );
}

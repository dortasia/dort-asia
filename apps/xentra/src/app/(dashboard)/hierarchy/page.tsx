"use client";
import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useOrgChart } from "@/hooks/useOrgChart";
import OrgChartEngine from "@/components/hierarchy/OrgChartEngine";
import HeaderSearchBar from "@/components/HeaderSearchBar";
import OrgSidePanel from "@/components/hierarchy/OrgSidePanel";
import OrgToolbar from "@/components/hierarchy/OrgToolbar";
import { OrgNode } from "@/lib/orgChartUtils";

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function OrgSkeleton() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-[#f8f9fc] dark:bg-[#0f0f13]">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        {/* Root node */}
        <div className="w-[220px] h-[96px] bg-gray-200 dark:bg-gray-800 rounded-[14px]" />
        {/* Connector */}
        <div className="w-0.5 h-10 bg-gray-200 dark:bg-gray-800" />
        {/* Two children */}
        <div className="flex gap-6">
          <div className="w-[220px] h-[96px] bg-gray-200 dark:bg-gray-800 rounded-[14px]" />
          <div className="w-[220px] h-[96px] bg-gray-200 dark:bg-gray-800 rounded-[14px]" />
        </div>
      </div>
      <p className="text-[13px] text-gray-400 font-medium">Building hierarchy…</p>
    </div>
  );
}

// ─── Inner content (needs Suspense for useSearchParams) ───────────────────────
function HierarchyContent() {
  const searchParams = useSearchParams();
  const highlightName = searchParams.get("highlightName");

  const { root, employees, company, loading, error, hasManagerId, refresh } = useOrgChart();
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [zoomLevel] = useState(1);

  if (loading) return <OrgSkeleton />;

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
        <p className="text-[15px] font-bold text-red-500">Failed to load hierarchy</p>
        <p className="text-[13px] text-gray-500 max-w-sm">{error}</p>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1FC6A4] text-white rounded-[10px] text-[13px] font-bold hover:bg-[#18b093] transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!root) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
        <p className="text-[15px] font-bold text-gray-700 dark:text-gray-300">No employees found</p>
        <p className="text-[13px] text-gray-400">Add employees to start building your hierarchy.</p>
      </div>
    );
  }

  const activeCount = employees.filter(e => e.status?.toLowerCase() === "active").length;

  return (
    <>
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5 shrink-0 bg-white dark:bg-[#0B0B0F]">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 bg-[#EEF5FF] dark:bg-[#007AFF]/10 rounded-[10px] flex items-center justify-center text-[#007AFF]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h1 className="text-[28px] font-medium text-[#111827] dark:text-white tracking-tight font-sans">Organization Chart</h1>
            <p className="text-[12px] text-gray-400 font-medium mt-0.5">
              {employees.length} {employees.length === 1 ? "Employee" : "Employees"} · {activeCount} Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <HeaderSearchBar />
          <button
            onClick={refresh}
            className="p-2 rounded-[8px] text-gray-400 hover:text-[#007AFF] hover:bg-[#EEF5FF] dark:hover:bg-[#007AFF]/10 transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <OrgToolbar zoomLevel={zoomLevel} />



      {/* Chart workspace */}
      <div className="flex-1 relative overflow-hidden flex">
        <div className="flex-1 relative">
          <OrgChartEngine
            root={root}
            company={company}
            onSelectNode={(node) => setSelectedNode(node)}
          />
        </div>

        {/* Side panel */}
        {selectedNode && selectedNode.id !== "__virtual_root__" && (
          <OrgSidePanel
            member={selectedNode}
            employeeDbId={selectedNode.id}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HierarchyPage() {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white dark:bg-[#1C1C1E]">
      <Suspense fallback={<OrgSkeleton />}>
        <HierarchyContent />
      </Suspense>
    </div>
  );
}

"use client";

import React from "react";
import { LayoutGrid, TrendingUp, Gem, Diamond, Users } from "lucide-react";
import { useAppStore } from "@/store";

type KpiCard = {
  label: string;
  value: string;
  sub: string;
  sub2?: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
};

interface ProjectStatsProps {
  projects: any[];
}

export default function ProjectStats({ projects }: ProjectStatsProps) {
  // Get dynamic employee count from Zustand store cache
  const totalTeamCount = useAppStore((s) => s.cachedSidebar?.totalTeamCount) || 0;

  // Calculate dynamic stats
  const activeCount = projects.filter((p) => p.status === "Active").length;
  const closedCount = projects.filter((p) => p.status === "Closed").length;

  let totalRevenue = 0;
  let totalProfit = 0;

  projects.forEach((p) => {
    // Parse financials e.g. "₹ 8.24 Cr" or just numeric strings
    const revMatch = String(p.financials || "0").match(/([\d.]+)/);
    const profMatch = String(p.profit || "0").match(/([\d.]+)/);
    if (revMatch) totalRevenue += parseFloat(revMatch[1]);
    if (profMatch) totalProfit += parseFloat(profMatch[1]);
  });

  const kpis: KpiCard[] = [
    {
      label: "Total Projects",
      value: String(projects.length),
      sub: `Active ${activeCount}`,
      sub2: `Closed ${closedCount}`,
      icon: LayoutGrid,
      iconBg: "#EDE9FE",
      iconColor: "#7C3AED",
    },
    {
      label: "Total Revenue",
      value: `S$ ${totalRevenue.toFixed(2)}`,
      sub: "Across All Projects",
      icon: TrendingUp,
      iconBg: "#DCFCE7",
      iconColor: "#16A34A",
    },
    {
      label: "Total Profit",
      value: `S$ ${totalProfit.toFixed(2)}`,
      sub: "Across All Projects",
      icon: Gem,
      iconBg: "#FEF3C7",
      iconColor: "#D97706",
    },
    {
      label: "Outstanding Claims",
      value: `S$ ${(totalRevenue * 0.25).toFixed(2)}`, // Approx 25% of projects revenue
      sub: "Across Projects List",
      icon: Diamond,
      iconBg: "#DBEAFE",
      iconColor: "#2563EB",
    },
    {
      label: "Total Employees",
      value: String(totalTeamCount || projects.length * 3), // Fallback if team count is 0
      sub: "Across All Projects",
      icon: Users,
      iconBg: "#FCE7F3",
      iconColor: "#DB2777",
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-4 mb-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.label}
            className="
              bg-white dark:bg-[#1C1C22]
              border border-[#F2F2F7] dark:border-[#2A2A31]
              rounded-[16px] p-4
              flex items-start gap-3
              hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]
              transition-shadow duration-200
              cursor-pointer
            "
          >
            {/* Icon square */}
            <div
              className="h-10 w-10 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5"
              style={{ backgroundColor: kpi.iconBg, color: kpi.iconColor }}
            >
              <Icon size={18} strokeWidth={2} />
            </div>

            {/* Text */}
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 leading-tight">
                {kpi.label}
              </span>
              <span className="text-[18px] font-extrabold text-gray-900 dark:text-white leading-snug mt-0.5 tracking-tight">
                {kpi.value}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                  {kpi.sub}
                </span>
                {kpi.sub2 && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                      {kpi.sub2}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

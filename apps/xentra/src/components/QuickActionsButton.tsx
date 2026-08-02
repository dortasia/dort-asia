"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  UserPlus, Building2, BellRing, ListTodo, CalendarOff, Upload
} from "lucide-react";
import AddEmployeeModal from "@/components/AddEmployeeModal";
import { useAppStore } from "@/store";

export default function QuickActionsButton() {
  const [open, setOpen] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Read from cached store instead of fetching from Supabase
  const cachedSidebar = useAppStore((s) => s.cachedSidebar);
  const isSuperAdmin = cachedSidebar?.isSuperAdmin ?? null;

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  type Action = {
    icon: React.ElementType;
    label: string;
    color: string;
    bg: string;
    nonSuperAdminOnly?: boolean;
    onClick: () => void;
  };

  const ACTIONS: Action[] = [
    {
      icon: UserPlus, label: "Add Employee", color: "#007AFF", bg: "#E5F1FF",
      onClick: () => { setOpen(false); setShowAddEmployee(true); },
    },
    {
      icon: Building2, label: "Create Department", color: "#5856D6", bg: "#EEEEFF",
      onClick: () => setOpen(false),
    },
    {
      icon: BellRing, label: "Notify", color: "#FF9500", bg: "#FFF4E5",
      onClick: () => setOpen(false),
    },
    {
      icon: ListTodo, label: "Task", color: "#34C759", bg: "#E5F9EC",
      onClick: () => setOpen(false),
    },
    {
      icon: CalendarOff, label: "Apply Leave", color: "#FF2D55", bg: "#FFF0F2",
      nonSuperAdminOnly: true,
      onClick: () => setOpen(false),
    },
    {
      icon: Upload, label: "Upload File", color: "#AF52DE", bg: "#F5EAFF",
      onClick: () => setOpen(false),
    },
  ];

  const visibleActions = ACTIONS.filter(a => {
    if (a.nonSuperAdminOnly && isSuperAdmin) return false;
    return true;
  });

  return (
    <>
      <div className="relative" ref={ref}>
        {/* Trigger */}
        <button
          onClick={() => setOpen(v => !v)}
          className={`bg-[var(--user-accent)] hover:bg-[#0062CC] text-white p-2 rounded-full shadow-lg transition-all flex items-center justify-center ${
            open ? "rotate-45 scale-110" : ""
          } duration-200`}
          aria-label="Quick actions"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-[calc(100%+8px)] w-[220px] bg-white dark:bg-[#1C1C22] rounded-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.16)] border border-[#F1F3F5] dark:border-[#2A2A31] z-[999] overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right">
            {/* Header */}
            <div className="px-4 pt-3.5 pb-2.5 border-b border-[#F1F3F5] dark:border-[#2A2A31]">
              <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase">Quick Actions</span>
            </div>

            {/* Items */}
            <div className="py-1.5">
              {visibleActions.map(({ icon: Icon, label, color, bg, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8F9FA] dark:hover:bg-white/5 transition-colors group"
                >
                  <div
                    className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-150"
                    style={{ backgroundColor: bg }}
                  >
                    <Icon className="h-4 w-4" style={{ color }} strokeWidth={2} />
                  </div>
                  <span className="text-[14px] font-semibold text-gray-800 dark:text-white leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddEmployee && (
        <AddEmployeeModal
          onClose={() => setShowAddEmployee(false)}
          onSuccess={() => {
            // Optionally trigger a refresh; pages that use server components will need navigation
            if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("employee-added"));
          }}
        />
      )}
    </>
  );
}

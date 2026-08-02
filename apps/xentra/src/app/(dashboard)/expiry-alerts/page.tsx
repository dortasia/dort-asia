"use client";

import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  Send, 
  Bell, 
  MoreVertical, 
  FileText, 
  Search, 
  SlidersHorizontal,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Filter,
  Download
} from "lucide-react";
import HeaderSearchBar from "@/components/HeaderSearchBar";
import { getAvatarColor, getInitials } from "@/utils/avatarColor";

type ExpiryItem = {
  id: number;
  name: string;
  role: string;
  expiryType: "S Pass" | "Passport" | "Work Permit" | "Visa" | "Driving License";
  docName: string;
  appliedDate: string;
  expiryDate: string;
  daysLeft: number;
  urgent: boolean;
};

const INITIAL_ALERTS: ExpiryItem[] = [
  {
    id: 1,
    name: "KrishnaKumar P",
    role: "Software engineer",
    expiryType: "S Pass",
    docName: "Krishna_Spass.pdf",
    appliedDate: "12 DEC 2023",
    expiryDate: "12 DEC 2026",
    daysLeft: 14,
    urgent: true
  },
  {
    id: 2,
    name: "Sarah Jenkins",
    role: "Product Manager",
    expiryType: "Passport",
    docName: "Sarah_Passport.pdf",
    appliedDate: "15 JAN 2023",
    expiryDate: "15 OCT 2026",
    daysLeft: 75,
    urgent: false
  },
  {
    id: 3,
    name: "Michael Chen",
    role: "UI/UX Designer",
    expiryType: "Work Permit",
    docName: "MChen_WP_2024.pdf",
    appliedDate: "03 MAR 2024",
    expiryDate: "20 AUG 2026",
    daysLeft: 19,
    urgent: true
  },
  {
    id: 4,
    name: "Emma Watson",
    role: "HR Specialist",
    expiryType: "Visa",
    docName: "Emma_Visa_UK.pdf",
    appliedDate: "10 AUG 2024",
    expiryDate: "10 NOV 2026",
    daysLeft: 101,
    urgent: false
  },
  {
    id: 5,
    name: "David Lee",
    role: "Backend Dev",
    expiryType: "S Pass",
    docName: "DLee_Spass.pdf",
    appliedDate: "22 NOV 2024",
    expiryDate: "05 SEP 2026",
    daysLeft: 35,
    urgent: false
  },
  {
    id: 6,
    name: "Alex Tan",
    role: "Marketing Manager",
    expiryType: "Passport",
    docName: "Alex_Passport_2026.pdf",
    appliedDate: "01 FEB 2022",
    expiryDate: "18 AUG 2026",
    daysLeft: 17,
    urgent: true
  }
];

export default function ExpiryAlertsPage() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [alerts, setAlerts] = useState<ExpiryItem[]>(INITIAL_ALERTS);

  const categories = ["All", "S Pass", "Passport", "Work Permit", "Visa"];

  const filteredAlerts = alerts.filter(item => {
    const matchesType = selectedType === "All" || item.expiryType === selectedType;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.role.toLowerCase().includes(search.toLowerCase()) ||
                          item.docName.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const urgentCount = alerts.filter(a => a.daysLeft <= 30).length;
  const warningCount = alerts.filter(a => a.daysLeft > 30 && a.daysLeft <= 90).length;
  const safeCount = alerts.filter(a => a.daysLeft > 90).length;

  const handleSendReminder = (name: string, docName: string) => {
    alert(`Reminder notification sent to ${name} for ${docName}`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto page-scrollbar bg-white dark:bg-[#121217] font-sans">
      <main className="flex-1 px-10 pb-10 pt-8 flex flex-col space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-medium text-[#111827] dark:text-white tracking-tight">
              Expiry Alerts
            </h1>
            <p className="text-[14px] text-gray-500 dark:text-gray-400 mt-1">
              Track work passes, passports, visas, and critical document expiration dates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => alert("Alert digest exported.")}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1C1C22] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-full text-[14px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm"
            >
              <Download size={16} />
              Export Report
            </button>
          </div>
        </div>

        {/* Metrics Banner Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#FFF5F5] dark:bg-[#2C1517] border border-[#FEE2E2] dark:border-[#5C1D24] rounded-[22px] p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-[#DC2626] dark:text-[#F87171] uppercase tracking-wider">Critical (≤ 30 Days)</span>
              <span className="text-[32px] font-extrabold text-[#991B1B] dark:text-[#FCA5A5] mt-1">{urgentCount}</span>
              <span className="text-[12px] font-medium text-[#B91C1C] dark:text-[#F87171]/80 mt-0.5">Requires immediate renewal</span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#FEE2E2] dark:bg-[#7F1D1D]/50 flex items-center justify-center text-[#DC2626] shrink-0">
              <ShieldAlert size={24} />
            </div>
          </div>

          <div className="bg-[#FFFBEB] dark:bg-[#2C2515] border border-[#FEF3C7] dark:border-[#5C4D1D] rounded-[22px] p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-[#D97706] dark:text-[#FBBF24] uppercase tracking-wider">Upcoming (31–90 Days)</span>
              <span className="text-[32px] font-extrabold text-[#B45309] dark:text-[#FCD34D] mt-1">{warningCount}</span>
              <span className="text-[12px] font-medium text-[#D97706] dark:text-[#FBBF24]/80 mt-0.5">Prepare renewal documents</span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#FEF3C7] dark:bg-[#78350F]/50 flex items-center justify-center text-[#D97706] shrink-0">
              <Clock size={24} />
            </div>
          </div>

          <div className="bg-[#F0FDF4] dark:bg-[#152C1E] border border-[#DCFCE7] dark:border-[#1D5C33] rounded-[22px] p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-[#16A34A] dark:text-[#4ADE80] uppercase tracking-wider">Healthy (&gt; 90 Days)</span>
              <span className="text-[32px] font-extrabold text-[#15803D] dark:text-[#86EFAC] mt-1">{safeCount}</span>
              <span className="text-[12px] font-medium text-[#16A34A] dark:text-[#4ADE80]/80 mt-0.5">No immediate action needed</span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#DCFCE7] dark:bg-[#14532D]/50 flex items-center justify-center text-[#16A34A] shrink-0">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          {/* Left: Search Input */}
          <div className="relative w-full max-w-[340px]">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search employee or document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-[#1C1C22] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-full text-[14px] text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] transition-colors placeholder:text-gray-400 shadow-sm"
            />
          </div>

          {/* Right: Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => {
              const active = selectedType === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedType(cat)}
                  className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                    active 
                      ? "bg-[#111827] dark:bg-white text-white dark:text-[#111827] shadow-sm" 
                      : "bg-gray-100 dark:bg-[#1C1C22] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Expiry Alerts Table Container */}
        <div className="bg-white dark:bg-[#1C1C22] rounded-[24px] border border-[#E5E7EB] dark:border-[#2C2C35] overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1.4fr_1.4fr_1.2fr_1fr] items-center px-6 py-4 border-b border-[#E5E7EB] dark:border-[#2C2C35] bg-gray-50/50 dark:bg-[#121217]/50">
            <div className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</div>
            <div className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expiry Type</div>
            <div className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Document</div>
            <div className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Issue Date</div>
            <div className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expiry Date</div>
            <div className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Remaining</div>
            <div className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</div>
          </div>

          {/* Table Rows */}
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alertItem) => {
              const { bg, color } = getAvatarColor(alertItem.name);
              const isUrgent = alertItem.daysLeft <= 30;

              return (
                <div 
                  key={alertItem.id}
                  className="grid grid-cols-[2fr_1.5fr_1.5fr_1.4fr_1.4fr_1.2fr_1fr] items-center px-6 py-4 border-b border-[#E5E7EB] dark:border-[#2C2C35] hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors last:border-b-0"
                >
                  {/* Name & Role */}
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 border border-black/5"
                      style={{ backgroundColor: bg, color }}
                    >
                      {getInitials(alertItem.name)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">{alertItem.name}</span>
                      <span className="text-[12px] font-normal text-gray-500 dark:text-gray-400 truncate">{alertItem.role}</span>
                    </div>
                  </div>

                  {/* Expiry Type Badge */}
                  <div className="flex items-center gap-2">
                    {isUrgent ? (
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                    )}
                    <span className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{alertItem.expiryType}</span>
                  </div>

                  {/* Document Name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center justify-center bg-red-500/10 text-red-600 dark:text-red-400 rounded px-1.5 py-0.5 text-[10px] font-extrabold shrink-0">
                      PDF
                    </div>
                    <span className="text-[13px] text-gray-600 dark:text-gray-300 truncate" title={alertItem.docName}>
                      {alertItem.docName}
                    </span>
                  </div>

                  {/* Issue Date */}
                  <div className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                    {alertItem.appliedDate}
                  </div>

                  {/* Expiry Date */}
                  <div className="text-[13px] text-gray-800 dark:text-gray-200 font-semibold">
                    {alertItem.expiryDate}
                  </div>

                  {/* Days Left Badge */}
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold ${
                      alertItem.daysLeft <= 30
                        ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800/40"
                        : alertItem.daysLeft <= 90
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                    }`}>
                      {alertItem.daysLeft} Days
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-1">
                    <button 
                      onClick={() => handleSendReminder(alertItem.name, alertItem.docName)}
                      title="Send Notification Email"
                      className="p-2 rounded-xl text-gray-400 hover:text-[#007AFF] hover:bg-[#007AFF]/10 transition-colors"
                    >
                      <Send size={16} />
                    </button>
                    <button 
                      onClick={() => alert(`Bell alert configured for ${alertItem.name}`)}
                      title="Set Alert Reminder"
                      className="p-2 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                    >
                      <Bell size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
              <Search className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-[15px] font-medium">No expiry alerts found</p>
              <p className="text-[13px] text-gray-400 mt-1">Try selecting a different filter or search term.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { ChevronLeft, Search, Filter, Check, Eye, ChevronDown, Clock, AlertCircle, FileText, UserCircle, Briefcase, Sparkles, Calendar, Send, TrendingUp, TrendingDown, Clock3, Users } from "lucide-react";
import Link from "next/link";

type User = {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  bg: string;
  avatarUrl?: string;
  lastActive: string;
  isActiveNow: boolean;
};

const MOCK_USERS: User[] = [
  { id: "1", name: "King Pin", role: "Sub Admin", initials: "KP", color: "#FF9500", bg: "#FFF2DF", isActiveNow: true, lastActive: "Active now" },
  { id: "2", name: "Krishna Kumar P", role: "Admin • HR Team", initials: "KK", color: "#007AFF", bg: "#E5F1FF", avatarUrl: "https://i.pravatar.cc/150?u=krishna", isActiveNow: true, lastActive: "Active now" },
  { id: "3", name: "Samy Chan", role: "Admin • Finance Team", initials: "SC", color: "#FF9500", bg: "#FFF2DF", isActiveNow: false, lastActive: "2h ago" },
  { id: "4", name: "Shin Chan", role: "Admin • HR Team", initials: "SC", color: "#34C759", bg: "#B8F0CC", isActiveNow: false, lastActive: "1h ago" },
  { id: "5", name: "Priya Patel", role: "Employee • Marketing", initials: "PP", color: "#AF52DE", bg: "#F5EAFF", avatarUrl: "https://i.pravatar.cc/150?u=priya", isActiveNow: false, lastActive: "3h ago" },
  { id: "6", name: "Rohit Sharma", role: "Employee • Support", initials: "RS", color: "#5856D6", bg: "#F2F2FB", avatarUrl: "https://i.pravatar.cc/150?u=rohit", isActiveNow: false, lastActive: "1d ago" },
];

export default function NotifyPage() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>(["1", "2", "4"]);
  const [heading, setHeading] = useState("Your Clock out time is within 30min away");
  const [subHeading, setSubHeading] = useState("Please complete your tasks and clock out on time.");
  const [previewMode, setPreviewMode] = useState("Lock Screen");

  const toggleUser = (id: string) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] dark:bg-[#0B0B0F] overflow-y-auto page-scrollbar">
      {/* Header */}
      <header className="flex items-center justify-between p-4 shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div>
          <h1 className="text-[28px] font-medium text-[#111827] dark:text-white tracking-tight font-sans">Notify</h1>
          <p className="text-[14px] text-gray-500 font-medium mt-1">Send notifications to your employees</p>
        </div>
        <Link href="/" className="flex items-center gap-1.5 text-[14px] font-semibold text-[#007AFF] hover:bg-[#E5F1FF] px-3 py-2 rounded-lg transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
      </header>

      <main className="flex-1 p-4 pt-0 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Top 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Select Recipients */}
          <section className="bg-white dark:bg-[#121217] rounded-[24px] border border-gray-200/60 dark:border-white/5 flex flex-col h-[700px] overflow-hidden shadow-sm">
            <div className="p-6 pb-4 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">1. Select Recipients</h2>
                <div className="bg-[#E5F1FF] dark:bg-[#0A84FF]/15 text-[#007AFF] px-3 py-1.5 rounded-full text-[12px] font-semibold">
                  Selected : <span className="font-bold">{selectedUsers.length} People</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="Search employee..." className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-transparent focus:border-gray-200 dark:focus:border-white/10 rounded-xl text-[13px] font-medium placeholder:text-gray-400 outline-none transition-colors" />
                </div>
                <button className="h-[42px] w-[42px] shrink-0 rounded-xl bg-[#F8F9FA] dark:bg-[#1C1C1E] flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2A2A31] transition-colors border border-transparent">
                  <Filter className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {["Company", "Departments", "Admins", "Groups", "Individuals"].map(pill => (
                  <button key={pill} className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-colors border ${pill === "Individuals" ? "bg-[#007AFF] text-white border-[#007AFF]" : "bg-white dark:bg-transparent text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                    {pill}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2">
              {MOCK_USERS.map(user => (
                <div key={user.id} onClick={() => toggleUser(user.id)} className={`flex items-center gap-4 p-3 rounded-[16px] cursor-pointer transition-colors ${selectedUsers.includes(user.id) ? "bg-[#FAFAFC] dark:bg-white/5" : "hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                  <div className={`h-5 w-5 rounded-[6px] border-[1.5px] flex items-center justify-center transition-colors ${selectedUsers.includes(user.id) ? "bg-[#007AFF] border-[#007AFF] text-white" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1C1C1E]"}`}>
                    {selectedUsers.includes(user.id) && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </div>
                  
                  <div className="relative">
                    <div className="h-[42px] w-[42px] rounded-full flex items-center justify-center font-bold text-[14px] overflow-hidden" style={{ backgroundColor: user.bg, color: user.color }}>
                      {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user.initials}
                    </div>
                    {user.isActiveNow && <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-[#34C759] border-[2.5px] border-white dark:border-[#121217] rounded-full" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-bold text-gray-900 dark:text-white truncate">{user.name}</h3>
                    <p className="text-[12px] text-gray-500 font-medium truncate">{user.role}</p>
                  </div>

                  <div className={`text-[11px] font-semibold ${user.isActiveNow ? "text-[#34C759]" : "text-gray-400"}`}>
                    {user.lastActive}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between bg-[#F8F9FA] dark:bg-[#1A1A1E]">
              <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">{selectedUsers.length}</strong> people selected</span>
              <button onClick={() => setSelectedUsers([])} className="text-[13px] font-bold text-[#007AFF] hover:underline">Clear All</button>
            </div>
          </section>

          {/* Column 2: Notification Preview */}
          <section className="bg-white dark:bg-[#121217] rounded-[24px] border border-gray-200/60 dark:border-white/5 flex flex-col h-[700px] shadow-sm relative overflow-hidden">
            <div className="p-6 pb-2 flex items-center justify-between z-10">
              <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">2. Notification Preview</h2>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/10 text-[12px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <Eye className="h-3.5 w-3.5 text-[#007AFF]" />
                Preview <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* iPhone Mockup Container */}
            <div className="flex-1 flex items-center justify-center p-6 relative z-0">
              <div className="w-[300px] h-[580px] bg-black rounded-[45px] p-2.5 shadow-2xl relative border border-gray-200 dark:border-[#2C2C35] shrink-0">
                {/* Inner Screen */}
                <div className="w-full h-full bg-gradient-to-br from-[#87C2E4] to-[#437A9A] rounded-[36px] relative overflow-hidden flex flex-col items-center">
                  {/* Dynamic Island */}
                  <div className="absolute top-2 w-[110px] h-[30px] bg-black rounded-full z-20" />
                  
                  {/* Lock Screen Content */}
                  <div className="mt-14 flex flex-col items-center text-white/90">
                    <span className="text-[15px] font-semibold tracking-wide">Sat 2 May</span>
                    <span className="text-[72px] font-bold leading-[1.1] tracking-tight text-white drop-shadow-md">1:44</span>
                  </div>

                  {/* Notification Card */}
                  <div className="absolute top-[240px] left-3 right-3 bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-xl rounded-[20px] p-3.5 shadow-lg flex gap-3 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="h-10 w-10 shrink-0 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#007AFF]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="text-[13px] font-bold text-gray-900 dark:text-white truncate pr-2">{heading || "Notification Heading"}</span>
                        <span className="text-[10px] text-gray-500 font-medium shrink-0 pt-0.5">now</span>
                      </div>
                      <p className="text-[12px] text-gray-700 dark:text-gray-300 leading-snug break-words line-clamp-3">
                        {subHeading || "Notification details will appear here..."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Toggles */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center bg-white dark:bg-[#1A1A1E] rounded-full p-1 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-white/5 z-20">
              {["Lock Screen", "Banner", "Push Center"].map(mode => (
                <button key={mode} onClick={() => setPreviewMode(mode)} className={`px-4 py-2 rounded-full text-[12px] font-bold transition-all ${previewMode === mode ? "bg-gray-100 dark:bg-white/10 text-[#007AFF]" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"} flex items-center gap-1.5`}>
                  {mode === "Lock Screen" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                  {mode === "Banner" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8h20"/></svg>}
                  {mode === "Push Center" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>}
                  {mode}
                </button>
              ))}
            </div>
          </section>

          {/* Column 3: Configure Message */}
          <section className="bg-white dark:bg-[#121217] rounded-[24px] border border-gray-200/60 dark:border-white/5 p-6 flex flex-col h-[700px] shadow-sm">
            <h2 className="text-[16px] font-bold text-gray-900 dark:text-white mb-6">3. Configure Message</h2>

            <div className="flex-1 flex flex-col gap-5 overflow-y-auto page-scrollbar pr-2 -mr-2">
              
              {/* Heading */}
              <div>
                <label className="text-[13px] font-bold text-gray-700 dark:text-gray-300 block mb-2">Heading</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={heading}
                    onChange={(e) => setHeading(e.target.value.substring(0, 50))}
                    className="w-full px-4 py-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-[14px] text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all pr-16 shadow-sm"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-gray-400">{heading.length}/50</span>
                    <Check className="h-3.5 w-3.5 text-[#34C759]" strokeWidth={3} />
                  </div>
                </div>
              </div>

              {/* Sub Heading */}
              <div>
                <label className="text-[13px] font-bold text-gray-700 dark:text-gray-300 block mb-2">Sub Heading <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <textarea 
                    value={subHeading}
                    onChange={(e) => setSubHeading(e.target.value.substring(0, 150))}
                    className="w-full px-4 py-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-[14px] text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all pr-16 resize-none h-[100px] shadow-sm"
                  />
                  <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-gray-400">{subHeading.length}/150</span>
                    <Check className="h-3.5 w-3.5 text-[#34C759]" strokeWidth={3} />
                  </div>
                </div>
              </div>

              {/* Quick Templates */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300">Quick Templates</span>
                  <button className="text-[12px] font-bold text-[#007AFF] hover:underline">View all</button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] border border-[#007AFF]/30 bg-[#E5F1FF] dark:bg-[#0A84FF]/10 text-[#007AFF] text-[12px] font-bold transition-all hover:bg-[#cce4ff] dark:hover:bg-[#0A84FF]/20">
                    <Clock className="h-4 w-4" /> Clock Out Reminder
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] border border-gray-200 dark:border-[#2C2C35] bg-white dark:bg-[#1C1C1E] text-gray-700 dark:text-gray-300 text-[12px] font-semibold transition-all hover:bg-gray-50 dark:hover:bg-white/5">
                    <UserCircle className="h-4 w-4" /> Attendance Missing
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] border border-gray-200 dark:border-[#2C2C35] bg-white dark:bg-[#1C1C1E] text-gray-700 dark:text-gray-300 text-[12px] font-semibold transition-all hover:bg-gray-50 dark:hover:bg-white/5">
                    <Calendar className="h-4 w-4" /> Meeting Alert
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] border border-gray-200 dark:border-[#2C2C35] bg-white dark:bg-[#1C1C1E] text-gray-700 dark:text-gray-300 text-[12px] font-semibold transition-all hover:bg-gray-50 dark:hover:bg-white/5">
                    <Briefcase className="h-4 w-4" /> Payroll Notification
                  </button>
                </div>
              </div>

              {/* Add Personalization */}
              <div>
                <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300 block mb-3">Add Personalization</span>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-gray-200 dark:border-[#2C2C35] bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-400 text-[12px] font-medium hover:bg-gray-50 transition-colors">
                    <FileText className="h-3.5 w-3.5" /> Employee Name <ChevronDown className="h-3 w-3" />
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-gray-200 dark:border-[#2C2C35] bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-400 text-[12px] font-medium hover:bg-gray-50 transition-colors">
                    <FileText className="h-3.5 w-3.5" /> Department <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Smart Suggestion */}
              <div className="bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[16px] p-4 flex items-center justify-between border border-gray-100 dark:border-white/5">
                <div className="flex gap-3 items-center">
                  <div className="h-8 w-8 rounded-full bg-[#E5F1FF] dark:bg-[#0A84FF]/15 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-[#007AFF]" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">Smart Suggestion</h4>
                    <p className="text-[12px] text-gray-500 font-medium">This message is good to go! 👍</p>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 text-[12px] font-bold text-[#007AFF] bg-white dark:bg-[#121217] border border-gray-200 dark:border-[#2C2C35] px-3 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" /> Improve with AI
                </button>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
              <button className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-[16px] py-3 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group shadow-sm">
                <div className="flex items-center gap-2 mb-0.5">
                  <Calendar className="h-4 w-4 text-[#007AFF] group-hover:scale-110 transition-transform" />
                  <span className="text-[14px] font-bold">Schedule Push</span>
                </div>
                <span className="text-[11px] font-medium text-gray-500">Choose date & time</span>
              </button>
              
              <button className="flex-1 flex flex-col items-center justify-center bg-[#007AFF] hover:bg-[#0062CC] rounded-[16px] py-3 text-white transition-colors group shadow-[0_8px_20px_rgba(0,122,255,0.24)] border border-transparent">
                <div className="flex items-center gap-2 mb-0.5">
                  <Send className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span className="text-[14px] font-bold">Quick Push</span>
                </div>
                <span className="text-[11px] font-medium text-white/80">Send Notification Now</span>
              </button>
            </div>
          </section>

        </div>

        {/* Notification Overview */}
        <section className="bg-white dark:bg-[#121217] rounded-[24px] border border-gray-200/60 dark:border-white/5 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">Notification Overview</h2>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/10 text-[12px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <Calendar className="h-3.5 w-3.5" />
                Today <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <Link href="#" className="flex items-center gap-1 text-[13px] font-bold text-[#007AFF] hover:underline">
              View Reports <ChevronLeft className="h-4 w-4 rotate-180" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Stat 1 */}
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-[14px] bg-[#E5F1FF] dark:bg-[#0A84FF]/15 flex items-center justify-center shrink-0">
                <Send className="h-5 w-5 text-[#007AFF]" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-gray-500 mb-1">Sent Today</p>
                <div className="flex items-end gap-3">
                  <span className="text-[24px] font-bold text-gray-900 dark:text-white leading-none">1,248</span>
                  <div className="flex items-center gap-1 text-[#34C759] text-[11px] font-bold pb-0.5">
                    <TrendingUp className="h-3 w-3" />
                    <span>18.5% <span className="text-gray-400 font-medium">vs yesterday</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex items-center gap-4 border-l border-gray-100 dark:border-[#2C2C35] pl-6">
              <div className="h-12 w-12 rounded-[14px] bg-[#E8FAF0] dark:bg-[#34C759]/15 flex items-center justify-center shrink-0">
                <Check className="h-5 w-5 text-[#34C759]" strokeWidth={3} />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-gray-500 mb-1">Delivered</p>
                <div className="flex items-end gap-3">
                  <span className="text-[24px] font-bold text-gray-900 dark:text-white leading-none">98.6%</span>
                  <div className="flex items-center gap-1 text-[#34C759] text-[11px] font-bold pb-0.5">
                    <TrendingUp className="h-3 w-3" />
                    <span>2.3% <span className="text-gray-400 font-medium">vs yesterday</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex items-center gap-4 border-l border-gray-100 dark:border-[#2C2C35] pl-6">
              <div className="h-12 w-12 rounded-[14px] bg-[#FFF2DF] dark:bg-[#FF9500]/15 flex items-center justify-center shrink-0">
                <Clock3 className="h-5 w-5 text-[#FF9500]" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-gray-500 mb-1">Scheduled</p>
                <div className="flex items-end gap-3">
                  <span className="text-[24px] font-bold text-gray-900 dark:text-white leading-none">36</span>
                  <div className="flex items-center gap-1 text-gray-400 text-[11px] font-medium pb-0.5">
                    <span>Upcoming notifications</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="flex items-center gap-4 border-l border-gray-100 dark:border-[#2C2C35] pl-6">
              <div className="h-12 w-12 rounded-[14px] bg-[#FFF1F1] dark:bg-[#FF3B30]/15 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-[#FF3B30]" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-gray-500 mb-1">Failed</p>
                <div className="flex items-end gap-3">
                  <span className="text-[24px] font-bold text-gray-900 dark:text-white leading-none">12</span>
                  <div className="flex items-center gap-1 text-[#FF3B30] text-[11px] font-bold pb-0.5">
                    <TrendingDown className="h-3 w-3" />
                    <span>3.2% <span className="text-gray-400 font-medium">vs yesterday</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

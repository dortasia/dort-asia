import React from 'react';
import { Briefcase, Calendar, Megaphone, ClipboardList, Clock, Reply, MoreVertical, Plus, ChevronDown } from 'lucide-react';

export default function HomeWidgets() {
  const actions = [
    { icon: "/Holiday 1.svg", label: "Leave" },
    { icon: "/Events 2.svg", label: "Events", badge: true },
    { icon: "/Notify.svg", label: "Notify" },
    { icon: "/MyTasks.svg", label: "My Tasks" },
  ];

  const holidays = [
    { day: "TUE", date: "01", daysLeft: "12 Days Left" },
    { day: "MON", date: "12", daysLeft: "12 Days Left" },
    { day: "SUN", date: "19", daysLeft: "12 Days Left" },
    { day: "WED", date: "26", daysLeft: "12 Days Left" },
    { day: "SUN", date: "30", daysLeft: "12 Days Left" },
    { day: "MON", date: "31", daysLeft: "12 Days Left" },
  ];

  return (
    <div className="mb-8 flex flex-col gap-6">
      <h2 className="text-[16px] font-bold text-gray-900 dark:text-gray-100 ml-1">Widgets</h2>
      
      {/* Top Row: Actions & Holidays */}
      <div className="flex gap-6">
        {/* Your Actions */}
        <div className="bg-[#F8F9FA] dark:bg-[#121217] rounded-[24px] p-6 flex-1 max-w-[50%]">
          <h3 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-6">Your Actions</h3>
          <div className="flex justify-between items-center gap-4">
            {actions.map((action, i) => (
              <div key={i} className="relative bg-white dark:bg-[#1C1C22] rounded-[20px] w-[100px] h-[105px] flex flex-col items-center justify-center gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all border border-transparent dark:border-[#2A2A31]">
                {/* Badge on Card */}
                {action.badge && (
                  <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center z-10">
                    <span
                      className="relative inline-flex items-center justify-center rounded-full h-6 w-6 ring-[2px] ring-white dark:ring-[#1C1C22] shadow-[0_2px_8px_rgba(255,59,48,0.4)] text-[12px] font-bold text-white leading-none"
                      style={{ background: "linear-gradient(135deg, #FF6B6B 0%, #FF3B30 100%)" }}
                    >
                      2
                    </span>
                  </div>
                )}
                
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={action.icon} alt={action.label} className="h-[46px] w-[46px] object-contain" />
                </div>
                <span className="text-[15px] font-normal text-gray-700 dark:text-gray-300">{action.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Holidays */}
        <div className="bg-[#F8F9FA] rounded-[24px] p-6 flex-1 max-w-[50%]">
          <h3 className="text-[17px] font-semibold text-gray-900 mb-6">Upcoming Holidays</h3>
          <div className="flex justify-between items-center bg-transparent px-2">
            {holidays.map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="bg-white rounded-full w-[60px] h-[60px] flex flex-col items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-transparent">
                  <span className="text-[11px] font-semibold text-gray-400 leading-tight uppercase tracking-wide">{h.day}</span>
                  <span className="text-[20px] font-bold leading-tight text-[#FF3B30]">{h.date}</span>
                </div>
                <span className="text-[10px] font-medium text-gray-800 tracking-wide">{h.daysLeft}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Project Management & Create Task */}
      <div className="flex gap-6">
        {/* Project Management */}
        <div className="bg-[#F8F9FA] dark:bg-[#121217] rounded-[24px] p-6 flex-[2] flex flex-col min-h-[250px] relative mt-1">
          <h3 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-6">Project Management</h3>
          
          <div className="bg-white dark:bg-[#1C1C22] border border-transparent dark:border-[#2A2A31] rounded-[20px] p-4 flex items-start justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-full bg-[#D1D1D6] dark:bg-[#3A3A3C] shrink-0" />
              <div>
                <h4 className="text-[17px] font-bold text-gray-900 dark:text-white tracking-[0.04em] leading-tight">KrishnaKumar P</h4>
                <p className="text-[15px] font-normal text-gray-400 dark:text-gray-500 mt-1 leading-tight">The Project was postponed</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 text-[var(--user-accent)]">
                <Clock className="h-4 w-4" />
                <Reply className="h-4 w-4" />
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </div>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">21 Jan 2026 12:23 PM</span>
            </div>
          </div>

          <button className="flex items-center justify-center gap-1.5 text-[12px] font-bold text-[var(--user-accent)] absolute bottom-6 left-1/2 -translate-x-1/2 hover:text-[#0062CC] transition-colors">
            View More <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Create Task */}
        <div className="bg-[#F8F9FA] rounded-[24px] p-6 flex-1 flex flex-col items-center justify-center relative min-h-[250px]">
          <div className="flex flex-col items-center justify-center w-full max-w-[200px] mb-8">
            <div className="relative w-[160px] h-[100px] flex items-center justify-center mb-4">
              <div className="absolute w-[65px] h-[65px] rounded-full bg-white border border-[#E5E7EB] left-0 top-1/2 -translate-y-1/2 z-10 shadow-sm" />
              <div className="absolute w-[80px] h-[80px] rounded-full bg-white border border-[#E5E7EB] z-20 shadow-sm" />
              <div className="absolute w-[65px] h-[65px] rounded-full bg-white border border-[#E5E7EB] right-0 top-1/2 -translate-y-1/2 z-10 shadow-sm" />
            </div>
            <span className="text-[15px] font-bold text-gray-400 text-center relative z-30">Create a Task</span>
          </div>
          
          <button className="w-full max-w-[280px] bg-[var(--user-accent)] hover:bg-[#0062CC] text-white text-[13px] font-bold py-3.5 rounded-full transition-colors flex items-center justify-center gap-2 mt-auto">
            <Plus className="h-4 w-4" strokeWidth={3} />
            Create New Task
          </button>
        </div>
      </div>
    </div>
  );
}

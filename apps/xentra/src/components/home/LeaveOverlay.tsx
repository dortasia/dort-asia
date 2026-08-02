"use client";

import React from "react";
import { 
  ChevronLeft, 
  Check, 
  X, 
  Clock, 
  Send 
} from "lucide-react";

interface LeaveOverlayProps {
  onClose: () => void;
}

export default function LeaveOverlay({ onClose }: LeaveOverlayProps) {
  // Dummy data arrays to replicate the design
  const approvalsList = Array(5).fill({
    name: "Krishna Kumar P",
    category: "Medical Leave",
    /* eslint-disable-next-line @next/next/no-img-element */
    icon: <img src="/Leave/Medical_Leave.svg" alt="Medical" width={16} height={16} />,
    startDate: "12 Jan 2026",
    endDate: "15 Jan 2026",
    duration: "4 Days"
  });

  const categories = [
    { name: "Personal Leave", count: 45, icon: "/Leave/Personal_Leave.svg" },
    { name: "Medical Leave", count: 45, icon: "/Leave/Medical_Leave.svg" },
    { name: "Earned Leave", count: 45, icon: "/Leave/Earned_Leave.svg" },
    { name: "Work From Home", count: 45, icon: "/Leave/Work_From_Home.svg" },
    { name: "Emergency Leave", count: 45, icon: "/Leave/Emergency_Leave.svg" },
    { name: "Other Leaves", count: 45, icon: "/Leave/Other_Leaves (2).svg" },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-white dark:bg-gray-900 page-scrollbar">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-8 shrink-0">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight uppercase">
            LEAVE
          </h1>
          <p className="text-[14px] text-gray-500 font-medium mt-1">
            Manage The Leave Approvals
          </p>
        </div>

        <button
          onClick={onClose}
          className="text-blue-500 hover:text-blue-600 transition-colors font-medium text-[15px] flex items-center gap-1"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
          Back
        </button>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 px-8 pb-8 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
        
        {/* Left Column: Approvals Container */}
        <div className="bg-[#F8F9FA] rounded-[24px] p-6 min-h-[calc(100vh-200px)]">
          <h3 className="text-[14px] font-semibold text-gray-500 mb-6 pl-2">Approvals for you</h3>
          
          <div className="flex flex-col gap-3">
            {approvalsList.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-[24px] px-6 h-[80px] flex items-center justify-between shadow-[0_2px_8px_rgb(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgb(0,0,0,0.04)] transition-all"
              >
                <div className="flex items-center gap-8 flex-1 justify-between min-w-0">
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 w-[200px]">
                    <div className="w-12 h-12 rounded-full bg-[#D9D9D9] shrink-0" />
                    <span className="text-[14px] font-bold text-gray-900 truncate">{item.name}</span>
                  </div>

                  {/* Category */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase">Category</span>
                    <div className="flex items-center gap-1.5 text-[13px] font-bold text-gray-800 whitespace-nowrap">
                      <span className="text-blue-500 flex items-center justify-center shrink-0">{item.icon}</span>
                      <span className="whitespace-nowrap">{item.category}</span>
                    </div>
                  </div>

                  {/* Duration Dates */}
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase text-center mb-1">Duration</span>
                    <div className="flex items-center gap-6 text-[13px] font-bold text-gray-800 leading-tight whitespace-nowrap">
                      <span className="whitespace-nowrap">{item.startDate}</span>
                      <span className="whitespace-nowrap">{item.endDate}</span>
                    </div>
                  </div>

                  {/* Counts */}
                  <div className="flex flex-col gap-1 w-[80px] items-end">
                    <span className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase">Counts</span>
                    <span className="text-[14px] font-bold text-gray-900">{item.duration}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pl-4 border-l border-gray-100 ml-4 shrink-0">
                  <button className="w-8 h-8 rounded-[8px] flex items-center justify-center border-[1.5px] border-[#FF4D4D] bg-[#FFF0F0] text-[#FF4D4D] hover:bg-[#ffe3e3] transition-colors">
                    <X size={18} strokeWidth={2.5} />
                  </button>
                  <button className="w-8 h-8 rounded-[8px] flex items-center justify-center border-[1.5px] border-[#10B981] bg-[#ECFDF5] text-[#10B981] hover:bg-[#d1fae5] transition-colors">
                    <Check size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Stats & Categories */}
        <div className="bg-[#F8F9FA] rounded-[24px] p-6 flex flex-col gap-6">
          
          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-[20px] p-5 flex flex-col justify-between h-[120px] shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
              <div className="text-blue-500">
                <Check size={28} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Approvals</span>
                <span className="text-[24px] font-bold text-gray-900 leading-none mt-1">15</span>
              </div>
            </div>
            
            <div className="bg-white rounded-[20px] p-5 flex flex-col justify-between h-[120px] shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
              <div className="text-blue-500">
                <X size={28} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Rejections</span>
                <span className="text-[24px] font-bold text-gray-900 leading-none mt-1">0</span>
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-5 flex flex-col justify-between h-[120px] shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
              <div className="text-blue-500">
                <Clock size={28} strokeWidth={2} />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Pending</span>
                <span className="text-[24px] font-bold text-gray-900 leading-none mt-1">6</span>
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-5 flex flex-col justify-between h-[120px] shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
              <div className="text-blue-500">
                <Send size={26} strokeWidth={2} className="origin-center -rotate-45" />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Requests</span>
                <span className="text-[24px] font-bold text-gray-900 leading-none mt-1">12</span>
              </div>
            </div>
          </div>

          {/* Leave Categories List */}
          <div>
            <h3 className="text-[14px] font-semibold text-gray-500 mb-4 pl-1">Leave Categories</h3>
            <div className="flex flex-col gap-3">
              {categories.map((cat, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-[20px] px-5 h-[60px] flex items-center justify-between shadow-[0_2px_8px_rgb(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgb(0,0,0,0.06)] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4 text-blue-500">
                    <div className="w-8 flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cat.icon} alt={cat.name} width={24} height={24} className="object-contain" />
                    </div>
                    <span className="text-[14px] font-bold text-gray-900">{cat.name}</span>
                  </div>
                  <span className="text-[16px] font-bold text-emerald-500">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { X, Plus, Send, PanelLeftClose, PanelRightClose } from "lucide-react";
import { useAppStore } from "@/store";

export default function SamChatPanel() {
  const isSamOpen = useAppStore((s) => s.isSamOpen);
  const setSamOpen = useAppStore((s) => s.setSamOpen);
  const [isLeftAligned, setIsLeftAligned] = useState(false);

  // Global hotkey: Ctrl + S or Cmd + S -> Open Sam
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault(); // prevent browser save
        setSamOpen(true);
      }
      
      // Check for ESC to close
      if (e.key === "Escape" && isSamOpen) {
        setSamOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSamOpen, setSamOpen]);

  if (!isSamOpen) return null;

  const historyItems = [
    "Company analysis",
    "Notify Employee",
    "Attendance Log for March Month",
    "Duplicate items in Storage",
  ];

  return (
    <>
      {/* Dimmed Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-[9998] transition-opacity" 
        onClick={() => setSamOpen(false)}
      />

      {/* Slide Panel */}
      <div 
        className={`fixed top-0 h-full w-[555px] bg-white z-[9999] shadow-2xl flex flex-col transform transition-all duration-300 ease-in-out ${
          isLeftAligned ? "left-0" : "right-0"
        }`}
      >
        
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sam.svg" alt="Sam" className="w-8 h-8 object-contain" />
            <span className="text-gray-900 font-semibold text-[15px]">Sam</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsLeftAligned(!isLeftAligned)}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              {isLeftAligned ? (
                <PanelRightClose size={18} strokeWidth={2.5} />
              ) : (
                <PanelLeftClose size={18} strokeWidth={2.5} />
              )}
            </button>
            <button 
              onClick={() => setSamOpen(false)} 
              className="text-gray-900 hover:text-gray-600 transition-colors"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ─── Content Body ─── */}
        <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6">
          
          <div>
            <h2 className="text-[#0056D2] text-[22px] font-bold tracking-tight mb-2">
              Hello, Krishna
            </h2>
            <p className="text-[#1a1a1a] font-bold text-[15px]">
              What are you working on today?
            </p>
          </div>

          <div className="mt-auto">
            <h3 className="text-gray-500 font-bold text-[14px] mb-4">
              History
            </h3>
            <div className="flex flex-col gap-3">
              {historyItems.map((item, i) => (
                <button
                  key={i}
                  className="bg-[#eaf3fc] hover:bg-[#dce9f8] transition-colors text-left text-[#374151] font-medium text-[13px] py-4 px-6 rounded-[20px] w-full"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ─── Footer Input ─── */}
        <div className="p-6">
          <div className="bg-[#f4f5f8] rounded-[24px] p-4 flex flex-col justify-between h-[110px]">
            <input
              type="text"
              placeholder="Ask Something, @ to mention"
              className="w-full bg-transparent border-none outline-none text-[13px] text-gray-800 font-medium placeholder-gray-400"
            />
            <div className="flex items-center justify-between mt-2">
              <button className="text-gray-500 hover:text-gray-800 transition-colors">
                <Plus size={20} strokeWidth={2.5} />
              </button>
              <button className="bg-[#007aff] text-white p-1.5 rounded-[8px] hover:bg-blue-600 transition-colors">
                <Send size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

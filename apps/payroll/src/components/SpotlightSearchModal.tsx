"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useAppStore } from "@/store";

export default function SpotlightSearchModal() {
  const { isSpotlightOpen, setSpotlightOpen } = useAppStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); // Prevent default browser behavior
        setSpotlightOpen(true);
      }
      
      if (e.key === "Escape" && isSpotlightOpen) {
        setSpotlightOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSpotlightOpen, setSpotlightOpen]);

  useEffect(() => {
    if (isSpotlightOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery("");
    }
  }, [isSpotlightOpen]);

  if (!isSpotlightOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
      onClick={() => setSpotlightOpen(false)}
    >
      <div 
        className="w-full max-w-[600px] bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-4 border-b border-gray-100 dark:border-white/10">
          <Search className="h-5 w-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search employees, departments, documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[16px] text-gray-900 dark:text-white placeholder:text-gray-400"
          />
          <button 
            onClick={() => setSpotlightOpen(false)}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {query ? (
          <div className="p-6 text-center text-[14px] text-gray-500">
            Searching for "{query}"...
          </div>
        ) : (
          <div className="px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-black/20 text-[12px] text-gray-400">
            <span>Start typing to search across the HRMS</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-[4px] text-[10px] font-medium shadow-sm">ESC</kbd> to close
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-[4px] text-[10px] font-medium shadow-sm">Enter</kbd> to select
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

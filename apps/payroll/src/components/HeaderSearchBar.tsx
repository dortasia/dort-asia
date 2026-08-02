"use client";

import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useAppStore } from "@/store";

export default function HeaderSearchBar() {
  const { setSpotlightOpen, cachedSidebar } = useAppStore();
  const userName = cachedSidebar?.userProfile?.name?.split(" ")[0] || "there";
  
  const [phrases, setPhrases] = useState<string[]>([
    `Hey ${userName}, Search something`,
    `Ctrl + K to search something`
  ]);
  const [shortcutLabel, setShortcutLabel] = useState("⌘ K");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  // Detect platform on mount
  useEffect(() => {
    const isMac = typeof window !== "undefined" && navigator.userAgent.toLowerCase().includes("mac");
    const shortcut = isMac ? "⌘ + K" : "Ctrl + K";
    setShortcutLabel(isMac ? "⌘ K" : "Ctrl K");
    setPhrases([
      `Hey ${userName}, Search something`,
      `${shortcut} to search something`
    ]);
  }, [userName]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
        setVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [phrases.length]);

  return (
    <div className="flex items-center">
      <div 
        onClick={() => setSpotlightOpen(true)}
        className="group relative flex items-center h-[42px] min-w-[340px] w-full bg-white dark:bg-[#1A1A1C] border border-[#D1D5DB] dark:border-white/20 rounded-full px-4 cursor-text transition-all duration-300 hover:border-gray-400"
      >
        <Search className="h-5 w-5 text-[#A1A1AA] shrink-0" />
        
        <div className="flex-1 ml-3 h-full flex items-center overflow-hidden">
          <span className={`text-[14px] font-medium text-[#A1A1AA] whitespace-nowrap transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
            {phrases[phraseIndex]}
          </span>
        </div>

        <div className="flex items-center shrink-0 ml-2">
          <span className="text-[14px] font-medium text-[#A1A1AA] tracking-wide">
            {shortcutLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

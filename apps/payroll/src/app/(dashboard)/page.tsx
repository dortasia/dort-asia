"use client";

import { useState } from "react";

import HomeCheckIn from "@/components/HomeCheckIn";
import HomeRow1 from "@/components/home/HomeRow1";
import HomeRow2 from "@/components/home/HomeRow2";
import HomeRow3 from "@/components/home/HomeRow3";

import HeaderSearchBar from "@/components/HeaderSearchBar";
import NotifyOverlay from "@/components/home/NotifyOverlay";
import LeaveOverlay from "@/components/home/LeaveOverlay";
import ClaimsOverlay from "@/components/home/ClaimsOverlay";
import EventsOverlay from "@/components/home/EventsOverlay";
import { useAppStore } from "@/store";

import "@/components/home/home-rows.css";

export default function Home() {
  const cachedSidebar = useAppStore((s) => s.cachedSidebar);
  const userName = cachedSidebar?.userProfile?.name?.split(" ")[0] || "there";
  
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isClaimsOpen, setIsClaimsOpen] = useState(false);
  const [isEventsOpen, setIsEventsOpen] = useState(false);

  if (isNotifyOpen) {
    return <NotifyOverlay onClose={() => setIsNotifyOpen(false)} />;
  }

  if (isLeaveOpen) {
    return <LeaveOverlay onClose={() => setIsLeaveOpen(false)} />;
  }

  if (isClaimsOpen) {
    return <ClaimsOverlay onClose={() => setIsClaimsOpen(false)} />;
  }

  if (isEventsOpen) {
    return <EventsOverlay onClose={() => setIsEventsOpen(false)} />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto page-scrollbar">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-8">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight">HOME</h1>
          <p className="text-[14px] text-gray-500 font-medium mt-1">Overview of your company</p>
        </div>
        
        <div className="flex items-center gap-4">
          <HeaderSearchBar />
        </div>
      </header>

      <main className="flex-1 px-6 pb-8">
        <HomeCheckIn />

        {/* ── Row 1: Notify · Events · Expiry Alerts ── */}
        <div className="mt-6">
          <HomeRow1 onOpenNotify={() => setIsNotifyOpen(true)} onOpenEvents={() => setIsEventsOpen(true)} />
        </div>

        {/* ── Row 2: My Tasks · Leave · Stats · Screen Time ── */}
        <HomeRow2 onOpenLeave={() => setIsLeaveOpen(true)} onOpenClaims={() => setIsClaimsOpen(true)} />

        {/* ── Row 3: Holidays · Chat · Pending Profiles ── */}
        <HomeRow3 />


      </main>
    </div>
  );
}

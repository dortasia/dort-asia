"use client";

import { useState } from "react";

import ClaimsLeavePendingRow from "@/components/home/ClaimsLeavePendingRow";
import ExpiryAlertsFullCard from "@/components/home/ExpiryAlertsFullCard";
import XentraStatCardsRow from "@/components/home/XentraStatCardsRow";
import XentraActivityTableSection from "@/components/home/XentraActivityTableSection";

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
      <header className="flex items-center justify-between p-4 font-sf">
        <div>
          <h1 className="text-[28px] font-medium text-[#111827] dark:text-white tracking-tight font-sans">Home</h1>
          <p className="text-[14px] font-medium text-[#6B7280] dark:text-gray-400 mt-0.5 leading-[20px] font-sf">Overview of your company</p>
        </div>
        
        <div className="flex items-center gap-4">
          <HeaderSearchBar />
        </div>
      </header>

      <main className="flex-1 p-4 pt-0">
        {/* ── 1. Stat Cards Row (Top Section) ── */}
        <XentraStatCardsRow />

        {/* ── 2. Full-Length Expiry Alerts Card ── */}
        <ExpiryAlertsFullCard />

        {/* ── 3. Claims · Leave · Pending Profiles Row ── */}
        <ClaimsLeavePendingRow
          onOpenClaims={() => setIsClaimsOpen(true)}
          onOpenLeave={() => setIsLeaveOpen(true)}
        />

        {/* ── 4. Pending Requests Table & Activity / Top Performers Section ── */}
        <XentraActivityTableSection />
      </main>
    </div>
  );
}

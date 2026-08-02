import { Sidebar } from "../../components/Sidebar";
import ScrollTracker from "../../components/ScrollTracker";
import ThemeProvider from "../../components/ThemeProvider";
import RealtimeAttendanceToast from "../../components/RealtimeAttendanceToast";
import SpotlightSearchModal from "../../components/SpotlightSearchModal";

import SamChatPanel from "../../components/home/SamChatPanel";

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider />
      <ScrollTracker />
      <SpotlightSearchModal />
      <Sidebar />
      <main className="flex-1 flex overflow-hidden py-3 pr-1 pl-1 bg-[#F9F9FB]">
        <div className="flex-1 bg-white dark:bg-[#0B0B0F] rounded-[24px] border border-gray-300 dark:border-white/5 overflow-y-auto overflow-x-hidden flex flex-col relative w-full h-full page-scrollbar" style={{ transform: 'translateZ(0)' }}>
          {children}
        </div>
        <RealtimeAttendanceToast />
        <SamChatPanel />
      </main>
    </>
  );
}

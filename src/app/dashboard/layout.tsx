import { Metadata } from "next";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50/50 text-gray-900">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 min-h-screen pt-16 md:pt-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

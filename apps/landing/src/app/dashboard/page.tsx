"use client";

export const dynamic = 'force-dynamic';

import { Navbar } from "@/components/layout/navbar";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-white relative">
      {/* Top Section / Header Navigation identical to Home Page */}
      <Navbar />

      {/* Empty page body under navbar */}
      <div className="w-full min-h-screen" />
    </main>
  );
}

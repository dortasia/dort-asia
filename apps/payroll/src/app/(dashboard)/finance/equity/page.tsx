"use client";

import React, { Suspense } from "react";
import EquityHolderProfileView from "@/components/finance/EquityHolderProfileView";

export default function EquityPage() {
  return (
    <div className="flex-1 flex flex-col h-full">
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#1C1C1E] text-gray-500 font-medium">
          Loading profile details...
        </div>
      }>
        <EquityHolderProfileView />
      </Suspense>
    </div>
  );
}


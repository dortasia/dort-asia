"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Shield01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";

export function AdminUnauthorizedView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200/80 flex items-center justify-center mb-6 text-red-600 shadow-2xs">
        <HugeiconsIcon icon={Shield01Icon} className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-red-50 text-red-700 border border-red-200 mb-3">
        <span>403 Forbidden</span>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
        Administrator Access Required
      </h1>

      <p className="text-gray-500 text-[14.5px] max-w-md mt-2.5 leading-relaxed">
        You do not have the required administrative permissions to view this control center. Access attempts are recorded and monitored.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-[14px] font-semibold transition-all shadow-2xs"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}

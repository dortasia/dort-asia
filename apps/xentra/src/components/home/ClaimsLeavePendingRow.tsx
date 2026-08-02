"use client";

import React from "react";

interface ClaimsLeavePendingRowProps {
  onOpenClaims?: () => void;
  onOpenLeave?: () => void;
}

export default function ClaimsLeavePendingRow({
  onOpenClaims,
  onOpenLeave,
}: ClaimsLeavePendingRowProps) {
  const pendingProfiles = [
    { name: "Krishna", progress: 85 },
    { name: "Sarah", progress: 65 },
    { name: "Alex", progress: 40 },
    { name: "David", progress: 20 },
    { name: "Emma", progress: 90 },
    { name: "Michael", progress: 55 },
    { name: "Sophia", progress: 35 },
    { name: "James", progress: 15 },
    { name: "Olivia", progress: 78 },
    { name: "Daniel", progress: 60 },
  ];

  return (
    <div className="flex flex-wrap lg:flex-nowrap gap-4 my-4 font-sf">
      {/* Claims Card */}
      <div
        className="relative bg-white dark:bg-[#1C1C22] rounded-[25px] border border-[#E5E7EB] dark:border-white/10 p-4 flex flex-col justify-between w-[140px] h-[150px] flex-shrink-0 overflow-hidden"
      >
        <p className="mt-0 text-[14px] font-semibold text-[#111827] dark:text-white tracking-normal z-10">
          Claims
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/claim_illustration.svg"
          alt="Claims"
          className="absolute bottom-0 right-0 w-[84px] h-[84px] object-contain select-none pointer-events-none"
        />
      </div>

      {/* Leave Card */}
      <div
        className="relative bg-white dark:bg-[#1C1C22] rounded-[25px] border border-[#E5E7EB] dark:border-white/10 p-4 flex flex-col justify-between w-[140px] h-[150px] flex-shrink-0 overflow-hidden"
      >
        <p className="mt-0 text-[14px] font-semibold text-[#111827] dark:text-white tracking-normal z-10">
          Leave
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/leave_illsutration.svg"
          alt="Leave"
          className="absolute bottom-0 right-0 w-[102px] h-[102px] object-contain select-none pointer-events-none"
        />
      </div>

      {/* Pending Profiles Card */}
      <div className="bg-white dark:bg-[#1C1C22] rounded-[25px] border border-[#E5E7EB] dark:border-white/10 p-5 flex flex-col justify-between flex-1 h-[150px] min-w-0">
        <p className="mt-0 text-[14px] font-semibold text-[#111827] dark:text-white tracking-normal">
          Pending Profiles
        </p>
        <div className="flex items-center gap-4 overflow-x-auto pb-1 page-scrollbar">
          {pendingProfiles.map((profile, index) => {
            const radius = 25;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset =
              circumference - (profile.progress / 100) * circumference;

            let strokeColor = "#22C55E"; // Green (>=75%)
            if (profile.progress < 30) {
              strokeColor = "#EF4444"; // Red (<30%)
            } else if (profile.progress < 50) {
              strokeColor = "#F59E0B"; // Orange (30-49%)
            } else if (profile.progress < 75) {
              strokeColor = "#EAB308"; // Yellow (50-74%)
            }

            return (
              <div key={index} className="flex flex-col items-center flex-shrink-0">
                <div className="relative w-[56px] h-[56px] flex items-center justify-center">
                  {/* Circular SVG Progress Ring */}
                  <svg
                    className="absolute inset-0 w-full h-full -rotate-90"
                    viewBox="0 0 56 56"
                  >
                    {/* Track Ring */}
                    <circle
                      cx="28"
                      cy="28"
                      r={radius}
                      stroke="#F3F4F6"
                      strokeWidth="3"
                      fill="none"
                    />
                    {/* Progress Ring */}
                    <circle
                      cx="28"
                      cy="28"
                      r={radius}
                      stroke={strokeColor}
                      strokeWidth="3"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="none"
                      className="transition-all duration-500 ease-out"
                    />
                  </svg>
                  {/* Inner Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#EFEFEF] dark:bg-white/10 z-10 overflow-hidden flex items-center justify-center border border-white dark:border-[#1C1C22]">
                    <svg
                      viewBox="0 0 24 24"
                      fill="#C7C7C7"
                      className="w-full h-full scale-125 translate-y-[2px]"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                </div>
                <span className="text-[12px] font-medium text-[#374151] dark:text-gray-300 mt-1">
                  {profile.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

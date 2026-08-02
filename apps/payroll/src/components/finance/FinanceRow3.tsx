"use client";

import React, { useState } from "react";
import Link from "next/link";
import "./finance.css";

interface FinanceRow3Props {
  onOpenEquity?: () => void;
  equityList?: any[];
}

const getInitials = (name: string) => {
  return name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
};

function MemberAvatar({ avatarUrl, name }: { avatarUrl?: string; name: string }) {
  const [error, setError] = useState(false);

  if (avatarUrl && !error) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    );
  }
  return <>{getInitials(name || "UN")}</>;
}

const getBadgeStyle = (index: number) => {
  if (index === 0) return "bg-[#FFF4E5] text-[#FF9500]"; // #1 Stakeholder
  if (index === 1) return "bg-[#E5F9E5] text-[#34C759]"; // #2 Stakeholder
  return "bg-[#E5F1FF] text-[#007AFF]"; // Others
};

export default function FinanceRow3({ onOpenEquity, equityList = [] }: FinanceRow3Props) {
  const displayEquity = (equityList || []).slice(0, 10);

  return (
    <div className="finance-row-3">
      <div className="flex justify-between items-center mb-3">
        <h2 className="finance-section-title">Equity Management</h2>
        <Link href="/finance/equity" className="text-[#007AFF] text-[13px] font-semibold hover:underline">View All</Link>
      </div>
      
      <div className="finance-equity-container">
        {displayEquity.map((member, idx) => (
          <div key={member.id || idx} className="finance-equity-card">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#E5F1FF] dark:bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center font-bold text-[15px] shadow-sm overflow-hidden shrink-0">
                  <MemberAvatar avatarUrl={member.avatarUrl} name={member.name} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900 dark:text-white leading-tight">{member.name}</h3>
                  <Link 
                    href={`/finance/equity?id=${member.id}`} 
                    className="text-[#007AFF] text-[11px] font-semibold hover:underline mt-0.5 inline-block"
                  >
                    View Details
                  </Link>
                </div>
              </div>
              <div className={`text-[10px] font-bold px-3 py-1.5 rounded-full ${getBadgeStyle(idx)}`}>
                #{idx + 1} {member.role || "Stake Holder"}
              </div>
            </div>
            
            <div className="flex justify-between items-end border-t border-gray-100 dark:border-gray-800 pt-3">
              <div>
                <div className="text-[10px] font-semibold text-gray-400 mb-1">Share Percentage</div>
                <div className="text-[#007AFF] text-[18px] font-bold">{(member.share || 0).toFixed(2)}%</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-semibold text-gray-400 mb-1">Total Investment</div>
                <div className="text-[#34C759] text-[18px] font-bold">
                  S$ {(member.investment || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ── Add Equity Member ── */}
        <button onClick={onOpenEquity} className="finance-add-equity-card flex flex-col gap-2 items-center justify-center">
          <span className="finance-add-equity-text">Add Equity Member</span>
        </button>
      </div>
    </div>
  );
}



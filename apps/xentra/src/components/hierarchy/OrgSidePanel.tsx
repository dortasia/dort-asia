"use client";
import React from "react";
import Link from "next/link";
import { X, ExternalLink, Mail, Phone, Building2, Briefcase, Circle } from "lucide-react";
import { OrgNode } from "@/lib/orgChartUtils";

function statusLabel(status: string) {
  switch (status?.toLowerCase()) {
    case "active":   return { label: "Active",   color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
    case "inactive": return { label: "Inactive", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
    default:         return { label: "On Leave", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
  }
}

import { getAvatarColor as getUniversalAvatarColor, getInitials as getAvatarInitials } from "@/utils/avatarColor";
function initials(name: string) {
  return getAvatarInitials(name);
}
function avatarBg(name: string) {
  return getUniversalAvatarColor(name).solid;
}

interface OrgSidePanelProps {
  member: OrgNode;
  employeeDbId?: string; // actual UUID in the employees table
  onClose: () => void;
}

export default function OrgSidePanel({ member, employeeDbId, onClose }: OrgSidePanelProps) {
  const { label, color } = statusLabel(member.status);
  const bg = member.avatar ? "transparent" : avatarBg(member.name);
  const childCount = member.children?.length ?? 0;

  return (
    <div className="absolute top-0 right-0 h-full w-[340px] bg-white dark:bg-[#1C1C1E] border-l border-gray-100 dark:border-gray-800 flex flex-col animate-in slide-in-from-right-8 duration-300 shadow-2xl z-50">

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2C2C35] transition-all"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex flex-col items-center pt-14 pb-6 px-6 text-center border-b border-gray-100 dark:border-gray-800 bg-gradient-to-b from-[#f0faf8] dark:from-[#0e1f1c] to-transparent">
        <div
          className="w-[88px] h-[88px] rounded-full overflow-hidden mb-4 shadow-lg border-4 border-white dark:border-[#1C1C1E] flex items-center justify-center text-white font-bold text-[24px]"
          style={{ backgroundColor: bg }}
        >
          {member.avatar
            ? <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
            : initials(member.name)
          }
        </div>

        <h2 className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight mb-1">
          {member.name}
        </h2>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium mb-3">
          {member.role}
        </p>

        <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${color}`}>
          {label}
        </span>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

        {member.department && (
          <Row icon={<Building2 className="w-4 h-4" />} label="Department" value={member.department} />
        )}
        {member.role && (
          <Row icon={<Briefcase className="w-4 h-4" />} label="Role" value={member.role} />
        )}
        {member.email && (
          <Row icon={<Mail className="w-4 h-4" />} label="Email" value={member.email} isLink href={`mailto:${member.email}`} />
        )}
        {member.mobile && (
          <Row icon={<Phone className="w-4 h-4" />} label="Mobile" value={member.mobile} isLink href={`tel:${member.mobile}`} />
        )}

        {/* Direct reports count */}
        {childCount > 0 && (
          <div className="mt-2 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-1">Direct Reports</p>
            <p className="text-[24px] font-black text-[#1FC6A4]">{childCount}</p>
          </div>
        )}
      </div>

      {/* Footer action */}
      {employeeDbId && employeeDbId !== "__virtual_root__" && (
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <Link
            href={`/employees/${employeeDbId}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#1FC6A4] hover:bg-[#18b093] text-white rounded-[10px] text-[13px] font-bold transition-colors shadow-sm"
          >
            View Full Profile <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

function Row({
  icon, label, value, isLink, href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLink?: boolean;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-[#1FC6A4] shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className={`text-[13px] font-semibold break-words ${isLink ? "text-[#007AFF] hover:underline cursor-pointer" : "text-gray-900 dark:text-white"}`}>
          {value}
        </p>
      </div>
    </div>
  );

  if (isLink && href) return <a href={href}>{content}</a>;
  return <div>{content}</div>;
}

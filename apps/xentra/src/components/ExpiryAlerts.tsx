import React from "react";
import { AlertTriangle, Send, Bell, MoreVertical, FileText } from "lucide-react";

const MOCK_ALERTS = [
  {
    id: 1,
    name: "KrishnaKumar P",
    role: "Software engineer",
    expiryType: "S Pass",
    docName: "Krishna_Spass.pdf",
    appliedDate: "12 DEC 2025",
    expiryDate: "12 DEC 2026",
    daysLeft: 60,
    urgent: true
  },
  {
    id: 2,
    name: "Sarah Jenkins",
    role: "Product Manager",
    expiryType: "Passport",
    docName: "Sarah_Passport.pdf",
    appliedDate: "15 JAN 2023",
    expiryDate: "15 JAN 2033",
    daysLeft: 145,
    urgent: false
  },
  {
    id: 3,
    name: "Michael Chen",
    role: "UI/UX Designer",
    expiryType: "Work Permit",
    docName: "MChen_WP_2024.pdf",
    appliedDate: "03 MAR 2024",
    expiryDate: "03 MAR 2026",
    daysLeft: 12,
    urgent: true
  },
  {
    id: 4,
    name: "Emma Watson",
    role: "HR Specialist",
    expiryType: "Visa",
    docName: "Emma_Visa_UK.pdf",
    appliedDate: "10 AUG 2025",
    expiryDate: "10 AUG 2026",
    daysLeft: 89,
    urgent: false
  },
  {
    id: 5,
    name: "David Lee",
    role: "Backend Dev",
    expiryType: "S Pass",
    docName: "DLee_Spass.pdf",
    appliedDate: "22 NOV 2024",
    expiryDate: "22 NOV 2026",
    daysLeft: 180,
    urgent: false
  }
];

export default function ExpiryAlerts() {
  return (
    <div className="mb-10">
      <h2 className="text-[16px] font-bold text-gray-900 mb-4 ml-1">Expiry Alerts</h2>
      
      <div className="bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        {/* Table Header */}
        <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1.4fr_1.4fr_1fr_1fr] items-center px-6 py-[18px] border-b border-[#E5E7EB] bg-white">
          <div className="text-[13px] font-semibold text-gray-900">Name</div>
          <div className="text-[13px] font-semibold text-gray-900 text-left">Expiry Type</div>
          <div className="text-[13px] font-semibold text-gray-900 text-left">Document</div>
          <div className="text-[13px] font-semibold text-gray-900 text-left">Applied Date</div>
          <div className="text-[13px] font-semibold text-gray-900 text-left">Expiry Date</div>
          <div className="text-[13px] font-semibold text-gray-900 text-left">Left Days</div>
          <div className="text-[13px] font-semibold text-gray-900 text-right">Actions</div>
        </div>

        {/* Table Body */}
        {MOCK_ALERTS.map((alert) => (
          <div 
            key={alert.id}
            className="grid grid-cols-[2fr_1.5fr_1.5fr_1.4fr_1.4fr_1fr_1fr] items-center px-6 py-4 border-b border-[#E5E7EB] bg-white hover:bg-gray-50 transition-colors last:border-b-0"
          >
            {/* Name & Role */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#E5E7EB] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-gray-900">{alert.name}</span>
                <span className="text-[11px] font-medium text-gray-400">{alert.role}</span>
              </div>
            </div>

            {/* Expiry Type */}
            <div className="flex items-center gap-2 text-left">
              {alert.urgent ? (
                <AlertTriangle className="h-4 w-4 text-[#F97316]" strokeWidth={2} />
              ) : (
                <FileText className="h-4 w-4 text-gray-400" strokeWidth={2} />
              )}
              <span className="text-[13px] font-medium text-gray-500">{alert.expiryType}</span>
            </div>

            {/* Document */}
            <div className="flex items-center gap-2 text-left">
              <div className="flex items-center justify-center bg-[#EF4444] rounded-[4px] w-[18px] h-[22px]">
                <span className="text-[8px] font-bold text-white tracking-tighter">PDF</span>
              </div>
              <span className="text-[13px] font-medium text-gray-400 truncate pr-2" title={alert.docName}>
                {alert.docName}
              </span>
            </div>

            {/* Applied Date */}
            <div className="text-[13px] font-semibold text-gray-400 text-left">{alert.appliedDate}</div>

            {/* Expiry Date */}
            <div className="text-[13px] font-semibold text-gray-400 text-left">{alert.expiryDate}</div>

            {/* Left Days */}
            <div className="text-[13px] font-semibold text-gray-400 text-left">
              <span className={alert.daysLeft < 30 ? "text-red-500 font-bold" : ""}>
                {alert.daysLeft} Days
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 text-gray-600">
              <button className="p-1 hover:bg-gray-100 rounded-md transition-colors"><Send className="h-4 w-4" /></button>
              <button className="p-1 hover:bg-gray-100 rounded-md transition-colors"><Bell className="h-4 w-4" /></button>
              <button className="p-1 hover:bg-gray-100 rounded-md transition-colors"><MoreVertical className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

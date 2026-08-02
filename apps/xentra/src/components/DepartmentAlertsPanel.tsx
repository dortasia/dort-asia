"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getAvatarColor, getInitials } from "@/utils/avatarColor";

type AlertItem = {
  id: string;
  employeeId: string;
  name: string;
  empId: string;
  role: string;
  type: "Passport" | "Work Pass";
  expiryDate: string;
  daysLeft: number;
  urgent: boolean;
};

export default function DepartmentAlertsPanel({
  isOpen,
  onClose,
  departmentId,
  departmentName,
}: {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  departmentName: string;
}) {
  const supabase = createClient();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [reminderSuccess, setReminderSuccess] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      loadAlerts();
    }
  }, [isOpen, departmentId]);

  useEffect(() => {
    // Collapse all alerts by default
    const initialExpanded: Record<string, boolean> = {};
    alerts.forEach(a => {
      initialExpanded[a.id] = false;
    });
    setExpandedIds(initialExpanded);
  }, [alerts]);

  const calculateDaysLeft = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    expiry.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const { data: emps, error } = await supabase
        .from("employees")
        .select("id, name, emp_id, avatar_url, role, passport_expiry_date, work_pass_expiry_date")
        .eq("department_id", departmentId);

      if (error) throw error;

      const alertList: AlertItem[] = [];
      if (emps && emps.length > 0) {
        emps.forEach((emp: any) => {
          if (emp.passport_expiry_date) {
            const daysLeft = calculateDaysLeft(emp.passport_expiry_date);
            if (daysLeft <= 180) {
              alertList.push({
                id: `${emp.id}-passport`,
                employeeId: emp.id,
                name: emp.name,
                empId: emp.emp_id || "EMP-N/A",
                role: emp.role || "Employee",
                type: "Passport",
                expiryDate: emp.passport_expiry_date,
                daysLeft: daysLeft,
                urgent: daysLeft < 30
              });
            }
          }
          if (emp.work_pass_expiry_date) {
            const daysLeft = calculateDaysLeft(emp.work_pass_expiry_date);
            if (daysLeft <= 180) {
              alertList.push({
                id: `${emp.id}-workpass`,
                employeeId: emp.id,
                name: emp.name,
                empId: emp.emp_id || "EMP-N/A",
                role: emp.role || "Employee",
                type: "Work Pass",
                expiryDate: emp.work_pass_expiry_date,
                daysLeft: daysLeft,
                urgent: daysLeft < 30
              });
            }
          }
        });
      }

      // Sort by urgency (fewer left days first)
      alertList.sort((a, b) => a.daysLeft - b.daysLeft);
      setAlerts(alertList);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSendReminder = async (alertItem: AlertItem) => {
    setRemindingId(alertItem.id);
    setReminderSuccess(null);
    try {
      const msg = `Your ${alertItem.type} is expiring on ${new Date(alertItem.expiryDate).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })} (${alertItem.daysLeft} days left). Please submit renewal documentation to HR.`;
      
      const { error } = await supabase
        .from("notifications")
        .insert({
          employee_id: alertItem.employeeId,
          title: `Document Expiration: ${alertItem.type}`,
          message: msg,
          type: "info",
          is_read: false
        });

      if (error) throw error;

      setReminderSuccess(`Reminder sent successfully to ${alertItem.name}.`);
      setTimeout(() => {
        setReminderSuccess(null);
      }, 3000);
    } catch (err: any) {
      window.alert("Failed to send reminder: " + err.message);
    } finally {
      setRemindingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        } bg-black/10 dark:bg-black/30`}
        onClick={handleClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-[100] w-full max-w-[440px] bg-white dark:bg-[#121217] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out ${
          isClosing ? "translate-x-full" : "translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
          <div>
            <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
              Expiry Alerts
            </h2>
            <p className="text-[12px] text-[#8E8E93] mt-0.5">
              Monitor passport and work pass renewal milestones for {departmentName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]"
          >
            <X size={20} />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 page-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" />
              <span className="text-[12px] text-gray-400 font-semibold">Checking alerts...</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div>
                <p className="text-[14px] font-bold text-gray-900 dark:text-white">All clear!</p>
                <p className="text-[12px] text-gray-400 mt-1">
                  All employee documents in this department are up-to-date.
                </p>
              </div>
            </div>
          ) : (
            alerts.map(alert => {
              const theme = getAvatarColor(alert.name);
              const initials = getInitials(alert.name);
              const isExpanded = !!expandedIds[alert.id];

              return (
                <div
                  key={alert.id}
                  className={`rounded-[20px] border transition-all flex flex-col bg-white dark:bg-[#1C1C1E] ${
                    alert.daysLeft < 30
                      ? "border-red-200 dark:border-red-950/40 bg-red-50/5 dark:bg-red-950/5"
                      : "border-gray-200 dark:border-[#2C2C35]"
                  }`}
                >
                  {/* Collapsed Header / Toggle button */}
                  <button
                    onClick={() => toggleExpand(alert.id)}
                    className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: theme.bg }}
                      >
                        {initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-bold text-gray-900 dark:text-white truncate">
                            {alert.name}
                          </span>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                            alert.type === 'Passport' ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'bg-[#AF52DE]/10 text-[#AF52DE]'
                          }`}>
                            {alert.type}
                          </span>
                        </div>
                        {!isExpanded && (
                          <span className="text-[11px] text-gray-500 dark:text-[#8E8E93] font-semibold truncate mt-0.5">
                            Expires on {new Date(alert.expiryDate).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5 shrink-0">
                      {!isExpanded && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          alert.daysLeft <= 0 ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400" :
                          alert.daysLeft < 30 ? "bg-red-50 dark:bg-red-950/30 text-red-500" :
                          "bg-amber-50 dark:bg-amber-950/30 text-amber-600"
                        }`}>
                          {alert.daysLeft <= 0 ? "Expired" : `${alert.daysLeft}d left`}
                        </span>
                      )}
                      <ChevronDown
                        className={`h-4.5 w-4.5 text-gray-400 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-4 pt-0 flex flex-col gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="w-full h-px bg-[#F2F2F7] dark:bg-[#2C2C35]/40 mb-1" />
                      
                      <div className="flex flex-col gap-3">
                        {/* 1. Employee Info */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-extrabold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider">
                            Employee
                          </span>
                          <div className="flex items-center gap-2.5 mt-0.5">
                            <div
                              className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm"
                              style={{ backgroundColor: theme.bg }}
                            >
                              {initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[12.5px] font-bold text-gray-900 dark:text-white leading-tight truncate">
                                {alert.name}
                              </span>
                              <span className="text-[10px] text-[#86868B] font-semibold mt-0.5">
                                {alert.empId} • {alert.role}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Alert Details */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-extrabold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider">
                            Alert Details
                          </span>
                          <div className="text-[12.5px] font-bold text-gray-900 dark:text-white mt-0.5">
                            {alert.type} Expiration
                          </div>
                        </div>

                        {/* 3. Date & Left Days */}
                        <div className="flex gap-4">
                          <div className="flex flex-col gap-1 flex-1">
                            <span className="text-[10px] font-extrabold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider">
                              Expiry Date
                            </span>
                            <span className="text-[12.5px] font-bold text-gray-900 dark:text-white">
                              {new Date(alert.expiryDate).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 flex-1">
                            <span className="text-[10px] font-extrabold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider">
                              Time Remaining
                            </span>
                            <span className={`text-[12.5px] font-bold ${
                              alert.daysLeft <= 0 ? "text-red-600 dark:text-red-400" :
                              alert.daysLeft < 30 ? "text-red-500" :
                              "text-amber-500"
                            }`}>
                              {alert.daysLeft <= 0 ? "Expired" : `${alert.daysLeft} Days Left`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Send Reminder button */}
                      <div className="flex justify-end gap-2 border-t border-gray-50 dark:border-[#2C2C35]/30 pt-3 mt-1">
                        <button
                          onClick={() => handleSendReminder(alert)}
                          disabled={remindingId !== null}
                          className="h-8 px-4 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-lg text-[12px] font-bold transition-all disabled:opacity-50 flex items-center justify-center min-w-[110px]"
                        >
                          {remindingId === alert.id ? (
                            <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            "Send Reminder"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {reminderSuccess && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-2xl text-[13px] font-semibold border border-blue-100 dark:border-blue-900/30 animate-in fade-in slide-in-from-bottom-2">
              <span>{reminderSuccess}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
          <button
            onClick={handleClose}
            className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] transition-colors rounded-[16px] text-white text-[15px] font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

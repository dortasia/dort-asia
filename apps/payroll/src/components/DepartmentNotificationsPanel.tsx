"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getAvatarColor, getInitials } from "@/utils/avatarColor";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: "transfer_out" | "transfer_in" | "supervisor" | "info" | "event";
  employee_id: string;
  employee_name: string;
  emp_id: string;
  target_dept_name?: string;
  target_dept_id?: string;
  source_dept_name?: string;
  source_dept_id?: string;
  status: "pending" | "approved" | "rejected" | "completed";
  created_at: string;
};

export default function DepartmentNotificationsPanel({
  isOpen,
  onClose,
  departmentId,
  departmentName,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  departmentName: string;
  onSuccess: () => void;
}) {
  const supabase = createClient();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Show all notifications collapsed/shrunk by default
    const initialExpanded: Record<string, boolean> = {};
    notifications.forEach(n => {
      initialExpanded[n.id] = false;
    });
    setExpandedIds(initialExpanded);
  }, [notifications]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Load notifications (including real-time database query and mock fallback requests)
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      loadNotifications();
    }
  }, [isOpen, departmentId]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // 1. Fetch real notifications from database
      const { data: dbNotifs } = await supabase
        .from("notifications")
        .select("*, employees(name, emp_id, department_id)")
        .order("created_at", { ascending: false });

      // Convert database notifications if any exist
      let mapped: NotificationItem[] = [];
      if (dbNotifs && dbNotifs.length > 0) {
        mapped = dbNotifs.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type === "event" ? "event" : "info",
          employee_id: n.employee_id,
          employee_name: n.employees?.name || "Employee",
          emp_id: n.employees?.emp_id || "EMP-N/A",
          status: n.is_read ? "completed" : "pending",
          created_at: n.created_at,
        }));
      }

      // Set notifications from database mapping
      setNotifications(mapped);
    } catch (err) {
      console.error("Failed to load notifications:", err);
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

  // Perform database actions when approving/accepting or rejecting requests
  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActioningId(id);
    setActionSuccess(null);

    try {
      if (id === "mock-req-1") {
        // Transfer Outgoing Employee to Marketing
        if (action === "approve") {
          // Find Marketing department id
          const { data: dept } = await supabase
            .from("departments")
            .select("id")
            .eq("name", "Marketing Department")
            .maybeSingle();

          // Find employee Millie Bobbie Brown
          const { data: emp } = await supabase
            .from("employees")
            .select("id")
            .eq("name", "Millie Bobbie Brown")
            .maybeSingle();

          if (emp && dept) {
            await supabase
              .from("employees")
              .update({ department_id: dept.id })
              .eq("id", emp.id);
          }
          setActionSuccess("Approved! Millie Bobbie Brown has been transferred to Marketing.");
        } else {
          setActionSuccess("Rejected. Millie Bobbie Brown will remain in the current department.");
        }
      } else if (id === "mock-req-2") {
        // Transfer Incoming Employee into current department
        if (action === "approve") {
          // Find employee Raja Raja
          const { data: emp } = await supabase
            .from("employees")
            .select("id")
            .eq("name", "Raja Raja")
            .maybeSingle();

          if (emp) {
            await supabase
              .from("employees")
              .update({ department_id: departmentId })
              .eq("id", emp.id);
          }
          setActionSuccess(`Accepted! Raja Raja has been transferred to ${departmentName}.`);
        } else {
          setActionSuccess("Declined. Raja Raja will remain in the Engineering Department.");
        }
      } else {
        // Real database notification
        await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", id);
        setActionSuccess(`Request ${action === "approve" ? "accepted" : "declined"} successfully.`);
      }

      // Update state locally
      setNotifications(prev =>
        prev.map(n =>
          n.id === id
            ? { ...n, status: action === "approve" ? "completed" : "rejected" }
            : n
        )
      );

      // Refresh data on parent page
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      alert("Failed to complete request action: " + err.message);
    } finally {
      setActioningId(null);
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

      {/* Slide-over side panel */}
      <div
        className={`fixed inset-y-0 right-0 z-[100] w-full max-w-[440px] bg-white dark:bg-[#121217] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out ${
          isClosing ? "translate-x-full" : "translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
          <div>
            <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
              Department Requests
            </h2>
            <p className="text-[12px] text-[#8E8E93] mt-0.5">
              Review and manage pending employee transfers and internal requests
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
              <span className="text-[12px] text-gray-400 font-semibold">Loading requests...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div>
                <p className="text-[14px] font-bold text-gray-900 dark:text-white">All caught up!</p>
                <p className="text-[12px] text-gray-400 mt-1">No pending requests at this moment.</p>
              </div>
            </div>
          ) : (
            notifications.map(notif => {
              const theme = getAvatarColor(notif.employee_name);
              const initials = getInitials(notif.employee_name);
              const isExpanded = !!expandedIds[notif.id];

              return (
                <div
                  key={notif.id}
                  className={`rounded-[20px] border transition-all flex flex-col bg-white dark:bg-[#1C1C1E] ${
                    notif.status === "pending"
                      ? "border-gray-200 dark:border-[#2C2C35]"
                      : "border-gray-100 dark:border-[#2C2C35]/50 opacity-75"
                  }`}
                >
                  {/* Collapsed Header / Toggle button */}
                  <button
                    onClick={() => toggleExpand(notif.id)}
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
                            {notif.employee_name}
                          </span>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                            notif.type === 'transfer_out' ? 'bg-[#007AFF]/10 text-[#007AFF]' :
                            notif.type === 'transfer_in' ? 'bg-[#AF52DE]/10 text-[#AF52DE]' :
                            notif.type === 'supervisor' ? 'bg-[#FF9500]/10 text-[#FF9500]' :
                            'bg-gray-100 dark:bg-[#2C2C35] text-gray-500 dark:text-gray-400'
                          }`}>
                            {notif.type === 'transfer_out' && 'Transfer Out'}
                            {notif.type === 'transfer_in' && 'Transfer In'}
                            {notif.type === 'supervisor' && 'Supervisor'}
                            {notif.type === 'info' && 'Announcement'}
                            {notif.type === 'event' && 'Event'}
                          </span>
                        </div>
                        {!isExpanded && (
                          <span className="text-[11px] text-gray-500 dark:text-[#8E8E93] font-semibold truncate mt-0.5 max-w-[240px]">
                            {notif.message}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5 shrink-0">
                      {notif.status !== "pending" && !isExpanded && (
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            notif.status === "completed"
                              ? "bg-[#34C759]/10 text-[#34C759]"
                              : "bg-[#FF3B30]/10 text-[#FF3B30]"
                          }`}
                        >
                          {notif.status === "completed" ? "Approved" : "Rejected"}
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
                      
                      {/* Card Details: Requested Person, Sender, Requested For */}
                      <div className="flex flex-col gap-3.5">
                        {/* 1. Requested Person */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-extrabold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider">
                            Requested Person
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
                                {notif.employee_name}
                              </span>
                              <span className="text-[10px] text-[#86868B] font-semibold mt-0.5">
                                {notif.emp_id}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Sender Detail */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-extrabold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider">
                            Sender Detail
                          </span>
                          <div className="text-[12.5px] font-bold text-gray-700 dark:text-gray-300 mt-0.5">
                            {notif.type === "transfer_in"
                              ? (notif.source_dept_name || "Engineering Department")
                              : notif.type === "info" || notif.type === "event"
                              ? "System Administrator"
                              : `${notif.employee_name} (Self)`}
                          </div>
                        </div>

                        {/* 3. Requested For */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-extrabold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider">
                            Requested For
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[12.5px] font-bold text-gray-900 dark:text-white">
                              {notif.type === 'transfer_out' && `Transfer to ${notif.target_dept_name || "Marketing Department"}`}
                              {notif.type === 'transfer_in' && `Transfer to ${departmentName}`}
                              {notif.type === 'supervisor' && 'Reporting Manager Update'}
                              {notif.type === 'info' && notif.title}
                              {notif.type === 'event' && notif.title}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Reason/Message Box */}
                      {notif.message && (
                        <div className="bg-gray-50 dark:bg-[#2C2C35]/30 rounded-xl p-3 border border-gray-100 dark:border-transparent mt-1">
                          <span className="text-[10px] font-extrabold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider block mb-1">
                            Reason / Message
                          </span>
                          <p className="text-[12px] text-gray-600 dark:text-gray-400 font-semibold leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      )}

                      {/* Request State / Action buttons */}
                      <div className="flex items-center justify-between gap-4 mt-1 border-t border-gray-50 dark:border-[#2C2C35]/30 pt-3">
                        <span className="text-[11px] text-[#86868B] font-semibold">
                          {new Date(notif.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          - {new Date(notif.created_at).toLocaleDateString([], { day: "numeric", month: "short" })}
                        </span>

                        {notif.status === "pending" ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(notif.id, "reject");
                              }}
                              disabled={actioningId !== null}
                              className="h-8 px-4 bg-gray-50 hover:bg-red-50 dark:bg-[#2C2C35]/40 text-gray-600 hover:text-red-500 rounded-lg text-[12px] font-bold transition-all disabled:opacity-50"
                            >
                              Decline
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(notif.id, "approve");
                              }}
                              disabled={actioningId !== null}
                              className="h-8 px-4 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-lg text-[12px] font-bold transition-all disabled:opacity-50 flex items-center justify-center min-w-[70px]"
                            >
                              {actioningId === notif.id ? (
                                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                "Accept"
                              )}
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              notif.status === "completed"
                                ? "bg-[#34C759]/10 text-[#34C759]"
                                : "bg-[#FF3B30]/10 text-[#FF3B30]"
                            }`}
                          >
                            {notif.status === "completed" ? "Approved" : "Rejected"}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {actionSuccess && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-2xl text-[13px] font-semibold border border-blue-100 dark:border-blue-900/30 animate-in fade-in slide-in-from-bottom-2">
              <span>{actionSuccess}</span>
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

"use client";

import React, { useState, useEffect } from "react";
import { X, Check, ArrowLeft, Users, ArrowUpDown, Calendar, ChevronDown, Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getAvatarColor, getInitials } from "@/utils/avatarColor";

type Employee = {
  id: string;
  name: string;
  role: string;
  emp_id: string | null;
  avatar_url: string | null;
  department_id: string | null;
};

type Department = {
  id: string;
  name: string;
};

export default function DepartmentActionsPanel({
  isOpen,
  onClose,
  departmentId,
  departmentEmployees,
  onSuccess,
  initialScreen = "menu",
  initialEmployeeId = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  departmentEmployees: Employee[];
  onSuccess: () => void;
  initialScreen?: "menu" | "reportee" | "transfer" | "event";
  initialEmployeeId?: string;
}) {
  const supabase = createClient();

  const [activeScreen, setActiveScreen] = useState<"menu" | "reportee" | "transfer" | "event">("menu");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // General company data
  const [allCompanyEmployees, setAllCompanyEmployees] = useState<Employee[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);

  // Search/dropdown states
  const [openSelectId, setOpenSelectId] = useState<string | null>(null);
  const [selectSearchQuery, setSelectSearchQuery] = useState("");

  // Reportee Form States
  const [reporteeEmployeeId, setReporteeEmployeeId] = useState("");
  const [newManagerId, setNewManagerId] = useState("");

  // Transfer Form States
  const [transferEmployeeIds, setTransferEmployeeIds] = useState<string[]>([]);
  const [targetDeptId, setTargetDeptId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferDate, setTransferDate] = useState("");

  // Event Form States
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventDesc, setEventDesc] = useState("");

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setActiveScreen(initialScreen || "menu");
      setError("");
      setSuccess(false);
      // Reset forms
      setReporteeEmployeeId(initialScreen === "reportee" ? initialEmployeeId : "");
      setNewManagerId("");
      setTransferEmployeeIds(initialScreen === "transfer" && initialEmployeeId ? [initialEmployeeId] : []);
      setTargetDeptId("");
      setTransferReason("");
      setTransferDate("");
      setEventTitle("");
      setEventDate("");
      setEventTime("");
      setEventDesc("");

      fetchCompanyData();
    }
  }, [isOpen]);

  const fetchCompanyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get company_id (usually user.id for super admins)
      const companyId = user.id;

      // Fetch all employees in the company
      const { data: empData } = await supabase
        .from("employees")
        .select("id, name, role, emp_id, avatar_url, department_id")
        .eq("company_id", companyId)
        .order("name");
      
      if (empData) setAllCompanyEmployees(empData);

      // Fetch all departments in the company
      const { data: deptData } = await supabase
        .from("departments")
        .select("id, name")
        .eq("company_id", companyId)
        .order("name");

      if (deptData) setAllDepartments(deptData);
    } catch (err) {
      console.error("Failed to load company data:", err);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleSaveReportee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporteeEmployeeId || !newManagerId) {
      setError("Please select both the employee and their new manager.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { error: updateErr } = await supabase
        .from("employees")
        .update({ manager_id: newManagerId })
        .eq("id", reporteeEmployeeId);

      if (updateErr) throw updateErr;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
        handleClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to update employee reportee.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmployeeSelection = (id: string) => {
    setTransferEmployeeIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 10) {
        setError("Maximum 10 employees can be selected for transfer at once.");
        return prev;
      }
      setError("");
      return [...prev, id];
    });
  };

  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transferEmployeeIds.length === 0 || !targetDeptId) {
      setError("Please select the target department and at least one employee.");
      return;
    }
    if (targetDeptId === departmentId) {
      setError("Target department must be different from current department.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // 1. Perform department update for all selected employees
      const { error: updateErr } = await supabase
        .from("employees")
        .update({ 
          department_id: targetDeptId,
        })
        .in("id", transferEmployeeIds);

      if (updateErr) throw updateErr;

      // 2. Log event/notifications for all transferred employees
      const insertPayloads = transferEmployeeIds.map(empId => ({
        employee_id: empId,
        title: "Department Transfer",
        message: `Transferred to department ${allDepartments.find(d => d.id === targetDeptId)?.name || ""}. Effective: ${transferDate || "Immediately"}. Reason: ${transferReason || "None"}`,
        type: "info",
        is_read: false
      }));

      if (insertPayloads.length > 0) {
        const { error: insertErr } = await supabase
          .from("notifications")
          .insert(insertPayloads);
        if (insertErr) throw insertErr;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
        handleClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to transfer employees.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      setError("Event title is required.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // Create event notice via notifications for all department employees
      const insertPayloads = departmentEmployees.map(emp => ({
        employee_id: emp.id,
        title: `Event: ${eventTitle.trim()}`,
        message: `A department event has been scheduled. Date: ${eventDate || "TBD"} at ${eventTime || "TBD"}.\nDescription: ${eventDesc || "No details provided"}`,
        type: "event",
        is_read: false
      }));

      if (insertPayloads.length > 0) {
        const { error: insertErr } = await supabase
          .from("notifications")
          .insert(insertPayloads);
        if (insertErr) throw insertErr;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
        handleClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to schedule event.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Custom search-select component helper
  const renderSearchSelect = ({
    label,
    id,
    value,
    options,
    placeholder = "Select employee...",
    onSelect
  }: {
    label: string;
    id: string;
    value: string;
    options: { id: string; name: string; avatar_url?: string | null; emp_id?: string | null }[];
    placeholder?: string;
    onSelect: (selectedId: string) => void;
  }) => {
    const selected = options.find(o => o.id === value);
    const isOpenSelect = openSelectId === id;

    return (
      <div className="flex flex-col gap-2 relative" onClick={(e) => e.stopPropagation()}>
        <label className="text-[13px] font-bold text-gray-900 dark:text-white">{label}</label>

        {isOpenSelect ? (
          <div className="w-full relative">
            <input 
              type="text"
              value={selectSearchQuery}
              onChange={(e) => setSelectSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full h-[52px] px-4 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#007AFF] rounded-[14px] text-[13.5px] font-bold outline-none shadow-sm shadow-[#007AFF]/10 pr-10"
              autoFocus
            />
            <ChevronDown 
              className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 rotate-180 cursor-pointer" 
              onClick={() => setOpenSelectId(null)}
            />
          </div>
        ) : (
          <button 
            type="button"
            onClick={() => {
              setOpenSelectId(id);
              setSelectSearchQuery("");
            }}
            className={`w-full flex items-center justify-between px-4 py-3.5 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] hover:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors`}
          >
            {selected ? (
              <div className="flex items-center gap-3">
                {selected.avatar_url ? (
                  <img 
                    src={selected.avatar_url} 
                    alt={selected.name}
                    className="h-6 w-6 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div 
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
                    style={{ backgroundColor: getAvatarColor(selected.name).bg }}
                  >
                    {getInitials(selected.name)}
                  </div>
                )}
                <span className="text-[13.5px] font-bold truncate">
                  {selected.name} {selected.emp_id ? `(${selected.emp_id})` : ""}
                </span>
              </div>
            ) : (
              <span className="text-[13.5px] font-medium text-gray-400">{placeholder}</span>
            )}
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
        )}

        {isOpenSelect && (
          <div className="p-4 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-2xl shadow-lg flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200 z-50 absolute top-[85px] left-0 right-0">
            <div className="max-h-[160px] overflow-y-auto page-scrollbar flex flex-col gap-1">
              {(() => {
                const query = selectSearchQuery.toLowerCase().trim();
                const filtered = options.filter(o => 
                  o.name.toLowerCase().includes(query) || (o.emp_id || "").toLowerCase().includes(query)
                );

                if (filtered.length === 0) {
                  return <span className="text-[12px] text-gray-400 py-3 text-center">No matches found</span>;
                }

                return filtered.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onSelect(opt.id);
                      setOpenSelectId(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      value === opt.id 
                        ? 'bg-[#007AFF]/10 text-[#007AFF] font-bold' 
                        : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {opt.avatar_url ? (
                        <img 
                          src={opt.avatar_url} 
                          alt={opt.name}
                          className="h-6 w-6 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div 
                          className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 text-white"
                          style={{ backgroundColor: getAvatarColor(opt.name).bg }}
                        >
                          {getInitials(opt.name)}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-[12.5px] font-bold text-[#1d1d1f] dark:text-white leading-tight">
                          {opt.name}
                        </span>
                        {opt.emp_id && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                            {opt.emp_id}
                          </span>
                        )}
                      </div>
                    </div>
                    {value === opt.id && <Check className="h-3.5 w-3.5 text-[#007AFF]" />}
                  </button>
                ));
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Custom search-multi-select component helper for transferring multiple employees
  const renderSearchMultiSelect = ({
    label,
    id,
    selectedIds,
    options,
    placeholder = "Select employees...",
    onToggle
  }: {
    label: string;
    id: string;
    selectedIds: string[];
    options: Employee[];
    placeholder?: string;
    onToggle: (id: string) => void;
  }) => {
    const isOpenSelect = openSelectId === id;

    return (
      <div className="flex flex-col gap-2 relative" onClick={(e) => e.stopPropagation()}>
        <label className="text-[13px] font-bold text-gray-900 dark:text-white">{label}</label>

        {isOpenSelect ? (
          <div className="w-full relative">
            <input 
              type="text"
              value={selectSearchQuery}
              onChange={(e) => setSelectSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full h-[52px] px-4 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#007AFF] rounded-[14px] text-[13.5px] font-bold outline-none shadow-sm shadow-[#007AFF]/10 pr-10"
              autoFocus
            />
            <ChevronDown 
              className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 rotate-180 cursor-pointer" 
              onClick={() => setOpenSelectId(null)}
            />
          </div>
        ) : (
          <button 
            type="button"
            onClick={() => {
              setOpenSelectId(id);
              setSelectSearchQuery("");
            }}
            className={`w-full flex items-center justify-between px-4 py-3.5 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] hover:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors`}
          >
            <span className="text-[13.5px] font-medium text-gray-700 dark:text-gray-300">
              {selectedIds.length > 0 ? `${selectedIds.length} employee${selectedIds.length > 1 ? 's' : ''} selected` : placeholder}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
        )}

        {/* Selected Pills */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {selectedIds.map(id => {
              const emp = options.find(o => o.id === id);
              if (!emp) return null;
              return (
                <div key={id} className="flex items-center gap-1.5 bg-[#007AFF]/10 text-[#007AFF] px-3 py-1.5 rounded-xl text-[12px] font-bold">
                  <span className="truncate max-w-[120px]">{emp.name}</span>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); onToggle(id); }}
                    className="hover:text-red-500 transition-colors focus:outline-none"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {isOpenSelect && (
          <div className="p-4 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-2xl shadow-lg flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200 z-50 absolute top-[85px] left-0 right-0">
            <div className="max-h-[160px] overflow-y-auto page-scrollbar flex flex-col gap-1">
              {(() => {
                const query = selectSearchQuery.toLowerCase().trim();
                const filtered = options.filter(o => 
                  o.name.toLowerCase().includes(query) || (o.emp_id || "").toLowerCase().includes(query)
                );

                if (filtered.length === 0) {
                  return <span className="text-[12px] text-gray-400 py-3 text-center">No matches found</span>;
                }

                return filtered.map(opt => {
                  const isChecked = selectedIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onToggle(opt.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        isChecked 
                          ? 'bg-[#007AFF]/5 text-[#007AFF] font-bold' 
                          : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {opt.avatar_url ? (
                          <img 
                            src={opt.avatar_url} 
                            alt={opt.name}
                            className="h-6 w-6 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div 
                            className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 text-white"
                            style={{ backgroundColor: getAvatarColor(opt.name).bg }}
                          >
                            {getInitials(opt.name)}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-[12.5px] font-bold text-[#1d1d1f] dark:text-white leading-tight">
                            {opt.name}
                          </span>
                          {opt.emp_id && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                              {opt.emp_id}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-all ${
                        isChecked ? 'border-[#007AFF] bg-[#007AFF] text-white' : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isChecked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'} bg-black/10 dark:bg-black/30`}
        onClick={handleClose}
      />

      {/* Side Panel */}
      <div 
        onClick={() => setOpenSelectId(null)}
        className={`fixed inset-y-0 right-0 z-[100] w-full max-w-[440px] bg-white dark:bg-[#121217] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out ${isClosing ? 'translate-x-full' : 'translate-x-0'}`}
      >
        
        {/* ── SCREEN 1: Action Menu ── */}
        {activeScreen === "menu" && (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
              <div>
                <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
                  Quick Actions
                </h2>
                <p className="text-[12px] text-[#8E8E93] mt-0.5">Choose an administrative task to perform</p>
              </div>
              <button onClick={handleClose} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 page-scrollbar">
              <button 
                onClick={() => setActiveScreen("reportee")}
                className="flex items-center justify-between p-5 bg-white dark:bg-[#1C1C1E] hover:bg-[#F8F9FA] dark:hover:bg-[#2C2C35] rounded-2xl text-left border border-[#E5E7EB] dark:border-[#2C2C35] transition-all"
              >
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-gray-900 dark:text-white">Change Employee Reportee</span>
                  <span className="text-[12px] font-medium text-gray-500 mt-1">Reassign manager or reporting line of department employees</span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90" />
              </button>

              <button 
                onClick={() => setActiveScreen("transfer")}
                className="flex items-center justify-between p-5 bg-white dark:bg-[#1C1C1E] hover:bg-[#F8F9FA] dark:hover:bg-[#2C2C35] rounded-2xl text-left border border-[#E5E7EB] dark:border-[#2C2C35] transition-all"
              >
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-gray-900 dark:text-white">Request Employee Transfer</span>
                  <span className="text-[12px] font-medium text-gray-500 mt-1">Move employee to a different company department</span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90" />
              </button>

              <button 
                onClick={() => setActiveScreen("event")}
                className="flex items-center justify-between p-5 bg-white dark:bg-[#1C1C1E] hover:bg-[#F8F9FA] dark:hover:bg-[#2C2C35] rounded-2xl text-left border border-[#E5E7EB] dark:border-[#2C2C35] transition-all"
              >
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-gray-900 dark:text-white">Create Event</span>
                  <span className="text-[12px] font-medium text-gray-500 mt-1">Schedule meetings, milestones or training events</span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90" />
              </button>
            </div>
            
            <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
              <button
                onClick={handleClose}
                className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] transition-colors rounded-[16px] text-white text-[15px] font-bold"
              >
                Close
              </button>
            </div>
          </>
        )}

        {/* ── SCREEN 2: Change Reportee Form ── */}
        {activeScreen === "reportee" && (
          <form onSubmit={handleSaveReportee} className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setActiveScreen("menu")}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-lg text-gray-500 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Change Reportee</h2>
                  <p className="text-[12px] text-[#8E8E93] mt-0.5">Reassign manager and reporting line</p>
                </div>
              </div>
              <button type="button" onClick={handleClose} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 page-scrollbar">
              {renderSearchSelect({
                label: "Select Department Employee",
                id: "rep-employee",
                value: reporteeEmployeeId,
                options: departmentEmployees,
                placeholder: "Select employee...",
                onSelect: setReporteeEmployeeId
              })}

              {renderSearchSelect({
                label: "Select New Manager",
                id: "rep-manager",
                value: newManagerId,
                options: allCompanyEmployees.filter(e => e.id !== reporteeEmployeeId),
                placeholder: "Select manager...",
                onSelect: setNewManagerId
              })}
            </div>

            <div className="p-6 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">{error}</div>}
              {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-semibold border border-green-100 flex items-center gap-2"><Check size={16}/> Manager updated successfully</div>}
              
              <button
                type="submit"
                disabled={loading || !reporteeEmployeeId || !newManagerId}
                className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-[16px] text-[15px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Change Reportee"
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── SCREEN 3: Request Transfer Form ── */}
        {activeScreen === "transfer" && (
          <form onSubmit={handleSaveTransfer} className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setActiveScreen("menu")}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-lg text-gray-500 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Request Transfer</h2>
                  <p className="text-[12px] text-[#8E8E93] mt-0.5">Transfer employee to other department</p>
                </div>
              </div>
              <button type="button" onClick={handleClose} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 page-scrollbar">
              {renderSearchSelect({
                label: "Select Target Department",
                id: "tr-dept",
                value: targetDeptId,
                options: allDepartments.filter(d => d.id !== departmentId),
                placeholder: "Select department...",
                onSelect: setTargetDeptId
              })}

              {targetDeptId ? (
                renderSearchMultiSelect({
                  label: "Select Employees (up to 10)",
                  id: "tr-employees",
                  selectedIds: transferEmployeeIds,
                  options: departmentEmployees,
                  placeholder: "Select employees to transfer...",
                  onToggle: handleToggleEmployeeSelection
                })
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-gray-400 dark:text-gray-500">Select Employees</label>
                  <div className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 dark:bg-[#1C1C1E] text-gray-400 border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[14px] text-[13.5px] font-medium opacity-65 cursor-not-allowed">
                    Select target department first...
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-gray-900 dark:text-white">Reason for Transfer</label>
                <textarea
                  value={transferReason}
                  onChange={e => setTransferReason(e.target.value)}
                  className="w-full min-h-[80px] px-4 py-3 bg-gray-50 dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors resize-none"
                  placeholder="Provide reason for transfer..."
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-gray-900 dark:text-white">Effective Date</label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={e => setTransferDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors"
                />
              </div>
            </div>

            <div className="p-6 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">{error}</div>}
              {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-semibold border border-green-100 flex items-center gap-2"><Check size={16}/> Employee transfer completed</div>}
              
              <button
                type="submit"
                disabled={loading || transferEmployeeIds.length === 0 || !targetDeptId}
                className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-[16px] text-[15px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  transferEmployeeIds.length > 1 
                    ? `Transfer ${transferEmployeeIds.length} Employees`
                    : "Transfer Employee"
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── SCREEN 4: Create Event Form ── */}
        {activeScreen === "event" && (
          <form onSubmit={handleSaveEvent} className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setActiveScreen("menu")}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-lg text-gray-500 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Create Event</h2>
                  <p className="text-[12px] text-[#8E8E93] mt-0.5">Create a new department event</p>
                </div>
              </div>
              <button type="button" onClick={handleClose} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 page-scrollbar">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-gray-900 dark:text-white">Event Title</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors"
                  placeholder="e.g. Monthly Review, Planning Meeting..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-gray-900 dark:text-white">Event Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-gray-900 dark:text-white">Event Time</label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={e => setEventTime(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-gray-900 dark:text-white">Description</label>
                <textarea
                  value={eventDesc}
                  onChange={e => setEventDesc(e.target.value)}
                  className="w-full min-h-[100px] px-4 py-3 bg-gray-50 dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors resize-none"
                  placeholder="Detail the event description, venue or link..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">{error}</div>}
              {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-semibold border border-green-100 flex items-center gap-2"><Check size={16}/> Event created successfully</div>}
              
              <button
                type="submit"
                disabled={loading || !eventTitle.trim()}
                className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-[16px] text-[15px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Create Event"
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </>
  );
}

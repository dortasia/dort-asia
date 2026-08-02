"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, Check, Users, Plus, Trash2, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function ApprovalFlowSettingsPage({ setActive }: { setActive?: (s: string) => void }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [userId, setUserId] = useState("");
  const [existingConfig, setExistingConfig] = useState<any>({});

  interface ApprovalLevel {
    level: number;
    role: string;
    approverType: "department_head" | "specific_role" | "specific_user";
    value: string;
  }

  const [approvalLevels, setApprovalLevels] = useState<ApprovalLevel[]>([
    { level: 1, role: "Department Head", approverType: "department_head", value: "" }
  ]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data: comp } = await supabase
        .from("company_settings")
        .select("attendance_config")
        .eq("company_id", user.id)
        .maybeSingle();

      if (comp) {
        setExistingConfig(comp.attendance_config || {});
        const pConfig = comp.attendance_config?.payroll_config || {};

        if (pConfig.approvalLevels && Array.isArray(pConfig.approvalLevels)) {
          setApprovalLevels(pConfig.approvalLevels);
        } else {
          setApprovalLevels([
            { level: 1, role: "Department Head", approverType: "department_head", value: "" }
          ]);
        }
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const newPayrollConfig = {
        ...(existingConfig.payroll_config || {}),
        approvalLevels
      };

      const updatedAttendanceConfig = {
        ...existingConfig,
        payroll_config: newPayrollConfig
      };

      const { error } = await supabase
        .from("company_settings")
        .update({
          attendance_config: updatedAttendanceConfig
        })
        .eq("company_id", userId);

      if (error) throw error;
      setExistingConfig(updatedAttendanceConfig);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error("Error saving approval settings:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  };

  const addApprovalLevel = () => {
    const nextLevel = approvalLevels.length + 1;
    setApprovalLevels(prev => [
      ...prev,
      { level: nextLevel, role: "Finance Director", approverType: "specific_role", value: "Finance Director" }
    ]);
  };

  const removeApprovalLevel = (index: number) => {
    if (approvalLevels.length <= 1) return;
    const filtered = approvalLevels.filter((_, i) => i !== index);
    const remapped = filtered.map((item, i) => ({
      ...item,
      level: i + 1
    }));
    setApprovalLevels(remapped);
  };

  const updateApprovalLevel = (index: number, fields: Partial<ApprovalLevel>) => {
    setApprovalLevels(prev => prev.map((item, i) => i === index ? { ...item, ...fields } : item));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-4xl animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setActive ? setActive("admin_payroll") : (window.location.href = "/settings?tab=admin_payroll")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-500"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[20px] font-bold text-gray-900 dark:text-white leading-tight">Payroll Approval Flow</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">Design multi-level steps required to release salary payments</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#121217] rounded-[24px] border border-[#E5E7EB] dark:border-[#2C2C35] p-6 md:p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">Approval Timelines Designer</h2>
          </div>
          <button
            onClick={addApprovalLevel}
            className="flex items-center gap-1.5 bg-[#007AFF] hover:bg-blue-600 text-white text-[12px] font-bold px-3.5 py-2 rounded-xl transition-all"
          >
            <Plus className="h-4 w-4" /> Add Level
          </button>
        </div>

        {/* Level Flow Timelines Designer */}
        <div className="flex flex-col gap-4 relative">
          {approvalLevels.map((lvl, index) => (
            <React.Fragment key={index}>
              <div className="bg-[#F8F9FA] dark:bg-[#1A1A1F] rounded-2xl p-4 border border-gray-200 dark:border-white/5 flex items-center justify-between gap-4 transition-all relative">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-[#121217] border border-gray-200 dark:border-white/10 text-[#007AFF] text-[13px] font-bold flex items-center justify-center shrink-0">
                    {lvl.level}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 dark:text-gray-500">Approver Type</span>
                      <select
                        value={lvl.approverType}
                        onChange={(e) => {
                          const type = e.target.value as any;
                          let defaultVal = "";
                          if (type === "specific_role") defaultVal = "Finance Director";
                          if (type === "department_head") defaultVal = "";
                          updateApprovalLevel(index, { 
                            approverType: type, 
                            value: defaultVal,
                            role: type === "department_head" ? "Department Head" : defaultVal 
                          });
                        }}
                        className="px-4 py-2.5 bg-white dark:bg-[#121217] border border-gray-200 dark:border-white/10 rounded-[12px] text-[13px] font-medium text-gray-900 dark:text-white outline-none focus:border-[#007AFF]"
                      >
                        <option value="department_head">Department Head</option>
                        <option value="specific_role">Specific Role</option>
                        <option value="specific_user">Specific User Email</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 dark:text-gray-500">Assignee</span>
                      {lvl.approverType === "department_head" ? (
                        <div className="px-4 py-2.5 text-[13px] font-medium text-gray-400 bg-gray-50 dark:bg-[#121217] border border-gray-200 dark:border-white/5 rounded-[12px]">
                          Auto-assigned to Head of Dept
                        </div>
                      ) : lvl.approverType === "specific_role" ? (
                        <select
                          value={lvl.value}
                          onChange={(e) => updateApprovalLevel(index, { value: e.target.value, role: e.target.value })}
                          className="px-4 py-2.5 bg-white dark:bg-[#121217] border border-gray-200 dark:border-white/10 rounded-[12px] text-[13px] font-medium text-gray-900 dark:text-white outline-none focus:border-[#007AFF]"
                        >
                          <option value="CEO">CEO</option>
                          <option value="CFO">CFO</option>
                          <option value="HR Manager">HR Manager</option>
                          <option value="Finance Director">Finance Director</option>
                          <option value="Operations Manager">Operations Manager</option>
                          <option value="Supervisor">Supervisor</option>
                        </select>
                      ) : (
                        <input
                          type="email"
                          value={lvl.value}
                          onChange={(e) => updateApprovalLevel(index, { value: e.target.value, role: `User: ${e.target.value}` })}
                          placeholder="approver@company.com"
                          className="px-4 py-2.5 bg-white dark:bg-[#121217] border border-gray-200 dark:border-white/10 rounded-[12px] text-[13px] font-medium text-gray-900 dark:text-white outline-none focus:border-[#007AFF]"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {approvalLevels.length > 1 && (
                  <button
                    onClick={() => removeApprovalLevel(index)}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-[10px] transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              {index < approvalLevels.length - 1 && (
                <div className="flex justify-center -my-2 z-10">
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center border border-gray-200 dark:border-white/10">
                    <ChevronLeft className="h-3 w-3 text-gray-400 -rotate-90" />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/5 mt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-[14px] transition-all ${
              saveStatus === 'success'
                ? 'bg-[#34C759] text-white'
                : saveStatus === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-[#007AFF] text-white hover:bg-blue-600 active:scale-95'
            }`}
          >
            {saving ? (
              <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
            ) : saveStatus === 'success' ? (
              <><Check className="h-4 w-4" /> Saved!</>
            ) : saveStatus === 'error' ? (
              'Error — try again'
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, Check, Zap } from "lucide-react";
import Link from "next/link";

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${on ? "bg-[#007AFF] dark:bg-white" : "bg-[#E5E5EA] dark:bg-[#3A3A3C]"}`}
    >
      <span
        className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white dark:bg-black shadow transition-transform duration-200 ${on ? "translate-x-6" : "translate-x-1"}`}
        style={{ height: 18, width: 18 }}
      />
    </button>
  );
}

export default function AttendanceIntegrationPage({ setActive }: { setActive?: (s: string) => void }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [userId, setUserId] = useState("");
  const [existingConfig, setExistingConfig] = useState<any>({});

  const [autoImport, setAutoImport] = useState(false);
  const [autoOT, setAutoOT] = useState(false);
  const [autoAbsent, setAutoAbsent] = useState(false);
  const [autoLate, setAutoLate] = useState(false);

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

        setAutoImport(pConfig.autoImport ?? false);
        setAutoOT(pConfig.autoOT ?? false);
        setAutoAbsent(pConfig.autoAbsent ?? false);
        setAutoLate(pConfig.autoLate ?? false);
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
        autoImport,
        autoOT,
        autoAbsent,
        autoLate,
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
      console.error("Error saving attendance settings:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-[20px] font-bold text-gray-900 dark:text-white leading-tight">Attendance Integration</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">Automate calculations between timesheet and payroll</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#121217] rounded-[24px] border border-[#E5E7EB] dark:border-[#2C2C35] p-6 md:p-8 flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-4">
          <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">Integration Triggers</h2>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5">
            <div className="flex flex-col gap-1 pr-4">
              <p className="text-[14px] font-semibold text-gray-900 dark:text-white">Auto Import Attendance</p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">Sync monthly clock-in data directly to the payroll dashboard</p>
            </div>
            <Toggle on={autoImport} onChange={() => setAutoImport(!autoImport)} />
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5">
            <div className="flex flex-col gap-1 pr-4">
              <p className="text-[14px] font-semibold text-gray-900 dark:text-white">Auto Calculate OT (Overtime)</p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">Process overtime multipliers dynamically based on approved shifts</p>
            </div>
            <Toggle on={autoOT} onChange={() => setAutoOT(!autoOT)} />
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5">
            <div className="flex flex-col gap-1 pr-4">
              <p className="text-[14px] font-semibold text-gray-900 dark:text-white">Auto Calculate Absent Days</p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">Deduct unpaid absences from the monthly salary computation</p>
            </div>
            <Toggle on={autoAbsent} onChange={() => setAutoAbsent(!autoAbsent)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1 pr-4">
              <p className="text-[14px] font-semibold text-gray-900 dark:text-white">Auto Calculate Late Penalties</p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">Deduct customized grace-period breach amounts automatically</p>
            </div>
            <Toggle on={autoLate} onChange={() => setAutoLate(!autoLate)} />
          </div>
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

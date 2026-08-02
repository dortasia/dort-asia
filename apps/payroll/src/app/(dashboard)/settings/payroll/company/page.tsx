"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, Check, Calendar } from "lucide-react";
import Link from "next/link";

export default function CompanyPayrollSettingsPage({ setActive }: { setActive?: (s: string) => void }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [userId, setUserId] = useState("");
  const [existingConfig, setExistingConfig] = useState<any>({});

  const [cycleStart, setCycleStart] = useState("1");
  const [cycleEnd, setCycleEnd] = useState("30");
  const [paymentDate, setPaymentDate] = useState("30");

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

        setCycleStart(pConfig.cycleStart || "1");
        setCycleEnd(pConfig.cycleEnd || "30");
        setPaymentDate(pConfig.paymentDate || "30");
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
        cycleStart,
        cycleEnd,
        paymentDate,
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
      console.error("Error saving payroll settings:", err);
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

  const daysOptions = Array.from({ length: 31 }, (_, i) => String(i + 1));
  daysOptions.push("Last Day");

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
          <h1 className="text-[20px] font-bold text-gray-900 dark:text-white leading-tight">Company Payroll Settings</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">Specify cycle boundaries and payment dates</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#121217] rounded-[24px] border border-[#E5E7EB] dark:border-[#2C2C35] p-6 md:p-8 flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-4">
          <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">Cycle & Payment Config</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Payroll Cycle Start Date</label>
            <select
              value={cycleStart}
              onChange={(e) => setCycleStart(e.target.value)}
              className="w-full px-4 py-3 bg-[#F8F9FA] dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 focus:border-[#007AFF] outline-none rounded-[12px] text-[14px] text-gray-900 dark:text-white font-medium transition-colors cursor-pointer"
            >
              {daysOptions.map(d => (
                <option key={d} value={d}>{d === "Last Day" ? "Last Day" : `Day ${d}`}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Payroll Cycle End Date</label>
            <select
              value={cycleEnd}
              onChange={(e) => setCycleEnd(e.target.value)}
              className="w-full px-4 py-3 bg-[#F8F9FA] dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 focus:border-[#007AFF] outline-none rounded-[12px] text-[14px] text-gray-900 dark:text-white font-medium transition-colors cursor-pointer"
            >
              {daysOptions.map(d => (
                <option key={d} value={d}>{d === "Last Day" ? "Last Day" : `Day ${d}`}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Salary Payment Date</label>
            <select
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-4 py-3 bg-[#F8F9FA] dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 focus:border-[#007AFF] outline-none rounded-[12px] text-[14px] text-gray-900 dark:text-white font-medium transition-colors cursor-pointer"
            >
              {daysOptions.map(d => (
                <option key={d} value={d}>{d === "Last Day" ? "Last Day" : `Day ${d}`}</option>
              ))}
            </select>
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

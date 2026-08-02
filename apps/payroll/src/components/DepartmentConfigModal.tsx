"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Save, Settings, Users, ShieldCheck, ChevronDown, Check, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Props {
  departmentId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DepartmentConfigModal({ departmentId, onClose, onSuccess }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [designations, setDesignations] = useState<string[]>([]);
  const [newDesignation, setNewDesignation] = useState("");
  const [headId, setHeadId] = useState("");
  const [delegationConfig, setDelegationConfig] = useState({
    attendance: "Head",
    claims: "Head",
    events: "Head"
  });

  // Data helpers
  const [employees, setEmployees] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"general" | "delegation">("general");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. Fetch Department Details
        const { data: dept, error: deptErr } = await supabase
          .from("departments")
          .select("*")
          .eq("id", departmentId)
          .single();

        if (deptErr) throw deptErr;

        setName(dept.name || "");
        setDescription(dept.description || "");
        setDesignations(dept.designations || []);
        setHeadId(dept.head_id || "");
        if (dept.delegation_config) {
          setDelegationConfig(dept.delegation_config);
        }

        const companyId = dept?.company_id;

        // 2. Fetch Company Employees
        const { data: emps, error: empsErr } = await supabase
          .from("employees")
          .select("id, name, role, is_head, department_id")
          .eq("company_id", companyId)
          .order("name");

        if (empsErr) throw empsErr;
        setEmployees(emps || []);

      } catch (err: any) {
        setError(err.message || "Failed to load department data.");
      } finally {
        setLoading(false);
      }
    }

    if (departmentId) loadData();
  }, [departmentId, supabase]);

  const handleAddDesignation = () => {
    if (newDesignation.trim() && !designations.includes(newDesignation.trim())) {
      setDesignations([...designations, newDesignation.trim()]);
      setNewDesignation("");
    }
  };

  const handleRemoveDesignation = (ds: string) => {
    setDesignations(designations.filter(d => d !== ds));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Department name is required.");
      return;
    }
    if (!headId) {
      setError("You must assign a Department Head.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // 1. Update Department
      const { error: updateErr } = await supabase
        .from("departments")
        .update({
          name: name.trim(),
          description: description.trim(),
          designations: designations,
          head_id: headId,
          delegation_config: delegationConfig
        })
        .eq("id", departmentId);

      if (updateErr) throw updateErr;

      // 2. Sync is_head in Employees table
      // Fetch current department details to find the old head_id
      const { data: currentDept } = await supabase
        .from("departments")
        .select("head_id")
        .eq("id", departmentId)
        .single();
      const oldHeadId = currentDept?.head_id;

      // If there was an old head, check if they lead any other departments
      if (oldHeadId && oldHeadId !== headId) {
        const { data: otherDepts } = await supabase
          .from("departments")
          .select("id")
          .eq("head_id", oldHeadId)
          .neq("id", departmentId);
        
        if (!otherDepts || otherDepts.length === 0) {
          await supabase
            .from("employees")
            .update({ is_head: false })
            .eq("id", oldHeadId);
        }
      }

      // Set the new head to is_head = true
      await supabase
        .from("employees")
        .update({ is_head: true })
        .eq("id", headId);

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);

    } catch (err: any) {
      setError(err.message || "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-[540px] bg-white dark:bg-[#1C1C22] rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/10">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-[#F1F3F5] dark:border-[#2A2A31]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-[18px] bg-[#E5F1FF] flex items-center justify-center">
                <Settings className="h-6 w-6 text-[#007AFF]" />
              </div>
              <div>
                <h2 className="text-[20px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                  Department Config
                </h2>
                <p className="text-[13px] text-gray-500 font-medium">Manage structure and delegation</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F1F3F5] dark:hover:bg-white/10 transition-colors">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mt-8 -mb-6">
            <button
              onClick={() => setActiveTab("general")}
              className={`px-5 py-2.5 rounded-t-[14px] text-[13px] font-bold transition-all ${
                activeTab === "general" 
                  ? "bg-[#F1F3F5] dark:bg-[#2A2A31] text-[#007AFF] border-b-2 border-[#007AFF]" 
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              General Settings
            </button>
            <button
              onClick={() => setActiveTab("delegation")}
              className={`px-5 py-2.5 rounded-t-[14px] text-[13px] font-bold transition-all ${
                activeTab === "delegation" 
                  ? "bg-[#F1F3F5] dark:bg-[#2A2A31] text-[#007AFF] border-b-2 border-[#007AFF]" 
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Delegation & Rules
            </button>
          </div>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto page-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-8 w-8 border-3 border-[var(--user-accent)] border-t-transparent rounded-full animate-spin" />
              <p className="text-[14px] font-semibold text-gray-500">Loading Configuration...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === "general" ? (
                <>
                  {/* Department Name */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider ml-1">Department Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      disabled={name === "Admin Department"}
                      placeholder="e.g. Engineering"
                      className="w-full h-[52px] px-5 bg-[#F8F9FA] dark:bg-[#121217] border border-transparent focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 rounded-[18px] text-[15px] font-semibold text-gray-900 dark:text-white focus:outline-none transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider ml-1">Description</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="What does this team do?"
                      rows={3}
                      className="w-full px-5 py-4 bg-[#F8F9FA] dark:bg-[#121217] border border-transparent focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 rounded-[18px] text-[15px] font-semibold text-gray-900 dark:text-white focus:outline-none transition-all shadow-sm resize-none"
                    />
                  </div>

                  {/* Head Assignment */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center justify-between">
                      Department Head 
                      <span className="text-[10px] lowercase text-[#FF3B30] font-bold tracking-normal">* mandatory</span>
                    </label>
                    <div className="relative group">
                      <select
                        value={headId}
                        onChange={e => setHeadId(e.target.value)}
                        className="w-full h-[52px] px-5 bg-[#F8F9FA] dark:bg-[#121217] border border-transparent focus:border-[#34C759] focus:ring-4 focus:ring-[#34C759]/10 rounded-[18px] text-[15px] font-bold text-gray-900 dark:text-white focus:outline-none transition-all shadow-sm appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Select a Department Head</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
                    </div>
                  </div>

                  {/* Designations Tags */}
                  <div className="space-y-3">
                    <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider ml-1">Designations</label>
                    <div className="flex flex-wrap gap-2 p-3 bg-[#F8F9FA] dark:bg-[#121217] rounded-[20px] min-h-[52px] border border-dashed border-gray-200 dark:border-white/5">
                      {designations.map(ds => (
                        <div key={ds} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#2A2A31] border border-[#F1F3F5] dark:border-white/5 rounded-full shadow-sm animate-in slide-in-from-left-2 duration-200">
                          <span className="text-[12px] font-bold text-[#1d1d1f] dark:text-white">{ds}</span>
                          <button onClick={() => handleRemoveDesignation(ds)} className="hover:text-[#FF3B30] transition-colors p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <div className="flex-1 min-w-[120px] relative">
                        <input
                          type="text"
                          value={newDesignation}
                          onChange={e => setNewDesignation(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddDesignation()}
                          placeholder="Add designation..."
                          className="w-full h-full bg-transparent border-none focus:outline-none text-[13px] font-semibold px-2"
                        />
                        <button 
                          onClick={handleAddDesignation}
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-[#007AFF] hover:bg-[#007AFF] hover:text-white rounded-lg transition-all"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Delegation Config */}
                  <div className="space-y-5">
                    <div className="bg-[#E5F1FF]/30 border border-[#007AFF]/10 p-4 rounded-2xl flex gap-3">
                      <ShieldCheck className="h-5 w-5 text-[#007AFF] shrink-0 mt-0.5" />
                      <p className="text-[12px] text-[#007AFF] font-semibold leading-relaxed">
                        Delegation settings define who approves requests from this department. By default, everything is sent to the Department Head.
                      </p>
                    </div>

                    {[
                      { id: "attendance", label: "Attendance Approvals", desc: "Clock-in/out and correction requests." },
                      { id: "claims", label: "Claim Approvals", desc: "Expense and reimbursement requests." },
                      { id: "events", label: "Event Delegation", desc: "Participation and department events." }
                    ].map(item => (
                      <div key={item.id} className="p-5 bg-[#F8F9FA] dark:bg-[#121217] rounded-[24px] border border-transparent hover:border-[#F1F3F5] transition-all shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-[14px] font-bold text-gray-900 dark:text-white">{item.label}</h4>
                            <p className="text-[11px] text-gray-500 font-medium">{item.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {["Head", "Super Admin"].map(option => (
                            <button
                              key={option}
                              onClick={() => setDelegationConfig({...delegationConfig, [item.id]: option})}
                              className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all border ${
                                delegationConfig[item.id as keyof typeof delegationConfig] === option
                                  ? "bg-[var(--user-accent)] border-[var(--user-accent)] text-white shadow-md shadow-[var(--user-accent)]/20"
                                  : "bg-white dark:bg-[#1C1C22] border-[#F1F3F5] dark:border-white/5 text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-gray-50 dark:bg-[#121217]/50 border-t border-[#F1F3F5] dark:border-[#2A2A31]">
          {error && (
            <div className="mb-6 p-4 bg-[#FFF1F1] border border-[#FF3B30]/10 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
               <div className="h-2 w-2 rounded-full bg-[#FF3B30]" />
               <p className="text-[12px] text-[#FF3B30] font-bold">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 h-[56px] bg-white dark:bg-[#2A2A31] border border-[#F1F3F5] dark:border-transparent text-gray-900 dark:text-white text-[15px] font-bold rounded-[18px] hover:bg-gray-50 dark:hover:bg-white/5 transition-all outline-none"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving || success || loading}
              className={`flex-[1.5] h-[56px] relative flex items-center justify-center gap-2 rounded-[18px] text-[15px] font-bold text-white transition-all shadow-lg overflow-hidden ${
                success ? "bg-[#34C759] shadow-[#34C759]/30" : "bg-[#007AFF] hover:bg-[#0062CC] shadow-[#007AFF]/30"
              }`}
            >
              {saving ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : success ? (
                <><Check className="h-5 w-5" /> Saved!</>
              ) : (
                <><Save className="h-5 w-5" /> Save Changes</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

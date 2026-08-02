"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, X, Save, Check, ShieldCheck, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getAvatarColor, getInitials } from "@/utils/avatarColor";
import { handleDepartmentHeadChange } from "@/utils/departmentHeadHelper";

export default function DepartmentSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const departmentId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [designations, setDesignations] = useState<string[]>([]);
  const [newDesignation, setNewDesignation] = useState("");
  const [userRole, setUserRole] = useState("Employee");
  const [headId, setHeadId] = useState("");
  const [delegationConfig, setDelegationConfig] = useState<any>({
    claims: { main: headId, sub: "" },
    attendance: { main: headId, sub: "" },
    leave: { main: headId, sub: "" },
    events: { main: headId, sub: "" }
  });

  // Data helpers
  const [employees, setEmployees] = useState<any[]>([]);
  const [superAdmin, setSuperAdmin] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"general" | "delegation">("general");

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeDropdownLabel, setActiveDropdownLabel] = useState("");
  const [tempSelection, setTempSelection] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [showRoleTransferConfirm, setShowRoleTransferConfirm] = useState(false);
  const [pendingHeadEmp, setPendingHeadEmp] = useState<any>(null);

  const handleConfirmSelection = () => {
    if (activeDropdown === "dept-head") {
      setHeadId(tempSelection);
      setActiveDropdown(null);
    } else {
      if (activeDropdown === "claims-main") setDelegationConfig({...delegationConfig, claims: { ...delegationConfig.claims, main: tempSelection }});
      else if (activeDropdown === "claims-sub") setDelegationConfig({...delegationConfig, claims: { ...delegationConfig.claims, sub: tempSelection }});
      else if (activeDropdown === "attendance-main") setDelegationConfig({...delegationConfig, attendance: { ...delegationConfig.attendance, main: tempSelection }});
      else if (activeDropdown === "attendance-sub") setDelegationConfig({...delegationConfig, attendance: { ...delegationConfig.attendance, sub: tempSelection }});
      else if (activeDropdown === "leave-main") setDelegationConfig({...delegationConfig, leave: { ...delegationConfig.leave, main: tempSelection }});
      else if (activeDropdown === "leave-sub") setDelegationConfig({...delegationConfig, leave: { ...delegationConfig.leave, sub: tempSelection }});
      else if (activeDropdown === "events-main") setDelegationConfig({...delegationConfig, events: { ...delegationConfig.events, main: tempSelection }});
      else if (activeDropdown === "events-sub") setDelegationConfig({...delegationConfig, events: { ...delegationConfig.events, sub: tempSelection }});
      
      setActiveDropdown(null);
    }
  };

  const handleAcceptRoleTransfer = () => {
    if (pendingHeadEmp) {
      setHeadId(pendingHeadEmp.id);
      // Immediately reflect Admin role locally so selection badge renders correctly
      setEmployees(prev =>
        prev.map(emp =>
          emp.id === pendingHeadEmp.id
            ? { ...emp, role: "Admin" }
            : emp
        )
      );
    }
    setShowRoleTransferConfirm(false);
    setPendingHeadEmp(null);
    setActiveDropdown(null);
  };

  const handleCancelRoleTransfer = () => {
    setShowRoleTransferConfirm(false);
    setPendingHeadEmp(null);
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: comp } = await supabase.from('company_settings').select('super_admin_role').eq('company_id', user.id).maybeSingle();
          if (comp) setUserRole("Super Admin");
          else {
            const { data: emp } = await supabase.from('employees').select('role').eq('email', user?.email).maybeSingle();
            setUserRole(emp?.role || "Employee");
          }
        }

        const { data: dept, error: deptErr } = await supabase
          .from("departments")
          .select("*")
          .eq("id", departmentId)
          .single();

        if (deptErr) throw deptErr;

        if (dept.name === "Admin Department" || (!dept.head_id && dept.name !== "Admin Department")) {
          router.replace(`/departments/${departmentId}`);
          return;
        }

        setName(dept.name || "");
        setDescription(dept.description || "");
        setDesignations(dept.designations || []);

        // Fetch Super Admin details from company_settings scoped to company_id
        const companyId = dept?.company_id || user?.id;
        if (companyId) {
          const { data: comp } = await supabase
            .from('company_settings')
            .select('super_admin_name, super_admin_role, super_admin_avatar_url')
            .eq('company_id', companyId)
            .maybeSingle();

          if (comp) {
            setSuperAdmin({
              id: "super-admin",
              name: "Super Admin",
              role: "Super Admin",
              avatar_url: comp.super_admin_avatar_url || null,
              emp_id: "SUPER_ADMIN"
            });
          }
        }

        if (dept.name === "Admin Department") {
          setHeadId("super-admin");
          const defaultClaimsSub = dept.delegation_config?.claims?.sub || "";
          const defaultAttendanceSub = dept.delegation_config?.attendance?.sub || "";
          const defaultLeaveSub = dept.delegation_config?.leave?.sub || "";
          const defaultEventsSub = dept.delegation_config?.events?.sub || "";

          setDelegationConfig({
            claims: { main: "super-admin", sub: defaultClaimsSub },
            attendance: { main: "super-admin", sub: defaultAttendanceSub },
            leave: { main: "super-admin", sub: defaultLeaveSub },
            events: { main: "super-admin", sub: defaultEventsSub }
          });
        } else {
          const head = dept.head_id || "";
          setHeadId(head);
          
          const defaultClaimsMain = dept.delegation_config?.claims?.main || head;
          const defaultClaimsSub = dept.delegation_config?.claims?.sub || "";
          const defaultAttendanceMain = dept.delegation_config?.attendance?.main || head;
          const defaultAttendanceSub = dept.delegation_config?.attendance?.sub || "";
          const defaultLeaveMain = dept.delegation_config?.leave?.main || head;
          const defaultLeaveSub = dept.delegation_config?.leave?.sub || "";
          const defaultEventsMain = dept.delegation_config?.events?.main || head;
          const defaultEventsSub = dept.delegation_config?.events?.sub || "";

          setDelegationConfig({
            claims: { main: defaultClaimsMain, sub: defaultClaimsSub },
            attendance: { main: defaultAttendanceMain, sub: defaultAttendanceSub },
            leave: { main: defaultLeaveMain, sub: defaultLeaveSub },
            events: { main: defaultEventsMain, sub: defaultEventsSub }
          });
        }

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



  const handleAddDesignation = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newDesignation.trim()) {
      if (!designations.includes(newDesignation.trim())) {
        setDesignations([...designations, newDesignation.trim()]);
      }
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

    const isAdminDept = name.trim() === "Admin Department";

    try {
      const { error: updateErr } = await supabase
        .from("departments")
        .update({
          name: name.trim(),
          description: description.trim(),
          designations: isAdminDept ? [] : designations,
          head_id: isAdminDept ? null : headId,
          delegation_config: delegationConfig
        })
        .eq("id", departmentId);

      if (updateErr) throw updateErr;

      if (!isAdminDept) {
        // Fetch current department details to find the old head_id
        const { data: currentDept } = await supabase
          .from("departments")
          .select("head_id")
          .eq("id", departmentId)
          .single();
        const oldHeadId = currentDept?.head_id;

        // If there was an old head, demote them to Sub Admin and is_head = false
        if (oldHeadId && oldHeadId !== headId) {
          await supabase
            .from("employees")
            .update({ is_head: false, role: "Sub Admin" })
            .eq("id", oldHeadId);
        }

        // Set the new head: is_head = true, role = "Admin"
        await supabase
          .from("employees")
          .update({ is_head: true, role: "Admin" })
          .eq("id", headId);

        if (oldHeadId !== headId) {
          const newHeadName = employees.find(e => e.id === headId)?.name || "New Head";
          await handleDepartmentHeadChange(supabase, departmentId, headId, newHeadName, name);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  const selectedHead = employees.find(e => e.id === headId);

  const renderSelect = (label: string, id: string, value: string) => {
    const isAdminDept = name === "Admin Department";
    const isLockedToSuperAdmin = isAdminDept && (
      id === "dept-head" || 
      id === "claims-main" || 
      id === "attendance-main" || 
      id === "leave-main" || 
      id === "events-main"
    );

    let selected = null;
    if (isLockedToSuperAdmin) {
      selected = superAdmin || {
        id: "super-admin",
        name: "Super Admin",
        role: "Super Admin",
        avatar_url: null,
        emp_id: "SUPER_ADMIN"
      };
    } else {
      const isSub = id.endsWith("-sub");
      if (isSub && !value) {
        selected = null;
      } else {
        selected = employees.find(e => e.id === value) || employees.find(e => e.id === headId) || selectedHead;
      }
    }

    return (
      <fieldset className="border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[16px] px-4 pb-3 pt-1 focus-within:border-[#007AFF] transition-colors relative w-full bg-white dark:bg-transparent">
        <legend className="text-[10px] uppercase font-bold text-[#A1A1A6] px-1.5 ml-2">{label}</legend>
        <div 
          className={`w-full bg-transparent border-none focus:outline-none px-2 mb-1 ${isLockedToSuperAdmin ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} flex items-center justify-between`}
          onClick={(e) => { 
            e.stopPropagation(); 
            if (isLockedToSuperAdmin) return;
            setActiveDropdown(id);
            setActiveDropdownLabel(label);
            setTempSelection(id.endsWith("-sub") ? value : (value || headId));
            setSearchQuery("");
          }}
        >
          {selected ? (
            <div className="flex items-center gap-3">
              <div 
                className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold border border-gray-100 dark:border-gray-800 shrink-0"
                style={{ backgroundColor: getAvatarColor(selected.name).bg, color: getAvatarColor(selected.name).color }}
              >
                {getInitials(selected.name)}
              </div>
              <span className="text-[14px] font-bold text-[#1d1d1f] dark:text-white">
                {selected.name} {selected.id === headId ? <span className="font-medium text-[#86868B]">(You)</span> : null}
              </span>
            </div>
          ) : (
            <span className="text-[14px] font-bold text-gray-400">Select an employee...</span>
          )}
          {isLockedToSuperAdmin && (
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-[#2C2C35]/50 px-2 py-1 rounded-md">System</span>
          )}
        </div>
      </fieldset>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto page-scrollbar bg-white dark:bg-[#121217]">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <button
          onClick={() => router.push(`/departments/${departmentId}`)}
          className="flex items-center gap-1.5 text-[#007AFF] hover:text-[#0062CC] font-bold text-[14px] transition-colors w-fit"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={3} />
          Back
        </button>
      </header>

      {/* Tabs Layout */}
      <div className="px-6 border-b border-[#F1F3F5] dark:border-[#2C2C35] flex items-center gap-8">
        <button
          onClick={() => setActiveTab("general")}
          className={`pb-3 text-[14px] font-bold transition-colors relative ${
            activeTab === "general" ? "text-[#007AFF]" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Department Settings
          {activeTab === "general" && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#007AFF] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("delegation")}
          className={`pb-3 text-[14px] font-bold transition-colors relative ${
            activeTab === "delegation" ? "text-[#007AFF]" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Department Delegation
          {activeTab === "delegation" && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#007AFF] rounded-t-full" />
          )}
        </button>
      </div>

      <main className="flex-1 px-8 py-8 flex flex-col max-w-[1000px]">
        {activeTab === "general" ? (
          <div className="space-y-6 flex-1">
            {/* Department Name */}
            <fieldset className="border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[16px] px-4 pb-3 pt-1 focus-within:border-[#007AFF] transition-colors">
              <legend className="text-[10px] uppercase font-bold text-[#A1A1A6] px-1.5 ml-2">Department Name</legend>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={name === "Admin Department"}
                className="w-full bg-transparent border-none focus:outline-none text-[15px] font-bold text-[#1d1d1f] dark:text-white px-2 mb-1 placeholder:text-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="e.g. HR Department"
              />
            </fieldset>

            {/* Description */}
            <fieldset className="border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[16px] px-4 pb-3 pt-1 focus-within:border-[#007AFF] transition-colors">
              <legend className="text-[10px] uppercase font-bold text-[#A1A1A6] px-1.5 ml-2">Description</legend>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-[15px] font-bold text-[#1d1d1f] dark:text-white px-2 mb-1 placeholder:text-gray-300"
                placeholder="What does this team do?"
              />
            </fieldset>

            {/* Department Head (Custom Select with Avatar) */}
            {renderSelect("Department Head", "dept-head", headId)}

            {/* Designations Input */}
            {name !== "Admin Department" && (
              <>
                <fieldset className="border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[16px] px-4 pb-3 pt-1 focus-within:border-[#007AFF] transition-colors mt-8">
                  <legend className="text-[10px] uppercase font-bold text-[#A1A1A6] px-1.5 ml-2">Designations</legend>
                  <input
                    type="text"
                    value={newDesignation}
                    onChange={e => setNewDesignation(e.target.value)}
                    onKeyDown={handleAddDesignation}
                    className="w-full bg-transparent border-none focus:outline-none text-[15px] font-bold text-[#1d1d1f] dark:text-white px-2 mb-1 placeholder:text-gray-300"
                    placeholder="Type and press Enter to add..."
                  />
                </fieldset>

                {/* Added Designations List */}
                {designations.length > 0 && (
                  <div className="mt-6 px-2">
                    <p className="text-[10px] uppercase font-bold text-[#A1A1A6] mb-3">Added Designations</p>
                    <div className="space-y-4">
                      {designations.map(ds => (
                        <div key={ds} className="flex items-center gap-3 group">
                          <button 
                             onClick={() => handleRemoveDesignation(ds)}
                             className="p-1 text-gray-400 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-md transition-colors"
                          >
                            <X className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                          <span className="text-[14px] font-bold text-[#1d1d1f] dark:text-white">{ds}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 w-full max-w-[900px] mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
              
              {/* Claim Approval Authorities */}
              <div className="space-y-4">
                <h3 className="text-[14px] font-bold text-[#1d1d1f] dark:text-white ml-2">Claim Approval Authorities</h3>
                <div className="space-y-4">
                  {renderSelect("Main Approval Authority", "claims-main", delegationConfig?.claims?.main || headId)}
                  {renderSelect("Sub Approval Authority", "claims-sub", delegationConfig?.claims?.sub || "")}
                </div>
              </div>

              {/* Attendance Authorities */}
              <div className="space-y-4">
                <h3 className="text-[14px] font-bold text-[#1d1d1f] dark:text-white ml-2">Attendance Authorities</h3>
                <div className="space-y-4">
                  {renderSelect("Attendance Approval Authority", "attendance-main", delegationConfig?.attendance?.main || headId)}
                  {renderSelect("Sub Approval Authority", "attendance-sub", delegationConfig?.attendance?.sub || "")}
                </div>
              </div>

              {/* Leave Approval Authorities */}
              <div className="space-y-4">
                <h3 className="text-[14px] font-bold text-[#1d1d1f] dark:text-white ml-2">Leave Approval Authorities</h3>
                <div className="space-y-4">
                  {renderSelect("Leave Approval Authority", "leave-main", delegationConfig?.leave?.main || headId)}
                  {renderSelect("Sub Approval Authority", "leave-sub", delegationConfig?.leave?.sub || "")}
                </div>
              </div>

              {/* Event Authorities */}
              <div className="space-y-4">
                <h3 className="text-[14px] font-bold text-[#1d1d1f] dark:text-white ml-2">Event Authorities</h3>
                <div className="space-y-4">
                  {renderSelect("Event Approval Authority", "events-main", delegationConfig?.events?.main || headId)}
                  {renderSelect("Sub Approval Authority", "events-sub", delegationConfig?.events?.sub || "")}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-12 flex items-center justify-between gap-4 pb-8 transition-all">
          <div className="flex-1">
             {userRole === "Super Admin" && name !== "Admin Department" && (
                <button
                  onClick={async () => {
                    if (confirm("Are you sure you want to delete this department? This action cannot be undone.")) {
                       setSaving(true);
                       await supabase.from('employees').update({ department_id: null }).eq('department_id', departmentId);
                       await supabase.from('departments').delete().eq('id', departmentId);
                       router.push('/departments');
                    }
                  }}
                  className="px-6 py-3 bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 rounded-xl text-[14px] font-bold text-[#FF3B30] transition-colors"
                >
                  Delete Department
                </button>
             )}
          </div>
          <div className="flex items-center gap-4 justify-end flex-1">
             {error && <span className="text-[12px] text-[#FF3B30] font-bold max-w-[200px] truncate">{error}</span>}
             {success && <span className="text-[12px] text-[#34C759] font-bold flex items-center gap-1"><Check className="h-4 w-4"/> Saved Successfully</span>}
             <button
               onClick={() => router.push(`/departments/${departmentId}`)}
               className="px-6 py-3 bg-white dark:bg-[#2A2A31] border border-[#E5E7EB] dark:border-[#2A2A31] rounded-xl text-[14px] font-bold text-[#1d1d1f] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
             >
               Cancel
             </button>
             <button
               onClick={handleSave}
               disabled={saving || loading}
               className="px-8 py-3 bg-[#007AFF] hover:bg-[#0062CC] rounded-xl text-[14px] font-bold text-white transition-colors flex items-center justify-center min-w-[140px]"
             >
               {saving ? (
                 <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
               ) : (
                "Save Changes"
               )}
             </button>
          </div>
        </div>
      </main>

      {/* Global Selection Modal */}
      {activeDropdown && (
        <div className="fixed inset-0 z-[9999] bg-white/90 dark:bg-black/90 flex flex-col items-center justify-center p-4">
          <h2 className="text-[22px] font-medium text-[#1d1d1f] dark:text-white mb-6">
            Choose {activeDropdownLabel}
          </h2>
            
          <div className="w-full max-w-[500px] bg-[#F4F5F7] dark:bg-[#1C1C22] rounded-[32px] p-6 shadow-none border border-white/50 dark:border-[#2C2C35]">
            {/* Current Selection Pill */}
            <div className="bg-white dark:bg-[#121217] rounded-[24px] min-h-[68px] p-3 flex items-center gap-4 mb-6 border border-gray-200 dark:border-[#2C2C35]">
              {(() => {
                const currEmp = employees.find(e => e.id === tempSelection) || employees.find(e => e.id === headId);
                if (!currEmp) return null;
                  return (
                    <>
                      <div 
                        className="h-12 w-12 rounded-full flex items-center justify-center text-[16px] font-bold border border-gray-100 dark:border-gray-800 shrink-0"
                        style={{ backgroundColor: getAvatarColor(currEmp.name).bg, color: getAvatarColor(currEmp.name).color }}
                      >
                        {getInitials(currEmp.name)}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-[#A1A1A6]">Current {activeDropdownLabel}</p>
                        <p className="text-[15px] font-bold text-[#1d1d1f] dark:text-white">{currEmp.name}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

            {/* Choose Other */}
            <p className="text-[13px] font-bold text-[#86868B] mb-2 px-1">Choose other</p>
            
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-[#86868B]" strokeWidth={2.5} />
              </div>
              <input
                type="text"
                placeholder="Search People"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[20px] py-3.5 pl-12 pr-4 text-[15px] font-bold text-[#1d1d1f] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 placeholder:text-[#A1A1A6]"
              />
            </div>

            {/* List of other people */}
            <div className="bg-white dark:bg-[#121217] rounded-[20px] overflow-hidden max-h-[200px] overflow-y-auto page-scrollbar mb-6 border border-[#E5E7EB] dark:border-[#2C2C35]">
              {(() => {
                const filtered = employees.filter(emp => {
                  const matchesSearch = searchQuery.trim() === "" || emp.name.toLowerCase().includes(searchQuery.toLowerCase());
                  if (!matchesSearch) return false;

                  if (activeDropdown === "dept-head") {
                    return emp.department_id === departmentId && emp.role === "Sub Admin";
                  }
                  if (activeDropdown && activeDropdown.endsWith("-sub")) {
                    return emp.department_id === departmentId && emp.role === "Sub Admin";
                  }
                  if (activeDropdown === "claims-main" || activeDropdown === "attendance-main" || activeDropdown === "leave-main" || activeDropdown === "events-main") {
                    return emp.role === "Admin";
                  }
                  return true;
                });

                const isSubDropdown = activeDropdown && activeDropdown.endsWith("-sub");

                if (filtered.length === 0 && !isSubDropdown) {
                  return <div className="text-center py-4 text-[13px] text-gray-400 font-semibold">No people found</div>;
                }

                return (
                  <>
                    {isSubDropdown && (
                      <div
                        onClick={() => setTempSelection("")}
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${tempSelection === "" ? 'bg-[#007AFF]/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold border border-dashed border-gray-300 dark:border-gray-700 shrink-0 text-gray-400">
                            <X size={14} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-gray-400 block leading-tight">None (Unassigned)</span>
                          </div>
                        </div>
                        {tempSelection === "" && <Check className="h-4 w-4 text-[#007AFF]" />}
                      </div>
                    )}
                    {filtered.map(emp => (
                      <div
                        key={emp.id}
                        onClick={() => setTempSelection(emp.id)}
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${tempSelection === emp.id ? 'bg-[#007AFF]/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold border border-gray-100 dark:border-gray-800 shrink-0"
                            style={{ backgroundColor: getAvatarColor(emp.name).bg, color: getAvatarColor(emp.name).color }}
                          >
                            {getInitials(emp.name)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-[#1d1d1f] dark:text-white block leading-tight">{emp.name}</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-0.5">{emp.role}</span>
                          </div>
                        </div>
                        {tempSelection === emp.id && <Check className="h-4 w-4 text-[#007AFF]" />}
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setActiveDropdown(null)}
                className="flex-1 py-3.5 bg-[#C6C6C6] dark:bg-[#2A2A31] hover:bg-[#A1A1A6] dark:hover:bg-white/5 rounded-[16px] text-[15px] font-bold text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSelection}
                className="flex-1 py-3.5 bg-[#007AFF] hover:bg-[#0062CC] rounded-[16px] text-[15px] font-bold text-white transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showRoleTransferConfirm && pendingHeadEmp && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2C2C35] rounded-3xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto h-12 w-12 bg-[#007AFF]/10 dark:bg-[#007AFF]/20 rounded-full flex items-center justify-center text-[#007AFF] mb-4">
              <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
            </div>
            
            <h3 className="text-[17px] font-bold text-gray-900 dark:text-white leading-tight">
              Transfer Role to Admin?
            </h3>
            
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed px-2">
              <strong>{pendingHeadEmp.name}</strong> is currently a <strong>{pendingHeadEmp.role}</strong>. A Department Head must have the **Admin** role.
              <br />
              Do you want to make this employee an **Admin** by transfer?
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleAcceptRoleTransfer}
                className="w-full h-11 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-xl text-[14px] font-bold transition-all"
              >
                Yes, Transfer as Admin
              </button>
              <button
                type="button"
                onClick={handleCancelRoleTransfer}
                className="w-full h-11 bg-[#F2F2F7] dark:bg-[#2C2C35]/50 hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C35] text-gray-700 dark:text-gray-300 rounded-xl text-[14px] font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

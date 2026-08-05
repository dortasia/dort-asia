"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Check, Plus, ChevronDown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getCompanyInitials, generateDeptId } from "@/utils/deptIdHelper";

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddDepartmentSidebar({ onClose, onSuccess }: Props) {
  const supabase = createClient();

  const [isClosing, setIsClosing] = useState(false);
  const [name, setName] = useState("");
  const [departmentType, setDepartmentType] = useState("");
  const [description, setDescription] = useState("");
  const [designations, setDesignations] = useState<string[]>([]);
  const [newDesignation, setNewDesignation] = useState("");
  const [employees, setEmployees] = useState<{ id: string; name: string; role: string }[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [empSearch, setEmpSearch] = useState("");
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const [currentUserEmp, setCurrentUserEmp] = useState<any>(null);
  const [generatedDeptId, setGeneratedDeptId] = useState("Generating...");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [companyDepts, setCompanyDepts] = useState<{ id: string; name: string }[]>([]);
  const [headId, setHeadId] = useState("");
  const [headSearch, setHeadSearch] = useState("");
  const [showHeadDropdown, setShowHeadDropdown] = useState(false);
  const [isBranch, setIsBranch] = useState(false);
  const [parentId, setParentId] = useState("");

  const overlayRef = useRef<HTMLDivElement>(null);
  const empDropdownRef = useRef<HTMLDivElement>(null);
  const headDropdownRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  // Load all employees in the company & pre-generate department ID
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: emps } = await supabase
        .from("employees")
        .select("id, name, role")
        .eq("company_id", user.id)
        .order("name");
      if (emps) {
        setEmployees(emps);
      }

      const { data: depts } = await supabase
        .from("departments")
        .select("id, name")
        .eq("company_id", user.id)
        .order("name");
      if (depts) {
        setCompanyDepts(depts);
      }

      const { data: currentEmp } = await supabase
        .from("employees")
        .select("id, name, role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (currentEmp) {
        setCurrentUserEmp(currentEmp);
      }

      // Generate next dept_id
      try {
        const { data: comp } = await supabase
          .from("company_settings")
          .select("company_name")
          .eq("company_id", user.id)
          .maybeSingle();

        const companyName = comp?.company_name || "Dort Asia";
        const initials = getCompanyInitials(companyName);

        const { data: lastDept } = await supabase
          .from("departments")
          .select("dept_id")
          .eq("company_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        let nextSeq = 1;
        if (lastDept?.dept_id) {
          const match = lastDept.dept_id.match(/[A-Z]+(\d+)DEPT\d+/i);
          if (match) {
            nextSeq = parseInt(match[1], 10) + 1;
          } else {
            const genericMatch = lastDept.dept_id.match(/\d+/);
            if (genericMatch) {
              nextSeq = parseInt(genericMatch[0], 10) + 1;
            }
          }
        }

        const generatedId = generateDeptId(initials, nextSeq);
        setGeneratedDeptId(generatedId);
      } catch (err) {
        console.error("Failed to generate Department ID", err);
        setGeneratedDeptId("Auto-generated");
      }
    })();
  }, [supabase]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (empDropdownRef.current && !empDropdownRef.current.contains(e.target as Node)) {
        setShowEmpDropdown(false);
      }
      if (headDropdownRef.current && !headDropdownRef.current.contains(e.target as Node)) {
        setShowHeadDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddDesignation = () => {
    if (newDesignation.trim() && !designations.includes(newDesignation.trim())) {
      setDesignations([...designations, newDesignation.trim()]);
      setNewDesignation("");
    }
  };

  const handleRemoveDesignation = (ds: string) => {
    setDesignations(designations.filter(d => d !== ds));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Department name is required.");
      return;
    }
    if (!departmentType.trim()) {
      setError("Department Type is required.");
      return;
    }
    if (designations.length === 0) {
      setError("At least one designation is required.");
      return;
    }
    if (generatedDeptId === "Generating...") {
      setError("Generating Department ID. Please wait...");
      return;
    }

    const finalEmployeeIds = [...selectedEmployeeIds];
    if (headId && !finalEmployeeIds.includes(headId)) {
      finalEmployeeIds.push(headId);
    }

    // 1. Single Admin check: check if any of the selected employees (excluding the assigned headId) is already an Admin
    const adminsToAddCount = finalEmployeeIds.filter(id => {
      if (id === headId) return false;
      const emp = employees.find(e => e.id === id);
      return emp?.role === "Admin";
    }).length;

    if (adminsToAddCount > 0) {
      setError("A department can only have one Admin (the Department Head). You have included other Admin(s) in this department. Please change their roles or exclude them.");
      return;
    }

    // 2. Sub Admin count check: max 3 per department
    const subAdminsCount = finalEmployeeIds.filter(id => {
      if (id === headId) return false; // Head will become Admin
      const emp = employees.find(e => e.id === id);
      return emp?.role === "Sub Admin";
    }).length;

    if (subAdminsCount > 3) {
      setError(`A department can have a maximum of 3 Sub Admins. You have selected ${subAdminsCount} Sub Admins.`);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if department name already exists for this company
      const { data: existingDept } = await supabase
        .from("departments")
        .select("id")
        .eq("company_id", user.id)
        .eq("name", name.trim())
        .maybeSingle();

      if (existingDept) {
        setError("A department with this name already exists.");
        setSaving(false);
        return;
      }

      // Check if department ID already exists for this company
      if (generatedDeptId.trim()) {
        const { data: existingDeptId } = await supabase
          .from("departments")
          .select("id")
          .eq("company_id", user.id)
          .eq("dept_id", generatedDeptId.trim())
          .maybeSingle();

        if (existingDeptId) {
          setError("Department ID is already in use. Please enter or generate a unique ID.");
          setSaving(false);
          return;
        }
      }

      // Insert new department
      const { data: newDept, error: insertErr } = await supabase
        .from("departments")
        .insert({
          name: name.trim(),
          description: departmentType.trim() ? `Type: ${departmentType.trim()}` : description.trim(),
          designations: designations,
          company_id: user.id,
          dept_id: generatedDeptId,
          head_id: headId || null,
          delegation_config: {
            parent_id: isBranch ? (parentId || null) : null,
            claims: { main: headId || "", sub: "" },
            attendance: { main: headId || "", sub: "" },
            leave: { main: headId || "", sub: "" },
            events: { main: headId || "", sub: "" }
          }
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      // Create notification
      await supabase.from("notifications").insert({
        title: "New Department Created",
        message: `Department "${name.trim()}" has been created.`,
        type: "success",
        is_read: false
      });

      // Update selected employees' department_id (excluding head)
      const otherEmployeeIds = finalEmployeeIds.filter(id => id !== headId);
      if (otherEmployeeIds.length > 0 && newDept) {
        const { error: updateErr } = await supabase
          .from("employees")
          .update({ department_id: newDept.id })
          .in("id", otherEmployeeIds);
        if (updateErr) throw updateErr;
      }

      // Update Head employee's record: department_id, role = "Admin", is_head = true
      if (headId && newDept) {
        const { error: headUpdateErr } = await supabase
          .from("employees")
          .update({
            department_id: newDept.id,
            role: "Admin",
            is_head: true
          })
          .eq("id", headId);
        if (headUpdateErr) throw headUpdateErr;
      }

      setSaved(true);
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1200);

    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        ref={overlayRef}
        className={`fixed inset-0 z-[9999] transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'} bg-black/20`}
        onClick={handleClose}
      />

      {/* Sidebar Panel Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 z-[10000] w-full max-w-[420px] bg-white dark:bg-[#121217] shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out transform ${isClosing ? 'translate-x-full' : 'translate-x-0'} font-sf-text`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 shrink-0 border-b border-gray-100 dark:border-[#2C2C35]">
          <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Add Department</h2>
          <button 
            type="button"
            onClick={handleClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
            
            {/* Inputs & Fields */}
            <div className="flex flex-col gap-6">
              
              {/* Department Name */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">
                  Department Name <span className="text-[#FF3B30]">*</span>
                </h3>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter department name (e.g. Engineering)"
                  className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent"
                />
              </div>

              {/* Department Type */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">
                  Department Type <span className="text-[#FF3B30]">*</span>
                </h3>
                <input 
                  type="text" 
                  maxLength={25}
                  value={departmentType} 
                  onChange={e => setDepartmentType(e.target.value)}
                  placeholder="e.g. Administration, Engineering, Finance"
                  className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent"
                />
                <span className="text-[11px] text-gray-400 mt-1 block text-right font-sf-rounded">{departmentType.length}/25</span>
              </div>

              {/* Add People */}
              <div className="relative" ref={empDropdownRef}>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">
                  Add People
                </h3>
                <input 
                  type="text" 
                  value={empSearch}
                  onChange={e => {
                    setEmpSearch(e.target.value);
                    setShowEmpDropdown(true);
                  }}
                  onFocus={() => setShowEmpDropdown(true)}
                  placeholder="Search and select employees..."
                  className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent"
                />

                {showEmpDropdown && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-[160px] overflow-y-auto bg-white dark:bg-[#1C1C22] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E5E5EA] dark:border-[#2A2A31] rounded-[14px] p-2 page-scrollbar">
                    {employees.filter(emp => 
                      emp.name.toLowerCase().includes(empSearch.toLowerCase()) &&
                      !selectedEmployeeIds.includes(emp.id)
                    ).map(emp => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          setSelectedEmployeeIds([...selectedEmployeeIds, emp.id]);
                          setEmpSearch("");
                          setShowEmpDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-[13.5px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]/50 rounded-[8px] transition-colors"
                      >
                        {emp.name} ({emp.role})
                      </button>
                    ))}
                    {employees.filter(emp => 
                      emp.name.toLowerCase().includes(empSearch.toLowerCase()) &&
                      !selectedEmployeeIds.includes(emp.id)
                    ).length === 0 && (
                      <span className="block text-[12px] text-gray-400 text-center py-2">No matching employees</span>
                    )}
                  </div>
                )}

                {/* Selected Employees Tags */}
                {selectedEmployeeIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedEmployeeIds.map(id => {
                      const emp = employees.find(e => e.id === id);
                      if (!emp) return null;
                      return (
                        <div 
                          key={id} 
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E5F1FF] dark:bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-[8px]"
                        >
                          <span className="text-[12.5px] font-bold text-[#007AFF]">{emp.name}</span>
                          <button 
                            type="button" 
                            onClick={() => setSelectedEmployeeIds(selectedEmployeeIds.filter(x => x !== id))}
                            className="text-gray-400 hover:text-[#FF3B30] transition-colors p-0.5 rounded-full hover:bg-[#007AFF]/10"
                          >
                            <X size={12} className="stroke-[2.5]" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Assign Department Head */}
              <div className="relative" ref={headDropdownRef}>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">
                  Assign Department Head
                </h3>
                {headId ? (
                  <div className="flex items-center justify-between bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 border border-transparent">
                    <span className="text-[14px] font-medium text-gray-900 dark:text-white">
                      {employees.find(e => e.id === headId)?.name || "Selected Head"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setHeadId("");
                        setHeadSearch("");
                      }}
                      className="text-gray-400 hover:text-[#FF3B30] transition-colors"
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={headSearch}
                      onChange={e => {
                        setHeadSearch(e.target.value);
                        setShowHeadDropdown(true);
                      }}
                      onFocus={() => setShowHeadDropdown(true)}
                      placeholder="Search and assign Department Head..."
                      className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent"
                    />
                    {showHeadDropdown && (
                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-[160px] overflow-y-auto bg-white dark:bg-[#1C1C22] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E5E5EA] dark:border-[#2A2A31] rounded-[14px] p-2 page-scrollbar">
                        {employees.filter(emp =>
                          emp.name.toLowerCase().includes(headSearch.toLowerCase()) &&
                          emp.role === "Admin"
                        ).map(emp => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => {
                              setHeadId(emp.id);
                              setHeadSearch("");
                              setShowHeadDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-[13.5px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]/50 rounded-[8px] transition-colors flex items-center justify-between"
                          >
                            <span>{emp.name}</span>
                            <span className="text-[11px] text-gray-400">{emp.role}</span>
                          </button>
                        ))}
                        {employees.filter(emp =>
                          emp.name.toLowerCase().includes(headSearch.toLowerCase()) &&
                          emp.role === "Admin"
                        ).length === 0 && (
                          <span className="block text-[12px] text-gray-400 text-center py-2">No matching employees</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Sub-department/Branch Selector */}
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBranch}
                    onChange={e => {
                      setIsBranch(e.target.checked);
                      if (!e.target.checked) setParentId("");
                    }}
                    className="h-4.5 w-4.5 rounded border-gray-300 text-[#007AFF] focus:ring-[#007AFF]"
                  />
                  <span className="text-[13px] font-bold text-gray-900 dark:text-white select-none">
                    Is this a sub-department or branch?
                  </span>
                </label>

                {isBranch && (
                  <div className="flex flex-col gap-2 mt-1">
                    <span className="text-[12px] font-semibold text-gray-500 dark:text-gray-400">
                      Select Parent Department
                    </span>
                    <select
                      value={parentId}
                      onChange={e => setParentId(e.target.value)}
                      className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent font-semibold cursor-pointer"
                    >
                      <option value="">-- Choose Department --</option>
                      {companyDepts.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Department ID (Auto Generated) */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">
                  Department ID
                </h3>
                <input 
                  type="text" 
                  value={generatedDeptId} 
                  disabled
                  className="w-full bg-[#F8F9FA]/60 dark:bg-[#1C1C1E]/60 rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-400 dark:text-gray-500 focus:outline-none border border-transparent cursor-not-allowed"
                />
              </div>

              {/* Designations tag inputs */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">
                  Designations
                </h3>
                <input
                  type="text"
                  value={newDesignation}
                  onChange={e => setNewDesignation(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDesignation();
                    }
                  }}
                  placeholder="Type and press Enter..."
                  className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[16px] px-5 py-4 text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-[#E5E5EA] dark:border-transparent mb-4 transition-all"
                />
                <div className="flex flex-wrap gap-2">
                  {designations.map(ds => (
                    <div 
                      key={ds} 
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F2F2F7] dark:bg-[#1C1C22] rounded-[8px] border border-[#E5E5EA] dark:border-transparent"
                    >
                      <span className="text-[13px] font-bold text-[#0A2540] dark:text-[#E2E8F0]">{ds}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveDesignation(ds)} 
                        className="text-gray-400 hover:text-[#FF3B30] transition-colors p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center"
                      >
                        <X size={12} className="stroke-[2.5]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Footer */}
          <div className="p-6 pt-2 pb-8 mt-auto flex flex-col gap-3 shrink-0 bg-white dark:bg-[#121217] border-t border-gray-100 dark:border-[#2C2C35]">
            {error && (
              <div className="text-[12px] text-[#DC2626] font-bold bg-[#FFF1F1] px-4 py-2.5 rounded-[10px] text-center">
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={handleClose}
                disabled={saving}
                className="flex-1 py-4 bg-[#F8F9FA] dark:bg-[#1C1C1E] hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-[16px] text-[15px] font-bold transition-colors"
              >
                Discard
              </button>
              <button 
                type="submit"
                disabled={saving || saved}
                className={`flex-1 py-4 rounded-[16px] text-white text-[16px] font-sf-text font-bold leading-[1.3] transition-all shadow-sm flex items-center justify-center gap-2 ${saved ? 'bg-[#34C759]' : 'bg-[#0064E0] hover:bg-[#0052B8]'}`}
              >
                {saving ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : saved ? (
                  <><Check size={18} /> Added</>
                ) : (
                  "Add Department"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

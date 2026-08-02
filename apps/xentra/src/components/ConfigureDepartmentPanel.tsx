"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Search, Save, ChevronDown, ArrowLeft, Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getAvatarColor, getInitials } from "@/utils/avatarColor";
import { getCompanyInitials, generateDeptId } from "@/utils/deptIdHelper";

export default function ConfigureDepartmentPanel({
  departmentId,
  isOpen,
  onClose,
  onSuccess,
  initialScreen = null
}: {
  departmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialScreen?: 'settings' | 'delegations' | 'branches' | null;
}) {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // New Screen State
  const [activeSubPanel, setActiveSubPanel] = useState<'settings' | 'delegations' | 'branches' | null>(null);

  const [name, setName] = useState("");
  const [editableId, setEditableId] = useState("");
  const [designations, setDesignations] = useState<string[]>([]);
  const [newDesignation, setNewDesignation] = useState("");
  const [userRole, setUserRole] = useState("Employee");
  const [headId, setHeadId] = useState("");
  const [delegationConfig, setDelegationConfig] = useState<any>({
    claims: { main: headId, sub: headId },
    attendance: { main: headId, sub: headId },
    leave: { main: headId, sub: headId },
    events: { main: headId, sub: headId }
  });

  const [currentUserEmp, setCurrentUserEmp] = useState<any>(null);
  const [companyDepts, setCompanyDepts] = useState<any[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [branchTab, setBranchTab] = useState<'existing' | 'new'>('existing');

  // Create New Branch Form States
  const [branchName, setBranchName] = useState("");
  const [branchDesc, setBranchDesc] = useState("");
  const [branchDesignations, setBranchDesignations] = useState<string[]>([]);
  const [newBranchDesignation, setNewBranchDesignation] = useState("");
  const [creatingBranch, setCreatingBranch] = useState(false);

  const [employees, setEmployees] = useState<any[]>([]);
  const [superAdmin, setSuperAdmin] = useState<any>(null);
  const [deptEmployees, setDeptEmployees] = useState<any[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeDropdownLabel, setActiveDropdownLabel] = useState("");
  const [tempSelection, setTempSelection] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [openSelectId, setOpenSelectId] = useState<string | null>(null);
  const [inlineSearchQuery, setInlineSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setActiveSubPanel(initialScreen);
      setEditableId("");
      loadData();
    }
  }, [isOpen, departmentId, initialScreen]);

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

      setName(dept.name || "");
      setEditableId(dept.dept_id || "");
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
          parent_id: dept.delegation_config?.parent_id || null,
          claims: { main: defaultClaimsMain, sub: defaultClaimsSub },
          attendance: { main: defaultAttendanceMain, sub: defaultAttendanceSub },
          leave: { main: defaultLeaveMain, sub: defaultLeaveSub },
          events: { main: defaultEventsMain, sub: defaultEventsSub }
        });
      }

      // Fetch all employees in the company to support both company-wide Sub Authority assignments and department-restricted Main assignments
      const { data: emps, error: empsErr } = await supabase
        .from("employees")
        .select("id, name, role, is_head, avatar_url, emp_id, department_id")
        .eq("company_id", companyId)
        .order("name");

      if (empsErr) throw empsErr;
      
      setEmployees(emps || []);
      setDeptEmployees((emps || []).filter((e: any) => e.department_id === departmentId));

      // Fetch current user employee record
      if (user) {
        let { data: curEmp } = await supabase
          .from("employees")
          .select("id, name, role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!curEmp) {
          const { data: curEmpByEmail } = await supabase
            .from("employees")
            .select("id, name, role")
            .eq("email", user.email)
            .maybeSingle();
          curEmp = curEmpByEmail;
        }

        if (curEmp) {
          setCurrentUserEmp(curEmp);
        } else {
          // If no employee record found but they are the Super Admin owner, set mock super admin employee record
          const { data: comp } = await supabase.from('company_settings').select('super_admin_name').eq('company_id', user.id).maybeSingle();
          if (comp) {
            setCurrentUserEmp({
              id: "super-admin",
              name: comp.super_admin_name || "Super Admin",
              role: "Super Admin"
            });
          }
        }
      }

      // Fetch all company departments
      const { data: depts, error: deptsErr } = await supabase
        .from("departments")
        .select("*")
        .eq("company_id", companyId)
        .order("name");
      
      if (!deptsErr && depts) {
        setCompanyDepts(depts);
        // Find branches of the current department
        const branches = depts.filter((d: any) => d.delegation_config?.parent_id === departmentId);
        setSelectedBranchIds(branches.map((b: any) => b.id));
      }

    } catch (err: any) {
      setError(err.message || "Failed to load department data.");
    } finally {
      setLoading(false);
    }
  }

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleConfirmSelection = () => {
    if (activeDropdown === "dept-head") setHeadId(tempSelection);
    else if (activeDropdown === "claims-main") setDelegationConfig({...delegationConfig, claims: { ...delegationConfig.claims, main: tempSelection }});
    else if (activeDropdown === "claims-sub") setDelegationConfig({...delegationConfig, claims: { ...delegationConfig.claims, sub: tempSelection }});
    else if (activeDropdown === "attendance-main") setDelegationConfig({...delegationConfig, attendance: { ...delegationConfig.attendance, main: tempSelection }});
    else if (activeDropdown === "attendance-sub") setDelegationConfig({...delegationConfig, attendance: { ...delegationConfig.attendance, sub: tempSelection }});
    else if (activeDropdown === "leave-main") setDelegationConfig({...delegationConfig, leave: { ...delegationConfig.leave, main: tempSelection }});
    else if (activeDropdown === "leave-sub") setDelegationConfig({...delegationConfig, leave: { ...delegationConfig.leave, sub: tempSelection }});
    else if (activeDropdown === "events-main") setDelegationConfig({...delegationConfig, events: { ...delegationConfig.events, main: tempSelection }});
    else if (activeDropdown === "events-sub") setDelegationConfig({...delegationConfig, events: { ...delegationConfig.events, sub: tempSelection }});
    
    setActiveDropdown(null);
  };

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
    setSaving(true);
    setError("");

    const isAdminDept = name.trim() === "Admin Department";

    try {
      if (editableId.trim()) {
        const { data: existingDeptId } = await supabase
          .from("departments")
          .select("id")
          .eq("dept_id", editableId.trim())
          .neq("id", departmentId)
          .maybeSingle();

        if (existingDeptId) {
          setError("Department ID is already in use by another department. Please enter a unique ID.");
          setSaving(false);
          return;
        }
      }

      // ── Capture old head_id BEFORE updating the department ──
      let oldHeadId: string | null = null;
      if (!isAdminDept) {
        const { data: currentDept } = await supabase
          .from("departments")
          .select("head_id")
          .eq("id", departmentId)
          .single();
        oldHeadId = currentDept?.head_id || null;
      }

      // Create update payload.
      const payload: any = {
        name: name.trim(),
        designations: isAdminDept ? [] : designations,
        dept_id: editableId.trim() || null,
        head_id: isAdminDept ? null : (headId || null),
        delegation_config: delegationConfig
      };

      const { error: updateErr } = await supabase
        .from("departments")
        .update(payload)
        .eq("id", departmentId);

      if (updateErr) throw updateErr;

      if (!isAdminDept) {
        // ── Clear old head (if head changed) ──
        if (oldHeadId && oldHeadId !== headId) {
          // Only clear is_head if they don't lead any other department
          const { data: otherDepts } = await supabase
            .from("departments")
            .select("id")
            .eq("head_id", oldHeadId)
            .neq("id", departmentId);
          
          if (!otherDepts || otherDepts.length === 0) {
            await supabase
              .from("employees")
              .update({ is_head: false, role: "Employee" })
              .eq("id", oldHeadId);
          }
        }

        // ── Set new head: is_head = true, role = "Admin" ──
        if (headId) {
          await supabase
            .from("employees")
            .update({ is_head: true, role: "Admin" })
            .eq("id", headId);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
        handleClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  const selectedHead = employees.find(e => e.id === headId);

  const handleInlineSelect = (selectId: string, selectedId: string) => {
    if (selectId === "dept-head") {
      setHeadId(selectedId);
      setDelegationConfig({
        ...delegationConfig,
        claims: { ...delegationConfig.claims, main: selectedId },
        attendance: { ...delegationConfig.attendance, main: selectedId },
        leave: { ...delegationConfig.leave, main: selectedId },
        events: { ...delegationConfig.events, main: selectedId }
      });
    } else if (selectId === "claims-main") {
      setDelegationConfig({
        ...delegationConfig,
        claims: { ...delegationConfig.claims, main: selectedId }
      });
    } else if (selectId === "claims-sub") {
      setDelegationConfig({
        ...delegationConfig,
        claims: { ...delegationConfig.claims, sub: selectedId }
      });
    } else if (selectId === "attendance-main") {
      setDelegationConfig({
        ...delegationConfig,
        attendance: { ...delegationConfig.attendance, main: selectedId }
      });
    } else if (selectId === "attendance-sub") {
      setDelegationConfig({
        ...delegationConfig,
        attendance: { ...delegationConfig.attendance, sub: selectedId }
      });
    } else if (selectId === "leave-main") {
      setDelegationConfig({
        ...delegationConfig,
        leave: { ...delegationConfig.leave, main: selectedId }
      });
    } else if (selectId === "leave-sub") {
      setDelegationConfig({
        ...delegationConfig,
        leave: { ...delegationConfig.leave, sub: selectedId }
      });
    } else if (selectId === "events-main") {
      setDelegationConfig({
        ...delegationConfig,
        events: { ...delegationConfig.events, main: selectedId }
      });
    } else if (selectId === "events-sub") {
      setDelegationConfig({
        ...delegationConfig,
        events: { ...delegationConfig.events, sub: selectedId }
      });
    }
    setOpenSelectId(null);
  };

  const renderSelect = (label: string, id: string, value: string) => {
    const isAdminDept = name === "Admin Department";
    const isLockedToSuperAdmin = isAdminDept && (
      id === "dept-head" || 
      id === "claims-main" || 
      id === "attendance-main" || 
      id === "leave-main" || 
      id === "events-main"
    );

    const isSubAuthority = id.endsWith("-sub") || id === "dept-head";
    let searchScope = isSubAuthority ? employees : deptEmployees;
    if (id === "dept-head" || id.endsWith("-main")) {
      searchScope = searchScope.filter(emp => emp.role === "Admin");
    }

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
      selected = searchScope.find(e => e.id === value) || employees.find(e => e.id === value) || employees.find(e => e.id === headId) || selectedHead;
    }

    return (
      <div className="flex flex-col gap-2 relative" onClick={(e) => e.stopPropagation()}>
        <label className="text-[13px] font-bold text-gray-900 dark:text-white">{label}</label>
        
        {openSelectId === id ? (
          <div className="w-full relative">
            <input 
              type="text"
              value={inlineSearchQuery}
              onChange={(e) => setInlineSearchQuery(e.target.value)}
              placeholder={selected ? selected.name : "Type name or Employee ID..."}
              className="w-full h-[52px] px-4 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#007AFF] dark:border-[#007AFF] rounded-[14px] text-[13.5px] font-bold outline-none transition-colors shadow-sm shadow-[#007AFF]/10 pr-10"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            <ChevronDown 
              className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 rotate-180 cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation();
                setOpenSelectId(null);
              }}
            />
          </div>
        ) : (
          <button 
            onClick={(e) => { 
              e.preventDefault();
              e.stopPropagation(); 
              if (isLockedToSuperAdmin) return;
              setOpenSelectId(id);
              setInlineSearchQuery("");
            }}
            className={`w-full flex items-center justify-between px-4 py-3.5 ${selected ? "bg-white" : "bg-gray-50"} dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] ${isLockedToSuperAdmin ? 'cursor-not-allowed opacity-90' : 'hover:border-[#007AFF] dark:hover:border-[#007AFF]'} rounded-[14px] text-[13.5px] font-medium outline-none transition-colors`}
          >
            {selected ? (
              <div className="flex items-center gap-3">
                {selected.avatar_url ? (
                  <img 
                    src={selected.avatar_url} 
                    alt={selected.name}
                    className="h-6 w-6 rounded-full object-cover shrink-0 shadow-sm"
                  />
                ) : (
                  <div 
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm"
                    style={{ backgroundColor: getAvatarColor(selected.name).bg, color: getAvatarColor(selected.name).color }}
                  >
                    {getInitials(selected.name)}
                  </div>
                )}
                <span className="text-[13.5px] font-bold truncate max-w-[180px]">
                  {selected.name} {selected.id === headId ? <span className="font-medium text-[#86868B]">(Head)</span> : null}
                </span>
              </div>
            ) : (
              <span className="text-[13.5px] font-medium text-gray-400">Select an employee...</span>
            )}
            {isLockedToSuperAdmin ? (
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-[#2C2C35]/50 px-2 py-1 rounded-md">System</span>
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400 transition-transform" />
            )}
          </button>
        )}

        {openSelectId === id && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="p-4 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-2xl shadow-lg flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200 z-50 absolute top-[85px] left-0 right-0"
          >
            {/* List */}
            <div className="max-h-[160px] overflow-y-auto page-scrollbar flex flex-col gap-1">
              {(() => {
                const query = inlineSearchQuery.toLowerCase().trim();
                const filtered = searchScope.filter(emp => {
                  if (query === "") return true;
                  const nameMatch = (emp.name || "").toLowerCase().includes(query);
                  const idMatch = (emp.emp_id || "").toLowerCase().includes(query);
                  return nameMatch || idMatch;
                });
                const displayed = query === "" ? filtered.slice(0, 2) : filtered;

                return displayed.map(emp => (
                  <button
                    key={emp.id}
                    onClick={(e) => {
                      e.preventDefault();
                      handleInlineSelect(id, emp.id);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      value === emp.id 
                        ? 'bg-[#007AFF]/10 text-[#007AFF] font-bold' 
                        : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {emp.avatar_url ? (
                        <img 
                          src={emp.avatar_url} 
                          alt={emp.name}
                          className="h-6 w-6 rounded-full object-cover shrink-0 shadow-sm"
                        />
                      ) : (
                        <div 
                          className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 shadow-sm"
                          style={{ backgroundColor: getAvatarColor(emp.name).bg, color: getAvatarColor(emp.name).color }}
                        >
                          {getInitials(emp.name)}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-[12.5px] font-bold text-[#1d1d1f] dark:text-white leading-tight">
                          {emp.name}
                        </span>
                        {emp.emp_id && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                            {emp.emp_id}
                          </span>
                        )}
                      </div>
                    </div>
                    {value === emp.id && <Check className="h-3.5 w-3.5 text-[#007AFF]" />}
                  </button>
                ));
              })()}
              {searchScope.filter(e => {
                const query = inlineSearchQuery.toLowerCase();
                const nameMatch = (e.name || "").toLowerCase().includes(query);
                const idMatch = (e.emp_id || "").toLowerCase().includes(query);
                return nameMatch || idMatch;
              }).length === 0 && (
                <span className="text-[12px] text-gray-400 py-3 text-center">No matching members</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleSaveBranches = async () => {
    setSaving(true);
    setError("");
    try {
      const oldBranches = companyDepts.filter((d: any) => d.delegation_config?.parent_id === departmentId);
      const added = selectedBranchIds.filter((id: any) => !oldBranches.some((b: any) => b.id === id));
      const removed = oldBranches.filter((b: any) => !selectedBranchIds.includes(b.id));

      // 1. Add new branches
      for (const id of added) {
        const deptToUpdate = companyDepts.find((d: any) => d.id === id);
        const newConfig = {
          ...(deptToUpdate?.delegation_config || {}),
          parent_id: departmentId
        };
        const { error: err } = await supabase
          .from("departments")
          .update({ delegation_config: newConfig })
          .eq("id", id);
        if (err) throw err;
      }

      // 2. Remove old branches (and convert them to main departments)
      for (const b of removed) {
        const companyId = b.company_id || companyDepts[0]?.company_id;
        
        // Fetch company name for initials
        const { data: comp } = await supabase
          .from("company_settings")
          .select("company_name")
          .eq("company_id", companyId)
          .maybeSingle();
        const companyName = comp?.company_name || "Dort Asia";
        const initials = getCompanyInitials(companyName);

        // Fetch all departments to determine next sequence number
        const { data: allDepts } = await supabase
          .from("departments")
          .select("id, dept_id")
          .eq("company_id", companyId);

        let nextSeq = 1;
        if (allDepts) {
          const seqs = allDepts
            .map((d: any) => {
              const match = (d.dept_id || "").match(/^[A-Z]+(\d+)DEPT\d+$/i);
              return match ? parseInt(match[1], 10) : 0;
            })
            .filter((val: number) => val > 0);
          if (seqs.length > 0) {
            nextSeq = Math.max(...seqs) + 1;
          }
        }

        let newDeptId = generateDeptId(initials, nextSeq);
        let attempts = 0;
        // Verify uniqueness
        while (attempts < 100) {
          const isDuplicate = allDepts?.some((d: any) => d.dept_id?.toUpperCase() === newDeptId.toUpperCase() && d.id !== b.id);
          if (!isDuplicate) {
            break;
          }
          nextSeq++;
          newDeptId = generateDeptId(initials, nextSeq);
          attempts++;
        }

        const newConfig = {
          ...(b.delegation_config || {}),
          parent_id: null
        };
        const { error: err } = await supabase
          .from("departments")
          .update({ 
            delegation_config: newConfig,
            dept_id: newDeptId
          })
          .eq("id", b.id);
        if (err) throw err;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        loadData();
        setActiveSubPanel(null);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to save branch departments.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddBranchDesignation = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newBranchDesignation.trim()) {
      if (!branchDesignations.includes(newBranchDesignation.trim())) {
        setBranchDesignations([...branchDesignations, newBranchDesignation.trim()]);
      }
      setNewBranchDesignation("");
    }
  };

  const handleRemoveBranchDesignation = (ds: string) => {
    setBranchDesignations(branchDesignations.filter(d => d !== ds));
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) {
      setError("Branch department name is required.");
      return;
    }
    if (branchDesignations.length === 0) {
      setError("At least one designation is required.");
      return;
    }

    setCreatingBranch(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if department name already exists
      const { data: existingDept } = await supabase
        .from("departments")
        .select("id")
        .eq("company_id", user.id)
        .eq("name", branchName.trim())
        .maybeSingle();

      if (existingDept) {
        setError("A department with this name already exists.");
        setCreatingBranch(false);
        return;
      }

      // Generate dept_id based on parent department's dept_id
      const compId = companyDepts[0]?.company_id || user.id;

      // Get parent department's dept_id
      const { data: parentDept } = await supabase
        .from("departments")
        .select("dept_id")
        .eq("id", departmentId)
        .single();

      const parentDeptId = parentDept?.dept_id || "RT0001DEPT26";

      // Fetch all departments in company to count sibling branch departments under this parent
      const { data: allDepts } = await supabase
        .from("departments")
        .select("id, dept_id, delegation_config")
        .eq("company_id", compId);

      const siblingBranches = allDepts?.filter((d: any) => d.delegation_config?.parent_id === departmentId) || [];

      let nextBranchSeq = 1;
      if (siblingBranches.length > 0) {
        const seqs = siblingBranches
          .map((d: any) => {
            const match = (d.dept_id || "").match(/B(\d+)/i);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter((val: number) => val > 0);
        if (seqs.length > 0) {
          nextBranchSeq = Math.max(...seqs) + 1;
        } else {
          nextBranchSeq = siblingBranches.length + 1;
        }
      }

      let generatedId = "";
      const match = parentDeptId.match(/^([A-Za-z]+)(\d+)(B\d+)?DEPT(\d+)$/i);
      if (match) {
        const initials = match[1];
        const seq = match[2];
        const year = match[4];
        generatedId = `${initials}${seq}B${nextBranchSeq}DEPT${year}`;
      } else {
        generatedId = `${parentDeptId}_B${nextBranchSeq}`;
      }

      // Check if generated dept_id is already in use
      const { data: existingBranchId } = await supabase
        .from("departments")
        .select("id")
        .eq("dept_id", generatedId)
        .maybeSingle();

      if (existingBranchId) {
        throw new Error("Generated Department ID is already in use. Please try again.");
      }

      // Insert new branch department
      const { error: insertErr } = await supabase
        .from("departments")
        .insert({
          name: branchName.trim(),
          description: branchDesc.trim(),
          designations: branchDesignations,
          company_id: compId,
          dept_id: generatedId,
          head_id: null,
          delegation_config: {
            parent_id: departmentId,
            claims: { main: "", sub: "" },
            attendance: { main: "", sub: "" },
            leave: { main: "", sub: "" },
            events: { main: "", sub: "" }
          }
        });

      if (insertErr) throw insertErr;

      setSuccess(true);
      setBranchName("");
      setBranchDesc("");
      setBranchDesignations([]);
      setNewBranchDesignation("");
      
      setTimeout(() => {
        setSuccess(false);
        loadData();
        setBranchTab('existing');
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to create branch department.");
    } finally {
      setCreatingBranch(false);
    }
  };

  if (!isOpen) return null;

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
        className="fixed inset-y-0 right-0 z-[100] w-full max-w-[440px] bg-white dark:bg-[#121217] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out translate-x-0"
      >
        
        {/* ── SCREEN 1: Main Config Screen ── */}
        {activeSubPanel === null && (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
              <div>
                <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
                  Configure {name}
                </h2>
                <p className="text-[12px] text-[#8E8E93] mt-0.5">Manage department settings and delegations</p>
              </div>
              <button onClick={handleClose} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                <X size={20} />
              </button>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF] border-t-transparent"></div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 page-scrollbar">
                
                <button 
                  onClick={() => setActiveSubPanel('settings')}
                  className="flex items-center justify-between p-5 bg-white dark:bg-[#1C1C1E] hover:bg-[#F8F9FA] dark:hover:bg-[#2C2C35] rounded-2xl text-left border border-[#E5E7EB] dark:border-[#2C2C35] transition-all"
                >
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-gray-900 dark:text-white">Department Settings</span>
                    <span className="text-[12px] font-medium text-gray-500 mt-1">Manage name, ID, head, and designations</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90" />
                </button>

                <button 
                  onClick={() => setActiveSubPanel('delegations')}
                  className="flex items-center justify-between p-5 bg-white dark:bg-[#1C1C1E] hover:bg-[#F8F9FA] dark:hover:bg-[#2C2C35] rounded-2xl text-left border border-[#E5E7EB] dark:border-[#2C2C35] transition-all"
                >
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-gray-900 dark:text-white">Department Delegations</span>
                    <span className="text-[12px] font-medium text-gray-500 mt-1">Manage approval authorities</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90" />
                </button>

                <button 
                  onClick={() => {
                    setActiveSubPanel('branches');
                    setError("");
                  }}
                  className="flex items-center justify-between p-5 bg-white dark:bg-[#1C1C1E] hover:bg-[#F8F9FA] dark:hover:bg-[#2C2C35] rounded-2xl text-left border border-[#E5E7EB] dark:border-[#2C2C35] transition-all"
                >
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-gray-900 dark:text-white">Department Branch</span>
                    <span className="text-[12px] font-medium text-gray-500 mt-1">Manage sub-departments and branch structures</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90" />
                </button>

              </div>
            )}
            
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

        {/* ── SCREEN 2: Department Settings ── */}
        {activeSubPanel === 'settings' && (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveSubPanel(null)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-lg text-gray-500 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Department Settings</h2>
                  <p className="text-[12px] text-[#8E8E93] mt-0.5">Manage basic details and designations</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 page-scrollbar">
              
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-gray-900 dark:text-white">Department Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] dark:focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-gray-900 dark:text-white">Department ID</label>
                <input
                  type="text"
                  value={editableId}
                  onChange={e => setEditableId(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] dark:focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors"
                />
                <p className="text-[11px] text-[#8E8E93] italic">Updating ID may cause references to break.</p>
              </div>

              {renderSelect("Department Head", "dept-head", headId)}

              {name !== "Admin Department" && (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-gray-900 dark:text-white">Designations</label>
                    <input
                      type="text"
                      value={newDesignation}
                      onChange={e => setNewDesignation(e.target.value)}
                      onKeyDown={handleAddDesignation}
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] dark:focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors"
                      placeholder="Type and press Enter..."
                    />
                  </div>

                  {designations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {designations.map(ds => (
                        <div key={ds} className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#2C2C35] px-3 py-1.5 rounded-lg group">
                          <span className="text-[12.5px] font-bold text-gray-900 dark:text-white">{ds}</span>
                          <button 
                             onClick={() => handleRemoveDesignation(ds)}
                             className="text-gray-400 hover:text-[#FF3B30] transition-colors"
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={3} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

            </div>

            <div className="p-6 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">{error}</div>}
              {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-semibold border border-green-100 flex items-center gap-2"><Check size={16}/> Saved successfully</div>}
              
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-[16px] text-[15px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={18} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* ── SCREEN 3: Department Delegations ── */}
        {activeSubPanel === 'delegations' && (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveSubPanel(null)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-lg text-gray-500 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Department Delegations</h2>
                  <p className="text-[12px] text-[#8E8E93] mt-0.5">Manage approval authorities</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 page-scrollbar">
              
              <div className="flex flex-col gap-4">
                <h3 className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-wider">Claim Approval</h3>
                <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50/50 dark:bg-[#1C1C22]/50 border border-gray-100 dark:border-[#2C2C35] rounded-2xl">
                  {renderSelect("Main Authority (Admin)", "claims-main", delegationConfig?.claims?.main || headId)}
                  {renderSelect("Sub Authority (Sub Admin)", "claims-sub", delegationConfig?.claims?.sub || headId)}
                </div>
              </div>

              <div className="w-full h-px bg-gray-100 dark:bg-[#2C2C35]" />

              <div className="flex flex-col gap-4">
                <h3 className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-wider">Attendance</h3>
                <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50/50 dark:bg-[#1C1C22]/50 border border-gray-100 dark:border-[#2C2C35] rounded-2xl">
                  {renderSelect("Main Authority (Admin)", "attendance-main", delegationConfig?.attendance?.main || headId)}
                  {renderSelect("Sub Authority (Sub Admin)", "attendance-sub", delegationConfig?.attendance?.sub || headId)}
                </div>
              </div>

              <div className="w-full h-px bg-gray-100 dark:bg-[#2C2C35]" />

              <div className="flex flex-col gap-4">
                <h3 className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-wider">Leave Approval</h3>
                <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50/50 dark:bg-[#1C1C22]/50 border border-gray-100 dark:border-[#2C2C35] rounded-2xl">
                  {renderSelect("Main Authority (Admin)", "leave-main", delegationConfig?.leave?.main || headId)}
                  {renderSelect("Sub Authority (Sub Admin)", "leave-sub", delegationConfig?.leave?.sub || headId)}
                </div>
              </div>

              <div className="w-full h-px bg-gray-100 dark:bg-[#2C2C35]" />

              <div className="flex flex-col gap-4">
                <h3 className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-wider">Events</h3>
                <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50/50 dark:bg-[#1C1C22]/50 border border-gray-100 dark:border-[#2C2C35] rounded-2xl">
                  {renderSelect("Main Authority (Admin)", "events-main", delegationConfig?.events?.main || headId)}
                  {renderSelect("Sub Authority (Sub Admin)", "events-sub", delegationConfig?.events?.sub || headId)}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">{error}</div>}
              {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-semibold border border-green-100 flex items-center gap-2"><Check size={16}/> Saved successfully</div>}
              
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-[16px] text-[15px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={18} />
                    Save Delegations
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* ── SCREEN 4: Department Branches ── */}
        {activeSubPanel === 'branches' && (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35] shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setActiveSubPanel(null);
                    setError("");
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-lg text-gray-500 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Department Branch</h2>
                  <p className="text-[12px] text-[#8E8E93] mt-0.5">Manage sub-departments / branches</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                <X size={20} />
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex px-6 pt-4 pb-2 border-b border-[#F2F2F7] dark:border-[#2C2C35] gap-4 shrink-0">
              <button
                type="button"
                onClick={() => { setBranchTab('existing'); setError(""); }}
                className={`pb-2 text-[14px] font-bold transition-all border-b-2 ${branchTab === 'existing' ? 'border-[#007AFF] text-[#007AFF]' : 'border-transparent text-gray-400'}`}
              >
                Choose Existing
              </button>
              <button
                type="button"
                onClick={() => { setBranchTab('new'); setError(""); }}
                className={`pb-2 text-[14px] font-bold transition-all border-b-2 ${branchTab === 'new' ? 'border-[#007AFF] text-[#007AFF]' : 'border-transparent text-gray-400'}`}
              >
                Create New
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 page-scrollbar">
              {/* Authorization check */}
              {!(userRole === "Super Admin" || (currentUserEmp && currentUserEmp.id === headId)) ? (
                <div className="p-4 bg-[#FFF1F1] border border-[#DC2626]/20 rounded-2xl text-[13px] font-semibold text-[#DC2626] leading-relaxed">
                  Only the head of this department or a Super Admin is authorized to configure or create branch departments.
                </div>
              ) : branchTab === 'existing' ? (
                /* CHOOSE EXISTING DEPARTMENTS */
                <div className="flex flex-col gap-4">
                  <p className="text-[12.5px] font-medium text-gray-500 leading-relaxed">
                    Select existing departments to link them as sub-departments (branches) under this department:
                  </p>
                  
                  <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto page-scrollbar pr-1">
                    {companyDepts.filter((d: any) => 
                      d.id !== departmentId && 
                      d.name !== "Admin Department"
                    ).map((d: any) => {
                      const isChecked = selectedBranchIds.includes(d.id);
                      return (
                        <label 
                          key={d.id} 
                          className={`flex items-center gap-3.5 p-4 rounded-[16px] border text-left transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-[#E5F1FF] dark:bg-[#007AFF]/10 border-[#007AFF]/30'
                              : 'bg-gray-50 dark:bg-[#1C1C1E] border-transparent hover:border-gray-200 dark:hover:border-white/10'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedBranchIds(selectedBranchIds.filter((x: any) => x !== d.id));
                              } else {
                                setSelectedBranchIds([...selectedBranchIds, d.id]);
                              }
                            }}
                            className="h-4.5 w-4.5 rounded border-gray-300 dark:border-gray-700 text-[#007AFF] focus:ring-[#007AFF]"
                          />
                          <div className="flex flex-col">
                            <span className="text-[13.5px] font-bold text-gray-900 dark:text-white leading-none mb-1">
                              {d.name}
                            </span>
                            {d.delegation_config?.parent_id && d.delegation_config.parent_id !== departmentId && (
                              <span className="text-[11px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-md w-fit leading-none mt-0.5">
                                Sub-dept of: {companyDepts.find((x: any) => x.id === d.delegation_config.parent_id)?.name || 'Other'}
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                    {companyDepts.filter((d: any) => d.id !== departmentId && d.name !== "Admin Department").length === 0 && (
                      <span className="text-[13px] text-gray-400 text-center py-6">No other departments available</span>
                    )}
                  </div>
                </div>
              ) : (
                /* CREATE NEW BRANCH DEPARTMENT */
                <form onSubmit={handleCreateBranch} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-gray-900 dark:text-white">Department Name *</label>
                    <input
                      type="text"
                      value={branchName}
                      onChange={e => setBranchName(e.target.value)}
                      placeholder="e.g. Frontend Engineering"
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] dark:focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-gray-900 dark:text-white">Description</label>
                    <textarea
                      value={branchDesc}
                      onChange={e => setBranchDesc(e.target.value)}
                      placeholder="Enter branch description..."
                      rows={3}
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] dark:focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-gray-900 dark:text-white">Designations *</label>
                    <input
                      type="text"
                      value={newBranchDesignation}
                      onChange={e => setNewBranchDesignation(e.target.value)}
                      onKeyDown={handleAddBranchDesignation}
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] dark:focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors mb-2"
                      placeholder="Type and press Enter..."
                    />
                    
                    {branchDesignations.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {branchDesignations.map(ds => (
                          <div key={ds} className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#2C2C35] px-3 py-1.5 rounded-lg">
                            <span className="text-[12px] font-bold text-gray-900 dark:text-white">{ds}</span>
                            <button 
                              type="button"
                              onClick={() => handleRemoveBranchDesignation(ds)}
                              className="text-gray-400 hover:text-[#FF3B30] transition-colors"
                            >
                              <X className="h-3 w-3" strokeWidth={3} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Panel Footer */}
            <div className="p-6 border-t border-[#F2F2F7] dark:border-[#2C2C35] shrink-0">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">{error}</div>}
              {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-semibold border border-green-100 flex items-center gap-2"><Check size={16}/> Action successful</div>}

              {(userRole === "Super Admin" || (currentUserEmp && currentUserEmp.id === headId)) && (
                branchTab === 'existing' ? (
                  <button
                    onClick={handleSaveBranches}
                    disabled={saving}
                    className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-[16px] text-[15px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check size={18} />
                        Save Branches
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleCreateBranch}
                    disabled={creatingBranch}
                    className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-[16px] text-[15px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {creatingBranch ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus size={18} />
                        Create Branch Department
                      </>
                    )}
                  </button>
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* Dropdown overlay removed in favor of premium inline combobox dropdown */}
    </>
  );
}

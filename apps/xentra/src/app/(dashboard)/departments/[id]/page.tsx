"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronDown, Search, SlidersHorizontal, Settings, ShieldAlert, Check, Bell, AlertTriangle, Users, LogOut, LogIn, Briefcase, MoreHorizontal, Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getAvatarColor, getInitials as getAvatarInitials } from "@/utils/avatarColor";
import { useAppStore } from "@/store";
import EmployeeCardsRenderer from "@/app/(dashboard)/employees/EmployeeCardsRenderer";
import ConfigureDepartmentPanel from "@/components/ConfigureDepartmentPanel";
import DepartmentActionsPanel from "@/components/DepartmentActionsPanel";
import DepartmentNotificationsPanel from "@/components/DepartmentNotificationsPanel";
import DepartmentAlertsPanel from "@/components/DepartmentAlertsPanel";


type DepartmentDetails = {
  id: string;
  name: string;
  designations?: string[];
  head_id?: string;
};

export default function DepartmentTeamPage() {
  const router = useRouter();
  const params = useParams();
  const departmentId = params.id as string;

  const [department, setDepartment] = useState<DepartmentDetails | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigurePanelOpen, setIsConfigurePanelOpen] = useState(false);
  const [isPlusPanelOpen, setIsPlusPanelOpen] = useState(false);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const [isAlertsPanelOpen, setIsAlertsPanelOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAdminDept, setIsAdminDept] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [plusPanelScreen, setPlusPanelScreen] = useState<"menu" | "reportee" | "transfer" | "event">("menu");
  const [plusPanelEmployeeId, setPlusPanelEmployeeId] = useState<string>("");
  const [companyEmployees, setCompanyEmployees] = useState<any[]>([]);
  const [selectedForceHeadId, setSelectedForceHeadId] = useState("");
  const [isAssigningForceHead, setIsAssigningForceHead] = useState(false);
  const [searchQueryForceHead, setSearchQueryForceHead] = useState("");
  const [openSelectForceHead, setOpenSelectForceHead] = useState(false);

  // Super Admin info (from company_settings, not from employees table)
  const [superAdminInfo, setSuperAdminInfo] = useState<{
    name: string; role: string; avatarUrl: string | null;
  } | null>(null);

  const [deptHeadInfo, setDeptHeadInfo] = useState<{
    id: string; name: string; role: string; avatar_url: string | null;
  } | null>(null);

  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  const cachedSidebar = useAppStore((s) => s.cachedSidebar);
  const isSuperAdmin = cachedSidebar?.isSuperAdmin ?? false;

  const [extraAdmins, setExtraAdmins] = useState<any[]>([]);
  const [selectedHeadId, setSelectedHeadId] = useState<string>("");
  const [isResolvingSubmit, setIsResolvingSubmit] = useState(false);

  const loadData = async () => {
      setIsLoading(true);
      const supabase = createClient();
      
      // Get current user to determine company_id
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: curEmp } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (curEmp) {
          setCurrentEmployeeId(curEmp.id);
        }
      }
      
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .eq('id', departmentId)
        .single();
        
      if (deptData) {
        setDepartment(deptData);
        setIsAdminDept(deptData.name === "Admin Department");
      } else {
        console.error(deptError);
      }

      const isAdmin = deptData?.name === "Admin Department";

      // If Admin Department, fetch Super Admin info from company_settings
      if (isAdmin && user) {
        const companyId = deptData?.company_id || user.id;
        const { data: compSettings } = await supabase
          .from('company_settings')
          .select('super_admin_name, super_admin_role, super_admin_avatar_url')
          .eq('company_id', companyId)
          .single();
        
        if (compSettings) {
          setSuperAdminInfo({
            name: compSettings.super_admin_name || "Super Admin",
            role: compSettings.super_admin_role || "Super Admin",
            avatarUrl: compSettings.super_admin_avatar_url || null,
          });
        }
      } else {
        setSuperAdminInfo(null);
      }

      // Fetch directly-assigned employees
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('*, departments!fk_employees_department(department_name)')
        .eq('department_id', departmentId)
        .order('name', { ascending: true });

      let allMapped: any[] = [];

      if (!empError && empData) {
        const mapped = empData.map((emp: any) => {
          const { bg, color } = getAvatarColor(emp.name);
          const initials = getAvatarInitials(emp.name);
          const deptName = emp.departments?.department_name || deptData?.name || "General";
          const isComplete = !!(emp.emp_id && emp.department_id);
          return {
            id: emp.id,
            name: emp.name,
            role: emp.role || "Employee",
            designation: emp.designation || emp.role || "Employee",
            empId: emp.emp_id,
            department: deptName,
            email: emp.email,
            mobile: emp.mobile || "-",
            jobType: emp.job_type || "Full Time",
            initials,
            isComplete,
            color,
            bg,
            avatar_url: emp.avatar_url,
            currentProject: Array.isArray(emp.custom_fields?.assignedProjects)
              ? emp.custom_fields.assignedProjects.join(', ')
              : (emp.current_project || emp.custom_fields?.project_name || null),
            baseSalary: emp.salary || null,
          };
        });
        allMapped = [...mapped];
      }

      // If Admin Department, also fetch all Admins from other departments
      if (isAdmin && user) {
        const companyId = deptData?.company_id || user.id;
        const { data: adminEmps } = await supabase
          .from('employees')
          .select('*, departments!fk_employees_department(department_name)')
          .eq('company_id', companyId)
          .eq('role', 'Admin')
          .neq('department_id', departmentId)
          .order('name', { ascending: true });

        if (adminEmps) {
          const existingIds = new Set(allMapped.map(e => e.id));
          const crossDeptAdmins = adminEmps
            .filter((emp: any) => !existingIds.has(emp.id))
            .map((emp: any) => {
              const { bg, color } = getAvatarColor(emp.name);
              const initials = getAvatarInitials(emp.name);
              const deptName = emp.departments?.department_name || "Other";
              const isComplete = !!(emp.emp_id && emp.department_id);
              return {
                id: emp.id,
                name: emp.name,
                role: emp.role || "Admin",
                designation: emp.designation || emp.role || "Employee",
                empId: emp.emp_id,
                department: deptName,
                email: emp.email,
                mobile: emp.mobile || "-",
                jobType: emp.job_type || "Full Time",
                initials,
                isComplete,
                color,
                bg,
                avatar_url: emp.avatar_url,
                currentProject: Array.isArray(emp.custom_fields?.assignedProjects)
                  ? emp.custom_fields.assignedProjects.join(', ')
                  : (emp.current_project || emp.custom_fields?.project_name || null),
                baseSalary: emp.salary || null,
              };
            });
          allMapped = [...allMapped, ...crossDeptAdmins];
        }
      }

      // Fetch department head details if set and not in current department
      if (deptData?.head_id && !isAdmin) {
        const headInDept = empData?.find((e: any) => e.id === deptData.head_id);
        if (headInDept) {
          setDeptHeadInfo({
            id: headInDept.id,
            name: headInDept.name,
            role: headInDept.designation || headInDept.role || "Employee",
            avatar_url: headInDept.avatar_url,
          });
        } else {
          const { data: headData } = await supabase
            .from('employees')
            .select('*')
            .eq('id', deptData.head_id)
            .maybeSingle();
          if (headData) {
            setDeptHeadInfo({
              id: headData.id,
              name: headData.name,
              role: headData.designation || headData.role || "Employee",
              avatar_url: headData.avatar_url,
            });
          } else {
            setDeptHeadInfo(null);
          }
        }
      } else {
        setDeptHeadInfo(null);
      }

      let conflictAdmins: any[] = [];
      if (deptData && deptData.name !== "Admin Department" && !empError && empData) {
        conflictAdmins = empData.filter((emp: any) => emp.role === "Admin");
      }

      if (conflictAdmins.length > 1) {
        setExtraAdmins(conflictAdmins);
        if (deptData?.head_id) {
          setSelectedHeadId(deptData.head_id);
        } else {
          setSelectedHeadId(conflictAdmins[0].id);
        }
      } else {
        setExtraAdmins([]);
      }

      setEmployees(allMapped.filter((emp: any) => emp.id !== deptData?.head_id));

      let allCompanyEmps: any[] = [];
      if (!deptData?.head_id && deptData?.name !== "Admin Department" && user) {
        const companyId = deptData.company_id || user.id;
        const { data: compEmps } = await supabase
          .from('employees')
          .select('id, name, email, emp_id, role, avatar_url')
          .eq('company_id', companyId)
          .order('name');
        if (compEmps) {
          allCompanyEmps = compEmps.filter((emp: any) => emp.role === "Admin");
        }
      }
      setCompanyEmployees(allCompanyEmps);

      setIsLoading(false);
  };

  const handleAssignForceHead = async () => {
    if (!selectedForceHeadId) return;
    setIsAssigningForceHead(true);
    const supabase = createClient();
    try {
      const { error: empErr } = await supabase
        .from("employees")
        .update({ role: "Admin", is_head: true })
        .eq("id", selectedForceHeadId);
      
      if (empErr) throw empErr;

      const { error: deptErr } = await supabase
        .from("departments")
        .update({ head_id: selectedForceHeadId })
        .eq("id", departmentId);
      
      if (deptErr) throw deptErr;

      await loadData();
    } catch (err: any) {
      alert("Failed to assign department head: " + err.message);
    } finally {
      setIsAssigningForceHead(false);
    }
  };

  const handleRemoveFromDepartment = async (empId: string, empName: string) => {
    if (!confirm(`Are you sure you want to remove ${empName} from this department?`)) return;
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("employees")
        .update({ department_id: null })
        .eq("id", empId);
      
      if (error) throw error;
      alert(`${empName} has been removed from this department.`);
      loadData();
    } catch (err: any) {
      alert("Failed to remove employee: " + err.message);
    }
  };

  const handleBlock = (empId: string, empName: string) => {
    if (confirm(`Are you sure you want to block ${empName}?`)) {
      alert(`${empName} has been blocked.`);
    }
  };

  useEffect(() => {
    if (departmentId) {
      loadData();
    }
  }, [departmentId, departmentId]); // Added dependency to match logic

  const handleResolveAdmins = async () => {
    setIsResolvingSubmit(true);
    const supabase = createClient();
    try {
      const headIdToSet = selectedHeadId || department?.head_id;
      if (!headIdToSet) {
        alert("Please select a Department Head.");
        setIsResolvingSubmit(false);
        return;
      }

      // 1. Update the head employee: role = "Admin", is_head = true
      await supabase
        .from("employees")
        .update({ role: "Admin", is_head: true })
        .eq("id", headIdToSet);

      // 2. Update all other admins in this department to Sub Admin, is_head = false
      const extraAdminIds = extraAdmins
        .filter((emp) => emp.id !== headIdToSet)
        .map((emp) => emp.id);

      if (extraAdminIds.length > 0) {
        await supabase
          .from("employees")
          .update({ role: "Sub Admin", is_head: false })
          .in("id", extraAdminIds);
      }

      // 3. Update the department head_id
      await supabase
        .from("departments")
        .update({ head_id: headIdToSet })
        .eq("id", departmentId);

      // 4. Reload page data
      await loadData();
    } catch (err) {
      console.error("Error resolving admins:", err);
    } finally {
      setIsResolvingSubmit(false);
    }
  };

  // For Admin Department: use Super Admin as head; otherwise use employee-based head
  const headName = isAdminDept && superAdminInfo 
    ? superAdminInfo.name 
    : (deptHeadInfo?.name || "Unassigned");
  const headInitials = getAvatarInitials(headName);
  const headColor = getAvatarColor(headName);
  const headAvatarUrl = isAdminDept && superAdminInfo 
    ? superAdminInfo.avatarUrl 
    : (deptHeadInfo?.avatar_url || null);

  const deptInitials = department ? getAvatarInitials(department.name) : "??";
  const deptColor = department ? getAvatarColor(department.name) : { bg: "#ccc", color: "#666" };
  const designationsCount = department?.designations?.length || 0;

  const withoutProjectCount = employees.filter(e => !e.currentProject || e.currentProject === "-" || e.currentProject === "No Project").length;

  return (
    <div 
      onClick={() => setOpenMenuId(null)}
      className="flex-1 flex flex-col overflow-y-auto page-scrollbar bg-white dark:bg-[#121217]"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6">
        <div>
          <button
            onClick={() => router.push('/departments')}
            className="flex items-center gap-1.5 text-[#007AFF] hover:text-[#0062CC] font-bold text-[14px] transition-colors focus:outline-none"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={3} />
            Back
          </button>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => {
              setPlusPanelScreen("menu");
              setPlusPanelEmployeeId("");
              setIsPlusPanelOpen(true);
            }}
            className="h-10 w-10 bg-[#007AFF] hover:bg-[#0063CC] text-white flex items-center justify-center rounded-[12px] shadow-sm transition-colors focus:outline-none"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => setIsNotificationsPanelOpen(true)}
            className="h-10 w-10 bg-[#007AFF] hover:bg-[#0063CC] text-white flex items-center justify-center rounded-[12px] shadow-sm transition-colors focus:outline-none"
          >
            <Bell className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => setIsAlertsPanelOpen(true)}
            className="h-10 w-10 bg-[#007AFF] hover:bg-[#0063CC] text-white flex items-center justify-center rounded-[12px] shadow-sm transition-colors focus:outline-none"
          >
            <AlertTriangle className="h-4 w-4" strokeWidth={2.5} />
          </button>
          {isSuperAdmin && (
            <button 
              onClick={() => setIsConfigurePanelOpen(true)}
              className="h-10 w-10 bg-[#007AFF] hover:bg-[#0063CC] text-white flex items-center justify-center rounded-[12px] shadow-sm transition-colors focus:outline-none"
            >
              <Settings className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-6 pb-8 flex flex-col gap-8">
        {isLoading ? (
          <div className="flex items-center justify-center flex-1 min-h-[400px]">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--user-accent)] border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Department Info Card */}
            <div className="bg-[#f8f9fa] dark:bg-[#1C1C1E] rounded-[24px] p-6 flex flex-wrap items-center justify-between gap-6">
              {/* Left side: Dept Logo & Name */}
              <div className="flex items-center gap-4">
                <div 
                  className="h-[72px] w-[72px] rounded-[16px] flex items-center justify-center text-[28px] font-bold shrink-0"
                  style={{ backgroundColor: deptColor.bg, color: '#ffffff' }}
                >
                  {deptInitials}
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#86868b] leading-none mb-1.5">Department Name</p>
                  <h1 className="text-[20px] font-bold text-[#1d1d1f] dark:text-white leading-none">
                    {department?.name || "Loading..."}
                  </h1>
                </div>
              </div>

              {/* Right side: Manager Avatar & Name */}
              <div className="flex items-center gap-4">
                <div 
                  className="h-[52px] w-[52px] rounded-full flex items-center justify-center text-[20px] font-bold shrink-0 overflow-hidden"
                  style={{ backgroundColor: headAvatarUrl ? undefined : headColor.bg, color: headAvatarUrl ? undefined : headColor.color }}
                >
                  {headAvatarUrl ? (
                    <img src={headAvatarUrl} alt={headName} className="h-full w-full object-cover" />
                  ) : (
                    headInitials
                  )}
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#86868b] leading-none mb-1.5 text-right">Department Manager</p>
                  <p className="text-[16px] font-bold text-[#1d1d1f] dark:text-white leading-none text-right">
                    {headName}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Strip */}
            <div className="bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C35] rounded-[16px] px-8 py-4 flex items-center justify-between mt-1">
              <div className="flex items-center gap-3">
                <div className="h-[28px] w-[28px] rounded-[6px] bg-[#f2f2f7] dark:bg-[#2C2C35] flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-[#86868b]" />
                </div>
                <p className="text-[12px] font-semibold text-[#86868b]">Total Employees</p>
                <p className="text-[15px] font-bold text-[#1d1d1f] dark:text-white ml-2">{employees.length}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-[28px] w-[28px] rounded-[6px] bg-[#f2f2f7] dark:bg-[#2C2C35] flex items-center justify-center shrink-0">
                  <LogOut className="h-4 w-4 text-[#86868b]" />
                </div>
                <p className="text-[12px] font-semibold text-[#86868b]">Outgoing Employees</p>
                <p className="text-[15px] font-bold text-[#1d1d1f] dark:text-white ml-2">0</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-[28px] w-[28px] rounded-[6px] bg-[#f2f2f7] dark:bg-[#2C2C35] flex items-center justify-center shrink-0">
                  <LogIn className="h-4 w-4 text-[#86868b]" />
                </div>
                <p className="text-[12px] font-semibold text-[#86868b]">Incoming Employees</p>
                <p className="text-[15px] font-bold text-[#1d1d1f] dark:text-white ml-2">0</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-[28px] w-[28px] rounded-[6px] bg-[#f2f2f7] dark:bg-[#2C2C35] flex items-center justify-center shrink-0">
                  <Briefcase className="h-4 w-4 text-[#86868b]" />
                </div>
                <p className="text-[12px] font-semibold text-[#86868b]">Employees Without Project</p>
                <p className="text-[15px] font-bold text-[#1d1d1f] dark:text-white ml-2">{withoutProjectCount}</p>
              </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex items-end justify-between mt-2">
              <div className="flex items-center gap-6 border-b border-[#E5E5EA] dark:border-[#2C2C35] w-[60%]">
                <button className="pb-3 text-[14px] font-bold text-[#007AFF] border-b-[3px] border-[#007AFF] transition-colors">
                  Department Employees
                </button>
                <button className="pb-3 text-[14px] font-bold text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-white transition-colors">
                  Outgoing Employees
                </button>
                <button className="pb-3 text-[14px] font-bold text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-white transition-colors">
                  Incoming Employees
                </button>
                <button className="pb-3 text-[14px] font-bold text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-white transition-colors">
                  Log History
                </button>
              </div>
              
              <div className="flex items-center gap-3 w-[35%] justify-end pb-2">
                <div className="relative w-full max-w-[280px]">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="h-4 w-4" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search Employee" 
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C35] rounded-full text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition-all placeholder:text-[#a1a1a6]"
                  />
                </div>
                <button className="h-[36px] w-[36px] bg-[#f8f9fb] dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C35] flex items-center justify-center rounded-[10px] text-[#86868b] hover:bg-gray-100 dark:hover:bg-[#2C2C35] transition-colors shrink-0 focus:outline-none">
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Table & Pagination Wrapper */}
            <div className="bg-white dark:bg-[#121217] rounded-[24px] overflow-hidden border border-gray-100 dark:border-[#2C2C35] mt-1">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8F9FA] dark:bg-black/20 border-b border-gray-100 dark:border-white/5">
                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide w-[35%]">Employee</th>
                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide w-[25%]">Projects</th>
                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide w-[15%]">Status</th>
                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide w-[15%]">Base Salary</th>
                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-right w-[10%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const paginatedEmployees = employees.slice((page - 1) * pageSize, page * pageSize);
                      return paginatedEmployees.map((emp) => (
                        <tr key={emp.id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="h-[38px] w-[38px] rounded-full flex items-center justify-center text-[11.5px] font-bold shrink-0 overflow-hidden text-white"
                                style={{ backgroundColor: emp.avatar_url ? undefined : emp.bg, color: emp.avatar_url ? undefined : emp.color }}
                              >
                                {emp.avatar_url ? (
                                  <img src={emp.avatar_url} alt={emp.name} className="h-full w-full object-cover" />
                                ) : (
                                  emp.initials
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[14px] font-bold text-[#1d1d1f] dark:text-white leading-tight">{emp.name}</span>
                                <span className="text-[11.5px] font-semibold text-[#86868b] dark:text-gray-400 mt-0.5 leading-none">{emp.empId || "EMP-N/A"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-[13px] font-semibold text-[#86868b]">
                            {emp.currentProject || "-"}
                          </td>
                          <td className="px-5 py-4">
                             <span className="inline-flex items-center px-2 py-1 rounded-[6px] text-[11px] font-bold bg-[#34C759]/10 text-[#34C759]">
                               Active
                             </span>
                          </td>
                          <td className="px-5 py-4 text-[13px] font-bold text-[#1d1d1f] dark:text-white">
                            {emp.baseSalary ? `$${emp.baseSalary.toLocaleString()}` : "-"}
                          </td>
                          <td className="px-5 py-4 text-right relative">
                             <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === emp.id ? null : emp.id);
                                }}
                                className="text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-white transition-colors p-1 focus:outline-none"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                             </button>
 
                             {openMenuId === emp.id && (
                               <div className="absolute right-6 top-10 w-48 bg-white dark:bg-[#1C1C1E] shadow-xl rounded-[12px] border border-gray-100 dark:border-[#2C2C35] py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                                 <button 
                                   onClick={() => { router.push(`/employees/${emp.id}`); setOpenMenuId(null); }}
                                   className="w-full text-left px-4 py-2 text-[13px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                                 >
                                   View Profile
                                 </button>
                                 <button 
                                   onClick={() => { router.push(`/employees/${emp.id}/edit`); setOpenMenuId(null); }}
                                   className="w-full text-left px-4 py-2 text-[13px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                                 >
                                   Edit Profile
                                 </button>
                                 <div className="border-t border-gray-100 dark:border-[#2C2C35] my-1" />
                                 <button 
                                   onClick={() => { handleBlock(emp.id, emp.name); setOpenMenuId(null); }}
                                   className="w-full text-left px-4 py-2 text-[13px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                                 >
                                   Block Employee
                                 </button>
                                 <button 
                                   onClick={() => {
                                     setPlusPanelScreen("transfer");
                                     setPlusPanelEmployeeId(emp.id);
                                     setIsPlusPanelOpen(true);
                                     setOpenMenuId(null);
                                   }}
                                   className="w-full text-left px-4 py-2 text-[13px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                                 >
                                   Transfer Employee
                                 </button>
                                 <button 
                                   onClick={() => { handleRemoveFromDepartment(emp.id, emp.name); setOpenMenuId(null); }}
                                   className="w-full text-left px-4 py-2 text-[13px] font-bold text-[#FF3B30] hover:bg-[#FF3B30]/10"
                                 >
                                   Remove from Department
                                 </button>
                               </div>
                             )}
                          </td>
                        </tr>
                      ));
                    })()}
                    {employees.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center">
                          <span className="text-[14px] font-medium text-[#86868b]">No team members found.</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Footer */}
            {employees.length > 0 && (() => {
              const totalPages = Math.ceil(employees.length / pageSize);
              return (
                <div className="flex items-center justify-between mt-4 px-1">
                  {/* Count */}
                  <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">
                    Showing {employees.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, employees.length)} of {employees.length} employees
                  </span>

                  {/* Pages + size */}
                  <div className="flex items-center gap-2">
                    {/* Prev */}
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-8 w-8 flex items-center justify-center rounded-[8px] bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] text-gray-600 dark:text-gray-400 hover:border-[#007AFF]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                      Math.max(0, page - 3),
                      Math.max(4, page + 1)
                    ).map(pg => (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className={`h-8 w-8 flex items-center justify-center rounded-[8px] text-[13px] font-bold transition-colors ${
                          pg === page
                            ? "bg-[#007AFF] text-white shadow-sm"
                            : "bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C35] text-gray-700 dark:text-gray-300 hover:border-[#007AFF]/40"
                        }`}
                      >
                        {pg}
                      </button>
                    ))}

                    {/* Next */}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || totalPages === 0}
                      className="h-8 w-8 flex items-center justify-center rounded-[8px] bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] text-gray-600 dark:text-gray-400 hover:border-[#007AFF]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>

                    {/* Page size select */}
                    <div className="relative ml-2">
                      <select
                        value={pageSize}
                        onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                        className="appearance-none bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] rounded-[8px] pl-3 pr-7 py-1.5 text-[12px] font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 cursor-pointer"
                      >
                        {[10, 20, 50].map(s => <option key={s} value={s}>{s} / page</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </main>

      {/* Modals & Panels */}
      
      <ConfigureDepartmentPanel
        departmentId={departmentId}
        isOpen={isConfigurePanelOpen}
        onClose={() => setIsConfigurePanelOpen(false)}
        onSuccess={loadData}
      />

      <DepartmentActionsPanel
        departmentId={departmentId}
        departmentEmployees={employees}
        isOpen={isPlusPanelOpen}
        onClose={() => setIsPlusPanelOpen(false)}
        onSuccess={loadData}
        initialScreen={plusPanelScreen}
        initialEmployeeId={plusPanelEmployeeId}
      />

      <DepartmentNotificationsPanel
        departmentId={departmentId}
        departmentName={department?.name || "Department"}
        isOpen={isNotificationsPanelOpen}
        onClose={() => setIsNotificationsPanelOpen(false)}
        onSuccess={loadData}
      />

      <DepartmentAlertsPanel
        departmentId={departmentId}
        departmentName={department?.name || "Department"}
        isOpen={isAlertsPanelOpen}
        onClose={() => setIsAlertsPanelOpen(false)}
      />

      {!isLoading && department && !department.head_id && !isAdminDept && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-3xl max-w-lg w-full p-8 flex flex-col gap-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="mx-auto h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-[#007AFF]">
              <Users className="h-8 w-8" strokeWidth={2} />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Assign Department Head Required
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                Under Singapore-compliant HR guidelines, each department must have a designated Admin (Department Head) before it can be accessed.
              </p>
            </div>

            <div className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-2 relative" onClick={(e) => e.stopPropagation()}>
                <label className="text-[13px] font-bold text-gray-900 dark:text-white">Choose Department Head</label>
                
                {openSelectForceHead ? (
                  <div className="w-full relative">
                    <input 
                      type="text"
                      value={searchQueryForceHead}
                      onChange={(e) => setSearchQueryForceHead(e.target.value)}
                      placeholder="Search company employees..."
                      className="w-full h-[52px] px-4 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#007AFF] rounded-[14px] text-[13.5px] font-bold outline-none shadow-sm shadow-[#007AFF]/10 pr-10"
                      autoFocus
                    />
                    <ChevronDown 
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 rotate-180 cursor-pointer" 
                      onClick={() => setOpenSelectForceHead(false)}
                    />
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => {
                      setOpenSelectForceHead(true);
                      setSearchQueryForceHead("");
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] hover:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors`}
                  >
                    {(() => {
                      const selected = companyEmployees.find(e => e.id === selectedForceHeadId);
                      return selected ? (
                        <span className="text-[13.5px] font-bold text-gray-900 dark:text-white">{selected.name}</span>
                      ) : (
                        <span className="text-[13.5px] font-medium text-gray-400">Select an employee...</span>
                      );
                    })()}
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                )}

                {openSelectForceHead && (
                  <div className="p-4 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-2xl shadow-lg flex flex-col gap-3 z-50 absolute top-[85px] left-0 right-0">
                    <div className="max-h-[160px] overflow-y-auto page-scrollbar flex flex-col gap-1">
                      {(() => {
                        const query = searchQueryForceHead.toLowerCase().trim();
                        const filtered = companyEmployees.filter(emp => 
                          ((emp.name || "").toLowerCase().includes(query) || (emp.emp_id || "").toLowerCase().includes(query)) &&
                          emp.role === "Admin"
                        );

                        if (filtered.length === 0) {
                          return <span className="text-[12px] text-gray-400 py-3 text-center">No matches found</span>;
                        }

                        return filtered.map(emp => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => {
                              setSelectedForceHeadId(emp.id);
                              setOpenSelectForceHead(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                              selectedForceHeadId === emp.id 
                                ? 'bg-[#007AFF]/10 text-[#007AFF] font-bold' 
                                : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {emp.avatar_url ? (
                                <img 
                                  src={emp.avatar_url} 
                                  alt={emp.name}
                                  className="h-6 w-6 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div 
                                  className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 text-white"
                                  style={{ backgroundColor: getAvatarColor(emp.name).bg }}
                                >
                                  {getAvatarInitials(emp.name)}
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
                            {selectedForceHeadId === emp.id && <Check className="h-3.5 w-3.5 text-[#007AFF]" />}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleAssignForceHead}
                disabled={isAssigningForceHead || !selectedForceHeadId}
                className="w-full mt-2 h-12 bg-[#007AFF] text-white rounded-2xl font-semibold hover:bg-[#0062CC] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAssigningForceHead ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  "Assign Head & Access Department"
                )}
              </button>
              
              <button
                type="button"
                onClick={() => router.push("/departments")}
                className="w-full h-12 bg-gray-100 dark:bg-[#2C2C35] text-gray-700 dark:text-gray-200 rounded-2xl font-semibold hover:bg-gray-200 dark:hover:bg-[#3A3A40] active:scale-[0.98] transition-all flex items-center justify-center"
              >
                Go Back to Departments
              </button>
            </div>
          </div>
        </div>
      )}

      {extraAdmins.length > 1 && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-3xl max-w-lg w-full p-8 flex flex-col gap-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="mx-auto h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 dark:text-red-400">
              <ShieldAlert className="h-8 w-8" strokeWidth={2} />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Role Conflict Detected
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                Under Singapore-compliant HR guidelines and department constraints, each department can only have **one Admin** (the Department Head).
              </p>
            </div>

            {department?.head_id ? (
              // Case: Department Head is set. List the OTHER admins to be downgraded.
              <div className="flex flex-col gap-4 text-left">
                <div className="bg-gray-50 dark:bg-[#2C2C35]/50 border border-gray-100 dark:border-[#2C2C35] rounded-2xl p-4">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Department Head (Keeps Admin Role)
                  </span>
                  {(() => {
                    const headEmp = extraAdmins.find(e => e.id === department.head_id);
                    return headEmp ? (
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#007AFF] text-white flex items-center justify-center text-sm font-bold">
                          {getAvatarInitials(headEmp.name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{headEmp.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{headEmp.email}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {deptHeadInfo?.name || "Assigned Department Head"}
                      </p>
                    );
                  })()}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Other Admins to be Downgraded to Sub Admin
                  </span>
                  <div className="max-h-[180px] overflow-y-auto pr-1 flex flex-col gap-2 page-scrollbar">
                    {extraAdmins
                      .filter((emp) => emp.id !== department.head_id)
                      .map((emp) => (
                        <div key={emp.id} className="flex items-center justify-between p-3 bg-red-50/50 dark:bg-red-950/10 border border-red-100/50 dark:border-red-950/30 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center text-sm font-bold">
                              {getAvatarInitials(emp.name)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{emp.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{emp.email}</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-100/50 dark:bg-red-900/20 px-2.5 py-1 rounded-full">
                            Admin → Sub Admin
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <button
                  onClick={handleResolveAdmins}
                  disabled={isResolvingSubmit}
                  className="w-full mt-2 h-12 bg-red-600 text-white rounded-2xl font-semibold hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isResolvingSubmit ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    "Update Roles & Resolve Conflict"
                  )}
                </button>
              </div>
            ) : (
              // Case: No Department Head is set. Prompt to choose one.
              <div className="flex flex-col gap-4 text-left">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select which employee will serve as the **Department Head** (and keep the Admin role). All others will be updated to Sub Admin:
                </p>

                <div className="max-h-[220px] overflow-y-auto pr-1 flex flex-col gap-2.5 page-scrollbar">
                  {extraAdmins.map((emp) => {
                    const isSelected = selectedHeadId === emp.id;
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => setSelectedHeadId(emp.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? "border-[#007AFF] bg-[#007AFF]/5 dark:bg-[#007AFF]/10"
                            : "border-gray-100 dark:border-[#2C2C35] bg-gray-50/50 dark:bg-[#1C1C1E] hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isSelected ? "bg-[#007AFF] text-white" : "bg-gray-200 dark:bg-[#2C2C35] text-gray-700 dark:text-gray-300"
                          }`}>
                            {getAvatarInitials(emp.name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{emp.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{emp.email}</p>
                          </div>
                        </div>
                        <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected ? "border-[#007AFF] bg-[#007AFF]" : "border-gray-300 dark:border-gray-600"
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleResolveAdmins}
                  disabled={isResolvingSubmit || !selectedHeadId}
                  className="w-full mt-2 h-12 bg-[#007AFF] text-white rounded-2xl font-semibold hover:bg-[#0062CC] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isResolvingSubmit ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    "Assign Head & Update Roles"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

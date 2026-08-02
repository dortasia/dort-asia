"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronDown, Search, SlidersHorizontal, Settings, ShieldAlert, Check, Bell, AlertTriangle, Users, LogOut, LogIn, Briefcase, MoreHorizontal, Plus, UserMinus, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getAvatarColor, getInitials as getAvatarInitials } from "@/utils/avatarColor";
import { useAppStore } from "@/store";
import EmployeeCardsRenderer from "@/app/(dashboard)/employees/EmployeeCardsRenderer";
import ConfigureDepartmentPanel from "@/components/ConfigureDepartmentPanel";
import DepartmentActionsPanel from "@/components/DepartmentActionsPanel";
import DepartmentNotificationsPanel from "@/components/DepartmentNotificationsPanel";
import DepartmentAlertsPanel from "@/components/DepartmentAlertsPanel";
import RemoveEmployeeModal from "@/components/RemoveEmployeeModal";
import { handleDepartmentHeadChange } from "@/utils/departmentHeadHelper";


type DepartmentDetails = {
  id: string;
  name: string;
  company_id?: string;
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
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);
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

  // Stats & Tabs States
  const [activeTab, setActiveTab] = useState<"employees" | "outgoing" | "incoming" | "history">("employees");
  const [incomingCount, setIncomingCount] = useState(0);
  const [outgoingCount, setOutgoingCount] = useState(0);
  const [incomingList, setIncomingList] = useState<any[]>([]);
  const [outgoingList, setOutgoingList] = useState<any[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);

  const [employeeToRemove, setEmployeeToRemove] = useState<{id: string, name: string} | null>(null);
  const [isRemovingEmployee, setIsRemovingEmployee] = useState(false);

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
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [filterRole, setFilterRole] = useState("All");
  const [filterDesignation, setFilterDesignation] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [deptSearchQuery, setDeptSearchQuery] = useState("");
  const [isDeptSelectOpen, setIsDeptSelectOpen] = useState(false);

  const loadData = async (showLoading = false) => {
      if (showLoading) setIsLoading(true);
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
            role: compSettings.super_admin_role && compSettings.super_admin_role !== "Super Admin" ? compSettings.super_admin_role : "CEO",
            avatarUrl: compSettings.super_admin_avatar_url || null,
          });
        }
      } else {
        setSuperAdminInfo(null);
      }

      // Fetch directly-assigned employees
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('*, departments!department_id(name)')
        .eq('department_id', departmentId)
        .order('name', { ascending: true });

      let allMapped: any[] = [];

      if (!empError && empData) {
        let expCount = 0;
        const calculateDaysLeft = (dateStr: string) => {
          const expiry = new Date(dateStr);
          const today = new Date();
          expiry.setHours(0,0,0,0);
          today.setHours(0,0,0,0);
          return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        };
        empData.forEach((emp: any) => {
          if (!["Employee", "Admin", "Sub Admin"].includes(emp.role)) return;
          if (emp.passport_expiry_date && calculateDaysLeft(emp.passport_expiry_date) <= 180) { expCount++; }
          if (emp.work_pass_expiry_date && calculateDaysLeft(emp.work_pass_expiry_date) <= 180) { expCount++; }
          if (["Contract", "Internship", "Temporary"].includes(emp.job_type) && emp.custom_fields?.contract_end_date && calculateDaysLeft(emp.custom_fields.contract_end_date) <= 180) { expCount++; }
        });
        setAlertsCount(expCount);

        const mapped = empData.map((emp: any) => {
          const { bg, color } = getAvatarColor(emp.name);
          const initials = getAvatarInitials(emp.name);
          const deptName = emp.departments?.name || deptData?.name || "General";
          const isComplete = !!(emp.emp_id && emp.department_id);
          return {
            id: emp.id,
            name: emp.name,
            role: emp.role || "Employee",
            job_role: emp.job_role || emp.role || "Employee",
            designation: emp.job_role || emp.role || "Employee",
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
            department_id: emp.department_id,
            is_head: emp.is_head === true,
            currentProject: Array.isArray(emp.custom_fields?.assignedProjects)
              ? emp.custom_fields.assignedProjects.join(', ')
              : (emp.current_project || emp.custom_fields?.project_name || null),
            baseSalary: emp.salary || null,
            is_active: emp.is_active !== false,
          };
        });
        allMapped = [...mapped];
      }

      // If Admin Department, also fetch all Admins from other departments
      if (isAdmin && user) {
        const companyId = deptData?.company_id || user.id;
        const { data: adminEmps } = await supabase
          .from('employees')
          .select('*, departments!department_id(name)')
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
              const deptName = emp.departments?.name || "Other";
              const isComplete = !!(emp.emp_id && emp.department_id);
              return {
                id: emp.id,
                name: emp.name,
                role: emp.role || "Admin",
                job_role: emp.job_role || emp.role || "Employee",
                designation: emp.job_role || emp.role || "Employee",
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
                department_id: emp.department_id,
                is_head: emp.is_head === true,
                currentProject: Array.isArray(emp.custom_fields?.assignedProjects)
                  ? emp.custom_fields.assignedProjects.join(', ')
                  : (emp.current_project || emp.custom_fields?.project_name || null),
                baseSalary: emp.salary || null,
                is_active: emp.is_active !== false,
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
            role: headInDept.job_role || headInDept.role || "Employee",
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
              role: headData.job_role || headData.role || "Employee",
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

      setEmployees(
        allMapped
          .sort((a, b) => {
            // Department head always first
            if (a.is_head && !b.is_head) return -1;
            if (!a.is_head && b.is_head) return 1;
            if (a.is_active === b.is_active) return a.name.localeCompare(b.name);
            return a.is_active ? -1 : 1;
          })
      );

      let allCompanyEmps: any[] = [];
      if (!deptData?.head_id && deptData?.name !== "Admin Department" && user) {
        const companyId = deptData.company_id || user.id;

        // Get all department head IDs to exclude them from dropdown
        const { data: depts } = await supabase
          .from('departments')
          .select('head_id')
          .eq('company_id', companyId);
        const headIds = (depts || []).map((d: any) => d.head_id).filter(Boolean);

        const { data: compEmps } = await supabase
          .from('employees')
          .select('id, name, email, emp_id, role, avatar_url, department_id')
          .eq('company_id', companyId)
          .order('name');
        if (compEmps) {
          allCompanyEmps = compEmps.filter((emp: any) => emp.role === "Admin" && !headIds.includes(emp.id));
        }
      }
      setCompanyEmployees(allCompanyEmps);

      // Fetch incoming and outgoing transfer/reportee approvals
      const companyId = deptData?.company_id || (user ? user.id : null);
      if (companyId) {
        const { data: approvalsData } = await supabase
          .from("approvals")
          .select("*")
          .eq("company_id", companyId)
          .in("type", ["Transfer", "Reportee"]);

        if (approvalsData) {
          // Fetch all departments in the company to map names
          const { data: allDepts } = await supabase
            .from("departments")
            .select("id, name")
            .eq("company_id", companyId);

          // Fetch all employees in the company
          const { data: allEmps } = await supabase
            .from("employees")
            .select("id, name, department_id, reporting_department_id, manager_id, emp_id, email, mobile, avatar_url, job_role, role, custom_fields, created_at, is_active")
            .eq("company_id", companyId);

          const deptMap = new Map((allDepts || []).map((d: any) => [d.id, d.name]));
          const empMap = new Map((allEmps || []).map((e: any) => [e.id, e.name]));

          // 1. Process Outgoing Employees (Who belong to this department but report to another department)
          const outgoingEmployees = (allEmps || []).filter(
            (emp: any) => emp.department_id === departmentId && 
            emp.reporting_department_id && 
            emp.reporting_department_id !== departmentId
          );
          
          const outgoingListMapped = outgoingEmployees.map((emp: any) => {
            const appRecord = approvalsData.find(
              (app: any) => app.type === "Reportee" && 
              app.status === "Completed" && 
              app.payload?.employeeId === emp.id
            );
            
            const appointedDate = appRecord?.payload?.effectiveDate || appRecord?.created_at || emp.created_at || null;
            const endDate = appRecord?.payload?.endDate || null;
            
            let effectiveDays = "Permanent";
            if (endDate && appointedDate) {
              try {
                const start = new Date(appointedDate);
                const end = new Date(endDate);
                const diffTime = end.getTime() - start.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                effectiveDays = diffDays > 0 ? `${diffDays} Days` : "Permanent";
              } catch {
                effectiveDays = "Permanent";
              }
            }

            return {
              id: emp.id,
              name: emp.name,
              empId: emp.emp_id || "EMP-N/A",
              role: emp.role || "Employee",
              job_role: emp.job_role || emp.role || "Employee",
              designation: emp.job_role || emp.role || "Employee",
              fromDeptId: emp.department_id,
              fromDeptName: deptMap.get(emp.department_id) || deptData?.name || "General",
              toDeptId: emp.reporting_department_id,
              toDeptName: deptMap.get(emp.reporting_department_id) || "Other",
              managerName: empMap.get(emp.manager_id) || "Manager",
              appointedDate: appointedDate ? new Date(appointedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "-",
              effectiveDays,
              reportingTypes: appRecord?.payload?.reportingTypes || [],
              is_active: emp.is_active !== false,
            };
          });
          setOutgoingList(outgoingListMapped);
          setOutgoingCount(outgoingListMapped.length);

          // 2. Process Incoming Employees (Who belong to another department but report to this department)
          const incomingEmployees = (allEmps || []).filter(
            (emp: any) => emp.department_id !== departmentId && 
            emp.reporting_department_id === departmentId
          );
          
          const incomingListMapped = incomingEmployees.map((emp: any) => {
            const appRecord = approvalsData.find(
              (app: any) => app.type === "Reportee" && 
              app.status === "Completed" && 
              app.payload?.employeeId === emp.id
            );
            
            const appointedDate = appRecord?.payload?.effectiveDate || appRecord?.created_at || emp.created_at || null;
            const endDate = appRecord?.payload?.endDate || null;
            
            let effectiveDays = "Permanent";
            if (endDate && appointedDate) {
              try {
                const start = new Date(appointedDate);
                const end = new Date(endDate);
                const diffTime = end.getTime() - start.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                effectiveDays = diffDays > 0 ? `${diffDays} Days` : "Permanent";
              } catch {
                effectiveDays = "Permanent";
              }
            }

            return {
              id: emp.id,
              name: emp.name,
              empId: emp.emp_id || "EMP-N/A",
              role: emp.role || "Employee",
              job_role: emp.job_role || emp.role || "Employee",
              designation: emp.job_role || emp.role || "Employee",
              fromDeptId: emp.department_id,
              fromDeptName: deptMap.get(emp.department_id) || "Other",
              toDeptId: emp.reporting_department_id,
              toDeptName: deptMap.get(emp.reporting_department_id) || deptData?.name || "General",
              managerName: empMap.get(emp.manager_id) || "Manager",
              appointedDate: appointedDate ? new Date(appointedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "-",
              effectiveDays,
              reportingTypes: appRecord?.payload?.reportingTypes || [],
              is_active: emp.is_active !== false,
            };
          });
          setIncomingList(incomingListMapped);
          setIncomingCount(incomingListMapped.length);

          // 3. Process Log History (Any Completed/Rejected Transfer or Reportee approvals associated with this department)
          const historyApprovals = approvalsData
            .filter(
              (app: any) => (app.status === "Completed" || app.status === "Rejected") && 
              (
                (app.type === "Reportee" && app.payload?.departmentId === departmentId) ||
                (app.type === "Transfer" && (app.payload?.sourceDeptId === departmentId || app.payload?.targetDeptId === departmentId))
              )
            )
            .sort((a: any, b: any) => {
              const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return timeB - timeA;
            });
          
          const historyListMapped = historyApprovals.map((app: any) => {
            const p = app.payload || {};
            return {
              id: app.id,
              name: app.title || "Reportee/Transfer Change",
              empId: app.status,
              currentProject: app.description || "",
              email: app.requester_name || "System",
              mobile: "-",
              baseSalary: app.created_at ? new Date(app.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "-",
              is_active: app.status === "Completed"
            };
          });
          setHistoryList(historyListMapped);
          
          const pendingCount = approvalsData.filter((app: any) => {
            if (app.status !== "Pending") return false;
            if (app.type === "Transfer") return app.payload?.targetDeptId === departmentId;
            if (app.type === "Reportee") return app.payload?.reportingDepartmentId === departmentId;
            return false;
          }).length;
          setNotificationsCount(pendingCount);
        }
      }

      setIsLoading(false);
  };

  const handleAssignForceHead = async () => {
    if (!selectedForceHeadId) return;
    setIsAssigningForceHead(true);
    const supabase = createClient();
    try {
      const oldHeadId = department?.head_id;
      if (oldHeadId && oldHeadId !== selectedForceHeadId) {
        const { error: demoteErr } = await supabase
          .from("employees")
          .update({ is_head: false, role: "Sub Admin" })
          .eq("id", oldHeadId);
        if (demoteErr) throw demoteErr;
      }

      const { error: empErr } = await supabase
        .from("employees")
        .update({ role: "Admin", is_head: true, department_id: departmentId })
        .eq("id", selectedForceHeadId);
      
      if (empErr) throw empErr;

      const { error: deptErr } = await supabase
        .from("departments")
        .update({ head_id: selectedForceHeadId })
        .eq("id", departmentId);
      
      if (deptErr) throw deptErr;

      const newHeadName = extraAdmins.find(e => e.id === selectedForceHeadId)?.name || "New Head";
      await handleDepartmentHeadChange(supabase, departmentId, selectedForceHeadId, newHeadName, department?.name || "");

      await loadData();
    } catch (err: any) {
      alert("Failed to assign department head: " + err.message);
    } finally {
      setIsAssigningForceHead(false);
    }
  };

  const handleRemoveFromDepartmentClick = (empId: string, empName: string) => {
    setEmployeeToRemove({ id: empId, name: empName });
  };

  const confirmRemoveFromDepartment = async () => {
    if (!employeeToRemove) return;
    setIsRemovingEmployee(true);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("employees")
        .update({ department_id: null })
        .eq("id", employeeToRemove.id);
      
      if (error) throw error;
      setEmployeeToRemove(null);
      loadData();
    } catch (err: any) {
      alert("Failed to remove employee: " + err.message);
    } finally {
      setIsRemovingEmployee(false);
    }
  };

  const handleBlock = async (empId: string, empName: string, isCurrentlyBlocked: boolean) => {
    const action = isCurrentlyBlocked ? "unblock" : "block";
    if (confirm(`Are you sure you want to ${action} ${empName}?`)) {
      const supabase = createClient();
      try {
        const { error } = await supabase.from('employees').update({ is_active: isCurrentlyBlocked }).eq('id', empId);
        if (error) throw error;
        alert(`${empName} has been ${action}ed.`);
        loadData();
      } catch (err: any) {
        alert(`Failed to ${action} employee: ${err.message}`);
      }
    }
  };

  const handleStopReporting = async (empId: string, empName: string) => {
    if (confirm(`Are you sure you want to stop reporting for ${empName}? This will reset their reporting manager.`)) {
      const supabase = createClient();
      try {
        const { error } = await supabase
          .from("employees")
          .update({
            reporting_department_id: null,
            manager_id: null
          })
          .eq("id", empId);
        
        if (error) throw error;
        await loadData();
      } catch (err: any) {
        alert("Failed to stop reporting: " + err.message);
      }
    }
  };

  useEffect(() => {
    if (!departmentId) return;

    loadData(true);

    const supabase = createClient();
    const channel = supabase
      .channel(`dept_realtime_${departmentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "approvals" },
        () => {
          loadData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [departmentId]);

  useEffect(() => {
    setFilterRole("All");
    setFilterDesignation("All");
    setFilterDepartment("All");
    setFilterStatus("All");
    setPage(1);
    setShowFilterPopover(false);
    setIsDeptSelectOpen(false);
  }, [activeTab]);

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

      const newHeadName = extraAdmins.find(e => e.id === headIdToSet)?.name || "New Head";
      await handleDepartmentHeadChange(supabase, departmentId, headIdToSet, newHeadName, department?.name || "");

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

  // Compute the centralized filtered list based on the active tab, search, and filters.
  let activeTabList = employees;
  if (activeTab === "outgoing") activeTabList = outgoingList;
  else if (activeTab === "incoming") activeTabList = incomingList;
  else if (activeTab === "history") activeTabList = historyList;

  let filteredList = activeTabList;

  if (searchTerm.trim() !== "") {
    const term = searchTerm.toLowerCase().trim();
    filteredList = filteredList.filter((emp: any) => {
      const nameMatch = (emp.name || "").toLowerCase().includes(term);
      const idMatch = (emp.empId || emp.emp_id || "").toLowerCase().includes(term);
      const descMatch = activeTab === "history" && (emp.currentProject || "").toLowerCase().includes(term);
      const performerMatch = activeTab === "history" && (emp.email || "").toLowerCase().includes(term);
      return nameMatch || idMatch || descMatch || performerMatch;
    });
  }

  if (activeTab !== "history") {
    if (filterRole !== "All") {
      filteredList = filteredList.filter((emp: any) => emp.role === filterRole);
    }
    if (activeTab === "incoming") {
      if (filterDepartment !== "All") {
        filteredList = filteredList.filter((emp: any) => emp.fromDeptName === filterDepartment);
      }
    } else {
      if (filterDesignation !== "All") {
        filteredList = filteredList.filter((emp: any) => {
          const empDesig = emp.job_role || emp.designation;
          return empDesig === filterDesignation;
        });
      }
    }
    if (filterStatus !== "All") {
      const isActiveBool = filterStatus === "Active";
      filteredList = filteredList.filter((emp: any) => {
        const empActive = emp.is_active !== false;
        return empActive === isActiveBool;
      });
    }
  }

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
          {!isAdminDept && (
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
          )}
          {!isAdminDept && (
            <button 
              onClick={() => setIsNotificationsPanelOpen(true)}
              className="relative h-10 w-10 bg-[#007AFF] hover:bg-[#0063CC] text-white flex items-center justify-center rounded-[12px] shadow-sm transition-colors focus:outline-none"
            >
              <Bell className="h-4 w-4" strokeWidth={2.5} />
              {notificationsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4.5 min-w-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-[#121217]">
                  {notificationsCount > 99 ? '99+' : notificationsCount}
                </span>
              )}
            </button>
          )}
          <button 
            onClick={() => setIsAlertsPanelOpen(true)}
            className="relative h-10 w-10 bg-[#007AFF] hover:bg-[#0063CC] text-white flex items-center justify-center rounded-[12px] shadow-sm transition-colors focus:outline-none"
          >
            <AlertTriangle className="h-4 w-4" strokeWidth={2.5} />
            {alertsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4.5 min-w-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-[#121217]">
                {alertsCount > 99 ? '99+' : alertsCount}
              </span>
            )}
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
                <div>
                  <p className="text-[12px] font-semibold text-[#86868b] leading-none mb-1.5 text-right">Department Head</p>
                  <p className="text-[16px] font-bold text-[#1d1d1f] dark:text-white leading-none text-right">
                    {headName}
                  </p>
                </div>
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

              {!isAdminDept && (
                <div className="flex items-center gap-3">
                  <div className="h-[28px] w-[28px] rounded-[6px] bg-[#f2f2f7] dark:bg-[#2C2C35] flex items-center justify-center shrink-0">
                    <LogOut className="h-4 w-4 text-[#86868b]" />
                  </div>
                  <p className="text-[12px] font-semibold text-[#86868b]">Outgoing Employees</p>
                  <p className="text-[15px] font-bold text-[#1d1d1f] dark:text-white ml-2">{outgoingCount}</p>
                </div>
              )}

              {!isAdminDept && (
                <div className="flex items-center gap-3">
                  <div className="h-[28px] w-[28px] rounded-[6px] bg-[#f2f2f7] dark:bg-[#2C2C35] flex items-center justify-center shrink-0">
                    <LogIn className="h-4 w-4 text-[#86868b]" />
                  </div>
                  <p className="text-[12px] font-semibold text-[#86868b]">Incoming Employees</p>
                  <p className="text-[15px] font-bold text-[#1d1d1f] dark:text-white ml-2">{incomingCount}</p>
                </div>
              )}

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
                <button 
                  onClick={() => { setActiveTab("employees"); setPage(1); }}
                  className={`pb-3 text-[14px] font-bold border-b-[3px] transition-colors ${
                    activeTab === "employees" ? "text-[#007AFF] border-[#007AFF]" : "text-[#a1a1a6] border-transparent hover:text-[#1d1d1f] dark:hover:text-white"
                  }`}
                >
                  Department Employees
                </button>
                {!isAdminDept && (
                  <button 
                    onClick={() => { setActiveTab("outgoing"); setPage(1); }}
                    className={`pb-3 text-[14px] font-bold border-b-[3px] transition-colors ${
                      activeTab === "outgoing" ? "text-[#007AFF] border-[#007AFF]" : "text-[#a1a1a6] border-transparent hover:text-[#1d1d1f] dark:hover:text-white"
                    }`}
                  >
                    Outgoing Employees
                  </button>
                )}
                {!isAdminDept && (
                  <button 
                    onClick={() => { setActiveTab("incoming"); setPage(1); }}
                    className={`pb-3 text-[14px] font-bold border-b-[3px] transition-colors ${
                      activeTab === "incoming" ? "text-[#007AFF] border-[#007AFF]" : "text-[#a1a1a6] border-transparent hover:text-[#1d1d1f] dark:hover:text-white"
                    }`}
                  >
                    Incoming Employees
                  </button>
                )}
                {!isAdminDept && (
                  <button 
                    onClick={() => { setActiveTab("history"); setPage(1); }}
                    className={`pb-3 text-[14px] font-bold border-b-[3px] transition-colors ${
                      activeTab === "history" ? "text-[#007AFF] border-[#007AFF]" : "text-[#a1a1a6] border-transparent hover:text-[#1d1d1f] dark:hover:text-white"
                    }`}
                  >
                    Log History
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-3 w-[35%] justify-end pb-2">
                <div className="relative w-full max-w-[280px]">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="h-4 w-4" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search Employee" 
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C35] rounded-full text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition-all placeholder:text-[#a1a1a6]"
                  />
                </div>
                <div className="relative">
                  <button 
                    onClick={() => {
                      if (activeTab !== "history") {
                        setShowFilterPopover(!showFilterPopover);
                      }
                    }}
                    disabled={activeTab === "history"}
                    className={`h-[36px] w-[36px] border flex items-center justify-center rounded-[10px] transition-colors shrink-0 focus:outline-none ${
                      activeTab === "history"
                        ? "bg-gray-100 dark:bg-[#1C1C1E]/50 border-gray-200 dark:border-gray-800 text-gray-300 dark:text-gray-700 cursor-not-allowed"
                        : showFilterPopover || filterRole !== "All" || filterDesignation !== "All" || filterStatus !== "All"
                        ? "bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF]" 
                        : "bg-[#f8f9fb] dark:bg-[#1C1C1E] border-[#E5E5EA] dark:border-[#2C2C35] text-[#86868b] hover:bg-gray-100 dark:hover:bg-[#2C2C35]"
                    }`}
                    title={activeTab === "history" ? "Filters not applicable for Log History" : "Filter Employees"}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>


                </div>
              </div>
            </div>

            {/* Table & Pagination Wrapper */}
            <div className="bg-white dark:bg-[#121217] rounded-[24px] overflow-hidden border border-gray-100 dark:border-[#2C2C35] mt-1">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8F9FA] dark:bg-black/20 border-b border-gray-100 dark:border-white/5">
                      {activeTab === "outgoing" || activeTab === "incoming" ? (
                        <>
                          <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide w-[20%]">Employee</th>
                          <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide w-[15%]">From</th>
                          <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide w-[15%]">To</th>
                          <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide w-[15%]">Reporting Manager</th>
                          <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide w-[25%]">Appointed Date</th>
                          <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-right w-[10%]">Actions</th>
                        </>
                      ) : activeTab === "history" ? (
                        <>
                          <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide w-[25%]">Activity / Employee</th>
                          <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide w-[35%]">Description</th>
                          <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide w-[15%]">Performed By</th>
                          <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide w-[15%]">Date</th>
                          <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-right w-[10%]">Status</th>
                        </>
                      ) : (
                        <>
                          <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide w-[25%]">Employee</th>
                          <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide w-[20%]">Projects</th>
                          <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide w-[20%]">Email</th>
                          <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide w-[15%]">Phone Number</th>
                          <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide w-[10%]">Base Salary</th>
                          <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-right w-[10%]">Actions</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const paginatedEmployees = filteredList.slice((page - 1) * pageSize, page * pageSize);
                      
                      if (paginatedEmployees.length === 0) {
                        return (
                          <tr>
                            <td colSpan={activeTab === "history" ? 5 : 6} className="px-5 py-12 text-center">
                              <span className="text-[14px] font-medium text-[#86868b]">
                                No {activeTab === "employees" ? "team members" : activeTab === "history" ? "history logs" : `${activeTab} employees`} found.
                              </span>
                            </td>
                          </tr>
                        );
                      }

                      return paginatedEmployees.map((emp, index) => {
                        const isMenuOpen = openMenuId === emp.id;
                        const isNearBottom = paginatedEmployees.length > 2 && index >= paginatedEmployees.length - 2;
                        
                        return (
                        <tr key={emp.id} className={`border-b border-gray-50 dark:border-white/5 transition-colors ${!emp.is_active ? 'bg-gray-50/70 dark:bg-[#1C1C22]/30 text-gray-400 dark:text-gray-500 opacity-60' : 'hover:bg-gray-50 dark:hover:bg-white/5'} ${isMenuOpen ? 'z-[60] relative' : ''}`}>
                          <td className="px-5 py-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                {activeTab !== "history" ? (
                                  <span 
                                    onClick={() => router.push(`/employees/${emp.id}`)}
                                    className={`text-[14px] font-bold leading-tight cursor-pointer hover:underline hover:text-[#007AFF] transition-colors ${!emp.is_active ? 'text-gray-500 dark:text-gray-400' : 'text-[#1d1d1f] dark:text-white'}`}
                                  >
                                    {emp.name}
                                  </span>
                                ) : (
                                  <span className={`text-[14px] font-bold leading-tight ${!emp.is_active ? 'text-gray-500 dark:text-gray-400' : 'text-[#1d1d1f] dark:text-white'}`}>
                                    {emp.name}
                                  </span>
                                )}
                                {emp.is_head && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#007AFF]/10 text-[#007AFF] tracking-wide">HEAD</span>
                                )}
                              </div>
                              {activeTab === "outgoing" || activeTab === "incoming" ? (
                                <span className="text-[11.5px] font-semibold text-[#86868b] dark:text-gray-400 mt-0.5 leading-none">
                                  {emp.reportingTypes && emp.reportingTypes.length > 0 ? emp.reportingTypes.join(", ") : "All modules"}
                                </span>
                              ) : (
                                <span className="text-[11.5px] font-semibold text-[#86868b] dark:text-gray-400 mt-0.5 leading-none">
                                  {emp.empId || "EMP-N/A"}
                                </span>
                              )}
                            </div>
                          </td>
                          {activeTab === "outgoing" || activeTab === "incoming" ? (
                            <>
                              <td className="px-5 py-4 text-[13px] font-semibold text-[#86868b]">
                                {emp.fromDeptName || "-"}
                              </td>
                              <td className="px-5 py-4 text-[13px] font-semibold text-[#86868b]">
                                {emp.toDeptName || "-"}
                              </td>
                              <td className="px-5 py-4 text-[13px] font-semibold text-[#86868b]">
                                {emp.managerName || "-"}
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex flex-col">
                                  <span className="text-[13px] font-semibold text-[#86868b]">
                                    {emp.appointedDate || "-"}
                                  </span>
                                  {emp.effectiveDays && (
                                    <span className="text-[11.5px] font-semibold text-[#86868b] dark:text-gray-400 mt-0.5 leading-none">
                                      {emp.effectiveDays}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-right">
                                {activeTab === "outgoing" ? (
                                  <button
                                    onClick={() => handleStopReporting(emp.id, emp.name)}
                                    className="px-3 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/45 text-[#FF3B30] rounded-[8px] text-[12px] font-bold transition-all"
                                  >
                                    Stop reporting
                                  </button>
                                ) : (
                                  <span className="text-[12px] font-bold text-gray-400 capitalize">
                                    Active
                                  </span>
                                )}
                              </td>
                            </>
                          ) : activeTab === "history" ? (
                            <>
                              <td className="px-5 py-4 text-[13px] font-semibold text-[#86868b]">
                                {emp.currentProject || "-"}
                              </td>
                              <td className="px-5 py-4 text-[13px] font-semibold text-[#86868b] truncate max-w-[180px]" title={emp.email}>
                                {emp.email || "-"}
                              </td>
                              <td className="px-5 py-4 text-[13px] font-semibold text-[#86868b]">
                                {emp.baseSalary || "-"}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                                  emp.empId === "Completed"
                                    ? "bg-[#34C759]/10 text-[#34C759]"
                                    : emp.empId === "Rejected"
                                    ? "bg-[#FF3B30]/10 text-[#FF3B30]"
                                    : "bg-amber-500/10 text-amber-500"
                                }`}>
                                  {emp.empId || "-"}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-5 py-4 text-[13px] font-semibold text-[#86868b]">
                                {emp.currentProject || "-"}
                              </td>
                              <td className="px-5 py-4 text-[13px] font-semibold text-[#86868b] truncate max-w-[180px]" title={emp.email}>
                                {emp.email || "-"}
                              </td>
                              <td className="px-5 py-4 text-[13px] font-semibold text-[#86868b]">
                                {emp.mobile || "-"}
                              </td>
                              <td className="px-5 py-4 text-[13px] font-bold text-[#1d1d1f] dark:text-white">
                                {typeof emp.baseSalary === 'number' ? `$${emp.baseSalary.toLocaleString()}` : (emp.baseSalary || "-")}
                              </td>
                              <td className="px-5 py-4 text-right relative">
                                 {activeTab === "employees" ? (
                                   <div className="flex items-center justify-end gap-1">
                                     <button 
                                       type="button"
                                       onClick={() => handleRemoveFromDepartmentClick(emp.id, emp.name)}
                                       disabled={emp.is_head}
                                       className={`p-1.5 rounded-lg transition-colors focus:outline-none ${emp.is_head ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20'}`}
                                       title={emp.is_head ? "Cannot remove department head" : "Remove from Department"}
                                     >
                                       <UserMinus className="h-4 w-4" />
                                     </button>
                                     <button 
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         setOpenMenuId(openMenuId === emp.id ? null : emp.id);
                                       }}
                                       className="text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-white transition-colors p-1.5 focus:outline-none"
                                     >
                                       <MoreHorizontal className="h-4 w-4" />
                                     </button>
                                   </div>
                                 ) : (
                                   <span className="text-[12px] font-bold text-gray-400 capitalize">
                                     {activeTab === "history" ? (emp.is_active ? "Completed" : "Rejected") : (emp.status || "Pending")}
                                   </span>
                                 )}
     
                                 {isMenuOpen && activeTab === "employees" && (
                                   <div className={`absolute right-6 ${isNearBottom ? 'bottom-8' : 'top-10'} w-48 bg-white dark:bg-[#1C1C1E] shadow-xl rounded-[12px] border border-gray-100 dark:border-[#2C2C35] py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100`}>
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
                                       onClick={() => { handleBlock(emp.id, emp.name, !emp.is_active); setOpenMenuId(null); }}
                                       className="w-full text-left px-4 py-2 text-[13px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                                     >
                                       {!emp.is_active ? "Unblock Employee" : "Block Employee"}
                                     </button>
                                     {!emp.is_head && (
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
                                     )}
                                     {!emp.is_head && (
                                       <button 
                                         onClick={() => { handleRemoveFromDepartmentClick(emp.id, emp.name); setOpenMenuId(null); }}
                                         className="w-full text-left px-4 py-2 text-[13px] font-bold text-[#FF3B30] hover:bg-[#FF3B30]/10"
                                       >
                                         Remove from Department
                                       </button>
                                     )}
                                   </div>
                                 )}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Footer */}
            {(() => {
              if (filteredList.length === 0) return null;
              const totalPages = Math.ceil(filteredList.length / pageSize);
              
              return (
                <div className="flex items-center justify-between mt-4 px-1">
                  {/* Count */}
                  <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredList.length)} of {filteredList.length} items
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
      </main>

      {/* Modals & Panels */}
      
      <ConfigureDepartmentPanel
        departmentId={departmentId}
        isOpen={isConfigurePanelOpen}
        onClose={() => setIsConfigurePanelOpen(false)}
        onSuccess={() => loadData()}
      />

      <DepartmentActionsPanel
        departmentId={departmentId}
        departmentEmployees={employees}
        isOpen={isPlusPanelOpen}
        onClose={() => setIsPlusPanelOpen(false)}
        onSuccess={() => loadData()}
        companyId={department?.company_id || null}
        initialScreen={plusPanelScreen}
        initialEmployeeId={plusPanelEmployeeId}
      />

      <DepartmentNotificationsPanel
        departmentId={departmentId}
        departmentName={department?.name || "Department"}
        isOpen={isNotificationsPanelOpen}
        onClose={() => setIsNotificationsPanelOpen(false)}
        onSuccess={() => loadData()}
      />

      <DepartmentAlertsPanel
        departmentId={departmentId}
        departmentName={department?.name || "Department"}
        isOpen={isAlertsPanelOpen}
        onClose={() => setIsAlertsPanelOpen(false)}
      />

      {/* Filter Side Panel */}
      {showFilterPopover && activeTab !== "history" && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 z-[100] bg-black/20 dark:bg-black/50 backdrop-blur-[2px] transition-opacity duration-300"
            onClick={() => setShowFilterPopover(false)}
          />

          {/* Panel structure */}
          <div 
            className="fixed inset-y-0 right-0 z-[101] w-full max-w-[380px] bg-white dark:bg-[#1C1C22] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col shadow-2xl animate-in slide-in-from-right duration-250 ease-out"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-[#2C2C35]">
              <div>
                <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">Filters</h2>
                <p className="text-[11.5px] text-[#86868b] mt-0.5">Filter team members list</p>
              </div>
              <div className="flex items-center gap-3">
                {(filterRole !== "All" || filterDesignation !== "All" || filterDepartment !== "All" || filterStatus !== "All") && (
                  <button 
                    onClick={() => {
                      setFilterRole("All");
                      setFilterDesignation("All");
                      setFilterDepartment("All");
                      setFilterStatus("All");
                      setPage(1);
                    }}
                    className="text-[11.5px] font-bold text-[#007AFF] hover:underline focus:outline-none"
                  >
                    Reset
                  </button>
                )}
                <button 
                  onClick={() => setShowFilterPopover(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Filters Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 page-scrollbar">
              {/* Role Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] uppercase font-bold text-[#86868b] tracking-wider">Role</label>
                <select 
                  value={filterRole}
                  onChange={e => { setFilterRole(e.target.value); setPage(1); }}
                  className="w-full h-[44px] px-3.5 bg-gray-50 dark:bg-[#121217] text-[13px] font-bold text-gray-900 dark:text-white border border-[#E5E5EA] dark:border-[#2C2C35] rounded-xl outline-none focus:border-[#007AFF] cursor-pointer transition-all"
                >
                  <option value="All">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Sub Admin">Sub Admin</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>

              {/* Designation/Department Filter */}
              {activeTab === "incoming" ? (
                /* Department Search & Select Filter (Only for Incoming tab) */
                <div className="flex flex-col gap-2 relative">
                  <label className="text-[11px] uppercase font-bold text-[#86868b] tracking-wider">Department</label>
                  
                  {isDeptSelectOpen ? (
                    <div className="w-full relative">
                      <input 
                        type="text"
                        value={deptSearchQuery}
                        onChange={(e) => setDeptSearchQuery(e.target.value)}
                        placeholder="Search departments..."
                        className="w-full h-[44px] px-3.5 bg-white dark:bg-[#121217] text-gray-900 dark:text-white border border-[#007AFF] rounded-xl text-[13px] font-bold outline-none shadow-sm shadow-[#007AFF]/10 pr-10"
                        autoFocus
                      />
                      <ChevronDown 
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 rotate-180 cursor-pointer" 
                        onClick={() => setIsDeptSelectOpen(false)}
                      />
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => {
                        setIsDeptSelectOpen(true);
                        setDeptSearchQuery("");
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gray-50 dark:bg-[#121217] text-gray-900 dark:text-white border border-[#E5E5EA] dark:border-[#2C2C35] hover:border-[#007AFF] rounded-xl text-[13px] font-bold outline-none transition-colors"
                    >
                      <span>{filterDepartment === "All" ? "All Departments" : filterDepartment}</span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                  )}

                  {isDeptSelectOpen && (
                    <div className="p-3 bg-white dark:bg-[#1C1C22] border border-gray-200 dark:border-[#2C2C35] rounded-xl shadow-lg flex flex-col gap-2 z-[150] absolute top-[75px] left-0 right-0 max-h-[200px] overflow-y-auto page-scrollbar">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterDepartment("All");
                          setIsDeptSelectOpen(false);
                          setPage(1);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[12.5px] font-bold transition-colors ${
                          filterDepartment === "All"
                            ? 'bg-[#007AFF]/10 text-[#007AFF]' 
                            : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        All Departments
                      </button>
                      {(() => {
                        const query = deptSearchQuery.toLowerCase().trim();
                        const incomingDepts = incomingList
                          .map((emp: any) => emp.fromDeptName)
                          .filter(Boolean);
                        const uniqueDepts = Array.from(new Set(incomingDepts)).sort();
                        const filtered = uniqueDepts.filter((dept: string) => 
                          dept.toLowerCase().includes(query)
                        );

                        if (filtered.length === 0) {
                          return <span className="text-[12px] text-gray-400 py-2 text-center">No departments found</span>;
                        }

                        return filtered.map((dept: string) => (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => {
                              setFilterDepartment(dept);
                              setIsDeptSelectOpen(false);
                              setPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors text-[12.5px] font-bold ${
                              filterDepartment === dept 
                                ? 'bg-[#007AFF]/10 text-[#007AFF]' 
                                : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <span>{dept}</span>
                            {filterDepartment === dept && <Check className="h-3.5 w-3.5 text-[#007AFF]" />}
                          </button>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                /* Designation Filter */
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] uppercase font-bold text-[#86868b] tracking-wider">Designation</label>
                  <select 
                    value={filterDesignation}
                    onChange={e => { setFilterDesignation(e.target.value); setPage(1); }}
                    className="w-full h-[44px] px-3.5 bg-gray-50 dark:bg-[#121217] text-[13px] font-bold text-gray-900 dark:text-white border border-[#E5E5EA] dark:border-[#2C2C35] rounded-xl outline-none focus:border-[#007AFF] cursor-pointer transition-all"
                  >
                    <option value="All">All Designations</option>
                    {(() => {
                      let baseList = employees;
                      if (activeTab === "outgoing") baseList = outgoingList;

                      const deptDesignations = department?.designations || [];
                      const empDesignations = baseList
                        .map((emp: any) => emp.job_role || emp.designation)
                        .filter(Boolean);
                      
                      const uniqueDesignations = Array.from(
                        new Set([...deptDesignations, ...empDesignations])
                      ).sort();

                      return uniqueDesignations.map((ds: string) => (
                        <option key={ds} value={ds}>{ds}</option>
                      ));
                    })()}
                  </select>
                </div>
              )}

              {/* Status Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] uppercase font-bold text-[#86868b] tracking-wider">Status</label>
                <select 
                  value={filterStatus}
                  onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                  className="w-full h-[44px] px-3.5 bg-gray-50 dark:bg-[#121217] text-[13px] font-bold text-gray-900 dark:text-white border border-[#E5E5EA] dark:border-[#2C2C35] rounded-xl outline-none focus:border-[#007AFF] cursor-pointer transition-all"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Blocked">Blocked Only</option>
                </select>
              </div>
            </div>

            {/* Footer summary & Apply button */}
            <div className="p-6 border-t border-gray-100 dark:border-[#2C2C35] bg-gray-50/50 dark:bg-[#1C1C22] flex flex-col gap-3">
              <div className="flex items-center justify-between text-[12.5px] font-bold text-gray-500 dark:text-gray-400">
                <span>Matching Results</span>
                <span className="text-[#007AFF] font-extrabold">{filteredList.length}</span>
              </div>
              <button
                onClick={() => setShowFilterPopover(false)}
                className="w-full h-11 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-xl text-[13px] font-bold transition-all shadow-sm shadow-[#007AFF]/10 flex items-center justify-center focus:outline-none"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}

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
                Under Dort's Vetex HRMS, each department must have a designated Admin (Department Head) before it can be accessed.
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
                Under Dort's Vetex HRMS and department constraints, each department can only have **one Admin** (the Department Head).
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

      <RemoveEmployeeModal
        isOpen={!!employeeToRemove}
        onClose={() => setEmployeeToRemove(null)}
        onConfirm={confirmRemoveFromDepartment}
        employeeName={employeeToRemove?.name || ""}
        isRemoving={isRemovingEmployee}
      />
    </div>
  );
}

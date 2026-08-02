"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  Eye,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import HeaderSearchBar from "@/components/HeaderSearchBar";
import { getAvatarColor, getDepartmentColor, getInitials } from "@/utils/avatarColor";
import AddDepartmentSidebar from "@/components/AddDepartmentSidebar";
import ConfigureDepartmentPanel from "@/components/ConfigureDepartmentPanel";
import { getCompanyInitials, generateDeptId } from "@/utils/deptIdHelper";

export type DepartmentItem = {
  id: string;
  dept_id?: string | null;
  name: string;
  color: string;
  bgColor: string;
  category: string;
  designations: string[];
  headCount: number;
  head: { name: string; role: string; avatarUrl?: string | null; id?: string };
  members: { name: string; avatarUrl: string | null }[]; // up to 5 members
  subDepartments?: { id: string; name: string }[];
  parentName?: string | null;
  created_at?: string;
  is_disabled?: boolean;
};

type DeptRow = { id: string; name: string; dept_id?: string | null; delegation_config?: any; head_id?: string | null; created_at?: string };
type DeptEmployeeRow = {
  id: string;
  department_id: string | null;
  name: string | null;
  app_role: string | null;
  designation: string | null;
  is_head: boolean | null;
  avatar_url: string | null;
};

/* ─── Avatar Stack ───────────────────────────────────── */
type MemberAvatar = {
  name: string;
  avatarUrl?: string | null;
};

function AvatarStack({ members }: { members: MemberAvatar[] }) {
  const shown = members.slice(0, 4);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((m, i) => {
        const init = getInitials(m.name);
        const theme = getAvatarColor(m.name);
        return (
          <div
            key={i}
            style={{
              marginLeft: i === 0 ? 0 : -8,
              zIndex: shown.length - i,
              backgroundColor: m.avatarUrl ? undefined : theme.bg,
              color: m.avatarUrl ? undefined : theme.color,
            }}
            className="h-8 w-8 rounded-full border-2 border-white dark:border-[#121217] flex items-center justify-center text-[10px] font-bold relative hover:z-50 hover:-translate-y-1 transition-transform cursor-pointer overflow-hidden"
          >
            {m.avatarUrl ? (
              <img src={m.avatarUrl} alt={m.name} className="h-full w-full object-cover" />
            ) : (
              init
            )}
          </div>
        );
      })}
      {extra > 0 && (
        <div
          style={{ marginLeft: -8, zIndex: 0 }}
          className="h-8 w-8 rounded-full border-2 border-white dark:border-[#121217] bg-[#F1F3F5] dark:bg-[#1C1C22] flex items-center justify-center text-[10px] font-semibold text-gray-500 relative hover:z-50 hover:-translate-y-1 transition-transform cursor-pointer"
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

const formatCreatedDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return "N/A";
  }
};

const getDepartmentCategory = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("admin") || n.includes("manage")) return "Management";
  if (n.includes("tech") || n.includes("software") || n.includes("it ") || n.includes("dev")) return "Technology";
  if (n.includes("finance") || n.includes("account") || n.includes("payroll")) return "Finance";
  if (n.includes("sales") || n.includes("marketing")) return "Marketing";
  if (n.includes("operat")) return "Operations";
  return "Corporate";
};

/* ─── Page ───────────────────────────────────────────── */
export default function DepartmentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [companyName, setCompanyName] = useState("Dort Asia");
  const [viewerDepartment, setViewerDepartment] = useState("Admin Department");
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Admin");
  const [showAddSidebar, setShowAddSidebar] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [isConfigurePanelOpen, setIsConfigurePanelOpen] = useState(false);
  const [configureInitialScreen, setConfigureInitialScreen] = useState<'settings' | 'delegations' | 'branches' | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleRow = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const handleDisableDepartment = async (dept: DepartmentItem) => {
    if (!window.confirm(`Are you sure you want to disable the department "${dept.name}"?`)) {
      return;
    }
    const supabase = createClient();
    const { data: deptData } = await supabase
      .from('departments')
      .select('delegation_config')
      .eq('id', dept.id)
      .single();

    const currentConfig = deptData?.delegation_config || {};
    const updatedConfig = { ...currentConfig, is_disabled: true };

    const { error } = await supabase
      .from('departments')
      .update({ delegation_config: updatedConfig })
      .eq('id', dept.id);

    if (error) {
      alert(`Error disabling department: ${error.message}`);
    } else {
      alert(`Department "${dept.name}" has been disabled.`);
      window.location.reload();
    }
  };

  const handleEnableDepartment = async (dept: DepartmentItem) => {
    if (!window.confirm(`Are you sure you want to enable the department "${dept.name}"?`)) {
      return;
    }
    const supabase = createClient();
    const { data: deptData } = await supabase
      .from('departments')
      .select('delegation_config')
      .eq('id', dept.id)
      .single();

    const currentConfig = deptData?.delegation_config || {};
    const { is_disabled, ...restConfig } = currentConfig;

    const { error } = await supabase
      .from('departments')
      .update({ delegation_config: restConfig })
      .eq('id', dept.id);

    if (error) {
      alert(`Error enabling department: ${error.message}`);
    } else {
      alert(`Department "${dept.name}" has been enabled.`);
      window.location.reload();
    }
  };

  const handleDeleteDepartment = async (dept: DepartmentItem) => {
    if (!window.confirm(`Are you sure you want to delete the department "${dept.name}"?`)) {
      return;
    }
    const supabase = createClient();
    const { data: deptData } = await supabase
      .from('departments')
      .select('delegation_config')
      .eq('id', dept.id)
      .single();

    const currentConfig = deptData?.delegation_config || {};
    const updatedConfig = { ...currentConfig, is_disabled: true };

    const { error } = await supabase
      .from('departments')
      .update({ delegation_config: updatedConfig })
      .eq('id', dept.id);

    if (error) {
      alert(`Error deleting department: ${error.message}`);
    } else {
      alert(`Department "${dept.name}" has been deleted.`);
      window.location.reload();
    }
  };


  const renderRow = (dept: DepartmentItem, isSub = false) => {
    const isExpanded = expandedRowId === dept.id;
    const incomingCount = dept.subDepartments?.reduce((acc, sub) => {
      const subDept = departments.find(d => d.id === sub.id);
      return acc + (subDept ? subDept.headCount : 0);
    }, 0) || 0;
    const outgoingCount = dept.parentName ? dept.headCount : 0;
    const isBranch = !!dept.parentName;

    const isDisabled = dept.is_disabled;
    const menuKey = isSub ? `${dept.id}-sub` : `${dept.id}-main`;

    return (
      <tr 
        key={dept.id}
        className={`border-b border-gray-50 dark:border-white/5 transition-colors relative hover:z-50 group ${isExpanded ? 'border-b-0' : ''} ${
          isDisabled 
            ? 'bg-gray-50/70 dark:bg-[#1C1C22]/30 opacity-60 text-gray-400 dark:text-gray-500' 
            : 'hover:bg-gray-50 dark:hover:bg-white/5'
        }`}
      >
        <td className="px-5 py-4">
           <div className="flex items-center gap-3">
              {dept.subDepartments && dept.subDepartments.length > 0 ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleRow(dept.id); }} 
                  className="text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white transition-colors p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <div className="w-6 h-6 shrink-0" />
              )}
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div
                    className="h-10 w-10 rounded-[12px] flex items-center justify-center text-[13px] font-extrabold border border-gray-200 dark:border-gray-800"
                    style={{ backgroundColor: dept.bgColor, color: '#ffffff' }}
                  >
                    {getInitials(dept.name)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                    <span className={`relative inline-flex rounded-full h-3 w-3 border-2 border-white dark:border-[#121217] ${
                      isDisabled ? 'bg-gray-400 dark:bg-gray-600' : 'bg-green-500'
                    }`}></span>
                  </span>
                </div>
                <Link 
                  href={`/departments/${dept.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[14px] font-bold text-[#1d1d1f] dark:text-white hover:text-[#007AFF] hover:underline transition-colors"
                >
                  {dept.name}
                </Link>
              </div>
           </div>
        </td>
        <td className="px-5 py-4 text-[13px] font-bold text-gray-500 dark:text-gray-400 text-center">
          <Link 
            href={`/departments/${dept.id}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:text-[#007AFF] hover:underline transition-colors"
          >
            {dept.dept_id || dept.id.substring(0, 8).toUpperCase()}
          </Link>
        </td>
        <td className="px-5 py-4 text-center">
          <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-[8px] text-[11px] font-bold ${
            isBranch 
              ? "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/30" 
              : "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/30"
          }`}>
            {isBranch ? "Branch" : "Main"}
          </span>
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center justify-center gap-3">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold overflow-hidden border border-gray-100 dark:border-gray-800"
              style={{ 
                backgroundColor: dept.head.avatarUrl ? undefined : getAvatarColor(dept.head.name).bg, 
                color: dept.head.avatarUrl ? undefined : getAvatarColor(dept.head.name).color
              }}
            >
              {dept.head.avatarUrl ? (
                <img src={dept.head.avatarUrl} alt={dept.head.name} className="h-full w-full object-cover" />
              ) : (
                getInitials(dept.head.name)
              )}
            </div>
            <div className="text-left">
              <span className="text-[13px] font-bold text-[#1d1d1f] dark:text-white block">{dept.head.name}</span>
              {dept.head.role && dept.head.name !== "Unassigned" && (
                <span className="text-[11px] font-semibold text-gray-400 block leading-tight">{dept.head.role}</span>
              )}
            </div>
          </div>
        </td>
        <td className="px-5 py-4 text-[13px] font-bold text-gray-700 dark:text-gray-300 text-center">
          {dept.headCount}
        </td>
        <td className="px-5 py-4 text-[13px] font-bold text-gray-700 dark:text-gray-300 text-center">
          {incomingCount}
        </td>
        <td className="px-5 py-4 text-[13px] font-bold text-gray-700 dark:text-gray-300 text-center">
          {outgoingCount}
        </td>
        <td className="px-5 py-4 relative" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); router.push(`/departments/${dept.id}`); }}
              title="View"
              className="p-1.5 rounded-lg text-gray-400 hover:text-[#007AFF] hover:bg-[#007AFF]/10 transition-colors"
            >
              <Eye className="h-4.5 w-4.5" strokeWidth={2} />
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setSelectedDeptId(dept.id);
                setConfigureInitialScreen(null);
                setIsConfigurePanelOpen(true);
              }}
              title="Edit"
              className="p-1.5 rounded-lg text-gray-400 hover:text-[#007AFF] hover:bg-[#007AFF]/10 transition-colors"
            >
              <Pencil className="h-4 w-4" strokeWidth={2} />
            </button>
            <button 
              className="actions-dropdown-btn p-1.5 rounded-lg text-gray-400 hover:text-[#1C1C1E] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === menuKey ? null : menuKey);
              }}
            >
              <MoreVertical className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
            {openMenuId === menuKey && (
              <div className="actions-dropdown-menu absolute right-8 top-10 w-[168px] bg-white dark:bg-[#1C1C1E] rounded-[14px] border border-[#F1F3F5] dark:border-[#2C2C35] z-50 overflow-hidden text-left font-sans">
                {isDisabled ? (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleEnableDepartment(dept);
                      setOpenMenuId(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-[12px] font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Enable
                  </button>
                ) : (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleDisableDepartment(dept);
                      setOpenMenuId(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-[12px] font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Disable
                  </button>
                )}
                <div className="h-px bg-[#F1F3F5] dark:bg-[#2C2C35]" />
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    alert(`Transfer Employee action clicked. To transfer employees, please go to the Employees tab.`);
                    setOpenMenuId(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-[12px] font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Transfer Employee
                </button>
                <div className="h-px bg-[#F1F3F5] dark:bg-[#2C2C35]" />
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setSelectedDeptId(dept.id);
                    setConfigureInitialScreen('branches');
                    setIsConfigurePanelOpen(true);
                    setOpenMenuId(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-[12px] font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Create Branch
                </button>
                <div className="h-px bg-[#F1F3F5] dark:bg-[#2C2C35]" />
                {dept.name !== "Admin Department" ? (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleDeleteDepartment(dept);
                      setOpenMenuId(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-[12px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    Delete Department
                  </button>
                ) : (
                  <button 
                    disabled
                    title="Default department cannot be deleted"
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-[12px] font-semibold text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                  >
                    Delete Department
                  </button>
                )}
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".actions-dropdown-btn") && !target.closest(".actions-dropdown-menu")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      let nameStr = user.user_metadata?.full_name || user.email?.split('@')[0] || "Admin";
      nameStr = nameStr.charAt(0).toUpperCase() + nameStr.slice(1);
      setUserName(nameStr);

      // First resolve the correct company_id (in case user is an employee)
      let resolvedCompanyId = user.id; // fallback
      const { data: curEmp } = await supabase.from('employees').select('company_id, id, department_id, app_role').eq('user_id', user.id).maybeSingle();
      if (curEmp?.company_id) {
        resolvedCompanyId = curEmp.company_id;
      } else {
        const { data: adminComp } = await supabase.from('companies').select('id').eq('super_admin_id', user.id).maybeSingle();
        if (adminComp?.id) {
          resolvedCompanyId = adminComp.id;
        }
      }

      // Fetch literal employees, departments, and company_settings scoped to resolvedCompanyId
      let [
        { data: deps },
        { data: emps },
        { count },
        { data: compSettings },
        { data: compDetail }
      ] = await Promise.all([
        supabase.from('departments').select('*').eq('company_id', resolvedCompanyId),
        supabase.from('employees').select('id, department_id, name, app_role, designation, is_head, avatar_url').eq('company_id', resolvedCompanyId),
        supabase.from('employees').select('*', { count: 'exact', head: true }).eq('company_id', resolvedCompanyId),
        supabase.from('company_settings').select('super_admin_name, super_admin_role, super_admin_avatar_url').eq('company_id', resolvedCompanyId).maybeSingle(),
        supabase.from('company_settings').select('company_name').eq('company_id', resolvedCompanyId).maybeSingle()
      ]);

      // Normalize department names (handle name vs department_name)
      if (deps) {
        deps = deps.map((d: any) => ({ ...d, name: d.name || d.department_name })).sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
      }

      if (count !== null) setTotalEmployees(count);
      if (compDetail?.company_name) setCompanyName(compDetail.company_name);

      if (deps && emps) {
        const hasAdminDept = deps.some((d: DeptRow) => d.name === "Admin Department");
        if (!hasAdminDept) {
          const cName = compDetail?.company_name || "Dort Asia";
          const initials = getCompanyInitials(cName);

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

          const { data: newDept, error: insertErr } = await supabase
            .from('departments')
            .insert({
              department_name: "Admin Department",
              company_id: user.id,
              dept_id: generatedId,
              designations: ["Administrator", "Sub Administrator"]
            })
            .select('id, department_name, dept_id')
            .single();
          if (!insertErr && newDept) {
            const mappedDept = { ...newDept, name: newDept.department_name };
            deps = [...deps, mappedDept].sort((a, b) => a.name.localeCompare(b.name));
          }
        }

        // Collect all employees with role='Admin' across all departments (for Admin Dept membership)
        const allAdminEmps = emps.filter((e: DeptEmployeeRow) => e.app_role === "Admin");

        const parsedDepartments: DepartmentItem[] = deps.map((d: DeptRow) => {
          const deptEmps = emps.filter((e: DeptEmployeeRow) => e.department_id === d.id);
          
          const isAdminDept = d.name === "Admin Department";

          // For Admin Department: Super Admin is always the head
          let headName: string;
          let headRole: string;
          let headAvatar: string | null;
          let headEmp: any = null;

          if (isAdminDept && compSettings) {
            headName = compSettings.super_admin_name || "Super Admin";
            headRole = compSettings.super_admin_role || "Super Admin";
            headAvatar = compSettings.super_admin_avatar_url || null;
          } else {
            headEmp = emps.find((e: any) => e.id === d.head_id) || deptEmps.find((e: DeptEmployeeRow) => e.is_head) || deptEmps[0];
            headName = headEmp?.name || "Unassigned";
            headRole = headEmp?.designation || headEmp?.app_role || "Manager";
            headAvatar = headEmp?.avatar_url || null;
          }

          // For Admin Department: merge directly-assigned employees + all admins from other departments
          let effectiveMembers: { name: string; avatarUrl: string | null }[];
          let effectiveCount: number;

          if (isAdminDept) {
            const memberIds = new Set<string>();
            const mergedMembers: { name: string; avatarUrl: string | null }[] = [];
            
            for (const e of deptEmps) {
              if (!memberIds.has(e.id)) {
                memberIds.add(e.id);
                mergedMembers.push({ name: e.name || "Unknown", avatarUrl: e.avatar_url });
              }
            }
            for (const e of allAdminEmps) {
              if (!memberIds.has(e.id)) {
                memberIds.add(e.id);
                mergedMembers.push({ name: e.name || "Unknown", avatarUrl: e.avatar_url });
              }
            }
            
            effectiveMembers = mergedMembers.slice(0, 5);
            effectiveCount = mergedMembers.length;
          } else {
            const nonHeadEmps = headEmp ? deptEmps.filter((e: DeptEmployeeRow) => e.id !== headEmp.id) : deptEmps;
            effectiveMembers = nonHeadEmps.slice(0, 5).map((e: DeptEmployeeRow) => ({
              name: e.name || "Unknown",
              avatarUrl: e.avatar_url
            }));
            effectiveCount = nonHeadEmps.length;
          }
          
          const { bg, color } = getDepartmentColor(d.name);

          // Get sub departments for this department
          const subDepartments = deps
            .filter((d2: DeptRow) => d2.delegation_config?.parent_id === d.id)
            .map((d2: DeptRow) => ({ id: d2.id, name: d2.name }));

          const parentId = d.delegation_config?.parent_id;
          const parentDept = parentId ? deps.find((d2: DeptRow) => d2.id === parentId) : null;
          const parentName = parentDept ? parentDept.name : null;

          // Compute designations from employees
          const employeesForDesignations = isAdminDept ? [...deptEmps, ...allAdminEmps] : deptEmps;
          const allRoles = Array.from(
            new Set(employeesForDesignations.map((e: DeptEmployeeRow) => e.designation || e.app_role).filter(Boolean))
          );

          return {
            id: d.id,
            dept_id: d.dept_id,
            name: d.name,
            color,
            bgColor: bg,
            category: getDepartmentCategory(d.name),
            designations: allRoles.length > 0 ? allRoles : ["Employee"],
            headCount: effectiveCount,
            head: { name: headName, role: headRole, avatarUrl: headAvatar, id: headEmp?.id },
            members: effectiveMembers,
            subDepartments,
            parentName,
            created_at: d.created_at,
            is_disabled: !!d.delegation_config?.is_disabled,
          };
        });

        // Sort parsedDepartments to push disabled ones to the end
        parsedDepartments.sort((a, b) => {
          if (a.is_disabled && !b.is_disabled) return 1;
          if (!a.is_disabled && b.is_disabled) return -1;
          return a.name.localeCompare(b.name);
        });

        setDepartments(parsedDepartments);

        let userDept = "Admin Department";
        if (curEmp && curEmp.department_id) {
          const foundDept = deps.find((d: any) => d.id === curEmp.department_id);
          if (foundDept) {
            userDept = foundDept.name;
          }
        }
        setViewerDepartment(userDept);
      }
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  const totalBranches = departments.filter((d) => d.parentName).length || 0;

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="flex-1 flex flex-col overflow-y-auto page-scrollbar bg-white dark:bg-[#121217]"
      onClick={() => setOpenMenuId(null)}
    >
      <main className="flex-1 px-10 pb-10 pt-8 flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center flex-1 min-h-[400px]">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111827]"></div>
          </div>
        ) : (
          <div className="space-y-6 font-sans">
            {/* Top Header Bar */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-[28px] font-medium text-[#111827] dark:text-white tracking-tight font-sans">
                Departments
              </h1>
            </div>

            {/* Top Banner Row */}
            <div className="relative w-full h-[200px] bg-white border border-[#E5E7EB] rounded-[25px] flex items-center justify-between px-10 overflow-hidden mb-2">
              {/* Left Illustration */}
              <div className="absolute left-6 top-3 bottom-3 w-[400px] flex items-center justify-start pointer-events-none">
                <img 
                  src="/illustrations/department_page_illus.svg"
                  alt="Department Illustration"
                  className="h-full w-full object-contain object-left"
                />
              </div>

              {/* Right Content */}
              <div className="flex flex-col items-end z-10 w-full">
                <p className="text-[16px] font-normal text-[#6B7280] tracking-normal">Manage Your Company Departments</p>
                <h2 className="text-[28px] font-medium text-[#111827] mt-0.5 tracking-tight">{viewerDepartment}</h2>
                
                <div className="mt-5 bg-[#CBE455] rounded-[15px] px-8 py-3.5 flex items-center gap-12">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-[#111827]">Total Employees :</span>
                    <span className="text-[16px] font-semibold text-[#111827] font-rounded">{totalEmployees}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-[#111827]">Departments :</span>
                    <span className="text-[16px] font-semibold text-[#111827] font-rounded">{departments.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-[#111827]">Branches :</span>
                    <span className="text-[16px] font-semibold text-[#111827] font-rounded">{totalBranches}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Row: Search Bar on Left, Create Dept + Filter on Right */}
            <div className="flex items-center justify-between w-full mt-6 mb-2">
              {/* Left: Search Input Pill */}
              <div className="relative w-[340px]">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search Departments"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-full text-[14px] font-normal text-[#111827] focus:outline-none focus:border-[#007AFF] transition-colors placeholder:text-gray-400"
                />
              </div>

              {/* Right Group: Create Department Black Pill + Circular Filter */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowAddSidebar(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#111827] text-white rounded-full text-[14px] font-medium hover:bg-black transition-colors"
                >
                  <Plus size={18} strokeWidth={2} />
                  Create Department
                </button>

                <button 
                  className="flex items-center justify-center w-11 h-11 bg-white border border-[#E5E7EB] rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  title="Filter Departments"
                >
                  <SlidersHorizontal size={18} strokeWidth={1.8} />
                </button>
              </div>
            </div>

            {/* Department Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start w-full">
              {filtered.map((dept) => {
                const isBookmarked = bookmarkedIds.includes(dept.id);
                // Adjust colors for the card
                const accentColor = dept.color; // We use the dept.color for the accent badge

                return (
                  <div 
                    key={dept.id}
                    className={`rounded-[32px] border border-[#E5E7EB] bg-white flex flex-col p-2.5 w-full transition-opacity ${dept.is_disabled ? 'opacity-60 grayscale' : 'opacity-100'}`}
                  >
                    {/* Top Colored Section */}
                    <div 
                      className="px-6 pt-6 pb-8 flex flex-col min-h-[345px] rounded-[24px]"
                      style={{ backgroundColor: dept.bgColor }}
                    >
                      {/* Header Row */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="bg-white rounded-[24px] px-5 py-2.5 text-[14px] font-medium text-[#161616]">
                          {formatCreatedDate(dept.created_at)}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toggleBookmark(dept.id)}
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#161616] hover:bg-neutral-50 transition-colors cursor-pointer shrink-0"
                          >
                            <svg 
                              width="20" 
                              height="20" 
                              viewBox="0 0 24 24" 
                              fill={isBookmarked ? "#161616" : "none"} 
                              stroke="currentColor" 
                              strokeWidth="1.8" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                            </svg>
                          </button>
                          
                          <div className="relative">
                            <button 
                              className="actions-dropdown-btn w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#161616] hover:bg-neutral-50 transition-colors cursor-pointer shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === dept.id ? null : dept.id);
                              }}
                            >
                              <MoreVertical size={20} strokeWidth={1.8} />
                            </button>
                            {openMenuId === dept.id && (
                              <div className="actions-dropdown-menu absolute right-0 top-12 w-[160px] bg-white rounded-2xl border border-[#E5E7EB] shadow-lg p-1.5 z-50 flex flex-col gap-0.5 text-[13px] font-medium text-gray-700 font-sf text-left">
                                {dept.is_disabled ? (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleEnableDepartment(dept); setOpenMenuId(null); }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 text-left w-full transition-colors"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                    Enable
                                  </button>
                                ) : (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDisableDepartment(dept); setOpenMenuId(null); }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 text-left w-full transition-colors"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                    Disable
                                  </button>
                                )}
                                <div className="h-[1px] bg-gray-100 my-1" />
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setSelectedDeptId(dept.id); setConfigureInitialScreen('branches'); setIsConfigurePanelOpen(true); setOpenMenuId(null); }}
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 text-left w-full transition-colors"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                  Create Branch
                                </button>
                                <div className="h-[1px] bg-gray-100 my-1" />
                                {dept.name !== "Admin Department" ? (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteDepartment(dept); setOpenMenuId(null); }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 text-left w-full transition-colors"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"/></svg>
                                    Delete
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 bg-gray-50 cursor-not-allowed">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"/></svg>
                                    Cannot Delete Admin
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Content Row: Category & Title */}
                      <div className="flex flex-col mb-5 mt-8">
                        <span className="text-[14px] text-[#161616] mb-2 font-medium">{dept.category} {dept.parentName ? `(Branch of ${dept.parentName})` : ''}</span>
                        <h3 className="text-[22px] font-semibold text-[#161616] truncate leading-tight">{dept.name}</h3>
                      </div>

                      {/* Bottom Badges Row */}
                      <div className="flex flex-wrap items-center gap-2.5 mt-auto">
                        {dept.designations.slice(0, 3).map((desig, i) => (
                          <span 
                            key={i}
                            className="text-[12px] font-medium px-4 py-1.5 rounded-full border border-black/10 text-black/70 whitespace-nowrap bg-white/40"
                          >
                            {desig}
                          </span>
                        ))}
                        {dept.designations.length > 3 && (
                          <span 
                            className="text-[12px] font-medium px-4 py-1.5 rounded-full whitespace-nowrap text-white"
                            style={{ backgroundColor: accentColor }}
                          >
                            +{dept.designations.length - 3} Designations
                          </span>
                        )}
                        {dept.designations.length === 0 && (
                          <span className="text-[12px] font-medium px-4 py-1.5 rounded-full border border-black/10 text-black/70 whitespace-nowrap bg-white/40">
                            No designations
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom White Section */}
                    <div className="bg-white px-5 py-4 pt-6 flex items-center justify-between">
                      <div className="flex flex-col justify-center">
                        <span className="text-[22px] font-semibold text-[#161616]">{dept.headCount} Employees</span>
                        <span className="text-[14px] font-normal text-[#737373] mt-0.5">Manager: {dept.head.name}</span>
                      </div>
                      <button 
                        onClick={() => router.push(`/departments/${dept.id}`)}
                        className="bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] rounded-full px-7 py-2.5 text-[14px] font-medium transition-colors cursor-pointer"
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filtered.length === 0 && (
               <div className="w-full flex flex-col items-center justify-center py-20 text-gray-500">
                  <Search className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-[15px] font-medium text-[#111827]">No departments found</p>
                  <p className="text-[13px] text-gray-400 mt-1">Try adjusting your search</p>
               </div>
            )}
          </div>
        )}
      </main>

      {showAddSidebar && (
        <AddDepartmentSidebar 
          onClose={() => setShowAddSidebar(false)}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}

      {isConfigurePanelOpen && selectedDeptId && (
        <ConfigureDepartmentPanel
          departmentId={selectedDeptId}
          isOpen={isConfigurePanelOpen}
          onClose={() => {
            setIsConfigurePanelOpen(false);
            setSelectedDeptId(null);
          }}
          onSuccess={() => {
            window.location.reload();
          }}
          initialScreen={configureInitialScreen}
        />
      )}
    </div>
  );
}

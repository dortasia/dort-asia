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
import { getAvatarColor, getInitials } from "@/utils/avatarColor";
import AddDepartmentSidebar from "@/components/AddDepartmentSidebar";
import ConfigureDepartmentPanel from "@/components/ConfigureDepartmentPanel";
import { getCompanyInitials, generateDeptId } from "@/utils/deptIdHelper";

export type DepartmentItem = {
  id: string;
  dept_id?: string | null;
  name: string;
  color: string;
  bgColor: string;
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
  role: string | null;
  job_role: string | null;
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
          <div className="flex items-center justify-start gap-3">
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

      // Fetch literal employees, departments, and company_settings scoped to company_id
      let [
        { data: deps },
        { data: emps },
        { count },
        { data: compSettings },
        { data: compDetail },
        { data: curEmp }
      ] = await Promise.all([
        supabase.from('departments').select('id, name, dept_id, delegation_config, head_id, created_at').eq('company_id', user.id).order('name', { ascending: true }),
        supabase.from('employees').select('id, department_id, name, role, job_role, is_head, avatar_url').eq('company_id', user.id),
        supabase.from('employees').select('*', { count: 'exact', head: true }).eq('company_id', user.id),
        supabase.from('company_settings').select('super_admin_name, super_admin_role, super_admin_avatar_url').eq('company_id', user.id).single(),
        supabase.from('company_settings').select('company_name').eq('company_id', user.id).maybeSingle(),
        supabase.from('employees').select('id, department_id, role').eq('user_id', user.id).maybeSingle()
      ]);

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
              name: "Admin Department",
              company_id: user.id,
              dept_id: generatedId,
              designations: ["Administrator", "Sub Administrator"]
            })
            .select('id, name, dept_id')
            .single();
          if (!insertErr && newDept) {
            deps = [...deps, newDept].sort((a, b) => a.name.localeCompare(b.name));
          }
        }

        // Collect all employees with role='Admin' across all departments (for Admin Dept membership)
        const allAdminEmps = emps.filter((e: DeptEmployeeRow) => e.role === "Admin");

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
            headRole = headEmp?.job_role || headEmp?.role || "Manager";
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
          
          const { bg, color } = getAvatarColor(d.name);

          // Get sub departments for this department
          const subDepartments = deps
            .filter((d2: DeptRow) => d2.delegation_config?.parent_id === d.id)
            .map((d2: DeptRow) => ({ id: d2.id, name: d2.name }));

          const parentId = d.delegation_config?.parent_id;
          const parentDept = parentId ? deps.find((d2: DeptRow) => d2.id === parentId) : null;
          const parentName = parentDept ? parentDept.name : null;

          return {
            id: d.id,
            dept_id: d.dept_id,
            name: d.name,
            color,
            bgColor: bg,
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

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pagedDepartments = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div
      className="flex-1 flex flex-col overflow-y-auto page-scrollbar bg-white dark:bg-[#121217]"
      onClick={() => setOpenMenuId(null)}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-8 pt-8 pb-4">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
            Department
          </h1>
          <p className="text-[14px] text-gray-400 font-medium mt-1">
            Overview of Company Department Details
          </p>
        </div>
        <div className="flex items-center gap-4">
          <HeaderSearchBar />
        </div>
      </header>

      <main className="flex-1 px-8 pb-8 flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center flex-1 min-h-[400px]">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--user-accent)]"></div>
          </div>
        ) : (
          <>
            {/* Banner Section */}
            <div className="bg-[#f8f9fb] dark:bg-[#1C1C1E] rounded-[32px] p-8 flex justify-between relative overflow-hidden border border-[#F1F3F5] dark:border-[#2C2C35] mb-8">
              <div className="z-10 flex flex-col justify-center">
                <p className="text-[14px] text-gray-500 dark:text-gray-400 font-semibold mb-1">
                  Manage Your Company Departments
                </p>
                <h2 className="text-[28px] font-bold text-[#1d1d1f] dark:text-white mb-8">
                  {viewerDepartment}
                </h2>
                
                <div className="bg-white dark:bg-[#2C2C35] rounded-[10px] px-6 py-3 flex items-center gap-6 border border-[#E5E7EB] dark:border-[#2C2C35] max-w-max">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-gray-500 dark:text-gray-400 font-medium">Total Department</span>
                    <span className="text-[18px] font-bold text-[#007AFF]">{departments.length}</span>
                  </div>
                  <div className="w-px h-5 bg-[#E5E7EB] dark:bg-[#2C2C35]"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-gray-500 dark:text-gray-400 font-medium">Total Branches</span>
                    <span className="text-[18px] font-bold text-[#34C759]">{totalBranches}</span>
                  </div>
                  <div className="w-px h-5 bg-[#E5E7EB] dark:bg-[#2C2C35]"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-gray-500 dark:text-gray-400 font-medium">Total Employees</span>
                    <span className="text-[18px] font-bold text-[#FF9500]">{totalEmployees}</span>
                  </div>
                </div>
              </div>
              
              <div className="absolute right-12 bottom-0 top-0 w-[400px]">
                <img src="/Department_Vector.svg" alt="Department Vector" className="h-full w-full object-contain object-right-bottom" />
              </div>
            </div>

            {/* Actions Row */}
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search Department"
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-white/10 rounded-full text-[13px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition-all bg-white dark:bg-[#1C1C1E]"
                />
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowAddSidebar(true)}
                  className="px-6 py-2 bg-[var(--user-accent)] hover:bg-[#0062CC] text-white rounded-full text-[13px] font-semibold transition-colors flex items-center gap-2"
                >
                  Create Department
                </button>
                <button 
                  className="flex items-center justify-center h-[38px] w-[38px] bg-[#F9F9FB] dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-xl text-[#8E8E93] hover:bg-gray-100 dark:hover:bg-[#2C2C35] transition-colors"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Table & Pagination Wrapper */}
            <div className="bg-white dark:bg-[#121217] rounded-[24px] overflow-hidden border border-gray-100 dark:border-[#2C2C35]">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-[#F8F9FA] dark:bg-black/20 border-b border-gray-100 dark:border-white/5">
                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide">Department</th>
                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-center">Department ID</th>
                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-center">Type</th>
                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-left">Manager</th>
                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-center">Employee Count</th>
                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-center">Incoming Employees</th>
                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-center">Outgoing Employees</th>
                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedDepartments.length > 0 ? (
                      pagedDepartments.map((dept) => {
                        const isExpanded = expandedRowId === dept.id;
                        return (
                          <React.Fragment key={dept.id}>
                            {renderRow(dept)}
                            {isExpanded && (
                              <tr className="bg-[#F9F9FB] dark:bg-[#1C1C1E]/50 border-b border-gray-100 dark:border-[#2C2C35]/40" onClick={(e) => e.stopPropagation()}>
                                <td colSpan={8} className="px-12 py-6">
                                  <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex flex-col gap-1.5">
                                      <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">
                                        Branches Under Control ({dept.subDepartments?.length || 0})
                                      </span>
                                      {dept.subDepartments && dept.subDepartments.length > 0 ? (
                                        <div className="flex flex-col gap-4 mt-2">
                                          {dept.subDepartments
                                            .map((sub) => departments.find((d) => d.id === sub.id))
                                            .filter((d): d is DepartmentItem => !!d)
                                            .sort((a, b) => {
                                              if (a.is_disabled && !b.is_disabled) return 1;
                                              if (!a.is_disabled && b.is_disabled) return -1;
                                              return a.name.localeCompare(b.name);
                                            })
                                            .map((subDept) => (
                                              <div key={subDept.id} className="bg-white dark:bg-[#121217] rounded-xl border border-gray-100 dark:border-[#2C2C35] overflow-visible">
                                                <table className="w-full text-left border-collapse">
                                                  <thead>
                                                    <tr className="bg-[#F8F9FA] dark:bg-black/20 border-b border-gray-100 dark:border-white/5">
                                                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide">Department</th>
                                                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-center">Department ID</th>
                                                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-center">Type</th>
                                                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-left">Manager</th>
                                                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-center">Employee Count</th>
                                                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-center">Incoming Employees</th>
                                                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-center">Outgoing Employees</th>
                                                      <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-center">Actions</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {renderRow(subDept, true)}
                                                  </tbody>
                                                </table>
                                              </div>
                                            ))}
                                        </div>
                                      ) : (
                                        <span className="text-[13px] text-gray-400 font-medium mt-1">
                                          No branches under control.
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-5 py-20 text-center">
                          <span className="text-[15px] font-bold text-gray-400 block mb-1">No departments found.</span>
                          <span className="text-[13px] font-semibold text-gray-400">Create a department to get started.</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between mt-4 px-1">
              {/* Count */}
              <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">
                Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} departments
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
                        : "bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] text-gray-700 dark:text-gray-300 hover:border-[#007AFF]/40"
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
          </>
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

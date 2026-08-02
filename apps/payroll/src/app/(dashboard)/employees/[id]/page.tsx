"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, MessageSquare, Network, Bell, Share2, Edit2, 
  MapPin, Briefcase, Phone, Mail,
  CheckCircle2, AlertCircle, Calendar, Shield,
  GraduationCap, Building2, User, ChevronRight, UserCheck, Settings, TrendingUp, Hash, Clock, Users,
  ShieldCheck, Building, Crown, Coins, Milestone, CalendarDays,
  BookOpen, Award, Activity, Landmark, FileText, Stethoscope, Fingerprint,
  KeyRound, Eye, EyeOff, UserX, UserPlus as UserPlusIcon, RefreshCw,
  Upload, Plus, X, ChevronDown, File, Check, Info, Lock, ShieldAlert, Banknote, Download, Trash2, ArrowUpDown
, MoreVertical, Heart, Instagram, Linkedin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import QRCode from "react-qr-code";
import { getAvatarColor, getInitials } from "@/utils/avatarColor";
import { uploadToCompanyStorage, toCompanySlug as storageSlug } from "@/utils/storageHelper";


const DetailField = ({ icon: Icon, label, value, className = "", hideBorder = false }: any) => (
  <div className={`flex items-start gap-3 py-3 ${!hideBorder ? 'border-b border-gray-100 dark:border-[#2C2C35]' : ''} ${className}`}>
    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-50 dark:bg-[#2C2C35] text-gray-500 dark:text-gray-400 shrink-0">
      <Icon size={16} strokeWidth={2} />
    </div>
    <div className="flex flex-col gap-0.5">
      <span className="text-[12px] font-medium text-gray-500">{label}</span>
      <span className="text-[14px] font-bold text-gray-900 dark:text-white break-words">{value || "-"}</span>
    </div>
  </div>
);

const DetailCard = ({ title, icon: Icon, children, className = "" }: any) => (
  <div className={`bg-white dark:bg-[#1C1C1E] rounded-[16px] p-6 border border-gray-100 dark:border-[#2C2C35] shadow-sm mb-6 ${className}`}>
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-50 dark:bg-[#2C2C35] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/5">
          <Icon size={16} strokeWidth={2} />
        </div>
        <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <MoreVertical size={18} />
      </button>
    </div>
    {children}
  </div>
);


/* ─── Mock Projects Data for Employee Profile ──────────────────────────────────── */
type ProjectStatus = "Active" | "Closed" | "On Hold";
type ProjectCategory = "Construction" | "Marine" | "Tech" | "Finance" | "Design";

type Project = {
  id: string;
  code: string;
  name: string;
  image: string;
  client: string;
  clientInitials: string;
  owner: string;
  ownerColor: string;
  ownerBg: string;
  category: ProjectCategory;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  progress: number;
  financials: string;
  profit: string;
};
// Removed mock allProjects list and dynamically query company projects instead.

const categoryStyle: Record<ProjectCategory, { bg: string; text: string; icon: string }> = {
  Construction: { bg: "#EEF2FF", text: "#4338CA", icon: "🏗️" },
  Marine:       { bg: "#EFF6FF", text: "#1D4ED8", icon: "⚓" },
  Tech:         { bg: "#FEF9C3", text: "#A16207", icon: "⚙️" },
  Finance:      { bg: "#DCFCE7", text: "#15803D", icon: "📊" },
  Design:       { bg: "#FCE7F3", text: "#BE185D", icon: "🎨" },
};

const statusStyle: Record<ProjectStatus, { dot: string; text: string }> = {
  Active:  { dot: "#22C55E", text: "#166534" },
  Closed:  { dot: "#9CA3AF", text: "#6B7280" },
  "On Hold": { dot: "#F59E0B", text: "#92400E" },
};

const DesignationSelect = ({ value, onChange, departmentId, departments, onAddCustomDesignation }: any) => {
  const [isAdding, setIsAdding] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const dept = departments?.find((d: any) => d.id === departmentId);
  const existingDesignations = Array.isArray(dept?.designations) ? dept.designations : [];

  if (isAdding) {
    return (
      <div className="flex items-center gap-2">
        <input 
          type="text" 
          value={customValue} 
          onChange={e => setCustomValue(e.target.value)} 
          placeholder="Type designation name..." 
          className="h-11 px-3 w-full border border-gray-200 dark:border-[#2C2C35] rounded-[8px] text-[13px] font-semibold text-gray-900 dark:text-white bg-white dark:bg-[#121214] outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" 
          autoFocus
          onKeyDown={e => {
            if (e.key === 'Enter' && customValue.trim()) {
              e.preventDefault();
              onChange(customValue.trim());
              onAddCustomDesignation?.(departmentId, customValue.trim());
              setIsAdding(false);
            } else if (e.key === 'Escape') {
              setIsAdding(false);
            }
          }}
        />
        <button 
          type="button"
          onClick={() => {
            if (customValue.trim()) {
              onChange(customValue.trim());
              onAddCustomDesignation?.(departmentId, customValue.trim());
            }
            setIsAdding(false);
          }}
          className="h-11 px-4 bg-[#007AFF] text-white text-[13px] font-bold rounded-[8px] hover:bg-[#0066CC] transition-colors whitespace-nowrap"
        >
          Add
        </button>
        <button 
          type="button"
          onClick={() => setIsAdding(false)}
          className="h-11 w-11 flex items-center justify-center bg-gray-100 dark:bg-[#2C2C35] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-[8px] transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <select 
        value={value} 
        onChange={e => {
          if (e.target.value === "ADD_NEW") {
            setIsAdding(true);
            setCustomValue("");
          } else {
            onChange(e.target.value);
          }
        }} 
        disabled={!departmentId}
        className="h-11 px-3 w-full border border-gray-200 dark:border-[#2C2C35] rounded-[8px] text-[13px] font-semibold text-gray-900 dark:text-white bg-white dark:bg-[#121214] outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="" disabled>Select Designation</option>
        {existingDesignations.map((desig: string, idx: number) => (
          <option key={idx} value={desig}>{desig}</option>
        ))}
        {departmentId && <option value="ADD_NEW" className="font-bold text-[#007AFF]">+ Type to add new...</option>}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
};

export default function EmployeeProfileView() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const [emp, setEmp] = useState<any>(null);
  const [manager, setManager] = useState<any>(null);
  const [teamCount, setTeamCount] = useState<number>(0);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [realProjects, setRealProjects] = useState<any[]>([]);
  const [employeeHistory, setEmployeeHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("Personal");

  // Missing Department Popup States
  const [showMissingDeptPopup, setShowMissingDeptPopup] = useState(false);

  const [popupDeptId, setPopupDeptId] = useState("");
  const [popupDesignation, setPopupDesignation] = useState("");
  const [isSubmittingPopup, setIsSubmittingPopup] = useState(false);
  const [deptSearchText, setDeptSearchText] = useState("");
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);

  // Pagination states
  const [docPage, setDocPage] = useState(1);
  const [projPage, setProjPage] = useState(1);
  const [expandedPayroll, setExpandedPayroll] = useState<number[]>([]);
  const itemsPerPage = 6;
  
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationForm, setNotificationForm] = useState({ title: '', message: '', type: 'info' });
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [notificationsHistory, setNotificationsHistory] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Credentials tab state
  const [credLoading, setCredLoading] = useState(false);
  const [credStatus, setCredStatus] = useState<{ exists: boolean; confirmed: boolean; lastSignIn: string | null; userId: string | null } | null>(null);
  const [credPassword, setCredPassword] = useState("");
  const [credShowPass, setCredShowPass] = useState(false);
  const [credSaving, setCredSaving] = useState(false);
  const [credMsg, setCredMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const calculateAge = (dob: string | null) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return "N/A";
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return `${age} Years`;
  };

  const calculateExperience = (doj: string | null) => {
    if (!doj) return "N/A";
    const joinDate = new Date(doj);
    if (isNaN(joinDate.getTime())) return "N/A";
    const today = new Date();
    let exp = today.getFullYear() - joinDate.getFullYear();
    if (exp <= 0) return "Less than 1 Year";
    return `${exp} ${exp === 1 ? 'Year' : 'Years'}`;
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const fetchNotifications = async () => {
    if (!emp?.id) return;
    setLoadingNotifications(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('employee_id', emp.id)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setNotificationsHistory(data);
    }
    setLoadingNotifications(false);
  };

  useEffect(() => {
    if (activeTab === "Notifications" && emp?.id) {
       fetchNotifications();
    }
    if (activeTab === "Credentials" && emp?.email) {
      fetchCredStatus(emp.email);
    }
  }, [activeTab, emp?.id, emp?.email]);



  const fetchCredStatus = async (email: string) => {
    setCredLoading(true);
    setCredMsg(null);
    try {
      const res = await fetch(`/api/employee-credentials?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCredStatus(data);
    } catch (e: any) {
      setCredMsg({ type: 'error', text: e.message });
    } finally {
      setCredLoading(false);
    }
  };

  const handleCredAction = async (action: 'create' | 'reset_password' | 'delete' | 'confirm_email') => {
    if (!emp) return;
    if ((action === 'create' || action === 'reset_password') && credPassword.length < 6) {
      setCredMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (action === 'delete' && !confirm(`Remove login access for ${emp.name}? They will no longer be able to login.`)) return;
    setCredSaving(true);
    setCredMsg(null);
    try {
      const res = await fetch('/api/employee-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email: emp.email, password: credPassword, employeeId: emp.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const successMsg = 
        action === 'delete' ? 'Auth account removed.' :
        action === 'create' ? 'Account created! Employee can now log in.' :
        action === 'confirm_email' ? 'Email confirmed! Employee can now log in immediately.' :
        'Password updated. Employee can log in immediately.';
      setCredMsg({ type: 'success', text: successMsg });
      
      const updatedCF = { ...(emp.custom_fields || {}) };
      if (action === 'delete') {
        delete updatedCF.lastPassword;
      } else if (action !== 'confirm_email') {
        updatedCF.lastPassword = credPassword;
      }
      setEmp({ ...emp, custom_fields: updatedCF });

      setCredPassword("");
      await fetchCredStatus(emp.email);
    } catch (e: any) {
      setCredMsg({ type: 'error', text: e.message });
    } finally {
      setCredSaving(false);
    }
  };

  const handlePushNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationForm.title || !notificationForm.message) return;
    setIsSendingNotification(true);
    
    // Insert into DB
    const { error } = await supabase.from('notifications').insert({
      employee_id: emp.id,
      title: notificationForm.title,
      message: notificationForm.message,
      type: notificationForm.type,
      is_read: false
    });
    
    setIsSendingNotification(false);
    if (!error) {
       setIsNotificationModalOpen(false);
       setNotificationForm({ title: '', message: '', type: 'info' });
       if (activeTab === "Notifications") {
         fetchNotifications();
       }
    } else {
       alert("Failed to send notification: " + error.message);
    }
  };

  // Modals for Top Actions
  const [isConfigurePanelOpen, setIsConfigurePanelOpen] = useState(false);
  const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);
  const [isUploadClosing, setIsUploadClosing] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Configure Panel states
  const [attendanceEnabled, setAttendanceEnabled] = useState(true);
  const [leaveEnabled, setLeaveEnabled] = useState(true);
  const [claimEnabled, setClaimEnabled] = useState(true);
  const [eventEnabled, setEventEnabled] = useState(true);
  const [activeStatus, setActiveStatus] = useState(true);
  const [uploadDocType, setUploadDocType] = useState("work_pass_copy_url");
  const [uploadFileObj, setUploadFileObj] = useState<File | null>(null);
  const [customDocName, setCustomDocName] = useState("");
  const [customDocCategory, setCustomDocCategory] = useState("");
  const [uploadError, setUploadError] = useState("");

  // Course Cert states
  const [courseName, setCourseName] = useState("");
  const [courseIssuingOrg, setCourseIssuingOrg] = useState("");
  const [courseIssueDate, setCourseIssueDate] = useState("");
  const [courseExpiryDate, setCourseExpiryDate] = useState("");

  // Other Category states
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDateVal, setExpiryDateVal] = useState("");

  // Non-updatable warning popup states
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [pendingUploadPayload, setPendingUploadPayload] = useState<any>(null);

  const closeUploadPanel = () => {
    setIsUploadClosing(true);
    setTimeout(() => {
      setIsUploadPanelOpen(false);
      setIsUploadClosing(false);
      setUploadFileObj(null);
      setUploadError("");
      setCustomDocName("");
      setCustomDocCategory("");
      setCourseName("");
      setCourseIssuingOrg("");
      setCourseIssueDate("");
      setCourseExpiryDate("");
      setHasExpiry(false);
      setExpiryDateVal("");
      setShowDeleteWarning(false);
      setPendingUploadPayload(null);
    }, 300);
  };

  const [isConfigureClosing, setIsConfigureClosing] = useState(false);
  const [activeSubPanel, setActiveSubPanel] = useState<'login_access' | 'transfer_team' | 'transfer_project' | 'transfer_manager' | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSearchPerson, setSelectedSearchPerson] = useState<any | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [tempTransferDeptId, setTempTransferDeptId] = useState("");
  const [tempTransferProject, setTempTransferProject] = useState("");
  const [tempTransferManagerId, setTempTransferManagerId] = useState("");
  const [allDbEmployees, setAllDbEmployees] = useState<any[]>([]);
  const [dbDepartments, setDbDepartments] = useState<any[]>([]);
  const [isSavingTransfer, setIsSavingTransfer] = useState(false);
  const [showLastPass, setShowLastPass] = useState(false);
  const [selectedSearchDept, setSelectedSearchDept] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target as Node)) {
        setIsDeptDropdownOpen(false);
        const selected = dbDepartments.find(d => d.id === popupDeptId);
        if (selected) {
          setDeptSearchText(selected.name);
        } else {
          setDeptSearchText("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popupDeptId, dbDepartments]);

  const closeConfigurePanel = () => {
    setIsConfigureClosing(true);
    setTimeout(() => {
      setIsConfigurePanelOpen(false);
      setIsConfigureClosing(false);
      setActiveSubPanel(null);
    }, 300);
  };

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return "Unassigned";
    const manager = allDbEmployees.find(e => e.id === managerId);
    return manager ? manager.name : "Unassigned";
  };

  const getDepartmentName = (deptId: string | null) => {
    if (!deptId) return "Unassigned";
    const dept = dbDepartments.find(d => d.id === deptId);
    return dept ? dept.name : "Unassigned";
  };

  const fetchDepartmentsAndEmployees = async () => {
    try {
      if (!emp) return;
      // 1. Fetch departments
      const { data: deptData } = await supabase
        .from("departments")
        .select("id, name")
        .eq("company_id", emp.company_id);
      if (deptData) {
        setDbDepartments(deptData);
      }
      
      const { data: empData } = await supabase
        .from("employees")
        .select("id, name, role, department_id, departments!department_id(name), manager_id, custom_fields")
        .neq("id", emp.id)
        .eq("company_id", emp.company_id);
      if (empData) {
        setAllDbEmployees(empData);
      }
    } catch (e) {
      console.error("Error loading transfer options:", e);
    }
  };

  const handleConfirmDelete = async () => {
    if (!emp) return;
    if (deleteConfirmInput !== emp.name) {
      setDeleteError("Entered name does not match.");
      return;
    }
    
    setDeleteError("");
    try {
      // 1. Revoke login access using the credentials route
      await fetch('/api/employee-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', email: emp.email, employeeId: emp.id })
      });

      // 2. Delete the record from employees table
      const { error } = await supabase.from('employees').delete().eq('id', emp.id);
      if (error) throw error;

      alert(`Employee ${emp.name} has been successfully deleted.`);
      setIsDeleteModalOpen(false);
      router.push('/employees');
    } catch (err: any) {
      console.error("Delete employee error:", err);
      setDeleteError("Failed to delete: " + (err.message || "Unknown error"));
    }
  };

  const handleSaveTransfer = async (type: 'team' | 'project' | 'manager') => {
    if (!emp) return;
    setIsSavingTransfer(true);
    try {
      let updateData: any = {};
      if (type === 'team') {
        updateData.department_id = tempTransferDeptId || null;
        updateData.custom_fields = {
          ...(emp.custom_fields || {}),
          departmentAppointedDate: new Date().toISOString()
        };
      } else if (type === 'project') {
        const updatedCustomFields = {
          ...(emp.custom_fields || {}),
          project_name: tempTransferProject || null,
          current_project: tempTransferProject || null,
          assignedProjects: tempTransferProject ? [tempTransferProject] : []
        };
        updateData.custom_fields = updatedCustomFields;
      } else if (type === 'manager') {
        updateData.manager_id = tempTransferManagerId || null;
      }

      const { error } = await supabase
        .from("employees")
        .update(updateData)
        .eq("id", emp.id);

      if (error) throw error;

      // Update local state
      const { data: updatedEmp, error: fetchErr } = await supabase
        .from("employees")
        .select("*, departments!department_id(name)")
        .eq("id", emp.id)
        .single();
      
      if (!fetchErr && updatedEmp) {
        setEmp(updatedEmp);
        let foundManager = null;
        let isCurrentEmpHead = updatedEmp.is_head === true;

        if (updatedEmp.role === "Admin") {
          const { data: saEmp } = await supabase
            .from("employees")
            .select("id, name, role, job_role, avatar_url")
            .eq("company_id", updatedEmp.company_id)
            .eq("role", "Super Admin")
            .neq("id", updatedEmp.id)
            .limit(1)
            .maybeSingle();
          
          let superAdminEmp = saEmp;

          if (!superAdminEmp) {
            const { data: ownerEmp } = await supabase
              .from("employees")
              .select("id, name, role, job_role, avatar_url")
              .eq("company_id", updatedEmp.company_id)
              .eq("user_id", updatedEmp.company_id)
              .neq("id", updatedEmp.id)
              .limit(1)
              .maybeSingle();
            superAdminEmp = ownerEmp;
          }

          if (superAdminEmp) {
            foundManager = superAdminEmp;
          } else {
            const { data: compSettings } = await supabase
              .from("company_settings")
              .select("super_admin_name, super_admin_role, super_admin_avatar_url")
              .eq("company_id", updatedEmp.company_id)
              .maybeSingle();
            
            if (compSettings) {
              foundManager = {
                id: "",
                name: compSettings.super_admin_name || "Super Admin",
                role: "Super Admin",
                job_role: compSettings.super_admin_role || "CEO",
                avatar_url: compSettings.super_admin_avatar_url || null
              };
            }
          }
        } else {
          // Step 1: Use directly assigned manager_id
          if (updatedEmp.manager_id) {
            const { data: directManager } = await supabase
              .from("employees")
              .select("id, name, role, job_role, avatar_url")
              .eq("id", updatedEmp.manager_id)
              .limit(1)
              .maybeSingle();
            if (directManager) foundManager = directManager;
          }

          // Step 2: Use the department's designated head (set via ConfigureDepartmentPanel)
          if (!foundManager && updatedEmp.department_id) {
            const { data: deptData } = await supabase
              .from("departments")
              .select("head_id")
              .eq("id", updatedEmp.department_id)
              .maybeSingle();

            if (deptData?.head_id) {
              if (deptData.head_id === updatedEmp.id) {
                isCurrentEmpHead = true;
              } else {
                const { data: deptHead } = await supabase
                  .from("employees")
                  .select("id, name, role, job_role, avatar_url")
                  .eq("id", deptData.head_id)
                  .maybeSingle();
                if (deptHead) foundManager = deptHead;
              }
            }
          }
        }
        
        setManager(foundManager);

        // Refresh department members as well
        if (updatedEmp.department_id) {
          let query = supabase
            .from("employees")
            .select("id, name, job_role, avatar_url", { count: 'exact' })
            .eq("department_id", updatedEmp.department_id)
            .neq("id", updatedEmp.id);
            
          if (foundManager?.id) {
            query = query.neq("id", foundManager.id);
          }

          if (updatedEmp.role === "Admin") {
            query = query.in("role", ["Sub Admin", "Employee"]);
          }
          
          const { count, data: teamData } = await query.limit(10);
            
          setTeamCount(count || 0);
          if (teamData) {
            setTeamMembers(teamData);
          }
        } else {
          setTeamCount(0);
          setTeamMembers([]);
        }
      }

      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} transfer saved successfully!`);
      setActiveSubPanel(null);
    } catch (err: any) {
      console.error("Save transfer failed:", err);
      alert("Failed to save transfer: " + err.message);
    } finally {
      setIsSavingTransfer(false);
    }
  };

  const handleSearchPeople = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    
    if (activeSubPanel === 'transfer_project') {
      const matchedEmployees = allDbEmployees.filter(e => 
        e.name.toLowerCase().includes(query.toLowerCase()) || 
        (e.role && e.role.toLowerCase().includes(query.toLowerCase())) ||
        (e.departments?.name && e.departments.name.toLowerCase().includes(query.toLowerCase())) ||
        (e.current_project && e.current_project.toLowerCase().includes(query.toLowerCase())) ||
        (e.custom_fields?.project_name && String(e.custom_fields.project_name).toLowerCase().includes(query.toLowerCase()))
      );
      
      const matchedProjects = realProjects.filter(p => 
        p.name?.toLowerCase().includes(query.toLowerCase()) ||
        p.code?.toLowerCase().includes(query.toLowerCase())
      );
      
      const results = [
        ...matchedProjects.map(p => ({ ...p, isProject: true })),
        ...matchedEmployees.map(e => ({ ...e, isEmployee: true }))
      ];
      
      setSearchResults(results.slice(0, 6));
    } else {
      const filtered = allDbEmployees.filter(e => 
        e.name.toLowerCase().includes(query.toLowerCase()) || 
        (e.role && e.role.toLowerCase().includes(query.toLowerCase())) ||
        (e.departments?.name && e.departments.name.toLowerCase().includes(query.toLowerCase()))
      );
      setSearchResults(filtered.slice(0, 5));
    }
    setSearchLoading(false);
  };

  const handleToggleActiveStatus = async (newVal: boolean) => {
    if (!emp) return;
    setActiveStatus(newVal);
    try {
      const { error } = await supabase
        .from("employees")
        .update({ is_active: newVal })
        .eq("id", emp.id);
      if (error) throw error;
      
      setEmp({ ...emp, is_active: newVal });
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert("Failed to update status: " + err.message);
      setActiveStatus(!newVal);
    }
  };

  const handleToggleModule = async (moduleKey: string, currentVal: boolean) => {
    if (!emp) return;
    const newCF = {
      ...(emp.custom_fields || {}),
      [moduleKey]: !currentVal
    };
    
    // Update local state immediately
    if (moduleKey === 'module_attendance') setAttendanceEnabled(!currentVal);
    if (moduleKey === 'module_leave') setLeaveEnabled(!currentVal);
    if (moduleKey === 'module_claim') setClaimEnabled(!currentVal);
    if (moduleKey === 'module_event') setEventEnabled(!currentVal);
    
    try {
      const { error } = await supabase
        .from("employees")
        .update({ custom_fields: newCF })
        .eq("id", emp.id);
      if (error) throw error;
      setEmp({ ...emp, custom_fields: newCF });
    } catch (err: any) {
      console.error("Failed to update module access:", err);
      alert("Failed to update module access: " + err.message);
      // Revert local state
      if (moduleKey === 'module_attendance') setAttendanceEnabled(currentVal);
      if (moduleKey === 'module_leave') setLeaveEnabled(currentVal);
      if (moduleKey === 'module_claim') setClaimEnabled(currentVal);
      if (moduleKey === 'module_event') setEventEnabled(currentVal);
    }
  };

  const handleSearchDepartments = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const filtered = dbDepartments.filter(d => 
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.id.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered.slice(0, 5));
    setSearchLoading(false);
  };

  useEffect(() => {
    if (isConfigurePanelOpen && emp) {
      if (emp.email) {
        fetchCredStatus(emp.email);
      }
      fetchDepartmentsAndEmployees();
    }
  }, [isConfigurePanelOpen, emp]);

  const handleDownload = async (path: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from("private_data").download(path);
      if (error) throw error;
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Download failed:", err);
      alert("Failed to download document: " + err.message);
    }
  };

  const handlePreview = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from("private_data").download(path);
      if (error) throw error;
      const url = window.URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (err: any) {
      console.error("Preview failed:", err);
      alert("Failed to preview document: " + err.message);
    }
  };

  const handleDeleteDoc = async (path: string, originalDocKey?: string, isCustom?: boolean) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      // Note: optionally delete from storage: await supabase.storage.from("private_data").remove([path]);
      
      let updatePayload: any = {};
      
      if (isCustom) {
         const currentCustomDocs = Array.isArray(emp.custom_fields?.customDocuments)
           ? [...emp.custom_fields.customDocuments]
           : [];
         const newDocs = currentCustomDocs.filter(d => (d.url !== path && d.path !== path));
         updatePayload = {
           custom_fields: {
             ...(emp.custom_fields || {}),
             customDocuments: newDocs
           }
         };
      } else if (originalDocKey) {
         const isColumn = ["aadhar_proof_url", "pan_proof_url", "fin_card_url", "passport_copy_url", "work_pass_copy_url", "nric_front_url", "nric_back_url"].includes(originalDocKey);
         if (isColumn) {
           updatePayload = { [originalDocKey]: null };
         } else {
           updatePayload = {
             custom_fields: {
               ...(emp.custom_fields || {}),
               [originalDocKey]: null
             }
           };
         }
      }

      const { error: dbErr } = await supabase
        .from('employees')
        .update(updatePayload)
        .eq('id', emp.id);

      if (dbErr) throw dbErr;

      const { data: updatedEmp } = await supabase
        .from("employees")
        .select("*, departments!department_id(name)")
        .eq("id", emp.id)
        .single();
      
      if (updatedEmp) {
        setEmp(updatedEmp);
      }
      alert("Document deleted successfully");
    } catch (err: any) {
      console.error("Delete failed:", err);
}
  };

  const toCompanySlug = (companyName: string): string => {
    return companyName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileObj || !emp) return;
    setUploadingDoc(true);
    setUploadError("");

    // Expiry Date Validation for "Other" category
    if (uploadDocType === "customDocument") {
      if (!customDocName.trim()) {
        setUploadError("Document name is required.");
        setUploadingDoc(false);
        return;
      }
      if (!customDocCategory.trim()) {
        setUploadError("Document category is required.");
        setUploadingDoc(false);
        return;
      }
      if (hasExpiry) {
        if (!expiryDateVal) {
          setUploadError("Expiry date is required.");
          setUploadingDoc(false);
          return;
        }
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (new Date(expiryDateVal) <= today) {
          setUploadError("Expiry date must be in the future (not past or current day).");
          setUploadingDoc(false);
          return;
        }
      }
    }

    // Special validation for Course Certification
    if (uploadDocType === "courseCertUrl") {
      if (!courseName.trim()) {
        setUploadError("Course Name is required.");
        setUploadingDoc(false);
        return;
      }
      if (!courseIssuingOrg.trim()) {
        setUploadError("Issuing Organization is required.");
        setUploadingDoc(false);
        return;
      }
    }

    // Non-updatable warning validation
    const isNonUpdatable = ["higherEduCertUrl", "schoolingCertUrl"].includes(uploadDocType);
    const existingOldUrl = isNonUpdatable ? emp.custom_fields?.[uploadDocType] : null;

    if (isNonUpdatable && existingOldUrl) {
      setPendingUploadPayload({
        type: uploadDocType,
        file: uploadFileObj,
        oldUrl: existingOldUrl
      });
      setShowDeleteWarning(true);
      setUploadingDoc(false);
      return;
    }

    await executeDocUpload(uploadDocType, uploadFileObj);
  };

  const executeDocUpload = async (docType: string, fileObj: File, deleteOldUrl?: string | null) => {
    setUploadingDoc(true);
    setUploadError("");
    try {
      const { data: compSettings } = await supabase
        .from('company_settings')
        .select('company_name')
        .eq('company_id', emp.company_id || '')
        .maybeSingle();

      const companySlug = storageSlug(compSettings?.company_name || 'default');
      const empName = emp.name || 'Employee';
      
      let finalCategoryName = docType;
      if (docType === "customDocument") {
        finalCategoryName = customDocName.trim() || "Custom_Document";
      } else if (docType === "courseCertUrl") {
        finalCategoryName = `Course_${courseName.trim().replace(/\s+/g, '_')}`;
      }

      const fullPath = await uploadToCompanyStorage(supabase, {
        companyId: emp.company_id || 'default',
        companySlug,
        category: 'employees',
        file: fileObj,
        categoryName: finalCategoryName.replace(/\s+/g, '_'),
        empId: emp.emp_id || undefined,
        employeeName: empName,
      });

      if (deleteOldUrl) {
        try {
          await supabase.storage
            .from('private_data')
            .remove([deleteOldUrl]);
        } catch (storageDelErr) {
          console.error("Storage deletion warning check failed:", storageDelErr);
        }
      }

      let updatePayload: any = {};

      if (docType === "customDocument") {
        const currentCustomDocs = Array.isArray(emp.custom_fields?.customDocuments)
          ? [...emp.custom_fields.customDocuments]
          : [];
        currentCustomDocs.push({
          name: customDocName.trim(),
          category: customDocCategory.trim(),
          url: fullPath,
          uploadedAt: new Date().toISOString(),
          expiryDate: hasExpiry ? expiryDateVal : null
        });
        updatePayload = {
          custom_fields: {
            ...(emp.custom_fields || {}),
            customDocuments: currentCustomDocs
          }
        };
      } else if (docType === "courseCertUrl") {
        const currentCerts = Array.isArray(emp.custom_fields?.certifications)
          ? [...emp.custom_fields.certifications]
          : [];
        currentCerts.push({
          certificationUrl: fullPath,
          certName: courseName.trim(),
          issuingOrg: courseIssuingOrg.trim(),
          certIssueDate: courseIssueDate || new Date().toISOString().split('T')[0],
          certExpiryDate: courseExpiryDate || null
        });
        updatePayload = {
          custom_fields: {
            ...(emp.custom_fields || {}),
            certifications: currentCerts
          }
        };
      } else if (docType === "passport_copy_url") {
        const currentCustomDocs = Array.isArray(emp.custom_fields?.customDocuments)
          ? [...emp.custom_fields.customDocuments]
          : [];
        if (emp.passport_copy_url) {
          currentCustomDocs.push({
            name: "Past Passport Copy (Replaced)",
            category: "Travel Document",
            url: emp.passport_copy_url,
            uploadedAt: new Date().toISOString()
          });
        }
        updatePayload = {
          passport_copy_url: fullPath,
          custom_fields: {
            ...(emp.custom_fields || {}),
            customDocuments: currentCustomDocs
          }
        };
      } else if (docType === "work_pass_copy_url") {
        const currentCustomDocs = Array.isArray(emp.custom_fields?.customDocuments)
          ? [...emp.custom_fields.customDocuments]
          : [];
        const oldUrl = emp.work_pass_copy_url || emp.fin_card_url;
        if (oldUrl) {
          currentCustomDocs.push({
            name: "Past Work Pass Copy (Replaced)",
            category: "Identity Proof",
            url: oldUrl,
            uploadedAt: new Date().toISOString()
          });
        }
        updatePayload = {
          work_pass_copy_url: fullPath,
          fin_card_url: fullPath,
          custom_fields: {
            ...(emp.custom_fields || {}),
            customDocuments: currentCustomDocs
          }
        };
      } else {
        updatePayload = {
          custom_fields: {
            ...(emp.custom_fields || {}),
            [docType]: fullPath
          }
        };
      }

      const { error: dbErr } = await supabase
        .from('employees')
        .update(updatePayload)
        .eq('id', emp.id);

      if (dbErr) throw dbErr;

      const { data: updatedEmp } = await supabase
        .from("employees")
        .select("*, departments!department_id(name)")
        .eq("id", emp.id)
        .single();
      
      if (updatedEmp) {
        setEmp(updatedEmp);
      }

      closeUploadPanel();
    } catch (err: any) {
      console.error("Upload handler error:", err);
      setUploadError(err.message || "An error occurred during file upload.");
    } finally {
      setUploadingDoc(false);
      setShowDeleteWarning(false);
      setPendingUploadPayload(null);
    }
  };

  const getEmployeeDocuments = () => {
    if (!emp) return [];
    const docs: Array<{
      name: string;
      category: string;
      path: string;
      type: "pdf" | "image" | "doc" | "other";
      uploadedAt: string;
      verified: boolean;
      originalDocKey?: string;
      isCustom?: boolean;
    }> = [];

    const addDoc = (name: string, category: string, path: string | null, verified: boolean = false, originalDocKey?: string, isCustom?: boolean) => {
      if (!path) return;
      if (docs.some(d => d.path === path)) return;
      const ext = path.split('.').pop()?.toLowerCase() || '';
      let type: "pdf" | "image" | "doc" | "other" = "other";
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
        type = "image";
      } else if (['pdf'].includes(ext)) {
        type = "pdf";
      } else if (['doc', 'docx', 'xls', 'xlsx', 'txt'].includes(ext)) {
        type = "doc";
      }
      docs.push({
        name,
        category,
        path,
        type,
        uploadedAt: emp.created_at ? new Date(emp.created_at).toLocaleDateString('en-GB') : "N/A",
        verified,
        originalDocKey,
        isCustom
      });
    };

    addDoc("NRIC Front Copy", "Identity Proof", emp.nric_front_url || emp.custom_fields?.nricFrontUrl, !!(emp.nric_front_url || emp.custom_fields?.nricFrontUrl), emp.nric_front_url ? "nric_front_url" : "nricFrontUrl");
    addDoc("NRIC Back Copy", "Identity Proof", emp.nric_back_url || emp.custom_fields?.nricBackUrl, !!(emp.nric_back_url || emp.custom_fields?.nricBackUrl), emp.nric_back_url ? "nric_back_url" : "nricBackUrl");
    addDoc("Work Pass Copy", "Identity Proof", emp.fin_card_url || emp.custom_fields?.finCardUrl, !!(emp.fin_card_url || emp.custom_fields?.finCardUrl), emp.fin_card_url ? "fin_card_url" : "finCardUrl");
    addDoc("Passport Copy", "Travel Document", emp.passport_copy_url || emp.custom_fields?.finPassportCopyUrl, !!(emp.passport_copy_url || emp.custom_fields?.finPassportCopyUrl), emp.passport_copy_url ? "passport_copy_url" : "finPassportCopyUrl");
    addDoc("Work Pass Copy", "Work Authorization", emp.work_pass_copy_url || emp.custom_fields?.workPassCopyUrl, !!(emp.work_pass_copy_url || emp.custom_fields?.workPassCopyUrl), emp.work_pass_copy_url ? "work_pass_copy_url" : "workPassCopyUrl");
    addDoc("Aadhar Card Proof", "Identity Proof", emp.aadhar_proof_url, !!emp.aadhar_proof_url, "aadhar_proof_url");
    addDoc("PAN Card Proof", "Tax Identification", emp.pan_proof_url, !!emp.pan_proof_url, "pan_proof_url");

    try {
      const edu = typeof emp.education_details === 'string' ? JSON.parse(emp.education_details) : (emp.education_details || {});
      
      if (emp.custom_fields?.schoolingCertUrl) {
        addDoc("Schooling Certificate", "Education", emp.custom_fields.schoolingCertUrl, true, "schoolingCertUrl");
      }
      const schools = edu.schools || [];
      schools.forEach((s: any, idx: number) => {
        if (s.proof_url) {
          addDoc(s.school_name ? `${s.school_name} Cert` : `Schooling Certificate ${idx + 1}`, "Education", s.proof_url, true, `schoolingCert_${idx}`);
        }
      });

      if (emp.custom_fields?.higherEduCertUrl) {
        addDoc("Higher Education Degree", "Education", emp.custom_fields.higherEduCertUrl, true, "higherEduCertUrl");
      }
      const universities = edu.universities || [];
      universities.forEach((u: any, idx: number) => {
        if (u.proof_url) {
          addDoc(u.degree_name ? `${u.degree_name} Degree` : `Degree Certificate ${idx + 1}`, "Education", u.proof_url, true, `degreeCert_${idx}`);
        }
      });

      const courses = edu.courses || [];
      courses.forEach((c: any, idx: number) => {
        if (c.proof_url) {
          addDoc(c.course_name ? `${c.course_name} Cert` : `Course Certification ${idx + 1}`, "Certification", c.proof_url, true, `courseCert_${idx}`);
        }
      });
    } catch (e) {
      // Ignore
    }

    if (Array.isArray(emp.custom_fields?.certifications)) {
      emp.custom_fields.certifications.forEach((c: any, idx: number) => {
        if (c.certificationUrl) {
          addDoc(c.certName || `Certification ${idx + 1}`, "Certification", c.certificationUrl, true, `cert_${idx}`);
        }
      });
    }

    if (Array.isArray(emp.custom_fields?.customDocuments)) {
      emp.custom_fields.customDocuments.forEach((doc: any, idx: number) => {
        if (doc.url || doc.path) {
          addDoc(doc.name || `Document ${idx + 1}`, doc.category || "Custom Document", doc.url || doc.path, true, undefined, true);
        }
      });
    }

    return docs;
  };

  const getEmployeeProjects = () => {
    if (!emp) return [];

    // First try custom_fields.assignedProjects (array of codes or names)
    const assigned = emp.custom_fields?.assignedProjects;
    if (Array.isArray(assigned) && assigned.length > 0) {
      return assigned.map((projVal, idx) => {
        const match = realProjects.find(
          p => p.code?.toLowerCase() === projVal.toLowerCase() || p.name?.toLowerCase() === projVal.toLowerCase()
        );
        if (match) return match;
        return {
          id: `virtual-${idx}`,
          code: projVal.startsWith("PRJ-") ? projVal : "PRJ-CUSTOM",
          name: projVal,
          status: "Active",
          client: "Direct",
          clientInitials: "D",
          owner: "Saravanan",
          ownerColor: "#007AFF",
          ownerBg: "#E5F1FF",
          category: "Tech",
          startDate: "-",
          endDate: "-",
          progress: 0,
          financials: "-",
          profit: "-"
        };
      });
    }

    const projVal = emp.current_project || emp.custom_fields?.project_name;
    if (!projVal) return [];

    // Match by code or name in real projects
    const match = realProjects.find(
      p => p.code?.toLowerCase() === projVal.toLowerCase() || p.name?.toLowerCase() === projVal.toLowerCase()
    );

    if (match) {
      return [match];
    }

    return [{
      id: "virtual-1",
      code: projVal.startsWith("PRJ-") ? projVal : "PRJ-CUSTOM",
      name: projVal,
      status: "Active",
      client: "Direct",
      clientInitials: "D",
      owner: "Saravanan",
      ownerColor: "#007AFF",
      ownerBg: "#E5F1FF",
      category: "Tech",
      startDate: "-",
      endDate: "-",
      progress: 0,
      financials: "-",
      profit: "-"
    }];
  };

  useEffect(() => {
    async function fetchEmp() {
      if (!params.id) return;
      const { data, error } = await supabase
        .from("employees")
        .select("*, departments!department_id(name, delegation_config)")
        .eq("id", params.id)
        .single();
      
      if (!error && data) {
        setEmp(data);
        setActiveStatus(data.is_active !== false);
        setAttendanceEnabled(data.custom_fields?.module_attendance ?? true);
        setLeaveEnabled(data.custom_fields?.module_leave ?? true);
        setClaimEnabled(data.custom_fields?.module_claim ?? true);
        setEventEnabled(data.custom_fields?.module_event ?? true);
        
        let foundManager = null;
        let isCurrentEmpHead = data.is_head === true;

        if (data.role === "Admin") {
          const { data: saEmp } = await supabase
            .from("employees")
            .select("id, name, role, job_role, avatar_url")
            .eq("company_id", data.company_id)
            .eq("role", "Super Admin")
            .neq("id", data.id)
            .limit(1)
            .maybeSingle();
          
          let superAdminEmp = saEmp;

          if (!superAdminEmp) {
            const { data: ownerEmp } = await supabase
              .from("employees")
              .select("id, name, role, job_role, avatar_url")
              .eq("company_id", data.company_id)
              .eq("user_id", data.company_id)
              .neq("id", data.id)
              .limit(1)
              .maybeSingle();
            superAdminEmp = ownerEmp;
          }

          if (superAdminEmp) {
            foundManager = superAdminEmp;
          } else {
            const { data: compSettings } = await supabase
              .from("company_settings")
              .select("super_admin_name, super_admin_role, super_admin_avatar_url")
              .eq("company_id", data.company_id)
              .maybeSingle();
            
            if (compSettings) {
              foundManager = {
                id: "",
                name: compSettings.super_admin_name || "Super Admin",
                role: "Super Admin",
                job_role: compSettings.super_admin_role || "CEO",
                avatar_url: compSettings.super_admin_avatar_url || null
              };
            }
          }
        } else {
          if (data.manager_id) {
            const { data: directManager } = await supabase
              .from("employees")
              .select("id, name, role, job_role, avatar_url")
              .eq("id", data.manager_id)
              .limit(1)
              .maybeSingle();
            if (directManager) foundManager = directManager;
          }

          // Step 2: Use the department's designated head (set via ConfigureDepartmentPanel)
          if (!foundManager && data.department_id) {
            const { data: deptData } = await supabase
              .from("departments")
              .select("head_id")
              .eq("id", data.department_id)
              .maybeSingle();

            if (deptData?.head_id) {
              if (deptData.head_id === data.id) {
                isCurrentEmpHead = true;
              } else {
                const { data: deptHead } = await supabase
                  .from("employees")
                  .select("id, name, role, job_role, avatar_url")
                  .eq("id", deptData.head_id)
                  .maybeSingle();
                if (deptHead) foundManager = deptHead;
              }
            }
          }
        }

        // Check for missing/deleted or blocked department
        const isDeptBlockedOrDeleted = !data.departments || !data.department_id || data.departments.delegation_config?.is_disabled === true;
        if (isDeptBlockedOrDeleted) {
          setShowMissingDeptPopup(true);
          const { data: depts } = await supabase
            .from("departments")
            .select("id, name, designations, delegation_config")
            .eq("company_id", data.company_id)
            .order("name", { ascending: true });
          if (depts) {
            // Exclude Admin Department and any disabled or deleted department (is_disabled = true in delegation_config)
            const activeDepts = depts.filter((d: any) => d.name !== "Admin Department" && !d.delegation_config?.is_disabled);
            setDbDepartments(activeDepts);
          }
        }

        // Step 4: Last resort — look for Super Admin employee or company_settings
        if (!foundManager && data.company_id) {
          const { data: ownerEmp } = await supabase
            .from("employees")
            .select("id, name, role, job_role, avatar_url")
            .eq("company_id", data.company_id)
            .eq("user_id", data.company_id)
            .neq("id", data.id)
            .limit(1)
            .maybeSingle();

          let superAdminEmp = ownerEmp;

          if (!superAdminEmp) {
            const { data: saEmp } = await supabase
              .from("employees")
              .select("id, name, role, job_role, avatar_url")
              .eq("company_id", data.company_id)
              .eq("role", "Super Admin")
              .neq("id", data.id)
              .limit(1)
              .maybeSingle();
            superAdminEmp = saEmp;
          }

          if (!superAdminEmp) {
            const { data: adminEmp } = await supabase
              .from("employees")
              .select("id, name, role, job_role, avatar_url")
              .eq("company_id", data.company_id)
              .eq("role", "Admin")
              .neq("id", data.id)
              .limit(1)
              .maybeSingle();
            superAdminEmp = adminEmp;
          }

          if (superAdminEmp) {
            foundManager = superAdminEmp;
          } else {
            const { data: compSettings } = await supabase
              .from("company_settings")
              .select("super_admin_name, super_admin_role, super_admin_avatar_url")
              .eq("company_id", data.company_id)
              .maybeSingle();
            
            if (compSettings) {
              foundManager = {
                id: "",
                name: compSettings.super_admin_name || "Super Admin",
                role: compSettings.super_admin_role || "Super Admin",
                job_role: "Super Admin",
                avatar_url: compSettings.super_admin_avatar_url || null
              };
            }
          }
        }
        
        setManager(foundManager);

        if (data.department_id) {
          let query = supabase
            .from("employees")
            .select("id, name, job_role, avatar_url", { count: 'exact' })
            .eq("department_id", data.department_id)
            .neq("id", data.id);
            
          if (foundManager?.id) {
            query = query.neq("id", foundManager.id);
          }

          if (data.role === "Admin") {
            query = query.in("role", ["Sub Admin", "Employee"]);
          }
          
          const { count, data: teamData } = await query.limit(10);
            
          setTeamCount(count || 0);
          if (teamData) {
            setTeamMembers(teamData);
          }
        }

        // Fetch real company projects
        if (data.company_id) {
          const { data: compSettingsProj } = await supabase
            .from("company_settings")
            .select("attendance_config")
            .eq("company_id", data.company_id)
            .maybeSingle();
          if (compSettingsProj?.attendance_config?.projects) {
            setRealProjects(compSettingsProj.attendance_config.projects);
          }
        }

        // Fetch Employee History
        const { data: historyData } = await supabase
          .from("employee_history")
          .select("*")
          .eq("employee_id", data.id)
          .order("created_at", { ascending: false });
          
        if (historyData) {
          setEmployeeHistory(historyData);
        }
      }
      setLoading(false);
    }
    fetchEmp();
  }, [params.id, supabase]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#1C1C1E]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
      </div>
    );
  }

  if (!emp) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#1C1C1E]">
        <p className="text-gray-500 font-medium">Employee not found.</p>
      </div>
    );
  }

  const { bg: color } = getAvatarColor(emp.name || "User");
  const initials = getInitials(emp.name || "US");

  const TABS = ["All", "Personal", "Medical", "Work", "Bank", "Documents", "Projects", "Histories", "Salary"];

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#1C1C1E] overflow-y-auto page-scrollbar lg:h-screen">
      
      {/* Top Header & Navigation Banner */}
      <header className="px-4 py-4 lg:py-6 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#121217]/90 backdrop-blur-xl z-50 border-b border-transparent">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/employees')}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-full transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 text-gray-500 group-hover:text-[#007AFF] dark:text-gray-400 dark:group-hover:text-white" strokeWidth={3} />
          </button>
          <h1 className="text-[18px] lg:text-[20px] font-bold text-gray-900 dark:text-white tracking-tight">People Profile</h1>
        </div>
        
        {/* Top Right Actions Layout */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsConfigurePanelOpen(true)}
            title="Configure Credentials"
            className="h-10 w-10 bg-[#007AFF] flex items-center justify-center rounded-[12px] shadow-sm text-white hover:bg-[#0063CC] transition-colors focus:outline-none"
          >
             <Settings className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => setIsUploadPanelOpen(true)}
            title="Upload Document"
            className="h-10 w-10 bg-[#007AFF] flex items-center justify-center rounded-[12px] shadow-sm text-white hover:bg-[#0063CC] transition-colors focus:outline-none"
          >
             <Upload className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => router.push(`/payroll/history/${emp.id}`)}
            title="Process Pay / History"
            className="h-10 w-10 bg-[#007AFF] flex items-center justify-center rounded-[12px] shadow-sm text-white hover:bg-[#0063CC] transition-colors focus:outline-none"
          >
             <Banknote className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => setIsShareModalOpen(true)}
            title="Share Profile"
            className="h-10 w-10 bg-[#007AFF] flex items-center justify-center rounded-[12px] shadow-sm text-white hover:bg-[#0063CC] transition-colors focus:outline-none"
          >
             <Share2 className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => router.push(`/employees/${emp.id}/edit`)}
            title="Edit Profile"
            className="h-10 w-10 bg-[#007AFF] flex items-center justify-center rounded-[12px] shadow-sm text-white hover:bg-[#0063CC] transition-colors focus:outline-none"
          >
             <Edit2 className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-12">
        <div className="flex flex-col xl:flex-row gap-6">
          
          {/* Main Area */}
          <div className="flex-1 flex flex-col w-full">
            
            {/* Banner Card */}
            <div className="bg-[#F4F4F5] dark:bg-[#1C1C1E] rounded-[24px] overflow-hidden relative mb-6 p-6 lg:p-8 flex flex-col md:flex-row items-center md:items-start justify-between">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
                  {/* Avatar */}
                  <div
                    className="h-[120px] w-[120px] rounded-[16px] shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: emp.avatar_url ? undefined : color }}
                  >
                    {emp.avatar_url ? (
                      <img src={emp.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                       <span className="text-[40px] font-bold text-white uppercase">
                          {initials.toUpperCase()}
                       </span>
                    )}
                  </div>

                  <div className="flex flex-col w-full pt-1">
                    {/* Header Name & Role */}
                    <div className="mb-6 text-center md:text-left flex flex-col gap-0.5">
                      <h2 className="text-[22px] font-bold text-gray-900 dark:text-white leading-none">
                        {emp.name}
                      </h2>
                      <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 leading-tight">
                        {emp.job_role || emp.role || "Employee"}
                      </p>
                    </div>

                    {/* Meta Values Row */}
                    <div className="w-full flex items-center justify-center md:justify-start gap-8 lg:gap-16 flex-wrap">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-gray-400">Employee ID</span>
                        <span className="text-[13px] font-bold text-gray-900 dark:text-white">{emp.emp_id || "Unassigned"}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-gray-400">Department</span>
                        <span className="text-[13px] font-bold text-gray-900 dark:text-white">{emp.departments?.name || "Not Assigned"}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-gray-400">Designation</span>
                        <span className="text-[13px] font-bold text-gray-900 dark:text-white">{(!emp.departments || !emp.department_id) ? "Not Assigned" : (emp.job_role || "Unassigned")}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-gray-400">{emp.custom_fields?.added_via_onboard ? "Onboard Date" : "Joined Date"}</span>
                        <span className="text-[13px] font-bold text-gray-900 dark:text-white">{emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-gray-400">Job Type</span>
                        <span className="text-[13px] font-bold text-gray-900 dark:text-white">{emp.job_type || "Regular"}</span>
                      </div>
                      {emp.custom_fields?.contract_end_date && (
                         <div className="flex flex-col gap-1">
                           <span className="text-[11px] font-bold text-gray-400">Contract End</span>
                           <span className="text-[13px] font-bold text-gray-900 dark:text-white">{new Date(emp.custom_fields.contract_end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                         </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* QR Code Segment */}
                <div className="flex flex-col items-center shrink-0 mt-6 md:mt-0">
                  <div className="h-[96px] w-[96px] bg-white rounded-xl p-2 flex items-center justify-center relative shadow-sm">
                    <QRCode
                       value={`BEGIN:VCARD\nVERSION:3.0\nFN:${emp.name || ""}\nTITLE:${emp.job_role || emp.role || ""}\nTEL;TYPE=WORK,VOICE:${emp.mobile || ""}\nEMAIL;TYPE=PREF,INTERNET:${emp.email || ""}\nEND:VCARD`}
                       size={80}
                       style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                    <div className="absolute inset-0 m-auto h-[22px] w-[22px] bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                       <ShieldCheck className="h-3 w-3 text-[#007AFF]"/> 
                    </div>
                  </div>
                </div>
            </div>

            {/* Social Links Banner */}
            <div className="w-full border border-gray-200 dark:border-[#2C2C35] rounded-full px-6 py-4 flex items-center justify-center mb-6">
              <div className="flex items-center flex-wrap justify-between w-full lg:px-16 md:px-8 px-2 gap-y-4">
                 <a href={`tel:${emp.mobile}`} className="flex items-center gap-2 text-[12px] font-semibold text-gray-500 hover:text-[#007AFF] transition-colors">
                   <Phone className="h-4 w-4" /> {emp.mobile || "N/A"}
                 </a>
                 <a href={`mailto:${emp.email}`} className="flex items-center gap-2 text-[12px] font-semibold text-gray-500 hover:text-[#007AFF] transition-colors">
                   <Mail className="h-4 w-4" /> {emp.email || "N/A"}
                 </a>
                 
                 {emp.custom_fields?.linkedinUrl ? (
                   <a href={emp.custom_fields.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-semibold text-[#0A66C2] hover:opacity-80 transition-opacity">
                     <Linkedin className="h-4 w-4" /> LinkedIn
                   </a>
                 ) : (
                   <span className="flex items-center gap-2 text-[12px] font-semibold text-gray-400">
                     <Linkedin className="h-4 w-4 opacity-50" /> Not Provided
                   </span>
                 )}

                 {emp.custom_fields?.instagramUrl ? (
                   <a href={emp.custom_fields.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-semibold text-[#E1306C] hover:opacity-80 transition-opacity">
                     <Instagram className="h-4 w-4" /> Instagram
                   </a>
                 ) : (
                   <span className="flex items-center gap-2 text-[12px] font-semibold text-gray-400">
                     <Instagram className="h-4 w-4 opacity-50" /> Not Provided
                   </span>
                 )}
              </div>
            </div>

            {/* Intro & Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-6 mb-8">
               {/* Left Box */}
               <div className="border border-gray-200 dark:border-[#2C2C35] rounded-[24px] p-6 pt-8 relative">
                 <div className="absolute top-0 left-6 -translate-y-1/2 bg-white dark:bg-[#1C1C1E] px-2">
                   <span className="text-[12px] font-semibold text-gray-400">Intro</span>
                 </div>
                 <span className="font-bold text-[14px] text-gray-900 dark:text-white block mb-2">Hello, I'm {emp.name}</span>
                 <p className="text-[13px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                   {emp.bio || `Welcome to my official profile page. I am a dedicated professional serving as a ${emp.job_role || emp.role} at the ${emp.departments?.name} department. I am passionate about driving results and contributing to our organizational hierarchy with commitment.`}
                 </p>
               </div>
               
               {/* Right Box Team Manager & Members */}
               <div className="border border-blue-100 dark:border-blue-900/30 rounded-[24px] flex relative bg-blue-50/20 dark:bg-transparent">
                  <div className="flex-1 p-6 flex flex-col justify-center">
                     <span className="text-[10px] font-bold text-gray-500 block mb-4">
                       {emp.role === "Admin" ? "Admin Head" : "Department Head"}
                     </span>
                     <div 
                       className={`flex items-center gap-3 ${manager?.id ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                       onClick={() => manager?.id && router.push(`/employees/${manager.id}`)}
                     >
                        <div className="h-10 w-10 rounded-full shrink-0 flex items-center justify-center overflow-hidden" style={{ backgroundColor: manager?.avatar_url ? undefined : (manager ? getAvatarColor(manager.name).bg : '#D4D4D8') }}>
                           {manager?.avatar_url ? (
                             <img src={manager.avatar_url} alt="Manager" className="h-full w-full object-cover" />
                           ) : manager ? (
                             <span className="text-[13px] font-bold text-white">{getInitials(manager.name)}</span>
                           ) : (
                             <User className="h-5 w-5 text-gray-500"/>
                           )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                           <span className={`text-[13px] font-bold block leading-tight ${manager?.id ? 'text-[#007AFF]' : 'text-gray-900 dark:text-white'}`}>{manager?.name || "Unassigned"}</span>
                           <span className="text-[11px] font-semibold text-gray-400 leading-tight">
                             {manager?.role === 'Super Admin'
                               ? ((manager?.job_role && manager?.job_role !== 'Super Admin') ? manager.job_role : 'CEO')
                               : (manager?.job_role || manager?.role || "HR")}
                           </span>
                        </div>
                     </div>
                  </div>
                  <div className="flex-1 p-6 border-l border-blue-100 dark:border-[#2C2C35] flex flex-col justify-center">
                     <span className="text-[10px] font-bold text-gray-500 block mb-4">Department Members ({teamCount})</span>
                     <div className="flex items-center -space-x-3">
                        {teamMembers.length > 0 ? (
                          teamMembers.map((member) => (
                            <div 
                              key={member.id} 
                              onClick={() => router.push(`/employees/${member.id}`)}
                              className="h-9 w-9 rounded-full border-2 border-white dark:border-[#1C1C1E] flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:z-10 hover:scale-110 transition-transform"
                              style={{ backgroundColor: member.avatar_url ? undefined : getAvatarColor(member.name).bg }}
                              title={member.name}
                            >
                              {member.avatar_url ? (
                                <img src={member.avatar_url} alt={member.name} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-[11px] font-bold text-white">{getInitials(member.name)}</span>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="text-[12px] font-semibold text-gray-400">No department members</span>
                        )}
                        {teamCount > teamMembers.length && (
                          <div className="h-9 w-9 rounded-full border-2 border-white dark:border-[#1C1C1E] bg-gray-100 dark:bg-[#2C2C35] flex items-center justify-center shrink-0 text-[10px] font-bold text-gray-500 z-0">
                            +{teamCount - teamMembers.length}
                          </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* Profile Data Tabs Selection */}
            <div className="flex items-center gap-3 overflow-x-auto page-scrollbar pb-1 mb-4">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap px-6 py-2.5 rounded-full text-[13px] font-semibold transition-all border ${activeTab === tab ? "bg-[#007AFF] text-white border-[#007AFF] shadow-sm" : "bg-white dark:bg-[#1C1C1E] text-[#007AFF] dark:text-[#007AFF] border-[#007AFF] hover:bg-blue-50 dark:hover:bg-[#2C2C35]"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Configurable Tab Content Area */}
            <div className="mb-12">
               {(activeTab === "Personal" || activeTab === "All") && (
                  <div className="bg-[#F4F4F5] dark:bg-[#1C1C1E] rounded-[24px] p-6 md:p-8 mb-8 animate-in fade-in duration-300 space-y-8">
                     <div>
                       <div className="flex items-center gap-3 mb-6">
                         <div className="p-2 bg-gray-50 dark:bg-[#2C2C35] text-gray-500 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-white/5">
                           <User size={18} />
                         </div>
                         <h3 className="text-[15px] font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-0">Personal Information</h3>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                          <div className="flex flex-col gap-2">
                             <label className="text-[12px] font-semibold text-gray-500 pl-1">Full Name</label>
                             <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                {emp.name || "-"}
                             </div>
                          </div>
                          <div className="flex flex-col gap-2">
                             <label className="text-[12px] font-semibold text-gray-500 pl-1">Date Of Birth</label>
                             <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                {emp.date_of_birth ? new Date(emp.date_of_birth).toLocaleDateString('en-GB') : (emp.custom_fields?.dob ? new Date(emp.custom_fields.dob).toLocaleDateString('en-GB') : "Not Specified")}
                             </div>
                          </div>
                          <div className="flex flex-col gap-2">
                             <label className="text-[12px] font-semibold text-gray-500 pl-1">Gender</label>
                             <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                {emp.gender || emp.custom_fields?.gender || "-"}
                             </div>
                          </div>
                          <div className="flex flex-col gap-2">
                             <label className="text-[12px] font-semibold text-gray-500 pl-1">Marital Status</label>
                             <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                {emp.custom_fields?.maritalStatus || "-"}
                             </div>
                          </div>
                          <div className="flex flex-col gap-2">
                             <label className="text-[12px] font-semibold text-gray-500 pl-1">Employee ID</label>
                             <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                {emp.emp_id || "-"}
                             </div>
                          </div>
                          <div className="flex flex-col gap-2">
                             <label className="text-[12px] font-semibold text-gray-500 pl-1">Country</label>
                             <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                {emp.country || emp.custom_fields?.country || emp.custom_fields?.nationality || "-"}
                             </div>
                          </div>
                       </div>
                     </div>

                     {/* Current Contact Details */}
                     <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="p-2 bg-gray-50 dark:bg-[#2C2C35] text-gray-500 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-white/5">
                           <MapPin size={18} />
                         </div>
                         <h3 className="text-[15px] font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-0">Current Contact Details</h3>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                          <div className="flex flex-col gap-2 lg:col-span-2">
                             <label className="text-[12px] font-semibold text-gray-500 pl-1">Current Address</label>
                             <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                {emp.address || emp.custom_fields?.residentialAddress || emp.custom_fields?.currentResidentialAddress || "-"}
                             </div>
                          </div>
                          <div className="flex flex-col gap-2">
                             <label className="text-[12px] font-semibold text-gray-500 pl-1">Postal Code</label>
                             <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                {emp.custom_fields?.postalCode || emp.custom_fields?.currentPostalCode || "-"}
                             </div>
                          </div>
                          <div className="flex flex-col gap-2">
                             <label className="text-[12px] font-semibold text-gray-500 pl-1">Phone Number</label>
                             <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                {emp.mobile || emp.custom_fields?.mobileNumber || (emp.custom_fields?.currentMobileNumber ? `${emp.custom_fields.currentMobileCode || "+65"} ${emp.custom_fields.currentMobileNumber}` : "-")}
                             </div>
                          </div>
                          <div className="flex flex-col gap-2">
                             <label className="text-[12px] font-semibold text-gray-500 pl-1">Email Address</label>
                             <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white overflow-hidden text-ellipsis">
                                {emp.email || emp.custom_fields?.personalEmail || emp.custom_fields?.currentEmail || "-"}
                             </div>
                          </div>
                       </div>
                     </div>

                     {/* Native Contact Details */}
                     {(emp.custom_fields?.nativeResidentialAddress || emp.custom_fields?.nativeMobileNumber) && (
                       <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                         <div className="flex items-center gap-3 mb-6">
                           <div className="p-2 bg-gray-50 dark:bg-[#2C2C35] text-gray-500 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-white/5">
                             <Building size={18} />
                           </div>
                           <h3 className="text-[15px] font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-0">Native Contact Details</h3>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-2 lg:col-span-2">
                               <label className="text-[12px] font-semibold text-gray-500 pl-1">Native Address</label>
                               <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                  {emp.custom_fields.nativeResidentialAddress || "-"}
                               </div>
                            </div>
                            <div className="flex flex-col gap-2">
                               <label className="text-[12px] font-semibold text-gray-500 pl-1">Postal Code</label>
                               <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                  {emp.custom_fields.nativePostalCode || "-"}
                               </div>
                            </div>
                            <div className="flex flex-col gap-2">
                               <label className="text-[12px] font-semibold text-gray-500 pl-1">Phone Number</label>
                               <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                  {emp.custom_fields.nativeMobileNumber ? `${emp.custom_fields.nativeMobileCode || ""} ${emp.custom_fields.nativeMobileNumber}` : "-"}
                               </div>
                            </div>
                         </div>
                       </div>
                     )}

                     {/* Emergency Contact Details (Moved here from Medical) */}
                     <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-gray-50 dark:bg-[#2C2C35] text-gray-500 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-white/5">
                            <Phone size={18} />
                          </div>
                          <h3 className="text-[15px] font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-0">Emergency Contact Details</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                             <div className="flex flex-col gap-2">
                                <label className="text-[12px] font-semibold text-gray-500 pl-1">Primary Contact Name</label>
                                <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                   {emp.emergency_contact_name || emp.custom_fields?.emergName || "-"}
                                </div>
                             </div>
                             <div className="flex flex-col gap-2">
                                <label className="text-[12px] font-semibold text-gray-500 pl-1">Relationship</label>
                                <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                   {emp.emergency_contact_relation || emp.custom_fields?.emergRelation || "Not Specified"}
                                </div>
                             </div>
                             <div className="flex flex-col gap-2">
                                <label className="text-[12px] font-semibold text-gray-500 pl-1">Secondary Emergency Contact Number</label>
                                <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-[var(--user-accent)]">
                                   {emp.emergency_contact_number || emp.custom_fields?.emergContact || "-"}
                                </div>
                             </div>
                             <div className="flex flex-col gap-2 lg:col-span-3">
                                <label className="text-[12px] font-semibold text-gray-500 pl-1">Contact Address</label>
                                <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                   {emp.emergency_contact_address || emp.custom_fields?.emergAddress || "-"}
                                </div>
                             </div>
                        </div>
                     </div>
                  </div>
               )}

               {(activeTab === "Personal" || activeTab === "All") && (
                  <div className="bg-[#F4F4F5] dark:bg-[#1C1C1E] rounded-[24px] p-6 md:p-8 mb-8 animate-in fade-in duration-300">
                     <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-gray-50 dark:bg-[#2C2C35] text-gray-500 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-white/5">
                            <FileText size={18} />
                          </div>
                          <h3 className="text-[15px] font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-0">Identity Documents</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                           {(emp.custom_fields?.identityType === "NRIC" || 
                              emp.custom_fields?.nationality?.toLowerCase() === "singaporean" || 
                              emp.country?.toLowerCase() === "singapore" || 
                              emp.custom_fields?.country?.toLowerCase() === "singapore" || 
                              emp.custom_fields?.country?.toLowerCase() === "singaporean") && (
                             <>
                               <div className="flex flex-col gap-2">
                                 <label className="text-[12px] font-semibold text-gray-500 pl-1">NRIC Number</label>
                                 <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                   {emp.custom_fields?.nricNumber || "-"}
                                 </div>
                               </div>
                               <div className="flex flex-col gap-2">
                                 <label className="text-[12px] font-semibold text-gray-500 pl-1">Residential Status</label>
                                 <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                   <div className={`h-2 w-2 rounded-full ${(emp.custom_fields?.nationality?.toLowerCase() === "singaporean" || emp.country?.toLowerCase() === "singapore" || emp.custom_fields?.country?.toLowerCase() === "singapore" || emp.custom_fields?.country?.toLowerCase() === "singaporean") ? 'bg-[#34C759]' : 'bg-[#007AFF]'}`} />
                                   {(emp.custom_fields?.nationality?.toLowerCase() === "singaporean" || emp.country?.toLowerCase() === "singapore" || emp.custom_fields?.country?.toLowerCase() === "singapore" || emp.custom_fields?.country?.toLowerCase() === "singaporean") ? "Citizen" : "PR (Permanent Resident)"}
                                 </div>
                               </div>
                               <div className="flex flex-col gap-2">
                                 <label className="text-[12px] font-semibold text-gray-500 pl-1">Tax ID</label>
                                 <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                   {emp.custom_fields?.taxId || "-"}
                                 </div>
                               </div>
                               <div className="flex flex-col gap-2">
                                 <label className="text-[12px] font-semibold text-gray-500 pl-1">Passport Number</label>
                                 <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                   {emp.passport_number || emp.custom_fields?.finPassportNumber || "-"}
                                 </div>
                               </div>
                               <div className="flex flex-col gap-2">
                                 <label className="text-[12px] font-semibold text-gray-500 pl-1">Passport Expiry Date</label>
                                 <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                   {(() => {
                                     const d = emp.passport_expiry_date || emp.custom_fields?.finPassportExpiryDate;
                                     if (!d) return "-";
                                     try {
                                       const dateObj = new Date(d);
                                       return isNaN(dateObj.getTime()) ? "-" : dateObj.toLocaleDateString('en-GB');
                                     } catch {
                                       return "-";
                                     }
                                   })()}
                                 </div>
                               </div>
                             </>
                           )}

                           {emp.custom_fields?.identityType === "FIN" && emp.custom_fields?.nationality !== "Singaporean" && (
                             <>
                               <div className="flex flex-col gap-2">
                                 <label className="text-[12px] font-semibold text-gray-500 pl-1">FIN Number</label>
                                 <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                   {emp.custom_fields?.finNumber || "-"}
                                 </div>
                               </div>
                               <div className="flex flex-col gap-2">
                                 <label className="text-[12px] font-semibold text-gray-500 pl-1">Work Pass Category</label>
                                 <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                   {emp.custom_fields?.workPassType || emp.custom_fields?.workPassCategory || "-"}
                                 </div>
                               </div>
                               <div className="flex flex-col gap-2">
                                 <label className="text-[12px] font-semibold text-gray-500 pl-1">Work Pass Expiry Date</label>
                                 <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                   {(() => {
                                     const d = emp.work_pass_expiry_date || emp.custom_fields?.workPassExpiryDate || emp.custom_fields?.passExpiryDate;
                                     if (!d) return "-";
                                     try {
                                       const dateObj = new Date(d);
                                       return isNaN(dateObj.getTime()) ? "-" : dateObj.toLocaleDateString('en-GB');
                                     } catch {
                                       return "-";
                                     }
                                   })()}
                                 </div>
                               </div>
                               <div className="flex flex-col gap-2">
                                 <label className="text-[12px] font-semibold text-gray-500 pl-1">Passport Number</label>
                                 <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                   {emp.passport_number || emp.custom_fields?.finPassportNumber || emp.custom_fields?.passportNumber || "-"}
                                 </div>
                               </div>
                               <div className="flex flex-col gap-2">
                                 <label className="text-[12px] font-semibold text-gray-500 pl-1">Passport Expiry Date</label>
                                 <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                                   {(() => {
                                     const d = emp.passport_expiry_date || emp.custom_fields?.finPassportExpiryDate;
                                     if (!d) return "-";
                                     try {
                                       const dateObj = new Date(d);
                                       return isNaN(dateObj.getTime()) ? "-" : dateObj.toLocaleDateString('en-GB');
                                     } catch {
                                       return "-";
                                     }
                                   })()}
                                 </div>
                               </div>
                             </>
                           )}

                           {(!emp.custom_fields?.identityType || (emp.custom_fields?.nationality !== "Singaporean" && emp.custom_fields?.identityType !== "FIN")) && (
                             <>
                               <div className="flex flex-col gap-2">
                                 <label className="text-[12px] font-semibold text-gray-500 pl-1">Aadhar Number</label>
                                 <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white flex justify-between items-center group">
                                    <span>{emp.aadhar_number || emp.custom_fields?.aadharNumber || "NOT SUBMITTED"}</span>
                                    {emp.aadhar_proof_url ? (
                                      <a href={emp.aadhar_proof_url} target="_blank" rel="noreferrer" className="text-[var(--user-accent)] hover:underline flex items-center gap-1.5 text-[11px] font-bold">
                                        <ShieldCheck className="h-3.5 w-3.5"/> Verified
                                      </a>
                                    ) : (
                                      <span className="text-gray-400 text-[11px] font-bold flex items-center gap-1.5">
                                        <AlertCircle className="h-3.5 w-3.5"/> Pending
                                      </span>
                                    )}
                                 </div>
                               </div>
                               <div className="flex flex-col gap-2">
                                 <label className="text-[12px] font-semibold text-gray-500 pl-1">PAN Number</label>
                                 <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white flex justify-between items-center group">
                                    <span>{emp.pan_number || emp.custom_fields?.panNumber || "NOT SUBMITTED"}</span>
                                    {emp.pan_proof_url ? (
                                      <a href={emp.pan_proof_url} target="_blank" rel="noreferrer" className="text-[var(--user-accent)] hover:underline flex items-center gap-1.5 text-[11px] font-bold">
                                        <ShieldCheck className="h-3.5 w-3.5"/> Verified
                                      </a>
                                    ) : (
                                      <span className="text-gray-400 text-[11px] font-bold flex items-center gap-1.5">
                                        <AlertCircle className="h-3.5 w-3.5"/> Pending
                                      </span>
                                    )}
                                 </div>
                               </div>
                             </>
                           )}
                        </div>
                     </div>
                  </div>
                )}
               {(activeTab === "Personal" || activeTab === "All") && (
                 <div className="bg-[#F4F4F5] dark:bg-[#1C1C1E] rounded-[24px] p-6 md:p-8 mb-8 animate-in fade-in duration-300 space-y-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gray-50 dark:bg-[#2C2C35] text-gray-500 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-white/5">
                        <GraduationCap size={18} />
                      </div>
                      <h3 className="text-[15px] font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-0">Education Profile</h3>
                    </div>
                    
                    {(() => {
                      try {
                        const edu = typeof emp.education_details === 'string' ? JSON.parse(emp.education_details) : (emp.education_details || {});
                        
                        let schools = edu.schools || [];
                        if (schools.length === 0 && emp.custom_fields?.schoolingInstName) {
                          schools = [{
                            school_name: emp.custom_fields.schoolingInstName,
                            qualification: emp.custom_fields.schoolingQual,
                            proof_url: emp.custom_fields.schoolingCertUrl,
                            year_passed: emp.custom_fields.schoolingGradYear
                          }];
                        }
                        
                        let universities = edu.universities || [];
                        if (universities.length === 0 && emp.custom_fields?.higherEduInstName) {
                          universities = [{
                            university_name: emp.custom_fields.higherEduInstName,
                            degree_type: emp.custom_fields.higherEduQual,
                            degree_name: emp.custom_fields.higherEduCourseName,
                            proof_url: emp.custom_fields.higherEduCertUrl,
                            year_passed: emp.custom_fields.higherEduGradYear
                          }];
                        }
                        
                        let courses = edu.courses || [];
                        if (courses.length === 0 && Array.isArray(emp.custom_fields?.certifications)) {
                          courses = emp.custom_fields.certifications
                            .filter((c: any) => c.certName || c.issuingOrg)
                            .map((c: any) => ({
                              course_name: c.certName,
                              course_provider: c.issuingOrg,
                              proof_url: c.certificationUrl,
                              course_duration: c.certIssueDate ? `Issued: ${c.certIssueDate}${c.certExpiryDate ? ` • Expires: ${c.certExpiryDate}` : ''}` : ""
                            }));
                        }
                        
                        const hasNoData = schools.length === 0 && universities.length === 0 && courses.length === 0;

                        if (hasNoData) {
                          return (
                            <div className="bg-white dark:bg-[#1C1C1E] p-8 text-center rounded-[16px] border border-[#E5E7EB] dark:border-[#2C2C35]">
                              <GraduationCap className="h-8 w-8 text-gray-400 mx-auto mb-3 opacity-50"/>
                              <p className="text-[14px] font-medium text-gray-500">No formal education history logged in the system.</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-12">
                            {/* Universities */}
                            {universities.length > 0 && (
                              <div className="space-y-6">
                                <h4 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest pl-1">Universities & Degrees</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                                  {universities.map((u: any, i: number) => (
                                    <div key={i} className="flex flex-col gap-2">
                                      <label className="text-[12px] font-semibold text-gray-500 pl-1">{u.university_name || "University Entry"}</label>
                                      <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white flex flex-col gap-0.5">
                                        <div className="flex justify-between items-center">
                                          <span>{u.degree_type} - {u.degree_name}</span>
                                          {u.proof_url && <a href={u.proof_url} target="_blank" rel="noreferrer" className="text-[var(--user-accent)] hover:underline flex items-center gap-1 text-[11px]"><ShieldCheck className="h-3 w-3"/> Degree</a>}
                                        </div>
                                        <span className="text-[11px] font-medium text-gray-400">{u.sgpa ? `CGPA/SGPA: ${u.sgpa}` : ""} • Completed in {u.year_passed || "-"}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Schools */}
                            {schools.length > 0 && (
                              <div className="space-y-6">
                                <h4 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest pl-1">Schools History</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                                  {schools.map((s: any, i: number) => (
                                    <div key={i} className="flex flex-col gap-2">
                                      <label className="text-[12px] font-semibold text-gray-500 pl-1">{s.school_name || "School Entry"}</label>
                                      <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white flex flex-col gap-0.5">
                                        <div className="flex justify-between items-center">
                                          <span>{s.qualification || "Unspecified"}</span>
                                          {s.proof_url && <a href={s.proof_url} target="_blank" rel="noreferrer" className="text-[var(--user-accent)] hover:underline flex items-center gap-1 text-[11px]"><Shield className="h-3 w-3"/> Verified</a>}
                                        </div>
                                        <span className="text-[11px] font-medium text-gray-400">Class of {s.year_passed || "-"}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Courses */}
                            {courses.length > 0 && (
                              <div className="space-y-6">
                                <h4 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest pl-1">Professional Certifications</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                                  {courses.map((c: any, i: number) => (
                                    <div key={i} className="flex flex-col gap-2">
                                      <label className="text-[12px] font-semibold text-gray-500 pl-1">{c.course_name || "Certification"}</label>
                                      <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white flex flex-col gap-0.5">
                                        <div className="flex justify-between items-center">
                                          <span>{c.course_provider}</span>
                                          {c.proof_url && <a href={c.proof_url} target="_blank" rel="noreferrer" className="text-[var(--user-accent)] hover:underline flex items-center gap-1 text-[11px]"><Award className="h-3.5 w-3.5"/> Verified</a>}
                                        </div>
                                        <span className="text-[11px] font-medium text-gray-400">{c.course_duration || "Certificate"}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      } catch (e) {
                         return (
                           <div className="bg-white dark:bg-[#1C1C1E] p-6 text-left rounded-[16px] border border-[#E5E7EB] dark:border-[#2C2C35]">
                             <span className="text-[12px] text-red-500 font-bold tracking-widest uppercase block mb-2">Parse Error</span>
                             <p className="text-[13px] font-mono text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                {typeof emp.education_details === 'string' ? emp.education_details : JSON.stringify(emp.education_details, null, 2)}
                             </p>
                           </div>
                         );
                      }
                    })()}
                 </div>
               )}

               {(activeTab === "Medical" || activeTab === "All") && (
                  <div className="bg-[#F4F4F5] dark:bg-[#1C1C1E] rounded-[24px] p-6 md:p-8 mb-8 animate-in fade-in duration-300 space-y-12">
                     <div>
                       <div className="flex items-center gap-3 mb-6">
                         <div className="p-2 bg-gray-50 dark:bg-[#2C2C35] text-gray-500 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-white/5">
                           <Stethoscope size={18} />
                         </div>
                         <h3 className="text-[15px] font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-0">Medical Profile</h3>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-2">
                               <label className="text-[12px] font-semibold text-gray-500 pl-1">Blood Group</label>
                               <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-black text-red-600 dark:text-red-400">
                                  {emp.blood_group || emp.custom_fields?.bloodGroup || "Unknown"}
                               </div>
                            </div>
                       </div>
                     </div>

                     <div className="pt-8 border-t border-[#E5E7EB] dark:border-[#2C2C35]">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="p-2 bg-gray-50 dark:bg-[#2C2C35] text-gray-500 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-white/5">
                           <ShieldCheck size={18} />
                         </div>
                         <h3 className="text-[15px] font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-0">Insurance Details</h3>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                          <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Insurance Provider Name</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                               {emp.policy_provider || emp.custom_fields?.insurProvider || emp.custom_fields?.insuranceProvider || "-"}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Policy Number</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                               {emp.employee_insurance_id || emp.custom_fields?.insurPolicyNum || emp.custom_fields?.insurancePolicyNo || "-"}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Insurance Type</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                               {emp.insurance_type || emp.custom_fields?.insuranceType || "-"}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Payment Frequency</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                               {emp.custom_fields?.insurPaymentFreq || emp.custom_fields?.insurancePaymentFrequency || "-"}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Policy Start Date</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                               {(() => {
                                  const d = emp.policy_start_date || emp.custom_fields?.insurPolicyStart || emp.custom_fields?.insuranceStartDate;
                                  return d ? new Date(d).toLocaleDateString('en-GB') : "-";
                               })()}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Policy Expiry Date</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                               {(() => {
                                  const d = emp.policy_end_date || emp.custom_fields?.insurPolicyExpiry || emp.custom_fields?.insuranceEndDate;
                                  return d ? new Date(d).toLocaleDateString('en-GB') : "-";
                               })()}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Coverage Amount</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                               {(() => {
                                  const val = emp.coverage_amount || emp.custom_fields?.insurCoverageAmt || emp.custom_fields?.insuranceCoverageAmount || emp.custom_fields?.insuranceCoverage;
                                  return val ? `S$ ${Number(val).toLocaleString("en-SG")}` : "-";
                               })()}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Premium Amount</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                               {(() => {
                                  const val = emp.custom_fields?.insurPremiumAmt || emp.custom_fields?.insurancePremiumAmount;
                                  return val ? `S$ ${Number(val).toLocaleString("en-SG")}` : "-";
                               })()}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Employee Covered</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                               {emp.custom_fields?.empCovered || "-"}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Dependents Covered</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                               {emp.custom_fields?.depsCovered || "-"}
                               {emp.custom_fields?.depsCovered === "Yes" && emp.custom_fields?.numDeps ? ` (${emp.custom_fields.numDeps})` : ""}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Spouse Coverage</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                               {emp.custom_fields?.spouseCoverage || "-"}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Children Coverage</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                               {emp.custom_fields?.childrenCoverage || "-"}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Parents Coverage</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">
                               {emp.custom_fields?.parentsCoverage || "-"}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 lg:col-span-3">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Nominee</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white flex items-center justify-between">
                               <span>{emp.nominee_name || "-"}</span>
                               {emp.nominee_relation && <span className="bg-gray-100 dark:bg-[#1C1C1E] px-3 py-1 rounded-full text-[11px] font-bold text-gray-500 uppercase tracking-wider">{emp.nominee_relation}</span>}
                            </div>
                          </div>
                       </div>
                     </div>
                  </div>
               )}

               {(activeTab === "Work" || activeTab === "All") && (
                  <div className="bg-[#F4F4F5] dark:bg-[#1C1C1E] rounded-[24px] p-6 md:p-8 mb-8 animate-in fade-in duration-300 space-y-12">
                     <div>
                       <div className="flex items-center gap-3 mb-6">
                         <div className="p-2 bg-gray-50 dark:bg-[#2C2C35] text-gray-500 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-white/5">
                           <Fingerprint size={18} />
                         </div>
                         <h3 className="text-[15px] font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-0">Official Identifiers</h3>
                       </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                           <div className="flex flex-col gap-2">
                              <label className="text-[12px] font-semibold text-gray-500 pl-1">Employee ID</label>
                              <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">{emp.emp_id || "Unassigned"}</div>
                           </div>
                           <div className="flex flex-col gap-2">
                              <label className="text-[12px] font-semibold text-gray-500 pl-1">Date of Joining</label>
                              <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">{emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString('en-GB') : "Not Disclosed"}</div>
                           </div>
                           <div className="flex flex-col gap-2">
                              <label className="text-[12px] font-semibold text-gray-500 pl-1">Department</label>
                              <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">{emp.departments?.name || "General"}</div>
                           </div>
                           <div className="flex flex-col gap-2">
                              <label className="text-[12px] font-semibold text-gray-500 pl-1">App Role</label>
                              <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">{emp.role}</div>
                           </div>
                           <div className="flex flex-col gap-2">
                              <label className="text-[12px] font-semibold text-gray-500 pl-1">Designation</label>
                              <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">{emp.job_role || "Unassigned"}</div>
                           </div>
                           <div className="flex flex-col gap-2">
                              <label className="text-[12px] font-semibold text-gray-500 pl-1">Employment Type</label>
                              <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">{emp.job_type || "Regular"}</div>
                           </div>
                        </div>
                     </div>
                     
                     <div className="pt-8 border-t border-[#E5E7EB] dark:border-[#2C2C35]">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="p-2 bg-gray-50 dark:bg-[#2C2C35] text-gray-500 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-white/5">
                           <Activity size={18} />
                         </div>
                         <h3 className="text-[15px] font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-0">Operational Tracking</h3>
                       </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                           <div className="flex flex-col gap-2">
                              <label className="text-[12px] font-semibold text-gray-500 pl-1">Salary</label>
                              <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">{emp.salary ? `S$ ${Number(emp.salary).toLocaleString("en-SG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : "Not Disclosed"}</div>
                           </div>
                           <div className="flex flex-col gap-2">
                              <label className="text-[12px] font-semibold text-gray-500 pl-1">Shift Protocol</label>
                              <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">{emp.shift_type || "Standard"}</div>
                           </div>
                           <div className="flex flex-col gap-2">
                              <label className="text-[12px] font-semibold text-gray-500 pl-1">Overtime</label>
                              <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">{emp.overtime_applicable ? "Applicable" : "N/A"}</div>
                           </div>
                           <div className="flex flex-col gap-2">
                              <label className="text-[12px] font-semibold text-gray-500 pl-1">Claims</label>
                              <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">{emp.claims_applicable ? "Eligible" : "N/A"}</div>
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {(activeTab === "Bank" || activeTab === "All") && (
                  <div className="bg-[#F4F4F5] dark:bg-[#1C1C1E] rounded-[24px] p-6 md:p-8 mb-12 animate-in fade-in duration-300">
                     <div className="flex items-center gap-3 mb-6">
                       <div className="p-2 bg-gray-50 dark:bg-[#2C2C35] text-gray-500 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-white/5">
                         <Landmark size={18} />
                       </div>
                       <h3 className="text-[15px] font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-0">Bank Details</h3>
                     </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                         <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Bank Name</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">{emp.bank_name || emp.custom_fields?.bankName || "Unassigned"}</div>
                         </div>
                         <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Account Holder Name</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">{emp.account_holder_name || emp.custom_fields?.accountHolder || "Unassigned"}</div>
                         </div>
                         <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Account Number</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white font-mono tracking-wider">{emp.account_number || emp.custom_fields?.accountNum || "Unassigned"}</div>
                         </div>
                         <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Online Payment Method</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">{emp.custom_fields?.onlinePaymentType || "-"}</div>
                         </div>
                         <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Online Payment ID/Number</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">{emp.custom_fields?.onlinePaymentId || "-"}</div>
                         </div>
                         <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-gray-500 pl-1">Salary Payment Mode</label>
                            <div className="bg-white dark:bg-[#121217] rounded-[14px] px-5 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white">{emp.custom_fields?.salaryPaymentMode || "Unassigned"}</div>
                         </div>
                      </div>
                  </div>
                )}

               {(activeTab === "Documents" || activeTab === "All") && (
                  <div className="bg-[#F4F4F5] dark:bg-[#1C1C1E] rounded-[24px] p-6 md:p-8 mb-8 animate-in fade-in duration-300">
                     <div className="flex items-center justify-between mb-6">
                       <h3 className="text-[15px] font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                         Documents & Attachments
                       </h3>
                       <button
                         onClick={() => setIsUploadPanelOpen(true)}
                         className="flex items-center gap-1.5 px-4 py-1.5 bg-[#007AFF] text-white rounded-[10px] text-[12px] font-bold hover:bg-[#0062CC] transition-all"
                       >
                         <Plus className="h-3.5 w-3.5" /> Upload New
                       </button>
                     </div>

                     {getEmployeeDocuments().length === 0 ? (
                       <div className="bg-white dark:bg-[#121217] rounded-[18px] p-8 text-center border border-dashed border-gray-200 dark:border-white/5">
                         <FileText className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                         <p className="text-[14px] font-bold text-gray-900 dark:text-white mb-1">No documents uploaded</p>
                         <p className="text-[12px] text-gray-500 max-w-[280px] mx-auto mb-4">You can upload identity proofs, certificates, and contract copies for this employee.</p>
                         <button
                           onClick={() => setIsUploadPanelOpen(true)}
                           className="px-5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-[#2C2C35] dark:hover:bg-[#3C3C45] text-gray-900 dark:text-white text-[13px] font-semibold rounded-[10px] transition-colors"
                         >
                           Upload Document
                         </button>
                       </div>
                     ) : (
                        <div className="flex flex-col gap-3">
                          {/* Header Row */}
                          <div className="grid grid-cols-12 gap-4 px-4 pb-2 text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
                            <div className="col-span-5 md:col-span-4">DOCUMENT NAME</div>
                            <div className="hidden md:block md:col-span-3">TYPE</div>
                            <div className="col-span-3 md:col-span-2">UPLOADED ON</div>
                            <div className="col-span-2 md:col-span-2">STATUS</div>
                            <div className="col-span-2 md:col-span-1 text-right">ACTIONS</div>
                          </div>
                          
                          {/* Rows */}
                          <div className="flex flex-col gap-3">
                            {getEmployeeDocuments()
                              .slice((docPage - 1) * itemsPerPage, docPage * itemsPerPage)
                              .map((doc, idx) => {
                                const getFileExtension = (path: string, name: string) => {
                                  const pathParts = path.split('/');
                                  const filePart = pathParts[pathParts.length - 1];
                                  if (filePart.includes('.')) {
                                    const ext = filePart.split('.').pop()?.toUpperCase();
                                    if (ext && ext.length <= 4 && /^[A-Z0-9]+$/.test(ext)) return ext;
                                  }
                                  if (name.includes('.')) {
                                    const ext = name.split('.').pop()?.toUpperCase();
                                    if (ext && ext.length <= 4 && /^[A-Z0-9]+$/.test(ext)) return ext;
                                  }
                                  return 'DOC';
                                };

                                const extText = getFileExtension(doc.path, doc.name);
                                let badgeColor = 'bg-[#8E8E93]'; // Gray default
                                if (['PDF'].includes(extText)) {
                                  badgeColor = 'bg-[#FF3B30]'; // Red
                                } else if (['DOC', 'DOCX', 'TXT', 'RTF'].includes(extText)) {
                                  badgeColor = 'bg-[#007AFF]'; // Blue
                                } else if (['XLS', 'XLSX', 'CSV'].includes(extText)) {
                                  badgeColor = 'bg-[#34C759]'; // Green
                                } else if (['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'SVG'].includes(extText)) {
                                  badgeColor = 'bg-[#30B0C7]'; // Teal
                                } else if (['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(extText)) {
                                  badgeColor = 'bg-[#AF52DE]'; // Purple
                                }

                                return (
                                  <div 
                                    key={idx}
                                    className="bg-white dark:bg-[#121217] rounded-[16px] border border-[#E5E7EB] dark:border-[#2C2C35] p-3 flex items-center grid grid-cols-12 gap-4 group relative hover:border-[#007AFF]/40 hover:shadow-sm transition-all"
                                  >
                                    <button
                                      onClick={() => handleDeleteDoc(doc.path, doc.originalDocKey, doc.isCustom)}
                                      title="Delete Document"
                                      className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>

                                    {/* Document Name */}
                                    <div className="col-span-5 md:col-span-4 flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-[10px] border border-gray-200 dark:border-[#2C2C35] flex items-center justify-center bg-gray-50 dark:bg-[#1C1C1E] shrink-0 relative overflow-hidden">
                                        {(() => {
                                          const ext = extText.toLowerCase();
                                          let src = "/Icons/ExtensionIcons/docx_icon.svg";
                                          if (ext === "pdf") src = "/Icons/ExtensionIcons/PDF_file_icon.svg";
                                          else if (ext === "csv") src = "/Icons/ExtensionIcons/csv_icon.svg";
                                          else if (["xls", "xlsx"].includes(ext)) src = "/Icons/ExtensionIcons/xlsx_icon.svg";
                                          else if (["ppt", "pptx"].includes(ext)) src = "/Icons/ExtensionIcons/pptx_icon_(2019).svg";
                                          else if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) src = "/Icons/ExtensionIcons/img.svg";
                                          
                                          return (
                                            <div className="w-6 h-6 flex items-center justify-center mb-1">
                                              <Image src={src} alt={extText} width={22} height={22} className="object-contain" />
                                            </div>
                                          );
                                        })()}
                                        <div className={`absolute bottom-0 w-full flex justify-center ${badgeColor} py-[1px]`}>
                                          <span className="text-[7px] font-black text-white leading-none tracking-wider">{extText}</span>
                                        </div>
                                      </div>
                                      <h4 className="text-[13px] font-bold text-gray-900 dark:text-white truncate" title={doc.name}>
                                        {doc.name}
                                      </h4>
                                    </div>

                                    {/* Type */}
                                    <div className="hidden md:flex md:col-span-3 items-center">
                                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-gray-100 dark:bg-[#2C2C35] text-gray-600 dark:text-gray-400 truncate">
                                        {doc.category}
                                      </span>
                                    </div>

                                    {/* Uploaded On */}
                                    <div className="col-span-3 md:col-span-2 flex items-center">
                                      <span className="text-[12px] font-bold text-gray-900 dark:text-white">
                                        {doc.uploadedAt}
                                      </span>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2 md:col-span-2 flex items-center">
                                      {doc.verified ? (
                                        <span className="text-[11px] font-bold text-[#34C759] bg-[#34C759]/10 px-2 py-1 rounded-md flex items-center gap-1 w-max">
                                          <ShieldCheck className="h-3.5 w-3.5" /> <span className="hidden xl:inline">Verified</span>
                                        </span>
                                      ) : (
                                        <span className="text-[11px] font-bold text-gray-500 bg-gray-100 dark:bg-[#2C2C35] px-2 py-1 rounded-md flex items-center gap-1 w-max">
                                          <AlertCircle className="h-3.5 w-3.5" /> <span className="hidden xl:inline">Pending</span>
                                        </span>
                                      )}
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-2 md:col-span-1 flex items-center justify-end gap-1.5 pr-1">
                                      <button
                                        onClick={() => handlePreview(doc.path)}
                                        title="Preview Document"
                                        className="p-1.5 rounded-lg border border-gray-200 dark:border-[#2C2C35] hover:bg-gray-50 dark:hover:bg-[#2C2C35] text-gray-600 dark:text-gray-400 transition-colors"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDownload(doc.path, doc.name)}
                                        title="Download Document"
                                        className="p-1.5 rounded-lg border border-gray-200 dark:border-[#2C2C35] hover:bg-gray-50 dark:hover:bg-[#2C2C35] text-gray-600 dark:text-gray-400 transition-colors"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                          
                          {/* Pagination Controls */}
                          {getEmployeeDocuments().length > itemsPerPage && (
                            <div className="flex items-center justify-between border-t border-gray-200 dark:border-[#2C2C35] pt-4 mt-2">
                              <span className="text-[12px] font-semibold text-gray-500">
                                Showing {(docPage - 1) * itemsPerPage + 1} to {Math.min(docPage * itemsPerPage, getEmployeeDocuments().length)} of {getEmployeeDocuments().length}
                              </span>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => setDocPage(p => Math.max(1, p - 1))}
                                  disabled={docPage === 1}
                                  className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-[#2C2C35] transition-colors"
                                >
                                  Previous
                                </button>
                                <span className="text-[12px] font-bold text-gray-900 dark:text-white px-2">{docPage}</span>
                                <button 
                                  onClick={() => setDocPage(p => Math.min(Math.ceil(getEmployeeDocuments().length / itemsPerPage), p + 1))}
                                  disabled={docPage >= Math.ceil(getEmployeeDocuments().length / itemsPerPage)}
                                  className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-[#2C2C35] transition-colors"
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                     )}
                  </div>
               )}

               {(activeTab === "Projects" || activeTab === "All") && (
                  <div className="bg-[#F4F4F5] dark:bg-[#1C1C1E] rounded-[24px] p-6 md:p-8 mb-12 animate-in fade-in duration-300">
                     <div className="flex items-center justify-between mb-6">
                       <h3 className="text-[15px] font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                         Projects History & Scope
                       </h3>
                       <button
                         onClick={() => router.push('/projects')}
                         className="flex items-center gap-1 text-[12px] font-bold text-[#007AFF] hover:underline"
                       >
                         View All Projects <ChevronRight className="h-3.5 w-3.5" />
                       </button>
                     </div>

                     {/* Project Stats Summary */}
                     <div className="grid grid-cols-3 gap-4 mb-8">
                       <div className="bg-white dark:bg-[#121217] rounded-[16px] p-4 border border-gray-100 dark:border-[#2C2C35] flex flex-col justify-between">
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Total Assignments</span>
                         <span className="text-[20px] font-black text-gray-900 dark:text-white">{getEmployeeProjects().length}</span>
                       </div>
                       <div className="bg-white dark:bg-[#121217] rounded-[16px] p-4 border border-gray-100 dark:border-[#2C2C35] flex flex-col justify-between">
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Active Projects</span>
                         <span className="text-[20px] font-black text-[#22C55E]">{getEmployeeProjects().filter(p => p.status === 'Active').length}</span>
                       </div>
                       <div className="bg-white dark:bg-[#121217] rounded-[16px] p-4 border border-gray-100 dark:border-[#2C2C35] flex flex-col justify-between">
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Completed History</span>
                         <span className="text-[20px] font-black text-gray-400">{getEmployeeProjects().filter(p => p.status === 'Closed').length}</span>
                       </div>
                     </div>

                     {getEmployeeProjects().length === 0 ? (
                       <div className="bg-white dark:bg-[#121217] rounded-[18px] p-8 text-center border border-dashed border-gray-200 dark:border-white/5">
                         <Briefcase className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                         <p className="text-[14px] font-bold text-gray-900 dark:text-white mb-1">No project assignments</p>
                         <p className="text-[12px] text-gray-500 max-w-[280px] mx-auto">This employee is not currently assigned to any company projects.</p>
                       </div>
                     ) : (
                       <div className="flex flex-col gap-6">
                         <div className="flex flex-col gap-4">
                           {getEmployeeProjects()
                             .slice((projPage - 1) * itemsPerPage, projPage * itemsPerPage)
                             .map((p) => {
                             const cat = categoryStyle[p.category as ProjectCategory] || categoryStyle.Tech;
                             const stat = statusStyle[p.status as ProjectStatus] || statusStyle.Active;
                             return (
                               <div 
                                 key={p.id}
                                 className="bg-white dark:bg-[#121217] rounded-[18px] border border-gray-100 dark:border-[#2C2C35] p-5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:border-[#FF9500]/40 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 group"
                               >
                                 <div className="flex items-center gap-4 flex-1">
                                   <div 
                                     className="h-12 w-12 rounded-[14px] flex items-center justify-center text-[16px] font-bold shrink-0"
                                     style={{ backgroundColor: getAvatarColor(p.name).bg, color: getAvatarColor(p.name).color }}
                                   >
                                     {getInitials(p.name)}
                                   </div>
                                   <div>
                                     <h4 className="text-[15px] font-bold text-gray-900 dark:text-white leading-tight mb-1 group-hover:text-[#FF9500] transition-colors">{p.name}</h4>
                                     <div className="flex items-center gap-3 text-[12px] font-medium text-gray-500">
                                       <span className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> {p.code}</span>
                                       <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {p.client}</span>
                                     </div>
                                   </div>
                                 </div>

                                 <div className="flex items-center gap-6 w-full lg:w-auto">
                                   <div className="flex flex-col gap-1.5 min-w-[120px]">
                                     <span 
                                       className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit" 
                                       style={{ backgroundColor: cat.bg, color: cat.text }}
                                     >
                                       <span>{cat.icon}</span>{p.category}
                                     </span>
                                     <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider w-fit px-2.5 py-1 rounded-full bg-gray-50 dark:bg-[#1C1C1E]" style={{ color: stat.text }}>
                                       <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stat.dot }} />{p.status}
                                     </span>
                                   </div>

                                   <div className="flex-1 lg:w-[150px]">
                                     <div className="flex justify-between mb-1.5">
                                       <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1"><Activity className="h-3.5 w-3.5"/> Progress</span>
                                       <span className="text-[11px] font-extrabold text-[#4F46E5]">{p.progress}%</span>
                                     </div>
                                     <div className="h-2 w-full bg-gray-100 dark:bg-[#2A2A31] rounded-full overflow-hidden">
                                       <div className="h-full rounded-full transition-all" style={{ width: `${p.progress}%`, background: p.progress === 100 ? "#22C55E" : "#4f46e5" }} />
                                     </div>
                                   </div>

                                   <div className="flex flex-col gap-1 min-w-[150px] text-right">
                                     <span className="text-gray-900 dark:text-white font-bold text-[13px]">{p.financials}</span>
                                     <span className="flex items-center justify-end gap-1 text-[11px] font-medium text-gray-400">
                                       <Clock className="h-3.5 w-3.5 text-gray-400" /> {p.startDate} - {p.endDate}
                                     </span>
                                   </div>

                                   <button 
                                     onClick={() => router.push(`/projects/${p.code}`)}
                                     className="px-5 py-2.5 bg-gray-100 hover:bg-[#FF9500] hover:text-white text-gray-900 dark:bg-[#2C2C35] dark:text-white dark:hover:bg-[#FF9500] text-[13px] font-bold rounded-[12px] transition-colors ml-2 whitespace-nowrap"
                                   >
                                     View Project
                                   </button>
                                 </div>
                               </div>
                             );
                           })}
                         </div>

                         {/* Pagination Controls */}
                         {getEmployeeProjects().length > itemsPerPage && (
                           <div className="flex items-center justify-between border-t border-gray-200 dark:border-[#2C2C35] pt-6 mt-2">
                             <span className="text-[12px] font-semibold text-gray-500">
                               Showing {(projPage - 1) * itemsPerPage + 1} to {Math.min(projPage * itemsPerPage, getEmployeeProjects().length)} of {getEmployeeProjects().length}
                             </span>
                             <div className="flex items-center gap-2">
                               <button 
                                 onClick={() => setProjPage(p => Math.max(1, p - 1))}
                                 disabled={projPage === 1}
                                 className="px-3 py-1.5 rounded-lg text-[13px] font-bold bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-[#2C2C35] transition-colors"
                               >
                                 Previous
                               </button>
                               <span className="text-[13px] font-bold text-gray-900 dark:text-white px-2">{projPage}</span>
                               <button 
                                 onClick={() => setProjPage(p => Math.min(Math.ceil(getEmployeeProjects().length / itemsPerPage), p + 1))}
                                 disabled={projPage >= Math.ceil(getEmployeeProjects().length / itemsPerPage)}
                                 className="px-3 py-1.5 rounded-lg text-[13px] font-bold bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-[#2C2C35] transition-colors"
                               >
                                 Next
                               </button>
                             </div>
                           </div>
                         )}
                       </div>
                     )}
                  </div>
               )}

               {/* --- TAB: HISTORIES --- */}
               {(activeTab === "Histories" || activeTab === "All") && (
                 <div className="bg-[#F4F4F5] dark:bg-[#1C1C1E] rounded-[24px] p-6 md:p-8 mb-8 animate-in fade-in duration-300">
                   <div className="flex items-center gap-3 mb-6">
                     <div className="p-2 bg-gray-50 dark:bg-[#2C2C35] text-gray-500 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-white/5">
                       <Activity size={18} />
                     </div>
                     <h3 className="text-[15px] font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-0">Activity History</h3>
                   </div>

                   {employeeHistory.length === 0 ? (
                     <div className="py-12 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-[#1C1C22]/50 rounded-[16px] border border-dashed border-gray-200 dark:border-[#2C2C35]">
                       <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-[#2C2C35] flex items-center justify-center mb-4">
                         <Activity className="h-6 w-6 text-gray-400" />
                       </div>
                       <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-1">No History Yet</h3>
                       <p className="text-[12px] text-gray-500">There are no logged events for this employee.</p>
                     </div>
                   ) : (
                     <div className="relative pl-6 border-l-2 border-gray-100 dark:border-[#2C2C35] space-y-8 mt-4">
                       {employeeHistory.map((log: any) => {
                         let icon = <Activity className="h-4 w-4" />;
                         let iconBg = "bg-gray-100 dark:bg-[#2C2C35]";
                         let iconColor = "text-gray-500";
                         
                         if (log.event_type === 'onboard') { icon = <UserPlusIcon className="h-4 w-4" />; iconBg = "bg-green-100"; iconColor = "text-green-600"; }
                         if (log.event_type === 'department_change') { icon = <Building2 className="h-4 w-4" />; iconBg = "bg-blue-100"; iconColor = "text-blue-600"; }
                         if (log.event_type === 'role_change') { icon = <Shield className="h-4 w-4" />; iconBg = "bg-purple-100"; iconColor = "text-purple-600"; }
                         if (log.event_type === 'designation_change') { icon = <Briefcase className="h-4 w-4" />; iconBg = "bg-orange-100"; iconColor = "text-orange-600"; }
                         if (log.event_type === 'project_assign') { icon = <Briefcase className="h-4 w-4" />; iconBg = "bg-indigo-100"; iconColor = "text-indigo-600"; }

                         return (
                           <div key={log.id} className="relative">
                             {/* Timeline Dot */}
                             <div className={`absolute -left-[35px] h-8 w-8 rounded-full ${iconBg} ${iconColor} flex items-center justify-center border-4 border-white dark:border-[#1C1C1E]`}>
                               {icon}
                             </div>
                             
                             <div className="bg-gray-50 dark:bg-[#1C1C22]/50 border border-gray-100 dark:border-[#2C2C35] rounded-[16px] p-5">
                               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                 <h4 className="text-[14px] font-bold text-gray-900 dark:text-white">{log.description}</h4>
                                 <span className="text-[11px] font-medium text-gray-400">
                                   {new Date(log.created_at).toLocaleString()}
                                 </span>
                               </div>
                               
                               {(log.old_value || log.new_value) && log.event_type !== 'onboard' && (
                                 <div className="flex flex-col gap-2 mt-3 p-3 bg-white dark:bg-[#1C1C1E] rounded-[12px] border border-gray-100 dark:border-[#2C2C35] overflow-hidden">
                                   {log.old_value && (
                                     <div className="flex items-start gap-2">
                                       <span className="text-[11px] font-bold text-gray-400 uppercase w-12 shrink-0">From:</span>
                                       <span className="text-[12px] font-medium text-gray-500 line-through break-all">{log.old_value}</span>
                                     </div>
                                   )}
                                   {log.new_value && (
                                     <div className="flex items-start gap-2">
                                       <span className="text-[11px] font-bold text-green-500 uppercase w-12 shrink-0">To:</span>
                                       <span className="text-[12px] font-bold text-gray-900 dark:text-white break-all">{log.new_value}</span>
                                     </div>
                                   )}
                                 </div>
                               )}
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   )}
                 </div>
               )}

               {/* --- TAB: SALARY --- */}
               {(activeTab === "Salary" || activeTab === "All") && (
                 <div className="bg-[#F4F4F5] dark:bg-[#1C1C1E] rounded-[24px] p-6 md:p-8 mb-8 animate-in fade-in duration-300">
                   <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-3">
                       <div className="p-2 bg-gray-50 dark:bg-[#2C2C35] text-gray-500 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-white/5">
                         <Banknote size={18} />
                       </div>
                       <h3 className="text-[15px] font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-0">Payroll History</h3>
                     </div>
                     <button 
                       onClick={() => router.push(`/payroll/history/${emp.id}`)}
                       className="text-[12px] font-bold text-[#007AFF] hover:text-[#005bb5] flex items-center gap-1 bg-white dark:bg-[#2C2C35] px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/5 transition-colors"
                     >
                       Full Payroll Detail <ChevronRight size={14} />
                     </button>
                   </div>

                   <div className="relative pl-6 border-l-2 border-gray-100 dark:border-[#2C2C35] space-y-6 mt-6">
                     {[1, 2, 3].map((monthIdx) => {
                       const d = new Date();
                       d.setMonth(d.getMonth() - monthIdx);
                       const monthName = d.toLocaleString('default', { month: 'long' });
                       const year = d.getFullYear();
                       
                       const baseSalary = parseFloat(emp.custom_fields?.basicSalary || "3200");
                       const isExpanded = expandedPayroll.includes(monthIdx);
                       const toggleExpand = () => {
                         setExpandedPayroll(prev => prev.includes(monthIdx) ? prev.filter(i => i !== monthIdx) : [...prev, monthIdx]);
                       };

                       return (
                         <div key={monthIdx} className="relative">
                           <div className="absolute -left-[35px] h-8 w-8 rounded-full bg-green-50 dark:bg-[#2C2C35] text-green-500 flex items-center justify-center border-4 border-[#F4F4F5] dark:border-[#1C1C1E]">
                             <Check size={14} strokeWidth={3} />
                           </div>
                           
                           <div className="bg-white dark:bg-[#1C1C22]/50 border border-gray-100 dark:border-[#2C2C35] rounded-[16px] overflow-hidden transition-all duration-200 hover:shadow-sm">
                             <div 
                               onClick={toggleExpand}
                               className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                             >
                               <div className="flex items-center gap-4">
                                 <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-[#2C2C35] flex items-center justify-center text-[#007AFF]">
                                   <Banknote size={18} />
                                 </div>
                                 <div>
                                   <h4 className="text-[14px] font-bold text-gray-900 dark:text-white">Monthly Salary - {monthName}</h4>
                                   <p className="text-[12px] font-medium text-gray-500">Paid on 28 {monthName} {year} • Bank Transfer</p>
                                 </div>
                               </div>
                               
                               <div className="flex items-center gap-4 sm:gap-6">
                                 <div className="text-right">
                                   <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Net Pay</p>
                                   <p className="text-[15px] font-black text-gray-900 dark:text-white">S$ {baseSalary.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                 </div>
                                 <div className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#2C2C35] text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                   <ChevronDown size={18} />
                                 </div>
                               </div>
                             </div>
                             
                             {/* Extend Bar Content */}
                             {isExpanded && (
                               <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-[#2C2C35] bg-gray-50/50 dark:bg-transparent animate-in slide-in-from-top-2 duration-200">
                                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-3">
                                   <div>
                                     <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Gross Earnings</p>
                                     <p className="text-[13px] font-bold text-gray-900 dark:text-white">S$ {baseSalary.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                     <p className="text-[11px] text-gray-500 mt-1">Basic Salary: S$ {baseSalary.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                   </div>
                                   <div>
                                     <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Total Deductions</p>
                                     <p className="text-[13px] font-bold text-red-500">- S$ 0.00</p>
                                     <p className="text-[11px] text-gray-500 mt-1">No deductions applied</p>
                                   </div>
                                   <div>
                                     <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Employer Contribution</p>
                                     <p className="text-[13px] font-bold text-gray-700 dark:text-gray-300">S$ {(baseSalary * 0.17).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                     <p className="text-[11px] text-gray-500 mt-1">CPF (17%)</p>
                                   </div>
                                 </div>
                               </div>
                             )}
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               )}

            </div>

          </div>


        </div>
      </main>

      {/* Notification Modal */}
      {isNotificationModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="px-6 py-5 border-b border-[#E5E7EB] dark:border-[#2C2C35] flex items-center justify-between">
                <h3 className="text-[18px] font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[var(--user-accent)]" /> Send Push Notification
                </h3>
                <button onClick={() => setIsNotificationModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
             </div>
             
             <form onSubmit={handlePushNotification} className="p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-gray-700 dark:text-gray-300">Notification Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Mandatory Training Reminder"
                    className="w-full px-4 py-3 rounded-[12px] border border-[#E5E7EB] dark:border-[#2C2C35] bg-gray-50 dark:bg-[#121214] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--user-accent)]/50 transition-all text-[14px]"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-gray-700 dark:text-gray-300">Message Body</label>
                  <textarea 
                    required
                    placeholder="Write the detailed message here..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-[12px] border border-[#E5E7EB] dark:border-[#2C2C35] bg-gray-50 dark:bg-[#121214] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--user-accent)]/50 transition-all text-[14px] resize-none"
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-gray-700 dark:text-gray-300">Priority / Type</label>
                  <select 
                    className="w-full px-4 py-3 rounded-[12px] border border-[#E5E7EB] dark:border-[#2C2C35] bg-gray-50 dark:bg-[#121214] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--user-accent)]/50 transition-all text-[14px] appearance-none"
                    value={notificationForm.type}
                    onChange={(e) => setNotificationForm({...notificationForm, type: e.target.value})}
                  >
                     <option value="info">Information (Default)</option>
                     <option value="warning">Warning / Attention</option>
                     <option value="success">Success / Achievement</option>
                     <option value="urgent">Urgent Action Required</option>
                  </select>
                </div>
                
                <div className="mt-2 pt-5 border-t border-[#E5E7EB] dark:border-[#2C2C35] flex items-center justify-between">
                   <button 
                     type="button" 
                     onClick={() => {
                        setIsNotificationModalOpen(false);
                        setActiveTab("Notifications");
                     }}
                     className="text-[13px] font-bold text-[var(--user-accent)] hover:underline flex items-center gap-1.5"
                   >
                     See Notifications History
                   </button>
                   <button 
                     type="submit" 
                     disabled={isSendingNotification}
                     className="px-6 py-2.5 bg-[#464D5B] hover:bg-black dark:bg-[#2C3038] dark:hover:bg-[#3F444D] text-white font-bold text-[14px] rounded-[12px] transition-all disabled:opacity-50 flex items-center gap-2"
                   >
                     {isSendingNotification ? "Sending..." : "Push Now"}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Configure Employee Side Panel */}
      {isConfigurePanelOpen && (
        <>
          {/* Backdrop */}
          <div 
            className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isConfigureClosing ? 'opacity-0' : 'opacity-100'} bg-black/10 dark:bg-black/30`}
            onClick={closeConfigurePanel}
          />
          <div className={`fixed inset-y-0 right-0 z-[100] w-full max-w-[440px] bg-white dark:bg-[#121217] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out ${isConfigureClosing ? 'translate-x-full' : 'translate-x-0'}`}>
             {/* ── SCREEN 1: Main Configure Profile ── */}
             {activeSubPanel === null && (
               <>
                 {/* Header */}
                 <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                   <div>
                     <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
                       Configure Profile
                     </h2>
                     <p className="text-[12px] text-[#8E8E93] mt-0.5">Manage credentials, module access, and team transfers</p>
                   </div>
                   <button onClick={closeConfigurePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                     <X size={20} />
                   </button>
                 </div>

                 {/* Scrollable Body */}
                 <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 page-scrollbar">
                    
                    {/* Active Status */}
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 border border-[#E5E7EB] dark:border-[#2C2C35] flex items-center justify-between">
                      <div>
                        <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">Active Status</h3>
                        <p className="text-[12px] font-medium text-gray-500">Employee account is currently {activeStatus ? 'active' : 'inactive'}</p>
                      </div>
                      <button 
                        onClick={() => handleToggleActiveStatus(!activeStatus)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${activeStatus ? 'bg-[#34C759]' : 'bg-gray-300 dark:bg-gray-700'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${activeStatus ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    {/* Login Access */}
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 border border-[#E5E7EB] dark:border-[#2C2C35] flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">
                            Login Access
                          </h3>
                           <p className="text-[12px] font-medium text-gray-500 mt-1">
                             {credStatus?.exists ? `Access enabled as ${emp.email}` : "Credentials not configured"}
                           </p>
                        </div>
                        <button 
                          onClick={() => {
                            setActiveSubPanel('login_access');
                            setCredPassword("");
                            setCredMsg(null);
                          }}
                          className={`px-4 py-2 text-[12px] font-bold rounded-xl transition-all ${
                            credStatus?.exists 
                              ? "bg-gray-100 hover:bg-gray-200 dark:bg-[#2C2C35] dark:hover:bg-[#3C3C45] text-gray-900 dark:text-white"
                              : "bg-[#007AFF]/10 hover:bg-[#007AFF]/15 text-[#007AFF]"
                          }`}
                        >
                          {credStatus?.exists ? "Manage" : "Enable"}
                        </button>
                      </div>
                    </div>

                    {/* Module Access */}
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 border border-[#E5E7EB] dark:border-[#2C2C35] flex flex-col gap-4">
                      <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">
                        Module Access
                      </h3>
                      <div className="flex flex-col gap-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Attendance Tracker</span>
                          <button onClick={() => handleToggleModule('module_attendance', attendanceEnabled)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${attendanceEnabled ? 'bg-[#007AFF]' : 'bg-gray-300 dark:bg-gray-700'}`}>
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${attendanceEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Leave Management</span>
                          <button onClick={() => handleToggleModule('module_leave', leaveEnabled)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${leaveEnabled ? 'bg-[#007AFF]' : 'bg-gray-300 dark:bg-gray-700'}`}>
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${leaveEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Expense Claims</span>
                          <button onClick={() => handleToggleModule('module_claim', claimEnabled)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${claimEnabled ? 'bg-[#007AFF]' : 'bg-gray-300 dark:bg-gray-700'}`}>
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${claimEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Events & Notifications</span>
                          <button onClick={() => handleToggleModule('module_event', eventEnabled)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${eventEnabled ? 'bg-[#007AFF]' : 'bg-gray-300 dark:bg-gray-700'}`}>
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${eventEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Organization Transfer */}
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 border border-[#E5E7EB] dark:border-[#2C2C35] flex flex-col gap-4">
                      <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">
                        Organization Transfer
                      </h3>
                      
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => {
                            setActiveSubPanel('transfer_team');
                            setSelectedSearchPerson(null);
                            setSelectedSearchDept(null);
                            setSearchQuery("");
                            setSearchResults([]);
                            setTempTransferDeptId(emp.department_id || "");
                          }}
                          className="flex items-center justify-between p-4 bg-[#F8F9FA] dark:bg-[#1C1C1E] hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35] rounded-xl text-left border border-[#E5E7EB] dark:border-[#2C2C35] transition-all"
                        >
                          <div className="flex flex-col">
                            <span className="text-[11px] text-[#8E8E93] font-bold uppercase tracking-wider">Team Department</span>
                            <span className="text-[13px] font-bold text-gray-900 dark:text-white mt-0.5">{emp.departments?.name || "Unassigned"}</span>
                          </div>
                          <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90 animate-in fade-in duration-200" />
                        </button>

                        <button 
                          onClick={() => {
                            setActiveSubPanel('transfer_project');
                            setSelectedSearchPerson(null);
                            setSelectedSearchDept(null);
                            setSearchQuery("");
                            setSearchResults([]);
                            setTempTransferProject(emp.current_project || emp.custom_fields?.project_name || "");
                          }}
                          className="flex items-center justify-between p-4 bg-[#F8F9FA] dark:bg-[#1C1C1E] hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35] rounded-xl text-left border border-[#E5E7EB] dark:border-[#2C2C35] transition-all"
                        >
                          <div className="flex flex-col">
                            <span className="text-[11px] text-[#8E8E93] font-bold uppercase tracking-wider">Project</span>
                            <span className="text-[13px] font-bold text-gray-900 dark:text-white mt-0.5">{emp.current_project || emp.custom_fields?.project_name || "None"}</span>
                          </div>
                          <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90 animate-in fade-in duration-200" />
                        </button>

                        <button 
                          onClick={() => {
                            setActiveSubPanel('transfer_manager');
                            setSelectedSearchPerson(null);
                            setSelectedSearchDept(null);
                            setSearchQuery("");
                            setSearchResults([]);
                            setTempTransferManagerId(emp.manager_id || "");
                          }}
                          className="flex items-center justify-between p-4 bg-[#F8F9FA] dark:bg-[#1C1C1E] hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35] rounded-xl text-left border border-[#E5E7EB] dark:border-[#2C2C35] transition-all"
                        >
                          <div className="flex flex-col">
                            <span className="text-[11px] text-[#8E8E93] font-bold uppercase tracking-wider">Reporting Staff</span>
                            <span className="text-[13px] font-bold text-gray-900 dark:text-white mt-0.5">{manager?.name || "Unassigned"}</span>
                          </div>
                          <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90 animate-in fade-in duration-200" />
                        </button>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-red-50 dark:bg-red-950/10 rounded-2xl p-5 border border-red-100 dark:border-red-900/30 flex flex-col gap-3">
                      <h3 className="text-[14px] font-bold text-red-600 dark:text-red-400">
                        Danger Zone
                      </h3>
                      <p className="text-[12px] font-medium text-red-500/80">
                        {emp.is_head 
                          ? "This employee is currently assigned as a Department Head. Try deleting them to see instructions."
                          : "Permanently delete this employee and all associated records. This action cannot be undone."}
                      </p>
                      <button 
                        onClick={() => {
                          setIsDeleteModalOpen(true);
                          setDeleteConfirmInput("");
                          setDeleteError("");
                        }}
                        className="mt-1 w-full py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        Delete Employee
                      </button>
                    </div>

                 </div>

                 {/* Footer */}
                 <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
                   <button
                     onClick={closeConfigurePanel}
                     className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] transition-colors rounded-[16px] text-white text-[15px] font-bold"
                   >
                     Close
                   </button>
                 </div>
               </>
             )}

             {/* ── SCREEN 2: Login Access Sub-panel ── */}
             {activeSubPanel === 'login_access' && (
               <>
                 {/* Header */}
                 <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                   <div className="flex items-center gap-3">
                     <button 
                       onClick={() => setActiveSubPanel(null)}
                       className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-lg text-gray-500 transition-colors"
                     >
                       <ArrowLeft className="h-5 w-5" />
                     </button>
                     <div>
                       <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Login Access</h2>
                       <p className="text-[12px] text-[#8E8E93] mt-0.5">Configure authentication credentials</p>
                     </div>
                   </div>
                   <button onClick={closeConfigurePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                     <X size={20} />
                   </button>
                 </div>

                 {/* Body */}
                 <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 page-scrollbar">
                   {/* Messages */}
                   {credMsg && (
                     <div className={`p-3.5 rounded-2xl text-[12px] font-semibold border animate-in fade-in duration-200 ${
                       credMsg.type === 'success' 
                         ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-950/10 dark:text-green-400 dark:border-green-900/30' 
                         : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/10 dark:text-red-400 dark:border-red-900/30'
                     }`}>
                       {credMsg.text}
                     </div>
                   )}

                    {/* Unconfirmed Email Warning */}
                    {credStatus?.exists && !credStatus?.confirmed && (
                      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-amber-400 flex items-center justify-center">
                            <span className="text-white text-[10px] font-black">!</span>
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-amber-800 dark:text-amber-300">Email Not Confirmed</p>
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 leading-snug">
                              This employee cannot log in because their email address has not been verified. Click below to grant access immediately.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCredAction('confirm_email')}
                          disabled={credSaving}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 transition-colors rounded-[12px] text-white text-[13px] font-bold disabled:opacity-50"
                        >
                          {credSaving ? 'Confirming...' : '✓ Confirm Email & Grant Access'}
                        </button>
                      </div>
                    )}

                   {/* Email (non-editable Login ID) */}
                   <div className="flex flex-col gap-2">
                     <label className="text-[13px] font-bold text-gray-900 dark:text-white">Login ID (Email)</label>
                     <input 
                       type="text" 
                       value={emp.email || ""} 
                       disabled 
                       className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#121214] text-gray-400 dark:text-gray-500 border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[14px] text-[13.5px] font-medium cursor-not-allowed outline-none"
                     />
                     <p className="text-[11px] text-[#8E8E93] italic mt-0.5">(not editable - need to change in the edit Profile)</p>
                   </div>

                    {/* Last Password */}
                    {credStatus?.exists && (
                      <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-gray-900 dark:text-white">Last Password</label>
                        <div className="relative flex items-center">
                          <input 
                            type={showLastPass ? "text" : "password"} 
                            value={emp.custom_fields?.lastPassword || "No password recorded"} 
                            disabled 
                            className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#121214] text-gray-700 dark:text-gray-300 border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[14px] text-[13.5px] font-semibold outline-none"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowLastPass(!showLastPass)} 
                            className="absolute right-4 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white"
                          >
                            {showLastPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-[#8E8E93] italic">(stored plain text of assigned password)</p>
                      </div>
                    )}

                    {/* Password field */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-bold text-gray-900 dark:text-white">
                        {credStatus?.exists ? "New Password" : "Assign Password"}
                      </label>
                      <div className="relative flex items-center">
                        <input 
                          type={credShowPass ? "text" : "password"} 
                          placeholder={credStatus?.exists ? "Enter password to update" : "Assign temporary password"}
                          className="w-full px-4 py-3.5 bg-[#F8F9FA] dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-transparent focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none focus:ring-0"
                          value={credPassword}
                          onChange={(e) => setCredPassword(e.target.value)}
                        />
                        <button 
                          onClick={() => setCredShowPass(!credShowPass)} 
                          className="absolute right-4 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white"
                        >
                          {credShowPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-[#8E8E93]">Password must be at least 6 characters long.</p>
                    </div>
                 </div>

                 {/* Footer */}
                 <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
                   {credLoading ? (
                     <div className="py-4 flex flex-col items-center justify-center">
                       <RefreshCw className="h-6 w-6 text-[#007AFF] animate-spin mb-2" />
                       <p className="text-[12px] text-gray-500 font-medium">Updating status...</p>
                     </div>
                   ) : (
                     <>
                       {credStatus?.exists ? (
                         <div className="flex flex-col gap-3">
                           <button
                             onClick={() => handleCredAction('reset_password')}
                             disabled={credSaving}
                             className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] transition-colors rounded-[16px] text-white text-[15px] font-bold disabled:opacity-50"
                           >
                             {credSaving ? "Updating Password..." : "Update Password"}
                           </button>
                           <button
                             onClick={() => handleCredAction('delete')}
                             disabled={credSaving}
                             className="w-full py-3.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 transition-colors rounded-[16px] text-red-600 dark:text-red-400 text-[14px] font-bold"
                           >
                             Revoke Login Access
                           </button>
                         </div>
                       ) : (
                         <button
                           onClick={() => handleCredAction('create')}
                           disabled={credSaving}
                           className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] transition-colors rounded-[16px] text-white text-[15px] font-bold disabled:opacity-50"
                         >
                           {credSaving ? "Enabling Access..." : "Enable Access"}
                         </button>
                       )}
                     </>
                   )}
                 </div>
               </>
             )}

             {/* ── SCREEN 3: Transfer Team Sub-panel ── */}
             {activeSubPanel === 'transfer_team' && (
               <>
                 {/* Header */}
                 <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                   <div className="flex items-center gap-3">
                     <button 
                       onClick={() => setActiveSubPanel(null)}
                       className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-lg text-gray-500 transition-colors"
                     >
                       <ArrowLeft className="h-5 w-5" />
                     </button>
                     <div>
                       <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Transfer Department</h2>
                       <p className="text-[12px] text-[#8E8E93] mt-0.5">Move employee to a different department</p>
                     </div>
                   </div>
                   <button onClick={closeConfigurePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                     <X size={20} />
                   </button>
                 </div>

                 {/* Body */}
                 <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 page-scrollbar">
                   
                   {/* Current Team Department Card with Appointed Date */}
                   <div className="bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-2xl p-5 border border-[#E5E7EB] dark:border-[#2C2C35] flex flex-col gap-2.5">
                     <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Current Department</p>
                     <h4 className="text-[15px] font-bold text-gray-900 dark:text-white">{emp.departments?.name || "Unassigned"}</h4>
                     <div className="flex flex-col text-[12px] border-t border-gray-100 dark:border-[#2C2C35] pt-2.5 mt-1">
                       <span className="text-[#8E8E93]">Appointed Date</span>
                       <span className="font-semibold text-gray-900 dark:text-white mt-0.5">
                         {emp.custom_fields?.departmentAppointedDate ? new Date(emp.custom_fields.departmentAppointedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Not Appointed")}
                       </span>
                     </div>
                   </div>

                   {/* Search Bar */}
                   <div className="flex flex-col gap-2 relative">
                     <label className="text-[13px] font-bold text-gray-900 dark:text-white">Search Department</label>
                     <input
                       type="text"
                       value={searchQuery}
                       onChange={(e) => handleSearchDepartments(e.target.value)}
                       placeholder="Type department name or ID to match..."
                       className="w-full px-4 py-3.5 bg-[#F8F9FA] dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-transparent focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none"
                     />
                     {searchLoading && (
                       <RefreshCw className="absolute right-4 bottom-3.5 h-4.5 w-4.5 text-[#007AFF] animate-spin" />
                     )}
                     
                     {/* Search results dropdown */}
                     {searchResults.length > 0 && (
                       <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-2xl overflow-hidden py-1">
                         {searchResults.map((dept) => (
                           <button
                             key={dept.id}
                             onClick={() => {
                               setSelectedSearchDept(dept);
                               setSearchQuery("");
                               setSearchResults([]);
                               setTempTransferDeptId(dept.id);
                             }}
                             className="w-full px-4 py-3 text-left hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35] border-b border-gray-50 dark:border-gray-800/30 last:border-b-0 transition-colors flex flex-col"
                           >
                             <span className="font-bold text-[13.5px] text-gray-900 dark:text-white">{dept.name}</span>
                             <span className="text-[11px] text-[#8E8E93] mt-0.5">ID: {dept.id}</span>
                           </button>
                         ))}
                       </div>
                     )}
                     
                     {/* Separate Card for Match Results */}
                    {selectedSearchDept && (
                      <div className="bg-[#F9F9FB] dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-2xl p-5 flex flex-col gap-4 relative animate-in fade-in slide-in-from-top-2 duration-200">
                        <button 
                          onClick={() => setSelectedSearchDept(null)}
                          className="absolute top-4 right-4 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white"
                        >
                          <X size={16} />
                        </button>
                        <div>
                          <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Matched Department Info</p>
                          <h4 className="text-[15px] font-bold text-[#007AFF] mt-1">{selectedSearchDept.name}</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[13px] border-t border-gray-100 dark:border-[#2C2C35] pt-3">
                          <div className="flex flex-col">
                            <span className="text-[#8E8E93] text-[11px]">Department ID</span>
                            <span className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedSearchDept.id}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[#8E8E93] text-[11px]">Department Name</span>
                            <span className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedSearchDept.name}</span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => setTempTransferDeptId(selectedSearchDept.id)}
                          className="w-full py-2 bg-[#007AFF]/10 hover:bg-[#007AFF]/15 text-[#007AFF] text-[12px] font-bold rounded-xl transition-all"
                        >
                          Match Department ({selectedSearchDept.name})
                        </button>
                      </div>
                    )}

                    {/* Staged Selection Card */}
                    {tempTransferDeptId && (
                      <div className="bg-[#007AFF]/5 dark:bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex flex-col">
                          <span className="text-[#007AFF] text-[11px] font-bold uppercase tracking-wider">Selected Target Department</span>
                          <span className="font-bold text-gray-900 dark:text-white text-[14px] mt-0.5">{getDepartmentName(tempTransferDeptId)}</span>
                        </div>
                        <button 
                          onClick={() => setTempTransferDeptId("")}
                          className="text-[#8E8E93] hover:text-red-500 transition-colors p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}

                  </div>
                 </div>

                 {/* Footer */}
                 <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
                   <button
                     onClick={() => handleSaveTransfer('team')}
                     disabled={isSavingTransfer}
                     className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] transition-colors rounded-[16px] text-white text-[15px] font-bold disabled:opacity-50"
                   >
                     {isSavingTransfer ? "Saving Transfer..." : "Save Department Transfer"}
                   </button>
                 </div>
               </>
             )}

             {/* ── SCREEN 4: Transfer Project Sub-panel ── */}
             {activeSubPanel === 'transfer_project' && (
               <>
                 {/* Header */}
                 <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                   <div className="flex items-center gap-3">
                     <button 
                       onClick={() => setActiveSubPanel(null)}
                       className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-lg text-gray-500 transition-colors"
                     >
                       <ArrowLeft className="h-5 w-5" />
                     </button>
                     <div>
                       <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Transfer Project</h2>
                       <p className="text-[12px] text-[#8E8E93] mt-0.5">Assign employee to a project</p>
                     </div>
                   </div>
                   <button onClick={closeConfigurePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                     <X size={20} />
                   </button>
                 </div>

                 {/* Body */}
                 <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 page-scrollbar">
                   
                   {/* Search Bar */}
                   <div className="flex flex-col gap-2 relative">
                     <label className="text-[13px] font-bold text-gray-900 dark:text-white">Search People or Projects</label>
                     <input
                       type="text"
                       value={searchQuery}
                       onChange={(e) => handleSearchPeople(e.target.value)}
                       placeholder="Type name or project to match..."
                       className="w-full px-4 py-3.5 bg-[#F8F9FA] dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-transparent focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none"
                     />
                     {searchLoading && (
                       <RefreshCw className="absolute right-4 bottom-3.5 h-4.5 w-4.5 text-[#007AFF] animate-spin" />
                     )}
                     
                     {/* Search results dropdown */}
                     {searchResults.length > 0 && (
                       <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-2xl overflow-hidden py-1">
                         {searchResults.map((item) => (
                           <button
                             key={item.isProject ? `project-${item.id}` : `employee-${item.id}`}
                             onClick={() => {
                               if (item.isProject) {
                                 setTempTransferProject(item.name);
                                 setSelectedSearchPerson(null);
                               } else {
                                 setSelectedSearchPerson(item);
                                 const pName = item.current_project || item.custom_fields?.project_name;
                                 if (pName) {
                                   setTempTransferProject(pName);
                                 }
                               }
                               setSearchQuery("");
                               setSearchResults([]);
                             }}
                             className="w-full px-4 py-3 text-left hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35] border-b border-gray-50 dark:border-gray-800/30 last:border-b-0 transition-colors flex flex-col"
                           >
                             {item.isProject ? (
                               <>
                                 <span className="font-bold text-[13.5px] text-[#007AFF] flex items-center gap-1.5">
                                   📁 Project: {item.name}
                                 </span>
                                 <span className="text-[11px] text-[#8E8E93] mt-0.5">Owner: {item.owner}</span>
                               </>
                             ) : (
                               <>
                                 <span className="font-bold text-[13.5px] text-gray-900 dark:text-white">{item.name}</span>
                                 <span className="text-[11px] text-[#8E8E93] mt-0.5">{item.departments?.name || "General"} • Project: {item.current_project || item.custom_fields?.project_name || "—"}</span>
                               </>
                             )}
                           </button>
                         ))}
                       </div>
                     )}
                   </div>

                   {/* Separate Card for Match Results */}
                   {selectedSearchPerson && (
                     <div className="bg-[#F9F9FB] dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-2xl p-5 flex flex-col gap-4 relative animate-in fade-in slide-in-from-top-2 duration-200">
                       <button 
                         onClick={() => setSelectedSearchPerson(null)}
                         className="absolute top-4 right-4 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white"
                       >
                         <X size={16} />
                       </button>
                       <div>
                         <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Matched Employee Info</p>
                         <h4 className="text-[15px] font-bold text-[#007AFF] mt-1">{selectedSearchPerson.name}</h4>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[13px] border-t border-gray-100 dark:border-[#2C2C35] pt-3">
                         <div className="flex flex-col">
                           <span className="text-[#8E8E93] text-[11px]">Current Team</span>
                           <span className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedSearchPerson.departments?.name || "General"}</span>
                         </div>
                         <div className="flex flex-col">
                           <span className="text-[#8E8E93] text-[11px]">Project</span>
                           <span className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedSearchPerson.current_project || selectedSearchPerson.custom_fields?.project_name || "—"}</span>
                         </div>
                         <div className="flex flex-col col-span-2">
                           <span className="text-[#8E8E93] text-[11px]">Reporting Staff</span>
                           <span className="font-semibold text-gray-900 dark:text-white mt-0.5">{getManagerName(selectedSearchPerson.manager_id)}</span>
                         </div>
                       </div>
                       
                       {(selectedSearchPerson.current_project || selectedSearchPerson.custom_fields?.project_name) && (
                         <button
                           onClick={() => setTempTransferProject(selectedSearchPerson.current_project || selectedSearchPerson.custom_fields?.project_name || "")}
                           className="w-full py-2 bg-[#007AFF]/10 hover:bg-[#007AFF]/15 text-[#007AFF] text-[12px] font-bold rounded-xl transition-all"
                         >
                           Match Project ({selectedSearchPerson.current_project || selectedSearchPerson.custom_fields?.project_name})
                         </button>
                       )}
                     </div>
                   )}

                   {/* Staged Selection Card */}
                   {tempTransferProject && (
                     <div className="bg-[#007AFF]/5 dark:bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
                       <div className="flex flex-col">
                         <span className="text-[#007AFF] text-[11px] font-bold uppercase tracking-wider">Selected Target Project</span>
                         <span className="font-bold text-gray-900 dark:text-white text-[14px] mt-0.5">{tempTransferProject}</span>
                       </div>
                       <button 
                         onClick={() => setTempTransferProject("")}
                         className="text-[#8E8E93] hover:text-red-500 transition-colors p-1"
                       >
                         <X size={16} />
                       </button>
                     </div>
                   )}

                 </div>

                 {/* Footer */}
                 <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
                   <button
                     onClick={() => handleSaveTransfer('project')}
                     disabled={isSavingTransfer}
                     className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] transition-colors rounded-[16px] text-white text-[15px] font-bold disabled:opacity-50"
                   >
                     {isSavingTransfer ? "Saving Transfer..." : "Save Project Transfer"}
                   </button>
                 </div>
               </>
             )}

             {/* ── SCREEN 5: Transfer Manager Sub-panel ── */}
             {activeSubPanel === 'transfer_manager' && (
               <>
                 {/* Header */}
                 <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                   <div className="flex items-center gap-3">
                     <button 
                       onClick={() => setActiveSubPanel(null)}
                       className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-lg text-gray-500 transition-colors"
                     >
                       <ArrowLeft className="h-5 w-5" />
                     </button>
                     <div>
                       <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Reporting Staff</h2>
                       <p className="text-[12px] text-[#8E8E93] mt-0.5">Change employee's reporting staff</p>
                     </div>
                   </div>
                   <button onClick={closeConfigurePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                     <X size={20} />
                   </button>
                 </div>

                 {/* Body */}
                 <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 page-scrollbar">
                   
                   {/* Search Bar */}
                   <div className="flex flex-col gap-2 relative">
                     <label className="text-[13px] font-bold text-gray-900 dark:text-white">Search People</label>
                     <input
                       type="text"
                       value={searchQuery}
                       onChange={(e) => handleSearchPeople(e.target.value)}
                       placeholder="Type reporting staff's name to match..."
                       className="w-full px-4 py-3.5 bg-[#F8F9FA] dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-transparent focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none"
                     />
                     {searchLoading && (
                       <RefreshCw className="absolute right-4 bottom-3.5 h-4.5 w-4.5 text-[#007AFF] animate-spin" />
                     )}
                     
                     {/* Search results dropdown */}
                     {searchResults.length > 0 && (
                       <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-2xl overflow-hidden py-1">
                         {searchResults.map((person) => (
                           <button
                             key={person.id}
                             onClick={() => {
                               setSelectedSearchPerson(person);
                               setSearchQuery("");
                               setSearchResults([]);
                               setTempTransferManagerId(person.id);
                             }}
                             className="w-full px-4 py-3 text-left hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35] border-b border-gray-50 dark:border-gray-800/30 last:border-b-0 transition-colors flex flex-col"
                           >
                             <span className="font-bold text-[13.5px] text-gray-900 dark:text-white">{person.name}</span>
                             <span className="text-[11px] text-[#8E8E93] mt-0.5">{person.departments?.name || "General"} • {person.role || "Employee"}</span>
                           </button>
                         ))}
                       </div>
                     )}
                   </div>

                   {/* Separate Card for Match Results */}
                   {selectedSearchPerson && (
                     <div className="bg-[#F9F9FB] dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-2xl p-5 flex flex-col gap-4 relative animate-in fade-in slide-in-from-top-2 duration-200">
                       <button 
                         onClick={() => setSelectedSearchPerson(null)}
                         className="absolute top-4 right-4 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white"
                       >
                         <X size={16} />
                       </button>
                       <div>
                         <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Matched Employee Info</p>
                         <h4 className="text-[15px] font-bold text-[#007AFF] mt-1">{selectedSearchPerson.name}</h4>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[13px] border-t border-gray-100 dark:border-[#2C2C35] pt-3">
                         <div className="flex flex-col">
                           <span className="text-[#8E8E93] text-[11px]">Current Team</span>
                           <span className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedSearchPerson.departments?.name || "General"}</span>
                         </div>
                         <div className="flex flex-col">
                           <span className="text-[#8E8E93] text-[11px]">Project</span>
                           <span className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedSearchPerson.current_project || selectedSearchPerson.custom_fields?.project_name || "—"}</span>
                         </div>
                         <div className="flex flex-col col-span-2">
                           <span className="text-[#8E8E93] text-[11px]">Reporting Staff</span>
                           <span className="font-semibold text-gray-900 dark:text-white mt-0.5">{getManagerName(selectedSearchPerson.manager_id)}</span>
                         </div>
                       </div>
                       
                       <button
                         onClick={() => setTempTransferManagerId(selectedSearchPerson.id)}
                         className="w-full py-2 bg-[#007AFF]/10 hover:bg-[#007AFF]/15 text-[#007AFF] text-[12px] font-bold rounded-xl transition-all"
                       >
                         Assign as Reporting Staff ({selectedSearchPerson.name})
                       </button>
                     </div>
                   )}

                   {/* Staged Selection Card */}
                   {tempTransferManagerId && (
                     <div className="bg-[#007AFF]/5 dark:bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
                       <div className="flex flex-col">
                         <span className="text-[#007AFF] text-[11px] font-bold uppercase tracking-wider">Selected Target Reporting Staff</span>
                         <span className="font-bold text-gray-900 dark:text-white text-[14px] mt-0.5">{getManagerName(tempTransferManagerId)}</span>
                       </div>
                       <button 
                         onClick={() => setTempTransferManagerId("")}
                         className="text-[#8E8E93] hover:text-red-500 transition-colors p-1"
                       >
                         <X size={16} />
                       </button>
                     </div>
                   )}

                 </div>

                 {/* Footer */}
                 <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
                   <button
                     onClick={() => handleSaveTransfer('manager')}
                     disabled={isSavingTransfer}
                     className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] transition-colors rounded-[16px] text-white text-[15px] font-bold disabled:opacity-50"
                   >
                     {isSavingTransfer ? "Saving Transfer..." : "Save Reporting Staff Assignment"}
                   </button>
                 </div>
               </>
             )}
          </div>
        </>
      )}

      {/* Document Upload Side Panel */}
      {isUploadPanelOpen && (
        <>
          {/* Backdrop */}
          <div 
            className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isUploadClosing ? 'opacity-0' : 'opacity-100'} bg-black/10 dark:bg-black/30`}
            onClick={closeUploadPanel}
          />
          <div className={`fixed inset-y-0 right-0 z-[100] w-full max-w-[440px] bg-white dark:bg-[#121217] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out ${isUploadClosing ? 'translate-x-full' : 'translate-x-0'}`}>
             {/* Header */}
             <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
               <div>
                 <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
                   Upload Document
                 </h2>
                 <p className="text-[12px] text-[#8E8E93] mt-0.5">Add credentials, certificates, or agreements</p>
               </div>
               <button onClick={closeUploadPanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                 <X size={20} />
               </button>
             </div>

             {/* Scrollable Body */}
             <form onSubmit={handleDocUpload} className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 page-scrollbar">
                   {uploadError && (
                     <div className="p-3.5 bg-red-50 border border-red-100 text-red-600 text-[12.5px] font-bold rounded-xl dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 animate-in fade-in duration-200">
                       {uploadError}
                     </div>
                   )}

                   {/* Document Type Dropdown */}
                   <div className="flex flex-col gap-2">
                     <label className="text-[13px] font-bold text-gray-900 dark:text-white">Document Type</label>
                     <div className="relative">
                       <select 
                         required
                         className="w-full appearance-none bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[14px] px-4 py-3.5 text-[13.5px] font-medium text-gray-900 dark:text-white focus:outline-none"
                         value={uploadDocType}
                         onChange={(e) => {
                           setUploadDocType(e.target.value);
                           setUploadError("");
                         }}
                       >
                          <option value="work_pass_copy_url">Work Pass Copy</option>
                          <option value="passport_copy_url">Passport Copy</option>
                          <option value="higherEduCertUrl">Higher Education Degree</option>
                          <option value="schoolingCertUrl">Schooling Certificate</option>
                          <option value="courseCertUrl">Course Certification</option>
                          <option value="customDocument">Other</option>
                       </select>
                       <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93] pointer-events-none h-4.5 w-4.5" />
                     </div>
                   </div>

                   {/* Conditionally Render Warn Alert if Non-updatable has an existing doc */}
                   {["higherEduCertUrl", "schoolingCertUrl"].includes(uploadDocType) && emp.custom_fields?.[uploadDocType] && (
                     <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex gap-3 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400 text-[12.5px] font-medium leading-relaxed">
                       <Info size={18} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                       <div>
                         <span className="font-bold block mb-0.5">Overwriting Warning</span>
                         Uploading a new schooling or higher education certificate will permanently replace and delete the existing file from the server.
                       </div>
                     </div>
                   )}

                   {/* Course Certification Form Block */}
                   {uploadDocType === "courseCertUrl" && (
                     <div className="flex flex-col gap-5 p-4 border border-gray-100 dark:border-[#2C2C35] rounded-2xl bg-gray-50/50 dark:bg-black/10 animate-in fade-in duration-200">
                        <div className="flex flex-col gap-2">
                          <label className="text-[12.5px] font-bold text-gray-900 dark:text-white">Course Name</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Certified Scrum Master"
                            className="w-full px-4 py-3 bg-white dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[12px] text-[13.5px] font-medium outline-none text-gray-900 dark:text-white"
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[12.5px] font-bold text-gray-900 dark:text-white">Issuing Organization</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Scrum Alliance"
                            className="w-full px-4 py-3 bg-white dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[12px] text-[13.5px] font-medium outline-none text-gray-900 dark:text-white"
                            value={courseIssuingOrg}
                            onChange={(e) => setCourseIssuingOrg(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-bold text-gray-500">Issue Date</label>
                            <input 
                              type="date"
                              required
                              className="w-full px-4 py-2.5 bg-white dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[12px] text-[13px] font-medium outline-none text-gray-900 dark:text-white"
                              value={courseIssueDate}
                              onChange={(e) => setCourseIssueDate(e.target.value)}
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-bold text-gray-500">Expiry Date</label>
                            <input 
                              type="date"
                              className="w-full px-4 py-2.5 bg-white dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[12px] text-[13px] font-medium outline-none text-gray-900 dark:text-white"
                              value={courseExpiryDate}
                              onChange={(e) => setCourseExpiryDate(e.target.value)}
                            />
                          </div>
                        </div>
                     </div>
                   )}

                   {/* Other / Custom Document Form Block */}
                   {uploadDocType === "customDocument" && (
                     <div className="flex flex-col gap-5 p-4 border border-gray-100 dark:border-[#2C2C35] rounded-2xl bg-gray-50/50 dark:bg-black/10 animate-in fade-in duration-200">
                        <div className="flex flex-col gap-2">
                          <label className="text-[12.5px] font-bold text-gray-900 dark:text-white">Document Name</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Non-Disclosure Agreement"
                            className="w-full px-4 py-3 bg-white dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[12px] text-[13.5px] font-medium outline-none text-gray-900 dark:text-white"
                            value={customDocName}
                            onChange={(e) => setCustomDocName(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[12.5px] font-bold text-gray-900 dark:text-white">Document Category</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Employment Contract, Tax Form"
                            className="w-full px-4 py-3 bg-white dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[12px] text-[13.5px] font-medium outline-none text-gray-900 dark:text-white"
                            value={customDocCategory}
                            onChange={(e) => setCustomDocCategory(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-3 pt-2">
                          <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              className="h-4.5 w-4.5 rounded-md border-gray-300 text-[#007AFF] focus:ring-0 cursor-pointer"
                              checked={hasExpiry}
                              onChange={(e) => setHasExpiry(e.target.checked)}
                            />
                            <span className="text-[13px] font-bold text-gray-900 dark:text-white">Does the document have an expiry date?</span>
                          </label>
                          
                          {hasExpiry && (
                            <div className="flex flex-col gap-2 pl-7 animate-in slide-in-from-top-2 duration-200">
                              <label className="text-[12px] font-bold text-gray-500">Expiry Date</label>
                              <input 
                                type="date"
                                required
                                className="px-4 py-2.5 bg-white dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[12px] text-[13px] font-medium outline-none text-gray-900 dark:text-white"
                                value={expiryDateVal}
                                onChange={(e) => setExpiryDateVal(e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                     </div>
                   )}

                   {/* File Attachment Uploader Component */}
                   <div className="flex flex-col gap-2">
                     <label className="text-[13px] font-bold text-gray-900 dark:text-white">File Attachment</label>
                     {uploadFileObj ? (
                       <div className="flex items-center justify-between p-3.5 border border-gray-200 dark:border-[#2C2C35] rounded-2xl bg-[#F8F9FA] dark:bg-[#1C1C1E] animate-in fade-in duration-200">
                         <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-[#007AFF] rounded-lg">
                              <FileText className="h-5 w-5 shrink-0" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[13px] font-bold text-gray-900 dark:text-white block truncate">{uploadFileObj.name}</span>
                              <span className="text-[10px] text-gray-400 font-semibold">{(uploadFileObj.size / (1024 * 1024)).toFixed(2)} MB</span>
                            </div>
                         </div>
                         <button 
                           type="button" 
                           onClick={() => setUploadFileObj(null)}
                           className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all shrink-0"
                         >
                           <X className="h-4.5 w-4.5" />
                         </button>
                       </div>
                     ) : (
                       <div className="relative group">
                         <input 
                           type="file"
                           required
                           className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                           onChange={(e) => {
                             if (e.target.files && e.target.files[0]) {
                               setUploadFileObj(e.target.files[0]);
                             }
                           }}
                         />
                        <div className="h-36 w-full border-2 border-dashed border-gray-200 dark:border-[#2C2C35] rounded-[16px] bg-[#F9F9FB] dark:bg-[#1C1C1E]/50 flex flex-col items-center justify-center gap-2 group-hover:bg-[#EEF4FF] dark:group-hover:bg-blue-950/10 group-hover:border-[#007AFF] transition-all">
                           <Upload className="h-8 w-8 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
                           <span className="text-[13px] font-bold text-gray-700 dark:text-gray-400 group-hover:text-[#007AFF] transition-colors">Click or drag file to upload</span>
                         </div>
                       </div>
                     )}
                   </div>
                </div>

                {/* Footer buttons block inside panel */}
                <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
                  <button 
                    type="submit" 
                    disabled={uploadingDoc || !uploadFileObj}
                    className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] text-white font-bold text-[15px] rounded-[16px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {uploadingDoc ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : <Upload className="h-4.5 w-4.5" />}
                    {uploadingDoc ? "Uploading..." : "Upload Document"}
                  </button>
                </div>
             </form>
          </div>

          {/* Delete overwrite warning popup overlay dialog */}
          {showDeleteWarning && pendingUploadPayload && (
            <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[24px] w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-4">
                <div className="flex items-center gap-3 text-red-500">
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/20 rounded-xl">
                    <ShieldAlert size={22} />
                  </div>
                  <h4 className="text-[16px] font-bold text-gray-900 dark:text-white">Delete Older Document?</h4>
                </div>
                
                <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  An education certificate of this type is already uploaded. Saving this will **permanently delete** the older file from the server backend.
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowDeleteWarning(false);
                      setPendingUploadPayload(null);
                    }}
                    className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-[#2C2C35] dark:hover:bg-[#3C3C45] text-gray-700 dark:text-white text-[13px] font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={async () => {
                      const payload = pendingUploadPayload;
                      setShowDeleteWarning(false);
                      setPendingUploadPayload(null);
                      await executeDocUpload(payload.type, payload.file, payload.oldUrl);
                    }}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white text-[13px] font-bold rounded-xl transition-all shadow-sm"
                  >
                    Yes, Replace
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Share Profile Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[24px] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="px-6 py-5 border-b border-[#E5E7EB] dark:border-[#2C2C35] flex items-center justify-between">
                <h3 className="text-[17px] font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-[#007AFF]" /> Share Profile
                </h3>
                <button onClick={() => setIsShareModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="h-5 w-5" />
                </button>
             </div>
             
             <div className="p-6 flex flex-col items-center gap-6">
                {/* QR Code Container */}
                <div className="bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center">
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100/50">
                    <QRCode
                       value={`BEGIN:VCARD\nVERSION:3.0\nFN:${emp.name || ""}\nTITLE:${emp.job_role || emp.role || ""}\nTEL;TYPE=WORK,VOICE:${emp.mobile || ""}\nEMAIL;TYPE=PREF,INTERNET:${emp.email || ""}\nEND:VCARD`}
                       size={140}
                       style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-gray-400 mt-3 text-center uppercase tracking-wider">Scan to Save Contact</span>
                </div>

                <div className="w-full flex flex-col gap-2">
                   <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Profile Link</label>
                   <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly
                        className="flex-1 px-3 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#2C2C35] bg-gray-50 dark:bg-[#121214] text-gray-500 text-[12px] font-medium focus:outline-none truncate"
                        value={typeof window !== 'undefined' ? window.location.href : ""}
                      />
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            navigator.clipboard.writeText(window.location.href);
                            alert("Copied profile URL to clipboard!");
                          }
                        }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-[#2C2C35] dark:hover:bg-[#3C3C45] text-gray-900 dark:text-white text-[12px] font-bold rounded-xl transition-colors whitespace-nowrap"
                      >
                        Copy
                      </button>
                   </div>
                </div>

                <button
                  onClick={() => {
                    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${emp.name || ""}\nTITLE:${emp.job_role || emp.role || ""}\nTEL;TYPE=WORK,VOICE:${emp.mobile || ""}\nEMAIL;TYPE=PREF,INTERNET:${emp.email || ""}\nEND:VCARD`;
                    const blob = new Blob([vcard], { type: 'text/vcard' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${emp.name?.replace(/\s+/g, '_') || 'contact'}.vcf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    setIsShareModalOpen(false);
                  }}
                  className="w-full py-3 bg-[#007AFF] hover:bg-[#0062CC] text-white text-[13px] font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
                >
                  <Download className="h-4 w-4" /> Export Contact Card (vCard)
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Caution Delete Employee Verification Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C1E] border border-red-100 dark:border-red-900/30 rounded-[24px] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-red-50 dark:border-red-900/10 flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-red-600 dark:text-red-400">
                {emp?.is_head ? "You cannot Delete this employee" : "Caution: Delete Employee"}
              </h3>
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {emp?.is_head ? (
              <div className="p-6 flex flex-col gap-4">
                <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                  <strong className="text-gray-900 dark:text-white font-bold">{emp?.name}</strong> is currently assigned as a Department Head.
                </p>
                <div className="p-4 bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-xl">
                  <p className="text-[13px] text-[#007AFF] dark:text-[#30B0C7] font-bold">
                    How to delete this employee:
                  </p>
                  <ol className="list-decimal list-inside text-[13px] text-gray-600 dark:text-gray-400 mt-2 space-y-1.5 font-medium">
                    <li>Go to the department detail page.</li>
                    <li>Open <strong>Department Settings</strong>.</li>
                    <li>Reassign the Department Head role to another employee.</li>
                    <li>Once reassigned, you can return here to delete the employee record.</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="p-6 flex flex-col gap-4">
                <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                  Are you absolutely sure you want to permanently delete <strong className="text-gray-900 dark:text-white font-bold">{emp?.name}</strong>? 
                  This action is irreversible and will delete all login credentials, timesheets, medical, and banking records.
                </p>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-gray-500">
                    Please type the employee name <strong className="text-red-500 dark:text-red-400 select-all font-mono font-bold">{emp?.name}</strong> to confirm:
                  </label>
                  <input 
                    type="text"
                    placeholder={`Enter ${emp?.name}`}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2C2C35] bg-gray-50 dark:bg-[#121214] text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 text-[13.5px] font-medium"
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  />
                </div>

                {deleteError && (
                  <p className="text-[12px] text-red-600 dark:text-red-400 font-semibold">{deleteError}</p>
                )}
              </div>
            )}

            <div className="px-6 pb-6 pt-3 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-white/5 mt-2">
              {emp?.is_head ? (
                <button 
                  type="button" 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-5 py-2.5 bg-[#007AFF] hover:bg-[#0062CC] text-white font-bold text-[13px] rounded-xl transition-all"
                >
                  Close
                </button>
              ) : (
                <>
                  <button 
                    type="button" 
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-[#2C2C35] dark:hover:bg-[#3C3C45] text-gray-700 dark:text-white font-bold text-[13px] rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    disabled={deleteConfirmInput !== emp?.name}
                    onClick={handleConfirmDelete}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-200 dark:disabled:bg-red-950/20 disabled:text-red-400 dark:disabled:text-red-600/50 text-white font-bold text-[13px] rounded-xl transition-all flex items-center gap-1.5"
                  >
                    Permanently Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Missing Department Assignment Popup */}
      {showMissingDeptPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-[24px] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-50 dark:border-[#2C2C35] flex items-center justify-between bg-red-50/50 dark:bg-red-900/10">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                  <AlertCircle size={16} strokeWidth={3} />
                </div>
                <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">
                  Missing Department Assignment
                </h3>
              </div>
            </div>
            
            <div className="p-6 flex flex-col gap-5">
              <p className="text-[13px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                The department previously assigned to <strong className="text-gray-900 dark:text-white font-bold">{emp?.name}</strong> has been deleted or blocked. Please assign a new department and designation to continue viewing this profile.
              </p>
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gray-500">Select Department <span className="text-red-500">*</span></label>
                  <div className="relative" ref={deptDropdownRef}>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Select a department"
                        value={deptSearchText}
                        onChange={(e) => {
                          setDeptSearchText(e.target.value);
                          setIsDeptDropdownOpen(true);
                          const exactMatch = dbDepartments.find(d => d.name.toLowerCase() === e.target.value.toLowerCase());
                          if (exactMatch) {
                            setPopupDeptId(exactMatch.id);
                          } else {
                            setPopupDeptId("");
                          }
                        }}
                        onFocus={() => setIsDeptDropdownOpen(true)}
                        className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 dark:border-[#2C2C35] bg-gray-50 dark:bg-[#121214] text-[13.5px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 cursor-pointer"
                      />
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {isDeptDropdownOpen && (
                      <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-xl shadow-lg max-h-60 overflow-y-auto py-1">
                        {dbDepartments.filter(d => d.name.toLowerCase().includes(deptSearchText.toLowerCase())).length > 0 ? (
                          dbDepartments
                            .filter(d => d.name.toLowerCase().includes(deptSearchText.toLowerCase()))
                            .map((d: any) => (
                              <button
                                type="button"
                                key={d.id}
                                onClick={() => {
                                  setPopupDeptId(d.id);
                                  setPopupDesignation("");
                                  setDeptSearchText(d.name);
                                  setIsDeptDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left text-[13px] font-semibold transition-colors flex items-center justify-between ${
                                  popupDeptId === d.id
                                    ? "bg-[#007AFF]/10 text-[#007AFF]"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2C2C35]"
                                }`}
                              >
                                <span>{d.name}</span>
                                {popupDeptId === d.id && <Check size={14} />}
                              </button>
                            ))
                        ) : (
                          <div className="px-4 py-3 text-[12.5px] text-gray-500 text-center font-medium">
                            No departments found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gray-500">Designation <span className="text-red-500">*</span></label>
                  <DesignationSelect
                    value={popupDesignation}
                    onChange={(val: string) => setPopupDesignation(val)}
                    departmentId={popupDeptId}
                    departments={dbDepartments}
                    onAddCustomDesignation={async (deptId: string, newDesig: string) => {
                      const targetDept = dbDepartments.find((d: any) => d.id === deptId);
                      if (targetDept) {
                        const existing = Array.isArray(targetDept.designations) ? targetDept.designations : [];
                        if (!existing.includes(newDesig)) {
                          const updated = [...existing, newDesig];
                          await supabase.from("departments").update({ designations: updated }).eq("id", deptId);
                          setDbDepartments(dbDepartments.map((d: any) => d.id === deptId ? { ...d, designations: updated } : d));
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 pt-2 flex items-center justify-end border-t border-gray-100 dark:border-white/5 mt-2">
              <button 
                type="button" 
                disabled={!popupDeptId || !popupDesignation || isSubmittingPopup}
                onClick={async () => {
                  setIsSubmittingPopup(true);
                  const { error } = await supabase
                    .from("employees")
                    .update({ department_id: popupDeptId, job_role: popupDesignation })
                    .eq("id", emp.id);
                  setIsSubmittingPopup(false);
                  if (!error) {
                    window.location.reload();
                  } else {
                    alert("Error updating employee.");
                  }
                }}
                className="w-full py-3 bg-[#007AFF] hover:bg-[#0062CC] disabled:bg-[#007AFF]/50 text-white font-bold text-[13px] rounded-xl transition-all shadow-md shadow-[#007AFF]/10 flex items-center justify-center gap-2"
              >
                {isSubmittingPopup ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

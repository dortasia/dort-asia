"use client";

import React, { useEffect, useState } from "react";
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
import { getAvatarColor, getInitials, getUserAvatarUrl } from "@/utils/avatarColor";
import { uploadToCompanyStorage, toCompanySlug as storageSlug } from "@/utils/storageHelper";


const DetailField = ({ icon: Icon, label, value, className = "", hideBorder = false }: any) => (
 <div className={`flex items-start gap-3 py-3 ${!hideBorder ? 'border-b border-gray-100 ' : ''} ${className}`}>
 <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-50 text-gray-500 shrink-0">
 <Icon size={16} strokeWidth={2} />
 </div>
 <div className="flex flex-col gap-0.5">
 <span className="text-[12px] font-medium text-gray-500">{label}</span>
 <span className="text-[14px] font-bold text-gray-900 break-words">{value || "-"}</span>
 </div>
 </div>
);

const DetailCard = ({ title, icon: Icon, children, className = "" }: any) => (
 <div className={`bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm mb-6 ${className}`}>
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-50 text-gray-500 border border-gray-200 ">
 <Icon size={16} strokeWidth={2} />
 </div>
 <h3 className="text-[15px] font-bold text-gray-900 ">{title}</h3>
 </div>
 <button className="text-gray-400 hover:text-gray-600 ">
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
 Marine: { bg: "#EFF6FF", text: "#1D4ED8", icon: "⚓" },
 Tech: { bg: "#FEF9C3", text: "#A16207", icon: "⚙️" },
 Finance: { bg: "#DCFCE7", text: "#15803D", icon: "📊" },
 Design: { bg: "#FCE7F3", text: "#BE185D", icon: "🎨" },
};

const statusStyle: Record<ProjectStatus, { dot: string; text: string }> = {
 Active: { dot: "#22C55E", text: "#166534" },
 Closed: { dot: "#9CA3AF", text: "#6B7280" },
 "On Hold": { dot: "#F59E0B", text: "#92400E" },
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
 const [activeTab, setActiveTab] = useState("Documents");
  const [documents, setDocuments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [histories, setHistories] = useState<any[]>([]);

 // Pagination states
 const [docPage, setDocPage] = useState(1);
 const [projPage, setProjPage] = useState(1);
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
 const exp = today.getFullYear() - joinDate.getFullYear();
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

 const handleCredAction = async (action: 'create' | 'reset_password' | 'delete') => {
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
 setCredMsg({ type: 'success', text: action === 'delete' ? 'Auth account removed.' : action === 'create' ? 'Account created! Employee can now log in.' : 'Password updated successfully.' });
 
 const updatedCF = { ...(emp.custom_fields || {}) };
 if (action === 'delete') {
 delete updatedCF.lastPassword;
 } else {
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
 .select("id, department_name")
 .eq("company_id", emp.company_id);
 if (deptData) {
 setDbDepartments(deptData.map((d: any) => ({ id: d.id, name: d.department_name })));
 }
 
 const { data: empData } = await supabase
 .from("employees")
 .select("id, name, role, department_id, departments!fk_employees_department(department_name), manager_id, custom_fields")
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
 if (deleteConfirmInput !== emp.emp_id) {
 setDeleteError("Employee ID does not match.");
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
 const updateData: any = {};
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
 .select("*, departments!fk_employees_department(department_name)")
 .eq("id", emp.id)
 .maybeSingle();

 if (!fetchErr && updatedEmp) {
 setEmp(updatedEmp);
 let foundManager = null;
 let isCurrentEmpHead = updatedEmp.is_head === true;

 // Step 1: Use directly assigned manager_id
 if (updatedEmp.manager_id) {
 const { data: directManager } = await supabase
 .from("employees")
 .select("id, name, role, designation, avatar_url")
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
 .select("id, name, role, designation, avatar_url")
 .eq("id", deptData.head_id)
 .maybeSingle();
 if (deptHead) foundManager = deptHead;
 }
 }
 }

 // Step 4: Last resort — look for Super Admin employee or company_settings
 if (!foundManager && updatedEmp.company_id) {
 const { data: ownerEmp } = await supabase
 .from("employees")
 .select("id, name, role, designation, avatar_url")
 .eq("company_id", updatedEmp.company_id)
 .eq("user_id", updatedEmp.company_id)
 .neq("id", updatedEmp.id)
 .limit(1)
 .maybeSingle();

 let superAdminEmp = ownerEmp;

 if (!superAdminEmp) {
 const { data: saEmp } = await supabase
 .from("employees")
 .select("id, name, role, designation, avatar_url")
 .eq("company_id", updatedEmp.company_id)
 .eq("role", "Super Admin")
 .neq("id", updatedEmp.id)
 .limit(1)
 .maybeSingle();
 superAdminEmp = saEmp;
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
 name: "Super Admin",
 role: "Super Admin",
 designation: "Super Admin",
 avatar_url: compSettings.super_admin_avatar_url || null
 };
 }
 }
 }
 
 setManager(foundManager);
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
 (e.departments?.department_name && e.departments.department_name.toLowerCase().includes(query.toLowerCase())) ||
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
 (e.departments?.department_name && e.departments.department_name.toLowerCase().includes(query.toLowerCase()))
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
 .select("*, departments!fk_employees_department(department_name)")
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
 .select("*, departments!fk_employees_department(department_name)")
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
 .select("*, departments!fk_employees_department(department_name)")
 .eq("id", params.id)
 .maybeSingle();
 
 if (data) {
 setEmp(data);
 setActiveStatus(data.is_active !== false);
 setAttendanceEnabled(data.custom_fields?.module_attendance ?? true);
 setLeaveEnabled(data.custom_fields?.module_leave ?? true);
 setClaimEnabled(data.custom_fields?.module_claim ?? true);
 setEventEnabled(data.custom_fields?.module_event ?? true);
 
 let foundManager = null;
 let isCurrentEmpHead = data.is_head === true;

 if (data.manager_id) {
 const { data: directManager } = await supabase
 .from("employees")
 .select("id, name, role, designation, avatar_url")
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
 .select("id, name, role, designation, avatar_url")
 .eq("id", deptData.head_id)
 .maybeSingle();
 if (deptHead) foundManager = deptHead;
 }
 }
 }

 // Step 4: Last resort — look for Super Admin employee or company_settings
 if (!foundManager && data.company_id) {
 const { data: ownerEmp } = await supabase
 .from("employees")
 .select("id, name, role, designation, avatar_url")
 .eq("company_id", data.company_id)
 .eq("user_id", data.company_id)
 .neq("id", data.id)
 .limit(1)
 .maybeSingle();

 let superAdminEmp = ownerEmp;

 if (!superAdminEmp) {
 const { data: saEmp } = await supabase
 .from("employees")
 .select("id, name, role, designation, avatar_url")
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
 .select("id, name, role, designation, avatar_url")
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
 designation: "Super Admin",
 avatar_url: compSettings.super_admin_avatar_url || null
 };
 }
 }
 }
 
 setManager(foundManager);

 if (data.department_id) {
 let query = supabase
 .from("employees")
 .select("id, name, designation, avatar_url", { count: 'exact' })
 .eq("department_id", data.department_id)
 .neq("id", data.id);
 
 if (foundManager?.id) {
 query = query.neq("id", foundManager.id);
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
 }
 setLoading(false);
 }
 fetchEmp();
 }, [params.id, supabase]);

 if (loading) {
 return (
 <div className="flex-1 flex items-center justify-center bg-white ">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
 </div>
 );
 }

 if (!emp) {
 return (
 <div className="flex-1 flex items-center justify-center bg-white ">
 <p className="text-gray-500 font-medium">Employee not found.</p>
 </div>
 );
 }

 const { bg: color } = getAvatarColor(emp.name || "User");
 const initials = getInitials(emp.name || "US");

 const TABS = ["Documents", "Histories", "Attendance Log"];

 return (
 <div className="flex-1 flex flex-col bg-white overflow-y-auto page-scrollbar lg:h-screen">
 
 {/* Top Header & Navigation Banner */}
 <header className="px-4 py-4 lg:py-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-50 border-b border-transparent">
 <div className="flex items-center gap-4">
 <button 
 onClick={() => router.push('/employees')}
 className="p-1.5 hover:bg-gray-100 rounded-full transition-colors group"
 >
 <ArrowLeft className="h-4 w-4 text-gray-500 group-hover:text-[#007AFF] " strokeWidth={3} />
 </button>
 <h1 className="text-[18px] lg:text-[20px] font-bold text-gray-900 tracking-tight">Employee Profile</h1>
 </div>
 
 {/* Top Right Actions Layout Removed */}
      </header>

 <main className="flex-1 px-4 pb-12">
 <div className="flex flex-col xl:flex-row gap-6">
 
 {/* Main Area */}
 <div className="flex-1 flex flex-col w-full">
 
 {/* Banner Card */}
 <div className="bg-[#F4F4F5] rounded-[24px] overflow-hidden relative mb-6 p-6 lg:p-8 flex flex-col md:flex-row items-center md:items-start justify-between">
 <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
 {/* Avatar */}
 <div
 className="h-[120px] w-[120px] rounded-[16px] shrink-0 overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800"
 >
 <img src={getUserAvatarUrl(emp.avatar_url)} alt="Profile" className="h-full w-full object-cover" />
 </div>

 <div className="flex flex-col w-full pt-1">
 {/* Header Name & Role */}
 <div className="mb-6 text-center md:text-left flex flex-col gap-0.5">
 <h2 className="text-[22px] font-bold text-gray-900 leading-none">
 {emp.name}
 </h2>
 <p className="text-[14px] font-medium text-gray-500 leading-tight">
 {emp.designation || emp.role || "Employee"}
 </p>
 </div>

 {/* Meta Values Row */}
 <div className="w-full flex items-center justify-center md:justify-start gap-8 lg:gap-16 flex-wrap">
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-bold text-gray-400">Employee ID</span>
 <span className="text-[13px] font-bold text-gray-900 ">{emp.emp_id || "Unassigned"}</span>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-bold text-gray-400">Department</span>
 <span className="text-[13px] font-bold text-gray-900 ">{emp.departments?.department_name || "General"}</span>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-bold text-gray-400">Designation</span>
 <span className="text-[13px] font-bold text-gray-900 ">{emp.designation || "Unassigned"}</span>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-bold text-gray-400">{emp.custom_fields?.added_via_onboard ? "Onboard Date" : "Joined Date"}</span>
 <span className="text-[13px] font-bold text-gray-900 ">{emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}</span>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-bold text-gray-400">Job Type</span>
 <span className="text-[13px] font-bold text-gray-900 ">{emp.job_type || "Regular"}</span>
 </div>
 {emp.custom_fields?.contract_end_date && (
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-bold text-gray-400">Contract End</span>
 <span className="text-[13px] font-bold text-gray-900 ">{new Date(emp.custom_fields.contract_end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* QR Code Segment */}
 <div className="flex flex-col items-center shrink-0 mt-6 md:mt-0">
 <div className="h-[96px] w-[96px] bg-white rounded-xl p-2 flex items-center justify-center relative shadow-sm">
 <QRCode
 value={`BEGIN:VCARD\nVERSION:3.0\nFN:${emp.name || ""}\nTITLE:${emp.designation || emp.role || ""}\nTEL;TYPE=WORK,VOICE:${emp.mobile || ""}\nEMAIL;TYPE=PREF,INTERNET:${emp.email || ""}\nEND:VCARD`}
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
 <div className="w-full border border-gray-200 rounded-full px-6 py-4 flex items-center justify-center mb-6">
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
 <div className="border border-gray-200 rounded-[24px] p-6 pt-8 relative">
 <div className="absolute top-0 left-6 -translate-y-1/2 bg-white px-2">
 <span className="text-[12px] font-semibold text-gray-400">Intro</span>
 </div>
 <span className="font-bold text-[14px] text-gray-900 block mb-2">Hello, I'm {emp.name}</span>
 <p className="text-[13px] text-gray-600 font-medium leading-relaxed">
 {emp.bio || `Welcome to my official profile page. I am a dedicated professional serving as a ${emp.designation || emp.role} at the ${emp.departments?.department_name} department. I am passionate about driving results and contributing to our organizational hierarchy with commitment.`}
 </p>
 </div>
 {/* Right Box Team Manager & Members */}
 <div className="border border-blue-100 rounded-[24px] flex relative bg-blue-50/20 ">
 <div className="flex-1 p-6 flex flex-col justify-center">
 <span className="text-[10px] font-bold text-gray-500 block mb-4">Team Manager</span>
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
 <span className={`text-[13px] font-bold block leading-tight ${manager?.id ? 'text-[#007AFF]' : 'text-gray-900 '}`}>{manager?.name || "Unassigned"}</span>
 <span className="text-[11px] font-semibold text-gray-400 leading-tight">{manager?.designation || manager?.role || "HR"}</span>
 </div>
 </div>
 </div>
 <div className="flex-1 p-6 border-l border-blue-100 flex flex-col justify-center">
 <span className="text-[10px] font-bold text-gray-500 block mb-4">Team Members ({teamCount})</span>
 <div className="flex items-center -space-x-3">
 {teamMembers.length > 0 ? (
 teamMembers.map((member) => (
 <div 
 key={member.id} 
 onClick={() => router.push(`/employees/${member.id}`)}
 className="h-9 w-9 rounded-full border-2 border-white flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:z-10 hover:scale-110 transition-transform"
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
 <span className="text-[12px] font-semibold text-gray-400">No team members</span>
 )}
 {teamCount > teamMembers.length && (
 <div className="h-9 w-9 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center shrink-0 text-[10px] font-bold text-gray-500 z-0">
 +{teamCount - teamMembers.length}
 </div>
 )}
 </div>
 </div>
 </div>

         {/* Configurable Tab Content Area */}
        <div className="mb-12">
          {activeTab === "Documents" && (
            <div className="bg-[#FAFAF9] rounded-[24px] p-6 md:p-8 animate-in fade-in duration-300">
              <h3 className="text-[24px] font-bold tracking-tight text-[#111827] mb-6">Documents</h3>
              {documents.length === 0 ? (
                <p className="text-[14px] leading-relaxed text-[#4B5563]">No documents found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="bg-[#FFFFFF] p-4 rounded-lg border border-[#ECECEC] flex flex-col gap-2">
                      <span className="font-bold text-gray-900">{doc.document_name}</span>
                      <span className="text-[12px] text-gray-500">{doc.category} - {doc.file_type}</span>
                      <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-[#007AFF] text-[13px] font-semibold mt-2 hover:underline">View Document</a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "Histories" && (
            <div className="bg-[#FAFAF9] rounded-[24px] p-6 md:p-8 animate-in fade-in duration-300">
              <h3 className="text-[24px] font-bold tracking-tight text-[#111827] mb-6">Histories</h3>
              {histories.length === 0 ? (
                <p className="text-[14px] leading-relaxed text-[#4B5563]">No work histories available.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {histories.map((hist: any, i: number) => (
                    <div key={i} className="bg-[#FFFFFF] p-4 rounded-lg border border-[#ECECEC]">
                      <p className="font-bold text-gray-900">Job Type: <span className="font-normal">{hist.job_type || "-"}</span></p>
                      <p className="font-bold text-gray-900">Shift Type: <span className="font-normal">{hist.shift_type || "-"}</span></p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "Attendance Log" && (
            <div className="bg-[#FAFAF9] rounded-[24px] p-6 md:p-8 animate-in fade-in duration-300">
              <h3 className="text-[24px] font-bold tracking-tight text-[#111827] mb-6">Attendance Log</h3>
              {attendance.length === 0 ? (
                <p className="text-[14px] leading-relaxed text-[#4B5563]">No attendance records found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#ECECEC]">
                        <th className="py-3 px-4 text-[12px] uppercase tracking-wider font-semibold text-gray-500">Date</th>
                        <th className="py-3 px-4 text-[12px] uppercase tracking-wider font-semibold text-gray-500">Status</th>
                        <th className="py-3 px-4 text-[12px] uppercase tracking-wider font-semibold text-gray-500">Clock In</th>
                        <th className="py-3 px-4 text-[12px] uppercase tracking-wider font-semibold text-gray-500">Clock Out</th>
                        <th className="py-3 px-4 text-[12px] uppercase tracking-wider font-semibold text-gray-500">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((att: any) => (
                        <tr key={att.id} className="border-b border-[#ECECEC] last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-[14px] text-gray-900">{new Date(att.date).toLocaleDateString('en-GB')}</td>
                          <td className="py-3 px-4 text-[14px]">
                            <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${att.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {att.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[14px] text-gray-900">{att.clock_in || "-"}</td>
                          <td className="py-3 px-4 text-[14px] text-gray-900">{att.clock_out || "-"}</td>
                          <td className="py-3 px-4 text-[14px] text-gray-900">{att.hours || "-"}</td>
                        </tr>
                      ))}
                                        </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  </main>

  {/* Notification Modal */}
  {isNotificationModalOpen && (
  <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
  <div className="bg-white border border-[#E5E7EB] rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
 <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">
 <h3 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
 <Bell className="h-5 w-5 text-[var(--user-accent)]" /> Send Push Notification
 </h3>
 <button onClick={() => setIsNotificationModalOpen(false)} className="text-gray-400 hover:text-gray-600 ">
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
 </button>
 </div>
 
 <form onSubmit={handlePushNotification} className="p-6 flex flex-col gap-5">
 <div className="flex flex-col gap-2">
 <label className="text-[13px] font-bold text-gray-700 ">Notification Title</label>
 <input 
 type="text" 
 required
 placeholder="e.g. Mandatory Training Reminder"
 className="w-full px-4 py-3 rounded-[12px] border border-[#E5E7EB] bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--user-accent)]/50 transition-all text-[14px]"
 value={notificationForm.title}
 onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
 />
 </div>
 
 <div className="flex flex-col gap-2">
 <label className="text-[13px] font-bold text-gray-700 ">Message Body</label>
 <textarea 
 required
 placeholder="Write the detailed message here..."
 rows={4}
 className="w-full px-4 py-3 rounded-[12px] border border-[#E5E7EB] bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--user-accent)]/50 transition-all text-[14px] resize-none"
 value={notificationForm.message}
 onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
 />
 </div>

 <div className="flex flex-col gap-2">
 <label className="text-[13px] font-bold text-gray-700 ">Priority / Type</label>
 <select 
 className="w-full px-4 py-3 rounded-[12px] border border-[#E5E7EB] bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--user-accent)]/50 transition-all text-[14px] appearance-none"
 value={notificationForm.type}
 onChange={(e) => setNotificationForm({...notificationForm, type: e.target.value})}
 >
 <option value="info">Information (Default)</option>
 <option value="warning">Warning / Attention</option>
 <option value="success">Success / Achievement</option>
 <option value="urgent">Urgent Action Required</option>
 </select>
 </div>
 
 <div className="mt-2 pt-5 border-t border-[#E5E7EB] flex items-center justify-between">
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
 className="px-6 py-2.5 bg-[#464D5B] hover:bg-black text-white font-bold text-[14px] rounded-[12px] transition-all disabled:opacity-50 flex items-center gap-2"
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
 className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isConfigureClosing ? 'opacity-0' : 'opacity-100'} bg-black/10 `}
 onClick={closeConfigurePanel}
 />
 <div className={`fixed inset-y-0 right-0 z-[100] w-full max-w-[440px] bg-white border-l border-gray-100 flex flex-col transition-transform duration-300 ease-out ${isConfigureClosing ? 'translate-x-full' : 'translate-x-0'}`}>
 {/* ── SCREEN 1: Main Configure Profile ── */}
 {activeSubPanel === null && (
 <>
 {/* Header */}
 <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] ">
 <div>
 <h2 className="text-[18px] font-bold text-gray-900 ">
 Configure Profile
 </h2>
 <p className="text-[12px] text-[#8E8E93] mt-0.5">Manage credentials, module access, and team transfers</p>
 </div>
 <button onClick={closeConfigurePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 transition-colors rounded-full hover:bg-[#F2F2F7] ">
 <X size={20} />
 </button>
 </div>

 {/* Scrollable Body */}
 <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 page-scrollbar">
 
 {/* Active Status */}
 <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] flex items-center justify-between">
 <div>
 <h3 className="text-[14px] font-bold text-gray-900 ">Active Status</h3>
 <p className="text-[12px] font-medium text-gray-500">Employee account is currently {activeStatus ? 'active' : 'inactive'}</p>
 </div>
 <button 
 onClick={() => handleToggleActiveStatus(!activeStatus)}
 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${activeStatus ? 'bg-[#34C759]' : 'bg-gray-300 '}`}
 >
 <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${activeStatus ? 'translate-x-6' : 'translate-x-1'}`} />
 </button>
 </div>

 {/* Login Access */}
 <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] flex flex-col gap-3">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-[14px] font-bold text-gray-900 ">
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
 ? "bg-gray-100 hover:bg-gray-200 text-gray-900 "
 : "bg-[#007AFF]/10 hover:bg-[#007AFF]/15 text-[#007AFF]"
 }`}
 >
 {credStatus?.exists ? "Manage" : "Enable"}
 </button>
 </div>
 </div>

 {/* Module Access */}
 <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] flex flex-col gap-4">
 <h3 className="text-[14px] font-bold text-gray-900 ">
 Module Access
 </h3>
 <div className="flex flex-col gap-3.5">
 <div className="flex items-center justify-between">
 <span className="text-[13px] font-medium text-gray-700 ">Attendance Tracker</span>
 <button onClick={() => handleToggleModule('module_attendance', attendanceEnabled)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${attendanceEnabled ? 'bg-[#007AFF]' : 'bg-gray-300 '}`}>
 <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${attendanceEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
 </button>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-[13px] font-medium text-gray-700 ">Leave Management</span>
 <button onClick={() => handleToggleModule('module_leave', leaveEnabled)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${leaveEnabled ? 'bg-[#007AFF]' : 'bg-gray-300 '}`}>
 <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${leaveEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
 </button>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-[13px] font-medium text-gray-700 ">Expense Claims</span>
 <button onClick={() => handleToggleModule('module_claim', claimEnabled)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${claimEnabled ? 'bg-[#007AFF]' : 'bg-gray-300 '}`}>
 <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${claimEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
 </button>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-[13px] font-medium text-gray-700 ">Events & Notifications</span>
 <button onClick={() => handleToggleModule('module_event', eventEnabled)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${eventEnabled ? 'bg-[#007AFF]' : 'bg-gray-300 '}`}>
 <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${eventEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
 </button>
 </div>
 </div>
 </div>

 {/* Organization Transfer */}
 <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] flex flex-col gap-4">
 <h3 className="text-[14px] font-bold text-gray-900 ">
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
 className="flex items-center justify-between p-4 bg-[#F8F9FA] hover:bg-[#F2F2F7] rounded-xl text-left border border-[#E5E7EB] transition-all"
 >
 <div className="flex flex-col">
 <span className="text-[11px] text-[#8E8E93] font-bold uppercase tracking-wider">Team Department</span>
 <span className="text-[13px] font-bold text-gray-900 mt-0.5">{emp.departments?.department_name || "Unassigned"}</span>
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
 className="flex items-center justify-between p-4 bg-[#F8F9FA] hover:bg-[#F2F2F7] rounded-xl text-left border border-[#E5E7EB] transition-all"
 >
 <div className="flex flex-col">
 <span className="text-[11px] text-[#8E8E93] font-bold uppercase tracking-wider">Project</span>
 <span className="text-[13px] font-bold text-gray-900 mt-0.5">{emp.current_project || emp.custom_fields?.project_name || "None"}</span>
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
 className="flex items-center justify-between p-4 bg-[#F8F9FA] hover:bg-[#F2F2F7] rounded-xl text-left border border-[#E5E7EB] transition-all"
 >
 <div className="flex flex-col">
 <span className="text-[11px] text-[#8E8E93] font-bold uppercase tracking-wider">Reporting Staff</span>
 <span className="text-[13px] font-bold text-gray-900 mt-0.5">{manager?.name || "Unassigned"}</span>
 </div>
 <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90 animate-in fade-in duration-200" />
 </button>
 </div>
 </div>

 {/* Danger Zone */}
 <div className="bg-red-50 rounded-2xl p-5 border border-red-100 flex flex-col gap-3">
 <h3 className="text-[14px] font-bold text-red-600 ">
 Danger Zone
 </h3>
 <p className="text-[12px] font-medium text-red-500/80">Permanently delete this employee and all associated records. This action cannot be undone.</p>
 <button 
 onClick={() => {
 setIsDeleteModalOpen(true);
 setDeleteConfirmInput("");
 setDeleteError("");
 }}
 className="mt-1 w-full py-2.5 bg-red-100 hover:bg-red-200 text-red-600 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-2"
 >
 Delete Employee
 </button>
 </div>

 </div>

 {/* Footer */}
 <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] ">
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
 <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] ">
 <div className="flex items-center gap-3">
 <button 
 onClick={() => setActiveSubPanel(null)}
 className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
 >
 <ArrowLeft className="h-5 w-5" />
 </button>
 <div>
 <h2 className="text-[18px] font-bold text-gray-900 ">Login Access</h2>
 <p className="text-[12px] text-[#8E8E93] mt-0.5">Configure authentication credentials</p>
 </div>
 </div>
 <button onClick={closeConfigurePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 transition-colors rounded-full hover:bg-[#F2F2F7] ">
 <X size={20} />
 </button>
 </div>

 {/* Body */}
 <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 page-scrollbar">
 {/* Messages */}
 {credMsg && (
 <div className={`p-3.5 rounded-2xl text-[12px] font-semibold border animate-in fade-in duration-200 ${
 credMsg.type === 'success' 
 ? 'bg-green-50 text-green-600 border-green-100 ' 
 : 'bg-red-50 text-red-600 border-red-100 '
 }`}>
 {credMsg.text}
 </div>
 )}

 {/* Email (non-editable Login ID) */}
 <div className="flex flex-col gap-2">
 <label className="text-[13px] font-bold text-gray-900 ">Login ID (Email)</label>
 <input 
 type="text" 
 value={emp.email || ""} 
 disabled 
 className="w-full px-4 py-3.5 bg-gray-50 text-gray-400 border border-[#E5E7EB] rounded-[14px] text-[13.5px] font-medium cursor-not-allowed outline-none"
 />
 <p className="text-[11px] text-[#8E8E93] italic mt-0.5">(not editable - need to change in the edit Profile)</p>
 </div>

 {/* Last Password */}
 {credStatus?.exists && (
 <div className="flex flex-col gap-2">
 <label className="text-[13px] font-bold text-gray-900 ">Last Password</label>
 <div className="relative flex items-center">
 <input 
 type={showLastPass ? "text" : "password"} 
 value={emp.custom_fields?.lastPassword || "No password recorded"} 
 disabled 
 className="w-full px-4 py-3.5 bg-gray-50 text-gray-700 border border-[#E5E7EB] rounded-[14px] text-[13.5px] font-semibold outline-none"
 />
 <button 
 type="button"
 onClick={() => setShowLastPass(!showLastPass)} 
 className="absolute right-4 text-[#8E8E93] hover:text-gray-700 "
 >
 {showLastPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
 </button>
 </div>
 <p className="text-[11px] text-[#8E8E93] italic">(stored plain text of assigned password)</p>
 </div>
 )}

 {/* Password field */}
 <div className="flex flex-col gap-2">
 <label className="text-[13px] font-bold text-gray-900 ">
 {credStatus?.exists ? "New Password" : "Assign Password"}
 </label>
 <div className="relative flex items-center">
 <input 
 type={credShowPass ? "text" : "password"} 
 placeholder={credStatus?.exists ? "Enter password to update" : "Assign temporary password"}
 className="w-full px-4 py-3.5 bg-[#F8F9FA] text-gray-900 border border-transparent focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none focus:ring-0"
 value={credPassword}
 onChange={(e) => setCredPassword(e.target.value)}
 />
 <button 
 onClick={() => setCredShowPass(!credShowPass)} 
 className="absolute right-4 text-[#8E8E93] hover:text-gray-700 "
 >
 {credShowPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
 </button>
 </div>
 <p className="text-[11px] text-[#8E8E93]">Password must be at least 6 characters long.</p>
 </div>
 </div>

 {/* Footer */}
 <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] ">
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
 className="w-full py-3.5 bg-red-50 hover:bg-red-100 transition-colors rounded-[16px] text-red-600 text-[14px] font-bold"
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
 <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] ">
 <div className="flex items-center gap-3">
 <button 
 onClick={() => setActiveSubPanel(null)}
 className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
 >
 <ArrowLeft className="h-5 w-5" />
 </button>
 <div>
 <h2 className="text-[18px] font-bold text-gray-900 ">Transfer Department</h2>
 <p className="text-[12px] text-[#8E8E93] mt-0.5">Move employee to a different department</p>
 </div>
 </div>
 <button onClick={closeConfigurePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 transition-colors rounded-full hover:bg-[#F2F2F7] ">
 <X size={20} />
 </button>
 </div>

 {/* Body */}
 <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 page-scrollbar">
 
 {/* Current Team Department Card with Appointed Date */}
 <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-[#E5E7EB] flex flex-col gap-2.5">
 <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Current Department</p>
 <h4 className="text-[15px] font-bold text-gray-900 ">{emp.departments?.department_name || "Unassigned"}</h4>
 <div className="flex flex-col text-[12px] border-t border-gray-100 pt-2.5 mt-1">
 <span className="text-[#8E8E93]">Appointed Date</span>
 <span className="font-semibold text-gray-900 mt-0.5">
 {emp.custom_fields?.departmentAppointedDate ? new Date(emp.custom_fields.departmentAppointedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Not Appointed")}
 </span>
 </div>
 </div>

 {/* Search Bar */}
 <div className="flex flex-col gap-2 relative">
 <label className="text-[13px] font-bold text-gray-900 ">Search Department</label>
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => handleSearchDepartments(e.target.value)}
 placeholder="Type department name or ID to match..."
 className="w-full px-4 py-3.5 bg-[#F8F9FA] text-gray-900 border border-transparent focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none"
 />
 {searchLoading && (
 <RefreshCw className="absolute right-4 bottom-3.5 h-4.5 w-4.5 text-[#007AFF] animate-spin" />
 )}
 
 {/* Search results dropdown */}
 {searchResults.length > 0 && (
 <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden py-1">
 {searchResults.map((dept) => (
 <button
 key={dept.id}
 onClick={() => {
 setSelectedSearchDept(dept);
 setSearchQuery("");
 setSearchResults([]);
 setTempTransferDeptId(dept.id);
 }}
 className="w-full px-4 py-3 text-left hover:bg-[#F2F2F7] border-b border-gray-50 last:border-b-0 transition-colors flex flex-col"
 >
 <span className="font-bold text-[13.5px] text-gray-900 ">{dept.name}</span>
 <span className="text-[11px] text-[#8E8E93] mt-0.5">ID: {dept.id}</span>
 </button>
 ))}
 </div>
 )}
 
 {/* Separate Card for Match Results */}
 {selectedSearchDept && (
 <div className="bg-[#F9F9FB] border border-[#E5E7EB] rounded-2xl p-5 flex flex-col gap-4 relative animate-in fade-in slide-in-from-top-2 duration-200">
 <button 
 onClick={() => setSelectedSearchDept(null)}
 className="absolute top-4 right-4 text-[#8E8E93] hover:text-gray-700 "
 >
 <X size={16} />
 </button>
 <div>
 <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Matched Department Info</p>
 <h4 className="text-[15px] font-bold text-[#007AFF] mt-1">{selectedSearchDept.name}</h4>
 </div>
 
 <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[13px] border-t border-gray-100 pt-3">
 <div className="flex flex-col">
 <span className="text-[#8E8E93] text-[11px]">Department ID</span>
 <span className="font-semibold text-gray-900 mt-0.5">{selectedSearchDept.id}</span>
 </div>
 <div className="flex flex-col">
 <span className="text-[#8E8E93] text-[11px]">Department Name</span>
 <span className="font-semibold text-gray-900 mt-0.5">{selectedSearchDept.name}</span>
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
 <div className="bg-[#007AFF]/5 border border-[#007AFF]/20 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
 <div className="flex flex-col">
 <span className="text-[#007AFF] text-[11px] font-bold uppercase tracking-wider">Selected Target Department</span>
 <span className="font-bold text-gray-900 text-[14px] mt-0.5">{getDepartmentName(tempTransferDeptId)}</span>
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
 <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] ">
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
 <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] ">
 <div className="flex items-center gap-3">
 <button 
 onClick={() => setActiveSubPanel(null)}
 className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
 >
 <ArrowLeft className="h-5 w-5" />
 </button>
 <div>
 <h2 className="text-[18px] font-bold text-gray-900 ">Transfer Project</h2>
 <p className="text-[12px] text-[#8E8E93] mt-0.5">Assign employee to a project</p>
 </div>
 </div>
 <button onClick={closeConfigurePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 transition-colors rounded-full hover:bg-[#F2F2F7] ">
 <X size={20} />
 </button>
 </div>

 {/* Body */}
 <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 page-scrollbar">
 
 {/* Search Bar */}
 <div className="flex flex-col gap-2 relative">
 <label className="text-[13px] font-bold text-gray-900 ">Search People or Projects</label>
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => handleSearchPeople(e.target.value)}
 placeholder="Type name or project to match..."
 className="w-full px-4 py-3.5 bg-[#F8F9FA] text-gray-900 border border-transparent focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none"
 />
 {searchLoading && (
 <RefreshCw className="absolute right-4 bottom-3.5 h-4.5 w-4.5 text-[#007AFF] animate-spin" />
 )}
 
 {/* Search results dropdown */}
 {searchResults.length > 0 && (
 <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden py-1">
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
 className="w-full px-4 py-3 text-left hover:bg-[#F2F2F7] border-b border-gray-50 last:border-b-0 transition-colors flex flex-col"
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
 <span className="font-bold text-[13.5px] text-gray-900 ">{item.name}</span>
 <span className="text-[11px] text-[#8E8E93] mt-0.5">{item.departments?.department_name || "General"} • Project: {item.current_project || item.custom_fields?.project_name || "—"}</span>
 </>
 )}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Separate Card for Match Results */}
 {selectedSearchPerson && (
 <div className="bg-[#F9F9FB] border border-[#E5E7EB] rounded-2xl p-5 flex flex-col gap-4 relative animate-in fade-in slide-in-from-top-2 duration-200">
 <button 
 onClick={() => setSelectedSearchPerson(null)}
 className="absolute top-4 right-4 text-[#8E8E93] hover:text-gray-700 "
 >
 <X size={16} />
 </button>
 <div>
 <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Matched Employee Info</p>
 <h4 className="text-[15px] font-bold text-[#007AFF] mt-1">{selectedSearchPerson.name}</h4>
 </div>
 
 <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[13px] border-t border-gray-100 pt-3">
 <div className="flex flex-col">
 <span className="text-[#8E8E93] text-[11px]">Current Team</span>
 <span className="font-semibold text-gray-900 mt-0.5">{selectedSearchPerson.departments?.department_name || "General"}</span>
 </div>
 <div className="flex flex-col">
 <span className="text-[#8E8E93] text-[11px]">Project</span>
 <span className="font-semibold text-gray-900 mt-0.5">{selectedSearchPerson.current_project || selectedSearchPerson.custom_fields?.project_name || "—"}</span>
 </div>
 <div className="flex flex-col col-span-2">
 <span className="text-[#8E8E93] text-[11px]">Reporting Staff</span>
 <span className="font-semibold text-gray-900 mt-0.5">{getManagerName(selectedSearchPerson.manager_id)}</span>
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
 <div className="bg-[#007AFF]/5 border border-[#007AFF]/20 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
 <div className="flex flex-col">
 <span className="text-[#007AFF] text-[11px] font-bold uppercase tracking-wider">Selected Target Project</span>
 <span className="font-bold text-gray-900 text-[14px] mt-0.5">{tempTransferProject}</span>
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
 <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] ">
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
 <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] ">
 <div className="flex items-center gap-3">
 <button 
 onClick={() => setActiveSubPanel(null)}
 className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
 >
 <ArrowLeft className="h-5 w-5" />
 </button>
 <div>
 <h2 className="text-[18px] font-bold text-gray-900 ">Reporting Staff</h2>
 <p className="text-[12px] text-[#8E8E93] mt-0.5">Change employee's reporting staff</p>
 </div>
 </div>
 <button onClick={closeConfigurePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 transition-colors rounded-full hover:bg-[#F2F2F7] ">
 <X size={20} />
 </button>
 </div>

 {/* Body */}
 <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 page-scrollbar">
 
 {/* Search Bar */}
 <div className="flex flex-col gap-2 relative">
 <label className="text-[13px] font-bold text-gray-900 ">Search People</label>
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => handleSearchPeople(e.target.value)}
 placeholder="Type reporting staff's name to match..."
 className="w-full px-4 py-3.5 bg-[#F8F9FA] text-gray-900 border border-transparent focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none"
 />
 {searchLoading && (
 <RefreshCw className="absolute right-4 bottom-3.5 h-4.5 w-4.5 text-[#007AFF] animate-spin" />
 )}
 
 {/* Search results dropdown */}
 {searchResults.length > 0 && (
 <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden py-1">
 {searchResults.map((person) => (
 <button
 key={person.id}
 onClick={() => {
 setSelectedSearchPerson(person);
 setSearchQuery("");
 setSearchResults([]);
 setTempTransferManagerId(person.id);
 }}
 className="w-full px-4 py-3 text-left hover:bg-[#F2F2F7] border-b border-gray-50 last:border-b-0 transition-colors flex flex-col"
 >
 <span className="font-bold text-[13.5px] text-gray-900 ">{person.name}</span>
 <span className="text-[11px] text-[#8E8E93] mt-0.5">{person.departments?.department_name || "General"} • {person.role || "Employee"}</span>
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Separate Card for Match Results */}
 {selectedSearchPerson && (
 <div className="bg-[#F9F9FB] border border-[#E5E7EB] rounded-2xl p-5 flex flex-col gap-4 relative animate-in fade-in slide-in-from-top-2 duration-200">
 <button 
 onClick={() => setSelectedSearchPerson(null)}
 className="absolute top-4 right-4 text-[#8E8E93] hover:text-gray-700 "
 >
 <X size={16} />
 </button>
 <div>
 <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Matched Employee Info</p>
 <h4 className="text-[15px] font-bold text-[#007AFF] mt-1">{selectedSearchPerson.name}</h4>
 </div>
 
 <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[13px] border-t border-gray-100 pt-3">
 <div className="flex flex-col">
 <span className="text-[#8E8E93] text-[11px]">Current Team</span>
 <span className="font-semibold text-gray-900 mt-0.5">{selectedSearchPerson.departments?.department_name || "General"}</span>
 </div>
 <div className="flex flex-col">
 <span className="text-[#8E8E93] text-[11px]">Project</span>
 <span className="font-semibold text-gray-900 mt-0.5">{selectedSearchPerson.current_project || selectedSearchPerson.custom_fields?.project_name || "—"}</span>
 </div>
 <div className="flex flex-col col-span-2">
 <span className="text-[#8E8E93] text-[11px]">Reporting Staff</span>
 <span className="font-semibold text-gray-900 mt-0.5">{getManagerName(selectedSearchPerson.manager_id)}</span>
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
 <div className="bg-[#007AFF]/5 border border-[#007AFF]/20 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
 <div className="flex flex-col">
 <span className="text-[#007AFF] text-[11px] font-bold uppercase tracking-wider">Selected Target Reporting Staff</span>
 <span className="font-bold text-gray-900 text-[14px] mt-0.5">{getManagerName(tempTransferManagerId)}</span>
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
 <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] ">
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
 className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isUploadClosing ? 'opacity-0' : 'opacity-100'} bg-black/10 `}
 onClick={closeUploadPanel}
 />
 <div className={`fixed inset-y-0 right-0 z-[100] w-full max-w-[440px] bg-white border-l border-gray-100 flex flex-col transition-transform duration-300 ease-out ${isUploadClosing ? 'translate-x-full' : 'translate-x-0'}`}>
 {/* Header */}
 <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] ">
 <div>
 <h2 className="text-[18px] font-bold text-gray-900 ">
 Upload Document
 </h2>
 <p className="text-[12px] text-[#8E8E93] mt-0.5">Add credentials, certificates, or agreements</p>
 </div>
 <button onClick={closeUploadPanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 transition-colors rounded-full hover:bg-[#F2F2F7] ">
 <X size={20} />
 </button>
 </div>

 {/* Scrollable Body */}
 <form onSubmit={handleDocUpload} className="flex-1 flex flex-col justify-between overflow-hidden">
 <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 page-scrollbar">
 {uploadError && (
 <div className="p-3.5 bg-red-50 border border-red-100 text-red-600 text-[12.5px] font-bold rounded-xl animate-in fade-in duration-200">
 {uploadError}
 </div>
 )}

 {/* Document Type Dropdown */}
 <div className="flex flex-col gap-2">
 <label className="text-[13px] font-bold text-gray-900 ">Document Type</label>
 <div className="relative">
 <select 
 required
 className="w-full appearance-none bg-[#F8F9FA] border border-[#E5E7EB] rounded-[14px] px-4 py-3.5 text-[13.5px] font-medium text-gray-900 focus:outline-none"
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
 <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex gap-3 text-[12.5px] font-medium leading-relaxed">
 <Info size={18} className="shrink-0 text-amber-600 mt-0.5" />
 <div>
 <span className="font-bold block mb-0.5">Overwriting Warning</span>
 Uploading a new schooling or higher education certificate will permanently replace and delete the existing file from the server.
 </div>
 </div>
 )}

 {/* Course Certification Form Block */}
 {uploadDocType === "courseCertUrl" && (
 <div className="flex flex-col gap-5 p-4 border border-gray-100 rounded-2xl bg-gray-50/50 animate-in fade-in duration-200">
 <div className="flex flex-col gap-2">
 <label className="text-[12.5px] font-bold text-gray-900 ">Course Name</label>
 <input 
 type="text"
 required
 placeholder="e.g. Certified Scrum Master"
 className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-[12px] text-[13.5px] font-medium outline-none text-gray-900 "
 value={courseName}
 onChange={(e) => setCourseName(e.target.value)}
 />
 </div>
 <div className="flex flex-col gap-2">
 <label className="text-[12.5px] font-bold text-gray-900 ">Issuing Organization</label>
 <input 
 type="text"
 required
 placeholder="e.g. Scrum Alliance"
 className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-[12px] text-[13.5px] font-medium outline-none text-gray-900 "
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
 className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-[12px] text-[13px] font-medium outline-none text-gray-900 "
 value={courseIssueDate}
 onChange={(e) => setCourseIssueDate(e.target.value)}
 />
 </div>
 <div className="flex flex-col gap-2">
 <label className="text-[12px] font-bold text-gray-500">Expiry Date</label>
 <input 
 type="date"
 className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-[12px] text-[13px] font-medium outline-none text-gray-900 "
 value={courseExpiryDate}
 onChange={(e) => setCourseExpiryDate(e.target.value)}
 />
 </div>
 </div>
 </div>
 )}

 {/* Other / Custom Document Form Block */}
 {uploadDocType === "customDocument" && (
 <div className="flex flex-col gap-5 p-4 border border-gray-100 rounded-2xl bg-gray-50/50 animate-in fade-in duration-200">
 <div className="flex flex-col gap-2">
 <label className="text-[12.5px] font-bold text-gray-900 ">Document Name</label>
 <input 
 type="text"
 required
 placeholder="e.g. Non-Disclosure Agreement"
 className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-[12px] text-[13.5px] font-medium outline-none text-gray-900 "
 value={customDocName}
 onChange={(e) => setCustomDocName(e.target.value)}
 />
 </div>
 <div className="flex flex-col gap-2">
 <label className="text-[12.5px] font-bold text-gray-900 ">Document Category</label>
 <input 
 type="text"
 required
 placeholder="e.g. Employment Contract, Tax Form"
 className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-[12px] text-[13.5px] font-medium outline-none text-gray-900 "
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
 <span className="text-[13px] font-bold text-gray-900 ">Does the document have an expiry date?</span>
 </label>
 
 {hasExpiry && (
 <div className="flex flex-col gap-2 pl-7 animate-in slide-in-from-top-2 duration-200">
 <label className="text-[12px] font-bold text-gray-500">Expiry Date</label>
 <input 
 type="date"
 required
 className="px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-[12px] text-[13px] font-medium outline-none text-gray-900 "
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
 <label className="text-[13px] font-bold text-gray-900 ">File Attachment</label>
 {uploadFileObj ? (
 <div className="flex items-center justify-between p-3.5 border border-gray-200 rounded-2xl bg-[#F8F9FA] animate-in fade-in duration-200">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="p-2 bg-blue-50 text-[#007AFF] rounded-lg">
 <FileText className="h-5 w-5 shrink-0" />
 </div>
 <div className="min-w-0">
 <span className="text-[13px] font-bold text-gray-900 block truncate">{uploadFileObj.name}</span>
 <span className="text-[10px] text-gray-400 font-semibold">{(uploadFileObj.size / (1024 * 1024)).toFixed(2)} MB</span>
 </div>
 </div>
 <button 
 type="button" 
 onClick={() => setUploadFileObj(null)}
 className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
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
 <div className="h-36 w-full border-2 border-dashed border-gray-200 rounded-[16px] bg-[#F9F9FB] flex flex-col items-center justify-center gap-2 group-hover:bg-[#EEF4FF] group-hover:border-[#007AFF] transition-all">
 <Upload className="h-8 w-8 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
 <span className="text-[13px] font-bold text-gray-700 group-hover:text-[#007AFF] transition-colors">Click or drag file to upload</span>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Footer buttons block inside panel */}
 <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] ">
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
 <div className="bg-white border border-[#E5E7EB] rounded-[24px] w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-4">
 <div className="flex items-center gap-3 text-red-500">
 <div className="p-2.5 bg-red-50 rounded-xl">
 <ShieldAlert size={22} />
 </div>
 <h4 className="text-[16px] font-bold text-gray-900 ">Delete Older Document?</h4>
 </div>
 
 <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
 An education certificate of this type is already uploaded. Saving this will **permanently delete** the older file from the server backend.
 </p>

 <div className="flex items-center gap-3 pt-2">
 <button 
 type="button"
 onClick={() => {
 setShowDeleteWarning(false);
 setPendingUploadPayload(null);
 }}
 className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[13px] font-bold rounded-xl transition-all"
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
 <div className="bg-white border border-[#E5E7EB] rounded-[24px] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
 <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">
 <h3 className="text-[17px] font-bold text-gray-900 flex items-center gap-2">
 <Share2 className="h-4 w-4 text-[#007AFF]" /> Share Profile
 </h3>
 <button onClick={() => setIsShareModalOpen(false)} className="text-gray-400 hover:text-gray-600 ">
 <X className="h-5 w-5" />
 </button>
 </div>
 
 <div className="p-6 flex flex-col items-center gap-6">
 {/* QR Code Container */}
 <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col items-center justify-center">
 <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100/50">
 <QRCode
 value={`BEGIN:VCARD\nVERSION:3.0\nFN:${emp.name || ""}\nTITLE:${emp.designation || emp.role || ""}\nTEL;TYPE=WORK,VOICE:${emp.mobile || ""}\nEMAIL;TYPE=PREF,INTERNET:${emp.email || ""}\nEND:VCARD`}
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
 className="flex-1 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-gray-50 text-gray-500 text-[12px] font-medium focus:outline-none truncate"
 value={typeof window !== 'undefined' ? window.location.href : ""}
 />
 <button
 onClick={() => {
 if (typeof window !== 'undefined') {
 navigator.clipboard.writeText(window.location.href);
 alert("Copied profile URL to clipboard!");
 }
 }}
 className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 text-[12px] font-bold rounded-xl transition-colors whitespace-nowrap"
 >
 Copy
 </button>
 </div>
 </div>

 <button
 onClick={() => {
 const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${emp.name || ""}\nTITLE:${emp.designation || emp.role || ""}\nTEL;TYPE=WORK,VOICE:${emp.mobile || ""}\nEMAIL;TYPE=PREF,INTERNET:${emp.email || ""}\nEND:VCARD`;
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
 <div className="bg-white border border-red-100 rounded-[24px] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
 <div className="px-6 py-5 border-b border-red-50 flex items-center justify-between">
 <h3 className="text-[17px] font-bold text-red-600 ">
 Caution: Delete Employee
 </h3>
 <button 
 onClick={() => setIsDeleteModalOpen(false)} 
 className="text-gray-400 hover:text-gray-600 "
 >
 <X className="h-5 w-5" />
 </button>
 </div>
 
 <div className="p-6 flex flex-col gap-4">
 <p className="text-[13px] text-gray-600 leading-relaxed font-medium">
 Are you absolutely sure you want to permanently delete <strong className="text-gray-900 font-bold">{emp?.name}</strong>? 
 This action is irreversible and will delete all login credentials, timesheets, medical, and banking records.
 </p>
 
 <div className="flex flex-col gap-2">
  <label className="text-[12px] font-bold text-gray-500">
  Please type <strong className="text-red-500 font-bold">DELETE</strong> (or Employee ID <strong className="text-red-500 select-all font-mono font-bold">{emp?.emp_id}</strong>) to confirm:
  </label>
  <input 
  type="text"
  placeholder='Type "DELETE" or Employee ID'
  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-950 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-[13.5px] font-medium"
  value={deleteConfirmInput}
  onChange={(e) => setDeleteConfirmInput(e.target.value)}
  />
  </div>

  {deleteError && (
  <p className="text-[12px] text-red-600 font-semibold">{deleteError}</p>
  )}
 </div>

 <div className="px-6 pb-6 pt-3 flex items-center justify-end gap-3 border-t border-gray-100 mt-2">
 <button 
 type="button" 
 onClick={() => setIsDeleteModalOpen(false)}
 className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-[13px] rounded-xl transition-all"
 >
 Cancel
 </button>
 <button 
 type="button" 
 disabled={deleteConfirmInput.trim().toUpperCase() !== "DELETE" && deleteConfirmInput.trim() !== emp?.emp_id && deleteConfirmInput.trim().toLowerCase() !== emp?.name?.toLowerCase()}
 onClick={handleConfirmDelete}
 className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-200 disabled:text-red-400 text-white font-bold text-[13px] rounded-xl transition-all flex items-center gap-1.5"
 >
 Permanently Delete
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}

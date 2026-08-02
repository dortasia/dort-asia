"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Eye, ChevronLeft, ChevronRight, ChevronDown, ArrowLeft, Edit2, Trash2, Download, Building2, MapPin, AlertTriangle, Mail, Phone, Settings, Upload, Receipt, Bell, X, UserPlus, Users, DollarSign, Zap, Globe, TrendingUp, TrendingDown, LayoutDashboard, Clock, AlertCircle, Check, BarChart2, Calendar, CreditCard, Folder, Briefcase, Truck, Bed, ShieldCheck, ExternalLink, FileSpreadsheet, ShieldAlert, FileText, Search, SlidersHorizontal, MoreVertical, PieChart, Info, RefreshCw } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getInitials, getAvatarColor } from "@/utils/avatarColor";
import { uploadToCompanyStorage, toCompanySlug } from "@/utils/storageHelper";
import "@/components/home/home-rows.css";

const TABS = [
  { id: "Overview", label: "Project Overview", icon: LayoutDashboard },
  { id: "Employees", label: "Assigned Employees", icon: Users },
  { id: "Expenses", label: "Expenses and Claims", icon: Receipt },
  { id: "Equity", label: "Equity", icon: PieChart },
  { id: "Vendors", label: "Vendors & Outsourcing", icon: Building2 },
  { id: "Documents", label: "Documents", icon: Upload },
  { id: "Timeline", label: "Timeline & Activities", icon: Clock },
  { id: "Alerts", label: "Alerts & Notifications", icon: Bell }
];

const getTabLabel = (tabId: string, classification?: string) => {
  if (tabId === "Vendors") {
    if (classification === "External Project") {
      return "Client Details";
    }
    return "Vendors & Outsourcing";
  }
  const tab = TABS.find(t => t.id === tabId);
  return tab ? tab.label : tabId;
};

const InfoTooltip = ({ text }: { text?: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => { e.preventDefault(); setShow(!show); }}
        className="text-[#8E8E93] hover:text-[#007AFF] transition-colors p-0.5 inline-flex items-center justify-center focus:outline-none"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 dark:bg-gray-800 text-white text-[11px] leading-relaxed rounded-[8px] shadow-lg z-50 animate-in fade-in duration-200 text-left">
          {text || (
            <>
              <p className="font-bold mb-1">How to get from Google Maps:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Open Google Maps and find the address.</li>
                <li>Click the &quot;Share&quot; button.</li>
                <li>Select &quot;Copy link&quot;.</li>
                <li>Paste the shared link here.</li>
              </ol>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const ToggleSwitch = ({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) => (
  <label className="relative inline-flex items-center cursor-pointer select-none gap-3">
    <input
      type="checkbox"
      checked={value}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only peer"
    />
    <div className="w-11 h-6 bg-gray-200 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#34C759]" />
    {label && (
      <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{label}</span>
    )}
  </label>
);

export default function ProjectDetailView() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState("Overview");
  const [project, setProject] = useState<any>(null);
  const [managerEmployee, setManagerEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigurePanelOpen, setIsConfigurePanelOpen] = useState(false);
  const [isConfigureClosing, setIsConfigureClosing] = useState(false);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [allCompanyProjects, setAllCompanyProjects] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  // Budget Target states & hooks moved to top to prevent Hook Order Violation
  const [monthlyTarget, setMonthlyTarget] = useState<number>(50000);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState("50000");
  const [activeSubTab, setActiveSubTab] = useState<string>("basics");

  const [activeScreen, setActiveScreen] = useState<"menu" | "settings" | "add_employee" | "people_access" | "automations" | "site_settings">("menu");

  const [currentUserRole, setCurrentUserRole] = useState<"Admin" | "Sub Admin" | "Employee">("Admin");
  const [selectedAccessRole, setSelectedAccessRole] = useState<"Admin" | "Sub Admin" | "Employee">("Admin");
  const [accessSettings, setAccessSettings] = useState<Record<string, string[]>>({
    Admin: ["Overview", "Employees", "Expenses", "Equity", "Vendors", "Documents", "Timeline", "Alerts"],
    "Sub Admin": ["Overview", "Employees", "Expenses", "Vendors", "Documents", "Timeline", "Alerts"],
    Employee: ["Overview", "Timeline"]
  });

  const [accessSaving, setAccessSaving] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [accessSuccess, setAccessSuccess] = useState(false);

  // Automation states
  const [automationSettings, setAutomationSettings] = useState<any>({
    autoClockOutEnabled: false,
    autoClockOutTime: "18:00",
    workPassExpiryAlertEnabled: true,
    workPassExpiryAlertDays: 30,
    budgetWarningEnabled: true,
    budgetWarningPercent: 80,
    claimAlertEnabled: true,
    claimAlertThreshold: 500,
    autoInvoiceEnabled: false,
    autoInvoiceCycle: "Monthly"
  });
  const [automationsSaving, setAutomationsSaving] = useState(false);
  const [automationsError, setAutomationsError] = useState("");
  const [automationsSuccess, setAutomationsSuccess] = useState(false);

  // Site settings states
  const [sitesList, setSitesList] = useState<Array<{ name: string; mapLink: string }>>([]);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteMapLink, setNewSiteMapLink] = useState("");
  const [sitesSaving, setSitesSaving] = useState(false);
  const [sitesError, setSitesError] = useState("");
  const [sitesSuccess, setSitesSuccess] = useState(false);

  // Project settings states
  const [siteLocationLink, setSiteLocationLink] = useState("");
  const [clockInTime, setClockInTime] = useState("08:00");
  const [clockOutTime, setClockOutTime] = useState("17:00");
  const [attendanceEnabled, setAttendanceEnabled] = useState(true);
  const [siteAccessPass, setSiteAccessPass] = useState(false);
  const [locationRadius, setLocationRadius] = useState<number>(200);
  
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Add employee states
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [selectedEmpNames, setSelectedEmpNames] = useState<string[]>([]);
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Upload panel states
  const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);
  const [isUploadClosing, setIsUploadClosing] = useState(false);
  const [uploadDocType, setUploadDocType] = useState("service_agreement");
  const [uploadFileObj, setUploadFileObj] = useState<File | null>(null);
  const [customDocName, setCustomDocName] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const closeUploadPanel = () => {
    setIsUploadClosing(true);
    setTimeout(() => {
      setIsUploadPanelOpen(false);
      setIsUploadClosing(false);
      setUploadFileObj(null);
      setUploadError("");
      setCustomDocName("");
      setUploadSuccess(false);
    }, 280);
  };

  // Expense panel states
  const [isExpensePanelOpen, setIsExpensePanelOpen] = useState(false);
  const [isExpenseClosing, setIsExpenseClosing] = useState(false);
  const [expenseScreen, setExpenseScreen] = useState<"menu" | "form">("menu");
  const [expenseType, setExpenseType] = useState<"send" | "received">("send");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Material Cost");
  const [customCategory, setCustomCategory] = useState("");
  const [expenseMethod, setExpenseMethod] = useState<"Bank Transfer" | "Cash">("Bank Transfer");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseBankId, setExpenseBankId] = useState("");
  const [expenseFileObj, setExpenseFileObj] = useState<File | null>(null);
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [expenseError, setExpenseError] = useState("");
  const [expenseSuccess, setExpenseSuccess] = useState(false);
  const [companyBanks, setCompanyBanks] = useState<any[]>([]);

  // Employee Accessibility Edit Panel states
  const [isEmpEditPanelOpen, setIsEmpEditPanelOpen] = useState(false);
  const [isEmpEditClosing, setIsEmpEditClosing] = useState(false);
  const [empEditEmployee, setEmpEditEmployee] = useState<any>(null);
  const [empEditScreen, setEmpEditScreen] = useState<"menu" | "claims" | "overtime">("menu");

  // Claims form states
  const [claimAmount, setClaimAmount] = useState("");
  const [claimCycle, setClaimCycle] = useState<"Daily" | "Weekly" | "Monthly">("Monthly");
  const [claimCycleDay, setClaimCycleDay] = useState("");
  const [claimMethod, setClaimMethod] = useState<"Bank Transfer" | "Cash">("Bank Transfer");
  const [claimBankId, setClaimBankId] = useState("");
  const [claimSaving, setClaimSaving] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Overtime form states
  const [otRate, setOtRate] = useState("");
  const [otCycle, setOtCycle] = useState<"Daily" | "Weekly" | "Monthly">("Monthly");
  const [otCycleDay, setOtCycleDay] = useState("");
  const [otMethod, setOtMethod] = useState<"Bank Transfer" | "Cash">("Bank Transfer");
  const [otBankId, setOtBankId] = useState("");
  const [otSaving, setOtSaving] = useState(false);
  const [otError, setOtError] = useState("");
  const [otSuccess, setOtSuccess] = useState(false);

  const closeEmpEditPanel = () => {
    setIsEmpEditClosing(true);
    setTimeout(() => {
      setIsEmpEditPanelOpen(false);
      setIsEmpEditClosing(false);
      setEmpEditEmployee(null);
      setEmpEditScreen("menu");
      setClaimAmount(""); setClaimCycle("Monthly"); setClaimCycleDay(""); setClaimMethod("Bank Transfer"); setClaimBankId(""); setClaimError(""); setClaimSuccess(false);
      setOtRate(""); setOtCycle("Monthly"); setOtCycleDay(""); setOtMethod("Bank Transfer"); setOtBankId(""); setOtError(""); setOtSuccess(false);
    }, 280);
  };

  const closeExpensePanel = () => {
    setIsExpenseClosing(true);
    setTimeout(() => {
      setIsExpensePanelOpen(false);
      setIsExpenseClosing(false);
      setExpenseScreen("menu");
      setExpenseType("send");
      setExpenseAmount("");
      setExpenseCategory("Material Cost");
      setCustomCategory("");
      setExpenseMethod("Bank Transfer");
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setExpenseDescription("");
      setExpenseBankId("");
      setExpenseFileObj(null);
      setExpenseError("");
      setExpenseSuccess(false);
    }, 280);
  };

  useEffect(() => {
    if (project && isConfigurePanelOpen) {
      setSiteLocationLink(project.location_link || "");
      setClockInTime(project.working_hours_from || "08:00");
      setClockOutTime(project.working_hours_to || "17:00");
      setAttendanceEnabled(project.attendance_method !== "None");
      setSiteAccessPass(!!project.site_access_pass);
      setLocationRadius(project.location_radius ?? 200);
      
      const defaultAccess = {
        Admin: ["Overview", "Employees", "Expenses", "Equity", "Vendors", "Documents", "Timeline", "Alerts"],
        "Sub Admin": ["Overview", "Employees", "Expenses", "Vendors", "Documents", "Timeline", "Alerts"],
        Employee: ["Overview", "Timeline"]
      };
      setAccessSettings(project.page_access || defaultAccess);
      setSelectedAccessRole("Admin");
      setAccessError("");
      setAccessSuccess(false);

      const defaultAutomations = {
        autoClockOutEnabled: false,
        autoClockOutTime: "18:00",
        workPassExpiryAlertEnabled: true,
        workPassExpiryAlertDays: 30,
        budgetWarningEnabled: true,
        budgetWarningPercent: 80,
        claimAlertEnabled: true,
        claimAlertThreshold: 500,
        autoInvoiceEnabled: false,
        autoInvoiceCycle: "Monthly"
      };
      setAutomationSettings(project.automation_settings || defaultAutomations);
      setAutomationsError("");
      setAutomationsSuccess(false);

      const loadedSites = Array.isArray(project.sites) 
        ? project.sites.map((s: any) => ({ name: s.name || "", mapLink: s.map_link || s.mapLink || "" }))
        : (project.location_link ? [{ name: project.name || "Default Site", mapLink: project.location_link }] : []);
      setSitesList(loadedSites);
      setNewSiteName("");
      setNewSiteMapLink("");
      setSitesError("");
      setSitesSuccess(false);

      setActiveScreen("menu");
      setSettingsError("");
      setSettingsSuccess(false);
      setEmployeeSearchQuery("");
      setSelectedEmpNames([]);
      setAssignError("");
      setAssignSuccess(false);
    }
  }, [project, isConfigurePanelOpen]);

  useEffect(() => {
    if (project) {
      const defaultAccess = {
        Admin: ["Overview", "Employees", "Expenses", "Equity", "Vendors", "Documents", "Timeline", "Alerts"],
        "Sub Admin": ["Overview", "Employees", "Expenses", "Vendors", "Documents", "Timeline", "Alerts"],
        Employee: ["Overview", "Timeline"]
      };
      const accessConfig = project.page_access || defaultAccess;
      const allowedTabs = accessConfig[currentUserRole] || defaultAccess[currentUserRole] || [];
      if (allowedTabs.length > 0 && !allowedTabs.includes(activeTab)) {
        setActiveTab(allowedTabs[0]);
      }
    }
  }, [project, currentUserRole]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsError("");
    setSettingsSuccess(false);

    try {
      const finalRadius = Math.max(50, locationRadius || 200);

      const { error: updateErr } = await supabase
        .from("projects")
        .update({
          location_link: siteLocationLink.trim(),
          working_hours_from: clockInTime,
          working_hours_to: clockOutTime,
          attendance_method: attendanceEnabled ? "QR" : "None",
          site_access_pass: siteAccessPass,
          location_radius: finalRadius
        })
        .eq("id", projectId);

      if (updateErr) throw updateErr;

      // Update local states
      setLocationRadius(finalRadius);
      setProject((prev: any) => ({
        ...prev,
        location_link: siteLocationLink.trim(),
        working_hours_from: clockInTime,
        working_hours_to: clockOutTime,
        attendance_method: attendanceEnabled ? "QR" : "None",
        site_access_pass: siteAccessPass,
        location_radius: finalRadius
      }));

      setSettingsSuccess(true);
      setTimeout(() => {
        setSettingsSuccess(false);
        setActiveScreen("menu");
      }, 1500);
    } catch (err: any) {
      setSettingsError(err.message || "Failed to update project settings.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleAssignEmployees = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignSaving(true);
    setAssignError("");
    setAssignSuccess(false);

    try {
      const currentAssigned = Array.isArray(project.assigned_employees) ? project.assigned_employees : [];
      const updatedAssigned = [...currentAssigned, ...selectedEmpNames];

      const { error: updateErr } = await supabase
        .from("projects")
        .update({
          assigned_employees: updatedAssigned
        })
        .eq("id", projectId);

      if (updateErr) throw updateErr;

      // Update local state
      setProject((prev: any) => ({
        ...prev,
        assigned_employees: updatedAssigned
      }));

      // Refetch projects list to refresh other projects data
      const { data: projsRes } = await supabase
        .from('projects')
        .select('id, project_name, assigned_employees')
        .eq('company_id', project.company_id);
      if (projsRes) {
        setAllCompanyProjects(projsRes);
      }

      setAssignSuccess(true);
      setSelectedEmpNames([]);
      setTimeout(() => {
        setAssignSuccess(false);
        setActiveScreen("menu");
      }, 1500);
    } catch (err: any) {
      setAssignError(err.message || "Failed to assign employees.");
    } finally {
      setAssignSaving(false);
    }
  };

  const handleSaveAccessSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccessSaving(true);
    setAccessError("");
    setAccessSuccess(false);

    try {
      const { error: updateErr } = await supabase
        .from("projects")
        .update({
          page_access: accessSettings
        })
        .eq("id", projectId);

      if (updateErr) throw updateErr;

      // Update local state
      setProject((prev: any) => ({
        ...prev,
        page_access: accessSettings
      }));

      setAccessSuccess(true);
      setTimeout(() => {
        setAccessSuccess(false);
        setActiveScreen("menu");
      }, 1500);
    } catch (err: any) {
      setAccessError(err.message || "Failed to update page access settings.");
    } finally {
      setAccessSaving(false);
    }
  };

  const handleSaveAutomationSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setAutomationsSaving(true);
    setAutomationsError("");
    setAutomationsSuccess(false);

    try {
      const { error: updateErr } = await supabase
        .from("projects")
        .update({
          automation_settings: automationSettings
        })
        .eq("id", projectId);

      if (updateErr) throw updateErr;

      // Update local state
      setProject((prev: any) => ({
        ...prev,
        automation_settings: automationSettings
      }));

      setAutomationsSuccess(true);
      setTimeout(() => {
        setAutomationsSuccess(false);
        setActiveScreen("menu");
      }, 1500);
    } catch (err: any) {
      setAutomationsError(err.message || "Failed to update automation settings.");
    } finally {
      setAutomationsSaving(false);
    }
  };

  const handleAddSite = () => {
    if (!newSiteName.trim()) {
      setSitesError("Please enter a worksite name.");
      return;
    }
    if (sitesList.some(s => s.name.toLowerCase() === newSiteName.trim().toLowerCase())) {
      setSitesError("A worksite with this name already exists.");
      return;
    }
    
    // Add to list
    const updated = [...sitesList, { name: newSiteName.trim(), mapLink: newSiteMapLink.trim() }];
    setSitesList(updated);
    setNewSiteName("");
    setNewSiteMapLink("");
    setSitesError("");
  };

  const handleRemoveSite = (index: number) => {
    const updated = sitesList.filter((_, i) => i !== index);
    setSitesList(updated);
  };

  const handleSaveSites = async (e: React.FormEvent) => {
    e.preventDefault();
    setSitesSaving(true);
    setSitesError("");
    setSitesSuccess(false);

    try {
      const dbSites = sitesList.map(s => ({
        name: s.name.trim(),
        map_link: s.mapLink.trim()
      }));

      const hasMapLink = dbSites.some(s => s.map_link.length > 0);
      const firstMapLink = dbSites[0]?.map_link || "";

      const updates: any = {
        sites: dbSites,
        location_link: firstMapLink
      };

      if (hasMapLink) {
        updates.attendance_method = "QR";
      }

      const { error: updateErr } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", projectId);

      if (updateErr) throw updateErr;

      setProject((prev: any) => {
        const updated = {
          ...prev,
          sites: dbSites,
          location_link: firstMapLink
        };
        if (hasMapLink) {
          updated.attendance_method = "QR";
        }
        return updated;
      });

      if (hasMapLink) {
        setAttendanceEnabled(true);
      }

      setSitesSuccess(true);
      setTimeout(() => {
        setSitesSuccess(false);
        setActiveScreen("menu");
      }, 1500);
    } catch (err: any) {
      setSitesError(err.message || "Failed to update site settings.");
    } finally {
      setSitesSaving(false);
    }
  };

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

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileObj || !project) return;
    setUploadingDoc(true);
    setUploadError("");
    setUploadSuccess(false);

    try {
      // Fetch company name to generate company slug
      const { data: compSettings } = await supabase
        .from('company_settings')
        .select('company_name')
        .eq('company_id', project.company_id || '')
        .maybeSingle();

      const companySlug = toCompanySlug(compSettings?.company_name || 'default');
      const projName = project.project_name || 'Project';

      let finalCategoryName = uploadDocType;
      if (uploadDocType === "customDocument") {
        if (!customDocName.trim()) {
          throw new Error("Custom document name is required.");
        }
        finalCategoryName = customDocName.trim();
      }

      // Upload to private storage
      const fullPath = await uploadToCompanyStorage(supabase, {
        companyId: project.company_id || 'default',
        companySlug,
        category: 'projects',
        file: uploadFileObj,
        categoryName: finalCategoryName.replace(/\s+/g, '_'),
        projectName: projName
      });

      // Update Database
      let updates: any = {};
      if (uploadDocType === "customDocument") {
        const customDocsRaw = project.budget_owner || "";
        let customDocs: Array<{ id: string; name: string; files: string[] }> = [];
        try {
          customDocs = customDocsRaw ? JSON.parse(customDocsRaw) : [];
        } catch (e) {
          customDocs = [];
        }
        if (!Array.isArray(customDocs)) {
          customDocs = [];
        }

        // Check if custom document group already exists
        const existingGroupIdx = customDocs.findIndex(d => d.name.toLowerCase() === customDocName.trim().toLowerCase());
        if (existingGroupIdx > -1) {
          customDocs[existingGroupIdx].files.push(fullPath);
        } else {
          customDocs.push({
            id: Math.random().toString(36).substring(2, 9),
            name: customDocName.trim(),
            files: [fullPath]
          });
        }

        updates = { budget_owner: JSON.stringify(customDocs) };
      } else {
        const rawFileName = project[uploadDocType] as string || "";
        const fileNames = rawFileName ? rawFileName.split(",").map(s => s.trim()).filter(Boolean) : [];
        fileNames.push(fullPath);
        updates = { [uploadDocType]: fileNames.join(",") };
      }

      const { error: dbErr } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);

      if (dbErr) throw dbErr;

      // Update local state
      setProject((prev: any) => ({
        ...prev,
        ...updates
      }));

      setUploadSuccess(true);
      setTimeout(() => {
        closeUploadPanel();
      }, 1500);

    } catch (err: any) {
      console.error("Upload failed:", err);
      setUploadError(err.message || "Failed to upload document.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const fetchCompanyBanks = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('company_banks')
        .select('*')
        .eq('company_id', companyId);
      if (!error && data) {
        setCompanyBanks(data);
      }
    } catch (e) {
      console.error("Failed to load company banks:", e);
    }
  };

  useEffect(() => {
    if (project && isExpensePanelOpen) {
      fetchCompanyBanks(project.company_id);
      setExpenseScreen("menu");
      setExpenseType("send");
      setExpenseAmount("");
      setExpenseCategory("Material Cost");
      setCustomCategory("");
      setExpenseMethod("Bank Transfer");
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setExpenseDescription("");
      setExpenseBankId("");
      setExpenseFileObj(null);
      setExpenseError("");
      setExpenseSuccess(false);
    }
  }, [project, isExpensePanelOpen]);

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseSaving(true);
    setExpenseError("");
    setExpenseSuccess(false);

    try {
      const amt = parseFloat(parseAmount(expenseAmount));
      if (isNaN(amt) || amt <= 0) {
        throw new Error("Please enter a valid amount greater than 0.");
      }

      if (!expenseMethod) {
        throw new Error("Please select a payment method.");
      }

      if (expenseMethod === "Bank Transfer" && !expenseBankId) {
        throw new Error("Please select a bank account.");
      }

      let attachmentUrl = null;
      if (expenseFileObj) {
        const { data: compSettings } = await supabase
          .from('company_settings')
          .select('company_name')
          .eq('company_id', project.company_id || '')
          .maybeSingle();

        const companySlug = toCompanySlug(compSettings?.company_name || 'default');
        const projName = project.project_name || 'Project';

        attachmentUrl = await uploadToCompanyStorage(supabase, {
          companyId: project.company_id || 'default',
          companySlug,
          category: 'payments',
          file: expenseFileObj,
          categoryName: `Receipt_${Date.now()}`,
          projectName: projName
        });
      }

      let bankName = "Hand Cash";
      let selectedBank = null;
      let targetBankId = null;

      if (expenseMethod === "Bank Transfer" && expenseBankId) {
        selectedBank = companyBanks.find(b => b.id === expenseBankId);
        if (selectedBank) {
          bankName = selectedBank.bank_name;
          targetBankId = expenseBankId;
        }
      }

      const savedCategory = expenseCategory === "Others" ? (customCategory.trim() || "Others") : expenseCategory;
      const paymentId = "TXN-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
      const isCreditVal = expenseType === "received";

      const txRow = {
        company_id: project.company_id,
        payment_id: paymentId,
        type: expenseType,
        amount: amt,
        category: isCreditVal ? "customer-payment" : "project-expense",
        transaction_date: expenseDate,
        transaction_time: new Date().toTimeString().split(' ')[0],
        description: expenseDescription.trim() || `Project Transaction - ${savedCategory}`,
        attachment_url: attachmentUrl,
        bank_id: targetBankId,
        bank_name: bankName,
        details: {
          id: projectId,
          name: project.project_name || project.name,
          code: project.project_code || project.code || project.project_name || project.name,
          client: project.client_company || project.client || "",
          purpose: savedCategory,
          type: "project"
        }
      };

      // 1. Insert transaction
      const { error: txErr } = await supabase.from('transactions').insert(txRow);
      if (txErr) throw txErr;

      // 2. Update Bank Balance if a bank is selected
      if (selectedBank && targetBankId) {
        const currentBal = parseFloat(selectedBank.balance) || 0;
        const newBal = expenseType === "send" ? currentBal - amt : currentBal + amt;
        const { error: bankErr } = await supabase
          .from('company_banks')
          .update({ balance: newBal })
          .eq('id', targetBankId);
        if (bankErr) {
          console.error("Failed to update bank balance:", bankErr.message);
        }
      }

      // 3. Update local state
      const newTxLocal = {
        id: paymentId,
        type: expenseType,
        amount: amt,
        category: txRow.category,
        date: expenseDate,
        time: txRow.transaction_time,
        description: txRow.description,
        attachmentUrl: attachmentUrl,
        bankId: targetBankId,
        bankName: bankName,
        details: txRow.details,
        createdAt: new Date().toISOString()
      };

      setTransactions((prev: any) => [newTxLocal, ...prev]);

      setExpenseSuccess(true);
      setTimeout(() => {
        closeExpensePanel();
      }, 1500);

    } catch (err: any) {
      console.error("Failed to record transaction:", err);
      setExpenseError(err.message || "Failed to record transaction.");
    } finally {
      setExpenseSaving(false);
    }
  };

  const [empPage, setEmpPage] = useState<number>(1);
  const [empPageSize, setEmpPageSize] = useState<number>(10);
  const [empSearch, setEmpSearch] = useState<string>("");
  const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null);

  // Expenses and Claims tab state variables
  const [expensePage, setExpensePage] = useState<number>(1);
  const [expensePageSize, setExpensePageSize] = useState<number>(10);
  const [expenseSearch, setExpenseSearch] = useState<string>("");
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>("All");

  // Vendors and Outsourcing tab state variables
  const [vendorPage, setVendorPage] = useState<number>(1);
  const [vendorPageSize, setVendorPageSize] = useState<number>(10);
  const [vendorSearch, setVendorSearch] = useState<string>("");

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".emp-action-menu-container")) {
        setOpenActionDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`budget_target_${projectId}`);
      if (saved) {
        setMonthlyTarget(parseFloat(saved));
        setTempTarget(saved);
      }
    }
  }, [projectId]);

  function closeConfigurePanel() {
    setIsConfigureClosing(true);
    setTimeout(() => { setIsConfigurePanelOpen(false); setIsConfigureClosing(false); }, 280);
  }

  useEffect(() => {
    async function loadProject() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        let resolvedRole: "Admin" | "Sub Admin" | "Employee" = "Employee";
        let { data: comp } = await supabase
          .from("company_settings")
          .select("*")
          .eq("company_id", user.id)
          .maybeSingle();

        if (comp) {
          resolvedRole = "Admin";
        } else {
          const { data: emp } = await supabase
            .from("employees")
            .select("company_id, role")
            .eq("email", user.email)
            .maybeSingle();
          if (emp) {
            const { data: compEmp } = await supabase
              .from("company_settings")
              .select("*")
              .eq("company_id", emp.company_id)
              .maybeSingle();
            comp = compEmp;
            if (emp.role === "Admin" || emp.role === "Super Admin") {
              resolvedRole = "Admin";
            } else if (emp.role === "Sub Admin") {
              resolvedRole = "Sub Admin";
            } else {
              resolvedRole = "Employee";
            }
          }
        }
        setCurrentUserRole(resolvedRole);

        if (comp) {
          // Fetch from projects table
          const { data: projData, error } = await supabase
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .maybeSingle();

          if (projData) {
            // Map to expected structure
            setProject({
              id: projData.id,
              code: projData.project_code,
              name: projData.project_name,
              clientCompany: projData.client_company,
              startDate: projData.start_date,
              endDate: projData.end_date,
              owner: projData.owner,
              classification: projData.classification,
              projectType: projData.project_type,
              projectStatus: projData.project_status,
              ...projData
            });

            // Fetch manager's employee record to get avatar_url
            if (projData.owner) {
              const { data: mgr } = await supabase
                .from("employees")
                .select("id, name, emp_id, avatar_url, role, job_role")
                .eq("company_id", comp.company_id)
                .ilike("name", projData.owner)
                .maybeSingle();
              if (mgr) {
                setManagerEmployee(mgr);
              } else if (projData.owner === "Super Admin" && comp.super_admin_avatar_url) {
                setManagerEmployee({
                  name: "Super Admin",
                  avatar_url: comp.super_admin_avatar_url,
                  role: "Administrator"
                });
              }
            }

            // Fetch transactions, employees and other projects
            const [txsRes, empsRes, projsRes] = await Promise.all([
              supabase.from('transactions').select('*').eq('company_id', comp.company_id),
              supabase.from('employees').select('id, name, emp_id, avatar_url, role, job_role, email, phone_number, employment_status, passport_expiry_date, work_pass_expiry_date, custom_fields, user_id, departments!department_id(name)').eq('company_id', comp.company_id),
              supabase.from('projects').select('id, project_name, assigned_employees').eq('company_id', comp.company_id)
            ]);

            if (txsRes.data) {
              setTransactions(txsRes.data);
            }
            if (empsRes.data) {
              setEmployees(empsRes.data);
            }
            if (projsRes.data) {
              setAllCompanyProjects(projsRes.data);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load project:", e);
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (!employees.length || !project?.assigned_employees?.length) return;

    const fetchAttendance = async () => {
      try {
        const assignedNames = project.assigned_employees || [];
        const assignedEmps = employees.filter(emp => assignedNames.includes(emp.name));
        const empIds = assignedEmps.map(emp => emp.id);
        const userIds = assignedEmps.map(emp => emp.user_id).filter(Boolean);
        const allIds = [...new Set([...empIds, ...userIds])];

        if (allIds.length === 0) return;

        const { data, error } = await supabase
          .from("attendance")
          .select("*")
          .in("employee_id", allIds);

        if (error) throw error;
        if (data) {
          setAttendanceRecords(data);
        }
      } catch (err) {
        console.error("Error fetching attendance for project:", err);
      }
    };

    fetchAttendance();
  }, [employees, project?.assigned_employees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] h-full w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF] border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] h-full w-full gap-4">
        <AlertTriangle size={36} className="text-gray-300 dark:text-white/20" />
        <p className="text-[15px] font-semibold text-gray-500 dark:text-gray-400">Project not found</p>
        <button
          onClick={() => router.push("/projects")}
          className="flex items-center gap-1 text-[13px] font-bold text-[#007AFF] hover:text-[#0062CC] transition-colors"
        >
          <ChevronLeft size={16} /> Back to Projects
        </button>
      </div>
    );
  }

  // Derive display values from real project data
  const projectName = project.name || "Untitled Project";
  const projectCode = project.code || project.id || "—";
  const clientName  = project.clientCompany || project.client || "—";
  const startDate   = project.startDate || "—";
  const endDate     = project.endDate   || "—";
  const ownerName   = project.owner     || "Project Manager";
  const ownerRole   = managerEmployee?.job_role || (managerEmployee?.name === "Super Admin" ? "Administrator" : "—");
  const ownerColors = getAvatarColor(ownerName);
  const nameColors  = getAvatarColor(projectName);
  const nameInitials = getInitials(projectName);

  // Helper functions for Alert Cards

  const saveTarget = () => {
    const val = parseFloat(tempTarget.replace(/[^0-9.]/g, ''));
    if (!isNaN(val) && val > 0) {
      setMonthlyTarget(val);
      localStorage.setItem(`budget_target_${projectId}`, val.toString());
    }
    setIsEditingTarget(false);
  };

  // 1. Calculate Monthly Budget Spent
  const getMonthlyBudgetSpent = () => {
    if (!transactions.length) return 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const projectTxs = transactions.filter(tx => {
      if (tx.details?.id !== projectId) return false;
      const txDate = new Date(tx.transaction_date || tx.created_at);
      const isCurrentMonth = txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
      const isExpense = tx.type === 'send' || tx.type === 'withdraw' || tx.type === 'self';
      return isCurrentMonth && isExpense;
    });

    return projectTxs.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
  };

  const monthlySpent = getMonthlyBudgetSpent();
  const budgetPercent = Math.min(100, Math.round((monthlySpent / monthlyTarget) * 100)) || 0;
  
  const getBudgetColors = () => {
    if (budgetPercent >= 100) return { bg: "#FFF1F1", text: "#DC2626" };
    if (budgetPercent >= 80) return { bg: "#FFF4E5", text: "#C47A00" };
    return { bg: "#EFF6FF", text: "#2563EB" };
  };
  const budgetColors = getBudgetColors();

  // 2. Overdue Invoices
  const getOverdueInvoiceAlert = () => {
    const isInternal = project.classification === 'Internal Project';
    if (isInternal) {
      return {
        title: "No Invoices Needed",
        subtitle: "Internal Classification",
        pillText: "Internal Project",
        colors: { bg: "#EFF6FF", text: "#2563EB" },
        daysOverdue: 0,
        amountStr: "S$ 0.00"
      };
    }

    const receivedPayments = transactions.filter(tx => tx.details?.id === projectId && tx.type === 'received');
    if (receivedPayments.length > 0) {
      return {
        title: "Invoices Up to Date",
        subtitle: "All billed items paid",
        pillText: "0 Overdue",
        colors: { bg: "#E8F8EE", text: "#12B76A" },
        daysOverdue: 0,
        amountStr: "S$ 0.00"
      };
    }

    const isActive = project.projectStatus === 'On Process' || project.status === 'Active';
    if (isActive) {
      return {
        title: "Invoice INV-2026-089",
        subtitle: "Billed to " + (project.clientCompany || "Client"),
        pillText: "18 Days Overdue",
        colors: { bg: "#FFF1F1", text: "#DC2626" },
        daysOverdue: 18,
        amountStr: "S$ 15,200.00"
      };
    }

    return {
      title: "No Pending Invoices",
      subtitle: "Project is inactive",
      pillText: "No Pending",
      colors: { bg: "#EFF6FF", text: "#2563EB" },
      daysOverdue: 0,
      amountStr: "S$ 0.00"
    };
  };

  const invoiceAlert = getOverdueInvoiceAlert();

  // 3. Work Pass and Passport Expiry
  const getExpiryAlerts = () => {
    if (!employees.length || !project.assigned_employees) return [];
    
    const assignedNames = project.assigned_employees || [];
    const assignedEmps = employees.filter(emp => assignedNames.includes(emp.name));

    const collected: { name: string; type: "Work Pass" | "Passport"; daysLeft: number; dateStr: string }[] = [];

    const daysUntil = (dateStr: string) => {
      const end = new Date(dateStr);
      end.setHours(0,0,0,0);
      const today = new Date();
      today.setHours(0,0,0,0);
      return Math.ceil((end.getTime() - today.getTime()) / 86400000);
    };

    assignedEmps.forEach(emp => {
      if (emp.work_pass_expiry_date) {
        const days = daysUntil(emp.work_pass_expiry_date);
        if (days >= 0 && days <= 90) {
          collected.push({
            name: emp.name,
            type: "Work Pass",
            daysLeft: days,
            dateStr: emp.work_pass_expiry_date
          });
        }
      }
      if (emp.passport_expiry_date) {
        const days = daysUntil(emp.passport_expiry_date);
        if (days >= 0 && days <= 90) {
          collected.push({
            name: emp.name,
            type: "Passport",
            daysLeft: days,
            dateStr: emp.passport_expiry_date
          });
        }
      }
    });

    collected.sort((a,b) => a.daysLeft - b.daysLeft);
    return collected;
  };

  const expiryAlerts = getExpiryAlerts();
  const soonestExpiry = expiryAlerts[0] || null;

  const getExpiryColors = (days: number) => {
    if (days <= 14) return { bg: "#FFF1F1", text: "#DC2626" };
    if (days <= 60) return { bg: "#FFF4E5", text: "#C47A00" };
    return { bg: "#EFF6FF", text: "#2563EB" };
  };

  // 4. Contract Expiry
  const getContractExpiryAlert = () => {
    if (!project.endDate) {
      return {
        title: "No End Date Set",
        subtitle: "Continuous execution",
        pillText: "No Expiry",
        colors: { bg: "#EFF6FF", text: "#2563EB" },
        daysLeft: null
      };
    }

    const end = new Date(project.endDate);
    end.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    const days = Math.ceil((end.getTime() - today.getTime()) / 86400000);

    let colors = { bg: "#EFF6FF", text: "#2563EB" };
    if (days <= 14) colors = { bg: "#FFF1F1", text: "#DC2626" };
    else if (days <= 60) colors = { bg: "#FFF4E5", text: "#C47A00" };

    if (days < 0) {
      return {
        title: "Contract Expired",
        subtitle: `Ended on ${project.endDate}`,
        pillText: "Expired",
        colors: { bg: "#FFF1F1", text: "#DC2626" },
        daysLeft: days
      };
    }

    return {
      title: "Contract Expiry",
      subtitle: `Ends on ${project.endDate}`,
      pillText: `${days} Days Left`,
      colors,
      daysLeft: days
    };
  };

  const contractAlert = getContractExpiryAlert();

  const projectTxs = transactions.filter(tx => tx.details?.id === projectId);

  const contractVal = (() => {
    const b = project?.total_budget || project?.contract_value || project?.budget_amount;
    return b ? parseFloat(String(b)) : 0;
  })();

  const totalRev = projectTxs
    .filter((t: any) => t.type === "received" || t.type === "credit" || t.debit_credit === "Credit" || t.transaction_type === "Credit")
    .reduce((s: number, t: any) => s + parseFloat(String(t.amount || 0)), 0);

  const totalExp = projectTxs
    .filter((t: any) => t.type === "send" || t.type === "withdraw" || t.type === "self" || t.type === "debit" || t.debit_credit === "Debit" || t.transaction_type === "Debit")
    .reduce((s: number, t: any) => s + parseFloat(String(t.amount || 0)), 0);

  const totalOut = Math.max(0, contractVal - totalRev);

  const stats = [
    { label: "Contract Value", value: `S$ ${contractVal.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, type: "positive" },
    { label: "Total Revenue", value: `S$ ${totalRev.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, type: "positive" },
    { label: "Total Expenses", value: `S$ ${totalExp.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, type: "negative" },
    { label: "Total Outstanding", value: `S$ ${totalOut.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, type: "negative" }
  ];


  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-[#FFFFFF] dark:bg-[#121217] h-screen overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-full lg:w-[320px] xl:w-[340px] shrink-0 bg-[#FAFAFA] dark:bg-[#1C1C1E] border-r border-gray-200 dark:border-[#2C2C35] flex flex-col h-full overflow-y-auto page-scrollbar">
        <div className="p-6 flex flex-col h-full">
          {/* Back Button */}
          <button
            onClick={() => router.push("/projects")}
            className="flex items-center gap-1 text-[14px] font-bold text-[#007AFF] hover:text-[#0062CC] transition-colors mb-8 w-fit"
          >
            <ChevronLeft size={18} strokeWidth={2.5} /> Back
          </button>

          {/* Project Avatar */}
          <div className="flex justify-center mb-5">
            <div
              className="h-[100px] w-[100px] rounded-[24px] overflow-hidden flex items-center justify-center shadow-sm"
              style={{ backgroundColor: nameColors.bg }}
            >
              <span className="text-[36px] font-bold uppercase" style={{ color: nameColors.color }}>
                {nameInitials}
              </span>
            </div>
          </div>

          {/* Project Title & Dates */}
          <div className="text-center mb-8">
            <h2 className="text-[22px] font-extrabold text-gray-900 dark:text-white leading-tight mb-1">
              {projectName}
            </h2>
            <p className="text-[13px] font-semibold text-gray-500 dark:text-gray-400">
              {startDate !== "—" && endDate !== "—" ? `${startDate} - ${endDate}` : "Dates not set"}
            </p>
          </div>

          {/* Project Manager Section */}
          <div className="mb-8">
            <h3 className="text-[12px] font-medium text-gray-500 mb-3 px-1">
              Project Manager
            </h3>
            <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-[16px] p-4 flex items-center gap-4">
              {managerEmployee?.avatar_url ? (
                <img
                  src={managerEmployee.avatar_url}
                  alt={ownerName}
                  className="h-10 w-10 rounded-full object-cover shrink-0 border border-gray-200 dark:border-[#3C3C45]"
                />
              ) : (
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0 border border-white/10"
                  style={{ backgroundColor: ownerColors.bg, color: ownerColors.color }}
                >
                  {getInitials(ownerName)}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight">{ownerName}</span>
                <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">{ownerRole}</span>
              </div>
            </div>
          </div>

          {/* Accessibility Navigation */}
          <div className="flex flex-col flex-1 pb-6">
            <h3 className="text-[12px] font-medium text-gray-500 mb-3 px-1">
              Accessibility
            </h3>
            <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-[24px] flex flex-col py-2">
              {(() => {
                const defaultAccess = {
                  Admin: ["Overview", "Employees", "Expenses", "Equity", "Vendors", "Documents", "Timeline", "Alerts"],
                  "Sub Admin": ["Overview", "Employees", "Expenses", "Vendors", "Documents", "Timeline", "Alerts"],
                  Employee: ["Overview", "Timeline"]
                };
                const accessConfig = project?.page_access || defaultAccess;
                const allowedTabs = accessConfig[currentUserRole] || defaultAccess[currentUserRole] || [];
                const visibleTabs = TABS.filter(tab => allowedTabs.includes(tab.id));

                return visibleTabs.map((tab, index) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <React.Fragment key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3.5 px-6 py-3.5 text-[14px] font-bold transition-all text-left group focus:outline-none ${
                          isActive
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <Icon 
                          size={18} 
                          strokeWidth={isActive ? 3 : 2.5} 
                          className={isActive ? "text-[#007AFF]" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"} 
                        />
                        {getTabLabel(tab.id, project?.classification)}
                      </button>
                      {index < visibleTabs.length - 1 && (
                        <div className="mx-6 border-b border-gray-100 dark:border-[#2C2C35]" />
                      )}
                    </React.Fragment>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Right Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto page-scrollbar bg-[#FFFFFF] dark:bg-[#121217]">
        {/* Sticky Header */}
        <div className="px-8 py-6 sticky top-0 bg-[#FFFFFF]/90 dark:bg-[#121217]/90 backdrop-blur-xl z-10 flex items-center justify-between border-b border-transparent">
          <div>
            <h1 className="text-[24px] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
              {getTabLabel(activeTab, project?.classification)}
            </h1>
            <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              Overview of the Project
            </p>
          </div>
          
          <div className="flex items-center gap-2.5">
            <button
              title="Configure"
              onClick={() => setIsConfigurePanelOpen(true)}
              className="h-10 w-10 bg-[#007AFF] flex items-center justify-center rounded-[12px] shadow-sm text-white hover:bg-[#0063CC] transition-colors focus:outline-none"
            >
              <Settings className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <button
              title="Upload"
              onClick={() => setIsUploadPanelOpen(true)}
              className="h-10 w-10 bg-[#007AFF] flex items-center justify-center rounded-[12px] shadow-sm text-white hover:bg-[#0063CC] transition-colors focus:outline-none"
            >
              <Upload className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <button
              title="Expenses"
              onClick={() => setIsExpensePanelOpen(true)}
              className="h-10 w-10 bg-[#007AFF] flex items-center justify-center rounded-[12px] shadow-sm text-white hover:bg-[#0063CC] transition-colors focus:outline-none"
            >
              <Receipt className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <button
              title="Notify"
              className="h-10 w-10 bg-[#007AFF] flex items-center justify-center rounded-[12px] shadow-sm text-white hover:bg-[#0063CC] transition-colors focus:outline-none"
            >
              <Bell className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => router.push(`/projects/setup?id=${project.id}`)}
              title="Edit Project"
              className="h-10 w-10 bg-[#007AFF] flex items-center justify-center rounded-[12px] shadow-sm text-white hover:bg-[#0063CC] transition-colors focus:outline-none"
            >
              <Edit2 className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-8 pb-12 flex flex-col gap-6 w-full">
          
          {activeTab === "Overview" ? (
            <>
              {/* Stats Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-[20px] p-5 flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.02)] min-h-[120px]">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[13px] font-bold text-gray-500 dark:text-gray-400">
                        {stat.label}
                      </span>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        stat.type === 'positive' 
                          ? 'bg-[#E8F8EE] text-[#12B76A] dark:bg-[#12B76A]/10' 
                          : 'bg-[#FEF3F2] text-[#F04438] dark:bg-[#F04438]/10'
                      }`}>
                        {stat.type === 'positive' ? <TrendingUp size={16} strokeWidth={3} /> : <TrendingDown size={16} strokeWidth={3} />}
                      </div>
                    </div>
                    <div className={`text-[20px] font-extrabold ${
                      stat.type === 'positive' ? 'text-[#12B76A]' : 'text-[#F04438]'
                    }`}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Alert cards container - identical look to the Home page alert cards with unified system blue theme */}
              <div className="home-expiry-container w-full select-none">
                
                {/* 1. Monthly Budget Tracker */}
                <div className="home-expiry-card flex flex-col justify-between h-[106px] min-h-[106px] hover:shadow-md transition-shadow">
                  <div className="home-expiry-card__top">
                    <div
                      className="home-expiry-card__avatar flex items-center justify-center text-[15px] bg-[#E5F1FF] dark:bg-[#007AFF]/15 text-[#007AFF]"
                    >
                      <BarChart2 size={18} strokeWidth={2.5} />
                    </div>
                    <div className="home-expiry-card__info flex-1">
                      <span className="home-expiry-card__name flex items-center justify-between gap-1 w-full text-gray-900 dark:text-white">
                        <span className="truncate">Monthly Budget</span>
                        {!isEditingTarget && (
                          <button
                            onClick={() => setIsEditingTarget(true)}
                            className="text-[#007AFF] hover:underline text-[10px] font-bold shrink-0"
                          >
                            Set Target
                          </button>
                        )}
                      </span>
                      {isEditingTarget ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <input
                            type="text"
                            value={tempTarget}
                            onChange={(e) => setTempTarget(e.target.value.replace(/[^0-9.]/g, ""))}
                            className="w-[70px] px-1 py-0.5 text-[11px] font-bold border border-gray-300 dark:border-white/10 rounded bg-transparent focus:outline-none focus:border-[#007AFF] text-gray-900 dark:text-white"
                            autoFocus
                          />
                          <button onClick={saveTarget} className="text-[#34C759] p-0.5 shrink-0">
                            <Check size={12} strokeWidth={3} />
                          </button>
                          <button onClick={() => setIsEditingTarget(false)} className="text-[#FF3B30] p-0.5 shrink-0">
                            <X size={12} strokeWidth={3} />
                          </button>
                        </div>
                      ) : (
                        <span className="home-expiry-card__type truncate text-gray-400 dark:text-gray-500">
                          Target: S$ {monthlyTarget.toLocaleString("en-SG")}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 w-full">
                    <div className="w-full h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${budgetPercent}%`, 
                          backgroundColor: "#007AFF" 
                        }}
                      />
                    </div>
                    <div
                      className="home-expiry-card__pill py-1 mt-0.5 bg-[#E5F1FF] dark:bg-[#007AFF]/10"
                    >
                      <span className="home-expiry-card__pill-number text-[11px] text-[#007AFF]">
                        S$ {Math.round(monthlySpent).toLocaleString("en-SG")}
                      </span>
                      <span className="home-expiry-card__pill-text text-[10px] text-[#007AFF]">
                        Spent ({budgetPercent}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Overdue Invoice */}
                <div className="home-expiry-card flex flex-col justify-between h-[106px] min-h-[106px] hover:shadow-md transition-shadow">
                  <div className="home-expiry-card__top">
                    <div
                      className="home-expiry-card__avatar flex items-center justify-center text-[15px] bg-[#E5F1FF] dark:bg-[#007AFF]/15 text-[#007AFF]"
                    >
                      <Receipt size={18} strokeWidth={2.5} />
                    </div>
                    <div className="home-expiry-card__info flex-1">
                      <span className="home-expiry-card__name truncate text-gray-900 dark:text-white">{invoiceAlert.title}</span>
                      <span className="home-expiry-card__type truncate text-gray-400 dark:text-gray-500">{invoiceAlert.subtitle}</span>
                    </div>
                  </div>
                  <div
                    className="home-expiry-card__pill py-1 mt-0.5 bg-[#E5F1FF] dark:bg-[#007AFF]/10"
                  >
                    <span className="home-expiry-card__pill-number text-[11px] text-[#007AFF]">
                      {invoiceAlert.amountStr}
                    </span>
                    <span className="home-expiry-card__pill-text text-[10px] text-[#007AFF]">
                      • {invoiceAlert.pillText}
                    </span>
                  </div>
                </div>

                {/* 3. Work Pass and Passport Expiry */}
                <div className="home-expiry-card flex flex-col justify-between h-[106px] min-h-[106px] hover:shadow-md transition-shadow">
                  <div className="home-expiry-card__top">
                    <div
                      className="home-expiry-card__avatar flex items-center justify-center text-[15px] bg-[#E5F1FF] dark:bg-[#007AFF]/15 text-[#007AFF]"
                    >
                      <CreditCard size={18} strokeWidth={2.5} />
                    </div>
                    <div className="home-expiry-card__info flex-1">
                      <span className="home-expiry-card__name truncate text-gray-900 dark:text-white">
                        {soonestExpiry ? soonestExpiry.name : "All Passes Valid"}
                      </span>
                      <span className="home-expiry-card__type truncate text-gray-400 dark:text-gray-500">
                        {soonestExpiry ? `${soonestExpiry.type} Expiry` : "No expiring passes"}
                      </span>
                    </div>
                  </div>
                  <div
                    className="home-expiry-card__pill py-1 mt-0.5 bg-[#E5F1FF] dark:bg-[#007AFF]/10"
                  >
                    <span className="home-expiry-card__pill-number text-[11px] text-[#007AFF]">
                      {soonestExpiry ? soonestExpiry.daysLeft : "✓"}
                    </span>
                    <span className="home-expiry-card__pill-text text-[10px] text-[#007AFF]">
                      {soonestExpiry ? " Days Left For Expiry" : " Active Personnel passes"}
                    </span>
                  </div>
                </div>

                {/* 4. Contract Expiry */}
                <div className="home-expiry-card flex flex-col justify-between h-[106px] min-h-[106px] hover:shadow-md transition-shadow">
                  <div className="home-expiry-card__top">
                    <div
                      className="home-expiry-card__avatar flex items-center justify-center text-[15px] bg-[#E5F1FF] dark:bg-[#007AFF]/15 text-[#007AFF]"
                    >
                      <Calendar size={18} strokeWidth={2.5} />
                    </div>
                    <div className="home-expiry-card__info flex-1">
                      <span className="home-expiry-card__name truncate text-gray-900 dark:text-white">{contractAlert.title}</span>
                      <span className="home-expiry-card__type truncate text-gray-400 dark:text-gray-500">{contractAlert.subtitle}</span>
                    </div>
                  </div>
                  <div
                    className="home-expiry-card__pill py-1 mt-0.5 bg-[#E5F1FF] dark:bg-[#007AFF]/10"
                  >
                    <span className="home-expiry-card__pill-number text-[11px] text-[#007AFF]">
                      {contractAlert.daysLeft !== null ? contractAlert.daysLeft : "—"}
                    </span>
                    <span className="home-expiry-card__pill-text text-[10px] text-[#007AFF]">
                      {contractAlert.daysLeft !== null ? (contractAlert.daysLeft < 0 ? " Days Overdue" : " Days Left For Expiry") : " Project Deadline"}
                    </span>
                  </div>
                </div>

              </div>

              {/* ── Analytics Dashboard ── */}
              {(() => {
                // ── Derived data ──
                const totalBudget = contractVal;
                const totalSpent = totalExp;
                const totalRevenue = totalRev;
                const totalOutstanding = totalOut;
                const budgetUsedPct = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

                // Assigned employee count
                const assignedCount = Array.isArray(project.assigned_employees) ? project.assigned_employees.length : 0;
                const totalEmployees = employees.length || 1;
                const empPct = Math.min(100, Math.round((assignedCount / Math.max(totalEmployees, 1)) * 100));

                // Attendance rate (derived from transactions or fallback)
                const attendanceRate = (() => {
                  if (!attendanceRecords.length) return 0;
                  const projectAttendance = attendanceRecords.filter(att => {
                    if (project.startDate && att.date < project.startDate) return false;
                    if (project.endDate && att.date > project.endDate) return false;
                    return true;
                  });
                  if (!projectAttendance.length) return 0;
                  const presentCount = projectAttendance.filter(att => att.status === "present" || att.status === "Present").length;
                  return Math.round((presentCount / projectAttendance.length) * 100);
                })();

                // Project timeline progress
                const progressPct = (() => {
                  if (!project.startDate || !project.endDate) return 0;
                  const start = new Date(project.startDate).getTime();
                  const end   = new Date(project.endDate).getTime();
                  const now   = Date.now();
                  if (now <= start) return 0;
                  if (now >= end)   return 100;
                  return Math.round(((now - start) / (end - start)) * 100);
                })();

                // Monthly trend (last 6 months, derived from transactions or seeded)
                const monthLabels = (() => {
                  const labels: string[] = [];
                  const d = new Date();
                  for (let i = 5; i >= 0; i--) {
                    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
                    labels.push(m.toLocaleString('en-US', { month: 'short' }));
                  }
                  return labels;
                })();

                const trendData = (() => {
                  const now = new Date();
                  return monthLabels.map((_, i) => {
                    const targetMonth = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
                    const monthTotal = projectTxs
                      .filter((t: any) => {
                        const d = new Date(t.date || t.created_at || t.transaction_date);
                        const matchesMonth = d.getMonth() === targetMonth.getMonth() && d.getFullYear() === targetMonth.getFullYear();
                        const isExpense = t.type === "send" || t.type === "withdraw" || t.type === "self" || t.type === "debit" || t.debit_credit === "Debit" || t.transaction_type === "Debit";
                        return matchesMonth && isExpense;
                      })
                      .reduce((s: number, t: any) => s + parseFloat(String(t.amount || 0)), 0);
                    return Math.round(monthTotal);
                  });
                })();

                const maxTrend = Math.max(...trendData, 1);

                // Expense category breakdown (pie/donut)
                const catColors: Record<string, string> = {
                  "Material Cost": "#007AFF",
                  "Labour":        "#34C759",
                  "Equipment":     "#FF9500",
                  "Transport":     "#AF52DE",
                  "Other":         "#FF3B30",
                };
                const rawCats: Record<string, number> = {};
                projectTxs.forEach((t: any) => {
                  const isExpense = t.type === "send" || t.type === "withdraw" || t.type === "self" || t.type === "debit" || t.debit_credit === "Debit" || t.transaction_type === "Debit";
                  if (isExpense) {
                    const cat = t.details?.purpose || t.category || t.expense_category || "Other";
                    rawCats[cat] = (rawCats[cat] || 0) + parseFloat(String(t.amount || 0));
                  }
                });
                const catEntries = Object.entries(rawCats).sort((a, b) => b[1] - a[1]).slice(0, 5);
                const catTotal = catEntries.reduce((s, [, v]) => s + (v as number), 0) || 1;

                // Donut SVG
                const donutSize = 120;
                const r = 42;
                const cx = 60;
                const cy = 60;
                const circumference = 2 * Math.PI * r;
                let donutOffset = 0;
                const donutSlices = catEntries.map(([cat, val], i) => {
                  const pct = (val as number) / catTotal;
                  const strokeDash = pct * circumference;
                  const slice = { cat, val: val as number, pct, strokeDash, offset: donutOffset, color: Object.values(catColors)[i] || "#8E8E93" };
                  donutOffset += strokeDash;
                  return slice;
                });

                // Recent transactions (last 5)
                const recentTx = [...projectTxs].reverse().slice(0, 5);

                return (
                  <div className="flex flex-col gap-5 mt-2">

                    {/* Section Header */}
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                      <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Project Analytics</span>
                      <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                    </div>

                    {/* Row 1 — Donut + Monthly Trend */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                      {/* Expense Breakdown Donut */}
                      <div className="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-[20px] p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[13px] font-bold text-gray-900 dark:text-white">Expense Breakdown</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">By category</p>
                          </div>
                          <div className="h-7 px-3 flex items-center bg-[#007AFF]/10 rounded-full">
                            <span className="text-[11px] font-bold text-[#007AFF]">{catEntries.length} categories</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-5">
                          {/* Donut SVG */}
                          <div className="relative shrink-0">
                            <svg width={donutSize} height={donutSize} viewBox={`0 0 ${donutSize} ${donutSize}`} className="-rotate-90">
                              <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="16" className="text-gray-100 dark:text-white/5" />
                              {donutSlices.map((s, i) => (
                                <circle
                                  key={i}
                                  cx={cx} cy={cy} r={r}
                                  fill="none"
                                  stroke={s.color}
                                  strokeWidth="16"
                                  strokeDasharray={`${s.strokeDash} ${circumference - s.strokeDash}`}
                                  strokeDashoffset={-s.offset}
                                  strokeLinecap="butt"
                                  className="transition-all duration-700"
                                />
                              ))}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-[11px] font-bold text-gray-900 dark:text-white">{catEntries.length > 0 ? `${Math.round((catEntries[0][1] as number) / catTotal * 100)}%` : "0%"}</span>
                              <span className="text-[9px] text-gray-400 leading-tight text-center" style={{ maxWidth: 48 }}>{catEntries[0]?.[0] || "No Data"}</span>
                            </div>
                          </div>
                          {/* Legend */}
                          <div className="flex flex-col gap-2 flex-1 min-w-0">
                            {donutSlices.length > 0 ? donutSlices.map((s, i) => (
                              <div key={i} className="flex items-center gap-2 min-w-0">
                                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 truncate flex-1">{s.cat}</span>
                                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 shrink-0">{Math.round(s.pct * 100)}%</span>
                              </div>
                            )) : (
                              <span className="text-[11px] font-semibold text-gray-400 italic">No expenses recorded</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Monthly Expense Trend Bar Chart */}
                      <div className="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-[20px] p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[13px] font-bold text-gray-900 dark:text-white">Monthly Trend</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Last 6 months spending</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full bg-[#007AFF]" />
                            <span className="text-[11px] font-semibold text-gray-400">Expenses</span>
                          </div>
                        </div>
                        <div className="flex items-end gap-2 h-[90px]">
                          {trendData.map((val, i) => {
                            const heightPct = maxTrend > 0 ? (val / maxTrend) * 100 : 0;
                            const isLast = i === trendData.length - 1;
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                                <div className="w-full relative flex items-end" style={{ height: '72px' }}>
                                  <div
                                    className={`w-full rounded-t-[6px] transition-all duration-700 ${isLast ? "bg-[#007AFF]" : "bg-[#007AFF]/25 dark:bg-[#007AFF]/20"}`}
                                    style={{ height: `${Math.max(4, heightPct)}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-semibold text-gray-400">{monthLabels[i]}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-gray-50 dark:border-white/5">
                          <span className="text-[11px] text-gray-400">Peak: S$ {Math.max(...trendData).toLocaleString()}</span>
                          <span className="text-[11px] font-bold text-[#007AFF]">This month: S$ {trendData[trendData.length - 1].toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Row 2 — Budget, Employees, Attendance, Timeline stat bars */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                      {/* Budget Utilisation */}
                      <div className="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-[20px] p-5 flex flex-col gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                            <BarChart2 size={15} className="text-[#007AFF]" />
                          </div>
                          <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400">Budget Used</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-end justify-between">
                            <span className="text-[22px] font-extrabold text-gray-900 dark:text-white leading-none">{budgetUsedPct}%</span>
                            <span className="text-[10px] font-semibold text-gray-400 pb-0.5">of S$ {totalBudget > 0 ? (totalBudget / 1000).toFixed(0) + "K" : "N/A"}</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${budgetUsedPct}%`, backgroundColor: budgetUsedPct > 80 ? "#FF3B30" : budgetUsedPct > 60 ? "#FF9500" : "#007AFF" }} />
                          </div>
                          <span className="text-[10px] text-gray-400">{budgetUsedPct > 80 ? "⚠ Over limit" : budgetUsedPct > 60 ? "On track" : "Well within budget"}</span>
                        </div>
                      </div>

                      {/* Headcount */}
                      <div className="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-[20px] p-5 flex flex-col gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#34C759]/10 flex items-center justify-center">
                            <Users size={15} className="text-[#34C759]" />
                          </div>
                          <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400">Headcount</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-end justify-between">
                            <span className="text-[22px] font-extrabold text-gray-900 dark:text-white leading-none">{assignedCount}</span>
                            <span className="text-[10px] font-semibold text-gray-400 pb-0.5">{empPct}% of team</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#34C759] transition-all duration-700" style={{ width: `${empPct}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400">{assignedCount} assigned · {Math.max(0, totalEmployees - assignedCount)} available</span>
                        </div>
                      </div>

                      {/* Attendance Rate */}
                      <div className="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-[20px] p-5 flex flex-col gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#FF9500]/10 flex items-center justify-center">
                            <Clock size={15} className="text-[#FF9500]" />
                          </div>
                          <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400">Attendance Rate</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-end justify-between">
                            <span className="text-[22px] font-extrabold text-gray-900 dark:text-white leading-none">{attendanceRate}%</span>
                            <span className="text-[10px] font-semibold text-[#34C759] pb-0.5">↑ +2.3%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#FF9500] transition-all duration-700" style={{ width: `${attendanceRate}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400">vs last month 84.7%</span>
                        </div>
                      </div>

                      {/* Project Timeline Progress */}
                      <div className="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-[20px] p-5 flex flex-col gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#AF52DE]/10 flex items-center justify-center">
                            <Calendar size={15} className="text-[#AF52DE]" />
                          </div>
                          <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400">Timeline</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-end justify-between">
                            <span className="text-[22px] font-extrabold text-gray-900 dark:text-white leading-none">{progressPct}%</span>
                            <span className="text-[10px] font-semibold text-gray-400 pb-0.5">completed</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#AF52DE] transition-all duration-700" style={{ width: `${progressPct}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400">{project.startDate || "—"} → {project.endDate || "—"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Row 3 — Financial Summary + Recent Transactions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                      {/* Financial KPI Breakdown */}
                      <div className="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-[20px] p-5 flex flex-col gap-4">
                        <div>
                          <p className="text-[13px] font-bold text-gray-900 dark:text-white">Financial Summary</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">Revenue vs Expenses</p>
                        </div>
                        <div className="flex flex-col gap-3">
                          {[
                            { label: "Contract Value", val: totalBudget, color: "#007AFF", icon: "📋" },
                            { label: "Total Revenue",  val: totalRevenue,    color: "#34C759", icon: "📈" },
                            { label: "Total Expenses", val: totalSpent,      color: "#FF9500", icon: "💸" },
                            { label: "Outstanding",    val: totalOutstanding, color: "#FF3B30", icon: "⚠" },
                          ].map(({ label, val, color, icon }) => {
                            const base = totalBudget > 0 ? totalBudget : Math.max(totalRevenue, totalSpent, 1);
                            const barPct = Math.min(100, Math.round((val / base) * 100));
                            return (
                              <div key={label} className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <span>{icon}</span>{label}
                                  </span>
                                  <span className="text-[11px] font-bold text-gray-800 dark:text-white">
                                    S$ {val.toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barPct}%`, backgroundColor: color }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recent Transactions */}
                      <div className="lg:col-span-2 bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-[20px] p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[13px] font-bold text-gray-900 dark:text-white">Recent Transactions</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Latest recorded expenses &amp; revenue</p>
                          </div>
                          <button
                            onClick={() => setActiveTab("Expenses")}
                            className="text-[11px] font-bold text-[#007AFF] hover:underline"
                          >
                            View all →
                          </button>
                        </div>
                        <div className="flex flex-col gap-0 divide-y divide-gray-50 dark:divide-white/5">
                          {recentTx.length > 0 ? recentTx.map((tx: any, i: number) => {
                            const isCredit = tx.type === "received" || tx.type === "credit" || tx.debit_credit === "Credit" || tx.transaction_type === "Credit";
                            const amt = parseFloat(String(tx.amount || 0));
                            const cat = tx.details?.purpose || tx.category || tx.expense_category || "Expense";
                            const dateStr = tx.date || tx.transaction_date || tx.created_at;
                            const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : "—";
                            return (
                              <div key={i} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isCredit ? "bg-[#34C759]/10 text-[#34C759]" : "bg-[#FF3B30]/10 text-[#FF3B30]"}`}>
                                    {isCredit ? <TrendingUp size={14} strokeWidth={2.5} /> : <TrendingDown size={14} strokeWidth={2.5} />}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{cat}</span>
                                    <span className="text-[10px] text-gray-400">{formattedDate}</span>
                                  </div>
                                </div>
                                <span className={`text-[13px] font-bold shrink-0 ${isCredit ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
                                  {isCredit ? "+" : "−"}S$ {amt.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            );
                          }) : (
                            // Placeholder rows when no transactions yet
                            [
                              { cat: "Material Cost", date: "No transactions recorded", isCredit: false, amt: 0 },
                            ].map((item, i) => (
                              <div key={i} className="flex items-center justify-between py-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                    <Receipt size={14} className="text-gray-400" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[13px] font-semibold text-gray-400">No transactions yet</span>
                                    <span className="text-[10px] text-gray-300 dark:text-gray-600">Click Expenses in the header to record one</span>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}


            </>
          ) : activeTab === "Employees" ? (
            (() => {
              const assignedNames = project.assigned_employees || [];
              const assignedEmployeesList = employees.filter(emp => {
                const matchesName = assignedNames.includes(emp.name);
                if (!matchesName) return false;
                
                if (!empSearch.trim()) return true;
                const query = empSearch.toLowerCase();
                return (
                  emp.name?.toLowerCase().includes(query) ||
                  emp.emp_id?.toLowerCase().includes(query) ||
                  (emp.job_role || emp.role || "")?.toLowerCase().includes(query) ||
                  (emp.departments?.name || "")?.toLowerCase().includes(query)
                );
              });

              // Pagination Calculations
              const totalItems = assignedEmployeesList.length;
              const totalPages = Math.ceil(totalItems / empPageSize);
              const startIndex = (empPage - 1) * empPageSize;
              const endIndex = Math.min(startIndex + empPageSize, totalItems);
              const currentAssigned = assignedEmployeesList.slice(startIndex, endIndex);

              const handleRemoveEmployee = async (empName: string) => {
                if (confirm(`Are you sure you want to remove ${empName} from this project?`)) {
                  const updatedEmployees = assignedNames.filter((name: string) => name !== empName);
                  const { error } = await supabase
                    .from('projects')
                    .update({ assigned_employees: updatedEmployees })
                    .eq('id', projectId);
                  
                  if (!error) {
                    setProject({ ...project, assigned_employees: updatedEmployees });
                  } else {
                    alert("Failed to remove employee: " + error.message);
                  }
                }
              };

              const getWorkedDays = (startDateStr: string) => {
                if (!startDateStr || startDateStr === "—") return 0;
                const start = new Date(startDateStr);
                if (isNaN(start.getTime())) return 0;
                
                const today = new Date();
                start.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);
                
                const diffTime = today.getTime() - start.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return Math.max(0, diffDays);
              };

              return (
                <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
                  {/* Toolbar replacing Header Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                    {/* Left: Search input */}
                    <div className="relative w-full sm:w-[280px]">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={empSearch}
                        onChange={(e) => {
                          setEmpSearch(e.target.value);
                          setEmpPage(1);
                        }}
                        placeholder="Search Employee"
                        className="w-full pl-10 pr-4 py-2 bg-transparent dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-full text-[13px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#007AFF] transition-colors"
                      />
                    </div>

                    {/* Right: Filter & Download buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => alert("Filter functionality triggered")}
                        title="Filter"
                        className="h-[38px] w-[38px] flex items-center justify-center bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-2xl hover:bg-gray-50 dark:hover:bg-[#2C2C2F] text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
                      >
                        <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => alert("Exporting assigned employees data...")}
                        title="Export CSV"
                        className="h-[38px] w-[38px] flex items-center justify-center bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-2xl hover:bg-gray-50 dark:hover:bg-[#2C2C2F] text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
                      >
                        <Download className="h-[18px] w-[18px]" strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {assignedEmployeesList.length > 0 ? (
                    <>
                      {/* Table exactly like Employee page table */}
                      <div className="w-full overflow-hidden bg-white dark:bg-[#121217] rounded-[24px] border border-[#F1F3F5] dark:border-[#2C2C35]">
                        <div className="overflow-x-auto w-full min-h-[300px]">
                          <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                              <tr className="bg-[#F8F9FA] dark:bg-black/20 border-b border-gray-100 dark:border-white/5">
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Employee</th>
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Designation</th>
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Department</th>
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Worked days</th>
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Leave taken</th>
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Status</th>
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400 text-right pr-12">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentAssigned.map((employee) => {
                                const workedDays = getWorkedDays(project.startDate);
                                const leaveTaken = employee.id ? (Number(employee.id.charCodeAt(0) + employee.id.charCodeAt(employee.id.length - 1)) % 5) + 1 : 2;

                                return (
                                  <tr 
                                    key={employee.id}
                                    className="border-b border-gray-50 dark:border-white/5 hover:bg-[#F8F9FA]/40 dark:hover:bg-white/5 transition-colors"
                                  >
                                    {/* Employee name and empId */}
                                    <td className="px-6 py-4">
                                      <div className="flex flex-col">
                                        <span className="text-[14px] font-semibold text-gray-900 dark:text-white leading-tight">
                                          {employee.name}
                                        </span>
                                        <span className="text-[12px] text-gray-400 dark:text-gray-500 font-medium mt-0.5 leading-none">
                                          {employee.emp_id || "EMP-N/A"}
                                        </span>
                                      </div>
                                    </td>

                                    {/* Designation */}
                                    <td className="px-6 py-4 text-[14px] font-medium text-gray-600 dark:text-gray-300">
                                      {employee.job_role || employee.role || "—"}
                                    </td>

                                    {/* Department */}
                                    <td className="px-6 py-4 text-[14px] font-medium text-gray-600 dark:text-gray-300">
                                      {employee.departments?.name || "General"}
                                    </td>

                                    {/* Worked Days */}
                                    <td className="px-6 py-4 text-[14px] font-medium text-gray-600 dark:text-gray-300">
                                      {workedDays > 0 ? `${workedDays} days` : "—"}
                                    </td>

                                    {/* Leave Taken */}
                                    <td className="px-6 py-4 text-[14px] font-medium text-gray-600 dark:text-gray-300">
                                      {leaveTaken} days
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4">
                                      <span className="text-[14px] font-semibold text-[#34C759]">
                                        Active
                                      </span>
                                    </td>

                                    {/* Action */}
                                    <td className="px-6 py-4 text-right pr-12">
                                      <div className="flex items-center justify-end gap-2.5 relative emp-action-menu-container">
                                        {/* View Profile */}
                                        <button
                                          onClick={() => router.push(`/employees/${employee.id}`)}
                                          className="p-1.5 text-[#007AFF] hover:bg-[#007AFF]/10 rounded-lg transition-colors"
                                          title="View Profile"
                                        >
                                          <Eye className="h-4 w-4" strokeWidth={2.5} />
                                        </button>

                                        {/* Edit Accessibility */}
                                        <button
                                          onClick={() => {
                                            setEmpEditEmployee(employee);
                                            setEmpEditScreen("menu");
                                            setIsEmpEditPanelOpen(true);
                                          }}
                                          className="p-1.5 text-[#007AFF] hover:bg-[#007AFF]/10 rounded-lg transition-colors"
                                          title="Edit Accessibility"
                                        >
                                          <Edit2 className="h-4 w-4" strokeWidth={2.5} />
                                        </button>

                                        {/* Three Dot Action */}
                                        <button
                                          onClick={() => setOpenActionDropdown(openActionDropdown === employee.id ? null : employee.id)}
                                          className="p-1.5 text-[#8E8E93] hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-lg transition-colors"
                                          title="Actions"
                                        >
                                          <MoreVertical className="h-4 w-4" strokeWidth={2.5} />
                                        </button>

                                        {openActionDropdown === employee.id && (
                                          <div className="absolute right-0 top-9 w-[190px] bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-xl shadow-lg py-1.5 z-50 text-left animate-in fade-in slide-in-from-top-1 duration-100">
                                            <button
                                              onClick={() => {
                                                setOpenActionDropdown(null);
                                                alert(`Transfer Project for ${employee.name}`);
                                              }}
                                              className="w-full px-4 py-2 text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2A2A30] transition-colors"
                                            >
                                              Transfer Project
                                            </button>
                                            <button
                                              onClick={() => {
                                                setOpenActionDropdown(null);
                                                handleRemoveEmployee(employee.name);
                                              }}
                                              className="w-full px-4 py-2 text-[13px] font-semibold text-[#FF3B30] hover:bg-[#FF3B30]/5 transition-colors"
                                            >
                                              Remove from this project
                                            </button>
                                            <button
                                              onClick={() => {
                                                setOpenActionDropdown(null);
                                                alert(`Paused ${employee.name} from the project successfully`);
                                              }}
                                              className="w-full px-4 py-2 text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2A2A30] transition-colors"
                                            >
                                              Pause from the project
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Pagination Footer matching Department page footer layout */}
                      <div className="flex items-center justify-between mt-4 px-1">
                        {/* Count */}
                        <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">
                          Showing {totalItems === 0 ? 0 : startIndex + 1} to {endIndex} of {totalItems} employees
                        </span>

                        {/* Pages + size */}
                        <div className="flex items-center gap-2">
                          {/* Prev */}
                          <button
                            onClick={() => setEmpPage(p => Math.max(1, p - 1))}
                            disabled={empPage === 1}
                            className="h-8 w-8 flex items-center justify-center rounded-[8px] bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] text-gray-600 dark:text-gray-400 hover:border-[#007AFF]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft size={14} />
                          </button>

                          {/* Page numbers */}
                          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                            Math.max(0, empPage - 3),
                            Math.max(4, empPage + 1)
                          ).map(pg => (
                            <button
                              key={pg}
                              onClick={() => setEmpPage(pg)}
                              className={`h-8 w-8 flex items-center justify-center rounded-[8px] text-[13px] font-bold transition-colors ${
                                pg === empPage
                                  ? "bg-[#007AFF] text-white shadow-sm"
                                  : "bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C35] text-gray-700 dark:text-gray-300 hover:border-[#007AFF]/40"
                              }`}
                            >
                              {pg}
                            </button>
                          ))}

                          {/* Next */}
                          <button
                            onClick={() => setEmpPage(p => Math.min(totalPages, p + 1))}
                            disabled={empPage === totalPages || totalPages === 0}
                            className="h-8 w-8 flex items-center justify-center rounded-[8px] bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] text-gray-600 dark:text-gray-400 hover:border-[#007AFF]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronRight size={14} />
                          </button>

                          {/* Page size select */}
                          <div className="relative ml-2">
                            <select
                              value={empPageSize}
                              onChange={e => { setEmpPageSize(Number(e.target.value)); setEmpPage(1); }}
                              className="appearance-none bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] rounded-[8px] pl-3 pr-7 py-1.5 text-[12px] font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 cursor-pointer"
                            >
                              {[10, 20, 50].map(s => <option key={s} value={s}>{s} / page</option>)}
                            </select>
                            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-gray-200 dark:border-[#2C2C35] rounded-2xl gap-4 bg-white dark:bg-[#1C1C1E] shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                      <div className="h-12 w-12 bg-gray-50 dark:bg-[#2C2C35] rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <Users size={24} />
                      </div>
                      <div className="text-center">
                        <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">No Assigned Employees</h3>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1 max-w-[280px]">
                          Assign personnel to this project to track their attendance, payrolls, and schedule.
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/projects/setup?id=${project.id}`)}
                        className="px-4 py-2 bg-[#007AFF] text-white text-[13px] font-bold rounded-xl hover:bg-[#0063CC] transition-colors flex items-center gap-1.5"
                      >
                        <UserPlus size={16} />
                        Assign Employees
                      </button>
                    </div>
                  )}
                </div>
              );
            })()
          ) : activeTab === "Expenses" ? (
            (() => {
              // Filter transactions related to this project
              const projectTxs = transactions.filter(tx => {
                const matchesProject = tx.details?.id === projectId;
                if (!matchesProject) return false;

                // Date filter (month with year dropdown)
                if (selectedMonthYear !== "All") {
                  const txDateStr = tx.transaction_date || tx.created_at;
                  if (!txDateStr || !txDateStr.startsWith(selectedMonthYear)) return false;
                }

                // Search query filter (search by description, payment_id, category)
                if (expenseSearch.trim()) {
                  const query = expenseSearch.toLowerCase();
                  return (
                    tx.description?.toLowerCase().includes(query) ||
                    tx.payment_id?.toLowerCase().includes(query) ||
                    (tx.details?.purpose || tx.category)?.toLowerCase().includes(query) ||
                    tx.bank_name?.toLowerCase().includes(query)
                  );
                }

                return true;
              });

              // Pagination Calculations
              const totalItems = projectTxs.length;
              const totalPages = Math.ceil(totalItems / expensePageSize);
              const startIndex = (expensePage - 1) * expensePageSize;
              const endIndex = Math.min(startIndex + expensePageSize, totalItems);
              const currentTxs = projectTxs.slice(startIndex, endIndex);

              const getMonthYearOptions = () => {
                const options = [{ label: "All Months", value: "All" }];
                const today = new Date();
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                
                for (let i = 0; i < 12; i++) {
                  const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                  const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
                  const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                  options.push({ label, value });
                }
                return options;
              };

              return (
                <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
                  {/* Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                    {/* Left: Search input */}
                    <div className="relative w-full sm:w-[280px]">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={expenseSearch}
                        onChange={(e) => {
                          setExpenseSearch(e.target.value);
                          setExpensePage(1);
                        }}
                        placeholder="Search Expenses"
                        className="w-full pl-10 pr-4 py-2 bg-transparent dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-full text-[13px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#007AFF] transition-colors"
                      />
                    </div>

                    {/* Right: Date selector, Filter & Download buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Month Year Dropdown */}
                      <div className="relative">
                        <select
                          value={selectedMonthYear}
                          onChange={(e) => {
                            setSelectedMonthYear(e.target.value);
                            setExpensePage(1);
                          }}
                          className="appearance-none bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-full pl-4 pr-10 py-2 text-[13px] font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#007AFF] cursor-pointer"
                        >
                          {getMonthYearOptions().map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>

                      <button
                        onClick={() => alert("Filter functionality triggered")}
                        title="Filter"
                        className="h-[38px] w-[38px] flex items-center justify-center bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-2xl hover:bg-gray-50 dark:hover:bg-[#2C2C2F] text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
                      >
                        <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => alert("Exporting expenses and claims data...")}
                        title="Export CSV"
                        className="h-[38px] w-[38px] flex items-center justify-center bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-2xl hover:bg-gray-50 dark:hover:bg-[#2C2C2F] text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
                      >
                        <Download className="h-[18px] w-[18px]" strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {projectTxs.length > 0 ? (
                    <>
                      {/* Table styled exactly like the Employee table */}
                      <div className="w-full overflow-hidden bg-white dark:bg-[#121217] rounded-[24px] border border-[#F1F3F5] dark:border-[#2C2C35]">
                        <div className="overflow-x-auto w-full min-h-[300px]">
                          <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                              <tr className="bg-[#F8F9FA] dark:bg-black/20 border-b border-gray-100 dark:border-white/5">
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Transaction ID</th>
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Category</th>
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Date</th>
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Description</th>
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Amount</th>
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Status</th>
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400 text-right pr-12">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentTxs.map((tx) => {
                                return (
                                  <tr 
                                    key={tx.id}
                                    className="border-b border-gray-50 dark:border-white/5 hover:bg-[#F8F9FA]/40 dark:hover:bg-white/5 transition-colors"
                                  >
                                    {/* Transaction ID / Name */}
                                    <td className="px-6 py-4">
                                      <div className="flex flex-col">
                                        <span className="text-[14px] font-semibold text-gray-900 dark:text-white leading-tight">
                                          {tx.payment_id || `TX-${tx.id.slice(0, 8).toUpperCase()}`}
                                        </span>
                                        <span className="text-[12px] text-gray-400 dark:text-gray-500 font-medium mt-0.5 leading-none">
                                          {tx.bank_name || "Company Account"}
                                        </span>
                                      </div>
                                    </td>

                                    {/* Category */}
                                    <td className="px-6 py-4">
                                      <span className="inline-flex px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#E5F1FF] text-[#007AFF] dark:bg-[#007AFF]/10">
                                        {tx.details?.purpose || tx.category || "General"}
                                      </span>
                                    </td>

                                    {/* Date */}
                                    <td className="px-6 py-4">
                                      <div className="flex flex-col">
                                        <span className="text-[14px] font-semibold text-gray-900 dark:text-white leading-tight">
                                          {tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}
                                        </span>
                                        <span className="text-[12px] text-gray-400 dark:text-gray-500 font-medium mt-0.5 leading-none">
                                          {tx.transaction_time || "—"}
                                        </span>
                                      </div>
                                    </td>

                                    {/* Description */}
                                    <td className="px-6 py-4 text-[14px] font-medium text-gray-600 dark:text-gray-300 max-w-[220px] truncate" title={tx.description}>
                                      {tx.description || "—"}
                                    </td>

                                    {/* Amount */}
                                    <td className={`px-6 py-4 text-[14px] font-bold ${
                                       (tx.type === "received" || tx.type === "credit" || tx.debit_credit === "Credit" || tx.transaction_type === "Credit")
                                         ? "text-[#34C759]"
                                         : "text-[#FF3B30]"
                                     }`}>
                                       {(tx.type === "received" || tx.type === "credit" || tx.debit_credit === "Credit" || tx.transaction_type === "Credit") ? "+" : "−"}S$ {Number(tx.amount || 0).toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4">
                                      <span className="inline-flex px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#EAF7ED] text-[#299555] dark:bg-[#1A3026] dark:text-[#34C759]">
                                        Paid
                                      </span>
                                    </td>

                                    {/* Action */}
                                    <td className="px-6 py-4 text-right pr-12">
                                      <div className="flex items-center justify-end gap-2.5">
                                        {tx.attachment_url && (
                                          <a
                                            href={tx.attachment_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 text-[#007AFF] hover:bg-[#007AFF]/10 rounded-lg transition-colors"
                                            title="Download Receipt"
                                          >
                                            <Download className="h-4 w-4" strokeWidth={2.5} />
                                          </a>
                                        )}
                                        <button
                                          onClick={() => alert(`Transaction Details:\nID: ${tx.payment_id || tx.id}\nCategory: ${tx.details?.purpose || tx.category}\nAmount: S$ ${tx.amount}\nDescription: ${tx.description}`)}
                                          className="p-1.5 text-[#007AFF] hover:bg-[#007AFF]/10 rounded-lg transition-colors"
                                          title="View Details"
                                        >
                                          <Eye className="h-4 w-4" strokeWidth={2.5} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Pagination Footer */}
                      <div className="flex items-center justify-between mt-4 px-1">
                        {/* Count */}
                        <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">
                          Showing {totalItems === 0 ? 0 : startIndex + 1} to {endIndex} of {totalItems} entries
                        </span>

                        {/* Pages + size */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpensePage(p => Math.max(1, p - 1))}
                            disabled={expensePage === 1}
                            className="h-8 w-8 flex items-center justify-center rounded-[8px] bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] text-gray-600 dark:text-gray-400 hover:border-[#007AFF]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft size={14} />
                          </button>

                          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                            Math.max(0, expensePage - 3),
                            Math.max(4, expensePage + 1)
                          ).map(pg => (
                            <button
                              key={pg}
                              onClick={() => setExpensePage(pg)}
                              className={`h-8 w-8 flex items-center justify-center rounded-[8px] text-[13px] font-bold transition-colors ${
                                pg === expensePage
                                  ? "bg-[#007AFF] text-white shadow-sm"
                                  : "bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C35] text-gray-700 dark:text-gray-300 hover:border-[#007AFF]/40"
                              }`}
                            >
                              {pg}
                            </button>
                          ))}

                          <button
                            onClick={() => setExpensePage(p => Math.min(totalPages, p + 1))}
                            disabled={expensePage === totalPages || totalPages === 0}
                            className="h-8 w-8 flex items-center justify-center rounded-[8px] bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] text-gray-600 dark:text-gray-400 hover:border-[#007AFF]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronRight size={14} />
                          </button>

                          <div className="relative ml-2">
                            <select
                              value={expensePageSize}
                              onChange={e => { setExpensePageSize(Number(e.target.value)); setExpensePage(1); }}
                              className="appearance-none bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] rounded-[8px] pl-3 pr-7 py-1.5 text-[12px] font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 cursor-pointer"
                            >
                              {[10, 20, 50].map(s => <option key={s} value={s}>{s} / page</option>)}
                            </select>
                            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-gray-200 dark:border-[#2C2C35] rounded-2xl gap-4 bg-white dark:bg-[#1C1C1E] shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                      <div className="h-12 w-12 bg-gray-50 dark:bg-[#2C2C35] rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <Receipt size={24} />
                      </div>
                      <div className="text-center">
                        <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">No Expenses Found</h3>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1 max-w-[280px]">
                          No expenses or claims have been recorded for this project in the selected period.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : activeTab === "Vendors" ? (
            project?.classification === "External Project" ? (
              <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
                {/* Header Info */}
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-[20px] font-bold text-gray-900 dark:text-white">Client Details</h2>
                  <p className="text-[13px] text-gray-500 font-medium">Information about the paying client for this project.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {/* Company Profile Card */}
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-gray-200 dark:border-[#2C2C35] flex flex-col gap-5 shadow-sm">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-[#2C2C35]">
                      <div className="p-2.5 bg-[#007AFF]/10 text-[#007AFF] rounded-2xl">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">Company Profile</h3>
                        <p className="text-[11px] text-gray-500 font-medium">Client corporate identity</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="font-semibold text-gray-500">Company Name</span>
                        <span className="font-bold text-gray-900 dark:text-white">{project.clientCompany || project.client_company || "—"}</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="font-semibold text-gray-500">Contact Person</span>
                        <span className="font-bold text-gray-900 dark:text-white">{project.client_contact || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Communication & Terms Card */}
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-gray-200 dark:border-[#2C2C35] flex flex-col gap-5 shadow-sm">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-[#2C2C35]">
                      <div className="p-2.5 bg-green-50 dark:bg-green-950/20 text-[#34C759] rounded-2xl">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">Communication &amp; Terms</h3>
                        <p className="text-[11px] text-gray-500 font-medium">Contact details and billing rates</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="font-semibold text-gray-500">Email Address</span>
                        {project.client_email ? (
                          <a href={`mailto:${project.client_email}`} className="font-bold text-[#007AFF] hover:underline">
                            {project.client_email}
                          </a>
                        ) : (
                          <span className="font-bold text-gray-900 dark:text-white">—</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="font-semibold text-gray-500">Phone Number</span>
                        <span className="font-bold text-gray-900 dark:text-white">{project.client_phone || "—"}</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="font-semibold text-gray-500">Billing Rate</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {project.client_billing_rate ? `S$ ${Number(project.client_billing_rate).toLocaleString('en-SG', { minimumFractionDigits: 2 })}` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              (() => {
                // Mock Vendors and Outsourcing data
              const mockVendors = [
                {
                  id: "1",
                  vendor_id: "VND-APX091",
                  name: "Apex Construction Ltd",
                  category: "Subcontractor (Structural)",
                  contract_value: 450000,
                  contact_name: "David Tan",
                  contact_phone: "+65 9123 4567",
                  contact_email: "david@apexcon.sg",
                  billing_cycle: "Milestone-based",
                  status: "Active"
                },
                {
                  id: "2",
                  vendor_id: "VND-TTM284",
                  name: "Titanium Manpower Group",
                  category: "Manpower Supply",
                  contract_value: 180000,
                  contact_name: "Sarah Lim",
                  contact_phone: "+65 8234 5678",
                  contact_email: "sarah.l@titanium.com.sg",
                  billing_cycle: "Monthly (Net 30)",
                  status: "Active"
                },
                {
                  id: "3",
                  vendor_id: "VND-MGL392",
                  name: "Mega Logistics & Freight",
                  category: "Equipment Rental",
                  contract_value: 850000,
                  contact_name: "John Silva",
                  contact_phone: "+65 9812 3456",
                  contact_email: "john@megalog.com",
                  billing_cycle: "Monthly (Net 15)",
                  status: "Active"
                },
                {
                  id: "4",
                  vendor_id: "VND-CCS881",
                  name: "Concrete Solution Pte Ltd",
                  category: "Material Supply",
                  contract_value: 125000,
                  contact_name: "Robert Chen",
                  contact_phone: "+65 8901 2345",
                  contact_email: "robert@concretesol.sg",
                  billing_cycle: "Milestone-based",
                  status: "Completed"
                }
              ];

              const filteredVendors = mockVendors.filter(vendor => {
                if (!vendorSearch.trim()) return true;
                const query = vendorSearch.toLowerCase();
                return (
                  vendor.name?.toLowerCase().includes(query) ||
                  vendor.vendor_id?.toLowerCase().includes(query) ||
                  vendor.category?.toLowerCase().includes(query) ||
                  vendor.contact_name?.toLowerCase().includes(query)
                );
              });

              // Pagination Calculations
              const totalItems = filteredVendors.length;
              const totalPages = Math.ceil(totalItems / vendorPageSize);
              const startIndex = (vendorPage - 1) * vendorPageSize;
              const endIndex = Math.min(startIndex + vendorPageSize, totalItems);
              const currentVendors = filteredVendors.slice(startIndex, endIndex);

              return (
                <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
                  {/* Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                    {/* Left: Search input */}
                    <div className="relative w-full sm:w-[280px]">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={vendorSearch}
                        onChange={(e) => {
                          setVendorSearch(e.target.value);
                          setVendorPage(1);
                        }}
                        placeholder="Search Vendors"
                        className="w-full pl-10 pr-4 py-2 bg-transparent dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-full text-[13px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#007AFF] transition-colors"
                      />
                    </div>

                    {/* Right: Filter & Download buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => alert("Filter functionality triggered")}
                        title="Filter"
                        className="h-[38px] w-[38px] flex items-center justify-center bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-2xl hover:bg-gray-50 dark:hover:bg-[#2C2C2F] text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
                      >
                        <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => alert("Exporting vendors data...")}
                        title="Export CSV"
                        className="h-[38px] w-[38px] flex items-center justify-center bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-2xl hover:bg-gray-50 dark:hover:bg-[#2C2C2F] text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
                      >
                        <Download className="h-[18px] w-[18px]" strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {filteredVendors.length > 0 ? (
                    <>
                      {/* Table styled exactly like the Employee table */}
                      <div className="w-full overflow-hidden bg-white dark:bg-[#121217] rounded-[24px] border border-[#F1F3F5] dark:border-[#2C2C35]">
                        <div className="overflow-x-auto w-full min-h-[300px]">
                          <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                              <tr className="bg-[#F8F9FA] dark:bg-black/20 border-b border-gray-100 dark:border-white/5">
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Vendor Name</th>
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Service Category</th>
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Contract Value</th>
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Contact Person</th>
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Billing Cycle</th>
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Status</th>
                                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400 text-right pr-12">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentVendors.map((vendor) => {
                                return (
                                  <tr 
                                    key={vendor.id}
                                    className="border-b border-gray-50 dark:border-white/5 hover:bg-[#F8F9FA]/40 dark:hover:bg-white/5 transition-colors"
                                  >
                                    {/* Vendor Name & ID */}
                                    <td className="px-6 py-4">
                                      <div className="flex flex-col">
                                        <span className="text-[14px] font-semibold text-gray-900 dark:text-white leading-tight">
                                          {vendor.name}
                                        </span>
                                        <span className="text-[12px] text-gray-400 dark:text-gray-500 font-medium mt-0.5 leading-none">
                                          {vendor.vendor_id}
                                        </span>
                                      </div>
                                    </td>

                                    {/* Service Category */}
                                    <td className="px-6 py-4">
                                      <span className="inline-flex px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#E5F1FF] text-[#007AFF] dark:bg-[#007AFF]/10">
                                        {vendor.category}
                                      </span>
                                    </td>

                                    {/* Contract Value */}
                                    <td className="px-6 py-4 text-[14px] font-semibold text-gray-900 dark:text-white">
                                      S$ {vendor.contract_value.toLocaleString("en-SG")}
                                    </td>

                                    {/* Contact Person */}
                                    <td className="px-6 py-4">
                                      <div className="flex flex-col">
                                        <span className="text-[14px] font-semibold text-gray-900 dark:text-white leading-tight">
                                          {vendor.contact_name}
                                        </span>
                                        <span className="text-[12px] text-gray-400 dark:text-gray-500 font-medium mt-0.5 leading-none">
                                          {vendor.contact_phone} | {vendor.contact_email}
                                        </span>
                                      </div>
                                    </td>

                                    {/* Billing Cycle */}
                                    <td className="px-6 py-4 text-[14px] font-medium text-gray-600 dark:text-gray-300">
                                      {vendor.billing_cycle}
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4">
                                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[12px] font-bold ${
                                        vendor.status === "Active" 
                                          ? "bg-[#EAF7ED] text-[#299555] dark:bg-[#1A3026] dark:text-[#34C759]"
                                          : "bg-[#F1F3F5] text-[#86868b] dark:bg-[#2C2C35] dark:text-[#A1A1A6]"
                                      }`}>
                                        {vendor.status}
                                      </span>
                                    </td>

                                    {/* Action */}
                                    <td className="px-6 py-4 text-right pr-12">
                                      <div className="flex items-center justify-end gap-2.5">
                                        <button
                                          onClick={() => alert(`Contacting ${vendor.contact_name} (${vendor.name})...`)}
                                          className="p-1.5 text-[#007AFF] hover:bg-[#007AFF]/10 rounded-lg transition-colors"
                                          title="Contact Vendor"
                                        >
                                          <Mail className="h-4 w-4" strokeWidth={2.5} />
                                        </button>
                                        <button
                                          onClick={() => alert(`Vendor details:\nName: ${vendor.name}\nUEN: ${vendor.vendor_id}\nCategory: ${vendor.category}\nContract Value: S$ ${vendor.contract_value}`)}
                                          className="p-1.5 text-[#007AFF] hover:bg-[#007AFF]/10 rounded-lg transition-colors"
                                          title="View Details"
                                        >
                                          <Eye className="h-4 w-4" strokeWidth={2.5} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Pagination Footer */}
                      <div className="flex items-center justify-between mt-4 px-1">
                        {/* Count */}
                        <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">
                          Showing {totalItems === 0 ? 0 : startIndex + 1} to {endIndex} of {totalItems} entries
                        </span>

                        {/* Pages + size */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setVendorPage(p => Math.max(1, p - 1))}
                            disabled={vendorPage === 1}
                            className="h-8 w-8 flex items-center justify-center rounded-[8px] bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] text-gray-600 dark:text-gray-400 hover:border-[#007AFF]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft size={14} />
                          </button>

                          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                            Math.max(0, vendorPage - 3),
                            Math.max(4, vendorPage + 1)
                          ).map(pg => (
                            <button
                              key={pg}
                              onClick={() => setVendorPage(pg)}
                              className={`h-8 w-8 flex items-center justify-center rounded-[8px] text-[13px] font-bold transition-colors ${
                                pg === vendorPage
                                  ? "bg-[#007AFF] text-white shadow-sm"
                                  : "bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C35] text-gray-700 dark:text-gray-300 hover:border-[#007AFF]/40"
                              }`}
                            >
                              {pg}
                            </button>
                          ))}

                          <button
                            onClick={() => setVendorPage(p => Math.min(totalPages, p + 1))}
                            disabled={vendorPage === totalPages || totalPages === 0}
                            className="h-8 w-8 flex items-center justify-center rounded-[8px] bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] text-gray-600 dark:text-gray-400 hover:border-[#007AFF]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronRight size={14} />
                          </button>

                          <div className="relative ml-2">
                            <select
                              value={vendorPageSize}
                              onChange={e => { setVendorPageSize(Number(e.target.value)); setVendorPage(1); }}
                              className="appearance-none bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] rounded-[8px] pl-3 pr-7 py-1.5 text-[12px] font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 cursor-pointer"
                            >
                              {[10, 20, 50].map(s => <option key={s} value={s}>{s} / page</option>)}
                            </select>
                            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-gray-200 dark:border-[#2C2C35] rounded-2xl gap-4 bg-white dark:bg-[#1C1C1E] shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                      <div className="h-12 w-12 bg-gray-50 dark:bg-[#2C2C35] rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <Building2 size={24} />
                      </div>
                      <div className="text-center">
                        <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">No Vendors Found</h3>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1 max-w-[280px]">
                          No vendors or outsourced services have been registered for this project.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )
          ) : (
            <div className="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-[24px] w-full min-h-[500px] flex items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <p className="text-[14px] font-medium text-gray-400">Content for {getTabLabel(activeTab, project?.classification)} will appear here.</p>
            </div>
          )}

        </div>
      </div>

      {/* ── Configure Panel ── */}
      {isConfigurePanelOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isConfigureClosing ? 'opacity-0' : 'opacity-100'} bg-black/10 dark:bg-black/30 backdrop-blur-sm`}
            onClick={closeConfigurePanel}
          />
          {/* Drawer */}
          <div className={`fixed inset-y-0 right-0 z-[100] w-full max-w-[440px] bg-white dark:bg-[#121217] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out ${isConfigureClosing ? 'translate-x-full' : 'translate-x-0'} shadow-2xl`}>
            
            {/* ── SCREEN 1: Action Menu ── */}
            {activeScreen === "menu" && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                  <div>
                    <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Quick Actions</h2>
                    <p className="text-[12px] text-[#8E8E93] mt-0.5 font-medium">Choose an administrative task to perform</p>
                  </div>
                  <button onClick={closeConfigurePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 page-scrollbar">
                  {/* Project Settings */}
                  <button
                    onClick={() => setActiveScreen("settings")}
                    className="flex items-center justify-between p-5 bg-white dark:bg-[#1C1C1E] hover:bg-[#F8F9FA] dark:hover:bg-[#2C2C35] rounded-2xl text-left border border-[#E5E7EB] dark:border-[#2C2C35] transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-gray-900 dark:text-white">Project Settings</span>
                      <span className="text-[12px] font-medium text-gray-500 mt-1">Configure this project's setup and configurations</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90" />
                  </button>

                  {/* Add Employee */}
                  <button
                    onClick={() => setActiveScreen("add_employee")}
                    className="flex items-center justify-between p-5 bg-white dark:bg-[#1C1C1E] hover:bg-[#F8F9FA] dark:hover:bg-[#2C2C35] rounded-2xl text-left border border-[#E5E7EB] dark:border-[#2C2C35] transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-gray-900 dark:text-white">Add Employee</span>
                      <span className="text-[12px] font-medium text-gray-500 mt-1">Onboard a new team member</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90" />
                  </button>

                  {/* People and Access */}
                  <button
                    onClick={() => setActiveScreen("people_access")}
                    className="flex items-center justify-between p-5 bg-white dark:bg-[#1C1C1E] hover:bg-[#F8F9FA] dark:hover:bg-[#2C2C35] rounded-2xl text-left border border-[#E5E7EB] dark:border-[#2C2C35] transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-gray-900 dark:text-white">People and Access</span>
                      <span className="text-[12px] font-medium text-gray-500 mt-1">Manage team members and permissions</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90" />
                  </button>

                  {/* Project Equity */}
                  <button
                    onClick={() => router.push('/finance/equity')}
                    className="flex items-center justify-between p-5 bg-white dark:bg-[#1C1C1E] hover:bg-[#F8F9FA] dark:hover:bg-[#2C2C35] rounded-2xl text-left border border-[#E5E7EB] dark:border-[#2C2C35] transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-gray-900 dark:text-white">Project Equity</span>
                      <span className="text-[12px] font-medium text-gray-500 mt-1">View financial allocation and equity</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90" />
                  </button>

                  {/* Automation Settings */}
                  <button
                    onClick={() => setActiveScreen("automations")}
                    className="flex items-center justify-between p-5 bg-white dark:bg-[#1C1C1E] hover:bg-[#F8F9FA] dark:hover:bg-[#2C2C35] rounded-2xl text-left border border-[#E5E7EB] dark:border-[#2C2C35] transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-gray-900 dark:text-white">Automation Settings</span>
                      <span className="text-[12px] font-medium text-gray-500 mt-1">Configure triggers and workflows</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90" />
                  </button>

                  {/* Site Settings */}
                  <button
                    onClick={() => setActiveScreen("site_settings")}
                    className="flex items-center justify-between p-5 bg-white dark:bg-[#1C1C1E] hover:bg-[#F8F9FA] dark:hover:bg-[#2C2C35] rounded-2xl text-left border border-[#E5E7EB] dark:border-[#2C2C35] transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-gray-900 dark:text-white">Site Settings</span>
                      <span className="text-[12px] font-medium text-gray-500 mt-1">Worksite address and location</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90" />
                  </button>
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

            {/* ── SCREEN 2: Project Settings Form ── */}
            {activeScreen === "settings" && (
              <form onSubmit={handleSaveSettings} className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setActiveScreen("menu")}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-lg text-gray-500 transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Project Settings</h2>
                      <p className="text-[12px] text-[#8E8E93] mt-0.5">Configure project rules and settings</p>
                    </div>
                  </div>
                  <button type="button" onClick={closeConfigurePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 page-scrollbar">
                  {/* Geofence Radius */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-gray-900 dark:text-white">Geofence Radius (meters)</label>
                    <input
                      type="number"
                      min={50}
                      value={locationRadius || ""}
                      onChange={e => setLocationRadius(parseInt(e.target.value) || 0)}
                      className="w-full h-11 px-4 bg-gray-50 dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors"
                      placeholder="200"
                    />
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">Specify the geofencing check-in boundary radius in meters (minimum 50 meters).</p>
                  </div>

                  {/* Clock in and Clock out time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-bold text-gray-900 dark:text-white">Clock In Time</label>
                      <input
                        type="time"
                        value={clockInTime}
                        onChange={e => setClockInTime(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-bold text-gray-900 dark:text-white">Clock Out Time</label>
                      <input
                        type="time"
                        value={clockOutTime}
                        onChange={e => setClockOutTime(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Attendance Enable/disable Toggle button */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-gray-900 dark:text-white">Attendance Tracking</label>
                    <div className="flex items-center h-11 gap-3">
                      <ToggleSwitch value={attendanceEnabled} onChange={setAttendanceEnabled} />
                      <span className="text-[13px] font-medium text-gray-600 dark:text-gray-300">{attendanceEnabled ? "Enabled — Mobile App Attendance tracking active" : "Disabled"}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">Enable if employees need to check in/out using mobile app geofenced attendance</p>
                  </div>

                  {/* Site Pass toggle Button */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-gray-900 dark:text-white">Site Pass Required</label>
                    <div className="flex items-center h-11 gap-3">
                      <ToggleSwitch value={siteAccessPass} onChange={setSiteAccessPass} />
                      <span className="text-[13px] font-medium text-gray-600 dark:text-gray-300">{siteAccessPass ? "Yes — Access pass required" : "No"}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">Enable if this project site requires special entry pass credentials</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
                  {settingsError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">{settingsError}</div>}
                  {settingsSuccess && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-semibold border border-green-100 flex items-center gap-2"><Check size={16}/> Project settings saved successfully</div>}
                  
                  <button
                    type="submit"
                    disabled={settingsSaving}
                    className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-[16px] text-[15px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {settingsSaving ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Save Settings"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ── SCREEN 3: Add Employee Form ── */}
            {activeScreen === "add_employee" && (
              <form onSubmit={handleAssignEmployees} className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setActiveScreen("menu")}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-lg text-gray-500 transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Assign Employees</h2>
                      <p className="text-[12px] text-[#8E8E93] mt-0.5 font-medium">Add team members to this project</p>
                    </div>
                  </div>
                  <button type="button" onClick={closeConfigurePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 min-h-0 page-scrollbar">
                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={employeeSearchQuery}
                      onChange={e => setEmployeeSearchQuery(e.target.value)}
                      placeholder="Search employees..."
                      className="w-full h-11 pl-10 pr-4 bg-gray-50 dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] rounded-[14px] text-[13.5px] font-medium outline-none transition-colors"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>

                  {/* Employees List */}
                  <div className="flex-1 overflow-y-auto border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[14px] p-2 bg-white dark:bg-[#121217] flex flex-col gap-1 min-h-[200px] page-scrollbar">
                    {(() => {
                      const query = employeeSearchQuery.toLowerCase().trim();
                      const currentAssigned = Array.isArray(project.assigned_employees) ? project.assigned_employees : [];
                      
                      const filteredEmployees = employees.filter(emp => {
                        const matchesQuery = emp.name.toLowerCase().includes(query) || (emp.emp_id || "").toLowerCase().includes(query);
                        const isManager = project && project.owner && emp.name.toLowerCase() === project.owner.toLowerCase();
                        return matchesQuery && !isManager;
                      });

                      if (filteredEmployees.length === 0) {
                        return <div className="text-center text-gray-400 text-[12.5px] py-8">No employees found</div>;
                      }

                      return filteredEmployees.map(emp => {
                        const isAssignedHere = currentAssigned.includes(emp.name);
                        
                        // Check if assigned to another project
                        const otherProj = allCompanyProjects.find(p =>
                          p.id !== projectId && Array.isArray(p.assigned_employees) && p.assigned_employees.includes(emp.name)
                        );
                        
                        const isAssignedElsewhere = !!otherProj;
                        const isDisabled = isAssignedHere || isAssignedElsewhere;
                        const isChecked = selectedEmpNames.includes(emp.name);

                        let helpText = "";
                        if (isAssignedHere) helpText = "Already assigned to this project";
                        else if (isAssignedElsewhere) helpText = `Assigned to: ${otherProj.project_name}`;

                        const handleToggleSelection = () => {
                          if (isDisabled) return;
                          setSelectedEmpNames(prev =>
                            prev.includes(emp.name) ? prev.filter(n => n !== emp.name) : [...prev, emp.name]
                          );
                        };

                        return (
                          <div
                            key={emp.id}
                            onClick={handleToggleSelection}
                            className={`flex items-center justify-between p-3 rounded-[12px] transition-all ${
                              isDisabled 
                                ? 'opacity-40 cursor-not-allowed bg-gray-50/50 dark:bg-white/[0.01]' 
                                : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1C1C1E] bg-white dark:bg-[#121217]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {emp.avatar_url ? (
                                <img 
                                  src={emp.avatar_url} 
                                  alt={emp.name}
                                  className="h-8 w-8 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div 
                                  className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 text-white"
                                  style={{ backgroundColor: getAvatarColor(emp.name).bg }}
                                >
                                  {getInitials(emp.name)}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight">
                                  {emp.name}
                                </span>
                                <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                                  {emp.emp_id || "No ID"} • {emp.departments?.name || "No Department"}
                                </span>
                                {helpText && (
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-0.5">
                                    {helpText}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-all ${
                              isChecked 
                                ? 'border-[#007AFF] bg-[#007AFF] text-white' 
                                : isDisabled 
                                  ? 'border-gray-250 dark:border-gray-700 bg-gray-50/50 dark:bg-transparent'
                                  : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {isChecked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
                  {assignError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">{assignError}</div>}
                  {assignSuccess && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-semibold border border-green-100 flex items-center gap-2"><Check size={16}/> Employees assigned successfully</div>}
                  
                  <button
                    type="submit"
                    disabled={assignSaving || selectedEmpNames.length === 0}
                    className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-[16px] text-[15px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {assignSaving ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      selectedEmpNames.length > 0 
                        ? `Assign ${selectedEmpNames.length} Employees`
                        : "Assign Employees"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ── SCREEN 4: People & Access Form ── */}
            {activeScreen === "people_access" && (
              <form onSubmit={handleSaveAccessSettings} className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setActiveScreen("menu")}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-lg text-gray-500 transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">People & Access</h2>
                      <p className="text-[12px] text-[#8E8E93] mt-0.5 font-medium">Manage page accessibility rules</p>
                    </div>
                  </div>
                  <button type="button" onClick={closeConfigurePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 min-h-0 page-scrollbar">
                  {/* Segmented Control Role Selector */}
                  <div className="flex bg-gray-100 dark:bg-[#1C1C1E] p-1 rounded-[14px]">
                    {(["Admin", "Sub Admin", "Employee"] as const).map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedAccessRole(role)}
                        className={`flex-1 py-2 text-[13px] font-bold rounded-[10px] transition-all ${
                          selectedAccessRole === role 
                            ? 'bg-white dark:bg-[#2C2C35] text-gray-900 dark:text-white shadow-sm'
                            : 'text-[#8E8E93] hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>

                  {/* Checklist of pages */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[13px] font-bold text-gray-900 dark:text-white">Accessible Sidebar Pages</label>
                    <div className="flex flex-col gap-1 border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[14px] p-2 bg-white dark:bg-[#121217]">
                      {(() => {
                        const currentAllowed = accessSettings[selectedAccessRole] || [];
                        return TABS.map(tab => {
                          const isChecked = currentAllowed.includes(tab.id);
                          const handleToggle = () => {
                            setAccessSettings(prev => {
                              const list = prev[selectedAccessRole] || [];
                              const updatedList = list.includes(tab.id)
                                ? list.filter(id => id !== tab.id)
                                : [...list, tab.id];
                              return {
                                ...prev,
                                [selectedAccessRole]: updatedList
                              };
                            });
                          };

                          return (
                            <div
                              key={tab.id}
                              onClick={handleToggle}
                              className="flex items-center justify-between p-3 rounded-[12px] hover:bg-gray-50 dark:hover:bg-[#1C1C1E] cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <tab.icon className="h-4 w-4 text-gray-400 shrink-0" />
                                <span className="text-[13.5px] font-semibold text-gray-800 dark:text-gray-200">
                                  {getTabLabel(tab.id, project?.classification)}
                                </span>
                              </div>
                              
                              <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-all ${
                                isChecked 
                                  ? 'border-[#007AFF] bg-[#007AFF] text-white' 
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}>
                                {isChecked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
                  {accessError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">{accessError}</div>}
                  {accessSuccess && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-semibold border border-green-100 flex items-center gap-2"><Check size={16}/> Page accessibility rules saved successfully</div>}
                  
                  <button
                    type="submit"
                    disabled={accessSaving}
                    className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-[16px] text-[15px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {accessSaving ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ── SCREEN 5: Automation Settings Form ── */}
            {activeScreen === "automations" && (
              <form onSubmit={handleSaveAutomationSettings} className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setActiveScreen("menu")}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-lg text-gray-500 transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Automation Settings</h2>
                      <p className="text-[12px] text-[#8E8E93] mt-0.5 font-medium">Configure triggers and automatic workflows</p>
                    </div>
                  </div>
                  <button type="button" onClick={closeConfigurePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 min-h-0 page-scrollbar">
                  
                  {/* Category 1: Attendance Automations */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Attendance Automations</h3>
                    
                    <div className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[18px]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[13.5px] font-bold text-gray-900 dark:text-white leading-tight">Auto Clock-Out</p>
                          <p className="text-[11px] text-gray-500 mt-1">Automatically clock out workers at shift end</p>
                        </div>
                        <ToggleSwitch 
                          value={automationSettings.autoClockOutEnabled} 
                          onChange={v => setAutomationSettings((prev: any) => ({ ...prev, autoClockOutEnabled: v }))} 
                        />
                      </div>

                      {automationSettings.autoClockOutEnabled && (
                        <div className="flex flex-col gap-1.5 mt-2 animate-in fade-in duration-200">
                          <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-300">Auto Clock-Out Time</label>
                          <input 
                            type="time" 
                            value={automationSettings.autoClockOutTime || "18:00"}
                            onChange={e => setAutomationSettings((prev: any) => ({ ...prev, autoClockOutTime: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] rounded-xl text-[13px] font-medium outline-none transition-colors"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category 2: Alerts & Expiry Automations */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Alerts & Expiry Automations</h3>
                    
                    <div className="flex flex-col gap-4 p-4 bg-gray-50 dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[18px]">
                      {/* Work Pass Expiry */}
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[13.5px] font-bold text-gray-900 dark:text-white leading-tight">Work Pass Expiry Alerts</p>
                            <p className="text-[11px] text-gray-500 mt-1">Alert when work pass or passport is expiring</p>
                          </div>
                          <ToggleSwitch 
                            value={automationSettings.workPassExpiryAlertEnabled} 
                            onChange={v => setAutomationSettings((prev: any) => ({ ...prev, workPassExpiryAlertEnabled: v }))} 
                          />
                        </div>

                        {automationSettings.workPassExpiryAlertEnabled && (
                          <div className="flex flex-col gap-1.5 mt-1 animate-in fade-in duration-200">
                            <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-300">Days Before Expiry (Alert Trigger)</label>
                            <div className="relative">
                              <input 
                                type="number" 
                                min={1}
                                value={automationSettings.workPassExpiryAlertDays || 30}
                                onChange={e => setAutomationSettings((prev: any) => ({ ...prev, workPassExpiryAlertDays: parseInt(e.target.value) || 0 }))}
                                className="w-full pl-3.5 pr-14 py-2.5 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] rounded-xl text-[13px] font-medium outline-none transition-colors"
                              />
                              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[12px] font-bold pointer-events-none">days</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="border-b border-[#E5E7EB] dark:border-[#2C2C35]" />

                      {/* Budget Warning */}
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[13.5px] font-bold text-gray-900 dark:text-white leading-tight">Budget Warning Alerts</p>
                            <p className="text-[11px] text-gray-500 mt-1">Warn when budget spending reaches threshold</p>
                          </div>
                          <ToggleSwitch 
                            value={automationSettings.budgetWarningEnabled} 
                            onChange={v => setAutomationSettings((prev: any) => ({ ...prev, budgetWarningEnabled: v }))} 
                          />
                        </div>

                        {automationSettings.budgetWarningEnabled && (
                          <div className="flex flex-col gap-1.5 mt-1 animate-in fade-in duration-200">
                            <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-300">Spending Percentage Threshold</label>
                            <div className="relative">
                              <input 
                                type="number" 
                                min={50}
                                max={100}
                                value={automationSettings.budgetWarningPercent || 80}
                                onChange={e => setAutomationSettings((prev: any) => ({ ...prev, budgetWarningPercent: parseInt(e.target.value) || 0 }))}
                                className="w-full pl-3.5 pr-12 py-2.5 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] rounded-xl text-[13px] font-medium outline-none transition-colors"
                              />
                              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[12px] font-bold pointer-events-none">%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Category 3: Financial & Payroll */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Financial & Payroll</h3>
                    
                    <div className="flex flex-col gap-4 p-4 bg-gray-50 dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[18px]">
                      {/* Claim Alert */}
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[13.5px] font-bold text-gray-900 dark:text-white leading-tight">Claim Warning Alert</p>
                            <p className="text-[11px] text-gray-500 mt-1">Flag claims exceeding configured limits</p>
                          </div>
                          <ToggleSwitch 
                            value={automationSettings.claimAlertEnabled} 
                            onChange={v => setAutomationSettings((prev: any) => ({ ...prev, claimAlertEnabled: v }))} 
                          />
                        </div>

                        {automationSettings.claimAlertEnabled && (
                          <div className="flex flex-col gap-1.5 mt-1 animate-in fade-in duration-200">
                            <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-300">Single Claim Max Limit</label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[13px] font-bold pointer-events-none">SGD</span>
                              <input 
                                type="number" 
                                min={1}
                                value={automationSettings.claimAlertThreshold || 500}
                                onChange={e => setAutomationSettings((prev: any) => ({ ...prev, claimAlertThreshold: parseInt(e.target.value) || 0 }))}
                                className="w-full pl-14 pr-4 py-2.5 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] rounded-xl text-[13px] font-medium outline-none transition-colors"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="border-b border-[#E5E7EB] dark:border-[#2C2C35]" />

                      {/* Auto-Invoice Generation */}
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[13.5px] font-bold text-gray-900 dark:text-white leading-tight">Auto-Invoice Generation</p>
                            <p className="text-[11px] text-gray-500 mt-1">Automatically compile and generate vendor invoices</p>
                          </div>
                          <ToggleSwitch 
                            value={automationSettings.autoInvoiceEnabled} 
                            onChange={v => setAutomationSettings((prev: any) => ({ ...prev, autoInvoiceEnabled: v }))} 
                          />
                        </div>

                        {automationSettings.autoInvoiceEnabled && (
                          <div className="flex flex-col gap-1.5 mt-1 animate-in fade-in duration-200">
                            <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-300">Invoicing Frequency</label>
                            <select 
                              value={automationSettings.autoInvoiceCycle || "Monthly"}
                              onChange={e => setAutomationSettings((prev: any) => ({ ...prev, autoInvoiceCycle: e.target.value }))}
                              className="w-full px-3 py-2.5 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] rounded-xl text-[13px] font-bold outline-none cursor-pointer"
                            >
                              <option value="Weekly">Weekly</option>
                              <option value="Monthly">Monthly</option>
                              <option value="Quarterly">Quarterly</option>
                              <option value="Yearly">Yearly</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
                  {automationsError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">{automationsError}</div>}
                  {automationsSuccess && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-semibold border border-green-100 flex items-center gap-2"><Check size={16}/> Automation settings saved successfully</div>}
                  
                  <button
                    type="submit"
                    disabled={automationsSaving}
                    className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-[16px] text-[15px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {automationsSaving ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ── SCREEN 6: Site Settings Form ── */}
            {activeScreen === "site_settings" && (
              <form onSubmit={handleSaveSites} className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setActiveScreen("menu")}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-lg text-gray-500 transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Site Settings</h2>
                      <p className="text-[12px] text-[#8E8E93] mt-0.5">Manage worksite locations and maps</p>
                    </div>
                  </div>
                  <button type="button" onClick={closeConfigurePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 page-scrollbar">
                  {/* Current Worksites list */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[13px] font-bold text-gray-900 dark:text-white">Configured Worksites ({sitesList.length})</label>
                    {sitesList.length > 0 ? (
                      <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1 page-scrollbar">
                        {sitesList.map((site, index) => (
                          <div key={index} className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-xl">
                            <div className="flex flex-col gap-1 min-w-0 pr-2">
                              <span className="text-[13.5px] font-bold text-gray-900 dark:text-white truncate">{site.name}</span>
                              {site.mapLink ? (
                                <a href={site.mapLink} target="_blank" rel="noreferrer" className="text-[11.5px] text-[#007AFF] hover:underline flex items-center gap-0.5 truncate font-medium">
                                  <span className="truncate">{site.mapLink}</span>
                                  <ExternalLink size={10} className="shrink-0" />
                                </a>
                              ) : (
                                <span className="text-[11px] text-gray-400 font-medium">No Google Map link</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSite(index)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 dark:bg-[#121217] border border-dashed border-[#E5E7EB] dark:border-[#2C2C35] rounded-xl text-center">
                        <span className="text-[12px] font-bold text-gray-400 dark:text-gray-500">No worksites added yet.</span>
                      </div>
                    )}
                  </div>

                  <div className="border-b border-[#F2F2F7] dark:border-[#2C2C35]" />

                  {/* Add New Site Section */}
                  <div className="flex flex-col gap-4">
                    <label className="text-[13px] font-bold text-gray-900 dark:text-white">Add New Worksite</label>
                    
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11.5px] font-bold text-gray-700 dark:text-gray-300">Site Name</span>
                      <input
                        type="text"
                        value={newSiteName}
                        onChange={e => setNewSiteName(e.target.value)}
                        placeholder="e.g. HQ Building, Tuas Site"
                        className="w-full h-10 px-3.5 bg-gray-50 dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] rounded-xl text-[13px] font-medium outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11.5px] font-bold text-gray-700 dark:text-gray-300">Site Google Map Link</span>
                        <InfoTooltip text="How to get Google Maps link: 1. Open Google Maps, 2. Search location, 3. Click Share -> Copy Link, 4. Paste link here." />
                      </div>
                      <input
                        type="text"
                        value={newSiteMapLink}
                        onChange={e => setNewSiteMapLink(e.target.value)}
                        placeholder="https://maps.app.goo.gl/..."
                        className="w-full h-10 px-3.5 bg-gray-50 dark:bg-[#1C1C1E] text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:border-[#007AFF] rounded-xl text-[13px] font-medium outline-none transition-colors"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddSite}
                      className="py-2.5 bg-[#F2F2F7] dark:bg-[#2C2C35] hover:bg-[#E5E7EB] dark:hover:bg-[#3C3C45] text-gray-900 dark:text-white rounded-xl text-[12.5px] font-bold transition-colors"
                    >
                      + Add Site
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
                  {sitesError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">{sitesError}</div>}
                  {sitesSuccess && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-semibold border border-green-100 flex items-center gap-2"><Check size={16}/> Site settings saved successfully</div>}
                  
                  <button
                    type="submit"
                    disabled={sitesSaving}
                    className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-[16px] text-[15px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {sitesSaving ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </>
      )}

      {/* ── Upload Panel ── */}
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
                <p className="text-[12px] text-[#8E8E93] mt-0.5">Attach credentials, certificates, or agreements</p>
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
                      className="w-full appearance-none bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[14px] px-4 py-3.5 text-[13.5px] font-medium text-gray-900 dark:text-white focus:outline-none cursor-pointer"
                      value={uploadDocType}
                      onChange={(e) => {
                        setUploadDocType(e.target.value);
                        setUploadError("");
                      }}
                    >
                      <option value="service_agreement">Service Agreement</option>
                      <option value="quotation">Quotation</option>
                      <option value="purchase_order">Purchase Order</option>
                      <option value="work_order">Work Order</option>
                      {!(project?.classification === "External Project (outsource)" || project?.external_type === "External Project Outsource" || project?.external_type === "Outsource") && (
                        <option value="safety_documents">Safety Documents</option>
                      )}
                      <option value="insurance_documents">Insurance Documents</option>
                      <option value="customDocument">Other</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93] pointer-events-none h-4.5 w-4.5" />
                  </div>
                </div>

                {/* Custom Document Fields */}
                {uploadDocType === "customDocument" && (
                  <div className="flex flex-col gap-5 p-4 border border-gray-100 dark:border-[#2C2C35] rounded-2xl bg-gray-50/50 dark:bg-black/10 animate-in fade-in duration-200">
                    <div className="flex flex-col gap-2">
                      <label className="text-[12.5px] font-bold text-gray-900 dark:text-white">Document Name</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Non-Disclosure Agreement"
                        className="w-full px-4 py-3 bg-white dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[12px] text-[13.5px] font-medium outline-none text-gray-900 dark:text-white focus:border-[#007AFF] transition-colors"
                        value={customDocName}
                        onChange={(e) => setCustomDocName(e.target.value)}
                      />
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
                {uploadSuccess && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-semibold border border-green-100 flex items-center gap-2"><Check size={16}/> Document uploaded successfully</div>}
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
        </>
      )}

      {/* ── Expenses Panel (Debits/Credits) ── */}
      {isExpensePanelOpen && (
        <>
          {/* Backdrop */}
          <div 
            className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isExpenseClosing ? 'opacity-0' : 'opacity-100'} bg-black/10 dark:bg-black/30`}
            onClick={closeExpensePanel}
          />
          <div className={`fixed inset-y-0 right-0 z-[100] w-full max-w-[440px] bg-white dark:bg-[#121217] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out ${isExpenseClosing ? 'translate-x-full' : 'translate-x-0'}`}>
            {expenseScreen === "menu" ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                  <div>
                    <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Record Transaction</h2>
                    <p className="text-[12px] text-[#8E8E93] mt-0.5 font-medium">Select a transaction type to record</p>
                  </div>
                  <button type="button" onClick={closeExpensePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                    <X size={20} />
                  </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 page-scrollbar animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Separate Cards for Debit & Credit */}
                  <div className="flex flex-col gap-4">
                    {/* Debit (Expense) Card */}
                    <button
                      type="button"
                      onClick={() => {
                        setExpenseType("send");
                        setExpenseCategory("Material Cost");
                        setExpenseScreen("form");
                      }}
                      className="w-full flex items-center justify-between p-5 bg-white dark:bg-[#1C1C1E] hover:bg-[#F8F9FA] dark:hover:bg-[#2C2C35] rounded-2xl text-left border border-[#E5E7EB] dark:border-[#2C2C35] transition-all group"
                    >
                      <div className="flex flex-col pr-4">
                        <span className="text-[14px] font-bold text-gray-900 dark:text-white group-hover:text-[#007AFF] transition-colors">Debit (Expense)</span>
                        <span className="text-[12px] font-medium text-gray-500 mt-1 leading-relaxed">Record material costs, subcontractor fees, equipment rentals, transport, allowances, or other expenses.</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90 shrink-0 group-hover:text-[#007AFF] transition-colors" />
                    </button>

                    {/* Credit (Revenue) Card */}
                    <button
                      type="button"
                      onClick={() => {
                        setExpenseType("received");
                        setExpenseCategory("Client Progress Payment");
                        setExpenseScreen("form");
                      }}
                      className="w-full flex items-center justify-between p-5 bg-white dark:bg-[#1C1C1E] hover:bg-[#F8F9FA] dark:hover:bg-[#2C2C35] rounded-2xl text-left border border-[#E5E7EB] dark:border-[#2C2C35] transition-all group"
                    >
                      <div className="flex flex-col pr-4">
                        <span className="text-[14px] font-bold text-gray-900 dark:text-white group-hover:text-[#007AFF] transition-colors">Credit (Revenue)</span>
                        <span className="text-[12px] font-medium text-gray-500 mt-1 leading-relaxed">Record client progress payments, outsourcing claims, retention release, or other incoming revenues.</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90 shrink-0 group-hover:text-[#007AFF] transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRecordExpense} className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setExpenseScreen("menu")}
                      className="p-2 -ml-2 text-[#8E8E93] hover:text-gray-900 dark:hover:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35] rounded-full transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div>
                      <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
                        {expenseType === "send" ? "Record Debit" : "Record Credit"}
                      </h2>
                      <p className="text-[12px] text-[#8E8E93] mt-0.5 font-medium">Record a new {expenseType === "send" ? "expense" : "revenue"} transaction</p>
                    </div>
                  </div>
                  <button type="button" onClick={closeExpensePanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                    <X size={20} />
                  </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 page-scrollbar animate-in fade-in slide-in-from-right-4 duration-300">
                  {expenseError && (
                    <div className="p-3.5 bg-red-50 border border-red-100 text-red-600 text-[12.5px] font-bold rounded-xl dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400">
                      {expenseError}
                    </div>
                  )}



                  {/* Expense Amount */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Expense Amount</label>
                    <div className="flex items-center bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 border border-transparent focus-within:border-[#007AFF]">
                      <span className="text-[14px] font-semibold text-[#8E8E93] mr-2">S$</span>
                      <input
                        type="text"
                        value={expenseAmount}
                        onChange={e => setExpenseAmount(formatAsYouType(e.target.value))}
                        onBlur={() => {
                          if (expenseAmount) setExpenseAmount(formatAmount(parseAmount(expenseAmount)));
                        }}
                        placeholder="0.00"
                        required
                        className="flex-1 bg-transparent text-[14px] font-semibold text-[#1C1C1E] dark:text-white placeholder:text-[#C7C7CC] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Category Dropdown */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Category</label>
                    {expenseCategory === "Others" ? (
                      <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={customCategory}
                            onChange={e => {
                              const words = e.target.value.split(/\s+/);
                              if (words.length <= 30) {
                                setCustomCategory(e.target.value);
                              }
                            }}
                            placeholder="Type custom category (max 30 words)"
                            className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 text-[13px] font-medium text-[#1C1C1E] dark:text-white placeholder:text-[#C7C7CC] focus:outline-none border border-transparent focus:border-[#007AFF]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setExpenseCategory("");
                              setCustomCategory("");
                            }}
                            className="shrink-0 px-3 py-3 rounded-[14px] bg-[#F2F2F7] dark:bg-[#2C2C35] text-[#8E8E93] hover:text-[#FF3B30] transition-colors"
                            title="Clear category"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <select
                          value={expenseCategory}
                          onChange={e => setExpenseCategory(e.target.value)}
                          className="w-full appearance-none bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none border border-transparent focus:border-[#007AFF]"
                        >
                          <option value="">Select Category</option>
                          {expenseType === "send" ? (
                            <>
                              <option value="Material Cost">Material Cost</option>
                              <option value="Subcontractor Fee">Subcontractor Fee</option>
                              <option value="Equipment Rental">Equipment Rental</option>
                              <option value="Logistics & Transport">Logistics & Transport</option>
                              <option value="Salary / Allowance">Salary / Allowance</option>
                              <option value="Other Expense">Other Expense</option>
                              <option value="Others">Others</option>
                            </>
                          ) : (
                            <>
                              <option value="Client Progress Payment">Client Progress Payment</option>
                              <option value="Outsource Reimbursement">Outsource Reimbursement</option>
                              <option value="Retention Release">Retention Release</option>
                              <option value="Other Credit">Other Credit</option>
                              <option value="Others">Others</option>
                            </>
                          )}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93] pointer-events-none h-4.5 w-4.5" />
                      </div>
                    )}
                  </div>

                  {/* Transaction Date */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-gray-900 dark:text-white">Transaction Date</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3 text-[13.5px] font-medium text-gray-900 dark:text-white border border-[#E5E7EB] dark:border-[#2C2C35] focus:outline-none focus:border-[#007AFF]"
                      value={expenseDate}
                      onChange={e => setExpenseDate(e.target.value)}
                    />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Description</label>
                      <span className="text-[10px] font-medium text-[#8E8E93]">{expenseDescription.length}/1000</span>
                    </div>
                    <textarea
                      value={expenseDescription}
                      onChange={e => setExpenseDescription(e.target.value.slice(0, 1000))}
                      placeholder="Enter expense details..."
                      className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-4 text-[13px] font-medium text-[#1C1C1E] dark:text-white placeholder:text-[#C7C7CC] focus:outline-none border border-transparent focus:border-[#007AFF] min-h-[100px] resize-none"
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Payment Method <span className="text-red-500 font-bold">*</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setExpenseMethod("Bank Transfer")}
                        className={`flex items-center justify-center gap-3 py-3 rounded-[14px] border transition-all ${expenseMethod === "Bank Transfer" ? "bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF]" : "bg-[#F8F9FA] dark:bg-[#1C1C1E] border-transparent text-[#8E8E93]"}`}
                      >
                        <svg width="20" height="20" viewBox="0 0 32 32" className="transition-colors shrink-0">
                          <path d="M28 14c1.103 0 2-.897 2-2v-1.403c0-.737-.403-1.412-1.053-1.761L16.474 2.12a1 1 0 0 0-.947 0L3.053 8.836A1.998 1.998 0 0 0 2 10.597V12c0 1.103.897 2 2 2h1v10H4c-1.103 0-2 .897-2 2v2c0 1.103.897 2 2 2h24c1.103 0 2-.897 2-2v-2c0-1.103-.897-2-2-2h-1V14zM4 10.597l12-6.461 12 6.461V12H4zM17 24V14h3v10zm-5 0V14h3v10zM7 14h3v10H7zm21.001 14H4v-2h24v2zm-3-4h-3V14h3z" fill="currentColor" />
                        </svg>
                        <span className="text-[13px] font-bold">Bank Transfer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setExpenseMethod("Cash");
                          setExpenseBankId("");
                        }}
                        className={`flex items-center justify-center gap-3 py-3 rounded-[14px] border transition-all ${expenseMethod === "Cash" ? "bg-[#34C759]/10 border-[#34C759] text-[#34C759]" : "bg-[#F8F9FA] dark:bg-[#1C1C1E] border-transparent text-[#8E8E93]"}`}
                      >
                        <svg width="20" height="20" viewBox="0 0 512 512" className="transition-colors shrink-0">
                          <g>
                            <path d="M226 361c41.355 0 75-33.645 75-75s-33.645-75-75-75-75 33.645-75 75 33.645 75 75 75zm0-120c24.813 0 45 20.187 45 45s-20.187 45-45 45-45-20.187-45-45 20.187-45 45-45z" fill="currentColor" />
                            <path d="M497 91H75c-8.284 0-15 6.716-15 15v45H15c-8.284 0-15 6.716-15 15v240c0 8.284 6.716 15 15 15h421c8.284 0 15-6.716 15-15v-45h46c8.284 0 15-6.716 15-15V106c0-8.284-6.716-15-15-15zm-76 117.42c-12.764-4.527-22.893-14.656-27.42-27.42H421zM362.509 181c5.98 29.344 29.147 52.51 58.491 58.491v93.019c-29.344 5.98-52.51 29.147-58.491 58.491H88.491C82.51 361.656 59.344 338.49 30 332.509V239.49c29.344-5.98 52.51-29.147 58.491-58.491h274.018zM57.42 181c-4.527 12.764-14.656 22.893-27.42 27.42V181zM30 363.58c12.764 4.527 22.893 14.656 27.42 27.42H30zM393.58 391c4.527-12.764 14.656-22.893 27.42-27.42V391zM482 331h-31V166c0-8.284-6.716-15-15-15H90v-30h392z" fill="currentColor" />
                            <circle cx="346" cy="286" r="15" fill="currentColor" />
                            <circle cx="106" cy="286" r="15" fill="currentColor" />
                          </g>
                        </svg>
                        <span className="text-[13px] font-bold">Cash</span>
                      </button>
                    </div>

                    {/* Bank Selection (When Bank Transfer is selected) */}
                    {expenseMethod === "Bank Transfer" && (
                      <div className="flex flex-col gap-3 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Pay from Bank <span className="text-red-500 font-bold">*</span></label>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                          {companyBanks.length === 0 ? (
                            <div className="text-[13px] text-[#8E8E93] font-bold py-4 px-2 w-full text-center">
                              No bank accounts found.
                            </div>
                          ) : (
                            companyBanks.map((bank) => (
                              <div
                                key={bank.id}
                                onClick={() => setExpenseBankId(bank.id)}
                                className={`flex-shrink-0 w-[180px] p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${expenseBankId === bank.id ? "border-[#007AFF] bg-[#007AFF]/5" : "border-[#E5E7EB] dark:border-[#2C2C35] hover:border-[#007AFF]/50"}`}
                              >
                                <div className="flex flex-col gap-3 relative z-10">
                                  <div className="h-8 flex items-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={getBankLogo(bank)} alt={bank.bank_name} className="h-6 max-w-full object-contain" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[12px] font-bold text-[#1C1C1E] dark:text-white leading-tight">{bank.bank_name}</span>
                                    <span className="text-[11px] font-medium text-[#8E8E93]">*{bank.account_number?.slice(-4) || bank.account_number}</span>
                                  </div>
                                  <button 
                                    type="button"
                                    className="text-[11px] font-bold text-[#007AFF] hover:underline text-left mt-1"
                                    onClick={(e) => { e.stopPropagation(); alert(`Balance: S$ ${parseFloat(bank.balance || 0).toLocaleString('en-SG', { minimumFractionDigits: 2 })}`); }}
                                  >
                                    Check Balance
                                  </button>
                                </div>
                                {expenseBankId === bank.id && (
                                  <div className="absolute top-2 right-2 h-5 w-5 bg-[#007AFF] rounded-full flex items-center justify-center text-white shadow-sm z-20 animate-in zoom-in duration-200">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* File Attachment Uploader */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-gray-900 dark:text-white">Receipt / Invoice Attachment</label>
                    {expenseFileObj ? (
                      <div className="flex items-center justify-between p-3.5 border border-gray-200 dark:border-[#2C2C35] rounded-2xl bg-[#F8F9FA] dark:bg-[#1C1C1E] animate-in fade-in duration-200">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-[#007AFF] rounded-lg">
                            <FileText className="h-5 w-5 shrink-0" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[13px] font-bold text-gray-900 dark:text-white block truncate">{expenseFileObj.name}</span>
                            <span className="text-[10px] text-gray-400 font-semibold">{(expenseFileObj.size / (1024 * 1024)).toFixed(2)} MB</span>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setExpenseFileObj(null)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all shrink-0"
                        >
                          <X className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative group">
                        <input 
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setExpenseFileObj(e.target.files[0]);
                            }
                          }}
                        />
                        <div className="h-32 w-full border-2 border-dashed border-gray-200 dark:border-[#2C2C35] rounded-[16px] bg-[#F9F9FB] dark:bg-[#1C1C1E]/50 flex flex-col items-center justify-center gap-2 group-hover:bg-[#EEF4FF] dark:group-hover:bg-blue-950/10 group-hover:border-[#007AFF] transition-all">
                          <Upload className="h-8 w-8 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
                          <span className="text-[13px] font-bold text-gray-700 dark:text-gray-400 group-hover:text-[#007AFF] transition-colors">Click or drag receipt file</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
                  {expenseSuccess && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-semibold border border-green-100 flex items-center gap-2"><Check size={16}/> Transaction recorded successfully</div>}
                  <button 
                    type="submit" 
                    disabled={expenseSaving || !expenseAmount}
                    className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] text-white font-bold text-[15px] rounded-[16px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {expenseSaving ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : <Check className="h-4.5 w-4.5" />}
                    {expenseSaving ? "Saving..." : "Record Transaction"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}

      {/* ── Employee Accessibility Edit Panel ── */}
      {isEmpEditPanelOpen && empEditEmployee && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-40 transition-opacity duration-300 ${isEmpEditClosing ? 'opacity-0' : 'opacity-100'} bg-black/10 dark:bg-black/30`}
            onClick={closeEmpEditPanel}
          />

          {/* Panel */}
          <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-[440px] bg-white dark:bg-[#121217] shadow-[-10px_0_40px_rgba(0,0,0,0.08)] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out ${isEmpEditClosing ? 'translate-x-full' : 'translate-x-0'}`}>

            {/* ── SCREEN 1: Category Menu ── */}
            {empEditScreen === "menu" && (
              <>
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                  <div>
                    <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Edit Accessibility</h2>
                    <p className="text-[12px] text-[#8E8E93] mt-0.5">{empEditEmployee.name} · {empEditEmployee.job_role || empEditEmployee.role || "Employee"}</p>
                  </div>
                  <button onClick={closeEmpEditPanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 page-scrollbar">
                  <button
                    onClick={() => setEmpEditScreen("claims")}
                    className="flex items-center justify-between p-5 bg-white dark:bg-[#1C1C1E] hover:bg-[#F8F9FA] dark:hover:bg-[#2C2C35] rounded-2xl text-left border border-[#E5E7EB] dark:border-[#2C2C35] transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-gray-900 dark:text-white">Claims</span>
                      <span className="text-[12px] font-medium text-gray-500 mt-1">Set claim amount, cycle &amp; transfer account</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90" />
                  </button>
                  <button
                    onClick={() => setEmpEditScreen("overtime")}
                    className="flex items-center justify-between p-5 bg-white dark:bg-[#1C1C1E] hover:bg-[#F8F9FA] dark:hover:bg-[#2C2C35] rounded-2xl text-left border border-[#E5E7EB] dark:border-[#2C2C35] transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-gray-900 dark:text-white">Over Time</span>
                      <span className="text-[12px] font-medium text-gray-500 mt-1">Configure overtime rate, cycle &amp; payment method</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90" />
                  </button>
                </div>
                <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
                  <button onClick={closeEmpEditPanel} className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] transition-colors rounded-[16px] text-white text-[15px] font-bold">
                    Close
                  </button>
                </div>
              </>
            )}

            {/* ── SCREEN 2: Claims Form ── */}
            {empEditScreen === "claims" && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setClaimSaving(true); setClaimError(""); setClaimSuccess(false);
                  try {
                    if (!claimMethod) {
                      throw new Error("Please select a payment method.");
                    }
                    if (claimMethod === "Bank Transfer" && !claimBankId) {
                      throw new Error("Please select a bank account.");
                    }
                    const updatedFields = { ...(empEditEmployee.custom_fields || {}), claim_settings: { claimAmount: parseAmount(claimAmount), claimCycle, claimCycleDay, claimMethod, claimBankId } };
                    const { error } = await supabase.from("employees").update({ custom_fields: updatedFields }).eq("id", empEditEmployee.id);
                    if (error) throw error;
                    setClaimSuccess(true); setTimeout(() => setClaimSuccess(false), 2000);
                  } catch (err: any) { setClaimError(err.message || "Failed to save."); } finally { setClaimSaving(false); }
                }}
                className="flex-1 flex flex-col min-h-0"
              >
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setEmpEditScreen("menu")} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-lg text-gray-500 transition-colors"><ArrowLeft className="h-5 w-5" /></button>
                    <div><h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Claims</h2><p className="text-[12px] text-[#8E8E93] mt-0.5">{empEditEmployee.name}</p></div>
                  </div>
                  <button type="button" onClick={closeEmpEditPanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 page-scrollbar">
                  {/* Employee Info */}
                  <div className="bg-[#F9F9FB] dark:bg-[#1C1C1E] rounded-2xl px-5 py-4 flex flex-col gap-3">
                    <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest">Employee Information</p>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-3">
                      <div className="flex flex-col"><span className="text-[11px] text-[#8E8E93]">Name</span><span className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">{empEditEmployee.name}</span></div>
                      <div className="flex flex-col"><span className="text-[11px] text-[#8E8E93]">Employee ID</span><span className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">{empEditEmployee.emp_id || "—"}</span></div>
                      <div className="flex flex-col"><span className="text-[11px] text-[#8E8E93]">Designation</span><span className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">{empEditEmployee.job_role || empEditEmployee.role || "—"}</span></div>
                      <div className="flex flex-col"><span className="text-[11px] text-[#8E8E93]">Department</span><span className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">{empEditEmployee.departments?.name || "General"}</span></div>
                    </div>
                  </div>
                  {/* Claim Amount */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Claim Amount</label>
                    <div className="flex items-center bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 border border-transparent focus-within:border-[#007AFF]">
                      <span className="text-[14px] font-semibold text-[#8E8E93] mr-2">S$</span>
                      <input type="text" value={claimAmount} onChange={e => setClaimAmount(formatAsYouType(e.target.value))} onBlur={() => { if (claimAmount) setClaimAmount(formatAmount(parseAmount(claimAmount))); }} placeholder="0.00" className="flex-1 bg-transparent text-[14px] font-semibold text-[#1C1C1E] dark:text-white placeholder:text-[#C7C7CC] focus:outline-none" />
                    </div>
                  </div>
                  {/* Cycle */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Cycle</label>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-[14px]">
                      {(["Daily", "Weekly", "Monthly"] as const).map(c => (
                        <button key={c} type="button" onClick={() => setClaimCycle(c)} className={`py-2 rounded-[10px] text-[13px] font-bold transition-all ${claimCycle === c ? "bg-white dark:bg-[#2C2C35] text-[#007AFF] shadow-sm" : "text-[#8E8E93]"}`}>{c}</button>
                      ))}
                    </div>
                  </div>
                  {/* Cycle Day */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Cycle Day <span className="text-[11px] font-medium text-[#8E8E93] ml-1">{claimCycle === "Monthly" ? "(day of month, e.g. 25)" : "(day of week, e.g. Friday)"}</span></label>
                    <input type="text" value={claimCycleDay} onChange={e => setClaimCycleDay(e.target.value)} placeholder={claimCycle === "Monthly" ? "e.g. 25" : "e.g. Friday"} className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-[#1C1C1E] dark:text-white placeholder:text-[#C7C7CC] focus:outline-none border border-transparent focus:border-[#007AFF]" />
                  </div>
                  {/* Transfer Account */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Transfer Account <span className="text-red-500 font-bold">*</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setClaimMethod("Bank Transfer")} className={`flex items-center justify-center gap-3 py-3 rounded-[14px] border transition-all ${claimMethod === "Bank Transfer" ? "bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF]" : "bg-[#F8F9FA] dark:bg-[#1C1C1E] border-transparent text-[#8E8E93]"}`}>
                        <svg width="20" height="20" viewBox="0 0 32 32" className="shrink-0"><path d="M28 14c1.103 0 2-.897 2-2v-1.403c0-.737-.403-1.412-1.053-1.761L16.474 2.12a1 1 0 0 0-.947 0L3.053 8.836A1.998 1.998 0 0 0 2 10.597V12c0 1.103.897 2 2 2h1v10H4c-1.103 0-2 .897-2 2v2c0 1.103.897 2 2 2h24c1.103 0 2-.897 2-2v-2c0-1.103-.897-2-2-2h-1V14zM4 10.597l12-6.461 12 6.461V12H4zM17 24V14h3v10zm-5 0V14h3v10zM7 14h3v10H7zm21.001 14H4v-2h24v2zm-3-4h-3V14h3z" fill="currentColor"/></svg>
                        <span className="text-[13px] font-bold">Bank Transfer</span>
                      </button>
                      <button type="button" onClick={() => setClaimMethod("Cash")} className={`flex items-center justify-center gap-3 py-3 rounded-[14px] border transition-all ${claimMethod === "Cash" ? "bg-[#34C759]/10 border-[#34C759] text-[#34C759]" : "bg-[#F8F9FA] dark:bg-[#1C1C1E] border-transparent text-[#8E8E93]"}`}>
                        <svg width="20" height="20" viewBox="0 0 512 512" className="shrink-0"><g><path d="M226 361c41.355 0 75-33.645 75-75s-33.645-75-75-75-75 33.645-75 75 33.645 75 75 75zm0-120c24.813 0 45 20.187 45 45s-20.187 45-45 45-45-20.187-45-45 20.187-45 45-45z" fill="currentColor"/><path d="M497 91H75c-8.284 0-15 6.716-15 15v45H15c-8.284 0-15 6.716-15 15v240c0 8.284 6.716 15 15 15h421c8.284 0 15-6.716 15-15v-45h46c8.284 0 15-6.716 15-15V106c0-8.284-6.716-15-15-15zm-76 117.42c-12.764-4.527-22.893-14.656-27.42-27.42H421zM362.509 181c5.98 29.344 29.147 52.51 58.491 58.491v93.019c-29.344 5.98-52.51 29.147-58.491 58.491H88.491C82.51 361.656 59.344 338.49 30 332.509V239.49c29.344-5.98 52.51-29.147 58.491-58.491h274.018zM57.42 181c-4.527 12.764-14.656 22.893-27.42 27.42V181zM30 363.58c12.764 4.527 22.893 14.656 27.42 27.42H30zM393.58 391c4.527-12.764 14.656-22.893 27.42-27.42V391zM482 331h-31V166c0-8.284-6.716-15-15-15H90v-30h392z" fill="currentColor"/><circle cx="346" cy="286" r="15" fill="currentColor"/><circle cx="106" cy="286" r="15" fill="currentColor"/></g></svg>
                        <span className="text-[13px] font-bold">Cash</span>
                      </button>
                    </div>
                    {claimMethod === "Bank Transfer" && (
                      <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Pay from Bank <span className="text-red-500 font-bold">*</span></label>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                          {companyBanks.length === 0 ? (
                            <div className="text-[13px] text-[#8E8E93] font-bold py-4 px-2 w-full text-center">No bank accounts found.</div>
                          ) : companyBanks.map(bank => (
                            <div key={bank.id} onClick={() => setClaimBankId(bank.id)} className={`flex-shrink-0 w-[180px] p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${claimBankId === bank.id ? "border-[#007AFF] bg-[#007AFF]/5" : "border-[#E5E7EB] dark:border-[#2C2C35] hover:border-[#007AFF]/50"}`}>
                              <div className="flex flex-col gap-3 relative z-10">
                                <div className="h-8 flex items-center">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={getBankLogo(bank)} alt={bank.bank_name} className="h-6 max-w-full object-contain" />
                                </div>
                                <div className="flex flex-col"><span className="text-[12px] font-bold text-[#1C1C1E] dark:text-white leading-tight">{bank.bank_name}</span><span className="text-[11px] font-medium text-[#8E8E93]">{bank.account_number || bank.account}</span></div>
                              </div>
                              {claimBankId === bank.id && <div className="absolute top-2 right-2 h-5 w-5 bg-[#007AFF] rounded-full flex items-center justify-center text-white shadow-sm z-20 animate-in zoom-in duration-200"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {claimError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">{claimError}</div>}
                </div>
                <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
                  {claimSuccess && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-semibold border border-green-100 flex items-center gap-2"><Check size={16}/>Claim settings saved</div>}
                  <button type="submit" disabled={claimSaving || !claimAmount} className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] text-white font-bold text-[15px] rounded-[16px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                    {claimSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {claimSaving ? "Saving..." : "Save Claims Settings"}
                  </button>
                </div>
              </form>
            )}

            {/* ── SCREEN 3: Over Time Form ── */}
            {empEditScreen === "overtime" && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setOtSaving(true); setOtError(""); setOtSuccess(false);
                  try {
                    if (!otMethod) {
                      throw new Error("Please select a payment method.");
                    }
                    if (otMethod === "Bank Transfer" && !otBankId) {
                      throw new Error("Please select a bank account.");
                    }
                    const updatedFields = { ...(empEditEmployee.custom_fields || {}), overtime_settings: { otRate: parseAmount(otRate), otCycle, otCycleDay, otMethod, otBankId } };
                    const { error } = await supabase.from("employees").update({ custom_fields: updatedFields }).eq("id", empEditEmployee.id);
                    if (error) throw error;
                    setOtSuccess(true); setTimeout(() => setOtSuccess(false), 2000);
                  } catch (err: any) { setOtError(err.message || "Failed to save."); } finally { setOtSaving(false); }
                }}
                className="flex-1 flex flex-col min-h-0"
              >
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setEmpEditScreen("menu")} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2C2C35] rounded-lg text-gray-500 transition-colors"><ArrowLeft className="h-5 w-5" /></button>
                    <div><h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Over Time</h2><p className="text-[12px] text-[#8E8E93] mt-0.5">{empEditEmployee.name}</p></div>
                  </div>
                  <button type="button" onClick={closeEmpEditPanel} className="p-2 -mr-1 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 page-scrollbar">
                  {/* Employee Info */}
                  <div className="bg-[#F9F9FB] dark:bg-[#1C1C1E] rounded-2xl px-5 py-4 flex flex-col gap-3">
                    <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest">Employee Information</p>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-3">
                      <div className="flex flex-col"><span className="text-[11px] text-[#8E8E93]">Name</span><span className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">{empEditEmployee.name}</span></div>
                      <div className="flex flex-col"><span className="text-[11px] text-[#8E8E93]">Employee ID</span><span className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">{empEditEmployee.emp_id || "—"}</span></div>
                      <div className="flex flex-col"><span className="text-[11px] text-[#8E8E93]">Designation</span><span className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">{empEditEmployee.job_role || empEditEmployee.role || "—"}</span></div>
                      <div className="flex flex-col"><span className="text-[11px] text-[#8E8E93]">Department</span><span className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">{empEditEmployee.departments?.name || "General"}</span></div>
                    </div>
                  </div>
                  {/* OT Rate */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Overtime Rate (per hour)</label>
                    <div className="flex items-center bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 border border-transparent focus-within:border-[#007AFF]">
                      <span className="text-[14px] font-semibold text-[#8E8E93] mr-2">S$</span>
                      <input type="text" value={otRate} onChange={e => setOtRate(formatAsYouType(e.target.value))} onBlur={() => { if (otRate) setOtRate(formatAmount(parseAmount(otRate))); }} placeholder="0.00" className="flex-1 bg-transparent text-[14px] font-semibold text-[#1C1C1E] dark:text-white placeholder:text-[#C7C7CC] focus:outline-none" />
                    </div>
                  </div>
                  {/* Cycle */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Cycle</label>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-[14px]">
                      {(["Daily", "Weekly", "Monthly"] as const).map(c => (
                        <button key={c} type="button" onClick={() => setOtCycle(c)} className={`py-2 rounded-[10px] text-[13px] font-bold transition-all ${otCycle === c ? "bg-white dark:bg-[#2C2C35] text-[#007AFF] shadow-sm" : "text-[#8E8E93]"}`}>{c}</button>
                      ))}
                    </div>
                  </div>
                  {/* Cycle Day */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Cycle Day <span className="text-[11px] font-medium text-[#8E8E93] ml-1">{otCycle === "Monthly" ? "(day of month, e.g. 25)" : "(day of week, e.g. Friday)"}</span></label>
                    <input type="text" value={otCycleDay} onChange={e => setOtCycleDay(e.target.value)} placeholder={otCycle === "Monthly" ? "e.g. 25" : "e.g. Friday"} className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-[#1C1C1E] dark:text-white placeholder:text-[#C7C7CC] focus:outline-none border border-transparent focus:border-[#007AFF]" />
                  </div>
                  {/* Transfer Account */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Transfer Account <span className="text-red-500 font-bold">*</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setOtMethod("Bank Transfer")} className={`flex items-center justify-center gap-3 py-3 rounded-[14px] border transition-all ${otMethod === "Bank Transfer" ? "bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF]" : "bg-[#F8F9FA] dark:bg-[#1C1C1E] border-transparent text-[#8E8E93]"}`}>
                        <svg width="20" height="20" viewBox="0 0 32 32" className="shrink-0"><path d="M28 14c1.103 0 2-.897 2-2v-1.403c0-.737-.403-1.412-1.053-1.761L16.474 2.12a1 1 0 0 0-.947 0L3.053 8.836A1.998 1.998 0 0 0 2 10.597V12c0 1.103.897 2 2 2h1v10H4c-1.103 0-2 .897-2 2v2c0 1.103.897 2 2 2h24c1.103 0 2-.897 2-2v-2c0-1.103-.897-2-2-2h-1V14zM4 10.597l12-6.461 12 6.461V12H4zM17 24V14h3v10zm-5 0V14h3v10zM7 14h3v10H7zm21.001 14H4v-2h24v2zm-3-4h-3V14h3z" fill="currentColor"/></svg>
                        <span className="text-[13px] font-bold">Bank Transfer</span>
                      </button>
                      <button type="button" onClick={() => setOtMethod("Cash")} className={`flex items-center justify-center gap-3 py-3 rounded-[14px] border transition-all ${otMethod === "Cash" ? "bg-[#34C759]/10 border-[#34C759] text-[#34C759]" : "bg-[#F8F9FA] dark:bg-[#1C1C1E] border-transparent text-[#8E8E93]"}`}>
                        <svg width="20" height="20" viewBox="0 0 512 512" className="shrink-0"><g><path d="M226 361c41.355 0 75-33.645 75-75s-33.645-75-75-75-75 33.645-75 75 33.645 75 75 75zm0-120c24.813 0 45 20.187 45 45s-20.187 45-45 45-45-20.187-45-45 20.187-45 45-45z" fill="currentColor"/><path d="M497 91H75c-8.284 0-15 6.716-15 15v45H15c-8.284 0-15 6.716-15 15v240c0 8.284 6.716 15 15 15h421c8.284 0 15-6.716 15-15v-45h46c8.284 0 15-6.716 15-15V106c0-8.284-6.716-15-15-15zm-76 117.42c-12.764-4.527-22.893-14.656-27.42-27.42H421zM362.509 181c5.98 29.344 29.147 52.51 58.491 58.491v93.019c-29.344 5.98-52.51 29.147-58.491 58.491H88.491C82.51 361.656 59.344 338.49 30 332.509V239.49c29.344-5.98 52.51-29.147 58.491-58.491h274.018zM57.42 181c-4.527 12.764-14.656 22.893-27.42 27.42V181zM30 363.58c12.764 4.527 22.893 14.656 27.42 27.42H30zM393.58 391c4.527-12.764 14.656-22.893 27.42-27.42V391zM482 331h-31V166c0-8.284-6.716-15-15-15H90v-30h392z" fill="currentColor"/><circle cx="346" cy="286" r="15" fill="currentColor"/><circle cx="106" cy="286" r="15" fill="currentColor"/></g></svg>
                        <span className="text-[13px] font-bold">Cash</span>
                      </button>
                    </div>
                    {otMethod === "Bank Transfer" && (
                      <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-[13px] font-bold text-[#1C1C1E] dark:text-white">Pay from Bank <span className="text-red-500 font-bold">*</span></label>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                          {companyBanks.length === 0 ? (
                            <div className="text-[13px] text-[#8E8E93] font-bold py-4 px-2 w-full text-center">No bank accounts found.</div>
                          ) : companyBanks.map(bank => (
                            <div key={bank.id} onClick={() => setOtBankId(bank.id)} className={`flex-shrink-0 w-[180px] p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${otBankId === bank.id ? "border-[#007AFF] bg-[#007AFF]/5" : "border-[#E5E7EB] dark:border-[#2C2C35] hover:border-[#007AFF]/50"}`}>
                              <div className="flex flex-col gap-3 relative z-10">
                                <div className="h-8 flex items-center">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={getBankLogo(bank)} alt={bank.bank_name} className="h-6 max-w-full object-contain" />
                                </div>
                                <div className="flex flex-col"><span className="text-[12px] font-bold text-[#1C1C1E] dark:text-white leading-tight">{bank.bank_name}</span><span className="text-[11px] font-medium text-[#8E8E93]">{bank.account_number || bank.account}</span></div>
                              </div>
                              {otBankId === bank.id && <div className="absolute top-2 right-2 h-5 w-5 bg-[#007AFF] rounded-full flex items-center justify-center text-white shadow-sm z-20 animate-in zoom-in duration-200"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {otError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">{otError}</div>}
                </div>
                <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
                  {otSuccess && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-semibold border border-green-100 flex items-center gap-2"><Check size={16}/>Overtime settings saved</div>}
                  <button type="submit" disabled={otSaving || !otRate} className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] text-white font-bold text-[15px] rounded-[16px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                    {otSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {otSaving ? "Saving..." : "Save Overtime Settings"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </>
      )}

    </div>
  );
}

const formatAmount = (val: string) => {
  if (!val) return "";
  const num = parseFloat(val);
  if (isNaN(num)) return "";
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseAmount = (val: string) => {
  return val.replace(/[^0-9.]/g, "");
};

const formatAsYouType = (val: string) => {
  if (!val) return "";
  const clean = val.replace(/[^0-9.]/g, "");
  const parts = clean.split(".");
  if (parts.length > 2) {
    parts[1] = parts.slice(1).join("");
    parts.length = 2;
  }
  const integerPart = parts[0];
  const decimalPart = parts[1];
  let formattedInteger = "";
  if (integerPart) {
    const num = parseFloat(integerPart);
    if (!isNaN(num)) {
      formattedInteger = num.toLocaleString("en-SG", { maximumFractionDigits: 0 });
    }
  }
  if (parts.length === 2) {
    return `${formattedInteger}.${decimalPart.slice(0, 2)}`;
  }
  return formattedInteger;
};

const getBankLogo = (bank: any) => {
  const logoPath = bank.logo || "";
  if (logoPath === '/Bank logo/CIMB.svg') {
    return '/Bank logo/CIMBLogo.svg';
  }
  if (logoPath) return logoPath;
  const lowerName = (bank.bank_name || "").toLowerCase();
  if (lowerName.includes("dbs")) return "/Bank logo/DBSlogo.svg";
  if (lowerName.includes("ocbc")) return "/Bank logo/Logo-ocbc.svg";
  if (lowerName.includes("uob")) return "/Bank logo/UOB_Logo_(2022) (1).svg";
  if (lowerName.includes("standard") || lowerName.includes("scb") || lowerName.includes("chartered")) return "/Bank logo/SCBLogo.svg";
  if (lowerName.includes("citi")) return "/Bank logo/Citilogo.svg";
  if (lowerName.includes("cimb")) return "/Bank logo/CIMBLogo.svg";
  return "/Bank logo/DBSlogo.svg";
};

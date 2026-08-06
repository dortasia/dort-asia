"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronRight, CheckCircle2, Building, Plus, Trash2, ShieldCheck, ChevronDown, Camera, Network, Image as ImageIcon, X, Undo2, Check, Crown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { getAvatarColor, getDepartmentColor, getUserAvatarUrl, getCompanyLogoUrl } from "@/utils/avatarColor";
import { getCompanyInitials, generateDeptId } from "@/utils/deptIdHelper";

// --- Custom Select Component with Fixed Positioning to Break Out of Overflow ---
function CustomSelect({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder 
}: { 
  label?: string; 
  value: string; 
  options: string[]; 
  onChange: (val: string) => void; 
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const elementId = label ? label.replace(/\s+/g, '') : placeholder.replace(/\s+/g, '');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Also check if they clicked inside the fixed dropdown
        const dropdown = document.getElementById(`dropdown-${elementId}`);
        if (dropdown && dropdown.contains(event.target as Node)) return;
        setOpen(false);
      }
    }
    const handleScroll = (event: Event) => {
      const dropdown = document.getElementById(`dropdown-${elementId}`);
      if (dropdown && dropdown.contains(event.target as Node)) return;
      setOpen(false);
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true); 
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [elementId]);

  const [openUpwards, setOpenUpwards] = useState(false);

  const toggleOpen = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!open) {
      const r = e.currentTarget.getBoundingClientRect();
      setRect(r);
      const spaceBelow = window.innerHeight - r.bottom;
      // If space below is less than 320px (dropdown max-h + padding), open upwards
      setOpenUpwards(spaceBelow < 320);
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef} style={{ zIndex: open ? 50 : 1 }}>
      {label && <label className="absolute -top-[9px] left-4 bg-white px-1 text-[11px] font-medium text-[#000000] z-10 pointer-events-none">{label}</label>}
      <div 
        className={`w-full h-[52px] px-5 bg-white !shadow-none border ${open ? 'border-[#007AFF] ring-1 ring-[#007AFF]/20' : 'border-[#E5E5EA] hover:border-[#D1D1D6]'} rounded-[16px] text-[15px] font-semibold cursor-pointer flex justify-between items-center transition-all`}
        onClick={toggleOpen}
      >
        <span className={`${value ? "text-[#1C1C1E]" : "cs-placeholder text-[#8E8E93]"} truncate min-w-0 flex-1 text-left`}>{value || placeholder}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ml-2 shrink-0 ${open ? 'rotate-180 text-[#007AFF]' : 'text-[#8E8E93]'}`} />
      </div>
      
      {open && rect && (
        <div 
          id={`dropdown-${elementId}`}
          className="fixed bg-white border border-[#E5E5EA] rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-[99999] overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200"
          style={{
            top: openUpwards ? undefined : rect.bottom + 4,
            bottom: openUpwards ? window.innerHeight - rect.top + 4 : undefined,
            left: rect.left,
            width: rect.width,
          }}
        >
          <div className="px-4 py-2.5 text-[14px] font-medium text-[#8E8E93] border-b border-[#E5E5EA] mb-1 bg-[#F8F9FA]/50">
            {placeholder}
          </div>
          <div className="max-h-[240px] overflow-y-auto page-scrollbar">
            {options.map((opt) => (
              <div 
                key={opt} 
                className={`px-4 py-2.5 text-[14px] transition-colors cursor-pointer truncate ${value === opt ? 'bg-[#007AFF]/10 text-[#007AFF] font-bold' : 'text-[#1C1C1E] hover:bg-[#F2F2F7]'}`}
                onClick={() => { onChange(opt); setOpen(false); }}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function buildEmpId(companyName: string, employeeCount: number): string {
  const clean = companyName.replace(/[^a-zA-Z]/g, "");
  let prefix = "VX";
  if (clean.length >= 2) {
    prefix = (clean[0] + clean[clean.length - 1]).toUpperCase();
  } else if (clean.length === 1) {
    prefix = (clean[0] + "X").toUpperCase();
  }
  const seq = String(employeeCount + 1).padStart(5, "0");
  return `${prefix}${seq}DA`;
}

export default function OnboardingModal() {
  const router = useRouter();
  const supabase = createClient();
  
  const DEBUG_PHASE3 = false;
  const [show, setShow] = useState(DEBUG_PHASE3 ? true : false);
  const [isChecking, setIsChecking] = useState(DEBUG_PHASE3 ? false : true);
  const [step, setStep] = useState<number>(DEBUG_PHASE3 ? 3 : 0);
  const [loading, setLoading] = useState(false);
  const [errorLine, setErrorLine] = useState("");
  const [userContext, setUserContext] = useState<any>(null);
  const [subscription, setSubscription] = useState<'basic' | 'plus' | 'pro'>('basic');

  // Employee welcome popup (non-super-admin path)
  const [showEmployeeWelcome, setShowEmployeeWelcome] = useState(false);
  const [employeeCompanyInfo, setEmployeeCompanyInfo] = useState<{ companyName: string; industry: string; logoUrl: string | null; email: string } | null>(null);

  // Seat limits per plan
  const PLAN_LIMITS: Record<string, number> = { basic: 10, plus: 50, pro: Infinity };
  const seatLimit = PLAN_LIMITS[subscription];

  // Phase 1 (Configure Company) variables
  const [startTime, setStartTime] = useState("");
  const [startAmPm, setStartAmPm] = useState("AM");
  const [endTime, setEndTime] = useState("");
  const [endAmPm, setEndAmPm] = useState("PM");
  const [companyType, setCompanyType] = useState("");
  const [customCompanyType, setCustomCompanyType] = useState("");
  const [attendanceType, setAttendanceType] = useState("");
  const [branchLocation, setBranchLocation] = useState("");
  // Removed isAddPanelOpen state

  const formatTimeInput = (val: string) => {
    let digits = val.replace(/\D/g, '').slice(0, 4);
    if (!digits) return '';
    
    // Auto-pad single digit if >1
    if (digits.length === 1 && parseInt(digits[0], 10) > 1) {
      digits = '0' + digits[0];
    }
    // Limit HH to 12
    if (digits.length >= 2) {
      const hh = parseInt(digits.slice(0, 2), 10);
      if (hh > 12) digits = '12' + digits.slice(2);
      if (hh === 0 && digits.length >= 2) digits = '12' + digits.slice(2); // 00 -> 12
    }
    // Limit MM to 59
    if (digits.length >= 4) {
      const mm = parseInt(digits.slice(2, 4), 10);
      if (mm > 59) digits = digits.slice(0, 2) + '59';
    }

    if (digits.length > 2) {
      return `${digits.slice(0, 2)} : ${digits.slice(2, 4)}`;
    }
    return digits;
  };

  const isValidTimeGap = (start: string, sAmPm: string, end: string, eAmPm: string): boolean => {
    if (!start || !end) return false;
    const parseTimeToMinutes = (timeStr: string, ampm: string) => {
      const clean = timeStr.replace(/[\s:]/g, '');
      if (clean.length < 3) return 0;
      const h = parseInt(clean.slice(0, 2), 10);
      const m = parseInt(clean.slice(2), 10) || 0;
      let hours = h % 12;
      if (ampm === 'PM') hours += 12;
      return hours * 60 + m;
    };
    const startMin = parseTimeToMinutes(start, sAmPm);
    const endMin = parseTimeToMinutes(end, eAmPm);
    let diff = endMin - startMin;
    if (diff < 0) diff += 24 * 60;
    return diff >= 120;
  };

  const capitalizeFirstLetter = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Phase 1: Company Overview
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");

  // Phase 2: Onboard Departments
  const [createdDepartments, setCreatedDepartments] = useState<Array<{ id: string; name: string; description: string; designations: string[] }>>(
    DEBUG_PHASE3 
      ? [{ id: 'test1', name: 'Engineering', description: 'Test', designations: ['Software Engineer', 'QA'] }] 
      : [
          { id: 'admin-default', name: 'Admin Department', description: 'Default department for administrative operations.', designations: [] },
          {
            id: 'mgmt-template',
            name: 'Management',
            description: 'Responsible for global strategy, business development, leadership, and operational overview.',
            designations: ['Chief Executive Officer', 'Chief Operating Officer', 'Director', 'General Manager']
          },
          {
            id: 'hr-template',
            name: 'Human Resources',
            description: 'Manages employee relations, talent acquisition, recruitment, benefits, compliance, and training.',
            designations: ['HR Manager', 'HR Generalist', 'Recruiter', 'Talent Acquisition Specialist']
          },
          {
            id: 'finance-template',
            name: 'Finance & Accounts',
            description: 'Manages company banking accounts, equity allocations, financial reporting, budgeting, audit, and tax compliance.',
            designations: ['Finance Manager', 'Chief Accountant', 'Accounts Executive', 'Financial Analyst']
          },
          {
            id: 'ops-template',
            name: 'Operations',
            description: 'Manages day-to-day operations, supply chain logistics, service delivery, and project management.',
            designations: ['Operations Director', 'Operations Manager', 'Project Manager', 'Operations Executive']
          },
          {
            id: 'admin-template',
            name: 'Administration',
            description: 'Manages office administration, corporate services, clerical support, IT support, and facilities.',
            designations: ['Office Administrator', 'Administrative Assistant', 'IT Support Analyst', 'Receptionist']
          }
        ]
  );
  const [deptName, setDeptName] = useState("");
  const [deptDesc, setDeptDesc] = useState("");
  const [desigName, setDesigName] = useState("");
  const [designations, setDesignations] = useState<string[]>([]);
  const [hasSkippedDepartments, setHasSkippedDepartments] = useState(false);
  const [hasSkippedEmployees, setHasSkippedEmployees] = useState(false);

  const handleAddDesignation = () => {
    if (desigName.trim()) {
      const splitTags = desigName.split(',').map(tag => tag.trim()).filter(Boolean);
      const uniqueTags = splitTags.filter(tag => !designations.includes(tag));
      if (uniqueTags.length > 0) {
        setDesignations([...designations, ...uniqueTags]);
      }
      setDesigName("");
    }
  };

  const handleRemoveDesignation = (desig: string) => {
    setDesignations(designations.filter(d => d !== desig));
  };

  const handleDeployDepartment = () => {
    if (!deptName.trim() || !deptDesc.trim() || designations.length === 0) {
      setErrorLine("Department name, description, and at least one designation are mandatory.");
      return;
    }
    if (deptName.trim().toLowerCase() === "admin department") {
      setErrorLine("Admin Department is already seeded by default.");
      return;
    }
    if (createdDepartments.length >= 5) {
      setErrorLine("You can only add up to 5 departments during setup.");
      return;
    }
    const newDept = {
      id: Math.random().toString(36).substring(7),
      name: deptName.trim(),
      description: deptDesc.trim(),
      designations: [...designations]
    };
    setCreatedDepartments([...createdDepartments, newDept]);
    setHasSkippedDepartments(false);
    setDeptName("");
    setDeptDesc("");
    setDesignations([]);
    setErrorLine("");
  };

  const handleRemoveDepartment = (id: string) => {
    const dept = createdDepartments.find(d => d.id === id);
    if (dept && dept.name === "Admin Department") return;
    setCreatedDepartments(createdDepartments.filter(d => d.id !== id));
  };

  // Phase 2: Super Admin Overview
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminRole, setAdminRole] = useState("");
  const [adminPic, setAdminPic] = useState<string | null>(null);
  const [adminCroppedUrl, setAdminCroppedUrl] = useState<string | null>(null);
  const [adminPicFile, setAdminPicFile] = useState<File | null>(null);
  const [adminPicZoom, setAdminPicZoom] = useState(1);
  const [adminPan, setAdminPan] = useState({ x: 0, y: 0 });
  const [isEditingAdminPic, setIsEditingAdminPic] = useState(false);
  const adminCropperRef = useRef<HTMLDivElement>(null);
  
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);
  const [picFile, setPicFile] = useState<File | null>(null);
  const [picZoom, setPicZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isEditingPic, setIsEditingPic] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const cropperRef = useRef<HTMLDivElement>(null);

  // Admin cropper has its own dragging state to avoid stale-closure bugs
  const [isAdminDragging, setIsAdminDragging] = useState(false);
  const adminLastPos = useRef({ x: 0, y: 0 });

  const getInitials = (name: string) => {
    if (!name) return "CO";
    const parts = name.trim().split(" ");
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Phase 3 & 4: Deployed Employees
  type DeployedEmployee = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    gender: string;
    department: string;
    designation: string;
    role: string;
  };
  const [deployedEmployees, setDeployedEmployees] = useState<DeployedEmployee[]>([]);
  
  // Phase 3 Inputs
  const [empFirstName, setEmpFirstName] = useState("");
  const [empLastName, setEmpLastName] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empGender, setEmpGender] = useState("");
  const [empDept, setEmpDept] = useState("");
  const [empDesig, setEmpDesig] = useState("");
  const [empRole, setEmpRole] = useState("");

  const handleAddEmployee = (): boolean => {
    if (!empFirstName || !empLastName || !empEmail || !empGender || !empDept || !empDesig || !empRole) {
      setErrorLine("Please fill out all employee fields.");
      return false;
    }
    if (deployedEmployees.length >= 15) {
      setErrorLine("Maximum 15 employees allowed during setup.");
      return false;
    }
    if (empEmail.trim().toLowerCase() === companyEmail.toLowerCase()) {
      setErrorLine("You cannot add yourself as an employee using your Super Admin email.");
      return false;
    }
    if (deployedEmployees.some(e => e.email === empEmail.trim().toLowerCase())) {
      setErrorLine("An employee with this email is already deployed.");
      return false;
    }

    // Policy: standard Employee is not allowed in Admin Department
    if (empDept === "Admin Department" && empRole === "Employee") {
      setErrorLine("Standard Employees are not allowed in the Admin Department.");
      return false;
    }
    
     // Policy: A department can only contain a single Admin
    if (empRole === "Admin") {
      const existingAdmin = deployedEmployees.find(e => e.department === empDept && e.role === "Admin");
      if (existingAdmin) {
        setErrorLine(`Policy Enforced: A department can only contain a single Admin. ${existingAdmin.firstName} is already the Admin for ${empDept}.`);
        return false;
      }
    }

    // Policy: A department can have a maximum of 3 Sub Admins
    if (empRole === "Sub Admin") {
      const subAdminsInDept = deployedEmployees.filter(e => e.department === empDept && e.role === "Sub Admin").length;
      if (subAdminsInDept >= 3) {
        setErrorLine(`Policy Enforced: A department can have a maximum of 3 Sub Admins. ${empDept} already has 3 Sub Admins.`);
        return false;
      }
    }

    setErrorLine("");
    const newEmp: DeployedEmployee = {
      id: Math.random().toString(36).substring(7),
      firstName: empFirstName.trim(),
      lastName: empLastName.trim(),
      email: empEmail.trim(),
      gender: empGender,
      department: empDept,
      designation: empDesig,
      role: empRole,
    };
    setDeployedEmployees([...deployedEmployees, newEmp]);
    setHasSkippedEmployees(false);
    setEmpFirstName("");
    setEmpLastName("");
    setEmpEmail("");
    setEmpGender("");
    setEmpRole("");
    // Keep department to speed up onboarding flow, but clear the sub-category
    setEmpDesig(""); 
    return true;
  };

  const handleRemoveDeployedEmployee = (id: string) => {
    setDeployedEmployees(deployedEmployees.filter(e => e.id !== id));
  };
  
  const [selectedOverviewDept, setSelectedOverviewDept] = useState<string>("");

  const seatCount = deployedEmployees.length;

  useEffect(() => {
    if (DEBUG_PHASE3) return; // Prevent checkStatus from closing the debug testing overlay
    const checkStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserContext(user);
      if (user.email) setCompanyEmail(user.email);
      
      // Fallback: Populate initial details from metadata so Phase 0 never shows "Dort Asia" if a real name exists
      const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || user.user_metadata?.avatar || "";

      if (user.user_metadata) {
        if (user.user_metadata.company_name) {
          setCompanyName(user.user_metadata.company_name);
        } else if (user.user_metadata.company) {
          setCompanyName(user.user_metadata.company);
        }
        
        if (user.user_metadata.full_name) {
          const parts = user.user_metadata.full_name.trim().split(/\s+/);
          setAdminFirstName(parts[0] || "");
          setAdminLastName(parts.slice(1).join(" ") || "");
        } else if (user.user_metadata.first_name) {
          setAdminFirstName(user.user_metadata.first_name);
          setAdminLastName(user.user_metadata.last_name || "");
        }

        if (googleAvatarUrl) {
          setAdminPic(googleAvatarUrl);
        }
      }

      // ─── PATH A: Check if this user is an EMPLOYEE under an existing company ───
      const { data: empRecords } = await supabase
        .from('employees')
        .select('company_id')
        .eq('email', user.email);

      if (empRecords && empRecords.length > 0 && empRecords[0].company_id !== user.id) {
        // They are an employee under another company. Redirect to departments page if not already there.
        if (window.location.pathname !== '/departments') {
          router.push('/departments');
        }
        return;
      }

      // ─── PATH B: This is a brand-new Super Admin (owns the company_settings row) ───
      // Check if they already set up a company — if yes, skip onboarding
      const { data: statusRow } = await supabase
        .from('company_settings')
        .select('setup_completed')
        .eq('company_id', user.id)
        .maybeSingle();

      // If this user has NO company_settings row (they're not a super admin)
      // but a workspace already exists globally → redirect to departments page
      if (!statusRow) {
        const { data: existingCompany } = await supabase
          .from('company_settings')
          .select('company_name, industry, logo_url, company_email')
          .eq('setup_completed', true)
          .limit(1)
          .maybeSingle();

        if (existingCompany) {
          if (window.location.pathname !== '/departments') {
            router.push('/departments');
          }
          return;
        }
      }

      const urlParams = new URLSearchParams(window.location.search);
      const isForced = urlParams.get('onboarding') === 'true';

      if (statusRow?.setup_completed === true && !isForced) return;

      // Step 2: Try to pre-populate existing data (may fail if new columns not yet added)
      try {
        const { data: company, error: companyErr } = await supabase
          .from('company_settings')
          .select('company_name, industry, company_email, company_phone, logo_url, super_admin_name, super_admin_role, super_admin_avatar_url, branch_location')
          .eq('company_id', user.id)
          .maybeSingle();

        if (!companyErr && company) {
          if (company.company_name) setCompanyName(company.company_name);
          if (company.company_email) setCompanyEmail(company.company_email);
          if (company.company_phone) setCompanyPhone(company.company_phone);
          if (company.logo_url) setProfilePic(company.logo_url);
          if (company.industry) {
            const knownIndustries = ["Technology & Software", "Healthcare", "Finance & Banking", "Retail & E-commerce"];
            if (knownIndustries.includes(company.industry)) {
              setIndustry(company.industry);
            } else {
              setIndustry('Other');
              setCustomIndustry(company.industry);
            }
          }
          if (company.super_admin_name) {
            const parts = company.super_admin_name.trim().split(/\s+/);
            setAdminFirstName(parts[0] || "");
            setAdminLastName(parts.slice(1).join(" ") || "");
          }
          if (company.super_admin_role) setAdminRole(company.super_admin_role);
          if (company.super_admin_avatar_url) {
            setAdminPic(company.super_admin_avatar_url);
          } else if (googleAvatarUrl) {
            setAdminPic(googleAvatarUrl);
          }
          if (company.branch_location) setBranchLocation(company.branch_location);
        }
      } catch (_) {
        // Non-fatal: columns may not exist yet, show modal with blank fields
      }

      // Pre-populate departments & employees
      const { data: depts } = await supabase
        .from('departments')
        .select('id, department_name, description, designations')
        .eq('company_id', user.id);

      const loadedDepts: Array<{ id: string; name: string; description: string; designations: string[] }> = [];

      if (depts && depts.length > 0) {
        // Hydrate createdDepartments
        depts.forEach((dept: any) => {
          loadedDepts.push({
            id: dept.id,
            name: dept.department_name || dept.name, // Handle both just in case
            description: dept.description || '', 
            designations: dept.designations || []
          });
        });

        const { data: emps } = await supabase
          .from('employees')
          .select('id, department_id, name, email, role, is_head, designation, gender')
          .eq('company_id', user.id);

        if (emps) {
          const loadedEmps: DeployedEmployee[] = emps.map((m: any) => {
             const dept = depts.find((d: any) => d.id === m.department_id);
             const nameParts = m.name?.split(/\s+/) || [];
             return {
                id: m.id,
                firstName: nameParts[0] || "",
                lastName: nameParts.slice(1).join(" ") || "",
                email: m.email,
                gender: m.gender || '',
                department: dept?.name || '',
                designation: m.designation || '',
                role: m.role || 'Employee'
             };
          });
          setDeployedEmployees(loadedEmps);
        }
      }

      // Ensure "Admin Department" is always present as a pre-made non-deletable department
      const hasAdminDept = loadedDepts.some(d => d.name === "Admin Department");
      if (!hasAdminDept) {
        loadedDepts.unshift({
          id: 'admin-default',
          name: 'Admin Department',
          description: 'Default department for administrative operations.',
          designations: []
        });
      }

      // If no other departments have been loaded besides Admin Department, seed default template departments
      const nonAdminLoadedDepts = loadedDepts.filter(d => d.name !== "Admin Department");
      if (nonAdminLoadedDepts.length === 0) {
        const templates = [
          {
            id: 'mgmt-template',
            name: 'Management',
            description: 'Responsible for global strategy, business development, leadership, and operational overview.',
            designations: ['Chief Executive Officer', 'Chief Operating Officer', 'Director', 'General Manager']
          },
          {
            id: 'hr-template',
            name: 'Human Resources',
            description: 'Manages employee relations, talent acquisition, recruitment, benefits, compliance, and training.',
            designations: ['HR Manager', 'HR Generalist', 'Recruiter', 'Talent Acquisition Specialist']
          },
          {
            id: 'finance-template',
            name: 'Finance & Accounts',
            description: 'Manages company banking accounts, equity allocations, financial reporting, budgeting, audit, and tax compliance.',
            designations: ['Finance Manager', 'Chief Accountant', 'Accounts Executive', 'Financial Analyst']
          },
          {
            id: 'ops-template',
            name: 'Operations',
            description: 'Manages day-to-day operations, supply chain logistics, service delivery, and project management.',
            designations: ['Operations Director', 'Operations Manager', 'Project Manager', 'Operations Executive']
          },
          {
            id: 'admin-template',
            name: 'Administration',
            description: 'Manages office administration, corporate services, clerical support, IT support, and facilities.',
            designations: ['Office Administrator', 'Administrative Assistant', 'IT Support Analyst', 'Receptionist']
          }
        ];
        loadedDepts.push(...templates);
      }

      setCreatedDepartments(loadedDepts);

      setShow(true);
      setStep(0); // Always show Phase 0 confirmation on initial load for clarity
      } finally {
        setIsChecking(false);
      }
    };
    checkStatus();
  }, [supabase]);

  if (isChecking) {
    return <div className="fixed inset-0 z-[9999] bg-[#ffffff] transition-opacity duration-300"></div>;
  }

  if (!show) return null;

  const handleNext = async () => {
    setErrorLine("");

    if (step === 1) {
      if (!startTime || !endTime || !companyType || (companyType === 'Other' && !customCompanyType) || !attendanceType || !branchLocation || !adminRole) {
        setErrorLine("Please fill out all mandatory company details.");
        return;
      }
      if (!isValidTimeGap(startTime, startAmPm, endTime, endAmPm)) {
        setErrorLine("Start and End working hours must have a minimum gap of 2 hours.");
        return;
      }
    }

    if (step === 2) {
      const userDepts = createdDepartments.filter(d => d.name !== "Admin Department");
      if (userDepts.length === 0) {
        setErrorLine("Please add at least one department of your own to continue.");
        return;
      }
    }

    if (step === 3) {
      if (deployedEmployees.length < 1) {
        setErrorLine(`Please deploy at least 1 employee to continue. (Current: ${deployedEmployees.length})`);
        return;
      }
      
      // Policy: Enforce that every created department has exactly one Admin (excluding Admin Department)
      const missingAdminDepts = createdDepartments.filter(dept => {
        if (dept.name === "Admin Department") return false;
        return !deployedEmployees.some(e => e.department === dept.name && e.role === "Admin");
      });
      if (missingAdminDepts.length > 0) {
        setErrorLine(`Policy Enforced: Every department must have exactly one Admin. Please assign an Admin for: ${missingAdminDepts[0].name}`);
        return;
      }

      setErrorLine("Verifying all employee emails against the system...");
      try {
        const checkPromises = deployedEmployees.map(async (emp) => {
          try {
            const checkRes = await fetch(`/api/check-email?email=${encodeURIComponent(emp.email.trim().toLowerCase())}`);
            if (!checkRes.ok) {
              console.warn(`Skipping email check for ${emp.email} as API returned status ${checkRes.status}`);
              return null;
            }
            const checkData = await checkRes.json();
            if (checkData.exists) {
              return { email: emp.email, name: `${emp.firstName} ${emp.lastName}` };
            }
          } catch (e) {
            console.warn(`Skipping email check for ${emp.email} due to network/server error:`, e);
          }
          return null;
        });

        const results = await Promise.all(checkPromises);
        const firstError = results.find(r => r !== null);
        if (firstError) {
          setErrorLine(`Email check failed: Employee ${firstError.name} (${firstError.email}) is already registered in the system.`);
          return;
        }
      } catch (err: any) {
        console.warn("Batch email validation error (skipped to prevent blocking):", err);
      }
    }

    if (step === 4) {
      if (!hasSkippedDepartments) {
        const userDepts = createdDepartments.filter(d => d.name !== "Admin Department");
        if (userDepts.length === 0) {
          setErrorLine("Please add at least one department of your own to continue.");
          return;
        }
      }
      if (!hasSkippedEmployees) {
        if (deployedEmployees.length < 1) {
          setErrorLine(`Please deploy at least 1 employee to continue. (Current: ${deployedEmployees.length})`);
          return;
        }
      }

      // Policy: Enforce that every created department has exactly one Admin (excluding Admin Department)
      if (!hasSkippedEmployees) {
        const missingAdminDepts = createdDepartments.filter(dept => {
          if (dept.name === "Admin Department") return false;
          return !deployedEmployees.some(e => e.department === dept.name && e.role === "Admin");
        });
        if (missingAdminDepts.length > 0) {
          setErrorLine(`Policy Enforced: Every department must have exactly one Admin. Please assign an Admin for: ${missingAdminDepts[0].name}`);
          return;
        }
      }
    }

    setErrorLine("");
    setStep((prev) => {
      const nextStep = prev + 1;
      // Auto-set selectedOverviewDept if moving to Overview
      if (nextStep === 4 && createdDepartments.length > 0 && !selectedOverviewDept) {
        setSelectedOverviewDept(createdDepartments[0].name);
      }
      return nextStep;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorLine("Maximum image size is 10MB");
        return;
      }
      setErrorLine("");
      const url = URL.createObjectURL(file);
      setProfilePic(url);
      setCroppedPreviewUrl(null); // reset any previous crop
      setPicFile(file);
      setPicZoom(1);
      setPan({ x: 0, y: 0 });
      setIsEditingPic(true);
    }
    // reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleRemovePic = () => {
    setProfilePic(null);
    setCroppedPreviewUrl(null);
    setPicFile(null);
    setPicZoom(1);
    setPan({ x: 0, y: 0 });
    setIsEditingPic(false);
  };

  // Bake pan+zoom into a square canvas that exactly mirrors the CSS transform:
  // transform: scale(picZoom) translate(pan.x%, pan.y%)  transformOrigin: center center
  const confirmCrop = () => {
    if (!profilePic || !cropperRef.current) {
      setIsEditingPic(false);
      return;
    }
    const containerEl = cropperRef.current;
    const size = containerEl.offsetWidth;
    const OUTPUT_SIZE = 512;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d')!;

      // Image geometry inside wrapper using object-contain
      const imgScale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
      const imgDrawW = img.naturalWidth * imgScale;
      const imgDrawH = img.naturalHeight * imgScale;
      const imgOffsetX = (size - imgDrawW) / 2;
      const imgOffsetY = (size - imgDrawH) / 2;

      // CSS translate percentages are relative to the wrapper's own size
      const tx = (pan.x / 100) * size;
      const ty = (pan.y / 100) * size;

      // scale(picZoom) around center. A wrapper-space point P maps to container at:
      //   cont = center + (P + translate - center) * picZoom
      const cx = size / 2;
      const cy = size / 2;
      const contImgX = cx + (imgOffsetX + tx - cx) * picZoom;
      const contImgY = cy + (imgOffsetY + ty - cy) * picZoom;
      const contImgW = imgDrawW * picZoom;
      const contImgH = imgDrawH * picZoom;

      // Map container â†’ canvas
      const ratio = OUTPUT_SIZE / size;
      ctx.drawImage(
        img,
        0, 0, img.naturalWidth, img.naturalHeight,
        contImgX * ratio, contImgY * ratio, contImgW * ratio, contImgH * ratio
      );

      canvas.toBlob((blob) => {
        if (blob) setCroppedPreviewUrl(URL.createObjectURL(blob));
        setIsEditingPic(false);
      }, 'image/jpeg', 0.92);
    };
    img.src = profilePic;
  };


  // Bake admin avatar crop
  const confirmAdminCrop = () => {
    if (!adminPic || !adminCropperRef.current) { setIsEditingAdminPic(false); return; }
    const size = adminCropperRef.current.offsetWidth;
    const OUTPUT_SIZE = 512;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE; canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d')!;
      const imgScale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
      const imgDrawW = img.naturalWidth * imgScale;
      const imgDrawH = img.naturalHeight * imgScale;
      const imgOffsetX = (size - imgDrawW) / 2;
      const imgOffsetY = (size - imgDrawH) / 2;
      const tx = (adminPan.x / 100) * size;
      const ty = (adminPan.y / 100) * size;
      const cx = size / 2; const cy = size / 2;
      const contImgX = cx + (imgOffsetX + tx - cx) * adminPicZoom;
      const contImgY = cy + (imgOffsetY + ty - cy) * adminPicZoom;
      const ratio = OUTPUT_SIZE / size;
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight,
        contImgX * ratio, contImgY * ratio, imgDrawW * adminPicZoom * ratio, imgDrawH * adminPicZoom * ratio);
      canvas.toBlob((blob) => {
        if (blob) setAdminCroppedUrl(URL.createObjectURL(blob));
        setIsEditingAdminPic(false);
      }, 'image/jpeg', 0.92);
    };
    img.src = adminPic;
  };

  // Drag logic for Cropper
  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    lastPos.current = { x: clientX, y: clientY };
  };

  const onDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !cropperRef.current) return;
    const { width, height } = cropperRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - lastPos.current.x;
    const dy = clientY - lastPos.current.y;
    
    setPan(prev => ({ 
      x: prev.x + ((dx / width) * 100) / picZoom, 
      y: prev.y + ((dy / height) * 100) / picZoom 
    }));
    
    lastPos.current = { x: clientX, y: clientY };
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  const startAdminDrag = (e: React.MouseEvent | React.TouchEvent) => {
    setIsAdminDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    adminLastPos.current = { x: clientX, y: clientY };
  };

  const onAdminDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isAdminDragging || !adminCropperRef.current) return;
    const { width, height } = adminCropperRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - adminLastPos.current.x;
    const dy = clientY - adminLastPos.current.y;
    setAdminPan(prev => ({
      x: prev.x + ((dx / width) * 100) / adminPicZoom,
      y: prev.y + ((dy / height) * 100) / adminPicZoom,
    }));
    adminLastPos.current = { x: clientX, y: clientY };
  };

  const stopAdminDrag = () => {
    setIsAdminDragging(false);
  };

  const handleSubmit = async () => {
    const validDepts = createdDepartments.filter(d => true);
    if (!hasSkippedDepartments) {
      const userDepts = createdDepartments.filter(d => d.name !== "Admin Department");
      if (userDepts.length === 0) {
        setErrorLine("Please add at least one department of your own.");
        return;
      }
    }

    if (!hasSkippedEmployees) {
      const totalEmployees = deployedEmployees.length;
      if (totalEmployees === 0) {
        setErrorLine("You must add at least 1 employee to proceed.");
        return;
      }
    }



    if (!companyName) {
      setErrorLine("Company Name is missing. Please ensure it is set up correctly.");
      return;
    }
    
    setErrorLine("");
    setLoading(true); // Changed from setIsSubmitting

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No user found");

      const finalIndustry = industry === 'Other' ? customIndustry : industry;
      let logoUrl = null;

      // Helper: slugify company name for folder path
      const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const userEmail = userData.user.email || userData.user.id;
      const emailSlug = userEmail.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      if (croppedPreviewUrl || picFile) {
        // Prefer the baked crop blob; fall back to raw file if crop wasn't confirmed
        let uploadBlob: Blob;
        if (croppedPreviewUrl) {
          const res = await fetch(croppedPreviewUrl);
          uploadBlob = await res.blob();
        } else {
          uploadBlob = picFile!;
        }
        const fileExt = picFile ? picFile.name.split('.').pop() : 'jpg';
        // Streamlined path: Company_Logo/{company_slug}/{company_id}.ext
        const filePath = `Company_Logo/${companySlug}/${userData.user.id}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('public_assets')
          .upload(filePath, uploadBlob, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('public_assets')
          .getPublicUrl(filePath);
          
        logoUrl = publicUrlData.publicUrl;
      } else if (profilePic && !profilePic.startsWith('blob:')) {
        // profilePic is a remote URL (pre-loaded from DB), keep existing
        logoUrl = profilePic;
      }

      // Upload admin avatar if a new one was picked
      // New path: {company_name}/avatars/{email-slug}.ext
      let adminAvatarUrl: string | null = null;
      if (adminCroppedUrl || adminPicFile) {
        let uploadBlob: Blob;
        if (adminCroppedUrl) {
          const res = await fetch(adminCroppedUrl);
          uploadBlob = await res.blob();
        } else {
          uploadBlob = adminPicFile!;
        }
        const fileExt = adminPicFile ? adminPicFile.name.split('.').pop() : 'jpg';
        // Streamlined path: User_Avatar/{company_slug}/{user_id}.ext
        const adminFilePath = `User_Avatar/${companySlug}/${userData.user.id}.${fileExt}`;
        const { error: adminUploadErr } = await supabase.storage
          .from('public_assets')
          .upload(adminFilePath, uploadBlob, { upsert: true });
        if (adminUploadErr) throw adminUploadErr;
        const { data: adminUrlData } = supabase.storage
          .from('public_assets')
          .getPublicUrl(adminFilePath);
        adminAvatarUrl = adminUrlData.publicUrl;
      } else if (adminPic && !adminPic.startsWith('blob:')) {
        // Keep the existing remote URL
        adminAvatarUrl = adminPic;
      }

      // Determine final company type
      const finalCompanyType = companyType === 'Other' ? customCompanyType : companyType;

      const updatePayload: any = {
        company_id: userData.user.id,
        company_name: companyName,
        company_email: companyEmail,
        company_phone: companyPhone,
        industry: finalIndustry,
        start_time: startTime,
        end_time: endTime,
        company_type: finalCompanyType,
        attendance_type: attendanceType,
        branch_location: branchLocation,
        setup_completed: true,
        // Super Admin details
        super_admin_name: `${adminFirstName.trim()} ${adminLastName.trim()}`,
        super_admin_role: adminRole,
        single_admin_per_department: true,
      };

      if (logoUrl) updatePayload.logo_url = logoUrl;
      if (adminAvatarUrl) updatePayload.super_admin_avatar_url = adminAvatarUrl;

      const { error: companyErr } = await supabase.from('company_settings').upsert(updatePayload, { onConflict: 'company_id' });
      if (companyErr) throw companyErr;

      // Clean up old departments & employees before re-inserting
      const { data: oldDepts } = await supabase.from('departments').select('id').eq('company_id', userData.user.id);
      if (oldDepts && oldDepts.length > 0) {
        const oldDeptIds = oldDepts.map((d: any) => d.id);
        await supabase.from('employees').delete().in('department_id', oldDeptIds);
        await supabase.from('departments').delete().eq('company_id', userData.user.id);
      }
      const departmentMap: Record<string, string> = {};

      // Insert Phase 2 createdDepartments (with designations) and extract database UUIDs
      let deptIndex = 0;
      const initials = getCompanyInitials(companyName);
      for (const dept of createdDepartments) {
        const generatedDeptId = generateDeptId(initials, deptIndex + 1);
        deptIndex++;
        const { data: dbDept, error: cdErr } = await supabase
          .from('departments')
          .insert({
            company_id: userData.user.id,
            name: dept.name,
            description: dept.description || null,
            designations: dept.designations,
            dept_id: generatedDeptId,
          })
          .select('id, name')
          .single();
          
        if (cdErr) throw cdErr;
        if (dbDept) {
          departmentMap[dbDept.name] = dbDept.id;
        }
      }

      // Insert Phase 3 Deployed Employees
      const employeePayloads: any[] = [];
      let empIndex = 0;
      for (const emp of deployedEmployees) {
        const generatedEmpId = buildEmpId(companyName, empIndex++);
        const primaryPayload = {
          company_id: userData.user.id,
          department_id: departmentMap[emp.department] || null,
          name: `${emp.firstName.trim()} ${emp.lastName.trim()}`,
          email: emp.email,
          role: emp.role,
          gender: emp.gender,
          designation: emp.designation,
          is_head: emp.role === 'Admin' || emp.role === 'Sub Admin',
          emp_id: generatedEmpId,
          custom_fields: { added_via_onboard: true }
        };
        employeePayloads.push(primaryPayload);

        // If app role is Admin, also add them to the Admin Department (if not already selected as Admin Department)
        if (emp.role === "Admin" && emp.department !== "Admin Department" && departmentMap["Admin Department"]) {
          const adminDeptPayload = {
            company_id: userData.user.id,
            department_id: departmentMap["Admin Department"],
            name: `${emp.firstName.trim()} ${emp.lastName.trim()}`,
            email: emp.email,
            role: emp.role,
            gender: emp.gender,
            designation: emp.designation,
            is_head: true,
            emp_id: generatedEmpId,
            custom_fields: { added_via_onboard: true }
          };
          employeePayloads.push(adminDeptPayload);
        }
      }

      if (employeePayloads.length > 0) {
        const { data: newEmps, error: empErr } = await supabase.from('employees').insert(employeePayloads).select('id, email');
        if (empErr) throw empErr;

        if (newEmps && newEmps.length > 0) {
          const notifPayloads = newEmps.map((emp: any) => ({
            employee_id: emp.id,
            title: "New Employee Onboarded",
            message: `Employee ${emp.email} has been onboarded.`,
            type: "info",
            is_read: false
          }));
          await supabase.from("notifications").insert(notifPayloads);

          // Invite all newly added employees
          await Promise.allSettled(newEmps.map((emp: any) => 
            fetch("/api/employee-credentials", {
              method: "POST",
              body: JSON.stringify({
                action: "invite",
                email: emp.email,
                employeeId: emp.id
              })
            })
          ));
        }
      }

      setShow(false);
      window.location.reload(); // Force full reload so Sidebar and UI reflect new settings

    } catch (err: any) {
      setErrorLine(err?.message || "Something went wrong during setup.");
      setLoading(false);
    }
  };

  // â”€â”€â”€ Employee Welcome Popup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (showEmployeeWelcome && employeeCompanyInfo) {
    const { companyName, industry, logoUrl, email } = employeeCompanyInfo;
    const initials = companyName.replace(/[^a-zA-Z ]/g, '').split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() || 'CO';
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[24px]">
        <div className="w-full max-w-[400px] bg-white rounded-[28px] shadow-[0_24px_48px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          {/* Header accent */}
          <div className="h-2 w-full bg-gradient-to-r from-[#007AFF] to-[#00C7FF]" />

          <div className="px-8 py-8 flex flex-col items-center text-center">
            {/* Company logo / initials */}
            <div className="h-20 w-20 rounded-[20px] mb-5 flex items-center justify-center overflow-hidden shadow-lg"
              style={{ background: logoUrl ? 'transparent' : 'linear-gradient(135deg, #007AFF 0%, #00C7FF 100%)' }}>
              {logoUrl ? (
                <img src={logoUrl} alt={companyName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-[28px] font-extrabold text-white tracking-wider">{initials}</span>
              )}
            </div>

            <p className="text-[12px] font-bold tracking-[0.12em] uppercase text-[#007AFF] mb-2">Welcome Back</p>
            <h1 className="text-[26px] font-extrabold text-[#1C1C1E] leading-tight tracking-tight mb-1">{companyName}</h1>
            {industry && <p className="text-[13px] text-[#8E8E93] font-medium mb-5">{industry}</p>}

            <div className="w-full bg-[#F2F2F7] rounded-[14px] p-4 mb-6 text-left">
              <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest mb-1">You are signing in to</p>
              <p className="text-[14px] font-semibold text-[#1C1C1E]">{companyName}</p>
              {email && <p className="text-[12px] text-[#8E8E93] font-medium mt-0.5">{email}</p>}
            </div>

            <button
              onClick={() => setShowEmployeeWelcome(false)}
              className="w-full py-3.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] rounded-[16px] text-white font-bold text-[15px] transition-all duration-150 shadow-md shadow-[#007AFF]/30"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (!show) return null;

  return (
    <div
      className={`onboarding-modal-root flex items-center justify-center ${
        step <= 5
          ? 'fixed inset-0 z-[9999] bg-white'
          : 'fixed inset-0 z-[9999] p-4 sm:p-6 bg-black/40 backdrop-blur-[24px]'
      }`}
    >

      <style>{`
        .onboarding-modal-root {
          color-scheme: light !important;
        }
        .onboarding-modal-root h1, 
        .onboarding-modal-root h2, 
        .onboarding-modal-root h3,
        .onboarding-modal-root p, 
        .onboarding-modal-root label,
        .onboarding-modal-root span:not(.avatar-initials):not(.cs-placeholder) {
          color: #000000 !important;
        }
        .onboarding-modal-root input,
        .onboarding-modal-root select,
        .onboarding-modal-root textarea,
        .dark .onboarding-modal-root input,
        .dark .onboarding-modal-root select,
        .dark .onboarding-modal-root textarea {
          color: #000000 !important;
          background-color: #ffffff !important;
          border-color: #E5E5EA !important;
        }
        .dark .onboarding-modal-root input::placeholder {
          color: #8E8E93 !important;
        }
        .onboarding-modal-root select.is-placeholder,
        .dark .onboarding-modal-root select.is-placeholder {
          color: #8E8E93 !important;
        }
        .onboarding-modal-root .bg-white {
          background-color: #ffffff !important;
        }
        .onboarding-gray-text {
          color: #D9D9D9 !important;
        }
        .onboarding-dark-gray-text {
          color: #3C3C43 !important;
        }
        .cs-placeholder {
          color: #8E8E93 !important;
        }
      `}</style>
      <div
        className={`w-full relative flex flex-col transition-all duration-500 overflow-hidden ${
          step <= 5 ? 'h-full justify-center items-center bg-white' : `rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] max-h-[90vh] max-w-[480px]`
        }`}
        style={{ backgroundColor: '#ffffff' }}
      >
        {/* Outer scrolling area if it exceeds height */}
        <div className={`w-full flex-1 min-h-0 ${step <= 5 ? 'flex flex-col overflow-hidden' : 'overflow-y-auto no-scrollbar pb-8 px-8'}`}>
          {/* Main content wrapper */}

          {/* Step 0: Sign-in Confirmation - Full Page, always light theme */}
          {step === 0 && (
            <div
              className="flex flex-col items-center justify-center text-center w-full h-full px-4 min-h-[400px]"
              style={{ backgroundColor: '#ffffff', animation: 'fadeIn 0.4s ease' }}
            >
              {/* Vertex Logo */}
              <img
                src="/Icons/VertexLogo.svg"
                alt="Vertex"
                style={{ width: 48, height: 48, marginBottom: 20, objectFit: 'contain' }}
              />
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#000000 !important', marginBottom: 6 }}>
                Continue as {companyName || 'Dort Asia'}
              </h1>
              <p className="onboarding-gray-text" style={{ fontSize: 13, marginBottom: 40, fontWeight: 500 }}>
                do you want to continue as {companyName || 'Dort Asia'}?
              </p>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 24, width: '100%', maxWidth: 480 }}>
                {/* Logo Group */}
                <div style={{ position: 'relative', flexShrink: 0, marginTop: 4 }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%',
                    backgroundColor: '#E5F1FF', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <img src={getCompanyLogoUrl(croppedPreviewUrl ?? profilePic, companyName || 'Dort Asia')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Company" />
                  </div>
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 26, height: 26, borderRadius: '50%',
                    backgroundColor: '#ffffff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: 2
                  }}>
                    <div style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <img src={getUserAvatarUrl(adminCroppedUrl ?? adminPic)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="User" />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, textAlign: 'left', minWidth: 320 }}>
                  <div style={{
                    width: '100%', backgroundColor: '#F8F9FA', borderRadius: 16,
                    padding: '16px 20px', display: 'flex', flexDirection: 'column',
                    alignItems: 'flex-start', marginBottom: 24,
                  }}>
                    <span className="onboarding-dark-gray-text" style={{ fontSize: 11, fontWeight: 500 }}>Company</span>
                    <span className="onboarding-gray-text" style={{ fontSize: 16, fontWeight: 600 }}>{companyName || 'Dort Asia'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', width: '100%', paddingLeft: 8, paddingRight: 4 }}>
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        const landingUrl = (process.env.NEXT_PUBLIC_LANDING_URL || 'https://dortasia.vercel.app').replace(/\/$/, '');
                        window.location.href = `${landingUrl}/login?logout=true`;
                      }}
                      style={{ color: '#007AFF', fontSize: 13, fontWeight: 700, transition: 'all', whiteSpace: 'nowrap', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      Use Different Account?
                    </button>
                    <button
                      onClick={() => setStep(1)}
                      style={{
                        padding: '10px 40px', backgroundColor: '#007AFF',
                        borderRadius: 8, color: '#ffffff', fontSize: 14,
                        fontWeight: 700, transition: 'all', whiteSpace: 'nowrap',
                        border: 'none', cursor: 'pointer'
                      }}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Configure Company */}
          {step === 1 && (
            <div className="w-full h-full flex flex-col bg-white animate-in fade-in duration-500">
              <div className="w-full flex items-center justify-between px-10 py-8 shrink-0">
                <div className="flex items-center gap-4">
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <img src={getCompanyLogoUrl(croppedPreviewUrl ?? profilePic, companyName || 'Company')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Company" />
                    </div>
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={getUserAvatarUrl(adminCroppedUrl ?? adminPic)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Admin" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="onboarding-dark-gray-text text-[11px] font-medium leading-none">Company</span>
                    <span className="text-[#000000] text-[16px] font-bold leading-none">{companyName || 'Your Company'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[14px]">
                  <span className="text-[#8E8E93] font-medium">Phase : </span>
                  <span className="text-[#007AFF] font-bold">1 out of 5</span>
                </div>
              </div>

              {/* Single-column centered content */}
              <div className="flex-1 flex flex-col border-t border-[#E5E5EA] items-center justify-center w-full px-4">
                <div className="w-full max-w-[480px]">
                  <h1 className="text-[22px] font-bold text-[#000000] mb-2 text-center">Configure Company</h1>
                  <p className="onboarding-gray-text text-[14px] font-medium mb-10 text-center">Configure Your Company to get started</p>

                  <div className="w-full space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="relative">
                        <label className="absolute -top-[9px] left-4 bg-white px-1 text-[11px] font-medium text-[#000000] z-10 pointer-events-none">Start Time</label>
                        <input type="text" placeholder="HH : MM" value={startTime} onChange={(e) => setStartTime(formatTimeInput(e.target.value))} className="w-full pl-5 pr-[80px] py-[18px] bg-white !shadow-none border border-[#E5E5EA] rounded-[20px] text-[#1C1C1E] text-[14px] font-medium focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition-all placeholder:text-[#C7C7CC] truncate" />
                        <div className="absolute right-2.5 top-[10px] bottom-[10px] !bg-[#F2F2F7] rounded-full p-[3px] flex items-center">
                          <button onClick={() => setStartAmPm('AM')} className={`px-3 py-[6px] rounded-full text-[13px] font-medium transition-all ${startAmPm === 'AM' ? 'bg-white text-[#1C1C1E] !shadow-none ring-0' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}>AM</button>
                          <button onClick={() => setStartAmPm('PM')} className={`px-3 py-[6px] rounded-full text-[13px] font-medium transition-all ${startAmPm === 'PM' ? 'bg-white text-[#1C1C1E] !shadow-none ring-0' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}>PM</button>
                        </div>
                      </div>
                      <div className="relative">
                        <label className="absolute -top-[9px] left-4 bg-white px-1 text-[11px] font-medium text-[#000000] z-10 pointer-events-none">End Time</label>
                        <input type="text" placeholder="HH : MM" value={endTime} onChange={(e) => setEndTime(formatTimeInput(e.target.value))} className="w-full pl-5 pr-[80px] py-[18px] bg-white !shadow-none border border-[#E5E5EA] rounded-[20px] text-[#1C1C1E] text-[14px] font-medium focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition-all placeholder:text-[#C7C7CC] truncate" />
                        <div className="absolute right-2.5 top-[10px] bottom-[10px] !bg-[#F2F2F7] rounded-full p-[3px] flex items-center">
                          <button onClick={() => setEndAmPm('AM')} className={`px-3 py-[6px] rounded-full text-[13px] font-medium transition-all ${endAmPm === 'AM' ? 'bg-white text-[#1C1C1E] !shadow-none ring-0' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}>AM</button>
                          <button onClick={() => setEndAmPm('PM')} className={`px-3 py-[6px] rounded-full text-[13px] font-medium transition-all ${endAmPm === 'PM' ? 'bg-white text-[#1C1C1E] !shadow-none ring-0' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}>PM</button>
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <CustomSelect
                        label="Company Type"
                        value={companyType}
                        onChange={setCompanyType}
                        options={['Technology','Business & Trade','Services','Creative & Media','Education','Health & Wellness','Food & Hospitality','Manufacturing & Industry','Non-Profit & Government','Other']}
                        placeholder="Choose Company Type"
                      />
                    </div>

                    {companyType === 'Other' && (
                      <div className="relative animate-in slide-in-from-top-2 fade-in duration-300">
                        <label className="absolute -top-[9px] left-4 bg-white px-1 text-[11px] font-medium text-[#000000] z-10 pointer-events-none">Specify Other Type</label>
                        <input type="text" placeholder="E.g., Logistics, Real Estate..." value={customCompanyType} onChange={(e) => setCustomCompanyType(e.target.value)} className="w-full px-5 py-[18px] bg-white !shadow-none border border-[#E5E5EA] rounded-[20px] text-[#1C1C1E] text-[14px] font-medium focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition-all placeholder:text-[#C7C7CC] truncate" />
                      </div>
                    )}

                    <div className="relative">
                      <CustomSelect
                        label="Attendance Type"
                        value={attendanceType}
                        onChange={setAttendanceType}
                        options={['Mobile Attendance','Manual Attendance','Web Attendance']}
                        placeholder="Choose Attendance Type"
                      />
                    </div>

                    <div className="relative">
                      <label className="absolute -top-[9px] left-4 bg-white px-1 text-[11px] font-medium text-[#000000] z-10 pointer-events-none">Branch Location</label>
                      <input 
                        type="text" 
                        placeholder="E.g., Head Office, New York Branch..." 
                        value={branchLocation} 
                        onChange={(e) => setBranchLocation(e.target.value)} 
                        className="w-full px-5 py-[18px] bg-white !shadow-none border border-[#E5E5EA] rounded-[20px] text-[#1C1C1E] text-[14px] font-medium focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition-all placeholder:text-[#C7C7CC] truncate" 
                      />
                    </div>

                    <div className="relative">
                      <label className="absolute -top-[9px] left-4 bg-white px-1 text-[11px] font-medium text-[#000000] z-10 pointer-events-none">Super Admin Designation</label>
                      <input 
                        type="text" 
                        placeholder="E.g., CEO, Founder, Director..." 
                        value={adminRole} 
                        onChange={(e) => setAdminRole(e.target.value)} 
                        className="w-full px-5 py-[18px] bg-white !shadow-none border border-[#E5E5EA] rounded-[20px] text-[#1C1C1E] text-[14px] font-medium focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition-all placeholder:text-[#C7C7CC] truncate" 
                      />
                    </div>
                  </div>

                  <div className="mt-10 w-full flex flex-col items-center">
                    <div className="h-4 mb-2 flex items-center justify-center">
                      {errorLine && <span className="text-[12px] font-semibold text-[#FF3B30] animate-in fade-in">{errorLine}</span>}
                    </div>
                    <button 
                      onClick={handleNext} 
                      disabled={!startTime || !endTime || !companyType || (companyType === 'Other' && !customCompanyType) || !attendanceType || !branchLocation || !adminRole || !isValidTimeGap(startTime, startAmPm, endTime, endAmPm)}
                      className="w-[180px] py-[14px] bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] rounded-[14px] text-white font-bold text-[15px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Onboard Departments */}
          {step === 2 && (
            <div className="w-full h-full flex flex-col bg-white animate-in fade-in duration-500">
              <div className="w-full flex items-center justify-between px-10 py-8 shrink-0">
                <div className="flex items-center gap-4">
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: '#E5F1FF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #007AFF' }}>
                      {(croppedPreviewUrl || profilePic) ? (<img src={croppedPreviewUrl ?? profilePic!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Company" />) : (<span className="avatar-initials" style={{ fontSize: 20, fontWeight: 800, color: '#007AFF' }}>{getInitials(companyName || 'CO')}</span>)}
                    </div>
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#007AFF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #007AFF' }}>
                        {(adminCroppedUrl || adminPic) ? (<img src={adminCroppedUrl ?? adminPic!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Admin" />) : (<span className="avatar-initials" style={{ fontSize: 9, fontWeight: 800, color: '#ffffff' }}>{adminFirstName ? (adminFirstName[0] + (adminLastName?.[0] || '')).toUpperCase() : getInitials(companyName || 'CO')}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="onboarding-dark-gray-text text-[11px] font-medium leading-none">Company</span>
                    <span className="text-[#000000] text-[16px] font-bold leading-none">{companyName || 'Your Company'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[14px]">
                  <span className="text-[#8E8E93] font-medium">Phase : </span>
                  <span className="text-[#007AFF] font-bold">2 out of 5</span>
                </div>
              </div>

              <div className="flex w-full flex-1 border-t border-[#E5E5EA] overflow-hidden">
                <div className="w-[50%] flex flex-col px-[55px] py-[35px] border-r border-[#E5E5EA] h-full overflow-hidden">
                  <h3 className="text-[17px] font-bold !text-[#1C1C1E] mb-1 shrink-0 flex items-center gap-2">
                    Created Departments <span className="text-[11px] font-bold text-[#FF9500] uppercase tracking-wider bg-[#FF9500]/10 px-2 py-[2px] rounded-md">(Max 5 While Setup)</span>
                  </h3>
                  <p className="text-[13px] font-medium !text-[#8E8E93] mb-6 shrink-0">Departments can be updated and configured after setup</p>
                  
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-2">
                    {createdDepartments.length === 0 ? (
                      <div className="w-full h-[100px] border-2 border-dashed border-[#E5E5EA] rounded-[18px] flex items-center justify-center">
                        <span className="text-[#8E8E93] text-[13px] font-medium">No departments created yet</span>
                      </div>
                    ) : (
                      createdDepartments.map((dept) => {
                        return (
                          <div key={dept.id} className="w-full bg-[#FAFAFC] rounded-[32px] p-5 flex items-center justify-between transition-all hover:bg-[#F2F2F7] border border-[#E5E5EA]">
                            <div className="flex items-center gap-4 flex-[1.5] min-w-0">
                              <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: getDepartmentColor(dept.name).bg }}>
                                <span className="font-bold text-[16px] avatar-initials" style={{ color: getDepartmentColor(dept.name).color }}>{dept.name.substring(0,2).toUpperCase()}</span>
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[15px] font-bold !text-[#1C1C1E] truncate">{dept.name}</span>
                                  {dept.name === "Admin Department" && (
                                    <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-wider bg-[#007AFF]/10 px-2 py-[2px] rounded-md shrink-0">Default</span>
                                  )}
                                </div>
                                <span className="text-[12px] font-medium text-[#8E8E93] truncate">{dept.description || 'Description'}</span>
                              </div>
                            </div>
                            
                            <div className="flex-1 text-center shrink-0">
                              {dept.name === "Admin Department" ? (
                                <span className="text-[12px] font-bold text-[#007AFF] bg-[#007AFF]/10 px-3 py-1.5 rounded-full whitespace-nowrap">Admins Only</span>
                              ) : (
                                <span className="text-[14px] font-semibold !text-[#1C1C1E] whitespace-nowrap">{dept.designations.length} Designation Created</span>
                              )}
                            </div>

                            {dept.name !== "Admin Department" ? (
                              <button onClick={() => handleRemoveDepartment(dept.id)} className="h-10 w-10 text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-full flex items-center justify-center transition-colors shrink-0">
                                <Trash2 className="h-5 w-5" />
                              </button>
                            ) : (
                              <div className="h-10 w-10 shrink-0" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="w-[50%] flex flex-col px-[55px] py-[35px] relative h-full overflow-hidden">
                  <div className="flex-1 overflow-y-auto no-scrollbar pb-[100px]">
                    <h2 className="text-[28px] font-extrabold !text-[#1C1C1E] mb-2 tracking-tight text-center">Onboard Departments</h2>
                    <p className="text-[14px] font-medium !text-[#8E8E93] text-center mb-10">Create departments to deploy your employees</p>
                    <div className="w-full max-w-[480px] mx-auto space-y-5">
                      <div className="relative">
                        <label className="absolute left-[18px] -top-2.5 bg-white px-1.5 text-[11px] font-medium text-[#000000] z-10">Department Name</label>
                        <input type="text" placeholder="Enter department name" value={deptName} onChange={(e) => setDeptName(e.target.value)} className="w-full h-[52px] px-5 bg-white !shadow-none border border-[#E5E5EA] rounded-[16px] text-[15px] font-semibold !text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all placeholder:text-[#C7C7CC] truncate" />
                      </div>
                      <div className="relative">
                        <label className="absolute left-[18px] -top-2.5 bg-white px-1.5 text-[11px] font-medium text-[#000000] z-10">Description</label>
                        <input type="text" placeholder="About this department" value={deptDesc} onChange={(e) => setDeptDesc(e.target.value)} maxLength={100} className="w-full h-[52px] px-5 bg-white !shadow-none border border-[#E5E5EA] rounded-[16px] text-[15px] font-semibold !text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all placeholder:text-[#C7C7CC] truncate" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="relative w-full">
                          <label className="absolute left-[18px] -top-2.5 bg-white px-1.5 text-[11px] font-medium text-[#000000] z-10">Designations</label>
                          <input type="text" placeholder="Type & press Enter (use comma to separate)" value={desigName} onChange={(e) => setDesigName(e.target.value)}
                            onKeyDown={(e) => { 
                              if (e.key === 'Enter') { 
                                e.preventDefault(); 
                                if (desigName.trim()) {
                                  handleAddDesignation(); 
                                } else if (deptName.trim() && designations.length > 0 && createdDepartments.length < 5) {
                                  handleDeployDepartment(); 
                                } 
                              } 
                            }}
                            className="w-full h-[52px] px-5 bg-white !shadow-none border border-[#E5E5EA] rounded-[16px] text-[15px] font-semibold !text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all placeholder:text-[#C7C7CC] truncate" />
                        </div>
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[11px] font-medium text-[#8E8E93]">
                            Press Enter or use commas to separate multiple designations
                          </span>
                          {designations.length === 0 && (
                            <span className="text-[11px] font-bold text-[#FF3B30]">
                              * Add at least 1 designation
                            </span>
                          )}
                        </div>
                      </div>

                      {designations.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {designations.map(d => (
                            <div key={d} className="flex items-center gap-2 !bg-[#F2F2F7] px-3 py-1.5 rounded-full animate-in fade-in duration-200">
                              <span className="text-[12px] font-semibold !text-[#1C1C1E]">{d}</span>
                              <button onClick={() => handleRemoveDesignation(d)} className="!text-[#8E8E93] hover:!text-[#1C1C1E] transition-colors"><X className="w-[11px] h-[11px] stroke-[2.5]" /></button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-center mt-3">
                        <button 
                          onClick={handleDeployDepartment} 
                          disabled={!deptName.trim() || designations.length === 0 || createdDepartments.length >= 5} 
                          className="h-[48px] px-[24px] bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] font-bold rounded-[14px] transition-all text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Department
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-[35px] left-[55px] right-[55px] flex justify-between items-center bg-white z-[20]">
                    <button onClick={() => setStep(1)} className="text-[#007AFF] font-bold text-[16px] hover:text-[#0062CC] transition-colors">Back</button>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => { setErrorLine(""); setHasSkippedDepartments(true); setStep(3); }} 
                        className="text-[#8E8E93] font-bold text-[16px] hover:text-[#1C1C1E] transition-colors leading-[52px] px-2"
                      >
                        Skip
                      </button>
                      <button 
                        onClick={handleNext} 
                        disabled={createdDepartments.filter(d => d.name !== "Admin Department").length === 0}
                        className="h-[52px] px-[40px] !bg-[#007AFF] hover:!bg-[#0062CC] active:scale-[0.98] text-white font-bold rounded-[14px] transition-all text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Onboard Employees */}
          {step === 3 && (
            <div className="w-full h-full flex flex-col bg-white animate-in fade-in duration-500 relative">
              <div className="w-full flex items-center justify-between px-10 py-8 shrink-0">
                <div className="flex items-center gap-4">
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: '#E5F1FF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #007AFF' }}>
                      {(croppedPreviewUrl || profilePic) ? (<img src={croppedPreviewUrl ?? profilePic!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Company" />) : (<span className="avatar-initials" style={{ fontSize: 20, fontWeight: 800, color: '#007AFF' }}>{getInitials(companyName || 'CO')}</span>)}
                    </div>
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#007AFF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #007AFF' }}>
                        {(adminCroppedUrl || adminPic) ? (<img src={adminCroppedUrl ?? adminPic!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Admin" />) : (<span className="avatar-initials" style={{ fontSize: 9, fontWeight: 800, color: '#ffffff' }}>{adminFirstName ? (adminFirstName[0] + (adminLastName?.[0] || '')).toUpperCase() : getInitials(companyName || 'CO')}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="onboarding-dark-gray-text text-[11px] font-medium leading-none">Company</span>
                    <span className="text-[#000000] text-[16px] font-bold leading-none">{companyName || 'Your Company'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[14px]">
                  <span className="text-[#8E8E93] font-medium">Phase : </span>
                  <span className="text-[#007AFF] font-bold">3 out of 5</span>
                </div>
              </div>
              
              <div className="flex w-full flex-1 border-t border-[#E5E5EA] overflow-hidden relative">
                {/* Left Side: Deployed Employees List */}
                <div className="w-[50%] flex flex-col px-[55px] py-[35px] border-r border-[#E5E5EA] h-full overflow-hidden relative">
                  <div className="mb-6 shrink-0">
                    <h3 className="text-[17px] font-bold !text-[#1C1C1E] flex items-center gap-2">
                      Deployed Employees <span className="text-[11px] font-bold text-[#FF9500] uppercase tracking-wider bg-[#FF9500]/10 px-2 py-[2px] rounded-md">(Max 15 While Setup)</span>
                    </h3>
                    <p className="text-[13px] font-medium !text-[#8E8E93] mt-1.5">
                      The Deployed Employees are partially onboarded, update them after Setup
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto page-scrollbar pr-3 pb-20 space-y-3">
                    {deployedEmployees.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center px-4 mt-8 opacity-60">
                        <div className="w-16 h-16 rounded-full bg-[#F2F2F7] flex items-center justify-center mb-4">
                          <span className="text-2xl">👤</span>
                        </div>
                        <p className="font-semibold text-[#8E8E93] text-[14px]">No employees added yet</p>
                        <p className="text-[12px] text-[#A1A1A6] mt-1 max-w-[200px]">Add your team members using the form to deploy them.</p>
                      </div>
                    ) : (
                      deployedEmployees.map(emp => (
                        <div key={emp.id} className="w-full bg-[#FAFAFC] rounded-[16px] p-3.5 px-4 flex items-center justify-between border border-[#E5E5EA] shadow-sm animate-in fade-in slide-in-from-left-2 duration-300 group hover:shadow-md transition-all">
                          <div className="flex items-center gap-3 flex-[2] min-w-0">
                            <div className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: getAvatarColor(emp.firstName).bg }}>
                              <span className="font-bold text-[13px] avatar-initials" style={{ color: getAvatarColor(emp.firstName).color }}>{(emp.firstName.charAt(0) + (emp.lastName?.charAt(0) || '')).toUpperCase()}</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[14px] font-bold !text-[#1C1C1E] truncate">{emp.firstName} {emp.lastName}</span>
                              <span className="text-[11px] font-medium !text-[#8E8E93] truncate">{emp.email}</span>
                            </div>
                          </div>
                          <div className="flex flex-col flex-1 pl-3 border-l border-[#E5E5EA] min-w-0">
                            <span className="text-[13px] font-bold !text-[#1C1C1E] truncate">{emp.department}</span>
                            <span className="text-[11px] font-medium !text-[#8E8E93] truncate">{emp.designation}</span>
                          </div>
                          <button onClick={() => handleRemoveDeployedEmployee(emp.id)} className="ml-3 h-8 w-8 !bg-[#FFE5E5] hover:!bg-[#FFD1D1] rounded-full flex items-center justify-center transition-colors shrink-0">
                            <Trash2 className="h-4 w-4 !text-[#FF3B30]" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Side: Form */}
                <div className="w-[50%] flex flex-col px-[55px] py-[35px] relative h-full overflow-hidden">
                  <div className="flex-1 overflow-y-auto no-scrollbar pb-[100px] flex flex-col items-center">
                    <div className="text-center mb-10 w-full">
                      <h2 className="text-[28px] font-extrabold !text-[#1C1C1E] mb-2 tracking-tight">Onboard Employees</h2>
                      <p className="text-[14px] font-medium !text-[#8E8E93]">Deploy Employees to their respective Department</p>
                    </div>

                    <div className="w-full max-w-[540px] mx-auto space-y-5">
                      <div className="flex gap-4">
                        <div className="relative flex-1 group">
                          <label className="absolute left-[18px] -top-2.5 bg-white px-1.5 text-[11px] font-medium text-[#000000] z-10">First Name</label>
                          <input type="text" placeholder="First Name" value={empFirstName} onChange={(e) => setEmpFirstName(capitalizeFirstLetter(e.target.value.replace(/[^a-zA-Z\s]/g, '')))} className="w-full h-[52px] px-5 bg-white !shadow-none border border-[#E5E5EA] rounded-[16px] text-[15px] font-semibold !text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all placeholder:text-[#C7C7CC] truncate" />
                        </div>
                        <div className="relative flex-1 group">
                          <label className="absolute left-[18px] -top-2.5 bg-white px-1.5 text-[11px] font-medium text-[#000000] z-10">Last Name</label>
                          <input type="text" placeholder="Last Name" value={empLastName} onChange={(e) => setEmpLastName(capitalizeFirstLetter(e.target.value.replace(/[^a-zA-Z\s]/g, '')))} className="w-full h-[52px] px-5 bg-white !shadow-none border border-[#E5E5EA] rounded-[16px] text-[15px] font-semibold !text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all placeholder:text-[#C7C7CC] truncate" />
                        </div>
                      </div>

                      <div className="relative w-full group">
                        <label className="absolute left-[18px] -top-2.5 bg-white px-1.5 text-[11px] font-medium text-[#000000] z-10">Email Address</label>
                        <input type="email" placeholder="Enter email" value={empEmail} onChange={(e) => setEmpEmail(e.target.value.replace(/[^a-zA-Z0-9.@]/g, ''))} className="w-full h-[52px] px-5 bg-white !shadow-none border border-[#E5E5EA] rounded-[16px] text-[15px] font-semibold !text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all placeholder:text-[#C7C7CC] truncate" />
                      </div>

                      <div className="flex gap-4">
                        <div className="relative flex-1 group">
                          <CustomSelect
                            label="Gender"
                            value={empGender}
                            onChange={setEmpGender}
                            options={["Male", "Female", "Other"]}
                            placeholder="Choose Gender"
                          />
                        </div>
                        <div className="relative flex-1 group">
                          <CustomSelect
                            label="Department"
                            value={empDept}
                            onChange={(val) => { setEmpDept(val); setEmpDesig(""); }}
                            options={createdDepartments.map(d => d.name).filter(name => name !== "Admin Department")}
                            placeholder="Choose Dept"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="relative flex-1 group">
                          <CustomSelect
                            label="Designation"
                            value={empDesig}
                            onChange={setEmpDesig}
                            options={empDept ? (createdDepartments.find(d => d.name === empDept)?.designations || []) : []}
                            placeholder="Choose Designation"
                          />
                        </div>
                        <div className="relative flex-1 group">
                          <CustomSelect
                            label="App Role"
                            value={empRole}
                            onChange={setEmpRole}
                            options={["Admin", "Sub Admin", "Employee"]}
                            placeholder="Choose Role"
                          />
                        </div>
                      </div>

                      <div className="flex justify-center mt-3">
                        <button onClick={handleAddEmployee} className="h-[48px] px-[24px] bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] font-bold rounded-[14px] transition-all text-[15px]">
                          Add Employee
                        </button>
                      </div>

                      <div className="pt-2">
                        {errorLine && <p className="text-[#FF3B30] text-[13px] font-semibold text-center mb-4">{errorLine}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Absolute Bottom Navigation bar within the right pane */}
                  <div className="absolute bottom-[35px] left-[55px] right-[55px] flex justify-between items-center bg-[#ffffff] pt-4 border-t border-[#E5E5EA] z-[20]">
                    <button onClick={() => setStep(2)} className="text-[#007AFF] font-bold text-[16px] hover:text-[#0062CC] transition-colors leading-[48px]">
                      Back
                    </button>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => { setErrorLine(""); setHasSkippedEmployees(true); setStep(4); }} 
                        className="text-[#8E8E93] font-bold text-[16px] hover:text-[#1C1C1E] transition-colors leading-[48px] px-2"
                      >
                        Skip
                      </button>
                      <button 
                        onClick={handleNext}
                        disabled={deployedEmployees.length < 1}
                        className="h-[48px] px-[32px] !bg-[#007AFF] hover:!bg-[#0062CC] active:scale-[0.98] text-white font-bold rounded-[14px] shadow-[0_4px_12px_rgba(0,122,255,0.25)] transition-all text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Overview */}
          {step === 4 && (
            <div className="w-full h-full flex flex-col bg-white animate-in fade-in duration-500">
              <div className="w-full flex items-center justify-between px-10 py-8 shrink-0">
                <div className="flex items-center gap-4">
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: '#E5F1FF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #007AFF' }}>
                      {(croppedPreviewUrl || profilePic) ? (<img src={croppedPreviewUrl ?? profilePic!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Company" />) : (<span className="avatar-initials" style={{ fontSize: 20, fontWeight: 800, color: '#007AFF' }}>{getInitials(companyName || 'CO')}</span>)}
                    </div>
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#007AFF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #007AFF' }}>
                        {(adminCroppedUrl || adminPic) ? (<img src={adminCroppedUrl ?? adminPic!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Admin" />) : (<span className="avatar-initials" style={{ fontSize: 9, fontWeight: 800, color: '#ffffff' }}>{adminFirstName ? (adminFirstName[0] + (adminLastName?.[0] || '')).toUpperCase() : getInitials(companyName || 'CO')}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="onboarding-dark-gray-text text-[11px] font-medium leading-none">Company</span>
                    <span className="text-[#000000] text-[16px] font-bold leading-none">{companyName || 'Your Company'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[14px]">
                  <span className="text-[#8E8E93] font-medium">Phase : </span>
                  <span className="text-[#007AFF] font-bold">4 out of 5</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col border-t border-[#E5E5EA] overflow-hidden">
                <div className="flex-1 flex flex-col overflow-y-auto page-scrollbar">
                  <div className="flex flex-col items-center mt-8 mb-8 shrink-0">
                    <h1 className="text-[28px] font-extrabold !text-[#1C1C1E] mb-1 tracking-tight">Overview</h1>
                    <p className="text-[14px] font-medium !text-[#8E8E93]">Verify your Deployments</p>
                  </div>

                  <div className="flex gap-6 px-[55px] flex-1 pb-[120px] overflow-visible">
                    {/* Left side: Departments List */}
                    <div className="w-1/3 bg-[#FAFAFC] rounded-[24px] p-5 flex flex-col">
                      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                        {createdDepartments.map(dept => {
                          const empCount = dept.name === "Admin Department"
                            ? deployedEmployees.filter(e => e.role === "Admin").length
                            : deployedEmployees.filter(e => e.department === dept.name).length;
                          const isActive = selectedOverviewDept === dept.name;
                          return (
                            <div 
                              key={dept.id} 
                              onClick={() => setSelectedOverviewDept(dept.name)}
                              className={`bg-white rounded-[24px] p-4 flex items-center justify-between cursor-pointer transition-all`}
                              style={{ boxShadow: 'none' }}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: getDepartmentColor(dept.name).bg }}>
                                  <span className="font-bold text-[14px] avatar-initials" style={{ color: getDepartmentColor(dept.name).color }}>{dept.name.substring(0,2).toUpperCase()}</span>
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-[15px] font-bold !text-[#1C1C1E] truncate">{dept.name}</span>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <div className="flex -space-x-1.5 shrink-0">
                                      {(dept.name === "Admin Department"
                                        ? deployedEmployees.filter(e => e.role === "Admin")
                                        : deployedEmployees.filter(e => e.department === dept.name)
                                      ).slice(0, 3).map((emp, i) => (
                                        <div key={i} className="w-[18px] h-[18px] rounded-full border border-white flex items-center justify-center shrink-0" style={{ backgroundColor: getAvatarColor(emp.firstName).bg, zIndex: 3 - i }}>
                                          <span className="font-bold text-[8px] avatar-initials" style={{ color: getAvatarColor(emp.firstName).color }}>{emp.firstName.charAt(0).toUpperCase()}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <span className="text-[11px] font-bold text-[#007AFF] ml-1">{empCount} Employees</span>
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className={`w-5 h-5 ml-2 shrink-0 transition-colors ${isActive ? 'text-[#007AFF]' : 'text-[#C7C7CC]'}`} />
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="w-2/3 bg-[#FAFAFC] rounded-[24px] p-6 flex flex-col">
                      <div className="flex-1 overflow-y-auto page-scrollbar pr-2 space-y-4">
                          {(selectedOverviewDept === "Admin Department"
                            ? deployedEmployees.filter(e => e.role === "Admin")
                            : deployedEmployees.filter(e => e.department === selectedOverviewDept)
                          ).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-60">
                              <p className="font-semibold text-[#8E8E93] text-[15px]">No employees in this department</p>
                            </div>
                          ) : (
                            (selectedOverviewDept === "Admin Department"
                              ? deployedEmployees.filter(e => e.role === "Admin")
                              : deployedEmployees.filter(e => e.department === selectedOverviewDept)
                            ).map(emp => (
                              <div key={emp.id} className="w-full bg-white rounded-[24px] p-4 flex items-center gap-5" style={{ boxShadow: 'none' }}>
                                <div className="h-11 w-11 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: getAvatarColor(emp.firstName).bg }}>
                                  <span className="font-bold text-[14px] avatar-initials" style={{ color: getAvatarColor(emp.firstName).color }}>
                                    {(emp.firstName.charAt(0) + (emp.lastName?.charAt(0) || '')).toUpperCase()}
                                  </span>
                                </div>
                                
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="text-[15px] font-bold !text-[#1C1C1E] truncate">{emp.firstName} {emp.lastName}</span>
                                  <span className="text-[12px] font-medium !text-[#8E8E93] truncate">{emp.email}</span>
                                </div>

                                <div className="flex flex-col flex-1 min-w-0 border-l border-[#E5E5EA] pl-5">
                                  <span className="text-[14px] font-bold !text-[#1C1C1E] truncate">{emp.department}</span>
                                  <span className="text-[11px] font-medium !text-[#8E8E93] truncate">{emp.designation}</span>
                                </div>

                                <div className="text-[14px] font-semibold !text-[#1C1C1E] w-[70px] text-center">
                                  {emp.gender}
                                </div>
                                
                                <div className="text-[14px] font-bold !text-[#1C1C1E] w-[90px] text-right">
                                  {emp.role}
                                </div>
                              </div>
                            ))
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-10 left-[55px] right-[55px] flex justify-between items-center bg-white z-10 shrink-0">
                  <button onClick={() => setStep(3)} className="text-[#007AFF] font-bold text-[16px] hover:text-[#0062CC] transition-colors">Back</button>
                  {errorLine && <p className="text-[#FF3B30] text-[13px] font-semibold text-center absolute left-1/2 -translate-x-1/2">{errorLine}</p>}
                  <button 
                    onClick={handleNext}
                    disabled={
                      (!hasSkippedDepartments && createdDepartments.filter(d => d.name !== "Admin Department").length === 0) || 
                      (!hasSkippedEmployees && deployedEmployees.length < 1)
                    }
                    className="h-[52px] px-10 bg-[#007AFF] hover:bg-[#0062CC] rounded-[14px] text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
              </div>
            </div>
          )}

          {/* Step 5: Terms & Conditions */}
          {step === 5 && (
            <div className="w-full flex-1 min-h-0 flex flex-col bg-white animate-in fade-in duration-500">
              {/* Header */}
              <div className="w-full flex items-center justify-between px-10 py-8 shrink-0">
                <div className="flex items-center gap-4">
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: '#E5F1FF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #007AFF' }}>
                      {(croppedPreviewUrl || profilePic) ? (<img src={croppedPreviewUrl ?? profilePic!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Company" />) : (<span className="avatar-initials" style={{ fontSize: 20, fontWeight: 800, color: '#007AFF' }}>{getInitials(companyName || 'CO')}</span>)}
                    </div>
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#007AFF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #007AFF' }}>
                        {(adminCroppedUrl || adminPic) ? (<img src={adminCroppedUrl ?? adminPic!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Admin" />) : (<span className="avatar-initials" style={{ fontSize: 9, fontWeight: 800, color: '#ffffff' }}>{adminFirstName ? (adminFirstName[0] + (adminLastName?.[0] || '')).toUpperCase() : getInitials(companyName || 'CO')}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="onboarding-dark-gray-text text-[11px] font-medium leading-none">Company</span>
                    <span className="text-[#000000] text-[16px] font-bold leading-none">{companyName || 'Your Company'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[14px]">
                  <span className="text-[#8E8E93] font-medium">Phase : </span>
                  <span className="text-[#007AFF] font-bold">5 out of 5</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col border-t border-[#E5E5EA] overflow-hidden">
                <div className="flex-1 flex overflow-hidden">
                  {/* Left: Branding Panel */}
                  <div className="w-[38%] flex flex-col px-[55px] py-[40px] border-r border-[#E5E5EA] bg-[#FAFAFC] shrink-0">
                    <div className="flex flex-col h-full justify-between">
                      <div>

                        <h2 className="text-[26px] font-extrabold !text-[#1C1C1E] mb-3 tracking-tight leading-tight">Terms &amp; Conditions</h2>
                        <p className="text-[14px] font-medium !text-[#8E8E93] leading-relaxed mb-8">Please read and acknowledge the Vertex HRMS Terms &amp; Conditions from Dort Asia before completing your setup.</p>
                        <div className="flex flex-col gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#34C759]/10 flex items-center justify-center shrink-0 mt-0.5">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                            <div>
                              <p className="text-[13px] font-bold !text-[#1C1C1E]">Data Ownership</p>
                              <p className="text-[12px] !text-[#8E8E93]">Your data stays yours — always</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#34C759]/10 flex items-center justify-center shrink-0 mt-0.5">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                            <div>
                              <p className="text-[13px] font-bold !text-[#1C1C1E]">Enterprise Security</p>
                              <p className="text-[12px] !text-[#8E8E93]">Industry-standard encryption &amp; access controls</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#34C759]/10 flex items-center justify-center shrink-0 mt-0.5">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                            <div>
                              <p className="text-[13px] font-bold !text-[#1C1C1E]">99.5% Uptime SLA</p>
                              <p className="text-[12px] !text-[#8E8E93]">Reliable platform with advance maintenance notice</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#34C759]/10 flex items-center justify-center shrink-0 mt-0.5">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                            <div>
                              <p className="text-[13px] font-bold !text-[#1C1C1E]">No Data Selling</p>
                              <p className="text-[12px] !text-[#8E8E93]">We never sell your data to third parties</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-8 bg-white rounded-[16px] p-4">
                        <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Effective Date</p>
                        <p className="text-[14px] font-bold !text-[#1C1C1E]">April 17, 2026</p>
                        <p className="text-[11px] !text-[#8E8E93] mt-2">Questions? Contact <span className="text-[#007AFF] font-semibold">legal@dortasia.com</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Scrollable T&C Text */}
                  <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto page-scrollbar px-[55px] py-[35px]">
                      <div className="max-w-[640px] space-y-6">

                        {[{num:'1',title:'Introduction',text:'Welcome to Vertex, a Human Resource Management System ("HRMS") developed and operated by Dort Asia. These Terms and Conditions ("Terms") govern your access to and use of the Vertex platform, including all its features, modules, APIs, and related services. By registering, accessing, or using Vertex, you agree to be legally bound by these Terms. If you do not agree, you must discontinue use immediately.'},{num:'2',title:'Definitions',items:['"Dort Asia" — the company that owns, develops, and maintains the Vertex HRMS platform.','"Vertex" — the HRMS software, web application, mobile application, and all associated services.','"Client" — the organization or business that has subscribed to and is using Vertex.','"User" — any individual who accesses Vertex under the Client\'s account.','"Data" — all employee records, payroll information, documents, and content within Vertex.','"Subscription" — the paid or trial plan selected by the Client.']},{num:'3',title:'Eligibility',text:'To use Vertex, you must be a registered business entity or authorized representative, at least 18 years of age, have legal authority to enter binding agreements, and comply with all applicable laws. Dort Asia reserves the right to deny access to any individual or organization that does not meet these requirements.'},{num:'4',title:'Account Registration & Security',items:['Clients must provide accurate, complete, and up-to-date registration information.','Each Client is responsible for maintaining the confidentiality of their login credentials.','Clients must notify Dort Asia immediately of any suspected unauthorized access at support@dortasia.com.','Dort Asia reserves the right to suspend or terminate accounts with suspicious activity.','Each account is for the sole use of the registered Client and may not be transferred.']},{num:'5',title:'Subscription Plans & Payment',items:['Vertex is offered under various subscription plans including free trials and paid tiers.','All subscription fees are billed in advance on a monthly or annual basis.','Payments are non-refundable unless otherwise stated in a written agreement.','Dort Asia may modify pricing with a minimum of 30 days\' written notice.','Failure to pay on time may result in suspension of access until the balance is cleared.','Clients are responsible for all applicable taxes related to their subscription.']},{num:'6',title:'Permitted Use',text:'Clients and Users may use Vertex solely for lawful human resource management purposes, including employee onboarding/offboarding, attendance and leave management, payroll processing, performance management, document management, recruitment tracking, and HR analytics. Any use outside these purposes requires prior written approval from Dort Asia.'},{num:'7',title:'Prohibited Use',items:['Upload or distribute malicious software, viruses, or harmful code.','Attempt unauthorized access to other accounts or Dort Asia systems.','Use the platform for illegal, fraudulent, or unethical activity.','Reproduce, resell, or sublicense Vertex or its features without authorization.','Scrape, copy, or extract data using automated tools.','Reverse engineer, decompile, or disassemble any part of Vertex.','Upload defamatory or discriminatory content, or content that violates individual rights.','Process data of individuals without proper legal consent.']},{num:'8',title:'Data Ownership & Privacy',items:['All employee and organizational data entered into Vertex remains the sole property of the Client.','Dort Asia processes Client data strictly in accordance with its Privacy Policy.','Clients are responsible for ensuring their data practices comply with all applicable data protection laws.','Dort Asia implements industry-standard security measures including encryption and access controls.','Upon termination, Clients may request a full data export within 30 days.','Dort Asia will never sell Client data to third parties.']},{num:'9',title:'Confidentiality',text:'Both parties agree to keep confidential any proprietary or sensitive information shared during the course of the business relationship. This obligation of confidentiality survives the termination of these Terms for a period of three (3) years.'},{num:'10',title:'Intellectual Property',items:['Vertex, including its software, design, branding, and content, is the exclusive intellectual property of Dort Asia.','Clients are granted a limited, non-exclusive, non-transferable license to use Vertex during the active subscription period.','Clients must not use Dort Asia\'s brand name, logo, or trademarks without prior written permission.','Feedback or improvement ideas submitted by Clients may be used by Dort Asia without obligation of compensation.']},{num:'13',title:'Limitation of Liability',items:['Dort Asia shall not be liable for any indirect, incidental, or consequential damages arising from use of Vertex.','Dort Asia\'s total liability shall not exceed total subscription fees paid in the three (3) months preceding the claim.','Dort Asia is not liable for loss of data, loss of profits, or business interruption outside its reasonable control.']},{num:'15',title:'Termination',items:['Either party may terminate the subscription at any time with 30 days\' written notice.','Dort Asia may immediately suspend or terminate access for violation of these Terms, fraudulent activity, or non-payment.','Upon termination, the Client\'s license to use Vertex ceases immediately. All outstanding fees remain payable.']},{num:'17',title:'Governing Law & Dispute Resolution',text:'These Terms shall be governed by the laws applicable in the jurisdiction where Dort Asia is registered. Disputes shall first be attempted to be resolved through good-faith negotiation. If negotiation fails, disputes shall be referred to binding arbitration. The decision of the arbitrator shall be final and binding.'},{num:'20',title:'Contact Information',text:'For any questions, concerns, or legal notices regarding these Terms, please contact: Dort Asia — Email: legal@dortasia.com | Support: support@dortasia.com | Website: www.dortasia.com'}].map(section => (
                          <div key={section.num}>
                            <h3 className="text-[14px] font-extrabold !text-[#1C1C1E] mb-2">
                              {section.num}. {section.title}
                            </h3>
                            {('text' in section) && (
                              <p className="text-[13px] !text-[#3C3C43] leading-relaxed">{(section as {text:string}).text}</p>
                            )}
                            {('items' in section) && (
                              <ul className="space-y-1.5">
                                {((section as {items:string[]}).items).map((item, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#8E8E93] shrink-0 mt-[6px]" />
                                    <span className="text-[13px] !text-[#3C3C43] leading-relaxed">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}

                        <div className="pt-2 pb-6 border-t border-[#F2F2F7]">
                          <p className="text-[13px] font-semibold !text-[#1C1C1E] text-center">By using Vertex, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="shrink-0 border-t border-[#E5E5EA] px-[55px] py-6 bg-white">
                      <div className="flex items-center justify-between">
                        <button onClick={() => setStep(4)} className="text-[#007AFF] font-bold text-[16px] hover:text-[#0062CC] transition-colors">Back</button>
                        <div className="flex items-center gap-6">
                          {errorLine && <p className="text-[#FF3B30] text-[13px] font-semibold">{errorLine}</p>}
                          <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="h-[52px] px-10 bg-[#007AFF] hover:bg-[#0062CC] rounded-[14px] text-white font-bold transition-all disabled:opacity-70 disabled:pointer-events-none"
                          >
                            {loading ? 'Setting up...' : 'Agree & Complete Setup'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Cropper Modal Window Overlay */}
      {isEditingPic && profilePic && (
        <div className="fixed inset-0 z-[100000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[500px] h-[640px] max-h-[90vh] bg-white rounded-[24px] flex flex-col relative overflow-hidden shadow-2xl border border-[#E5E5EA] animate-in zoom-in-95 duration-200">
            {/* Top Bar */}
            <div className="w-full h-[64px] flex items-center justify-between px-5 border-b border-[#F2F2F7] z-10 bg-white/95 backdrop-blur-md">
              <button onClick={() => setIsEditingPic(false)} className="text-[#8E8E93] hover:bg-[#F2F2F7] hover:text-[#1C1C1E] p-2 rounded-full transition-colors">
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
              <span style={{ color: '#000000' }}>Drag the image to adjust</span>
              <label className="text-[#007AFF] font-medium cursor-pointer hover:bg-[#EAF2FF] px-4 py-2 rounded-full text-[13px] flex items-center gap-1.5 transition-colors">
                <Undo2 className="h-4 w-4" strokeWidth={2.5} /> Upload
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>

            {/* Draggable Area Container */}
            <div className="flex-1 w-full flex items-center justify-center px-6 relative bg-[#FAFAFC]">
              <div 
                ref={cropperRef}
                className={`relative w-full max-w-[340px] aspect-square flex items-center justify-center overflow-hidden bg-white select-none touch-none rounded-[16px] border border-[#E5E5EA] shadow-inner ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={startDrag} onMouseMove={onDrag} onMouseUp={stopDrag} onMouseLeave={stopDrag}
                onTouchStart={startDrag} onTouchMove={onDrag} onTouchEnd={stopDrag}
              >
                {/* Image Layer */}
                <div 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    transform: `scale(${picZoom}) translate(${pan.x}%, ${pan.y}%)`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                  }}
                >
                  <img src={profilePic || undefined} className="w-full h-full object-contain pointer-events-none select-none flex-shrink-0" draggable={false} alt="Crop preview" />
                </div>

                {/* Light Mask Overlay (creates the hole) */}
                <div 
                  className="absolute inset-0 pointer-events-none rounded-full scale-[0.98]" 
                  style={{ boxShadow: '0 0 0 9999px rgba(255, 255, 255, 0.85)' }}
                ></div>

                {/* Circular Border Guide - Blue Theme */}
                <div className="absolute inset-0 rounded-full border-[2.5px] border-[#007AFF] pointer-events-none opacity-90 scale-[0.98]"></div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="w-full px-8 pb-10 pt-4 z-10 relative bg-white border-t border-[#F2F2F7]">
              <div className="w-full flex items-center gap-4 mb-8">
                <span className="text-2xl font-light text-[#8E8E93] select-none">-</span>
                <input 
                  type="range" 
                  min="1" max="3" step="0.01" 
                  value={picZoom} 
                  onChange={(e) => setPicZoom(parseFloat(e.target.value))} 
                  className="flex-1 h-1.5 bg-[#E5E5EA] rounded-full appearance-none outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#007AFF] [&::-webkit-slider-thumb]:shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
                />
                <span className="text-2xl font-light text-[#8E8E93] select-none">+</span>
              </div>

              {/* Confirm Button */}
              <div className="flex justify-center -mb-4">
                <button 
                  onClick={confirmCrop}
                  className="h-[56px] w-[56px] bg-[#007AFF] rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-[0_8px_24px_rgba(0,122,255,0.3)] z-20"
                >
                  <Check className="h-7 w-7 text-white" strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Photo Cropper Modal */}
      {isEditingAdminPic && adminPic && (
        <div className="fixed inset-0 z-[100000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[500px] h-[640px] max-h-[90vh] bg-white rounded-[24px] flex flex-col relative overflow-hidden shadow-2xl border border-[#E5E5EA] animate-in zoom-in-95 duration-200">
            <div className="w-full h-[64px] flex items-center justify-between px-5 border-b border-[#F2F2F7] z-10 bg-white/95 backdrop-blur-md">
              <button onClick={() => setIsEditingAdminPic(false)} className="text-[#8E8E93] hover:bg-[#F2F2F7] p-2 rounded-full transition-colors">
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
              <span style={{ color: '#000000' }}>Drag the image to adjust</span>
              <label className="text-[#007AFF] font-medium cursor-pointer hover:bg-[#EAF2FF] px-4 py-2 rounded-full text-[13px] flex items-center gap-1.5 transition-colors">
                <Undo2 className="h-4 w-4" strokeWidth={2.5} /> Upload
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0]; if (!file) return;
                  setAdminPic(URL.createObjectURL(file)); setAdminCroppedUrl(null);
                  setAdminPicFile(file); setAdminPicZoom(1); setAdminPan({ x: 0, y: 0 });
                  e.target.value = '';
                }} />
              </label>
            </div>
            <div className="flex-1 w-full flex items-center justify-center px-6 relative bg-[#FAFAFC]">
              <div
                ref={adminCropperRef}
                className={`relative w-full max-w-[340px] aspect-square flex items-center justify-center overflow-hidden bg-white select-none touch-none rounded-[16px] border border-[#E5E5EA] shadow-inner ${isAdminDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={startAdminDrag} onMouseMove={onAdminDrag} onMouseUp={stopAdminDrag} onMouseLeave={stopAdminDrag}
                onTouchStart={startAdminDrag} onTouchMove={onAdminDrag} onTouchEnd={stopAdminDrag}
              >
                <div style={{ width: '100%', height: '100%', transform: `scale(${adminPicZoom}) translate(${adminPan.x}%, ${adminPan.y}%)`, transformOrigin: 'center center', transition: isAdminDragging ? 'none' : 'transform 0.15s ease-out' }}>
                  <img src={adminPic || undefined} className="w-full h-full object-contain pointer-events-none select-none" draggable={false} alt="Admin crop" />
                </div>
                <div className="absolute inset-0 pointer-events-none rounded-full scale-[0.98]" style={{ boxShadow: '0 0 0 9999px rgba(255,255,255,0.85)' }} />
                <div className="absolute inset-0 rounded-full border-[2.5px] border-[#007AFF] pointer-events-none opacity-90 scale-[0.98]" />
              </div>
            </div>
            <div className="w-full px-8 pb-10 pt-4 z-10 relative bg-white border-t border-[#F2F2F7]">
              <div className="w-full flex items-center gap-4 mb-8">
                <span className="text-2xl font-light text-[#8E8E93] select-none">-</span>
                <input type="range" min="1" max="3" step="0.01" value={adminPicZoom}
                  onChange={(e) => setAdminPicZoom(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-[#E5E5EA] rounded-full appearance-none outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#007AFF] [&::-webkit-slider-thumb]:shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
                />
                <span className="text-2xl font-light text-[#8E8E93] select-none">+</span>
              </div>
              <div className="flex justify-center -mb-4">
                <button onClick={confirmAdminCrop} className="h-[56px] w-[56px] bg-[#007AFF] rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-[0_8px_24px_rgba(0,122,255,0.3)] z-20">
                  <Check className="h-7 w-7 text-white" strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


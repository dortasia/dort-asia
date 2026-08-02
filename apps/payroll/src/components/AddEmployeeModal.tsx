"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, UserPlus, Check, ChevronDown, RefreshCw, Camera, Upload } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { getAvatarColor, getInitials } from "@/utils/avatarColor";

const capitalizeWords = (str: string) => {
  return str.replace(/\b\w/g, c => c.toUpperCase());
};

const DesignationSelect = ({ value, onChange, departmentId, departments, onAddCustomDesignation }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDept = departments.find((d: any) => d.id === departmentId);
  const designationsList: string[] = selectedDept?.designations || [];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = designationsList.filter(d => 
    d.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showAddOption = searchQuery.trim() !== "" && !designationsList.some(d => d.toLowerCase() === searchQuery.trim().toLowerCase());

  const handleSelect = (val: string) => {
    onChange(val);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleAdd = () => {
    const newVal = searchQuery.trim();
    if (newVal) {
      onAddCustomDesignation(departmentId, newVal);
      onChange(newVal);
      setSearchQuery("");
      setIsOpen(false);
    }
  };

  const isDisabled = !departmentId;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {isOpen ? (
        <div className="relative">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={value || "Type designation..."}
            className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white border border-[#007AFF] outline-none pr-10 focus:ring-1 focus:ring-[#007AFF]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (showAddOption) {
                  handleAdd();
                } else if (filtered.length > 0) {
                  handleSelect(filtered[0]);
                }
              }
            }}
          />
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-180 cursor-pointer" size={18} onClick={() => setIsOpen(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (isDisabled) return;
            setIsOpen(true);
            setSearchQuery("");
          }}
          disabled={isDisabled}
          className={`w-full flex items-center justify-between bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white border border-transparent transition-all ${
            isDisabled 
              ? 'opacity-60 cursor-not-allowed text-gray-400' 
              : 'cursor-pointer hover:border-gray-300 dark:hover:border-white/10'
          }`}
        >
          <span>{isDisabled ? "Blocked (Select Department first)" : (value || "Select Designation")}</span>
          <ChevronDown className="text-gray-400" size={18} />
        </button>
      )}

      {isOpen && !isDisabled && (
        <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C35] rounded-[14px] shadow-lg max-h-[200px] overflow-y-auto z-[999] page-scrollbar p-1.5 flex flex-col gap-1">
          {filtered.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleSelect(d)}
              className="w-full text-left px-3 py-2 text-[13px] font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200 transition-colors"
            >
              {d}
            </button>
          ))}
          
          {showAddOption && (
            <button
              type="button"
              onClick={handleAdd}
              className="w-full text-left px-3 py-2 text-[13px] font-bold text-[#007AFF] rounded-lg hover:bg-[#007AFF]/5 transition-colors border-t border-gray-100 dark:border-white/5 mt-1"
            >
              + Add "{searchQuery.trim()}"
            </button>
          )}

          {filtered.length === 0 && !showAddOption && (
            <span className="text-[12px] text-gray-400 py-3 text-center block">No designations available</span>
          )}
        </div>
      )}
    </div>
  );
};

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddEmployeeModal({ onClose, onSuccess }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [isClosing, setIsClosing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+65");
  const [role, setRole] = useState("Employee");
  const [departmentId, setDepartmentId] = useState("");
  const [designation, setDesignation] = useState("");
  const [gender, setGender] = useState("");
  const [empId, setEmpId] = useState("");
  const [empIdGenerated, setEmpIdGenerated] = useState(false);
  const [joinedDate, setJoinedDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split("T")[0];
  });

  // Profile photo state variables
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const [picFile, setPicFile] = useState<File | null>(null);
  const [isEditingPic, setIsEditingPic] = useState(false);
  const [rawPic, setRawPic] = useState<string | null>(null);
  const [picZoom, setPicZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cropperRef = useRef<HTMLDivElement>(null);

  // Post-addition confirmation popup states
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [createdEmpId, setCreatedEmpId] = useState<string | null>(null);

  const [departments, setDepartments] = useState<any[]>([]);
  const [availableRoles, setAvailableRoles] = useState(["Admin", "Sub Admin", "Employee"]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const overlayRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const handleAddCustomDesignation = async (deptId: string, newDesignation: string) => {
    setDepartments((prevDepts) => 
      prevDepts.map((d) => {
        if (d.id === deptId) {
          const existing = d.designations || [];
          if (!existing.includes(newDesignation)) {
            const updated = [...existing, newDesignation];
            supabase
              .from("departments")
              .update({ designations: updated })
              .eq("id", deptId)
              .then(({ error }: any) => {
                if (error) {
                  console.error("Failed to update department designations:", error);
                }
              });
            return { ...d, designations: updated };
          }
        }
        return d;
      })
    );
  };

  // Dragging event handlers for the profile photo cropper
  const startDrag = (e: any) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    setDragStart({ x: clientX - pan.x * picZoom * 5, y: clientY - pan.y * picZoom * 5 });
  };

  const onDrag = (e: any) => {
    if (!isDragging || !cropperRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;
    setPan({
      x: Math.max(-50, Math.min(50, dx / (picZoom * 5))),
      y: Math.max(-50, Math.min(50, dy / (picZoom * 5)))
    });
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  const confirmCrop = () => {
    if (!rawPic || !cropperRef.current) {
      setIsEditingPic(false);
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, 400, 400);
        ctx.beginPath();
        ctx.arc(200, 200, 200, 0, 2 * Math.PI);
        ctx.clip();
        ctx.save();
        ctx.translate(200, 200);
        ctx.scale(picZoom, picZoom);
        ctx.translate(pan.x * 4, pan.y * 4);
        const size = Math.min(img.width, img.height);
        const scale = 400 / size;
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();
        canvas.toBlob(blob => {
          if (blob) {
            setCroppedUrl(URL.createObjectURL(blob));
          }
        }, "image/jpeg", 0.9);
      };
      img.src = rawPic;
    }
    setIsEditingPic(false);
  };

  // Load departments + generate dynamic emp_id
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load departments
      let { data: depts } = await supabase
        .from("departments")
        .select("id, name, designations")
        .eq("company_id", user.id)
        .order("name");
      if (depts) {
        const hasAdminDept = depts.some((d: any) => d.name === "Admin Department");
        if (!hasAdminDept) {
          const { data: newDept, error: insertErr } = await supabase
            .from("departments")
            .insert({
              name: "Admin Department",
              company_id: user.id,
              designations: ["Administrator", "Sub Administrator"]
            })
            .select("id, name, designations")
            .single();
          if (!insertErr && newDept) {
            depts = [...depts, newDept].sort((a, b) => a.name.localeCompare(b.name));
          }
        }
        setDepartments(depts.filter((d: any) => d.name !== "Admin Department"));
      }

      // Get company name and roles
      const { data: comp } = await supabase
        .from("company_settings")
        .select("company_name, custom_roles, company_phone, super_admin_phone")
        .eq("company_id", user.id)
        .maybeSingle();

      if (comp) {
        if (comp.custom_roles) {
          setAvailableRoles(["Admin", "Sub Admin", "Employee", ...comp.custom_roles]);
        }

        // Country code is locked to +65 for Singapore for all users
        setCountryCode("+65");
      }

      // Get last added employee's emp_id to extract and increment the sequence number
      const { data: lastEmp } = await supabase
        .from("employees")
        .select("emp_id")
        .eq("company_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const companyName = comp?.company_name || "Dort Asia";
      const initials = companyName
        .split(/\s+/)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .replace(/[^A-Z]/g, "") || "DA";

      let nextNum = 1;
      if (lastEmp?.emp_id) {
        // Matches [PREFIX][Digits]VX[YearSuffix] (e.g. DA0001VX26)
        const match = lastEmp.emp_id.match(/[A-Z]+(\d+)VX\d+/i);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        } else {
          // Generic fallback to find the first group of digits in the ID
          const genericMatch = lastEmp.emp_id.match(/\d+/);
          if (genericMatch) {
            nextNum = parseInt(genericMatch[0], 10) + 1;
          }
        }
      }

      const seqStr = String(nextNum).padStart(4, "0");
      const currentYearSuffix = new Date().getFullYear().toString().slice(-2);
      const generatedId = `${initials}${seqStr}VX${currentYearSuffix}`;
      setEmpId(generatedId);
      setEmpIdGenerated(true);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("First Name, Last Name and Email are required.");
      return;
    }

    if (phone.trim()) {
      const cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone.length !== 8) {
        setError("Singapore phone number must be exactly 8 digits.");
        return;
      }
      if (!cleanPhone.startsWith("8") && !cleanPhone.startsWith("9")) {
        setError("Singapore mobile number must start with 8 or 9.");
        return;
      }
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if email belongs to the Super Admin
      if (email.trim().toLowerCase() === user.email?.toLowerCase()) {
        setError("You cannot add yourself as an employee using your Super Admin email.");
        setSaving(false);
        return;
      }

      // Check for existing employee with same email
      const { data: existingEmp } = await supabase
        .from("employees")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (existingEmp) {
        setError("An employee with this email already exists.");
        setSaving(false);
        return;
      }

      if (empId.trim()) {
        const { data: existingEmpId } = await supabase
          .from("employees")
          .select("id")
          .eq("emp_id", empId.trim())
          .maybeSingle();

        if (existingEmpId) {
          setError("Employee ID is already in use. Please enter a unique Employee ID.");
          setSaving(false);
          return;
        }
      }

      // 1. Single Admin check: a department can only have one Admin
      if (role === "Admin" && departmentId) {
        const { data: deptAdmins } = await supabase
          .from("employees")
          .select("id, name")
          .eq("department_id", departmentId)
          .eq("role", "Admin");
        if (deptAdmins && deptAdmins.length > 0) {
          setError(`This department already has an Admin (Department Head: ${deptAdmins[0].name}). A department can only have one Admin.`);
          setSaving(false);
          return;
        }
      }

      // 2. Sub Admin count check: max 3 per department
      if (role === "Sub Admin" && departmentId) {
        const { count } = await supabase
          .from("employees")
          .select("id", { count: "exact", head: true })
          .eq("department_id", departmentId)
          .eq("role", "Sub Admin");
        if (count !== null && count >= 3) {
          setError("A department can have a maximum of 3 Sub Admins. This department already has 3 Sub Admins.");
          setSaving(false);
          return;
        }
      }

      const { data: comp } = await supabase.from("company_settings").select("company_name, require_approval_new_hire, company_email").eq("company_id", user.id).maybeSingle();
      const isSuperAdminUser = user.email?.toLowerCase() === comp?.company_email?.toLowerCase();
      const requireApproval = comp?.require_approval_new_hire !== false;

      // Upload profile picture if croppedUrl is set
      let avatarUrl = null;
      if (croppedUrl) {
        const res = await fetch(croppedUrl);
        const uploadBlob = await res.blob();
        const companyName = comp?.company_name || "Dort Asia";
        const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const emailSlug = email.trim().toLowerCase().replace(/[^a-z0-9]/g, "-");
        const avatarPath = `User_Avatar/${companySlug}/${emailSlug}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("public_assets")
          .upload(avatarPath, uploadBlob, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("public_assets")
          .getPublicUrl(avatarPath);
        avatarUrl = publicUrlData.publicUrl;
      }

      const payload: any = {
        company_id: user.id,
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim().toLowerCase(),
        role,
        job_type: "Full Time",
        custom_fields: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          personalEmail: email.trim().toLowerCase(),
          mobileNumber: phone.trim(),
          mobileCode: countryCode,
          empId: empId.trim(),
          dateOfJoining: joinedDate || null,
          jobRole: designation.trim() || null,
          gender: gender || null,
          role: role,
        },
        mobile: phone.trim() ? `${countryCode} ${phone.trim()}` : null,
        emp_id: empId.trim() || undefined,
        is_head: false,
        date_of_joining: joinedDate || null,
        job_role: designation.trim() || null,
        gender: gender || null,
        avatar_url: avatarUrl
      };
      if (departmentId) payload.department_id = departmentId;

      let newlyCreatedEmployeeId = null;

      if (requireApproval && !isSuperAdminUser) {
        const approvalPayload = {
           company_id: user.id,
           requester_name: "Sub Administrator",
           requester_email: user.email || "unknown@system.com",
           type: "Onboarding",
           title: "New Hire Onboarding",
           description: `Requesting to onboard ${payload.name} as ${payload.role}`,
           payload,
           status: "Pending"
        };
        const { error: insertErr } = await supabase.from("approvals").insert(approvalPayload);
        if (insertErr) throw insertErr;
        
        setError("Approval request submitted! Super Admin must approve before employee joins.");
      } else {
        const { data: newEmp, error: insertErr } = await supabase.from("employees").insert(payload).select("id").single();
        if (insertErr) throw insertErr;
        newlyCreatedEmployeeId = newEmp.id;

        // Automatically invite the employee to Supabase Auth
        try {
          await fetch("/api/employee-credentials", {
            method: "POST",
            body: JSON.stringify({
              action: "invite",
              email: payload.email,
              employeeId: newlyCreatedEmployeeId
            })
          });
        } catch (inviteErr) {
          console.error("Failed to send invite:", inviteErr);
        }
      }

      setSaved(true);
      if (newlyCreatedEmployeeId) {
        setCreatedEmpId(newlyCreatedEmployeeId);
        setTimeout(() => {
          setShowConfirmPopup(true);
        }, 600);
      } else {
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 1200);
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const combinedName = `${firstName} ${lastName}`.trim();
  const preview = combinedName ? getInitials(combinedName) : "??";
  const { color, bg } = getAvatarColor(combinedName || "A");

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
        className={`fixed inset-y-0 right-0 z-[10000] w-full max-w-[420px] bg-white dark:bg-[#121217] shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out transform ${isClosing ? 'translate-x-full' : 'translate-x-0'}`}
        onClick={e => e.stopPropagation()}
      >
        {saving && (
          <div className="absolute inset-0 bg-white/70 dark:bg-[#121217]/70 backdrop-blur-md z-[10001] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200">
            <div className="relative flex items-center justify-center">
              {/* Sleek double-ring spinner */}
              <div className="h-12 w-12 border-4 border-[#007AFF]/20 border-t-[#007AFF] rounded-full animate-spin" />
              <div className="absolute h-8 w-8 border-4 border-[#34C759]/20 border-b-[#34C759] rounded-full animate-spin [animation-direction:reverse] [animation-duration:0.8s]" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[15px] font-bold text-gray-900 dark:text-white">Creating Employee Profile</span>
              <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Please wait while we set up the credentials...</span>
            </div>
          </div>
        )}

        {saved && !showConfirmPopup && (
          <div className="absolute inset-0 bg-white/70 dark:bg-[#121217]/70 backdrop-blur-md z-[10001] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200">
            <div className="h-14 w-14 bg-[#34C759]/10 rounded-full flex items-center justify-center animate-bounce">
              <Check className="h-8 w-8 text-[#34C759]" strokeWidth={3} />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[15px] font-bold text-[#34C759] dark:text-[#34C759]">Employee Added Successfully!</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 shrink-0">
          <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Add Employee Details</h2>
          <button 
            onClick={handleClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
            
            {/* Avatar Preview Card */}
            <div className="flex items-center gap-4 bg-[#F8F9FA] dark:bg-[#1C1C1E] p-4 rounded-[16px] border border-transparent">
              <div 
                className="relative group cursor-pointer h-[56px] w-[56px] rounded-full flex items-center justify-center font-bold text-[18px] shrink-0 overflow-hidden" 
                style={{ backgroundColor: bg, color }}
                onClick={() => {
                  const input = document.getElementById("profile-photo-upload-input");
                  if (input) input.click();
                }}
              >
                {croppedUrl ? (
                  <img src={croppedUrl} className="h-full w-full object-cover" alt="Avatar preview" />
                ) : (
                  preview
                )}
                <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-4 w-4 text-white" />
                </div>
              </div>
              <input 
                type="file" 
                id="profile-photo-upload-input" 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setRawPic(URL.createObjectURL(file));
                    setPicFile(file);
                    setPicZoom(1);
                    setPan({ x: 0, y: 0 });
                    setIsEditingPic(true);
                  }
                  e.target.value = "";
                }}
              />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[14px] font-bold text-gray-900 dark:text-white truncate">{combinedName || "New Employee"}</span>
                <button 
                  type="button" 
                  onClick={() => {
                    const input = document.getElementById("profile-photo-upload-input");
                    if (input) input.click();
                  }}
                  className="text-[11px] font-bold text-[#007AFF] text-left hover:underline"
                >
                  {croppedUrl ? "Change Photo" : "Upload Photo"}
                </button>
              </div>
            </div>

            {/* Inputs & Fields */}
            <div className="flex flex-col gap-6">
              
              {/* First Name */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">First Name</h3>
                <input 
                  type="text" 
                  value={firstName} 
                  onChange={e => setFirstName(capitalizeWords(e.target.value))}
                  placeholder="Enter first name"
                  className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent"
                />
              </div>

              {/* Last Name */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">Last Name</h3>
                <input 
                  type="text" 
                  value={lastName} 
                  onChange={e => setLastName(capitalizeWords(e.target.value))}
                  placeholder="Enter last name"
                  className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent"
                />
              </div>

              {/* Joined Date */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">Joined Date</h3>
                <input 
                  type="date" 
                  value={joinedDate} 
                  onChange={e => setJoinedDate(e.target.value)}
                  className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent"
                />
              </div>

              {/* Employee ID */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">Employee ID</h3>
                <div className="relative">
                  <input 
                    type="text" 
                    value={empId} 
                    disabled
                    className="w-full bg-[#F8F9FA]/60 dark:bg-[#1C1C1E]/60 rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-400 select-none border border-transparent"
                  />
                  {!empIdGenerated && (
                    <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={16} />
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">Email</h3>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent"
                />
              </div>

              {/* Phone number */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">Phone number</h3>
                <div className="flex bg-[#F8F9FA] dark:bg-[#1C1C2E] rounded-[14px] border border-transparent focus-within:ring-1 focus-within:ring-[#007AFF] overflow-hidden">
                  <div className="pl-4 pr-3 text-[14px] text-gray-500 dark:text-gray-400 font-bold border-r border-gray-200 dark:border-gray-800 flex items-center select-none">
                    {countryCode}
                  </div>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setPhone(digits.slice(0, 8));
                    }}
                    placeholder="8123 4567"
                    className="w-full bg-transparent px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Department Dropdown */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">Department</h3>
                <div className="relative">
                  <select 
                    value={departmentId} 
                    onChange={e => { setDepartmentId(e.target.value); setDesignation(""); }}
                    className={`w-full appearance-none bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium ${departmentId ? 'text-gray-900 dark:text-white' : 'text-gray-400'} focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent`}
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id} className="text-gray-900 dark:text-white bg-white dark:bg-[#1C1C22]">{d.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>

              {/* Designation Dropdown */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">Designation</h3>
                <DesignationSelect 
                  value={designation} 
                  onChange={setDesignation} 
                  departmentId={departmentId} 
                  departments={departments} 
                  onAddCustomDesignation={handleAddCustomDesignation} 
                />
              </div>

              {/* Gender Dropdown */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">Gender</h3>
                <div className="relative">
                  <select 
                    value={gender} 
                    onChange={e => setGender(e.target.value)}
                    className={`w-full appearance-none bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium ${gender ? 'text-gray-900 dark:text-white' : 'text-gray-400'} focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent`}
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="Male" className="text-gray-900 dark:text-white bg-white dark:bg-[#1C1C22]">Male</option>
                    <option value="Female" className="text-gray-900 dark:text-white bg-white dark:bg-[#1C1C22]">Female</option>
                    <option value="Other" className="text-gray-900 dark:text-white bg-white dark:bg-[#1C1C22]">Other</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>

              {/* App Role Dropdown */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">App Role</h3>
                <div className="relative">
                  <select 
                    value={role} 
                    onChange={e => setRole(e.target.value)}
                    className="w-full appearance-none bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF] border border-transparent"
                  >
                    {availableRoles.map(d => <option key={d} value={d} className="text-gray-900 dark:text-white bg-white dark:bg-[#1C1C22]">{d}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>

            </div>

            {error && (
              <p className="text-[13px] text-[#FF3B30] font-semibold bg-[#FF3B30]/5 p-3.5 rounded-xl border border-[#FF3B30]/10">{error}</p>
            )}

          </div>

          {/* Symmetrical Sticky Footer */}
          <div className="p-6 pt-2 pb-8 mt-auto flex gap-3 shrink-0">
            <button 
              type="button" 
              onClick={handleClose}
              className="flex-1 py-4 bg-[#F8F9FA] dark:bg-[#1C1C1E] hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors rounded-[16px] text-[15px] font-bold border border-transparent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || saved}
              className={`flex-1 py-4 transition-colors rounded-[16px] text-white text-[15px] font-bold flex items-center justify-center gap-2 ${
                saved ? "bg-[#34C759] hover:bg-[#2fb14e]" : "bg-[#007AFF] hover:bg-[#0062CC]"
              }`}
            >
              {saving ? (
                <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding…</>
              ) : saved ? (
                <><Check className="h-4 w-4" /> Added!</>
              ) : (
                "Add Employee"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Profile Photo Cropper Popup Modal */}
      {isEditingPic && rawPic && (
        <div className="fixed inset-0 z-[100000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[420px] h-[540px] bg-white dark:bg-[#121217] rounded-[24px] flex flex-col relative overflow-hidden shadow-2xl border border-gray-100 dark:border-[#2C2C35] animate-in zoom-in-95 duration-200">
            <div className="w-full h-[64px] flex items-center justify-between px-5 border-b border-[#F2F2F7] dark:border-gray-800 z-10 bg-white/95 dark:bg-[#121217]/95 backdrop-blur-md">
              <button 
                type="button"
                onClick={() => setIsEditingPic(false)} 
                className="text-[#8E8E93] hover:bg-[#F2F2F7] dark:hover:bg-gray-800 p-2 rounded-full transition-colors"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
              <span className="text-[14px] font-bold text-gray-900 dark:text-white">Adjust Profile Photo</span>
              <label className="text-[#007AFF] font-medium cursor-pointer hover:bg-[#EAF2FF] dark:hover:bg-blue-950/30 px-3 py-1.5 rounded-full text-[12px] flex items-center gap-1 transition-colors">
                <Upload className="h-3.5 w-3.5" /> Upload
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setRawPic(URL.createObjectURL(file));
                      setPicFile(file);
                      setPicZoom(1);
                      setPan({ x: 0, y: 0 });
                    }
                    e.target.value = "";
                  }} 
                />
              </label>
            </div>
            
            <div className="flex-1 w-full flex items-center justify-center p-6 relative bg-[#FAFAFC] dark:bg-[#1C1C22]">
              <div
                ref={cropperRef}
                className={`relative w-[280px] h-[280px] flex items-center justify-center overflow-hidden bg-white dark:bg-black select-none touch-none rounded-full border border-gray-200 dark:border-[#2C2C35] shadow-inner ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={startDrag} 
                onMouseMove={onDrag} 
                onMouseUp={stopDrag} 
                onMouseLeave={stopDrag}
                onTouchStart={startDrag} 
                onTouchMove={onDrag} 
                onTouchEnd={stopDrag}
              >
                <div 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    transform: `scale(${picZoom}) translate(${pan.x}%, ${pan.y}%)`, 
                    transformOrigin: 'center center', 
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out' 
                  }}
                >
                  <img src={rawPic || undefined} className="w-full h-full object-cover pointer-events-none select-none" draggable={false} alt="User avatar crop" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-[#007AFF] pointer-events-none opacity-90" />
              </div>
            </div>
            
            <div className="w-full px-6 pb-8 pt-4 z-10 relative bg-white dark:bg-[#121217] border-t border-[#F2F2F7] dark:border-gray-800">
              <div className="w-full flex items-center gap-3 mb-6">
                <span className="text-xl font-light text-[#8E8E93] select-none">-</span>
                <input 
                  type="range" 
                  min="1" 
                  max="3" 
                  step="0.01" 
                  value={picZoom}
                  onChange={(e) => setPicZoom(parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-[#E5E5EA] dark:bg-gray-800 rounded-full appearance-none outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#007AFF]"
                />
                <span className="text-xl font-light text-[#8E8E93] select-none">+</span>
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditingPic(false)}
                  className="flex-1 py-3 bg-[#F8F9FA] dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold rounded-[14px] text-[13px] border border-transparent"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={confirmCrop}
                  className="flex-1 py-3 bg-[#007AFF] hover:bg-[#0062CC] text-white font-bold rounded-[14px] text-[13px]"
                >
                  Save Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post-addition onboarding confirmation modal popup */}
      {showConfirmPopup && (
        <div className="fixed inset-0 z-[100005] bg-black/45 backdrop-blur-[4px] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[380px] bg-white dark:bg-[#1C1C1E] rounded-[24px] p-6 flex flex-col items-center text-center shadow-2xl border border-gray-100 dark:border-[#2C2C35] animate-in zoom-in-95 duration-200">
            <div className="h-12 w-12 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="h-6 w-6 text-[#007AFF]" />
            </div>
            <h3 className="text-[17px] font-bold text-gray-900 dark:text-white mb-2">Employee Added Successfully!</h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Do you want to continue entering detailed onboarding information for this employee now?
            </p>
            <div className="w-full flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmPopup(false);
                  onSuccess?.();
                  handleClose();
                }}
                className="flex-1 py-3 bg-[#F8F9FA] dark:bg-[#2C2C35] hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-[14px] text-[13px] transition-colors"
              >
                Edit Later
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmPopup(false);
                  handleClose();
                  if (createdEmpId) {
                    router.push(`/employees/${createdEmpId}/edit`);
                  } else {
                    router.push(`/employees`);
                  }
                }}
                className="flex-1 py-3 bg-[#007AFF] hover:bg-[#0062CC] text-white font-bold rounded-[14px] text-[13px] transition-colors"
              >
                Continue Onboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

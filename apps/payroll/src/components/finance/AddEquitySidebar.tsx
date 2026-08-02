"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface AddEquitySidebarProps {
  onClose: () => void;
  onAdd: (name: string, role: string, share: number, investment: number, email?: string, phone?: string, avatarUrl?: string, bankId?: string) => Promise<boolean>;
  existingMembers?: any[];
  banksList?: any[];
}

const ROLES = [
  "You",
  "Founder",
  "Stake Holder",
  "Investor",
  "Partner",
  "Advisory",
  "Employee"
];

const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
};

const formatWithCommas = (value: string) => {
  const clean = value.replace(/[^0-9.]/g, "");
  const parts = clean.split(".");
  let integerPart = parts[0];
  const decimalPart = parts[1];
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (parts.length > 1) {
    return `${integerPart}.${decimalPart.substring(0, 2)}`;
  }
  return integerPart;
};

export default function AddEquitySidebar({ onClose, onAdd, existingMembers = [], banksList = [] }: AddEquitySidebarProps) {
  const supabase = createClient();
  const [isClosing, setIsClosing] = useState(false);
  
  // Calculate total allocated and available share
  const totalAllocated = (existingMembers || []).reduce((sum, m) => sum + (parseFloat(m.share) || 0), 0);
  const availableShare = Math.max(0, 100 - totalAllocated);
  
  // Fields states
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [share, setShare] = useState("");
  const [investment, setInvestment] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Funding deposit method states
  const [fundingMethod, setFundingMethod] = useState<"Bank Transfer" | "Cash">("Bank Transfer");
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  
  // Searching/Selection states
  const [employees, setEmployees] = useState<any[]>([]);
  const [superAdmin, setSuperAdmin] = useState<any>(null);
  
  // Real-time typed query
  const [searchQuery, setSearchQuery] = useState("");
  // Query after 1 sec delay
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearchingDropdown, setIsSearchingDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter out SC/personal banks or specific fixed banks if appropriate, just like pay as advance
  const userBanks = (banksList || []).filter((b: any) => b.id !== 'dbs' && b.id !== 'ocbc' && b.id !== 'uob');

  // Auto-select first bank when banksList is available
  useEffect(() => {
    if (userBanks.length > 0 && !selectedBankId) {
      setSelectedBankId(userBanks[0].id);
    }
  }, [banksList, selectedBankId]);

  // Load employees and super admin details on mount
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Fetch company employees
        const { data: emps } = await supabase
          .from("employees")
          .select("id, name, email, mobile, role, avatar_url")
          .eq("company_id", user.id);
        if (emps) setEmployees(emps);

        // Fetch super admin information for pre-filling "You"
        const { data: adminSettings } = await supabase
          .from("company_settings")
          .select("super_admin_name, company_email, company_phone, super_admin_role, super_admin_avatar_url")
          .eq("company_id", user.id)
          .maybeSingle();
        if (adminSettings) setSuperAdmin(adminSettings);
      } catch (e) {
        console.error("Error loading sidebar data:", e);
      }
    }
    loadData();

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [supabase]);

  // Handle outside clicks to close search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setName(query);
    setShowSearchDropdown(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setIsSearchingDropdown(false);
      setDebouncedSearchQuery("");
      return;
    }

    setIsSearchingDropdown(true);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(query);
      setIsSearchingDropdown(false);
    }, 1000); // Enforce exactly 1 second delay
  };

  const handleRoleChange = (selectedRole: string) => {
    setRole(selectedRole);
    setErrors(prev => ({ ...prev, role: "" }));

    if (selectedRole === "You" && superAdmin) {
      setName(superAdmin.super_admin_name || "");
      setEmail(superAdmin.company_email || "");
      setAvatarUrl(superAdmin.super_admin_avatar_url || "");
      
      // Clean phone number from leading country code if any
      let rawPhone = (superAdmin.company_phone || "").replace(/\D/g, "");
      if (rawPhone.startsWith("65")) rawPhone = rawPhone.substring(2);
      setPhone(rawPhone.substring(0, 8));
      
      setSearchQuery("");
      setDebouncedSearchQuery("");
      setShowSearchDropdown(false);
    } else if (selectedRole === "Employee") {
      setName("");
      setEmail("");
      setPhone("");
      setAvatarUrl("");
      setSearchQuery("");
      setDebouncedSearchQuery("");
      setShowSearchDropdown(true);
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setAvatarUrl("");
      setSearchQuery("");
      setDebouncedSearchQuery("");
      setShowSearchDropdown(false);
    }
  };

  const handleEmployeeSelect = (emp: any) => {
    setName(emp.name);
    setEmail(emp.email || "");
    setAvatarUrl(emp.avatar_url || "");
    
    let rawPhone = (emp.mobile || "").replace(/\D/g, "");
    if (rawPhone.startsWith("65")) rawPhone = rawPhone.substring(2);
    setPhone(rawPhone.substring(0, 8));
    
    setSearchQuery(emp.name);
    setDebouncedSearchQuery(emp.name);
    setShowSearchDropdown(false);
    setErrors(prev => ({ ...prev, name: "", email: "", phone: "" }));
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = "Full Name is required";
    } else if (!/^[A-Za-z\s]+$/.test(name.trim())) {
      newErrors.name = "Only alphabets and spaces allowed";
    } else if (name.trim().length < 2 || name.trim().length > 100) {
      newErrors.name = "Must be between 2 and 100 characters";
    }

    if (!role) {
      newErrors.role = "Equity Category is required";
    } else if (role === "You" && (existingMembers || []).some(m => m.role === "You")) {
      newErrors.role = "The 'You' category can only be used once.";
    }

    // Only validate email and phone if they are actively displayed
    if (role !== "You" && role !== "Employee") {
      if (!email.trim()) {
        newErrors.email = "Email Address is required";
      } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
        newErrors.email = "Must be a valid email address";
      }

      if (!phone.trim()) {
        newErrors.phone = "Mobile Number is required";
      } else if (!/^\d{8}$/.test(phone.trim())) {
        newErrors.phone = "Singapore mobile number must be exactly 8 digits";
      }
    }

    const shareNum = parseFloat(share);
    if (!share) {
      newErrors.share = "Share Percentage is required";
    } else if (isNaN(shareNum) || shareNum <= 0 || shareNum > 100) {
      newErrors.share = "Must be a valid percentage between 0 and 100";
    } else if (shareNum > availableShare) {
      newErrors.share = `Must not exceed available share of ${availableShare.toFixed(2)}%`;
    }

    const investmentNum = parseFloat(investment.replace(/,/g, "")) || 0;
    if (investment && (isNaN(investmentNum) || investmentNum < 0)) {
      newErrors.investment = "Must be a valid positive investment amount";
    }

    if (investmentNum > 0 && fundingMethod === "Bank Transfer" && !selectedBankId) {
      newErrors.investment = "Please select a bank account for Bank Transfer deposit";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      setIsSaving(true);
      const shareNum = parseFloat(share);
      const investmentNum = parseFloat(investment.replace(/,/g, "")) || 0;
      const formattedPhone = phone.trim() ? `+65 ${phone.trim()}` : "";
      
      const targetBankId = investmentNum > 0
        ? (fundingMethod === "Cash" ? "cash-drawer" : selectedBankId)
        : undefined;

      const success = await onAdd(name.trim(), role, shareNum, investmentNum, email.trim(), formattedPhone, avatarUrl, targetBankId);
      setIsSaving(false);
      if (success) {
        alert("Equity member added successfully!");
        handleClose();
      }
    }
  };

  const filteredEmployees = debouncedSearchQuery.trim()
    ? employees
        .filter(emp => emp.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
        .slice(0, 2)
    : [];

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'} bg-black/20`}
        onClick={handleClose}
      />

      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-[420px] bg-white dark:bg-[#121217] shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out transform ${isClosing ? 'translate-x-full' : 'translate-x-0'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Add Equity Member</h2>
          <button 
            onClick={handleClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
          
          {/* Equity Category */}
          <div>
            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-3">Equity Category</h3>
            <div className="relative">
              <select 
                value={role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className={`w-full appearance-none bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium ${role ? 'text-gray-900 dark:text-white' : 'text-gray-400'} focus:outline-none focus:ring-1 focus:ring-[#007AFF] border ${errors.role ? 'border-red-500' : 'border-transparent'}`}
              >
                <option value="" disabled>Select Role / Category</option>
                {ROLES.filter(r => r !== "You" || !(existingMembers || []).some(m => m.role === "You")).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
            {errors.role && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.role}</p>}
          </div>

          {/* Full Name / Employee Search */}
          {role === "Employee" ? (
            <div className="relative" ref={searchContainerRef}>
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-3">Search Employee</h3>
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSearchDropdown(true)}
                  onClick={() => setShowSearchDropdown(true)}
                  placeholder="Type name to search employee" 
                  className={`w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] pl-10 pr-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] border ${errors.name ? 'border-red-500' : 'border-transparent'}`}
                />
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {errors.name && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.name}</p>}

              {/* Loader Card when searching */}
              {showSearchDropdown && isSearchingDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-xl shadow-xl py-4 flex items-center justify-center gap-2.5 z-50 animate-in fade-in duration-200">
                  <div className="w-4 h-4 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[12px] font-semibold text-gray-400">Searching database...</span>
                </div>
              )}

              {/* Empty/No results Card */}
              {showSearchDropdown && !isSearchingDropdown && debouncedSearchQuery.trim() !== "" && filteredEmployees.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-xl shadow-xl py-4 px-4 text-center z-50 animate-in fade-in duration-200">
                  <span className="text-[12px] font-semibold text-gray-400">No matching employees found</span>
                </div>
              )}

              {/* Employee Search Results Dropdown Card */}
              {showSearchDropdown && !isSearchingDropdown && filteredEmployees.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-xl shadow-xl max-h-[220px] overflow-y-auto z-50 py-2 animate-in fade-in duration-200">
                  {filteredEmployees.map(emp => (
                    <button
                      key={emp.id}
                      onClick={() => handleEmployeeSelect(emp)}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-[#25252D] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#E5F1FF] text-[#007AFF] flex items-center justify-center font-bold text-[12px] overflow-hidden shrink-0 shadow-sm">
                        {emp.avatar_url ? (
                          <img src={emp.avatar_url} alt={emp.name} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(emp.name)
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-gray-900 dark:text-white leading-tight">{emp.name}</span>
                        <span className="text-[11px] text-gray-400">{emp.role || "Employee"}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-3">Full Name</h3>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={role === "You"}
                placeholder="Enter stakeholder legal name" 
                className={`w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] border ${errors.name ? 'border-red-500' : 'border-transparent'} disabled:opacity-75 disabled:cursor-not-allowed`}
              />
              {errors.name && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.name}</p>}
            </div>
          )}

          {/* Email Address (Hidden for You & Employee) */}
          {role !== "You" && role !== "Employee" && (
            <div>
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-3">Email Address</h3>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="stakeholder@company.com" 
                className={`w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] border ${errors.email ? 'border-red-500' : 'border-transparent'}`}
              />
              {errors.email && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.email}</p>}
            </div>
          )}

          {/* Mobile Number (Hidden for You & Employee) */}
          {role !== "You" && role !== "Employee" && (
            <div>
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-3">Mobile Number</h3>
              <div className="flex">
                <span className="bg-[#E5E5EA] dark:bg-[#2C2C35] border border-r-0 border-transparent rounded-l-[14px] px-4 text-[14px] font-bold text-gray-700 dark:text-gray-300 flex items-center pointer-events-none">
                  +65
                </span>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  maxLength={8}
                  placeholder="Enter 8-digit mobile number" 
                  className={`w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-r-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] border ${errors.phone ? 'border-red-500' : 'border-transparent'}`}
                />
              </div>
              {errors.phone && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.phone}</p>}
            </div>
          )}

          {/* Share Percentage */}
          <div>
            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-3">Share Percentage</h3>
            <div className="relative">
              <input 
                type="text" 
                value={share}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                  const parts = cleaned.split(".");
                  if (parts.length > 2) return;
                  setShare(cleaned);
                }}
                placeholder="0.00" 
                className={`w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] pr-10 pl-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] border ${errors.share ? 'border-red-500' : 'border-transparent'}`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[14px] pointer-events-none">%</span>
            </div>
            {errors.share ? (
              <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.share}</p>
            ) : (
              <p className="text-gray-400 text-[11px] mt-1.5 ml-1 font-semibold">
                Available Share: {availableShare.toFixed(2)}%
              </p>
            )}
          </div>

          {/* Total Investment */}
          <div>
            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-3">Total Investment</h3>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[14px] pointer-events-none">S$</span>
              <input 
                type="text" 
                value={investment}
                onChange={(e) => {
                  const formatted = formatWithCommas(e.target.value);
                  setInvestment(formatted);
                }}
                placeholder="0.00" 
                className={`w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] pl-10 pr-4 py-3.5 text-[14px] font-bold text-[#34C759] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] border ${errors.investment ? 'border-red-500' : 'border-transparent'}`}
              />
            </div>
            {errors.investment && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.investment}</p>}
          </div>

          {/* Deposit Investment Option (in style of pay as advance) */}
          {parseFloat(investment.replace(/,/g, "")) > 0 && (
            <div className="flex flex-col gap-3.5 mt-2 animate-in fade-in duration-300">
              <label className="text-[13.5px] font-bold text-gray-900 dark:text-white">Deposit Investment To</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFundingMethod("Bank Transfer")}
                  className={`flex items-center justify-center gap-2.5 py-3.5 rounded-[14px] border transition-all ${fundingMethod === "Bank Transfer" ? "bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF]" : "bg-[#F8F9FA] dark:bg-[#1C1C1E] border-transparent text-[#8E8E93]"}`}
                >
                  <svg width="18" height="18" viewBox="0 0 32 32" className="transition-colors shrink-0">
                    <path d="M28 14c1.103 0 2-.897 2-2v-1.403c0-.737-.403-1.412-1.053-1.761L16.474 2.12a1 1 0 0 0-.947 0L3.053 8.836A1.998 1.998 0 0 0 2 10.597V12c0 1.103.897 2 2 2h1v10H4c-1.103 0-2 .897-2 2v2c0 1.103.897 2 2 2h24c1.103 0 2-.897 2-2v-2c0-1.103-.897-2-2-2h-1V14zM4 10.597l12-6.461 12 6.461V12H4zM17 24V14h3v10zm-5 0V14h3v10zM7 14h3v10H7zm21.001 14H4v-2h24v2zm-3-4h-3V14h3z" fill="currentColor" />
                  </svg>
                  <span className="text-[13px] font-bold">Bank Transfer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFundingMethod("Cash")}
                  className={`flex items-center justify-center gap-2.5 py-3.5 rounded-[14px] border transition-all ${fundingMethod === "Cash" ? "bg-[#34C759]/10 border-[#34C759] text-[#34C759]" : "bg-[#F8F9FA] dark:bg-[#1C1C1E] border-transparent text-[#8E8E93]"}`}
                >
                  <svg width="18" height="18" viewBox="0 0 512 512" className="transition-colors shrink-0">
                    <g>
                      <path d="M226 361c41.355 0 75-33.645 75-75s-33.645-75-75-75-75 33.645-75 75 33.645 75 75 75zm0-120c24.813 0 45 20.187 45 45s-20.187 45-45 45-45-20.187-45-45 20.187-45 45-45z" fill="currentColor" />
                      <path d="M497 91H75c-8.284 0-15 6.716-15 15v45H15c-8.284 0-15 6.716-15 15v240c0 8.284 6.716 15 15 15h421c8.284 0 15-6.716 15-15v-45h46c8.284 0 15-6.716 15-15V106c0-8.284-6.716-15-15-15zm-76 117.42c-12.764-4.527-22.893-14.656-27.42-27.42H421zM362.509 181c5.98 29.344 29.147 52.51 58.491 58.491v93.019c-29.344 5.98-52.51 29.147-58.491 58.491H88.491C82.51 361.656 59.344 338.49 30 332.509V239.49c29.344-5.98 52.51-29.147 58.491-58.491h274.018zM57.42 181c-4.527 12.764-14.656 22.893-27.42 27.42V181zM30 363.58c12.764 4.527 22.893 14.656 27.42 27.42H30zM393.58 391c4.527-12.764 14.656-22.893 27.42-27.42V391zM482 331h-31V166c0-8.284-6.716-15-15-15H90v-30h392z" fill="currentColor" />
                      <circle cx="346" cy="286" r="15" fill="currentColor" />
                      <circle cx="106" cy="286" r="15" fill="currentColor" />
                    </g>
                  </svg>
                  <span className="text-[13px] font-bold">Cash Drawer</span>
                </button>
              </div>

              {fundingMethod === "Bank Transfer" && (
                <div className="flex flex-col gap-2.5 mt-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[12.5px] font-semibold text-[#8E8E93]">Choose Bank Account</label>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {userBanks.length === 0 ? (
                      <div className="text-[12.5px] text-[#8E8E93] font-bold py-4 px-2 w-full text-center bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-2xl">
                        No bank accounts found.
                      </div>
                    ) : (
                      userBanks.map((bank) => (
                        <div
                          key={bank.id}
                          onClick={() => setSelectedBankId(bank.id)}
                          className={`flex-shrink-0 w-[150px] p-3 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${selectedBankId === bank.id ? "border-[#007AFF] bg-[#007AFF]/5" : "border-[#E5E7EB] dark:border-[#2C2C35] hover:border-[#007AFF]/50"}`}
                        >
                          <div className="flex flex-col gap-2 relative z-10">
                            <div className="h-5 flex items-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={bank.logo} alt={bank.name} className="h-4.5 max-w-full object-contain" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[12px] font-black text-gray-900 dark:text-white truncate">{bank.name}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-2 pb-8 mt-auto">
          <button 
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] transition-colors rounded-[16px] text-white text-[15px] font-bold disabled:opacity-50"
          >
            {isSaving ? "Adding..." : "Add Equity Member"}
          </button>
        </div>
      </div>
    </>
  );
}

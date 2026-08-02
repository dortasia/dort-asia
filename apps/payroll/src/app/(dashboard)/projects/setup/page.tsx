"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown, Save, ArrowRight, ArrowLeft, Calendar,
  UploadCloud, CheckCircle2, Plus, Trash2, X, FileText, Check, Info, MapPin
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getInitials, getAvatarColor } from "@/utils/avatarColor";

// ─── SHARED UI ────────────────────────────────────────────────────────────────

const inputCls =
  "h-11 px-3 w-full bg-white dark:bg-[#121217] border border-[#E5E5EA] dark:border-white/10 rounded-[8px] text-[13px] font-medium text-gray-900 dark:text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all";

const textareaCls =
  "p-3 w-full bg-white dark:bg-[#121217] border border-[#E5E5EA] dark:border-white/10 rounded-[8px] text-[13px] font-medium text-gray-900 dark:text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all resize-none";

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="text-[12px] font-bold text-[#1C1C1E] dark:text-white mb-1.5 flex items-center gap-1">
    {children} {required && <span className="text-[#FF3B30]">*</span>}
  </label>
);

const HelpText = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 font-medium">{children}</p>
);

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

const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder = "Select Option",
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
  placeholder?: string;
  disabled?: boolean;
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`${inputCls} appearance-none cursor-pointer pr-10 ${disabled ? "opacity-60 bg-gray-50 dark:bg-black cursor-not-allowed" : ""}`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((opt: any) => (
        <option key={opt.value || opt} value={opt.value || opt} className="bg-white dark:bg-[#1C1C22] text-gray-900 dark:text-white">
          {opt.label || opt}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" strokeWidth={2} />
  </div>
);

const RadioGroup = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; description?: string }[];
}) => (
  <div className="flex flex-col gap-2">
    {options.map((opt) => (
      <label
        key={opt.value}
        className={`flex items-start gap-3 p-3 rounded-[10px] border cursor-pointer transition-all ${
          value === opt.value
            ? "border-[#007AFF] bg-[#EEF4FF] dark:bg-[#007AFF]/10"
            : "border-[#E5E5EA] dark:border-white/10 hover:border-[#007AFF]/40"
        }`}
      >
        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all ${value === opt.value ? "border-[#007AFF]" : "border-gray-300 dark:border-white/30"}`}>
          {value === opt.value && <div className="h-2 w-2 rounded-full bg-[#007AFF]" />}
        </div>
        <input type="radio" className="sr-only" value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} />
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-bold text-gray-900 dark:text-white">{opt.label}</span>
          {opt.description && <span className="text-[11.5px] text-gray-500 dark:text-gray-400">{opt.description}</span>}
        </div>
      </label>
    ))}
  </div>
);

const CheckboxGroup = ({
  value,
  onChange,
  options,
  cols = 2,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: string[];
  cols?: number;
}) => (
  <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
    {options.map((opt) => {
      const checked = value.includes(opt);
      return (
        <label
          key={opt}
          className={`flex items-center gap-2.5 p-2.5 rounded-[8px] border cursor-pointer transition-all ${
            checked
              ? "border-[#007AFF] bg-[#EEF4FF] dark:bg-[#007AFF]/10"
              : "border-[#E5E5EA] dark:border-white/10 hover:border-[#007AFF]/40"
          }`}
        >
          <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all shrink-0 ${checked ? "bg-[#007AFF] border-[#007AFF]" : "border-gray-300 dark:border-white/30"}`}>
            {checked && <Check size={10} strokeWidth={3} className="text-white" />}
          </div>
          <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={(e) => {
              if (e.target.checked) onChange([...value, opt]);
              else onChange(value.filter((v) => v !== opt));
            }}
          />
          <span className="text-[12.5px] font-medium text-gray-700 dark:text-gray-200">{opt}</span>
        </label>
      );
    })}
  </div>
);

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

const ExternalTypeSelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const defaultOptions = [
    "Manpower Supply",
    "Material Supply",
    "Full Project",
    "Construction",
    "Software Development",
    "Manufacturing",
    "Marine",
    "Logistics",
    "Facility Management",
    "IT Services",
  ];

  const query = searchQuery.toLowerCase().trim();
  const filtered = defaultOptions.filter((opt) =>
    opt.toLowerCase().includes(query)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onChange(val);
  };

  const handleSelectOption = (opt: string) => {
    setSearchQuery(opt);
    onChange(opt);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search, select, or type custom project type..."
          className={`${inputCls} pr-10`}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors"
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-white/10 rounded-[8px] shadow-lg max-h-[240px] overflow-y-auto z-[999] p-1.5 flex flex-col gap-1">
          {filtered.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelectOption(opt)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-left transition-colors ${
                value === opt
                  ? "bg-[#007AFF]/10 text-[#007AFF] font-bold"
                  : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
              }`}
            >
              <span className="text-[12.5px] font-medium">{opt}</span>
              {value === opt && <Check className="h-3.5 w-3.5 text-[#007AFF]" />}
            </button>
          ))}
          {searchQuery.trim() !== "" && !defaultOptions.some((opt) => opt.toLowerCase() === query) && (
            <button
              type="button"
              onClick={() => handleSelectOption(searchQuery)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-[6px] text-left text-[#007AFF] hover:bg-[#007AFF]/5 transition-colors font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="text-[12.5px]">Use custom type: &quot;{searchQuery}&quot;</span>
            </button>
          )}
          {filtered.length === 0 && searchQuery.trim() === "" && (
            <span className="text-[12px] text-gray-400 py-3 text-center block">
              No options available
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const ProjectManagerSelect = ({ value, onChange, employees }: { value: string; onChange: (v: string) => void; employees: any[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedManager = employees.find((emp) => emp.name === value) || (value ? { name: value, id: "legacy-manager" } : null);
  const query = searchQuery.toLowerCase().trim();
  const filtered = employees.filter((emp) => {
    if ((emp.role || "").toLowerCase() !== "admin") return false;
    if (query === "") return true;
    return (emp.name || "").toLowerCase().includes(query) || (emp.emp_id || "").toLowerCase().includes(query);
  }).slice(0, 10);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {isOpen ? (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={selectedManager ? selectedManager.name : "Search by name or Employee ID..."}
            className={`${inputCls} pr-10`}
            autoFocus
          />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 rotate-180 cursor-pointer" onClick={() => setIsOpen(false)} />
        </div>
      ) : (
        <button type="button" onClick={() => { setIsOpen(true); setSearchQuery(""); }} className={`${inputCls} flex items-center justify-between`}>
          {selectedManager ? (
            <div className="flex items-center gap-2">
              {selectedManager.avatar_url ? (
                <img src={selectedManager.avatar_url} alt={selectedManager.name} className="h-5 w-5 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0" style={{ backgroundColor: getAvatarColor(selectedManager.name).bg, color: getAvatarColor(selectedManager.name).color }}>
                  {getInitials(selectedManager.name)}
                </div>
              )}
              <span className="text-[13px] font-bold truncate max-w-[180px]">{selectedManager.name}</span>
            </div>
          ) : (
            <span className="text-gray-400 font-medium">Search employee name...</span>
          )}
          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
        </button>
      )}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-white/10 rounded-[8px] shadow-lg max-h-[200px] overflow-y-auto z-[999] p-1.5 flex flex-col gap-1">
          {filtered.map((emp) => (
            <button key={emp.id} type="button" onClick={() => { onChange(emp.name); setIsOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-left transition-colors ${value === emp.name ? "bg-[#007AFF]/10 text-[#007AFF] font-bold" : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"}`}>
              <div className="flex items-center gap-2.5">
                {emp.avatar_url ? <img src={emp.avatar_url} alt={emp.name} className="h-5 w-5 rounded-full object-cover shrink-0" /> : (
                  <div className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0" style={{ backgroundColor: getAvatarColor(emp.name).bg, color: getAvatarColor(emp.name).color }}>
                    {getInitials(emp.name)}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[12.5px] font-bold text-[#1d1d1f] dark:text-white leading-tight">{emp.name}</span>
                  {emp.emp_id && <span className="text-[10px] text-gray-400 font-medium">{emp.emp_id}</span>}
                </div>
              </div>
              {value === emp.name && <Check className="h-3.5 w-3.5 text-[#007AFF]" />}
            </button>
          ))}
          {filtered.length === 0 && <span className="text-[12px] text-gray-400 py-3 text-center block">No matching employees</span>}
        </div>
      )}
    </div>
  );
};

const EmployeeMultiSelect = ({ value = [], onChange, employees, label = "Search and select employees...", hideSelected = false }: { value: string[]; onChange: (v: string[]) => void; employees: any[]; label?: string; hideSelected?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const query = searchQuery.toLowerCase().trim();
  const filtered = employees.filter((emp) => {
    if (value.includes(emp.name)) return false;
    if (query === "") return true;
    return (emp.name || "").toLowerCase().includes(query) || (emp.emp_id || "").toLowerCase().includes(query);
  }).slice(0, 8);

  return (
    <div className="relative w-full flex flex-col gap-2" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={label}
          className={inputCls}
        />
      </div>
      {value.length > 0 && !hideSelected && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((name) => {
            const empObj = employees.find((e) => e.name === name);
            return (
              <span key={name} className="inline-flex items-center gap-1.5 bg-[#E5F1FF] dark:bg-[#007AFF]/10 text-[#007AFF] dark:text-[#3399FF] px-2.5 py-1 rounded-[6px] text-[12px] font-bold">
                {empObj?.avatar_url ? <img src={empObj.avatar_url} alt={name} className="h-4 w-4 rounded-full object-cover" /> : (
                  <span className="h-4 w-4 rounded-full text-[8px] flex items-center justify-center font-bold" style={{ backgroundColor: getAvatarColor(name).bg, color: getAvatarColor(name).color }}>{getInitials(name)}</span>
                )}
                {name}
                <button type="button" onClick={() => onChange(value.filter((n) => n !== name))} className="text-[#007AFF] hover:text-[#0051B3] ml-0.5">
                  <X size={12} strokeWidth={2.5} />
                </button>
              </span>
            );
          })}
        </div>
      )}
      {isOpen && searchQuery.trim() !== "" && (
        <div className="absolute left-0 right-0 top-12 mt-1 bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-white/10 rounded-[8px] shadow-lg max-h-[200px] overflow-y-auto z-[999] p-1.5 flex flex-col gap-1">
          {filtered.map((emp) => (
            <button key={emp.id} type="button" onClick={() => { onChange([...value, emp.name]); setSearchQuery(""); setIsOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              {emp.avatar_url ? <img src={emp.avatar_url} alt={emp.name} className="h-5 w-5 rounded-full object-cover shrink-0" /> : (
                <div className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0" style={{ backgroundColor: getAvatarColor(emp.name).bg, color: getAvatarColor(emp.name).color }}>{getInitials(emp.name)}</div>
              )}
              <div className="flex flex-col">
                <span className="text-[12.5px] font-bold text-[#1d1d1f] dark:text-white leading-tight">{emp.name}</span>
                {emp.emp_id && <span className="text-[10px] text-gray-400 font-medium">{emp.emp_id}</span>}
              </div>
            </button>
          ))}
          {filtered.length === 0 && <span className="text-[12px] text-gray-400 py-3 text-center block">No matching employees</span>}
        </div>
      )}
    </div>
  );
};

const DepartmentMultiSelect = ({
  value = [],
  onChange,
  departments,
  label = "Search and select departments...",
  hideSelected = false
}: {
  value: string[];
  onChange: (v: string[]) => void;
  departments: any[];
  label?: string;
  hideSelected?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const query = searchQuery.toLowerCase().trim();
  const filtered = departments.filter((dept) => {
    if (value.includes(dept.name)) return false;
    if (query === "") return true;
    return (dept.name || "").toLowerCase().includes(query);
  }).slice(0, 8);

  return (
    <div className="relative w-full flex flex-col gap-2" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={label}
          className={inputCls}
        />
      </div>
      {value.length > 0 && !hideSelected && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((name) => (
            <span key={name} className="inline-flex items-center gap-1.5 bg-[#E5F1FF] dark:bg-[#007AFF]/10 text-[#007AFF] dark:text-[#3399FF] px-2.5 py-1 rounded-[6px] text-[12px] font-bold">
              {name}
              <button type="button" onClick={() => onChange(value.filter((n) => n !== name))} className="text-[#007AFF] hover:text-[#0051B3] ml-0.5">
                <X size={12} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}
      {isOpen && searchQuery.trim() !== "" && (
        <div className="absolute left-0 right-0 top-12 mt-1 bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-white/10 rounded-[8px] shadow-lg max-h-[200px] overflow-y-auto z-[999] p-1.5 flex flex-col gap-1">
          {filtered.map((dept) => (
            <button
              key={dept.id}
              type="button"
              onClick={() => {
                onChange([...value, dept.name]);
                setSearchQuery("");
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-700 dark:text-gray-300"
            >
              <span className="text-[12.5px] font-bold text-[#1d1d1f] dark:text-white">{dept.name}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <span className="text-[12px] text-gray-400 py-3 text-center block">No matching departments</span>
          )}
        </div>
      )}
    </div>
  );
};

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-white/10 rounded-[16px] p-6 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
    <h3 className="text-[16px] font-bold text-gray-900 dark:text-white mb-5">{title}</h3>
    {children}
  </div>
);

const formatCurrency = (value: string) => {
  let cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  let intPart = parts[0] || "";
  let decPart = parts.length > 1 ? parts.slice(1).join("").slice(0, 2) : null;
  if (intPart.length > 1 && intPart.startsWith("0")) intPart = String(Number(intPart));
  let formatted = intPart !== "" ? Number(intPart).toLocaleString("en-US") : decPart !== null ? "0" : "";
  return decPart !== null ? `${formatted}.${decPart}` : formatted;
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function SetupProjectPage() {
  const supabase = createClient();
  const router = useRouter();

  const [editId, setEditId] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      setEditId(searchParams.get("id"));
    }
  }, []);

  const [currentStep, setCurrentStep] = useState(1);
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [existingProjects, setExistingProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [assignmentMode, setAssignmentMode] = useState<"individual" | "department">("individual");
  const [isDeclared, setIsDeclared] = useState(false);
  const [sigName, setSigName] = useState("");
  const [originalFormData, setOriginalFormData] = useState<any>(null);

  // ─── FORM STATE ─────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    // Step 1: Project Basics
    projectName: "",
    projectId: "",
    projectType: "",           // category: Construction/Marine/Tech...
    projectStatus: "On Process",
    owner: "",
    classification: "Internal Project",  // Internal / External
    description: "",

    // Step 2: Project Duration
    startDate: "",
    endDate: "",
    contractDuration: "",      // auto-calculated read-only
    workingDays: [] as string[],
    workingHoursFrom: "08:00",
    workingHoursTo: "17:00",
    shiftTypes: [] as string[], // multi-select
    overtimeApplicable: false,  // toggle
    claimApplicable: false,     // toggle

    // Step 3: Client Details (External only)
    externalType: "",           // Manpower Supply | Material Supply | Full Project
    clientCompany: "",
    clientContact: "",
    clientEmail: "",
    clientPhone: "",
    billingAddress: "",
    contractNumber: "",
    uenNumber: "",

    // Step 4: Commercial Details (External only)
    contractValue: "",
    currency: "SGD",
    paymentCycle: "",
    invoiceFrequency: "",
    taxPercent: "",
    retentionPercent: "",
    paymentMethod: [] as string[],

    // Step 5: Salary & Billing (Manpower Supply only)
    salaryType: "Daily",
    basicRate: "",
    overtimeRate: "",
    foodAllowance: "",
    accommodationAllowance: "",
    transportAllowance: "",
    clientBillingRate: "",
    invoiceCycle: "Monthly",
    allowanceEnabled: false,
    allowances: [] as Array<{ name: string; amount: string }>,

    // Step 6: Site & Worksite Details
    worksiteAddress: "",
    siteLatitude: "",
    siteLongitude: "",
    locationLink: "",
    siteAccessPass: false,       // toggle
    ppeRequired: false,          // toggle
    ppeTypes: [] as string[],
    siteSupervisor: "",
    siteReportingTime: "",
    siteRules: "",

    // Step 7: Accommodation & Transport
    dormitoryName: "",
    dormitoryAddress: "",
    bedAllocation: "",
    transportVendor: "",
    pickupPoint: "",
    dropoffPoint: "",

    // Step 8: Budget
    budgetAmount: "",
    budgetOwner: "",
    budgetApprovalDate: "",

    // Step 9: Compliance & Insurance
    insuranceProvider: "",
    wicaCoverage: false,         // toggle
    insuranceExpiry: "",
    safetyCompliance: "Compliant",
    momNotes: "",

    // Step 10: Document Uploads
    serviceAgreementName: "",
    quotationName: "",
    purchaseOrderName: "",
    workOrderName: "",
    safetyDocumentsName: "",
    employeePassCopiesName: "",
    insuranceDocumentsName: "",
    customDocuments: [] as Array<{ id: string; name: string; fileName: string }>,

    // Step 11: Assign Employees & Review
    assignedEmployees: [] as string[],
    assignedDepartments: [] as string[],
    projectDepartment: "",

    // Legacy / misc
    siteLocation: "",
    siteLocationLink: "",
    attendanceMethod: "QR",
    payrollGroup: "",
    cpfApplicable: "Yes",
    levyTracking: "",
    timesheetApproval: "Yes",
    companyAddress: "",
  });

  const handleChange = (field: string, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  // ─── COMPUTED ────────────────────────────────────────────────────────────────
  const isExternal = formData.classification === "External Project";
  const isManpower = formData.externalType === "Manpower Supply";
  const isFullOrManpower = formData.externalType === "Manpower Supply" || formData.externalType === "Full Project";

  // Auto-calculate contract duration
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const s = new Date(formData.startDate);
      const e = new Date(formData.endDate);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e >= s) {
        const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
        const months = Math.floor(diffDays / 30);
        const days = diffDays % 30;
        let label = "";
        if (months > 0) label += `${months} month${months > 1 ? "s" : ""}`;
        if (days > 0) label += (label ? " " : "") + `${days} day${days > 1 ? "s" : ""}`;
        handleChange("contractDuration", label || "0 days");
      } else {
        handleChange("contractDuration", "");
      }
    }
  }, [formData.startDate, formData.endDate]);

  // ─── STEPS ───────────────────────────────────────────────────────────────────
  const allSteps = [
    { id: 1, label: "Project Basics", visible: true },
    { id: 2, label: "Project Duration", visible: true },
    { id: 3, label: "Client Details", visible: isExternal },
    { id: 4, label: "Commercial Details", visible: isExternal },
    { id: 5, label: "Salary & Billing", visible: isManpower },
    { id: 6, label: "Site & Worksite", visible: isFullOrManpower },
    { id: 7, label: "Accommodation & Transport", visible: isManpower },
    { id: 8, label: "Budget", visible: true },
    { id: 9, label: "Compliance & Insurance", visible: true },
    { id: 10, label: "Document Uploads", visible: true },
    { id: 11, label: "Assign Employees", visible: true },
    { id: 12, label: "Review", visible: true },
  ];
  const steps = allSteps.filter((s) => s.visible);
  const visibleStepIds = steps.map((s) => s.id);
  const currentStepIndex = visibleStepIds.indexOf(currentStep);
  const progressPercent = Math.round(((currentStepIndex + 1) / steps.length) * 100);

  // Ensure currentStep is always a visible step
  useEffect(() => {
    if (!visibleStepIds.includes(currentStep)) {
      // move to the nearest visible step
      const next = visibleStepIds.find((id) => id > currentStep) || visibleStepIds[visibleStepIds.length - 1];
      setCurrentStep(next || 1);
    }
  }, [formData.classification, formData.externalType]);

  // ─── LOAD DATA ───────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        // Resolve company_id (owner or employee)
        let { data: comp } = await supabase.from("company_settings").select("*").eq("company_id", user.id).maybeSingle();
        if (!comp) {
          const { data: emp } = await supabase.from("employees").select("company_id").eq("email", user.email).maybeSingle();
          if (emp) {
            const { data: compEmp } = await supabase.from("company_settings").select("*").eq("company_id", emp.company_id).maybeSingle();
            comp = compEmp;
          }
        }

        if (comp) {
          setCompanySettings(comp);

          // Load employees and departments for step 11
          const { data: emps } = await supabase.from("employees").select("id, name, emp_id, avatar_url, role").eq("company_id", comp.company_id).order("name", { ascending: true });
          if (emps) setEmployees(emps);

          const { data: depts } = await supabase.from("departments").select("id, name").eq("company_id", comp.company_id).order("name", { ascending: true });
          if (depts) setDepartments(depts);

          // Count existing projects for auto-generating project code
          const { count: projCount } = await supabase.from("projects").select("id", { count: "exact", head: true }).eq("company_id", comp.company_id);
          const nextSeq = String((projCount || 0) + 1).padStart(4, "0");

          if (editId) {
            // Load the project row from the projects table
            const { data: editProj } = await supabase.from("projects").select("*").eq("id", editId).maybeSingle();
            if (editProj) {
              const loadedData = {
                projectName: editProj.project_name || "",
                projectId: editProj.project_code || "",
                projectType: editProj.project_type || "",
                projectStatus: editProj.project_status || "On Process",
                owner: editProj.owner || "",
                classification: editProj.classification || "Internal Project",
                description: editProj.description || "",
                externalType: editProj.external_type || "",
                startDate: editProj.start_date || "",
                endDate: editProj.end_date || "",
                contractDuration: editProj.contract_duration || "",
                workingDays: editProj.working_days || [],
                workingHoursFrom: editProj.working_hours_from || "08:00",
                workingHoursTo: editProj.working_hours_to || "17:00",
                shiftTypes: editProj.shift_types || [],
                overtimeApplicable: editProj.overtime_applicable || false,
                claimApplicable: editProj.claim_applicable || false,
                clientCompany: (() => { const c = (editProj.client_company || "").trim(); return (c === "Internal" || c === "External") ? "" : c; })(),
                uenNumber: editProj.uen_number || "",
                clientContact: editProj.client_contact || "",
                clientEmail: editProj.client_email || "",
                clientPhone: editProj.client_phone || "",
                billingAddress: editProj.billing_address || "",
                worksiteAddress: editProj.worksite_address || "",
                contractNumber: editProj.contract_number || "",
                locationLink: editProj.location_link || "",
                siteLatitude: editProj.site_latitude || "",
                siteLongitude: editProj.site_longitude || "",
                contractValue: editProj.contract_value || "",
                currency: editProj.currency || "SGD",
                paymentCycle: editProj.payment_cycle || "",
                invoiceFrequency: editProj.invoice_frequency || "",
                taxPercent: editProj.tax_percent || "",
                retentionPercent: editProj.retention_percent || "",
                paymentMethod: editProj.payment_method || [],
                salaryType: editProj.salary_type || "Daily",
                basicRate: editProj.basic_rate || "",
                overtimeRate: editProj.overtime_rate || "",
                foodAllowance: editProj.food_allowance || "",
                accommodationAllowance: editProj.accommodation_allowance || "",
                transportAllowance: editProj.transport_allowance || "",
                clientBillingRate: editProj.client_billing_rate || "",
                invoiceCycle: editProj.invoice_cycle || "Monthly",
                allowanceEnabled: editProj.allowance_enabled || false,
                allowances: editProj.allowances || [],
                siteAccessPass: editProj.site_access_pass || false,
                ppeRequired: editProj.ppe_required || false,
                ppeTypes: editProj.ppe_types || [],
                siteSupervisor: editProj.site_supervisor || "",
                siteReportingTime: editProj.site_reporting_time || "",
                siteRules: editProj.site_rules || "",
                dormitoryName: editProj.dormitory_name || "",
                dormitoryAddress: editProj.dormitory_address || "",
                bedAllocation: editProj.bed_allocation || "",
                transportVendor: editProj.transport_vendor || "",
                pickupPoint: editProj.pickup_point || "",
                dropoffPoint: editProj.dropoff_point || "",
                budgetAmount: editProj.budget_amount || "",
                budgetOwner: editProj.budget_owner || "",
                budgetApprovalDate: editProj.budget_approval_date || "",
                insuranceProvider: editProj.insurance_provider || "",
                wicaCoverage: editProj.wica_coverage || false,
                insuranceExpiry: editProj.insurance_expiry || "",
                safetyCompliance: editProj.safety_compliance || "Compliant",
                momNotes: editProj.mom_notes || "",
                serviceAgreementName: editProj.service_agreement || "",
                quotationName: editProj.quotation || "",
                purchaseOrderName: editProj.purchase_order || "",
                workOrderName: editProj.work_order || "",
                safetyDocumentsName: editProj.safety_documents || "",
                employeePassCopiesName: editProj.employee_pass_copies || "",
                insuranceDocumentsName: editProj.insurance_documents || "",
                customDocuments: editProj.custom_documents || [],
                assignedEmployees: editProj.assigned_employees || [],
                assignedDepartments: editProj.assigned_departments || [],
                projectDepartment: editProj.project_department || "",
                companyAddress: editProj.billing_address || "",
                siteLocation: editProj.worksite_address || "",
                siteLocationLink: editProj.location_link || "",
                attendanceMethod: editProj.attendance_method || "QR",
                payrollGroup: editProj.payroll_group || "",
                cpfApplicable: editProj.cpf_applicable || "Yes",
                levyTracking: editProj.levy_tracking || "",
                timesheetApproval: editProj.timesheet_approval || "Yes",
              };
              setFormData(loadedData);
              setOriginalFormData(loadedData);
              setIsDeclared(true);
              setSigName(editProj.owner || "Authorized Manager");
              if (editProj.assigned_departments?.length > 0) setAssignmentMode("department");
            }
          } else {
            // New project — set auto-generated ID
            handleChange("projectId", `RT${nextSeq}PRJ26`);
          }
        }
      } catch (e) {
        console.error("Load project setup error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router, editId]);

  useEffect(() => {
    if (editId && originalFormData) {
      const isDirty = JSON.stringify(formData) !== JSON.stringify(originalFormData);
      if (isDirty) {
        setIsDeclared(false);
        setSigName("");
      } else {
        setIsDeclared(true);
        setSigName(formData.owner || "Authorized Manager");
      }
    }
  }, [formData, originalFormData, editId]);

  // ─── NAVIGATION ──────────────────────────────────────────────────────────────
  const handleNext = () => {
    setError("");
    if (currentStep === 1) {
      if (!formData.projectName.trim()) { setError("Project Name is required."); return; }
      if (!formData.projectId.trim()) { setError("Project ID is required."); return; }
      if (!formData.owner.trim()) { setError("Project Manager is required."); return; }
    } else if (currentStep === 2) {
      if (!formData.startDate || !formData.endDate) { setError("Start Date and End Date are required."); return; }
    } else if (currentStep === 3) {
      if (isExternal && !formData.externalType.trim()) { setError("External Project Type is required."); return; }
      if (isExternal && !formData.clientCompany.trim()) { setError("Client Company is required."); return; }
    }

    const currentIdx = visibleStepIds.indexOf(currentStep);
    if (currentIdx < steps.length - 1) setCurrentStep(visibleStepIds[currentIdx + 1]);
  };

  const handleBack = () => {
    setError("");
    const currentIdx = visibleStepIds.indexOf(currentStep);
    if (currentIdx > 0) setCurrentStep(visibleStepIds[currentIdx - 1]);
  };

  // ─── SUBMIT ──────────────────────────────────────────────────────────────────
  // Builds the project row object for the `projects` table (snake_case columns)
  const buildProjectRow = (isDraft = false) => ({
    company_id: companySettings.company_id,
    is_draft: isDraft,
    // Step 1
    project_name: formData.projectName.trim() || "Draft Project",
    project_code: formData.projectId.trim() || `RT${String(Date.now()).slice(-4)}PRJ26`,
    project_type: formData.projectType,
    project_status: formData.projectStatus,
    owner: formData.owner || "Project Manager",
    classification: formData.classification,
    description: formData.description,
    image: "🏗️",
    // Step 2
    start_date: formData.startDate || null,
    end_date: formData.endDate || null,
    contract_duration: formData.contractDuration,
    working_days: formData.workingDays,
    working_hours_from: formData.workingHoursFrom,
    working_hours_to: formData.workingHoursTo,
    shift_types: formData.shiftTypes,
    overtime_applicable: formData.overtimeApplicable,
    claim_applicable: formData.claimApplicable,
    // Step 3
    external_type: formData.externalType,
    client_company: formData.classification === "Internal Project" ? "Internal" : formData.clientCompany.trim() || "External",
    client_contact: formData.clientContact,
    client_email: formData.clientEmail,
    client_phone: formData.clientPhone,
    billing_address: formData.billingAddress,
    contract_number: formData.contractNumber,
    uen_number: formData.uenNumber,
    // Step 4
    contract_value: formData.contractValue,
    currency: formData.currency,
    payment_cycle: formData.paymentCycle,
    invoice_frequency: formData.invoiceFrequency,
    tax_percent: formData.taxPercent,
    retention_percent: formData.retentionPercent,
    payment_method: formData.paymentMethod,
    // Step 5
    salary_type: formData.salaryType,
    basic_rate: formData.basicRate,
    overtime_rate: formData.overtimeRate,
    food_allowance: formData.foodAllowance,
    accommodation_allowance: formData.accommodationAllowance,
    transport_allowance: formData.transportAllowance,
    client_billing_rate: formData.clientBillingRate,
    invoice_cycle: formData.invoiceCycle,
    allowance_enabled: formData.allowanceEnabled,
    allowances: formData.allowances,
    // Step 6
    worksite_address: formData.worksiteAddress,
    site_latitude: formData.siteLatitude,
    site_longitude: formData.siteLongitude,
    location_link: formData.locationLink,
    site_access_pass: formData.siteAccessPass,
    ppe_required: formData.ppeRequired,
    ppe_types: formData.ppeTypes,
    site_supervisor: formData.siteSupervisor,
    site_reporting_time: formData.siteReportingTime,
    site_rules: formData.siteRules,
    // Step 7
    dormitory_name: formData.dormitoryName,
    dormitory_address: formData.dormitoryAddress,
    bed_allocation: formData.bedAllocation,
    transport_vendor: formData.transportVendor,
    pickup_point: formData.pickupPoint,
    dropoff_point: formData.dropoffPoint,
    // Step 8
    budget_amount: formData.budgetAmount,
    budget_owner: formData.budgetOwner,
    budget_approval_date: formData.budgetApprovalDate || null,
    // Step 9
    insurance_provider: formData.insuranceProvider,
    wica_coverage: formData.wicaCoverage,
    insurance_expiry: formData.insuranceExpiry || null,
    safety_compliance: formData.safetyCompliance,
    mom_notes: formData.momNotes,
    // Step 10
    service_agreement: formData.serviceAgreementName || null,
    quotation: formData.quotationName || null,
    purchase_order: formData.purchaseOrderName || null,
    work_order: formData.workOrderName || null,
    safety_documents: formData.safetyDocumentsName || null,
    employee_pass_copies: formData.employeePassCopiesName || null,
    insurance_documents: formData.insuranceDocumentsName || null,
    custom_documents: formData.customDocuments,
    // Step 11
    assigned_employees: formData.assignedEmployees,
    assigned_departments: formData.assignedDepartments,
    project_department: formData.projectDepartment,
    // Misc
    attendance_method: formData.attendanceMethod,
    payroll_group: formData.payrollGroup,
    cpf_applicable: formData.cpfApplicable,
    levy_tracking: formData.levyTracking,
    timesheet_approval: formData.timesheetApproval,
    financials: `S$ ${Number(formData.clientBillingRate || 0).toFixed(2)}`,
    profit: `S$ 0.00`,
    progress: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companySettings) return;
    setSaving(true);
    setError("");
    try {
      const row = buildProjectRow(false);
      let dbErr;
      if (editId) {
        // UPDATE existing project row
        ({ error: dbErr } = await supabase.from("projects").update(row).eq("id", editId));
      } else {
        // INSERT new project row
        ({ error: dbErr } = await supabase.from("projects").insert(row));
      }
      if (dbErr) throw dbErr;
      router.push("/projects");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to save project.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!companySettings) return;
    setSaving(true);
    setError("");
    try {
      const row = buildProjectRow(true);
      let dbErr;
      if (editId) {
        ({ error: dbErr } = await supabase.from("projects").update(row).eq("id", editId));
      } else {
        ({ error: dbErr } = await supabase.from("projects").insert(row));
      }
      if (dbErr) throw dbErr;
      router.push("/projects");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to save draft.");
    } finally {
      setSaving(false);
    }
  };

  // ─── UPLOAD SIM ──────────────────────────────────────────────────────────────
  const handleDocUpload = (field: string, fileName: string) => {
    setFormData((prev) => ({ ...prev, [field]: fileName }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] h-full w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF] border-t-transparent" />
      </div>
    );
  }

  const currentStepObj = allSteps.find((s) => s.id === currentStep);

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full w-full bg-white dark:bg-[#0B0B0F] text-gray-900 dark:text-white overflow-hidden relative z-10 rounded-tl-[24px] rounded-bl-[24px]">

      {/* ── Left Sidebar (Stepper) ── */}
      <div className="w-[260px] shrink-0 border-r border-[#E5E5EA] dark:border-white/10 bg-white dark:bg-[#0B0B0F] flex flex-col pt-8 pb-6 h-full relative z-10 overflow-y-auto">
        <div className="px-5 mb-6">
          <button type="button" onClick={() => router.push("/projects")}
            className="flex items-center gap-1.5 text-[#8E8E93] hover:text-[#007AFF] text-[12.5px] font-bold transition-colors mb-4 focus:outline-none">
            <ArrowLeft className="h-4 w-4" />Back to Projects
          </button>
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Configuration</p>
          <h1 className="text-[18px] font-bold leading-tight mb-1.5 text-[#1C1C1E] dark:text-white">Setup Project</h1>
          <p className="text-[11.5px] text-gray-500 leading-relaxed font-medium">
            Configure project details across all steps.
          </p>
        </div>

        <div className="flex-1 px-3 flex flex-col gap-0.5 relative">
          {steps.map((step, idx) => {
            const isActive = step.id === currentStep;
            const isCompleted = visibleStepIds.indexOf(step.id) < currentStepIndex;
            return (
              <div key={step.id} className="relative group">
                <button type="button" onClick={() => setCurrentStep(step.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] transition-all relative z-10 text-left
                    ${isActive ? "bg-[#EEF4FF] dark:bg-[#007AFF]/10 text-[#007AFF]" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                  <div className={`h-[20px] w-[20px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors
                    ${isActive ? "bg-[#007AFF] text-white" : isCompleted ? "bg-[#34C759] text-white" : "bg-[#F2F2F7] dark:bg-[#1C1C1E] text-[#8E8E93]"}`}>
                    {isCompleted ? <Check size={10} /> : idx + 1}
                  </div>
                  <span className={`text-[12.5px] truncate ${isActive ? "font-bold" : "font-medium"}`}>{step.label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <div className={`absolute left-[22px] top-[32px] bottom-[-4px] w-[1px] z-0 pointer-events-none ${isCompleted ? "bg-[#34C759]" : "bg-[#E5E5EA] dark:bg-white/5"}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 px-5 pb-2">
          <div className="border border-[#E5E5EA] dark:border-white/10 rounded-[12px] p-4 bg-white dark:bg-[#1C1C1E] shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Setup Progress</span>
              <span className="text-[11px] font-bold text-[#1C1C1E] dark:text-white">{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#F2F2F7] dark:bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#007AFF] rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Content ── */}
      <div className="flex-1 flex flex-col bg-[#F9F9FB] dark:bg-[#121217] relative min-w-0 h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 py-8 pb-[100px]">

          {/* Top Title */}
          <div className="flex items-center justify-between mb-8 max-w-[900px] mx-auto w-full">
            <div>
              <h2 className="text-[22px] font-bold text-gray-900 dark:text-white mb-1">
                {currentStepObj?.label}
              </h2>
              <p className="text-[13px] text-gray-500 font-medium">
                Step {currentStepIndex + 1} of {steps.length}
              </p>
            </div>
            <button type="button" onClick={handleSaveDraft} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[#E5E5EA] dark:border-white/10 text-gray-600 dark:text-gray-300 text-[13px] font-bold hover:bg-[#EEF4FF] dark:hover:bg-white/5 transition-colors shadow-sm bg-white dark:bg-[#1C1C1E] disabled:opacity-50">
              {saving ? (
                <><div className="h-3.5 w-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />Saving...</>
              ) : (
                <><Save className="h-4 w-4" strokeWidth={2.5} />Save Draft</>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-6 max-w-[900px] mx-auto w-full">

            {/* ── STEP 1: Project Basics ── */}
            {currentStep === 1 && (
              <SectionCard title="Project Basics">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="flex flex-col gap-1.5">
                    <Label required>Project Name</Label>
                    <input type="text" value={formData.projectName} onChange={(e) => handleChange("projectName", e.target.value)}
                      placeholder="e.g., RNS Technology, ABC Manufacturing Site A" className={inputCls} maxLength={255} />
                    <HelpText>This will be the primary identifier for your project</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label required>Project ID</Label>
                    <input type="text" value={formData.projectId} onChange={(e) => handleChange("projectId", e.target.value)}
                      placeholder="Auto-generated" className={inputCls} />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label required>Project Type</Label>
                    <RadioGroup
                      value={formData.classification}
                      onChange={(v) => handleChange("classification", v)}
                      options={[
                        { value: "Internal Project", label: "Internal Project", description: "Company-owned work, R&D, office setup, admin work — no external client" },
                        { value: "External Project", label: "External Project", description: "Work for an external paying client" },
                      ]}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label required>Project Status</Label>
                    <CustomSelect
                      value={formData.projectStatus}
                      onChange={(v) => handleChange("projectStatus", v)}
                      options={["On Process", "On Hold", "Completed", "Cancelled"]}
                    />
                    <HelpText>Status determines if project can receive new assignments</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Project Category</Label>
                    <input type="text" value={formData.projectType} onChange={(e) => handleChange("projectType", e.target.value)}
                      placeholder="e.g., Construction, Marine, Tech, Finance" className={inputCls} />
                    <HelpText>Optional category for reporting and filtering</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label required>Project Manager</Label>
                    <ProjectManagerSelect value={formData.owner} onChange={(v) => handleChange("owner", v)} employees={employees} />
                    <HelpText>The person responsible for managing this project</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label>Description</Label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange("description", e.target.value.slice(0, 500))}
                      placeholder="e.g., Supply of 50 technicians for 6 months at ABC Manufacturing..."
                      rows={4}
                      className={textareaCls}
                    />
                    <div className="flex justify-between">
                      <HelpText>Short summary of project scope and objectives</HelpText>
                      <span className="text-[11px] text-gray-400 font-medium">{formData.description.length}/500</span>
                    </div>
                  </div>

                </div>
              </SectionCard>
            )}

            {/* ── STEP 2: Project Duration ── */}
            {currentStep === 2 && (
              <SectionCard title="Project Duration & Timeline">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="flex flex-col gap-1.5">
                    <Label required>Start Date</Label>
                    <div className="relative">
                      <input type="date" value={formData.startDate} onChange={(e) => handleChange("startDate", e.target.value)}
                        className={`${inputCls} pr-10`} />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" />
                    </div>
                    <HelpText>Project commencement date</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label required>End Date</Label>
                    <div className="relative">
                      <input type="date" value={formData.endDate} onChange={(e) => handleChange("endDate", e.target.value)}
                        min={formData.startDate} className={`${inputCls} pr-10`} />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" />
                    </div>
                    <HelpText>End Date must be after Start Date</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label>Project Duration (Auto-Calculated)</Label>
                    <input type="text" value={formData.contractDuration || "—"} disabled
                      className="h-11 px-3 w-full bg-gray-100 dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 rounded-[8px] text-[13px] font-semibold text-gray-500 dark:text-gray-400 cursor-not-allowed select-none" />
                    <HelpText>Automatically calculated from the dates above</HelpText>
                  </div>

                  {formData.classification !== "External Project" && (
                    <>
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <Label>Working Days</Label>
                        <div className="flex flex-wrap gap-2">
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                            const isSelected = formData.workingDays.includes(day);
                            return (
                              <button key={day} type="button"
                                onClick={() => {
                                  if (isSelected) handleChange("workingDays", formData.workingDays.filter((d) => d !== day));
                                  else handleChange("workingDays", [...formData.workingDays, day]);
                                }}
                                className={`h-10 px-4 rounded-[8px] text-[13px] font-bold transition-all border ${isSelected ? "bg-[#007AFF] text-white border-[#007AFF] shadow-sm" : "bg-white dark:bg-[#1C1C1E] text-gray-700 dark:text-gray-300 border-[#E5E5EA] dark:border-white/10 hover:border-[#007AFF]"}`}>
                                {day}
                              </button>
                            );
                          })}
                        </div>
                        <HelpText>Check all days the project is active (default Mon–Fri)</HelpText>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label>Working Hours — From</Label>
                        <input type="time" value={formData.workingHoursFrom} onChange={(e) => handleChange("workingHoursFrom", e.target.value)} className={inputCls} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Working Hours — To</Label>
                        <input type="time" value={formData.workingHoursTo} onChange={(e) => handleChange("workingHoursTo", e.target.value)} className={inputCls} />
                        <HelpText>e.g., 08:00 – 17:00 (8 AM to 5 PM)</HelpText>
                      </div>
                    </>
                  )}

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label>Shift Type</Label>
                    <CheckboxGroup
                      value={formData.shiftTypes}
                      onChange={(v) => handleChange("shiftTypes", v)}
                      options={["Day Shift", "Night Shift", "Rotational Shift"]}
                      cols={3}
                    />
                    <HelpText>Check all applicable shift types</HelpText>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Overtime Applicable?</Label>
                    <div className="flex items-center h-11 gap-3">
                      <ToggleSwitch value={formData.overtimeApplicable} onChange={(v) => handleChange("overtimeApplicable", v)} />
                      <span className="text-[13px] font-medium text-gray-600 dark:text-gray-300">{formData.overtimeApplicable ? "Yes" : "No"}</span>
                    </div>
                    <HelpText>Enable if workers can claim overtime pay</HelpText>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Claim Applicable?</Label>
                    <div className="flex items-center h-11 gap-3">
                      <ToggleSwitch value={formData.claimApplicable} onChange={(v) => handleChange("claimApplicable", v)} />
                      <span className="text-[13px] font-medium text-gray-600 dark:text-gray-300">{formData.claimApplicable ? "Yes" : "No"}</span>
                    </div>
                  </div>

                </div>
              </SectionCard>
            )}

            {/* ── STEP 3: Client Details (External Only) ── */}
            {currentStep === 3 && (
              <SectionCard title="Client Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label required>External Project Type</Label>
                    <ExternalTypeSelect
                      value={formData.externalType}
                      onChange={(v) => handleChange("externalType", v)}
                    />
                    <HelpText>e.g., Construction, Software Development, Manufacturing, Marine, Logistics — or type your own. Note: &quot;Manpower Supply&quot; and &quot;Full Project&quot; unlock additional setup steps.</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label required>Client Company</Label>
                    <input type="text" value={formData.clientCompany} onChange={(e) => handleChange("clientCompany", e.target.value)}
                      placeholder="Search or enter company name..." className={inputCls} />
                    <HelpText>Select existing company or enter new one</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>UEN / Tax Registration</Label>
                    <input type="text" value={formData.uenNumber} onChange={(e) => handleChange("uenNumber", e.target.value)}
                      placeholder="e.g., 202312345K" className={inputCls} maxLength={50} />
                    <HelpText>Singapore company registration number</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Contact Person</Label>
                    <input type="text" value={formData.clientContact} onChange={(e) => handleChange("clientContact", e.target.value)}
                      placeholder="e.g., John Smith" className={inputCls} maxLength={255} />
                    <HelpText>Name of primary point of contact</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Contact Email</Label>
                    <input type="email" value={formData.clientEmail} onChange={(e) => handleChange("clientEmail", e.target.value)}
                      placeholder="contact@company.com" className={inputCls} />
                    <HelpText>Email for billing and communication</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Contact Phone</Label>
                    <input type="tel" value={formData.clientPhone} onChange={(e) => handleChange("clientPhone", e.target.value)}
                      placeholder="+65 6XX XXXX" className={inputCls} />
                    <HelpText>Phone number for urgent communication</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Contract Number</Label>
                    <input type="text" value={formData.contractNumber} onChange={(e) => handleChange("contractNumber", e.target.value)}
                      placeholder="e.g., CNT-2026-0123" className={inputCls} maxLength={100} />
                    <HelpText>Reference number of signed agreement</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label>Billing Address</Label>
                    <textarea value={formData.billingAddress} onChange={(e) => handleChange("billingAddress", e.target.value)}
                      placeholder="123 Business Street, Singapore 123456" rows={3} className={textareaCls} maxLength={500} />
                    <HelpText>Address where invoices should be sent</HelpText>
                  </div>

                </div>
              </SectionCard>
            )}

            {/* ── STEP 4: Commercial Details (External Only) ── */}
            {currentStep === 4 && (
              <SectionCard title="Commercial Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="flex flex-col gap-1.5">
                    <Label>Contract Value</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] font-bold text-[13px] pointer-events-none select-none">{formData.currency}</span>
                      <input type="text" value={formData.contractValue} onChange={(e) => handleChange("contractValue", formatCurrency(e.target.value))}
                        placeholder="1,000,000.00" className={`${inputCls} pl-12`} />
                    </div>
                    <HelpText>Total contract amount in selected currency</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Currency</Label>
                    <input type="text" value="SGD" disabled
                      className="h-11 px-3 w-full bg-gray-100 dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 rounded-[8px] text-[13px] font-semibold text-gray-500 dark:text-gray-400 cursor-not-allowed select-none" />
                    <HelpText>Currency for all financial tracking</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Payment Cycle</Label>
                    <CustomSelect value={formData.paymentCycle} onChange={(v) => handleChange("paymentCycle", v)}
                      placeholder="Select Payment Cycle"
                      options={["Immediate", "15 Days", "30 Days", "45 Days", "60 Days", "90 Days", "Custom"]} />
                    <HelpText>How long before payment is due after invoice</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Tax %</Label>
                    <div className="relative">
                      <input type="number" min="0" max="100" step="0.01" value={formData.taxPercent} onChange={(e) => handleChange("taxPercent", e.target.value)}
                        placeholder="7" className={`${inputCls} pr-8`} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] font-bold text-[13px] pointer-events-none">%</span>
                    </div>
                    <HelpText>GST or VAT percentage on invoices</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Retention %</Label>
                    <div className="relative">
                      <input type="number" min="0" max="100" step="0.01" value={formData.retentionPercent} onChange={(e) => handleChange("retentionPercent", e.target.value)}
                        placeholder="10" className={`${inputCls} pr-8`} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] font-bold text-[13px] pointer-events-none">%</span>
                    </div>
                    <HelpText>Percentage of invoice held back until project completion</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label>Invoice Frequency</Label>
                    <RadioGroup value={formData.invoiceFrequency} onChange={(v) => handleChange("invoiceFrequency", v)}
                      options={[
                        { value: "One Time", label: "One Time", description: "Single invoice at project end" },
                        { value: "Monthly", label: "Monthly", description: "Recurring monthly invoices" },
                        { value: "Milestone", label: "Milestone", description: "Based on project milestones" },
                        { value: "Progress Billing", label: "Progress Billing", description: "Based on progress percentage" },
                      ]}
                    />
                    <HelpText>Determines billing schedule and revenue tracking</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label>Payment Method</Label>
                    <CheckboxGroup value={formData.paymentMethod} onChange={(v) => handleChange("paymentMethod", v)}
                      options={["Bank Transfer", "Cash", "Cheque", "Credit Card"]} cols={4} />
                    <HelpText>Check all payment methods client can use</HelpText>
                  </div>

                </div>
              </SectionCard>
            )}

            {/* ── STEP 5: Salary & Billing (Manpower Only) ── */}
            {currentStep === 5 && (
              <div className="flex flex-col gap-6">
                <SectionCard title="Salary & Billing">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <Label>Salary Type</Label>
                      <RadioGroup value={formData.salaryType} onChange={(v) => handleChange("salaryType", v)}
                        options={[
                          { value: "Daily", label: "Daily", description: "Rate per working day" },
                          { value: "Monthly", label: "Monthly", description: "Fixed monthly salary" },
                          { value: "Hourly", label: "Hourly", description: "Rate per hour worked" },
                        ]}
                      />
                      <HelpText>Determines salary calculation method</HelpText>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label>Basic Rate</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] font-bold text-[13px] pointer-events-none">{formData.currency}</span>
                        <input type="text" value={formData.basicRate} onChange={(e) => handleChange("basicRate", formatCurrency(e.target.value))}
                          placeholder="100.00" className={`${inputCls} pl-14`} />
                      </div>
                      <HelpText>Per {formData.salaryType === "Monthly" ? "month" : formData.salaryType === "Hourly" ? "hour" : "day"}</HelpText>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label>Client Billing Rate</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] font-bold text-[13px] pointer-events-none">{formData.currency}</span>
                        <input type="text" value={formData.clientBillingRate} onChange={(e) => handleChange("clientBillingRate", formatCurrency(e.target.value))}
                          placeholder="150.00" className={`${inputCls} pl-14`} />
                      </div>
                      <HelpText>Amount charged to client per day/hour/month</HelpText>
                    </div>

                    {formData.overtimeApplicable && (
                      <div className="flex flex-col gap-1.5">
                        <Label>Overtime Rate</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] font-bold text-[13px] pointer-events-none">{formData.currency}</span>
                          <input type="text" value={formData.overtimeRate} onChange={(e) => handleChange("overtimeRate", formatCurrency(e.target.value))}
                            placeholder="50.00" className={`${inputCls} pl-14`} />
                        </div>
                        <HelpText>Usually 1.5x or 2x the basic rate, per hour</HelpText>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <Label>Food Allowance</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] font-bold text-[13px] pointer-events-none">{formData.currency}</span>
                        <input type="text" value={formData.foodAllowance} onChange={(e) => handleChange("foodAllowance", formatCurrency(e.target.value))}
                          placeholder="5.00" className={`${inputCls} pl-14`} />
                      </div>
                      <HelpText>Per day or per month</HelpText>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label>Accommodation Allowance</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] font-bold text-[13px] pointer-events-none">{formData.currency}</span>
                        <input type="text" value={formData.accommodationAllowance} onChange={(e) => handleChange("accommodationAllowance", formatCurrency(e.target.value))}
                          placeholder="300.00" className={`${inputCls} pl-14`} />
                      </div>
                      <HelpText>Per month (for lodging/housing)</HelpText>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label>Transport Allowance</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] font-bold text-[13px] pointer-events-none">{formData.currency}</span>
                        <input type="text" value={formData.transportAllowance} onChange={(e) => handleChange("transportAllowance", formatCurrency(e.target.value))}
                          placeholder="5.00" className={`${inputCls} pl-14`} />
                      </div>
                      <HelpText>Per day or per trip</HelpText>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label>Invoice Cycle</Label>
                      <CustomSelect value={formData.invoiceCycle} onChange={(v) => handleChange("invoiceCycle", v)}
                        options={["Weekly", "Bi-Weekly", "Monthly"]} />
                      <HelpText>Frequency of invoicing to client</HelpText>
                    </div>

                  </div>
                </SectionCard>

                {/* Project Allowances Card */}
                <div className="bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-white/10 rounded-[16px] p-6 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Project Allowances</h3>
                    <ToggleSwitch value={formData.allowanceEnabled} onChange={(v) => handleChange("allowanceEnabled", v)} label="Enable Allowances" />
                  </div>
                  {formData.allowanceEnabled && (
                    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                      <p className="text-[12.5px] text-gray-500 dark:text-gray-400 font-medium">Configure dynamic client or employee allowances for this project.</p>
                      {(formData.allowances || []).length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {formData.allowances.map((row, index) => (
                            <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 bg-gray-50/50 dark:bg-white/[0.02] p-3 rounded-[8px] border border-gray-100 dark:border-white/5">
                              <div className="flex-1 flex flex-col gap-1.5">
                                <Label>Allowance Name</Label>
                                <input type="text" value={row.name} onChange={(e) => {
                                  const updated = formData.allowances.map((al, idx) => idx === index ? { ...al, name: e.target.value } : al);
                                  handleChange("allowances", updated);
                                }} placeholder="E.g., Special Transport" className={inputCls} />
                              </div>
                              <div className="flex-1 flex flex-col gap-1.5">
                                <Label>Amount</Label>
                                <div className="relative w-full">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] font-bold text-[13px] pointer-events-none select-none">{formData.currency}</span>
                                  <input type="text" value={row.amount} onChange={(e) => {
                                    const updated = formData.allowances.map((al, idx) => idx === index ? { ...al, amount: formatCurrency(e.target.value) } : al);
                                    handleChange("allowances", updated);
                                  }} placeholder="0.00" className={`${inputCls} pl-14`} />
                                </div>
                              </div>
                              <button type="button" onClick={() => handleChange("allowances", formData.allowances.filter((_, idx) => idx !== index))}
                                className="h-11 w-11 flex items-center justify-center rounded-[8px] border border-[#FF3B30]/20 hover:border-[#FF3B30] text-[#FF3B30] hover:bg-[#FF3B30]/5 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-300 dark:border-white/10 rounded-[8px] p-6 text-center">
                          <p className="text-[12.5px] text-gray-400 font-medium mb-1">No custom allowances configured yet</p>
                          <span className="text-[11px] text-gray-500">Click the button below to add allowance options</span>
                        </div>
                      )}
                      <button type="button" onClick={() => handleChange("allowances", [...(formData.allowances || []), { name: "", amount: "" }])}
                        className="mt-2 h-10 px-4 self-start flex items-center gap-1.5 text-[12.5px] font-bold text-[#007AFF] bg-[#E5F1FF] dark:bg-[#007AFF]/10 hover:bg-[#007AFF]/15 rounded-[8px] transition-colors border border-[#007AFF]/10">
                        <Plus size={14} strokeWidth={2.5} />
                        Add Allowance Option
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 6: Site & Worksite Details ── */}
            {currentStep === 6 && (
              <SectionCard title="Site & Worksite Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label required>Worksite Address</Label>
                    <textarea value={formData.worksiteAddress} onChange={(e) => handleChange("worksiteAddress", e.target.value)}
                      placeholder="123 Industrial Street, Jurong, Singapore 654321" rows={3} className={textareaCls} maxLength={500} />
                    <HelpText>Physical location where work is performed</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Site Latitude</Label>
                    <input type="number" value={formData.siteLatitude} onChange={(e) => handleChange("siteLatitude", e.target.value)}
                      placeholder="e.g., 1.3521" step="any" min="-90" max="90" className={inputCls} />
                    <HelpText>Decimal format (-90 to +90)</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Site Longitude</Label>
                    <input type="number" value={formData.siteLongitude} onChange={(e) => handleChange("siteLongitude", e.target.value)}
                      placeholder="e.g., 103.8198" step="any" min="-180" max="180" className={inputCls} />
                    <HelpText>Decimal format (-180 to +180)</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <div className="flex items-center">
                      <Label>Location Link (Google Maps)</Label>
                      <InfoTooltip />
                    </div>
                    <input type="text" value={formData.locationLink} onChange={(e) => handleChange("locationLink", e.target.value)}
                      placeholder="https://maps.app.goo.gl/..." className={inputCls} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Site Access Pass Required?</Label>
                    <div className="flex items-center h-11 gap-3">
                      <ToggleSwitch value={formData.siteAccessPass} onChange={(v) => handleChange("siteAccessPass", v)} />
                      <span className="text-[13px] font-medium text-gray-600 dark:text-gray-300">{formData.siteAccessPass ? "Yes — Access pass required" : "No"}</span>
                    </div>
                    <HelpText>Enable if client requires entry permits/passes</HelpText>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>PPE Required?</Label>
                    <div className="flex items-center h-11 gap-3">
                      <ToggleSwitch value={formData.ppeRequired} onChange={(v) => handleChange("ppeRequired", v)} />
                      <span className="text-[13px] font-medium text-gray-600 dark:text-gray-300">{formData.ppeRequired ? "Yes — PPE mandatory" : "No"}</span>
                    </div>
                    <HelpText>Enable if safety equipment is mandatory at this site</HelpText>
                  </div>

                  {formData.ppeRequired && (
                    <div className="flex flex-col gap-1.5 md:col-span-2 animate-in fade-in duration-200">
                      <Label>PPE Types Required</Label>
                      <CheckboxGroup
                        value={formData.ppeTypes}
                        onChange={(v) => handleChange("ppeTypes", v)}
                        options={["Hard Hat / Helmet", "Safety Vest", "Safety Boots", "Gloves", "Safety Goggles", "Face Mask", "Others"]}
                        cols={3}
                      />
                      <HelpText>Check all required PPE items</HelpText>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <Label>Site Reporting Time</Label>
                    <input type="time" value={formData.siteReportingTime} onChange={(e) => handleChange("siteReportingTime", e.target.value)} className={inputCls} />
                    <HelpText>Time when workers must be on-site (e.g., 07:30)</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Site Supervisor / In-Charge</Label>
                    <input type="text" value={formData.siteSupervisor} onChange={(e) => handleChange("siteSupervisor", e.target.value)}
                      placeholder="Name of site supervisor or IC" className={inputCls} maxLength={255} />
                    <HelpText>Person responsible at site</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label>Site Rules / Instructions</Label>
                    <textarea value={formData.siteRules} onChange={(e) => handleChange("siteRules", e.target.value)}
                      placeholder={"1. No smoking inside facility\n2. Mandatory safety briefing on first day\n3. Report accidents immediately..."} rows={5} className={textareaCls} maxLength={1000} />
                    <div className="flex justify-between">
                      <HelpText>Safety briefing notes, special instructions, client requirements</HelpText>
                      <span className="text-[11px] text-gray-400 font-medium">{formData.siteRules.length}/1000</span>
                    </div>
                  </div>

                </div>
              </SectionCard>
            )}

            {/* ── STEP 7: Accommodation & Transport ── */}
            {currentStep === 7 && (
              <SectionCard title="Accommodation & Transport">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="flex flex-col gap-1.5">
                    <Label>Dormitory Name</Label>
                    <input type="text" value={formData.dormitoryName} onChange={(e) => handleChange("dormitoryName", e.target.value)}
                      placeholder="e.g., Riverside Worker Hostel" className={inputCls} maxLength={255} />
                    <HelpText>Name of accommodation facility</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Bed Allocation</Label>
                    <input type="number" min="1" value={formData.bedAllocation} onChange={(e) => handleChange("bedAllocation", e.target.value)}
                      placeholder="50" className={inputCls} />
                    <HelpText>Total number of beds reserved at the dorm</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label>Dormitory Address</Label>
                    <textarea value={formData.dormitoryAddress} onChange={(e) => handleChange("dormitoryAddress", e.target.value)}
                      placeholder="123 Lodging Street, Singapore 654321" rows={3} className={textareaCls} maxLength={500} />
                    <HelpText>Full address of accommodation facility</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Transport Vendor</Label>
                    <input type="text" value={formData.transportVendor} onChange={(e) => handleChange("transportVendor", e.target.value)}
                      placeholder="e.g., ABC Logistics, XYZ Transport" className={inputCls} maxLength={255} />
                    <HelpText>Name of transport service provider</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Pick-up Point</Label>
                    <input type="text" value={formData.pickupPoint} onChange={(e) => handleChange("pickupPoint", e.target.value)}
                      placeholder="e.g., Dormitory Main Gate, Bus Stop X" className={inputCls} maxLength={255} />
                    <HelpText>Boarding location for transport to worksite</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Drop-off Point</Label>
                    <input type="text" value={formData.dropoffPoint} onChange={(e) => handleChange("dropoffPoint", e.target.value)}
                      placeholder="e.g., Main Gate, Parking Lot A" className={inputCls} maxLength={255} />
                    <HelpText>Worksite entry point where workers are dropped off</HelpText>
                  </div>

                </div>
              </SectionCard>
            )}

            {/* ── STEP 8: Budget ── */}
            {currentStep === 8 && (
              <SectionCard title="Budget">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="flex flex-col gap-1.5">
                    <Label>Budget Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] font-bold text-[13px] pointer-events-none">S$</span>
                      <input type="text" value={formData.budgetAmount} onChange={(e) => handleChange("budgetAmount", formatCurrency(e.target.value))}
                        placeholder="100,000.00" className={`${inputCls} pl-10`} />
                    </div>
                    <HelpText>Total approved budget for project expenses</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Budget Approval Date</Label>
                    <div className="relative">
                      <input type="date" value={formData.budgetApprovalDate} onChange={(e) => handleChange("budgetApprovalDate", e.target.value)}
                        className={`${inputCls} pr-10`} />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" />
                    </div>
                    <HelpText>Date when budget was formally approved</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label>Budget Owner</Label>
                    <EmployeeMultiSelect
                      value={formData.budgetOwner ? [formData.budgetOwner] : []}
                      onChange={(v) => handleChange("budgetOwner", v[v.length - 1] || "")}
                      employees={employees}
                      label="Search employee..."
                    />
                    <HelpText>Person who approves budget usage and changes</HelpText>
                  </div>

                </div>
              </SectionCard>
            )}

            {/* ── STEP 9: Compliance & Insurance ── */}
            {currentStep === 9 && (
              <SectionCard title="Compliance & Insurance">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="flex flex-col gap-1.5">
                    <Label>Insurance Provider</Label>
                    <input type="text" value={formData.insuranceProvider} onChange={(e) => handleChange("insuranceProvider", e.target.value)}
                      placeholder="e.g., AXA, Great Eastern, NTUC Income" className={inputCls} maxLength={255} />
                    <HelpText>Name of insurance company providing coverage</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Project Insurance Expiry</Label>
                    <div className="relative">
                      <input type="date" value={formData.insuranceExpiry} onChange={(e) => handleChange("insuranceExpiry", e.target.value)}
                        className={`${inputCls} pr-10`} />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" />
                    </div>
                    <HelpText>Date when insurance coverage expires</HelpText>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>WICA Coverage Active?</Label>
                    <div className="flex items-center h-11 gap-3">
                      <ToggleSwitch value={formData.wicaCoverage} onChange={(v) => handleChange("wicaCoverage", v)} />
                      <span className="text-[13px] font-medium text-gray-600 dark:text-gray-300">{formData.wicaCoverage ? "Yes — WICA coverage in place" : "No"}</span>
                    </div>
                    <HelpText>Enable if Workmen&apos;s Injury Compensation coverage is active</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Safety Compliance Status</Label>
                    <CustomSelect value={formData.safetyCompliance} onChange={(v) => handleChange("safetyCompliance", v)}
                      options={["Compliant", "Pending", "Non-Compliant"]} />
                    <HelpText>Current safety compliance level</HelpText>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label>MOM Compliance Notes</Label>
                    <textarea value={formData.momNotes} onChange={(e) => handleChange("momNotes", e.target.value.slice(0, 1000))}
                      placeholder={"e.g., S-Pass holders require annual renewal...\nFIN card expiry: 2026-12-31..."} rows={4} className={textareaCls} />
                    <div className="flex justify-between">
                      <HelpText>Ministry of Manpower requirements or compliance notes</HelpText>
                      <span className="text-[11px] text-gray-400 font-medium">{formData.momNotes.length}/1000</span>
                    </div>
                  </div>

                </div>
              </SectionCard>
            )}

            {/* ── STEP 10: Document Uploads ── */}
            {currentStep === 10 && (
              <SectionCard title="Document Uploads">
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6">
                  Upload project-related documents. Accepted formats: PDF, JPG, PNG, DOCX. Max 5MB per file.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { field: "serviceAgreementName", label: "Service Agreement", desc: "Signed contract between company and client" },
                    { field: "quotationName", label: "Quotation", desc: "Initial quotation submitted to client" },
                    { field: "purchaseOrderName", label: "Purchase Order (PO)", desc: "Formal purchase order from client" },
                    { field: "workOrderName", label: "Work Order", desc: "Work authorization document from client" },
                    { field: "safetyDocumentsName", label: "Safety Documents", desc: "Safety plan, risk assessment, method statement" },
                    { field: "employeePassCopiesName", label: "Employee Pass Copies", desc: "Scans of work passes (S-Pass, EP, Work Permit)" },
                    { field: "insuranceDocumentsName", label: "Insurance Documents", desc: "Insurance certificate, WICA coverage proof" },
                  ].map(({ field, label, desc }) => {
                    const val = (formData as any)[field] as string;
                    return (
                      <div key={field} className="border border-[#E5E5EA] dark:border-white/10 rounded-[12px] p-4 flex flex-col gap-2 hover:border-[#007AFF]/40 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[13px] font-bold text-gray-900 dark:text-white">{label}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                          </div>
                          {val && <CheckCircle2 className="h-4 w-4 text-[#34C759] shrink-0 mt-0.5" />}
                        </div>
                        {val ? (
                          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 px-3 py-2 rounded-[8px]">
                            <FileText size={14} className="text-[#007AFF] shrink-0" />
                            <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300 truncate">{val}</span>
                            <button type="button" onClick={() => handleDocUpload(field, "")} className="ml-auto text-gray-400 hover:text-red-500 transition-colors shrink-0">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 h-9 px-3 border border-dashed border-[#E5E5EA] dark:border-white/10 rounded-[8px] cursor-pointer hover:border-[#007AFF] transition-all">
                            <UploadCloud size={14} className="text-[#8E8E93]" />
                            <span className="text-[12px] text-gray-400 font-medium">Click to upload</span>
                            <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png,.docx"
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload(field, f.name); }} />
                          </label>
                        )}
                      </div>
                    );
                  })}

                  {(formData.customDocuments || []).map((doc: any, index: number) => (
                    <div key={doc.id} className="border border-[#E5E5EA] dark:border-white/10 rounded-[12px] p-4 flex flex-col gap-2 hover:border-[#007AFF]/40 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 mr-2">
                          <input type="text" value={doc.name} placeholder="Document Name"
                            onChange={(e) => {
                              const updated = [...formData.customDocuments];
                              updated[index].name = e.target.value;
                              handleChange("customDocuments", updated);
                            }}
                            className="w-full text-[13px] font-bold text-gray-900 dark:text-white bg-transparent border-b border-dashed border-gray-300 dark:border-white/20 focus:border-[#007AFF] focus:outline-none px-1 py-0.5" />
                          <p className="text-[11px] text-gray-400 mt-1 pl-1">Custom document upload</p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {doc.fileName && <CheckCircle2 className="h-4 w-4 text-[#34C759] shrink-0" />}
                          <button type="button" onClick={() => handleChange("customDocuments", formData.customDocuments.filter((_: any, i: number) => i !== index))}
                            className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {doc.fileName ? (
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 px-3 py-2 rounded-[8px]">
                          <FileText size={14} className="text-[#007AFF] shrink-0" />
                          <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300 truncate">{doc.fileName}</span>
                          <button type="button" onClick={() => {
                            const updated = [...formData.customDocuments];
                            updated[index].fileName = "";
                            handleChange("customDocuments", updated);
                          }} className="ml-auto text-gray-400 hover:text-red-500 transition-colors shrink-0">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 h-9 px-3 border border-dashed border-[#E5E5EA] dark:border-white/10 rounded-[8px] cursor-pointer hover:border-[#007AFF] transition-all">
                          <UploadCloud size={14} className="text-[#8E8E93]" />
                          <span className="text-[12px] text-gray-400 font-medium">Click to upload</span>
                          <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png,.docx"
                            onChange={(e) => { 
                              const f = e.target.files?.[0]; 
                              if (f) {
                                const updated = [...formData.customDocuments];
                                updated[index].fileName = f.name;
                                handleChange("customDocuments", updated);
                              } 
                            }} />
                        </label>
                      )}
                    </div>
                  ))}

                  {/* Add Document Card */}
                  {(formData.customDocuments?.length || 0) < 3 && (
                    <div 
                      onClick={() => handleChange("customDocuments", [...(formData.customDocuments || []), { id: Date.now().toString(), name: "", fileName: "" }])}
                      className="border border-dashed border-[#007AFF]/30 bg-[#007AFF]/[0.02] hover:bg-[#007AFF]/5 dark:border-[#007AFF]/20 dark:bg-[#007AFF]/5 dark:hover:bg-[#007AFF]/10 rounded-[12px] p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[100px]"
                    >
                      <Plus size={20} className="text-[#007AFF]" />
                      <span className="text-[13px] font-bold text-[#007AFF]">Add Document</span>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* ── STEP 11: Assign Employees ── */}
            {currentStep === 11 && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start animate-in fade-in duration-200">
                
                {/* Left Column (Assignment Controls) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <SectionCard title="Assign Employees">
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6">
                      Assign departments or individual employees to this project. Leave blank to assign later.
                    </p>

                    <div className="flex flex-col gap-2 mb-6">
                      <Label>Assignment Mode</Label>
                      <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-[10px] w-full max-w-[400px]">
                        <button type="button" onClick={() => { setAssignmentMode("individual"); handleChange("assignedDepartments", []); }}
                          className={`flex-1 py-2 text-[13px] font-bold rounded-[8px] transition-all text-center ${assignmentMode === "individual" ? "bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
                          Individual Employees
                        </button>
                        <button type="button" onClick={() => { setAssignmentMode("department"); handleChange("assignedEmployees", []); }}
                          className={`flex-1 py-2 text-[13px] font-bold rounded-[8px] transition-all text-center ${assignmentMode === "department" ? "bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
                          Departments
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      {assignmentMode === "department" ? (
                        <div className="flex flex-col gap-2 w-full">
                          <Label>Assign Departments</Label>
                          <DepartmentMultiSelect
                            value={formData.assignedDepartments}
                            onChange={(v) => handleChange("assignedDepartments", v)}
                            departments={departments}
                            hideSelected={true}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 w-full">
                          <Label>Assign Individual Employees</Label>
                          <EmployeeMultiSelect value={formData.assignedEmployees} onChange={(v) => handleChange("assignedEmployees", v)} employees={employees} hideSelected={true} />
                        </div>
                      )}
                    </div>
                  </SectionCard>
                </div>

                {/* Right Column (Resource Table Card) */}
                <div className="lg:col-span-3">
                  <div className="bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-white/10 rounded-[16px] p-6 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                    {assignmentMode === "individual" ? (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">Assigned Employees</h3>
                          <span className="bg-[#E5F1FF] dark:bg-[#007AFF]/10 text-[#007AFF] text-[11px] font-bold px-2 py-0.5 rounded-full">
                            {formData.assignedEmployees.length} Total
                          </span>
                        </div>
                        {formData.assignedEmployees.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-[#E5E5EA] dark:border-white/10 text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                  <th className="pb-2 font-semibold">Name</th>
                                  <th className="pb-2 font-semibold">Emp ID</th>
                                  <th className="pb-2 text-right font-semibold">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E5E5EA] dark:divide-white/5">
                                {formData.assignedEmployees.map((name) => {
                                  const empObj = employees.find((e) => e.name === name);
                                  return (
                                    <tr key={name} className="text-[12.5px] text-gray-700 dark:text-gray-200">
                                      <td className="py-2.5 flex items-center gap-2">
                                        {empObj?.avatar_url ? (
                                          <img src={empObj.avatar_url} alt={name} className="h-6 w-6 rounded-full object-cover shrink-0" />
                                        ) : (
                                          <div className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ backgroundColor: getAvatarColor(name).bg, color: getAvatarColor(name).color }}>
                                            {getInitials(name)}
                                          </div>
                                        )}
                                        <span className="font-bold truncate max-w-[120px]" title={name}>{name}</span>
                                      </td>
                                      <td className="py-2.5 font-medium text-gray-500 dark:text-gray-400">
                                        {empObj?.emp_id || "—"}
                                      </td>
                                      <td className="py-2.5 text-right">
                                        <button
                                          type="button"
                                          onClick={() => handleChange("assignedEmployees", formData.assignedEmployees.filter((n) => n !== name))}
                                          className="text-gray-400 hover:text-[#FF3B30] transition-colors p-1"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 dark:text-gray-500">
                            <span className="text-[12px] font-medium">No employees assigned yet.</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">Assigned Depts</h3>
                          <span className="bg-[#E5F1FF] dark:bg-[#007AFF]/10 text-[#007AFF] text-[11px] font-bold px-2 py-0.5 rounded-full">
                            {formData.assignedDepartments.length} Total
                          </span>
                        </div>
                        {formData.assignedDepartments.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-[#E5E5EA] dark:border-white/10 text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                  <th className="pb-2 font-semibold">Department</th>
                                  <th className="pb-2 text-right font-semibold">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E5E5EA] dark:divide-white/5">
                                {formData.assignedDepartments.map((deptName) => (
                                  <tr key={deptName} className="text-[12.5px] text-gray-700 dark:text-gray-200">
                                    <td className="py-2.5 font-bold truncate max-w-[180px]">{deptName}</td>
                                    <td className="py-2.5 text-right">
                                      <button
                                        type="button"
                                        onClick={() => handleChange("assignedDepartments", formData.assignedDepartments.filter((n) => n !== deptName))}
                                        className="text-gray-400 hover:text-[#FF3B30] transition-colors p-1"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 dark:text-gray-500">
                            <span className="text-[12px] font-medium">No departments assigned to this phase yet.</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ── STEP 12: Review ── */}
            {currentStep === 12 && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#1A1A1E] border border-[#E5E5EA] dark:border-white/10 rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-8 max-w-[900px] mx-auto w-full text-[13px] text-gray-900 dark:text-gray-100">

                  <div className="flex flex-col items-center text-center border-b-2 border-gray-900 dark:border-white pb-6 mb-6">
                    <span className="text-[11px] font-bold tracking-[0.2em] text-[#007AFF] uppercase mb-1">
                      {companySettings?.company_name || "Dort Asia Enterprise Platform"}
                    </span>
                    <h2 className="text-[20px] font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                      Project Specification & Assignment Sheet
                    </h2>
                    <div className="flex gap-4 mt-2 text-[11px] text-gray-500 font-medium">
                      <span>Document ID: <strong className="text-gray-800 dark:text-gray-200">{formData.projectId || "DRAFT-PRJ"}</strong></span>
                      <span>•</span>
                      <span>Prepared: <strong className="text-gray-800 dark:text-gray-200">{new Date().toLocaleDateString("en-SG")}</strong></span>
                    </div>
                  </div>

                  {/* 1. General */}
                  <div className="mb-6">
                    <h3 className="text-[12px] font-bold tracking-wider text-gray-900 dark:text-white uppercase bg-gray-50 dark:bg-white/[0.03] px-3 py-1.5 border-l-4 border-[#007AFF] mb-3">1. Project Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-3">
                      {[
                        ["Project Name", formData.projectName],
                        ["Project ID", formData.projectId],
                        ["Classification", formData.classification],
                        ["Category", formData.projectType || "—"],
                        ["Project Manager", formData.owner || "—"],
                        ["Status", formData.projectStatus],
                      ].map(([k, v]) => (
                        <div key={k}><span className="text-gray-400 font-medium block text-[11px] uppercase tracking-wider mb-0.5">{k}</span><span className="font-bold">{v}</span></div>
                      ))}
                      {formData.description && (
                        <div className="sm:col-span-2"><span className="text-gray-400 font-medium block text-[11px] uppercase tracking-wider mb-0.5">Description</span><span className="font-medium">{formData.description}</span></div>
                      )}
                    </div>
                  </div>

                  {/* 2. Timeline */}
                  <div className="mb-6">
                    <h3 className="text-[12px] font-bold tracking-wider text-gray-900 dark:text-white uppercase bg-gray-50 dark:bg-white/[0.03] px-3 py-1.5 border-l-4 border-[#007AFF] mb-3">2. Timeline & Schedule</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-3">
                      {[
                        ["Operational Period", `${formData.startDate || "—"} → ${formData.endDate || "—"}`],
                        ["Duration", formData.contractDuration || "—"],
                        ["Working Days", formData.workingDays.join(", ") || "—"],
                        ["Working Hours", `${formData.workingHoursFrom} – ${formData.workingHoursTo}`],
                        ["Shift Type(s)", formData.shiftTypes.join(", ") || "—"],
                        ["Overtime", formData.overtimeApplicable ? "Yes" : "No"],
                      ].map(([k, v]) => (
                        <div key={k}><span className="text-gray-400 font-medium block text-[11px] uppercase tracking-wider mb-0.5">{k}</span><span className="font-bold">{v}</span></div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Client (if External) */}
                  {isExternal && (
                    <div className="mb-6">
                      <h3 className="text-[12px] font-bold tracking-wider text-gray-900 dark:text-white uppercase bg-gray-50 dark:bg-white/[0.03] px-3 py-1.5 border-l-4 border-[#007AFF] mb-3">3. Client Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-3">
                        {[
                          ["External Type", formData.externalType || "—"],
                          ["Client Company", formData.clientCompany || "—"],
                          ["UEN / Tax ID", formData.uenNumber || "—"],
                          ["Contact Person", formData.clientContact || "—"],
                          ["Contact Email", formData.clientEmail || "—"],
                          ["Contact Phone", formData.clientPhone || "—"],
                          ["Contract Number", formData.contractNumber || "—"],
                        ].map(([k, v]) => (
                          <div key={k}><span className="text-gray-400 font-medium block text-[11px] uppercase tracking-wider mb-0.5">{k}</span><span className="font-bold">{v}</span></div>
                        ))}
                        {formData.billingAddress && <div className="sm:col-span-2"><span className="text-gray-400 font-medium block text-[11px] uppercase tracking-wider mb-0.5">Billing Address</span><span className="font-medium">{formData.billingAddress}</span></div>}
                      </div>
                    </div>
                  )}

                  {/* 4. Commercial (if External) */}
                  {isExternal && (
                    <div className="mb-6">
                      <h3 className="text-[12px] font-bold tracking-wider text-gray-900 dark:text-white uppercase bg-gray-50 dark:bg-white/[0.03] px-3 py-1.5 border-l-4 border-[#007AFF] mb-3">4. Commercial Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-3">
                        {[
                          ["Contract Value", formData.contractValue ? `${formData.currency} ${formData.contractValue}` : "—"],
                          ["Currency", formData.currency],
                          ["Payment Cycle", formData.paymentCycle || "—"],
                          ["Invoice Frequency", formData.invoiceFrequency || "—"],
                          ["Tax %", formData.taxPercent ? `${formData.taxPercent}%` : "—"],
                          ["Retention %", formData.retentionPercent ? `${formData.retentionPercent}%` : "—"],
                          ["Payment Method", formData.paymentMethod.join(", ") || "—"],
                        ].map(([k, v]) => (
                          <div key={k}><span className="text-gray-400 font-medium block text-[11px] uppercase tracking-wider mb-0.5">{k}</span><span className="font-bold">{v}</span></div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. Site & Worksite */}
                  {isFullOrManpower && (
                    <div className="mb-6">
                      <h3 className="text-[12px] font-bold tracking-wider text-gray-900 dark:text-white uppercase bg-gray-50 dark:bg-white/[0.03] px-3 py-1.5 border-l-4 border-[#007AFF] mb-3">5. Site Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-3">
                        {[
                          ["Worksite Address", formData.worksiteAddress || "—"],
                          ["GPS", formData.siteLatitude && formData.siteLongitude ? `${formData.siteLatitude}, ${formData.siteLongitude}` : "—"],
                          ["Access Pass Required", formData.siteAccessPass ? "Yes" : "No"],
                          ["PPE Required", formData.ppeRequired ? "Yes" : "No"],
                          ["PPE Types", formData.ppeTypes.join(", ") || "—"],
                          ["Site Reporting Time", formData.siteReportingTime || "—"],
                          ["Site Supervisor", formData.siteSupervisor || "—"],
                        ].map(([k, v]) => (
                          <div key={k}><span className="text-gray-400 font-medium block text-[11px] uppercase tracking-wider mb-0.5">{k}</span><span className="font-bold">{v}</span></div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6. Compliance */}
                  <div className="mb-6">
                    <h3 className="text-[12px] font-bold tracking-wider text-gray-900 dark:text-white uppercase bg-gray-50 dark:bg-white/[0.03] px-3 py-1.5 border-l-4 border-[#007AFF] mb-3">6. Compliance & Insurance</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-3">
                      {[
                        ["Insurance Provider", formData.insuranceProvider || "—"],
                        ["WICA Coverage", formData.wicaCoverage ? "Yes" : "No"],
                        ["Insurance Expiry", formData.insuranceExpiry || "—"],
                        ["Safety Compliance", formData.safetyCompliance],
                      ].map(([k, v]) => (
                        <div key={k}><span className="text-gray-400 font-medium block text-[11px] uppercase tracking-wider mb-0.5">{k}</span><span className="font-bold">{v}</span></div>
                      ))}
                      {formData.momNotes && <div className="sm:col-span-2"><span className="text-gray-400 font-medium block text-[11px] uppercase tracking-wider mb-0.5">MOM Notes</span><span className="font-medium whitespace-pre-line">{formData.momNotes}</span></div>}
                    </div>
                  </div>

                  {/* 7. Budget */}
                  <div className="mb-6">
                    <h3 className="text-[12px] font-bold tracking-wider text-gray-900 dark:text-white uppercase bg-gray-50 dark:bg-white/[0.03] px-3 py-1.5 border-l-4 border-[#007AFF] mb-3">7. Budget</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-3">
                      {[
                        ["Budget Amount", formData.budgetAmount ? `S$ ${formData.budgetAmount}` : "—"],
                        ["Budget Owner", formData.budgetOwner || "—"],
                        ["Budget Approval Date", formData.budgetApprovalDate || "—"],
                      ].map(([k, v]) => (
                        <div key={k}><span className="text-gray-400 font-medium block text-[11px] uppercase tracking-wider mb-0.5">{k}</span><span className="font-bold">{v}</span></div>
                      ))}
                    </div>
                  </div>

                  {/* Declarations */}
                  <div className="mt-8 bg-gray-50/50 dark:bg-white/[0.01] border border-dashed border-gray-300 dark:border-white/10 rounded-[6px] p-5 mb-8">
                    <h4 className="text-[12px] font-bold tracking-wider text-gray-900 dark:text-white uppercase mb-2">Declarations & Consent</h4>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={isDeclared} onChange={(e) => setIsDeclared(e.target.checked)}
                        className="h-4 w-4 mt-0.5 rounded border-gray-300 text-[#007AFF] focus:ring-[#007AFF] cursor-pointer shrink-0" />
                      <span className="text-[12px] text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                        I hereby declare and confirm that the details, timelines, financial specifications, and resource allocations documented in this Project Specification Sheet are true, complete, and legally authorized.
                      </span>
                    </label>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t-2 border-gray-900 dark:border-white/20 mt-8">
                    <div className="flex flex-col">
                      <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-4">PREPARED BY (PROJECT MANAGER)</span>
                      <div className="h-16 flex items-end pb-1 border-b border-gray-300 dark:border-white/20">
                        <span className="font-serif italic text-[#007AFF] dark:text-[#3399FF] text-[18px] tracking-wide select-none">{formData.owner || "Project Manager"}</span>
                      </div>
                      <span className="text-[11px] text-gray-500 font-medium mt-1.5">Date: {new Date().toLocaleDateString("en-SG")}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1.5">AUTHORIZED SIGNATORY</span>
                      <input type="text" value={sigName} onChange={(e) => setSigName(e.target.value)} placeholder="Type full name to sign"
                        className="h-8 px-2 w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-[6px] text-[12px] font-medium text-gray-900 dark:text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] transition-all mb-2" />
                      <div className="h-12 flex items-end pb-1 border-b border-gray-300 dark:border-white/20">
                        {sigName ? (
                          <span className="font-serif italic text-[#007AFF] dark:text-[#3399FF] text-[19px] tracking-wide select-none">{sigName}</span>
                        ) : (
                          <span className="text-gray-300 dark:text-white/10 text-[12px] italic select-none">Signature preview appears here</span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-500 font-medium mt-1.5">Date: {sigName ? new Date().toLocaleDateString("en-SG") : "—"}</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {error && (
              <p className="text-[13px] text-[#FF3B30] font-semibold bg-[#FF3B30]/5 p-3.5 rounded-xl border border-[#FF3B30]/10">{error}</p>
            )}

          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#0B0B0F] border-t border-[#E5E5EA] dark:border-white/10 px-8 py-4 flex items-center justify-between z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="max-w-[900px] mx-auto w-full flex items-center justify-between">
            <button type="button" onClick={handleBack} disabled={currentStepIndex === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] border border-[#E5E5EA] dark:border-white/10 text-gray-700 dark:text-gray-300 text-[14px] font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors bg-white dark:bg-[#1C1C1E] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
              <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
              Back
            </button>
            {currentStepIndex < steps.length - 1 ? (
              <button type="button" onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-[8px] bg-[#007AFF] text-white text-[14px] font-bold hover:bg-[#0062CC] transition-colors shadow-sm">
                Next
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={saving || !isDeclared || !sigName.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-[8px] bg-[#34C759] hover:bg-[#2fb14e] text-white text-[14px] font-bold transition-colors shadow-sm disabled:opacity-50">
                {saving ? (
                  <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting…</>
                ) : (
                  <><Check className="h-4 w-4" strokeWidth={2.5} />Complete Setup</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronDown, Save, ArrowRight, ArrowLeft, Calendar, 
  UploadCloud, CheckCircle2, Plus, Minus, Trash2, X, FileText, Eye, Upload, Check 
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Cropper from "react-easy-crop";

// --- CUSTOM UI COMPONENTS ---

const Label = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
  <label className="text-[12px] font-bold text-[#1C1C1E] mb-1.5 flex items-center gap-1">
    {children} {required && <span className="text-[#FF3B30]">*</span>}
  </label>
);

const CustomSelect = ({ value, onChange, options, placeholder = "Select", disabled = false }: any) => {
  return (
    <div className="relative">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        disabled={disabled}
        className={`h-11 pl-3 pr-10 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 appearance-none focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all cursor-pointer ${disabled ? 'opacity-60 bg-gray-50 cursor-not-allowed' : ''}`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt: any) => (
          <option key={opt.value || opt} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" strokeWidth={2} />
    </div>
  );
};

const GLOBAL_NATIONALITIES = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Argentine", "Armenian", "Australian", "Austrian", "Azerbaijani",
  "Bahamian", "Bahraini", "Bangladeshi", "Barbadian", "Belarusian", "Belgian", "Belizian", "Beninese", "Bhutanese", "Bolivian", "Bosnian", "Brazilian", "British", "Bruneian", "Bulgarian", "Burmese",
  "Cambodian", "Cameroonian", "Canadian", "Chilean", "Chinese", "Colombian", "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech",
  "Danish", "Djiboutian", "Dominican", "Dutch",
  "Ecuadorian", "Egyptian", "Emirati", "Estonian", "Ethiopian",
  "Fijian", "Filipino", "Finnish", "French",
  "Gabonese", "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Guatemalan", "Guyanese",
  "Haitian", "Honduran", "Hungarian",
  "Icelandic", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli", "Italian", "Ivorian",
  "Jamaican", "Japanese", "Jordanian",
  "Kazakh", "Kenyan", "Kuwaiti", "Kyrgyz",
  "Laotian", "Latvian", "Lebanese", "Liberian", "Libyan", "Liechtensteiner", "Lithuanian", "Luxembourger",
  "Macedonian", "Malagasy", "Malawian", "Malaysian", "Maldivian", "Malian", "Maltese", "Mauritian", "Mexican", "Moldovan", "Monacan", "Mongolian", "Montenegrin", "Moroccan", "Mozambican",
  "Namibian", "Nepalese", "New Zealander", "Nicaraguan", "Nigerian", "Norwegian",
  "Omani",
  "Pakistani", "Panamanian", "Paraguayan", "Peruvian", "Polish", "Portuguese",
  "Qatari",
  "Romanian", "Russian", "Rwandan",
  "Saudi", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean", "Singaporean", "Slovak", "Slovenian", "Somali", "South African", "South Korean", "Spanish", "Sri Lankan", "Sudanese", "Swedish", "Swiss", "Syrian",
  "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese", "Trinidadian", "Tunisian", "Turkish",
  "Ugandan", "Ukrainian", "Uruguayan", "Uzbek",
  "Venezuelan", "Vietnamese",
  "Yemeni",
  "Zambian", "Zimbabwean"
];

const NationalitySearchSelect = ({ value, onChange, placeholder = "Select Nationality" }: any) => {
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

  const filtered = GLOBAL_NATIONALITIES.filter(n =>
    n.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 flex items-center justify-between cursor-pointer focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all select-none"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-[#8E8E93] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} strokeWidth={2} />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E5E5EA] rounded-[12px] z-[999] p-2 max-h-[300px] flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <input
            type="text"
            placeholder="Search country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 px-3 w-full bg-gray-50 border border-[#E5E5EA] rounded-[6px] text-[12px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
            autoFocus
          />
          <div className="flex-1 overflow-y-auto page-scrollbar max-h-[220px] flex flex-col gap-0.5">
            {filtered.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleSelect(n)}
                className={`w-full text-left px-3 py-2 text-[12px] font-semibold rounded-[6px] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                  value === n ? "bg-[#EEF4FF] text-[#007AFF] font-bold" : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {n}
              </button>
            ))}
            {filtered.length === 0 && (
              <span className="text-[12px] text-gray-400 text-center py-4 font-semibold">
                No nationalities found
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const GLOBAL_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Brazil", "Brunei", "Bulgaria", "Burma (Myanmar)",
  "Cambodia", "Cameroon", "Canada", "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Estonia", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Mauritius", "Mexico", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique",
  "Namibia", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Norway",
  "Oman",
  "Pakistan", "Panama", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Somalia", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sudan", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Trinidad and Tobago", "Tunisia", "Turkey",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];

const getCountryFromNationality = (nationality: string): string => {
  const mapping: { [key: string]: string } = {
    "Singaporean": "Singapore",
    "Chinese": "China",
    "Malaysian": "Malaysia",
    "Bangladeshi": "Bangladesh",
    "Filipino": "Philippines",
    "Indian": "India",
    "American": "United States",
    "British": "United Kingdom",
    "Australian": "Australia",
    "Canadian": "Canada",
    "French": "France",
    "German": "Germany",
    "Japanese": "Japan",
    "Indonesian": "Indonesia",
    "Thai": "Thailand",
    "Vietnamese": "Vietnam",
    "Burmese": "Burma (Myanmar)",
    "Sri Lankan": "Sri Lanka",
    "Pakistani": "Pakistan",
    "Spanish": "Spain",
    "Italian": "Italy",
    "Dutch": "Netherlands",
    "Swiss": "Switzerland",
    "Swedish": "Sweden",
    "Norwegian": "Norway",
    "Finnish": "Finland",
    "Danish": "Denmark",
    "New Zealander": "New Zealand",
    "South Korean": "South Korea",
    "Taiwanese": "Taiwan",
    "Hong Konger": "China",
    "Russian": "Russia",
    "Ukrainian": "Ukraine",
    "Brazilian": "Brazil",
    "Argentine": "Argentina",
    "Mexican": "Mexico",
    "South African": "South Africa"
  };
  return mapping[nationality] || "";
};

const CountrySearchSelect = ({ value, onChange, placeholder = "Select Issuing Country" }: any) => {
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

  const filtered = GLOBAL_COUNTRIES.filter(c =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 flex items-center justify-between cursor-pointer focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all select-none"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-[#8E8E93] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} strokeWidth={2} />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-white border border-[#E5E5EA] rounded-[12px] z-[999] p-2 max-h-[300px] flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-1 duration-150">
          <input
            type="text"
            placeholder="Search country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 px-3 w-full bg-gray-50 border border-[#E5E5EA] rounded-[6px] text-[12px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
            autoFocus
          />
          <div className="flex-1 overflow-y-auto page-scrollbar max-h-[220px] flex flex-col gap-0.5">
            {filtered.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleSelect(c)}
                className={`w-full text-left px-3 py-2 text-[12px] font-semibold rounded-[6px] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                  value === c ? "bg-[#EEF4FF] text-[#007AFF] font-bold" : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {c}
              </button>
            ))}
            {filtered.length === 0 && (
              <span className="text-[12px] text-gray-400 text-center py-4 font-semibold">
                No countries found
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DesignationSelect = ({ value, onChange, departmentId, departments, onAddCustomDesignation }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDept = departments.find((d: any) => String(d.id) === String(departmentId));
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
            className="h-11 px-3 w-full bg-white border border-[#007AFF] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] shadow-sm shadow-[#007AFF]/10 pr-10"
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
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 rotate-180 cursor-pointer" onClick={() => setIsOpen(false)} />
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
          className={`h-11 px-3 w-full flex items-center justify-between bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all ${
            isDisabled 
              ? 'opacity-60 bg-gray-50 cursor-not-allowed border-gray-200 text-gray-400' 
              : 'hover:border-[#007AFF] cursor-pointer'
          }`}
        >
          <span>{isDisabled ? "Blocked (Select Department first)" : (value || "Select Designation")}</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      )}

      {isOpen && !isDisabled && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-[#E5E5EA] rounded-[8px] shadow-lg max-h-[200px] overflow-y-auto z-[999] page-scrollbar p-1.5 flex flex-col gap-1">
          {filtered.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleSelect(d)}
              className="w-full text-left px-3 py-2 text-[13px] font-medium rounded-[6px] hover:bg-gray-50 text-gray-800 dark:hover:bg-white/5 transition-colors"
            >
              {d}
            </button>
          ))}
          
          {showAddOption && (
            <button
              type="button"
              onClick={handleAdd}
              className="w-full text-left px-3 py-2 text-[13px] font-bold text-[#007AFF] rounded-[6px] hover:bg-[#007AFF]/5 transition-colors border-t border-gray-100 mt-1"
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

const PhoneInput = ({ code, number, onCodeChange, onNumberChange, placeholder = "9123 4567", codeOptions = ["+65"] }: any) => (
  <div className="flex gap-2 h-11">
    <div className="w-[85px] shrink-0 relative">
      <select 
        value={code} 
        onChange={(e) => onCodeChange(e.target.value)}
        className="h-full pl-3 pr-8 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 appearance-none focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all cursor-pointer"
      >
        {codeOptions.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#8E8E93] pointer-events-none" />
    </div>
    <input 
      type="text" 
      value={number} 
      onChange={(e) => onNumberChange(e.target.value)}
      placeholder={placeholder}
      className="flex-1 px-3 bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
    />
  </div>
);

const DateInput = ({ value, onChange, placeholder }: any) => {
  const [inputValue, setInputValue] = useState("");

  // Sync internal text state with external date value (YYYY-MM-DD)
  useEffect(() => {
    if (value && value.includes("-")) {
      const [y, m, d] = value.split("-");
      setInputValue(`${d}/${m}/${y}`);
    } else if (!value) {
      setInputValue("");
    }
  }, [value]);

  const handleManualChange = (val: string) => {
    // Basic auto-formatting for DD/MM/YYYY
    let cleaned = val.replace(/\D/g, "");
    if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
    
    // Block irrelevant numbers (Day > 31, Month > 12)
    if (cleaned.length >= 2) {
      const day = parseInt(cleaned.slice(0, 2));
      if (day > 31) cleaned = "31" + cleaned.slice(2);
      if (day === 0 && cleaned.length === 2) cleaned = "01" + cleaned.slice(2);
    }
    if (cleaned.length >= 4) {
      const month = parseInt(cleaned.slice(2, 4));
      if (month > 12) cleaned = cleaned.slice(0, 2) + "12" + cleaned.slice(4);
      if (month === 0 && cleaned.length === 4) cleaned = cleaned.slice(0, 2) + "01" + cleaned.slice(4);
    }

    let formatted = cleaned;
    if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    if (cleaned.length > 4) formatted = formatted.slice(0, 5) + "/" + formatted.slice(5);
    
    setInputValue(formatted);

    // If we have a full date, update the parent state
    if (cleaned.length === 8) {
      const d = cleaned.slice(0, 2);
      const m = cleaned.slice(2, 4);
      const y = cleaned.slice(4, 8);
      onChange(`${y}-${m}-${d}`);
    }
  };

  return (
    <div className="relative h-11">
      <input 
        type="text" 
        value={inputValue} 
        onChange={(e) => handleManualChange(e.target.value)}
        placeholder={placeholder || "DD/MM/YYYY"}
        className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center">
        <Calendar className="h-4 w-4 text-[#8E8E93] pointer-events-none" strokeWidth={2.5} />
        <input 
          type="date" 
          value={value || ""} 
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </div>
    </div>
  );
};

const FileUpload = ({ value, onChange, label: uploadLabel }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const getFileName = (val: any) => {
    if (!val) return "Click to upload";
    if (val instanceof File) return val.name;
    if (typeof val === "string") {
      const parts = val.split("/");
      const last = parts[parts.length - 1];
      if (last.includes("__")) {
        const subparts = last.split("__");
        return subparts[subparts.length - 1];
      }
      return last;
    }
    return "Uploaded Document";
  };

  const handlePreview = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering file upload popup
    if (!value || typeof value !== "string") return;
    setPreviewing(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage.from("private_data").download(value);
      if (error) throw error;
      const url = window.URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (err: any) {
      console.error("Preview failed:", err);
      alert("Failed to preview document: " + err.message);
    } finally {
      setPreviewing(false);
    }
  };

  const hasFile = !!value;
  const isUrl = typeof value === "string";

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] flex items-center justify-between cursor-pointer hover:border-[#007AFF] transition-all group"
      >
        <span 
          onClick={isUrl ? handlePreview : undefined}
          className={`text-[13px] font-medium truncate pr-4 transition-colors ${
            hasFile 
              ? isUrl 
                ? "text-[#007AFF] hover:underline cursor-pointer font-semibold" 
                : "text-gray-900" 
              : "text-[#8E8E93]"
          }`}
          title={isUrl ? "Click to open in new tab" : undefined}
        >
          {getFileName(value)}
        </span>
        {hasFile ? (
          <div className="flex items-center gap-2">
            {isUrl && (
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewing}
                className="p-1 hover:bg-[#F2F2F7] rounded transition-colors text-gray-500 hover:text-[#007AFF]"
                title="Preview in new tab"
              >
                {previewing ? (
                  <div className="h-3.5 w-3.5 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
            <FileText className="h-4 w-4 text-[#007AFF]" strokeWidth={2} />
          </div>
        ) : (
          <UploadCloud className="h-4 w-4 text-[#8E8E93] group-hover:text-[#007AFF]" strokeWidth={2} />
        )}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="bg-white w-full max-w-md rounded-[20px] shadow-2xl p-8 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-2 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="text-center mb-6">
              <h3 className="text-[18px] font-bold text-[#1C1C1E]">{uploadLabel || "Upload Document"}</h3>
              <p className="text-[13px] text-[#8E8E93]">Please upload a clear document copy</p>
            </div>

            <div className="relative group">
              <input 
                type="file" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onChange(e.target.files[0]);
                    setIsOpen(false);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full h-full"
              />
              <div className="h-48 w-full border-2 border-dashed border-[#E5E5EA] rounded-[16px] bg-[#F9F9FB] flex flex-col items-center justify-center gap-3 transition-all group-hover:bg-[#EEF4FF] group-hover:border-[#007AFF]">
                <div className="text-[#007AFF] mb-2">
                  <UploadCloud className="h-10 w-10" />
                </div>
                <div className="flex flex-col items-center text-center px-4">
                  <span className="text-[14px] font-bold text-[#1C1C1E] mb-1">Drag and drop or click to upload</span>
                  <span className="text-[12px] text-[#8E8E93] font-medium">
                    Supported: PDF, JPG, PNG (Max 50MB)
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full h-12 bg-[#007AFF] text-white rounded-[12px] text-[15px] font-bold hover:bg-[#0063CC] transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const SectionHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
  <div className="mb-6">
    <h3 className="text-[16px] font-bold text-[#1C1C1E]">{title}</h3>
    {subtitle && <p className="text-[13px] text-gray-500 font-medium mt-0.5">{subtitle}</p>}
  </div>
);

import { getAvatarColor, getInitials as getEmpInitials } from "@/utils/avatarColor";

const PHONE_CODE_OPTIONS = [
  "+65", "+60", "+62", "+63", "+66", "+81", "+82", "+84", "+86", "+91", "+92", "+94", "+95", "+977", "+880", "+852", "+853",
];

/** Default native / home-country dial code from nationality (editable by user). */
const NATIONALITY_TO_DIAL: Record<string, string> = {
  Chinese: "+86",
  Malaysian: "+60",
  Bangladeshi: "+880",
  Filipino: "+63",
  Indian: "+91",
};

const NATIONALITY_OPTIONS = ["Singaporean", "Chinese", "Malaysian", "Bangladeshi", "Filipino", "Indian"];

const formatSalary = (val: string) => {
  // Strip everything except digits and decimal point
  let clean = val.replace(/[^\d.]/g, "");
  
  // Ensure only one decimal point
  const parts = clean.split(".");
  if (parts.length > 2) {
    clean = parts[0] + "." + parts.slice(1).join("");
  }
  
  // Separate integer part with commas
  const integerPart = parts[0];
  const decimalPart = parts[1] !== undefined ? "." + parts[1] : "";
  
  // Add commas to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  return formattedInteger + decimalPart;
};

// --- MAIN PAGE ---

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: employeeId } = React.use(params);
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errorProp, setErrorProp] = useState("");
  const [userCompanyId, setUserCompanyId] = useState("");
  const [customFieldsConfig, setCustomFieldsConfig] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>(["Admin", "Sub Admin", "Employee"]);
  const [companyProjects, setCompanyProjects] = useState<any[]>([]);

  // Profile Photo Cropper State
  const [isEditingPic, setIsEditingPic] = useState(false);
  const [rawPic, setRawPic] = useState<string | null>(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const [picZoom, setPicZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropTemplateImage, setCropTemplateImage] = useState<File | null>(null);
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState("");

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const confirmCrop = async () => {
    if (!rawPic || !croppedAreaPixels || !cropTemplateImage) {
      setIsEditingPic(false);
      return;
    }

    try {
       const image = new window.Image();
       image.src = rawPic;
       await new Promise((resolve) => (image.onload = resolve));
       
       const canvas = document.createElement("canvas");
       canvas.width = croppedAreaPixels.width;
       canvas.height = croppedAreaPixels.height;
       const ctx = canvas.getContext("2d");
       
       if (ctx) {
         // Fill white background first to prevent transparent/black corners
         ctx.fillStyle = '#ffffff';
         ctx.fillRect(0, 0, canvas.width, canvas.height);

         ctx.drawImage(
           image,
           croppedAreaPixels.x,
           croppedAreaPixels.y,
           croppedAreaPixels.width,
           croppedAreaPixels.height,
           0,
           0,
           croppedAreaPixels.width,
           croppedAreaPixels.height
         );

         canvas.toBlob((blob) => {
           if (blob) {
             const file = new File([blob], cropTemplateImage.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: "image/jpeg" });
             handleChange('profilePhotoUrl', file);
             setIsEditingPic(false);
             setRawPic(null);
           }
         }, "image/jpeg", 0.92);
       }
    } catch (e) {
      console.error(e);
      setIsEditingPic(false);
    }
  };

  const steps = [
    { id: 1, label: "Personal Information" },
    { id: 2, label: "Identity Information" },
    { id: 3, label: "Work Details" },
    { id: 4, label: "Tax Details" },
    { id: 5, label: "Contact Information" },
    { id: 6, label: "Emergency Contact" },
    { id: 7, label: "Education" },
    { id: 8, label: "Certifications" },
    { id: 9, label: "Medical Information" },
    { id: 10, label: "Bank Details" },
  ];

  let nextId = 11;
  if (customFieldsConfig.length > 0) {
    steps.push({ id: nextId++, label: "Custom Details" });
  }
  steps.push({ id: nextId, label: "Review & Submit" });

  const lastStepId = steps[steps.length - 1]?.id ?? 10;
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const currentStepDef = currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;
  const stepHeading = currentStepDef?.label ?? "Employee Details";
  const progressPercent =
    currentStepIndex >= 0 ? Math.round(((currentStepIndex + 1) / steps.length) * 100) : 0;

  const [isDeptAlreadyAssigned, setIsDeptAlreadyAssigned] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Basic Details
    firstName: "", lastName: "", dob: "", gender: "", maritalStatus: "", nationality: "", profilePhotoUrl: "",
    linkedinUrl: "", instagramUrl: "",
    
    // Step 2: Identity
    identityType: "NRIC", // NRIC or FIN
    // NRIC
    nricNumber: "", nricResidentialStatus: "", cpfLinkedStatus: "", taxId: "", nricFrontUrl: "", nricBackUrl: "",
    // FIN
    finNumber: "", finPassportNumber: "", workPassType: "", workPassNumber: "", workPassIssueDate: "", workPassExpiryDate: "", finPassportExpiryDate: "", finIssuingCountry: "", finCardUrl: "", finPassportCopyUrl: "", workPassCopyUrl: "",
    
    empId: "", dateOfJoining: "", departmentId: "", role: "Employee", jobRole: "", jobType: "Full Time", contractEndDate: "",
    salary: "", salaryNotApplicable: false, shiftType: "Standard", overtimeApplicable: false, claimsApplicable: false, isActive: true,
    overtimeWorkingHours: "", overtimePeriod: "monthly", overtimeMaxLimit: "",
    monthlyTaxEstimate: undefined as string | undefined, shgContribution: "None", shgAmount: "", sdlApplicable: "Yes", foreignWorkerLevy: "",
    allowances: [{ name: "", amount: "" }],
    customCpfEmployee: undefined as string | undefined, customCpfEmployer: undefined as string | undefined, customSdl: undefined as string | undefined,
    customCpfEmployeeRate: undefined as string | undefined, customCpfEmployerRate: undefined as string | undefined, customSdlRate: undefined as string | undefined,
    customCdacRate: undefined as string | undefined, customSindaRate: undefined as string | undefined, customMbmfRate: undefined as string | undefined, customEcfRate: undefined as string | undefined, customIncomeTaxRate: undefined as string | undefined,
    assignedProjects: [] as string[],

    // Step 4: Contact (Singaporean: single block). Non-Singaporean: current SG + native home country.
    mobileCode: "+65", mobileNumber: "", personalEmail: "", residentialAddress: "", postalCode: "",
    currentMobileCode: "+65", currentMobileNumber: "", currentEmail: "", currentResidentialAddress: "", currentPostalCode: "",
    nativeMobileCode: "+86", nativeMobileNumber: "", nativeResidentialAddress: "", nativePostalCode: "",
    
    // Step 5: Emergency
    emergName: "", emergRelation: "", emergContactCode: "+65", emergContact: "", emergAddress: "",
    
    // Step 6: Education
    schoolingCountry: "", schoolingInstName: "", schoolingQual: "", schoolingGradYear: "", schoolingCertUrl: null,
    higherEduCountry: "", higherEduInstName: "", higherEduCourseName: "", higherEduCourseDuration: "", higherEduQual: "", higherEduGradYear: "", higherEduCertUrl: null,
    
    // Step 7: Certifications
    certifications: [{ certName: "", issuingOrg: "", certIssueDate: "", certExpiryDate: "", certNumber: "", certificationUrl: "" }],
    
    // Step 8: Medical
    bloodGroup: "", insuranceType: "", insurProvider: "", insurPolicyNum: "", insurPolicyStart: "", insurPolicyExpiry: "", insurCoverageAmt: "", insurPremiumAmt: "", insurPaymentFreq: "",
    empCovered: "", depsCovered: "", numDeps: "", spouseCoverage: "", childrenCoverage: "", parentsCoverage: "",
    
    // Step 9: Bank
    bankName: "", accountHolder: "", accountNum: "", bankCode: "", branchCode: "", salaryPaymentMode: "",
    onlinePaymentType: "", onlinePaymentId: "",
    
    // Step 10: Custom Details
    customDocuments: [],
    
    // Step 11: Review
    termsAccepted: false, privacyConsent: false, empDeclaration: false, digitalSignature: "", submitConfirmation: false
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (loading) return;
    if (formData.nationality === "Singaporean") {
      setFormData(prev => ({ 
        ...prev, 
        identityType: "NRIC",
        nricResidentialStatus: "Singapore Citizen"
      }));
    } else if (formData.nationality && formData.nationality !== "Singaporean") {
      setFormData(prev => ({ ...prev, identityType: "FIN" }));
    }
  }, [formData.nationality, loading]);

  useEffect(() => {
    if (formData.identityType === "NRIC") {
      const targetStatus = formData.nationality === "Singaporean" ? "Singapore Citizen" : "PR (Permanent Resident)";
      if (formData.nricResidentialStatus !== targetStatus) {
        setFormData(prev => ({ ...prev, nricResidentialStatus: targetStatus }));
      }
    } else {
      if (formData.nricResidentialStatus !== "") {
        setFormData(prev => ({ ...prev, nricResidentialStatus: "" }));
      }
    }
  }, [formData.identityType, formData.nationality, formData.nricResidentialStatus]);

  useEffect(() => {
    if (!formData.nationality || formData.nationality === "Singaporean") return;
    const dial = NATIONALITY_TO_DIAL[formData.nationality];
    if (!dial) return;
    setFormData((prev) => (prev.nativeMobileCode === dial ? prev : { ...prev, nativeMobileCode: dial }));
  }, [formData.nationality]);

  const handleCertChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newCerts = [...prev.certifications];
      newCerts[index] = { ...newCerts[index], [field]: value };
      return { ...prev, certifications: newCerts };
    });
  };

  const addCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, { certName: "", issuingOrg: "", certIssueDate: "", certExpiryDate: "", certNumber: "", certificationUrl: "" }]
    }));
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      setUserCompanyId(user.id);

      const { data: compSettings } = await supabase
        .from('company_settings')
        .select('custom_fields, custom_roles, attendance_config')
        .eq('company_id', user.id)
        .maybeSingle();
      if (compSettings) {
        if (compSettings.custom_fields) {
          setCustomFieldsConfig(compSettings.custom_fields);
        }
        if (compSettings.custom_roles) {
          setAvailableRoles(["Admin", "Sub Admin", "Employee", ...compSettings.custom_roles]);
        }
        if (compSettings.attendance_config?.projects) {
          setCompanyProjects(compSettings.attendance_config.projects);
        }
      }

      const { data: depts } = await supabase
        .from("departments")
        .select("id, name, designations")
        .eq("company_id", user.id)
        .order("name");
      if (depts) {
        setDepartments(depts);
      }

      const { data: empRes } = await supabase.from("employees").select("*").eq("id", employeeId).single();
      if (empRes) {
        const fullName = empRes.name || "";
        const nameParts = fullName.trim().split(/\s+/);
        const cf =
          empRes.custom_fields && typeof empRes.custom_fields === "object"
            ? (empRes.custom_fields as Record<string, unknown>)
            : {};

        setIsDeptAlreadyAssigned(!!empRes.department_id);

        // Parse mobile number
        let parsedMobileCode = "+65";
        let parsedMobileNumber = empRes.mobile || "";
        if (empRes.mobile && empRes.mobile.startsWith("+")) {
          const parts = empRes.mobile.split(" ");
          if (parts.length > 1) {
            parsedMobileCode = parts[0];
            parsedMobileNumber = parts.slice(1).join(" ");
          } else {
            const codes = ["+65", "+91", "+60", "+62", "+63", "+66", "+81", "+82", "+84", "+86", "+95", "+977", "+880"];
            for (const code of codes) {
              if (empRes.mobile.startsWith(code)) {
                parsedMobileCode = code;
                parsedMobileNumber = empRes.mobile.slice(code.length);
                break;
              }
            }
          }
        }

        // Parse emergency contact number
        let parsedEmergContactCode = "+65";
        let parsedEmergContact = empRes.emergency_contact_number || "";
        if (empRes.emergency_contact_number && empRes.emergency_contact_number.startsWith("+")) {
          const parts = empRes.emergency_contact_number.split(" ");
          if (parts.length > 1) {
            parsedEmergContactCode = parts[0];
            parsedEmergContact = parts.slice(1).join(" ");
          } else {
            const codes = ["+65", "+91", "+60", "+62", "+63", "+66", "+81", "+82", "+84", "+86", "+95", "+977", "+880"];
            for (const code of codes) {
              if (empRes.emergency_contact_number.startsWith(code)) {
                parsedEmergContactCode = code;
                parsedEmergContact = empRes.emergency_contact_number.slice(code.length);
                break;
              }
            }
          }
        }

        setFormData((prev) => {
          setOriginalAvatarUrl(empRes.avatar_url || "");
          const merged = {
            ...prev,

            // ── Step 1: Personal ──────────────────────────────────────────
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            gender: empRes.gender || "",
            dob: empRes.date_of_birth || "",
            nationality: empRes.nationality || "",
            maritalStatus: empRes.marital_status || "",
            linkedinUrl: empRes.linkedin_url || "",
            instagramUrl: empRes.instagram_url || "",
            personalEmail: empRes.personal_email || empRes.email || "",

            // ── Step 2: Identity ──────────────────────────────────────────
            identityType: empRes.identity_type || "NRIC",
            nricNumber: empRes.nric_number || "",
            nricResidentialStatus: empRes.residential_status || "",
            cpfLinkedStatus: empRes.cpf_number || "",
            taxId: empRes.tax_identification_number || "",
            nricFrontUrl: empRes.nric_front_url || "",
            nricBackUrl: empRes.nric_back_url || "",
            finNumber: empRes.fin_number || "",
            finPassportNumber: empRes.passport_number || "",
            finPassportExpiryDate: empRes.passport_expiry_date || "",
            finIssuingCountry: empRes.issuing_country || "",
            workPassType: empRes.work_pass_type || "",
            workPassNumber: empRes.work_pass_number || "",
            workPassIssueDate: empRes.work_pass_issue_date || "",
            workPassExpiryDate: empRes.work_pass_expiry_date || "",
            finCardUrl: empRes.fin_card_url || "",
            finPassportCopyUrl: empRes.passport_copy_url || "",

            // ── Step 3: Work Details ──────────────────────────────────────
            empId: empRes.emp_id || "",
            dateOfJoining: empRes.date_of_joining || "",
            departmentId: (depts && depts.some((d: any) => d.id === empRes.department_id)) ? empRes.department_id : "",
            role: empRes.role || "Employee",
            jobRole: (depts && depts.some((d: any) => d.id === empRes.department_id)) ? (empRes.job_role || "") : "",
            jobType: empRes.job_type || "Full Time",
            contractEndDate: cf.contract_end_date ? String(cf.contract_end_date) : "",
            salary: empRes.salary ? formatSalary(String(empRes.salary)) : "",
            salaryNotApplicable: cf.salaryNotApplicable ?? false,
            shiftType: empRes.shift_type || "Standard",
            overtimeApplicable: empRes.overtime_applicable ?? false,
            overtimeWorkingHours: empRes.overtime_working_hours ? String(empRes.overtime_working_hours) : "",
            overtimePeriod: empRes.overtime_period || "monthly",
            claimsApplicable: empRes.claims_applicable ?? false,
            isActive: empRes.is_active ?? true,
            assignedProjects: Array.isArray(cf.assignedProjects)
              ? cf.assignedProjects
              : (cf.current_project || cf.project_name
                  ? [String(cf.current_project || cf.project_name)]
                  : []),
            allowances: Array.isArray(cf.allowances) ? cf.allowances : [{ name: "", amount: "" }],

            // ── Step 4: Tax Details ───────────────────────────────────────
            monthlyTaxEstimate: empRes.monthly_tax_estimate != null ? String(empRes.monthly_tax_estimate) : undefined,
            shgContribution: empRes.shg_contribution || "None",
            shgAmount: empRes.shg_amount != null ? String(empRes.shg_amount) : "",
            foreignWorkerLevy: empRes.foreign_worker_levy != null ? String(empRes.foreign_worker_levy) : "",
            customCpfEmployee: empRes.custom_cpf_employee != null ? String(empRes.custom_cpf_employee) : undefined,
            customCpfEmployeeRate: empRes.custom_cpf_employee_rate != null ? String(empRes.custom_cpf_employee_rate) : undefined,
            customCpfEmployer: empRes.custom_cpf_employer != null ? String(empRes.custom_cpf_employer) : undefined,
            customCpfEmployerRate: empRes.custom_cpf_employer_rate != null ? String(empRes.custom_cpf_employer_rate) : undefined,
            customSdl: empRes.custom_sdl != null ? String(empRes.custom_sdl) : undefined,
            customSdlRate: empRes.custom_sdl_rate != null ? String(empRes.custom_sdl_rate) : undefined,
            customCdacRate: empRes.custom_cdac_rate != null ? String(empRes.custom_cdac_rate) : undefined,
            customSindaRate: empRes.custom_sinda_rate != null ? String(empRes.custom_sinda_rate) : undefined,
            customMbmfRate: empRes.custom_mbmf_rate != null ? String(empRes.custom_mbmf_rate) : undefined,
            customEcfRate: empRes.custom_ecf_rate != null ? String(empRes.custom_ecf_rate) : undefined,
            customIncomeTaxRate: empRes.custom_income_tax_rate != null ? String(empRes.custom_income_tax_rate) : undefined,

            // ── Step 5: Contact ───────────────────────────────────────────
            mobileNumber: parsedMobileNumber,
            mobileCode: parsedMobileCode,
            residentialAddress: empRes.address || "",
            postalCode: empRes.postal_code || "",
            currentResidentialAddress: empRes.current_address || "",
            currentPostalCode: empRes.current_postal_code || "",
            currentEmail: empRes.current_email || "",
            currentMobileNumber: empRes.current_mobile || "",
            currentMobileCode: empRes.current_mobile_code || "+65",
            nativeMobileNumber: empRes.native_mobile || "",
            nativeMobileCode: empRes.native_mobile_code || "",
            nativeResidentialAddress: empRes.native_address || "",
            nativePostalCode: empRes.native_postal_code || "",

            // ── Step 6: Emergency Contact ─────────────────────────────────
            emergName: empRes.emergency_contact_name || "",
            emergRelation: empRes.emergency_contact_relation || "",
            emergContactCode: parsedEmergContactCode,
            emergContact: parsedEmergContact,
            emergAddress: empRes.emergency_contact_address || "",

            // ── Step 7: Education ─────────────────────────────────────────
            higherEduCountry: empRes.higher_edu_country || "",
            higherEduInstName: empRes.higher_edu_inst_name || "",
            higherEduCourseName: empRes.higher_edu_course_name || "",
            higherEduCourseDuration: empRes.higher_edu_course_duration || "",
            higherEduQual: empRes.higher_edu_qual || "",
            higherEduGradYear: empRes.higher_edu_grad_year || "",
            higherEduCertUrl: empRes.higher_edu_cert_url || "",
            schoolingCountry: empRes.schooling_country || "",
            schoolingInstName: empRes.schooling_inst_name || "",
            schoolingQual: empRes.schooling_qual || "",
            schoolingGradYear: empRes.schooling_grad_year || "",
            schoolingCertUrl: empRes.schooling_cert_url || "",

            // ── Step 8: Certifications ────────────────────────────────────
            certifications: Array.isArray(empRes.certifications) && empRes.certifications.length > 0
              ? empRes.certifications
              : (Array.isArray(cf.certifications) && cf.certifications.length > 0
                  ? cf.certifications
                  : [{ certName: "", issuingOrg: "", certIssueDate: "", certExpiryDate: "", certNumber: "", certificationUrl: "" }]),

            // ── Step 9: Medical / Insurance ───────────────────────────────
            bloodGroup: empRes.blood_group || "",
            insuranceType: empRes.insurance_type || "",
            insurProvider: empRes.insurance_provider || "",
            insurPolicyNum: empRes.insurance_policy_number || "",
            insurPaymentFreq: empRes.insurance_payment_freq || "",
            insurPolicyStart: empRes.insurance_policy_start || "",
            insurPolicyExpiry: empRes.insurance_policy_expiry || "",
            insurCoverageAmt: empRes.insurance_coverage_amount != null ? String(empRes.insurance_coverage_amount) : "",
            insurPremiumAmt: empRes.insurance_premium_amount != null ? String(empRes.insurance_premium_amount) : "",
            empCovered: empRes.employee_covered || "",
            depsCovered: empRes.dependents_covered || "",
            numDeps: empRes.num_dependents != null ? String(empRes.num_dependents) : "",
            spouseCoverage: empRes.spouse_coverage || "",
            childrenCoverage: empRes.children_coverage || "",
            parentsCoverage: empRes.parents_coverage || "",

            // ── Step 10: Bank Details ─────────────────────────────────────
            bankName: empRes.bank_name || "",
            accountHolder: empRes.account_holder_name || (empRes.name || "").trim(),
            accountNum: empRes.account_number || "",
            bankCode: empRes.bank_code || "",
            branchCode: empRes.branch_code || "",
            salaryPaymentMode: empRes.salary_payment_mode || "",
            onlinePaymentType: empRes.online_payment_type || "",
            onlinePaymentId: empRes.online_payment_id || "",

            // ── Step 11: Company custom org fields (dynamic) ──────────────
            // Spread cf LAST so dedicated column values above always win,
            // but org-defined custom field keys (not in dedicated columns) load in.
            ...Object.fromEntries(
              Object.entries(cf).filter(([key]) => ![
                // exclude keys that now have dedicated columns
                'maritalStatus','linkedinUrl','instagramUrl','identityType',
                'overtimeWorkingHours','overtimePeriod','overtimeMaxLimit',
                'assignedProjects','allowances','certifications',
                'monthlyTaxEstimate','shgContribution','shgAmount','foreignWorkerLevy',
                'customCpfEmployee','customCpfEmployeeRate','customCpfEmployer','customCpfEmployerRate',
                'customSdl','customSdlRate','customCdacRate','customSindaRate','customMbmfRate','customEcfRate','customIncomeTaxRate',
                'nativeResidentialAddress','nativePostalCode',
                'higherEduCountry','higherEduInstName','higherEduCourseName','higherEduCourseDuration','higherEduQual','higherEduGradYear','higherEduCertUrl',
                'schoolingCountry','schoolingInstName','schoolingQual','schoolingGradYear','schoolingCertUrl',
                'insuranceType','insurProvider','insurPolicyNum','insurPaymentFreq','insurPolicyStart','insurPolicyExpiry',
                'insurCoverageAmt','insurPremiumAmt','empCovered','depsCovered','numDeps','spouseCoverage','childrenCoverage','parentsCoverage',
                'bankCode','branchCode','salaryPaymentMode','onlinePaymentType','onlinePaymentId',
              ].includes(key))
            ),
          };

          const nat = String((merged as { nationality?: string }).nationality || "");
          if (nat && nat !== "Singaporean") {
            const m = (merged as unknown) as typeof prev;
            const defaultNative = NATIONALITY_TO_DIAL[nat] || m.nativeMobileCode;
            return {
              ...m,
              currentResidentialAddress: m.currentResidentialAddress || m.residentialAddress || "",
              currentPostalCode: m.currentPostalCode || m.postalCode || "",
              currentEmail: m.currentEmail || m.personalEmail || "",
              currentMobileNumber: m.currentMobileNumber || m.mobileNumber || "",
              currentMobileCode: m.currentMobileCode || m.mobileCode || "+65",
              nativeMobileCode: m.nativeMobileCode || defaultNative || "+86",
            };
          }
          return (merged as unknown) as typeof prev;
        });
      }
      setLoading(false);
    }
    load();
  }, [employeeId, router, supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddCustomDesignation = async (deptId: string, newDesignation: string) => {
    // 1. Update local state
    setDepartments((prevDepts) => 
      prevDepts.map((d) => {
        if (d.id === deptId) {
          const existing = d.designations || [];
          if (!existing.includes(newDesignation)) {
            const updated = [...existing, newDesignation];
            // 2. Persist in database immediately
            supabase
              .from("departments")
              .update({ designations: updated })
              .eq("id", deptId)
              .then(({ error }: any) => {
                if (error) {
                  console.error("Failed to update department designations:", error);
                } else {
                  console.log("Successfully added designation to department:", newDesignation);
                }
              });
            return { ...d, designations: updated };
          }
        }
        return d;
      })
    );
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

  const uploadEmployeeFiles = async () => {
    const { data: compSettings } = await supabase.from('company_settings').select('company_name').eq('company_id', userCompanyId).single();
    const companySlug = toCompanySlug(compSettings?.company_name || 'default');
    const folderPath = `Company_Storage/${companySlug}/`;
    const empName = `${formData.firstName} ${formData.lastName}`.trim() || 'Employee';
    
    const uploadFile = async (file: any, category: string) => {
      // Skip if empty, already a string path, or not an actual browser File object
      if (!file || typeof file === 'string') return file;
      if (!(file instanceof File)) return typeof file === 'object' ? null : file;
      
      const ext = file.name?.split('.').pop() || 'tmp';
      const newName = `${userCompanyId}__${empName}__${category}.${ext}`;
      const fullPath = `${folderPath}${newName}`;
      
      const { error } = await supabase.storage.from('private_data').upload(fullPath, file, { upsert: true });
      if (error) {
        console.error("Upload error for", category, error);
        throw new Error(`Failed to upload ${category}: ${error.message}`);
      }
      return fullPath;
    };

    const uploadAvatar = async (file: any) => {
      if (!file || typeof file === 'string') return file;
      if (!(file instanceof File)) return typeof file === 'object' ? null : file;

      const avatarPath = `User_Avatar/${companySlug}/${employeeId}_profile.jpg`;

      const { error } = await supabase.storage.from('public_assets').upload(avatarPath, file, { upsert: true, contentType: 'image/jpeg' });
      if (error) {
        console.error("Upload error for User Avatar", error);
        throw new Error(`Failed to upload Profile Photo: ${error.message}`);
      }

      // Cleanup old avatar if it exists and has a different path
      if (originalAvatarUrl && originalAvatarUrl.includes("User_Avatar/")) {
        try {
          const urlObj = new URL(originalAvatarUrl);
          const parts = urlObj.pathname.split("public_assets/");
          if (parts.length > 1) {
            const oldPath = parts[1];
            if (oldPath !== avatarPath) {
              await supabase.storage.from("public_assets").remove([oldPath]);
            }
          }
        } catch (err) {
          console.error("Failed to delete old avatar", err);
        }
      }

      const { data: publicUrlData } = supabase.storage.from('public_assets').getPublicUrl(avatarPath);
      return `${publicUrlData.publicUrl}?t=${Date.now()}`;
    };

    const updatedData = { ...formData };
    
    updatedData.profilePhotoUrl = await uploadAvatar(updatedData.profilePhotoUrl);
    updatedData.nricFrontUrl = await uploadFile(updatedData.nricFrontUrl, "NRIC Front");
    updatedData.nricBackUrl = await uploadFile(updatedData.nricBackUrl, "NRIC Back");
    updatedData.finCardUrl = await uploadFile(updatedData.finCardUrl, "Work Pass Copy");
    updatedData.finPassportCopyUrl = await uploadFile(updatedData.finPassportCopyUrl, "Passport Copy");
    updatedData.schoolingCertUrl = await uploadFile(updatedData.schoolingCertUrl, "Schooling Certificate");
    updatedData.higherEduCertUrl = await uploadFile(updatedData.higherEduCertUrl, "Higher Education Certificate");
    
    if (Array.isArray(updatedData.certifications)) {
      const newCerts = await Promise.all(
        updatedData.certifications.map(async (cert: any, i: number) => {
          if (cert?.certificationUrl && cert.certificationUrl instanceof File) {
            return { ...cert, certificationUrl: await uploadFile(cert.certificationUrl, `Certification ${i+1}`) };
          }
          return cert;
        })
      );
      updatedData.certifications = newCerts;
    }
    
    return updatedData;
  };

  const buildEmployeePayload = (data: typeof formData) => {
    const isSG = data.nationality === "Singaporean";
    const primaryEmail = isSG ? data.personalEmail : data.currentEmail;
    const primaryMobile = isSG
      ? data.mobileNumber
      : [data.currentMobileCode, data.currentMobileNumber].filter(Boolean).join(" ").trim();
    const primaryAddress = isSG ? data.residentialAddress : data.currentResidentialAddress;
    
    const payload: any = {

      // ── Step 1: Personal ────────────────────────────────────────────────
      gender: data.gender || null,
      date_of_birth: data.dob || null,
      nationality: data.nationality || null,
      marital_status: data.maritalStatus || null,
      linkedin_url: data.linkedinUrl || null,
      instagram_url: data.instagramUrl || null,
      personal_email: data.personalEmail || null,
      avatar_url: data.profilePhotoUrl || null,

      // ── Step 2: Identity ─────────────────────────────────────────────────
      identity_type: data.identityType || null,
      nric_number: data.identityType === "NRIC" ? (data.nricNumber || null) : null,
      cpf_number: data.identityType === "NRIC" ? (data.cpfLinkedStatus || null) : null,
      tax_identification_number: data.identityType === "NRIC" ? (data.taxId || null) : null,
      residential_status: data.identityType === "NRIC" ? (data.nationality === "Singaporean" ? "Citizen" : "PR (Permanent Resident)") : null,
      nric_front_url: data.nricFrontUrl || null,
      nric_back_url: data.nricBackUrl || null,
      fin_number: data.identityType === "FIN" ? (data.finNumber || null) : null,
      passport_number: (data.identityType === "FIN" || data.identityType === "NRIC") ? (data.finPassportNumber || null) : null,
      passport_expiry_date: (data.identityType === "FIN" || data.identityType === "NRIC") ? (data.finPassportExpiryDate || null) : null,
      issuing_country: data.identityType === "FIN" ? (data.finIssuingCountry || null) : null,
      work_pass_type: data.identityType === "FIN" ? (data.workPassType || null) : null,
      work_pass_number: data.identityType === "FIN" ? (data.workPassNumber || null) : null,
      work_pass_issue_date: data.identityType === "FIN" ? (data.workPassIssueDate || null) : null,
      work_pass_expiry_date: data.identityType === "FIN" ? (data.workPassExpiryDate || null) : null,
      fin_card_url: data.finCardUrl || null,
      work_pass_copy_url: data.finCardUrl || null,
      passport_copy_url: data.finPassportCopyUrl || null,

      // ── Step 3: Work Details ──────────────────────────────────────────────
      emp_id: data.empId || null,
      date_of_joining: data.dateOfJoining || null,
      department_id: data.departmentId || null,
      role: data.role || null,
      job_role: data.jobRole || null,
      job_type: data.jobType || null,
      salary: data.salaryNotApplicable ? null : (data.salary ? data.salary.replace(/,/g, "") : null),
      shift_type: data.shiftType || null,
      overtime_applicable: data.overtimeApplicable ?? false,
      overtime_working_hours: data.overtimeWorkingHours ? parseFloat(data.overtimeWorkingHours) : null,
      overtime_period: data.overtimePeriod || null,
      claims_applicable: data.claimsApplicable ?? false,
      is_active: data.isActive ?? true,

      // ── Step 4: Tax Details ───────────────────────────────────────────────
      monthly_tax_estimate: data.monthlyTaxEstimate != null && data.monthlyTaxEstimate !== "" ? parseFloat(data.monthlyTaxEstimate) : null,
      shg_contribution: data.shgContribution || null,
      shg_amount: data.shgAmount && data.shgAmount !== "" ? parseFloat(String(data.shgAmount).replace(/,/g, "")) : null,
      foreign_worker_levy: data.foreignWorkerLevy && data.foreignWorkerLevy !== "" ? parseFloat(String(data.foreignWorkerLevy).replace(/,/g, "")) : null,
      custom_cpf_employee: data.customCpfEmployee != null && data.customCpfEmployee !== "" ? parseFloat(String(data.customCpfEmployee)) : null,
      custom_cpf_employee_rate: data.customCpfEmployeeRate != null && data.customCpfEmployeeRate !== "" ? parseFloat(String(data.customCpfEmployeeRate)) : null,
      custom_cpf_employer: data.customCpfEmployer != null && data.customCpfEmployer !== "" ? parseFloat(String(data.customCpfEmployer)) : null,
      custom_cpf_employer_rate: data.customCpfEmployerRate != null && data.customCpfEmployerRate !== "" ? parseFloat(String(data.customCpfEmployerRate)) : null,
      custom_sdl: data.customSdl != null && data.customSdl !== "" ? parseFloat(String(data.customSdl)) : null,
      custom_sdl_rate: data.customSdlRate != null && data.customSdlRate !== "" ? parseFloat(String(data.customSdlRate)) : null,
      custom_cdac_rate: data.customCdacRate != null && data.customCdacRate !== "" ? parseFloat(String(data.customCdacRate)) : null,
      custom_sinda_rate: data.customSindaRate != null && data.customSindaRate !== "" ? parseFloat(String(data.customSindaRate)) : null,
      custom_mbmf_rate: data.customMbmfRate != null && data.customMbmfRate !== "" ? parseFloat(String(data.customMbmfRate)) : null,
      custom_ecf_rate: data.customEcfRate != null && data.customEcfRate !== "" ? parseFloat(String(data.customEcfRate)) : null,
      custom_income_tax_rate: data.customIncomeTaxRate != null && data.customIncomeTaxRate !== "" ? parseFloat(String(data.customIncomeTaxRate)) : null,

      // ── Step 5: Contact ───────────────────────────────────────────────────
      mobile: primaryMobile || null,
      address: primaryAddress || null,
      postal_code: (isSG ? data.postalCode : null) || null,
      current_address: !isSG ? (data.currentResidentialAddress || null) : null,
      current_postal_code: !isSG ? (data.currentPostalCode || null) : null,
      current_email: !isSG ? (data.currentEmail || null) : null,
      current_mobile: !isSG ? (data.currentMobileNumber || null) : null,
      current_mobile_code: !isSG ? (data.currentMobileCode || null) : null,
      native_mobile: !isSG ? (data.nativeMobileNumber || null) : null,
      native_mobile_code: !isSG ? (data.nativeMobileCode || null) : null,
      native_address: !isSG ? (data.nativeResidentialAddress || null) : null,
      native_postal_code: !isSG ? (data.nativePostalCode || null) : null,

      // ── Step 6: Emergency Contact ─────────────────────────────────────────
      emergency_contact_name: data.emergName || null,
      emergency_contact_number: [data.emergContactCode, data.emergContact].filter(Boolean).join(" ").trim() || null,
      emergency_contact_relation: data.emergRelation || null,
      emergency_contact_address: data.emergAddress || null,

      // ── Step 7: Education ─────────────────────────────────────────────────
      higher_edu_country: data.higherEduCountry || null,
      higher_edu_inst_name: data.higherEduInstName || null,
      higher_edu_course_name: data.higherEduCourseName || null,
      higher_edu_course_duration: data.higherEduCourseDuration || null,
      higher_edu_qual: data.higherEduQual || null,
      higher_edu_grad_year: data.higherEduGradYear || null,
      higher_edu_cert_url: data.higherEduCertUrl || null,
      schooling_country: data.schoolingCountry || null,
      schooling_inst_name: data.schoolingInstName || null,
      schooling_qual: data.schoolingQual || null,
      schooling_grad_year: data.schoolingGradYear || null,
      schooling_cert_url: data.schoolingCertUrl || null,

      // ── Step 8: Certifications ────────────────────────────────────────────
      certifications: Array.isArray(data.certifications) ? data.certifications : [],

      // ── Step 9: Medical / Insurance ───────────────────────────────────────
      blood_group: data.bloodGroup || null,
      insurance_type: data.insuranceType || null,
      insurance_provider: data.insurProvider || null,
      insurance_policy_number: data.insurPolicyNum || null,
      insurance_payment_freq: data.insurPaymentFreq || null,
      insurance_policy_start: data.insurPolicyStart || null,
      insurance_policy_expiry: data.insurPolicyExpiry || null,
      insurance_coverage_amount: data.insurCoverageAmt && data.insurCoverageAmt !== "" ? parseFloat(String(data.insurCoverageAmt).replace(/,/g, "")) : null,
      insurance_premium_amount: data.insurPremiumAmt && data.insurPremiumAmt !== "" ? parseFloat(String(data.insurPremiumAmt).replace(/,/g, "")) : null,
      employee_covered: data.empCovered || null,
      dependents_covered: data.depsCovered || null,
      num_dependents: data.numDeps && data.numDeps !== "" ? parseInt(String(data.numDeps)) : null,
      spouse_coverage: data.spouseCoverage || null,
      children_coverage: data.childrenCoverage || null,
      parents_coverage: data.parentsCoverage || null,

      // ── Step 10: Bank Details ─────────────────────────────────────────────
      bank_name: data.bankName || null,
      account_holder_name: data.accountHolder || null,
      account_number: data.accountNum || null,
      bank_code: data.bankCode || null,
      branch_code: data.branchCode || null,
      salary_payment_mode: data.salaryPaymentMode || null,
      online_payment_type: data.onlinePaymentType || null,
      online_payment_id: data.onlinePaymentId || null,

      // ── custom_fields: arrays + company org custom fields ────────────────
      custom_fields: {
        assignedProjects: data.assignedProjects || [],
        allowances: data.allowances || [],
        salaryNotApplicable: data.salaryNotApplicable ?? false,
        contract_end_date: data.contractEndDate || null,
        project_name: data.assignedProjects && data.assignedProjects.length > 0 ? data.assignedProjects[0] : null,
        current_project: data.assignedProjects && data.assignedProjects.length > 0 ? data.assignedProjects[0] : null,
        // Step 11: save any org-defined custom field values (dynamic keys from company_settings)
        ...Object.fromEntries(
          customFieldsConfig.map((f: any) => [f.id, data[f.id as keyof typeof data] ?? null])
        ),
      },
    };

    const fullName = `${data.firstName} ${data.lastName}`.trim();
    if (fullName) {
      payload.name = fullName;
    }
    if (primaryEmail) {
      payload.email = primaryEmail;
    }

    return payload;
  };

  const persistEmployee = async (opts: { redirect?: boolean }) => {
    setSaving(true);
    setErrorProp("");
    try {
      const finalData = await uploadEmployeeFiles();
      setFormData(finalData); // update state so it shows up correctly afterwards

      if (finalData.dob) {
        const age = getAge(finalData.dob);
        if (age < 16) {
          throw new Error("Employee must be at least 16 years of age.");
        }
      }

      if (finalData.finPassportExpiryDate) {
        const expDate = new Date(finalData.finPassportExpiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (expDate < today) {
          throw new Error("Passport has expired. Please provide a valid Passport Expiry Date.");
        }
      }

      if (finalData.workPassExpiryDate) {
        const expDate = new Date(finalData.workPassExpiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (expDate < today) {
          throw new Error("Work Pass has expired. Please provide a valid Work Pass Expiry Date.");
        }
      }

      if (finalData.empId && finalData.empId.trim()) {
        const { data: existingEmpId } = await supabase
          .from("employees")
          .select("id")
          .eq("emp_id", finalData.empId.trim())
          .neq("id", employeeId)
          .maybeSingle();

        if (existingEmpId) {
          throw new Error("Employee ID is already in use by another employee. Please enter a unique Employee ID.");
        }
      }

      const payload = buildEmployeePayload(finalData);

      // 1. Single Admin check: a department can only have one Admin
      if (payload.role === "Admin" && payload.department_id) {
        const { data: deptAdmins } = await supabase
          .from("employees")
          .select("id, name")
          .eq("department_id", payload.department_id)
          .eq("role", "Admin")
          .neq("id", employeeId);
        if (deptAdmins && deptAdmins.length > 0) {
          throw new Error(`This department already has an Admin (Department Head: ${deptAdmins[0].name}). A department can only have one Admin.`);
        }
      }

      // 2. Sub Admin count check: max 3 per department
      if (payload.role === "Sub Admin" && payload.department_id) {
        const { count } = await supabase
          .from("employees")
          .select("id", { count: "exact", head: true })
          .eq("department_id", payload.department_id)
          .eq("role", "Sub Admin")
          .neq("id", employeeId);
        if (count !== null && count >= 3) {
          throw new Error("A department can have a maximum of 3 Sub Admins. This department already has 3 Sub Admins.");
        }
      }

      const { error } = await supabase.from("employees").update(payload).eq("id", employeeId);
      if (error) throw error;
      if (opts.redirect) {
        router.push("/employees");
        router.refresh();
      }
    } catch (e: any) {
      console.error("Save error details:", e);
      const msg = e?.message || "Failed to save profile.";
      setErrorProp(msg);
    } finally {
      setSaving(false);
    }
  };

  const validateCurrentStep = (): boolean => {
    setErrorProp("");
    
    if (currentStep === 1) {
      if (!formData.firstName.trim()) {
        setErrorProp("First Name is required.");
        return false;
      }
      if (!formData.lastName.trim()) {
        setErrorProp("Last Name is required.");
        return false;
      }
      if (!formData.dob) {
        setErrorProp("Date of Birth is required.");
        return false;
      }
      const age = getAge(formData.dob);
      if (age < 16) {
        setErrorProp("Employee must be at least 16 years of age.");
        return false;
      }
      if (!formData.gender) {
        setErrorProp("Gender is required.");
        return false;
      }
      if (!formData.maritalStatus) {
        setErrorProp("Marital Status is required.");
        return false;
      }
      if (!formData.nationality) {
        setErrorProp("Nationality is required.");
        return false;
      }
    }
    
    if (currentStep === 2) {
      if (formData.identityType === "NRIC") {
        if (!formData.nricNumber.trim()) {
          setErrorProp("NRIC Number is required.");
          return false;
        }
      } else {
        const fin = formData.finNumber.trim().toUpperCase();
        if (!fin) {
          setErrorProp("FIN Number is required.");
          return false;
        }
        if (fin.length !== 9) {
          setErrorProp("FIN Number must be exactly 9 characters.");
          return false;
        }
        const prefix = fin[0];
        if (prefix !== 'F' && prefix !== 'G' && prefix !== 'M') {
          setErrorProp("FIN Number must start with F, G, or M.");
          return false;
        }
        const digits = fin.slice(1, 8);
        if (!/^\d{7}$/.test(digits)) {
          setErrorProp("FIN Number must contain exactly 7 digits after the prefix.");
          return false;
        }
        const checksum = fin[8];
        if (!/^[A-Z]$/.test(checksum)) {
          setErrorProp("FIN Number must end with a checksum letter.");
          return false;
        }
        if (!formData.finPassportNumber.trim()) {
          setErrorProp("Passport Number is required.");
          return false;
        }
        if (formData.finPassportExpiryDate) {
          const expDate = new Date(formData.finPassportExpiryDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (expDate < today) {
            setErrorProp("Passport has expired. Please provide a valid Passport Expiry Date.");
            return false;
          }
        }
        if (formData.workPassExpiryDate) {
          const expDate = new Date(formData.workPassExpiryDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (expDate < today) {
            setErrorProp("Work Pass has expired. Please provide a valid Work Pass Expiry Date.");
            return false;
          }
        }
      }
    }
    
    if (currentStep === 3) {
      if (!formData.salaryNotApplicable) {
        const salaryNum = parseFloat(formData.salary.replace(/,/g, ""));
        if (!formData.salary || isNaN(salaryNum) || salaryNum <= 0) {
          setErrorProp("Salary is required and must be greater than 0.");
          return false;
        }
      }
      if (["Contract", "Internship", "Temporary"].includes(formData.jobType)) {
        if (!formData.contractEndDate) {
          setErrorProp("Contract / Internship / Temporary End Date is required.");
          return false;
        }
      }
    }
    
    if (currentStep === 5) {
      const isSG = formData.nationality === "Singaporean";
      if (isSG) {
        if (!formData.mobileNumber.trim()) {
          setErrorProp("Mobile Number is required.");
          return false;
        }
        if (!formData.residentialAddress.trim()) {
          setErrorProp("Residential Address is required.");
          return false;
        }
        if (!formData.postalCode.trim() || formData.postalCode.length !== 6) {
          setErrorProp("Postal Code must be a 6-digit number.");
          return false;
        }
      } else {
        if (!formData.currentMobileNumber.trim()) {
          setErrorProp("Singapore Mobile Number is required.");
          return false;
        }
        if (!formData.currentEmail.trim()) {
          setErrorProp("Singapore Email Address is required.");
          return false;
        }
        if (!formData.currentResidentialAddress.trim()) {
          setErrorProp("Singapore Residential Address is required.");
          return false;
        }
        if (!formData.currentPostalCode.trim() || formData.currentPostalCode.length !== 6) {
          setErrorProp("Singapore Postal Code must be a 6-digit number.");
          return false;
        }
      }
    }
    
    if (currentStep === 6) {
      if (!formData.emergName.trim()) {
        setErrorProp("Emergency Contact Name is required.");
        return false;
      }
      if (!formData.emergRelation) {
        setErrorProp("Emergency Contact Relationship is required.");
        return false;
      }
      if (!formData.emergContact.trim()) {
        setErrorProp("Secondary Emergency Contact Number is required.");
        return false;
      }
      if (!formData.emergAddress.trim()) {
        setErrorProp("Emergency Contact Address is required.");
        return false;
      }
    }
    
    if (currentStep === 8) {
      for (let idx = 0; idx < formData.certifications.length; idx++) {
        const cert = formData.certifications[idx];
        if (cert.certName.trim() && !cert.issuingOrg.trim()) {
          setErrorProp(`Certification #${idx + 1} Issuing Organization is required.`);
          return false;
        }
      }
    }


    
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    const i = steps.findIndex((s) => s.id === currentStep);
    if (i >= 0 && i < steps.length - 1) setCurrentStep(steps[i + 1].id);
  };

  const handlePrev = () => {
    const i = steps.findIndex((s) => s.id === currentStep);
    if (i > 0) setCurrentStep(steps[i - 1].id);
  };

  const handleSubmitProfile = async () => {
    if (currentStep !== lastStepId) {
      handleNext();
      return;
    }
    if (!formData.termsAccepted) {
      setErrorProp("You must accept the terms, conditions & privacy consent.");
      return;
    }
    if (!formData.digitalSignature.trim()) {
      setErrorProp("Please type your full name as digital signature.");
      return;
    }
    await persistEmployee({ redirect: true });
  };

  if (loading) return <div className="flex-1 min-h-full flex items-center justify-center bg-[#F9F9FB]"><div className="h-8 w-8 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" /></div>;

  const getAge = (dobString: string) => {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const getCalculatedTax = () => {
    let salaryNum = parseFloat((formData.salary || "0").replace(/,/g, ''));
    let sdl = Math.max(2, Math.min(11.25, salaryNum * 0.0025));

    if (formData.identityType === "FIN" || !formData.identityType) {
      return { cpfEmployee: 0, cpfEmployer: 0, sdl };
    }

    let age = getAge(formData.dob);
    let cappedSalary = Math.min(salaryNum, 6800);
    
    let empRate = 0;
    let employerRate = 0;

    if (age <= 55) {
      empRate = 0.20; employerRate = 0.17;
    } else if (age <= 60) {
      empRate = 0.105; employerRate = 0.145;
    } else if (age <= 65) {
      empRate = 0.075; employerRate = 0.11;
    } else if (age <= 70) {
      empRate = 0.05; employerRate = 0.085;
    } else {
      empRate = 0.05; employerRate = 0.075;
    }

    return {
      cpfEmployee: cappedSalary * empRate,
      cpfEmployer: cappedSalary * employerRate,
      sdl
    };
  };

  const calculatedTax = getCalculatedTax();
  const displayCpfEmployee = formData.customCpfEmployee !== "" && formData.customCpfEmployee !== undefined ? parseFloat(formData.customCpfEmployee ?? "0") || 0 : calculatedTax.cpfEmployee;
  const displayCpfEmployer = formData.customCpfEmployer !== "" && formData.customCpfEmployer !== undefined ? parseFloat(formData.customCpfEmployer ?? "0") || 0 : calculatedTax.cpfEmployer;
  const displaySdl = formData.customSdl !== "" && formData.customSdl !== undefined ? parseFloat(formData.customSdl ?? "0") || 0 : calculatedTax.sdl;

  const grossSalaryNum = parseFloat((formData.salary || "0").replace(/,/g, ''));
  const cappedCpfSalaryNum = Math.min(grossSalaryNum, 6800);

  const displayCpfEmployeeRate = formData.customCpfEmployeeRate !== undefined 
    ? formData.customCpfEmployeeRate 
    : (cappedCpfSalaryNum > 0 ? ((displayCpfEmployee / cappedCpfSalaryNum) * 100).toFixed(2) : "0.00");

  const displayCpfEmployerRate = formData.customCpfEmployerRate !== undefined 
    ? formData.customCpfEmployerRate 
    : (cappedCpfSalaryNum > 0 ? ((displayCpfEmployer / cappedCpfSalaryNum) * 100).toFixed(2) : "0.00");

  const displaySdlRate = formData.customSdlRate !== undefined
    ? formData.customSdlRate
    : (grossSalaryNum > 0 ? ((displaySdl / grossSalaryNum) * 100).toFixed(2) : "0.00");

  const displayCdacRate = formData.customCdacRate !== undefined
    ? formData.customCdacRate
    : (grossSalaryNum > 0 && formData.shgContribution === "CDAC" ? ((parseFloat(formData.shgAmount) || 0) / grossSalaryNum * 100).toFixed(2) : "0.00");

  const displaySindaRate = formData.customSindaRate !== undefined
    ? formData.customSindaRate
    : (grossSalaryNum > 0 && formData.shgContribution === "SINDA" ? ((parseFloat(formData.shgAmount) || 0) / grossSalaryNum * 100).toFixed(2) : "0.00");

  const displayMbmfRate = formData.customMbmfRate !== undefined
    ? formData.customMbmfRate
    : (grossSalaryNum > 0 && formData.shgContribution === "MBMF" ? ((parseFloat(formData.shgAmount) || 0) / grossSalaryNum * 100).toFixed(2) : "0.00");

  const displayEcfRate = formData.customEcfRate !== undefined
    ? formData.customEcfRate
    : (grossSalaryNum > 0 && formData.shgContribution === "ECF" ? ((parseFloat(formData.shgAmount) || 0) / grossSalaryNum * 100).toFixed(2) : "0.00");

  const displayIncomeTaxRate = formData.customIncomeTaxRate !== undefined
    ? formData.customIncomeTaxRate
    : (grossSalaryNum > 0 ? ((parseFloat(formData.monthlyTaxEstimate ?? "0") || 0) / grossSalaryNum * 100).toFixed(2) : "0.00");

  return (
    <div className="flex h-full w-full bg-white text-gray-900 overflow-hidden relative z-[100] rounded-tl-[24px] rounded-bl-[24px]">
      {/* Left Sidebar (Stepper) */}
      <div className="w-[300px] shrink-0 border-r border-[#E5E5EA] bg-white flex flex-col pt-8 pb-6 h-full relative z-10 overflow-y-auto page-scrollbar">
        <div className="px-6 mb-8">
          <button onClick={() => router.push("/employees")} className="flex items-center gap-2 text-[12px] font-bold text-gray-500 hover:text-gray-900 transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Directory
          </button>
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Onboarding</p>
          <h1 className="text-[20px] font-bold leading-tight mb-2 text-[#1C1C1E]">Employee Details</h1>
          <p className="text-[12px] text-gray-500 leading-relaxed font-medium pr-2">
            Please provide accurate information for your employee profile.
          </p>
        </div>

        <div className="flex-1 px-4 flex flex-col gap-1 relative">
          {steps.map((step, idx) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
              <div key={step.id} className="relative group">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-[12px] transition-all relative z-10
                    ${isActive ? "bg-[#EEF4FF] text-[#007AFF]" : "text-gray-500 hover:bg-gray-50"}`}
                >
                  <div className={`h-[22px] w-[22px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors
                    ${isActive ? "bg-[#007AFF] text-white" : isCompleted ? "bg-[#34C759] text-white" : "bg-[#F2F2F7] text-[#8E8E93] group-hover:bg-[#E5E5EA]"}`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : step.id}
                  </div>
                  <span className={`text-[13px] truncate ${isActive ? "font-bold" : "font-medium"}`}>
                    {step.label}
                  </span>
                </button>
                {idx < steps.length - 1 && (
                  <div className={`absolute left-[23px] top-[34px] bottom-[-10px] w-[2px] z-0 pointer-events-none transition-colors ${isCompleted ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Progress */}
        <div className="mt-8 px-6 pb-2">
          <div className="border border-[#E5E5EA] rounded-[12px] p-4 bg-white">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-bold text-gray-700">Onboarding Progress</span>
              <span className="text-[11px] font-bold text-[#1C1C1E]">{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#F2F2F7] rounded-full overflow-hidden">
              <div className="h-full bg-[#007AFF] rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col bg-[#F9F9FB] relative min-w-0 h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto page-scrollbar px-8 py-8 pb-[100px]">
          
          <div className="flex items-center justify-between mb-8 max-w-[1000px] mx-auto w-full">
            <div>
              <h2 className="text-[22px] font-bold text-gray-900 mb-1">{stepHeading}</h2>
              <p className="text-[13px] text-gray-500 font-medium">
                {currentStep === 1 && "Let's start with your basic personal details."}
                {currentStep !== 1 && "Please enter accurate details to maintain platform integrity."}
              </p>
            </div>
            <button onClick={() => persistEmployee({ redirect: false })} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[#007AFF] text-[#007AFF] text-[13px] font-bold hover:bg-[#EEF4FF] transition-colors bg-white disabled:opacity-50">
              <Save className="h-4 w-4" strokeWidth={2.5} />
              Save Draft
            </button>
          </div>

          <div className="flex flex-col gap-6 max-w-[1000px] mx-auto w-full">
            {errorProp && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">{errorProp}</div>}

            {/* --- STEP 1: Personal Information (Basic Details) --- */}
            {currentStep === 1 && (
              <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-8">
                <h4 className="text-[14px] font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100 font-semibold text-gray-500">Profile Picture</h4>
                <div className="flex items-center gap-6 mb-8">
                  {/* Circular Avatar Display */}
                  <div className="relative group h-20 w-20 rounded-[18px] border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden bg-gray-50">
                    {formData.profilePhotoUrl ? (
                      <img 
                        src={typeof formData.profilePhotoUrl === "string" ? formData.profilePhotoUrl : URL.createObjectURL(formData.profilePhotoUrl as any)} 
                        alt="Profile Preview" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-gray-400 font-bold text-[24px] lowercase">
                        {getEmpInitials(`${formData.firstName} ${formData.lastName}`)}
                      </span>
                    )}
                  </div>
                  {/* File Input */}
                  <div className="flex flex-col gap-2">
                    <input 
                      type="file" 
                      id="profile-pic-input" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCropTemplateImage(file);
                          setRawPic(URL.createObjectURL(file));
                          setPicZoom(1);
                          setCrop({ x: 0, y: 0 });
                          setIsEditingPic(true);
                        }
                        e.target.value = "";
                      }} 
                    />
                    <button 
                      type="button"
                      onClick={() => document.getElementById('profile-pic-input')?.click()}
                      className="px-4 py-2 border border-gray-300 rounded-[8px] text-[13px] font-bold hover:bg-gray-50 transition-colors bg-white text-gray-700"
                    >
                      Choose Image
                    </button>
                    <p className="text-[11px] text-[#8E8E93] font-medium">Supported formats: JPG, PNG, WEBP. Max size: 5MB.</p>
                  </div>
                </div>

                <SectionHeader title="Basic Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex flex-col">
                    <Label required>First Name</Label>
                    <input type="text" value={formData.firstName} onChange={e => handleChange('firstName', e.target.value)} placeholder="Enter First Name" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                  </div>
                  <div className="flex flex-col">
                    <Label required>Last Name / Surname</Label>
                    <input type="text" value={formData.lastName} onChange={e => handleChange('lastName', e.target.value)} placeholder="Enter Last Name" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="flex flex-col">
                    <Label required>Date of Birth</Label>
                    <DateInput value={formData.dob} onChange={(v: string) => handleChange('dob', v)} />
                  </div>
                  <div className="flex flex-col">
                    <Label required>Gender</Label>
                    <CustomSelect value={formData.gender} onChange={(v: string) => handleChange('gender', v)} options={['Male', 'Female', 'Other']} placeholder="Select Gender" />
                  </div>
                  <div className="flex flex-col">
                    <Label required>Marital Status</Label>
                    <CustomSelect value={formData.maritalStatus} onChange={(v: string) => handleChange('maritalStatus', v)} options={['Single', 'Married', 'Divorced', 'Widowed']} placeholder="Select Status" />
                  </div>
                  <div className="flex flex-col">
                    <Label required>Nationality</Label>
                    <NationalitySearchSelect value={formData.nationality} onChange={(v: string) => { handleChange('nationality', v); const country = getCountryFromNationality(v); if (country) { handleChange('finIssuingCountry', country); } }} placeholder="Select Nationality" />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <SectionHeader title="Social Profiles" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <Label>LinkedIn Profile URL</Label>
                      <input 
                        type="url" 
                        value={formData.linkedinUrl || ""} 
                        onChange={e => handleChange('linkedinUrl', e.target.value)} 
                        placeholder="https://linkedin.com/in/username" 
                        className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" 
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label>Instagram Profile URL</Label>
                      <input 
                        type="url" 
                        value={formData.instagramUrl || ""} 
                        onChange={e => handleChange('instagramUrl', e.target.value)} 
                        placeholder="https://instagram.com/username" 
                        className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- STEP 2: Identity Information --- */}
            {currentStep === 2 && (
              <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-8">
                <SectionHeader title="Identity Information" />
                
                <div className="flex items-center gap-6 mb-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="identityType" value="NRIC" checked={formData.identityType === "NRIC"} onChange={(e) => handleChange("identityType", e.target.value)} className="w-4 h-4 text-[#007AFF] focus:ring-[#007AFF]" />
                    <span className="text-[13px] font-bold text-gray-900">NRIC Holder (Singapore Citizen / PR)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="identityType" value="FIN" checked={formData.identityType === "FIN"} onChange={(e) => handleChange("identityType", e.target.value)} className="w-4 h-4 text-[#007AFF] focus:ring-[#007AFF]" />
                    <span className="text-[13px] font-bold text-gray-900">FIN Holder (Foreign Employee)</span>
                  </label>
                </div>

                {formData.identityType === "NRIC" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <Label required>NRIC Number</Label>
                      <input type="text" value={formData.nricNumber} onChange={e => handleChange('nricNumber', e.target.value)} placeholder="Enter NRIC Number" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                    </div>
                    <div className="flex flex-col">
                      <Label>Tax Identification (if required)</Label>
                      <input type="text" value={formData.taxId} onChange={e => handleChange('taxId', e.target.value)} className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                    </div>
                    <div className="flex flex-col">
                      <Label>Passport Number</Label>
                      <input 
                        type="text" 
                        value={formData.finPassportNumber} 
                        onChange={e => {
                          const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                          handleChange('finPassportNumber', val);
                        }} 
                        placeholder="Enter Passport Number" 
                        className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" 
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label>Passport Expiry Date</Label>
                      <DateInput value={formData.finPassportExpiryDate} onChange={(v: string) => handleChange('finPassportExpiryDate', v)} />
                    </div>
                    <div className="flex flex-col">
                      <Label>NRIC Front Upload</Label>
                      <FileUpload 
                        value={formData.nricFrontUrl} 
                        onChange={(file: File) => handleChange('nricFrontUrl', file)} 
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label>NRIC Back Upload</Label>
                      <FileUpload 
                        value={formData.nricBackUrl} 
                        onChange={(file: File) => handleChange('nricBackUrl', file)} 
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label>Passport Copy</Label>
                      <FileUpload 
                        value={formData.finPassportCopyUrl} 
                        onChange={(file: File) => handleChange('finPassportCopyUrl', file)} 
                        label="Passport Copy"
                      />
                    </div>
                  </div>
                )}

                {formData.identityType === "FIN" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <Label required>FIN Number</Label>
                      <input 
                        type="text" 
                        value={formData.finNumber} 
                        onChange={e => {
                          const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 9);
                          handleChange('finNumber', val);
                        }} 
                        placeholder="Enter FIN Number" 
                        maxLength={9}
                        className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" 
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label required>Passport Number</Label>
                      <input 
                        type="text" 
                        value={formData.finPassportNumber} 
                        onChange={e => {
                          const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                          handleChange('finPassportNumber', val);
                        }} 
                        placeholder="Enter Passport Number" 
                        className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" 
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label>Passport Expiry Date</Label>
                      <DateInput value={formData.finPassportExpiryDate} onChange={(v: string) => handleChange('finPassportExpiryDate', v)} />
                    </div>
                    <div className="flex flex-col">
                      <Label>Issuing Country</Label>
                      <CountrySearchSelect value={formData.finIssuingCountry} onChange={(v: string) => handleChange('finIssuingCountry', v)} placeholder="Select Issuing Country" />
                    </div>
                    <div className="flex flex-col">
                      <Label>Work Pass Type</Label>
                      <CustomSelect value={formData.workPassType} onChange={(v: string) => handleChange('workPassType', v)} options={['Employment Pass (EP)', 'S Pass', 'Work Permit', 'Dependant Pass', 'LTVP']} />
                    </div>
                    <div className="flex flex-col">
                      <Label>Work Pass Number</Label>
                      <input type="text" value={formData.workPassNumber} onChange={e => handleChange('workPassNumber', e.target.value)} placeholder="Enter Work Pass Number" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                    </div>
                    <div className="flex flex-col">
                      <Label>Work Pass Issue Date</Label>
                      <DateInput value={formData.workPassIssueDate} onChange={(v: string) => handleChange('workPassIssueDate', v)} />
                    </div>
                    <div className="flex flex-col">
                      <Label>Work Pass Expiry Date</Label>
                      <DateInput value={formData.workPassExpiryDate} onChange={(v: string) => handleChange('workPassExpiryDate', v)} />
                    </div>
                    <div className="flex flex-col">
                      <Label>Work Pass Copy</Label>
                      <FileUpload 
                        value={formData.finCardUrl} 
                        onChange={(file: File) => handleChange('finCardUrl', file)} 
                        label="Work Pass Copy"
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label>Passport Copy</Label>
                      <FileUpload 
                        value={formData.finPassportCopyUrl} 
                        onChange={(file: File) => handleChange('finPassportCopyUrl', file)} 
                        label="Passport Copy"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- STEP 3: Work Details --- */}
            {currentStep === 3 && (
              <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-8">
                <SectionHeader title="Work Details" />
                
                <h4 className="text-[14px] font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Official Identifiers</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex flex-col">
                    <Label>Employee ID</Label>
                    <input 
                      type="text" 
                      value={formData.empId} 
                      onChange={e => handleChange('empId', e.target.value)} 
                      placeholder="Enter Employee ID" 
                      className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" 
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label>Date of Joining</Label>
                    <DateInput value={formData.dateOfJoining} onChange={(v: string) => handleChange('dateOfJoining', v)} />
                  </div>
                  {isDeptAlreadyAssigned ? (
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                      <div className="bg-[#F8F9FA] dark:bg-[#1C1C22]/50 border border-[#E5E5EA] dark:border-[#2C2C35] rounded-[20px] p-6 relative flex flex-col justify-between col-span-1 md:col-span-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[18px]">🏢</span>
                              <span className="text-[13px] font-bold text-gray-800 dark:text-white uppercase tracking-wider">Role & Department Assignment</span>
                            </div>
                            <p className="text-[13px] text-gray-500 dark:text-gray-400">
                              To change the employee's Department or Designation, please manage them through the <a href="/departments" className="text-blue-600 hover:underline">Departments</a> page.
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="flex flex-col">
                            <Label>Assigned Department</Label>
                            <div className="h-11 px-3 w-full bg-gray-50 dark:bg-[#1C1C22] border border-gray-200 dark:border-[#2C2C35] rounded-[8px] flex items-center text-[13px] font-medium text-gray-500 cursor-not-allowed">
                              {departments.find((d: any) => String(d.id) === String(formData.departmentId))?.name || "Department"}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <Label>App Role</Label>
                            <CustomSelect 
                              value={formData.role} 
                              onChange={(v: string) => handleChange('role', v)} 
                              options={availableRoles} 
                              placeholder="Select Role" 
                            />
                          </div>
                          <div className="flex flex-col">
                            <Label>Designation</Label>
                            <div className="h-11 px-3 w-full bg-gray-50 dark:bg-[#1C1C22] border border-gray-200 dark:border-[#2C2C35] rounded-[8px] flex items-center text-[13px] font-medium text-gray-500 cursor-not-allowed">
                              {formData.jobRole || "Not Assigned"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col">
                        <Label>Department</Label>
                        <CustomSelect 
                          value={formData.departmentId} 
                          onChange={(v: string) => {
                            handleChange('departmentId', v);
                            handleChange('jobRole', ''); 
                          }} 
                          options={departments.filter((d: any) => d.name !== "Admin Department" || String(d.id) === String(formData.departmentId)).map((d: any) => ({ value: String(d.id), label: d.name }))}
                          placeholder="Select Department" 
                        />
                      </div>
                      <div className="flex flex-col">
                        <Label>App Role</Label>
                        <CustomSelect 
                          value={formData.role} 
                          onChange={(v: string) => handleChange('role', v)} 
                          options={availableRoles} 
                          placeholder="Select Role" 
                        />
                      </div>
                      <div className="flex flex-col">
                        <Label>Designation</Label>
                        <DesignationSelect 
                          value={formData.jobRole} 
                          onChange={(v: string) => handleChange('jobRole', v)} 
                          departmentId={formData.departmentId}
                          departments={departments}
                          onAddCustomDesignation={handleAddCustomDesignation}
                        />
                      </div>
                    </>
                  )}
                  <div className="flex flex-col">
                    <Label>Employment Type</Label>
                    <CustomSelect 
                      value={formData.jobType} 
                      onChange={(v: string) => handleChange('jobType', v)} 
                      options={['Full Time', 'Part Time', 'Contract', 'Internship', 'Temporary']} 
                      placeholder="Select Job Type" 
                    />
                  </div>
                  {["Contract", "Internship", "Temporary"].includes(formData.jobType) && (
                    <div className="flex flex-col">
                      <Label required>End Date</Label>
                      <DateInput 
                        value={formData.contractEndDate} 
                        onChange={(v: string) => handleChange('contractEndDate', v)} 
                      />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <Label>Active Status</Label>
                    <CustomSelect 
                      value={formData.isActive ? "Active" : "Inactive"} 
                      onChange={(v: string) => handleChange('isActive', v === "Active")} 
                      options={['Active', 'Inactive']} 
                      placeholder="Select Status" 
                    />
                  </div>
                </div>

                <h4 className="text-[14px] font-bold text-gray-800 mt-8 mb-4 pb-2 border-b border-gray-100">Operational Tracking</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <Label required={!formData.salaryNotApplicable}>Salary</Label>
                      <span className="text-[11px] font-medium text-[#8E8E93] mb-1.5">(for Month)</span>
                    </div>
                    <div className="relative flex items-center mb-2">
                      <span className="absolute left-3 text-[13px] font-semibold text-gray-500">S$</span>
                      <input 
                        type="text" 
                        value={formData.salary} 
                        onChange={e => handleChange('salary', formatSalary(e.target.value))} 
                        placeholder="0.00" 
                        disabled={formData.salaryNotApplicable}
                        className={`h-11 pl-8 pr-3 w-full border border-[#E5E5EA] rounded-[8px] text-[13px] font-semibold outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] ${formData.salaryNotApplicable ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-900'}`}
                      />
                    </div>
                    <label className="flex items-start gap-2 cursor-pointer mt-1 group">
                      <div className="relative flex items-center justify-center mt-0.5">
                        <input 
                          type="checkbox" 
                          checked={formData.salaryNotApplicable} 
                          onChange={e => handleChange('salaryNotApplicable', e.target.checked)} 
                          className="peer appearance-none w-4 h-4 rounded border border-[#C7C7CC] checked:bg-[#007AFF] checked:border-[#007AFF] transition-colors cursor-pointer"
                        />
                        <Check size={12} strokeWidth={3} className="text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-gray-800 group-hover:text-gray-900">Not Applicable</span>
                        <span className="text-[11px] text-gray-500 leading-tight mt-0.5">Convert into professional (in case of your friend or others who doesn't work in your company; option used for project team)</span>
                      </div>
                    </label>
                  </div>
                  <div className="flex flex-col">
                    <Label>Shift Protocol</Label>
                    <CustomSelect 
                      value={formData.shiftType} 
                      onChange={(v: string) => handleChange('shiftType', v)} 
                      options={['Standard', 'Morning Shift', 'Night Shift', 'Flexible']} 
                      placeholder="Select Shift" 
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label>Overtime</Label>
                    <CustomSelect 
                      value={formData.overtimeApplicable ? "Yes" : "No"} 
                      onChange={(v: string) => handleChange('overtimeApplicable', v === "Yes")} 
                      options={['Yes', 'No']} 
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label>Claims</Label>
                    <CustomSelect 
                      value={formData.claimsApplicable ? "Yes" : "No"} 
                      onChange={(v: string) => handleChange('claimsApplicable', v === "Yes")} 
                      options={['Yes', 'No']} 
                    />
                  </div>
                </div>

                {formData.overtimeApplicable && (
                  <div className="bg-[#F8F9FA] dark:bg-[#1C1C22]/50 border border-gray-200 dark:border-[#2C2C35] rounded-[20px] p-6 mt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[18px]">⏱️</span>
                      <h5 className="text-[13px] font-bold text-gray-800 dark:text-white uppercase tracking-wider">Overtime Parameters</h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col">
                        <Label required>Overtime Hours Limit (hrs)</Label>
                        <input 
                          type="number" 
                          min="0"
                          step="0.1"
                          value={formData.overtimeWorkingHours || ""} 
                          onChange={e => handleChange('overtimeWorkingHours', e.target.value)} 
                          placeholder="e.g. 44" 
                          className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" 
                        />
                      </div>
                      <div className="flex flex-col">
                        <Label required>Calculation Period</Label>
                        <CustomSelect 
                          value={formData.overtimePeriod || "monthly"} 
                          onChange={(v: string) => handleChange('overtimePeriod', v)} 
                          options={['weekly', 'monthly']} 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Assign Projects Section */}
                <div className="mt-8 mb-4 pb-2 border-b border-gray-100">
                  <h4 className="text-[14px] font-bold text-gray-800">Assign Projects</h4>
                </div>

                <div className="flex flex-col gap-4 p-5 border border-[#E5E5EA] rounded-[16px] bg-gray-50/30 mb-8">
                  <div className="flex flex-col relative w-full" ref={projectDropdownRef}>
                    <Label>Assign Projects (Optional - Type to search & select multiple)</Label>
                    
                    {/* Pills of Selected Projects */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(formData.assignedProjects || []).map((projCodeOrName: string) => {
                        const proj = companyProjects.find(p => p.code === projCodeOrName || p.name === projCodeOrName);
                        const displayCode = proj?.code || (projCodeOrName.startsWith("PRJ-") ? projCodeOrName : "PRJ-CUSTOM");
                        const displayName = proj?.name || projCodeOrName;
                        
                        return (
                          <div 
                            key={projCodeOrName}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E5EA] rounded-[8px] text-[12px] font-semibold text-gray-800 shadow-sm"
                          >
                            <span className="text-[14px]">🏢</span>
                            <span className="font-bold text-[#007AFF]">{displayCode}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600 max-w-[120px] truncate">{displayName}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newProjs = (formData.assignedProjects || []).filter(p => p !== projCodeOrName);
                                handleChange("assignedProjects", newProjs);
                              }}
                              className="ml-1 p-0.5 hover:bg-gray-100 text-gray-400 hover:text-red-500 rounded-full transition-all flex items-center justify-center"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                      {(!formData.assignedProjects || formData.assignedProjects.length === 0) && (
                        <span className="text-[12px] text-gray-400 font-medium italic">No projects assigned to this employee yet.</span>
                      )}
                    </div>

                    {/* Autocomplete Input */}
                    <div className="relative">
                      <input 
                        type="text"
                        value={projectSearch}
                        onChange={(e) => {
                          setProjectSearch(e.target.value);
                          setIsProjectDropdownOpen(true);
                        }}
                        onFocus={() => setIsProjectDropdownOpen(true)}
                        placeholder="Type to search projects by name or code..."
                        className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] pr-10"
                      />
                      <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Floating Dropdown */}
                    {isProjectDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E5E5EA] rounded-[12px] shadow-lg max-h-[220px] overflow-y-auto z-[999] p-1.5 flex flex-col gap-1 page-scrollbar">
                        {companyProjects
                          .filter(proj => {
                            const query = projectSearch.toLowerCase();
                            return proj.name?.toLowerCase().includes(query) || proj.code?.toLowerCase().includes(query);
                          })
                          .map((proj) => {
                            const isSelected = (formData.assignedProjects || []).includes(proj.code) || (formData.assignedProjects || []).includes(proj.name);
                            return (
                              <button
                                key={proj.id || proj.code}
                                type="button"
                                disabled={isSelected}
                                onClick={() => {
                                  const newProjs = [...(formData.assignedProjects || []), proj.code];
                                  handleChange("assignedProjects", newProjs);
                                  setProjectSearch("");
                                  setIsProjectDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-[8px] flex items-center justify-between text-[13px] transition-colors ${
                                  isSelected 
                                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed font-medium' 
                                    : 'hover:bg-gray-50 text-gray-800 font-semibold'
                                }`}
                              >
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-bold text-gray-900 leading-tight">{proj.name}</span>
                                  <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{proj.code} • {proj.client || 'Direct Client'}</span>
                                </div>
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                )}
                              </button>
                            );
                          })
                        }
                        
                        {/* Custom Project Creation Option */}
                        {projectSearch.trim() !== "" && !companyProjects.some(p => p.name?.toLowerCase() === projectSearch.trim().toLowerCase() || p.code?.toLowerCase() === projectSearch.trim().toLowerCase()) && (
                          <button
                            type="button"
                            onClick={() => {
                              const newProjCode = projectSearch.trim();
                              const newProjs = [...(formData.assignedProjects || []), newProjCode];
                              handleChange("assignedProjects", newProjs);
                              setProjectSearch("");
                              setIsProjectDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2.5 text-[13px] font-bold text-[#007AFF] rounded-[8px] hover:bg-[#007AFF]/5 transition-colors border-t border-gray-100 mt-1"
                          >
                            + Add Custom Project "{projectSearch.trim()}"
                          </button>
                        )}

                        {companyProjects.filter(proj => {
                          const query = projectSearch.toLowerCase();
                          return proj.name?.toLowerCase().includes(query) || proj.code?.toLowerCase().includes(query);
                        }).length === 0 && projectSearch.trim() === "" && (
                          <span className="text-[12px] text-gray-400 py-4 text-center block font-medium">No company projects available</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Allowances Section */}
                <div className="mt-8 flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                  <h4 className="text-[14px] font-bold text-gray-800">Allowances</h4>
                  <button 
                    type="button" 
                    onClick={() => {
                      const newAllowances = [...(formData.allowances || []), { name: "", amount: "" }];
                      handleChange("allowances", newAllowances);
                    }}
                    className="flex items-center gap-1.5 text-[13px] font-bold text-[#007AFF] hover:text-[#0063CC] transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Allowance
                  </button>
                </div>
                
                <div className="space-y-4">
                  {(formData.allowances || []).map((allowance: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-[#E5E5EA] rounded-[12px] bg-gray-50/50">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <Label>Allowance Name</Label>
                          <input 
                            type="text" 
                            value={allowance.name} 
                            onChange={e => {
                              const newAllowances = [...(formData.allowances || [])];
                              newAllowances[index].name = e.target.value;
                              handleChange('allowances', newAllowances);
                            }} 
                            placeholder="e.g. Transport Allowance" 
                            className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" 
                          />
                        </div>
                        <div className="flex flex-col">
                          <Label>Amount</Label>
                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-[13px] font-semibold text-gray-500">S$</span>
                            <input 
                              type="text" 
                              value={allowance.amount} 
                              onChange={e => {
                                const newAllowances = [...(formData.allowances || [])];
                                newAllowances[index].amount = formatSalary(e.target.value);
                                handleChange('allowances', newAllowances);
                              }} 
                              placeholder="0.00" 
                              className="h-11 pl-8 pr-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-semibold text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" 
                            />
                          </div>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          const newAllowances = [...(formData.allowances || [])];
                          newAllowances.splice(index, 1);
                          handleChange('allowances', newAllowances);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all mt-6"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {(!formData.allowances || formData.allowances.length === 0) && (
                    <div className="text-center py-6 border-2 border-dashed border-[#E5E5EA] rounded-[12px] text-[13px] text-gray-500">
                      No allowances added yet. Click "Add Allowance" to add one.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- STEP 4: Tax Details --- */}
            {currentStep === 4 && (
              <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-8">
                <SectionHeader title="Tax Details" />

                {/* Employee Contributions */}
                <div className="mb-8">
                  <h4 className="text-[16px] font-bold text-gray-900 mb-4">Employee Contributions (Monthly)</h4>
                  <div className="border border-[#E5E5EA] rounded-[12px] overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-[#E5E5EA] text-[13px] font-semibold text-gray-500">
                          <th className="py-3 px-4 w-1/2 font-medium">Description</th>
                          <th className="py-3 px-4 w-1/6 font-medium">Rate</th>
                          <th className="py-3 px-4 w-1/4 font-medium">Amount (SGD)</th>
                          <th className="py-3 px-4 w-1/12 text-center font-medium">Editable</th>
                        </tr>
                      </thead>
                      <tbody className="text-[13px] font-medium text-gray-900">
                        {formData.identityType !== "FIN" && (
                          <tr className="border-b border-[#E5E5EA]">
                            <td className="py-4 px-4">
                              <div className="font-semibold">CPF Employee</div>
                              <div className="text-gray-500 text-[12px] mt-0.5">Employee CPF Contribution</div>
                            </td>
                            <td className="py-4 px-4">
                               <div className="flex items-center gap-1">
                                 <input type="text" value={formData.customCpfEmployeeRate !== undefined ? formData.customCpfEmployeeRate : displayCpfEmployeeRate} onChange={(e) => { let r = e.target.value; handleChange("customCpfEmployeeRate", r); if(r === "") { handleChange("customCpfEmployee", ""); } else if(cappedCpfSalaryNum > 0){ handleChange("customCpfEmployee", (cappedCpfSalaryNum * (parseFloat(r)||0) / 100).toFixed(2)); } }} className="w-16 h-9 px-2 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] text-center" /> %
                               </div>
                             </td>
                             <td className="py-4 px-4">
                               <input type="text" value={formData.customCpfEmployee !== undefined ? formData.customCpfEmployee : displayCpfEmployee.toFixed(2)} onChange={(e) => { let a = e.target.value; handleChange("customCpfEmployee", a); if(a === "") { handleChange("customCpfEmployeeRate", ""); } else if(cappedCpfSalaryNum > 0){ handleChange("customCpfEmployeeRate", (((parseFloat(a)||0) / cappedCpfSalaryNum) * 100).toFixed(2)); } }} className="w-full h-9 px-3 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                             </td>
                             <td className="py-4 px-4 text-center text-[#007AFF] cursor-pointer" onClick={() => { handleChange("customCpfEmployee", undefined); handleChange("customCpfEmployeeRate", undefined); }} title="Reset to auto-calculated">
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                             </td>
                          </tr>
                        )}
                        <tr className="border-b border-[#E5E5EA]">
                          <td className="py-4 px-4">
                            <div className="font-semibold">CDAC</div>
                            <div className="text-gray-500 text-[12px] mt-0.5">Chinese Development Assistance Council</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1">
                              <input type="text" value={formData.shgContribution === "CDAC" ? displayCdacRate : "0.00"} onChange={(e) => { let r = e.target.value; handleChange("customCdacRate", r); if(formData.shgContribution !== "CDAC") handleChange("shgContribution", "CDAC"); if(grossSalaryNum > 0){ handleChange("shgAmount", (grossSalaryNum * (parseFloat(r)||0) / 100).toFixed(2)); } }} className="w-16 h-9 px-2 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] text-center" /> %
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <input type="text" value={formData.shgContribution === "CDAC" ? formData.shgAmount : "0.00"} onChange={(e) => { let a = e.target.value; if(formData.shgContribution !== "CDAC") handleChange("shgContribution", "CDAC"); handleChange("shgAmount", a); if(grossSalaryNum > 0){ handleChange("customCdacRate", (((parseFloat(a)||0) / grossSalaryNum) * 100).toFixed(2)); } }} className="w-full h-9 px-3 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                          </td>
                          <td className="py-4 px-4 text-center text-[#007AFF] cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                          </td>
                        </tr>
                        <tr className="border-b border-[#E5E5EA]">
                          <td className="py-4 px-4">
                            <div className="font-semibold">SINDA</div>
                            <div className="text-gray-500 text-[12px] mt-0.5">Singapore Indian Development Association</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1">
                              <input type="text" value={formData.shgContribution === "SINDA" ? displaySindaRate : "0.00"} onChange={(e) => { let r = e.target.value; handleChange("customSindaRate", r); if(formData.shgContribution !== "SINDA") handleChange("shgContribution", "SINDA"); if(grossSalaryNum > 0){ handleChange("shgAmount", (grossSalaryNum * (parseFloat(r)||0) / 100).toFixed(2)); } }} className="w-16 h-9 px-2 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] text-center" /> %
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <input type="text" value={formData.shgContribution === "SINDA" ? formData.shgAmount : "0.00"} onChange={(e) => { let a = e.target.value; if(formData.shgContribution !== "SINDA") handleChange("shgContribution", "SINDA"); handleChange("shgAmount", a); if(grossSalaryNum > 0){ handleChange("customSindaRate", (((parseFloat(a)||0) / grossSalaryNum) * 100).toFixed(2)); } }} className="w-full h-9 px-3 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                          </td>
                          <td className="py-4 px-4 text-center text-[#007AFF] cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                          </td>
                        </tr>
                        <tr className="border-b border-[#E5E5EA]">
                          <td className="py-4 px-4">
                            <div className="font-semibold">MBMF</div>
                            <div className="text-gray-500 text-[12px] mt-0.5">Majlis Ugama Islam Singapura</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1">
                              <input type="text" value={formData.shgContribution === "MBMF" ? displayMbmfRate : "0.00"} onChange={(e) => { let r = e.target.value; handleChange("customMbmfRate", r); if(formData.shgContribution !== "MBMF") handleChange("shgContribution", "MBMF"); if(grossSalaryNum > 0){ handleChange("shgAmount", (grossSalaryNum * (parseFloat(r)||0) / 100).toFixed(2)); } }} className="w-16 h-9 px-2 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] text-center" /> %
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <input type="text" value={formData.shgContribution === "MBMF" ? formData.shgAmount : "0.00"} onChange={(e) => { let a = e.target.value; if(formData.shgContribution !== "MBMF") handleChange("shgContribution", "MBMF"); handleChange("shgAmount", a); if(grossSalaryNum > 0){ handleChange("customMbmfRate", (((parseFloat(a)||0) / grossSalaryNum) * 100).toFixed(2)); } }} className="w-full h-9 px-3 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                          </td>
                          <td className="py-4 px-4 text-center text-[#007AFF] cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                          </td>
                        </tr>
                        <tr className="border-b border-[#E5E5EA]">
                          <td className="py-4 px-4">
                            <div className="font-semibold">ECF</div>
                            <div className="text-gray-500 text-[12px] mt-0.5">Eurasian Community Fund</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1">
                              <input type="text" value={formData.shgContribution === "ECF" ? displayEcfRate : "0.00"} onChange={(e) => { let r = e.target.value; handleChange("customEcfRate", r); if(formData.shgContribution !== "ECF") handleChange("shgContribution", "ECF"); if(grossSalaryNum > 0){ handleChange("shgAmount", (grossSalaryNum * (parseFloat(r)||0) / 100).toFixed(2)); } }} className="w-16 h-9 px-2 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] text-center" /> %
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <input type="text" value={formData.shgContribution === "ECF" ? formData.shgAmount : "0.00"} onChange={(e) => { let a = e.target.value; if(formData.shgContribution !== "ECF") handleChange("shgContribution", "ECF"); handleChange("shgAmount", a); if(grossSalaryNum > 0){ handleChange("customEcfRate", (((parseFloat(a)||0) / grossSalaryNum) * 100).toFixed(2)); } }} className="w-full h-9 px-3 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                          </td>
                          <td className="py-4 px-4 text-center text-[#007AFF] cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-4 px-4">
                            <div className="font-semibold">Income Tax (IRAS)</div>
                            <div className="text-gray-500 text-[12px] mt-0.5">Monthly Tax Estimate</div>
                          </td>
                          <td className="py-4 px-4">
                             <div className="flex items-center gap-1">
                               <input type="text" value={formData.customIncomeTaxRate !== undefined ? formData.customIncomeTaxRate : displayIncomeTaxRate} onChange={(e) => { let r = e.target.value; handleChange("customIncomeTaxRate", r); if(r === "") { handleChange("monthlyTaxEstimate", ""); } else if(grossSalaryNum > 0){ handleChange("monthlyTaxEstimate", (grossSalaryNum * (parseFloat(r)||0) / 100).toFixed(2)); } }} className="w-16 h-9 px-2 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] text-center" /> %
                             </div>
                           </td>
                           <td className="py-4 px-4">
                             <input type="text" value={formData.monthlyTaxEstimate !== undefined ? formData.monthlyTaxEstimate : "0.00"} onChange={(e) => { let a = e.target.value; handleChange("monthlyTaxEstimate", a); if(a === "") { handleChange("customIncomeTaxRate", ""); } else if(grossSalaryNum > 0){ handleChange("customIncomeTaxRate", (((parseFloat(a)||0) / grossSalaryNum) * 100).toFixed(2)); } }} className="w-full h-9 px-3 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                           </td>
                          <td className="py-4 px-4 text-center text-[#007AFF] cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                          </td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-gray-50 border-t border-[#E5E5EA]">
                        <tr>
                          <td colSpan={2} className="py-4 px-4 text-[13px] font-bold text-gray-900 text-right">Total Employee Contributions</td>
                          <td colSpan={2} className="py-4 px-4 text-[13px] font-bold text-gray-900">
                            SGD {(displayCpfEmployee + parseFloat((formData.shgAmount || "0").replace(/,/g, '')) + parseFloat((formData.monthlyTaxEstimate || "0").replace(/,/g, ''))).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Employer Contributions */}
                <div className="mb-8">
                  <h4 className="text-[16px] font-bold text-gray-900 mb-4">Employer Contributions (Monthly)</h4>
                  <div className="border border-[#E5E5EA] rounded-[12px] overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-[#E5E5EA] text-[13px] font-semibold text-gray-500">
                          <th className="py-3 px-4 w-1/2 font-medium">Description</th>
                          <th className="py-3 px-4 w-1/6 font-medium">Rate</th>
                          <th className="py-3 px-4 w-1/4 font-medium">Amount (SGD)</th>
                          <th className="py-3 px-4 w-1/12 text-center font-medium">Editable</th>
                        </tr>
                      </thead>
                      <tbody className="text-[13px] font-medium text-gray-900">
                        {formData.identityType !== "FIN" && (
                          <tr className="border-b border-[#E5E5EA]">
                            <td className="py-4 px-4">
                              <div className="font-semibold">CPF Employer</div>
                              <div className="text-gray-500 text-[12px] mt-0.5">Employer CPF Contribution</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1">
                                <input type="text" value={formData.customCpfEmployerRate !== undefined ? formData.customCpfEmployerRate : displayCpfEmployerRate} onChange={(e) => { let r = e.target.value; handleChange("customCpfEmployerRate", r); if(r === "") { handleChange("customCpfEmployer", ""); } else if(cappedCpfSalaryNum > 0){ handleChange("customCpfEmployer", (cappedCpfSalaryNum * (parseFloat(r)||0) / 100).toFixed(2)); } }} className="w-16 h-9 px-2 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] text-center" /> %
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <input type="text" value={formData.customCpfEmployer !== undefined ? formData.customCpfEmployer : displayCpfEmployer.toFixed(2)} onChange={(e) => { let a = e.target.value; handleChange("customCpfEmployer", a); if(a === "") { handleChange("customCpfEmployerRate", ""); } else if(cappedCpfSalaryNum > 0){ handleChange("customCpfEmployerRate", (((parseFloat(a)||0) / cappedCpfSalaryNum) * 100).toFixed(2)); } }} className="w-full h-9 px-3 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                            </td>
                            <td className="py-4 px-4 text-center text-[#007AFF] cursor-pointer" onClick={() => { handleChange("customCpfEmployer", undefined); handleChange("customCpfEmployerRate", undefined); }} title="Reset to auto-calculated">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                            </td>
                          </tr>
                        )}
                        <tr className="border-b border-[#E5E5EA]">
                          <td className="py-4 px-4">
                            <div className="font-semibold">SDL (Skills Development Levy)</div>
                            <div className="text-gray-500 text-[12px] mt-0.5">0.25% of gross salary (Min $2, Max $11.25)</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1">
                              <input type="text" value={formData.customSdlRate !== undefined ? formData.customSdlRate : displaySdlRate} onChange={(e) => { let r = e.target.value; handleChange("customSdlRate", r); if(r === "") { handleChange("customSdl", ""); } else if(grossSalaryNum > 0){ handleChange("customSdl", (grossSalaryNum * (parseFloat(r)||0) / 100).toFixed(2)); } }} className="w-16 h-9 px-2 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] text-center" /> %
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <input type="text" value={formData.customSdl !== undefined ? formData.customSdl : displaySdl.toFixed(2)} onChange={(e) => { let a = e.target.value; handleChange("customSdl", a); if(a === "") { handleChange("customSdlRate", ""); } else if(grossSalaryNum > 0){ handleChange("customSdlRate", (((parseFloat(a)||0) / grossSalaryNum) * 100).toFixed(2)); } }} className="w-full h-9 px-3 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                          </td>
                          <td className="py-4 px-4 text-center text-[#007AFF] cursor-pointer" onClick={() => { handleChange("customSdl", undefined); handleChange("customSdlRate", undefined); }} title="Reset to auto-calculated">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-4 px-4">
                            <div className="font-semibold">Foreign Worker Levy</div>
                            <div className="text-gray-500 text-[12px] mt-0.5">Levy based on work pass & quota tier</div>
                          </td>
                          <td className="py-4 px-4 text-gray-400">-</td>
                          <td className="py-4 px-4">
                            <input type="text" value={formData.foreignWorkerLevy} onChange={(e) => handleChange("foreignWorkerLevy", e.target.value)} className="w-full h-9 px-3 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                          </td>
                          <td className="py-4 px-4 text-center text-[#007AFF] cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                          </td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-gray-50 border-t border-[#E5E5EA]">
                        <tr>
                          <td colSpan={2} className="py-4 px-4 text-[13px] font-bold text-gray-900 text-right">Total Employer Contributions</td>
                          <td colSpan={2} className="py-4 px-4 text-[13px] font-bold text-gray-900">
                            SGD {(displayCpfEmployer + displaySdl + parseFloat((formData.foreignWorkerLevy || "0").replace(/,/g, ''))).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <h4 className="text-[16px] font-bold text-gray-900 mb-4">Summary (Monthly)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Employee Pay Summary */}
                    <div className="border border-[#E5E5EA] rounded-[12px] p-5">
                      <h5 className="text-[14px] font-bold text-gray-900 mb-4">Employee Pay Summary</h5>
                      <div className="space-y-3 text-[13px]">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Gross Salary</span>
                          <span className="font-semibold text-gray-900">SGD {parseFloat((formData.salary || "0").replace(/,/g, '')).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Total Allowances</span>
                          <span className="font-semibold text-gray-900">SGD {((formData.allowances || []).reduce((sum: number, a: any) => sum + parseFloat(a.amount.replace(/,/g, '') || "0"), 0)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Total Deductions</span>
                          <span className="font-semibold text-gray-900">- SGD {(displayCpfEmployee + parseFloat((formData.shgAmount || "0").replace(/,/g, '')) + parseFloat((formData.monthlyTaxEstimate || "0").replace(/,/g, ''))).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="pt-3 border-t border-[#E5E5EA] flex justify-between items-center mt-3">
                          <span className="font-bold text-gray-900">Net Salary</span>
                          <span className="font-bold text-[#34C759]">SGD {(parseFloat((formData.salary || "0").replace(/,/g, '')) + ((formData.allowances || []).reduce((sum: number, a: any) => sum + parseFloat(a.amount.replace(/,/g, '') || "0"), 0)) - (displayCpfEmployee + parseFloat((formData.shgAmount || "0").replace(/,/g, '')) + parseFloat((formData.monthlyTaxEstimate || "0").replace(/,/g, '')))).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                      </div>
                    </div>

                    {/* Employer Cost Summary */}
                    <div className="border border-[#E5E5EA] rounded-[12px] p-5">
                      <h5 className="text-[14px] font-bold text-gray-900 mb-4">Employer Cost Summary</h5>
                      <div className="space-y-3 text-[13px]">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Gross Salary</span>
                          <span className="font-semibold text-gray-900">SGD {parseFloat((formData.salary || "0").replace(/,/g, '')).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Total Employer Contributions</span>
                          <span className="font-semibold text-gray-900">SGD {(displayCpfEmployer + displaySdl + parseFloat((formData.foreignWorkerLevy || "0").replace(/,/g, ''))).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Other Allowances</span>
                          <span className="font-semibold text-gray-900">SGD {((formData.allowances || []).reduce((sum: number, a: any) => sum + parseFloat(a.amount.replace(/,/g, '') || "0"), 0)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="pt-3 border-t border-[#E5E5EA] flex justify-between items-center mt-3">
                          <span className="font-bold text-gray-900">Total Employer Cost</span>
                          <span className="font-bold text-[#007AFF]">SGD {(parseFloat((formData.salary || "0").replace(/,/g, '')) + ((formData.allowances || []).reduce((sum: number, a: any) => sum + parseFloat(a.amount.replace(/,/g, '') || "0"), 0)) + (displayCpfEmployer + displaySdl + parseFloat((formData.foreignWorkerLevy || "0").replace(/,/g, '')))).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* --- STEP 5: Contact Information --- */}
            {currentStep === 5 && (
              <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-8">
                <SectionHeader title="Contact Information" />

                {formData.nationality === "Singaporean" || !formData.nationality ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="flex flex-col">
                        <Label required>Mobile Number</Label>
                        <PhoneInput
                          code={formData.mobileCode}
                          number={formData.mobileNumber}
                          codeOptions={PHONE_CODE_OPTIONS}
                          onCodeChange={(v: string) => handleChange("mobileCode", v)}
                          onNumberChange={(v: string) => handleChange("mobileNumber", v.slice(0, 16))}
                          placeholder="9123 4567"
                        />
                      </div>
                      <div className="flex flex-col">
                        <Label>Personal Email Address (if different from work)</Label>
                        <input
                          type="email"
                          value={formData.personalEmail}
                          onChange={(e) => handleChange("personalEmail", e.target.value)}
                          placeholder="name@example.com"
                          className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="flex flex-col md:col-span-3">
                        <Label required>Residential Address</Label>
                        <input
                          type="text"
                          value={formData.residentialAddress}
                          onChange={(e) => handleChange("residentialAddress", e.target.value)}
                          placeholder="Enter Residential Address"
                          className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
                        />
                      </div>
                      <div className="flex flex-col">
                        <Label required>Postal Code</Label>
                        <input
                          type="text"
                          value={formData.postalCode}
                          onChange={(e) => handleChange("postalCode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="Enter Postal Code"
                          maxLength={6}
                          className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-[16px] font-bold text-[#1C1C1E] mb-4">Current (Singapore)</h3>
                    <div className="rounded-[12px] border border-[#E5E5EA] bg-[#F9F9FB] dark:bg-[#121217] p-6 mb-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="flex flex-col">
                          <Label required>Mobile Number</Label>
                          <PhoneInput
                            code={formData.currentMobileCode}
                            number={formData.currentMobileNumber}
                            codeOptions={PHONE_CODE_OPTIONS}
                            onCodeChange={(v: string) => handleChange("currentMobileCode", v)}
                            onNumberChange={(v: string) => handleChange("currentMobileNumber", v.slice(0, 16))}
                            placeholder="9123 4567"
                          />
                        </div>
                        <div className="flex flex-col">
                          <Label required>Email Address</Label>
                          <input
                            type="email"
                            required
                            value={formData.currentEmail}
                            onChange={(e) => handleChange("currentEmail", e.target.value)}
                            placeholder="Primary email while in Singapore"
                            className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="flex flex-col md:col-span-3">
                          <Label required>Current Residential Address</Label>
                          <input
                            type="text"
                            value={formData.currentResidentialAddress}
                            onChange={(e) => handleChange("currentResidentialAddress", e.target.value)}
                            placeholder="Address in Singapore"
                            className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
                          />
                        </div>
                        <div className="flex flex-col">
                          <Label required>Postal Code</Label>
                          <input
                            type="text"
                            value={formData.currentPostalCode}
                            onChange={(e) => handleChange("currentPostalCode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="Postal Code"
                            maxLength={6}
                            className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
                          />
                        </div>
                      </div>
                    </div>

                    <h3 className="text-[16px] font-bold text-[#1C1C1E] mb-4">Native (home country)</h3>
                    <div className="rounded-[12px] border border-[#E5E5EA] bg-[#F9F9FB] dark:bg-[#121217] p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="flex flex-col">
                          <Label>Mobile Number</Label>
                          <PhoneInput
                            code={formData.nativeMobileCode}
                            number={formData.nativeMobileNumber}
                            codeOptions={PHONE_CODE_OPTIONS}
                            onCodeChange={(v: string) => handleChange("nativeMobileCode", v)}
                            onNumberChange={(v: string) => handleChange("nativeMobileNumber", v.slice(0, 16))}
                            placeholder="Home country mobile"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="flex flex-col md:col-span-3">
                          <Label>Native Address</Label>
                          <input
                            type="text"
                            value={formData.nativeResidentialAddress}
                            onChange={(e) => handleChange("nativeResidentialAddress", e.target.value)}
                            placeholder="Permanent / home country address"
                            className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
                          />
                        </div>
                        <div className="flex flex-col">
                          <Label>Postal / ZIP Code</Label>
                          <input
                            type="text"
                            value={formData.nativePostalCode}
                            onChange={(e) => handleChange("nativePostalCode", e.target.value)}
                            placeholder="Postal / ZIP"
                            className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* --- STEP 6: Emergency Contact --- */}
            {currentStep === 6 && (
              <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-8">
                <SectionHeader title="Emergency Contact" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="flex flex-col">
                    <Label required>Emergency Contact Name</Label>
                    <input type="text" value={formData.emergName} onChange={e => handleChange('emergName', e.target.value)} placeholder="Enter Contact Name" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                  </div>
                  <div className="flex flex-col">
                    <Label required>Relationship</Label>
                    <CustomSelect value={formData.emergRelation} onChange={(v: string) => handleChange('emergRelation', v)} options={['Parent', 'Spouse', 'Sibling', 'Friend']} placeholder="Select Relationship" />
                  </div>
                  <div className="flex flex-col">
                    <Label required>Secondary Emergency Contact Number</Label>
                    <PhoneInput 
                      code={formData.emergContactCode} 
                      number={formData.emergContact} 
                      codeOptions={['+65', '+60', '+62', '+63', '+66', '+81', '+82', '+84', '+86', '+91', '+92', '+94', '+95', '+977', '+880']}
                      onCodeChange={(v: string) => handleChange('emergContactCode', v)} 
                      onNumberChange={(v: string) => handleChange('emergContact', v)} 
                      placeholder="9876 5432"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <Label required>Emergency Contact Address</Label>
                  <input type="text" value={formData.emergAddress} onChange={e => handleChange('emergAddress', e.target.value)} placeholder="Enter Contact Address" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                </div>
              </div>
            )}

            {/* --- STEP 7: Education --- */}
            {currentStep === 7 && (
              <div className="flex flex-col gap-6">
                
                {/* Higher Education */}
                <h3 className="text-[16px] font-bold text-[#1C1C1E] mb-4">Higher Education</h3>
                <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div className="flex flex-col">
                      <Label>Higher Education Country</Label>
                      <CustomSelect 
                        value={formData.higherEduCountry} 
                        onChange={(v: string) => handleChange('higherEduCountry', v)} 
                        options={['Singapore', 'Malaysia', 'Bangladesh', 'Philippines', 'India']} 
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label>Institution Name</Label>
                      <input type="text" value={formData.higherEduInstName} onChange={e => handleChange('higherEduInstName', e.target.value)} placeholder="Enter Institution Name" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                    </div>
                    <div className="flex flex-col">
                      <Label>Course Name</Label>
                      <input type="text" value={formData.higherEduCourseName} onChange={e => handleChange('higherEduCourseName', e.target.value)} placeholder="Enter Course Name" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                    </div>
                    <div className="flex flex-col">
                      <Label>Course Duration</Label>
                      <input type="text" value={formData.higherEduCourseDuration} onChange={e => handleChange('higherEduCourseDuration', e.target.value)} placeholder="e.g. 3 years, 18 months" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                    </div>
                    <div className="flex flex-col">
                      <Label>Highest Qualification</Label>
                      <CustomSelect value={formData.higherEduQual} onChange={(v: string) => handleChange('higherEduQual', v)} options={['Bachelor Degree', 'Master Degree', 'PhD', 'Professional Certificate', 'Diploma']} />
                    </div>
                    <div className="flex flex-col">
                      <Label>Graduation Year</Label>
                      <input type="text" value={formData.higherEduGradYear} onChange={e => handleChange('higherEduGradYear', e.target.value)} placeholder="Enter Year" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                    </div>
                    <div className="flex flex-col">
                      <Label>Higher Education Certificate</Label>
                      <FileUpload 
                        value={formData.higherEduCertUrl} 
                        onChange={(file: File) => handleChange('higherEduCertUrl', file)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Schooling */}
                <h3 className="text-[16px] font-bold text-[#1C1C1E] mb-4">Schooling</h3>
                <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div className="flex flex-col">
                      <Label>Schooling Country</Label>
                      <CustomSelect 
                        value={formData.schoolingCountry} 
                        onChange={(v: string) => {
                          handleChange('schoolingCountry', v);
                          handleChange('schoolingQual', ''); // Reset qual when country changes
                        }} 
                        options={['Singapore', 'Malaysia', 'Bangladesh', 'Philippines', 'India']} 
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label>School Name</Label>
                      <input type="text" value={formData.schoolingInstName} onChange={e => handleChange('schoolingInstName', e.target.value)} placeholder="Enter School Name" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                    </div>
                    <div className="flex flex-col">
                      <Label>Qualification</Label>
                      <CustomSelect 
                        value={formData.schoolingQual} 
                        onChange={(v: string) => handleChange('schoolingQual', v)} 
                        options={
                          formData.schoolingCountry === 'Singapore' 
                          ? ["PSLE", "GCE O-Level", "GCE N-Level", "GCE A-Level", "ITE Certificate", "Polytechnic Diploma"]
                          : formData.schoolingCountry === 'Bangladesh'
                          ? ["SSC (Secondary School Certificate)", "HSC (Higher Secondary Certificate)", "Junior School Certificate"]
                          : formData.schoolingCountry === 'Philippines'
                          ? ["Elementary Diploma", "Junior High School", "Senior High School", "K-12 Graduate"]
                          : formData.schoolingCountry === 'Malaysia'
                          ? ["UPSR", "PT3", "SPM", "STPM", "UEC"]
                          : formData.schoolingCountry === 'India'
                          ? ["10th Standard (SSC)", "12th Standard (HSC)", "Secondary School Certificate"]
                          : ["High School Diploma", "Secondary School Certificate", "Foundation Program", "International Baccalaureate (IB)"]
                        } 
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label>Graduation Year</Label>
                      <input type="text" value={formData.schoolingGradYear} onChange={e => handleChange('schoolingGradYear', e.target.value)} placeholder="Enter Year" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                    </div>
                    <div className="flex flex-col">
                      <Label>Schooling Certificate</Label>
                      <FileUpload 
                        value={formData.schoolingCertUrl} 
                        onChange={(file: File) => handleChange('schoolingCertUrl', file)} 
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* --- STEP 8: Certifications --- */}
            {currentStep === 8 && (
              <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-8">
                <SectionHeader title="Certifications" subtitle="Add multiple certifications if applicable." />
                
                <div className="flex flex-col gap-8">
                  {formData.certifications.map((cert, index) => (
                    <div key={index} className="relative p-6 border border-gray-200 rounded-[12px] bg-gray-50/50">
                      {formData.certifications.length > 1 && (
                        <button onClick={() => removeCertification(index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="flex flex-col">
                          <Label required>Certification Name</Label>
                          <input type="text" value={cert.certName} onChange={e => handleCertChange(index, 'certName', e.target.value)} placeholder="Enter Cert Name" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                        </div>
                        <div className="flex flex-col">
                          <Label required>Issuing Organization</Label>
                          <input type="text" value={cert.issuingOrg} onChange={e => handleCertChange(index, 'issuingOrg', e.target.value)} placeholder="Enter Org Name" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col">
                          <Label>Issue Date</Label>
                          <DateInput value={cert.certIssueDate} onChange={(v: string) => handleCertChange(index, 'certIssueDate', v)} />
                        </div>
                        <div className="flex flex-col">
                          <Label>Expiry Date</Label>
                          <DateInput value={cert.certExpiryDate} onChange={(v: string) => handleCertChange(index, 'certExpiryDate', v)} />
                        </div>
                        <div className="flex flex-col">
                          <Label>Certification Document</Label>
                          <FileUpload 
                            value={cert.certificationUrl} 
                            onChange={(file: File) => handleCertChange(index, 'certificationUrl', file)} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button onClick={addCertification} className="flex items-center gap-2 text-[#007AFF] text-[13px] font-bold hover:text-[#0062CC] self-start">
                    <Plus className="h-4 w-4" strokeWidth={3} /> Add Another Certification
                  </button>
                </div>
              </div>
            )}

            {/* --- STEP 9: Medical Information --- */}
            {currentStep === 9 && (
              <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-8">
                <SectionHeader title="Medical Information" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex flex-col">
                    <Label>Blood Group</Label>
                    <CustomSelect 
                      value={formData.bloodGroup} 
                      onChange={(v: string) => handleChange('bloodGroup', v)} 
                      options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} 
                      placeholder="Select Blood Group" 
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label>Insurance Type</Label>
                    <CustomSelect value={formData.insuranceType} onChange={(v: string) => handleChange('insuranceType', v)} options={['Medical Insurance', 'Group Hospitalization', 'Dental Insurance', 'Life Insurance', 'Accident Insurance', 'Work Injury Compensation', 'Maternity Coverage']} placeholder="Select Type" />
                  </div>
                </div>

                <h4 className="text-[14px] font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Policy Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="flex flex-col">
                    <Label>Insurance Provider Name</Label>
                    <input type="text" value={formData.insurProvider} onChange={e => handleChange('insurProvider', e.target.value)} placeholder="Enter Provider Name" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                  </div>
                  <div className="flex flex-col">
                    <Label>Policy Number</Label>
                    <input type="text" value={formData.insurPolicyNum} onChange={e => handleChange('insurPolicyNum', e.target.value)} placeholder="Enter Policy Number" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                  </div>
                  <div className="flex flex-col">
                    <Label>Payment Frequency</Label>
                    <CustomSelect value={formData.insurPaymentFreq} onChange={(v: string) => handleChange('insurPaymentFreq', v)} options={['Monthly', 'Quarterly', 'Yearly']} />
                  </div>
                  <div className="flex flex-col">
                    <Label>Policy Start Date</Label>
                    <DateInput value={formData.insurPolicyStart} onChange={(v: string) => handleChange('insurPolicyStart', v)} />
                  </div>
                  <div className="flex flex-col">
                    <Label>Policy Expiry Date</Label>
                    <DateInput value={formData.insurPolicyExpiry} onChange={(v: string) => handleChange('insurPolicyExpiry', v)} />
                  </div>
                  <div className="flex flex-col">
                    <Label>Coverage Amount</Label>
                    <input type="text" value={formData.insurCoverageAmt} onChange={e => handleChange('insurCoverageAmt', e.target.value)} placeholder="Enter Amount" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                  </div>
                  <div className="flex flex-col">
                    <Label>Premium Amount</Label>
                    <input type="text" value={formData.insurPremiumAmt} onChange={e => handleChange('insurPremiumAmt', e.target.value)} placeholder="Enter Amount" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                  </div>
                </div>

                <h4 className="text-[14px] font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Employee Coverage</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <Label>Employee Covered</Label>
                    <CustomSelect value={formData.empCovered} onChange={(v: string) => handleChange('empCovered', v)} options={['Yes', 'No']} placeholder="Select Option" />
                  </div>
                  <div className="flex flex-col">
                    <Label>Dependents Covered</Label>
                    <CustomSelect value={formData.depsCovered} onChange={(v: string) => handleChange('depsCovered', v)} options={['Yes', 'No']} placeholder="Select Option" />
                  </div>
                  {formData.depsCovered === 'Yes' && (
                    <div className="flex flex-col">
                      <Label>Number of Dependents</Label>
                      <input type="number" value={formData.numDeps} onChange={e => handleChange('numDeps', e.target.value)} placeholder="0" min={0} className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <Label>Spouse Coverage</Label>
                    <CustomSelect value={formData.spouseCoverage} onChange={(v: string) => handleChange('spouseCoverage', v)} options={['Yes', 'No']} placeholder="Select Option" />
                  </div>
                  <div className="flex flex-col">
                    <Label>Children Coverage</Label>
                    <CustomSelect value={formData.childrenCoverage} onChange={(v: string) => handleChange('childrenCoverage', v)} options={['Yes', 'No']} placeholder="Select Option" />
                  </div>
                  <div className="flex flex-col">
                    <Label>Parents Coverage (if applicable)</Label>
                    <CustomSelect value={formData.parentsCoverage} onChange={(v: string) => handleChange('parentsCoverage', v)} options={['Yes', 'No', 'Not Applicable']} placeholder="Select Option" />
                  </div>
                </div>
              </div>
            )}

            {/* --- STEP 10: Bank Details --- */}
            {currentStep === 10 && (
              <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-8">
                <SectionHeader title="Bank Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <Label>Bank Name</Label>
                    <CustomSelect 
                      value={formData.bankName} 
                      onChange={(v: string) => handleChange('bankName', v)} 
                      options={[
                        'DBS Bank',
                        'POSB Bank',
                        'OCBC Bank',
                        'UOB (United Overseas Bank)',
                        'Citibank Singapore',
                        'HSBC Singapore',
                        'Standard Chartered Bank',
                        'Maybank Singapore',
                        'Trust Bank',
                        'GXS Bank',
                        'MariBank',
                        'CIMB Bank',
                        'RHB Bank',
                        'Bank of China',
                        'ICBC (Industrial & Commercial Bank of China)',
                        'State Bank of India (SBI)',
                        'HL Bank',
                        'ANZ Bank',
                        'BNP Paribas',
                        'Deutsche Bank',
                        'MUFG Bank',
                        'SMBC (Sumitomo Mitsui Banking Corp)',
                        'Bank of Singapore',
                        'Bank of East Asia'
                      ]} 
                      placeholder="Select Bank" 
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label>Account Holder Name</Label>
                    <input type="text" value={formData.accountHolder} onChange={e => handleChange('accountHolder', e.target.value)} placeholder="Enter Full Name" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                  </div>
                  <div className="flex flex-col">
                    <Label>Account Number</Label>
                    <input 
                      type="text" 
                      value={formData.accountNum} 
                      onChange={e => handleChange('accountNum', e.target.value.replace(/\D/g, ""))} 
                      placeholder="Enter Account Number" 
                      className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" 
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label>Online Payment Method</Label>
                    <CustomSelect value={formData.onlinePaymentType} onChange={(v: string) => handleChange('onlinePaymentType', v)} options={['PayNow', 'DBS PayLah!', 'Grab', 'YouTrip', 'Others']} placeholder="Select Online Payment Method" />
                  </div>
                  <div className="flex flex-col">
                    <Label>Online Payment ID/Number</Label>
                    <input type="text" value={formData.onlinePaymentId} onChange={e => handleChange('onlinePaymentId', e.target.value)} placeholder="Enter ID/Number" className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
                  </div>
                  <div className="flex flex-col">
                    <Label>Salary Payment Mode</Label>
                    <CustomSelect value={formData.salaryPaymentMode} onChange={(v: string) => handleChange('salaryPaymentMode', v)} options={['Bank Transfer', 'Cheque', 'Cash']} />
                  </div>
                </div>
              </div>
            )}

            {/* --- STEP 11: Custom Details --- */}
            {currentStep === 11 && customFieldsConfig.length > 0 && (
              <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-8">
                <SectionHeader title="Custom Details" subtitle="Please fill in the additional details required by your organization." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customFieldsConfig.map((field: any) => (
                    <div key={field.id} className="flex flex-col">
                      <Label required={field.required}>{field.label}</Label>
                      {field.type === "dropdown" ? (
                        <CustomSelect 
                          value={formData[field.id as keyof typeof formData] || ""} 
                          onChange={(v: string) => handleChange(field.id, v)} 
                          options={field.options || []} 
                        />
                      ) : field.type === "date" ? (
                        <DateInput 
                          value={formData[field.id as keyof typeof formData] || ""} 
                          onChange={(v: string) => handleChange(field.id, v)} 
                        />
                      ) : field.type === "file" ? (
                        <FileUpload 
                          value={formData[field.id as keyof typeof formData]} 
                          onChange={(file: File) => handleChange(field.id, file)} 
                        />
                      ) : field.type === "number" ? (
                        <input 
                          type="number" 
                          value={String(formData[field.id as keyof typeof formData] || "")} 
                          onChange={e => handleChange(field.id, e.target.value)} 
                          placeholder={`Enter ${field.label}`} 
                          className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" 
                        />
                      ) : (
                        <input 
                          type="text" 
                          value={String(formData[field.id as keyof typeof formData] || "")} 
                          onChange={e => handleChange(field.id, e.target.value)} 
                          placeholder={`Enter ${field.label}`} 
                          className="h-11 px-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-medium text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" 
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- STEP 11: Review & Submit --- */}
            {currentStep === lastStepId && (
              <div className="flex flex-col gap-6">

                {/* ── CV Profile Card ── */}
                <div className="bg-white border border-[#E5E5EA] rounded-[16px] overflow-hidden">

                  {/* Header Banner */}
                  <div className="h-24 bg-gradient-to-r from-[#007AFF] to-[#5856D6]" />

                  {/* Avatar + Name strip */}
                  <div className="px-8 pb-6 relative">
                    <div className="flex items-start gap-5">
                      {/* Avatar container with negative margin */}
                      <div className="relative -mt-10">
                        {(() => {
                          const fullName = `${formData.firstName} ${formData.lastName}`.trim() || "User";
                          const { solid: bg } = getAvatarColor(fullName);
                          const initials = getEmpInitials(fullName);
                          
                          return (
                            <div 
                              style={{ backgroundColor: !formData.profilePhotoUrl ? bg : undefined }}
                              className={`h-20 w-20 rounded-[18px] border-2 border-white flex items-center justify-center shrink-0 overflow-hidden ${!formData.profilePhotoUrl ? "" : "bg-gray-100"}`}
                            >
                              {formData.profilePhotoUrl ? (
                                <img src={typeof formData.profilePhotoUrl === "string" ? formData.profilePhotoUrl : URL.createObjectURL(formData.profilePhotoUrl as any)} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white font-bold text-[26px] lowercase">
                                  {initials}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      {/* Name + title row (not shifted up, aligned cleanly below banner) */}
                      <div className="pt-3">
                        <h2 className="text-[20px] font-extrabold text-[#1C1C1E] leading-tight">
                          {formData.firstName} {formData.lastName}
                        </h2>
                        <p className="text-[13px] text-[#8E8E93] font-medium mt-0.5">
                          {formData.nationality} · {formData.gender} · {formData.maritalStatus}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#F2F2F7] mx-8" />

                  {/* CV Sections */}
                  <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">

                    {/* Personal Info */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#007AFF] mb-3">Personal Information</p>
                      <div className="flex flex-col gap-2">
                        {[
                          { label: "Date of Birth", value: formData.dob ? (() => { const [y,m,d] = formData.dob.split("-"); return `${d}/${m}/${y}`; })() : "—" },
                          { label: "Gender", value: formData.gender || "—" },
                          { label: "Marital Status", value: formData.maritalStatus || "—" },
                          { label: "Nationality", value: formData.nationality || "—" },
                        ].map(r => (
                          <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-[#F2F2F7]">
                            <span className="text-[12px] text-[#8E8E93] font-medium">{r.label}</span>
                            <span className="text-[13px] font-semibold text-[#1C1C1E]">{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#007AFF] mb-3">Contact Information</p>
                      <div className="flex flex-col gap-2">
                        {(formData.nationality && formData.nationality !== "Singaporean"
                          ? [
                              { label: "Current mobile", value: formData.currentMobileCode && formData.currentMobileNumber ? `${formData.currentMobileCode} ${formData.currentMobileNumber}` : "—" },
                              { label: "Email (Singapore)", value: formData.currentEmail || "—" },
                              { label: "Current address", value: formData.currentResidentialAddress || "—" },
                              { label: "Current postal", value: formData.currentPostalCode || "—" },
                              { label: "Native mobile", value: formData.nativeMobileCode && formData.nativeMobileNumber ? `${formData.nativeMobileCode} ${formData.nativeMobileNumber}` : "—" },
                              { label: "Native address", value: formData.nativeResidentialAddress || "—" },
                              { label: "Native postal / ZIP", value: formData.nativePostalCode || "—" },
                            ]
                          : [
                              { label: "Mobile", value: formData.mobileCode && formData.mobileNumber ? `${formData.mobileCode} ${formData.mobileNumber}` : "—" },
                              { label: "Personal Email", value: formData.personalEmail || "—" },
                              { label: "Address", value: formData.residentialAddress || "—" },
                              { label: "Postal Code", value: formData.postalCode || "—" },
                            ]
                        ).map((r) => (
                          <div key={r.label} className="flex items-start justify-between gap-4 py-1.5 border-b border-[#F2F2F7]">
                            <span className="text-[12px] text-[#8E8E93] font-medium shrink-0">{r.label}</span>
                            <span className="text-[13px] font-semibold text-[#1C1C1E] text-right">{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Identity */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#007AFF] mb-3">Identity</p>
                      <div className="flex flex-col gap-2">
                        {(formData.identityType === "NRIC" ? [
                          { label: "Type", value: "NRIC" },
                          { label: "NRIC Number", value: formData.nricNumber || "—" },
                          { label: "Tax ID", value: formData.taxId || "—" },
                        ] : [
                          { label: "Type", value: "FIN" },
                          { label: "FIN Number", value: formData.finNumber || "—" },
                          { label: "Passport Number", value: formData.finPassportNumber || "—" },
                          { label: "Passport Expiry Date", value: formData.finPassportExpiryDate ? (() => {
                            const str = formData.finPassportExpiryDate;
                            if (str.includes("-")) {
                              const parts = str.split("-");
                              if (parts.length === 3 && parts[0].length === 4) {
                                return `${parts[2]}/${parts[1]}/${parts[0]}`;
                              }
                            }
                            return str;
                          })() : "—" },
                          { label: "Work Pass Type", value: formData.workPassType || "—" },
                        ]).map(r => (
                          <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-[#F2F2F7]">
                            <span className="text-[12px] text-[#8E8E93] font-medium">{r.label}</span>
                            <span className="text-[13px] font-semibold text-[#1C1C1E]">{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Work Details */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#007AFF] mb-3">Work Details</p>
                      <div className="flex flex-col gap-2">
                        {[
                          { label: "Employee ID", value: formData.empId || "—" },
                          { label: "Date of Joining", value: formData.dateOfJoining ? (() => { 
                            const str = formData.dateOfJoining;
                            if (str.includes("-")) {
                              const parts = str.split("-");
                              if (parts.length === 3 && parts[0].length === 4) {
                                return `${parts[2]}/${parts[1]}/${parts[0]}`;
                              }
                            }
                            return str;
                          })() : "—" },
                          { label: "Department", value: departments.find(d => String(d.id) === String(formData.departmentId))?.name || "—" },
                          { label: "App Role", value: formData.role || "—" },
                          { label: "Designation", value: formData.jobRole || "—" },
                          { label: "Job Type", value: formData.jobType || "—" },
                          { label: "Salary", value: formData.salary ? `S$ ${formData.salary}` : "—" },
                          { label: "Shift", value: formData.shiftType || "—" },
                          { label: "Overtime Applicable", value: formData.overtimeApplicable ? "Yes" : "No" },
                          { label: "Claims Applicable", value: formData.claimsApplicable ? "Yes" : "No" },
                        ].map(r => (
                          <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-[#F2F2F7]">
                            <span className="text-[12px] text-[#8E8E93] font-medium">{r.label}</span>
                            <span className="text-[13px] font-semibold text-[#1C1C1E]">{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#007AFF] mb-3">Emergency Contact</p>
                      <div className="flex flex-col gap-2">
                        {[
                          { label: "Name", value: formData.emergName || "—" },
                          { label: "Relation", value: formData.emergRelation || "—" },
                          { label: "Secondary Emergency Contact Number", value: formData.emergContact ? `${formData.emergContactCode} ${formData.emergContact}` : "—" },
                          { label: "Address", value: formData.emergAddress || "—" },
                        ].map(r => (
                          <div key={r.label} className="flex items-start justify-between gap-4 py-1.5 border-b border-[#F2F2F7]">
                            <span className="text-[12px] text-[#8E8E93] font-medium shrink-0">{r.label}</span>
                            <span className="text-[13px] font-semibold text-[#1C1C1E] text-right">{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Education */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#007AFF] mb-3">Education</p>
                      <div className="flex flex-col gap-2">
                        {formData.schoolingInstName && (
                          <div className="mb-2">
                            <p className="text-[12px] font-bold text-[#3C3C43]">Schooling</p>
                            {[
                              { label: "Institution", value: formData.schoolingInstName },
                              { label: "Qualification", value: formData.schoolingQual || "—" },
                              { label: "Grad Year", value: formData.schoolingGradYear || "—" },
                            ].map(r => (
                              <div key={r.label} className="flex items-center justify-between py-1 border-b border-[#F2F2F7]">
                                <span className="text-[11px] text-[#8E8E93] font-medium">{r.label}</span>
                                <span className="text-[12px] font-semibold text-[#1C1C1E]">{r.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {formData.higherEduInstName && (
                          <div>
                            <p className="text-[12px] font-bold text-[#3C3C43]">Higher Education</p>
                            {[
                              { label: "Institution", value: formData.higherEduInstName },
                              { label: "Course", value: formData.higherEduCourseName || "—" },
                              { label: "Course Duration", value: formData.higherEduCourseDuration || "—" },
                              { label: "Qualification", value: formData.higherEduQual || "—" },
                              { label: "Grad Year", value: formData.higherEduGradYear || "—" },
                            ].map(r => (
                              <div key={r.label} className="flex items-center justify-between py-1 border-b border-[#F2F2F7]">
                                <span className="text-[11px] text-[#8E8E93] font-medium">{r.label}</span>
                                <span className="text-[12px] font-semibold text-[#1C1C1E]">{r.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {!formData.schoolingInstName && !formData.higherEduInstName && (
                          <p className="text-[12px] text-[#8E8E93]">No education details provided.</p>
                        )}
                      </div>
                    </div>

                    {/* Medical / Insurance */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#007AFF] mb-3">Medical & Insurance</p>
                      <div className="flex flex-col gap-2">
                        {[
                          { label: "Blood Group", value: formData.bloodGroup || "—" },
                          { label: "Insurance Type", value: formData.insuranceType || "—" },
                          { label: "Provider", value: formData.insurProvider || "—" },
                          { label: "Policy Number", value: formData.insurPolicyNum || "—" },
                          { label: "Employee Covered", value: formData.empCovered },
                          { label: "Dependents Covered", value: formData.depsCovered },
                        ].map(r => (
                          <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-[#F2F2F7]">
                            <span className="text-[12px] text-[#8E8E93] font-medium">{r.label}</span>
                            <span className={`text-[13px] font-semibold ${r.value === "Yes" ? "text-[#34C759]" : r.value === "No" ? "text-[#FF3B30]" : "text-[#1C1C1E]"}`}>{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bank Details */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#007AFF] mb-3">Bank Details</p>
                      <div className="flex flex-col gap-2">
                        {[
                          { label: "Bank Name", value: formData.bankName || "—" },
                          { label: "Account Holder Name", value: formData.accountHolder || "—" },
                          { label: "Account Number", value: formData.accountNum || "—" },
                          { label: "Online Payment Method", value: formData.onlinePaymentType || "—" },
                          { label: "Online Payment ID/Number", value: formData.onlinePaymentId || "—" },
                          { label: "Salary Payment Mode", value: formData.salaryPaymentMode || "—" },
                        ].map(r => (
                          <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-[#F2F2F7]">
                            <span className="text-[12px] text-[#8E8E93] font-medium">{r.label}</span>
                            <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white">{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Certifications */}
                    {formData.certifications?.some((c: any) => c.certName) && (
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#007AFF] mb-3">Certifications</p>
                        <div className="flex flex-col gap-3">
                          {formData.certifications.filter((c: any) => c.certName).map((cert: any, i: number) => (
                            <div key={i} className="p-3 bg-[#F2F7FF] rounded-[10px]">
                              <p className="text-[13px] font-bold text-[#1C1C1E]">{cert.certName}</p>
                              <p className="text-[11px] text-[#8E8E93] font-medium mt-0.5">{cert.issuingOrg}{cert.certNumber ? ` · #${cert.certNumber}` : ""}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Fields */}
                    {customFieldsConfig.length > 0 && (
                      <div className="md:col-span-2">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#007AFF] mb-3">Custom Details</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {customFieldsConfig.map((field: any) => (
                            <div key={field.id} className="flex items-center justify-between py-1.5 border-b border-[#F2F2F7]">
                              <span className="text-[12px] text-[#8E8E93] font-medium">{field.label}</span>
                              <span className="text-[13px] font-semibold text-[#1C1C1E]">
                                {(formData as any)[field.id] instanceof File ? (formData as any)[field.id].name : ((formData as any)[field.id] || "—")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* ── Declarations Card ── */}
                <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-8">
                  <SectionHeader title="Declarations & Signature" subtitle="Please review and confirm your details before submitting." />

                  <div className="flex flex-col gap-6">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={formData.termsAccepted} 
                        onChange={e => {
                          const val = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            termsAccepted: val,
                            privacyConsent: val,
                            empDeclaration: val,
                            submitConfirmation: val
                          }));
                        }} 
                        className="mt-1 w-4 h-4 rounded text-[#007AFF] focus:ring-[#007AFF] border-gray-300 transition-all active:scale-90" 
                      />
                      <div className="space-y-1">
                        <p className="text-[14px] font-bold text-gray-900">Terms, Conditions & Privacy Consent</p>
                        <p className="text-[13px] text-gray-600 font-medium leading-relaxed">
                          I agree to Dort Asia's terms and conditions and I consent to the collection and processing of my EMployee's Personal data.
                        </p>
                      </div>
                    </label>

                    <div className="pt-6 border-t border-gray-100">
                      <Label>Digital Signature</Label>
                      <input 
                        type="text" 
                        placeholder="Type your full name as signature" 
                        value={formData.digitalSignature} 
                        onChange={e => handleChange('digitalSignature', e.target.value)} 
                        className="h-11 px-3 w-full max-w-[400px] bg-white border border-[#E5E5EA] rounded-[8px] text-[14px] font-bold text-gray-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all" 
                      />
                      <p className="text-[11px] text-gray-400 mt-2 font-medium italic">Please verify your full name above as your digital signature.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}


          </div>
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#E5E5EA] px-8 py-4 flex items-center justify-between z-20">
          <div className="max-w-[1000px] mx-auto w-full flex items-center justify-between">
            <button onClick={handlePrev} disabled={currentStep === 1} className={`flex items-center gap-2 px-4 py-2.5 rounded-[8px] border border-[#E5E5EA] text-[14px] font-bold transition-colors bg-white ${currentStep === 1 ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-[#1C1C1E] hover:bg-gray-50'}`}>
              <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
              Back
            </button>
            <button onClick={currentStep === lastStepId ? handleSubmitProfile : handleNext} disabled={saving || (currentStep === lastStepId && (!formData.termsAccepted || !formData.digitalSignature))} className="flex items-center gap-2 px-6 py-2.5 rounded-[8px] bg-[#007AFF] text-white text-[14px] font-bold hover:bg-[#0062CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Saving...' : currentStep === lastStepId ? 'Complete' : 'Next'}
              {!saving && currentStep !== lastStepId && <ArrowRight className="h-4 w-4" strokeWidth={2.5} />}
            </button>
          </div>
        </div>

      </div>

      {/* Profile Photo Cropper Popup Modal */}
      {isEditingPic && rawPic && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 transition-opacity duration-300">
          <div className="bg-white dark:bg-[#1A1A1E] w-full max-w-[480px] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-gray-900 dark:text-white">Adjust Photo</h3>
              <button
                onClick={() => setIsEditingPic(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors text-gray-500 dark:text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="relative w-full aspect-square bg-[#F8F9FA] dark:bg-[#121217]">
              {/* @ts-ignore - React 19 typing mismatch with react-easy-crop */}
              <Cropper
                image={rawPic}
                crop={crop}
                zoom={picZoom}
                maxZoom={10}
                aspect={1}
                cropShape={"round"}
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setPicZoom}
                style={{
                  containerStyle: { background: "transparent" },
                  cropAreaStyle: { border: "2px solid #007AFF", boxShadow: "0 0 0 9999em rgba(0, 0, 0, 0.6)", borderRadius: "50%" }
                }}
              />
              <div className="absolute right-4 bottom-4 flex flex-col gap-2 z-10">
                <button 
                  onClick={(e) => { e.preventDefault(); setPicZoom(z => Math.min(z + 0.5, 10)); }} 
                  className="w-10 h-10 bg-white dark:bg-[#1A1A1E] shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 transition border border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-300"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button 
                  onClick={(e) => { e.preventDefault(); setPicZoom(z => Math.max(z - 0.5, 1)); }} 
                  className="w-10 h-10 bg-white dark:bg-[#1A1A1E] shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 transition border border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-300"
                >
                  <Minus className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-5 bg-white dark:bg-[#1A1A1E] border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
              <button 
                type="button"
                onClick={() => setIsEditingPic(false)}
                className="px-4 py-2.5 text-[15px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmCrop} 
                className="px-8 py-2.5 bg-[#007AFF] text-white text-[15px] font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
              >
                Use Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

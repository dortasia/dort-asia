"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronDown, Save, ArrowRight, ArrowLeft, Calendar,
  UploadCloud, CheckCircle2, Plus, Minus, Trash2, X, FileText, Eye, Upload, Check, Download, Info, RotateCcw,
  CircleUser, Fingerprint, BriefcaseBusiness, Wallet, Phone, ShieldAlert, GraduationCap, Award, Stethoscope, Landmark, Settings, Wand2, Sparkles, Loader2, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { getUserAvatarUrl } from "@/utils/avatarColor";
import Cropper from "react-easy-crop";
import { calculateCPF, calculateSDL, calculateSHG } from "@/utils/taxCalculator";
import { calculateFWL, QuotaCounts, FWLResult } from "@/utils/fwlCalculator";
import { uploadToCompanyStorage, uploadEmployeeProfilePhoto } from "@/utils/storageHelper";

const calculateFWLWithDb = (
  counts: QuotaCounts,
  sector: string,
  passType: string,
  skill: string,
  rates: any[]
): FWLResult => {
  if (!rates || rates.length === 0) {
    return calculateFWL(counts, sector, passType, skill);
  }

  const isSPass = (passType || "").toLowerCase().includes("s pass");
  const isWorkPermit = (passType || "").toLowerCase().includes("work permit");

  if (!isSPass && !isWorkPermit) {
    return { tier: 'Flat', levy: 0, ratio: 0, maxDrc: 0 };
  }

  // 1. S Pass
  if (isSPass) {
    const sPassRate = rates.find(r => r.pass_type === 'S Pass')?.monthly_rate;
    return { tier: 'Flat', levy: sPassRate != null ? parseFloat(String(sPassRate)) : 650, ratio: 0, maxDrc: 0 };
  }

  // 2. Work Permit
  const localQuotaCount = counts.localFullCount + (counts.localHalfCount * 0.5);
  const newWPCount = counts.workPermitCount + 1;
  const totalForeign = counts.sPassCount + newWPCount;
  const totalWorkforce = localQuotaCount + totalForeign;
  
  const ratio = totalWorkforce > 0 ? (totalForeign / totalWorkforce) : 1;
  const normalizedSector = (sector || "").toLowerCase().trim();
  const isR1 = (skill || "").includes("R1") || (skill || "").toLowerCase().includes("higher-skilled");
  const skillStr = isR1 ? "R1" : "R2";

  // Filter rates for this sector and pass type
  const sectorRates = rates.filter(r => 
    r.pass_type === 'Work Permit' && 
    r.sector.toLowerCase() === normalizedSector
  );

  let tier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Flat' | 'Exceeded' = 'Tier 1';
  let levy = 0;
  let maxDrc = 0.35;

  if (sectorRates.length > 0) {
    const maxRatio = Math.max(...sectorRates.map(r => parseFloat(String(r.ratio_max))));
    maxDrc = maxRatio;

    const isFlatSector = sectorRates.some(r => r.tier === 'Flat');
    if (isFlatSector) {
      const match = sectorRates.find(r => r.tier === 'Flat' && r.skill_level === skillStr);
      tier = 'Flat';
      levy = match ? parseFloat(String(match.monthly_rate)) : 300;
    } else {
      const matchedRate = sectorRates.find(r => 
        r.skill_level === skillStr && 
        ratio > parseFloat(String(r.ratio_min)) && 
        ratio <= parseFloat(String(r.ratio_max))
      );

      if (matchedRate) {
        tier = matchedRate.tier as any;
        levy = parseFloat(String(matchedRate.monthly_rate));
      } else if (ratio > maxRatio) {
        tier = 'Exceeded';
        const highestTierMatch = sectorRates
          .filter(r => r.skill_level === skillStr)
          .sort((a, b) => parseFloat(String(b.ratio_max)) - parseFloat(String(a.ratio_max)))[0];
        levy = highestTierMatch ? parseFloat(String(highestTierMatch.monthly_rate)) : 300;
      }
    }
  } else {
    return calculateFWL(counts, sector, passType, skill);
  }

  return {
    tier,
    levy,
    ratio: Math.round(ratio * 1000) / 10,
    maxDrc: maxDrc * 100
  };
};

const getStepIcon = (label: string) => {
  const normalized = label.toLowerCase();
  if (normalized.includes("personal")) return CircleUser;
  if (normalized.includes("identity")) return Fingerprint;
  if (normalized.includes("work")) return BriefcaseBusiness;
  if (normalized.includes("salary") || normalized.includes("tax")) return Wallet;
  if (normalized.includes("contact")) {
    if (normalized.includes("emergency")) return ShieldAlert;
    return Phone;
  }
  if (normalized.includes("education")) return GraduationCap;
  if (normalized.includes("certif")) return Award;
  if (normalized.includes("medical") || normalized.includes("insurance")) return Stethoscope;
  if (normalized.includes("bank")) return Landmark;
  if (normalized.includes("custom")) return Settings;
  return CheckCircle2; // Default for Review & Submit or anything else
};

// --- CUSTOM UI COMPONENTS ---

const Label = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
  <label className="type-caption font-medium text-[#161616] dark:text-white mb-1.5 flex items-center gap-1">
    {children} {required && <span className="text-[#FF3B30]">*</span>}
  </label>
);

const CustomSelect = ({ value, onChange, options, placeholder = "Select", disabled = false }: any) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleSelect = (val: any) => {
    onChange(val);
    setIsOpen(false);
  };

  const selectedOption = options.find((opt: any) => (opt.value || opt) === value);
  const displayLabel = selectedOption ? (selectedOption.label || selectedOption) : placeholder;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`h-11 px-3 w-full bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-white/10 rounded-md type-body-medium text-[#161616] dark:text-white flex items-center justify-between transition-all cursor-pointer focus:border-[#161616] dark:focus:border-white focus:ring-1 focus:ring-[#161616]/10 outline-none ${disabled ? 'opacity-60 bg-[#FAFAF9] dark:bg-zinc-800 cursor-not-allowed text-[#737373] border-gray-200' : ''}`}
      >
        <span className={value ? "text-[#161616] dark:text-white" : "text-[#A3A3A3] dark:text-gray-500"}>
          {displayLabel}
        </span>
        <ChevronDown className={`h-4 w-4 text-[#8E8E93] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} strokeWidth={2} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-white/10 rounded-xl z-[999] p-1.5 max-h-[250px] overflow-y-auto page-scrollbar flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150 shadow-md">
          {options.map((opt: any) => {
            const optVal = opt.value || opt;
            const optLabel = opt.label || opt;
            const isSelected = optVal === value;
            return (
              <button
                key={optVal}
                type="button"
                onClick={() => handleSelect(optVal)}
                className={`w-full text-left px-3 py-2 text-[13px] font-semibold rounded-md hover:bg-[#FAFAF9] dark:hover:bg-white/5 transition-colors ${isSelected ? "bg-black/5 dark:bg-white/10 text-black dark:text-white font-bold" : "text-gray-700 dark:text-gray-300"}`}
              >
                {optLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const COUNTRY_CODES: { [key: string]: string } = {
  "Afghanistan": "af", "Albania": "al", "Algeria": "dz", "Andorra": "ad", "Angola": "ao", "Argentina": "ar", "Armenia": "am", "Australia": "au", "Austria": "at", "Azerbaijan": "az",
  "Bahamas": "bs", "Bahrain": "bh", "Bangladesh": "bd", "Barbados": "bb", "Belarus": "by", "Belgium": "be", "Belize": "bz", "Benin": "bj", "Bhutan": "bt", "Bolivia": "bo", "Bosnia and Herzegovina": "ba", "Brazil": "br", "Brunei": "bn", "Bulgaria": "bg", "Burma (Myanmar)": "mm",
  "Cambodia": "kh", "Cameroon": "cm", "Canada": "ca", "Chile": "cl", "China": "cn", "Colombia": "co", "Costa Rica": "cr", "Croatia": "hr", "Cuba": "cu", "Cyprus": "cy", "Czech Republic": "cz",
  "Denmark": "dk", "Djibouti": "dj", "Dominica": "dm", "Dominican Republic": "do",
  "Ecuador": "ec", "Egypt": "eg", "El Salvador": "sv", "Estonia": "ee", "Ethiopia": "et",
  "Fiji": "fj", "Finland": "fi", "France": "fr",
  "Gabon": "ga", "Gambia": "gm", "Georgia": "ge", "Germany": "de", "Ghana": "gh", "Greece": "gr", "Guatemala": "gt", "Guyana": "gy",
  "Haiti": "ht", "Honduras": "hn", "Hungary": "hu",
  "Iceland": "is", "India": "in", "Indonesia": "id", "Iran": "ir", "Iraq": "iq", "Ireland": "ie", "Israel": "il", "Italy": "it", "Ivory Coast": "ci",
  "Jamaica": "jm", "Japan": "jp", "Jordan": "jo",
  "Kazakhstan": "kz", "Kenya": "ke", "Kuwait": "kw", "Kyrgyzstan": "kg",
  "Laos": "la", "Latvia": "lv", "Lebanon": "lb", "Liberia": "lr", "Libya": "ly", "Liechtenstein": "li", "Lithuania": "lt", "Luxembourg": "lu",
  "Macedonia": "mk", "Madagascar": "mg", "Malawi": "mw", "Malaysia": "my", "Maldives": "mv", "Mali": "ml", "Malta": "mt", "Mauritius": "mu", "Mexico": "mx", "Moldova": "md", "Monaco": "mc", "Mongolia": "mn", "Montenegro": "me", "Morocco": "ma", "Mozambique": "mz",
  "Namibia": "na", "Nepal": "np", "Netherlands": "nl", "New Zealand": "nz", "Nicaragua": "ni", "Niger": "ne", "Nigeria": "ng", "Norway": "no",
  "Oman": "om",
  "Pakistan": "pk", "Panama": "pa", "Paraguay": "py", "Peru": "pe", "Philippines": "ph", "Poland": "pl", "Portugal": "pt",
  "Qatar": "qa",
  "Romania": "ro", "Russia": "ru", "Rwanda": "rw",
  "Saudi Arabia": "sa", "Senegal": "sn", "Serbia": "rs", "Seychelles": "sc", "Sierra Leone": "sl", "Singapore": "sg", "Slovakia": "sk", "Slovenia": "si", "Somalia": "so", "South Africa": "za", "South Korea": "kr", "Spain": "es", "Sri Lanka": "lk", "Sudan": "sd", "Sweden": "se", "Switzerland": "ch", "Syria": "sy",
  "Taiwan": "tw", "Tajikistan": "tj", "Tanzania": "tz", "Thailand": "th", "Togo": "tg", "Trinidad and Tobago": "tt", "Tunisia": "tn", "Turkey": "tr",
  "Uganda": "ug", "Ukraine": "ua", "United Arab Emirates": "ae", "United Kingdom": "gb", "United States": "us", "Uruguay": "uy", "Uzbekistan": "uz",
  "Venezuela": "ve", "Vietnam": "vn",
  "Yemen": "ye",
  "Zambia": "zm", "Zimbabwe": "zw"
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

const getCountryFlagUrl = (countryName: string): string => {
  const code = COUNTRY_CODES[countryName];
  if (!code) return "";
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
};

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

  const filtered = GLOBAL_COUNTRIES.filter(n =>
    n.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setSearchQuery("");
    setIsOpen(false);
  };

  const flagUrl = getCountryFlagUrl(value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-11 px-3 w-full bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-white/10 rounded-md type-body-medium text-[#161616] dark:text-white flex items-center justify-between cursor-pointer focus:border-[#161616] dark:focus:border-white focus:ring-1 focus:ring-[#161616]/10 transition-all select-none outline-none text-left"
      >
        <span className={value ? "text-[#161616] dark:text-white flex items-center gap-2" : "text-[#A3A3A3] dark:text-gray-500"}>
          {flagUrl ? (
            <img src={flagUrl} alt={value} className="w-5 h-3.5 object-cover rounded-[2px] border border-gray-200 dark:border-white/10 shrink-0" />
          ) : (
            <span className="text-base leading-none">🏳️</span>
          )}
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-[#8E8E93] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} strokeWidth={2} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-white/10 rounded-xl z-[999] p-2 max-h-[300px] flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-150 shadow-md">
          <input
            type="text"
            placeholder="Search country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 px-3 w-full bg-gray-50 dark:bg-[#121217] border border-[#ECECEC] dark:border-white/10 rounded-md text-[12px] font-semibold text-black dark:text-white outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
            autoFocus
          />
          <div className="flex-1 overflow-y-auto page-scrollbar max-h-[220px] flex flex-col gap-0.5">
            {filtered.map((country) => {
              const fUrl = getCountryFlagUrl(country);
              const isSelected = value === country;
              return (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full text-left px-3 py-2 text-[13px] font-semibold rounded-md hover:bg-[#FAFAF9] dark:hover:bg-white/5 transition-colors flex items-center gap-2.5 ${isSelected ? "bg-black/5 dark:bg-white/10 text-black dark:text-white font-bold" : "text-gray-700 dark:text-gray-300"}`}
                >
                  {fUrl ? (
                    <img src={fUrl} alt={country} className="w-5 h-3.5 object-cover rounded-[2px] border border-gray-200 dark:border-white/10 shrink-0" />
                  ) : (
                    <span className="text-base leading-none">🏳️</span>
                  )}
                  {country}
                </button>
              );
            })}
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

  const flagUrl = getCountryFlagUrl(value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-11 px-3 w-full bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-white/10 rounded-md type-body-medium text-[#161616] dark:text-white flex items-center justify-between cursor-pointer focus:border-[#161616] dark:focus:border-white focus:ring-1 focus:ring-[#161616]/10 transition-all select-none outline-none text-left"
      >
        <span className={value ? "text-[#161616] dark:text-[#161616] flex items-center gap-2" : "text-[#A3A3A3] dark:text-gray-500"}>
          {flagUrl ? (
            <img src={flagUrl} alt={value} className="w-5 h-3.5 object-cover rounded-[2px] border border-gray-200 dark:border-white/10 shrink-0" />
          ) : (
            <span className="text-base leading-none">🏳️</span>
          )}
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-[#8E8E93] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} strokeWidth={2} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-white/10 rounded-xl z-[999] p-2 max-h-[300px] flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-150 shadow-md">
          <input
            type="text"
            placeholder="Search country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 px-3 w-full bg-gray-50 dark:bg-[#121217] border border-[#ECECEC] dark:border-white/10 rounded-md text-[12px] font-semibold text-black dark:text-white outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
            autoFocus
          />
          <div className="flex-1 overflow-y-auto page-scrollbar max-h-[220px] flex flex-col gap-0.5">
            {filtered.map((country) => {
              const fUrl = getCountryFlagUrl(country);
              const isSelected = value === country;
              return (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full text-left px-3 py-2 text-[13px] font-semibold rounded-md hover:bg-[#FAFAF9] dark:hover:bg-white/5 transition-colors flex items-center gap-2.5 ${isSelected ? "bg-black/5 dark:bg-white/10 text-black dark:text-white font-bold" : "text-gray-700 dark:text-gray-300"}`}
                >
                  {fUrl ? (
                    <img src={fUrl} alt={country} className="w-5 h-3.5 object-cover rounded-[2px] border border-gray-200 dark:border-white/10 shrink-0" />
                  ) : (
                    <span className="text-base leading-none">🏳️</span>
                  )}
                  {country}
                </button>
              );
            })}
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
      <button
        type="button"
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        disabled={isDisabled}
        className={`h-11 px-3 w-full bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-white/10 rounded-md type-body-medium text-[#161616] dark:text-white flex items-center justify-between cursor-pointer focus:border-[#161616] dark:focus:border-white focus:ring-1 focus:ring-[#161616]/10 transition-all select-none outline-none text-left ${isDisabled ? 'opacity-60 bg-gray-50 dark:bg-zinc-800 cursor-not-allowed text-[#737373] border-gray-200' : ''}`}
      >
        <span>{isDisabled ? "Select Department first" : (value || "Select Designation")}</span>
        <ChevronDown className={`h-4 w-4 text-[#8E8E93] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} strokeWidth={2} />
      </button>

      {isOpen && !isDisabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-white/10 rounded-xl z-[999] p-2 max-h-[300px] flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-150 shadow-md">
          <input
            type="text"
            placeholder="Search designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 px-3 w-full bg-gray-50 dark:bg-[#121217] border border-[#ECECEC] dark:border-white/10 rounded-md text-[12px] font-semibold text-black dark:text-white outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
            autoFocus
          />
          <div className="flex-1 overflow-y-auto page-scrollbar max-h-[220px] flex flex-col gap-0.5">
            {filtered.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleSelect(d)}
                className={`w-full text-left px-3 py-2 text-[13px] font-semibold rounded-md hover:bg-[#FAFAF9] dark:hover:bg-white/5 transition-colors ${value === d ? "bg-black/5 dark:bg-white/10 text-black dark:text-white font-bold" : "text-gray-700 dark:text-gray-300"}`}
              >
                {d}
              </button>
            ))}

            {showAddOption && (
              <button
                type="button"
                onClick={handleAdd}
                className="w-full text-left px-3 py-2 text-[13px] font-bold text-black dark:text-white rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-t border-gray-100 dark:border-white/5 mt-1 text-left"
              >
                + Add "{searchQuery.trim()}"
              </button>
            )}

            {filtered.length === 0 && !showAddOption && (
              <span className="text-[12px] text-gray-400 py-3 text-center block">No designations available</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PhoneInput = ({ code, number, onCodeChange, onNumberChange, placeholder = "9123 4567", codeOptions = ["+65"] }: any) => {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="flex gap-2 h-11 w-full">
      <div className="w-[95px] shrink-0 relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="h-full px-3 w-full bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-white/10 rounded-md type-body-medium text-[#161616] dark:text-white flex items-center justify-between cursor-pointer focus:border-[#161616] dark:focus:border-white focus:ring-1 focus:ring-[#161616]/10 outline-none"
        >
          <span>{code}</span>
          <ChevronDown className={`h-3 w-3 text-[#8E8E93] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-white/10 rounded-xl z-[999] p-1 shadow-md max-h-[150px] overflow-y-auto page-scrollbar flex flex-col gap-0.5">
            {codeOptions.map((opt: string) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onCodeChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 type-caption font-semibold rounded-md hover:bg-[#FAFAF9] dark:hover:bg-white/5 transition-colors ${code === opt ? "bg-black/5 dark:bg-white/10 text-[#161616] dark:text-white font-bold" : "text-[#737373] dark:text-gray-300"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
      <input
        type="text"
        value={number}
        onChange={(e) => onNumberChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-white/10 rounded-md type-body-medium text-[#161616] dark:text-white placeholder:text-[#A3A3A3] dark:placeholder:text-gray-500 outline-none focus:border-[#161616] dark:focus:border-white focus:ring-1 focus:ring-[#161616]/10"
      />
    </div>
  );
};

const DateInput = ({ value, onChange, placeholder = "Select Date", disabled = false }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showMonthSelect, setShowMonthSelect] = useState(false);
  const [showYearSelect, setShowYearSelect] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse current date or use today
  const parsedDate = value ? new Date(value) : new Date();
  const [currentYear, setCurrentYear] = useState(parsedDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(parsedDate.getMonth()); // 0-11

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowMonthSelect(false);
        setShowYearSelect(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync state if external value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [value]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) - 6 (Sat)

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const yyyy = currentYear;
    const mm = String(currentMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  // Format display date: DD/MM/YYYY
  let displayValue = "";
  if (value && value.includes("-")) {
    const [y, m, d] = value.split("-");
    displayValue = `${d}/${m}/${y}`;
  }

  // Generate calendar grid array
  const gridCells = [];
  for (let i = 0; i < startDayIndex; i++) {
    gridCells.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    gridCells.push(i);
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`h-11 px-3 w-full bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-white/10 rounded-md type-body-medium text-[#161616] dark:text-white flex items-center justify-between cursor-pointer focus:border-[#161616] dark:focus:border-white focus:ring-1 focus:ring-[#161616]/10 transition-all select-none outline-none text-left ${disabled ? 'opacity-60 bg-gray-50 dark:bg-zinc-800 cursor-not-allowed text-[#737373] border-gray-200' : ''}`}
      >
        <span className={value ? "text-[#161616] dark:text-white" : "text-[#A3A3A3] dark:text-gray-500"}>
          {displayValue || placeholder}
        </span>
        <Calendar className="h-4 w-4 text-[#8E8E93]" strokeWidth={2} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-white/10 rounded-xl z-[999] p-3 w-[265px] animate-in fade-in slide-in-from-top-1 duration-150 shadow-md">
          {/* Header controls */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={showMonthSelect || showYearSelect}
              className="p-1 hover:bg-[#FAFAF9] dark:hover:bg-white/5 rounded-md text-gray-600 dark:text-gray-300 disabled:opacity-30"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setShowMonthSelect(!showMonthSelect);
                  setShowYearSelect(false);
                }}
                className={`hover:bg-[#FAFAF9] dark:hover:bg-white/5 px-1.5 py-0.5 rounded text-[12px] font-bold transition-colors ${showMonthSelect ? 'bg-neutral-100 text-neutral-800 dark:bg-white/10 dark:text-neutral-200' : 'text-black dark:text-white'}`}
              >
                {months[currentMonth].substring(0, 3)}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowYearSelect(!showYearSelect);
                  setShowMonthSelect(false);
                }}
                className={`hover:bg-[#FAFAF9] dark:hover:bg-white/5 px-1.5 py-0.5 rounded text-[12px] font-bold transition-colors ${showYearSelect ? 'bg-neutral-100 text-neutral-800 dark:bg-white/10 dark:text-neutral-200' : 'text-black dark:text-white'}`}
              >
                {currentYear}
              </button>
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              disabled={showMonthSelect || showYearSelect}
              className="p-1 hover:bg-[#FAFAF9] dark:hover:bg-white/5 rounded-md text-gray-600 dark:text-gray-300 disabled:opacity-30"
            >
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Month selector view */}
          {showMonthSelect && (
            <div className="grid grid-cols-3 gap-1.5 py-2 animate-in fade-in zoom-in-95 duration-100">
              {months.map((m, idx) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setCurrentMonth(idx);
                    setShowMonthSelect(false);
                  }}
                  className={`py-2 text-[11px] font-semibold rounded-md hover:bg-[#FAFAF9] dark:hover:bg-white/5 transition-colors ${currentMonth === idx ? 'bg-black text-white dark:bg-white dark:text-black font-bold' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  {m.substring(0, 3)}
                </button>
              ))}
            </div>
          )}

          {/* Year selector view */}
          {showYearSelect && (
            <div className="max-h-[170px] overflow-y-auto page-scrollbar grid grid-cols-3 gap-1.5 py-1.5 animate-in fade-in zoom-in-95 duration-100">
              {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() + 5 - i).map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setCurrentYear(y);
                    setShowYearSelect(false);
                  }}
                  className={`py-1.5 text-[11px] font-semibold rounded-md hover:bg-[#FAFAF9] dark:hover:bg-white/5 transition-colors ${currentYear === y ? 'bg-black text-white dark:bg-white dark:text-black font-bold' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Standard day grid view */}
          {!showMonthSelect && !showYearSelect && (
            <>
              <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-gray-400 uppercase mb-1">
                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {gridCells.map((day, idx) => {
                  if (day === null) return <div key={`empty-${idx}`} className="h-6 w-6" />;
                  
                  const isSelected = value && (() => {
                    const parts = value.split("-");
                    return parseInt(parts[0]) === currentYear && (parseInt(parts[1]) - 1) === currentMonth && parseInt(parts[2]) === day;
                  })();

                  return (
                    <button
                      key={`day-${day}`}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={`h-6 w-6 text-[11px] font-semibold rounded-md flex items-center justify-center transition-all ${isSelected ? "bg-black dark:bg-white text-white dark:text-black font-bold" : "text-gray-700 dark:text-gray-300 hover:bg-[#FAFAF9] dark:hover:bg-white/5"}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const FileUpload = ({ value, onChange, label: uploadLabel, empName, empId }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  // Compute formatted custom name: [Label]_[Employee_First_Name]_[Employee_ID]
  let displayCustomName = "";
  if (empName || empId) {
    const cleanLabel = (uploadLabel || "Document").replace(/\s+/g, "_");
    const fName = (empName || "Employee").replace(/\s+/g, "_");
    const eId = (empId || "New").replace(/\s+/g, "_");
    displayCustomName = `${cleanLabel}_${fName}_${eId}`;
  }

  const getFileName = (val: any) => {
    if (!val) return "Click to upload";
    if (val instanceof File) {
       if (displayCustomName) return displayCustomName;
       return val.name;
    }
    if (typeof val === "string") {
      let ext = "";
      const noQuery = val.split('?')[0];
      const dotParts = noQuery.split('.');
      if (dotParts.length > 1) {
        ext = '.' + dotParts[dotParts.length - 1];
      }
      if (displayCustomName) return `${displayCustomName}${ext}`;

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
          className={`text-[13px] font-medium truncate pr-4 transition-colors ${hasFile
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
              <>
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
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    setPreviewing(true);
                    try {
                      const supabase = createClient();
                      const { data, error } = await supabase.storage.from("private_data").download(value);
                      if (error) throw error;
                      const url = window.URL.createObjectURL(data);
                      const a = document.createElement('a');
                      a.href = url;
                      
                      let ext = "";
                      const noQuery = value.split('?')[0];
                      const dotParts = noQuery.split('.');
                      if (dotParts.length > 1) ext = '.' + dotParts[dotParts.length - 1];
                      a.download = displayCustomName ? `${displayCustomName}${ext}` : getFileName(value);
                      
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                    } catch (err: any) {
                      console.error("Download failed:", err);
                      alert("Failed to download document: " + err.message);
                    } finally {
                      setPreviewing(false);
                    }
                  }}
                  disabled={previewing}
                  className="p-1 hover:bg-[#F2F2F7] rounded transition-colors text-gray-500 hover:text-[#007AFF]"
                  title="Download document"
                >
                  <Download className="h-4 w-4" />
                </button>
              </>
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
                    Supported: PDF, JPG, PNG
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
    <h3 className="type-h3 font-semibold text-[#161616] dark:text-white">{title}</h3>
    {subtitle && <p className="type-small text-[#737373] mt-0.5">{subtitle}</p>}
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

const NATIONALITY_OPTIONS = ["Singapore", "China", "Malaysia", "Bangladesh", "Philippines", "India"];

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

export default function EditEmployeePage() {
  const params = useParams();
  const employeeId = params?.id as string;
  const router = useRouter();
  const initialFormDataRef = useRef<any>(null);
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

  // Save Draft Warning Dialog States
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);
  const [dontShowSaveDraftWarning, setDontShowSaveDraftWarning] = useState(false);

  const handleSaveDraftClick = () => {
    const hideWarning = localStorage.getItem("hide_save_draft_warning") === "true";
    if (hideWarning) {
      persistEmployee({ redirect: false });
    } else {
      setShowSaveDraftModal(true);
    }
  };

  const confirmSaveDraft = () => {
    if (dontShowSaveDraftWarning) {
      localStorage.setItem("hide_save_draft_warning", "true");
    }
    setShowSaveDraftModal(false);
    persistEmployee({ redirect: false });
  };

  // Profile Photo Cropper State
  const [isEditingPic, setIsEditingPic] = useState(false);
  const [rawPic, setRawPic] = useState<string | null>(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  // Back button tracking
  const [backLabel, setBackLabel] = useState("Back to Profile");
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && document.referrer) {
      const ref = document.referrer;
      const host = window.location.host;
      if (ref.includes(host)) {
        setHasHistory(true);
        if (/\/employees\/[^\/]+$/.test(ref) && !ref.endsWith("/edit") && !ref.endsWith("/employees")) {
          setBackLabel("Back to Profile");
        } else if (ref.endsWith("/employees") || ref.endsWith("/employees/")) {
          setBackLabel("Back to Directory");
        } else {
          setBackLabel("Back");
        }
        return;
      }
    }
    // Fallback if no history/referrer
    setBackLabel("Back to Profile");
  }, []);
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
    { id: 4, label: "Salary & tax" },
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

  const [isDeptAlreadyAssigned, setIsDeptAlreadyAssigned] = useState(false);
  const [isTaxEdited, setIsTaxEdited] = useState(false);
  const [companySector, setCompanySector] = useState("");
  const [showConfirmAutoCal, setShowConfirmAutoCal] = useState(false);
  const [showCalcSummary, setShowCalcSummary] = useState(false);
  const [isAutoCalculating, setIsAutoCalculating] = useState(false);
  const [fwlRates, setFwlRates] = useState<any[]>([]);
  const [showTaxCalculatedPopup, setShowTaxCalculatedPopup] = useState(false);
  const [pendingCalculatedTax, setPendingCalculatedTax] = useState<any>(null);
  const [autoCalProgress, setAutoCalProgress] = useState(0);
  const [autoCalMessage, setAutoCalMessage] = useState("");
  const [previousTaxData, setPreviousTaxData] = useState<any>(null);
  const [quotaData, setQuotaData] = useState({
    localFullCount: 0,
    localHalfCount: 0,
    sPassCount: 0,
    workPermitCount: 0,
  });

  const [formData, setFormData] = useState({
    // Step 1: Basic Details
    firstName: "", lastName: "", dob: "", gender: "", maritalStatus: "", nationality: "", race: "", religion: "", profilePhotoUrl: "",
    linkedinUrl: "", instagramUrl: "",

    // Step 2: Identity
    identityType: "NRIC", // NRIC or FIN
    // NRIC
    nricNumber: "", nricResidentialStatus: "", cpfLinkedStatus: "", taxId: "", nricCopyUrl: "",
    // FIN
    finNumber: "", finPassportNumber: "", passType: "", passNumber: "", passIssueDate: "", passExpiryDate: "", finPassportExpiryDate: "", finIssuingCountry: "", finCardUrl: "", finPassportCopyUrl: "", passCopyUrl: "",
    workPermitSkill: "",

    empId: "", dateOfJoining: "", departmentId: "", role: "Employee", jobRole: "", jobType: "Full Time", contractEndDate: "",
    salary: "", salaryNotApplicable: false, shiftType: "Standard", overtimeApplicable: false, claimsApplicable: false, isActive: true,
    overtimeWorkingHours: "", overtimePeriod: "monthly", overtimeMaxLimit: "",
    monthlyTaxEstimate: "0.00", shgContribution: "None", shgAmount: "0.00", sdlApplicable: "Yes", foreignWorkerLevy: "0.00",
    allowances: [{ name: "", amount: "" }],
    customCpfEmployee: "0.00", customCpfEmployer: "0.00", customSdl: "0.00",
    customCpfEmployeeRate: "0.00", customCpfEmployerRate: "0.00", customSdlRate: "0.00",
    customCdacRate: undefined as string | undefined, customCdacAmount: undefined as string | undefined, customSindaRate: undefined as string | undefined, customSindaAmount: undefined as string | undefined, customMbmfRate: undefined as string | undefined, customMbmfAmount: undefined as string | undefined, customEcfRate: undefined as string | undefined, customEcfAmount: undefined as string | undefined, customIncomeTaxRate: undefined as string | undefined, customIncomeTaxAmount: undefined as string | undefined,
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

  const getStepCompletionPercent = (stepId: number, data: any): number => {
    switch (stepId) {
      case 1: {
        const fields = [data.firstName, data.lastName, data.dob, data.gender, data.maritalStatus, data.nationality];
        const filled = fields.filter(f => f && String(f).trim() !== "").length;
        return Math.round((filled / fields.length) * 100);
      }
      case 2: {
        let fields: any[] = [];
        if (data.identityType === "NRIC") {
          fields = [data.nricNumber, data.nricResidentialStatus, data.cpfLinkedStatus];
        } else {
          fields = [data.finNumber, data.finPassportNumber, data.passType, data.passNumber];
        }
        const filled = fields.filter(f => f && String(f).trim() !== "").length;
        return Math.round((filled / fields.length) * 100);
      }
      case 3: {
        const fields = [data.empId, data.dateOfJoining, data.departmentId, data.jobRole, data.role];
        const filled = fields.filter(f => f && String(f).trim() !== "").length;
        return Math.round((filled / fields.length) * 100);
      }
      case 4: {
        if (data.salaryNotApplicable) return 100;
        const fields = [data.salary];
        const filled = fields.filter(f => f && String(f).trim() !== "").length;
        return Math.round((filled / fields.length) * 100);
      }
      case 5: {
        const fields = [data.mobileNumber, data.personalEmail, data.residentialAddress, data.postalCode];
        const filled = fields.filter(f => f && String(f).trim() !== "").length;
        return Math.round((filled / fields.length) * 100);
      }
      case 6: {
        const fields = [data.emergName, data.emergRelation, data.emergContact];
        const filled = fields.filter(f => f && String(f).trim() !== "").length;
        return Math.round((filled / fields.length) * 100);
      }
      case 7: {
        const fields = [data.schoolingInstName, data.schoolingQual];
        const filled = fields.filter(f => f && String(f).trim() !== "").length;
        return Math.round((filled / fields.length) * 100);
      }
      case 8: {
        const hasCert = Array.isArray(data.certifications) && data.certifications.length > 0 && data.certifications[0]?.certName;
        return hasCert ? 100 : 0;
      }
      case 9: {
        const fields = [data.bloodGroup, data.insuranceType, data.insurProvider];
        const filled = fields.filter(f => f && String(f).trim() !== "").length;
        return Math.round((filled / fields.length) * 100);
      }
      case 10: {
        const fields = [data.bankName, data.accountHolder, data.accountNum];
        const filled = fields.filter(f => f && String(f).trim() !== "").length;
        return Math.round((filled / fields.length) * 100);
      }
      default:
        return 100;
    }
  };

  const stepsToCalculate = steps.filter(s => s.label !== "Review & Submit");
  const totalStepsPercentageSum = stepsToCalculate.reduce((acc, s) => {
    return acc + getStepCompletionPercent(s.id, formData);
  }, 0);
  const progressPercent = Math.round(totalStepsPercentageSum / stepsToCalculate.length);

  const handleStartAutoCalculation = () => {
    // Save current values for undo option
    setPreviousTaxData({
      customCpfEmployee: formData.customCpfEmployee,
      customCpfEmployeeRate: formData.customCpfEmployeeRate,
      customCpfEmployer: formData.customCpfEmployer,
      customCpfEmployerRate: formData.customCpfEmployerRate,
      customSdl: formData.customSdl,
      customSdlRate: formData.customSdlRate,
      customCdacRate: formData.customCdacRate,
      customSindaRate: formData.customSindaRate,
      customMbmfRate: formData.customMbmfRate,
      customEcfRate: formData.customEcfRate,
      customCdacAmount: formData.customCdacAmount,
      customSindaAmount: formData.customSindaAmount,
      customMbmfAmount: formData.customMbmfAmount,
      customEcfAmount: formData.customEcfAmount,
      shgAmount: formData.shgAmount,
      shgContribution: formData.shgContribution,
      foreignWorkerLevy: formData.foreignWorkerLevy,
      isTaxEdited,
    });

    setShowConfirmAutoCal(false);
    setIsAutoCalculating(true);
    setAutoCalProgress(0);
    setAutoCalMessage("Analyzing employee demographics...");

    const calculationSteps = [
      { progress: 20, message: "Analyzing employee demographics..." },
      { progress: 40, message: "Querying MOM industry sector and quota..." },
      { progress: 60, message: "Evaluating CPF age brackets and thresholds..." },
      { progress: 80, message: "Calculating Self-Help Group contributions..." },
      { progress: 100, message: "Finalizing contributions schedule..." }
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < calculationSteps.length) {
        setAutoCalProgress(calculationSteps[currentStepIdx].progress);
        setAutoCalMessage(calculationSteps[currentStepIdx].message);
        currentStepIdx++;
      } else {
        clearInterval(interval);
        
        // Compute statutory values imperatively
        const salary = formData.salary ? parseFloat(formData.salary.replace(/,/g, "")) : 0;
        const isForeign = (formData.identityType === "FIN" && formData.passType) || (!formData.nricNumber && !formData.finNumber);
        const isSPassOrWorkPermit = (formData.passType || "").toLowerCase().includes("s pass") || (formData.passType || "").toLowerCase().includes("work permit");

        const defaultCpf = !isForeign ? calculateCPF(salary, formData.dob) : { employee: 0, employer: 0, age: 0 };
        const defaultSdl = calculateSDL(salary);

        let shgType = formData.shgContribution;
        const isMuslim = formData.religion === "Islam";
        const isSikh = formData.religion === "Sikh";
        
        if (!shgType || shgType === "None" || shgType === "" || ["CDAC", "SINDA", "MBMF", "ECF"].includes(shgType)) {
          if (!isForeign) {
            if (isMuslim) shgType = "MBMF";
            else if (formData.race === "Chinese") shgType = "CDAC";
            else if (formData.race === "Indian") shgType = "SINDA";
            else if (isSikh) shgType = "ECF";
            else shgType = "None";
          } else {
            shgType = "None";
          }
        }
        const shgAmountValue = calculateSHG(salary, shgType);

        let fwl = 0;
        if (isForeign && isSPassOrWorkPermit) {
          const res = calculateFWLWithDb(quotaData, companySector, formData.passType, formData.workPermitSkill, fwlRates);
          fwl = res.levy;
        }

        const cappedCpfSalaryNum = Math.min(salary, 6800);
        const calculatedCpfEmployeeRate = cappedCpfSalaryNum > 0 ? ((defaultCpf.employee / cappedCpfSalaryNum) * 100).toFixed(2) : "0.00";
        const calculatedCpfEmployerRate = cappedCpfSalaryNum > 0 ? ((defaultCpf.employer / cappedCpfSalaryNum) * 100).toFixed(2) : "0.00";
        const calculatedSdlRate = salary > 0 ? ((defaultSdl / salary) * 100).toFixed(2) : "0.00";

        const pendingData = {
          customCpfEmployee: defaultCpf.employee.toFixed(2),
          customCpfEmployeeRate: calculatedCpfEmployeeRate,
          customCpfEmployer: defaultCpf.employer.toFixed(2),
          customCpfEmployerRate: calculatedCpfEmployerRate,
          customSdl: defaultSdl.toFixed(2),
          customSdlRate: calculatedSdlRate,
          shgContribution: shgType,
          shgAmount: shgAmountValue.toFixed(2),
          foreignWorkerLevy: fwl > 0 ? fwl.toFixed(2) : "0.00",
        };

        setPendingCalculatedTax(pendingData);
        setShowTaxCalculatedPopup(true);
        setIsAutoCalculating(false);
      }
    }, 1000);
  };

  const handleUndoAutoCalculation = () => {
    if (!previousTaxData) return;
    setFormData(prev => ({
      ...prev,
      ...previousTaxData
    }));
    setIsTaxEdited(previousTaxData.isTaxEdited);
    setPreviousTaxData(null);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    const taxFields = ["customCpfEmployee", "customCpfEmployer", "customSdl", "shgAmount", "foreignWorkerLevy", "monthlyTaxEstimate", "customCdacRate", "customSindaRate", "customMbmfRate", "customEcfRate", "customCpfEmployeeRate", "customCpfEmployerRate", "customSdlRate"];
    if (taxFields.includes(field) && value !== undefined) {
      setIsTaxEdited(true);
    }
  };

  // Removed automatic tax calculation useEffect to support manual overrides and explicit Auto-Calculator action only.

  useEffect(() => {
    if (loading) return;
    const nat = (formData.nationality || "").trim().toLowerCase();
    const isSG = nat === "singapore" || nat === "singaporean";
    
    if (isSG) {
      setFormData(prev => (prev.identityType === "NRIC" && prev.nricResidentialStatus === "Singapore Citizen" ? prev : {
        ...prev,
        identityType: "NRIC",
        nricResidentialStatus: "Singapore Citizen"
      }));
    } else if (formData.nationality) {
      if (formData.passType === "PR (Permanent Resident)") {
        setFormData(prev => (prev.identityType === "NRIC" && prev.nricResidentialStatus === "PR (Permanent Resident)" ? prev : {
          ...prev,
          identityType: "NRIC",
          nricResidentialStatus: "PR (Permanent Resident)"
        }));
      } else {
        setFormData(prev => (prev.identityType === "FIN" ? prev : { ...prev, identityType: "FIN" }));
      }
    }
  }, [formData.nationality, formData.passType, loading]);

  useEffect(() => {
    if (formData.identityType === "NRIC") {
      const targetStatus = formData.nationality === "Singapore" ? "Singapore Citizen" : "PR (Permanent Resident)";
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
    if (!formData.nationality || formData.nationality === "Singapore") return;
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

      // 1. Fetch employee first to get the correct company_id and salary details
      const { data: empRes, error: empErr } = await supabase
        .from("employees")
        .select(`
          *,
          employee_salary(*),
          employee_personal_details(*),
          employee_identity_docs(*),
          employee_contact_details(*),
          employee_education(*),
          employee_insurance(*),
          employee_bank_details(*),
          employee_work_details(*)
        `)
        .eq("id", employeeId)
        .single();
      if (!empRes) {
        console.error("Employee not found", empErr);
        setErrorProp("Employee not found. " + (empErr?.message || ""));
        setLoading(false);
        return;
      }

      let salaryRecord = null;
      if (empRes.employee_salary) {
        if (Array.isArray(empRes.employee_salary) && empRes.employee_salary.length > 0) {
          salaryRecord = [...empRes.employee_salary].sort((a: any, b: any) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime())[0];
        } else if (!Array.isArray(empRes.employee_salary) && typeof empRes.employee_salary === 'object') {
          salaryRecord = empRes.employee_salary;
        }
      }

      let shgContrib = "None";
      let shgAmt = "";
      if (salaryRecord) {
        if (salaryRecord.cdac && parseFloat(String(salaryRecord.cdac)) > 0) {
          shgContrib = "CDAC";
          shgAmt = String(salaryRecord.cdac);
        } else if (salaryRecord.sinda && parseFloat(String(salaryRecord.sinda)) > 0) {
          shgContrib = "SINDA";
          shgAmt = String(salaryRecord.sinda);
        } else if (salaryRecord.mbmf && parseFloat(String(salaryRecord.mbmf)) > 0) {
          shgContrib = "MBMF";
          shgAmt = String(salaryRecord.mbmf);
        } else if (salaryRecord.ecf && parseFloat(String(salaryRecord.ecf)) > 0) {
          shgContrib = "ECF";
          shgAmt = String(salaryRecord.ecf);
        }
      }

      const companyId = empRes.company_id || user.id;
      setUserCompanyId(companyId);

      // Fetch company sector
      const { data: companyDetails } = await supabase
        .from("companies")
        .select("sector")
        .eq("id", companyId)
        .maybeSingle();
      const companySec = companyDetails?.sector || "";
      setCompanySector(companySec);

      // Fetch other active employees to calculate the FWL quota tiers
      const { data: otherEmployees } = await supabase
        .from("employees")
        .select(`
          id,
          pass_type,
          nationality,
          nric_number,
          employee_salary (
            base_salary,
            effective_date
          )
        `)
        .eq("company_id", companyId)
        .eq("is_active", true)
        .neq("id", employeeId);

      let localFullCount = 0;
      let localHalfCount = 0;
      let sPassCount = 0;
      let workPermitCount = 0;

      if (otherEmployees) {
        for (const oEmp of otherEmployees) {
          const passType = oEmp.pass_type || "";
          const nationality = oEmp.nationality || "";
          const nricNumber = oEmp.nric_number || "";

          const isLocal =
            nationality.toLowerCase() === "singaporean" ||
            nationality.toLowerCase() === "singapore" ||
            passType.toLowerCase().includes("pr (permanent resident)") ||
            !!nricNumber;

          if (isLocal) {
            // Find the latest base_salary
            let latestSalary = 0;
            if (oEmp.employee_salary) {
              if (Array.isArray(oEmp.employee_salary) && oEmp.employee_salary.length > 0) {
                const sorted = [...oEmp.employee_salary].sort(
                  (a: any, b: any) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime()
                );
                latestSalary = parseFloat(sorted[0].base_salary) || 0;
              } else if (!Array.isArray(oEmp.employee_salary) && typeof oEmp.employee_salary === 'object') {
                latestSalary = parseFloat((oEmp.employee_salary as any).base_salary) || 0;
              }
            }

            if (latestSalary >= 1800) {
              localFullCount++;
            } else if (latestSalary >= 900) {
              localHalfCount++;
            }
          } else {
            if (passType.toLowerCase().includes("s pass")) {
              sPassCount++;
            } else if (passType.toLowerCase().includes("work permit")) {
              workPermitCount++;
            }
          }
        }
      }

      setQuotaData({
        localFullCount,
        localHalfCount,
        sPassCount,
        workPermitCount,
      });

      // 2. Fetch settings using the correct companyId
      const { data: compSettings } = await supabase
        .from('company_settings')
        .select('app_config')
        .eq('company_id', companyId)
        .maybeSingle();

      if (compSettings?.app_config) {
        if (compSettings.app_config.custom_fields) {
          setCustomFieldsConfig(compSettings.app_config.custom_fields);
        }
        if (compSettings.app_config.custom_roles) {
          setAvailableRoles(["Admin", "Sub Admin", "Employee", ...compSettings.app_config.custom_roles]);
        }
        if (compSettings.app_config.attendance_config?.projects) {
          setCompanyProjects(compSettings.app_config.attendance_config.projects);
        }
      }

      // 3. Fetch departments using the correct companyId
      const { data: depts } = await supabase
        .from("departments")
        .select("id, department_name, designations")
        .eq("company_id", companyId)
        .order("department_name");

      if (depts) {
        setDepartments(depts);
      }

      // Fetch FWL rates master
      const { data: ratesData } = await supabase.from("fwl_rate_master").select("*");
      if (ratesData) {
        setFwlRates(ratesData);
      }

      // 4. Now populate the form
      if (empRes) {
        const fullName = empRes.name || "";
        const nameParts = fullName.trim().split(/\s+/);
        const cf =
          empRes.custom_fields && typeof empRes.custom_fields === "object"
            ? (empRes.custom_fields as Record<string, unknown>)
            : {};

        // Shorthand aliases for joined sub-tables (handle both array and object returns)
        const pd: any = Array.isArray(empRes.employee_personal_details) ? (empRes.employee_personal_details[0] || {}) : (empRes.employee_personal_details || {});
        const id_doc: any = Array.isArray(empRes.employee_identity_docs) ? (empRes.employee_identity_docs[0] || {}) : (empRes.employee_identity_docs || {});
        const cd: any = Array.isArray(empRes.employee_contact_details) ? (empRes.employee_contact_details[0] || {}) : (empRes.employee_contact_details || {});
        const ed: any = Array.isArray(empRes.employee_education) ? (empRes.employee_education[0] || {}) : (empRes.employee_education || {});
        const ins: any = Array.isArray(empRes.employee_insurance) ? (empRes.employee_insurance[0] || {}) : (empRes.employee_insurance || {});
        const bd: any = Array.isArray(empRes.employee_bank_details) ? (empRes.employee_bank_details[0] || {}) : (empRes.employee_bank_details || {});
        const wd: any = Array.isArray(empRes.employee_work_details) ? (empRes.employee_work_details[0] || {}) : (empRes.employee_work_details || {});

        setIsDeptAlreadyAssigned(!!empRes.department_id);

        // Parse mobile number
        const rawMobile = empRes.mobile || empRes.phone_number || cd.current_mobile_number || "";
        let parsedMobileCode = cd.mobile_code || "+65";
        let parsedMobileNumber = rawMobile;
        if (rawMobile && rawMobile.startsWith("+")) {
          const parts = rawMobile.split(" ");
          if (parts.length > 1) {
            parsedMobileCode = parts[0];
            parsedMobileNumber = parts.slice(1).join(" ");
          } else {
            const codes = ["+65", "+91", "+60", "+62", "+63", "+66", "+81", "+82", "+84", "+86", "+95", "+977", "+880"];
            for (const code of codes) {
              if (rawMobile.startsWith(code)) {
                parsedMobileCode = code;
                parsedMobileNumber = rawMobile.slice(code.length);
                break;
              }
            }
          }
        }

        // Parse emergency contact number
        const rawEmerg = pd.emergency_contact_number || empRes.emergency_contact_number || "";
        let parsedEmergContactCode = pd.emergency_contact_code || "+65";
        let parsedEmergContact = rawEmerg;
        if (rawEmerg && rawEmerg.startsWith("+")) {
          const parts = rawEmerg.split(" ");
          if (parts.length > 1) {
            parsedEmergContactCode = parts[0];
            parsedEmergContact = parts.slice(1).join(" ");
          } else {
            const codes = ["+65", "+91", "+60", "+62", "+63", "+66", "+81", "+82", "+84", "+86", "+95", "+977", "+880"];
            for (const code of codes) {
              if (rawEmerg.startsWith(code)) {
                parsedEmergContactCode = code;
                parsedEmergContact = rawEmerg.slice(code.length);
                break;
              }
            }
          }
        }

        const loadedNationality = pd.nationality || empRes.nationality || "";
        const loadedPassType = id_doc.pass_type || empRes.pass_type || (empRes.custom_fields && empRes.custom_fields.passType) || "";
        const isSG = loadedNationality.toLowerCase() === "singapore" || loadedNationality.toLowerCase() === "singaporean";
        const isPR = loadedPassType === "PR (Permanent Resident)";
        const initialIdentityType = (isSG || isPR) ? "NRIC" : "FIN";

        setIsTaxEdited(empRes.is_tax_edited === true);
        setFormData((prev) => {
          setOriginalAvatarUrl(empRes.avatar_url || "");
          const merged = {
            ...prev,

            // Step 1: Personal
            firstName: empRes.first_name || nameParts[0] || "",
            lastName: empRes.last_name || nameParts.slice(1).join(" ") || "",
            gender: pd.gender || empRes.gender || (cf.gender) || "",
            dob: pd.date_of_birth || empRes.date_of_birth || (cf.date_of_birth) || (cf.dob) || "",
            nationality: pd.nationality || empRes.nationality || (cf.nationality) || "",
            maritalStatus: pd.marital_status || empRes.marital_status || (cf.marital_status) || (cf.maritalStatus) || "",
            race: pd.race || empRes.race || (cf.race) || "",
            religion: pd.religion || empRes.religion || (cf.religion) || "",
            profilePhotoUrl: empRes.avatar_url || "",
            linkedinUrl: cd.linkedin_url || empRes.linkedin_url || (cf.linkedinUrl) || "",
            instagramUrl: cd.instagram_url || empRes.instagram_url || (cf.instagramUrl) || "",
            personalEmail: pd.personal_email || empRes.personal_email || empRes.email || "",

            // Step 2: Identity
            identityType: initialIdentityType,
            nricNumber: id_doc.nric_number || empRes.nric_number || (cf.nricNumber) || "",
            nricResidentialStatus: empRes.residential_status || (cf.nricResidentialStatus) || "",
            cpfLinkedStatus: empRes.cpf_number || (cf.cpfLinkedStatus) || "",
            taxId: empRes.tax_identification_number || (cf.taxId) || "",
            nricCopyUrl: id_doc.nric_copy_url || empRes.nric_copy_url || (cf.nricCopyUrl) || "",
            finNumber: id_doc.fin_number || empRes.fin_number || (cf.finNumber) || "",
            finPassportNumber: id_doc.passport_number || empRes.passport_number || (cf.finPassportNumber) || "",
            finPassportExpiryDate: id_doc.passport_expiry || empRes.passport_expiry || (cf.finPassportExpiryDate) || "",
            finIssuingCountry: id_doc.issuing_country || empRes.issuing_country || (cf.finIssuingCountry) || "",
            passType: id_doc.pass_type || empRes.pass_type || (cf.passType) || "",
            passNumber: id_doc.pass_number || empRes.pass_number || (cf.passNumber) || "",
            passIssueDate: id_doc.pass_issue_date || empRes.pass_issue_date || (cf.passIssueDate) || "",
            passExpiryDate: id_doc.pass_expiry_date || empRes.pass_expiry_date || (cf.passExpiryDate) || "",
            finCardUrl: id_doc.pass_copy_url || empRes.fin_card_url || (cf.finCardUrl) || "",
            finPassportCopyUrl: id_doc.passport_copy_url || empRes.passport_copy_url || (cf.finPassportCopyUrl) || "",
            workPermitSkill: id_doc.work_permit_skill || empRes.skill_status || empRes.work_permit_skill || (cf.workPermitSkill) || "",

            // Step 3: Work Details
            empId: empRes.emp_id || "",
            dateOfJoining: empRes.date_of_joining || "",
            departmentId: (depts && depts.some((d: any) => d.id === empRes.department_id)) ? empRes.department_id : "",
            role: empRes.app_role || "Employee",
            jobRole: (depts && depts.some((d: any) => d.id === empRes.department_id)) ? (empRes.designation || "") : "",
            jobType: wd.job_type || empRes.job_type || "Full Time",
            contractEndDate: cf.contract_end_date ? String(cf.contract_end_date) : "",
            salary: (salaryRecord && salaryRecord.base_salary != null) ? formatSalary(String(salaryRecord.base_salary)) : "",
            salaryNotApplicable: (cf.salaryNotApplicable as boolean) ?? false,
            shiftType: wd.shift_type || empRes.shift_type || "Standard",
            overtimeApplicable: wd.overtime_applicable ?? empRes.overtime_applicable ?? false,
            overtimeWorkingHours: empRes.overtime_working_hours ? String(empRes.overtime_working_hours) : "",
            overtimePeriod: empRes.overtime_period || "monthly",
            claimsApplicable: wd.claims_applicable ?? empRes.claims_applicable ?? false,
            isActive: empRes.is_active ?? true,
            assignedProjects: Array.isArray(cf.assignedProjects)
              ? cf.assignedProjects
              : (cf.current_project || cf.project_name
                ? [String(cf.current_project || cf.project_name)]
                : []),
            allowances: salaryRecord && salaryRecord.allowance ? (Array.isArray(salaryRecord.allowance) ? salaryRecord.allowance : [{ name: "", amount: "" }]) : (Array.isArray(cf.allowances) ? cf.allowances : [{ name: "", amount: "" }]),

            // Step 4: Tax Details
            monthlyTaxEstimate: String((salaryRecord && salaryRecord.iras != null) ? salaryRecord.iras : (cf.monthlyTaxEstimate || "0.00")),
            shgContribution: shgContrib,
            shgAmount: shgAmt,
            foreignWorkerLevy: (salaryRecord && salaryRecord.foreign_worker_levy != null) ? String(salaryRecord.foreign_worker_levy) : "0.00",
            customCpfEmployee: (salaryRecord && salaryRecord.cpf_employee != null) ? String(salaryRecord.cpf_employee) : "0.00",
            customCpfEmployeeRate: (salaryRecord && salaryRecord.cpf_employee_rate != null) ? String(salaryRecord.cpf_employee_rate) : "0.00",
            customCpfEmployer: (salaryRecord && salaryRecord.cpf_employer != null) ? String(salaryRecord.cpf_employer) : "0.00",
            customCpfEmployerRate: (salaryRecord && salaryRecord.cpf_employer_rate != null) ? String(salaryRecord.cpf_employer_rate) : "0.00",
            customSdl: (salaryRecord && salaryRecord.sdl != null) ? String(salaryRecord.sdl) : "0.00",
            customSdlRate: (salaryRecord && salaryRecord.sdl_rate != null) ? String(salaryRecord.sdl_rate) : "0.00",
            customCdacRate: (salaryRecord && salaryRecord.cdac_rate != null) ? String(salaryRecord.cdac_rate) : undefined,
            customSindaRate: (salaryRecord && salaryRecord.sinda_rate != null) ? String(salaryRecord.sinda_rate) : undefined,
            customMbmfRate: (salaryRecord && salaryRecord.mbmf_rate != null) ? String(salaryRecord.mbmf_rate) : undefined,
            customEcfRate: (salaryRecord && salaryRecord.ecf_rate != null) ? String(salaryRecord.ecf_rate) : undefined,
            customIncomeTaxRate: (salaryRecord && salaryRecord.iras_rate != null) ? String(salaryRecord.iras_rate) : undefined,
            customCdacAmount: (salaryRecord && salaryRecord.cdac != null) ? String(salaryRecord.cdac) : undefined,
            customSindaAmount: (salaryRecord && salaryRecord.sinda != null) ? String(salaryRecord.sinda) : undefined,
            customMbmfAmount: (salaryRecord && salaryRecord.mbmf != null) ? String(salaryRecord.mbmf) : undefined,
            customEcfAmount: (salaryRecord && salaryRecord.ecf != null) ? String(salaryRecord.ecf) : undefined,
            customIncomeTaxAmount: (salaryRecord && salaryRecord.iras != null) ? String(salaryRecord.iras) : undefined,

            // Step 5: Contact
            mobileNumber: parsedMobileNumber,
            mobileCode: parsedMobileCode,
            residentialAddress: empRes.address || cd.residential_address || "",
            postalCode: empRes.postal_code || cd.postal_code || "",
            currentResidentialAddress: empRes.current_address || cd.current_address || cd.current_residential_address || "",
            currentPostalCode: empRes.current_postal_code || cd.current_postal_code || "",
            currentEmail: empRes.current_email || cd.current_email || "",
            currentMobileNumber: empRes.current_mobile || cd.current_mobile_number || "",
            currentMobileCode: empRes.current_mobile_code || cd.mobile_code || "+65",
            nativeMobileNumber: empRes.native_mobile || cd.native_mobile_number || "",
            nativeMobileCode: empRes.native_mobile_code || cd.native_mobile_code || "",
            nativeResidentialAddress: empRes.native_address || cd.native_address || cd.native_residential_address || "",
            nativePostalCode: empRes.native_postal_code || cd.native_postal_code || "",

            // Step 6: Emergency Contact
            emergName: pd.emergency_contact_name || empRes.emergency_contact_name || "",
            emergRelation: pd.emergency_contact_relation || empRes.emergency_contact_relation || "",
            emergContactCode: parsedEmergContactCode,
            emergContact: parsedEmergContact,
            emergAddress: pd.emergency_contact_address || empRes.emergency_contact_address || "",

            // Step 7: Education
            higherEduCountry: ed.higher_edu_country || empRes.higher_edu_country || "",
            higherEduInstName: ed.higher_edu_institution || empRes.higher_edu_inst_name || "",
            higherEduCourseName: ed.higher_edu_course || empRes.higher_edu_course_name || "",
            higherEduCourseDuration: ed.higher_edu_course_duration || empRes.higher_edu_course_duration || "",
            higherEduQual: ed.higher_edu_qualification || empRes.higher_edu_qual || "",
            higherEduGradYear: ed.higher_edu_grad_year || empRes.higher_edu_grad_year || "",
            higherEduCertUrl: ed.higher_edu_cert_url || empRes.higher_edu_cert_url || "",
            schoolingCountry: ed.schooling_country || empRes.schooling_country || "",
            schoolingInstName: ed.schooling_institution || empRes.schooling_inst_name || "",
            schoolingQual: ed.schooling_qualification || empRes.schooling_qual || "",
            schoolingGradYear: ed.schooling_grad_year || empRes.schooling_grad_year || "",
            schoolingCertUrl: ed.schooling_cert_url || empRes.schooling_cert_url || "",

            // Step 8: Certifications
            certifications: Array.isArray(ed.certifications) && ed.certifications.length > 0
              ? ed.certifications
              : (Array.isArray(empRes.certifications) && empRes.certifications.length > 0
                ? empRes.certifications
                : (Array.isArray(cf.certifications) && cf.certifications.length > 0
                  ? cf.certifications
                  : [{ certName: "", issuingOrg: "", certIssueDate: "", certExpiryDate: "", certNumber: "", certificationUrl: "" }])),

            // Step 9: Medical / Insurance
            bloodGroup: pd.blood_group || empRes.blood_group || "",
            insuranceType: ins.insurance_type || empRes.insurance_type || "",
            insurProvider: ins.insur_provider || empRes.insurance_provider || "",
            insurPolicyNum: ins.insur_policy_num || empRes.insurance_policy_number || "",
            insurPaymentFreq: ins.insur_payment_freq || empRes.insurance_payment_freq || "",
            insurPolicyStart: ins.insur_policy_start || empRes.insurance_policy_start || "",
            insurPolicyExpiry: ins.insur_policy_expiry || empRes.insurance_policy_expiry || "",
            insurCoverageAmt: ins.insur_coverage_amt != null ? String(ins.insur_coverage_amt) : (empRes.insurance_coverage_amount != null ? String(empRes.insurance_coverage_amount) : ""),
            insurPremiumAmt: ins.insur_premium_amt != null ? String(ins.insur_premium_amt) : (empRes.insurance_premium_amount != null ? String(empRes.insurance_premium_amount) : ""),
            empCovered: ins.emp_covered || empRes.employee_covered || "",
            depsCovered: ins.deps_covered || empRes.dependents_covered || "",
            numDeps: ins.num_deps != null ? String(ins.num_deps) : (empRes.num_dependents != null ? String(empRes.num_dependents) : ""),
            spouseCoverage: ins.spouse_coverage || empRes.spouse_coverage || "",
            childrenCoverage: ins.children_coverage || empRes.children_coverage || "",
            parentsCoverage: ins.parents_coverage || empRes.parents_coverage || "",

            // Step 10: Bank Details
            bankName: bd.bank_name || empRes.bank_name || "",
            accountHolder: bd.account_holder_name || empRes.account_holder_name || (empRes.name || "").trim(),
            accountNum: bd.bank_account_number || bd.account_number || empRes.bank_account_number || empRes.account_number || "",
            bankCode: bd.bank_code || empRes.bank_code || "",
            branchCode: bd.branch_code || empRes.branch_code || "",
            salaryPaymentMode: bd.salary_payment_mode || empRes.salary_payment_mode || "",
            onlinePaymentType: bd.online_payment_type || empRes.online_payment_type || "",
            onlinePaymentId: bd.online_payment_id || empRes.online_payment_id || "",

            // Step 11: Company custom org fields (dynamic)
            ...Object.fromEntries(
              Object.entries(cf).filter(([key]) => ![
                'maritalStatus', 'linkedinUrl', 'instagramUrl', 'identityType',
                'overtimeWorkingHours', 'overtimePeriod', 'overtimeMaxLimit',
                'assignedProjects', 'allowances', 'certifications',
                'monthlyTaxEstimate', 'shgContribution', 'shgAmount', 'foreignWorkerLevy',
                'customCpfEmployee', 'customCpfEmployeeRate', 'customCpfEmployer', 'customCpfEmployerRate',
                'customSdl', 'customSdlRate', 'customCdacRate', 'customSindaRate', 'customMbmfRate', 'customEcfRate', 'customIncomeTaxRate',
                'nativeResidentialAddress', 'nativePostalCode',
                'higherEduCountry', 'higherEduInstName', 'higherEduCourseName', 'higherEduCourseDuration', 'higherEduQual', 'higherEduGradYear', 'higherEduCertUrl',
                'schoolingCountry', 'schoolingInstName', 'schoolingQual', 'schoolingGradYear', 'schoolingCertUrl',
                'insuranceType', 'insurProvider', 'insurPolicyNum', 'insurPaymentFreq', 'insurPolicyStart', 'insurPolicyExpiry',
                'insurCoverageAmt', 'insurPremiumAmt', 'empCovered', 'depsCovered', 'numDeps', 'spouseCoverage', 'childrenCoverage', 'parentsCoverage',
                'bankCode', 'branchCode', 'salaryPaymentMode', 'onlinePaymentType', 'onlinePaymentId',
              ].includes(key))
            ),
          };

          const nat = String((merged).nationality || "");
          if (nat && nat !== "Singaporean") {
            const m = merged;
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
          return merged;
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
    const { data: compSettings } = await supabase.from('companies').select('company_name').eq('id', userCompanyId).maybeSingle();
    const companySlug = toCompanySlug(compSettings?.company_name || 'default');
    const empName = `${formData.firstName} ${formData.lastName}`.trim() || 'Employee';

    const uploadFile = async (file: any, categoryName: string, subCategory: string = "Documents") => {
      if (!file || typeof file === 'string') return file;
      if (!(file instanceof File)) return typeof file === 'object' ? null : file;

      return await uploadToCompanyStorage(supabase, {
        companyId: userCompanyId,
        companySlug,
        category: 'employees',
        file,
        categoryName: categoryName.replace(/\s+/g, '_'),
        empId: formData.empId || undefined,
        employeeName: empName,
      });
    };

    const uploadAvatar = async (file: any) => {
      if (!file || typeof file === 'string') return file;
      if (!(file instanceof File)) return typeof file === 'object' ? null : file;

      return await uploadEmployeeProfilePhoto(supabase, userCompanyId, employeeId, file, "webp");
    };

    const updatedData = { ...formData };
    updatedData.profilePhotoUrl = await uploadAvatar(updatedData.profilePhotoUrl);
    updatedData.nricCopyUrl = await uploadFile(updatedData.nricCopyUrl, "NRIC Copy", "Identity");
    updatedData.finCardUrl = await uploadFile(updatedData.finCardUrl, "Pass Copy", "Pass Document");
    updatedData.finPassportCopyUrl = await uploadFile(updatedData.finPassportCopyUrl, "Passport Copy", "Passport Document");
    updatedData.schoolingCertUrl = await uploadFile(updatedData.schoolingCertUrl, "Schooling Certificate", "Courses");
    updatedData.higherEduCertUrl = await uploadFile(updatedData.higherEduCertUrl, "Higher Education Certificate", "Courses");

    if (Array.isArray(updatedData.certifications)) {
      const newCerts = await Promise.all(
        updatedData.certifications.map(async (cert: any, i: number) => {
          if (cert?.certificationUrl && cert.certificationUrl instanceof File) {
            return { ...cert, certificationUrl: await uploadFile(cert.certificationUrl, `Certification ${i + 1}`, "Courses") };
          }
          return cert;
        })
      );
      updatedData.certifications = newCerts;
    }

    return updatedData;
  };

    const buildAllPayloads = (data: any, empId: string) => {
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const isSG = data.nationality === "Singapore";
    const pEmail = isSG ? data.personalEmail : data.currentEmail;

    // ── Core Employees Table Payload ──
    const employeesPayload: any = {
      name: fullName || undefined,
      first_name: data.firstName || null,
      last_name: data.lastName || null,
      email: pEmail || undefined,
      emp_id: data.empId || null,
      department_id: data.departmentId || null,
      designation: data.jobRole || null,
      app_role: data.role || "Employee",
      date_of_joining: data.dateOfJoining || null,
      avatar_url: data.profilePhotoUrl || null,
      is_active: data.isActive ?? true,
    };

    const newCustomFields: any = {};
    if (customFieldsConfig && customFieldsConfig.length > 0) {
      customFieldsConfig.forEach((field: any) => {
        if (data[field.id] !== undefined) {
          newCustomFields[field.id] = data[field.id];
        }
      });
    }

    employeesPayload.custom_fields = {
      ...newCustomFields,
      linkedinUrl: data.linkedinUrl,
      instagramUrl: data.instagramUrl,
      overtimeWorkingHours: data.overtimeWorkingHours,
      overtimePeriod: data.overtimePeriod,
      assignedProjects: data.assignedProjects,
      allowances: data.allowances,
      certifications: data.certifications,
      salaryNotApplicable: data.salaryNotApplicable,
      contract_end_date: data.contractEndDate,
    };

    const subTables = {
      employee_personal_details: {
        gender: data.gender || null,
        date_of_birth: data.dob || null,
        nationality: data.nationality || null,
        marital_status: data.maritalStatus || null,
        race: data.race || null,
        religion: data.religion || null,
        personal_email: data.personalEmail || null,
        blood_group: data.bloodGroup || null,
        emergency_contact_name: data.emergName || null,
        emergency_contact_relation: data.emergRelation || null,
        emergency_contact_code: data.emergContactCode || null,
        emergency_contact_number: data.emergContact || null,
        emergency_contact_address: data.emergAddress || null,
      },
      employee_identity_docs: {
        nric_number: data.nricNumber || null,
        nric_copy_url: data.nricCopyUrl || null,
        fin_number: data.finNumber || null,
        passport_number: data.finPassportNumber || null,
        passport_expiry: data.finPassportExpiryDate || null,
        issuing_country: data.finIssuingCountry || null,
        pass_type: data.passType || null,
        pass_number: data.passNumber || null,
        pass_issue_date: data.passIssueDate || null,
        pass_expiry_date: data.passExpiryDate || null,
        pass_copy_url: data.finCardUrl || null,
        passport_copy_url: data.finPassportCopyUrl || null,
        work_permit_skill: data.workPermitSkill || null,
      },
      employee_contact_details: {
        mobile_code: data.mobileCode || null,
        current_mobile_number: data.mobileNumber || null,
        residential_address: data.residentialAddress || null,
        postal_code: data.postalCode || null,
        current_address: data.currentResidentialAddress || null,
        current_postal_code: data.currentPostalCode || null,
        current_email: data.currentEmail || null,
        current_mobile_code: data.currentMobileCode || null,
        current_mobile: data.currentMobileNumber || null,
        native_mobile_code: data.nativeMobileCode || null,
        native_mobile_number: data.nativeMobileNumber || null,
        native_address: data.nativeResidentialAddress || null,
        native_postal_code: data.nativePostalCode || null,
        linkedin_url: data.linkedinUrl || null,
        instagram_url: data.instagramUrl || null,
      },
      employee_education: {
        higher_edu_country: data.higherEduCountry || null,
        higher_edu_institution: data.higherEduInstName || null,
        higher_edu_course: data.higherEduCourseName || null,
        higher_edu_course_duration: data.higherEduCourseDuration || null,
        higher_edu_qualification: data.higherEduQual || null,
        higher_edu_grad_year: data.higherEduGradYear || null,
        higher_edu_cert_url: data.higherEduCertUrl || null,
        schooling_country: data.schoolingCountry || null,
        schooling_institution: data.schoolingInstName || null,
        schooling_qualification: data.schoolingQual || null,
        schooling_grad_year: data.schoolingGradYear || null,
        schooling_cert_url: data.schoolingCertUrl || null,
      },
      employee_insurance: {
        insurance_type: data.insuranceType || null,
        insur_provider: data.insurProvider || null,
        insur_policy_num: data.insurPolicyNum || null,
        insur_payment_freq: data.insurPaymentFreq || null,
        insur_policy_start: data.insurPolicyStart || null,
        insur_policy_expiry: data.insurPolicyExpiry || null,
        insur_coverage_amt: data.insurCoverageAmt && data.insurCoverageAmt !== "" ? parseFloat(String(data.insurCoverageAmt).replace(/,/g, "")) : null,
        insur_premium_amt: data.insurPremiumAmt && data.insurPremiumAmt !== "" ? parseFloat(String(data.insurPremiumAmt).replace(/,/g, "")) : null,
        emp_covered: data.empCovered || null,
        deps_covered: data.depsCovered || null,
        num_deps: data.numDeps && data.numDeps !== "" ? parseInt(String(data.numDeps)) : null,
        spouse_coverage: data.spouseCoverage || null,
        children_coverage: data.childrenCoverage || null,
        parents_coverage: data.parentsCoverage || null,
      },
      employee_bank_details: {
        bank_name: data.bankName || null,
        account_holder_name: data.accountHolder || null,
        bank_account_number: data.accountNum || null,
        bank_code: data.bankCode || null,
        branch_code: data.branchCode || null,
        salary_payment_mode: data.salaryPaymentMode || null,
        online_payment_type: data.onlinePaymentType || null,
        online_payment_id: data.onlinePaymentId || null,
      },
      employee_work_details: {
        job_type: data.jobType || null,
        shift_type: data.shiftType || null,
        overtime_applicable: data.overtimeApplicable ?? false,
        claims_applicable: data.claimsApplicable ?? false,
      },
      employee_declarations: {
        terms_accepted: data.termsAccepted ?? false,
        privacy_consent: data.privacyConsent ?? false,
        emp_declaration: data.empDeclaration ?? false,
        digital_signature: data.digitalSignature || null,
      }
    };

    const salaryPayload = {
      base_salary: data.salaryNotApplicable ? 0 : (data.salary ? parseFloat(data.salary.replace(/,/g, "")) : 0),
      allowance: data.allowances || [],
      effective_date: new Date().toISOString().split('T')[0],
      cpf_employee: data.customCpfEmployee != null && data.customCpfEmployee !== "" ? parseFloat(String(data.customCpfEmployee)) : 0,
      cpf_employer: data.customCpfEmployer != null && data.customCpfEmployer !== "" ? parseFloat(String(data.customCpfEmployer)) : 0,
      cdac: data.customCdacAmount != null && data.customCdacAmount !== "" ? parseFloat(String(data.customCdacAmount)) : 0,
      cdac_rate: data.customCdacRate != null && data.customCdacRate !== "" ? parseFloat(String(data.customCdacRate)) : 0,
      sinda: data.customSindaAmount != null && data.customSindaAmount !== "" ? parseFloat(String(data.customSindaAmount)) : 0,
      sinda_rate: data.customSindaRate != null && data.customSindaRate !== "" ? parseFloat(String(data.customSindaRate)) : 0,
      mbmf: data.customMbmfAmount != null && data.customMbmfAmount !== "" ? parseFloat(String(data.customMbmfAmount)) : 0,
      mbmf_rate: data.customMbmfRate != null && data.customMbmfRate !== "" ? parseFloat(String(data.customMbmfRate)) : 0,
      ecf: data.customEcfAmount != null && data.customEcfAmount !== "" ? parseFloat(String(data.customEcfAmount)) : 0,
      ecf_rate: data.customEcfRate != null && data.customEcfRate !== "" ? parseFloat(String(data.customEcfRate)) : 0,
      sdl: data.customSdl != null && data.customSdl !== "" ? parseFloat(String(data.customSdl)) : 0,
      sdl_rate: data.customSdlRate != null && data.customSdlRate !== "" ? parseFloat(String(data.customSdlRate)) : 0,
      iras: data.customIncomeTaxAmount != null && data.customIncomeTaxAmount !== "" ? parseFloat(String(data.customIncomeTaxAmount)) : 0,
      iras_rate: data.customIncomeTaxRate != null && data.customIncomeTaxRate !== "" ? parseFloat(String(data.customIncomeTaxRate)) : 0,
      foreign_worker_levy: data.foreignWorkerLevy && data.foreignWorkerLevy !== "" ? parseFloat(String(data.foreignWorkerLevy).replace(/,/g, "")) : 0,
    };

    return { employeesPayload, subTables, salaryPayload };
  };

  const getDirtyFields = (current: any, initial: any) => {
    const dirty: any = {};
    let hasChanges = false;
    for (const key of Object.keys(current)) {
      if (JSON.stringify(current[key]) !== JSON.stringify(initial[key])) {
        dirty[key] = current[key];
        hasChanges = true;
      }
    }
    return { dirty, hasChanges };
  };

  const persistEmployee = async (opts: { redirect?: boolean }) => {
    setSaving(true);
    setErrorProp("");
    try {
      const finalData = await uploadEmployeeFiles();
      setFormData(finalData); // update state so it shows up correctly afterwards

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

      const initialData = initialFormDataRef.current || {};
      const currentPayloads = buildAllPayloads(finalData, employeeId as string);
      const initialPayloads = buildAllPayloads(initialData, employeeId as string);

      // ── Core Employees Table ──
      // 1. Single Admin check
      if (currentPayloads.employeesPayload.app_role === "Admin" && currentPayloads.employeesPayload.department_id) {
        const { data: deptAdmins } = await supabase
          .from("employees")
          .select("id, name")
          .eq("department_id", currentPayloads.employeesPayload.department_id)
          .eq("role", "Admin")
          .neq("id", employeeId);
        if (deptAdmins && deptAdmins.length > 0) {
          throw new Error(`This department already has an Admin (Department Head: ${deptAdmins[0].name}). A department can only have one Admin.`);
        }
      }

      // 2. Sub Admin count check
      if (currentPayloads.employeesPayload.app_role === "Sub Admin" && currentPayloads.employeesPayload.department_id) {
        const { count } = await supabase
          .from("employees")
          .select("id", { count: "exact", head: true })
          .eq("department_id", currentPayloads.employeesPayload.department_id)
          .eq("role", "Sub Admin")
          .neq("id", employeeId);
        if (count !== null && count >= 3) {
          throw new Error("A department can have a maximum of 3 Sub Admins. This department already has 3 Sub Admins.");
        }
      }

      const { dirty: empDirty, hasChanges: empHasChanges } = getDirtyFields(currentPayloads.employeesPayload, initialPayloads.employeesPayload);
      
      // Preserve existing custom_fields that are NOT in the form when doing partial update
      if (empDirty.custom_fields) {
        const { data: currentEmpCF } = await supabase.from("employees").select("custom_fields").eq("id", employeeId).maybeSingle();
        const existingCF = currentEmpCF?.custom_fields && typeof currentEmpCF.custom_fields === 'object' ? currentEmpCF.custom_fields : {};
        empDirty.custom_fields = { ...existingCF, ...empDirty.custom_fields };
      }

      if (empHasChanges) {
        const { error: empError } = await supabase.from("employees").update(empDirty).eq("id", employeeId);
        if (empError) throw empError;
      }

      // Auto-assign department head_id if employee is an Admin
      if (empDirty.app_role === "Admin" && currentPayloads.employeesPayload.department_id) {
        await supabase.from("departments").update({ head_id: employeeId }).eq("id", currentPayloads.employeesPayload.department_id);
      }

      // ── Upsert Sub-Tables ──
      for (const [table, currentSubPayload] of Object.entries(currentPayloads.subTables)) {
        const initialSubPayload = (initialPayloads.subTables as any)[table] || {};
        
        const { data: exists } = await supabase.from(table).select("employee_id").eq("employee_id", employeeId).maybeSingle();
        if (exists) {
            const { dirty, hasChanges } = getDirtyFields(currentSubPayload, initialSubPayload);
            if (hasChanges) {
                await supabase.from(table).update(dirty).eq("employee_id", employeeId);
            }
        } else {
            await supabase.from(table).insert([{ ...currentSubPayload, employee_id: employeeId }]);
        }
      }

      // ── Upsert Salary Table ──
      const { data: currentEmp } = await supabase.from("employees").select("company_id").eq("id", employeeId).single();
      const salaryPayloadWithIds = {
        ...currentPayloads.salaryPayload,
        employee_id: employeeId,
        company_id: currentEmp?.company_id,
      };

      const { data: existingSalary } = await supabase.from("employee_salary").select("id").eq("employee_id", employeeId).maybeSingle();
      if (existingSalary) {
        const { dirty, hasChanges } = getDirtyFields(currentPayloads.salaryPayload, initialPayloads.salaryPayload);
        if (hasChanges) {
            await supabase.from("employee_salary").update(dirty).eq("employee_id", employeeId);
        }
      } else {
        await supabase.from("employee_salary").insert([salaryPayloadWithIds]);
      }

      if (opts.redirect) {
        router.push(`/employees/${employeeId}`);
        router.refresh();
      }
    } catch (e: any) {
      console.error("Save error details:", e);
      const msg = e?.message || e?.details || e?.hint || (typeof e === 'object' ? JSON.stringify(e) : String(e)) || "Failed to save profile.";
      setErrorProp(msg);
    } finally {
      setSaving(false);
    }
  };

  const validateCurrentStep = (): boolean => {
    setErrorProp("");
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
    const salaryNum = parseFloat((formData.salary || "0").replace(/,/g, ''));
    const sdl = Math.max(2, Math.min(11.25, salaryNum * 0.0025));

    if (formData.identityType === "FIN" || !formData.identityType) {
      return { cpfEmployee: 0, cpfEmployer: 0, sdl };
    }

    const age = getAge(formData.dob);
    const cappedSalary = Math.min(salaryNum, 6800);

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

  const liveFwlRes = calculateFWLWithDb(quotaData, companySector, formData.passType, formData.workPermitSkill, fwlRates);
  const displayFwl = liveFwlRes.levy;

  const activeShgAmount = parseFloat(
    formData.shgContribution === "CDAC" ? (formData.customCdacAmount !== undefined ? formData.customCdacAmount : (formData.shgAmount || "0.00")) :
    formData.shgContribution === "SINDA" ? (formData.customSindaAmount !== undefined ? formData.customSindaAmount : (formData.shgAmount || "0.00")) :
    formData.shgContribution === "MBMF" ? (formData.customMbmfAmount !== undefined ? formData.customMbmfAmount : (formData.shgAmount || "0.00")) :
    formData.shgContribution === "ECF" ? (formData.customEcfAmount !== undefined ? formData.customEcfAmount : (formData.shgAmount || "0.00")) : "0.00"
  ) || 0;

  const displayIncomeTaxRate = formData.customIncomeTaxRate !== undefined
    ? formData.customIncomeTaxRate
    : (grossSalaryNum > 0 ? ((parseFloat(formData.monthlyTaxEstimate ?? "0") || 0) / grossSalaryNum * 100).toFixed(2) : "0.00");

  const displayIncomeTaxAmount = parseFloat(
    formData.customIncomeTaxAmount !== undefined ? formData.customIncomeTaxAmount : (formData.monthlyTaxEstimate || "0.00")
  ) || 0;

  const employeeDeductionItems = [];
  if (formData.identityType === "NRIC" && parseFloat(displayCpfEmployeeRate) > 0) {
    employeeDeductionItems.push({
      label: "CPF Employee Contribution",
      amount: displayCpfEmployee,
      formula: `Summary: Calculated based on the employee's age (${getAge(formData.dob)} years) and PR/Citizen status. The employee share is ${displayCpfEmployeeRate}% of the Ordinary Wage (capped at S$ 6,800). Calculation: S$ ${cappedCpfSalaryNum.toLocaleString('en-US', { minimumFractionDigits: 2 })} × ${displayCpfEmployeeRate}%.`
    });
  }
  if (formData.shgContribution !== "None" && activeShgAmount > 0) {
    employeeDeductionItems.push({
      label: `Self-Help Group Fund (${formData.shgContribution})`,
      amount: activeShgAmount,
      formula: `Summary: Mandatory contribution to ${formData.shgContribution} fund. The amount is a fixed tier rate based on the gross monthly income bracket.`
    });
  }
  if (displayIncomeTaxAmount > 0 || parseFloat(displayIncomeTaxRate) > 0) {
    employeeDeductionItems.push({
      label: "Monthly Income Tax (IRAS)",
      amount: displayIncomeTaxAmount,
      formula: `Formula: S$ ${grossSalaryNum.toLocaleString('en-US', { minimumFractionDigits: 2 })} × ${displayIncomeTaxRate}%`
    });
  }

  const employerContributionItems = [];
  if (formData.identityType === "NRIC" && parseFloat(displayCpfEmployerRate) > 0) {
    employerContributionItems.push({
      label: "CPF Employer Contribution",
      amount: displayCpfEmployer,
      formula: `Summary: Employer contribution is mandatory for this age group (${getAge(formData.dob)} years) at a rate of ${displayCpfEmployerRate}%. Calculation: S$ ${cappedCpfSalaryNum.toLocaleString('en-US', { minimumFractionDigits: 2 })} × ${displayCpfEmployerRate}%.`
    });
  }
  if (formData.sdlApplicable === "Yes" && displaySdl > 0) {
    employerContributionItems.push({
      label: "Skills Development Levy (SDL)",
      amount: displaySdl,
      formula: `Summary: SDL is calculated as 0.25% of gross remuneration. MOM enforces a minimum of S$ 2.00 (for salaries ≤ S$ 800) and a maximum of S$ 11.25 (for salaries ≥ S$ 4,500). Calculation: S$ ${grossSalaryNum.toLocaleString('en-US', { minimumFractionDigits: 2 })} × 0.25%.`
    });
  }
  if (formData.identityType === "FIN" && displayFwl > 0) {
    employerContributionItems.push({
      label: "Foreign Worker Levy (FWL)",
      amount: displayFwl,
      formula: `Summary: Based on the MOM ${companySector || "general"} sector quota. This ${formData.passType || "Work Permit"} employee falls under ${liveFwlRes.tier}. Current company quota ratio is ${liveFwlRes.ratio}% (Max DRC: ${liveFwlRes.maxDrc}%). Therefore, the monthly levy cost is exactly S$ ${liveFwlRes.levy.toFixed(2)}.`
    });
  }

  return (
    <div className="flex h-full w-full bg-[#FAFAF9] dark:bg-[#121217] overflow-hidden relative z-[100] border-l border-[#ECECEC] dark:border-white/5">
      {/* Left Sidebar (Stepper) */}
      <div className="w-[300px] shrink-0 border-r border-[#ECECEC] dark:border-white/10 bg-[#FAFAF9] dark:bg-[#121217] flex flex-col pt-8 pb-6 h-full relative z-10 overflow-y-auto page-scrollbar">
        <div className="px-6 mb-8">
          <button 
            onClick={() => {
              if (hasHistory) {
                router.back();
              } else {
                router.push(`/employees/${employeeId}`);
              }
            }} 
            className="flex items-center gap-2 type-body-medium font-medium text-[#616161] hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> {backLabel}
          </button>
          <p className="type-caption font-medium text-[#A3A3A3] tracking-wider uppercase mb-1">Onboarding</p>
          <h1 className="type-h1 font-medium tracking-tight mb-2 text-[#161616] dark:text-white">Employee Details</h1>
          <p className="type-small text-[#737373] dark:text-gray-400 leading-relaxed pr-2">
            Please provide accurate information for your employee profile.
          </p>
          {/* Top Overall Progress */}
          <div className="mt-4 border-t border-[#ECECEC]/40 dark:border-white/5 pt-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="type-small font-medium text-[#8B8B8B]">Profile Setup Progress</span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{progressPercent}%</span>
            </div>
            <div className="h-1 w-full bg-[#ECECEC] dark:bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 flex flex-col gap-1 relative">
          {steps.map((step, idx) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const StepIcon = getStepIcon(step.label);
            return (
              <div key={step.id} className="relative group">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentStep(step.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all relative z-10 text-left
                    ${isActive 
                      ? "bg-black/5 dark:bg-white/10 text-black dark:text-white" 
                      : "text-[#616161] dark:text-gray-400 hover:bg-[#FAFAF9] dark:hover:bg-white/5 hover:text-[#161616] dark:hover:text-white"}`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-200
                    ${isActive 
                      ? "bg-black dark:bg-white text-white dark:text-black border-transparent" 
                      : isCompleted 
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20" 
                        : "bg-white dark:bg-[#1C1C1E] text-[#8B8B8B] dark:text-gray-500 border border-[#ECECEC] dark:border-white/10 group-hover:border-gray-300 dark:group-hover:border-gray-700"}`}
                  >
                    <StepIcon size={14} strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className={`type-body-medium truncate ${isActive ? "font-medium" : ""}`}>
                      {step.label}
                    </span>
                    {step.label !== "Review & Submit" && (
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 shrink-0">
                        {getStepCompletionPercent(step.id, formData)}%
                      </span>
                    )}
                  </div>
                </motion.button>
                {idx < steps.length - 1 && (
                  <div className={`absolute left-[30px] top-[40px] bottom-[-14px] w-[1.5px] z-0 pointer-events-none transition-colors ${isCompleted ? 'bg-emerald-500/30' : 'bg-[#ECECEC] dark:bg-white/5'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col bg-[#FAFAF9] dark:bg-[#121217] relative min-w-0 h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto page-scrollbar px-8 py-8 pb-[100px]">

          <div className="flex items-center justify-between mb-8 max-w-[1000px] mx-auto w-full">
            <div>
              <h2 className="type-h2 font-semibold text-[#161616] dark:text-white mb-1.5">{stepHeading}</h2>
              <p className="type-small text-[#737373] dark:text-gray-400">
                {currentStep === 1 && "Let's start with your basic personal details."}
                {currentStep !== 1 && "Please enter accurate details to maintain platform integrity."}
              </p>
            </div>
            <motion.button 
              whileTap={{ scale: 0.97 }}
              onClick={handleSaveDraftClick} 
              disabled={saving} 
              className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-[#E5E7EB] dark:border-white/10 type-body-medium font-medium text-[#161616] dark:text-white hover:bg-neutral-50 dark:hover:bg-white/5 transition-all bg-white dark:bg-[#1C1C1E] disabled:opacity-40"
            >
              {saving ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border border-black dark:border-white border-t-transparent" />
              ) : (
                <Save className="h-3.5 w-3.5" strokeWidth={2.2} />
              )}
              {saving ? 'Saving...' : 'Save Draft'}
            </motion.button>
          </div>

          <div className="flex flex-col gap-6 max-w-[1000px] mx-auto w-full">
            {errorProp && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">{errorProp}</div>}

            {/* --- STEP 1: Personal Information (Basic Details) --- */}
            {currentStep === 1 && (
              <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-8">
                <h4 className="type-h3 font-semibold text-[#161616] dark:text-white mb-4 pb-2 border-b border-[#ECECEC] dark:border-white/10">Profile Picture</h4>
                <div className="flex items-center gap-6 mb-8">
                  {/* Circular Avatar Display */}
                  <div className="relative group h-20 w-20 rounded-[18px] border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden bg-gray-50">
                    {formData.profilePhotoUrl ? (
                      <img
                        src={typeof formData.profilePhotoUrl === "string" ? formData.profilePhotoUrl : URL.createObjectURL(formData.profilePhotoUrl as any)}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <img
                        src={getUserAvatarUrl(null)}
                        alt="Default Profile"
                        className="w-full h-full object-cover"
                      />
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
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => document.getElementById('profile-pic-input')?.click()}
                        className="px-4 py-2.5 rounded-[10px] type-body-medium font-medium transition-colors bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" strokeWidth={2.2} />
                        Choose Image
                      </motion.button>
                      {formData.profilePhotoUrl && (
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={() => handleChange('profilePhotoUrl', '')}
                          className="px-4 py-2.5 rounded-[10px] type-body-medium font-medium transition-colors bg-gray-100 text-[#FF3B30] hover:bg-red-50 dark:bg-white/5 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" strokeWidth={2.2} />
                          Use Default Avatar
                        </motion.button>
                      )}
                    </div>
                    <p className="type-small text-[#737373] dark:text-gray-400">Supported formats: JPG, PNG, WEBP. Max size: 5MB.</p>
                  </div>
                </div>

                <SectionHeader title="Basic Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex flex-col">
                    <Label>First Name</Label>
                    <input type="text" value={formData.firstName} onChange={e => handleChange('firstName', e.target.value)} placeholder="Enter First Name" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
                  </div>
                  <div className="flex flex-col">
                    <Label>Last Name / Surname</Label>
                    <input type="text" value={formData.lastName} onChange={e => handleChange('lastName', e.target.value)} placeholder="Enter Last Name" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="flex flex-col">
                    <Label>Date of Birth</Label>
                    <DateInput value={formData.dob} onChange={(v: string) => handleChange('dob', v)} />
                  </div>
                  <div className="flex flex-col">
                    <Label>Gender</Label>
                    <CustomSelect value={formData.gender} onChange={(v: string) => handleChange('gender', v)} options={['Male', 'Female', 'Other']} placeholder="Select Gender" />
                  </div>
                  <div className="flex flex-col">
                    <Label>Marital Status</Label>
                    <CustomSelect value={formData.maritalStatus} onChange={(v: string) => handleChange('maritalStatus', v)} options={['Single', 'Married', 'Divorced', 'Widowed']} placeholder="Select Status" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <Label>Nationality</Label>
                    <NationalitySearchSelect value={formData.nationality} onChange={(v: string) => { handleChange('nationality', v); const country = getCountryFromNationality(v); if (country) { handleChange('finIssuingCountry', country); } if (v === "Singapore") { handleChange('passType', ""); } }} placeholder="Select Nationality" />
                  </div>
                  <div className="flex flex-col">
                    <Label>Race</Label>
                    <CustomSelect value={formData.race} onChange={(v: string) => handleChange('race', v)} options={['Chinese', 'Malay', 'Indian', 'Eurasian', 'Caucasian', 'Other']} placeholder="Select Race" />
                  </div>
                  <div className="flex flex-col">
                    <Label>Religion</Label>
                    <CustomSelect value={formData.religion} onChange={(v: string) => handleChange('religion', v)} options={['Christianity', 'Islam', 'Hinduism', 'Buddhism', 'Judaism', 'Sikhism', 'Taoism', 'Bahá\'í', 'Shinto', 'Atheist / None', 'Other']} placeholder="Select Religion" />
                  </div>
                </div>

                {formData.nationality && formData.nationality !== "Singapore" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="flex flex-col">
                      <Label>Pass Type</Label>
                      <CustomSelect value={formData.passType} onChange={(v: string) => { handleChange('passType', v); if (v !== 'Work Permit') handleChange('workPermitSkill', ''); }} options={['Employment Pass (EP)', 'S Pass', 'Work Permit', 'Dependant Pass', 'LTVP', 'TEP', 'PR (Permanent Resident)']} />
                    </div>
                    {formData.passType === 'Work Permit' && (
                      <div className="flex flex-col animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label>Skill Status (Work Permit)</Label>
                        <CustomSelect value={formData.workPermitSkill} onChange={(v: string) => handleChange('workPermitSkill', v)} options={['Higher-skilled (R1)', 'Basic-skilled (R2)']} placeholder="Select Skill Status" />
                      </div>
                    )}
                  </div>
                )}

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
                        className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label>Instagram Profile URL</Label>
                      <input
                        type="url"
                        value={formData.instagramUrl || ""}
                        onChange={e => handleChange('instagramUrl', e.target.value)}
                        placeholder="https://instagram.com/username"
                        className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- STEP 2: Identity Information --- */}
            {currentStep === 2 && (
              <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-8">

                {(!formData.nationality || (formData.nationality !== "Singapore" && !formData.passType)) ? (
                  <div className="p-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl mb-6">
                    <h4 className="text-[14px] font-bold text-amber-800 dark:text-amber-400 mb-2">Additional Information Required</h4>
                    <p className="text-[12px] text-amber-700 dark:text-amber-300 font-medium mb-4 leading-relaxed">
                      Please select the Nationality and Pass Type first. These are required to determine if the employee is under NRIC or FIN schema.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col">
                        <Label>Nationality</Label>
                        <NationalitySearchSelect 
                          value={formData.nationality} 
                          onChange={(v: string) => { 
                            handleChange('nationality', v); 
                            const country = getCountryFromNationality(v); 
                            if (country) { handleChange('finIssuingCountry', country); } 
                            if (v === "Singapore") { handleChange('passType', ""); } 
                          }} 
                          placeholder="Select Nationality" 
                        />
                      </div>
                      {formData.nationality && formData.nationality !== "Singapore" && (
                        <>
                          <div className="flex flex-col">
                            <Label>Pass Type</Label>
                            <CustomSelect 
                              value={formData.passType} 
                              onChange={(v: string) => { handleChange('passType', v); if (v !== 'Work Permit') handleChange('workPermitSkill', ''); }} 
                              options={['Employment Pass (EP)', 'S Pass', 'Work Permit', 'Dependant Pass', 'LTVP', 'TEP', 'PR (Permanent Resident)']} 
                              placeholder="Select Pass Type"
                            />
                          </div>
                          {formData.passType === 'Work Permit' && (
                            <div className="flex flex-col animate-in fade-in slide-in-from-top-2 duration-300">
                              <Label>Skill Status (Work Permit)</Label>
                              <CustomSelect value={formData.workPermitSkill} onChange={(v: string) => handleChange('workPermitSkill', v)} options={['Higher-skilled (R1)', 'Basic-skilled (R2)']} placeholder="Select Skill Status" />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {formData.identityType === "NRIC" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                          <Label>NRIC Number</Label>
                          <input type="text" value={formData.nricNumber} onChange={e => handleChange('nricNumber', e.target.value)} placeholder="Enter NRIC Number" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
                        </div>
                        <div className="flex flex-col">
                          <Label>Tax Identification (if required)</Label>
                          <input type="text" value={formData.taxId} onChange={e => handleChange('taxId', e.target.value)} className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
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
                            className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
                          />
                        </div>
                        <div className="flex flex-col">
                          <Label>Passport Expiry Date</Label>
                          <DateInput value={formData.finPassportExpiryDate} onChange={(v: string) => handleChange('finPassportExpiryDate', v)} />
                        </div>
                        <div className="flex flex-col">
                          <Label>NRIC Copy</Label>
                          <FileUpload empName={formData.firstName} empId={formData.empId}
                            value={formData.nricCopyUrl}
                            onChange={(file: File) => handleChange('nricCopyUrl', file)}
                          />
                        </div>

                        <div className="flex flex-col">
                          <Label>Passport Copy</Label>
                          <FileUpload empName={formData.firstName} empId={formData.empId}
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
                          <Label>FIN Number</Label>
                          <input
                            type="text"
                            value={formData.finNumber}
                            onChange={e => {
                              const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 9);
                              handleChange('finNumber', val);
                            }}
                            placeholder="Enter FIN Number"
                            maxLength={9}
                            className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
                          />
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
                            className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
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
                          <Label>Pass Number</Label>
                          <input type="text" value={formData.passNumber} onChange={e => handleChange('passNumber', e.target.value)} placeholder="Enter Pass Number" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
                        </div>
                        <div className="flex flex-col">
                          <Label>Pass Issue Date</Label>
                          <DateInput value={formData.passIssueDate} onChange={(v: string) => handleChange('passIssueDate', v)} />
                        </div>
                        <div className="flex flex-col">
                          <Label>Pass Expiry Date</Label>
                          <DateInput value={formData.passExpiryDate} onChange={(v: string) => handleChange('passExpiryDate', v)} />
                        </div>
                        {formData.passType === 'Work Permit' && (
                          <div className="flex flex-col">
                            <Label>Skill Status (Work Permit)</Label>
                            <CustomSelect value={formData.workPermitSkill} onChange={(v: string) => handleChange('workPermitSkill', v)} options={['Higher-skilled (R1)', 'Basic-skilled (R2)']} placeholder="Select Skill Status" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <Label>Pass Copy</Label>
                          <FileUpload empName={formData.firstName} empId={formData.empId}
                            value={formData.finCardUrl}
                            onChange={(file: File) => handleChange('finCardUrl', file)}
                            label="Pass Copy"
                          />
                        </div>
                        <div className="flex flex-col">
                          <Label>Passport Copy</Label>
                          <FileUpload empName={formData.firstName} empId={formData.empId}
                            value={formData.finPassportCopyUrl}
                            onChange={(file: File) => handleChange('finPassportCopyUrl', file)}
                            label="Passport Copy"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* --- STEP 3: Work Details --- */}
            {currentStep === 3 && (
              <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-8">

                <h4 className="text-[14px] font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Official Identifiers</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex flex-col">
                    <Label>Employee ID</Label>
                    <input
                      type="text"
                      value={formData.empId}
                      onChange={e => handleChange('empId', e.target.value)}
                      placeholder="Enter Employee ID"
                      className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
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
                              <span className="text-[13px] font-bold text-gray-800 dark:text-white uppercase tracking-wider">Role & Department Assignment</span>
                            </div>
                            <p className="text-[13px] text-gray-500 dark:text-gray-400">
                              To change the employee's Department, please manage them through the <a href="/departments" className="text-blue-600 hover:underline">Departments</a> page.
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="flex flex-col">
                            <Label>Assigned Department</Label>
                            <div className="h-11 px-3 w-full bg-gray-50 dark:bg-[#1C1C22] border border-gray-200 dark:border-[#2C2C35] rounded-[8px] flex items-center text-[13px] font-medium text-gray-500 cursor-not-allowed">
                              {departments.find((d: any) => String(d.id) === String(formData.departmentId))?.department_name || "Department"}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <Label>App Role</Label>
                            <CustomSelect
                              value={formData.role}
                              onChange={(v: string) => handleChange('role', v)}
                              options={availableRoles.filter((r: string) => r !== "Admin")}
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
                          options={departments.filter((d: any) => d.department_name !== "Admin Department" || String(d.id) === String(formData.departmentId)).map((d: any) => ({ value: String(d.id), label: d.department_name }))}
                          placeholder="Select Department"
                        />
                      </div>
                      <div className="flex flex-col">
                        <Label>App Role</Label>
                        <CustomSelect
                          value={formData.role}
                          onChange={(v: string) => handleChange('role', v)}
                          options={availableRoles.filter((r: string) => r !== "Admin")}
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
                      <Label>End Date</Label>
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
                    <Label>Shift type</Label>
                    <CustomSelect
                      value={formData.shiftType}
                      onChange={(v: string) => handleChange('shiftType', v)}
                      options={['Morning', 'Night', 'Rotational']}
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
                        <Label>Overtime Hours Limit (hrs)</Label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.overtimeWorkingHours || ""}
                          onChange={e => handleChange('overtimeWorkingHours', e.target.value)}
                          placeholder="e.g. 44"
                          className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
                        />
                      </div>
                      <div className="flex flex-col">
                        <Label>Calculation Period</Label>
                        <CustomSelect
                          value={formData.overtimePeriod || "monthly"}
                          onChange={(v: string) => handleChange('overtimePeriod', v)}
                          options={['weekly', 'monthly']}
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* --- STEP 4: Tax Details --- */}
            {currentStep === 4 && (
              <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-8">
                {/* Confirmation Modal */}
                {showConfirmAutoCal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[4px] transition-all">
                    <div className="bg-white border border-[#E5E5EA] rounded-[20px] p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#E5F1FF] flex items-center justify-center text-[#007AFF]">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h4 className="text-[16px] font-bold text-gray-900">Confirm Auto-Calculation</h4>
                      </div>
                      <p className="text-[13px] text-gray-500 leading-relaxed">
                        This will re-calculate CPF contributions, Self-Help Group (SHG) funds, SDL, and Foreign Worker Levy based on Singapore statutory regulations (MOM/CPF). 
                      </p>
                      <p className="text-[10px] text-gray-400 mt-3 font-medium italic opacity-70">
                        * Note: Auto-calculation provides an estimate and may not account for all exceptions. Please review the values manually.
                      </p>
                      <div className="flex gap-3 mt-6">
                        <button
                          type="button"
                          onClick={() => setShowConfirmAutoCal(false)}
                          className="flex-1 h-10 border border-[#E5E5EA] hover:bg-gray-50 text-gray-700 text-[13px] font-bold rounded-[8px] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleStartAutoCalculation}
                          className="flex-1 h-10 bg-[#007AFF] hover:bg-[#0063CC] text-white text-[13px] font-bold rounded-[8px] transition-colors"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Calculation Summary Modal */}
                {showCalcSummary && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[4px] transition-all p-4">
                    <div className="bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-white/10 rounded-[24px] p-8 max-w-4xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left flex flex-col max-h-[90vh]">
                      <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-[16px] font-bold text-gray-900 dark:text-white">Statutory Calculation Summary</h4>
                            <p className="text-[11px] text-gray-500">Vertex HRMS Calculation Engine</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCalcSummary(false)}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-2 space-y-8 min-h-[400px]">
                        {/* Section 1: Parameters Analyzed */}
                        <div>
                          <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2.5">1. Reference Bases & Parameters</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-neutral-900/40 p-4 rounded-xl text-[12px]">
                            <div className="flex justify-between py-1 border-b border-gray-200/40 dark:border-white/5">
                              <span className="text-gray-500">Gross Salary:</span>
                              <span className="font-bold text-gray-900 dark:text-white">S$ {grossSalaryNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-200/40 dark:border-white/5">
                              <span className="text-gray-500">Capped CPF Salary:</span>
                              <span className="font-bold text-gray-900 dark:text-white">S$ {cappedCpfSalaryNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-200/40 dark:border-white/5">
                              <span className="text-gray-500">Employee Age:</span>
                              <span className="font-bold text-gray-900 dark:text-white">{getAge(formData.dob)} years</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-200/40 dark:border-white/5">
                              <span className="text-gray-500">Residency Status:</span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {formData.identityType === "NRIC" ? (formData.nricResidentialStatus || "Singapore Citizen") : "FIN (Foreigner)"}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-200/40 dark:border-white/5">
                              <span className="text-gray-500">Company Local Workers:</span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {quotaData.localFullCount + quotaData.localHalfCount} ({quotaData.localFullCount} Full, {quotaData.localHalfCount} Half)
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-200/40 dark:border-white/5">
                              <span className="text-gray-500">Company Foreign Workers:</span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {quotaData.sPassCount + quotaData.workPermitCount} ({quotaData.sPassCount} S Pass, {quotaData.workPermitCount} WP)
                              </span>
                            </div>
                            {formData.identityType === "FIN" && (
                              <>
                                <div className="flex justify-between py-1 border-b border-gray-200/40 dark:border-white/5">
                                  <span className="text-gray-500">Pass Type:</span>
                                  <span className="font-bold text-gray-900 dark:text-white">{formData.passType || "—"}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-gray-200/40 dark:border-white/5">
                                  <span className="text-gray-500">Company Sector:</span>
                                  <span className="font-bold text-gray-900 dark:text-white">{companySector || "—"}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Section 2: Employee Deductions */}
                        <div>
                          <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2.5">2. Employee Deductions (Subtracted from Salary)</h5>
                          <div className="bg-gray-50 dark:bg-neutral-900/40 p-4 rounded-xl text-[12px] space-y-3">
                            {employeeDeductionItems.length > 0 ? (
                              employeeDeductionItems.map((item, index) => (
                                <div key={item.label} className={`flex flex-col gap-1 ${index > 0 ? "border-t border-gray-200/40 dark:border-white/5 pt-2.5" : ""}`}>
                                  <div className="flex justify-between font-semibold">
                                    <span className="text-gray-700 dark:text-gray-300">{item.label}:</span>
                                    <span className="text-gray-900 dark:text-white">S$ {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                  <span className="text-[10px] text-gray-400">{item.formula}</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-500 text-center py-2">
                                No statutory employee deductions applicable.
                              </div>
                            )}

                            <div className="border-t border-gray-300 dark:border-white/10 pt-3 flex justify-between font-bold text-[13px]">
                              <span className="text-gray-900 dark:text-white">Total Employee Deductions:</span>
                              <span className="text-[#FF3B30] dark:text-[#FF453A]">
                                S$ {(displayCpfEmployee + activeShgAmount + displayIncomeTaxAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Employer Contributions */}
                        <div>
                          <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2.5">3. Employer Contributions (Additional Company Cost)</h5>
                          <div className="bg-gray-50 dark:bg-neutral-900/40 p-4 rounded-xl text-[12px] space-y-3">
                            {employerContributionItems.length > 0 ? (
                              employerContributionItems.map((item, index) => (
                                <div key={item.label} className={`flex flex-col gap-1 ${index > 0 ? "border-t border-gray-200/40 dark:border-white/5 pt-2.5" : ""}`}>
                                  <div className="flex justify-between font-semibold">
                                    <span className="text-gray-700 dark:text-gray-300">{item.label}:</span>
                                    <span className="text-gray-900 dark:text-white">S$ {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                  <span className="text-[10px] text-gray-400">{item.formula}</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-500 text-center py-2">
                                No statutory employer contributions applicable.
                              </div>
                            )}

                            <div className="border-t border-gray-300 dark:border-white/10 pt-3 flex justify-between font-bold text-[13px]">
                              <span className="text-gray-900 dark:text-white">Total Employer Contributions:</span>
                              <span className="text-[#34C759] dark:text-[#30D158]">
                                S$ {(displayCpfEmployer + displaySdl + displayFwl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6 border-t pt-4 border-gray-100 dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => setShowCalcSummary(false)}
                          className="flex-1 h-10 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black text-[13px] font-bold rounded-[8px] transition-colors"
                        >
                          Close Summary
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {showTaxCalculatedPopup && pendingCalculatedTax && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[4px] transition-all">
                    <div className="bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-white/10 rounded-[20px] p-6 max-w-xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left">
                      <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-[16px] font-bold text-gray-900 dark:text-white">Apply Calculated Statutory Rates?</h4>
                            <p className="text-[11px] text-gray-500">Vertex HRMS Calculation Output</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowTaxCalculatedPopup(false)}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-6 max-h-[480px] overflow-y-auto pr-1">
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl text-[12px] text-amber-800 dark:text-amber-300">
                          <p className="font-semibold mb-1">Verify and Apply Rates</p>
                          Please review the calculated statutory values before applying. Once applied, these values will populate the salary fields but can still be adjusted manually.
                        </div>

                        <div className="space-y-4">
                          {/* Employee Deductions */}
                          <div>
                            <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Employee Deductions</h5>
                            <div className="bg-gray-50 dark:bg-neutral-900/40 p-4 rounded-xl text-[12px] space-y-2">
                              {parseFloat(pendingCalculatedTax.customCpfEmployee) > 0 && (
                                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/5">
                                  <span className="text-gray-500">Employee CPF:</span>
                                  <span className="font-semibold text-gray-950 dark:text-white">S$ {parseFloat(pendingCalculatedTax.customCpfEmployee).toFixed(2)} ({pendingCalculatedTax.customCpfEmployeeRate}%)</span>
                                </div>
                              )}
                              {pendingCalculatedTax.shgContribution !== "None" && parseFloat(pendingCalculatedTax.shgAmount) > 0 && (
                                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/5">
                                  <span className="text-gray-500">Self-Help Group ({pendingCalculatedTax.shgContribution}):</span>
                                  <span className="font-semibold text-gray-950 dark:text-white">S$ {parseFloat(pendingCalculatedTax.shgAmount).toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between py-1 font-bold text-gray-900 dark:text-white pt-1">
                                <span>Total Employee Deductions:</span>
                                <span>S$ {(parseFloat(pendingCalculatedTax.customCpfEmployee) + (pendingCalculatedTax.shgContribution !== "None" ? parseFloat(pendingCalculatedTax.shgAmount) : 0)).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Employer Contributions */}
                          <div>
                            <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Employer Contributions</h5>
                            <div className="bg-gray-50 dark:bg-neutral-900/40 p-4 rounded-xl text-[12px] space-y-2">
                              {parseFloat(pendingCalculatedTax.customCpfEmployer) > 0 && (
                                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/5">
                                  <span className="text-gray-500">Employer CPF:</span>
                                  <span className="font-semibold text-gray-950 dark:text-white">S$ {parseFloat(pendingCalculatedTax.customCpfEmployer).toFixed(2)} ({pendingCalculatedTax.customCpfEmployerRate}%)</span>
                                </div>
                              )}
                              {parseFloat(pendingCalculatedTax.customSdl) > 0 && (
                                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/5">
                                  <span className="text-gray-500">Skills Development Levy (SDL):</span>
                                  <span className="font-semibold text-gray-950 dark:text-white">S$ {parseFloat(pendingCalculatedTax.customSdl).toFixed(2)} ({pendingCalculatedTax.customSdlRate}%)</span>
                                </div>
                              )}
                              {parseFloat(pendingCalculatedTax.foreignWorkerLevy) > 0 && (
                                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/5">
                                  <span className="text-gray-500">Foreign Worker Levy (FWL):</span>
                                  <span className="font-semibold text-gray-950 dark:text-white">S$ {parseFloat(pendingCalculatedTax.foreignWorkerLevy).toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between py-1 font-bold text-gray-900 dark:text-white pt-1">
                                <span>Total Employer Cost:</span>
                                <span>S$ {(parseFloat(pendingCalculatedTax.customCpfEmployer) + parseFloat(pendingCalculatedTax.customSdl) + parseFloat(pendingCalculatedTax.foreignWorkerLevy)).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-6 border-t pt-4 border-gray-100 dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => setShowTaxCalculatedPopup(false)}
                          className="h-10 px-4 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 text-[13px] font-bold rounded-[8px] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsTaxEdited(true);
                            setFormData(prev => ({
                              ...prev,
                              ...pendingCalculatedTax
                            }));
                            setShowTaxCalculatedPopup(false);
                          }}
                          className="h-10 px-5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black text-[13px] font-bold rounded-[8px] transition-colors"
                        >
                          Apply Tax Details
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse"></span>
                    <span className="text-[12px] font-semibold text-gray-500">
                      {isTaxEdited ? "Statutory values locked (manual edits allowed)" : "Rates synchronized with CPF/MOM schedules"}
                    </span>
                  </div>
                  {previousTaxData && (
                    <button
                      type="button"
                      onClick={handleUndoAutoCalculation}
                      className="text-[12px] font-bold text-[#007AFF] hover:underline"
                    >
                      Undo Auto-Calculate
                    </button>
                  )}
                </div>

                {/* Salary Input Block */}
                <div className="mb-8 p-5 border border-[#E5E5EA] rounded-[16px] bg-gray-50/30">
                  <h4 className="text-[14px] font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Salary Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-1.5">
                        <Label>Salary</Label>
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
                          className={`h-11 pl-8 pr-3 w-full border border-[#E5E5EA] rounded-[8px] text-[13px] font-semibold outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 ${formData.salaryNotApplicable ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-900'}`}
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
                          <span className="text-[11px] text-gray-500 leading-tight mt-0.5">Convert into professional (in case of your friend or others who doesn't work in your company)</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Allowances Section */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
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
                              className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
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
                              className="h-11 pl-8 pr-3 w-full bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] font-semibold text-gray-900 outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
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

              {/* Auto-Calculate Action Card */}
              {!isAutoCalculating && (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 border border-[#ECECEC] dark:border-white/10 rounded-[12px] bg-gray-50 dark:bg-neutral-900/30 mb-8">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/30 animate-pulse">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-gray-900 dark:text-white">
                          Vertex HRMS Statutory Auto-Calculator
                        </h4>
                        <p className="text-[12px] text-[#616161] dark:text-gray-400 mt-1.5 leading-relaxed">
                          Automatically calculate CPF contributions, Self-Help Group (SHG) funds, Skills Development Levy (SDL), and Foreign Worker Levy (FWL) based on the latest MOM and CPF Board rules.
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowCalcSummary(true)}
                            className="text-[11px] text-[#007AFF] hover:underline font-bold inline-flex items-center gap-1"
                          >
                            <Info className="w-3.5 h-3.5" />
                            Calculation Summary (Click to view)
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowConfirmAutoCal(true)}
                      className="h-10 px-5 flex items-center gap-2 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black text-[13px] font-bold rounded-[8px] transition-colors shrink-0"
                    >
                      <Wand2 className="w-4 h-4" />
                      Run Auto-Calculator
                    </button>
                  </div>
                )}

                {/* Loading State or Tables */}
                {isAutoCalculating ? (
                  <div className="border border-[#E5E5EA] rounded-[16px] p-10 bg-gray-50/50 flex flex-col items-center justify-center min-h-[300px] text-center mb-8">
                    <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-[#007AFF]/10 border-t-[#007AFF] animate-spin"></div>
                      <div className="w-12 h-12 rounded-full bg-[#E5F1FF] flex items-center justify-center animate-pulse text-[#007AFF]">
                        <Sparkles className="w-6 h-6" />
                      </div>
                    </div>
                    <h4 className="text-[15px] font-bold text-gray-800 animate-pulse">{autoCalMessage}</h4>
                    <div className="w-64 bg-gray-200 h-1.5 rounded-full overflow-hidden mt-4 mx-auto">
                      <div 
                        className="bg-[#007AFF] h-1.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${autoCalProgress}%` }}
                      ></div>
                    </div>
                    <span className="text-[11px] text-gray-400 mt-2 font-medium">{autoCalProgress}% completed</span>
                  </div>
                ) : (
                  <>
                    {/* Employee Contributions */}
                    <div className="mb-8">
                      <h4 className="text-[16px] font-bold text-gray-900 mb-4 text-left">Employee Contributions (Monthly)</h4>
                      <div className="border border-[#E5E5EA] rounded-[12px] overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-[#E5E5EA] text-[13px] font-semibold text-gray-500">
                              <th className="py-3 px-4 w-[50%] font-medium">Description</th>
                              <th className="py-3 px-4 w-[15%] font-medium">Rate</th>
                              <th className="py-3 px-4 w-[25%] font-medium">Amount (SGD)</th>
                              <th className="py-3 px-4 w-[10%] text-center font-medium">Reset</th>
                            </tr>
                          </thead>
                          <tbody className="text-[13px] font-medium text-gray-900">
                            {formData.identityType !== "FIN" && (
                              <tr className="border-b border-[#E5E5EA]">
                                <td className="py-4 px-4 text-left">
                                  <div className="font-semibold">CPF Employee</div>
                                  <div className="text-gray-500 text-[12px] mt-0.5">Employee CPF Contribution</div>
                                </td>
                                <td className="py-4 px-4 text-left">
                                  <div className="flex items-center gap-1">
                                    <input 
                                      type="text" 
                                      value={formData.customCpfEmployeeRate !== undefined ? formData.customCpfEmployeeRate : displayCpfEmployeeRate} 
                                      onChange={(e) => { 
                                        const r = e.target.value; 
                                        handleChange("customCpfEmployeeRate", r); 
                                        if (r === "") { 
                                          handleChange("customCpfEmployee", ""); 
                                        } else if (cappedCpfSalaryNum > 0) { 
                                          handleChange("customCpfEmployee", (cappedCpfSalaryNum * (parseFloat(r) || 0) / 100).toFixed(2)); 
                                        } 
                                      }} 
                                      className="w-16 h-9 px-2 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 text-center font-medium text-gray-950 bg-white" 
                                    /> %
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-left">
                                  <input 
                                    type="text" 
                                    value={formData.customCpfEmployee !== undefined ? formData.customCpfEmployee : displayCpfEmployee.toFixed(2)} 
                                    onChange={(e) => { 
                                      const a = e.target.value; 
                                      handleChange("customCpfEmployee", a); 
                                      if (a === "") { 
                                        handleChange("customCpfEmployeeRate", ""); 
                                      } else if (cappedCpfSalaryNum > 0) { 
                                        handleChange("customCpfEmployeeRate", (((parseFloat(a) || 0) / cappedCpfSalaryNum) * 100).toFixed(2)); 
                                      } 
                                    }} 
                                    className="w-full h-9 px-3 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 font-medium text-gray-950 bg-white" 
                                  />
                                </td>
                                <td className="py-4 px-4 text-center text-[#007AFF] cursor-pointer" onClick={() => { 
                                  handleChange("customCpfEmployee", undefined); 
                                  handleChange("customCpfEmployeeRate", undefined); 
                                }} title="Reset to auto-calculated">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto hover:scale-110 transition-transform"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                                </td>
                              </tr>
                            )}
                            <tr className="border-b border-[#E5E5EA]">
                              <td className="py-4 px-4 text-left">
                                <div className="font-semibold">CDAC</div>
                                <div className="text-gray-500 text-[12px] mt-0.5">Chinese Development Assistance Council</div>
                              </td>
                              <td className="py-4 px-4 text-left">
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="text" 
                                    value={formData.customCdacRate !== undefined ? formData.customCdacRate : (formData.shgContribution === "CDAC" ? displayCdacRate : "0.00")} 
                                    onChange={(e) => { 
                                      const r = e.target.value; 
                                      handleChange("customCdacRate", r); 
                                      if (formData.shgContribution !== "CDAC") handleChange("shgContribution", "CDAC"); 
                                      if (r !== "" && grossSalaryNum > 0) { 
                                        handleChange("customCdacAmount", (grossSalaryNum * (parseFloat(r) || 0) / 100).toFixed(2)); 
                                      } 
                                    }} 
                                    className="w-16 h-9 px-2 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 text-center font-medium text-gray-950 bg-white" 
                                  /> %
                                </div>
                              </td>
                              <td className="py-4 px-4 text-left">
                                <input 
                                  type="text" 
                                  value={formData.customCdacAmount !== undefined ? formData.customCdacAmount : (formData.shgContribution === "CDAC" ? formData.shgAmount : "0.00")} 
                                  onChange={(e) => { 
                                    const a = e.target.value; 
                                    if (formData.shgContribution !== "CDAC") handleChange("shgContribution", "CDAC"); 
                                    handleChange("customCdacAmount", a); 
                                    if (a !== "" && grossSalaryNum > 0) { 
                                      handleChange("customCdacRate", (((parseFloat(a) || 0) / grossSalaryNum) * 100).toFixed(2)); 
                                    } 
                                  }} 
                                  className="w-full h-9 px-3 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 font-medium text-gray-950 bg-white" 
                                />
                              </td>
                              <td className="py-4 px-4 text-center text-[#007AFF] cursor-pointer" onClick={() => { 
                                handleChange("customCdacRate", undefined); 
                                handleChange("customCdacAmount", undefined); 
                                if (formData.shgContribution === "CDAC") handleChange("shgContribution", undefined);
                              }} title="Reset to auto-calculated">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto hover:scale-110 transition-transform"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                              </td>
                            </tr>
                            <tr className="border-b border-[#E5E5EA]">
                              <td className="py-4 px-4 text-left">
                                <div className="font-semibold">SINDA</div>
                                <div className="text-gray-500 text-[12px] mt-0.5">Singapore Indian Development Association</div>
                              </td>
                              <td className="py-4 px-4 text-left">
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="text" 
                                    value={formData.customSindaRate !== undefined ? formData.customSindaRate : (formData.shgContribution === "SINDA" ? displaySindaRate : "0.00")} 
                                    onChange={(e) => { 
                                      const r = e.target.value; 
                                      handleChange("customSindaRate", r); 
                                      if (formData.shgContribution !== "SINDA") handleChange("shgContribution", "SINDA"); 
                                      if (r !== "" && grossSalaryNum > 0) { 
                                        handleChange("customSindaAmount", (grossSalaryNum * (parseFloat(r) || 0) / 100).toFixed(2)); 
                                      } 
                                    }} 
                                    className="w-16 h-9 px-2 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 text-center font-medium text-gray-950 bg-white" 
                                  /> %
                                </div>
                              </td>
                              <td className="py-4 px-4 text-left">
                                <input 
                                  type="text" 
                                  value={formData.customSindaAmount !== undefined ? formData.customSindaAmount : (formData.shgContribution === "SINDA" ? formData.shgAmount : "0.00")} 
                                  onChange={(e) => { 
                                    const a = e.target.value; 
                                    if (formData.shgContribution !== "SINDA") handleChange("shgContribution", "SINDA"); 
                                    handleChange("customSindaAmount", a); 
                                    if (a !== "" && grossSalaryNum > 0) { 
                                      handleChange("customSindaRate", (((parseFloat(a) || 0) / grossSalaryNum) * 100).toFixed(2)); 
                                    } 
                                  }} 
                                  className="w-full h-9 px-3 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 font-medium text-gray-950 bg-white" 
                                />
                              </td>
                              <td className="py-4 px-4 text-center text-[#007AFF] cursor-pointer" onClick={() => { 
                                handleChange("customSindaRate", undefined); 
                                handleChange("customSindaAmount", undefined); 
                                if (formData.shgContribution === "SINDA") handleChange("shgContribution", undefined);
                              }} title="Reset to auto-calculated">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto hover:scale-110 transition-transform"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                              </td>
                            </tr>
                            <tr className="border-b border-[#E5E5EA]">
                              <td className="py-4 px-4 text-left">
                                <div className="font-semibold">MBMF</div>
                                <div className="text-gray-500 text-[12px] mt-0.5">Majlis Ugama Islam Singapura</div>
                              </td>
                              <td className="py-4 px-4 text-left">
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="text" 
                                    value={formData.customMbmfRate !== undefined ? formData.customMbmfRate : (formData.shgContribution === "MBMF" ? displayMbmfRate : "0.00")} 
                                    onChange={(e) => { 
                                      const r = e.target.value; 
                                      handleChange("customMbmfRate", r); 
                                      if (formData.shgContribution !== "MBMF") handleChange("shgContribution", "MBMF"); 
                                      if (r !== "" && grossSalaryNum > 0) { 
                                        handleChange("customMbmfAmount", (grossSalaryNum * (parseFloat(r) || 0) / 100).toFixed(2)); 
                                      } 
                                    }} 
                                    className="w-16 h-9 px-2 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 text-center font-medium text-gray-950 bg-white" 
                                  /> %
                                </div>
                              </td>
                              <td className="py-4 px-4 text-left">
                                <input 
                                  type="text" 
                                  value={formData.customMbmfAmount !== undefined ? formData.customMbmfAmount : (formData.shgContribution === "MBMF" ? formData.shgAmount : "0.00")} 
                                  onChange={(e) => { 
                                    const a = e.target.value; 
                                    if (formData.shgContribution !== "MBMF") handleChange("shgContribution", "MBMF"); 
                                    handleChange("customMbmfAmount", a); 
                                    if (a !== "" && grossSalaryNum > 0) { 
                                      handleChange("customMbmfRate", (((parseFloat(a) || 0) / grossSalaryNum) * 100).toFixed(2)); 
                                    } 
                                  }} 
                                  className="w-full h-9 px-3 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 font-medium text-gray-950 bg-white" 
                                />
                              </td>
                              <td className="py-4 px-4 text-center text-[#007AFF] cursor-pointer" onClick={() => { 
                                handleChange("customMbmfRate", undefined); 
                                handleChange("customMbmfAmount", undefined); 
                                if (formData.shgContribution === "MBMF") handleChange("shgContribution", undefined);
                              }} title="Reset to auto-calculated">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto hover:scale-110 transition-transform"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                              </td>
                            </tr>
                            <tr className="border-b border-[#E5E5EA]">
                              <td className="py-4 px-4 text-left">
                                <div className="font-semibold">ECF</div>
                                <div className="text-gray-500 text-[12px] mt-0.5">Eurasian Community Fund</div>
                              </td>
                              <td className="py-4 px-4 text-left">
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="text" 
                                    value={formData.customEcfRate !== undefined ? formData.customEcfRate : (formData.shgContribution === "ECF" ? displayEcfRate : "0.00")} 
                                    onChange={(e) => { 
                                      const r = e.target.value; 
                                      handleChange("customEcfRate", r); 
                                      if (formData.shgContribution !== "ECF") handleChange("shgContribution", "ECF"); 
                                      if (r !== "" && grossSalaryNum > 0) { 
                                        handleChange("customEcfAmount", (grossSalaryNum * (parseFloat(r) || 0) / 100).toFixed(2)); 
                                      } 
                                    }} 
                                    className="w-16 h-9 px-2 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 text-center font-medium text-gray-950 bg-white" 
                                  /> %
                                </div>
                              </td>
                              <td className="py-4 px-4 text-left">
                                <input 
                                  type="text" 
                                  value={formData.customEcfAmount !== undefined ? formData.customEcfAmount : (formData.shgContribution === "ECF" ? formData.shgAmount : "0.00")} 
                                  onChange={(e) => { 
                                    const a = e.target.value; 
                                    if (formData.shgContribution !== "ECF") handleChange("shgContribution", "ECF"); 
                                    handleChange("customEcfAmount", a); 
                                    if (a !== "" && grossSalaryNum > 0) { 
                                      handleChange("customEcfRate", (((parseFloat(a) || 0) / grossSalaryNum) * 100).toFixed(2)); 
                                    } 
                                  }} 
                                  className="w-full h-9 px-3 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 font-medium text-gray-950 bg-white" 
                                />
                              </td>
                              <td className="py-4 px-4 text-center text-[#007AFF] cursor-pointer" onClick={() => { 
                                handleChange("customEcfRate", undefined); 
                                handleChange("customEcfAmount", undefined); 
                                if (formData.shgContribution === "ECF") handleChange("shgContribution", undefined);
                              }} title="Reset to auto-calculated">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto hover:scale-110 transition-transform"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                              </td>
                            </tr>
                          </tbody>
                          <tfoot className="bg-gray-50 border-t border-[#E5E5EA]">
                            <tr>
                              <td colSpan={2} className="py-4 px-4 text-[13px] font-bold text-gray-900 text-right">Total Employee Contributions</td>
                              <td colSpan={2} className="py-4 px-4 text-[13px] font-bold text-gray-900 text-left">
                                SGD {(displayCpfEmployee + activeShgAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Employer Contributions */}
                    <div className="mb-8">
                      <h4 className="text-[16px] font-bold text-gray-900 mb-4 text-left">Employer Contributions (Monthly)</h4>
                      <div className="border border-[#E5E5EA] rounded-[12px] overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-[#E5E5EA] text-[13px] font-semibold text-gray-500">
                              <th className="py-3 px-4 w-[50%] font-medium">Description</th>
                              <th className="py-3 px-4 w-[15%] font-medium">Rate</th>
                              <th className="py-3 px-4 w-[25%] font-medium">Amount (SGD)</th>
                              <th className="py-3 px-4 w-[10%] text-center font-medium">Reset</th>
                            </tr>
                          </thead>
                          <tbody className="text-[13px] font-medium text-gray-900">
                            {formData.identityType !== "FIN" && (
                              <tr className="border-b border-[#E5E5EA]">
                                <td className="py-4 px-4 text-left">
                                  <div className="font-semibold">CPF Employer</div>
                                  <div className="text-gray-500 text-[12px] mt-0.5">Employer CPF Contribution</div>
                                </td>
                                <td className="py-4 px-4 text-left">
                                  <div className="flex items-center gap-1">
                                    <input 
                                      type="text" 
                                      value={formData.customCpfEmployerRate !== undefined ? formData.customCpfEmployerRate : displayCpfEmployerRate} 
                                      onChange={(e) => { 
                                        const r = e.target.value; 
                                        handleChange("customCpfEmployerRate", r); 
                                        if (r === "") { 
                                          handleChange("customCpfEmployer", ""); 
                                        } else if (cappedCpfSalaryNum > 0) { 
                                          handleChange("customCpfEmployer", (cappedCpfSalaryNum * (parseFloat(r) || 0) / 100).toFixed(2)); 
                                        } 
                                      }} 
                                      className="w-16 h-9 px-2 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 text-center font-medium text-gray-950 bg-white" 
                                    /> %
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-left">
                                  <input 
                                    type="text" 
                                    value={formData.customCpfEmployer !== undefined ? formData.customCpfEmployer : displayCpfEmployer.toFixed(2)} 
                                    onChange={(e) => { 
                                      const a = e.target.value; 
                                      handleChange("customCpfEmployer", a); 
                                      if (a === "") { 
                                        handleChange("customCpfEmployerRate", ""); 
                                      } else if (cappedCpfSalaryNum > 0) { 
                                        handleChange("customCpfEmployerRate", (((parseFloat(a) || 0) / cappedCpfSalaryNum) * 100).toFixed(2)); 
                                      } 
                                    }} 
                                    className="w-full h-9 px-3 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 font-medium text-gray-950 bg-white" 
                                  />
                                </td>
                                <td className="py-4 px-4 text-center text-[#007AFF] cursor-pointer" onClick={() => { 
                                  handleChange("customCpfEmployer", undefined); 
                                  handleChange("customCpfEmployerRate", undefined); 
                                }} title="Reset to auto-calculated">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto hover:scale-110 transition-transform"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                                </td>
                              </tr>
                            )}
                            <tr className="border-b border-[#E5E5EA]">
                              <td className="py-4 px-4 text-left">
                                <div className="font-semibold">SDL (Skills Development Levy)</div>
                                <div className="text-gray-500 text-[12px] mt-0.5">0.25% of gross salary (Min $2, Max $11.25)</div>
                              </td>
                              <td className="py-4 px-4 text-left">
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="text" 
                                    value={formData.customSdlRate !== undefined ? formData.customSdlRate : displaySdlRate} 
                                    onChange={(e) => { 
                                      const r = e.target.value; 
                                      handleChange("customSdlRate", r); 
                                      if (r === "") { 
                                        handleChange("customSdl", ""); 
                                      } else if (grossSalaryNum > 0) { 
                                        handleChange("customSdl", (grossSalaryNum * (parseFloat(r) || 0) / 100).toFixed(2)); 
                                      } 
                                    }} 
                                    className="w-16 h-9 px-2 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 text-center font-medium text-gray-950 bg-white" 
                                  /> %
                                </div>
                              </td>
                              <td className="py-4 px-4 text-left">
                                <input 
                                  type="text" 
                                  value={formData.customSdl !== undefined ? formData.customSdl : displaySdl.toFixed(2)} 
                                  onChange={(e) => { 
                                    const a = e.target.value; 
                                    handleChange("customSdl", a); 
                                    if (a === "") { 
                                      handleChange("customSdlRate", ""); 
                                    } else if (grossSalaryNum > 0) { 
                                      handleChange("customSdlRate", (((parseFloat(a) || 0) / grossSalaryNum) * 100).toFixed(2)); 
                                    } 
                                  }} 
                                  className="w-full h-9 px-3 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 font-medium text-gray-950 bg-white" 
                                />
                              </td>
                              <td className="py-4 px-4 text-center text-[#007AFF] cursor-pointer" onClick={() => { 
                                handleChange("customSdl", undefined); 
                                handleChange("customSdlRate", undefined); 
                              }} title="Reset to auto-calculated">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto hover:scale-110 transition-transform"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                              </td>
                            </tr>
                            <tr>
                              <td className="py-4 px-4 text-left">
                                <div className="font-semibold">Foreign Worker Levy</div>
                                <div className="text-gray-500 text-[12px] mt-0.5">Levy based on pass & quota tier</div>
                              </td>
                              <td className="py-4 px-4 text-gray-400 text-left">-</td>
                              <td className="py-4 px-4 text-left">
                                <input 
                                  type="text" 
                                  value={formData.foreignWorkerLevy !== undefined && formData.foreignWorkerLevy !== "" ? formData.foreignWorkerLevy : displayFwl.toFixed(2)} 
                                  onChange={(e) => handleChange("foreignWorkerLevy", e.target.value)} 
                                  className="w-full h-9 px-3 border border-[#E5E5EA] rounded-[6px] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 font-medium text-gray-950 bg-white" 
                                />
                              </td>
                              <td className="py-4 px-4 text-center text-[#007AFF] cursor-pointer" onClick={() => handleChange("foreignWorkerLevy", undefined)} title="Reset to auto-calculated">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto hover:scale-110 transition-transform"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                              </td>
                            </tr>
                          </tbody>
                          <tfoot className="bg-gray-50 border-t border-[#E5E5EA]">
                            <tr>
                              <td colSpan={2} className="py-4 px-4 text-[13px] font-bold text-gray-900 text-right">Total Employer Contributions</td>
                              <td colSpan={2} className="py-4 px-4 text-[13px] font-bold text-gray-900 text-left">
                                SGD {(displayCpfEmployer + displaySdl + (formData.foreignWorkerLevy !== undefined && formData.foreignWorkerLevy !== "" ? parseFloat(formData.foreignWorkerLevy.replace(/,/g, '')) || 0 : displayFwl)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="mb-8">
                      <h4 className="text-[16px] font-bold text-gray-900 mb-4 text-left">Summary (Monthly)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Employee Pay Summary */}
                        <div className="border border-[#E5E5EA] rounded-[12px] p-5 text-left">
                          <h5 className="text-[14px] font-bold text-gray-900 mb-4">Employee Pay Summary</h5>
                          <div className="space-y-3 text-[13px]">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Gross Salary</span>
                              <span className="font-semibold text-gray-900">SGD {parseFloat((formData.salary || "0").replace(/,/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Total Allowances</span>
                              <span className="font-semibold text-gray-900">SGD {((formData.allowances || []).reduce((sum: number, a: any) => sum + parseFloat(a.amount.replace(/,/g, '') || "0"), 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Total Deductions</span>
                              <span className="font-semibold text-gray-900">- SGD {(displayCpfEmployee + activeShgAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="pt-3 border-t border-[#E5E5EA] flex justify-between items-center mt-3">
                              <span className="font-bold text-gray-900">Net Salary</span>
                              <span className="font-bold text-[#34C759]">SGD {(parseFloat((formData.salary || "0").replace(/,/g, '')) + ((formData.allowances || []).reduce((sum: number, a: any) => sum + parseFloat(a.amount.replace(/,/g, '') || "0"), 0)) - (displayCpfEmployee + activeShgAmount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>

                        {/* Employer Cost Summary */}
                        <div className="border border-[#E5E5EA] rounded-[12px] p-5 text-left">
                          <h5 className="text-[14px] font-bold text-gray-900 mb-4">Employer Cost Summary</h5>
                          <div className="space-y-3 text-[13px]">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Gross Salary</span>
                              <span className="font-semibold text-gray-900">SGD {parseFloat((formData.salary || "0").replace(/,/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Total Employer Contributions</span>
                              <span className="font-semibold text-gray-900">SGD {(displayCpfEmployer + displaySdl + (formData.foreignWorkerLevy !== undefined && formData.foreignWorkerLevy !== "" ? parseFloat(formData.foreignWorkerLevy.replace(/,/g, '')) || 0 : displayFwl)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Other Allowances</span>
                              <span className="font-semibold text-gray-900">SGD {((formData.allowances || []).reduce((sum: number, a: any) => sum + parseFloat(a.amount.replace(/,/g, '') || "0"), 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="pt-3 border-t border-[#E5E5EA] flex justify-between items-center mt-3">
                              <span className="font-bold text-gray-900">Total Employer Cost</span>
                              <span className="font-bold text-[#007AFF]">SGD {(parseFloat((formData.salary || "0").replace(/,/g, '')) + ((formData.allowances || []).reduce((sum: number, a: any) => sum + parseFloat(a.amount.replace(/,/g, '') || "0"), 0)) + (displayCpfEmployer + displaySdl + (formData.foreignWorkerLevy !== undefined && formData.foreignWorkerLevy !== "" ? parseFloat(formData.foreignWorkerLevy.replace(/,/g, '')) || 0 : displayFwl))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-8 text-center select-none pointer-events-none opacity-40">
                  <p className="text-[9px] text-[#A0A0A0] leading-normal font-medium">
                    Disclaimer: Auto-calculations are based on standard MOM and CPF schedules and are provided as estimates. The system does not guarantee zero errors; please verify all amounts against official sources.
                  </p>
                </div>
              </div>
            )}


            {/* --- STEP 5: Contact Information --- */}
            {currentStep === 5 && (
              <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-8">

                {formData.nationality === "Singapore" || !formData.nationality ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="flex flex-col">
                        <Label>Mobile Number</Label>
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
                          className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="flex flex-col md:col-span-3">
                        <Label>Residential Address</Label>
                        <input
                          type="text"
                          value={formData.residentialAddress}
                          onChange={(e) => handleChange("residentialAddress", e.target.value)}
                          placeholder="Enter Residential Address"
                          className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
                        />
                      </div>
                      <div className="flex flex-col">
                        <Label>Postal Code</Label>
                        <input
                          type="text"
                          value={formData.postalCode}
                          onChange={(e) => handleChange("postalCode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="Enter Postal Code"
                          maxLength={6}
                          className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
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
                          <Label>Mobile Number</Label>
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
                          <Label>Email Address</Label>
                          <input
                            type="email"
                            required
                            value={formData.currentEmail}
                            onChange={(e) => handleChange("currentEmail", e.target.value)}
                            placeholder="Primary email while in Singapore"
                            className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="flex flex-col md:col-span-3">
                          <Label>Current Residential Address</Label>
                          <input
                            type="text"
                            value={formData.currentResidentialAddress}
                            onChange={(e) => handleChange("currentResidentialAddress", e.target.value)}
                            placeholder="Address in Singapore"
                            className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
                          />
                        </div>
                        <div className="flex flex-col">
                          <Label>Postal Code</Label>
                          <input
                            type="text"
                            value={formData.currentPostalCode}
                            onChange={(e) => handleChange("currentPostalCode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="Postal Code"
                            maxLength={6}
                            className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
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
                            className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
                          />
                        </div>
                        <div className="flex flex-col">
                          <Label>Postal / ZIP Code</Label>
                          <input
                            type="text"
                            value={formData.nativePostalCode}
                            onChange={(e) => handleChange("nativePostalCode", e.target.value)}
                            placeholder="Postal / ZIP"
                            className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="flex flex-col">
                    <Label>Emergency Contact Name</Label>
                    <input type="text" value={formData.emergName} onChange={e => handleChange('emergName', e.target.value)} placeholder="Enter Contact Name" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
                  </div>
                  <div className="flex flex-col">
                    <Label>Relationship</Label>
                    <CustomSelect value={formData.emergRelation} onChange={(v: string) => handleChange('emergRelation', v)} options={['Parent', 'Spouse', 'Sibling', 'Friend']} placeholder="Select Relationship" />
                  </div>
                  <div className="flex flex-col">
                    <Label>Secondary Emergency Contact Number</Label>
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
                  <Label>Emergency Contact Address</Label>
                  <input type="text" value={formData.emergAddress} onChange={e => handleChange('emergAddress', e.target.value)} placeholder="Enter Contact Address" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
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
                      <input type="text" value={formData.higherEduInstName} onChange={e => handleChange('higherEduInstName', e.target.value)} placeholder="Enter Institution Name" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
                    </div>
                    <div className="flex flex-col">
                      <Label>Course Name</Label>
                      <input type="text" value={formData.higherEduCourseName} onChange={e => handleChange('higherEduCourseName', e.target.value)} placeholder="Enter Course Name" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
                    </div>
                    <div className="flex flex-col">
                      <Label>Course Duration</Label>
                      <input type="text" value={formData.higherEduCourseDuration} onChange={e => handleChange('higherEduCourseDuration', e.target.value)} placeholder="e.g. 3 years, 18 months" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
                    </div>
                    <div className="flex flex-col">
                      <Label>Highest Qualification</Label>
                      <CustomSelect value={formData.higherEduQual} onChange={(v: string) => handleChange('higherEduQual', v)} options={['Bachelor Degree', 'Master Degree', 'PhD', 'Professional Certificate', 'Diploma']} />
                    </div>
                    <div className="flex flex-col">
                      <Label>Graduation Year</Label>
                      <input type="text" value={formData.higherEduGradYear} onChange={e => handleChange('higherEduGradYear', e.target.value)} placeholder="Enter Year" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
                    </div>
                    <div className="flex flex-col">
                      <Label>Higher Education Certificate</Label>
                      <FileUpload empName={formData.firstName} empId={formData.empId}
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
                      <input type="text" value={formData.schoolingInstName} onChange={e => handleChange('schoolingInstName', e.target.value)} placeholder="Enter School Name" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
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
                      <input type="text" value={formData.schoolingGradYear} onChange={e => handleChange('schoolingGradYear', e.target.value)} placeholder="Enter Year" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
                    </div>
                    <div className="flex flex-col">
                      <Label>Schooling Certificate</Label>
                      <FileUpload empName={formData.firstName} empId={formData.empId}
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
                          <Label>Certification Name</Label>
                          <input type="text" value={cert.certName} onChange={e => handleCertChange(index, 'certName', e.target.value)} placeholder="Enter Cert Name" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
                        </div>
                        <div className="flex flex-col">
                          <Label>Issuing Organization</Label>
                          <input type="text" value={cert.issuingOrg} onChange={e => handleCertChange(index, 'issuingOrg', e.target.value)} placeholder="Enter Org Name" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
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
                          <FileUpload empName={formData.firstName} empId={formData.empId}
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
                    <input type="text" value={formData.insurProvider} onChange={e => handleChange('insurProvider', e.target.value)} placeholder="Enter Provider Name" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
                  </div>
                  <div className="flex flex-col">
                    <Label>Policy Number</Label>
                    <input type="text" value={formData.insurPolicyNum} onChange={e => handleChange('insurPolicyNum', e.target.value)} placeholder="Enter Policy Number" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
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
                    <input type="text" value={formData.insurCoverageAmt} onChange={e => handleChange('insurCoverageAmt', e.target.value)} placeholder="Enter Amount" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
                  </div>
                  <div className="flex flex-col">
                    <Label>Premium Amount</Label>
                    <input type="text" value={formData.insurPremiumAmt} onChange={e => handleChange('insurPremiumAmt', e.target.value)} placeholder="Enter Amount" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
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
                      <input type="number" value={formData.numDeps} onChange={e => handleChange('numDeps', e.target.value)} placeholder="0" min={0} className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
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
                    <input type="text" value={formData.accountHolder} onChange={e => handleChange('accountHolder', e.target.value)} placeholder="Enter Full Name" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
                  </div>
                  <div className="flex flex-col">
                    <Label>Account Number</Label>
                    <input
                      type="text"
                      value={formData.accountNum}
                      onChange={e => handleChange('accountNum', e.target.value.replace(/\D/g, ""))}
                      placeholder="Enter Account Number"
                      className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label>Online Payment Method</Label>
                    <CustomSelect value={formData.onlinePaymentType} onChange={(v: string) => handleChange('onlinePaymentType', v)} options={['PayNow', 'DBS PayLah!', 'Grab', 'YouTrip', 'Others']} placeholder="Select Online Payment Method" />
                  </div>
                  <div className="flex flex-col">
                    <Label>Online Payment ID/Number</Label>
                    <input type="text" value={formData.onlinePaymentId} onChange={e => handleChange('onlinePaymentId', e.target.value)} placeholder="Enter ID/Number" className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10" />
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
                      <Label>{field.label}</Label>
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
                        <FileUpload empName={formData.firstName} empId={formData.empId}
                          value={formData[field.id as keyof typeof formData]}
                          onChange={(file: File) => handleChange(field.id, file)}
                        />
                      ) : field.type === "number" ? (
                        <input
                          type="number"
                          value={String(formData[field.id as keyof typeof formData] || "")}
                          onChange={e => handleChange(field.id, e.target.value)}
                          placeholder={`Enter ${field.label}`}
                          className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
                        />
                      ) : (
                        <input
                          type="text"
                          value={String(formData[field.id as keyof typeof formData] || "")}
                          onChange={e => handleChange(field.id, e.target.value)}
                          placeholder={`Enter ${field.label}`}
                          className="h-11 px-4 w-full bg-white border border-[#E5E7EB] rounded-[10px] type-body-medium text-[#161616] placeholder:text-[#A3A3A3] outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
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
                <div className="bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-white/10 rounded-xl overflow-hidden">

                  {/* Header Banner */}
                  <div className="h-24 bg-gradient-to-r from-neutral-900 to-neutral-800 dark:from-neutral-950 dark:to-neutral-900" />

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
                              className={`h-20 w-20 rounded-xl border-2 border-white dark:border-[#1C1C1E] flex items-center justify-center shrink-0 overflow-hidden ${!formData.profilePhotoUrl ? "" : "bg-gray-100 dark:bg-white/5"}`}
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
                      {/* Name + title row (Name on banner, Subtitle below banner in black) */}
                      <div className="flex-1 pt-3">
                        <div className="relative -mt-10">
                          <h2 className="text-[20px] font-extrabold text-white leading-tight">
                            {formData.firstName} {formData.lastName}
                          </h2>
                        </div>
                        <div className="mt-2">
                          <p className="text-[13px] text-black dark:text-white font-medium">
                            {formData.nationality} · {formData.race || "—"} · {formData.religion || "—"} · {formData.gender} · {formData.maritalStatus}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#ECECEC] dark:border-white/10 mx-8" />

                  {/* CV Sections */}
                  <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">

                    {/* Personal Info */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-black dark:text-white mb-3">Personal Information</p>
                      <div className="flex flex-col gap-2">
                        {[
                          { label: "Date of Birth", value: formData.dob ? (() => { const [y, m, d] = formData.dob.split("-"); return `${d}/${m}/${y}`; })() : "—" },
                          { label: "Gender", value: formData.gender || "—" },
                          { label: "Marital Status", value: formData.maritalStatus || "—" },
                          { label: "Nationality", value: formData.nationality || "—" },
                          { label: "Race", value: formData.race || "—" },
                          { label: "Religion", value: formData.religion || "—" },
                        ].map(r => (
                          <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-[#ECECEC] dark:border-white/10">
                            <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">{r.label}</span>
                            <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-black dark:text-white mb-3">Contact Information</p>
                      <div className="flex flex-col gap-2">
                        {(formData.nationality && formData.nationality !== "Singapore"
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
                          <div key={r.label} className="flex items-start justify-between gap-4 py-1.5 border-b border-[#ECECEC] dark:border-white/10">
                            <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium shrink-0">{r.label}</span>
                            <span className="text-[13px] font-semibold text-gray-900 dark:text-white text-right">{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Identity */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-black dark:text-white mb-3">Identity</p>
                      <div className="flex flex-col gap-2">
                        {(formData.identityType === "NRIC" ? [
                          { label: "Type", value: "NRIC" },
                          { label: "NRIC Number", value: formData.nricNumber || "—" },
                          { label: "Tax ID", value: formData.taxId || "—" },
                        ] : [
                          { label: "Type", value: "FIN" },
                          { label: "FIN Number", value: formData.finNumber || "—" },
                          { label: "Passport Number", value: formData.finPassportNumber || "—" },
                          {
                            label: "Passport Expiry Date", value: formData.finPassportExpiryDate ? (() => {
                              const str = formData.finPassportExpiryDate;
                              if (str.includes("-")) {
                                const parts = str.split("-");
                                if (parts.length === 3 && parts[0].length === 4) {
                                  return `${parts[2]}/${parts[1]}/${parts[0]}`;
                                }
                              }
                              return str;
                            })() : "—"
                          },
                          { label: "Pass Type", value: formData.passType || "—" },
                          ...(formData.passType === "Work Permit" ? [{ label: "Skill Status", value: formData.workPermitSkill || "—" }] : []),
                        ]).map(r => (
                          <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-[#ECECEC] dark:border-white/10">
                            <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">{r.label}</span>
                            <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Work Details */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-black dark:text-white mb-3">Work Details</p>
                      <div className="flex flex-col gap-2">
                        {[
                          { label: "Employee ID", value: formData.empId || "—" },
                          {
                            label: "Date of Joining", value: formData.dateOfJoining ? (() => {
                              const str = formData.dateOfJoining;
                              if (str.includes("-")) {
                                const parts = str.split("-");
                                if (parts.length === 3 && parts[0].length === 4) {
                                  return `${parts[2]}/${parts[1]}/${parts[0]}`;
                                }
                              }
                              return str;
                            })() : "—"
                          },
                          { label: "Department", value: departments.find((d: any) => String(d.id) === String(formData.departmentId))?.department_name || "—" },
                          { label: "App Role", value: formData.role || "—" },
                          { label: "Designation", value: formData.jobRole || "—" },
                          { label: "Job Type", value: formData.jobType || "—" },
                          { label: "Salary", value: formData.salary ? `S$ ${formData.salary}` : "—" },
                          { label: "Shift", value: formData.shiftType || "—" },
                          { label: "Overtime Applicable", value: formData.overtimeApplicable ? "Yes" : "No" },
                          { label: "Claims Applicable", value: formData.claimsApplicable ? "Yes" : "No" },
                        ].map(r => (
                          <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-[#ECECEC] dark:border-white/10">
                            <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">{r.label}</span>
                            <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-black dark:text-white mb-3">Emergency Contact</p>
                      <div className="flex flex-col gap-2">
                        {[
                          { label: "Name", value: formData.emergName || "—" },
                          { label: "Relation", value: formData.emergRelation || "—" },
                          { label: "Secondary Emergency Contact Number", value: formData.emergContact ? `${formData.emergContactCode} ${formData.emergContact}` : "—" },
                          { label: "Address", value: formData.emergAddress || "—" },
                        ].map(r => (
                          <div key={r.label} className="flex items-start justify-between gap-4 py-1.5 border-b border-[#ECECEC] dark:border-white/10">
                            <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium shrink-0">{r.label}</span>
                            <span className="text-[13px] font-semibold text-gray-900 dark:text-white text-right">{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Education */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-black dark:text-white mb-3">Education</p>
                      <div className="flex flex-col gap-2">
                        {formData.schoolingInstName && (
                          <div className="mb-2">
                            <p className="text-[12px] font-bold text-gray-700 dark:text-gray-300">Schooling</p>
                            {[
                              { label: "Institution", value: formData.schoolingInstName },
                              { label: "Qualification", value: formData.schoolingQual || "—" },
                              { label: "Grad Year", value: formData.schoolingGradYear || "—" },
                            ].map(r => (
                              <div key={r.label} className="flex items-center justify-between py-1 border-b border-[#ECECEC] dark:border-white/10">
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{r.label}</span>
                                <span className="text-[12px] font-semibold text-gray-900 dark:text-white">{r.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {formData.higherEduInstName && (
                          <div>
                            <p className="text-[12px] font-bold text-gray-700 dark:text-gray-300">Higher Education</p>
                            {[
                              { label: "Institution", value: formData.higherEduInstName },
                              { label: "Course", value: formData.higherEduCourseName || "—" },
                              { label: "Course Duration", value: formData.higherEduCourseDuration || "—" },
                              { label: "Qualification", value: formData.higherEduQual || "—" },
                              { label: "Grad Year", value: formData.higherEduGradYear || "—" },
                            ].map(r => (
                              <div key={r.label} className="flex items-center justify-between py-1 border-b border-[#ECECEC] dark:border-white/10">
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{r.label}</span>
                                <span className="text-[12px] font-semibold text-gray-900 dark:text-white">{r.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {!formData.schoolingInstName && !formData.higherEduInstName && (
                          <p className="text-[12px] text-gray-500 dark:text-gray-400">No education details provided.</p>
                        )}
                      </div>
                    </div>

                    {/* Medical / Insurance */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-black dark:text-white mb-3">Medical & Insurance</p>
                      <div className="flex flex-col gap-2">
                        {[
                          { label: "Blood Group", value: formData.bloodGroup || "—" },
                          { label: "Insurance Type", value: formData.insuranceType || "—" },
                          { label: "Provider", value: formData.insurProvider || "—" },
                          { label: "Policy Number", value: formData.insurPolicyNum || "—" },
                          { label: "Employee Covered", value: formData.empCovered },
                          { label: "Dependents Covered", value: formData.depsCovered },
                        ].map(r => (
                          <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-[#ECECEC] dark:border-white/10">
                            <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">{r.label}</span>
                            <span className={`text-[13px] font-semibold ${r.value === "Yes" ? "text-emerald-600 dark:text-emerald-400" : r.value === "No" ? "text-rose-600 dark:text-rose-400" : "text-gray-900 dark:text-white"}`}>{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bank Details */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-black dark:text-white mb-3">Bank Details</p>
                      <div className="flex flex-col gap-2">
                        {[
                          { label: "Bank Name", value: formData.bankName || "—" },
                          { label: "Account Holder Name", value: formData.accountHolder || "—" },
                          { label: "Account Number", value: formData.accountNum || "—" },
                          { label: "Online Payment Method", value: formData.onlinePaymentType || "—" },
                          { label: "Online Payment ID/Number", value: formData.onlinePaymentId || "—" },
                          { label: "Salary Payment Mode", value: formData.salaryPaymentMode || "—" },
                        ].map(r => (
                          <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-[#ECECEC] dark:border-white/10">
                            <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">{r.label}</span>
                            <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Certifications */}
                    {formData.certifications?.some((c: any) => c.certName) && (
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-black dark:text-white mb-3">Certifications</p>
                        <div className="flex flex-col gap-3">
                          {formData.certifications.filter((c: any) => c.certName).map((cert: any, i: number) => (
                            <div key={i} className="p-3 bg-gray-50 dark:bg-white/5 border border-[#ECECEC] dark:border-white/10 rounded-lg">
                              <p className="text-[13px] font-bold text-gray-900 dark:text-white">{cert.certName}</p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">{cert.issuingOrg}{cert.certNumber ? ` · #${cert.certNumber}` : ""}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Fields */}
                    {customFieldsConfig.length > 0 && (
                      <div className="md:col-span-2">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-black dark:text-white mb-3">Custom Details</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {customFieldsConfig.map((field: any) => (
                            <div key={field.id} className="flex items-center justify-between py-1.5 border-b border-[#ECECEC] dark:border-white/10">
                              <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">{field.label}</span>
                              <span className="text-[13px] font-semibold text-gray-900 dark:text-white">
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
                <div className="bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-white/10 rounded-xl p-8">
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
                        className="mt-1 w-4 h-4 rounded text-black dark:text-white border-[#ECECEC] dark:border-white/10 focus:ring-black dark:focus:ring-white bg-white dark:bg-[#1C1C1E] cursor-pointer transition-all active:scale-90"
                      />
                      <div className="space-y-1">
                        <p className="text-[14px] font-bold text-gray-900 dark:text-white">Terms, Conditions & Privacy Consent</p>
                        <p className="text-[13px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                          I agree to Dort Asia's terms and conditions and I consent to the collection and processing of my Employee's Personal data.
                        </p>
                      </div>
                    </label>

                    <div className="pt-6 border-t border-[#ECECEC] dark:border-white/10">
                      <Label>Digital Signature</Label>
                      <input
                        type="text"
                        placeholder="Type your full name as signature"
                        value={formData.digitalSignature}
                        onChange={e => handleChange('digitalSignature', e.target.value)}
                        className="h-11 px-3 w-full max-w-[400px] bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-white/10 rounded-md text-[14px] font-bold text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 transition-all"
                      />
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 font-medium italic">Please verify your full name above as your digital signature.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}


          </div>
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#121217] border-t border-[#ECECEC] dark:border-white/10 px-8 py-4 flex items-center justify-between z-20">
          <div className="max-w-[1000px] mx-auto w-full flex items-center justify-between">
            <motion.button 
              whileTap={{ scale: 0.97 }}
              disabled={isAutoCalculating}
              onClick={currentStep === 1 ? () => {
                if (hasHistory) {
                  router.back();
                } else {
                  router.push(`/employees/${employeeId}`);
                }
              } : handlePrev} 
              className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-[#ECECEC] dark:border-white/10 type-body-medium font-medium transition-all bg-white dark:bg-[#1C1C1E] text-[#161616] dark:text-gray-300 hover:bg-[#FAFAF9] dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
              {currentStep === 1 ? backLabel : "Back"}
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.97 }}
              onClick={currentStep === lastStepId ? handleSubmitProfile : handleNext} 
              disabled={saving || isAutoCalculating || (currentStep === lastStepId && (!formData.termsAccepted || !formData.digitalSignature))} 
              className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-black dark:bg-white text-white dark:text-black type-body-medium font-medium hover:bg-neutral-800 dark:hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : currentStep === lastStepId ? 'Complete' : 'Next'}
              {!saving && currentStep !== lastStepId && <ArrowRight className="h-4 w-4" strokeWidth={2.2} />}
            </motion.button>
          </div>
        </div>

      </div>

      {/* Profile Photo Cropper Popup Modal */}
      {isEditingPic && rawPic && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 transition-opacity duration-300">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-white dark:bg-[#1C1C1E] w-full max-w-[480px] rounded-xl overflow-hidden flex flex-col border border-[#ECECEC] dark:border-white/10 shadow-2xl"
          >
            <div className="px-6 py-5 border-b border-[#ECECEC] dark:border-white/10 flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-gray-900 dark:text-white">Adjust Photo</h3>
              <button
                onClick={() => setIsEditingPic(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full aspect-square bg-[#F8F9FA] dark:bg-[#121217]">
              {/* @ts-ignore - React 19 typing mismatch with react-easy-crop */}
              <Cropper
                image={rawPic || undefined}
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
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.preventDefault(); setPicZoom(z => Math.min(z + 0.5, 10)); }}
                  className="w-9 h-9 bg-white dark:bg-[#1C1C1E] rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 transition border border-[#ECECEC] dark:border-white/10 text-gray-700 dark:text-gray-300"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.preventDefault(); setPicZoom(z => Math.max(z - 0.5, 1)); }}
                  className="w-9 h-9 bg-white dark:bg-[#1C1C1E] rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 transition border border-[#ECECEC] dark:border-white/10 text-gray-700 dark:text-gray-300"
                >
                  <Minus className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            <div className="px-6 py-5 bg-white dark:bg-[#1C1C1E] border-t border-[#ECECEC] dark:border-white/10 flex items-center justify-between">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setIsEditingPic(false)}
                className="px-4 py-2 text-[13px] font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-md transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={confirmCrop}
                className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black text-[13px] font-bold rounded-md hover:bg-neutral-800 dark:hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                Use Photo
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Save Draft Warning Modal */}
      {showSaveDraftModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-[420px] bg-white dark:bg-[#1C1C1E] border border-[#ECECEC] dark:border-white/10 rounded-xl overflow-hidden shadow-2xl p-6"
          >
            <h3 className="text-[17px] font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Info className="h-5 w-5 text-gray-900 dark:text-white" />
              Save Draft
            </h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-6">
              This will save your progress so far. This partial data will immediately reflect on the outside dashboard and employee directory. Would you like to proceed?
            </p>

            <label className="flex items-center gap-2 cursor-pointer select-none mb-6">
              <input
                type="checkbox"
                checked={dontShowSaveDraftWarning}
                onChange={(e) => setDontShowSaveDraftWarning(e.target.checked)}
                className="h-4 w-4 rounded border-[#ECECEC] dark:border-white/10 text-black focus:ring-black outline-none cursor-pointer"
              />
              <span className="text-[12px] font-semibold text-gray-600 dark:text-gray-400">
                Don't show this message again
              </span>
            </label>

            <div className="flex items-center justify-end gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setShowSaveDraftModal(false)}
                className="px-4 py-2 rounded-md text-[13px] font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={confirmSaveDraft}
                className="px-5 py-2 rounded-md text-[13px] font-bold text-white bg-black dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-gray-100 transition-colors"
              >
                Proceed
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}


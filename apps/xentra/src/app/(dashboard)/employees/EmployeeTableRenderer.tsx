"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Trash2, Edit, ChevronDown, Copy, CheckCircle2, FileSpreadsheet, FileText, Download } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import AddEmployeeModal from "@/components/AddEmployeeModal";

type EmployeeData = {
  id: string;
  name: string;
  role: string;
  empId: string | null;
  department: string;
  email: string;
  mobile: string;
  jobType: string;
  initials: string;
  isComplete: boolean;
  color: string;
  bg: string;
  designation?: string;
  date_of_birth?: string;
  created_at?: string;
  rawData?: any;
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return "-";
  }
};

const getCustomFields = (emp: any) => {
  if (!emp || !emp.custom_fields) return {};
  if (typeof emp.custom_fields === "string") {
    try {
      return JSON.parse(emp.custom_fields);
    } catch {
      return {};
    }
  }
  return emp.custom_fields;
};

type Project = {
  id: string;
  code: string;
  name: string;
  owner: string;
  status: string;
};

export default function EmployeeTableRenderer({ employees }: { employees: EmployeeData[] }) {
  const router = useRouter();
  const [realProjects, setRealProjects] = useState<any[]>([]);

  useEffect(() => {
    async function loadCompanyProjects() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let { data: comp } = await supabase
          .from('company_settings')
          .select('attendance_settings')
          .eq('company_id', user.id)
          .maybeSingle();

        if (!comp) {
          const { data: empRecord } = await supabase
            .from('employees')
            .select('company_id')
            .eq('email', user.email)
            .maybeSingle();
          if (empRecord) {
            const { data: compEmp } = await supabase
              .from('company_settings')
              .select('attendance_settings')
              .eq('company_id', empRecord.company_id)
              .maybeSingle();
            comp = compEmp;
          }
        }

        if (comp?.attendance_settings?.projects) {
          setRealProjects(comp.attendance_settings.projects);
        }
      } catch (e) {
        console.error("Error loading company projects in employee table:", e);
      }
    }
    loadCompanyProjects();
  }, []);

  const getEmployeeProjects = (employee: EmployeeData) => {
    const assigned = employee.rawData?.custom_fields?.assignedProjects;
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
          status: "Active"
        };
      });
    }

    const projVal = employee.rawData?.current_project || employee.rawData?.custom_fields?.project_name;
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
      status: "Active"
    }];
  };

  // Search, Copy, Sort, and Pagination State
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeSortMenu, setActiveSortMenu] = useState<string | null>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderSortHeader = (key: string, label: string, width: string) => {
    const isSorted = sortColumn === key || (key === 'name' && sortColumn === 'empId');
    const isOpen = activeSortMenu === key;

    let ascLabel = 'Sort Ascending (A to Z)';
    let descLabel = 'Sort Descending (Z to A)';

    if (key === 'mobile') {
      ascLabel = 'Ascending (0 - 9)';
      descLabel = 'Descending (9 - 0)';
    }

    return (
      <div className={`relative ${width}`}>
        <div 
          onClick={() => setActiveSortMenu(isOpen ? null : key)}
          className={`flex items-center gap-1.5 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none transition-colors ${isSorted ? 'text-[#007AFF] font-semibold' : ''}`}
        >
          <span>{label}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 transition-colors ${isSorted ? 'text-[#007AFF]' : 'text-gray-400'}`}>
            <path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/>
          </svg>
        </div>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-[210px] rounded-[18px] bg-white dark:bg-[#1C1C22] border border-[#E5E7EB] dark:border-[#2C2C35] shadow-lg p-1.5 z-50 text-[#111827] dark:text-white font-medium text-[13px]">
            {key === 'name' ? (
              <>
                <button 
                  onClick={() => { setSortColumn('name'); setSortOrder('asc'); setActiveSortMenu(null); }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left w-full transition-colors ${sortColumn === 'name' && sortOrder === 'asc' ? 'bg-blue-50 dark:bg-blue-950/40 text-[#007AFF]' : 'hover:bg-gray-100/70 dark:hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                    <span>Name (A to Z)</span>
                  </div>
                  {sortColumn === 'name' && sortOrder === 'asc' && <span className="text-[12px] font-bold">✓</span>}
                </button>
                <button 
                  onClick={() => { setSortColumn('name'); setSortOrder('desc'); setActiveSortMenu(null); }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left w-full transition-colors ${sortColumn === 'name' && sortOrder === 'desc' ? 'bg-blue-50 dark:bg-blue-950/40 text-[#007AFF]' : 'hover:bg-gray-100/70 dark:hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                    <span>Name (Z to A)</span>
                  </div>
                  {sortColumn === 'name' && sortOrder === 'desc' && <span className="text-[12px] font-bold">✓</span>}
                </button>
                <div className="h-[1px] bg-gray-100 dark:bg-white/10 my-1"></div>
                <button 
                  onClick={() => { setSortColumn('empId'); setSortOrder('desc'); setActiveSortMenu(null); }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left w-full transition-colors ${sortColumn === 'empId' && sortOrder === 'desc' ? 'bg-blue-50 dark:bg-blue-950/40 text-[#007AFF]' : 'hover:bg-gray-100/70 dark:hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                    <span>ID (Newest to Oldest)</span>
                  </div>
                  {sortColumn === 'empId' && sortOrder === 'desc' && <span className="text-[12px] font-bold">✓</span>}
                </button>
                <button 
                  onClick={() => { setSortColumn('empId'); setSortOrder('asc'); setActiveSortMenu(null); }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left w-full transition-colors ${sortColumn === 'empId' && sortOrder === 'asc' ? 'bg-blue-50 dark:bg-blue-950/40 text-[#007AFF]' : 'hover:bg-gray-100/70 dark:hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                    <span>ID (Oldest to Newest)</span>
                  </div>
                  {sortColumn === 'empId' && sortOrder === 'asc' && <span className="text-[12px] font-bold">✓</span>}
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => { setSortColumn(key); setSortOrder('asc'); setActiveSortMenu(null); }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left w-full transition-colors ${isSorted && sortOrder === 'asc' ? 'bg-blue-50 dark:bg-blue-950/40 text-[#007AFF]' : 'hover:bg-gray-100/70 dark:hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                    <span>{ascLabel}</span>
                  </div>
                  {isSorted && sortOrder === 'asc' && <span className="text-[12px] font-bold">✓</span>}
                </button>

                <button 
                  onClick={() => { setSortColumn(key); setSortOrder('desc'); setActiveSortMenu(null); }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left w-full transition-colors ${isSorted && sortOrder === 'desc' ? 'bg-blue-50 dark:bg-blue-950/40 text-[#007AFF]' : 'hover:bg-gray-100/70 dark:hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                    <span>{descLabel}</span>
                  </div>
                  {isSorted && sortOrder === 'desc' && <span className="text-[12px] font-bold">✓</span>}
                </button>
              </>
            )}

            {isSorted && (
              <>
                <div className="h-[1px] bg-gray-100 dark:bg-white/10 my-1"></div>
                <button 
                  onClick={() => { setSortColumn(null); setActiveSortMenu(null); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100/70 dark:hover:bg-white/5 text-left w-full text-gray-500 text-[12px] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  <span>Reset Sort</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleExport = (format: "xls" | "xlsx" | "csv") => {
    try {
      if (!employees || employees.length === 0) {
        alert("No employee data found to export.");
        return;
      }

      const rawRecords = employees.map(emp => {
        if (emp.rawData) return emp.rawData;
        return {
          ...emp,
          emp_id: emp.empId,
          custom_fields: {
            firstName: emp.name ? emp.name.split(" ")[0] : "",
            lastName: emp.name ? emp.name.split(" ").slice(1).join(" ") : "",
            dob: emp.date_of_birth,
            personalEmail: emp.email,
            mobileNumber: emp.mobile
          }
        };
      });

      let fileContent = "";
      let mimeType = "";

      if (format === "xls" || format === "xlsx") {
        fileContent = buildExcelXML(rawRecords);
        mimeType = "application/vnd.ms-excel;charset=utf-8;";
      } else {
        fileContent = buildCSV(rawRecords);
        mimeType = "text/csv;charset=utf-8;";
      }

      const bom = format === "csv" ? "\uFEFF" : "";
      const blob = new Blob([bom + fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Employees_Export_${new Date().toISOString().split('T')[0]}.${format}`;
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      setTimeout(() => {
        setShowExportDropdown(false);
      }, 150);

    } catch (err: any) {
      console.error("Export error:", err);
      alert("Export failed: " + (err?.message || "Unknown error"));
    }
  };

  const handleDelete = async (id: string, name: string, email: string) => {
    if (confirm(`Are you sure you want to permanently delete ${name}?`)) {
      try {
        await fetch('/api/employee-credentials', {
          method: 'POST',
          body: JSON.stringify({ action: 'delete', email, employeeId: id }),
          headers: { 'Content-Type': 'application/json' }
        });

        const supabase = createClient();
        const { error } = await supabase.from('employees').delete().eq('id', id);
        
        if (error) throw error;
        
        window.location.reload();
      } catch (err: any) {
        alert("Failed to delete employee: " + (err.message || "Unknown error"));
      }
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(search.toLowerCase()) || 
    (emp.empId && emp.empId.toLowerCase().includes(search.toLowerCase())) ||
    emp.role.toLowerCase().includes(search.toLowerCase()) ||
    emp.email.toLowerCase().includes(search.toLowerCase())
  );

  let sortedEmployees = filteredEmployees;
  if (sortColumn) {
    sortedEmployees = [...filteredEmployees].sort((a, b) => {
      let valA = (a as any)[sortColumn] || '';
      let valB = (b as any)[sortColumn] || '';

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
  const paginatedEmployees = sortedEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col h-full font-sf">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

        {/* Left — Search Pill + Circular/Pill Filter */}
        <div className="flex items-center gap-3">
          <div className="relative w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Employees"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-white/10 rounded-full text-[14px] font-normal text-[#111827] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#007AFF] transition-colors font-sf"
            />
          </div>
          <button className="flex items-center justify-center w-10 h-10 bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-white/10 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {/* Right — Add Employee + Export */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAddModal(true)} 
            className="px-6 py-2.5 bg-[#007AFF] text-white text-[14px] font-medium rounded-full hover:bg-blue-600 transition-colors font-sf shadow-sm"
          >
            Add Employee
          </button>

          <div className="relative" ref={exportDropdownRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowExportDropdown(prev => !prev);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#F1F3F5] dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-[14px] font-medium rounded-full hover:bg-gray-200 dark:hover:bg-white/5 transition-colors font-sf"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-3 3m0 0l-3-3m3 3V4" /></svg>
              Export
              <ChevronDown
                className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-200 ${showExportDropdown ? "rotate-180" : ""}`}
                strokeWidth={2.5}
              />
            </button>

            {showExportDropdown && (
              <div 
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full right-0 mt-2.5 w-[185px] bg-white dark:bg-[#1C1C22] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[18px] shadow-[0_10px_30px_rgba(0,0,0,0.12)] p-1.5 z-[100] flex flex-col gap-1 font-sf"
              >
                <button
                  type="button"
                  onClick={() => handleExport("xlsx")}
                  className="w-full text-left px-3 py-2.5 text-[13px] font-medium text-gray-700 dark:text-gray-200 hover:bg-[#F4F5F7] dark:hover:bg-white/5 transition-colors rounded-xl flex items-center gap-3 font-sf group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-[13px] text-gray-900 dark:text-white leading-tight truncate">Excel File</span>
                    <span className="text-[11px] text-gray-400 font-sf-rounded truncate">.xlsx format</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExport("csv")}
                  className="w-full text-left px-3 py-2.5 text-[13px] font-medium text-gray-700 dark:text-gray-200 hover:bg-[#F4F5F7] dark:hover:bg-white/5 transition-colors rounded-xl flex items-center gap-3 font-sf group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-[13px] text-gray-900 dark:text-white leading-tight truncate">CSV File</span>
                    <span className="text-[11px] text-gray-400 font-sf-rounded truncate">.csv format</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Employees Table Card (Xentra Style) */}
      <div className="bg-white dark:bg-[#121217] rounded-[20px] border border-[#E5E7EB] dark:border-[#2C2C35] overflow-visible flex flex-col font-sf">
        {/* Table Header Bar */}
        <div className="bg-[#EBEFF5] dark:bg-white/5 px-6 py-3.5 flex items-center text-[13px] font-semibold text-[#4B5563] dark:text-gray-300 rounded-t-[20px] border-b border-[#E5E7EB] dark:border-white/5">
          {renderSortHeader('name', 'Employee', 'w-[26%]')}
          {renderSortHeader('department', 'Department', 'w-[22%]')}
          {renderSortHeader('role', 'Role', 'w-[14%]')}
          {renderSortHeader('email', 'Email', 'w-[22%]')}
          {renderSortHeader('mobile', 'Mobile', 'w-[11%]')}
          <div className="w-[5%] text-right">Actions</div>
        </div>

        {/* Table Body Rows */}
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          {paginatedEmployees.length > 0 ? (
            paginatedEmployees.map((emp, index) => {
              return (
                <div 
                  key={emp.id}
                  onClick={() => router.push(`/employees/${emp.id}`)}
                  className="px-6 py-4 flex items-center text-[14px] hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors cursor-pointer group font-sf"
                >
                  {/* Employee Name & ID */}
                  <div className="w-[26%] flex items-center gap-3 pr-2">
                    <div className="w-9 h-9 rounded-full bg-[#E5E7EB] dark:bg-white/10 border border-gray-200/80 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                      <svg viewBox="0 0 24 24" fill="#9CA3AF" className="w-6 h-6 scale-110 translate-y-[2px]">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[14px] font-semibold text-[#111827] dark:text-white truncate leading-tight font-sf">{emp.name}</p>
                      <p className="text-[12px] font-medium text-[#6B7280] dark:text-gray-400 font-sf-rounded mt-0.5 truncate leading-tight">
                        {emp.empId || String((currentPage - 1) * itemsPerPage + index + 1).padStart(5, '0')}
                      </p>
                    </div>
                  </div>

                  {/* Department & Designation */}
                  <div className="w-[22%] overflow-hidden pr-2">
                    <p className="text-[14px] font-semibold text-[#111827] dark:text-white truncate leading-tight font-sf">{emp.department}</p>
                    <p className="text-[12px] text-[#6B7280] dark:text-gray-400 font-normal truncate mt-0.5 font-sf">{emp.designation || emp.role}</p>
                  </div>

                  {/* App Role Badge */}
                  <div className="w-[14%]">
                    <span className={`px-2.5 py-1 rounded-md text-[12px] font-medium inline-block font-sf ${
                      emp.role === 'Admin' ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60' :
                      emp.role === 'Manager' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60' :
                      'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-white/10'
                    }`}>
                      {emp.role}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="w-[22%] truncate pr-2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className="truncate text-[14px] text-[#111827] dark:text-white font-medium font-sf">{emp.email}</span>
                    <button 
                      onClick={() => handleCopy(emp.email, `email-${emp.id}`)}
                      className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1 rounded hover:bg-gray-200/70 dark:hover:bg-white/10 shrink-0"
                      title="Copy Email"
                    >
                      {copiedId === `email-${emp.id}` ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Mobile */}
                  <div className="w-[11%] text-[#111827] dark:text-white text-[14px] font-medium font-sf-rounded truncate pr-2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className="truncate">{emp.mobile}</span>
                    {emp.mobile && emp.mobile !== '-' && (
                      <button 
                        onClick={() => handleCopy(emp.mobile, `phone-${emp.id}`)}
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1 rounded hover:bg-gray-200/70 dark:hover:bg-white/10 shrink-0"
                        title="Copy Mobile Number"
                      >
                        {copiedId === `phone-${emp.id}` ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Actions Column with Dropdown Card */}
                  <div className="w-[5%] relative flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => setActiveActionMenuId(activeActionMenuId === emp.id ? null : emp.id)}
                      className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                      title="Employee Actions"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                      </svg>
                    </button>

                    {/* Actions Dropdown Menu Card */}
                    {activeActionMenuId === emp.id && (
                      <div className="absolute right-0 top-8 w-[160px] bg-white dark:bg-[#1C1C22] rounded-2xl border border-[#E5E7EB] dark:border-[#2C2C35] shadow-lg p-1.5 z-50 flex flex-col gap-0.5 text-[13px] font-medium text-gray-700 dark:text-gray-200 font-sf">
                        <button 
                          onClick={() => { setActiveActionMenuId(null); router.push(`/employees/${emp.id}`); }}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-left w-full transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                          View Details
                        </button>
                        <button 
                          onClick={() => { setActiveActionMenuId(null); router.push(`/employees/${emp.id}/edit`); }}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-left w-full transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Edit Employee
                        </button>
                        <div className="h-[1px] bg-gray-100 dark:bg-white/10 my-1"></div>
                        <button 
                          onClick={() => { setActiveActionMenuId(null); handleDelete(emp.id, emp.name, emp.email); }}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-left w-full transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          Delete Employee
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-[14px] text-gray-400 font-medium">
              No employees found matching &quot;{search}&quot;.
            </div>
          )}
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between py-6">
        <p className="text-[12px] font-medium text-gray-500 mb-4 sm:mb-0">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredEmployees.length)} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} entries
        </p>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(1)} 
              disabled={currentPage === 1}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 text-[12px] font-bold"
            >
              &laquo;
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 text-[12px] font-bold"
            >
              &lsaquo;
            </button>
            
            {/* Page Numbers */}
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map(page => (
              <button 
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-bold transition-colors ${
                  currentPage === page 
                    ? "bg-[#007AFF] text-white shadow-[0_2px_8px_rgba(0,122,255,0.3)]" 
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                {page}
              </button>
            ))}
            
            {totalPages > 3 && <span className="text-gray-400 text-[13px] font-bold mx-1">...</span>}
            {totalPages > 3 && (
               <button 
                 onClick={() => setCurrentPage(totalPages)}
                 className={`w-8 h-8 flex items-center justify-center rounded-full text-[13px] font-bold transition-colors ${
                   currentPage === totalPages 
                     ? "bg-[#007AFF] text-white shadow-[0_2px_8px_rgba(0,122,255,0.3)]" 
                     : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
                 }`}
               >
                 {totalPages}
               </button>
            )}

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 text-[12px] font-bold"
            >
              &rsaquo;
            </button>
            <button 
              onClick={() => setCurrentPage(totalPages)} 
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 text-[12px] font-bold"
            >
              &raquo;
            </button>
          </div>

          <div className="flex items-center gap-2 text-[12px] font-medium text-gray-500">
            Go to page 
            <input 
              type="number" 
              min={1} 
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= totalPages) setCurrentPage(val);
              }}
              className="w-12 h-6 text-center border border-gray-200 dark:border-white/10 rounded bg-white dark:bg-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
            />
            <button className="text-[12px] font-bold text-gray-700 dark:text-gray-300 hover:text-[#007AFF] transition-colors">
              Go &rsaquo;
            </button>
          </div>
        </div>
      </div>
      
      {showAddModal && (
        <AddEmployeeModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => window.location.reload()} 
        />
      )}

    </div>
  );
}

const escapeXML = (val: any) => {
  if (val === undefined || val === null) return "";
  const str = String(val);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const buildExcelXML = (employees: any[]) => {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Dort Asia HRMS</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#007AFF" ss:Pattern="Solid"/>
  </Style>
 </Styles>`;

  const createSheet = (sheetName: string, headers: string[], rows: any[][]) => {
    let sheetXml = `\n <Worksheet ss:Name="${escapeXML(sheetName)}">
  <Table>
   <Row ss:Height="22" ss:StyleID="Header">`;
    headers.forEach(h => {
      sheetXml += `\n    <Cell><Data ss:Type="String">${escapeXML(h)}</Data></Cell>`;
    });
    sheetXml += `\n   </Row>`;

    rows.forEach(row => {
      sheetXml += `\n   <Row ss:Height="18">`;
      row.forEach(val => {
        const strVal = val === undefined || val === null ? "" : String(val);
        sheetXml += `\n    <Cell><Data ss:Type="String">${escapeXML(strVal)}</Data></Cell>`;
      });
      sheetXml += `\n   </Row>`;
    });

    sheetXml += `\n  </Table>
 </Worksheet>`;
    return sheetXml;
  };

  // 1. Personal Information
  const pHeaders = ['Employee ID', 'First Name', 'Last Name', 'Full Name', 'Date of Birth', 'Gender', 'Marital Status', 'Nationality'];
  const pRows = employees.map(emp => {
    const cf = getCustomFields(emp);
    return [
      emp.emp_id || "-",
      cf.firstName || (emp.name ? String(emp.name).split(" ")[0] : "") || "-",
      cf.lastName || (emp.name ? String(emp.name).split(" ").slice(1).join(" ") : "") || "-",
      emp.name || "-",
      formatDate(emp.date_of_birth || cf.dob),
      emp.gender || cf.gender || "-",
      cf.maritalStatus || "-",
      cf.nationality || "-"
    ];
  });
  xml += createSheet("Personal Information", pHeaders, pRows);

  // 2. Identity Information
  const iHeaders = ['Employee ID', 'Full Name', 'Identity Type', 'NRIC Number', 'Residential Status', 'CPF Linked Status', 'Tax ID', 'FIN Number', 'Passport Number', 'Passport Expiry Date', 'Issuing Country', 'Work Pass Type', 'Work Pass Number', 'Work Pass Issue Date', 'Work Pass Expiry Date'];
  const iRows = employees.map(emp => {
    const cf = getCustomFields(emp);
    return [
      emp.emp_id || "-",
      emp.name || "-",
      cf.identityType || "-",
      cf.nricNumber || "-",
      cf.nricResidentialStatus || "-",
      cf.cpfLinkedStatus || "-",
      cf.taxId || "-",
      cf.finNumber || "-",
      cf.finPassportNumber || "-",
      formatDate(cf.finPassportExpiryDate),
      cf.finIssuingCountry || "-",
      cf.workPassType || "-",
      cf.workPassNumber || "-",
      formatDate(cf.workPassIssueDate),
      formatDate(cf.workPassExpiryDate)
    ];
  });
  xml += createSheet("Identity Information", iHeaders, iRows);

  // 3. Contact Information
  const cHeaders = ['Employee ID', 'Full Name', 'Personal Email', 'Work Email', 'Singapore Mobile', 'Singapore Address', 'Singapore Postal Code', 'Native Mobile', 'Native Address', 'Native Postal Code'];
  const cRows = employees.map(emp => {
    const cf = getCustomFields(emp);
    const isSG = cf.nationality === "Singaporean";
    return [
      emp.emp_id || "-",
      emp.name || "-",
      cf.personalEmail || "-",
      emp.email || "-",
      isSG ? [cf.mobileCode, cf.mobileNumber].filter(Boolean).join(" ") : [cf.currentMobileCode, cf.currentMobileNumber].filter(Boolean).join(" ") || emp.mobile || "-",
      isSG ? cf.residentialAddress : cf.currentResidentialAddress || emp.address || "-",
      isSG ? cf.postalCode : cf.currentPostalCode || "-",
      !isSG ? [cf.nativeMobileCode, cf.nativeMobileNumber].filter(Boolean).join(" ") : "-",
      !isSG ? cf.nativeResidentialAddress : "-",
      !isSG ? cf.nativePostalCode : "-"
    ];
  });
  xml += createSheet("Contact Information", cHeaders, cRows);

  // 4. Emergency Contact
  const eHeaders = ['Employee ID', 'Full Name', 'Emergency Contact Name', 'Relationship', 'Emergency Contact Phone', 'Emergency Contact Address'];
  const eRows = employees.map(emp => {
    const cf = getCustomFields(emp);
    return [
      emp.emp_id || "-",
      emp.name || "-",
      emp.emergency_contact_name || cf.emergName || "-",
      emp.emergency_contact_relation || cf.emergRelation || "-",
      [cf.emergContactCode, cf.emergContact].filter(Boolean).join(" ") || emp.emergency_contact_number || "-",
      emp.emergency_contact_address || cf.emergAddress || "-"
    ];
  });
  xml += createSheet("Emergency Contact", eHeaders, eRows);

  // 5. Education
  const eduHeaders = ['Employee ID', 'Full Name', 'Schooling Country', 'Schooling Institution', 'Schooling Qualification', 'Schooling Grad Year', 'Higher Edu Country', 'Higher Edu Institution', 'Course Name', 'Course Duration', 'Higher Edu Qualification', 'Higher Edu Grad Year'];
  const eduRows = employees.map(emp => {
    const cf = getCustomFields(emp);
    return [
      emp.emp_id || "-",
      emp.name || "-",
      cf.schoolingCountry || "-",
      cf.schoolingInstName || "-",
      cf.schoolingQual || "-",
      cf.schoolingGradYear || "-",
      cf.higherEduCountry || "-",
      cf.higherEduInstName || "-",
      cf.higherEduCourseName || "-",
      cf.higherEduCourseDuration || "-",
      cf.higherEduQual || "-",
      cf.higherEduGradYear || "-"
    ];
  });
  xml += createSheet("Education", eduHeaders, eduRows);

  // 6. Certifications
  const certHeaders = ['Employee ID', 'Full Name', 'Certification Name', 'Issuing Organization', 'Certification Number', 'Issue Date', 'Expiry Date'];
  const certRows: any[][] = [];
  employees.forEach(emp => {
    const cf = getCustomFields(emp);
    const certs = cf.certifications;
    if (Array.isArray(certs) && certs.length > 0) {
      certs.forEach(cert => {
        certRows.push([
          emp.emp_id || "-",
          emp.name || "-",
          cert?.certName || "-",
          cert?.issuingOrg || "-",
          cert?.certNumber || "-",
          formatDate(cert?.certIssueDate),
          formatDate(cert?.certExpiryDate)
        ]);
      });
    } else {
      certRows.push([
        emp.emp_id || "-",
        emp.name || "-",
        "-",
        "-",
        "-",
        "-",
        "-"
      ]);
    }
  });
  xml += createSheet("Certifications", certHeaders, certRows);

  // 7. Medical Information
  const mHeaders = ['Employee ID', 'Full Name', 'Insurance Type', 'Insurance Provider', 'Policy Number', 'Policy Start Date', 'Policy Expiry Date', 'Coverage Amount', 'Premium Amount', 'Payment Frequency', 'Employee Covered', 'Dependents Covered', 'Number of Dependents', 'Spouse Coverage', 'Children Coverage', 'Parents Coverage'];
  const mRows = employees.map(emp => {
    const cf = getCustomFields(emp);
    return [
      emp.emp_id || "-",
      emp.name || "-",
      cf.insuranceType || "-",
      cf.insurProvider || "-",
      cf.insurPolicyNum || "-",
      formatDate(cf.insurPolicyStart),
      formatDate(cf.insurPolicyExpiry),
      cf.insurCoverageAmt || "-",
      cf.insurPremiumAmt || "-",
      cf.insurPaymentFreq || "-",
      cf.empCovered || "-",
      cf.depsCovered || "-",
      cf.numDeps || "-",
      cf.spouseCoverage || "-",
      cf.childrenCoverage || "-",
      cf.parentsCoverage || "-"
    ];
  });
  xml += createSheet("Medical Information", mHeaders, mRows);

  // 8. Bank Details
  const bHeaders = ['Employee ID', 'Full Name', 'Bank Name', 'Account Holder Name', 'Account Number', 'Bank Code', 'Branch Code', 'Salary Payment Mode'];
  const bRows = employees.map(emp => {
    const cf = getCustomFields(emp);
    return [
      emp.emp_id || "-",
      emp.name || "-",
      emp.bank_name || cf.bankName || "-",
      emp.account_holder_name || cf.accountHolder || "-",
      emp.account_number || cf.accountNum || "-",
      cf.bankCode || "-",
      cf.branchCode || "-",
      cf.salaryPaymentMode || "-"
    ];
  });
  xml += createSheet("Bank Details", bHeaders, bRows);

  xml += `\n</Workbook>`;
  return xml;
};

const buildCSV = (employees: any[]) => {
  const csvHeaders = [
    'Employee ID', 'First Name', 'Last Name', 'Full Name', 'Date of Birth', 'Gender', 'Marital Status', 'Nationality',
    'Identity Type', 'NRIC Number', 'Residential Status', 'CPF Linked Status', 'Tax ID', 'FIN Number', 'Passport Number', 'Passport Expiry Date', 'Issuing Country', 'Work Pass Type', 'Work Pass Number', 'Work Pass Issue Date', 'Work Pass Expiry Date',
    'Personal Email', 'Work Email', 'Singapore Mobile', 'Singapore Address', 'Singapore Postal Code', 'Native Mobile', 'Native Address', 'Native Postal Code',
    'Emergency Contact Name', 'Relationship', 'Emergency Contact Phone', 'Emergency Contact Address',
    'Schooling Country', 'Schooling Institution', 'Schooling Qualification', 'Schooling Grad Year', 'Higher Edu Country', 'Higher Edu Institution', 'Course Name', 'Course Duration', 'Higher Edu Qualification', 'Higher Edu Grad Year',
    'Certifications',
    'Insurance Type', 'Insurance Provider', 'Policy Number', 'Policy Start Date', 'Policy Expiry Date', 'Coverage Amount', 'Premium Amount', 'Payment Frequency', 'Employee Covered', 'Dependents Covered', 'Number of Dependents', 'Spouse Coverage', 'Children Coverage', 'Parents Coverage',
    'Bank Name', 'Account Holder Name', 'Account Number', 'Bank Code', 'Branch Code', 'Salary Payment Mode'
  ];

  const escapeCSV = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  let csvContent = csvHeaders.map(escapeCSV).join(",") + "\n";

  employees.forEach(emp => {
    const cf = getCustomFields(emp);
    const isSG = cf.nationality === "Singaporean";

    let certsStr = "-";
    if (Array.isArray(cf.certifications) && cf.certifications.length > 0) {
      certsStr = cf.certifications.map((c: any) => 
        `${c?.certName || 'Cert'} (${c?.issuingOrg || 'Org'} - No: ${c?.certNumber || 'N/A'})`
      ).join("; ");
    }

    const row = [
      emp.emp_id || "-",
      cf.firstName || (emp.name ? String(emp.name).split(" ")[0] : "") || "-",
      cf.lastName || (emp.name ? String(emp.name).split(" ").slice(1).join(" ") : "") || "-",
      emp.name || "-",
      formatDate(emp.date_of_birth || cf.dob),
      emp.gender || cf.gender || "-",
      cf.maritalStatus || "-",
      cf.nationality || "-",
      
      cf.identityType || "-",
      cf.nricNumber || "-",
      cf.nricResidentialStatus || "-",
      cf.cpfLinkedStatus || "-",
      cf.taxId || "-",
      cf.finNumber || "-",
      cf.finPassportNumber || "-",
      formatDate(cf.finPassportExpiryDate),
      cf.finIssuingCountry || "-",
      cf.workPassType || "-",
      cf.workPassNumber || "-",
      formatDate(cf.workPassIssueDate),
      formatDate(cf.workPassExpiryDate),

      cf.personalEmail || "-",
      emp.email || "-",
      isSG ? [cf.mobileCode, cf.mobileNumber].filter(Boolean).join(" ") : [cf.currentMobileCode, cf.currentMobileNumber].filter(Boolean).join(" ") || emp.mobile || "-",
      isSG ? cf.residentialAddress : cf.currentResidentialAddress || emp.address || "-",
      isSG ? cf.postalCode : cf.currentPostalCode || "-",
      !isSG ? [cf.nativeMobileCode, cf.nativeMobileNumber].filter(Boolean).join(" ") : "-",
      !isSG ? cf.nativeResidentialAddress : "-",
      !isSG ? cf.nativePostalCode : "-",

      emp.emergency_contact_name || cf.emergName || "-",
      emp.emergency_contact_relation || cf.emergRelation || "-",
      [cf.emergContactCode, cf.emergContact].filter(Boolean).join(" ") || emp.emergency_contact_number || "-",
      emp.emergency_contact_address || cf.emergAddress || "-",

      cf.schoolingCountry || "-",
      cf.schoolingInstName || "-",
      cf.schoolingQual || "-",
      cf.schoolingGradYear || "-",
      cf.higherEduCountry || "-",
      cf.higherEduInstName || "-",
      cf.higherEduCourseName || "-",
      cf.higherEduCourseDuration || "-",
      cf.higherEduQual || "-",
      cf.higherEduGradYear || "-",

      certsStr,

      cf.insuranceType || "-",
      cf.insurProvider || "-",
      cf.insurPolicyNum || "-",
      formatDate(cf.insurPolicyStart),
      formatDate(cf.insurPolicyExpiry),
      cf.insurCoverageAmt || "-",
      cf.insurPremiumAmt || "-",
      cf.insurPaymentFreq || "-",
      cf.empCovered || "-",
      cf.depsCovered || "-",
      cf.numDeps || "-",
      cf.spouseCoverage || "-",
      cf.childrenCoverage || "-",
      cf.parentsCoverage || "-",

      emp.bank_name || cf.bankName || "-",
      emp.account_holder_name || cf.accountHolder || "-",
      emp.account_number || cf.accountNum || "-",
      cf.bankCode || "-",
      cf.branchCode || "-",
      cf.salaryPaymentMode || "-"
    ];

    csvContent += row.map(escapeCSV).join(",") + "\n";
  });

  return csvContent;
};

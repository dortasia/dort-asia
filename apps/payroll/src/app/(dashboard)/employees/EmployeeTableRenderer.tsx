"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Trash2, Edit, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
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
          .select('attendance_config')
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
              .select('attendance_config')
              .eq('company_id', empRecord.company_id)
              .maybeSingle();
            comp = compEmp;
          }
        }

        if (comp?.attendance_config?.projects) {
          setRealProjects(comp.attendance_config.projects);
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

  // Search and Pagination State
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = (format: "xls" | "xlsx" | "csv") => {
    try {
      if (!employees || employees.length === 0) {
        alert("No employee data found to export.");
        return;
      }

      // 100% Synchronous mapping to avoid browser download blocking
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

      // Defer closing the dropdown to prevent unmounting the target during event loop
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

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

        {/* Left — Search + Filter */}
        <div className="flex items-center gap-3">
          <div className="relative w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Type to Search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-white/10 rounded-full text-[13px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition-all bg-white dark:bg-[#1C1C1E]"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-full text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <Filter className="h-4 w-4" /> Filter
          </button>
        </div>

        {/* Right — Add Employee + Export */}
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAddModal(true)} className="px-6 py-2 bg-[#007AFF] text-white text-[13px] font-semibold rounded-full shadow-sm hover:bg-[#0062CC] transition-colors">
            Add Employee
          </button>

          <div className="relative" ref={exportDropdownRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowExportDropdown(prev => !prev);
              }}
              className="flex items-center gap-2 px-5 py-2 bg-[#F1F3F5] dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-[13px] font-semibold rounded-full hover:bg-gray-200 dark:hover:bg-white/5 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-3 3m0 0l-3-3m3 3V4" /></svg>
              Export
              <ChevronDown
                className={`h-3 w-3 text-gray-500 transition-transform duration-200 ${showExportDropdown ? "rotate-180" : ""}`}
                strokeWidth={2.5}
              />
            </button>

            {showExportDropdown && (
              <div 
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full right-0 mt-2 w-[165px] bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] z-[100] p-1.5"
              >
                <button
                  type="button"
                  onClick={() => handleExport("xls")}
                  className="w-full text-left px-3.5 py-2.5 text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-[#2C2C35] transition-colors rounded-[8px] flex items-center gap-2.5"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" /> Export as XLS
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("xlsx")}
                  className="w-full text-left px-3.5 py-2.5 text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-[#2C2C35] transition-colors rounded-[8px] flex items-center gap-2.5"
                >
                  <span className="h-2 w-2 rounded-full bg-teal-500 flex-shrink-0" /> Export as XLSX
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("csv")}
                  className="w-full text-left px-3.5 py-2.5 text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-[#2C2C35] transition-colors rounded-[8px] flex items-center gap-2.5"
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" /> Export as CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table & Pagination Wrapper */}
      <div className="bg-white dark:bg-[#121217] rounded-[24px] overflow-hidden border border-gray-100 dark:border-[#2C2C35]">
        {/* Table */}
        <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[#F8F9FA] dark:bg-black/20 border-b border-gray-100 dark:border-white/5">
              <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide">Employee ID</th>
              <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide">Employee Name</th>
              <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide">Designation</th>
              <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide">Department</th>
              <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide">Projects</th>
              <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide">Status</th>
              <th className="px-5 py-4 text-[12px] font-bold text-gray-500 tracking-wide text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.map((emp, index) => {
              const empProjects = getEmployeeProjects(emp);
              return (
                <tr 
                  key={emp.id} 
                  onClick={() => router.push(`/employees/${emp.id}`)}
                  className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer relative hover:z-50"
                  style={{ zIndex: employees.length - index }}
                >
                  <td className="px-5 py-4 text-[13px] font-medium text-gray-600 dark:text-gray-400">
                    {emp.empId || String((currentPage - 1) * itemsPerPage + index + 1).padStart(5, '0')}
                  </td>
                  <td className="px-5 py-4 text-[14px] font-semibold text-gray-900 dark:text-white">
                    {emp.name}
                  </td>
                  <td className="px-5 py-4 text-[13px] text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                    {emp.designation || "-"}
                  </td>
                  <td className="px-5 py-4 text-[13px] text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                    {emp.department}
                  </td>
                  <td className="px-5 py-4 relative" onClick={(e) => e.stopPropagation()}>
                    {empProjects.length > 0 ? (
                      <div className="relative inline-block group">
                        <span className="text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:underline cursor-pointer transition-colors">
                          {empProjects[0].code}
                          {empProjects.length > 1 && ` +${empProjects.length - 1}`}
                        </span>
                        
                        {/* Dropdown list of active projects */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2.5 hidden group-hover:block z-50 bg-white dark:bg-[#1C1C22] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E5E5EA] dark:border-[#2A2A31] rounded-[16px] p-4 w-[240px] pointer-events-none animate-in fade-in slide-in-from-top-1 duration-150">
                          <p className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                            Active Projects ({empProjects.length})
                          </p>
                          <div className="space-y-2.5">
                            {empProjects.map((p) => (
                              <div key={p.id} className="flex flex-col gap-0.5 text-left">
                                <span className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight">
                                  {p.name}
                                </span>
                                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                                  {p.code}
                                </span>
                              </div>
                            ))}
                          </div>
                          {/* Tooltip Arrow */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-[5px] w-2.5 h-2.5 rotate-45 bg-white dark:bg-[#1C1C22] border-t border-l border-[#E5E5EA] dark:border-[#2A2A31]" />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[13px] text-gray-400 dark:text-gray-600 font-medium">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[13px] font-bold ${emp.rawData?.is_active === false ? "text-[#FF3B30]" : "text-[#34C759]"}`}>
                      {emp.rawData?.is_active === false ? "Inactive" : "Active"}
                    </span>
                  </td>
                  <td className="px-5 py-4 flex items-center justify-center gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(emp.id, emp.name, emp.email); }}
                      className="p-1.5 text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-[8px] transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/employees/${emp.id}/edit`); }}
                      className="p-1.5 text-[#007AFF] hover:bg-[#007AFF]/10 rounded-[8px] transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {paginatedEmployees.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[14px] text-gray-400 font-medium">
                  No employees found matching &quot;{search}&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between mt-4 px-1 pb-4">
        {/* Count */}
        <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">
          Showing {filteredEmployees.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} people
        </span>

        {/* Pages + size */}
        <div className="flex items-center gap-2">
          {/* Prev */}
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8 flex items-center justify-center rounded-[8px] bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] text-gray-600 dark:text-gray-400 hover:border-[#007AFF]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
            Math.max(0, currentPage - 3),
            Math.max(4, currentPage + 1)
          ).map(pg => (
            <button
              key={pg}
              onClick={() => setCurrentPage(pg)}
              className={`h-8 w-8 flex items-center justify-center rounded-[8px] text-[13px] font-bold transition-colors ${
                pg === currentPage
                  ? "bg-[#007AFF] text-white shadow-sm"
                  : "bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] text-gray-700 dark:text-gray-300 hover:border-[#007AFF]/40"
              }`}
            >
              {pg}
            </button>
          ))}

          {/* Next */}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-8 w-8 flex items-center justify-center rounded-[8px] bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] text-gray-600 dark:text-gray-400 hover:border-[#007AFF]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={14} />
          </button>

          {/* Page size select */}
          <div className="relative ml-2">
            <select
              value={itemsPerPage}
              onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="appearance-none bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] rounded-[8px] pl-3 pr-7 py-1.5 text-[12px] font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 cursor-pointer"
            >
              {[10, 20, 50].map(s => <option key={s} value={s}>{s} / page</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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

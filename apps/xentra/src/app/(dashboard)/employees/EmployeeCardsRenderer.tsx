"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, Edit, MoreHorizontal, ChevronLeft, ChevronRight, ChevronDown, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

import { getUserAvatarUrl } from "@/utils/avatarColor";

type EmployeeData = {
  id: string;
  name: string;
  role: string;
  designation?: string;
  empId: string | null;
  department: string;
  email: string;
  mobile: string;
  jobType: string;
  initials: string;
  isComplete: boolean;
  color: string;
  bg: string;
  avatar_url?: string | null;
  currentProject?: string | null;
  baseSalary?: string | null;
  rawData?: any;
};

export default function EmployeeCardsRenderer({ employees }: { employees: EmployeeData[] }) {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showPageSizeMenu, setShowPageSizeMenu] = useState(false);
  const pageSizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
      if (pageSizeRef.current && !pageSizeRef.current.contains(e.target as Node)) {
        setShowPageSizeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: string; name: string; email: string; empId?: string | null } | null>(null);
  const [deleteInputText, setDeleteInputText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState("");

  const handleDelete = (id: string, name: string, email: string, empId?: string | null) => {
    setEmployeeToDelete({ id, name, email, empId });
    setDeleteInputText("");
    setDeleteModalError("");
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    setDeleteModalError("");

    try {
      await fetch('/api/employee-credentials', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', email: employeeToDelete.email, employeeId: employeeToDelete.id }),
        headers: { 'Content-Type': 'application/json' }
      });

      const supabase = createClient();
      const { error } = await supabase.from('employees').delete().eq('id', employeeToDelete.id);
      
      if (error) throw error;
      
      window.location.reload();
    } catch (err: any) {
      setDeleteModalError("Failed to delete employee: " + (err.message || "Unknown error"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBlock = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to block ${name}?`)) {
      alert("Employee blocked.");
    }
  };

  // Pagination helper calculations
  const totalItems = employees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentEmployees = employees.slice(startIndex, endIndex);

  return (
    <div className="w-full overflow-hidden bg-white dark:bg-[#121217] rounded-[24px] border border-[#F1F3F5] dark:border-[#2C2C35]">
      <div className="overflow-x-auto w-full min-h-[300px]">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[#F8F9FA] dark:bg-black/20 border-b border-gray-100 dark:border-white/5">
              <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Employee</th>
              <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Designation</th>
              <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Current Project</th>
              <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Job Type</th>
              <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Base Salary</th>
              <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">Status</th>
              <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400 text-right pr-12">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentEmployees.map((employee) => (
              <tr 
                key={employee.id}
                className="border-b border-gray-50 dark:border-white/5 hover:bg-[#F8F9FA]/40 dark:hover:bg-white/5 transition-colors"
              >
                {/* Employee: initials avatar + name + empId */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-[40px] w-[40px] rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800"
                    >
                      <img src={getUserAvatarUrl(employee.avatar_url)} alt={employee.name} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = "/default-profile.svg"; e.currentTarget.onerror = null; }} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-semibold text-gray-900 dark:text-white leading-tight">
                        {employee.name}
                      </span>
                      <span className="text-[12px] text-gray-400 dark:text-gray-500 font-medium mt-0.5 leading-none">
                        {employee.empId || "EMP-N/A"}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Designation */}
                <td className="px-6 py-4 text-[14px] font-medium text-gray-600 dark:text-gray-300">
                  {employee.designation || employee.role}
                </td>

                {/* Current Project */}
                <td className="px-6 py-4 text-[14px] font-medium text-gray-600 dark:text-gray-300">
                  {(() => {
                    const projects = employee.currentProject 
                      ? employee.currentProject.split(',').map(p => p.trim()).filter(Boolean) 
                      : [];
                    if (projects.length === 0) return "—";
                    if (projects.length === 1) return projects[0];
                    return (
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[150px]" title={projects.join(', ')}>{projects[0]}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-[#007AFF]/10 text-[#007AFF] text-[11px] font-bold">
                          +{projects.length - 1}
                        </span>
                      </div>
                    );
                  })()}
                </td>

                {/* Job Type */}
                <td className="px-6 py-4 text-[14px] font-medium text-gray-600 dark:text-gray-300">
                  {employee.jobType}
                </td>

                {/* Base Salary */}
                <td className="px-6 py-4 text-[14px] font-medium text-gray-600 dark:text-gray-300">
                  {employee.baseSalary 
                    ? `S$ ${Number(employee.baseSalary).toLocaleString("en-SG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` 
                    : "Not Disclosed"}
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span className={`text-[14px] font-semibold ${employee.rawData?.is_active === false ? "text-[#FF3B30]" : "text-[#34C759]"}`}>
                    {employee.rawData?.is_active === false ? "Inactive" : "Active"}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right pr-12">
                  <div className="flex items-center justify-end gap-3.5 relative">
                    {/* View Eye */}
                    <button
                      onClick={() => router.push(`/employees/${employee.id}`)}
                      className="p-1.5 text-[#007AFF] hover:bg-[#007AFF]/10 rounded-lg transition-colors"
                      title="View Profile"
                    >
                      <Eye className="h-4 w-4" strokeWidth={2.5} />
                    </button>

                    {/* Edit Pencil */}
                    <button
                      onClick={() => router.push(`/employees/${employee.id}/edit`)}
                      className="p-1.5 text-[#007AFF] hover:bg-[#007AFF]/10 rounded-lg transition-colors"
                      title="Edit Profile"
                    >
                      <Edit className="h-4 w-4" strokeWidth={2.5} />
                    </button>

                    {/* Ellipsis Menu */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === employee.id ? null : employee.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {openMenuId === employee.id && (
                      <div 
                        ref={menuRef}
                        className="absolute top-10 right-0 w-36 bg-white dark:bg-[#1C1C1E] shadow-xl rounded-[12px] border border-gray-100 dark:border-[#2C2C35] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                      >
                        <button 
                          onClick={() => { handleBlock(employee.id, employee.name); setOpenMenuId(null); }}
                          className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                          Block Employee
                        </button>
                        <button 
                          onClick={() => { handleDelete(employee.id, employee.name, employee.email); setOpenMenuId(null); }}
                          className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-[#FF3B30] hover:bg-[#FF3B30]/10"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[14px] text-gray-400 font-medium">
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {employees.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 dark:border-[#2C2C35] px-6 py-5 bg-white dark:bg-[#121217] gap-4">
          <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">
            Showing {startIndex + 1} to {endIndex} of {totalItems} employees
          </p>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 dark:text-gray-500 bg-white dark:bg-[#121217] hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-semibold transition-colors ${
                    currentPage === page 
                      ? "bg-[#007AFF] text-white shadow-sm" 
                      : "border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 bg-white dark:bg-[#121217]"
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 dark:text-gray-500 bg-white dark:bg-[#121217] hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="relative" ref={pageSizeRef}>
              <button
                onClick={() => setShowPageSizeMenu(!showPageSizeMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121217] text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                {itemsPerPage} / page
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>

              {showPageSizeMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-28 bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-lg shadow-xl z-50 p-1">
                  {[5, 10, 20, 50].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setItemsPerPage(size);
                        setCurrentPage(1);
                        setShowPageSizeMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[12px] font-bold rounded-md transition-colors ${
                        itemsPerPage === size
                          ? "bg-[#007AFF] text-white"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      {size} / page
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Caution Delete Employee Modal */}
      {employeeToDelete && (
        <div 
          className="fixed inset-0 z-[100000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 font-sf-text"
          onClick={() => {
            setEmployeeToDelete(null);
            setDeleteInputText("");
            setDeleteModalError("");
          }}
        >
          <div 
            className="bg-white dark:bg-[#121217] border border-red-100 dark:border-red-900/30 rounded-[24px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-red-50 dark:border-red-900/20 flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-red-600 dark:text-red-500">
                Caution: Delete Employee
              </h3>
              <button 
                onClick={() => {
                  setEmployeeToDelete(null);
                  setDeleteInputText("");
                  setDeleteModalError("");
                }} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <p className="text-[14px] text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                Are you sure you want to permanently delete <strong className="text-gray-900 dark:text-white font-semibold">{employeeToDelete.name}</strong>? 
                This action is irreversible and will delete all login credentials, timesheets, and records.
              </p>
              
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-gray-600 dark:text-gray-400">
                  Type <strong className="text-red-600 dark:text-red-400 select-all font-semibold">DELETE</strong> to confirm:
                </label>
                <input 
                  type="text"
                  placeholder='Type "DELETE" here'
                  className="w-full px-4 py-3 rounded-[14px] border border-gray-200 dark:border-[#2A2A31] bg-gray-50 dark:bg-[#1C1C22] text-gray-900 dark:text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-[14px] font-medium transition-all"
                  value={deleteInputText}
                  onChange={(e) => setDeleteInputText(e.target.value)}
                />
              </div>

              {deleteModalError && (
                <p className="text-[13px] text-red-600 font-medium">{deleteModalError}</p>
              )}
            </div>

            <div className="px-6 pb-6 pt-3 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-white/5">
              <button 
                type="button" 
                onClick={() => {
                  setEmployeeToDelete(null);
                  setDeleteInputText("");
                  setDeleteModalError("");
                }}
                className="px-5 py-2.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 font-medium text-[14px] rounded-full transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={isDeleting || (deleteInputText.trim().toUpperCase() !== "DELETE" && deleteInputText.trim() !== employeeToDelete.empId && deleteInputText.trim().toLowerCase() !== employeeToDelete.name.toLowerCase())}
                onClick={confirmDeleteEmployee}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-[14px] rounded-full transition-colors flex items-center gap-2"
              >
                {isDeleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

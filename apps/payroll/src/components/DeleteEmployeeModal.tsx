"use client";

import React, { useState } from "react";
import { AlertCircle, X, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface DeleteEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    id: string;
    name: string;
    email: string;
    is_head?: boolean;
  };
  onSuccess: () => void;
}

export default function DeleteEmployeeModal({ isOpen, onClose, employee, onSuccess }: DeleteEmployeeModalProps) {
  const [confirmName, setConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (confirmName !== employee.name) {
      setError("Entered name does not match.");
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      // 1. Delete credentials
      await fetch("/api/employee-credentials", {
        method: "POST",
        body: JSON.stringify({ action: "delete", email: employee.email, employeeId: employee.id }),
        headers: { "Content-Type": "application/json" },
      });

      // 2. Delete employee record
      const supabase = createClient();
      const { error: dbError } = await supabase.from("employees").delete().eq("id", employee.id);

      if (dbError) throw dbError;

      onSuccess();
    } catch (err: any) {
      setError("Failed to delete employee: " + (err.message || "Unknown error"));
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden animate-in zoom-in-95 fade-in duration-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-[#FF3B30]">
                <div className="p-2 bg-[#FF3B30]/10 rounded-full">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">
                  {employee.is_head ? "You cannot Delete this employee" : "Delete Employee"}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {employee.is_head ? (
              <div className="mt-4 flex flex-col gap-3">
                <p className="text-[14px] text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                  <strong className="text-gray-900 dark:text-white font-bold">{employee.name}</strong> is currently assigned as a Department Head.
                </p>
                <div className="p-4 bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-xl">
                  <p className="text-[13px] text-[#007AFF] dark:text-[#30B0C7] font-bold">
                    How to delete this employee:
                  </p>
                  <ol className="list-decimal list-inside text-[13px] text-gray-600 dark:text-gray-400 mt-2 space-y-1.5 font-medium">
                    <li>Go to the department detail page.</li>
                    <li>Open <strong>Department Settings</strong>.</li>
                    <li>Reassign the Department Head role to another employee.</li>
                    <li>Once reassigned, you can return here to delete the employee record.</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-[14px] text-gray-600 dark:text-gray-300 mb-4">
                  Are you absolutely sure you want to permanently delete <strong className="text-gray-900 dark:text-white font-bold">{employee.name}</strong>?
                  This action is irreversible and will delete all login credentials and associated records.
                </p>

                <div className="mb-4">
                  <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Please type <strong className="text-[#FF3B30] select-all">{employee.name}</strong> to confirm.
                  </label>
                  <input
                    type="text"
                    value={confirmName}
                    onChange={(e) => {
                      setConfirmName(e.target.value);
                      setError("");
                    }}
                    placeholder={employee.name}
                    className="w-full px-4 py-2.5 bg-[#F8F9FA] dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#FF3B30] focus:ring-1 focus:ring-[#FF3B30]/20 transition-all"
                  />
                  {error && <p className="text-[13px] text-[#FF3B30] font-semibold mt-2">{error}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 flex items-center justify-end gap-3">
            {employee.is_head ? (
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-[14px] font-bold bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-xl transition-colors"
              >
                Close
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="px-5 py-2.5 text-[14px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || confirmName !== employee.name}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#FF3B30] text-white text-[14px] font-bold rounded-xl hover:bg-[#D70015] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {isDeleting ? "Deleting..." : "Delete Employee"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

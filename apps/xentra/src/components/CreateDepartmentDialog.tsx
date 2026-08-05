"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import FormDatePicker from "@/components/ui/FormDatePicker";
import { Check } from "lucide-react";

interface CreateDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateDepartmentDialog({ open, onOpenChange, onSuccess }: CreateDepartmentDialogProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [customType, setCustomType] = useState("");
  const [createdDeptId, setCreatedDeptId] = useState<string | null>(null);
  const [assignHeadEmail, setAssignHeadEmail] = useState("");
  const [assigningHead, setAssigningHead] = useState(false);
  const [assignHeadError, setAssignHeadError] = useState("");
  const [assignHeadSuccess, setAssignHeadSuccess] = useState(false);
  const [formData, setFormData] = useState({
    department_name: "",
    department_type: "Main Department",
    description: "",
    created_date: new Date().toISOString().split("T")[0],
  });

  const handleResetAndClose = () => {
    if (showSuccess && onSuccess) {
      onSuccess();
    }
    onOpenChange(false);
    setShowSuccess(false);
    setCustomType("");
    setCreatedDeptId(null);
    setAssignHeadEmail("");
    setAssigningHead(false);
    setAssignHeadError("");
    setAssignHeadSuccess(false);
    setFormData({
      department_name: "",
      department_type: "Main Department",
      description: "",
      created_date: new Date().toISOString().split("T")[0],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department_name.trim()) return;

    setLoading(true);
    try {
      const fallbackThemes = [
        { bg: "#FBE0CD", accent: "#F9863E" },
        { bg: "#D1F2E0", accent: "#00C978" },
        { bg: "#E3D6F5", accent: "#00C978" },
      ];
      const randomTheme = fallbackThemes[Math.floor(Math.random() * fallbackThemes.length)];

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Fetch the company_id for the current user
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("super_admin_id", user.id)
        .maybeSingle();

      let companyId = company?.id;
      let adminEmpId = null;
      if (!companyId) {
        // Fallback: check employees table for company_id
        const { data: empRecord } = await supabase
          .from("employees")
          .select("id, company_id")
          .eq("user_id", user.id)
          .maybeSingle();
        companyId = empRecord?.company_id || user.id;
        if (empRecord?.id) adminEmpId = empRecord.id;
      } else {
        const { data: empRecord } = await supabase.from("employees").select("id").eq("user_id", user.id).maybeSingle();
        if (empRecord?.id) adminEmpId = empRecord.id;
      }
      
      const finalDeptType = formData.department_type === "Others" ? (customType.trim() || "Others") : formData.department_type;

      const { data: deptData, error: deptError } = await supabase
        .from("departments")
        .insert({
          department_name: formData.department_name.trim(),
          delegation_config: { department_type: finalDeptType },
          description: formData.description.trim() || null,
          created_at: formData.created_date ? new Date(formData.created_date).toISOString() : new Date().toISOString(),
          created_date: formData.created_date ? new Date(formData.created_date).toISOString() : undefined,
          theme_bg: randomTheme.bg,
          theme_accent: randomTheme.accent,
          company_id: companyId,
        })
        .select("id")
        .single();

      if (deptError) throw deptError;

      // Create notification
      await supabase.from("notifications").insert({
        employee_id: adminEmpId,
        title: "New Department Created",
        message: `Department "${formData.department_name.trim()}" (${finalDeptType}) has been created successfully.`,
        type: "success",
        is_read: false
      });

      setCreatedDeptId(deptData.id);
      setShowSuccess(true);
    } catch (error: any) {
      console.error("Error creating department:", error);
      alert("Failed to create department: " + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignHead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignHeadEmail.trim() || !createdDeptId) return;

    setAssigningHead(true);
    setAssignHeadError("");
    setAssignHeadSuccess(false);

    try {
      // Find employee by email
      const { data: emp, error: empErr } = await supabase
        .from("employees")
        .select("id, department_id, name")
        .eq("email", assignHeadEmail.trim())
        .maybeSingle();

      if (empErr) throw empErr;
      if (!emp) {
        setAssignHeadError("Employee not found with this email.");
        return;
      }

      if (emp.department_id) {
        setAssignHeadError("This employee is already assigned to a department.");
        return;
      }

      // Update employee
      const { error: updateErr } = await supabase
        .from("employees")
        .update({
          department_id: createdDeptId,
          role: "Admin",
          is_head: true
        })
        .eq("id", emp.id);

      if (updateErr) throw updateErr;
      
      setAssignHeadSuccess(true);
    } catch (error: any) {
      console.error("Error assigning head:", error);
      setAssignHeadError("Failed to assign department head: " + (error.message || error));
    } finally {
      setAssigningHead(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleResetAndClose(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-[#121217] p-6 rounded-[24px] border border-[#E5E7EB] dark:border-[#2A2A31] font-sf-text">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center text-center py-3 px-1 animate-in fade-in zoom-in-95 duration-200">
            <div className="h-16 w-16 rounded-full bg-[#34C759]/15 text-[#34C759] flex items-center justify-center mb-4 border border-[#34C759]/30">
              <Check size={32} strokeWidth={2.5} />
            </div>

            <h3 className="text-[20px] font-sf font-semibold text-[#161616] dark:text-white mb-1.5">
              Department Created
            </h3>

            <p className="text-[14px] text-gray-500 dark:text-gray-400 font-sf-text leading-normal mb-5">
              <span className="font-semibold text-gray-900 dark:text-white">{formData.department_name}</span> has been successfully added.
            </p>

            <div className="w-full bg-[#F8F9FA] dark:bg-[#1C1C22] p-4 rounded-[16px] border border-gray-100 dark:border-[#2A2A31] text-left flex flex-col gap-2.5 mb-6 font-sf-text">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-gray-400 font-medium">Department Name</span>
                <span className="text-[#161616] dark:text-white font-semibold truncate max-w-[200px]">{formData.department_name}</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-gray-400 font-medium">Type</span>
                <span className="text-[#161616] dark:text-white font-semibold">
                  {formData.department_type === "Others" ? customType : formData.department_type}
                </span>
              </div>
              {formData.created_date && (
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-gray-400 font-medium">Created Date</span>
                  <span className="text-[#161616] dark:text-white font-semibold">{formData.created_date}</span>
                </div>
              )}
            </div>

            {/* ASSIGN DEPARTMENT HEAD SECTION */}
            <div className="w-full text-left mb-6 font-sf-text">
              <h4 className="text-[14px] font-semibold text-[#161616] dark:text-white mb-2">Assign Department Head Required</h4>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-3 leading-normal">
                Choose a department head by typing their email. Only employees not currently in a department can be assigned.
              </p>
              
              {assignHeadSuccess ? (
                <div className="flex items-center gap-2 p-3 bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20 rounded-[12px] text-[13px] font-medium">
                  <Check size={16} />
                  Department Head assigned successfully.
                </div>
              ) : (
                <form onSubmit={handleAssignHead} className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={assignHeadEmail}
                      onChange={(e) => setAssignHeadEmail(e.target.value)}
                      placeholder="Enter employee email..."
                      className="flex-1 px-3 py-2 border border-[#E5E7EB] dark:border-[#2A2A31] rounded-[12px] text-[14px] text-[#161616] dark:text-white bg-transparent focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all placeholder:text-gray-400"
                      required
                    />
                    <button
                      type="submit"
                      disabled={assigningHead || !assignHeadEmail.trim()}
                      className="px-4 py-2 bg-[#007AFF] hover:bg-[#005bb5] text-white rounded-[12px] text-[14px] font-medium disabled:opacity-50 transition-colors"
                    >
                      {assigningHead ? "Assigning..." : "Assign"}
                    </button>
                  </div>
                  {assignHeadError && (
                    <span className="text-[12px] text-red-500 font-medium">{assignHeadError}</span>
                  )}
                </form>
              )}
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full py-3 bg-[#0064E0] hover:bg-[#0052B8] text-white rounded-full text-[16px] font-sf-text font-medium leading-[1.3] transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-[20px] font-sf font-semibold leading-[1.3] text-[#161616] dark:text-white">Create Department</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium leading-[1.3] text-[#161616] dark:text-gray-300">Department Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.department_name}
                  onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E7EB] dark:border-[#2A2A31] rounded-[12px] text-[15px] leading-[1.3] text-[#161616] dark:text-white bg-transparent focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all placeholder:text-gray-400"
                  required
                  placeholder="e.g. Human Resources"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium leading-[1.3] text-[#161616] dark:text-gray-300">Department Type <span className="text-red-500">*</span></label>
                <select
                  value={formData.department_type}
                  onChange={(e) => setFormData({ ...formData, department_type: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E7EB] dark:border-[#2A2A31] rounded-[12px] text-[15px] leading-[1.3] text-[#161616] dark:text-white bg-white dark:bg-[#1C1C22] focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all cursor-pointer"
                >
                  <option value="Main Department">Main Department</option>
                  <option value="Branch / Sub-Department">Branch / Sub-Department</option>
                  <option value="Administration">Administration</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Management">Management</option>
                  <option value="Others">Others</option>
                </select>
                {formData.department_type === "Others" && (
                  <div className="mt-1">
                    <input
                      type="text"
                      maxLength={25}
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      placeholder="Enter custom type (max 25 chars)..."
                      className="w-full px-3 py-2 border border-[#E5E7EB] dark:border-[#2A2A31] rounded-[12px] text-[15px] leading-[1.3] text-[#161616] dark:text-white bg-transparent focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all placeholder:text-gray-400"
                      required
                    />
                    <span className="text-[11px] text-gray-400 mt-1 block text-right font-sf-rounded">{customType.length}/25</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium leading-[1.3] text-[#161616] dark:text-gray-300">Created Date</label>
                <FormDatePicker
                  value={formData.created_date}
                  onChange={(date) => setFormData({ ...formData, created_date: date })}
                  placeholder="Select created date"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium leading-[1.3] text-[#161616] dark:text-gray-300">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E7EB] dark:border-[#2A2A31] rounded-[12px] text-[15px] leading-[1.3] text-[#161616] dark:text-white bg-transparent focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all min-h-[80px] resize-y placeholder:text-gray-400"
                  placeholder="Brief description of the department..."
                />
              </div>

              <DialogFooter className="mt-2 gap-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-5 py-2 text-[16px] font-sf-text font-medium leading-[1.3] text-[#161616] dark:text-gray-300 hover:bg-[#F4F4F5] dark:hover:bg-[#1C1C22] rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.department_name.trim()}
                  className="px-5 py-2 text-[16px] font-sf-text font-medium leading-[1.3] text-white bg-[#0064E0] hover:bg-[#0052B8] disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
                >
                  {loading ? "Creating..." : "Create Department"}
                </button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

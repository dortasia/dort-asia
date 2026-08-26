"use client";

import React, { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserCheck01Icon,
  PlusSignIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Delete01Icon,
  Shield01Icon,
  AlertCircleIcon
} from "@hugeicons/core-free-icons";

interface AdminUserItem {
  id: string;
  user_id: string;
  account_id?: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN";
  is_active: boolean;
  created_at: string;
}

export function AdminUsersView() {
  const [admins, setAdmins] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"ADMIN" | "SUPER_ADMIN">("ADMIN");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load administrator accounts.");
      }
      const data = await res.json();
      setAdmins(data.admins || []);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) {
      setErrorMessage("Please provide an email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newAdminEmail.trim(), role: newAdminRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to grant administrator access.");
      }

      setSuccessToast(`Granted ${newAdminRole} permissions to ${newAdminEmail}`);
      setTimeout(() => setSuccessToast(null), 4000);
      setIsModalOpen(false);
      setNewAdminEmail("");
      await fetchAdmins();
    } catch (err: any) {
      setErrorMessage(err.message || "Error adding administrator");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (admin: AdminUserItem) => {
    try {
      const res = await fetch(`/api/admin/users/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !admin.is_active }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to toggle status");
      }

      setSuccessToast(`Admin user ${admin.is_active ? "deactivated" : "activated"}`);
      setTimeout(() => setSuccessToast(null), 3000);
      await fetchAdmins();
    } catch (err: any) {
      alert(err.message || "Failed to update admin user");
    }
  };

  const handleDeleteAdmin = async (admin: AdminUserItem) => {
    if (!confirm(`Are you sure you want to permanently revoke admin access for ${admin.email}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${admin.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }

      setSuccessToast("Administrator revoked.");
      setTimeout(() => setSuccessToast(null), 3000);
      await fetchAdmins();
    } catch (err: any) {
      alert(err.message || "Failed to revoke administrator");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-[13.5px] font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-gray-700 animate-in fade-in slide-in-from-bottom-3">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Authorization & Roles</h2>
          <p className="text-[13.5px] text-gray-500 mt-0.5">
            Database-backed role assignment for platform management and Super Admin privileges
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMessage(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-[13.5px] font-semibold transition-all shadow-2xs cursor-pointer"
        >
          <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
          <span>Grant Admin Role</span>
        </button>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm animate-pulse">
            Loading administrator directory...
          </div>
        ) : admins.length === 0 ? (
          <div className="p-16 text-center text-gray-400 space-y-2">
            <HugeiconsIcon icon={UserCheck01Icon} className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-[14px] font-medium text-gray-600">No administrators found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="bg-gray-50/80 text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200/80">
                  <th className="py-3.5 px-6 font-semibold">User Email</th>
                  <th className="py-3.5 px-4 font-semibold">Role</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Granted On</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900">
                      {admin.email}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          admin.role === "SUPER_ADMIN"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {admin.role}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          admin.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}
                      >
                        {admin.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-gray-500 text-[12.5px]">
                      {new Date(admin.created_at).toLocaleDateString("en-SG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(admin)}
                          className="px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold cursor-pointer"
                        >
                          {admin.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin)}
                          title="Revoke Admin Access"
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
                        >
                          <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grant Admin Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-md w-full p-6 md:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Grant Administrator Role</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700">
                <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-[13px] border border-red-200">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleAddAdmin} className="space-y-4 mt-5">
              <div>
                <label className="block text-[12.5px] font-bold text-gray-700 mb-1">User Account Email *</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden focus:border-gray-900"
                />
                <p className="text-[11.5px] text-gray-400 mt-1">
                  The user must already have a registered account in Dort Asia.
                </p>
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Assigned Role</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden bg-white"
                >
                  <option value="ADMIN">ADMIN (Catalog & Subscriptions)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Governance & Security)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-[13.5px] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-[13.5px] font-semibold transition-all shadow-2xs disabled:opacity-50"
                >
                  {isSubmitting ? "Granting..." : "Grant Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

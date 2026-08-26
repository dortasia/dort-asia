"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Store01Icon,
  PlusSignIcon,
  Search01Icon,
  Edit01Icon,
  Delete01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Layers01Icon,
  UserMultiple02Icon,
  ArrowRight01Icon,
  EyeIcon,
  AlertCircleIcon
} from "@hugeicons/core-free-icons";

interface AppItem {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  long_description?: string;
  category?: string;
  platform?: string;
  logo_url?: string;
  hero_image?: string;
  status: string;
  developer?: string;
  version?: string;
  sort_order?: number;
  planCount?: number;
  activeSubscribers?: number;
  created_at: string;
}

export function AdminAppsView() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modal / Drawer state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Partial<AppItem> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/apps", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load applications");
      const data = await res.json();
      setApps(data.apps || []);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to fetch apps");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  // Filtered Apps
  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.category && app.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const isPublished = app.status === "active" || app.status === "published";
    const isDraft = app.status === "draft";
    const isArchived = app.status === "archived" || app.status === "deprecated";

    if (statusFilter === "published") return matchesSearch && isPublished;
    if (statusFilter === "draft") return matchesSearch && isDraft;
    if (statusFilter === "archived") return matchesSearch && isArchived;
    return matchesSearch;
  });

  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp || !editingApp.name || !editingApp.slug) {
      setErrorMessage("App name and slug are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const isNew = !editingApp.id;
      const url = isNew ? "/api/admin/apps" : `/api/admin/apps/${editingApp.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingApp),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to save application");
      }

      setSuccessToast(isNew ? "Application created successfully." : "Application updated.");
      setTimeout(() => setSuccessToast(null), 4000);
      setIsEditModalOpen(false);
      setEditingApp(null);
      await fetchApps();
    } catch (err: any) {
      setErrorMessage(err.message || "Error saving application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (app: AppItem, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/apps/${app.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Status update failed");
      }

      setSuccessToast(`App marked as ${newStatus.toUpperCase()}`);
      setTimeout(() => setSuccessToast(null), 3000);
      await fetchApps();
    } catch (err: any) {
      alert(err.message || "Failed to toggle status");
    }
  };

  const handleDeleteApp = async (app: AppItem) => {
    if (!confirm(`Are you sure you want to delete or archive "${app.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/apps/${app.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }

      setSuccessToast("Application removed/archived.");
      setTimeout(() => setSuccessToast(null), 3000);
      await fetchApps();
    } catch (err: any) {
      alert(err.message || "Failed to delete app");
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

      {/* Header Actions & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">App Directory & Catalog</h2>
          <p className="text-[13.5px] text-gray-500 mt-0.5">
            Configure marketplace apps, listings, developer credentials, and publication states
          </p>
        </div>

        <Link
          href="/dashboard/admin/apps/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-[13.5px] font-semibold transition-all shadow-2xs cursor-pointer"
        >
          <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
          <span>+ Add App</span>
        </Link>
      </div>

      {/* Search & Tabs Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          {[
            { id: "all", label: "All Apps" },
            { id: "published", label: "Published" },
            { id: "draft", label: "Drafts" },
            { id: "archived", label: "Archived" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <HugeiconsIcon
            icon={Search01Icon}
            className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applications..."
            className="w-full pl-9 pr-3.5 py-2 text-[13.5px] rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-900 bg-gray-50/50"
          />
        </div>
      </div>

      {/* Apps Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm animate-pulse">
            Loading application directory...
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-16 text-center text-gray-400 space-y-2">
            <HugeiconsIcon icon={Store01Icon} className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-[14px] font-medium text-gray-600">No applications matched the filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="bg-gray-50/80 text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200/80">
                  <th className="py-3.5 px-6 font-semibold">Application</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Plans</th>
                  <th className="py-3.5 px-4 font-semibold">Active Users</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApps.map((app) => {
                  const isPublished = app.status === "active" || app.status === "published";
                  const isArchived = app.status === "archived" || app.status === "deprecated";

                  return (
                    <tr key={app.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200/80 flex items-center justify-center shrink-0 overflow-hidden">
                            {app.logo_url ? (
                              <img src={app.logo_url} alt={app.name} className="w-6 h-6 object-contain" />
                            ) : (
                              <HugeiconsIcon icon={Store01Icon} className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 leading-snug">{app.name}</div>
                            <div className="text-[12px] text-gray-400 font-mono">/{app.slug}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-gray-600 font-medium">
                        {app.category || "General"}
                      </td>

                      <td className="py-4 px-4 text-gray-600">
                        <span className="font-semibold text-gray-900">{app.planCount || 0}</span> plans
                      </td>

                      <td className="py-4 px-4 text-gray-600">
                        <span className="font-semibold text-gray-900">{app.activeSubscribers || 0}</span> orgs
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isPublished
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isArchived
                              ? "bg-gray-100 text-gray-600 border-gray-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {isPublished ? "PUBLISHED" : isArchived ? "ARCHIVED" : "DRAFT"}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Publication Button */}
                          <button
                            onClick={() => handleToggleStatus(app, isPublished ? "draft" : "active")}
                            title={isPublished ? "Unpublish to Draft" : "Publish to Marketplace"}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <HugeiconsIcon
                              icon={isPublished ? Cancel01Icon : CheckmarkCircle02Icon}
                              className={`w-4 h-4 ${isPublished ? "text-amber-600" : "text-emerald-600"}`}
                            />
                          </button>

                          {/* View in Marketplace (if published) */}
                          {isPublished && (
                            <Link
                              href={`/dashboard/marketplace/${app.slug}`}
                              target="_blank"
                              title="View in Marketplace"
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              <HugeiconsIcon icon={EyeIcon} className="w-4 h-4 text-blue-600" />
                            </Link>
                          )}

                          {/* Edit Wizard Button */}
                          <Link
                            href={`/dashboard/admin/apps/${app.id}/edit`}
                            title="Edit in Wizard"
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            <HugeiconsIcon icon={Edit01Icon} className="w-4 h-4" />
                          </Link>

                          {/* Delete/Archive Button */}
                          <button
                            onClick={() => handleDeleteApp(app)}
                            title="Delete / Archive"
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
                          >
                            <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Create App Modal */}
      {isEditModalOpen && editingApp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                {editingApp.id ? `Edit ${editingApp.name}` : "Create New Application"}
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingApp(null);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-[13px] border border-red-200">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveApp} className="space-y-4 mt-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Application Name *</label>
                  <input
                    type="text"
                    required
                    value={editingApp.name || ""}
                    onChange={(e) => setEditingApp({ ...editingApp, name: e.target.value })}
                    placeholder="e.g. Xentra People"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden focus:border-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Slug Identifier *</label>
                  <input
                    type="text"
                    required
                    value={editingApp.slug || ""}
                    onChange={(e) => setEditingApp({ ...editingApp, slug: e.target.value })}
                    placeholder="e.g. xentra-people"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] font-mono focus:outline-hidden focus:border-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Short Tagline</label>
                <input
                  type="text"
                  value={editingApp.tagline || ""}
                  onChange={(e) => setEditingApp({ ...editingApp, tagline: e.target.value })}
                  placeholder="e.g. Intelligent HR, Leave & Payroll for modern teams"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden focus:border-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingApp.category || ""}
                    onChange={(e) => setEditingApp({ ...editingApp, category: e.target.value })}
                    placeholder="HR & Operations"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden focus:border-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Platform</label>
                  <input
                    type="text"
                    value={editingApp.platform || ""}
                    onChange={(e) => setEditingApp({ ...editingApp, platform: e.target.value })}
                    placeholder="Web & Cloud"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden focus:border-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Status</label>
                  <select
                    value={editingApp.status || "draft"}
                    onChange={(e) => setEditingApp({ ...editingApp, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden focus:border-gray-900 bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Published / Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Logo URL</label>
                  <input
                    type="text"
                    value={editingApp.logo_url || ""}
                    onChange={(e) => setEditingApp({ ...editingApp, logo_url: e.target.value })}
                    placeholder="/icons/xentra-logo.svg"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden focus:border-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Hero Image URL</label>
                  <input
                    type="text"
                    value={editingApp.hero_image || ""}
                    onChange={(e) => setEditingApp({ ...editingApp, hero_image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden focus:border-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Overview Description</label>
                <textarea
                  rows={3}
                  value={editingApp.description || ""}
                  onChange={(e) => setEditingApp({ ...editingApp, description: e.target.value })}
                  placeholder="Detailed app overview description for marketplace catalog..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden focus:border-gray-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingApp(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-[13.5px] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-[13.5px] font-semibold transition-all shadow-2xs disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

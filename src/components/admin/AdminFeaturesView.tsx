"use client";

import React, { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Layers01Icon,
  PlusSignIcon,
  Search01Icon,
  Edit01Icon,
  Delete01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Store01Icon
} from "@hugeicons/core-free-icons";

interface FeatureItem {
  id: string;
  app_id: string;
  appName: string;
  appSlug: string;
  feature_key: string;
  name: string;
  description?: string;
  value_type: "BOOLEAN" | "NUMBER" | "STRING" | "JSON";
  default_value: any;
  category?: string;
  status: string;
  created_at: string;
}

interface AppOption {
  id: string;
  name: string;
  slug: string;
}

export function AdminFeaturesView() {
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [apps, setApps] = useState<AppOption[]>([]);
  const [selectedAppFilter, setSelectedAppFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Partial<FeatureItem> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchFeaturesAndApps = async () => {
    try {
      setLoading(true);
      const [featRes, appsRes] = await Promise.all([
        fetch("/api/admin/features", { cache: "no-store" }),
        fetch("/api/admin/apps", { cache: "no-store" }),
      ]);

      if (featRes.ok) {
        const fData = await featRes.json();
        setFeatures(fData.features || []);
      }
      if (appsRes.ok) {
        const aData = await appsRes.json();
        setApps(aData.apps || []);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load features catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturesAndApps();
  }, []);

  const openNewFeatureModal = () => {
    const defaultAppId = apps[0]?.id || "";
    setEditingFeature({
      app_id: defaultAppId,
      feature_key: "",
      name: "",
      description: "",
      value_type: "BOOLEAN",
      default_value: true,
      category: "Core",
      status: "active",
    });
    setIsModalOpen(true);
  };

  const openEditFeatureModal = (feature: FeatureItem) => {
    setEditingFeature(feature);
    setIsModalOpen(true);
  };

  const handleSaveFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeature || !editingFeature.app_id || !editingFeature.feature_key || !editingFeature.name) {
      setErrorMessage("Please fill all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const isNew = !editingFeature.id;
      const url = isNew ? "/api/admin/features" : `/api/admin/features/${editingFeature.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingFeature),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to save feature");
      }

      setSuccessToast(isNew ? "Feature created successfully." : "Feature updated.");
      setTimeout(() => setSuccessToast(null), 4000);
      setIsModalOpen(false);
      setEditingFeature(null);
      await fetchFeaturesAndApps();
    } catch (err: any) {
      setErrorMessage(err.message || "Error saving feature");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFeature = async (feature: FeatureItem) => {
    if (!confirm(`Are you sure you want to delete feature "${feature.name}" (${feature.feature_key})?`)) return;

    try {
      const res = await fetch(`/api/admin/features/${feature.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      setSuccessToast("Feature removed.");
      setTimeout(() => setSuccessToast(null), 3000);
      await fetchFeaturesAndApps();
    } catch (err: any) {
      alert(err.message || "Failed to delete feature");
    }
  };

  const filteredFeatures = features.filter((f) => {
    const matchesApp = selectedAppFilter === "all" || f.app_id === selectedAppFilter;
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.feature_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.appName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesApp && matchesSearch;
  });

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
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Centralized Feature Catalog</h2>
          <p className="text-[13.5px] text-gray-500 mt-0.5">
            Manage granular capabilities, boolean entitlements, numeric quotas, and modular add-on definitions
          </p>
        </div>

        <button
          onClick={openNewFeatureModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-[13.5px] font-semibold transition-all shadow-2xs cursor-pointer"
        >
          <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
          <span>Register Feature</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* App selector dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-[13px] font-bold text-gray-500 shrink-0">Application:</span>
          <select
            value={selectedAppFilter}
            onChange={(e) => setSelectedAppFilter(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-[13.5px] font-medium bg-gray-50/70 focus:outline-hidden"
          >
            <option value="all">All Applications ({features.length})</option>
            {apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <HugeiconsIcon
            icon={Search01Icon}
            className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feature key or name..."
            className="w-full pl-9 pr-3.5 py-2 text-[13.5px] rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-900 bg-gray-50/50"
          />
        </div>
      </div>

      {/* Features Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm animate-pulse">
            Loading feature catalog...
          </div>
        ) : filteredFeatures.length === 0 ? (
          <div className="p-16 text-center text-gray-400 space-y-2">
            <HugeiconsIcon icon={Layers01Icon} className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-[14px] font-medium text-gray-600">No features found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="bg-gray-50/80 text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200/80">
                  <th className="py-3.5 px-6 font-semibold">Feature Key</th>
                  <th className="py-3.5 px-4 font-semibold">Display Name</th>
                  <th className="py-3.5 px-4 font-semibold">Application</th>
                  <th className="py-3.5 px-4 font-semibold">Value Type</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFeatures.map((feat) => (
                  <tr key={feat.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6 font-mono text-[13px] font-bold text-gray-900">
                      {feat.feature_key}
                    </td>

                    <td className="py-4 px-4 font-medium text-gray-800">
                      {feat.name}
                    </td>

                    <td className="py-4 px-4 text-gray-600 font-medium">
                      {feat.appName}
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                        feat.value_type === "BOOLEAN"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : feat.value_type === "NUMBER"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : feat.value_type === "JSON"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                      }`}>
                        {feat.value_type}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {feat.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditFeatureModal(feat)}
                          title="Edit Feature"
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <HugeiconsIcon icon={Edit01Icon} className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFeature(feat)}
                          title="Delete Feature"
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

      {/* Feature Form Modal */}
      {isModalOpen && editingFeature && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full p-6 md:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                {editingFeature.id ? `Edit: ${editingFeature.name}` : "Register Feature in Catalog"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700">
                <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-[13px] border border-red-200">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveFeature} className="space-y-4 mt-5">
              <div>
                <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Target Application *</label>
                <select
                  value={editingFeature.app_id || ""}
                  onChange={(e) => setEditingFeature({ ...editingFeature, app_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden bg-white"
                >
                  {apps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Feature Key * (lowercase dot-notation)</label>
                <input
                  type="text"
                  required
                  value={editingFeature.feature_key || ""}
                  onChange={(e) => setEditingFeature({ ...editingFeature, feature_key: e.target.value })}
                  placeholder="e.g. employees.max, payroll.cpf, gps.attendance"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Display Name *</label>
                <input
                  type="text"
                  required
                  value={editingFeature.name || ""}
                  onChange={(e) => setEditingFeature({ ...editingFeature, name: e.target.value })}
                  placeholder="e.g. Maximum Employee Limit"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Value Type</label>
                  <select
                    value={editingFeature.value_type || "BOOLEAN"}
                    onChange={(e) => setEditingFeature({ ...editingFeature, value_type: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden bg-white"
                  >
                    <option value="BOOLEAN">BOOLEAN</option>
                    <option value="NUMBER">NUMBER</option>
                    <option value="STRING">STRING</option>
                    <option value="JSON">JSON</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingFeature.category || "Core"}
                    onChange={(e) => setEditingFeature({ ...editingFeature, category: e.target.value })}
                    placeholder="Core / Add-On"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingFeature.description || ""}
                  onChange={(e) => setEditingFeature({ ...editingFeature, description: e.target.value })}
                  placeholder="Technical entitlement description for this feature..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden"
                />
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
                  {isSubmitting ? "Saving..." : "Save Feature"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

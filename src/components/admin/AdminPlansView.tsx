"use client";

import React, { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CreditCardIcon,
  PlusSignIcon,
  Search01Icon,
  Edit01Icon,
  Delete01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Store01Icon,
  Layers01Icon
} from "@hugeicons/core-free-icons";

interface PlanFeatureItem {
  id?: string;
  featureId: string;
  featureKey: string;
  name: string;
  valueType: string;
  enabled: boolean;
  limits?: any;
}

interface PlanItem {
  id: string;
  app_id: string;
  appName: string;
  appSlug: string;
  appLogo?: string;
  plan_code: string;
  name: string;
  description?: string;
  price: number;
  yearly_price?: number | null;
  currency: string;
  billing_interval: string;
  trial_days: number;
  status: string;
  popular?: boolean;
  features: PlanFeatureItem[];
  created_at: string;
}

interface FeatureCatalogItem {
  id: string;
  app_id: string;
  feature_key: string;
  name: string;
  value_type: string;
}

interface AppOption {
  id: string;
  name: string;
  slug: string;
}

export function AdminPlansView() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [apps, setApps] = useState<AppOption[]>([]);
  const [featuresCatalog, setFeaturesCatalog] = useState<FeatureCatalogItem[]>([]);
  const [selectedAppFilter, setSelectedAppFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<PlanItem> | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<Map<string, { enabled: boolean; limits: any }>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchPlansAndCatalog = async () => {
    try {
      setLoading(true);
      const [plansRes, appsRes, featRes] = await Promise.all([
        fetch("/api/admin/plans", { cache: "no-store" }),
        fetch("/api/admin/apps", { cache: "no-store" }),
        fetch("/api/admin/features", { cache: "no-store" }),
      ]);

      if (plansRes.ok) {
        const pData = await plansRes.json();
        setPlans(pData.plans || []);
      }
      if (appsRes.ok) {
        const aData = await appsRes.json();
        setApps(aData.apps || []);
      }
      if (featRes.ok) {
        const fData = await featRes.json();
        setFeaturesCatalog(fData.features || []);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlansAndCatalog();
  }, []);

  const openNewPlanModal = () => {
    const defaultAppId = apps[0]?.id || "";
    setEditingPlan({
      app_id: defaultAppId,
      plan_code: "",
      name: "",
      description: "",
      price: 0,
      yearly_price: 0,
      currency: "SGD",
      billing_interval: "monthly",
      trial_days: 0,
      status: "active",
      popular: false,
    });
    setSelectedFeatures(new Map());
    setIsModalOpen(true);
  };

  const openEditPlanModal = (plan: PlanItem) => {
    setEditingPlan(plan);
    const map = new Map();
    for (const f of plan.features || []) {
      map.set(f.featureId, { enabled: f.enabled, limits: f.limits || {} });
    }
    setSelectedFeatures(map);
    setIsModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !editingPlan.app_id || !editingPlan.plan_code || !editingPlan.name) {
      setErrorMessage("Please fill all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const featuresPayload = Array.from(selectedFeatures.entries()).map(([feature_id, val]) => ({
        feature_id,
        enabled: val.enabled,
        limits: val.limits,
      }));

      const payload = {
        ...editingPlan,
        features: featuresPayload,
      };

      const isNew = !editingPlan.id;
      const url = isNew ? "/api/admin/plans" : `/api/admin/plans/${editingPlan.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to save plan");
      }

      setSuccessToast(isNew ? "Plan created successfully." : "Plan updated.");
      setTimeout(() => setSuccessToast(null), 4000);
      setIsModalOpen(false);
      setEditingPlan(null);
      await fetchPlansAndCatalog();
    } catch (err: any) {
      setErrorMessage(err.message || "Error saving plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (plan: PlanItem) => {
    if (!confirm(`Are you sure you want to delete or archive plan "${plan.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      setSuccessToast("Plan removed / archived.");
      setTimeout(() => setSuccessToast(null), 3000);
      await fetchPlansAndCatalog();
    } catch (err: any) {
      alert(err.message || "Failed to delete plan");
    }
  };

  const filteredPlans = plans.filter((p) => {
    const matchesApp = selectedAppFilter === "all" || p.app_id === selectedAppFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.plan_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.appName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesApp && matchesSearch;
  });

  const availableFeaturesForSelectedApp = featuresCatalog.filter(
    (f) => !editingPlan?.app_id || f.app_id === editingPlan.app_id
  );

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
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Subscription Plan Management</h2>
          <p className="text-[13.5px] text-gray-500 mt-0.5">
            Create pricing tiers, monthly/annual rates, trial allowances, and feature usage limits
          </p>
        </div>

        <button
          onClick={openNewPlanModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-[13.5px] font-semibold transition-all shadow-2xs cursor-pointer"
        >
          <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
          <span>New Subscription Plan</span>
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
            <option value="all">All Applications ({plans.length})</option>
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
            placeholder="Search plans or codes..."
            className="w-full pl-9 pr-3.5 py-2 text-[13.5px] rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-900 bg-gray-50/50"
          />
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm animate-pulse">
            Loading subscription plans...
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="p-16 text-center text-gray-400 space-y-2">
            <HugeiconsIcon icon={CreditCardIcon} className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-[14px] font-medium text-gray-600">No subscription plans found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="bg-gray-50/80 text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200/80">
                  <th className="py-3.5 px-6 font-semibold">Plan Details</th>
                  <th className="py-3.5 px-4 font-semibold">Application</th>
                  <th className="py-3.5 px-4 font-semibold">Monthly Price</th>
                  <th className="py-3.5 px-4 font-semibold">Annual Price</th>
                  <th className="py-3.5 px-4 font-semibold">Trial</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0061FF] shrink-0 font-bold text-xs">
                          {plan.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 leading-snug flex items-center gap-2">
                            <span>{plan.name}</span>
                            {plan.popular && (
                              <span className="px-2 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 text-[10.5px] font-bold rounded-md">
                                Popular
                              </span>
                            )}
                          </div>
                          <div className="text-[12px] text-gray-400 font-mono">{plan.plan_code}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-gray-700 font-medium">
                      {plan.appName}
                    </td>

                    <td className="py-4 px-4 font-bold text-gray-900">
                      {plan.currency} ${plan.price}
                      <span className="text-[11px] text-gray-400 font-normal">/mo</span>
                    </td>

                    <td className="py-4 px-4 font-medium text-gray-700">
                      {plan.yearly_price ? `${plan.currency} $${plan.yearly_price}/yr` : "—"}
                    </td>

                    <td className="py-4 px-4 text-gray-600">
                      {plan.trial_days > 0 ? `${plan.trial_days} days` : "No Trial"}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          plan.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {plan.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditPlanModal(plan)}
                          title="Edit Plan"
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <HugeiconsIcon icon={Edit01Icon} className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan)}
                          title="Delete / Archive"
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

      {/* Plan Form Modal */}
      {isModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                {editingPlan.id ? `Edit Plan: ${editingPlan.name}` : "Create Subscription Plan"}
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

            <form onSubmit={handleSavePlan} className="space-y-4 mt-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Target Application *</label>
                  <select
                    value={editingPlan.app_id || ""}
                    onChange={(e) => setEditingPlan({ ...editingPlan, app_id: e.target.value })}
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
                  <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Plan Code Identifier *</label>
                  <input
                    type="text"
                    required
                    value={editingPlan.plan_code || ""}
                    onChange={(e) => setEditingPlan({ ...editingPlan, plan_code: e.target.value })}
                    placeholder="e.g. starter, business, enterprise"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Plan Display Name *</label>
                <input
                  type="text"
                  required
                  value={editingPlan.name || ""}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  placeholder="e.g. Starter Plan, Professional Tier"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Monthly Price (SGD) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={editingPlan.price ?? 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Yearly Price (SGD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingPlan.yearly_price ?? ""}
                    onChange={(e) => setEditingPlan({ ...editingPlan, yearly_price: e.target.value ? Number(e.target.value) : null })}
                    placeholder="Optional yearly rate"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-gray-700 mb-1">Trial Period (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingPlan.trial_days ?? 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, trial_days: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Feature Catalog Inclusion Selector */}
              <div className="pt-3 border-t border-gray-100">
                <label className="block text-[13px] font-bold text-gray-900 mb-2">
                  Feature Attachments & Entitlement Limits
                </label>
                {availableFeaturesForSelectedApp.length === 0 ? (
                  <div className="p-4 rounded-xl bg-gray-50 text-gray-500 text-[13px] border border-gray-200">
                    No features registered in catalog for this app yet. You can register them in the Features tab.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3">
                    {availableFeaturesForSelectedApp.map((feat) => {
                      const isChecked = selectedFeatures.has(feat.id);
                      return (
                        <div key={feat.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const newMap = new Map(selectedFeatures);
                                if (e.target.checked) {
                                  newMap.set(feat.id, { enabled: true, limits: {} });
                                } else {
                                  newMap.delete(feat.id);
                                }
                                setSelectedFeatures(newMap);
                              }}
                              className="rounded-md border-gray-300 text-gray-900 focus:ring-0"
                            />
                            <div>
                              <span className="text-[13.5px] font-bold text-gray-900">{feat.name}</span>
                              <span className="text-[11.5px] text-gray-400 ml-2 font-mono">{feat.feature_key}</span>
                            </div>
                          </label>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 font-bold text-gray-600">
                            {feat.value_type}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                  {isSubmitting ? "Saving..." : "Save Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  HierarchySquare02Icon,
  Search01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Store01Icon,
  CreditCardIcon,
  UserMultiple02Icon,
  Calendar03Icon
} from "@hugeicons/core-free-icons";

interface SubscriptionItem {
  id: string;
  companyId: string;
  companyName: string;
  customerEmail: string;
  appId: string;
  appName: string;
  appSlug: string;
  appLogo?: string;
  planId: string;
  planName: string;
  price: number;
  currency: string;
  billingInterval: string;
  status: string;
  stripeSubscriptionId?: string;
  startsAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  cancelledAt?: string;
  createdAt: string;
}

export function AdminSubscriptionsView() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSub, setSelectedSub] = useState<SubscriptionItem | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/admin/subscriptions", window.location.origin);
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
      if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());

      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load subscriptions");
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubscriptions();
  };

  const handleUpdateStatus = async (subId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/subscriptions/${subId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Update failed");
      }

      setSuccessToast(`Subscription status updated to ${newStatus.toUpperCase()}`);
      setTimeout(() => setSuccessToast(null), 3000);
      setIsActionModalOpen(false);
      setSelectedSub(null);
      await fetchSubscriptions();
    } catch (err: any) {
      alert(err.message || "Failed to update subscription");
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
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Organization Subscriptions</h2>
          <p className="text-[13.5px] text-gray-500 mt-0.5">
            Real-time subscriber records, renewal dates, payment terms, and lifecycle states
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          {[
            { id: "all", label: "All" },
            { id: "active", label: "Active" },
            { id: "trialing", label: "Trialing" },
            { id: "past_due", label: "Past Due" },
            { id: "cancelled", label: "Cancelled" },
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

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <HugeiconsIcon
            icon={Search01Icon}
            className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer, app, plan..."
            className="w-full pl-9 pr-3.5 py-2 text-[13.5px] rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-900 bg-gray-50/50"
          />
        </form>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm animate-pulse">
            Loading subscriptions...
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-16 text-center text-gray-400 space-y-2">
            <HugeiconsIcon icon={HierarchySquare02Icon} className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-[14px] font-medium text-gray-600">No subscriptions matched the query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="bg-gray-50/80 text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200/80">
                  <th className="py-3.5 px-6 font-semibold">Customer / Org</th>
                  <th className="py-3.5 px-4 font-semibold">Application</th>
                  <th className="py-3.5 px-4 font-semibold">Plan Tier</th>
                  <th className="py-3.5 px-4 font-semibold">Billing Rate</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Renewal Date</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900 leading-snug">{sub.companyName}</div>
                      <div className="text-[12px] text-gray-400">{sub.customerEmail}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-800">{sub.appName}</div>
                      <div className="text-[11.5px] text-gray-400 font-mono">/{sub.appSlug}</div>
                    </td>

                    <td className="py-4 px-4 font-medium text-gray-700">
                      {sub.planName}
                    </td>

                    <td className="py-4 px-4 font-bold text-gray-900">
                      {sub.currency} ${sub.price}
                      <span className="text-[11px] text-gray-400 font-normal">/{sub.billingInterval}</span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          sub.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : sub.status === "trialing"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : sub.status === "past_due"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {sub.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-gray-600 text-[12.5px]">
                      {sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-SG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setIsActionModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-[12.5px] font-semibold transition-colors cursor-pointer"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subscription Action Modal */}
      {isActionModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-md w-full p-6 md:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Manage Subscription</h3>
              <button onClick={() => setIsActionModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700">
                <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-[13.5px]">
              <div>
                <span className="text-gray-500 text-xs">Customer Organization:</span>
                <div className="font-bold text-gray-900">{selectedSub.companyName}</div>
              </div>

              <div>
                <span className="text-gray-500 text-xs">Application & Plan:</span>
                <div className="font-semibold text-gray-800">
                  {selectedSub.appName} • {selectedSub.planName} ({selectedSub.currency} ${selectedSub.price}/{selectedSub.billingInterval})
                </div>
              </div>

              <div>
                <span className="text-gray-500 text-xs">Current Lifecycle Status:</span>
                <div className="font-bold text-gray-900 uppercase mt-0.5">{selectedSub.status}</div>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-2">
                <label className="block text-[12.5px] font-bold text-gray-700">Change Status To:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedSub.id, "active")}
                    className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Set Active
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedSub.id, "paused")}
                    className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Pause Subscription
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedSub.id, "past_due")}
                    className="px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Mark Past Due
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedSub.id, "cancelled")}
                    className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel Subscription
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsActionModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-[13px] font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

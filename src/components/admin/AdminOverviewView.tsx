"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Store01Icon,
  UserMultiple02Icon,
  HierarchySquare02Icon,
  Wallet02Icon,
  Shield01Icon,
  ArrowRight01Icon,
  PlusSignIcon,
  Layers01Icon,
  CreditCardIcon,
  AlertCircleIcon
} from "@hugeicons/core-free-icons";

interface MetricsData {
  totalApps: number;
  publishedApps: number;
  draftApps: number;
  totalCustomers: number;
  activeSubscriptions: number;
  mrr: number;
  failedPayments: number;
}

interface RecentSubscription {
  id: string;
  status: string;
  createdAt: string;
  companyName: string;
  appName: string;
  appSlug: string;
  planName: string;
  price: number;
  currency: string;
  billingInterval: string;
}

interface AuditLogItem {
  id: string;
  actor_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  created_at: string;
}

export function AdminOverviewView() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [recentSubscriptions, setRecentSubscriptions] = useState<RecentSubscription[]>([]);
  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOverview() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/overview", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load admin overview metrics");
        }
        const data = await res.json();
        setMetrics(data.metrics);
        setRecentSubscriptions(data.recentSubscriptions || []);
        setRecentAuditLogs(data.recentAuditLogs || []);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* KPI Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-gray-200/80 p-6" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-white rounded-2xl border border-gray-200/80 p-6" />
          <div className="h-96 bg-white rounded-2xl border border-gray-200/80 p-6" />
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-lg mx-auto">
        <HugeiconsIcon icon={AlertCircleIcon} className="w-8 h-8 text-red-600 mx-auto mb-2" />
        <h3 className="text-base font-bold text-red-900">Failed to Load Overview</h3>
        <p className="text-sm text-red-700 mt-1">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Monthly Recurring Revenue */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-gray-500">Monthly Recurring Rev</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0061FF]">
              <HugeiconsIcon icon={Wallet02Icon} className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-gray-900 tracking-tight">
              S${metrics.mrr.toLocaleString()}
            </div>
            <span className="text-[12px] font-semibold text-emerald-600 mt-1 inline-block">
              Live subscription run-rate
            </span>
          </div>
        </div>

        {/* Metric 2: Active Subscriptions */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-gray-500">Active Subscriptions</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <HugeiconsIcon icon={HierarchySquare02Icon} className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-gray-900 tracking-tight">
              {metrics.activeSubscriptions}
            </div>
            <span className="text-[12px] font-medium text-gray-500 mt-1 inline-block">
              Across all platform apps
            </span>
          </div>
        </div>

        {/* Metric 3: Total Customers */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-gray-500">Customer Accounts</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <HugeiconsIcon icon={UserMultiple02Icon} className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-gray-900 tracking-tight">
              {metrics.totalCustomers}
            </div>
            <span className="text-[12px] font-medium text-gray-500 mt-1 inline-block">
              Registered organizations
            </span>
          </div>
        </div>

        {/* Metric 4: Marketplace Apps */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-gray-500">Marketplace Apps</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <HugeiconsIcon icon={Store01Icon} className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-gray-900 tracking-tight">
              {metrics.totalApps}
            </div>
            <span className="text-[12px] font-medium text-gray-500 mt-1 inline-block">
              {metrics.publishedApps} published • {metrics.draftApps} draft
            </span>
          </div>
        </div>
      </div>

      {/* 2. Quick Actions Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-gray-900">Governance Quick Actions</h3>
          <p className="text-[13px] text-gray-500">Fast shortcuts for common product catalog and pricing adjustments</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/admin/apps"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-[13px] font-semibold transition-all shadow-2xs"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
            <span>Create App</span>
          </Link>
          <Link
            href="/dashboard/admin/plans"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-[13px] font-semibold transition-all shadow-2xs"
          >
            <HugeiconsIcon icon={CreditCardIcon} className="w-4 h-4 text-gray-500" />
            <span>New Plan</span>
          </Link>
          <Link
            href="/dashboard/admin/features"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-[13px] font-semibold transition-all shadow-2xs"
          >
            <HugeiconsIcon icon={Layers01Icon} className="w-4 h-4 text-gray-500" />
            <span>Add Feature</span>
          </Link>
        </div>
      </div>

      {/* 3. Main Data Sections: Recent Subscriptions & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Recent Subscriptions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-[16px] font-bold text-gray-900">Recent Subscription Activity</h3>
                <p className="text-[13px] text-gray-500">Live signups and renewals across organizations</p>
              </div>
              <Link
                href="/dashboard/admin/subscriptions"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0061FF] hover:underline"
              >
                <span>View All</span>
                <HugeiconsIcon icon={ArrowRight01Icon} className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentSubscriptions.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                No subscription activity recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13.5px]">
                  <thead>
                    <tr className="text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="pb-3 font-semibold">Customer / Org</th>
                      <th className="pb-3 font-semibold">Application</th>
                      <th className="pb-3 font-semibold">Plan Tier</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentSubscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 font-medium text-gray-900">
                          {sub.companyName}
                        </td>
                        <td className="py-3.5 text-gray-600 font-medium">
                          {sub.appName}
                        </td>
                        <td className="py-3.5 text-gray-500">
                          {sub.planName}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              sub.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : sub.status === "trialing"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {sub.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 font-bold text-gray-900 text-right">
                          {sub.currency} ${sub.price}
                          <span className="text-[11px] text-gray-400 font-normal">/{sub.billingInterval}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Audit Logs */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-[16px] font-bold text-gray-900">Admin Audit Feed</h3>
                <p className="text-[13px] text-gray-500">Immutable admin actions</p>
              </div>
              <Link
                href="/dashboard/admin/audit-logs"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0061FF] hover:underline"
              >
                <span>Logs</span>
                <HugeiconsIcon icon={ArrowRight01Icon} className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentAuditLogs.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                No recent administrative actions.
              </div>
            ) : (
              <div className="space-y-3.5">
                {recentAuditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-gray-50/70 border border-gray-100 text-[12.5px] space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-gray-900 px-1.5 py-0.5 rounded-md bg-white border border-gray-200 text-[11px]">
                        {log.action}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-gray-600 truncate">
                      <strong className="text-gray-900">{log.resource_type}</strong> • {log.actor_email}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

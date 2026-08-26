"use client";

import React, { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Shield01Icon,
  Search01Icon,
  EyeIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon
} from "@hugeicons/core-free-icons";

interface AuditLogItem {
  id: string;
  admin_user_id?: string;
  auth_user_id?: string;
  actor_email: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  previous_value?: any;
  new_value?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export function AdminAuditLogsView() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resourceFilter, setResourceFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLogForDiff, setSelectedLogForDiff] = useState<AuditLogItem | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        const url = new URL("/api/admin/audit-logs", window.location.origin);
        if (resourceFilter !== "all") url.searchParams.set("resource_type", resourceFilter);

        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load audit logs");
        const data = await res.json();
        setLogs(data.logs || []);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [resourceFilter]);

  const filteredLogs = logs.filter((l) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      l.action.toLowerCase().includes(q) ||
      l.actor_email.toLowerCase().includes(q) ||
      l.resource_type.toLowerCase().includes(q) ||
      (l.resource_id && l.resource_id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Administrative Audit Logs</h2>
          <p className="text-[13.5px] text-gray-500 mt-0.5">
            Immutable tracking of all platform configurations, price alterations, and security operations
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Resource Type Filter Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          {[
            { id: "all", label: "All Resources" },
            { id: "app", label: "Apps" },
            { id: "plan", label: "Plans" },
            { id: "feature", label: "Features" },
            { id: "subscription", label: "Subscriptions" },
            { id: "admin_user", label: "Admin Access" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setResourceFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                resourceFilter === tab.id
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
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
            placeholder="Search action or email..."
            className="w-full pl-9 pr-3.5 py-2 text-[13.5px] rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-900 bg-gray-50/50"
          />
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm animate-pulse">
            Loading administrative audit logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-gray-400 space-y-2">
            <HugeiconsIcon icon={Shield01Icon} className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-[14px] font-medium text-gray-600">No audit records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="bg-gray-50/80 text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200/80">
                  <th className="py-3.5 px-6 font-semibold">Action</th>
                  <th className="py-3.5 px-4 font-semibold">Resource</th>
                  <th className="py-3.5 px-4 font-semibold">Administrator</th>
                  <th className="py-3.5 px-4 font-semibold">Diff / Changes</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-gray-900 text-white font-mono">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-medium text-gray-800 capitalize">
                      {log.resource_type}
                      {log.resource_id && (
                        <div className="text-[11px] text-gray-400 font-mono truncate max-w-[120px]">
                          {log.resource_id}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 text-gray-700">
                      <div className="font-semibold text-gray-900">{log.actor_email || "System"}</div>
                    </td>

                    <td className="py-4 px-4">
                      <button
                        onClick={() => setSelectedLogForDiff(log)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-[12px] font-semibold transition-colors cursor-pointer"
                      >
                        <HugeiconsIcon icon={EyeIcon} className="w-3.5 h-3.5" />
                        <span>Inspect Payload</span>
                      </button>
                    </td>

                    <td className="py-4 px-6 text-right text-gray-500 text-[12px]">
                      {new Date(log.created_at).toLocaleString("en-SG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Diff / Payload Modal */}
      {selectedLogForDiff && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Audit Event Details</h3>
                <span className="text-xs text-gray-500 font-mono">{selectedLogForDiff.id}</span>
              </div>
              <button onClick={() => setSelectedLogForDiff(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700">
                <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-5 text-[13px]">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl">
                <div>
                  <span className="text-gray-500 text-xs">Action:</span>
                  <div className="font-bold text-gray-900">{selectedLogForDiff.action}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Actor:</span>
                  <div className="font-bold text-gray-900">{selectedLogForDiff.actor_email}</div>
                </div>
              </div>

              {selectedLogForDiff.previous_value && Object.keys(selectedLogForDiff.previous_value).length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Previous Snapshot:</label>
                  <pre className="bg-gray-950 text-emerald-400 p-3 rounded-xl text-xs overflow-x-auto font-mono">
                    {JSON.stringify(selectedLogForDiff.previous_value, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLogForDiff.new_value && Object.keys(selectedLogForDiff.new_value).length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">New Snapshot:</label>
                  <pre className="bg-gray-950 text-blue-400 p-3 rounded-xl text-xs overflow-x-auto font-mono">
                    {JSON.stringify(selectedLogForDiff.new_value, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedLogForDiff(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white text-[13px] font-semibold"
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

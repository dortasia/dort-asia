"use client";

import React, { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultiple02Icon,
  Search01Icon,
  Store01Icon,
  Building03Icon,
  HierarchySquare02Icon
} from "@hugeicons/core-free-icons";

interface CustomerItem {
  id: string;
  companyName: string;
  countryCode: string;
  timezone: string;
  status: string;
  createdAt: string;
  ownerEmail: string;
  ownerName: string;
  ownerPhoto?: string | null;
  accountStatus: string;
  totalSubscriptions: number;
  activeSubscriptions: number;
}

export function AdminCustomersView() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/customers", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load customers");
        const data = await res.json();
        setCustomers(data.customers || []);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Customer Organizations</h2>
          <p className="text-[13.5px] text-gray-500 mt-0.5">
            Registered corporate tenants, account ownership, and platform app adoption
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <HugeiconsIcon
            icon={Search01Icon}
            className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company or email..."
            className="w-full pl-9 pr-3.5 py-2 text-[13.5px] rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-900 bg-gray-50/50"
          />
        </div>

        <div className="text-[13px] font-bold text-gray-500">
          Total Organizations: <span className="text-gray-900">{customers.length}</span>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm animate-pulse">
            Loading customers directory...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-16 text-center text-gray-400 space-y-2">
            <HugeiconsIcon icon={Building03Icon} className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-[14px] font-medium text-gray-600">No organizations found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="bg-gray-50/80 text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200/80">
                  <th className="py-3.5 px-6 font-semibold">Company / Organization</th>
                  <th className="py-3.5 px-4 font-semibold">Account Owner</th>
                  <th className="py-3.5 px-4 font-semibold">Country</th>
                  <th className="py-3.5 px-4 font-semibold">Active Subscriptions</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700 text-xs shrink-0">
                          {cust.companyName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 leading-snug">{cust.companyName}</div>
                          <div className="text-[11.5px] text-gray-400 font-mono">{cust.timezone}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-800">{cust.ownerName}</div>
                      <div className="text-[12px] text-gray-400">{cust.ownerEmail}</div>
                    </td>

                    <td className="py-4 px-4 font-bold text-gray-700">
                      {cust.countryCode}
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-bold text-gray-900">{cust.activeSubscriptions}</span>
                      <span className="text-gray-400 text-xs ml-1">({cust.totalSubscriptions} total)</span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {cust.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right text-gray-500 text-[12.5px]">
                      {new Date(cust.createdAt).toLocaleDateString("en-SG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

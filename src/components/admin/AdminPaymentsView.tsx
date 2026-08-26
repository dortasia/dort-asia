"use client";

import React, { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Invoice01Icon,
  Search01Icon,
  CreditCardIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  ArrowRight01Icon,
  Link01Icon
} from "@hugeicons/core-free-icons";

interface PaymentItem {
  id: string;
  companyId: string;
  companyName: string;
  invoiceId?: string;
  stripeInvoiceId?: string;
  invoiceUrl?: string;
  stripePaymentIntentId?: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: string;
  createdAt: string;
}

export function AdminPaymentsView() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchPayments() {
      try {
        setLoading(true);
        const url = new URL("/api/admin/payments", window.location.origin);
        if (statusFilter !== "all") url.searchParams.set("status", statusFilter);

        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load payments");
        const data = await res.json();
        setPayments(data.payments || []);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, [statusFilter]);

  const totalVolume = payments
    .filter((p) => p.status === "succeeded")
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Payments & Billing Records</h2>
          <p className="text-[13.5px] text-gray-500 mt-0.5">
            Audit logs of Stripe payment intents, settlement statuses, and customer tax invoices
          </p>
        </div>

        <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-2xs text-right">
          <span className="text-[12px] text-gray-500 font-medium">Settled Volume (Filtered)</span>
          <div className="text-xl font-bold text-gray-900">S${totalVolume.toLocaleString()}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "all", label: "All Payments" },
            { id: "succeeded", label: "Succeeded" },
            { id: "pending", label: "Pending" },
            { id: "failed", label: "Failed" },
            { id: "refunded", label: "Refunded" },
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
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm animate-pulse">
            Loading billing transactions...
          </div>
        ) : payments.length === 0 ? (
          <div className="p-16 text-center text-gray-400 space-y-2">
            <HugeiconsIcon icon={Invoice01Icon} className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-[14px] font-medium text-gray-600">No payment transactions recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="bg-gray-50/80 text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200/80">
                  <th className="py-3.5 px-6 font-semibold">Organization</th>
                  <th className="py-3.5 px-4 font-semibold">Payment Intent ID</th>
                  <th className="py-3.5 px-4 font-semibold">Amount</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Invoice</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900">
                      {p.companyName}
                    </td>

                    <td className="py-4 px-4 font-mono text-[12px] text-gray-500">
                      {p.stripePaymentIntentId || "Direct Billing"}
                    </td>

                    <td className="py-4 px-4 font-bold text-gray-900">
                      {p.currency} ${p.amount.toFixed(2)}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          p.status === "succeeded"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : p.status === "pending"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : p.status === "failed"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {p.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {p.invoiceUrl ? (
                        <a
                          href={p.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#0061FF] hover:underline"
                        >
                          <span>PDF</span>
                          <HugeiconsIcon icon={Link01Icon} className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">Standard</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right text-gray-500 text-[12.5px]">
                      {new Date(p.createdAt).toLocaleString("en-SG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
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

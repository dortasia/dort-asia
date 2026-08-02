"use client";

import React, { useState } from "react";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Paperclip, Calendar, User, Briefcase, Landmark } from "lucide-react";
import "./finance.css";

const TABS = [
  "Recent Transactions",
  "Credit Pending",
  "Tax Payments",
  "Salary Payments",
  "Other Payments",
  "Share Splits"
];

interface FinanceRow4Props {
  transactions?: any[];
  companyName?: string;
}

export default function FinanceRow4({ transactions = [], companyName }: FinanceRow4Props) {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  const getPaymentId = (tx: any) => {
    if (tx.id && /^[A-Z]{3}-\d{14}-[A-Z0-9]{6}-[A-Z0-9]+$/.test(tx.id)) {
      return tx.id;
    }
    
    // Type classification
    let typePrefix = "SND";
    const tType = String(tx.type || tx.rawTx?.type || "").toLowerCase();
    const cat = (tx.rawTx?.category || tx.category || "").toLowerCase();
    const desc = (tx.descMain || tx.description || "").toLowerCase();
    
    if (tType === "received" || tType === "credit" || tType === "receive" || tType === "incoming" || tx.type === "Credit") {
      typePrefix = "RCV";
    } else if (tType === "cycle" || tType === "cycle-pay" || tType === "recurring" || cat === "cycle-pay" || desc.includes("cycle")) {
      typePrefix = "CYC";
    } else {
      typePrefix = "SND";
    }
    
    // Date parsing
    let yearStr = "2026";
    let monthStr = "05";
    let dayStr = "31";
    try {
      const dateStr = tx.date || (tx.createdAt ? new Date(tx.createdAt).toISOString() : "");
      if (dateStr.includes("-") && dateStr.split("-").length === 3) {
        const parts = dateStr.split("-");
        if (parts[2].length === 4) {
          yearStr = parts[2];
          monthStr = parts[1];
          dayStr = parts[0];
        } else {
          yearStr = parts[0];
          monthStr = parts[1];
          dayStr = parts[2];
        }
      } else {
        const parts = dateStr.split(" ");
        const mStr = parts[1];
        const y = parts[2]?.split(",")[0];
        const d = parts[0];
        const monthMap: { [key: string]: string } = {
          Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
          Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
        };
        if (y) yearStr = y;
        if (mStr && monthMap[mStr]) monthStr = monthMap[mStr];
        if (d) dayStr = String(d).padStart(2, '0');
      }
    } catch (e) {}
    
    // Time parsing
    let timeStr = "120000";
    try {
      if (tx.time) {
        timeStr = tx.time.replace(/:/g, "").replace(/\s*[AP]M/gi, "").slice(0, 6).padEnd(6, '0');
      } else if (tx.createdAt) {
        const tPart = new Date(tx.createdAt).toISOString().split("T")[1];
        if (tPart) {
          timeStr = tPart.replace(/:/g, "").slice(0, 6);
        }
      }
    } catch (e) {}
    
    const timestamp = `${yearStr}${monthStr}${dayStr}${timeStr}`;
    
    // 6 Alphanumeric character derivation
    let randomPart = "A7K9X2";
    try {
      const rawId = String(tx.id || "179832");
      const alphanumeric = rawId.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      if (alphanumeric.length >= 6) {
        randomPart = alphanumeric.slice(-6);
      } else {
        randomPart = (alphanumeric + "A7K9X2").slice(0, 6);
      }
    } catch (e) {}
    
    // Company initials
    let companyInitials = "CMP";
    if (companyName && companyName.trim()) {
      const words = companyName.trim().split(/\s+/);
      const initials = words
        .map(w => w.charAt(0).toUpperCase())
        .join("")
        .replace(/[^A-Z0-9]/g, "");
      if (initials.length > 0) {
        companyInitials = initials;
      }
    }
    
    return `${typePrefix}-${timestamp}-${randomPart}-${companyInitials}`;
  };

  // Filter transactions based on tab
  const getFilteredTransactions = () => {
    switch (activeTab) {
      case "Recent Transactions":
        return transactions;
      case "Credit Pending":
        return []; // placeholder
      case "Tax Payments":
        return transactions.filter(t => 
          (t.description || "").toLowerCase().includes("tax") || 
          t.category === "tax-payments" ||
          t.category === "tax-payment"
        );
      case "Salary Payments":
        return transactions.filter(t => 
          t.category === "employee-expenses" || 
          t.category === "employee-expense" || 
          t.category === "payroll-payment" || 
          (t.description || "").toLowerCase().includes("salary") ||
          (t.description || "").toLowerCase().includes("payroll")
        );
      case "Other Payments":
        return transactions.filter(t => 
          t.category === "common-expenses" || 
          t.category === "common-expense" || 
          t.category === "third-person" ||
          t.category === "third-party-payment" ||
          t.category === "product-purchase" ||
          t.category === "subscription" ||
          t.category === "vendor-payment" ||
          t.category === "other"
        );
      case "Share Splits":
        return []; // placeholder
      default:
        return transactions;
    }
  };

  const filtered = getFilteredTransactions();

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "employee-expense":
      case "employee-expenses": return "Employee Expense";
      case "payroll-payment": return "Payroll Payment";
      case "common-expense":
      case "common-expenses": return "Common Expense";
      case "project-expense":
      case "project-expenses": return "Project Expense";
      case "third-party-payment":
      case "third-person": return "Third Party Payment";
      case "project-income": return "Project Income";
      case "customer-payment": return "Customer Payment";
      case "refund": return "Refund";
      case "investment": return "Investment";
      case "loan-received": return "Loan Received";
      case "loan-investment": return "Loan & Investment";
      case "atm-withdrawal": return "ATM Withdrawal";
      case "cash-withdrawal": return "Cash Withdrawal";
      case "petty-cash": return "Petty Cash";
      case "bank-to-cash": return "Bank to Cash";
      case "cash-to-bank": return "Cash to Bank";
      case "bank-to-bank": return "Bank to Bank";
      case "wallet-transfer": return "Wallet Transfer";
      case "cycle-pay": return "Cycle Pay";
      case "self-payment": return "Self Payment";
      case "withdraw-amount": return "Withdraw Amount";
      default: {
        if (category && category.includes("-")) {
          return category.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
        }
        return category || "Other";
      }
    }
  };

  return (
    <div className="finance-row-4">
      <div className="finance-tabs-header">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`finance-tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      
      <div className="finance-transactions-container mt-4 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 dark:text-gray-500 font-semibold text-sm">
            No transactions available for {activeTab}
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-150 dark:border-gray-800/80">
                  <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Transaction</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Date & Bank</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Details / Description</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {filtered.map((tx: any) => {
                  const isReceived = tx.type === "received";
                  const isCycle = tx.type === "cycle";
                  
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                      {/* Column 1: Transaction Type & Icon */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isReceived 
                              ? "bg-green-50 dark:bg-green-950/30 text-green-500" 
                              : isCycle 
                                ? "bg-blue-50 dark:bg-blue-950/30 text-blue-500"
                                : "bg-red-50 dark:bg-red-950/30 text-red-500"
                          }`}>
                            {isReceived ? (
                              <ArrowDownLeft size={18} strokeWidth={2.5} />
                            ) : isCycle ? (
                              <RefreshCw size={16} strokeWidth={2.5} />
                            ) : (
                              <ArrowUpRight size={18} strokeWidth={2.5} />
                            )}
                          </div>
                          <div>
                            <div className="text-[13.5px] font-bold text-gray-900 dark:text-white leading-tight">
                              {isReceived ? "Incoming" : isCycle ? "Recurring Pay" : "Outgoing"}
                            </div>
                            <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                              ID: {getPaymentId(tx)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Date & Bank */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="text-[13px] font-semibold text-gray-850 dark:text-gray-300 flex items-center gap-1.5">
                          <Calendar size={13} className="text-gray-400" />
                          {tx.date}
                        </div>
                        <div className="text-[11px] font-bold text-[#007AFF] flex items-center gap-1 mt-0.5">
                          <Landmark size={11} />
                          {tx.bankName || "DBS Bank"}
                        </div>
                      </td>

                      {/* Column 3: Category */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-350">
                          {getCategoryLabel(tx.category)}
                        </span>
                      </td>

                      {/* Column 4: Details / Description */}
                      <td className="px-6 py-4.5 max-w-[280px]">
                        <div className="text-[13px] font-bold text-gray-900 dark:text-white truncate">
                          {tx.details ? (
                            <span className="flex items-center gap-1.5">
                              {(tx.category === "employee-expenses" || tx.category === "employee-expense" || tx.category === "payroll-payment") && <User size={13} className="text-gray-400" />}
                              {(tx.category === "project-expenses" || tx.category === "project-expense") && <Briefcase size={13} className="text-gray-400" />}
                              {tx.details.name || tx.details.code || tx.details.purpose || ""}
                            </span>
                          ) : (
                            tx.description || "N/A"
                          )}
                        </div>
                        {tx.details && (tx.details.name || tx.details.code) && tx.details.purpose && (
                          <div className="text-[11px] font-semibold text-[#007AFF] mt-0.5">
                            {tx.details.purpose}
                          </div>
                        )}
                        {tx.details && tx.description && (
                          <div className="text-[11px] font-medium text-gray-450 dark:text-gray-550 truncate mt-0.5">
                            {tx.description}
                          </div>
                        )}
                        {!tx.details && (
                          <div className="text-[11px] font-medium text-gray-450 dark:text-gray-550 truncate mt-0.5">
                            {tx.description || "Common transaction entry"}
                          </div>
                        )}
                      </td>

                      {/* Column 5: Amount */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-right">
                        <div className={`text-[14.5px] font-black ${
                          isReceived 
                            ? "text-[#34C759]" 
                            : "text-[#FF3B30]"
                        }`}>
                          {isReceived ? "+" : "-"}S$ {(tx.amount || 0).toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {isCycle && tx.repeatFrequency && (
                          <div className="text-[9.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">
                            Every {tx.repeatFrequency}
                          </div>
                        )}
                      </td>

                      {/* Column 6: Receipt Attachment Link */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-center">
                        {tx.attachmentUrl ? (
                          <a 
                            href={tx.attachmentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] transition-colors"
                            title="Open attachment"
                          >
                            <Paperclip size={14} />
                          </a>
                        ) : (
                          <span className="text-[11px] font-semibold text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

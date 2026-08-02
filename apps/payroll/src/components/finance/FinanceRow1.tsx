"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, FileText, Send, Landmark, ArrowUpRight, ArrowDownLeft, RefreshCw, X, User, Wallet } from "lucide-react";
import BankDropdown, { AVAILABLE_BANKS } from "./BankDropdown";
import { useRouter } from "next/navigation";
import "./finance.css";

interface FinanceRow1Props {
  onOpenPayment?: (type: 'send' | 'received' | 'cycle' | 'self' | 'withdraw') => void;
  selectedBank: any;
  onSelectBank: (bank: any) => void;
  banks?: any[];
  transactions?: any[];
}

export default function FinanceRow1({ onOpenPayment, selectedBank, onSelectBank, banks, transactions = [] }: FinanceRow1Props) {
  const router = useRouter();
  const [isPaymentMenuOpen, setIsPaymentMenuOpen] = useState(false);

  const totalCredits = transactions
    .filter((t: any) => t.type === 'received')
    .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

  const totalDebits = transactions
    .filter((t: any) => t.type === 'send')
    .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

  const totalCycles = transactions
    .filter((t: any) => t.type === 'cycle')
    .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

  const formatAmount = (val: number) => {
    return val.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="finance-row-1">
      {/* ─── Total Credits ─── */}
      <div className="flex-1 min-w-[240px] bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-3xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative h-[132px] flex items-center">
        <div className="flex items-center gap-3.5 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Credit.svg" alt="Total Credits" className="w-[72px] h-[72px] pointer-events-none select-none shrink-0" />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[13px] font-bold text-gray-800 dark:text-gray-200">Total Credits</span>
              <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">This month</span>
            </div>
            <span className="text-[20px] font-black text-[#34C759] mt-1.5 leading-none whitespace-nowrap">S$ {formatAmount(totalCredits)}</span>
          </div>
        </div>
        <div className="absolute bottom-4 right-5">
          <Link href="#" className="text-[#007AFF] text-[11px] font-bold hover:underline">View All</Link>
        </div>
      </div>

      {/* ─── Total Debits ─── */}
      <div className="flex-1 min-w-[240px] bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-3xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative h-[132px] flex items-center">
        <div className="flex items-center gap-3.5 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Debit.svg" alt="Total Debits" className="w-[72px] h-[72px] pointer-events-none select-none shrink-0" />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[13px] font-bold text-gray-800 dark:text-gray-200">Total Debits</span>
              <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">This month</span>
            </div>
            <span className="text-[20px] font-black text-[#FF3B30] mt-1.5 leading-none whitespace-nowrap">S$ {formatAmount(totalDebits)}</span>
          </div>
        </div>
        <div className="absolute bottom-4 right-5">
          <Link href="#" className="text-[#007AFF] text-[11px] font-bold hover:underline">View All</Link>
        </div>
      </div>

      {/* ─── Cycle Payments ─── */}
      <div className="flex-1 min-w-[240px] bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-3xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative h-[132px] flex items-center">
        <div className="flex items-center gap-3.5 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Cycle.svg" alt="Cycle Payments" className="w-[72px] h-[72px] pointer-events-none select-none shrink-0" />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[13px] font-bold text-gray-800 dark:text-gray-200">Cycle Payments</span>
              <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">This month</span>
            </div>
            <span className="text-[20px] font-black text-gray-900 dark:text-white mt-1.5 leading-none whitespace-nowrap">S$ {formatAmount(totalCycles)}</span>
          </div>
        </div>
        <div className="absolute bottom-4 right-5">
          <Link href="#" className="text-[#007AFF] text-[11px] font-bold hover:underline">View All</Link>
        </div>
      </div>

      {/* ─── Bank Action Area ─── */}
      <div className="finance-bank-action-area">
        <BankDropdown 
          selectedBank={selectedBank} 
          onSelect={onSelectBank} 
          variant="outline" 
          banks={banks}
        />
        
        <div className="finance-bank-action-buttons">
          <button className="finance-btn" onClick={() => setIsPaymentMenuOpen(true)}>
            <Send size={16} strokeWidth={2} />
            Add Payment
          </button>
          
          {selectedBank?.id === 'cash-drawer' ? (
            <button className="finance-btn" onClick={() => router.push(`/finance/manage-bank?bank=${selectedBank.id}`)}>
              <img src="/Cash_Bank_Drawer.svg" alt="Cash Drawer" className="w-4 h-4 object-contain" />
              Manage Cash Drawer
            </button>
          ) : (
            <button className="finance-btn" onClick={() => router.push(`/finance/manage-bank?bank=${selectedBank?.id || ''}`)}>
              <Landmark size={16} strokeWidth={2} />
              Manage Bank
            </button>
          )}
        </div>
      </div>

      {/* Centered Payment Options Modal */}
      {isPaymentMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsPaymentMenuOpen(false)}
          />
          <div className="relative bg-white dark:bg-[#1C1C1E] rounded-[24px] border border-gray-200 dark:border-gray-800 p-8 z-50 w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
            <button 
              className="absolute top-6 right-6 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              onClick={() => setIsPaymentMenuOpen(false)}
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-8">Select Payment Type</h3>
            <div className="flex flex-col gap-4">
              {/* Row 1: Send, Received, Cycle Pay */}
              <div className="grid grid-cols-3 gap-4">
                {/* Button 1: Send */}
                <button 
                  className="aspect-square rounded-[16px] bg-[#F8F9FA] dark:bg-[#2C2C2E] flex flex-col items-center justify-center gap-3 border border-gray-200 dark:border-gray-700 hover:border-[#007AFF] dark:hover:border-[#007AFF] hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group" 
                  onClick={() => { 
                    setIsPaymentMenuOpen(false); 
                    onOpenPayment && onOpenPayment('send'); 
                  }}
                >
                  <div className="w-12 h-12 rounded-[12px] bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-gray-800 flex items-center justify-center text-[#007AFF] group-hover:scale-110 transition-transform">
                    <ArrowUpRight size={24} strokeWidth={2.5} />
                  </div>
                  <span className="text-[14px] font-bold text-gray-700 dark:text-gray-200">Send</span>
                </button>
                
                {/* Button 2: Received */}
                <button 
                  className="aspect-square rounded-[16px] bg-[#F8F9FA] dark:bg-[#2C2C2E] flex flex-col items-center justify-center gap-3 border border-gray-200 dark:border-gray-700 hover:border-[#007AFF] dark:hover:border-[#007AFF] hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group" 
                  onClick={() => { 
                    setIsPaymentMenuOpen(false); 
                    onOpenPayment && onOpenPayment('received'); 
                  }}
                >
                  <div className="w-12 h-12 rounded-[12px] bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-gray-800 flex items-center justify-center text-[#007AFF] group-hover:scale-110 transition-transform">
                    <ArrowDownLeft size={24} strokeWidth={2.5} />
                  </div>
                  <span className="text-[14px] font-bold text-gray-700 dark:text-gray-200">Received</span>
                </button>
                
                {/* Button 3: Cycle Pay */}
                <button 
                  className="aspect-square rounded-[16px] bg-[#F8F9FA] dark:bg-[#2C2C2E] flex flex-col items-center justify-center gap-3 border border-gray-200 dark:border-gray-700 hover:border-[#007AFF] dark:hover:border-[#007AFF] hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group" 
                  onClick={() => { 
                    setIsPaymentMenuOpen(false); 
                    onOpenPayment && onOpenPayment('cycle'); 
                  }}
                >
                  <div className="w-12 h-12 rounded-[12px] bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-gray-800 flex items-center justify-center text-[#007AFF] group-hover:scale-110 transition-transform">
                    <RefreshCw size={22} strokeWidth={2.5} />
                  </div>
                  <span className="text-[14px] font-bold text-gray-700 dark:text-gray-200 text-center leading-tight">Cycle Pay</span>
                </button>
              </div>

              {/* Row 2: Self Payment, Withdraw (Centered and sized perfectly) */}
              <div className="flex justify-center gap-4">
                {/* Button 4: Self Payment */}
                <button 
                  className="w-[calc((100%-32px)/3)] aspect-square rounded-[16px] bg-[#F8F9FA] dark:bg-[#2C2C2E] flex flex-col items-center justify-center gap-3 border border-gray-200 dark:border-gray-700 hover:border-[#007AFF] dark:hover:border-[#007AFF] hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group" 
                  onClick={() => { 
                    setIsPaymentMenuOpen(false); 
                    onOpenPayment && onOpenPayment('self'); 
                  }}
                >
                  <div className="w-12 h-12 rounded-[12px] bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-gray-800 flex items-center justify-center text-[#007AFF] group-hover:scale-110 transition-transform">
                    <User size={24} strokeWidth={2.5} />
                  </div>
                  <span className="text-[13px] font-bold text-gray-700 dark:text-gray-200 text-center leading-tight">Self Payment</span>
                </button>

                {/* Button 5: Withdraw Amount */}
                <button 
                  className="w-[calc((100%-32px)/3)] aspect-square rounded-[16px] bg-[#F8F9FA] dark:bg-[#2C2C2E] flex flex-col items-center justify-center gap-3 border border-gray-200 dark:border-gray-700 hover:border-[#007AFF] dark:hover:border-[#007AFF] hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group" 
                  onClick={() => { 
                    setIsPaymentMenuOpen(false); 
                    onOpenPayment && onOpenPayment('withdraw'); 
                  }}
                >
                  <div className="w-12 h-12 rounded-[12px] bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-gray-800 flex items-center justify-center text-[#007AFF] group-hover:scale-110 transition-transform">
                    <Landmark size={24} strokeWidth={2.5} />
                  </div>
                  <span className="text-[13px] font-bold text-gray-700 dark:text-gray-200 text-center leading-tight">Withdraw</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

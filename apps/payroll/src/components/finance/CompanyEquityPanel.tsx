"use client";
import React, { useState, useEffect } from "react";
import { X, Edit3, Download } from "lucide-react";

export const COMPANY_EQUITY_HOLDERS = [
  { name: "Dinesh VC", share: 61.99, role: "Stake Holder", investment: 100000 },
  { name: "Saravanan", share: 38.01, role: "Partner", investment: 61300 },
];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
}

export default function CompanyEquityPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isClosing, setIsClosing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [shares, setShares] = useState<number[]>([]);
  const [investments, setInvestments] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setIsEditing(false);
      setShares(COMPANY_EQUITY_HOLDERS.map(h => h.share));
      setInvestments(COMPANY_EQUITY_HOLDERS.map(h => h.investment));
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  if (!isOpen && !isClosing) return null;

  const totalInvestment = investments.reduce((a, b) => a + b, 0);
  const totalShare = shares.reduce((a, b) => a + b, 0);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'} bg-black/10 dark:bg-black/30`}
        onClick={handleClose}
      />

      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-[500px] bg-white dark:bg-[#121217] shadow-[-10px_0_40px_rgba(0,0,0,0.08)] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out ${isClosing ? 'translate-x-full' : 'translate-x-0'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F2F7] dark:border-[#2C2C35]">
          <div className="flex flex-col">
            <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Company Equity</h2>
            <p className="text-[12px] text-[#8E8E93] mt-0.5">Overall Stakeholders</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (isEditing) {
                  setShares(COMPANY_EQUITY_HOLDERS.map(h => h.share));
                  setInvestments(COMPANY_EQUITY_HOLDERS.map(h => h.investment));
                }
                setIsEditing(!isEditing);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all ${isEditing ? 'bg-[#FF3B30]/10 text-[#FF3B30] hover:bg-[#FF3B30]/20' : 'bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF]/20'}`}
            >
              {isEditing ? (
                <>
                  <X size={14} />
                  Cancel
                </>
              ) : (
                <>
                  <Edit3 size={14} />
                  Edit
                </>
              )}
            </button>
            <button onClick={handleClose} className="p-2 text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C35]">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Financial Summary Strip */}
        <div className="px-6 py-4 bg-[#F9F9FB] dark:bg-[#1C1C1E] border-b border-[#F2F2F7] dark:border-[#2C2C35] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Total Investment</span>
            <span className="text-[18px] font-bold text-[#34C759]">S$ {totalInvestment.toLocaleString()}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Total Shares</span>
            <p className="text-[14px] font-bold text-gray-900 dark:text-white">{totalShare.toFixed(2)}%</p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">Shareholders</h3>
              <span className="text-[12px] font-medium text-[#8E8E93]">{COMPANY_EQUITY_HOLDERS.length} Persons</span>
            </div>
            
            <div className="flex flex-col gap-2">
              {COMPANY_EQUITY_HOLDERS.map((holder, idx) => {
                const sharePercentage = shares[idx] || 0;
                const investmentAmount = investments[idx] || 0;

                return (
                  <div key={idx} className="group bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-2xl p-4 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-[15px] font-bold shrink-0 bg-[#F2F2F7] dark:bg-[#2C2C35] text-[#8E8E93]">
                          {getInitials(holder.name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-[#1C1C1E] dark:text-white">{holder.name}</span>
                          <span className="text-[12px] font-medium text-[#8E8E93]">{holder.role}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className={`flex items-center bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-lg px-2 py-1 border transition-all ${isEditing ? 'border-[#007AFF]/30 focus-within:border-[#007AFF]' : 'border-transparent opacity-80'}`}>
                          <input 
                            type="number"
                            disabled={!isEditing}
                            value={sharePercentage}
                            onChange={(e) => {
                              const newVal = parseFloat(e.target.value) || 0;
                              const newShares = [...shares];
                              newShares[idx] = newVal;
                              setShares(newShares);
                            }}
                            className="w-12 bg-transparent text-[14px] font-bold text-[#1C1C1E] dark:text-white text-right focus:outline-none disabled:cursor-not-allowed"
                          />
                          <span className="text-[12px] font-bold text-[#8E8E93] ml-0.5">%</span>
                        </div>
                        <p className="text-[11px] font-medium text-[#8E8E93]">Ownership</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35]">
                      <span className="text-[12px] font-medium text-[#8E8E93]">Total Investment</span>
                      <div className={`flex items-center bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-lg px-3 py-1.5 border transition-all ${isEditing ? 'border-[#34C759]/30 focus-within:border-[#34C759]' : 'border-transparent opacity-80'}`}>
                        <span className="text-[12px] font-bold text-[#34C759] mr-1">S$</span>
                        <input 
                          type="text"
                          disabled={!isEditing}
                          value={investmentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          onChange={(e) => {
                            const rawVal = e.target.value.replace(/[^0-9.]/g, "");
                            const newVal = parseFloat(rawVal) || 0;
                            const newInvestments = [...investments];
                            newInvestments[idx] = newVal;
                            setInvestments(newInvestments);
                          }}
                          className="w-24 bg-transparent text-[14px] font-bold text-[#34C759] text-right focus:outline-none disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total Distribution Card */}
          <div className="mt-auto bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-gray-900 dark:text-white">Total Allocated Equity</span>
              <span className={`text-[13px] font-black ${Math.abs(totalShare - 100) < 0.01 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                {totalShare.toFixed(2)}%
              </span>
            </div>
            <div className="h-px bg-[#F2F2F7] dark:bg-[#2C2C35] w-full" />
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[#8E8E93]">Total Company Valuation Base</span>
              <span className="text-[16px] font-black text-gray-900 dark:text-white">
                S$ {totalInvestment.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-8 pt-4 border-t border-[#F2F2F7] dark:border-[#2C2C35] flex items-center justify-between gap-4">
          <button
            onClick={() => {
              alert("Exporting Equity Statement...");
              handleClose();
            }}
            className="text-[15px] font-bold text-[#8E8E93] hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            Export equity statement
          </button>
          <button
            onClick={() => {
              alert("Equity changes saved successfully!");
              setIsEditing(false);
              handleClose();
            }}
            className="flex-1 py-4 bg-[#007AFF] hover:bg-[#0062CC] transition-colors rounded-[16px] text-white text-[15px] font-bold shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}

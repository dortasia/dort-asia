"use client";
 
import React, { useState } from "react";
import { Lock, X } from "lucide-react";
import "./finance.css";
 
interface FinanceRow2Props {
  onAddBank?: () => void;
  banks?: any[];
  transactions?: any[];
}
 
export default function FinanceRow2({ onAddBank, banks, transactions = [] }: FinanceRow2Props) {
  const displayBanks = (banks || []).slice(0, 10);

  // States for Security PIN validation
  const [revealedBalances, setRevealedBalances] = useState<string[]>([]);
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState("");
  const [targetCardId, setTargetCardId] = useState<string | null>(null);

  const handleCheckBalanceClick = (id: string) => {
    setTargetCardId(id);
    setPinValue("");
    setPinError("");
    setIsPinOpen(true);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setPinValue(val);
    setPinError("");
    
    if (val.length === 4) {
      if (val === "1234") {
        if (targetCardId) {
          setRevealedBalances(prev => [...prev, targetCardId]);
        }
        setIsPinOpen(false);
        setPinValue("");
        setPinError("");
      } else {
        setPinError("Invalid PIN. Please try again.");
        setPinValue("");
      }
    }
  };
 
  // Calculate Hand Cash petty cash balance dynamically
  const getHandCashBalance = () => {
    let balance = 0.00; // Starting default base S$ 0.00
    transactions.forEach((tx: any) => {
      const amt = parseFloat(tx.amount) || 0;
      if (tx.bankId === 'cash-drawer') {
        if (tx.type === 'received') {
          balance += amt;
        } else {
          balance -= amt;
        }
      } else if (tx.type === 'withdraw' || (tx.type === 'self' && tx.category === 'bank-to-cash')) {
        balance += amt;
      } else if (tx.type === 'self' && tx.category === 'cash-to-bank') {
        balance -= amt;
      }
    });
    return balance;
  };
 
  const cashBalanceStr = getHandCashBalance().toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
 
  return (
    <div className="finance-row-2">
      <div className="finance-row-2-columns">
        
        {/* ── Left Column: Cash Drawer ── */}
        <div className="finance-cash-drawer-section">
          <h2 className="finance-section-title">Cash Drawer</h2>
          <div className="finance-bank-card-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Icons/ExtensionIcons/hand_cash_banner.svg" alt="Hand Cash" className="finance-bank-card-bg" />
            <div className="finance-bank-card-content" style={{ paddingLeft: '110px' }}>
              <span className="finance-bank-card-name text-white">Hand Cash</span>
              
              {revealedBalances.includes('cash-drawer') ? (
                <span className="text-[12px] font-bold text-gray-200 mt-0.5 animate-in fade-in duration-250">
                  S$ {cashBalanceStr}
                </span>
              ) : (
                <button
                  onClick={() => handleCheckBalanceClick('cash-drawer')}
                  className="text-[11px] font-black text-white/90 underline mt-1 tracking-wide hover:opacity-85 active:opacity-75 transition-all text-left w-max shrink-0 cursor-pointer"
                >
                  Check Balance
                </button>
              )}
            </div>
          </div>
        </div>
 
        {/* ── Middle Column: Vertical Divider ── */}
        <div className="finance-row-2-divider" />
 
        {/* ── Right Column: Company Banks ── */}
        <div className="finance-company-banks-section">
          <div className="flex justify-between items-center">
            <h2 className="finance-section-title">Company Banks</h2>
            <a href="#" className="text-[#007AFF] text-[13px] font-semibold hover:underline">View All</a>
          </div>
          
          <div className="finance-banks-container">
            {displayBanks.map((bank) => {
              const isScb = bank.id.toLowerCase().includes('scb') || 
                            bank.name.toLowerCase().includes('scb') || 
                            bank.name.toLowerCase().includes('standard chartered');
              const textColor = isScb ? 'text-black' : bank.textColor;
              const displayName = bank.name.replace("Standard Chartered", "SCB");
              const bgImage = bank.bg === '/Bank logo/CIMB.svg' ? '/CIMB.svg' : (bank.bg || bank.logo);
 
              return (
                <div key={bank.id} className="finance-bank-card-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bgImage} alt={displayName} className="finance-bank-card-bg" />
                  <div className="finance-bank-card-content" style={{ paddingLeft: isScb ? '90px' : '110px' }}>
                    <span className={`finance-bank-card-name ${textColor}`}>{displayName}</span>
                    
                    {revealedBalances.includes(bank.id) ? (
                      <span className={`text-[12px] font-bold mt-0.5 animate-in fade-in duration-250 ${textColor === 'text-white' ? 'text-gray-200' : 'text-gray-700'}`}>
                        S$ {Number(bank.balance || 0).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCheckBalanceClick(bank.id)}
                        className={`text-[11px] font-black underline mt-1 tracking-wide hover:opacity-85 active:opacity-75 transition-all text-left w-max shrink-0 cursor-pointer ${
                          textColor === 'text-white' ? 'text-white/95' : 'text-[#007AFF]'
                        }`}
                      >
                        Check Balance
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* ── Add Bank Account ── */}
            <button className="finance-add-bank-card" onClick={onAddBank}>
              <span className="finance-add-bank-text">Add Bank Account</span>
            </button>
          </div>
        </div>
 
      </div>

      {/* ── Security PIN Dialog Modal ── */}
      {isPinOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsPinOpen(false)}
          />
          {/* Modal Card */}
          <div className="relative bg-white dark:bg-[#1C1C1E] border border-gray-150 dark:border-[#2C2C35] rounded-[24px] p-8 w-full max-w-[320px] shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button 
              onClick={() => setIsPinOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>

            {/* Lock Icon */}
            <div className="w-12 h-12 rounded-full bg-[#E5F1FF] dark:bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center mb-5 shrink-0">
              <Lock size={20} />
            </div>

            <h3 className="text-[17px] font-black text-gray-900 dark:text-white mb-1">Enter Security PIN</h3>
            <p className="text-[11.5px] font-semibold text-gray-450 dark:text-gray-500 leading-normal max-w-[220px] mb-5">
              Enter your 4-digit transaction PIN to view the account balance.
            </p>

            {/* Dots */}
            <div className="relative w-full flex justify-center mb-4">
              <div className="flex gap-4.5 justify-center">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                      pinValue.length > index
                        ? "border-[#007AFF] bg-[#007AFF] scale-110"
                        : "border-gray-300 dark:border-gray-700 bg-transparent"
                    }`}
                  />
                ))}
              </div>
              <input
                type="tel"
                pattern="[0-9]*"
                maxLength={4}
                value={pinValue}
                onChange={handlePinChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-center"
                autoFocus
              />
            </div>

            {pinError && (
              <div className="text-[11px] font-bold text-red-500 text-center animate-bounce mb-2">
                {pinError}
              </div>
            )}

            <button 
              onClick={() => setIsPinOpen(false)}
              className="mt-2 w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-[12.5px] font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

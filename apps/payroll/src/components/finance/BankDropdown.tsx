"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export const AVAILABLE_BANKS = [
  { id: 'citi', logo: '/Bank logo/Citilogo.svg', name: 'Citi', account: 'Citi-7171' },
  { id: 'dbs', logo: '/Bank logo/DBSlogo.svg', name: 'DBS', account: 'DBS-7171' },
  { id: 'ocbc', logo: '/Bank logo/Logo-ocbc.svg', name: 'OCBC', account: 'OCBC-7171' },
  { id: 'scb', logo: '/Bank logo/SCBLogo.svg', name: 'SCB', account: 'SCB-7171' },
  { id: 'uob', logo: '/Bank logo/UOB_Logo_(2022) (1).svg', name: 'UOB', account: 'UOB-7171' },
  { id: 'cimb', logo: '/Bank logo/CIMBLogo.svg', name: 'CIMB', account: 'CIMB-7171' },
];

interface BankDropdownProps {
  selectedBank: any;
  onSelect: (bank: any) => void;
  variant?: 'outline' | 'filled';
  banks?: any[];
}

const formatAccount = (accountStr: string) => {
  if (!accountStr) return "";
  const clean = accountStr.replace("Standard Chartered", "SCB");
  const parts = clean.split("-");
  if (parts.length > 1) {
    const bankName = parts[0].trim();
    const accNum = parts[1].trim();
    const suffix = accNum.slice(-4);
    return `${bankName}-${suffix}`;
  }
  return clean;
};

const resolveLogo = (logoPath: string) => {
  if (logoPath === '/Bank logo/CIMB.svg') {
    return '/Bank logo/CIMBLogo.svg';
  }
  return logoPath;
};

export default function BankDropdown({ selectedBank, onSelect, variant = 'outline', banks }: BankDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const displayBanks = banks || [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerClass = variant === 'outline' 
    ? "flex items-center justify-between px-5 py-3 bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2A2A31] rounded-[18px] cursor-pointer"
    : "flex items-center justify-between p-4 bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[16px] cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-[#2C2C35] transition-colors";

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger */}
      <div 
        className={triggerClass}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedBank ? (
          <div className="flex items-center gap-4">
            <div className="w-[60px] flex items-center justify-start shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveLogo(selectedBank.logo)} alt={selectedBank.name} className="max-h-[24px] max-w-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-gray-500">
                {selectedBank.id === 'cash-drawer' ? 'Payment Method' : 'Account Number'}
              </span>
              <span className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight">{formatAccount(selectedBank.account)}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 py-1">
            <span className="text-[14px] font-bold text-gray-400 dark:text-gray-500">No Bank Account Added</span>
          </div>
        )}
        {isOpen ? (
          <ChevronUp className="text-gray-400" size={18} />
        ) : (
          <ChevronDown className="text-gray-400" size={18} />
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C35] rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] z-50 overflow-hidden">
          {/* ── Hand Cash Option ── */}
          <div 
            className="flex items-center gap-4 p-4 hover:bg-[#F8F9FA] dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-gray-100 dark:border-[#2C2C35]/50"
            onClick={() => {
              onSelect({
                id: 'cash-drawer',
                logo: '/Cash_Bank_Drawer.svg',
                name: 'Hand Cash',
                account: 'Hand Cash',
                balance: 0.00
              });
              setIsOpen(false);
            }}
          >
            <div className="w-[60px] flex items-center justify-start shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Cash_Bank_Drawer.svg" alt="Hand Cash" className="max-h-[24px] max-w-full object-contain" />
            </div>
            <span className="text-[14px] font-bold text-gray-900 dark:text-white">Hand Cash</span>
          </div>

          {/* ── Bank Accounts Options ── */}
          {displayBanks.map((bank) => (
            <div 
              key={bank.id}
              className="flex items-center gap-4 p-4 hover:bg-[#F8F9FA] dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-gray-55 dark:border-[#2C2C35]/50 last:border-0"
              onClick={() => {
                onSelect(bank);
                setIsOpen(false);
              }}
            >
              <div className="w-[60px] flex items-center justify-start shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveLogo(bank.logo)} alt={bank.name} className="max-h-[24px] max-w-full object-contain" />
              </div>
              <span className="text-[14px] font-bold text-gray-900 dark:text-white">{formatAccount(bank.account)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

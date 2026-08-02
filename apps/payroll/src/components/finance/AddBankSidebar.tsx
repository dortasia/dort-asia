"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";

interface AddBankSidebarProps {
  onClose: () => void;
  onAdd: (bankId: string, holderName: string, accountNumber: string, balance: number) => Promise<boolean>;
}

const BANKS = [
  { id: 'dbs', name: 'DBS', digits: [10] },
  { id: 'citi', name: 'Citi', digits: [12] },
  { id: 'ocbc', name: 'OCBC', digits: [7, 8, 9] },
  { id: 'scb', name: 'SCB', digits: [10] },
  { id: 'uob', name: 'UOB', digits: [10] },
  { id: 'cimb', name: 'CIMB', digits: [10] },
];

const formatWithCommas = (value: string) => {
  const clean = value.replace(/[^0-9.]/g, "");
  const parts = clean.split(".");
  let integerPart = parts[0];
  const decimalPart = parts[1];
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (parts.length > 1) {
    return `${integerPart}.${decimalPart.substring(0, 2)}`;
  }
  return integerPart;
};

export default function AddBankSidebar({ onClose, onAdd }: AddBankSidebarProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");
  const [holderName, setHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const maxDigits = selectedBank ? Math.max(...(BANKS.find(b => b.id === selectedBank)?.digits || [20])) : undefined;

  useEffect(() => {
    if (selectedBank && maxDigits && accountNumber.length > maxDigits) {
      setAccountNumber(accountNumber.slice(0, maxDigits));
    }
  }, [selectedBank, maxDigits]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedBank) newErrors.bank = "Bank Name is required";
    
    if (!holderName) {
      newErrors.holder = "Account Holder Name is required";
    } else if (!/^[A-Za-z\s]+$/.test(holderName)) {
      newErrors.holder = "Only alphabets and spaces allowed";
    } else if (holderName.length < 2 || holderName.length > 100) {
      newErrors.holder = "Must be between 2 and 100 characters";
    }

    if (!accountNumber) {
      newErrors.account = "Account Number is required";
    } else if (!/^\d+$/.test(accountNumber)) {
      newErrors.account = "Only numbers allowed";
    } else {
      const bank = BANKS.find(b => b.id === selectedBank);
      if (bank && !bank.digits.includes(accountNumber.length)) {
        if (bank.id === 'ocbc') {
          newErrors.account = "OCBC account numbers are 7-9 digits";
        } else {
          newErrors.account = `${bank.name} account numbers must be ${bank.digits[0]} digits`;
        }
      }
    }

    if (!currentBalance) {
      newErrors.balance = "Current Balance is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      setIsSaving(true);
      const numericBalance = parseFloat(currentBalance.replace(/,/g, "")) || 0;
      const success = await onAdd(selectedBank, holderName, accountNumber, numericBalance);
      setIsSaving(false);
      if (success) {
        alert("Bank account added successfully!");
        handleClose();
      }
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'} bg-black/20`}
        onClick={handleClose}
      />

      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-[420px] bg-white dark:bg-[#121217] shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l border-gray-100 dark:border-[#2C2C35] flex flex-col transition-transform duration-300 ease-out transform ${isClosing ? 'translate-x-full' : 'translate-x-0'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Add Bank Account</h2>
          <button 
            onClick={handleClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
          
          {/* Bank Name */}
          <div>
            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-3">Bank Name</h3>
            <div className="relative">
              <select 
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className={`w-full appearance-none bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium ${selectedBank ? 'text-gray-900 dark:text-white' : 'text-gray-400'} focus:outline-none focus:ring-1 focus:ring-[#007AFF] border ${errors.bank ? 'border-red-500' : 'border-transparent'}`}
              >
                <option value="" disabled>Select Bank</option>
                {BANKS.map(bank => (
                  <option key={bank.id} value={bank.id}>{bank.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
            {errors.bank && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.bank}</p>}
          </div>

          {/* Account Holder Name */}
          <div>
            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-3">Account Holder Name</h3>
            <input 
              type="text" 
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="Enter legal name" 
              className={`w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] border ${errors.holder ? 'border-red-500' : 'border-transparent'}`}
            />
            {errors.holder && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.holder}</p>}
          </div>

          {/* Account Number */}
          <div>
            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-3">Account Number</h3>
            <input 
              type="text" 
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              maxLength={maxDigits}
              placeholder="Enter account number" 
              className={`w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] border ${errors.account ? 'border-red-500' : 'border-transparent'}`}
            />
            {errors.account && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.account}</p>}
          </div>

          {/* Current Balance */}
          <div>
            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-3">Current Balance</h3>
            <div className="relative">
              <input 
                type="text" 
                value={currentBalance}
                onChange={(e) => setCurrentBalance(formatWithCommas(e.target.value))}
                placeholder="0.00" 
                className={`w-full bg-[#F8F9FA] dark:bg-[#1C1C1E] rounded-[14px] pl-10 pr-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] border ${errors.balance ? 'border-red-500' : 'border-transparent'}`}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-gray-400">S$</span>
            </div>
            {errors.balance && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.balance}</p>}
          </div>



        </div>

        {/* Footer */}
        <div className="p-6 pt-2 pb-8 mt-auto">
          <button 
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full py-4 bg-[#007AFF] hover:bg-[#0062CC] transition-colors rounded-[16px] text-white text-[15px] font-bold disabled:opacity-50"
          >
            {isSaving ? "Adding..." : "Add Bank Account"}
          </button>
        </div>

      </div>
    </>
  );
}
